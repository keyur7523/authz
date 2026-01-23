from uuid import UUID
from sqlalchemy import select, delete
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from src.db.models.role import Role, RolePermission, UserRole
from src.db.models.permission import Permission
from src.core.exceptions import NotFound, Conflict, Forbidden


class RBACService:
    def __init__(self, db: AsyncSession):
        self.db = db

    # Role operations
    async def create_role(self, org_id: UUID, payload) -> Role:
        existing = await self.db.execute(
            select(Role).where(Role.org_id == org_id, Role.name == payload.name)
        )
        if existing.scalar_one_or_none():
            raise Conflict(f"Role '{payload.name}' already exists")

        role = Role(
            org_id=org_id,
            name=payload.name,
            description=payload.description,
        )
        self.db.add(role)
        await self.db.commit()
        await self.db.refresh(role)
        return role

    async def list_roles(self, org_id: UUID) -> list[Role]:
        res = await self.db.execute(
            select(Role)
            .where(Role.org_id == org_id)
            .options(selectinload(Role.permissions).selectinload(RolePermission.permission))
            .order_by(Role.name)
        )
        return list(res.scalars().all())

    async def get_role(self, role_id: UUID) -> Role | None:
        res = await self.db.execute(
            select(Role)
            .where(Role.id == role_id)
            .options(selectinload(Role.permissions).selectinload(RolePermission.permission))
        )
        return res.scalar_one_or_none()

    async def update_role(self, role_id: UUID, payload) -> Role:
        role = await self.get_role(role_id)
        if not role:
            raise NotFound("Role not found")

        if role.is_system:
            raise Forbidden("Cannot modify system role")

        if payload.name is not None:
            existing = await self.db.execute(
                select(Role).where(
                    Role.org_id == role.org_id,
                    Role.name == payload.name,
                    Role.id != role_id,
                )
            )
            if existing.scalar_one_or_none():
                raise Conflict(f"Role '{payload.name}' already exists")
            role.name = payload.name

        if payload.description is not None:
            role.description = payload.description

        await self.db.commit()
        await self.db.refresh(role)
        return role

    async def delete_role(self, role_id: UUID):
        role = await self.get_role(role_id)
        if not role:
            raise NotFound("Role not found")

        if role.is_system:
            raise Forbidden("Cannot delete system role")

        await self.db.delete(role)
        await self.db.commit()

    # Permission operations
    async def create_permission(self, org_id: UUID, payload) -> Permission:
        existing = await self.db.execute(
            select(Permission).where(
                Permission.org_id == org_id, Permission.name == payload.name
            )
        )
        if existing.scalar_one_or_none():
            raise Conflict(f"Permission '{payload.name}' already exists")

        permission = Permission(
            org_id=org_id,
            name=payload.name,
            description=payload.description,
        )
        self.db.add(permission)
        await self.db.commit()
        await self.db.refresh(permission)
        return permission

    async def list_permissions(self, org_id: UUID) -> list[Permission]:
        res = await self.db.execute(
            select(Permission)
            .where(Permission.org_id == org_id)
            .order_by(Permission.name)
        )
        return list(res.scalars().all())

    async def get_permission(self, permission_id: UUID) -> Permission | None:
        res = await self.db.execute(
            select(Permission).where(Permission.id == permission_id)
        )
        return res.scalar_one_or_none()

    async def update_permission(self, permission_id: UUID, payload) -> Permission:
        permission = await self.get_permission(permission_id)
        if not permission:
            raise NotFound("Permission not found")

        if payload.description is not None:
            permission.description = payload.description

        await self.db.commit()
        await self.db.refresh(permission)
        return permission

    async def delete_permission(self, permission_id: UUID):
        permission = await self.get_permission(permission_id)
        if not permission:
            raise NotFound("Permission not found")

        await self.db.delete(permission)
        await self.db.commit()

    # Role-Permission operations
    async def add_permissions_to_role(self, role_id: UUID, permission_ids: list[UUID]):
        role = await self.get_role(role_id)
        if not role:
            raise NotFound("Role not found")

        existing_perm_ids = {rp.permission_id for rp in role.permissions}

        for perm_id in permission_ids:
            if perm_id in existing_perm_ids:
                continue

            permission = await self.get_permission(perm_id)
            if not permission:
                raise NotFound(f"Permission {perm_id} not found")

            if permission.org_id != role.org_id:
                raise Forbidden("Permission belongs to a different organization")

            role_permission = RolePermission(role_id=role_id, permission_id=perm_id)
            self.db.add(role_permission)

        await self.db.commit()

    async def remove_permission_from_role(self, role_id: UUID, permission_id: UUID):
        role = await self.get_role(role_id)
        if not role:
            raise NotFound("Role not found")

        if role.is_system:
            raise Forbidden("Cannot modify system role")

        await self.db.execute(
            delete(RolePermission).where(
                RolePermission.role_id == role_id,
                RolePermission.permission_id == permission_id,
            )
        )
        await self.db.commit()

    # User-Role operations
    async def assign_role_to_user(
        self, org_id: UUID, user_id: UUID, role_id: UUID, assigned_by: UUID | None = None
    ) -> UserRole:
        role = await self.get_role(role_id)
        if not role:
            raise NotFound("Role not found")

        if role.org_id != org_id:
            raise Forbidden("Role belongs to a different organization")

        existing = await self.db.execute(
            select(UserRole).where(
                UserRole.user_id == user_id,
                UserRole.role_id == role_id,
                UserRole.org_id == org_id,
            )
        )
        if existing.scalar_one_or_none():
            raise Conflict("User already has this role")

        user_role = UserRole(
            user_id=user_id,
            role_id=role_id,
            org_id=org_id,
            assigned_by=assigned_by,
        )
        self.db.add(user_role)
        await self.db.commit()
        await self.db.refresh(user_role)
        return user_role

    async def revoke_role_from_user(self, org_id: UUID, user_id: UUID, role_id: UUID):
        res = await self.db.execute(
            select(UserRole).where(
                UserRole.user_id == user_id,
                UserRole.role_id == role_id,
                UserRole.org_id == org_id,
            )
        )
        user_role = res.scalar_one_or_none()
        if not user_role:
            raise NotFound("User does not have this role")

        await self.db.delete(user_role)
        await self.db.commit()

    async def get_user_roles(self, org_id: UUID, user_id: UUID) -> list[UserRole]:
        res = await self.db.execute(
            select(UserRole).where(
                UserRole.org_id == org_id,
                UserRole.user_id == user_id,
            )
        )
        return list(res.scalars().all())

    async def get_user_permissions(self, org_id: UUID, user_id: UUID) -> list[str]:
        user_roles = await self.get_user_roles(org_id, user_id)
        role_ids = [ur.role_id for ur in user_roles]

        if not role_ids:
            return []

        res = await self.db.execute(
            select(Permission.name)
            .join(RolePermission)
            .where(RolePermission.role_id.in_(role_ids))
            .distinct()
        )
        return list(res.scalars().all())

    async def check_permission(
        self, org_id: UUID, user_id: UUID, permission: str
    ) -> bool:
        permissions = await self.get_user_permissions(org_id, user_id)
        return permission in permissions
