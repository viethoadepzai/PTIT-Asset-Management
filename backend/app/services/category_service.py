from __future__ import annotations

from fastapi import HTTPException, status
from sqlalchemy import func, or_, select
from sqlalchemy.orm import Session, selectinload

from app.models.category import Category, CategoryNeed
from app.schemas.category import (
    CategoryCreate,
    CategoryNeedCreate,
    CategoryNeedUpdate,
    CategoryUpdate,
)


def get_category_by_id(db: Session, category_id: int) -> Category | None:
    statement = (
        select(Category)
        .options(selectinload(Category.needs))
        .where(Category.id == category_id)
    )
    return db.scalar(statement)


def get_category_by_code(db: Session, code: str) -> Category | None:
    statement = select(Category).where(Category.category_code == code)
    return db.scalar(statement)


def get_category_or_404(db: Session, category_id: int) -> Category:
    category = get_category_by_id(db=db, category_id=category_id)
    if category is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Danh mục không tồn tại.",
        )
    return category


def list_categories(
    db: Session,
    *,
    skip: int = 0,
    limit: int = 100,
    category_type: str | None = None,
) -> list[Category]:
    statement = select(Category).offset(skip).limit(limit).order_by(Category.id.desc())

    if category_type is not None:
        statement = statement.where(Category.category_type == category_type)

    return list(db.scalars(statement).all())


def create_category(db: Session, payload: CategoryCreate) -> Category:
    existing = db.scalar(
        select(Category).where(
            or_(
                Category.category_code == payload.category_code.strip(),
                Category.category_name == payload.category_name.strip(),
            )
        )
    )
    if existing is not None:
        if existing.category_code == payload.category_code.strip():
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Mã danh mục đã tồn tại.",
            )
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Tên danh mục đã tồn tại.",
        )

    category = Category(
        category_code=payload.category_code.strip(),
        category_name=payload.category_name.strip(),
        category_type=payload.category_type,
        description=payload.description.strip() if payload.description else None,
        note=payload.note.strip() if payload.note else None,
    )
    db.add(category)
    db.commit()
    db.refresh(category)
    return category


def update_category(
    db: Session,
    category: Category,
    payload: CategoryUpdate,
) -> Category:
    update_data = payload.model_dump(exclude_unset=True)

    if "category_code" in update_data and update_data["category_code"] is not None:
        normalized_code = update_data["category_code"].strip()
        existing = db.scalar(
            select(Category).where(
                Category.category_code == normalized_code,
                Category.id != category.id,
            )
        )
        if existing is not None:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Mã danh mục đã tồn tại.",
            )
        category.category_code = normalized_code

    if "category_name" in update_data and update_data["category_name"] is not None:
        normalized_name = update_data["category_name"].strip()
        existing = db.scalar(
            select(Category).where(
                Category.category_name == normalized_name,
                Category.id != category.id,
            )
        )
        if existing is not None:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Tên danh mục đã tồn tại.",
            )
        category.category_name = normalized_name

    if "category_type" in update_data and update_data["category_type"] is not None:
        category.category_type = update_data["category_type"]

    if "description" in update_data:
        category.description = (
            update_data["description"].strip()
            if update_data["description"]
            else None
        )

    if "note" in update_data:
        category.note = (
            update_data["note"].strip()
            if update_data["note"]
            else None
        )

    if "is_active" in update_data and update_data["is_active"] is not None:
        category.is_active = update_data["is_active"]

    db.add(category)
    db.commit()
    db.refresh(category)
    return category


def delete_category(db: Session, category: Category) -> None:
    db.delete(category)
    db.commit()


def get_category_need_or_404(
    db: Session,
    category_need_id: int,
) -> CategoryNeed:
    statement = select(CategoryNeed).where(CategoryNeed.id == category_need_id)
    need = db.scalar(statement)
    if need is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Nhu cầu danh mục không tồn tại.",
        )
    return need


def update_category_need(
    db: Session,
    category_need: CategoryNeed,
    payload: CategoryNeedUpdate,
) -> CategoryNeed:
    if payload.department_id is not None:
        category_need.department_id = payload.department_id
    if payload.require_quantity is not None:
        category_need.require_quantity = payload.require_quantity
    if payload.is_active is not None:
        category_need.is_active = payload.is_active
    db.add(category_need)
    db.commit()
    db.refresh(category_need)
    return category_need


def get_category_need_by_category_id(
    db: Session,
    category_id: int,
    department_id: int | None = None,
) -> list[CategoryNeed]:
    statement = select(CategoryNeed).where(CategoryNeed.category_id == category_id)
    if department_id is not None:
        statement = statement.where(CategoryNeed.department_id == department_id)
    return list(db.scalars(statement).all())


def upsert_category_need(
    db: Session,
    category_id: int,
    department_id: int | None,
    payload: CategoryNeedUpdate,
) -> CategoryNeed:
    needs = get_category_need_by_category_id(db, category_id, department_id)
    if needs:
        return update_category_need(db, needs[0], payload)

    need = CategoryNeed(
        category_id=category_id,
        department_id=department_id,
        require_quantity=payload.require_quantity,
        is_active=payload.is_active if payload.is_active is not None else True,
    )
    db.add(need)
    db.commit()
    db.refresh(need)
    return need
