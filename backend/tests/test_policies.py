import pytest
from httpx import AsyncClient


@pytest.mark.asyncio
async def test_create_policy(client: AsyncClient, org_with_auth: dict):
    """Test creating a policy."""
    response = await client.post(
        f"/api/orgs/{org_with_auth['org_id']}/policies",
        json={
            "name": "allow-read",
            "description": "Allow read access",
            "effect": "allow",
            "principals": {"roles": ["viewer"], "users": []},
            "actions": ["read:*"],
            "resources": ["document:*"],
        },
        headers=org_with_auth["headers"],
    )
    assert response.status_code == 200
    data = response.json()

    assert data["name"] == "allow-read"
    assert data["effect"] == "allow"
    assert data["is_active"] is True


@pytest.mark.asyncio
async def test_list_policies(client: AsyncClient, org_with_auth: dict):
    """Test listing policies."""
    # Create a policy
    await client.post(
        f"/api/orgs/{org_with_auth['org_id']}/policies",
        json={
            "name": "deny-delete",
            "effect": "deny",
            "actions": ["delete:*"],
            "resources": ["*"],
        },
        headers=org_with_auth["headers"],
    )

    # List policies
    response = await client.get(
        f"/api/orgs/{org_with_auth['org_id']}/policies",
        headers=org_with_auth["headers"],
    )
    assert response.status_code == 200
    data = response.json()

    assert len(data) >= 1


@pytest.mark.asyncio
async def test_policy_validate(client: AsyncClient, org_with_auth: dict):
    """Test policy validation endpoint."""
    # Valid policy
    response = await client.post(
        f"/api/orgs/{org_with_auth['org_id']}/policies/validate",
        json={
            "effect": "allow",
            "principals": {"roles": ["admin"]},
            "actions": ["*"],
            "resources": ["*"],
        },
        headers=org_with_auth["headers"],
    )
    assert response.status_code == 200
    data = response.json()
    assert data["valid"] is True

    # Invalid policy (bad effect)
    response = await client.post(
        f"/api/orgs/{org_with_auth['org_id']}/policies/validate",
        json={
            "effect": "invalid",
            "actions": ["*"],
            "resources": ["*"],
        },
        headers=org_with_auth["headers"],
    )
    assert response.status_code == 200
    data = response.json()
    assert data["valid"] is False
    assert len(data["errors"]) > 0


@pytest.mark.asyncio
async def test_update_policy(client: AsyncClient, org_with_auth: dict):
    """Test updating a policy."""
    # Create a policy
    create_response = await client.post(
        f"/api/orgs/{org_with_auth['org_id']}/policies",
        json={
            "name": "test-policy",
            "effect": "allow",
            "actions": ["read:*"],
            "resources": ["*"],
        },
        headers=org_with_auth["headers"],
    )
    policy_id = create_response.json()["id"]

    # Update the policy
    response = await client.put(
        f"/api/orgs/{org_with_auth['org_id']}/policies/{policy_id}",
        json={"description": "Updated description", "is_active": False},
        headers=org_with_auth["headers"],
    )
    assert response.status_code == 200
    data = response.json()

    assert data["description"] == "Updated description"
    assert data["is_active"] is False


@pytest.mark.asyncio
async def test_delete_policy(client: AsyncClient, org_with_auth: dict):
    """Test deleting a policy."""
    # Create a policy
    create_response = await client.post(
        f"/api/orgs/{org_with_auth['org_id']}/policies",
        json={
            "name": "temp-policy",
            "effect": "allow",
            "actions": ["*"],
            "resources": ["*"],
        },
        headers=org_with_auth["headers"],
    )
    policy_id = create_response.json()["id"]

    # Delete the policy
    response = await client.delete(
        f"/api/orgs/{org_with_auth['org_id']}/policies/{policy_id}",
        headers=org_with_auth["headers"],
    )
    assert response.status_code == 204
