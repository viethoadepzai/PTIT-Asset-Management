from __future__ import annotations

from fastapi import HTTPException, status
from sqlalchemy import or_, select
from sqlalchemy.orm import Session

from app.models.department import Department
from app.schemas.department import DepartmentCreate, DepartmentUpdate


def get_department_by_id(db: Session, department_id: int) -> Department | None:
    statement = select(Department).where(Department.id == department_id)
    return db.scalar(statement)



def get_department_by_code(db: Session, code: str) -> Department | None:
    statement = select(Department).where(Department.code == code)
    return db.scalar(statement)



def get_department_by_name(db: Session, name: str) -> Department | None:
    statement = select(Department).where(Department.name == name)
    return db.scalar(statement)



def list_departments(
    db: Session,
    *,
    skip: int = 0,
    limit: int = 100,
    is_active: bool | None = None,
) -> list[Department]:
    statement = select(Department).offset(skip).limit(limit).order_by(Department.id.desc())

    if is_active is not None:
        statement = statement.where(Department.is_active == is_active)

    return list(db.scalars(statement).all())



def create_department(db: Session, payload: DepartmentCreate) -> Department:
    existing_department = db.scalar(
        select(Department).where(
            or_(Department.code == payload.code, Department.name == payload.name)
        )
    )
    if existing_department is not None:
        detail = (
            "Department code already exists"
            if existing_department.code == payload.code
            else "Department name already exists"
        )
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=detail)

    department = Department(
        code=payload.code.strip(),
        name=payload.name.strip(),
        description=payload.description.strip() if payload.description else None,
        is_active=payload.is_active,
    )
    db.add(department)
    db.commit()
    db.refresh(department)
    return department



def update_department(
    db: Session,
    department: Department,
    payload: DepartmentUpdate,
) -> Department:
    update_data = payload.model_dump(exclude_unset=True)

    if "code" in update_data and update_data["code"] is not None:
        normalized_code = update_data["code"].strip()
        existing = db.scalar(
            select(Department).where(
                Department.code == normalized_code,
                Department.id != department.id,
            )
        )
        if existing is not None:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Department code already exists",
            )
        department.code = normalized_code

    if "name" in update_data and update_data["name"] is not None:
        normalized_name = update_data["name"].strip()
        existing = db.scalar(
            select(Department).where(
                Department.name == normalized_name,
                Department.id != department.id,
            )
        )
        if existing is not None:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Department name already exists",
            )
        department.name = normalized_name

    if "description" in update_data:
        department.description = (
            update_data["description"].strip() if update_data["description"] else None
        )

    if "is_active" in update_data and update_data["is_active"] is not None:
        department.is_active = update_data["is_active"]

    db.add(department)
    db.commit()
    db.refresh(department)
    return department



def deactivate_department(db: Session, department: Department) -> Department:
    department.is_active = False
    db.add(department)
    db.commit()
    db.refresh(department)
    return department

def delete_department(db: Session, department: Department) -> None:
    db.delete(department)
    db.commit()

def get_department_or_404(db: Session, department_id: int) -> Department:
    department = get_department_by_id(db=db, department_id=department_id)
    if department is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Department not found",
        )
    return department
