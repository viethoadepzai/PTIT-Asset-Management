from fastapi.testclient import TestClient


def test_create_and_list_users(client: TestClient, auth_headers: dict[str, str]):
    department_response = client.post(
        "/api/v1/departments",
        headers=auth_headers,
        json={"code": "PDT", "name": "Phong Dao tao", "description": "Hoc vu"},
    )
    department_id = department_response.json()["id"]

    user_response = client.post(
        "/api/v1/users",
        headers=auth_headers,
        json={
            "username": "manager01",
            "email": "manager01@test.local",
            "full_name": "Manager 01",
            "password": "Password@123",
            "confirm_password": "Password@123",
            "role": "manager",
            "department_id": department_id,
            "is_active": True,
        },
    )
    assert user_response.status_code == 201

    list_response = client.get("/api/v1/users", headers=auth_headers)
    assert list_response.status_code == 200
    assert len(list_response.json()) >= 1
