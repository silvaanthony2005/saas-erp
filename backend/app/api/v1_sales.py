from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from app.core.database import get_db
from app.core.auth import require_role, require_license
from app.schemas.sales import SaleCreate, SaleResponse, SaleDetailResponse, PaymentResponse
from app.services.sales_service import SalesService
from datetime import datetime

router = APIRouter()

def build_sale_response(sale):
    data = {
        "id": sale.id,
        "timestamp": sale.timestamp,
        "total_amount_bs": sale.total_amount_bs,
        "total_usd": sale.total_usd,
        "exchange_rate": sale.exchange_rate,
        "payment_method": sale.payment_method,
        "customer_name": f"{sale.customer.first_name} {sale.customer.last_name}" if sale.customer else None,
        "customer_dni": sale.customer.dni if sale.customer else None,
        "customer_category": sale.customer.category if sale.customer else None,
        "details": [],
        "payments": []
    }
    for d in sale.details:
        data["details"].append(SaleDetailResponse(
            id=d.id,
            product_id=d.product_id,
            quantity=d.quantity,
            unit_price_bs=d.unit_price_bs,
            unit_price_usd=d.unit_price_usd or 0.0,
            product_name=d.product_name
        ))
    for p in sale.payments or []:
        data["payments"].append(PaymentResponse(
            id=p.id,
            payment_method=p.payment_method,
            amount_bs=p.amount_bs,
            amount_usd=p.amount_usd,
            reference_number=p.reference_number,
            exchange_rate=p.exchange_rate,
            created_at=p.created_at
        ))
    return SaleResponse(**data)

@router.post("", response_model=SaleResponse)
def create_sale(
    sale: SaleCreate,
    db: Session = Depends(get_db),
    current_user = Depends(require_role("dueño", "supervisor", "cajero")),
    _ = Depends(require_license("pos")),
):
    db_sale = SalesService.create_sale(db, sale)
    return build_sale_response(db_sale)

@router.get("", response_model=List[SaleResponse])
def read_sales(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user = Depends(require_role("dueño", "supervisor", "cajero")),
    _ = Depends(require_license("pos")),
):
    sales = SalesService.get_sales(db, skip=skip, limit=limit)
    return [build_sale_response(s) for s in sales]

@router.get("/{sale_id}", response_model=SaleResponse)
def read_sale(
    sale_id: int,
    db: Session = Depends(get_db),
    current_user = Depends(require_role("dueño", "supervisor", "cajero")),
    _ = Depends(require_license("pos")),
):
    db_sale = SalesService.get_sale_by_id(db, sale_id)
    if not db_sale:
        raise HTTPException(status_code=404, detail="Sale not found")
    return build_sale_response(db_sale)
