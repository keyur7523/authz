import pytest
from httpx import AsyncClient


@pytest.mark.asyncio
async def test_create_role(client: AsyncClient, org_with_auth: dict):
    """Test creating a role."""
    response = await client.post(
        f"/api/orgs/{org_with_auth['org_id']}/roles",
        json={
            "name": "admin",
            "description": "Administrator role",
        },
        headers=org_with_auth["headers"],
    )
    assert response.status_code == 200
    data = response.json()

    assert data["name"] == "admin"
    assert data["description"] == "Administrator role"
    assert data["is_system"] is False


@pytest.mark.asyncio
async def test_list_roles(client: AsyncClient, org_with_auth: dict):
    """Test listing roles."""
    # Create a role first
    await client.post(
        f"/api/orgs/{org_with_auth['org_id']}/roles",
        json={"name": "editor", "description": "Editor role"},
        headers=org_with_auth["headers"],
    )

    # List roles
    response = await client.get(
        f"/api/orgs/{org_with_auth['org_id']}/roles",
        headers=org_with_auth["headers"],
    )
    assert response.status_code == 200
    data = response.json()

    assert len(data) >= 1
    assert any(role["name"] == "editor" for role in data)


@pytest.mark.asyncio
async def test_update_role(client: AsyncClient, org_with_auth: dict):
    """Test updating a role."""
    # Create a role
    create_response = await client.post(
        f"/api/orgs/{org_with_auth['org_id']}/roles",
        json={"name": "viewer", "description": "Viewer role"},
        headers=org_with_auth["headers"],
    )
    role_id = create_response.json()["id"]

    # Update the role
    response = await client.put(
        f"/api/orgs/{org_with_auth['org_id']}/roles/{role_id}",
        json={"description": "Updated viewer role"},
        headers=org_with_auth["headers"],
    )
    assert response.status_code == 200
    data = response.json()

    assert data["description"] == "Updated viewer role"


@pytest.mark.asyncio
async def test_delete_role(client: AsyncClient, org_with_auth: dict):
    """Test deleting a role."""
    # Create a role
    create_response = await client.post(
        f"/api/orgs/{org_with_auth['org_id']}/roles",
        json={"name": "temp-role", "description": "Temporary role"},
        headers=org_with_auth["headers"],
    )
    role_id = create_response.json()["id"]

    # Delete the role
    response = await client.delete(
        f"/api/orgs/{org_with_auth['org_id']}/roles/{role_id}",
        headers=org_with_auth["headers"],
    )
    assert response.status_code == 204

    # Verify it's deleted
    get_response = await client.get(
        f"/api/orgs/{org_with_auth['org_id']}/roles/{role_id}",
        headers=org_with_auth["headers"],
    )
    assert get_response.status_code == 404


@pytest.mark.asyncio
async def test_create_duplicate_role(client: AsyncClient, org_with_auth: dict):
    """Test creating duplicate role fails."""
    # Create first role
    await client.post(
        f"/api/orgs/{org_with_auth['org_id']}/roles",
        json={"name": "unique-role"},
        headers=org_with_auth["headers"],
    )

    # Try to create duplicate
    response = await client.post(
        f"/api/orgs/{org_with_auth['org_id']}/roles",
        json={"name": "unique-role"},
        headers=org_with_auth["headers"],
    )
    assert response.status_code == 409
