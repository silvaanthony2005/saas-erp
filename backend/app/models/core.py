from sqlalchemy import Column, Integer, String, Boolean, DateTime
from backend.app.core.database import Base
import datetime

class License(Base):
    __tablename__ = "license"
    
    id = Column(Integer, primary_key=True, index=True)
    hwid = Column(String, unique=True, index=True)
    license_key = Column(String, nullable=True)
    install_date = Column(DateTime, default=datetime.datetime.utcnow)
    is_active = Column(Boolean, default=False)
    has_pos_module = Column(Boolean, default=True)
    has_inventory_module = Column(Boolean, default=True)
    has_hr_module = Column(Boolean, default=False)

class User(Base):
    __tablename__ = "users"
    
    id = Column(Integer, primary_key=True, index=True)
    username = Column(String, unique=True, index=True)
    hashed_password = Column(String)
    is_active = Column(Boolean, default=True)
    role = Column(String, default="admin") # admin, cashier, inventory
