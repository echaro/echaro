# Labs

Real code you run on your machine. Each lab maps to a track in the web app.

```
python -m venv .venv && source .venv/bin/activate      # Windows: .venv\Scripts\activate
pip install -r requirements.txt
pytest -q                                              # every lab's tests
```

## 01_core: katas

`katas.py` has five TODO functions. The tests are **skipped** until you implement each one, then they pass.

```
pytest 01_core -v
KATA_IMPL=solutions pytest 01_core -q     # check the reference answers
```

## 02_api: FastAPI orders service

```
cd 02_api
uvicorn app:app --reload                  # open http://localhost:8000/docs
pytest -q
```

Try it from a second terminal:

```
curl -X POST localhost:8000/orders -H "X-API-Key: dev" -H "Content-Type: application/json" -d '{"customer":"Ana","items":[{"sku":"A1","qty":2}]}'
```

Exercises: add `DELETE /orders/{id}`; move to SQLAlchemy 2.0 with a `yield` session dependency; add
`/orders/stats`; move settings to `pydantic-settings`.

## 03_etl: orders pipeline

```
cd 03_etl
python pipeline.py                        # data/orders.csv → warehouse.db, prints rejects + summary
pytest -q
```

Exercises: fetch FX rates from an API with retries; write Parquet partitioned by month; add a watermark
for incremental loads; port `transform()` to Polars or DuckDB and benchmark it.

## 04_ai: RAG + tool-use agent + eval

```
cd 04_ai
python rag.py "can I return a gift card?"            # retrieval only
python eval_rag.py                                    # recall@k, exits 1 below the gate
python assistant.py --offline                         # agent loop with a scripted fake model
```

With a real model (uses `claude-opus-5-5`; API calls are billed to your Anthropic account):

```
export ANTHROPIC_API_KEY=sk-ant-...
python assistant.py "My order 1042 is late and I want a refund. What can I do?"
```

Exercises: replace TF-IDF with an embedding model and a vector store; serve the assistant from a FastAPI
endpoint with a `StreamingResponse`; add an LLM-as-judge eval for answer quality.

## 05_async: concurrency models side by side

```
cd 05_async
python fanout.py
```

## Capstone

Combine the labs into one portfolio project: a **RAG API** with an ingestion pipeline (03), a FastAPI
service (02), Claude with tools (04), an eval set in CI, a Dockerfile and a GitHub Actions workflow.
