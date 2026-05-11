import pytest
from datetime import date
from fastapi import HTTPException
from backend.app.models.hr import Employee
from backend.app.models.accounting import AccountingEntry
from backend.app.schemas.hr import EmployeeCreate, PayrollCreate
from backend.app.services.hr_service import HRService


def seed_employee(session):
    employee = Employee(
        first_name="Marta",
        last_name="Perez",
        email="marta@example.com",
        position="Analista",
        base_salary=1000.0,
    )
    session.add(employee)
    session.commit()
    session.refresh(employee)
    return employee


def test_process_payroll_success(session):
    employee = seed_employee(session)
    payroll_data = PayrollCreate(
        employee_id=employee.id,
        pay_period_start=date(2026, 5, 1),
        pay_period_end=date(2026, 5, 15),
        deductions=100.0,
    )
    payroll = HRService.process_payroll(session, payroll_data)
    assert payroll.net_salary == 900.0

    entry = session.query(AccountingEntry).filter(AccountingEntry.reference_id == payroll.id).first()
    assert entry is not None
    assert entry.entry_type == "expense"


def test_process_payroll_missing_employee(session):
    payroll_data = PayrollCreate(
        employee_id=999,
        pay_period_start=date(2026, 5, 1),
        pay_period_end=date(2026, 5, 15),
        deductions=0.0,
    )
    with pytest.raises(HTTPException):
        HRService.process_payroll(session, payroll_data)
