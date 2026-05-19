from app.core.database import SessionLocal, engine, Base
from app.models.business import Category, Product, Transaction, TransactionDetail
from app.models.hr import Employee
from app.models.accounting import Expense, AccountingEntry
from app.models.exchange_rate import ExchangeRate
from datetime import datetime, timedelta
import random

def seed():
    # Crear tablas si no existen antes de intentar borrar
    Base.metadata.create_all(bind=engine)
    
    db = SessionLocal()

    db.query(AccountingEntry).delete()
    db.query(TransactionDetail).delete()
    db.query(Transaction).delete()
    db.query(Product).delete()
    db.query(Category).delete()
    db.query(Employee).delete()
    db.query(Expense).delete()
    db.commit()

    categorias = [
        Category(name="Alimentos"),
        Category(name="Bebidas"),
        Category(name="Limpieza"),
        Category(name="Cuidado Personal"),
        Category(name="Lácteos"),
    ]
    db.add_all(categorias)
    db.commit()

    alimentos = db.query(Category).filter(Category.name == "Alimentos").first()
    bebidas = db.query(Category).filter(Category.name == "Bebidas").first()
    limpieza = db.query(Category).filter(Category.name == "Limpieza").first()
    personal = db.query(Category).filter(Category.name == "Cuidado Personal").first()
    lacteos = db.query(Category).filter(Category.name == "Lácteos").first()

    bs_to_usd = 500
    productos_usd = [
        ("ALI001", "Harina Pan", 0.79, 1.22, 200, 20, alimentos.id),
        ("ALI002", "Arroz Integral 1kg", 0.64, 0.94, 150, 15, alimentos.id),
        ("ALI003", "Pasta Larga 500g", 0.39, 0.69, 180, 10, alimentos.id),
        ("ALI004", "Aceite Vegetal 1L", 1.78, 2.47, 100, 10, alimentos.id),
        ("ALI005", "Azúcar Blanca 1kg", 0.49, 0.79, 120, 15, alimentos.id),
        ("ALI006", "Sal Marina 1kg", 0.30, 0.54, 90, 10, alimentos.id),
        ("ALI007", "Café Molido 250g", 1.97, 3.45, 60, 8, alimentos.id),
        ("ALI008", "Galletas Dulces 200g", 0.59, 0.99, 100, 10, alimentos.id),
        ("BEB001", "Agua Mineral 1.5L", 0.39, 0.64, 300, 25, bebidas.id),
        ("BEB002", "Jugo de Naranja 1L", 0.89, 1.48, 120, 10, bebidas.id),
        ("BEB003", "Refresco Cola 355ml", 0.49, 0.84, 250, 20, bebidas.id),
        ("BEB004", "Cerveza Nacional 330ml", 0.69, 1.18, 200, 15, bebidas.id),
        ("LMP001", "Detergente Líquido 1L", 1.48, 2.76, 80, 8, limpieza.id),
        ("LMP002", "Cloro 1L", 0.59, 0.99, 70, 8, limpieza.id),
        ("LMP003", "Jabón de Barra x3", 0.79, 1.38, 60, 5, limpieza.id),
        ("LMP004", "Papel Higiénico x4", 1.18, 1.97, 120, 10, limpieza.id),
        ("PER001", "Shampoo 400ml", 2.47, 3.95, 50, 5, personal.id),
        ("PER002", "Pasta Dental 120g", 0.99, 1.78, 80, 8, personal.id),
        ("PER003", "Desodorante Spray", 1.78, 3.16, 40, 5, personal.id),
        ("LCT001", "Leche Entera 1L", 0.79, 1.18, 150, 15, lacteos.id),
        ("LCT002", "Yogurt Natural 1kg", 1.18, 1.97, 80, 8, lacteos.id),
        ("LCT003", "Queso Blanco 500g", 1.78, 2.96, 60, 5, lacteos.id),
        ("LCT004", "Mantequilla 250g", 0.99, 1.58, 50, 5, lacteos.id),
    ]

    productos = []
    for sku, name, cost_usd, price_usd, stock, min_stock, cat_id in productos_usd:
        p = Product(
            sku=sku, name=name, cost_price_bs=round(cost_usd * bs_to_usd, 2),
            sale_price_bs=round(price_usd * bs_to_usd, 2),
            stock_quantity=stock, min_stock=min_stock, category_id=cat_id
        )
        db.add(p)
        productos.append(p)
    db.commit()

    empleados = [
        Employee(first_name="María", last_name="González", email="maria@empresa.com", phone="0412-1112233", position="Cajero", base_salary=450 * bs_to_usd, is_active=True),
        Employee(first_name="Carlos", last_name="López", email="carlos@empresa.com", phone="0414-4455667", position="Supervisor", base_salary=650 * bs_to_usd, is_active=True),
        Employee(first_name="Ana", last_name="Martínez", email="ana@empresa.com", phone="0426-7788990", position="Vendedor", base_salary=400 * bs_to_usd, is_active=True),
    ]
    db.add_all(empleados)
    db.commit()

    hoy = datetime.now()
    for dias_atras in range(7, 0, -1):
        dia = hoy - timedelta(days=dias_atras)
        num_ventas = random.randint(3, 8)
        for _ in range(num_ventas):
            num_items = random.randint(1, 4)
            detalles_venta = []
            total = 0
            for _ in range(num_items):
                p = random.choice(productos)
                qty = random.randint(1, 5)
                if p.stock_quantity - qty >= 0:
                    p.stock_quantity -= qty
                    subtotal = p.sale_price_bs * qty
                    total += subtotal
                    detalles_venta.append(TransactionDetail(
                        product_id=p.id, quantity=qty, unit_price_bs=p.sale_price_bs
                    ))
            if detalles_venta:
                venta = Transaction(
                    type="sale", total_amount_bs=total,
                    exchange_rate=bs_to_usd,
                    timestamp=dia + timedelta(
                        hours=random.randint(7, 20),
                        minutes=random.randint(0, 59)
                    ),
                    details=detalles_venta
                )
                db.add(venta)

    gastos = [
    Expense(description="Alquiler del local", amount_bs=1500 * bs_to_usd, category="rent", timestamp=hoy - timedelta(days=1)),
    Expense(description="Electricidad", amount_bs=350 * bs_to_usd, category="utilities", timestamp=hoy - timedelta(days=2)),
    Expense(description="Agua", amount_bs=120 * bs_to_usd, category="utilities", timestamp=hoy - timedelta(days=3)),
    Expense(description="Pago de nómina", amount_bs=2500 * bs_to_usd, category="salary", timestamp=hoy - timedelta(days=5)),
    Expense(description="Compra de mercancía", amount_bs=1800 * bs_to_usd, category="supplies", timestamp=hoy - timedelta(days=6)),
    ]
    db.add_all(gastos)

    try:
        db.commit()

        ventas = db.query(Transaction).filter(Transaction.type == "sale").all()
        for v in ventas:
            existing = db.query(AccountingEntry).filter(AccountingEntry.reference_id == v.id, AccountingEntry.entry_type == "income").first()
            if not existing:
                entry = AccountingEntry(
                    entry_type="income",
                    amount_bs=v.total_amount_bs,
                    description=f"Venta #{v.id}",
                    category="Ventas",
                    timestamp=v.timestamp,
                    reference_id=v.id
                )
                db.add(entry)
        db.commit()

        expenses = db.query(Expense).all()
        for e in expenses:
            existing = db.query(AccountingEntry).filter(AccountingEntry.reference_id == e.id, AccountingEntry.entry_type == "expense").first()
            if not existing:
                entry = AccountingEntry(
                    entry_type="expense",
                    amount_bs=e.amount_bs,
                    description=f"Gasto: {e.description}",
                    category=e.category,
                    timestamp=e.timestamp,
                    reference_id=e.id
                )
                db.add(entry)
        db.commit()

        total_ventas = db.query(Transaction).count()
        total_productos = db.query(Product).count()
        total_empleados = db.query(Employee).count()
        total_gastos = db.query(Expense).count()
        total_accounting = db.query(AccountingEntry).count()
        print(f"Seed completado: {total_ventas} ventas, {total_productos} productos, {total_empleados} empleados, {total_gastos} gastos, {total_accounting} asientos contables")
    except Exception as e:
        db.rollback()
        print(f"Error: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    seed()
