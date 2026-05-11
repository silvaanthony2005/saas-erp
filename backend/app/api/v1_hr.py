from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from app.core.database import get_db
from app.schemas.hr import EmployeeCreate, EmployeeResponse, PayrollCreate, PayrollResponse
from app.services.hr_service import HRService

router = APIRouter()

@router.post("/employees", response_model=EmployeeResponse)
def create_employee(employee: EmployeeCreate, db: Session = Depends(get_db)):
    return HRService.create_employee(db, employee)

@router.get("/employees", response_model=List[EmployeeResponse])
def read_employees(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    return HRService.get_employees(db, skip=skip, limit=limit)

@router.post("/payroll", response_model=PayrollResponse)
def process_payroll(payroll: PayrollCreate, db: Session = Depends(get_db)):
    return HRService.process_payroll(db, payroll)
