from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func, desc
from app.core.database import get_db
from app.models.business import Product, Category, Transaction, TransactionDetail
from app.models.hr import Employee
from app.models.accounting import Expense, AccountingEntry
from datetime import datetime, timedelta
import humanize

router = APIRouter()

def get_day_name(date: datetime) -> str:
    days = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"]
    return days[date.weekday()]

@router.get("/dashboard")
def get_dashboard(db: Session = Depends(get_db)):
    today = datetime.now().date()
    week_ago = today - timedelta(days=6)
    
    # Stats
    total_sales = db.query(func.coalesce(func.sum(Transaction.total_amount_bs), 0)).filter(Transaction.type == "sale").scalar() or 0
    total_expenses = db.query(func.coalesce(func.sum(Expense.amount_bs), 0)).scalar() or 0
    net_profit = total_sales - total_expenses
    
    gross_margin = 0
    if total_sales > 0:
        gross_margin = round((net_profit / total_sales) * 100, 1)
    
    active_employees = db.query(Employee).filter(Employee.is_active == True).count()
    
    # Daily sales for the last 7 days
    daily_sales = []
    for i in range(7):
        day = today - timedelta(days=6-i)
        day_start = datetime.combine(day, datetime.min.time())
        day_end = datetime.combine(day, datetime.max.time())
        
        sales = db.query(func.coalesce(func.sum(Transaction.total_amount_bs), 0)).filter(
            Transaction.type == "sale",
            Transaction.timestamp >= day_start,
            Transaction.timestamp <= day_end
        ).scalar() or 0
        
        daily_sales.append({
            "day": get_day_name(day),
            "value": float(sales)
        })
    
    # Transactions by category
    categories = db.query(Category).all()
    sales_by_category = []
    for cat in categories:
        total = db.query(func.coalesce(func.sum(TransactionDetail.quantity * TransactionDetail.unit_price_bs), 0)).join(
            Product, TransactionDetail.product_id == Product.id
        ).join(Transaction, TransactionDetail.transaction_id == Transaction.id
        ).filter(
            Product.category_id == cat.id,
            Transaction.type == "sale"
        ).scalar() or 0
        if total > 0:
            sales_by_category.append({
                "category": cat.name,
                "value": float(total)
            })
    
    # Ordenar por valor y tomar las mejores 6
    sales_by_category.sort(key=lambda x: x["value"], reverse=True)
    sales_by_category = sales_by_category[:6]
    
    # Si no hay datos, agregar un ejemplo
    if not sales_by_category:
        sales_by_category = [
            {"category": "Sin datos", "value": 0}
        ]
    
    # Low stock products
    low_stock = db.query(Product).filter(
        Product.stock_quantity <= Product.min_stock
    ).limit(4).all()
    
    low_stock_items = [{
        "id": p.id,
        "name": p.name,
        "sku": p.sku,
        "stock_quantity": p.stock_quantity,
        "min_stock": p.min_stock,
        "category": p.category.name if p.category else "Sin categoría"
    } for p in low_stock]
    
    # Top selling products
    top_products_query = db.query(
        Product.id,
        Product.name,
        Product.sku,
        func.sum(TransactionDetail.quantity).label("total_sold"),
        func.sum(TransactionDetail.quantity * TransactionDetail.unit_price_bs).label("total_revenue")
    ).join(TransactionDetail, TransactionDetail.product_id == Product.id
    ).join(Transaction, TransactionDetail.transaction_id == Transaction.id
    ).filter(Transaction.type == "sale"
    ).group_by(Product.id
    ).order_by(desc("total_sold")
    ).limit(5).all()
    
    top_products = [{
        "id": p.id,
        "name": p.name,
        "sku": p.sku,
        "total_sold": p.total_sold or 0,
        "total_revenue": float(p.total_revenue or 0)
    } for p in top_products_query]
    
    # Recent activity
    recent_activity = []
    
    # Recent sales
    recent_sales = db.query(Transaction).order_by(desc(Transaction.timestamp)).limit(5).all()
    for sale in recent_sales:
        recent_activity.append({
            "id": sale.id,
            "type": "Venta",
            "description": f"Factura #{sale.id}",
            "time_ago": humanize.naturaltime(datetime.now() - sale.timestamp),
            "amount": f"+${sale.total_amount_bs:.2f}",
            "color": "text-emerald-500 dark:text-emerald-400"
        })
    
    # Recent expenses
    recent_expenses = db.query(Expense).order_by(desc(Expense.timestamp)).limit(3).all()
    for exp in recent_expenses:
        recent_activity.append({
            "id": exp.id,
            "type": "Gasto",
            "description": exp.description,
            "time_ago": humanize.naturaltime(datetime.now() - exp.timestamp),
            "amount": f"-Bs. {exp.amount_bs:.2f}",
            "color": "text-rose-500 dark:text-rose-400"
        })
    
    # Low stock alerts
    for p in low_stock[:3]:
        recent_activity.append({
            "id": p.id,
            "type": "Stock",
            "description": f"Alerta: {p.name}",
            "time_ago": "Reciente",
            "amount": "Bajo",
            "color": "text-amber-500 dark:text-amber-400"
        })
    
    # Ordenar por tiempo
    recent_activity = recent_activity[:10]
    
    return {
        "stats": {
            "total_sales": float(total_sales),
            "total_expenses": float(total_expenses),
            "gross_margin": gross_margin,
            "active_employees": active_employees
        },
        "daily_sales": daily_sales,
        "sales_by_category": sales_by_category,
        "low_stock": low_stock_items,
        "top_products": top_products,
        "recent_activity": recent_activity
    }

