"""Regression tests for cross-org access, privilege and auth fixes."""
from datetime import timedelta
from uuid import UUID

import pytest
from httpx import AsyncClient
from sqlalchemy import select, update
from starlette.requests import Request

from src.api.rate_limit import UserRateLimitMiddleware
from src.core.security import create_access_token, utc_now
from src.db.models import OrgMemberRole, OrgMembership, User, UserRole


async def register(client: AsyncClient, email: str) -> tuple[dict, str]:
    res = await client.post(
        "/api/auth/register",
        json={"email": email, "name": email.split("@")[0], "password": "password123"},
    )
    assert res.status_code == 200, res.text
    data = res.json()
    return {"Authorization": f"Bearer {data['tokens']['access_token']}"}, data["user"]["id"]


async def create_org(client: AsyncClient, headers: dict, slug: str) -> str:
    res = await client.post("/api/orgs", json={"name": slug, "slug": slug}, headers=headers)
    assert res.status_code == 200, res.text
    return res.json()["id"]


async def join(client: AsyncClient, test_db, org_id: str, email: str, role: str) -> tuple[dict, str]:
    headers, user_id = await register(client, email)
    test_db.add(OrgMembership(user_id=UUID(user_id), org_id=UUID(org_id), role=OrgMemberRole(role)))
    await test_db.commit()
    return headers, user_id


async def test_authorize_requires_org_membership(client: AsyncClient):
    owner, owner_id = await register(client, "owner@a.com")
    org_a = await create_org(client, owner, "org-a")
    outsider, _ = await register(client, "outsider@b.com")

    body = {"org_id": org_a, "principal_id": owner_id, "action": "read", "resource": "x"}
    assert (await client.post("/api/authorize", json=body, headers=outsider)).status_code == 403
    assert (await client.post("/api/authorize", json=body, headers=owner)).status_code == 200

    bulk = [{"principal_id": owner_id, "action": "read", "resource": "x"}]
    res = await client.post(f"/api/authorize/bulk?org_id={org_a}", json=bulk, headers=outsider)
    assert res.status_code == 403


def _request(headers: dict, client_ip: str = "10.0.0.1") -> Request:
    return Request({
        "type": "http",
        "headers": [(k.lower().encode(), v.encode()) for k, v in headers.items()],
        "client": (client_ip, 1234),
    })


def test_rate_limit_identifies_each_user_and_ignores_spoofed_ip():
    limiter = UserRateLimitMiddleware(app=None)
    ids = {
        limiter._get_identifier(_request({"Authorization": f"Bearer {create_access_token(u)}"}))
        for u in ["11111111-1111-1111-1111-111111111111", "22222222-2222-2222-2222-222222222222"]
    }
    assert len(ids) == 2

    # Forged token falls back to IP, not its own bucket
    assert limiter._get_identifier(_request({"Authorization": "Bearer junk"})) == "ip:10.0.0.1"

    # Client-supplied leftmost entries are ignored; proxy-appended last entry wins
    spoofed = _request({"X-Forwarded-For": "6.6.6.6, 203.0.113.9"})
    assert limiter._get_identifier(spoofed) == "ip:203.0.113.9"


async def test_github_oauth_rejects_unverified_email(client: AsyncClient, test_db, monkeypatch):
    from src.api.routes import oauth
    from src.config import settings

    await register(client, "victim@example.com")
    monkeypatch.setattr(settings, "GITHUB_CLIENT_ID", "id")
    monkeypatch.setattr(settings, "GITHUB_CLIENT_SECRET", "secret")
    oauth.oauth_states["s1"] = {"provider": "github"}

    class FakeResponse:
        def __init__(self, data):
            self.status_code, self._data = 200, data

        def json(self):
            return self._data

    class FakeClient:
        async def __aenter__(self):
            return self

        async def __aexit__(self, *a):
            pass

        async def post(self, *a, **kw):
            return FakeResponse({"access_token": "gh"})

        async def get(self, url, **kw):
            if url == oauth.GITHUB_EMAILS_URL:
                return FakeResponse([{"email": "victim@example.com", "primary": True, "verified": False}])
            return FakeResponse({"id": 99, "login": "attacker", "email": "victim@example.com"})

    monkeypatch.setattr(oauth.httpx, "AsyncClient", FakeClient)

    res = await client.get("/api/auth/oauth/github/callback?code=c&state=s1")
    assert res.status_code == 401

    victim = (await test_db.execute(select(User).where(User.email == "victim@example.com"))).scalar_one()
    assert victim.oauth_provider is None


