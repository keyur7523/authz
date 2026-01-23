import pytest
from httpx import AsyncClient


@pytest.mark.asyncio
async def test_submit_access_request(client: AsyncClient, org_with_auth: dict):
    """Test submitting an access request."""
    # Create a role first
    role_response = await client.post(
        f"/api/orgs/{org_with_auth['org_id']}/roles",
        json={"name": "requested-role", "description": "Role to request"},
        headers=org_with_auth["headers"],
    )
    role_id = role_response.json()["id"]

    # Submit request
    response = await client.post(
        f"/api/orgs/{org_with_auth['org_id']}/requests",
        json={
            "requested_role_id": role_id,
            "justification": "I need this for my work",
            "duration_hours": 24,
        },
        headers=org_with_auth["headers"],
    )
    assert response.status_code == 200
    data = response.json()

    assert data["status"] == "pending"
    assert data["justification"] == "I need this for my work"
    assert data["duration_hours"] == 24


@pytest.mark.asyncio
async def test_list_my_requests(client: AsyncClient, org_with_auth: dict):
    """Test listing user's own requests."""
    response = await client.get(
        f"/api/orgs/{org_with_auth['org_id']}/requests",
        headers=org_with_auth["headers"],
    )
    assert response.status_code == 200
    assert isinstance(response.json(), list)


@pytest.mark.asyncio
async def test_list_pending_requests(client: AsyncClient, org_with_auth: dict):
    """Test listing pending requests (admin)."""
    response = await client.get(
        f"/api/orgs/{org_with_auth['org_id']}/requests/pending",
        headers=org_with_auth["headers"],
    )
    assert response.status_code == 200
    data = response.json()

    assert "requests" in data
    assert "total" in data


@pytest.mark.asyncio
async def test_approve_request(client: AsyncClient, org_with_auth: dict):
    """Test approving an access request."""
    # Create a role
    role_response = await client.post(
        f"/api/orgs/{org_with_auth['org_id']}/roles",
        json={"name": "approve-role"},
        headers=org_with_auth["headers"],
    )
    role_id = role_response.json()["id"]

    # Submit request
    request_response = await client.post(
        f"/api/orgs/{org_with_auth['org_id']}/requests",
        json={
            "requested_role_id": role_id,
            "justification": "Need access",
        },
        headers=org_with_auth["headers"],
    )
    request_id = request_response.json()["id"]

    # Approve request
    response = await client.post(
        f"/api/orgs/{org_with_auth['org_id']}/requests/{request_id}/approve",
        json={"comment": "Approved!"},
        headers=org_with_auth["headers"],
    )
    assert response.status_code == 200
    data = response.json()

    assert data["status"] == "approved"


@pytest.mark.asyncio
async def test_deny_request(client: AsyncClient, org_with_auth: dict):
    """Test denying an access request."""
    # Create a role
    role_response = await client.post(
        f"/api/orgs/{org_with_auth['org_id']}/roles",
        json={"name": "deny-role"},
        headers=org_with_auth["headers"],
    )
    role_id = role_response.json()["id"]

    # Submit request
    request_response = await client.post(
        f"/api/orgs/{org_with_auth['org_id']}/requests",
        json={
            "requested_role_id": role_id,
            "justification": "Please grant me access to this role",
        },
        headers=org_with_auth["headers"],
    )
    request_id = request_response.json()["id"]

    # Deny request
    response = await client.post(
        f"/api/orgs/{org_with_auth['org_id']}/requests/{request_id}/deny",
        json={"comment": "Not approved"},
        headers=org_with_auth["headers"],
    )
    assert response.status_code == 200
    data = response.json()

    assert data["status"] == "denied"


@pytest.mark.asyncio
async def test_cancel_request(client: AsyncClient, org_with_auth: dict):
    """Test canceling an access request."""
    # Create a role
    role_response = await client.post(
        f"/api/orgs/{org_with_auth['org_id']}/roles",
        json={"name": "cancel-role"},
        headers=org_with_auth["headers"],
    )
    role_id = role_response.json()["id"]

    # Submit request
    request_response = await client.post(
        f"/api/orgs/{org_with_auth['org_id']}/requests",
        json={
            "requested_role_id": role_id,
            "justification": "Changed my mind",
        },
        headers=org_with_auth["headers"],
    )
    request_id = request_response.json()["id"]

    # Cancel request
    response = await client.post(
        f"/api/orgs/{org_with_auth['org_id']}/requests/{request_id}/cancel",
        headers=org_with_auth["headers"],
    )
    assert response.status_code == 200
    data = response.json()

    assert data["status"] == "cancelled"


@pytest.mark.asyncio
async def test_request_more_info(client: AsyncClient, org_with_auth: dict):
    """Test requesting more info on an access request."""
    # Create a role
    role_response = await client.post(
        f"/api/orgs/{org_with_auth['org_id']}/roles",
        json={"name": "info-role"},
        headers=org_with_auth["headers"],
    )
    role_id = role_response.json()["id"]

    # Submit request
    request_response = await client.post(
        f"/api/orgs/{org_with_auth['org_id']}/requests",
        json={
            "requested_role_id": role_id,
            "justification": "Vague justification",
        },
        headers=org_with_auth["headers"],
    )
    request_id = request_response.json()["id"]

    # Request more info
    response = await client.post(
        f"/api/orgs/{org_with_auth['org_id']}/requests/{request_id}/request-info",
        json={"comment": "Please provide more details"},
        headers=org_with_auth["headers"],
    )
    assert response.status_code == 200
    data = response.json()

    assert data["status"] == "info_requested"
