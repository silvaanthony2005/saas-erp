from fastapi import APIRouter, Depends, Query, HTTPException
from sqlalchemy.orm import Session
from typing import List, Optional
from pydantic import BaseModel
from app.core.database import get_db
from app.core.auth import require_role, require_license
from app.schemas.sales import ReceivableResponse, ReceivablePaymentResponse, ReceivableScheduleSetup, ReceivableScheduleResponse
from app.services.cxc_service import CxCService

router = APIRouter()

class PaginatedReceivables(BaseModel):
    receivables: List[ReceivableResponse]
    total: int

class PaymentHistoryResponse(BaseModel):
    payments: List[ReceivablePaymentResponse]
    total: int

class PaymentCreate(BaseModel):
    amount_bs: float
    payment_method: str = "cash"
    reference_number: Optional[str] = None

@router.get("", response_model=PaginatedReceivables)
def list_receivables(
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1),
    status: Optional[str] = Query(None),
    customer_id: Optional[int] = Query(None),
    db: Session = Depends(get_db),
    current_user = Depends(require_role("dueño", "supervisor")),
    _ = Depends(require_license("accounting")),
):
    result = CxCService.get_receivables(db, skip=skip, limit=limit, status=status, customer_id=customer_id)
    receivables = []
    for r in result["receivables"]:
        rd = ReceivableResponse(
            id=r.id,
            sale_id=r.sale_id,
            customer_id=r.customer_id,
            customer_name=f"{r.customer.first_name} {r.customer.last_name}" if r.customer else None,
            customer_dni=r.customer.dni if r.customer else None,
            total_usd=r.total_usd,
            remaining_usd=r.remaining_usd,
            exchange_rate_at_sale=r.exchange_rate_at_sale,
            status=r.status,
            due_date=r.due_date.isoformat() if r.due_date else None,
            created_at=r.created_at
        )
        receivables.append(rd)
    return PaginatedReceivables(receivables=receivables, total=result["total"])

@router.get("/{receivable_id}", response_model=ReceivableResponse)
def get_receivable(
    receivable_id: int,
    db: Session = Depends(get_db),
    current_user = Depends(require_role("dueño", "supervisor")),
    _ = Depends(require_license("accounting")),
):
    r = CxCService.get_receivable_by_id(db, receivable_id)
    return ReceivableResponse(
        id=r.id,
        sale_id=r.sale_id,
        customer_id=r.customer_id,
        customer_name=f"{r.customer.first_name} {r.customer.last_name}" if r.customer else None,
        customer_dni=r.customer.dni if r.customer else None,
        total_usd=r.total_usd,
        remaining_usd=r.remaining_usd,
        exchange_rate_at_sale=r.exchange_rate_at_sale,
        status=r.status,
        due_date=r.due_date.isoformat() if r.due_date else None,
        created_at=r.created_at
    )

@router.post("/{receivable_id}/pay")
def pay_receivable(
    receivable_id: int,
    payment: PaymentCreate,
    db: Session = Depends(get_db),
    current_user = Depends(require_role("dueño", "supervisor")),
    _ = Depends(require_license("accounting")),
):
    result = CxCService.make_payment(
        db, receivable_id, payment.amount_bs,
        payment_method=payment.payment_method,
        reference_number=payment.reference_number
    )
    return result

@router.get("/{receivable_id}/payments", response_model=PaymentHistoryResponse)
def get_payment_history(
    receivable_id: int,
    db: Session = Depends(get_db),
    current_user = Depends(require_role("dueño", "supervisor")),
    _ = Depends(require_license("accounting")),
):
    payments = CxCService.get_payment_history(db, receivable_id)
    return PaymentHistoryResponse(
        payments=[ReceivablePaymentResponse.model_validate(p) for p in payments],
        total=len(payments)
    )

@router.get("/summary/all")
def get_summary(
    db: Session = Depends(get_db),
    current_user = Depends(require_role("dueño", "supervisor")),
    _ = Depends(require_license("accounting")),
):
    return CxCService.get_summary(db)

@router.get("/{receivable_id}/schedule", response_model=List[ReceivableScheduleResponse])
def get_schedule(
    receivable_id: int,
    db: Session = Depends(get_db),
    current_user = Depends(require_role("dueño", "supervisor")),
    _ = Depends(require_license("accounting")),
):
    return CxCService.get_schedule(db, receivable_id)

@router.post("/{receivable_id}/schedule")
def setup_schedule(
    receivable_id: int,
    data: ReceivableScheduleSetup,
    db: Session = Depends(get_db),
    current_user = Depends(require_role("dueño", "supervisor")),
    _ = Depends(require_license("accounting")),
):
    installments = [i.model_dump() for i in data.installments]
    return CxCService.setup_schedule(db, receivable_id, installments)

@router.get("/customer/{customer_id}/balance")
def get_customer_balance(
    customer_id: int,
    db: Session = Depends(get_db),
    current_user = Depends(require_role("dueño", "supervisor")),
    _ = Depends(require_license("accounting")),
):
    return CxCService.get_customer_balance(db, customer_id)
