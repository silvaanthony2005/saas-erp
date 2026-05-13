from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime

class SaleDetailBase(BaseModel):
    product_id: int
    quantity: int
    unit_price: float

class SaleDetailCreate(SaleDetailBase):
    pass

class SaleDetailResponse(SaleDetailBase):
    id: int
    product_name: Optional[str] = None
    class Config:
        from_attributes = True

class SaleBase(BaseModel):
    total_amount: float
    payment_method: Optional[str] = "Cash"

class SaleCreate(BaseModel):
    details: List[SaleDetailCreate]
    payment_method: Optional[str] = "Cash"
    customer_id: Optional[int] = None

class SaleResponse(SaleBase):
    id: int
    timestamp: datetime
    customer_name: Optional[str] = None
    customer_dni: Optional[str] = None
    details: List[SaleDetailResponse]
    class Config:
        from_attributes = True
