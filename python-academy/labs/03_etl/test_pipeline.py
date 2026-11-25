import sqlite3
from pathlib import Path

import pandas as pd
import pytest

from pipeline import extract, load, monthly_summary, run, transform, validate

DATA = Path(__file__).parent / "data" / "orders.csv"


def test_extract_streams_raw_strings():
    first = next(extract(DATA))
    assert first["order_id"] == "1001" and isinstance(first["amount"], str)


def test_validate_quarantines_bad_rows():
    v = validate(extract(DATA))
    reasons = {r["line"]: r["field"] for r in v.rejected}
    assert reasons == {4: "customer", 5: "amount", 9: "amount", 11: "created_at"}
    assert len(v.good) == 8


def test_transform_dedupes_cleans_and_converts():
    df = transform(validate(extract(DATA)).good)
    assert df["order_id"].is_unique
    assert set(df["country"]) <= {"ES", "US", "IN", "DE", "JP", "MX"}
    frank = df.loc[df["order_id"] == 1008].iloc[0]
    assert frank["customer"] == "Frank Moll" and frank["amount_eur"] == 310.0
    bob = df.loc[df["order_id"] == 1002].iloc[0]
    assert bob["amount_eur"] == pytest.approx(32.2)


def test_monthly_summary():
    df = transform(validate(extract(DATA)).good)
    s = monthly_summary(df)
    es_jan = s[(s["month"] == "2026-01") & (s["country"] == "ES")].iloc[0]
    assert es_jan["orders"] == 1 and es_jan["revenue_eur"] == 120.5


def test_load_is_idempotent():
    v = validate(extract(DATA))
    df = transform(v.good)
    db = sqlite3.connect(":memory:")
    load(df, [], db, "r1")
    load(df, [], db, "r2")
    assert db.execute("SELECT COUNT(*) FROM fact_orders").fetchone()[0] == len(df)


def test_correction_updates_in_place():
    db = sqlite3.connect(":memory:")
    df = transform(validate(extract(DATA)).good)
    load(df, [], db, "r1")
    fixed = df[df["order_id"] == 1001].assign(amount=200.0, amount_eur=200.0)
    load(fixed, [], db, "r2")
    assert db.execute("SELECT amount FROM fact_orders WHERE order_id = 1001").fetchone()[0] == 200.0


def test_end_to_end(tmp_path):
    stats = run(DATA, str(tmp_path / "w.db"))
    assert stats["read"] == 12 and stats["rejected"] == 4 and stats["loaded"] == 7
    df = pd.read_sql("SELECT * FROM fact_orders", sqlite3.connect(tmp_path / "w.db"))
    assert len(df) == 7
