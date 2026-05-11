def test_root(client):
    response = client.get("/")
    assert response.status_code == 200

def test_get_overview(client):
    # Tests trial initialization
    response = client.get("/api/v1/inventory/products")
    assert response.status_code == 200
    assert isinstance(response.json(), list)

def test_add_product(client):
    # Ensure category exists
    cat_resp = client.post("/api/v1/inventory/categories", json={"name": "Alimentos"})
    cat_id = cat_resp.json()["id"]
    
    product_data = {
        "sku": "T001",
        "name": "Test Product",
        "cost_price": 10.0,
        "sale_price": 15.0,
        "stock_quantity": 100,
        "category_id": cat_id
    }
    response = client.post("/api/v1/inventory/products", json=product_data)
    assert response.status_code == 200
    assert response.json()["sku"] == "T001"


def test_add_product_validation_error(client):
    response = client.post("/api/v1/inventory/products", json={"sku": "T002"})
    assert response.status_code == 422
