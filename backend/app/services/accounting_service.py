from fastapi import HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func
from app.models.accounting import Expense, AccountingEntry
from app.schemas.accounting import ExpenseCreate, IncomeCreate

class AccountingService:
    @staticmethod
    def register_entry(db: Session, entry_type: str, amount: float, description: str, reference_id: int = None, category: str = None):
        entry = AccountingEntry(
            entry_type=entry_type,
            amount=amount,
            description=description,
            reference_id=reference_id,
            category=category
        )
        db.add(entry)
        
        # Si es un gasto automático de inventario, también lo registramos en la tabla 'expenses'
        # para que sea visible en la lista detallada de gastos del frontend.
        if entry_type == "expense":
            expense = Expense(
                description=description,
                amount=amount,
                category=category or "Inventory",
                timestamp=entry.timestamp
            )
            db.add(expense)

        db.commit()
        return entry

    @staticmethod
    def create_expense(db: Session, expense_data: ExpenseCreate):
        db_expense = Expense(**expense_data.dict())
        db.add(db_expense)
        db.commit()
        db.refresh(db_expense)
        
        # Registrar automáticamente como salida contable
        AccountingService.register_entry(
            db, 
            entry_type="expense", 
            amount=db_expense.amount, 
            description=f"Gasto: {db_expense.description}",
            reference_id=db_expense.id,
            category=db_expense.category
        )
        
        return db_expense

    @staticmethod
    def create_income(db: Session, income_data: IncomeCreate):
        db_income = AccountingEntry(
            entry_type="income",
            amount=income_data.amount,
            description=income_data.description,
            category=income_data.category
        )
        db.add(db_income)
        db.commit()
        db.refresh(db_income)
        return db_income

    @staticmethod
    def get_incomes(db: Session, skip: int = 0, limit: int = 100):
        # Devuelve solo los registros de tipo "income" para cumplir con el esquema IncomeResponse del frontend
        return db.query(AccountingEntry).filter(AccountingEntry.entry_type == "income").order_by(AccountingEntry.timestamp.desc()).offset(skip).limit(limit).all()

    @staticmethod
    def delete_income(db: Session, income_id: int):
        income = db.query(AccountingEntry).filter(
            AccountingEntry.id == income_id,
            AccountingEntry.entry_type == "income"
        ).first()
        if not income:
            raise HTTPException(status_code=404, detail="Income not found")
        db.delete(income)
        db.commit()
        return {"message": "Income deleted successfully"}

    @staticmethod
    def get_summary(db: Session):
        total_income = db.query(func.sum(AccountingEntry.amount)).filter(AccountingEntry.entry_type == "income").scalar() or 0.0

        total_expenses = db.query(func.sum(AccountingEntry.amount)).filter(AccountingEntry.entry_type == "expense").scalar() or 0.0

        return {
            "total_income": total_income,
            "total_expenses": total_expenses,
            "net_profit": total_income - total_expenses
        }

    @staticmethod
    def get_expenses(db: Session, skip: int = 0, limit: int = 100):
        return db.query(Expense).offset(skip).limit(limit).all()

    @staticmethod
    def delete_expense(db: Session, expense_id: int):
        expense = db.query(Expense).filter(Expense.id == expense_id).first()
        if not expense:
            raise HTTPException(status_code=404, detail="Expense not found")
        db.delete(expense)
        db.commit()
        return {"message": "Expense deleted successfully"}
