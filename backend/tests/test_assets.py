from fastapi.testclient import TestClient


def test_create_and_read_asset(client: TestClient, auth_headers: dict[str, str]):
    response = client.post(
        "/api/v1/assets",
        headers=auth_headers,
        json={
            "asset_code": "TS100",
            "name": "Laptop Test",
            "category": "Laptop",
            "status": "available",
            "condition": "good",
            "is_active": True,
        },
    )
    assert response.status_code == 201
    asset_id = response.json()["id"]

    detail_response = client.get(f"/api/v1/assets/{asset_id}", headers=auth_headers)
    assert detail_response.status_code == 200
    assert detail_response.json()["asset_code"] == "TS100"
