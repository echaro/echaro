"""Orders ETL — the "Python for ETL" track as a real, testable pipeline.

    python pipeline.py                         # data/orders.csv → warehouse.db
    python pipeline.py --source my.csv --db out.db

Stages:  extract → validate (quarantine bad rows) → transform (pandas) → load (idempotent upsert)
Every stage is a plain function, so an orchestrator (Airflow/Prefect/Dagster) can wrap it later.
"""
from __future__ import annotations

import argparse
import csv
import json
import logging
import sqlite3
import time
from collections.abc import Iterable, Iterator
from dataclasses import dataclass
from datetime import date
from pathlib import Path

import pandas as pd
from pydantic import BaseModel, Field, ValidationError, field_validator

log = logging.getLogger("etl")
HERE = Path(__file__).parent

# Static FX rates for the exercise. In real life: extract them from an API, per day.
FX_TO_EUR = {"EUR": 1.0, "USD": 0.92, "MXN": 0.051, "INR": 0.011, "JPY": 0.0062}


# ----------------------------------------------------------------- extract
def extract(path: Path) -> Iterator[dict]:
    """Stream rows as raw string dicts. Constant memory, any file size."""
    with path.open(newline="", encoding="utf-8") as f:
        yield from csv.DictReader(f)


# ----------------------------------------------------------------- validate
class Order(BaseModel):
    order_id: int
    customer: str = Field(min_length=1)
    country: str = Field(min_length=2, max_length=2)
    amount: float = Field(ge=0)
    currency: str
    created_at: date

    @field_validator("customer")
    @classmethod
    def clean_name(cls, v: str) -> str:
        return " ".join(v.split()).title()

    @field_validator("country", "currency")
    @classmethod
    def upper(cls, v: str) -> str:
        return v.strip().upper()

    @field_validator("currency")
    @classmethod
    def known_currency(cls, v: str) -> str:
        if v not in FX_TO_EUR:
            raise ValueError(f"unknown currency {v}")
        return v


@dataclass
class Validated:
    good: list[Order]
    rejected: list[dict]


def validate(rows: Iterable[dict]) -> Validated:
    good, rejected = [], []
    for line_no, row in enumerate(rows, start=2):          # line 1 is the header
        try:
            good.append(Order.model_validate(row))
        except ValidationError as e:
            err = e.errors()[0]
            rejected.append({"line": line_no, "field": ".".join(map(str, err["loc"])),
                             "error": err["msg"], "row": row})
    return Validated(good, rejected)


# ----------------------------------------------------------------- transform
def transform(orders: list[Order]) -> pd.DataFrame:
    """Vectorised clean-up and enrichment. No Python loops over rows."""
    df = pd.DataFrame([o.model_dump() for o in orders])
    if df.empty:
        return df
    df = df.drop_duplicates(subset="order_id", keep="last")
    df["amount_eur"] = (df["amount"] * df["currency"].map(FX_TO_EUR)).round(2)
    df["created_at"] = pd.to_datetime(df["created_at"])
    df["month"] = df["created_at"].dt.strftime("%Y-%m")
    df["size"] = pd.cut(df["amount_eur"], bins=[-1, 50, 200, float("inf")], labels=["S", "M", "L"]).astype(str)
    return df.sort_values("order_id").reset_index(drop=True)


def monthly_summary(df: pd.DataFrame) -> pd.DataFrame:
    return (df.groupby(["month", "country"], as_index=False)
              .agg(orders=("order_id", "count"), revenue_eur=("amount_eur", "sum"))
              .round(2))


# ----------------------------------------------------------------- load
SCHEMA = """
CREATE TABLE IF NOT EXISTS fact_orders (
    order_id INTEGER PRIMARY KEY, customer TEXT, country TEXT, amount REAL,
    currency TEXT, amount_eur REAL, month TEXT, size TEXT, created_at TEXT);
CREATE TABLE IF NOT EXISTS rejected_rows (
    run_id TEXT, line INTEGER, field TEXT, error TEXT, raw TEXT);
"""

UPSERT = """
INSERT INTO fact_orders (order_id, customer, country, amount, currency, amount_eur, month, size, created_at)
VALUES (:order_id, :customer, :country, :amount, :currency, :amount_eur, :month, :size, :created_at)
ON CONFLICT(order_id) DO UPDATE SET
    customer = excluded.customer, country = excluded.country, amount = excluded.amount,
    currency = excluded.currency, amount_eur = excluded.amount_eur, month = excluded.month,
    size = excluded.size, created_at = excluded.created_at
"""


def load(df: pd.DataFrame, rejected: list[dict], db: sqlite3.Connection, run_id: str) -> int:
    """Idempotent: re-running the same input leaves the table unchanged."""
    db.executescript(SCHEMA)
    records = df.assign(created_at=df["created_at"].dt.date.astype(str)).to_dict("records") if not df.empty else []
    with db:                                               # one transaction
        db.executemany(UPSERT, records)
        db.executemany("INSERT INTO rejected_rows VALUES (?, ?, ?, ?, ?)",
                       [(run_id, r["line"], r["field"], r["error"], json.dumps(r["row"])) for r in rejected])
    return len(records)


# ----------------------------------------------------------------- orchestrate
def run(source: Path, db_path: str) -> dict:
    run_id = time.strftime("%Y%m%dT%H%M%S")
    start = time.perf_counter()
    validated = validate(extract(source))
    df = transform(validated.good)
    with sqlite3.connect(db_path) as db:
        loaded = load(df, validated.rejected, db, run_id)
    total = len(validated.good) + len(validated.rejected)
    stats = {
        "run_id": run_id, "read": total, "valid": len(validated.good), "rejected": len(validated.rejected),
        "loaded": loaded, "reject_rate": round(len(validated.rejected) / total, 3) if total else 0.0,
        "seconds": round(time.perf_counter() - start, 3),
    }
    log.info("run finished %s", json.dumps(stats))
    if stats["reject_rate"] > 0.5:
        log.error("reject rate above 50%%: upstream schema change?")
    return stats


def main() -> None:
    logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(name)s %(message)s")
    p = argparse.ArgumentParser()
    p.add_argument("--source", type=Path, default=HERE / "data" / "orders.csv")
    p.add_argument("--db", default=str(HERE / "warehouse.db"))
    args = p.parse_args()

    stats = run(args.source, args.db)
    with sqlite3.connect(args.db) as db:
        print("\nRejected rows:")
        for line, field, error in db.execute(
                "SELECT line, field, error FROM rejected_rows WHERE run_id = ?", (stats["run_id"],)):
            print(f"  line {line:>3}  {field:<11} {error}")
        print("\nMonthly revenue (EUR):")
        df = pd.read_sql("SELECT * FROM fact_orders", db, parse_dates=["created_at"])
        print(monthly_summary(df).to_string(index=False))


if __name__ == "__main__":
    main()

# Exercises (see labs/README.md):
#   1. Fetch FX rates from a public API in extract(), with retries and a cache.
#   2. Write the monthly summary to Parquet (df.to_parquet) partitioned by month.
#   3. Add a watermark: only process rows with created_at > the last loaded date.
#   4. Port transform() to Polars or DuckDB and compare speed on 5M generated rows.
