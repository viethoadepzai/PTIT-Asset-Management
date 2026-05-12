from __future__ import annotations

from contextlib import asynccontextmanager
from pathlib import Path

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from app.core.config import settings
from app.core.database import SessionLocal, create_db_and_tables

import app.models.allocation
import app.models.asset
import app.models.asset_quantity
import app.models.asset_loan_item
import app.models.asset_loan_voucher
import app.models.category
import app.models.department
import app.models.department_quantity_asset_allocation
import app.models.inventory_audit
import app.models.maintenance
import app.models.supply
import app.models.supply_export_item
import app.models.supply_export_voucher
import app.models.user
import app.models.warranty_ticket

from app.routers.allocations import router as allocation_router
from app.routers.asset_loans import router as asset_loan_router
from app.routers.asset_needs import router as asset_needs_router
from app.routers.assets import router as asset_router
from app.routers.asset_quantities import router as asset_quantity_router
from app.routers.auth import router as auth_router
from app.routers.categories import router as categories_router
from app.routers.category_needs import router as category_needs_router
from app.routers.departments import router as department_router
from app.routers.maintenances import router as maintenance_router
from app.routers.reports import router as report_router
from app.routers.supplies import router as supply_router
from app.routers.supply_exports import router as supply_export_router
from app.routers.users import router as user_router
from app.routers.warranties import router as warranty_router
from app.routers.department_allocations import router as department_allocation_router
from app.routers.inventory_audits import router as inventory_audit_router
from app.services.bootstrap_admin_service import bootstrap_admin

BACKEND_ROOT = Path(__file__).resolve().parents[1]
MEDIA_DIR = BACKEND_ROOT / "media"
AVATAR_DIR = MEDIA_DIR / "avatars"

# Tạo sẵn thư mục để StaticFiles không lỗi khi mount
MEDIA_DIR.mkdir(parents=True, exist_ok=True)
AVATAR_DIR.mkdir(parents=True, exist_ok=True)


@asynccontextmanager
async def lifespan(app: FastAPI):
    create_db_and_tables()

    # Đảm bảo thư mục upload luôn tồn tại khi app chạy
    MEDIA_DIR.mkdir(parents=True, exist_ok=True)
    AVATAR_DIR.mkdir(parents=True, exist_ok=True)

    db = SessionLocal()
    try:
        bootstrap_admin(db)
    finally:
        db.close()

    yield


app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    debug=settings.DEBUG,
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.BACKEND_CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount static để frontend truy cập avatar qua URL /media/avatars/...
app.mount("/media", StaticFiles(directory=str(MEDIA_DIR)), name="media")


@app.get("/", tags=["Root"])
def root() -> dict[str, str]:
    return {
        "message": f"Welcome to {settings.PROJECT_NAME}",
        "docs": "/docs",
    }


@app.get("/health", tags=["Health"])
def health_check() -> dict[str, str]:
    return {"status": "ok"}


@app.get(f"{settings.API_V1_STR}/health", tags=["Health"])
def api_health_check() -> dict[str, str]:
    return {"status": "ok", "version": settings.VERSION}


app.include_router(auth_router, prefix=settings.API_V1_STR)
app.include_router(categories_router, prefix=settings.API_V1_STR)
app.include_router(department_router, prefix=settings.API_V1_STR)
app.include_router(asset_needs_router, prefix=settings.API_V1_STR)
app.include_router(category_needs_router, prefix=settings.API_V1_STR)
app.include_router(user_router, prefix=settings.API_V1_STR)
app.include_router(asset_router, prefix=settings.API_V1_STR)
app.include_router(asset_quantity_router, prefix=settings.API_V1_STR)
app.include_router(supply_router, prefix=settings.API_V1_STR)
app.include_router(allocation_router, prefix=settings.API_V1_STR)
app.include_router(maintenance_router, prefix=settings.API_V1_STR)
app.include_router(report_router, prefix=settings.API_V1_STR)
app.include_router(supply_export_router, prefix=settings.API_V1_STR)
app.include_router(asset_loan_router, prefix=settings.API_V1_STR)
app.include_router(warranty_router, prefix=settings.API_V1_STR)
app.include_router(department_allocation_router, prefix=settings.API_V1_STR)
app.include_router(inventory_audit_router, prefix=settings.API_V1_STR)
