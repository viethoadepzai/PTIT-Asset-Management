from __future__ import annotations

from pathlib import Path
from uuid import uuid4

from fastapi import APIRouter, Depends, File, HTTPException, UploadFile, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.database import get_db
from app.dependencies.auth import get_current_active_user
from app.models.user import User
from app.schemas.auth import (
    AuthenticatedUser,
    ChangePasswordRequest,
    LoginRequest,
    RegisterRequest,
    Token,
)
from app.services.auth_service import (
    authenticate_user,
    change_password,
    create_user_access_token,
    register_user,
)

router = APIRouter(prefix="/auth", tags=["Auth"])

BACKEND_ROOT = Path(__file__).resolve().parents[2]
MEDIA_DIR = BACKEND_ROOT / "media"
AVATAR_DIR = MEDIA_DIR / "avatars"

MAX_AVATAR_SIZE_BYTES = 5 * 1024 * 1024  # 5MB
ALLOWED_CONTENT_TYPES = {
    "image/jpeg": ".jpg",
    "image/png": ".png",
    "image/webp": ".webp",
}


def _ensure_avatar_dir() -> None:
    AVATAR_DIR.mkdir(parents=True, exist_ok=True)


def _remove_old_avatar_file(avatar_path: str | None) -> None:
    if not avatar_path:
      return

    normalized = avatar_path.strip()
    if not normalized.startswith("/media/"):
        return

    old_file = BACKEND_ROOT / normalized.lstrip("/")
    if old_file.exists() and old_file.is_file():
        old_file.unlink(missing_ok=True)


@router.post(
    "/register",
    response_model=AuthenticatedUser,
    status_code=status.HTTP_201_CREATED,
)
def register(
    payload: RegisterRequest,
    db: Session = Depends(get_db),
) -> User:
    if settings.DISABLE_PUBLIC_REGISTER:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Public registration is disabled",
        )

    return register_user(db=db, payload=payload)


@router.post("/login", response_model=Token)
def login(
    form_data: OAuth2PasswordRequestForm = Depends(),
    db: Session = Depends(get_db),
) -> Token:
    user = authenticate_user(
        db=db,
        username=form_data.username,
        password=form_data.password,
    )
    access_token = create_user_access_token(user)
    return Token(access_token=access_token)


@router.post("/login-json", response_model=Token)
def login_json(
    payload: LoginRequest,
    db: Session = Depends(get_db),
) -> Token:
    user = authenticate_user(
        db=db,
        username=payload.username,
        password=payload.password,
    )
    access_token = create_user_access_token(user)
    return Token(access_token=access_token)


@router.get("/me", response_model=AuthenticatedUser)
def read_current_user(
    current_user: User = Depends(get_current_active_user),
) -> User:
    return current_user


@router.post("/change-password", response_model=AuthenticatedUser)
def update_password(
    payload: ChangePasswordRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
) -> User:
    return change_password(db=db, user=current_user, payload=payload)


@router.post("/me/avatar", response_model=AuthenticatedUser)
async def upload_my_avatar(
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
) -> User:
    if not file.filename:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Avatar file is required",
        )

    if file.content_type not in ALLOWED_CONTENT_TYPES:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Only JPG, PNG, and WEBP images are allowed",
        )

    file_bytes = await file.read()
    if not file_bytes:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Uploaded file is empty",
        )

    if len(file_bytes) > MAX_AVATAR_SIZE_BYTES:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Avatar file size must be 5MB or smaller",
        )

    _ensure_avatar_dir()

    extension = ALLOWED_CONTENT_TYPES[file.content_type]
    filename = f"user_{current_user.id}_{uuid4().hex}{extension}"
    output_path = AVATAR_DIR / filename

    # Xóa avatar cũ nếu có
    _remove_old_avatar_file(current_user.avatar_path)

    output_path.write_bytes(file_bytes)

    current_user.avatar_path = f"/media/avatars/{filename}"
    db.add(current_user)
    db.commit()
    db.refresh(current_user)

    await file.close()
    return current_user