from __future__ import annotations

from fastapi import HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.asset_quantity import AssetQuantity
from app.models.location_quantity_asset import LocationApprovalStatus, LocationQuantityAsset
from app.schemas.location_quantity_asset import (
    LocationQuantityAssetCreate,
    LocationQuantityAssetUpdate,
)

KHO_ROOM_CODE = "KHO"


def _get_kho_row(db: Session, quantity_assets_id: int) -> LocationQuantityAsset | None:
    return db.scalar(
        select(LocationQuantityAsset).where(
            LocationQuantityAsset.quantity_assets_id == quantity_assets_id,
            LocationQuantityAsset.room_code == KHO_ROOM_CODE,
        )
    )


def list_locations(db: Session, quantity_assets_id: int) -> list[LocationQuantityAsset]:
    rows = db.scalars(
        select(LocationQuantityAsset)
        .where(LocationQuantityAsset.quantity_assets_id == quantity_assets_id)
        .order_by(LocationQuantityAsset.id)
    ).all()
    # KHO luôn đứng đầu
    return sorted(rows, key=lambda r: (0 if r.room_code == KHO_ROOM_CODE else 1, r.id))


def create_kho_location(db: Session, quantity_assets_id: int, lot_quantity: int) -> LocationQuantityAsset:
    existing = _get_kho_row(db, quantity_assets_id)
    if existing:
        return existing

    kho = LocationQuantityAsset(
        room_code=KHO_ROOM_CODE,
        quantity=lot_quantity,
        status_approval=LocationApprovalStatus.APPROVAL,
        quantity_assets_id=quantity_assets_id,
    )
    db.add(kho)
    db.commit()
    db.refresh(kho)
    return kho


def create_location(
    db: Session,
    quantity_assets_id: int,
    payload: LocationQuantityAssetCreate,
) -> LocationQuantityAsset:
    kho = _get_kho_row(db, quantity_assets_id)
    asset_qty = db.get(AssetQuantity, quantity_assets_id)
    if kho is None or asset_qty is None:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Lô tài sản chưa được duyệt hoặc chưa có kho.",
        )

    room_code = payload.room_code.strip().upper()
    
    if room_code != KHO_ROOM_CODE:
        if kho.quantity - payload.quantity < 0:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Số lượng KHO không đủ. Hiện còn {kho.quantity}.",
            )
        kho.quantity -= payload.quantity
        asset_qty.available_quantity -= payload.quantity
        db.add(kho)
        db.add(asset_qty)

    location = LocationQuantityAsset(
        room_code=room_code,
        quantity=payload.quantity,
        reason=payload.reason,
        status_approval=LocationApprovalStatus.PENDING,
        quantity_assets_id=quantity_assets_id,
    )
    db.add(location)
    db.commit()
    db.refresh(location)
    return location


def get_location_by_code(db: Session, location_code: str) -> LocationQuantityAsset | None:
    statement = select(LocationQuantityAsset).where(LocationQuantityAsset.room_code == location_code)
    return db.scalar(statement)



#tạo báo mất -> không cộng trừ dữ liệu nào -> đợi duyệt
def create_lost_location(
    db: Session,
    quantity_assets_id: int,
    payload: LocationQuantityAssetCreate,
) -> LocationQuantityAsset:
    
    kho = _get_kho_row(db, quantity_assets_id)
    if kho is None:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Lô tài sản chưa được duyệt hoặc chưa có kho.",
        )
    
    location = get_location_by_code(db, payload.room_code)
    if location is None:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Mã phòng không có trong cơ sở dữ liệu.",
        )
    
    if location.quantity + payload.quantity < 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Số lượng mất nhiều hơn số lượng hiện có tại phòng {payload.room_code}. Hiện còn {kho.quantity}.",
        )
    # quantity < 0 với dữ liệu báo mất, hỏng
    lost_location = LocationQuantityAsset(
        room_code=payload.room_code.strip().upper(),
        quantity=payload.quantity,
        reason=payload.reason,
        status_approval=LocationApprovalStatus.PENDING,
        quantity_assets_id=quantity_assets_id,
    )
    db.add(lost_location)
    db.commit()
    db.refresh(lost_location)
    return lost_location


