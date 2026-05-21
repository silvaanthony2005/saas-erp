from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime

class SaleDetailBase(BaseModel):
    product_id: int
    quantity: int
    unit_price_bs: float
    unit_price_usd: float = 0.0

class SaleDetailCreate(SaleDetailBase):
    pass

class SaleDetailResponse(SaleDetailBase):
    id: int
    product_name: Optional[str] = None
    class Config:
        from_attributes = True

class PaymentCreate(BaseModel):
    payment_method: str
    amount_bs: float
    amount_usd: Optional[float] = None
    reference_number: Optional[str] = None
    exchange_rate: Optional[float] = None

class PaymentResponse(BaseModel):
    id: int
    payment_method: str
    amount_bs: float
    amount_usd: Optional[float] = None
    reference_number: Optional[str] = None
    exchange_rate: Optional[float] = None
    created_at: datetime
    class Config:
        from_attributes = True

class SaleCreate(BaseModel):
    details: List[SaleDetailCreate]
    payments: Optional[List[PaymentCreate]] = None
    customer_id: Optional[int] = None
    is_credit: bool = False
    payment_method: Optional[str] = None

class SaleResponse(BaseModel):
    id: int
    timestamp: datetime
    total_amount_bs: float
    total_usd: float
    exchange_rate: Optional[float] = None
    payment_method: str
    customer_name: Optional[str] = None
    customer_dni: Optional[str] = None
    customer_category: Optional[str] = None
    details: List[SaleDetailResponse]
    payments: List[PaymentResponse] = []
    class Config:
        from_attributes = True

class ReceivableResponse(BaseModel):
    id: int
    sale_id: int
    customer_id: int
    customer_name: Optional[str] = None
    customer_dni: Optional[str] = None
    total_usd: float
    remaining_usd: float
    exchange_rate_at_sale: float
    status: str
    due_date: Optional[str] = None
    created_at: Optional[datetime] = None
    class Config:
        from_attributes = True

class ReceivablePaymentResponse(BaseModel):
    id: int
    amount_usd: float
    amount_bs: float
    exchange_rate: float
    payment_method: str
    reference_number: Optional[str] = None
    payment_date: datetime
    class Config:
        from_attributes = True

class PaymentRequest(BaseModel):
    amount_bs: float
    payment_method: str = "cash"
    reference_number: Optional[str] = None

class ScheduleInstallmentInput(BaseModel):
    amount_usd: float
    due_date: str  # YYYY-MM-DD
    notes: Optional[str] = None

class ReceivableScheduleSetup(BaseModel):
    installments: List[ScheduleInstallmentInput]

class ReceivableScheduleResponse(BaseModel):
    id: int
    amount_usd: float
    due_date: str
    status: str
    notes: Optional[str] = None
