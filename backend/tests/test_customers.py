from fastapi.testclient import TestClient


def test_customer_email_is_unique_case_insensitively(client: TestClient) -> None:
    customer = {"name": "Asha Rao", "email": "ASHA@example.com"}

    assert client.post("/api/v1/customers", json=customer).status_code == 201
    response = client.post(
        "/api/v1/customers", json={"name": "Another Asha", "email": "asha@example.com"}
    )

    assert response.status_code == 409
    assert response.json()["detail"] == "A customer with this email already exists"

