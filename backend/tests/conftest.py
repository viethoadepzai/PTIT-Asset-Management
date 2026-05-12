from __future__ import annotations

from collections.abc import Generator

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import Session, sessionmaker

from app.core.database import Base, get_db
from app.core.security import get_password_hash
from app.main import app
from app.models.allocation import Allocation
from app.models.asset import Asset, AssetCondition, AssetStatus
from app.models.department import Department
from app.models.maintenance import Maintenance
from app.models.supply import Supply
from app.models.user import User, UserRole


@pytest.fixture()
def db_session(tmp_path) -> Generator[Session, None, None]:
    db_file = tmp_path / "test.db"
    engine = create_engine(
        f"sqlite:///{db_file}",
        connect_args={"check_same_thread": False},
        future=True,
    )
    TestingSessionLocal = sessionmaker(
        bind=engine,
        autoflush=False,
        autocommit=False,
        expire_on_commit=False,
        class_=Session,
    )
    Base.metadata.create_all(bind=engine)

    db = TestingSessionLocal()
    try:
        yield db
    finally:
        db.close()
        Base.metadata.drop_all(bind=engine)
        engine.dispose()


@pytest.fixture()
def client(db_session: Session) -> Generator[TestClient, None, None]:
    def override_get_db() -> Generator[Session, None, None]:
        yield db_session

    app.dependency_overrides[get_db] = override_get_db
    with TestClient(app) as test_client:
        yield test_client
    app.dependency_overrides.clear()


@pytest.fixture()
def admin_user(db_session: Session) -> User:
    department = Department(code="HCQT", name="Hanh chinh", description="Phong HCQT")
    db_session.add(department)
    db_session.flush()

    user = User(
        username="admin",
        email="admin@test.local",
        full_name="Admin User",
        hashed_password=get_password_hash("Admin@123"),
        role=UserRole.ADMIN,
        department_id=department.id,
        is_active=True,
    )
    db_session.add(user)
    db_session.commit()
    db_session.refresh(user)
    return user


@pytest.fixture()
def auth_headers(client: TestClient, admin_user: User) -> dict[str, str]:
    response = client.post(
        "/api/v1/auth/login-json",
        json={"username": admin_user.username, "password": "Admin@123"},
    )
    token = response.json()["access_token"]
    return {"Authorization": f"Bearer {token}"}
