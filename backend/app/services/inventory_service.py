from sqlalchemy.orm import Session
from app.models.business import Product, Category
from app.schemas.business import ProductCreate, CategoryCreate, ProductUpdate
from app.services.accounting_service import AccountingService
from fastapi import HTTPException

class InventoryService:
    @staticmethod
    def get_products(db: Session, skip: int = 0, limit: int = 100, search: str = "", category_id: int = None):
        query = db.query(Product)
        if search:
            query = query.filter(
                Product.name.ilike(f"%{search}%") | Product.sku.ilike(f"%{search}%")
            )
        if category_id:
            query = query.filter(Product.category_id == category_id)
        total = query.count()
        products = query.order_by(Product.name).offset(skip).limit(limit).all()
        return {"products": products, "total": total}

    @staticmethod
    def create_product(db: Session, product: ProductCreate):
        db_product = Product(**product.model_dump())
        db.add(db_product)
        db.commit()
        db.refresh(db_product)
        
        # Registrar automáticamente el costo de adquisición en contabilidad
        total_cost_bs = db_product.cost_price_bs * db_product.stock_quantity
        if total_cost_bs > 0:
            AccountingService.register_entry(
                db,
                entry_type="expense",
                amount_bs=total_cost_bs,
                description=f"Adquisición inicial de inventario: {db_product.name} ({db_product.stock_quantity} unidades)",
                category="Inventory",
                reference_id=db_product.id
            )
        
        return db_product

    @staticmethod
    def update_stock(db: Session, product_id: int, quantity_change: int):
        product = db.query(Product).filter(Product.id == product_id).first()
        if product:
            product.stock_quantity += quantity_change
            
            # Si es un incremento de stock (compra/entrada), registrar como gasto
            if quantity_change > 0:
                total_cost_bs = product.cost_price_bs * quantity_change
                if total_cost_bs > 0:
                    AccountingService.register_entry(
                        db,
                        entry_type="expense",
                        amount_bs=total_cost_bs,
                        description=f"Ajuste de entrada de inventario: {product.name} (+{quantity_change} unidades)",
                        category="Inventory",
                        reference_id=product.id
                    )
            
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
        update_data = product.model_dump(exclude_unset=True)
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

    @staticmethod
    def get_categories(db: Session):
        return db.query(Category).order_by(Category.name).all()

    @staticmethod
    def update_category(db: Session, category_id: int, category_data: CategoryCreate):
        db_category = db.query(Category).filter(Category.id == category_id).first()
        if not db_category:
            raise HTTPException(status_code=404, detail="Categoría no encontrada")
        db_category.name = category_data.name
        db.commit()
        db.refresh(db_category)
        return db_category

    @staticmethod
    def delete_category(db: Session, category_id: int):
        # Primero verificamos si hay productos usando esta categoría
        products_count = db.query(Product).filter(Product.category_id == category_id).count()
        if products_count > 0:
            raise HTTPException(
                status_code=400, 
                detail=f"No se puede eliminar la categoría porque tiene {products_count} productos asociados."
            )
        
        db_category = db.query(Category).filter(Category.id == category_id).first()
        if not db_category:
            raise HTTPException(status_code=404, detail="Categoría no encontrada")
        
        db.delete(db_category)
        db.commit()
        return {"message": "Categoría eliminada con éxito"}
