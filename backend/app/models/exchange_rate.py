from sqlalchemy import Column, Integer, Float, DateTime, String
from app.core.database import Base
import datetime

class ExchangeRate(Base):
    __tablename__ = "exchange_rates"
    
    id = Column(Integer, primary_key=True, index=True)
    currency_from = Column(String, default="USD")
    currency_to = Column(String, default="VES")
    rate = Column(Float, nullable=False)
    source = Column(String, default="BCV") # "BCV", "Manual"
    updated_at = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)
