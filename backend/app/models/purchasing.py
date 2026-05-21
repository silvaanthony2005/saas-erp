from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey, Date, Text
from sqlalchemy.orm import relationship
from app.core.database import Base
from app.models.core import User
import datetime

class Supplier(Base):
    __tablename__ = "suppliers"

    id = Column(Integer, primary_key=True, index=True)
    company_name = Column(String, index=True)
    contact_name = Column(String, nullable=True)
    email = Column(String, nullable=True)
    phone = Column(String, nullable=True)
    address = Column(String, nullable=True)
    dni_rif = Column(String, unique=True, index=True)
    is_active = Column(Integer, default=1)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    created_by = Column(Integer, ForeignKey("users.id"), nullable=True)

    purchase_invoices = relationship("PurchaseInvoice", back_populates="supplier")
    creator = relationship("User", foreign_keys=[created_by])

class PurchaseInvoice(Base):
    __tablename__ = "purchase_invoices"

    id = Column(Integer, primary_key=True, index=True)
    invoice_number = Column(String, index=True)
    supplier_id = Column(Integer, ForeignKey("suppliers.id"))
    subtotal_bs = Column(Float, default=0.0)
    tax_bs = Column(Float, default=0.0)
    total_bs = Column(Float, default=0.0)
    exchange_rate = Column(Float, nullable=True)
    payment_type = Column(String, default="cash")
    status = Column(String, default="active")
    invoice_date = Column(Date, nullable=True)
    due_date = Column(Date, nullable=True)
    notes = Column(String, nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    created_by = Column(Integer, ForeignKey("users.id"), nullable=True)

    supplier = relationship("Supplier", back_populates="purchase_invoices")
    creator = relationship("User", foreign_keys=[created_by])
    details = relationship("PurchaseInvoiceDetail", back_populates="purchase_invoice", cascade="all, delete-orphan")
    accounts_payable = relationship("AccountsPayable", back_populates="purchase_invoice", uselist=False, cascade="all, delete-orphan")

class PurchaseInvoiceDetail(Base):
    __tablename__ = "purchase_invoice_details"

    id = Column(Integer, primary_key=True, index=True)
    purchase_invoice_id = Column(Integer, ForeignKey("purchase_invoices.id"))
    product_id = Column(Integer, ForeignKey("products.id"))
    quantity = Column(Integer)
    unit_cost_bs = Column(Float)
    subtotal_bs = Column(Float)

    purchase_invoice = relationship("PurchaseInvoice", back_populates="details")
    product = relationship("Product")

class AccountsPayable(Base):
    __tablename__ = "accounts_payable"

    id = Column(Integer, primary_key=True, index=True)
    purchase_invoice_id = Column(Integer, ForeignKey("purchase_invoices.id"), unique=True)
    total_amount_bs = Column(Float)
    remaining_balance_bs = Column(Float)
    due_date = Column(Date, nullable=True)
    status = Column(String, default="pending")
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    purchase_invoice = relationship("PurchaseInvoice", back_populates="accounts_payable")
    payment_schedules = relationship("PaymentSchedule", back_populates="accounts_payable", cascade="all, delete-orphan")

class PaymentSchedule(Base):
    __tablename__ = "payment_schedules"

    id = Column(Integer, primary_key=True, index=True)
    accounts_payable_id = Column(Integer, ForeignKey("accounts_payable.id"))
    amount_bs = Column(Float)
    payment_date = Column(DateTime, nullable=True)
    payment_method = Column(String, default="Cash")
    notes = Column(String, nullable=True)
    is_paid = Column(Integer, default=0)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    created_by = Column(Integer, ForeignKey("users.id"), nullable=True)

    accounts_payable = relationship("AccountsPayable", back_populates="payment_schedules")
    creator = relationship("User", foreign_keys=[created_by])

class InventoryMovement(Base):
    __tablename__ = "inventory_movements"

    id = Column(Integer, primary_key=True, index=True)
    product_id = Column(Integer, ForeignKey("products.id"))
    movement_type = Column(String)
    quantity = Column(Integer)
    unit_cost_bs = Column(Float)
    total_cost_bs = Column(Float)
    reference_type = Column(String)
    reference_id = Column(Integer, nullable=True)
    remaining_quantity = Column(Integer, nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    created_by = Column(Integer, ForeignKey("users.id"), nullable=True)

    product = relationship("Product")
    creator = relationship("User", foreign_keys=[created_by])

class CostingConfig(Base):
    __tablename__ = "costing_config"

    id = Column(Integer, primary_key=True, index=True)
    method = Column(String, default="weighted_average")
    updated_at = Column(DateTime, default=datetime.datetime.utcnow)