async def test_cannot_cancel_invite_of_another_org(client: AsyncClient):
    owner_a, _ = await register(client, "owner@a.com")
    org_a = await create_org(client, owner_a, "org-a")
    invite = await client.post(
        f"/api/orgs/{org_a}/invite", json={"email": "new@a.com", "role": "member"}, headers=owner_a
    )
    invite_id = invite.json()["id"]

    owner_b, _ = await register(client, "owner@b.com")
    org_b = await create_org(client, owner_b, "org-b")

    res = await client.delete(f"/api/orgs/{org_b}/invites/{invite_id}", headers=owner_b)
    assert res.status_code == 404

    invites = (await client.get(f"/api/orgs/{org_a}/invites", headers=owner_a)).json()
    assert invites[0]["status"] == "pending"


async def test_admin_cannot_create_or_remove_owners(client: AsyncClient, test_db):
    owner, owner_id = await register(client, "owner@a.com")
    org = await create_org(client, owner, "org-a")
    admin, _ = await join(client, test_db, org, "admin@a.com", "admin")

    res = await client.post(
        f"/api/orgs/{org}/invite", json={"email": "alt@a.com", "role": "owner"}, headers=admin
    )
    assert res.status_code == 403

    second_owner, second_owner_id = await join(client, test_db, org, "owner2@a.com", "owner")
    res = await client.delete(f"/api/orgs/{org}/members/{second_owner_id}", headers=admin)
    assert res.status_code == 403

    # Owners still can
    res = await client.delete(f"/api/orgs/{org}/members/{second_owner_id}", headers=owner)
    assert res.status_code == 204


async def test_time_limited_role_expires(client: AsyncClient, test_db):
    owner, owner_id = await register(client, "owner@a.com")
    org = await create_org(client, owner, "org-a")
    role = await client.post(f"/api/orgs/{org}/roles", json={"name": "oncall"}, headers=owner)
    role_id = role.json()["id"]

    req = await client.post(
        f"/api/orgs/{org}/requests",
        json={"requested_role_id": role_id, "justification": "incident response", "duration_hours": 2},
        headers=owner,
    )
    res = await client.post(f"/api/orgs/{org}/requests/{req.json()['id']}/approve", headers=owner)
    assert res.status_code == 200

    roles_url = f"/api/orgs/{org}/users/{owner_id}/roles"
    assert len((await client.get(roles_url, headers=owner)).json()) == 1

    await test_db.execute(
        update(UserRole)
        .where(UserRole.user_id == UUID(owner_id))
        .values(expires_at=utc_now() - timedelta(minutes=1))
    )
    await test_db.commit()

    assert (await client.get(roles_url, headers=owner)).json() == []

    # An expired grant can be re-assigned permanently
    res = await client.post(roles_url, json={"role_id": role_id}, headers=owner)
    assert res.status_code == 200
    assert len((await client.get(roles_url, headers=owner)).json()) == 1


async def test_cannot_request_role_from_another_org(client: AsyncClient):
    owner, _ = await register(client, "owner@a.com")
    org_a = await create_org(client, owner, "org-a")
    org_b = await create_org(client, owner, "org-b")
    role_b = await client.post(f"/api/orgs/{org_b}/roles", json={"name": "b-admin"}, headers=owner)

    res = await client.post(
        f"/api/orgs/{org_a}/requests",
        json={"requested_role_id": role_b.json()["id"], "justification": "need it for work"},
        headers=owner,
    )
    assert res.status_code == 404
