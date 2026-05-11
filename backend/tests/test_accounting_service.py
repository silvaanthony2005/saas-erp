from backend.app.models.accounting import AccountingEntry
from backend.app.schemas.accounting import ExpenseCreate
from backend.app.services.accounting_service import AccountingService


def test_create_expense_service(session):
    expense = ExpenseCreate(description="Internet", amount=120.0, category="utilities")
    result = AccountingService.create_expense(session, expense)
    assert result.amount == 120.0

    entry = session.query(AccountingEntry).filter(AccountingEntry.reference_id == result.id).first()
    assert entry is not None
    assert entry.entry_type == "expense"


def test_summary_service(session):
    summary = AccountingService.get_summary(session)
    assert "total_income" in summary
    assert "total_expenses" in summary
    assert "net_profit" in summary
