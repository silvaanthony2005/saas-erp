from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from pydantic import BaseModel
from app.core.database import get_db
from app.schemas.business import ProductCreate, ProductUpdate, ProductResponse, CategoryCreate, CategoryResponse
from app.services.inventory_service import InventoryService

router = APIRouter()

class PaginatedProducts(BaseModel):
    products: List[ProductResponse]
    total: int
    page: int
    page_size: int

@router.get("/products", response_model=PaginatedProducts)
def read_products(
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=1000),
    search: str = Query("", max_length=100),
    category_id: Optional[int] = Query(None, ge=1),
    db: Session = Depends(get_db)
):
    result = InventoryService.get_products(db, skip=skip, limit=limit, search=search, category_id=category_id)
    products = [ProductResponse.from_orm_with_category(p) for p in result["products"]]
    return PaginatedProducts(
        products=products,
        total=result["total"],
        page=(skip // limit) + 1,
        page_size=limit
    )

@router.post("/products", response_model=ProductResponse)
def create_product(product: ProductCreate, db: Session = Depends(get_db)):
    return InventoryService.create_product(db, product)

@router.get("/products/{product_id}", response_model=ProductResponse)
def read_product(product_id: int, db: Session = Depends(get_db)):
    product = InventoryService.get_product_by_id(db, product_id)
    return ProductResponse.from_orm_with_category(product)

@router.put("/products/{product_id}", response_model=ProductResponse)
def update_product(product_id: int, product: ProductUpdate, db: Session = Depends(get_db)):
    return InventoryService.update_product(db, product_id, product)

@router.delete("/products/{product_id}")
def delete_product(product_id: int, db: Session = Depends(get_db)):
    return InventoryService.delete_product(db, product_id)

@router.post("/categories", response_model=CategoryResponse)
def create_category(category: CategoryCreate, db: Session = Depends(get_db)):
    return InventoryService.create_category(db, category)

@router.get("/categories", response_model=List[CategoryResponse])
def read_categories(db: Session = Depends(get_db)):
    return InventoryService.get_categories(db)

@router.put("/categories/{category_id}", response_model=CategoryResponse)
def update_category(category_id: int, category: CategoryCreate, db: Session = Depends(get_db)):
    return InventoryService.update_category(db, category_id, category)

@router.delete("/categories/{category_id}")
def delete_category(category_id: int, db: Session = Depends(get_db)):
    return InventoryService.delete_category(db, category_id)
