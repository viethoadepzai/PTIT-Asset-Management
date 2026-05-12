from fastapi.testclient import TestClient


def test_create_maintenance(client: TestClient, auth_headers: dict[str, str]):
    asset_response = client.post(
        "/api/v1/assets",
        headers=auth_headers,
        json={
            "asset_code": "TS300",
            "name": "May in test",
            "category": "Printer",
            "status": "available",
            "condition": "good",
            "is_active": True,
        },
    )
    asset_id = asset_response.json()["id"]

    maintenance_response = client.post(
        "/api/v1/maintenances",
        headers=auth_headers,
        json={
            "maintenance_code": "BT001",
            "asset_id": asset_id,
            "maintenance_type": "corrective",
            "status": "scheduled",
            "priority": "medium",
            "title": "Bao tri may in",
            "is_active": True,
        },
    )
    assert maintenance_response.status_code == 201
    assert maintenance_response.json()["maintenance_code"] == "BT001"
