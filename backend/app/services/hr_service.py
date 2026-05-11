from sqlalchemy.orm import Session
from app.models.hr import Employee, Payroll
from app.schemas.hr import EmployeeCreate, PayrollCreate
from app.services.accounting_service import AccountingService
from fastapi import HTTPException

class HRService:
    @staticmethod
    def create_employee(db: Session, employee_data: EmployeeCreate):
        db_employee = Employee(**employee_data.dict())
        db.add(db_employee)
        db.commit()
        db.refresh(db_employee)
        return db_employee

    @staticmethod
    def get_employees(db: Session, skip: int = 0, limit: int = 100):
        return db.query(Employee).offset(skip).limit(limit).all()

    @staticmethod
    def process_payroll(db: Session, payroll_data: PayrollCreate):
        employee = db.query(Employee).filter(Employee.id == payroll_data.employee_id).first()
        if not employee:
            raise HTTPException(status_code=404, detail="Employee not found")
        
        gross_salary = employee.base_salary
        net_salary = gross_salary - payroll_data.deductions
        
        db_payroll = Payroll(
            **payroll_data.dict(),
            gross_salary=gross_salary,
            net_salary=net_salary
        )
        
        db.add(db_payroll)
        db.commit()
        db.refresh(db_payroll)
        
        # Registrar como gasto en contabilidad automáticamente
        AccountingService.register_entry(
            db,
            entry_type="expense",
            amount=net_salary,
            description=f"Pago Nómina: {employee.first_name} {employee.last_name}",
            reference_id=db_payroll.id
        )
        
        return db_payroll
