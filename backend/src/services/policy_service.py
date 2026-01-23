import fnmatch
import re
from uuid import UUID
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from src.db.models.policy import Policy
from src.db.models.role import UserRole, Role
from src.core.exceptions import NotFound, Conflict


class PolicyService:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def create_policy(self, org_id: UUID, payload) -> Policy:
        policy = Policy(
            org_id=org_id,
            name=payload.name,
            description=payload.description,
            effect=payload.effect,
            principals=payload.principals.model_dump() if payload.principals else {},
            actions=payload.actions,
            resources=payload.resources,
            conditions=payload.conditions,
            priority=payload.priority,
        )
        self.db.add(policy)
        await self.db.commit()
        await self.db.refresh(policy)
        return policy

    async def list_policies(
        self, org_id: UUID, active_only: bool = False
    ) -> list[Policy]:
        query = select(Policy).where(Policy.org_id == org_id)
        if active_only:
            query = query.where(Policy.is_active == True)
        query = query.order_by(Policy.priority.desc(), Policy.created_at)
        res = await self.db.execute(query)
        return list(res.scalars().all())

    async def get_policy(self, policy_id: UUID) -> Policy | None:
        res = await self.db.execute(select(Policy).where(Policy.id == policy_id))
        return res.scalar_one_or_none()

    async def update_policy(self, policy_id: UUID, payload) -> Policy:
        policy = await self.get_policy(policy_id)
        if not policy:
            raise NotFound("Policy not found")

        if payload.name is not None:
            policy.name = payload.name
        if payload.description is not None:
            policy.description = payload.description
        if payload.effect is not None:
            policy.effect = payload.effect
        if payload.principals is not None:
            policy.principals = payload.principals.model_dump()
        if payload.actions is not None:
            policy.actions = payload.actions
        if payload.resources is not None:
            policy.resources = payload.resources
        if payload.conditions is not None:
            policy.conditions = payload.conditions
        if payload.priority is not None:
            policy.priority = payload.priority
        if payload.is_active is not None:
            policy.is_active = payload.is_active

        await self.db.commit()
        await self.db.refresh(policy)
        return policy

    async def delete_policy(self, policy_id: UUID):
        policy = await self.get_policy(policy_id)
        if not policy:
            raise NotFound("Policy not found")

        await self.db.delete(policy)
        await self.db.commit()

    async def toggle_policy(self, policy_id: UUID, is_active: bool) -> Policy:
        policy = await self.get_policy(policy_id)
        if not policy:
            raise NotFound("Policy not found")

        policy.is_active = is_active
        await self.db.commit()
        await self.db.refresh(policy)
        return policy

    async def evaluate(
        self,
        org_id: UUID,
        principal_id: UUID,
        action: str,
        resource: str,
        context: dict | None = None,
    ) -> dict:
        """
        Evaluate policies and return authorization decision.
        Returns: {"allowed": bool, "matched_policy_id": str|None, "effect": str|None, "reason": str}
        """
        context = context or {}

        # Get user's roles
        user_roles = await self._get_user_roles(org_id, principal_id)
        role_names = [r.name for r in user_roles]

        # Get active policies ordered by priority
        policies = await self.list_policies(org_id, active_only=True)

        # Default deny
        result = {
            "allowed": False,
            "matched_policy_id": None,
            "effect": None,
            "reason": "No matching policy found (implicit deny)",
        }

        # Evaluate policies (deny takes precedence over allow at same priority)
        deny_matched = None
        allow_matched = None

        for policy in policies:
            if not self._match_principal(policy, role_names, str(principal_id)):
                continue
            if not self._match_action(policy.actions, action):
                continue
            if not self._match_resource(policy.resources, resource):
                continue
            if policy.conditions and not self._evaluate_conditions(
                policy.conditions, context
            ):
                continue

            # Policy matched
            if policy.effect == "deny":
                if deny_matched is None or policy.priority > deny_matched.priority:
                    deny_matched = policy
            else:
                if allow_matched is None or policy.priority > allow_matched.priority:
                    allow_matched = policy

        # Deny takes precedence
        if deny_matched:
            return {
                "allowed": False,
                "matched_policy_id": str(deny_matched.id),
                "effect": "deny",
                "reason": f"Denied by policy: {deny_matched.name}",
            }

        if allow_matched:
            return {
                "allowed": True,
                "matched_policy_id": str(allow_matched.id),
                "effect": "allow",
                "reason": f"Allowed by policy: {allow_matched.name}",
            }

        return result

    async def evaluate_bulk(
        self, org_id: UUID, requests: list[dict]
    ) -> list[dict]:
        """Evaluate multiple authorization requests."""
        results = []
        for req in requests:
            result = await self.evaluate(
                org_id=org_id,
                principal_id=UUID(req["principal_id"]),
                action=req["action"],
                resource=req["resource"],
                context=req.get("context", {}),
            )
            results.append(result)
        return results

    async def _get_user_roles(self, org_id: UUID, user_id: UUID) -> list[Role]:
        """Get all roles assigned to a user in an organization."""
        res = await self.db.execute(
            select(Role)
            .join(UserRole)
            .where(UserRole.org_id == org_id, UserRole.user_id == user_id)
        )
        return list(res.scalars().all())

    def _match_principal(
        self, policy: Policy, user_roles: list[str], user_id: str
    ) -> bool:
        """Check if the principal matches the policy."""
        principals = policy.principals or {}

        # Check if no principals specified (matches all)
        if not principals.get("roles") and not principals.get("users"):
            return True

        # Check user match
        policy_users = principals.get("users", [])
        if "*" in policy_users or user_id in policy_users:
            return True

        # Check role match
        policy_roles = principals.get("roles", [])
        if "*" in policy_roles:
            return True
        for role in user_roles:
            if role in policy_roles:
                return True

        return False

    def _match_action(self, policy_actions: list[str], action: str) -> bool:
        """Check if the action matches using wildcards."""
        if not policy_actions:
            return True

        for pattern in policy_actions:
            if pattern == "*":
                return True
            if fnmatch.fnmatch(action, pattern):
                return True

        return False

    def _match_resource(self, policy_resources: list[str], resource: str) -> bool:
        """Check if the resource matches using wildcards."""
        if not policy_resources:
            return True

        for pattern in policy_resources:
            if pattern == "*":
                return True
            if fnmatch.fnmatch(resource, pattern):
                return True

        return False

    def validate_policy(self, policy_data: dict) -> dict:
        """
        Validate a policy definition.
        Returns: {"valid": bool, "errors": list[str], "warnings": list[str]}
        """
        errors = []
        warnings = []

        # Check effect
        effect = policy_data.get("effect")
        if effect not in ["allow", "deny"]:
            errors.append(f"Invalid effect: '{effect}'. Must be 'allow' or 'deny'.")

        # Check principals
        principals = policy_data.get("principals", {})
        if not principals.get("roles") and not principals.get("users"):
            warnings.append("No principals specified. Policy will match all users.")

        if principals.get("roles"):
            if not isinstance(principals["roles"], list):
                errors.append("principals.roles must be a list")
            elif not all(isinstance(r, str) for r in principals["roles"]):
                errors.append("All role values must be strings")

        if principals.get("users"):
            if not isinstance(principals["users"], list):
                errors.append("principals.users must be a list")
            elif not all(isinstance(u, str) for u in principals["users"]):
                errors.append("All user values must be strings")

        # Check actions
        actions = policy_data.get("actions", [])
        if not actions:
            warnings.append("No actions specified. Policy will match all actions.")
        elif not isinstance(actions, list):
            errors.append("actions must be a list")
        elif not all(isinstance(a, str) for a in actions):
            errors.append("All action values must be strings")

        # Check resources
        resources = policy_data.get("resources", [])
        if not resources:
            warnings.append("No resources specified. Policy will match all resources.")
        elif not isinstance(resources, list):
            errors.append("resources must be a list")
        elif not all(isinstance(r, str) for r in resources):
            errors.append("All resource values must be strings")

        # Check conditions
        conditions = policy_data.get("conditions")
        if conditions is not None:
            if not isinstance(conditions, dict):
                errors.append("conditions must be an object")
            else:
                valid_ops = {"eq", "neq", "in", "not_in", "gt", "gte", "lt", "lte"}
                for key, condition in conditions.items():
                    if isinstance(condition, dict):
                        for op in condition.keys():
                            if op not in valid_ops:
                                errors.append(f"Unknown condition operator: '{op}'")

        # Check priority
        priority = policy_data.get("priority", 0)
        if not isinstance(priority, int):
            errors.append("priority must be an integer")

        return {
            "valid": len(errors) == 0,
            "errors": errors,
            "warnings": warnings,
        }

    def _evaluate_conditions(self, conditions: dict, context: dict) -> bool:
        """
        Evaluate conditions against context.
        Supports basic operators: eq, neq, in, not_in, gt, gte, lt, lte
        """
        if not conditions:
            return True

        for key, condition in conditions.items():
            context_value = context.get(key)

            if isinstance(condition, dict):
                for op, expected in condition.items():
                    if op == "eq" and context_value != expected:
                        return False
                    elif op == "neq" and context_value == expected:
                        return False
                    elif op == "in" and context_value not in expected:
                        return False
                    elif op == "not_in" and context_value in expected:
                        return False
                    elif op == "gt" and (
                        context_value is None or context_value <= expected
                    ):
                        return False
                    elif op == "gte" and (
                        context_value is None or context_value < expected
                    ):
                        return False
                    elif op == "lt" and (
                        context_value is None or context_value >= expected
                    ):
                        return False
                    elif op == "lte" and (
                        context_value is None or context_value > expected
                    ):
                        return False
            else:
                # Simple equality check
                if context_value != condition:
                    return False

        return True
