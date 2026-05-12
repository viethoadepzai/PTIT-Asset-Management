from fastapi.testclient import TestClient


def test_create_and_read_asset_quantity(
    client: TestClient, auth_headers: dict[str, str]
):
    response = client.post(
        "/api/v1/asset-quantities",
        headers=auth_headers,
        json={
            "name": "Man hinh Test",
            "category": "Monitor",
            "quantity": 5,
            "status": "available",
            "condition": "good",
            "is_active": True,
        },
    )
    assert response.status_code == 201
    asset_quantity_id = response.json()["id"]
    assert response.json()["available_quantity"] == 5

    detail_response = client.get(
        f"/api/v1/asset-quantities/{asset_quantity_id}",
        headers=auth_headers,
    )
    assert detail_response.status_code == 200
    assert detail_response.json()["name"] == "Man hinh Test"
    assert detail_response.json()["quantity"] == 5
    assert detail_response.json()["available_quantity"] == 5