@router.get("/dashboard/stats")
def get_stats(db: Session = Depends(get_db)):
    total_sales = db.query(func.coalesce(func.sum(Transaction.total_amount_bs), 0)).filter(Transaction.type == "sale").scalar() or 0
    total_expenses = db.query(func.coalesce(func.sum(Expense.amount_bs), 0)).scalar() or 0
    net_profit = total_sales - total_expenses
    
    gross_margin = 0
    if total_sales > 0:
        gross_margin = round((net_profit / total_sales) * 100, 1)
    
    active_employees = db.query(Employee).filter(Employee.is_active == True).count()
    
    return {
        "total_sales": float(total_sales),
        "total_expenses": float(total_expenses),
        "gross_margin": gross_margin,
        "active_employees": active_employees
    }

@router.get("/dashboard/daily-sales")
def get_daily_sales(db: Session = Depends(get_db)):
    today = datetime.now().date()
    daily_sales = []
    for i in range(7):
        day = today - timedelta(days=6-i)
        day_start = datetime.combine(day, datetime.min.time())
        day_end = datetime.combine(day, datetime.max.time())
        
        sales = db.query(func.coalesce(func.sum(Transaction.total_amount_bs), 0)).filter(
            Transaction.type == "sale",
            Transaction.timestamp >= day_start,
            Transaction.timestamp <= day_end
        ).scalar() or 0
        
        daily_sales.append({
            "day": get_day_name(day),
            "value": float(sales)
        })
    return daily_sales

@router.get("/dashboard/sales-by-category")
def get_sales_by_category(db: Session = Depends(get_db)):
    categories = db.query(Category).all()
    sales_by_category = []
    for cat in categories:
        total = db.query(func.coalesce(func.sum(TransactionDetail.quantity * TransactionDetail.unit_price_bs), 0)).join(
            Product, TransactionDetail.product_id == Product.id
        ).join(Transaction, TransactionDetail.transaction_id == Transaction.id
        ).filter(
            Product.category_id == cat.id,
            Transaction.type == "sale"
        ).scalar() or 0
        if total > 0:
            sales_by_category.append({
                "category": cat.name,
                "value": float(total)
            })
    return sales_by_category

@router.get("/dashboard/low-stock")
def get_low_stock(db: Session = Depends(get_db)):
    products = db.query(Product).filter(
        Product.stock_quantity <= Product.min_stock
    ).limit(10).all()
    return [{
        "id": p.id,
        "name": p.name,
        "sku": p.sku,
        "stock_quantity": p.stock_quantity,
        "min_stock": p.min_stock,
        "category": p.category.name if p.category else "Sin categoría"
    } for p in products]

@router.get("/dashboard/top-products")
def get_top_products(db: Session = Depends(get_db)):
    top_products = db.query(
        Product.id,
        Product.name,
        Product.sku,
        func.sum(TransactionDetail.quantity).label("total_sold"),
        func.sum(TransactionDetail.quantity * TransactionDetail.unit_price_bs).label("total_revenue")
    ).join(TransactionDetail, TransactionDetail.product_id == Product.id
    ).join(Transaction, TransactionDetail.transaction_id == Transaction.id
    ).filter(Transaction.type == "sale"
    ).group_by(Product.id
    ).order_by(desc("total_sold")
    ).limit(5).all()
    return [{
        "id": p.id,
        "name": p.name,
        "sku": p.sku,
        "total_sold": p.total_sold or 0,
        "total_revenue": float(p.total_revenue or 0)
    } for p in top_products]

@router.get("/dashboard/recent-activity")
def get_recent_activity(db: Session = Depends(get_db)):
    recent_activity = []
    
    recent_sales = db.query(Transaction).order_by(desc(Transaction.timestamp)).limit(5).all()
    for sale in recent_sales:
        recent_activity.append({
            "id": sale.id,
            "type": "Venta",
            "description": f"Factura #{sale.id}",
            "time_ago": humanize.naturaltime(datetime.now() - sale.timestamp),
            "amount": f"+Bs. {sale.total_amount_bs:.2f}",
            "color": "text-emerald-500 dark:text-emerald-400"
        })
    
    recent_expenses = db.query(Expense).order_by(desc(Expense.timestamp)).limit(3).all()
    for exp in recent_expenses:
        recent_activity.append({
            "id": exp.id,
            "type": "Gasto",
            "description": exp.description,
            "time_ago": humanize.naturaltime(datetime.now() - exp.timestamp),
            "amount": f"-Bs. {exp.amount_bs:.2f}",
            "color": "text-rose-500 dark:text-rose-400"
        })
    
    low_stock = db.query(Product).filter(
        Product.stock_quantity <= Product.min_stock
    ).limit(3).all()
    for p in low_stock:
        recent_activity.append({
            "id": p.id,
            "type": "Stock",
            "description": f"Alerta: {p.name}",
            "time_ago": "Reciente",
            "amount": "Bajo",
            "color": "text-amber-500 dark:text-amber-400"
        })
    
    return recent_activity[:10]