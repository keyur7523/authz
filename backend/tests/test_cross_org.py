"""Every org-scoped route must refuse a user of another org (403/404)."""
from httpx import AsyncClient

from tests.test_security import create_org, join, register

# (method, path, body); ids are filled from org A's fixtures
ROUTES = [
    ("GET", "/api/orgs/{org_id}", None),
    ("PUT", "/api/orgs/{org_id}", {"name": "hacked"}),
    ("DELETE", "/api/orgs/{org_id}", None),
    ("GET", "/api/orgs/{org_id}/members", None),
    ("DELETE", "/api/orgs/{org_id}/members/{user_id}", None),
    ("POST", "/api/orgs/{org_id}/invite", {"email": "x@x.com", "role": "member"}),
    ("GET", "/api/orgs/{org_id}/invites", None),
    ("DELETE", "/api/orgs/{org_id}/invites/{invite_id}", None),
    ("POST", "/api/orgs/{org_id}/roles", {"name": "evil"}),
    ("GET", "/api/orgs/{org_id}/roles", None),
    ("GET", "/api/orgs/{org_id}/roles/{role_id}", None),
    ("PUT", "/api/orgs/{org_id}/roles/{role_id}", {"name": "evil"}),
    ("DELETE", "/api/orgs/{org_id}/roles/{role_id}", None),
    ("POST", "/api/orgs/{org_id}/roles/{role_id}/permissions", {"permission_ids": ["{permission_id}"]}),
    ("DELETE", "/api/orgs/{org_id}/roles/{role_id}/permissions/{permission_id}", None),
    ("POST", "/api/orgs/{org_id}/permissions", {"name": "evil:perm"}),
    ("GET", "/api/orgs/{org_id}/permissions", None),
    ("PUT", "/api/orgs/{org_id}/permissions/{permission_id}", {"description": "evil"}),
    ("DELETE", "/api/orgs/{org_id}/permissions/{permission_id}", None),
    ("POST", "/api/orgs/{org_id}/users/{user_id}/roles", {"role_id": "{role_id}"}),
    ("GET", "/api/orgs/{org_id}/users/{user_id}/roles", None),
    ("DELETE", "/api/orgs/{org_id}/users/{user_id}/roles/{role_id}", None),
    ("GET", "/api/orgs/{org_id}/users/{user_id}/permissions", None),
    ("POST", "/api/orgs/{org_id}/policies", {"name": "evil", "effect": "allow"}),
    ("GET", "/api/orgs/{org_id}/policies", None),
    ("GET", "/api/orgs/{org_id}/policies/{policy_id}", None),
    ("PUT", "/api/orgs/{org_id}/policies/{policy_id}", {"name": "evil"}),
    ("DELETE", "/api/orgs/{org_id}/policies/{policy_id}", None),
    ("POST", "/api/orgs/{org_id}/policies/test", {"principal_id": "{user_id}", "action": "a", "resource": "r"}),
    ("POST", "/api/orgs/{org_id}/policies/validate", {"effect": "allow"}),
    ("POST", "/api/authorize/bulk?org_id={org_id}", [{"principal_id": "{user_id}", "action": "a", "resource": "r"}]),
    ("POST", "/api/orgs/{org_id}/requests", {"requested_role_id": "{role_id}", "justification": "need it for work"}),
    ("GET", "/api/orgs/{org_id}/requests", None),
    ("GET", "/api/orgs/{org_id}/requests/pending", None),
    ("GET", "/api/orgs/{org_id}/requests/all", None),
    ("GET", "/api/orgs/{org_id}/requests/{request_id}", None),
    ("POST", "/api/orgs/{org_id}/requests/{request_id}/approve", {}),
    ("POST", "/api/orgs/{org_id}/requests/{request_id}/deny", {}),
    ("POST", "/api/orgs/{org_id}/requests/{request_id}/cancel", None),
    ("POST", "/api/orgs/{org_id}/requests/{request_id}/request-info", {"comment": "why?"}),
    ("POST", "/api/orgs/{org_id}/requests/{request_id}/provide-info", {"comment": "because"}),
    ("GET", "/api/orgs/{org_id}/audit", None),
    ("GET", "/api/orgs/{org_id}/audit/export", None),
    ("GET", "/api/orgs/{org_id}/dashboard", None),
]


def fill(value, ids: dict):
    if isinstance(value, str):
        return value.format(**ids)
    if isinstance(value, list):
        return [fill(v, ids) for v in value]
    if isinstance(value, dict):
        return {k: fill(v, ids) for k, v in value.items()}
    return value


async def test_routes_table_covers_every_org_scoped_route():
    from src.main import app

    expected = set()
    for path, ops in app.openapi()["paths"].items():
        for method, op in ops.items():
            query = [p["name"] for p in op.get("parameters", []) if p["in"] == "query"]
            if "{org_id}" in path or "org_id" in query:
                expected.add((method.upper(), path))
    covered = {(m, p.split("?")[0]) for m, p, _ in ROUTES}
    assert expected == covered


async def test_other_org_user_is_refused_everywhere(client: AsyncClient, test_db):
    owner_a, owner_a_id = await register(client, "owner@a.com")
    org_a = await create_org(client, owner_a, "org-a")
    member_a, _ = await join(client, test_db, org_a, "member@a.com", "member")

    async def post(path, body, headers=owner_a):
        res = await client.post(f"/api/orgs/{org_a}{path}", json=body, headers=headers)
        assert res.status_code == 200, res.text
        return res.json()["id"]

    ids = {
        "org_id": org_a,
        "user_id": owner_a_id,
        "role_id": await post("/roles", {"name": "viewer"}),
        "permission_id": await post("/permissions", {"name": "docs:read"}),
        "policy_id": await post("/policies", {"name": "p", "effect": "allow"}),
        "invite_id": await post("/invite", {"email": "new@a.com", "role": "member"}),
    }
    ids["request_id"] = await post(
        "/requests", {"requested_role_id": ids["role_id"], "justification": "need it for work"}, member_a
    )

    # Owner of their own org B, so admin checks pass on B but must not leak into A
    owner_b, _ = await register(client, "owner@b.com")
    org_b = await create_org(client, owner_b, "org-b")

    for method, path, body in ROUTES:
        # Attack 1: org A in the URL. Attack 2: own org B in the URL with org A's resource ids.
        attempts = [ids]
        if any(k in path for k in ("{role_id}", "{permission_id}", "{policy_id}", "{invite_id}", "{request_id}")):
            attempts.append({**ids, "org_id": org_b})
        for attempt in attempts:
            url = fill(path, attempt)
            res = await client.request(method, url, json=fill(body, attempt), headers=owner_b)
            assert res.status_code in (403, 404), f"{method} {url} -> {res.status_code} {res.text}"
