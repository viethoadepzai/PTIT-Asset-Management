from app.dependencies.auth import get_current_active_user, require_roles
from app.models.user import UserRole

require_admin = require_roles(UserRole.ADMIN)
require_manager_or_admin = require_roles(UserRole.ADMIN, UserRole.MANAGER)
require_authenticated_user = get_current_active_user

__all__ = [
    "require_admin",
    "require_manager_or_admin",
    "require_authenticated_user",
    "require_roles",
]
