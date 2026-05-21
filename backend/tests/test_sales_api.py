def test_add_sale(client):
    cat_resp = client.post("/api/v1/inventory/categories", json={"name": "SalesCat"})
    cat_id = cat_resp.json()["id"]
    client.post("/api/v1/inventory/products", json={
        "sku": "SALE01", "name": "Sale Product",
        "cost_price_usd": 2.0, "sale_price_usd": 4.0,
        "stock_quantity": 100, "category_id": cat_id
    })
    resp = client.post("/api/v1/sales", json={
        "details": [{"product_id": 1, "quantity": 3, "unit_price_bs": 20.0}],
        "payments": [{"payment_method": "cash_bs", "amount_bs": 60.0}],
    })
    assert resp.status_code == 200, resp.json()
    data = resp.json()
    assert data["total_amount_bs"] == 60.0
    assert len(data["details"]) == 1
    assert len(data["payments"]) == 1

def test_get_sales(client):
    cat_resp = client.post("/api/v1/inventory/categories", json={"name": "SalesCat2"})
    cat_id = cat_resp.json()["id"]
    client.post("/api/v1/inventory/products", json={
        "sku": "SALE02", "name": "Sale Product 2",
        "cost_price_usd": 1.0, "sale_price_usd": 2.0,
        "stock_quantity": 50, "category_id": cat_id
    })
    client.post("/api/v1/sales", json={
        "details": [{"product_id": 1, "quantity": 2, "unit_price_bs": 10.0}],
        "payments": [{"payment_method": "cash_bs", "amount_bs": 20.0}],
    })
    resp = client.get("/api/v1/sales")
    assert resp.status_code == 200
    assert len(resp.json()) > 0