def update_location(
    db: Session,
    quantity_assets_id: int,
    location_id: int,
    payload: LocationQuantityAssetUpdate,
) -> LocationQuantityAsset:
    location = db.scalar(
        select(LocationQuantityAsset).where(
            LocationQuantityAsset.id == location_id,
            LocationQuantityAsset.quantity_assets_id == quantity_assets_id,
        )
    )
    if location is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Vị trí không tìm thấy.")
    if location.room_code == KHO_ROOM_CODE:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Không thể sửa hàng KHO.")

    kho = _get_kho_row(db, quantity_assets_id)
    asset_qty = db.get(AssetQuantity, quantity_assets_id)
    if kho is None or asset_qty is None:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Không tìm thấy KHO.")

    delta = payload.quantity - location.quantity
    if kho.quantity - delta < 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Số lượng KHO không đủ. Hiện còn {kho.quantity}.",
        )

    kho.quantity -= delta
    asset_qty.available_quantity -= delta
    location.quantity = payload.quantity
    location.reason = payload.reason
        
    db.add(asset_qty)
        

    db.add(kho)
    db.add(location)
    db.commit()
    db.refresh(location)
    return location


def approve_location_service(
    db: Session,
    quantity_assets_id: int,
    location_id: int,
    room_code: str
) -> None:
    #location để duyệt
    location = db.scalar(
        select(LocationQuantityAsset).where(
            LocationQuantityAsset.id == location_id,
            LocationQuantityAsset.quantity_assets_id == quantity_assets_id
        )
    )
    main_location = db.scalar(
        select(LocationQuantityAsset).where(
            LocationQuantityAsset.quantity_assets_id == quantity_assets_id,
            LocationQuantityAsset.room_code == room_code,
            LocationQuantityAsset.status_approval == LocationApprovalStatus.APPROVAL
        )
    )
    

    if location is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Vị trí không tìm thấy.")

    if location.status_approval == LocationApprovalStatus.APPROVAL:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Đã approve trước đó.",
        )
        
    if location.room_code == KHO_ROOM_CODE:
        main_kho = _get_kho_row(db, quantity_assets_id)
        asset_qty = db.get(AssetQuantity, quantity_assets_id)
        
        if main_kho.quantity + location.quantity < 0:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Số lượng KHO không đủ để xuất/hủy.",
            )
            
        main_kho.quantity += location.quantity
        asset_qty.available_quantity += location.quantity
        asset_qty.quantity += location.quantity
        
        db.delete(location)
        db.commit()
        db.refresh(main_kho)
        return main_kho


    if main_location is not None:
        main_location.quantity += location.quantity
        db.delete(location)
        db.commit()
        db.refresh(main_location)
        return main_location
    else:
        location.status_approval = LocationApprovalStatus.APPROVAL
        db.commit()
        db.refresh(location)
        return location


#duyệt báo mất -> slg phòng trừ đi slg mất -> xoá dữ liệu báo mất
def approve_lost_location_service(
    db: Session,
    quantity_assets_id: int,
    location_id: int,
    room_code: int,
) -> None:
    location = db.scalar(
        select(LocationQuantityAsset).where(
            LocationQuantityAsset.id == location_id,
            LocationQuantityAsset.quantity_assets_id == quantity_assets_id,
        )
    )
    if location is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Vị trí không tìm thấy.")
    if location.room_code == KHO_ROOM_CODE:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Không thể sửa hàng KHO.")

    if location.status_approval == LocationApprovalStatus.APPROVAL:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Đã approve trước đó.",
        )

    location.status_approval = LocationApprovalStatus.APPROVAL

    lost_location = db.scalar(
        select(LocationQuantityAsset).where(
            LocationQuantityAsset.quantity_assets_id == quantity_assets_id,
            LocationQuantityAsset.room_code == room_code,
            LocationQuantityAsset.quantity >= 0
        )
    )
    if lost_location is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Vị trí phòng báo mất/hỏng không được tìm thấy.")
    
    lost_location.quantity += location.quantity
    db.delete(location)

    db.commit()
    db.refresh(lost_location)
    return lost_location


def delete_location(db: Session, quantity_assets_id: int, location_id: int) -> None:
    location = db.scalar(
        select(LocationQuantityAsset).where(
            LocationQuantityAsset.id == location_id,
            LocationQuantityAsset.quantity_assets_id == quantity_assets_id,
        )
    )
    if location is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Vị trí không tìm thấy.")
    if location.room_code == KHO_ROOM_CODE and location.status_approval == LocationApprovalStatus.APPROVAL:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Không thể xóa hàng KHO.")

    if location.room_code != KHO_ROOM_CODE:
        kho = _get_kho_row(db, quantity_assets_id)
        asset_qty = db.get(AssetQuantity, quantity_assets_id)
        if kho is not None and asset_qty is not None:
            kho.quantity += location.quantity
            asset_qty.available_quantity += location.quantity
            db.add(kho)
            db.add(asset_qty)

    db.delete(location)
    db.commit()
