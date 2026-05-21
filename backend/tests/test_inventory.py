def test_root(client):
    response = client.get("/")
    assert response.status_code == 200

def test_get_overview(client):
    response = client.get("/api/v1/inventory/products")
    assert response.status_code == 200
    data = response.json()
    assert "products" in data
    assert "total" in data

def test_add_product(client):
    cat_resp = client.post("/api/v1/inventory/categories", json={"name": "Alimentos"})
    cat_id = cat_resp.json()["id"]
    
    product_data = {
        "sku": "T001",
        "name": "Test Product",
        "cost_price_usd": 2.0,
        "sale_price_usd": 3.0,
        "stock_quantity": 100,
        "category_id": cat_id
    }
    response = client.post("/api/v1/inventory/products", json=product_data)
    assert response.status_code == 200
    assert response.json()["sku"] == "T001"


def test_add_product_validation_error(client):
    response = client.post("/api/v1/inventory/products", json={"sku": "T002"})
    assert response.status_code == 422
