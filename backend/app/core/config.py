from functools import lru_cache
from typing import List

from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Application settings loaded from environment variables or .env."""

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
        extra="ignore",
    )

    PROJECT_NAME: str = "PTIT Asset Management API"
    API_V1_STR: str = "/api/v1"
    VERSION: str = "0.1.0"
    DEBUG: bool = False

    DATABASE_URL: str = "sqlite:///./ptit_assets.db"

    SECRET_KEY: str = Field(
        default="change-this-secret-key-before-production",
        description="JWT signing key. Change this in production.",
    )
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 15

    BACKEND_CORS_ORIGINS: List[str] = [
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "http://localhost:5173",
        "http://127.0.0.1:5173",
    ]

    BOOTSTRAP_ADMIN_ENABLED: bool = True
    BOOTSTRAP_ADMIN_USERNAME: str = "admin"
    BOOTSTRAP_ADMIN_EMAIL: str = "admin@ptit.local"
    BOOTSTRAP_ADMIN_FULL_NAME: str = "System Administrator"
    BOOTSTRAP_ADMIN_PASSWORD: str = "matkhauratmanh"
    DISABLE_PUBLIC_REGISTER: bool = True


@lru_cache
def get_settings() -> Settings:
    return Settings()


settings = get_settings()