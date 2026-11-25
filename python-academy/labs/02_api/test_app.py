"""End-to-end tests: TestClient runs the whole ASGI stack in-process."""
import sqlite3

import pytest
from fastapi.testclient import TestClient

from app import OrderRepo, app, get_repo

AUTH = {"X-API-Key": "dev"}


@pytest.fixture
def client():
    # Fresh database per test via dependency override (the @MockBean of FastAPI).
    repo = OrderRepo(sqlite3.connect(":memory:", check_same_thread=False))
    app.dependency_overrides[get_repo] = lambda: repo
    yield TestClient(app)
    app.dependency_overrides.clear()


def new_order(client, customer="Ana", qty=2):
    return client.post("/orders", headers=AUTH,
                       json={"customer": customer, "items": [{"sku": "A1", "qty": qty, "unit_price": 12.5}]})


def test_create_then_get(client):
    r = new_order(client)
    assert r.status_code == 201
    body = r.json()
    assert body["customer"] == "ana" and body["total"] == 25.0 and body["status"] == "new"
    assert client.get(f"/orders/{body['id']}").json() == body


def test_middleware_adds_headers(client):
    r = client.get("/health", headers={"x-request-id": "abc"})
    assert r.headers["x-request-id"] == "abc"
    assert float(r.headers["x-process-ms"]) >= 0


def test_auth_required(client):
    r = client.post("/orders", json={"customer": "ana", "items": [{"sku": "A1", "qty": 1}]})
    assert r.status_code == 401


@pytest.mark.parametrize("payload, field", [
    ({"customer": "ana", "items": []}, "items"),
    ({"customer": "ana", "items": [{"sku": "A1", "qty": 0}]}, "qty"),
    ({"customer": "a", "items": [{"sku": "A1", "qty": 1}]}, "customer"),
])
def test_validation_returns_422(client, payload, field):
    r = client.post("/orders", headers=AUTH, json=payload)
    assert r.status_code == 422
    assert field in r.json()["detail"][0]["loc"]


def test_not_found(client):
    assert client.get("/orders/999").status_code == 404


def test_list_filter_and_paginate(client):
    for name in ["ana", "bob", "cy"]:
        new_order(client, name)
    client.patch("/orders/2", headers=AUTH, json={"status": "paid"})
    assert [o["id"] for o in client.get("/orders?limit=2").json()] == [1, 2]
    assert [o["customer"] for o in client.get("/orders?status=paid").json()] == ["bob"]
    assert client.get("/orders?limit=500").status_code == 422


def test_invalid_status_update(client):
    new_order(client)
    assert client.patch("/orders/1", headers=AUTH, json={"status": "lost"}).status_code == 422
