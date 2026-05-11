from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey, Date, Boolean
from sqlalchemy.orm import relationship
from app.core.database import Base
import datetime

class Employee(Base):
    __tablename__ = "employees"
    
    id = Column(Integer, primary_key=True, index=True)
    first_name = Column(String, index=True)
    last_name = Column(String, index=True)
    email = Column(String, unique=True, index=True)
    phone = Column(String, nullable=True)
    hire_date = Column(Date, default=datetime.date.today)
    position = Column(String)
    base_salary = Column(Float)
    is_active = Column(Boolean, default=True)
    
    payrolls = relationship("Payroll", back_populates="employee")

class Payroll(Base):
    __tablename__ = "payrolls"
    
    id = Column(Integer, primary_key=True, index=True)
    employee_id = Column(Integer, ForeignKey("employees.id"))
    pay_period_start = Column(Date)
    pay_period_end = Column(Date)
    gross_salary = Column(Float)
    deductions = Column(Float, default=0.0)
    net_salary = Column(Float)
    payment_date = Column(DateTime, default=datetime.datetime.utcnow)
    status = Column(String, default="paid") # paid, pending
    
    employee = relationship("Employee", back_populates="payrolls")
