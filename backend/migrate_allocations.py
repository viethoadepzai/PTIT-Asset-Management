"""
Script migration: Dong bo du lieu phan bo tu cac phieu nhu cau da duyet truoc do.
"""

import sys
import io
from pathlib import Path

# Fix unicode output on Windows
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

# Them thu muc backend vao sys.path
sys.path.insert(0, str(Path(__file__).resolve().parent))

from sqlalchemy import select, func
from app.core.database import SessionLocal

# Import ALL models to resolve SQLAlchemy relationships
import app.models.asset
import app.models.asset_quantity
import app.models.category
import app.models.department
import app.models.user
import app.models.supply
import app.models.location_quantity_asset
import app.models.department_quantity_asset_allocation

from app.models.category import CategoryNeed, CategoryNeedStatus
from app.models.department_quantity_asset_allocation import (
    DepartmentQuantityAssetAllocation,
)


def migrate():
    db = SessionLocal()
    try:
        # =============================================
        # Bước 1: Xem dữ liệu phiếu nhu cầu đã duyệt
        # =============================================
        approved_needs = list(
            db.scalars(
                select(CategoryNeed).where(
                    CategoryNeed.status == CategoryNeedStatus.APPROVED,
                    CategoryNeed.asset_quantity_id.isnot(None),
                    CategoryNeed.department_id.isnot(None),
                )
            ).all()
        )

        print(f"\n=== Tìm thấy {len(approved_needs)} phiếu nhu cầu đã duyệt (có asset_quantity_id + department_id) ===\n")

        if not approved_needs:
            print("Không có phiếu nào cần đồng bộ. Thoát.")
            return

        for need in approved_needs:
            print(
                f"  Phiếu #{need.id}: "
                f"department_id={need.department_id}, "
                f"asset_quantity_id={need.asset_quantity_id}, "
                f"require_quantity={need.require_quantity}"
            )

        # =============================================
        # Bước 2: Gộp theo (department_id, asset_quantity_id)
        # =============================================
        aggregated = {}
        for need in approved_needs:
            key = (need.department_id, need.asset_quantity_id)
            if key not in aggregated:
                aggregated[key] = 0
            aggregated[key] += need.require_quantity

        print(f"\n=== Kết quả cộng dồn: {len(aggregated)} cặp (phòng ban, tài sản) ===\n")
        for (dept_id, qty_asset_id), total in aggregated.items():
            print(f"  department_id={dept_id}, quantity_asset_id={qty_asset_id} → tổng = {total}")

        # =============================================
        # Bước 3: Ghi vào bảng department_quantity_asset_allocations
        # =============================================
        created_count = 0
        updated_count = 0

        for (dept_id, qty_asset_id), total in aggregated.items():
            existing = db.scalar(
                select(DepartmentQuantityAssetAllocation).where(
                    DepartmentQuantityAssetAllocation.department_id == dept_id,
                    DepartmentQuantityAssetAllocation.quantity_asset_id == qty_asset_id,
                )
            )

            if existing:
                old_val = existing.allocated_quantity
                existing.allocated_quantity = total
                existing.notes = f"Đồng bộ từ {len([n for n in approved_needs if n.department_id == dept_id and n.asset_quantity_id == qty_asset_id])} phiếu nhu cầu đã duyệt"
                db.add(existing)
                updated_count += 1
                print(f"  [CẬP NHẬT] dept={dept_id}, asset={qty_asset_id}: {old_val} → {total}")
            else:
                allocation = DepartmentQuantityAssetAllocation(
                    department_id=dept_id,
                    quantity_asset_id=qty_asset_id,
                    allocated_quantity=total,
                    notes=f"Đồng bộ từ {len([n for n in approved_needs if n.department_id == dept_id and n.asset_quantity_id == qty_asset_id])} phiếu nhu cầu đã duyệt",
                )
                db.add(allocation)
                created_count += 1
                print(f"  [TẠO MỚI] dept={dept_id}, asset={qty_asset_id}: {total}")

        db.commit()

        print(f"\n=== HOÀN TẤT ===")
        print(f"  Tạo mới: {created_count}")
        print(f"  Cập nhật: {updated_count}")
        print(f"  Tổng bản ghi: {created_count + updated_count}")

        # =============================================
        # Bước 4: Kiểm tra kết quả
        # =============================================
        all_allocs = list(
            db.scalars(
                select(DepartmentQuantityAssetAllocation).order_by(
                    DepartmentQuantityAssetAllocation.id
                )
            ).all()
        )
        print(f"\n=== Bảng department_quantity_asset_allocations hiện tại ({len(all_allocs)} bản ghi) ===\n")
        for a in all_allocs:
            print(
                f"  id={a.id}, dept={a.department_id}, "
                f"asset={a.quantity_asset_id}, "
                f"allocated={a.allocated_quantity}, "
                f"notes={a.notes}"
            )

    except Exception as e:
        db.rollback()
        print(f"\n[LỖI] {e}")
        raise
    finally:
        db.close()


if __name__ == "__main__":
    migrate()
