from sqlalchemy.orm import Session
from fastapi import HTTPException
from backend.app.models.business import Transaction, TransactionDetail, Product
from backend.app.schemas.sales import SaleCreate
from backend.app.services.inventory_service import InventoryService

class SalesService:
    @staticmethod
    def create_sale(db: Session, sale_data: SaleCreate):
        try:
            # 1. Calcular total y validar stock
            total_amount = 0.0
            details_to_create = []
            
            for item in sale_data.details:
                # Usar with_for_update() para bloquear la fila si fuera una DB concurrente (en SQLite previene race conditions básicas)
                product = db.query(Product).filter(Product.id == item.product_id).with_for_update().first()
                if not product:
                    raise HTTPException(status_code=404, detail=f"Product with id {item.product_id} not found")
                
                if product.stock_quantity < item.quantity:
                    raise HTTPException(
                        status_code=400, 
                        detail=f"Insufficient stock for product {product.name}. Available: {product.stock_quantity}"
                    )
                
                # Descontar stock directamente aquí para estar dentro de la misma transacción
                product.stock_quantity -= item.quantity
                
                line_total = item.unit_price * item.quantity
                total_amount += line_total
                
                details_to_create.append(
                    TransactionDetail(
                        product_id=item.product_id,
                        quantity=item.quantity,
                        unit_price=item.unit_price
                    )
                )

            # 2. Crear la transacción (Venta)
            db_sale = Transaction(
                type="sale",
                total_amount=total_amount,
                details=details_to_create
            )
            
            db.add(db_sale)
            # 3. Hacer COMMIT de TODO el bloque. 
            # Si algo falla antes de aquí, la DB no guarda nada (Atomicidad)
            db.commit()
            db.refresh(db_sale)
            return db_sale
        except Exception as e:
            # Si hay CUALQUIER error (pago rechazado, error de red, fallo de stock),
            # hacemos ROLLBACK para revertir cambios en stock y transacciones.
            db.rollback()
            if isinstance(e, HTTPException):
                raise e
            raise HTTPException(status_code=500, detail=f"Transaction failed and rolled back: {str(e)}")

    @staticmethod
    def get_sales(db: Session, skip: int = 0, limit: int = 100):
        return db.query(Transaction).filter(Transaction.type == "sale").offset(skip).limit(limit).all()

    @staticmethod
    def get_sale_by_id(db: Session, sale_id: int):
        return db.query(Transaction).filter(Transaction.id == sale_id, Transaction.type == "sale").first()
