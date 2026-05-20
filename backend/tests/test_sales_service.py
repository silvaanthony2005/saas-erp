def test_sale_reduces_stock(client):
    cat_resp = client.post("/api/v1/inventory/categories", json={"name": "StockCat"})
    cat_id = cat_resp.json()["id"]
    prod_resp = client.post("/api/v1/inventory/products", json={
        "sku": "STOCK01", "name": "Stock Test",
        "cost_price_bs": 10.0, "sale_price_bs": 25.0,
        "stock_quantity": 50, "category_id": cat_id
    })
    prod_id = prod_resp.json()["id"]
    client.post("/api/v1/sales", json={
        "details": [{"product_id": prod_id, "quantity": 10, "unit_price_bs": 25.0}],
    })
    prod_resp = client.get(f"/api/v1/inventory/products/{prod_id}")
    assert prod_resp.json()["stock_quantity"] == 40

def test_insufficient_stock(client):
    cat_resp = client.post("/api/v1/inventory/categories", json={"name": "StockCat2"})
    cat_id = cat_resp.json()["id"]
    prod_resp = client.post("/api/v1/inventory/products", json={
        "sku": "STOCK02", "name": "Low Stock",
        "cost_price_bs": 10.0, "sale_price_bs": 25.0,
        "stock_quantity": 5, "category_id": cat_id
    })
    prod_id = prod_resp.json()["id"]
    resp = client.post("/api/v1/sales", json={
        "details": [{"product_id": prod_id, "quantity": 100, "unit_price_bs": 25.0}],
    })
    assert resp.status_code == 400
