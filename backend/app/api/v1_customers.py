from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.models.business import Customer, Transaction, TransactionDetail
from app.schemas.business import CustomerCreate, CustomerResponse
from sqlalchemy import func
from typing import List

router = APIRouter()

@router.post("/", response_model=CustomerResponse)
def create_customer(customer: CustomerCreate, db: Session = Depends(get_db)):
    db_customer = db.query(Customer).filter(Customer.dni == customer.dni).first()
    if db_customer:
        raise HTTPException(status_code=400, detail="Customer already exists")
    
    new_customer = Customer(
        dni=customer.dni,
        first_name=customer.first_name,
        last_name=customer.last_name,
        phone=customer.phone,
        address=customer.address
    )
    db.add(new_customer)
    db.commit()
    db.refresh(new_customer)
    
    # Convert created_at to string for response model
    return CustomerResponse(
        id=new_customer.id,
        dni=new_customer.dni,
        first_name=new_customer.first_name,
        last_name=new_customer.last_name,
        phone=new_customer.phone,
        address=new_customer.address,
        created_at=new_customer.created_at.isoformat()
    )

@router.get("/dni/{dni}", response_model=CustomerResponse)
def get_customer_by_dni(dni: str, db: Session = Depends(get_db)):
    customer = db.query(Customer).filter(Customer.dni == dni).first()
    if not customer:
        raise HTTPException(status_code=404, detail="Customer not found")
    return CustomerResponse(
        id=customer.id,
        dni=customer.dni,
        first_name=customer.first_name,
        last_name=customer.last_name,
        phone=customer.phone,
        address=customer.address,
        created_at=customer.created_at.isoformat()
    )

@router.put("/{customer_id}", response_model=CustomerResponse)
def update_customer(customer_id: int, customer_data: CustomerCreate, db: Session = Depends(get_db)):
    db_customer = db.query(Customer).filter(Customer.id == customer_id).first()
    if not db_customer:
        raise HTTPException(status_code=404, detail="Customer not found")
    
    db_customer.first_name = customer_data.first_name
    db_customer.last_name = customer_data.last_name
    db_customer.phone = customer_data.phone
    db_customer.address = customer_data.address
    
    db.commit()
    db.refresh(db_customer)
    
    return CustomerResponse(
        id=db_customer.id,
        dni=db_customer.dni,
        first_name=db_customer.first_name,
        last_name=db_customer.last_name,
        phone=db_customer.phone,
        address=db_customer.address,
        created_at=db_customer.created_at.isoformat()
    )

@router.get("/", response_model=List[CustomerResponse])
def get_customers(db: Session = Depends(get_db)):
    customers = db.query(Customer).all()
    return [
        CustomerResponse(
            id=c.id,
            dni=c.dni,
            first_name=c.first_name,
            last_name=c.last_name,
            phone=c.phone,
            address=c.address,
            created_at=c.created_at.isoformat()
        ) for c in customers
    ]

@router.get("/stats")
def get_customer_stats(db: Session = Depends(get_db)):
    # Clientes con más compras
    top_customers = (
        db.query(
            Customer.id,
            Customer.first_name,
            Customer.last_name,
            Customer.dni,
            func.count(Transaction.id).label("total_purchases"),
            func.sum(Transaction.total_amount).label("total_spent")
        )
        .join(Transaction, Transaction.customer_id == Customer.id)
        .group_by(Customer.id)
        .order_by(func.count(Transaction.id).desc())
        .limit(5)
        .all()
    )
    
    # Formatear resultados
    result = []
    for tc in top_customers:
        result.append({
            "id": tc.id,
            "name": f"{tc.first_name} {tc.last_name}",
            "dni": tc.dni,
            "total_purchases": tc.total_purchases,
            "total_spent": tc.total_spent
        })
    
    return result

@router.get("/{customer_id}/history")
def get_customer_history(customer_id: int, db: Session = Depends(get_db)):
    transactions = (
        db.query(Transaction)
        .filter(Transaction.customer_id == customer_id)
        .order_by(Transaction.timestamp.desc())
        .limit(10)
        .all()
    )
    
    result = []
    for t in transactions:
        result.append({
            "id": t.id,
            "date": t.timestamp.isoformat(),
            "total": t.total_amount,
            "method": t.payment_method
        })
    return result
