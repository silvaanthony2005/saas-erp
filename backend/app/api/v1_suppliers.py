from fastapi import APIRouter, Depends, Query, HTTPException
from sqlalchemy.orm import Session
from typing import List, Optional
from pydantic import BaseModel
from app.core.database import get_db
from app.core.auth import require_role
from app.schemas.purchasing import SupplierCreate, SupplierResponse
from app.services.supplier_service import SupplierService

router = APIRouter()

class PaginatedSuppliers(BaseModel):
    suppliers: List[SupplierResponse]
    total: int
    page: int
    page_size: int

@router.get("", response_model=PaginatedSuppliers)
def read_suppliers(
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=1000),
    search: str = Query("", max_length=100),
    db: Session = Depends(get_db),
    current_user = Depends(require_role("dueño", "supervisor")),
):
    result = SupplierService.get_suppliers(db, skip=skip, limit=limit, search=search)
    return PaginatedSuppliers(
        suppliers=result["suppliers"],
        total=result["total"],
        page=(skip // limit) + 1,
        page_size=limit
    )

@router.get("/{supplier_id}", response_model=SupplierResponse)
def read_supplier(
    supplier_id: int,
    db: Session = Depends(get_db),
    current_user = Depends(require_role("dueño", "supervisor")),
):
    return SupplierService.get_supplier_by_id(db, supplier_id)

@router.post("", response_model=SupplierResponse)
def create_supplier(
    data: SupplierCreate,
    db: Session = Depends(get_db),
    current_user = Depends(require_role("dueño", "supervisor")),
):
    return SupplierService.create_supplier(db, data)

@router.put("/{supplier_id}", response_model=SupplierResponse)
def update_supplier(
    supplier_id: int,
    data: SupplierCreate,
    db: Session = Depends(get_db),
    current_user = Depends(require_role("dueño", "supervisor")),
):
    return SupplierService.update_supplier(db, supplier_id, data.model_dump())

@router.delete("/{supplier_id}")
def delete_supplier(
    supplier_id: int,
    db: Session = Depends(get_db),
    current_user = Depends(require_role("dueño", "supervisor")),
):
    return SupplierService.delete_supplier(db, supplier_id)
