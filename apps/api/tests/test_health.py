def test_root_endpoint(client):
    response = client.get("/")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "online"
    assert "Personal Media Hub" in data["name"]
    assert data["api_v1"] == "/api/v1"


def test_health_endpoint(client):
    response = client.get("/api/v1/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "healthy"
    assert data["app"] == "Personal Media Hub"
    assert data["version"] == "0.1.0"
    assert data["environment"] == "development"
    assert "timestamp" in data


def test_error_handling_not_found(client):
    response = client.get("/api/v1/this-endpoint-does-not-exist")
    assert response.status_code == 404
    data = response.json()
    assert "error" in data
    assert data["error"]["code"] == "NOT_FOUND"
    assert "Not Found" in data["error"]["message"]
