from __future__ import annotations

from datetime import datetime, timezone

from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.models.allocation import Allocation, AllocationStatus
from app.models.asset import Asset
from app.models.asset_quantity import AssetQuantity, QuantityAssetApprovalStatus
from app.models.department import Department
from app.models.maintenance import Maintenance, MaintenanceStatus
from app.models.supply import Supply
from app.models.user import User
from app.schemas.report import (
    AllocationStatusSummaryItem,
    AssetsByDepartmentItem,
    AssetStatusSummaryItem,
    DashboardSummary,
    LowStockSupplyItem,
    MaintenanceStatusSummaryItem,
    PendingApprovalItem,
    QuantityAssetStatusSummaryItem,
    RecentActivityItem,
)


def get_dashboard_summary(db: Session) -> DashboardSummary:
    total_departments = db.scalar(select(func.count(Department.id))) or 0
    total_users = db.scalar(select(func.count(User.id))) or 0
    total_assets = db.scalar(select(func.count(Asset.id))) or 0
    total_supplies = db.scalar(select(func.count(Supply.id))) or 0

    active_allocations = db.scalar(
        select(func.count(Allocation.id)).where(
            Allocation.is_active.is_(True),
            Allocation.status == AllocationStatus.ACTIVE,
        )
    ) or 0

    active_maintenances = db.scalar(
        select(func.count(Maintenance.id)).where(
            Maintenance.is_active.is_(True),
            Maintenance.status.in_(
                [
                    MaintenanceStatus.SCHEDULED,
                    MaintenanceStatus.IN_PROGRESS,
                ]
            ),
        )
    ) or 0

    low_stock_supplies = db.scalar(
        select(func.count(Supply.id)).where(
            Supply.is_active.is_(True),
            Supply.quantity_in_stock <= Supply.minimum_stock_level,
        )
    ) or 0

    pending_quantity_assets = db.scalar(
        select(func.count(AssetQuantity.id)).where(
            AssetQuantity.approval_status == QuantityAssetApprovalStatus.PENDING,
        )
    ) or 0

    return DashboardSummary(
        generated_at=datetime.now(timezone.utc),
        total_departments=int(total_departments),
        total_users=int(total_users),
        total_assets=int(total_assets),
        total_supplies=int(total_supplies),
        active_allocations=int(active_allocations),
        active_maintenances=int(active_maintenances),
        low_stock_supplies=int(low_stock_supplies),
        pending_quantity_assets=int(pending_quantity_assets),
    )


def get_department_dashboard_summary(
    db: Session,
    *,
    department_id: int | None,
    user_id: int,
) -> DashboardSummary:
    """
    Dashboard rút gọn cho staff.

    Ưu tiên phạm vi theo phòng ban.
    Nếu user chưa thuộc phòng ban nào thì fallback về phạm vi cá nhân.
    """

    # Staff chưa có phòng ban: chỉ thống kê phạm vi của chính họ
    if department_id is None:
        total_assets = db.scalar(
            select(func.count(Asset.id)).where(
                Asset.is_active.is_(True),
                Asset.assigned_user_id == user_id,
            )
        ) or 0

        active_allocations = db.scalar(
            select(func.count(Allocation.id)).where(
                Allocation.is_active.is_(True),
                Allocation.allocated_user_id == user_id,
                Allocation.status == AllocationStatus.ACTIVE,
            )
        ) or 0

        active_maintenances = db.scalar(
            select(func.count(Maintenance.id)).where(
                Maintenance.is_active.is_(True),
                Maintenance.reported_by_user_id == user_id,
                Maintenance.status.in_(
                    [
                        MaintenanceStatus.SCHEDULED,
                        MaintenanceStatus.IN_PROGRESS,
                    ]
                ),
            )
        ) or 0

        return DashboardSummary(
            generated_at=datetime.now(timezone.utc),
            total_departments=0,
            total_users=1,
            total_assets=int(total_assets),
            total_supplies=0,
            active_allocations=int(active_allocations),
            active_maintenances=int(active_maintenances),
            low_stock_supplies=0,
        )

    # Staff có phòng ban: thống kê theo phòng ban của họ
    total_users = db.scalar(
        select(func.count(User.id)).where(
            User.department_id == department_id,
            User.is_active.is_(True),
        )
    ) or 0

    total_assets = db.scalar(
        select(func.count(Asset.id)).where(
            Asset.is_active.is_(True),
            Asset.assigned_department_id == department_id,
        )
    ) or 0

    total_supplies = db.scalar(
        select(func.count(Supply.id)).where(
            Supply.is_active.is_(True),
            Supply.managed_department_id == department_id,
        )
    ) or 0

    active_allocations = db.scalar(
        select(func.count(Allocation.id)).where(
            Allocation.is_active.is_(True),
            Allocation.allocated_department_id == department_id,
            Allocation.status == AllocationStatus.ACTIVE,
        )
    ) or 0

    active_maintenances = db.scalar(
        select(func.count(Maintenance.id))
        .join(Asset, Maintenance.asset_id == Asset.id)
        .where(
            Maintenance.is_active.is_(True),
            Asset.assigned_department_id == department_id,
            Maintenance.status.in_(
                [
                    MaintenanceStatus.SCHEDULED,
                    MaintenanceStatus.IN_PROGRESS,
                ]
            ),
        )
    ) or 0

    low_stock_supplies = db.scalar(
        select(func.count(Supply.id)).where(
            Supply.is_active.is_(True),
            Supply.managed_department_id == department_id,
            Supply.quantity_in_stock <= Supply.minimum_stock_level,
        )
    ) or 0

    return DashboardSummary(
        generated_at=datetime.now(timezone.utc),
        total_departments=1,
        total_users=int(total_users),
        total_assets=int(total_assets),
        total_supplies=int(total_supplies),
        active_allocations=int(active_allocations),
        active_maintenances=int(active_maintenances),
        low_stock_supplies=int(low_stock_supplies),
    )


