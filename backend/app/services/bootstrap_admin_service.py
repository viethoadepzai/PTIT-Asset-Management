from __future__ import annotations

import secrets
import string

from sqlalchemy import or_, select
from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.security import get_password_hash
from app.models.user import User, UserRole


def _generate_secure_password(length: int = 16) -> str:
    alphabet = string.ascii_letters + string.digits + "!@#$%^&*"
    return "".join(secrets.choice(alphabet) for _ in range(length))


def bootstrap_admin(db: Session) -> None:
    existing_admin = db.scalar(select(User).where(User.role == UserRole.ADMIN))
    if existing_admin is not None:
        return

    if not settings.BOOTSTRAP_ADMIN_ENABLED:
        return

    conflict_user = db.scalar(
        select(User).where(
            or_(
                User.username == settings.BOOTSTRAP_ADMIN_USERNAME,
                User.email == settings.BOOTSTRAP_ADMIN_EMAIL,
            )
        )
    )
    if conflict_user is not None:
        raise RuntimeError(
            "Cannot bootstrap admin because bootstrap username/email already exists."
        )

    generated_password = False
    raw_password = settings.BOOTSTRAP_ADMIN_PASSWORD
    if not raw_password:
        raw_password = _generate_secure_password()
        generated_password = True

    admin = User(
        username=settings.BOOTSTRAP_ADMIN_USERNAME,
        email=settings.BOOTSTRAP_ADMIN_EMAIL,
        full_name=settings.BOOTSTRAP_ADMIN_FULL_NAME,
        hashed_password=get_password_hash(raw_password),
        role=UserRole.ADMIN,
        is_active=True,
        must_change_password=True,
    )

    db.add(admin)
    db.commit()

    print("=" * 60)
    print("BOOTSTRAP ADMIN ACCOUNT CREATED")
    print(f"username: {settings.BOOTSTRAP_ADMIN_USERNAME}")
    print(f"email: {settings.BOOTSTRAP_ADMIN_EMAIL}")
    if generated_password:
        print(f"temporary password: {raw_password}")
    else:
        print("temporary password: [loaded from BOOTSTRAP_ADMIN_PASSWORD]")
    print("Please log in and change password immediately.")
    print("=" * 60)