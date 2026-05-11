from pydantic import BaseModel, EmailStr
from datetime import date, datetime
from typing import List, Optional

class EmployeeBase(BaseModel):
    first_name: str
    last_name: str
    email: EmailStr
    phone: Optional[str] = None
    position: str
    base_salary: float

class EmployeeCreate(EmployeeBase):
    hire_date: Optional[date] = None

class EmployeeResponse(EmployeeBase):
    id: int
    hire_date: date
    is_active: bool
    class Config:
        from_attributes = True

class PayrollBase(BaseModel):
    employee_id: int
    pay_period_start: date
    pay_period_end: date
    deductions: float = 0.0

class PayrollCreate(PayrollBase):
    pass

class PayrollResponse(PayrollBase):
    id: int
    gross_salary: float
    net_salary: float
    payment_date: datetime
    status: str
    class Config:
        from_attributes = True
