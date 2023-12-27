from fastapi.testclient import TestClient
import app
import pytest


@pytest.fixture
def client():
    app.remote_path = app.static_path
    return TestClient(app.web.local())


def test_index(client):
    response = client.get("/")
    assert response.status_code == 200


def test_upload(client):
    response = client.get("/upload")
    assert response.status_code == 200
