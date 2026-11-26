# 🐍 Python Academy: Python for Java & C# engineers

An interactive, local learning platform that teaches Python the way systems actually **flow**.
Each track is a lifecycle: you follow an HTTP request through an API, a CSV through an ETL pipeline,
or a question through an LLM application. Each step lights up one stage of the diagram, shows the data
at that point, and pairs **runnable Python** with the **Java/C# you already know**.

```
python serve.py          # → http://localhost:8000  (standard library only, nothing to install)
```

## What's inside

| Track | Lifecycle you follow | Steps |
|---|---|---|
| 🐍 Python for Java/C# devs | source → objects → collections → functions → classes → errors → iteration → modules | 8 |
| 🌐 Python for APIs | client → uvicorn (ASGI) → middleware → router → Pydantic → `Depends` → handler + DB → response | 8 |
| 🔄 Python for ETL & Data | extract → validate → transform (pandas) → aggregate → load (idempotent) → orchestrate | 6 |
| 🤖 Python for AI & LLMs | input → prompt → LLM API → structured output → tool loop → RAG → evals | 7 |
| ⚡ Concurrency & async | GIL → threads → processes → asyncio → choosing | 5 |
| 🚀 Job-ready engineering | pytest → typing → config & logging → Docker & CI → 30-day plan | 5 |

Every step has:

- **Lifecycle diagram.** The active stage glows and a packet travels between stages. Click any stage to jump to it.
- **Concept.** A short explanation written for someone who already knows OOP, DI, SQL and HTTP.
- **Python + Java/C# tabs.** Edit the Python and press **Run** (or Ctrl/⌘ + Enter). It runs in your browser
  through [Pyodide](https://pyodide.org) (CPython compiled to WebAssembly), including `pandas` and `pydantic`.
  The first run downloads Python, so it needs internet once.
- **Tip.** A production gotcha or an interview angle.
- **Check yourself.** One question. Answering it correctly marks the step done; progress is saved in your browser.

Keyboard: `←` / `→` move between steps.

## Hands-on labs (real projects, run locally)

The browser is for understanding; the labs are for building. See [`labs/README.md`](labs/README.md).

```
cd labs
python -m venv .venv && source .venv/bin/activate      # Windows: .venv\Scripts\activate
pip install -r requirements.txt
pytest -q
```

| Lab | What you build |
|---|---|
| `01_core` | Katas with tests (skipped until you implement them) |
| `02_api` | A FastAPI orders service: middleware, routers, Pydantic, `Depends`, SQLite, 9 tests |
| `03_etl` | A CSV → SQLite pipeline: quarantine, pandas transforms, idempotent upserts |
| `04_ai` | A RAG retriever, a Claude tool-use agent (with an offline mode) and a retrieval eval |
| `05_async` | The same work with sequential code, threads, asyncio and processes, timed side by side |

## Project layout

```
python-academy/
├── serve.py                  # local web server (stdlib)
├── web/
│   ├── index.html
│   ├── styles.css
│   ├── app.js                # router, diagram, editor, Pyodide runner, quiz
│   └── content.js            # ALL course content: add or edit tracks here
├── labs/                     # runnable projects with pytest suites
└── tools/check_snippets.js   # runs every browser snippet with local python3
```

## Adding your own lessons

All content is data in `web/content.js`. A track is a list of `nodes` (the diagram) and `steps`;
each step points at a node and has `concept`, `code`, `compare`, `tip` and `quiz`.
Set `run: false` for code that needs a server, threads or packages that don't run in the browser.
After editing, check that every runnable snippet still works, then refresh the recorded outputs
(shown when live Python can't run, e.g. offline or in the shared online copy):

```
node tools/check_snippets.js
```

```
node tools/record_outputs.js
```
