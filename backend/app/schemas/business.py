from pydantic import BaseModel
from typing import Optional

class ProductBase(BaseModel):
    sku: str
    name: str
    description: Optional[str] = None
    image_url: Optional[str] = None
    cost_price_bs: float
    sale_price_bs: float
    stock_quantity: int
    min_stock: int = 5
    category_id: int

class ProductCreate(ProductBase):
    pass

class ProductUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    image_url: Optional[str] = None
    cost_price_bs: Optional[float] = None
    sale_price_bs: Optional[float] = None
    stock_quantity: Optional[int] = None
    min_stock: Optional[int] = None

class ProductResponse(ProductBase):
    id: int
    category_name: Optional[str] = None
    
    class Config:
        from_attributes = True

    @classmethod
    def from_orm_with_category(cls, product):
        data = cls.model_validate(product).model_dump()
        data["category_name"] = product.category.name if product.category else None
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

class CustomerCreate(CustomerBase):
    pass

class CustomerResponse(CustomerBase):
    id: int
    created_at: str
    class Config:
        from_attributes = True
