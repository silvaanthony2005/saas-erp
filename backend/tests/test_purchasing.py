from datetime import datetime, timedelta

def test_create_supplier(client):
    data = {
        "company_name": "Proveedor Test C.A.",
        "contact_name": "Juan Pérez",
        "email": "juan@test.com",
        "phone": "0412-1234567",
        "dni_rif": "J-12345678-9"
    }
    resp = client.post("/api/v1/suppliers", json=data)
    assert resp.status_code == 200
    r = resp.json()
    assert r["company_name"] == "Proveedor Test C.A."
    assert r["dni_rif"] == "J-12345678-9"
    assert r["id"] > 0

def test_create_duplicate_supplier(client):
    data = {
        "company_name": "Duplicado",
        "dni_rif": "J-11111111-1"
    }
    client.post("/api/v1/suppliers", json=data)
    resp = client.post("/api/v1/suppliers", json=data)
    assert resp.status_code == 400

def test_list_suppliers(client):
    client.post("/api/v1/suppliers", json={"company_name": "Proveedor A", "dni_rif": "J-11111111-1"})
    client.post("/api/v1/suppliers", json={"company_name": "Proveedor B", "dni_rif": "J-22222222-2"})
    resp = client.get("/api/v1/suppliers")
    assert resp.status_code == 200
    r = resp.json()
    assert r["total"] == 2
    assert len(r["suppliers"]) == 2

def test_search_suppliers(client):
    client.post("/api/v1/suppliers", json={"company_name": "Distribuidora ABC", "dni_rif": "J-11111111-1"})
    client.post("/api/v1/suppliers", json={"company_name": "Comercial XYZ", "dni_rif": "J-22222222-2"})
    resp = client.get("/api/v1/suppliers?search=ABC")
    assert resp.status_code == 200
    assert resp.json()["total"] == 1

def test_update_supplier(client):
    resp = client.post("/api/v1/suppliers", json={"company_name": "Original", "dni_rif": "J-11111111-1"})
    sid = resp.json()["id"]
    resp = client.put(f"/api/v1/suppliers/{sid}", json={"company_name": "Modificado", "dni_rif": "J-11111111-1"})
    assert resp.status_code == 200
    assert resp.json()["company_name"] == "Modificado"

def test_delete_supplier(client):
    resp = client.post("/api/v1/suppliers", json={"company_name": "Para Eliminar", "dni_rif": "J-11111111-1"})
    sid = resp.json()["id"]
    resp = client.delete(f"/api/v1/suppliers/{sid}")
    assert resp.status_code == 200
    resp = client.get(f"/api/v1/suppliers/{sid}")
    assert resp.status_code == 404

def test_create_purchase_cash(client):
    cat_resp = client.post("/api/v1/inventory/categories", json={"name": "TestCat"})
    cat_id = cat_resp.json()["id"]
    prod_resp = client.post("/api/v1/inventory/products", json={
        "sku": "PUR001", "name": "Producto Compra",
        "cost_price_usd": 2.0, "sale_price_usd": 4.0,
        "stock_quantity": 10, "category_id": cat_id
    })
    prod_id = prod_resp.json()["id"]
    sup_resp = client.post("/api/v1/suppliers", json={"company_name": "Suplidor", "dni_rif": "J-11111111-1"})
    sup_id = sup_resp.json()["id"]

    purchase_data = {
        "invoice_number": "FAC-001",
        "supplier_id": sup_id,
        "subtotal_bs": 500.0,
        "tax_bs": 0,
        "total_bs": 500.0,
        "payment_type": "cash",
        "invoice_date": datetime.now().strftime("%Y-%m-%d"),
        "details": [{"product_id": prod_id, "quantity": 5, "unit_cost_bs": 8.0}]
    }
    resp = client.post("/api/v1/purchases", json=purchase_data)
    assert resp.status_code == 200
    r = resp.json()
    assert r["invoice_number"] == "FAC-001"
    assert r["payment_type"] == "cash"
    assert r["status"] == "active"
    assert len(r["details"]) == 1

    # Verificar que el stock aumentó
    prod_resp = client.get(f"/api/v1/inventory/products/{prod_id}")
    assert prod_resp.json()["stock_quantity"] == 15  # 10 + 5

