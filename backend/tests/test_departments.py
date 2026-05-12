from fastapi.testclient import TestClient


def test_create_and_list_departments(client: TestClient, auth_headers: dict[str, str]):
    create_response = client.post(
        "/api/v1/departments",
        headers=auth_headers,
        json={
            "code": "CNTT",
            "name": "Cong nghe thong tin",
            "description": "Don vi CNTT",
            "is_active": True,
        },
    )
    assert create_response.status_code == 201

    list_response = client.get("/api/v1/departments", headers=auth_headers)
    assert list_response.status_code == 200
    assert len(list_response.json()) >= 1
