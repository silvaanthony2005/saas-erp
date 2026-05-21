from sqlalchemy.orm import Session
from app.models.hr import Employee, Payroll
from app.models.accounting import Expense
from app.schemas.hr import EmployeeCreate, PayrollCreate
from app.services.accounting_service import AccountingService
from fastapi import HTTPException

class HRService:
    @staticmethod
    def create_employee(db: Session, employee_data: EmployeeCreate, current_user=None):
        user_id = current_user.id if current_user else None
        emp_data = employee_data.model_dump()
        emp_data["created_by"] = user_id
        db_employee = Employee(**emp_data)
        db.add(db_employee)
        db.commit()
        db.refresh(db_employee)
        return db_employee

    @staticmethod
    def get_employees(db: Session, skip: int = 0, limit: int = 100):
        return db.query(Employee).offset(skip).limit(limit).all()

    @staticmethod
    def process_payroll(db: Session, payroll_data: PayrollCreate, current_user=None):
        user_id = current_user.id if current_user else None
        employee = db.query(Employee).filter(Employee.id == payroll_data.employee_id).first()
        if not employee:
            raise HTTPException(status_code=404, detail="Employee not found")
        
        gross_salary = employee.base_salary
        net_salary = gross_salary - payroll_data.deductions
        
        payroll_dict = payroll_data.model_dump()
        payroll_dict["created_by"] = user_id
        db_payroll = Payroll(
            **payroll_dict,
            gross_salary=gross_salary,
            net_salary=net_salary
        )
        
        db.add(db_payroll)
        db.commit()
        db.refresh(db_payroll)
        
        db_expense = Expense(
            description=f"Pago Nómina: {employee.first_name} {employee.last_name}",
            amount_bs=net_salary,
            category="salary",
            created_by=user_id
        )
        db.add(db_expense)
        db.flush()

        AccountingService.register_entry(
            db,
            entry_type="expense",
            amount_bs=net_salary,
            description=f"Pago Nómina: {employee.first_name} {employee.last_name}",
            reference_id=db_payroll.id,
            category="salary",
            current_user=current_user
        )
        
        return db_payroll
