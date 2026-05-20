from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import settings
from app.core.middleware import LicenseMiddleware
from app.core.database import engine, Base

# Importar modelos para que Base.metadata los conozca antes de crear tablas
from app.models.business import Product, Category, Transaction, TransactionDetail, Customer
from app.models.accounting import Expense, AccountingEntry
from app.models.hr import Employee, Payroll
from app.models.exchange_rate import ExchangeRate
from app.models.purchasing import Supplier, PurchaseInvoice, PurchaseInvoiceDetail, AccountsPayable, PaymentSchedule, InventoryMovement, CostingConfig

# Crear tablas
Base.metadata.create_all(bind=engine)

from app.api import v1_inventory, v1_sales, v1_accounting, v1_hr, v1_dashboard, v1_customers, v1_config, v1_suppliers, v1_purchases, v1_accounts_payable, v1_costing
import asyncio
from app.core.scheduler import update_exchange_rate_task

app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    openapi_url=f"{settings.API_V1_STR}/openapi.json"
)

@app.on_event("startup")
async def startup_event():
    # Iniciar la tarea de actualización de tasa en segundo plano
    asyncio.create_task(update_exchange_rate_task())


# Configuración de CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Añadir middleware de licencias
app.add_middleware(LicenseMiddleware)


# Incluir rutas
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

@app.get("/")
def root():
    return {"message": "SaaS Backend API is running"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="127.0.0.1", port=8000)