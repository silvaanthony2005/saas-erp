import pytest
from fastapi import HTTPException
from backend.app.models.business import Product, Category, Transaction
from backend.app.schemas.sales import SaleCreate, SaleDetailCreate
from backend.app.services.sales_service import SalesService


def seed_product(session, stock=10):
    category = Category(name="General")
    session.add(category)
    session.commit()
    session.refresh(category)

    product = Product(
        sku="SRV-001",
        name="Producto Servicio",
        cost_price=5.0,
        sale_price=10.0,
        stock_quantity=stock,
        category_id=category.id,
    )
    session.add(product)
    session.commit()
    session.refresh(product)
    return product


def test_create_sale_service_success(session):
    product = seed_product(session, stock=5)
    sale = SaleCreate(details=[SaleDetailCreate(product_id=product.id, quantity=2, unit_price=10.0)])
    result = SalesService.create_sale(session, sale)
    assert result.total_amount == 20.0

    refreshed = session.query(Product).filter(Product.id == product.id).first()
    assert refreshed.stock_quantity == 3

    stored = session.query(Transaction).filter(Transaction.id == result.id).first()
    assert stored is not None


def test_create_sale_service_insufficient_stock(session):
    product = seed_product(session, stock=1)
    sale = SaleCreate(details=[SaleDetailCreate(product_id=product.id, quantity=5, unit_price=10.0)])
    with pytest.raises(HTTPException):
        SalesService.create_sale(session, sale)
