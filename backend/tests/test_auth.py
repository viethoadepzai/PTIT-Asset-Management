from fastapi.testclient import TestClient


def test_register_and_login(client: TestClient):
    register_response = client.post(
        "/api/v1/auth/register",
        json={
            "username": "staff01",
            "email": "staff01@test.local",
            "full_name": "Staff 01",
            "password": "Password@123",
            "confirm_password": "Password@123",
            "role": "staff",
        },
    )
    assert register_response.status_code == 201

    login_response = client.post(
        "/api/v1/auth/login-json",
        json={"username": "staff01", "password": "Password@123"},
    )
    assert login_response.status_code == 200
    body = login_response.json()
    assert body["token_type"] == "bearer"
    assert body["access_token"]
