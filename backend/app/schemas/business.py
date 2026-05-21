from pydantic import BaseModel
from typing import Optional

class ProductBase(BaseModel):
    sku: str
    name: str
    description: Optional[str] = None
    image_url: Optional[str] = None
    cost_price_usd: float = 0.0
    sale_price_usd: float = 0.0
    stock_quantity: int
    min_stock: int = 5
    category_id: int

class ProductCreate(ProductBase):
    pass

class ProductUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    image_url: Optional[str] = None
    cost_price_usd: Optional[float] = None
    sale_price_usd: Optional[float] = None
    stock_quantity: Optional[int] = None
    min_stock: Optional[int] = None

class ProductResponse(ProductBase):
    id: int
    category_name: Optional[str] = None
    cost_price_bs: float = 0.0
    sale_price_bs: float = 0.0

    class Config:
        from_attributes = True

    @classmethod
    def from_orm_with_category(cls, product):
        data = cls.model_validate(product).model_dump()
        data["category_name"] = product.category.name if product.category else None
        data["cost_price_bs"] = product.cost_price_bs or 0.0
        data["sale_price_bs"] = product.sale_price_bs or 0.0
        return cls(**data)

class CategoryBase(BaseModel):
    name: str

class CategoryCreate(CategoryBase):
    pass

class CategoryResponse(CategoryBase):
    id: int
    class Config:
        from_attributes = True

class CustomerBase(BaseModel):
    dni: str
    first_name: str
    last_name: str
    phone: Optional[str] = None
    address: Optional[str] = None
    category: str = "regular"
    credit_limit_usd: float = 0.0

class CustomerCreate(CustomerBase):
    pass

class CustomerResponse(CustomerBase):
    id: int
    created_at: str
    created_by_name: Optional[str] = None
    class Config:
        from_attributes = True
