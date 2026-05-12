from fastapi.testclient import TestClient


def test_report_endpoints(client: TestClient, auth_headers: dict[str, str]):
    dashboard_response = client.get(
        "/api/v1/reports/dashboard-summary",
        headers=auth_headers,
    )
    assert dashboard_response.status_code == 200
    assert "total_departments" in dashboard_response.json()

    low_stock_response = client.get(
        "/api/v1/reports/low-stock-supplies",
        headers=auth_headers,
    )
    assert low_stock_response.status_code == 200
