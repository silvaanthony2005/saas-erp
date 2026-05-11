from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from app.core.database import get_db
from app.schemas.sales import SaleCreate, SaleResponse
from app.services.sales_service import SalesService

router = APIRouter()

@router.post("/", response_model=SaleResponse)
def create_sale(sale: SaleCreate, db: Session = Depends(get_db)):
    return SalesService.create_sale(db, sale)

@router.get("/", response_model=List[SaleResponse])
def read_sales(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    return SalesService.get_sales(db, skip=skip, limit=limit)

@router.get("/{sale_id}", response_model=SaleResponse)
def read_sale(sale_id: int, db: Session = Depends(get_db)):
    db_sale = SalesService.get_sale_by_id(db, sale_id)
    if not db_sale:
        raise HTTPException(status_code=404, detail="Sale not found")
    return db_sale
