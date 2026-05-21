from sqlalchemy import Column, Integer, String, Float, ForeignKey, DateTime, Date
from sqlalchemy.orm import relationship
from app.core.database import Base
import datetime

class Product(Base):
    __tablename__ = "products"
    
    id = Column(Integer, primary_key=True, index=True)
    sku = Column(String, unique=True, index=True)
    name = Column(String, index=True)
    description = Column(String, nullable=True)
    image_url = Column(String, nullable=True)
    cost_price_bs = Column(Float, default=0.0) # Costo en Bs (se calcula desde USD * tasa)
    sale_price_bs = Column(Float, default=0.0) # Venta en Bs (se calcula desde USD * tasa)
    cost_price_usd = Column(Float, default=0.0) # Costo ancla en USD
    sale_price_usd = Column(Float, default=0.0) # Precio de venta ancla en USD
    stock_quantity = Column(Integer, default=0)
    min_stock = Column(Integer, default=5)
    
    category_id = Column(Integer, ForeignKey("categories.id"))
    category = relationship("Category", back_populates="products")

class Customer(Base):
    __tablename__ = "customers"
    
    id = Column(Integer, primary_key=True, index=True)
    dni = Column(String, unique=True, index=True) # Cédula
    first_name = Column(String)
    last_name = Column(String)
    phone = Column(String, nullable=True)
    address = Column(String, nullable=True)
    category = Column(String, default="regular") # "regular" o "exclusive"
    credit_limit_usd = Column(Float, default=0.0) # Límite de crédito en USD (solo exclusivos)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    
    transactions = relationship("Transaction", back_populates="customer")

class Category(Base):
    __tablename__ = "categories"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, unique=True, index=True)
    products = relationship("Product", back_populates="category")

class Transaction(Base):
    __tablename__ = "transactions"
    
    id = Column(Integer, primary_key=True, index=True)
    timestamp = Column(DateTime, default=datetime.datetime.utcnow)
    type = Column(String) # "sale", "purchase", "adjustment"
    total_amount_bs = Column(Float, default=0.0) # Monto total en BS
    total_usd = Column(Float, default=0.0) # Monto total en USD (ancla)
    exchange_rate = Column(Float, nullable=True) # Tasa BCV al momento de la transacción
    payment_method = Column(String, default="Cash") # "Cash", "Transfer", "Card"
    status = Column(Integer, default=1) # 1: Active, 0: Canceled
    customer_id = Column(Integer, ForeignKey("customers.id"), nullable=True)
    
    customer = relationship("Customer", back_populates="transactions")
    details = relationship("TransactionDetail", back_populates="transaction")
    payments = relationship("SalePayment", back_populates="sale", cascade="all, delete-orphan")
    receivable = relationship("Receivable", back_populates="sale", uselist=False, cascade="all, delete-orphan")

class TransactionDetail(Base):
    __tablename__ = "transaction_details"
    
    id = Column(Integer, primary_key=True, index=True)
    transaction_id = Column(Integer, ForeignKey("transactions.id"))
    product_id = Column(Integer, ForeignKey("products.id"))
    quantity = Column(Integer)
    unit_price_bs = Column(Float) # Precio unitario en BS al momento de la venta
    unit_price_usd = Column(Float, default=0.0) # Precio unitario en USD al momento de la venta
    product_name = Column(String, nullable=True) # Snapshot del nombre en el momento de venta
    
    transaction = relationship("Transaction", back_populates="details")

class SalePayment(Base):
    __tablename__ = "sale_payments"

    id = Column(Integer, primary_key=True, index=True)
    sale_id = Column(Integer, ForeignKey("transactions.id"))
    payment_method = Column(String) # pos_debit, pos_credit, pago_movil, biopago, cash_usd, cash_bs
    amount_bs = Column(Float, default=0.0)
    amount_usd = Column(Float, nullable=True)
    reference_number = Column(String, nullable=True) # Nro de referencia (Pago Móvil)
    exchange_rate = Column(Float, nullable=True) # Tasa usada para este pago
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    sale = relationship("Transaction", back_populates="payments")

class Receivable(Base):
    __tablename__ = "receivables"

    id = Column(Integer, primary_key=True, index=True)
    sale_id = Column(Integer, ForeignKey("transactions.id"))
    customer_id = Column(Integer, ForeignKey("customers.id"))
    total_usd = Column(Float, default=0.0)
    remaining_usd = Column(Float, default=0.0)
    exchange_rate_at_sale = Column(Float, default=0.0)
    status = Column(String, default="pending") # pending, partially_paid, paid, cancelled
    due_date = Column(Date, nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    sale = relationship("Transaction", back_populates="receivable")
    customer = relationship("Customer")
    payments = relationship("ReceivablePayment", back_populates="receivable", cascade="all, delete-orphan")
    schedule_items = relationship("ReceivableSchedule", back_populates="receivable", cascade="all, delete-orphan")

class ReceivablePayment(Base):
    __tablename__ = "receivable_payments"

    id = Column(Integer, primary_key=True, index=True)
    receivable_id = Column(Integer, ForeignKey("receivables.id"))
    amount_usd = Column(Float, default=0.0)
    amount_bs = Column(Float, default=0.0)
    exchange_rate = Column(Float, default=0.0)
    payment_method = Column(String)
    reference_number = Column(String, nullable=True)
    payment_date = Column(DateTime, default=datetime.datetime.utcnow)

    receivable = relationship("Receivable", back_populates="payments")

class ReceivableSchedule(Base):
    __tablename__ = "receivable_schedules"

    id = Column(Integer, primary_key=True, index=True)
    receivable_id = Column(Integer, ForeignKey("receivables.id"))
    amount_usd = Column(Float)
    due_date = Column(Date)
    status = Column(String, default="pending") # pending, paid, overdue
    notes = Column(String, nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    receivable = relationship("Receivable", back_populates="schedule_items")
