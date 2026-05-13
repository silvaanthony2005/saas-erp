from sqlalchemy.orm import Session
from fastapi import HTTPException
from app.models.business import Transaction, TransactionDetail, Product, Customer
from app.models.accounting import AccountingEntry
from app.schemas.sales import SaleCreate
from app.services.inventory_service import InventoryService


class SalesService:
    @staticmethod
    def create_sale(db: Session, sale_data: SaleCreate):
        try:
            total_amount = 0.0
            details_to_create = []

            # Validar cliente si se proporciona
            if sale_data.customer_id:
                customer = db.query(Customer).filter(Customer.id == sale_data.customer_id).first()
                if not customer:
                    raise HTTPException(status_code=404, detail="Customer not found")
            
            for item in sale_data.details:
                product = db.query(Product).filter(Product.id == item.product_id).with_for_update().first()
                if not product:
                    raise HTTPException(status_code=404, detail=f"Product with id {item.product_id} not found")
                
                if product.stock_quantity < item.quantity:
                    raise HTTPException(
                        status_code=400, 
                        detail=f"Insufficient stock for product {product.name}. Available: {product.stock_quantity}"
                    )
                
                product.stock_quantity -= item.quantity
                
                line_total = item.unit_price * item.quantity
                total_amount += line_total
                
                details_to_create.append(
                    TransactionDetail(
                        product_id=item.product_id,
                        quantity=item.quantity,
                        unit_price=item.unit_price,
                        product_name=product.name
                    )
                )

            db_sale = Transaction(
                type="sale",
                total_amount=total_amount,
                payment_method=sale_data.payment_method or "Cash",
                customer_id=sale_data.customer_id,
                details=details_to_create
            )
            db.add(db_sale)
            db.flush()

            income_entry = AccountingEntry(
                entry_type="income",
                amount=total_amount,
                description=f"Venta #{db_sale.id} ({db_sale.payment_method})",
                category="Ventas",
                reference_id=db_sale.id
            )
            db.add(income_entry)
            db.commit()
            db.refresh(db_sale)
            return db_sale
        except Exception as e:
            db.rollback()
            if isinstance(e, HTTPException):
                raise e
            raise HTTPException(status_code=500, detail=f"Transaction failed and rolled back: {str(e)}")

    @staticmethod
    def get_sales(db: Session, skip: int = 0, limit: int = 100):
        sales = db.query(Transaction).filter(Transaction.type == "sale").order_by(Transaction.timestamp.desc()).offset(skip).limit(limit).all()
        for s in sales:
            if s.customer:
                s.customer_name = f"{s.customer.first_name} {s.customer.last_name}"
                s.customer_dni = s.customer.dni
        return sales

    @staticmethod
    def get_sale_by_id(db: Session, sale_id: int):
        sale = db.query(Transaction).filter(Transaction.id == sale_id, Transaction.type == "sale").first()
        if sale and sale.customer:
            sale.customer_name = f"{sale.customer.first_name} {sale.customer.last_name}"
            sale.customer_dni = sale.customer.dni
        return sale
