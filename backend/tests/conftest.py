import pytest
from fastapi.testclient import TestClient
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from app.core.database import Base, get_db
from app.core.config import settings
from app.core.middleware import LicenseMiddleware

from app.models.business import Product, Category, Transaction, TransactionDetail, Customer, SalePayment, Receivable, ReceivablePayment, ReceivableSchedule
from app.models.accounting import Expense, AccountingEntry
from app.models.hr import Employee, Payroll
from app.models.exchange_rate import ExchangeRate
from app.models.purchasing import Supplier, PurchaseInvoice, PurchaseInvoiceDetail, AccountsPayable, PaymentSchedule, InventoryMovement, CostingConfig

from app.api import v1_inventory, v1_sales, v1_accounting, v1_hr, v1_dashboard, v1_customers, v1_config, v1_suppliers, v1_purchases, v1_accounts_payable, v1_costing, v1_receivables, v1_auth
from app.core.auth import hash_password, create_access_token
from app.models.core import User, License
from datetime import datetime as dt

SQLALCHEMY_DATABASE_URL = "sqlite://"


@pytest.fixture(name="session")
def session_fixture():
    engine = create_engine(
        SQLALCHEMY_DATABASE_URL,
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
    )
    Base.metadata.create_all(bind=engine)
    TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
    db = TestingSessionLocal()

    admin = User(username="admin", full_name="Admin", hashed_password=hash_password("admin123"), is_active=True, role="dueño")
    db.add(admin)
    lic = License(hwid="test-hwid", install_date=dt.utcnow(), is_active=True, has_pos_module=True, has_inventory_module=True, has_hr_module=True, has_accounting_module=True)
    db.add(lic)
    db.commit()

    try:
        yield db
    finally:
        db.close()
        Base.metadata.drop_all(bind=engine)


@pytest.fixture(name="client")
def client_fixture(session):
    app = FastAPI(title=settings.PROJECT_NAME, version=settings.VERSION)

    app.add_middleware(
        CORSMiddleware,
        allow_origins=["*"],
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    app.add_middleware(LicenseMiddleware)

    app.include_router(v1_inventory.router, prefix=f"{settings.API_V1_STR}/inventory", tags=["inventory"])
    app.include_router(v1_sales.router, prefix=f"{settings.API_V1_STR}/sales", tags=["sales"])
    app.include_router(v1_accounting.router, prefix=f"{settings.API_V1_STR}/accounting", tags=["accounting"])
    app.include_router(v1_hr.router, prefix=f"{settings.API_V1_STR}/hr", tags=["hr"])
    app.include_router(v1_customers.router, prefix=f"{settings.API_V1_STR}/customers", tags=["customers"])
    app.include_router(v1_config.router, prefix=f"{settings.API_V1_STR}/config", tags=["config"])
    app.include_router(v1_dashboard.router, prefix=settings.API_V1_STR, tags=["dashboard"])
    app.include_router(v1_suppliers.router, prefix=f"{settings.API_V1_STR}/suppliers", tags=["suppliers"])
    app.include_router(v1_purchases.router, prefix=f"{settings.API_V1_STR}/purchases", tags=["purchases"])
    app.include_router(v1_accounts_payable.router, prefix=f"{settings.API_V1_STR}/accounts-payable", tags=["accounts-payable"])
    app.include_router(v1_costing.router, prefix=f"{settings.API_V1_STR}/costing", tags=["costing"])
    app.include_router(v1_receivables.router, prefix=f"{settings.API_V1_STR}/receivables", tags=["receivables"])
    app.include_router(v1_auth.router, prefix=f"{settings.API_V1_STR}/auth", tags=["auth"])

    @app.get("/")
    def root():
        return {"message": "SaaS Backend API is running"}

    def get_test_db():
        yield session

    app.dependency_overrides[get_db] = get_test_db
    token = create_access_token({"sub": "1", "role": "dueño"})
    return TestClient(app, headers={"Authorization": f"Bearer {token}"})
