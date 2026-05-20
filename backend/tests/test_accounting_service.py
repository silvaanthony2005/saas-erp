def test_create_expense(client):
    resp = client.post("/api/v1/accounting/expenses", json={
        "description": "Test Expense",
        "amount_bs": 100.0,
        "category": "test"
    })
    assert resp.status_code == 200
    assert resp.json()["description"] == "Test Expense"

def test_get_expenses(client):
    client.post("/api/v1/accounting/expenses", json={
        "description": "Expense 1", "amount_bs": 50.0, "category": "test"
    })
    resp = client.get("/api/v1/accounting/expenses")
    assert resp.status_code == 200
    assert len(resp.json()) >= 1

def test_get_summary(client):
    client.post("/api/v1/accounting/expenses", json={
        "description": "Rent", "amount_bs": 500.0, "category": "rent"
    })
    resp = client.get("/api/v1/accounting/summary")
    assert resp.status_code == 200
    data = resp.json()
    assert data["total_expenses_bs"] >= 500.0
