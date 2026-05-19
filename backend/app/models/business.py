from sqlalchemy import Column, Integer, String, Float, ForeignKey, DateTime
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
    cost_price_bs = Column(Float, default=0.0) # Costo en Bs
    sale_price_bs = Column(Float, default=0.0) # Venta en Bs
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
    exchange_rate = Column(Float, nullable=True) # Tasa BCV al momento de la transacción
    payment_method = Column(String, default="Cash") # "Cash", "Transfer", "Card"
    status = Column(Integer, default=1) # 1: Active, 0: Canceled
    customer_id = Column(Integer, ForeignKey("customers.id"), nullable=True)
    
    customer = relationship("Customer", back_populates="transactions")
    details = relationship("TransactionDetail", back_populates="transaction")

class TransactionDetail(Base):
    __tablename__ = "transaction_details"
    
    id = Column(Integer, primary_key=True, index=True)
    transaction_id = Column(Integer, ForeignKey("transactions.id"))
    product_id = Column(Integer, ForeignKey("products.id"))
    quantity = Column(Integer)
    unit_price_bs = Column(Float) # Precio unitario en BS al momento de la venta
    product_name = Column(String, nullable=True) # Snapshot del nombre en el momento de venta
    
    transaction = relationship("Transaction", back_populates="details")
