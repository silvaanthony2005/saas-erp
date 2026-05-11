from sqlalchemy.orm import Session
from sqlalchemy import func
from backend.app.models.accounting import Expense, AccountingEntry
from backend.app.models.business import Transaction
from backend.app.schemas.accounting import ExpenseCreate
import datetime

class AccountingService:
    @staticmethod
    def register_entry(db: Session, entry_type: str, amount: float, description: str, reference_id: int = None):
        entry = AccountingEntry(
            entry_type=entry_type,
            amount=amount,
            description=description,
            reference_id=reference_id
        )
        db.add(entry)
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
            reference_id=db_expense.id
        )
        
        return db_expense

    @staticmethod
    def get_summary(db: Session):
        # Sumar ingresos de ventas con tipo 'sale'
        total_income = db.query(func.sum(Transaction.total_amount)).filter(Transaction.type == "sale").scalar() or 0.0
        
        # Sumar gastos de la tabla expenses
        total_expenses = db.query(func.sum(Expense.amount)).scalar() or 0.0
        
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