def test_create_purchase_credit(client):
    cat_resp = client.post("/api/v1/inventory/categories", json={"name": "TestCat2"})
    cat_id = cat_resp.json()["id"]
    prod_resp = client.post("/api/v1/inventory/products", json={
        "sku": "PUR002", "name": "Producto Credito",
        "cost_price_usd": 2.0, "sale_price_usd": 4.0,
        "stock_quantity": 5, "category_id": cat_id
    })
    prod_id = prod_resp.json()["id"]
    sup_resp = client.post("/api/v1/suppliers", json={"company_name": "Suplidor2", "dni_rif": "J-22222222-2"})
    sup_id = sup_resp.json()["id"]

    purchase_data = {
        "invoice_number": "FAC-002",
        "supplier_id": sup_id,
        "subtotal_bs": 1000.0,
        "tax_bs": 0,
        "total_bs": 1000.0,
        "payment_type": "credit",
        "invoice_date": datetime.now().strftime("%Y-%m-%d"),
        "due_date": (datetime.now() + timedelta(days=30)).strftime("%Y-%m-%d"),
        "details": [{"product_id": prod_id, "quantity": 10, "unit_cost_bs": 15.0}]
    }
    resp = client.post("/api/v1/purchases", json=purchase_data)
    assert resp.status_code == 200

    # Verificar que se creó la CxP
    ap_resp = client.get("/api/v1/accounts-payable")
    assert ap_resp.status_code == 200
    aps = ap_resp.json()["accounts_payable"]
    assert len(aps) > 0
    target = next(ap for ap in aps if ap["invoice_number"] == "FAC-002")
    assert target["total_amount_bs"] == 1000.0
    assert target["remaining_balance_bs"] == 1000.0
    assert target["status"] == "pending"

def test_make_payment(client):
    cat_resp = client.post("/api/v1/inventory/categories", json={"name": "TestCat3"})
    cat_id = cat_resp.json()["id"]
    prod_resp = client.post("/api/v1/inventory/products", json={
        "sku": "PUR003", "name": "Producto Pago",
        "cost_price_usd": 2.0, "sale_price_usd": 4.0,
        "stock_quantity": 0, "category_id": cat_id
    })
    prod_id = prod_resp.json()["id"]
    sup_resp = client.post("/api/v1/suppliers", json={"company_name": "Suplidor3", "dni_rif": "J-33333333-3"})
    sup_id = sup_resp.json()["id"]

    client.post("/api/v1/purchases", json={
        "invoice_number": "FAC-003",
        "supplier_id": sup_id,
        "subtotal_bs": 2000.0, "tax_bs": 0, "total_bs": 2000.0,
        "payment_type": "credit",
        "invoice_date": datetime.now().strftime("%Y-%m-%d"),
        "due_date": (datetime.now() + timedelta(days=30)).strftime("%Y-%m-%d"),
        "details": [{"product_id": prod_id, "quantity": 10, "unit_cost_bs": 20.0}]
    })

    # Obtener la CxP
    ap_resp = client.get("/api/v1/accounts-payable")
    ap = ap_resp.json()["accounts_payable"][0]

    # Pagar parcialmente
    payment_resp = client.post("/api/v1/accounts-payable/payments", json={
        "accounts_payable_id": ap["id"],
        "amount_bs": 500.0,
        "payment_method": "Cash",
        "payment_date": datetime.now().strftime("%Y-%m-%d"),
    })
    assert payment_resp.status_code == 200

    # Verificar saldo actualizado
    ap_resp = client.get(f"/api/v1/accounts-payable/{ap['id']}")
    assert ap_resp.json()["remaining_balance_bs"] == 1500.0
    assert ap_resp.json()["status"] == "partially_paid"

    # Pagar el resto
    client.post("/api/v1/accounts-payable/payments", json={
        "accounts_payable_id": ap["id"],
        "amount_bs": 1500.0,
        "payment_method": "Transfer",
        "payment_date": datetime.now().strftime("%Y-%m-%d"),
    })

    ap_resp = client.get(f"/api/v1/accounts-payable/{ap['id']}")
    assert ap_resp.json()["remaining_balance_bs"] == 0
    assert ap_resp.json()["status"] == "paid"

    # Verificar historial de pagos
    hist_resp = client.get(f"/api/v1/accounts-payable/{ap['id']}/payments")
    assert len(hist_resp.json()) == 2

