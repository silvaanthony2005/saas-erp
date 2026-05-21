from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from pydantic import BaseModel
from app.core.database import get_db
from app.core.auth import require_role, require_license
from app.schemas.purchasing import (
    PurchaseInvoiceCreate, PurchaseInvoiceResponse,
    PurchaseInvoiceDetailResponse, SupplierResponse
)
from app.services.purchase_service import PurchaseService
from app.models.purchasing import PurchaseInvoice, PurchaseInvoiceDetail

router = APIRouter()

class PaginatedPurchases(BaseModel):
    purchases: List[PurchaseInvoiceResponse]
    total: int
    page: int
    page_size: int

@router.get("", response_model=PaginatedPurchases)
def read_purchases(
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=1000),
    supplier_id: Optional[int] = Query(None, ge=1),
    db: Session = Depends(get_db),
    current_user = Depends(require_role("dueño", "supervisor")),
    _ = Depends(require_license("inventory")),
):
    result = PurchaseService.get_purchases(db, skip=skip, limit=limit, supplier_id=supplier_id)
    purchases = []
    for inv in result["purchases"]:
        inv_data = PurchaseInvoiceResponse.model_validate(inv).model_dump()
        inv_data["supplier_name"] = inv.supplier.company_name if inv.supplier else None
        inv_data["created_by_name"] = inv.creator.full_name if inv.creator else None
        inv_data["details"] = []
        for d in inv.details:
            det = PurchaseInvoiceDetailResponse.model_validate(d).model_dump()
            det["product_name"] = d.product.name if d.product else None
            inv_data["details"].append(det)
        purchases.append(PurchaseInvoiceResponse(**inv_data))
    return PaginatedPurchases(
        purchases=purchases,
        total=result["total"],
        page=(skip // limit) + 1,
        page_size=limit
    )

@router.get("/{purchase_id}", response_model=PurchaseInvoiceResponse)
def read_purchase(
    purchase_id: int,
    db: Session = Depends(get_db),
    current_user = Depends(require_role("dueño", "supervisor")),
    _ = Depends(require_license("inventory")),
):
    inv = PurchaseService.get_purchase_by_id(db, purchase_id)
    inv_data = PurchaseInvoiceResponse.model_validate(inv).model_dump()
    inv_data["supplier_name"] = inv.supplier.company_name if inv.supplier else None
    inv_data["details"] = []
    for d in inv.details:
        det = PurchaseInvoiceDetailResponse.model_validate(d).model_dump()
        det["product_name"] = d.product.name if d.product else None
        inv_data["details"].append(det)
    return PurchaseInvoiceResponse(**inv_data)

@router.post("", response_model=PurchaseInvoiceResponse)
def create_purchase(
    data: PurchaseInvoiceCreate,
    db: Session = Depends(get_db),
    current_user = Depends(require_role("dueño", "supervisor")),
    _ = Depends(require_license("inventory")),
):
    inv = PurchaseService.create_purchase(db, data, current_user=current_user)
    inv_data = PurchaseInvoiceResponse.model_validate(inv).model_dump()
    inv_data["supplier_name"] = inv.supplier.company_name if inv.supplier else None
    inv_data["details"] = []
    for d in inv.details:
        det = PurchaseInvoiceDetailResponse.model_validate(d).model_dump()
        det["product_name"] = d.product.name if d.product else None
        inv_data["details"].append(det)
    return PurchaseInvoiceResponse(**inv_data)

@router.post("/{purchase_id}/cancel")
def cancel_purchase(
    purchase_id: int,
    db: Session = Depends(get_db),
    current_user = Depends(require_role("dueño", "supervisor")),
    _ = Depends(require_license("inventory")),
):
    return PurchaseService.cancel_purchase(db, purchase_id, current_user=current_user)