def get_asset_status_summary(db: Session) -> list[AssetStatusSummaryItem]:
    rows = db.execute(
        select(Asset.status, func.count(Asset.id))
        .where(Asset.is_active.is_(True))
        .group_by(Asset.status)
        .order_by(Asset.status)
    ).all()

    return [
        AssetStatusSummaryItem(status=status, count=count)
        for status, count in rows
    ]


def get_low_stock_supplies(db: Session) -> list[LowStockSupplyItem]:
    rows = db.execute(
        select(Supply, Department.name)
        .outerjoin(Department, Supply.managed_department_id == Department.id)
        .where(
            Supply.is_active.is_(True),
            Supply.quantity_in_stock <= Supply.minimum_stock_level,
        )
        .order_by(Supply.quantity_in_stock.asc(), Supply.id.desc())
    ).all()

    results: list[LowStockSupplyItem] = []
    for supply, department_name in rows:
        results.append(
            LowStockSupplyItem(
                id=supply.id,
                supply_code=supply.supply_code,
                name=supply.name,
                category_id=supply.category_id,
                unit=supply.unit,
                quantity_in_stock=supply.quantity_in_stock,
                minimum_stock_level=supply.minimum_stock_level,
                managed_department_id=supply.managed_department_id,
                managed_department_name=department_name,
            )
        )
    return results


def get_allocation_status_summary(db: Session) -> list[AllocationStatusSummaryItem]:
    rows = db.execute(
        select(Allocation.status, func.count(Allocation.id))
        .where(Allocation.is_active.is_(True))
        .group_by(Allocation.status)
        .order_by(Allocation.status)
    ).all()

    return [
        AllocationStatusSummaryItem(status=status, count=count)
        for status, count in rows
    ]


def get_maintenance_status_summary(
    db: Session,
) -> list[MaintenanceStatusSummaryItem]:
    rows = db.execute(
        select(Maintenance.status, func.count(Maintenance.id))
        .where(Maintenance.is_active.is_(True))
        .group_by(Maintenance.status)
        .order_by(Maintenance.status)
    ).all()

    return [
        MaintenanceStatusSummaryItem(status=status, count=count)
        for status, count in rows
    ]


