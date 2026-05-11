from sqlalchemy.orm import Session
from backend.app.models.business import Product, Category
from backend.app.schemas.business import ProductCreate, CategoryCreate, ProductUpdate
from fastapi import HTTPException

class InventoryService:
    @staticmethod
    def get_products(db: Session, skip: int = 0, limit: int = 100):
        return db.query(Product).offset(skip).limit(limit).all()

    @staticmethod
    def create_product(db: Session, product: ProductCreate):
        db_product = Product(**product.dict())
        db.add(db_product)
        db.commit()
        db.refresh(db_product)
        return db_product

    @staticmethod
    def update_stock(db: Session, product_id: int, quantity_change: int):
        product = db.query(Product).filter(Product.id == product_id).first()
        if product:
            product.stock_quantity += quantity_change
            db.commit()
            db.refresh(product)
        return product

    @staticmethod
    def create_category(db: Session, category: CategoryCreate):
        db_category = Category(name=category.name)
        db.add(db_category)
        db.commit()
        db.refresh(db_category)
        return db_category

    @staticmethod
    def get_product_by_id(db: Session, product_id: int):
        return db.query(Product).filter(Product.id == product_id).first()

    @staticmethod
    def update_product(db: Session, product_id: int, product: ProductUpdate):
        db_product = db.query(Product).filter(Product.id == product_id).first()
        if not db_product:
            raise HTTPException(status_code=404, detail="Producto no encontrado")
        update_data = product.dict(exclude_unset=True)
        for key, value in update_data.items():
            setattr(db_product, key, value)
        db.commit()
        db.refresh(db_product)
        return db_product

    @staticmethod
    def delete_product(db: Session, product_id: int):
        db_product = db.query(Product).filter(Product.id == product_id).first()
        if not db_product:
            raise HTTPException(status_code=404, detail="Producto no encontrado")
        db.delete(db_product)
        db.commit()
        return {"message": "Producto eliminado"}
