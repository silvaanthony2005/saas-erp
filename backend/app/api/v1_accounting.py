from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from app.core.database import get_db
from app.core.auth import require_role, require_license
from app.schemas.accounting import ExpenseCreate, ExpenseResponse, FinancialSummary, IncomeCreate, IncomeResponse
from app.services.accounting_service import AccountingService

router = APIRouter()

@router.post("/expenses", response_model=ExpenseResponse)
def create_expense(
    expense: ExpenseCreate,
    db: Session = Depends(get_db),
    current_user = Depends(require_role("dueño")),
    _ = Depends(require_license("accounting")),
):
    return AccountingService.create_expense(db, expense)

@router.get("/expenses", response_model=List[ExpenseResponse])
def read_expenses(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user = Depends(require_role("dueño")),
    _ = Depends(require_license("accounting")),
):
    return AccountingService.get_expenses(db, skip=skip, limit=limit)

@router.delete("/expenses/{expense_id}")
def delete_expense(
    expense_id: int,
    db: Session = Depends(get_db),
    current_user = Depends(require_role("dueño")),
    _ = Depends(require_license("accounting")),
):
    return AccountingService.delete_expense(db, expense_id)

@router.get("/summary", response_model=FinancialSummary)
def get_financial_summary(
    db: Session = Depends(get_db),
    current_user = Depends(require_role("dueño")),
    _ = Depends(require_license("accounting")),
):
    return AccountingService.get_summary(db)

@router.post("/income", response_model=IncomeResponse)
def create_income(
    income: IncomeCreate,
    db: Session = Depends(get_db),
    current_user = Depends(require_role("dueño")),
    _ = Depends(require_license("accounting")),
):
    return AccountingService.create_income(db, income)

@router.get("/income", response_model=List[IncomeResponse])
def read_incomes(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user = Depends(require_role("dueño")),
    _ = Depends(require_license("accounting")),
):
    return AccountingService.get_incomes(db, skip=skip, limit=limit)

@router.delete("/income/{income_id}")
def delete_income(
    income_id: int,
    db: Session = Depends(get_db),
    current_user = Depends(require_role("dueño")),
    _ = Depends(require_license("accounting")),
):
    return AccountingService.delete_income(db, income_id)