def get_recent_activity(db: Session, *, limit: int = 10) -> list[RecentActivityItem]:
    asset_rows = db.execute(
        select(Asset.asset_code, Asset.name, Asset.status, Asset.updated_at)
        .where(Asset.is_active.is_(True))
        .order_by(Asset.updated_at.desc())
        .limit(limit)
    ).all()

    supply_rows = db.execute(
        select(
            Supply.supply_code,
            Supply.name,
            Supply.quantity_in_stock,
            Supply.updated_at,
        )
        .where(Supply.is_active.is_(True))
        .order_by(Supply.updated_at.desc())
        .limit(limit)
    ).all()

    maintenance_rows = db.execute(
        select(
            Maintenance.maintenance_code,
            Maintenance.title,
            Maintenance.status,
            Maintenance.updated_at,
        )
        .where(Maintenance.is_active.is_(True))
        .order_by(Maintenance.updated_at.desc())
        .limit(limit)
    ).all()

    allocation_rows = db.execute(
        select(
            Allocation.allocation_code,
            Allocation.allocation_type,
            Allocation.status,
            Allocation.updated_at,
        )
        .where(Allocation.is_active.is_(True))
        .order_by(Allocation.updated_at.desc())
        .limit(limit)
    ).all()

    items: list[RecentActivityItem] = []

    for code, title, status, activity_date in asset_rows:
        items.append(
            RecentActivityItem(
                source="asset",
                code=code,
                title=title,
                status=str(status.value if hasattr(status, "value") else status),
                activity_date=activity_date,
            )
        )

    for code, title, quantity, activity_date in supply_rows:
        items.append(
            RecentActivityItem(
                source="supply",
                code=code,
                title=title,
                status=f"stock={quantity}",
                activity_date=activity_date,
            )
        )

    for code, title, status, activity_date in maintenance_rows:
        items.append(
            RecentActivityItem(
                source="maintenance",
                code=code,
                title=title,
                status=str(status.value if hasattr(status, "value") else status),
                activity_date=activity_date,
            )
        )

    for code, allocation_type, status, activity_date in allocation_rows:
        items.append(
            RecentActivityItem(
                source="allocation",
                code=code,
                title=str(
                    allocation_type.value
                    if hasattr(allocation_type, "value")
                    else allocation_type
                ),
                status=str(status.value if hasattr(status, "value") else status),
                activity_date=activity_date,
            )
        )

    items.sort(
        key=lambda item: item.activity_date.isoformat()
        if item.activity_date
        else "",
        reverse=True,
    )

    return items[:limit]


def get_quantity_asset_status_summary(
    db: Session,
) -> list[QuantityAssetStatusSummaryItem]:
    rows = db.execute(
        select(AssetQuantity.status, func.count(AssetQuantity.id))
        .where(AssetQuantity.is_active.is_(True))
        .group_by(AssetQuantity.status)
        .order_by(AssetQuantity.status)
    ).all()

    return [
        QuantityAssetStatusSummaryItem(
            status=str(s.value if hasattr(s, "value") else s),
            count=int(c),
        )
        for s, c in rows
    ]


def get_assets_by_department(db: Session) -> list[AssetsByDepartmentItem]:
    asset_rows = db.execute(
        select(Department.name, func.count(Asset.id))
        .join(Asset, Asset.assigned_department_id == Department.id)
        .where(Asset.is_active.is_(True))
        .group_by(Department.id, Department.name)
    ).all()

    qty_rows = db.execute(
        select(Department.name, func.count(AssetQuantity.id))
        .join(AssetQuantity, AssetQuantity.assigned_department_id == Department.id)
        .where(AssetQuantity.is_active.is_(True))
        .group_by(Department.id, Department.name)
    ).all()

    dept_map: dict[str, dict[str, int]] = {}
    for dept_name, count in asset_rows:
        dept_map[dept_name] = {"asset_count": int(count), "quantity_asset_count": 0}
    for dept_name, count in qty_rows:
        if dept_name not in dept_map:
            dept_map[dept_name] = {"asset_count": 0, "quantity_asset_count": 0}
        dept_map[dept_name]["quantity_asset_count"] = int(count)

    return [
        AssetsByDepartmentItem(
            department_name=name,
            asset_count=vals["asset_count"],
            quantity_asset_count=vals["quantity_asset_count"],
        )
        for name, vals in sorted(dept_map.items(), key=lambda kv: kv[0])
    ]


def get_pending_approvals(
    db: Session, *, limit: int = 10
) -> list[PendingApprovalItem]:
    rows = db.scalars(
        select(AssetQuantity)
        .where(AssetQuantity.approval_status == QuantityAssetApprovalStatus.PENDING)
        .order_by(AssetQuantity.created_at.desc())
        .limit(limit)
    ).all()

    return [
        PendingApprovalItem(
            id=r.id,
            code=r.code,
            name=r.name,
            category_id=r.category_id,
            quantity=r.quantity,
            created_at=r.created_at,
        )
        for r in rows
    ]