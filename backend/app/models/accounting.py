from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey
from backend.app.core.database import Base
import datetime

class Expense(Base):
    __tablename__ = "expenses"
    
    id = Column(Integer, primary_key=True, index=True)
    description = Column(String, index=True)
    amount = Column(Float)
    category = Column(String) # rent, utilities, salary, etc.
    timestamp = Column(DateTime, default=datetime.datetime.utcnow)

class AccountingEntry(Base):
    __tablename__ = "accounting_entries"
    
    id = Column(Integer, primary_key=True, index=True)
    entry_type = Column(String) # "income" (venta) or "expense" (gasto)
    amount = Column(Float)
    description = Column(String)
    timestamp = Column(DateTime, default=datetime.datetime.utcnow)
    reference_id = Column(Integer, nullable=True) # ID de la venta o gasto relacionado
