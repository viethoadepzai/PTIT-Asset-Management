import sys
from pathlib import Path

# Fix unicode error in windows terminal
sys.stdout.reconfigure(encoding='utf-8')

# Add the backend directory to Python path
sys.path.append(str(Path(__file__).resolve().parent))

from sqlalchemy import select
from app.core.database import SessionLocal

# Import ALL models so SQLAlchemy can map relationships correctly
from app.models.user import User
from app.models.department import Department
from app.models.category import Category
from app.models.asset import Asset
from app.models.asset_quantity import AssetQuantity
from app.models.location_quantity_asset import LocationQuantityAsset, LocationApprovalStatus

def sync_kho():
    db = SessionLocal()
    try:
        # Get all AssetQuantities
        assets = db.scalars(select(AssetQuantity)).all()
        fixed_count = 0
        
        for asset in assets:
            # Get the KHO location for this asset
            kho = db.scalar(
                select(LocationQuantityAsset).where(
                    LocationQuantityAsset.quantity_assets_id == asset.id,
                    LocationQuantityAsset.room_code == "KHO"
                )
            )
            
            if kho:
                if kho.quantity != asset.available_quantity:
                    print(f"Lô tài sản ID {asset.id} '{asset.name}':")
                    print(f"  -> Tồn kho (available_quantity): {asset.available_quantity}")
                    print(f"  -> Vị trí KHO hiện tại: {kho.quantity}")
                    print(f"  => Đồng bộ KHO thành: {asset.available_quantity}")
                    
                    # Cập nhật số lượng KHO bằng với available_quantity
                    kho.quantity = asset.available_quantity
                    db.add(kho)
                    fixed_count += 1
            else:
                print(f"Lô tài sản ID {asset.id} '{asset.name}' bị thiếu dòng KHO! Đang tạo lại...")
                # Tạo lại dòng KHO nếu bị mất
                new_kho = LocationQuantityAsset(
                    room_code="KHO",
                    quantity=asset.available_quantity,
                    status_approval=LocationApprovalStatus.APPROVAL,
                    quantity_assets_id=asset.id,
                )
                db.add(new_kho)
                fixed_count += 1
                
        db.commit()
        print(f"\n[OK] Đã kiểm tra và đồng bộ thành công {fixed_count} lô tài sản bị lệch!")
        
    except Exception as e:
        print(f"Lỗi: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    sync_kho()
