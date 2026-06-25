from fastapi.testclient import TestClient


def create_customer(client: TestClient) -> dict:
    return client.post(
        "/api/v1/customers",
        json={"name": "Asha Rao", "email": "asha@example.com"},
    ).json()


def create_product(client: TestClient, sku: str = "MON-001", stock: int = 5) -> dict:
    return client.post(
        "/api/v1/products",
        json={"sku": sku, "name": "Monitor", "price": "250.00", "stock_quantity": stock},
    ).json()


def test_placing_order_reduces_stock_and_records_inventory(client: TestClient) -> None:
    customer = create_customer(client)
    product = create_product(client)

    response = client.post(
        "/api/v1/orders",
        json={"customer_id": customer["id"], "items": [{"product_id": product["id"], "quantity": 2}]},
    )

    assert response.status_code == 201
    assert response.json()["total_amount"] == "500.00"
    assert client.get(f"/api/v1/products/{product['id']}").json()["stock_quantity"] == 3
    transactions = client.get("/api/v1/inventory-transactions").json()
    assert transactions[0]["change_quantity"] == -2
    assert transactions[0]["transaction_type"] == "order_placed"


def test_order_is_rejected_when_stock_is_insufficient(client: TestClient) -> None:
    customer = create_customer(client)
    product = create_product(client, stock=1)

    response = client.post(
        "/api/v1/orders",
        json={"customer_id": customer["id"], "items": [{"product_id": product["id"], "quantity": 2}]},
    )

    assert response.status_code == 409
    assert "Insufficient stock" in response.json()["detail"]
    assert client.get(f"/api/v1/products/{product['id']}").json()["stock_quantity"] == 1
    assert client.get("/api/v1/orders").json() == []


def test_cancelling_order_restores_stock(client: TestClient) -> None:
    customer = create_customer(client)
    product = create_product(client)
    order = client.post(
        "/api/v1/orders",
        json={"customer_id": customer["id"], "items": [{"product_id": product["id"], "quantity": 2}]},
    ).json()

    response = client.patch(f"/api/v1/orders/{order['id']}/status", json={"status": "cancelled"})

    assert response.status_code == 200
    assert response.json()["status"] == "cancelled"
    assert client.get(f"/api/v1/products/{product['id']}").json()["stock_quantity"] == 5

