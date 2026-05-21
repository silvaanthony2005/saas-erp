from pydantic import BaseModel
from datetime import datetime
from typing import List, Optional

class ExpenseBase(BaseModel):
    description: str
    amount_bs: float
    category: str

class ExpenseCreate(ExpenseBase):
    pass

class ExpenseResponse(ExpenseBase):
    id: int
    timestamp: datetime
    created_by_name: Optional[str] = None
    class Config:
        from_attributes = True

class IncomeBase(BaseModel):
    description: str
    amount_bs: float
    category: str

class IncomeCreate(IncomeBase):
    pass

class IncomeResponse(IncomeBase):
    id: int
    timestamp: datetime
    class Config:
        from_attributes = True

class FinancialSummary(BaseModel):
    total_income_bs: float
    total_expenses_bs: float
    net_profit_bs: float
    period_start: Optional[datetime] = None
    period_end: Optional[datetime] = None