def test_cancel_purchase(client):
    cat_resp = client.post("/api/v1/inventory/categories", json={"name": "TestCat4"})
    cat_id = cat_resp.json()["id"]
    prod_resp = client.post("/api/v1/inventory/products", json={
        "sku": "PUR004", "name": "Producto Cancel",
        "cost_price_usd": 2.0, "sale_price_usd": 4.0,
        "stock_quantity": 20, "category_id": cat_id
    })
    prod_id = prod_resp.json()["id"]
    sup_resp = client.post("/api/v1/suppliers", json={"company_name": "Suplidor4", "dni_rif": "J-44444444-4"})
    sup_id = sup_resp.json()["id"]

    pur_resp = client.post("/api/v1/purchases", json={
        "invoice_number": "FAC-004",
        "supplier_id": sup_id,
        "subtotal_bs": 1000.0, "tax_bs": 0, "total_bs": 1000.0,
        "payment_type": "cash",
        "invoice_date": datetime.now().strftime("%Y-%m-%d"),
        "details": [{"product_id": prod_id, "quantity": 10, "unit_cost_bs": 10.0}]
    })
    pid = pur_resp.json()["id"]

    cancel_resp = client.post(f"/api/v1/purchases/{pid}/cancel")
    assert cancel_resp.status_code == 200
    assert cancel_resp.json()["status"] == "cancelled"

    # Verificar que el stock se revirtió
    prod_resp = client.get(f"/api/v1/inventory/products/{prod_id}")
    assert prod_resp.json()["stock_quantity"] == 20  # 20 + 10 - 10

    # Verificar movimiento Kardex de anulación
    kardex_resp = client.get(f"/api/v1/costing/kardex?product_id={prod_id}")
    assert kardex_resp.status_code == 200
    movements = kardex_resp.json()["movements"]
    cancel_moves = [m for m in movements if m["reference_type"] == "purchase_cancellation"]
    assert len(cancel_moves) == 1
    assert cancel_moves[0]["movement_type"] == "out"
    assert cancel_moves[0]["quantity"] == 10

    # Verificar reverso contable (contra-gasto)
    summary_resp = client.get("/api/v1/accounting/summary")
    assert summary_resp.status_code == 200
    # La compra registró +1000 de gasto, la anulación registra -1000, neto = 0
    assert summary_resp.json()["total_expenses_bs"] == 0.0

def test_costing_config(client):
    resp = client.get("/api/v1/costing/method")
    assert resp.status_code == 200
    assert resp.json()["method"] in ("fifo", "weighted_average")

    resp = client.put("/api/v1/costing/method", json={"method": "fifo"})
    assert resp.status_code == 200
    assert resp.json()["method"] == "fifo"

    resp = client.put("/api/v1/costing/method", json={"method": "weighted_average"})
    assert resp.status_code == 200
    assert resp.json()["method"] == "weighted_average"

    resp = client.put("/api/v1/costing/method", json={"method": "invalid"})
    assert resp.status_code == 400

def test_kardex_movements(client):
    cat_resp = client.post("/api/v1/inventory/categories", json={"name": "KardexCat"})
    cat_id = cat_resp.json()["id"]
    prod_resp = client.post("/api/v1/inventory/products", json={
        "sku": "KARDEX01", "name": "Kardex Product",
        "cost_price_usd": 2.0, "sale_price_usd": 4.0,
        "stock_quantity": 0, "category_id": cat_id
    })
    prod_id = prod_resp.json()["id"]
    sup_resp = client.post("/api/v1/suppliers", json={"company_name": "KardexSup", "dni_rif": "J-55555555-5"})
    sup_id = sup_resp.json()["id"]

    client.post("/api/v1/purchases", json={
        "invoice_number": "FAC-K01",
        "supplier_id": sup_id,
        "subtotal_bs": 500.0, "tax_bs": 0, "total_bs": 500.0,
        "payment_type": "cash",
        "invoice_date": datetime.now().strftime("%Y-%m-%d"),
        "details": [{"product_id": prod_id, "quantity": 10, "unit_cost_bs": 10.0}]
    })

    kardex_resp = client.get(f"/api/v1/costing/kardex?product_id={prod_id}")
    assert kardex_resp.status_code == 200
    assert kardex_resp.json()["total"] >= 1
