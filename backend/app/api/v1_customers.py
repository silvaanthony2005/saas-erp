from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.auth import require_role
from app.models.business import Customer, Transaction
from app.schemas.business import CustomerCreate, CustomerResponse
from sqlalchemy import func
from typing import List

router = APIRouter()

def customer_to_response(c):
    return CustomerResponse(
        id=c.id, dni=c.dni, first_name=c.first_name,
        last_name=c.last_name, phone=c.phone, address=c.address,
        category=c.category or "regular",
        credit_limit_usd=c.credit_limit_usd or 0.0,
        created_at=c.created_at.isoformat()
    )

@router.post("", response_model=CustomerResponse)
def create_customer(
    customer: CustomerCreate,
    db: Session = Depends(get_db),
    current_user = Depends(require_role("dueño", "supervisor", "cajero")),
):
    db_customer = db.query(Customer).filter(Customer.dni == customer.dni).first()
    if db_customer:
        raise HTTPException(status_code=400, detail="Customer already exists")
    new_customer = Customer(**customer.model_dump())
    db.add(new_customer)
    db.commit()
    db.refresh(new_customer)
    return customer_to_response(new_customer)

@router.get("/dni/{dni}", response_model=CustomerResponse)
def get_customer_by_dni(
    dni: str,
    db: Session = Depends(get_db),
    current_user = Depends(require_role("dueño", "supervisor", "cajero")),
):
    customer = db.query(Customer).filter(Customer.dni == dni).first()
    if not customer:
        raise HTTPException(status_code=404, detail="Customer not found")
    return customer_to_response(customer)

@router.put("/{customer_id}", response_model=CustomerResponse)
def update_customer(
    customer_id: int,
    customer_data: CustomerCreate,
    db: Session = Depends(get_db),
    current_user = Depends(require_role("dueño", "supervisor", "cajero")),
):
    db_customer = db.query(Customer).filter(Customer.id == customer_id).first()
    if not db_customer:
        raise HTTPException(status_code=404, detail="Customer not found")
    for key, value in customer_data.model_dump().items():
        setattr(db_customer, key, value)
    db.commit()
    db.refresh(db_customer)
    return customer_to_response(db_customer)

@router.get("", response_model=List[CustomerResponse])
def get_customers(
    db: Session = Depends(get_db),
    current_user = Depends(require_role("dueño", "supervisor", "cajero")),
):
    return [customer_to_response(c) for c in db.query(Customer).all()]

@router.get("/stats")
def get_customer_stats(
    db: Session = Depends(get_db),
    current_user = Depends(require_role("dueño", "supervisor", "cajero")),
):
    top_customers = (
        db.query(
            Customer.id, Customer.first_name, Customer.last_name, Customer.dni,
            func.count(Transaction.id).label("total_purchases"),
            func.sum(Transaction.total_amount_bs).label("total_spent")
        )
        .join(Transaction, Transaction.customer_id == Customer.id)
        .group_by(Customer.id)
        .order_by(func.count(Transaction.id).desc())
        .limit(5).all()
    )
    return [
        {"id": tc.id, "name": f"{tc.first_name} {tc.last_name}",
         "dni": tc.dni, "total_purchases": tc.total_purchases,
         "total_spent": tc.total_spent}
        for tc in top_customers
    ]

@router.get("/{customer_id}/history")
def get_customer_history(
    customer_id: int,
    db: Session = Depends(get_db),
    current_user = Depends(require_role("dueño", "supervisor", "cajero")),
):
    transactions = (
        db.query(Transaction)
        .filter(Transaction.customer_id == customer_id)
        .order_by(Transaction.timestamp.desc())
        .limit(10).all()
    )
    return [
        {"id": t.id, "date": t.timestamp.isoformat(),
         "total": t.total_amount_bs, "method": t.payment_method}
        for t in transactions
    ]
