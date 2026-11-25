"""Orders API — the full request lifecycle from the "Python for APIs" track.

Run:   uvicorn app:app --reload        (from labs/02_api)
Docs:  http://localhost:8000/docs      (Swagger UI, generated from the type hints)
Test:  pytest -q

Lifecycle:  uvicorn (ASGI) → middleware → router → pydantic validation
            → dependencies (auth, repository) → handler → response_model → JSON
"""
from __future__ import annotations

import logging
import sqlite3
import time
import uuid
from collections.abc import Iterator
from datetime import datetime, timezone
from typing import Annotated

from fastapi import APIRouter, Depends, FastAPI, Header, HTTPException, Query, Request, status
from pydantic import BaseModel, Field, field_validator

log = logging.getLogger("orders")


# ----------------------------------------------------------------- models (DTOs)
class ItemIn(BaseModel):
    sku: str = Field(min_length=2, examples=["A1"])
    qty: int = Field(gt=0, le=100)
    unit_price: float = Field(default=10.0, gt=0)


class OrderIn(BaseModel):
    customer: str = Field(min_length=2)
    items: list[ItemIn] = Field(min_length=1)

    @field_validator("customer")
    @classmethod
    def normalise(cls, v: str) -> str:
        return v.strip().lower()


class OrderOut(BaseModel):
    id: int
    customer: str
    total: float
    status: str
    created_at: datetime


class StatusUpdate(BaseModel):
    status: str = Field(pattern="^(new|paid|shipped|cancelled)$")


# ----------------------------------------------------------------- repository
class OrderRepo:
    """Persistence behind an interface-like class; swap it for SQLAlchemy later."""

    def __init__(self, conn: sqlite3.Connection):
        self.db = conn
        self.db.row_factory = sqlite3.Row
        self.db.execute(
            """CREATE TABLE IF NOT EXISTS orders (
                   id INTEGER PRIMARY KEY AUTOINCREMENT,
                   customer TEXT NOT NULL,
                   total REAL NOT NULL,
                   status TEXT NOT NULL DEFAULT 'new',
                   created_at TEXT NOT NULL)"""
        )

    def create(self, order: OrderIn) -> dict:
        total = round(sum(i.qty * i.unit_price for i in order.items), 2)
        with self.db:
            cur = self.db.execute(
                "INSERT INTO orders (customer, total, created_at) VALUES (?, ?, ?)",
                (order.customer, total, datetime.now(timezone.utc).isoformat()),
            )
        return self.get(cur.lastrowid)  # type: ignore[return-value]

    def get(self, order_id: int) -> dict | None:
        row = self.db.execute("SELECT * FROM orders WHERE id = ?", (order_id,)).fetchone()
        return dict(row) if row else None

    def list(self, status_: str | None, limit: int, offset: int) -> list[dict]:
        sql, params = "SELECT * FROM orders", []
        if status_:
            sql += " WHERE status = ?"
            params.append(status_)
        sql += " ORDER BY id LIMIT ? OFFSET ?"
        rows = self.db.execute(sql, (*params, limit, offset)).fetchall()
        return [dict(r) for r in rows]

    def set_status(self, order_id: int, new_status: str) -> dict | None:
        with self.db:
            self.db.execute("UPDATE orders SET status = ? WHERE id = ?", (new_status, order_id))
        return self.get(order_id)


# ----------------------------------------------------------------- dependencies
_conn = sqlite3.connect(":memory:", check_same_thread=False)
_repo = OrderRepo(_conn)


def get_repo() -> Iterator[OrderRepo]:
    # A `yield` dependency: code after `yield` runs after the response (cleanup).
    yield _repo


def require_api_key(x_api_key: Annotated[str | None, Header()] = None) -> None:
    if x_api_key != "dev":
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "missing or invalid X-API-Key")


Repo = Annotated[OrderRepo, Depends(get_repo)]


# ----------------------------------------------------------------- app + middleware
app = FastAPI(title="Orders API", version="1.0")


@app.middleware("http")
async def request_context(request: Request, call_next):
    request_id = request.headers.get("x-request-id", uuid.uuid4().hex[:12])
    start = time.perf_counter()
    response = await call_next(request)
    elapsed = (time.perf_counter() - start) * 1000
    response.headers["x-request-id"] = request_id
    response.headers["x-process-ms"] = f"{elapsed:.1f}"
    log.info("%s %s → %s in %.1fms [%s]", request.method, request.url.path, response.status_code, elapsed, request_id)
    return response


@app.get("/health")
def health() -> dict:
    return {"status": "ok"}


# ----------------------------------------------------------------- routes
router = APIRouter(prefix="/orders", tags=["orders"])


@router.post("", response_model=OrderOut, status_code=status.HTTP_201_CREATED,
             dependencies=[Depends(require_api_key)])
def create_order(body: OrderIn, repo: Repo):
    return repo.create(body)


@router.get("/{order_id}", response_model=OrderOut)
def get_order(order_id: int, repo: Repo):
    order = repo.get(order_id)
    if order is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, f"order {order_id} not found")
    return order


@router.get("", response_model=list[OrderOut])
def list_orders(repo: Repo, status_filter: Annotated[str | None, Query(alias="status")] = None,
                limit: Annotated[int, Query(ge=1, le=100)] = 20,
                offset: Annotated[int, Query(ge=0)] = 0):
    return repo.list(status_filter, limit, offset)


@router.patch("/{order_id}", response_model=OrderOut, dependencies=[Depends(require_api_key)])
def update_status(order_id: int, body: StatusUpdate, repo: Repo):
    if repo.get(order_id) is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, f"order {order_id} not found")
    return repo.set_status(order_id, body.status)


app.include_router(router)

# Exercises (see labs/README.md):
#   1. Add DELETE /orders/{id} returning 204.
#   2. Replace sqlite3 with SQLAlchemy 2.0 + a `yield` session dependency.
#   3. Add a /orders/stats endpoint (count + revenue per status).
#   4. Move settings (API key, DB URL) into pydantic-settings, read from env vars.
