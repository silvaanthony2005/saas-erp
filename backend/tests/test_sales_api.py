from backend.app.models.business import Product, Category


def seed_product(session, stock=50):
    category = Category(name="General")
    session.add(category)
    session.commit()
    session.refresh(category)

    product = Product(
        sku="SALE-001",
        name="Producto Venta",
        cost_price=5.0,
        sale_price=10.0,
        stock_quantity=stock,
        category_id=category.id,
    )
    session.add(product)
    session.commit()
    session.refresh(product)
    return product


def test_create_sale(client, session):
    product = seed_product(session)
    payload = {
        "details": [
            {"product_id": product.id, "quantity": 2, "unit_price": 10.0}
        ]
    }
    response = client.post("/api/v1/sales", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert data["total_amount"] == 20.0
    assert len(data["details"]) == 1


def test_read_sales(client):
    response = client.get("/api/v1/sales")
    assert response.status_code == 200
    assert isinstance(response.json(), list)


def test_read_sale_not_found(client):
    response = client.get("/api/v1/sales/999")
    assert response.status_code == 404


def test_create_sale_product_not_found(client):
    payload = {
        "details": [
            {"product_id": 999, "quantity": 1, "unit_price": 10.0}
        ]
    }
    response = client.post("/api/v1/sales", json=payload)
    assert response.status_code == 404


def test_create_sale_insufficient_stock(client, session):
    product = seed_product(session, stock=1)
    payload = {
        "details": [
            {"product_id": product.id, "quantity": 5, "unit_price": 10.0}
        ]
    }
    response = client.post("/api/v1/sales", json=payload)
    assert response.status_code == 400
