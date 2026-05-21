from pydantic import BaseModel, field_validator
from typing import Optional, List
from datetime import date, datetime

class SupplierBase(BaseModel):
    company_name: str
    contact_name: Optional[str] = None
    email: Optional[str] = None
    phone: Optional[str] = None
    address: Optional[str] = None
    dni_rif: str

class SupplierCreate(SupplierBase):
    pass

class SupplierResponse(SupplierBase):
    id: int
    is_active: int
    created_at: datetime

    class Config:
        from_attributes = True

class PurchaseInvoiceDetailCreate(BaseModel):
    product_id: int
    quantity: int
    unit_cost_bs: float

class PurchaseInvoiceDetailResponse(BaseModel):
    id: int
    product_id: int
    product_name: Optional[str] = None
    quantity: int
    unit_cost_bs: float
    subtotal_bs: float

    class Config:
        from_attributes = True

class PurchaseInvoiceCreate(BaseModel):
    invoice_number: str
    supplier_id: int
    subtotal_bs: float
    tax_bs: float = 0.0
    total_bs: float
    exchange_rate: Optional[float] = None
    payment_type: str = "cash"
    invoice_date: Optional[str] = None
    due_date: Optional[str] = None
    notes: Optional[str] = None
    details: List[PurchaseInvoiceDetailCreate]

class PurchaseInvoiceResponse(BaseModel):
    id: int
    invoice_number: str
    supplier_id: int
    supplier_name: Optional[str] = None
    subtotal_bs: float
    tax_bs: float
    total_bs: float
    exchange_rate: Optional[float] = None
    payment_type: str
    status: str
    invoice_date: Optional[str] = None
    due_date: Optional[str] = None
    notes: Optional[str] = None
    created_at: datetime
    created_by_name: Optional[str] = None
    details: List[PurchaseInvoiceDetailResponse] = []
    class Config:
        from_attributes = True

    @field_validator("invoice_date", "due_date", mode="before")
    @classmethod
    def coerce_date_to_str(cls, v):
        if isinstance(v, date):
            return v.isoformat()
        return v

class AccountsPayableResponse(BaseModel):
    id: int
    purchase_invoice_id: int
    invoice_number: Optional[str] = None
    supplier_name: Optional[str] = None
    total_amount_bs: float
    remaining_balance_bs: float
    due_date: Optional[str] = None
    status: str
    created_at: datetime

    class Config:
        from_attributes = True

    @field_validator("due_date", mode="before")
    @classmethod
    def coerce_date_to_str(cls, v):
        if isinstance(v, date):
            return v.isoformat()
        return v

class PaymentScheduleCreate(BaseModel):
    accounts_payable_id: int
    amount_bs: float
    payment_date: Optional[str] = None
    payment_method: str = "Cash"
    notes: Optional[str] = None

class PaymentScheduleResponse(BaseModel):
    id: int
    accounts_payable_id: int
    amount_bs: float
    payment_date: Optional[datetime] = None
    payment_method: str
    notes: Optional[str] = None
    is_paid: int
    created_at: datetime

    class Config:
        from_attributes = True

class InventoryMovementResponse(BaseModel):
    id: int
    product_id: int
    product_name: Optional[str] = None
    movement_type: str
    quantity: int
    unit_cost_bs: float
    total_cost_bs: float
    reference_type: str
    reference_id: Optional[int] = None
    created_at: datetime

    class Config:
        from_attributes = True

class CostingConfigResponse(BaseModel):
    method: str
    updated_at: datetime

    class Config:
        from_attributes = True

class CostingConfigUpdate(BaseModel):
    method: str
