from fastapi.testclient import TestClient


def test_create_asset_allocation(client: TestClient, auth_headers: dict[str, str]):
    department_response = client.post(
        "/api/v1/departments",
        headers=auth_headers,
        json={"code": "KETOAN", "name": "Phong Ke toan", "description": "Tai chinh"},
    )
    department_id = department_response.json()["id"]

    asset_response = client.post(
        "/api/v1/assets",
        headers=auth_headers,
        json={
            "asset_code": "TS200",
            "name": "Projector Test",
            "category": "Projector",
            "status": "available",
            "condition": "good",
            "is_active": True,
        },
    )
    asset_id = asset_response.json()["id"]

    allocation_response = client.post(
        "/api/v1/allocations",
        headers=auth_headers,
        json={
            "allocation_code": "CP001",
            "allocation_type": "asset",
            "asset_id": asset_id,
            "quantity": "1",
            "allocated_department_id": department_id,
            "is_active": True,
        },
    )
    assert allocation_response.status_code == 201
    assert allocation_response.json()["allocation_code"] == "CP001"
