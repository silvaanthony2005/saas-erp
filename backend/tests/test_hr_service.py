def test_create_employee(client):
    resp = client.post("/api/v1/hr/employees", json={
        "first_name": "Juan",
        "last_name": "Perez",
        "email": "juan@test.com",
        "position": "Vendedor",
        "base_salary": 500.0,
    })
    assert resp.status_code == 200
    assert resp.json()["first_name"] == "Juan"

def test_list_employees(client):
    client.post("/api/v1/hr/employees", json={
        "first_name": "A", "last_name": "B", "email": "a@test.com",
        "position": "Test", "base_salary": 300.0,
    })
    resp = client.get("/api/v1/hr/employees")
    assert resp.status_code == 200
    assert len(resp.json()) == 1

def test_process_payroll(client):
    emp_resp = client.post("/api/v1/hr/employees", json={
        "first_name": "Carlos", "last_name": "Lopez",
        "email": "carlos@test.com", "position": "Cajero",
        "base_salary": 400.0, "hire_date": "2025-01-01",
    })
    emp_id = emp_resp.json()["id"]
    resp = client.post("/api/v1/hr/payroll", json={
        "employee_id": emp_id,
        "pay_period_start": "2026-05-01",
        "pay_period_end": "2026-05-31",
        "deductions": 50.0,
    })
    assert resp.status_code == 200
    assert resp.json()["net_salary"] == 350.0
