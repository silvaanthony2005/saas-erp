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
    class Config:
        from_attributes = True

class SaleBase(BaseModel):
    total_amount: float

class SaleCreate(BaseModel):
    details: List[SaleDetailCreate]

class SaleResponse(SaleBase):
    id: int
    timestamp: datetime
    details: List[SaleDetailResponse]
    class Config:
        from_attributes = True
