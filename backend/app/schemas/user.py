from __future__ import annotations

from datetime import datetime
from enum import Enum

from pydantic import BaseModel, ConfigDict, Field, model_validator

from app.models.user import UserRole
from app.schemas.department import DepartmentSimple


class ManageableUserRole(str, Enum):
    MANAGER = "manager"
    STAFF = "staff"


class UserBase(BaseModel):
    model_config = ConfigDict(extra="forbid")

    username: str = Field(min_length=3, max_length=50)
    email: str = Field(min_length=5, max_length=255)
    full_name: str = Field(min_length=2, max_length=255)
    phone_number: str | None = Field(default=None, max_length=20)
    role: ManageableUserRole = ManageableUserRole.STAFF
    department_id: int | None = None
    is_active: bool = True


class UserCreate(UserBase):
    password: str = Field(min_length=6, max_length=128)
    confirm_password: str = Field(min_length=6, max_length=128)

    @model_validator(mode="after")
    def validate_passwords_match(self) -> "UserCreate":
        if self.password != self.confirm_password:
            raise ValueError("Password and confirm_password do not match")
        return self


class UserUpdate(BaseModel):
    model_config = ConfigDict(extra="forbid")

    username: str | None = Field(default=None, min_length=3, max_length=50)
    email: str | None = Field(default=None, min_length=5, max_length=255)
    full_name: str | None = Field(default=None, min_length=2, max_length=255)
    phone_number: str | None = Field(default=None, max_length=20)
    role: ManageableUserRole | None = None
    department_id: int | None = None
    is_active: bool | None = None


class UserResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    username: str
    email: str
    full_name: str
    phone_number: str | None = None
    role: UserRole
    is_active: bool
    department_id: int | None = None
    department: DepartmentSimple | None = None
    created_at: datetime
    updated_at: datetime


class UserSimple(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    username: str
    full_name: str
    role: UserRole
    is_active: bool