from datetime import date


def test_create_employee(client):
    payload = {
        "first_name": "Ana",
        "last_name": "Lopez",
        "email": "ana@example.com",
        "position": "Contador",
        "base_salary": 1000.0,
    }
    response = client.post("/api/v1/hr/employees", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert data["email"] == "ana@example.com"


def test_read_employees(client):
    response = client.get("/api/v1/hr/employees")
    assert response.status_code == 200
    assert isinstance(response.json(), list)


def test_process_payroll(client):
    employee_payload = {
        "first_name": "Luis",
        "last_name": "Diaz",
        "email": "luis@example.com",
        "position": "Cajero",
        "base_salary": 900.0,
    }
    employee_resp = client.post("/api/v1/hr/employees", json=employee_payload)
    employee_id = employee_resp.json()["id"]

    payroll_payload = {
        "employee_id": employee_id,
        "pay_period_start": str(date(2026, 5, 1)),
        "pay_period_end": str(date(2026, 5, 15)),
        "deductions": 100.0,
    }
    response = client.post("/api/v1/hr/payroll", json=payroll_payload)
    assert response.status_code == 200
    data = response.json()
    assert data["employee_id"] == employee_id
    assert data["net_salary"] == 800.0


def test_process_payroll_missing_employee(client):
    payroll_payload = {
        "employee_id": 999,
        "pay_period_start": str(date(2026, 5, 1)),
        "pay_period_end": str(date(2026, 5, 15)),
        "deductions": 0.0,
    }
    response = client.post("/api/v1/hr/payroll", json=payroll_payload)
    assert response.status_code == 404


def test_create_employee_validation_error(client):
    payload = {
        "first_name": "Ana",
        "last_name": "Lopez",
        "email": "invalid-email",
        "position": "Contador",
        "base_salary": 1000.0,
    }
    response = client.post("/api/v1/hr/employees", json=payload)
    assert response.status_code == 422
