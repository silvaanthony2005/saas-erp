from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from backend.app.core.database import get_db
from backend.app.schemas.accounting import ExpenseCreate, ExpenseResponse, FinancialSummary
from backend.app.services.accounting_service import AccountingService

router = APIRouter()

@router.post("/expenses", response_model=ExpenseResponse)
def create_expense(expense: ExpenseCreate, db: Session = Depends(get_db)):
    return AccountingService.create_expense(db, expense)

@router.get("/expenses", response_model=List[ExpenseResponse])
def read_expenses(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    return AccountingService.get_expenses(db, skip=skip, limit=limit)

@router.delete("/expenses/{expense_id}")
def delete_expense(expense_id: int, db: Session = Depends(get_db)):
    return AccountingService.delete_expense(db, expense_id)

@router.get("/summary", response_model=FinancialSummary)
def get_financial_summary(db: Session = Depends(get_db)):
    return AccountingService.get_summary(db)
