from fastapi import APIRouter, Depends, Query, HTTPException
from sqlalchemy.orm import Session
from typing import List, Optional
from pydantic import BaseModel
from app.core.database import get_db
from app.core.auth import require_role, require_license
from app.schemas.purchasing import (
    AccountsPayableResponse, PaymentScheduleCreate,
    PaymentScheduleResponse, CostingConfigResponse,
    CostingConfigUpdate, InventoryMovementResponse
)
from app.services.purchase_service import PurchaseService
from app.services.inventory_cost_service import InventoryCostService
from app.models.purchasing import AccountsPayable, PurchaseInvoice

router = APIRouter()

class PaginatedAP(BaseModel):
    accounts_payable: List[AccountsPayableResponse]
    total: int
    page: int
    page_size: int

class CxPSummary(BaseModel):
    total_pending_bs: float
    total_overdue_bs: float
    total_paid_bs: float

class SupplierBalance(BaseModel):
    supplier_id: int
    total_debt_bs: float
    active_aps: int

@router.get("", response_model=PaginatedAP)
def read_accounts_payable(
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=1000),
    status: Optional[str] = Query(None, pattern="^(pending|overdue|paid|partially_paid)$"),
    db: Session = Depends(get_db),
    current_user = Depends(require_role("dueño", "supervisor")),
    _ = Depends(require_license("accounting")),
):
    result = PurchaseService.get_accounts_payable(db, skip=skip, limit=limit, status=status)
    aps = []
    for ap in result["accounts_payable"]:
        ap_data = AccountsPayableResponse.model_validate(ap).model_dump()
        ap_data["invoice_number"] = ap.purchase_invoice.invoice_number if ap.purchase_invoice else None
        ap_data["supplier_name"] = ap.purchase_invoice.supplier.company_name if ap.purchase_invoice and ap.purchase_invoice.supplier else None
        ap_data["due_date"] = str(ap.due_date) if ap.due_date else None
        aps.append(AccountsPayableResponse(**ap_data))
    return PaginatedAP(
        accounts_payable=aps,
        total=result["total"],
        page=(skip // limit) + 1,
        page_size=limit
    )

@router.get("/{ap_id}", response_model=AccountsPayableResponse)
def read_accounts_payable_by_id(
    ap_id: int,
    db: Session = Depends(get_db),
    current_user = Depends(require_role("dueño", "supervisor")),
    _ = Depends(require_license("accounting")),
):
    ap = PurchaseService.get_ap_by_id(db, ap_id)
    ap_data = AccountsPayableResponse.model_validate(ap).model_dump()
    ap_data["invoice_number"] = ap.purchase_invoice.invoice_number if ap.purchase_invoice else None
    ap_data["supplier_name"] = ap.purchase_invoice.supplier.company_name if ap.purchase_invoice and ap.purchase_invoice.supplier else None
    ap_data["due_date"] = str(ap.due_date) if ap.due_date else None
    return AccountsPayableResponse(**ap_data)

@router.post("/payments")
def make_payment(
    data: PaymentScheduleCreate,
    db: Session = Depends(get_db),
    current_user = Depends(require_role("dueño", "supervisor")),
    _ = Depends(require_license("accounting")),
):
    payment = PurchaseService.make_payment(db, data)
    return PaymentScheduleResponse.model_validate(payment)

@router.get("/{ap_id}/payments", response_model=List[PaymentScheduleResponse])
def read_payment_schedules(
    ap_id: int,
    db: Session = Depends(get_db),
    current_user = Depends(require_role("dueño", "supervisor")),
    _ = Depends(require_license("accounting")),
):
    schedules = PurchaseService.get_payment_schedules(db, ap_id)
    return [PaymentScheduleResponse.model_validate(s) for s in schedules]

@router.get("/summary/overview", response_model=CxPSummary)
def read_cxp_summary(
    db: Session = Depends(get_db),
    current_user = Depends(require_role("dueño", "supervisor")),
    _ = Depends(require_license("accounting")),
):
    return PurchaseService.get_cxpsummary(db)

@router.get("/supplier/{supplier_id}/balance", response_model=SupplierBalance)
def read_supplier_balance(
    supplier_id: int,
    db: Session = Depends(get_db),
    current_user = Depends(require_role("dueño", "supervisor")),
    _ = Depends(require_license("accounting")),
):
    return PurchaseService.get_supplier_balance(db, supplier_id)
