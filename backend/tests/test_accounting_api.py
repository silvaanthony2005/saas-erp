def test_create_expense(client):
    payload = {"description": "Renta", "amount": 500.0, "category": "rent"}
    response = client.post("/api/v1/accounting/expenses", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert data["description"] == "Renta"
    assert data["amount"] == 500.0


def test_read_expenses(client):
    response = client.get("/api/v1/accounting/expenses")
    assert response.status_code == 200
    assert isinstance(response.json(), list)


def test_summary(client):
    response = client.get("/api/v1/accounting/summary")
    assert response.status_code == 200
    data = response.json()
    assert "total_income" in data
    assert "total_expenses" in data
    assert "net_profit" in data


def test_create_expense_validation_error(client):
    payload = {"description": "Renta"}
    response = client.post("/api/v1/accounting/expenses", json=payload)
    assert response.status_code == 422
