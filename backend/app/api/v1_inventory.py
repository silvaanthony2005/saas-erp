from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from backend.app.core.database import get_db
from backend.app.schemas.business import ProductCreate, ProductUpdate, ProductResponse, CategoryCreate, CategoryResponse
from backend.app.services.inventory_service import InventoryService

router = APIRouter()

@router.get("/products", response_model=List[ProductResponse])
def read_products(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    return InventoryService.get_products(db, skip=skip, limit=limit)

@router.post("/products", response_model=ProductResponse)
def create_product(product: ProductCreate, db: Session = Depends(get_db)):
    return InventoryService.create_product(db, product)

@router.put("/products/{product_id}", response_model=ProductResponse)
def update_product(product_id: int, product: ProductUpdate, db: Session = Depends(get_db)):
    return InventoryService.update_product(db, product_id, product)

@router.delete("/products/{product_id}")
def delete_product(product_id: int, db: Session = Depends(get_db)):
    return InventoryService.delete_product(db, product_id)

@router.post("/categories", response_model=CategoryResponse)
def create_category(category: CategoryCreate, db: Session = Depends(get_db)):
    return InventoryService.create_category(db, category)
