from fastapi.testclient import TestClient


def test_duplicate_product_sku_is_rejected(client: TestClient) -> None:
    product = {
        "sku": "lap-001",
        "name": "Laptop",
        "description": "Development laptop",
        "price": "999.99",
        "stock_quantity": 5,
    }

    assert client.post("/api/v1/products", json=product).status_code == 201
    response = client.post("/api/v1/products", json={**product, "sku": "LAP-001"})

    assert response.status_code == 409
    assert response.json()["detail"] == "A product with this SKU already exists"


def test_stock_adjustment_cannot_make_inventory_negative(client: TestClient) -> None:
    product = client.post(
        "/api/v1/products",
        json={"sku": "KEY-001", "name": "Keyboard", "price": "80.00", "stock_quantity": 2},
    ).json()

    response = client.patch(
        f"/api/v1/products/{product['id']}/stock",
        json={"quantity_delta": -3, "note": "Invalid adjustment"},
    )

    assert response.status_code == 409

