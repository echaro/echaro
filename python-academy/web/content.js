// Course content. Each track is a "lifecycle": a flow of stages (nodes) that a
// piece of data travels through. Each step lights up one stage, shows the data
// shape at that point (payload), explains the concept, and gives runnable Python
// next to the Java / C# version you already know.
//
// Step fields:
//   node     id of the active stage in the diagram
//   payload  what the data looks like at this stage
//   concept  HTML explanation
//   code     Python (editable; runs in the browser when run !== false)
//   compare  { lang, code } the Java/C# version for comparison
//   tip      a gotcha or an interview tip
//   quiz     { q, options, answer, why }

window.TRACKS = [
  // ---------------------------------------------------------------- CORE
  {
    id: "core",
    title: "Python for Java/C# devs",
    icon: "🐍",
    tagline: "Re-map what you already know: the 20% of Python that covers 80% of the job.",
    nodes: [
      { id: "src", label: "source .py" },
      { id: "types", label: "objects & types" },
      { id: "data", label: "collections" },
      { id: "fn", label: "functions" },
      { id: "cls", label: "classes" },
      { id: "err", label: "errors & resources" },
      { id: "iter", label: "iteration" },
      { id: "pkg", label: "modules & env" },
    ],
    steps: [
      {
        title: "How Python runs your code",
        node: "src",
        payload: "main.py → bytecode (.pyc) → CPython VM",
        concept: `
<p>Like Java and C#, Python compiles to <b>bytecode</b> and runs it on a virtual machine (CPython).
The differences: there is no separate compile step, no <code>main</code> class, and <b>the file runs top to bottom</b>.
Defining a function <i>is</i> executing a statement that creates a function object.</p>
<ul>
<li><code>if __name__ == "__main__":</code> is the equivalent of <code>static void main</code>: it only runs when the file is executed directly, not when imported.</li>
<li>Indentation is syntax. Four spaces, no braces.</li>
<li>Run <code>python -m dis</code> on a function to see its bytecode, much like <code>javap -c</code>.</li>
</ul>`,
        code: `import dis

def greet(name: str) -> str:
    return f"Hello, {name}!"

if __name__ == "__main__":
    print(greet("Java dev"))
    dis.dis(greet)  # the bytecode, like javap -c
`,
        compare: {
          lang: "Java",
          code: `public class Main {
    static String greet(String name) {
        return "Hello, " + name + "!";
    }
    public static void main(String[] args) {
        System.out.println(greet("Java dev"));
    }
}`,
        },
        tip: "Type hints (<code>name: str</code>) are <b>not enforced at runtime</b>. Tools like <code>mypy</code> or <code>pyright</code> check them, the way <code>javac</code> would. Employers expect typed Python today.",
        quiz: {
          q: "What does <code>if __name__ == \"__main__\":</code> do?",
          options: [
            "Declares the program's main class",
            "Runs the block only when the file is executed directly, not imported",
            "Makes the function public",
          ],
          answer: 1,
          why: "Every module has a <code>__name__</code>. It equals <code>\"__main__\"</code> only for the file you launched.",
        },
      },
      {
        title: "Everything is an object, names are references",
        node: "types",
        payload: "name ──► object(type, value, refcount)",
        concept: `
<p>There are no primitives. <code>1</code>, <code>"a"</code>, functions and classes are all objects on the heap.
A variable is just a <b>name bound to an object</b>, like a Java reference, but the <i>name</i> has no type. The object does.</p>
<ul>
<li><b>Dynamic but strong typing:</b> <code>"1" + 1</code> raises <code>TypeError</code>; nothing is silently converted.</li>
<li><b>Mutable:</b> list, dict, set, most objects. <b>Immutable:</b> int, float, str, tuple, frozenset.</li>
<li><code>==</code> compares values (like <code>.equals()</code>); <code>is</code> compares identity (like Java's <code>==</code> on references).</li>
</ul>`,
        code: `a = [1, 2, 3]
b = a            # same object, two names (like Java references)
b.append(4)
print(a, a is b)

c = list(a)      # a copy
print(c == a, c is a)

x = 10
print(type(x), isinstance(x, int))
try:
    "1" + 1
except TypeError as e:
    print("strong typing:", e)
`,
        compare: {
          lang: "C#",
          code: `var a = new List<int> {1, 2, 3};
var b = a;                 // same reference
b.Add(4);
Console.WriteLine(ReferenceEquals(a, b)); // True

var c = new List<int>(a);  // copy
// "1" + 1 compiles in C# ("11"); Python raises TypeError`,
        },
        tip: "Classic interview trap: <b>mutable default arguments</b>. <code>def f(items=[])</code> creates the list <i>once</i>, at definition time. Use <code>items=None</code> and create it inside.",
        quiz: {
          q: "<code>a = [1]; b = a; b.append(2)</code>. What is <code>a</code>?",
          options: ["[1]", "[1, 2]", "Error"],
          answer: 1,
          why: "<code>a</code> and <code>b</code> are two names for the same list object.",
        },
      },
      {
        title: "Collections & comprehensions (your new LINQ / Streams)",
        node: "data",
        payload: "list[dict] → filter → map → dict",
        concept: `
<p>Four built-ins cover most needs: <code>list</code> (ArrayList), <code>dict</code> (HashMap, insertion-ordered), <code>set</code> (HashSet), <code>tuple</code> (an immutable record).</p>
<p><b>Comprehensions</b> replace most Streams/LINQ pipelines: <code>[expr for x in items if cond]</code>.
Also learn <code>sorted(key=...)</code>, <code>sum</code>, <code>any</code>/<code>all</code>, <code>zip</code>, <code>enumerate</code>, and <code>collections.Counter</code>/<code>defaultdict</code>.</p>`,
        code: `from collections import Counter, defaultdict

orders = [
    {"id": 1, "customer": "ana", "total": 120.0, "status": "paid"},
    {"id": 2, "customer": "bob", "total": 35.5, "status": "refunded"},
    {"id": 3, "customer": "ana", "total": 80.0, "status": "paid"},
]

paid = [o for o in orders if o["status"] == "paid"]          # filter
totals = {o["id"]: o["total"] for o in paid}                  # dict comprehension
print(totals)

by_customer = defaultdict(float)                              # groupBy + sum
for o in paid:
    by_customer[o["customer"]] += o["total"]
print(dict(by_customer))

print(Counter(o["status"] for o in orders))
print(sorted(orders, key=lambda o: o["total"], reverse=True)[0]["id"])

for i, (k, v) in enumerate(totals.items(), start=1):        # tuple unpacking
    print(i, k, v)
`,
        compare: {
          lang: "C# LINQ",
          code: `var paid = orders.Where(o => o.Status == "paid").ToList();
var totals = paid.ToDictionary(o => o.Id, o => o.Total);
var byCustomer = paid.GroupBy(o => o.Customer)
                     .ToDictionary(g => g.Key, g => g.Sum(o => o.Total));
var top = orders.OrderByDescending(o => o.Total).First().Id;`,
        },
        tip: "Pythonic code is scored in interviews. Prefer <code>for item in items</code> over <code>for i in range(len(items))</code>, and use <code>enumerate</code> when you need the index.",
        quiz: {
          q: "Which is the Pythonic way to get the squares of even numbers in <code>nums</code>?",
          options: [
            "<code>list(map(lambda n: n*n, filter(lambda n: n%2==0, nums)))</code>",
            "<code>[n*n for n in nums if n % 2 == 0]</code>",
            "A for loop with <code>range(len(nums))</code>",
          ],
          answer: 1,
          why: "All three work, but the comprehension is the idiomatic, readable choice.",
        },
      },
      {
        title: "Functions: kwargs, first-class functions, decorators",
        node: "fn",
        payload: "call(args, *args, **kwargs) → wrapped(fn)",
        concept: `
<p>Functions are objects: pass them, return them, store them. Parameters can be positional, keyword, defaulted, or variadic:
<code>*args</code> (a tuple, like <code>String...</code>) and <code>**kwargs</code> (a dict of named arguments).</p>
<p>A <b>decorator</b> is a function that wraps another function. It is how FastAPI routes (<code>@app.get</code>),
pytest fixtures and caching (<code>@lru_cache</code>) work. Think of an aspect or annotation that runs real code.</p>`,
        code: `import time
from functools import wraps, lru_cache

def timed(fn):
    @wraps(fn)
    def wrapper(*args, **kwargs):
        start = time.perf_counter()
        result = fn(*args, **kwargs)
        print(f"{fn.__name__} took {(time.perf_counter()-start)*1000:.2f} ms")
        return result
    return wrapper

@timed
def report(title, *rows, sep=" | ", **meta):
    print(title, meta)
    print(sep.join(map(str, rows)))

report("Sales", 10, 20, 30, sep=", ", region="EU")

@lru_cache(maxsize=None)  # memoisation in one line
def fib(n: int) -> int:
    return n if n < 2 else fib(n - 1) + fib(n - 2)

print(fib(80))
`,
        compare: {
          lang: "Java",
          code: `// Closest Java equivalent: an annotation + AOP proxy (Spring @Around),
// or a higher-order function:
static <T> Supplier<T> timed(Supplier<T> fn) {
    return () -> {
        long s = System.nanoTime();
        T r = fn.get();
        System.out.println((System.nanoTime() - s) / 1e6 + " ms");
        return r;
    };
}`,
        },
        tip: "Keyword-only arguments (after <code>*</code>) make APIs safer: <code>def connect(host, *, timeout=5)</code> forces callers to write <code>timeout=</code>.",
        quiz: {
          q: "Inside <code>def f(*args, **kwargs)</code>, what is <code>kwargs</code>?",
          options: ["A list", "A tuple", "A dict of named arguments"],
          answer: 2,
          why: "<code>*args</code> collects extra positional arguments into a tuple and <code>**kwargs</code> collects named ones into a dict.",
        },
      },
      {
        title: "Classes: dataclasses, properties, Protocols",
        node: "cls",
        payload: "@dataclass Order ⇄ Protocol (structural interface)",
        concept: `
<p>OOP works as you expect, with less ceremony. Explicit <code>self</code> instead of <code>this</code>, no access modifiers
(a leading <code>_</code> means "private by convention"), and <code>@property</code> instead of getters and setters.</p>
<ul>
<li><code>@dataclass</code> gives you a constructor, <code>__repr__</code> and <code>__eq__</code>: like a Java <code>record</code> or C# <code>record</code>.</li>
<li><b>Duck typing:</b> no <code>implements</code> needed. <code>typing.Protocol</code> gives you <i>structural</i> interfaces that type checkers verify.</li>
<li>Dunder methods (<code>__len__</code>, <code>__eq__</code>, <code>__iter__</code>) are how you plug into the language, like operator overloading.</li>
<li>Prefer composition and small functions. Python codebases use far fewer class hierarchies than Java ones.</li>
</ul>`,
        code: `from dataclasses import dataclass, field
from typing import Protocol

@dataclass(frozen=True)          # immutable, like a Java record
class Money:
    amount: float
    currency: str = "EUR"

@dataclass
class Order:
    id: int
    items: list[Money] = field(default_factory=list)

    @property
    def total(self) -> float:     # computed attribute, no getTotal()
        return sum(m.amount for m in self.items)

class Notifier(Protocol):         # structural interface
    def send(self, msg: str) -> None: ...

class EmailNotifier:              # note: no "implements"
    def send(self, msg: str) -> None:
        print("email:", msg)

def checkout(order: Order, notifier: Notifier) -> None:
    notifier.send(f"Order {order.id} total {order.total}")

o = Order(1, [Money(10), Money(32.5)])
print(o)
print(Money(1) == Money(1))       # value equality for free
checkout(o, EmailNotifier())
`,
        compare: {
          lang: "Java",
          code: `public record Money(double amount, String currency) {}

public interface Notifier { void send(String msg); }

public class EmailNotifier implements Notifier {
    public void send(String msg) { System.out.println("email: " + msg); }
}

public class Order {
    private final int id;
    private final List<Money> items = new ArrayList<>();
    public double getTotal() {
        return items.stream().mapToDouble(Money::amount).sum();
    }
}`,
        },
        tip: "In interviews, explain <b>why</b> you use a dataclass, Pydantic model or plain dict: dataclass for internal domain objects, Pydantic for validating data from outside (APIs, files, LLM output), dict for throwaway data.",
        quiz: {
          q: "How does a class satisfy a <code>typing.Protocol</code>?",
          options: [
            "By inheriting from it explicitly",
            "By having methods with matching signatures (structural typing)",
            "By being registered with a decorator",
          ],
          answer: 1,
          why: "Protocols are structural, like Go interfaces or TypeScript types. If it has the right shape, it fits.",
        },
      },
      {
        title: "Exceptions & context managers (try-with-resources)",
        node: "err",
        payload: "with resource: ... → __enter__ / __exit__",
        concept: `
<p>Exceptions are unchecked: there is no <code>throws</code> clause. Use <code>try/except/else/finally</code>; <code>else</code> runs only when no exception was raised.</p>
<p>The <code>with</code> statement is <b>try-with-resources</b> (<code>using</code> in C#). Files, DB connections, locks and HTTP sessions all support it.
You can write your own with <code>@contextmanager</code>.</p>
<p>Ask forgiveness, not permission (EAFP): just try the operation and catch the specific error, instead of checking everything up front.</p>`,
        code: `from contextlib import contextmanager

class InsufficientFunds(Exception):
    def __init__(self, needed: float):
        super().__init__(f"need {needed:.2f} more")
        self.needed = needed

@contextmanager
def transaction(name: str):
    print(f"BEGIN {name}")
    try:
        yield
        print("COMMIT")
    except Exception as e:
        print(f"ROLLBACK ({e})")
        raise
    finally:
        print("connection closed")

def withdraw(balance: float, amount: float) -> float:
    if amount > balance:
        raise InsufficientFunds(amount - balance)
    return balance - amount

try:
    with transaction("pay-invoice"):
        withdraw(50, 80)
except InsufficientFunds as e:
    print("handled:", e, "| needed =", e.needed)

config = {}
port = config.get("port", 8080)   # dict.get avoids a KeyError
print(port)
`,
        compare: {
          lang: "C#",
          code: `using (var tx = connection.BeginTransaction()) {
    try {
        Withdraw(50, 80);
        tx.Commit();
    } catch (InsufficientFundsException e) {
        tx.Rollback();
    }
}`,
        },
        tip: "Never write a bare <code>except:</code>. Catch the narrowest exception you can, and use <code>raise ... from err</code> to keep the original cause when you re-raise.",
        quiz: {
          q: "What is Python's equivalent of try-with-resources / <code>using</code>?",
          options: ["<code>finally</code> only", "The <code>with</code> statement", "<code>del</code>"],
          answer: 1,
          why: "<code>with</code> calls <code>__enter__</code> and guarantees <code>__exit__</code> runs, even when an exception is raised.",
        },
      },
      {
        title: "Iterators & generators: lazy data streams",
        node: "iter",
        payload: "yield → one item at a time (constant memory)",
        concept: `
<p>A function containing <code>yield</code> is a <b>generator</b>: it produces values lazily, one at a time. This is the single most important idea for
<b>ETL</b> (processing files bigger than RAM) and for <b>AI</b> (streaming tokens from an LLM).</p>
<p>Generator expressions <code>(x for x in ...)</code> are lazy comprehensions. Generators chain like Java Streams: nothing runs until something consumes them.</p>`,
        code: `def read_lines(n):
    for i in range(1, n + 1):          # imagine a 10 GB file
        yield f"{i},item-{i},{i * 1.5}"

def parse(lines):
    for line in lines:
        id_, name, price = line.split(",")
        yield {"id": int(id_), "name": name, "price": float(price)}

def expensive(rows, threshold):
    return (r for r in rows if r["price"] > threshold)  # generator expression

pipeline = expensive(parse(read_lines(1_000_000)), 1_499_990)
print(type(pipeline))                  # nothing has run yet
for row in pipeline:                   # pulls items one by one
    print(row)

total = sum(r["price"] for r in parse(read_lines(1000)))
print("total:", total)
`,
        compare: {
          lang: "Java Streams",
          code: `Stream.iterate(1, i -> i + 1).limit(1_000_000)
      .map(i -> new Row(i, "item-" + i, i * 1.5))
      .filter(r -> r.price() > 1_499_990)
      .forEach(System.out::println);`,
        },
        tip: "A generator can only be consumed <b>once</b>. If you need the data twice, materialise it with <code>list()</code>, but only if it fits in memory.",
        quiz: {
          q: "Why do generators matter for ETL?",
          options: [
            "They run in parallel",
            "They process data lazily, so memory stays constant regardless of file size",
            "They are compiled to C",
          ],
          answer: 1,
          why: "Only one record is in memory at a time.",
        },
      },
      {
        title: "Modules, packages, virtualenvs & tooling",
        node: "pkg",
        payload: "pyproject.toml → .venv → import app.services",
        concept: `
<p>A <b>module</b> is a <code>.py</code> file; a <b>package</b> is a folder of modules. <code>import</code> works like Java packages, but at runtime.</p>
<p>Each project gets its own <b>virtual environment</b> (<code>.venv</code>), the equivalent of a project-local Maven/NuGet cache.
<code>pyproject.toml</code> plays the role of <code>pom.xml</code> or <code>.csproj</code>.</p>
<table>
<tr><th>Java / C#</th><th>Python</th></tr>
<tr><td>Maven, Gradle, NuGet</td><td>pip, <b>uv</b> (fast, modern), poetry</td></tr>
<tr><td>JUnit, xUnit</td><td><b>pytest</b></td></tr>
<tr><td>javac / Roslyn type checks</td><td><b>mypy</b>, pyright</td></tr>
<tr><td>Checkstyle, Spotless</td><td><b>ruff</b> (lint and format)</td></tr>
<tr><td>Spring Boot, ASP.NET</td><td><b>FastAPI</b>, Django, Flask</td></tr>
</table>`,
        code: `# A typical project layout:
#
# my_service/
# ├── pyproject.toml        # dependencies + tool config (like pom.xml)
# ├── src/my_service/
# │   ├── __init__.py       # marks a package
# │   ├── api.py
# │   └── services.py
# └── tests/test_services.py
#
# Shell:
#   python -m venv .venv && source .venv/bin/activate
#   pip install -e ".[dev]"      or:   uv sync
#   pytest -q && ruff check . && mypy src

import sys, json, pathlib
print(sys.version.split()[0])
print(pathlib.Path("data") / "orders.csv")   # paths with the / operator
print(json.dumps({"ok": True}))
`,
        compare: {
          lang: "Maven",
          code: `<dependency>
  <groupId>org.springframework.boot</groupId>
  <artifactId>spring-boot-starter-web</artifactId>
</dependency>
<!-- Python equivalent in pyproject.toml:
dependencies = ["fastapi>=0.115", "uvicorn[standard]"] -->`,
        },
        tip: "Never <code>pip install</code> into the system Python. One venv per project. Mentioning <code>uv</code>, <code>ruff</code> and <code>pytest</code> signals you know modern Python.",
        quiz: {
          q: "What plays the role of <code>pom.xml</code> in modern Python?",
          options: ["setup.cfg", "pyproject.toml", "requirements.lock"],
          answer: 1,
          why: "<code>pyproject.toml</code> (PEP 621) holds metadata, dependencies and tool configuration.",
        },
      },
    ],
  },

  // ---------------------------------------------------------------- API
  {
    id: "api",
    title: "Python for APIs",
    icon: "🌐",
    tagline: "Follow one HTTP request through a FastAPI service, from socket to JSON response.",
    nodes: [
      { id: "client", label: "client" },
      { id: "asgi", label: "uvicorn (ASGI)" },
      { id: "mw", label: "middleware" },
      { id: "router", label: "router" },
      { id: "validate", label: "pydantic" },
      { id: "deps", label: "dependencies" },
      { id: "handler", label: "handler + DB" },
      { id: "response", label: "response" },
    ],
    steps: [
      {
        title: "The client sends a request",
        node: "client",
        payload: 'POST /orders  {"customer":"ana","items":[{"sku":"A1","qty":2}]}',
        concept: `
<p>Everything starts with an HTTP request. In Python you call APIs with <b>httpx</b> (sync and async) or <b>requests</b> (sync, classic).
Calling other services is half of backend work, so learn timeouts, retries and status handling.</p>`,
        code: `# Runs locally (not in the browser): pip install httpx
import httpx

payload = {"customer": "ana", "items": [{"sku": "A1", "qty": 2}]}

with httpx.Client(base_url="http://localhost:8000", timeout=5.0) as client:
    r = client.post("/orders", json=payload, headers={"X-API-Key": "dev"})
    r.raise_for_status()            # raises on 4xx / 5xx
    print(r.status_code, r.json())
`,
        run: false,
        compare: {
          lang: "Java",
          code: `HttpClient client = HttpClient.newHttpClient();
HttpRequest req = HttpRequest.newBuilder(URI.create("http://localhost:8000/orders"))
    .header("Content-Type", "application/json")
    .POST(BodyPublishers.ofString(json)).build();
HttpResponse<String> r = client.send(req, BodyHandlers.ofString());`,
        },
        tip: "Always set a <b>timeout</b>. <code>requests</code> has no default timeout and will hang forever, which is a classic production incident.",
        quiz: {
          q: "Which library supports both sync and async HTTP calls?",
          options: ["requests", "httpx", "urllib"],
          answer: 1,
          why: "httpx offers <code>Client</code> and <code>AsyncClient</code> with the same API.",
        },
      },
      {
        title: "Uvicorn & ASGI: the server layer",
        node: "asgi",
        payload: "bytes → ASGI scope {type, method, path, headers} → app(scope, receive, send)",
        concept: `
<p><b>Uvicorn</b> is the web server (think Tomcat or Kestrel). It speaks <b>ASGI</b>, a standard interface: your app is just an async callable
<code>app(scope, receive, send)</code>. FastAPI, Starlette and Django all implement it.</p>
<p>The older standard, <b>WSGI</b> (Flask, classic Django), is synchronous. ASGI adds async support, WebSockets and streaming, which is why it is the default for AI APIs that stream tokens.</p>
<p>The code below is a complete raw ASGI app with no framework, so you can see what FastAPI hides.</p>`,
        code: `import asyncio, json

async def app(scope, receive, send):          # the whole ASGI contract
    assert scope["type"] == "http"
    body = json.dumps({"path": scope["path"], "method": scope["method"]}).encode()
    await send({"type": "http.response.start", "status": 200,
                "headers": [(b"content-type", b"application/json")]})
    await send({"type": "http.response.body", "body": body})

# Simulate what uvicorn does when a request arrives:
async def fake_server():
    sent = []
    async def receive():
        return {"type": "http.request", "body": b""}
    async def send(message):
        sent.append(message)
    await app({"type": "http", "method": "GET", "path": "/health", "headers": []}, receive, send)
    for m in sent:
        print(m)

await fake_server()   # top-level await works in the browser; locally use asyncio.run(fake_server())
`,
        compare: {
          lang: "Java Servlet",
          code: `public class Health extends HttpServlet {
    protected void doGet(HttpServletRequest req, HttpServletResponse res)
            throws IOException {
        res.setContentType("application/json");
        res.getWriter().write("{\\"path\\": \\"" + req.getRequestURI() + "\\"}");
    }
}`,
        },
        tip: "In production: <code>uvicorn app:app --workers 4</code> (or gunicorn with uvicorn workers) behind a reverse proxy. Each worker is a separate <b>process</b>, which is how Python scales across CPU cores.",
        quiz: {
          q: "Why is ASGI preferred over WSGI for AI APIs?",
          options: [
            "It is faster at JSON parsing",
            "It supports async I/O, streaming responses and WebSockets",
            "It removes the GIL",
          ],
          answer: 1,
          why: "Streaming LLM tokens and waiting on many slow upstream calls need async I/O.",
        },
      },
      {
        title: "Middleware: cross-cutting concerns",
        node: "mw",
        payload: "request → [timing] → [auth] → [cors] → app",
        concept: `
<p>Middleware wraps the whole app, exactly like Servlet filters or ASP.NET middleware: logging, timing, CORS, request IDs.
It is the decorator pattern applied to the request pipeline.</p>`,
        code: `# Run locally: labs/02_api/app.py
import time, uuid
from fastapi import FastAPI, Request

app = FastAPI()

@app.middleware("http")
async def add_timing_and_request_id(request: Request, call_next):
    request_id = request.headers.get("x-request-id", str(uuid.uuid4()))
    start = time.perf_counter()
    response = await call_next(request)          # the rest of the pipeline
    response.headers["x-request-id"] = request_id
    response.headers["x-process-ms"] = f"{(time.perf_counter() - start) * 1000:.1f}"
    return response
`,
        run: false,
        compare: {
          lang: "ASP.NET Core",
          code: `app.Use(async (context, next) => {
    var sw = Stopwatch.StartNew();
    await next();
    context.Response.Headers["x-process-ms"] = sw.ElapsedMilliseconds.ToString();
});`,
        },
        tip: "Keep middleware thin. Per-route concerns such as auth or DB sessions belong in <b>dependencies</b> (step 6), which are easier to test and override.",
        quiz: {
          q: "Middleware in FastAPI is closest to…",
          options: ["Servlet filters / ASP.NET middleware", "JPA entities", "Java annotations processors"],
          answer: 0,
          why: "Both wrap every request and response in a chain.",
        },
      },
      {
        title: "Routing: decorators map URLs to functions",
        node: "router",
        payload: "POST /orders → create_order()   GET /orders/{order_id} → get_order(order_id: int)",
        concept: `
<p>Routes are decorators. Path parameters, query parameters and the body are declared as <b>typed function parameters</b>.
FastAPI reads the type hints to parse, validate and document them, and builds an OpenAPI/Swagger UI at <code>/docs</code> automatically.</p>
<p>Group routes with <code>APIRouter</code>, the equivalent of a Spring <code>@RestController</code> class.</p>`,
        code: `from fastapi import APIRouter, FastAPI, Query

router = APIRouter(prefix="/orders", tags=["orders"])

@router.get("/{order_id}")                       # path param, parsed as int
def get_order(order_id: int):
    return {"id": order_id}

@router.get("")                                   # query params with validation
def list_orders(status: str | None = None, limit: int = Query(20, le=100)):
    return {"status": status, "limit": limit}

app = FastAPI(title="Orders API")
app.include_router(router)
# uvicorn app:app --reload  →  open http://localhost:8000/docs
`,
        run: false,
        compare: {
          lang: "Spring Boot",
          code: `@RestController
@RequestMapping("/orders")
public class OrderController {
    @GetMapping("/{orderId}")
    public Order get(@PathVariable int orderId) { ... }

    @GetMapping
    public List<Order> list(@RequestParam(required = false) String status,
                            @RequestParam(defaultValue = "20") @Max(100) int limit) { ... }
}`,
        },
        tip: "Use <code>def</code> handlers for blocking code (FastAPI runs them in a thread pool) and <code>async def</code> only if everything inside is awaitable. A blocking call inside <code>async def</code> freezes the whole server.",
        quiz: {
          q: "What happens if you call <code>time.sleep(5)</code> inside an <code>async def</code> handler?",
          options: [
            "Only that request waits",
            "The event loop is blocked: all requests on that worker stall",
            "FastAPI moves it to a thread automatically",
          ],
          answer: 1,
          why: "<code>async def</code> runs on the event loop. Use <code>await asyncio.sleep()</code> or a plain <code>def</code> handler.",
        },
      },
      {
        title: "Validation with Pydantic: your DTOs",
        node: "validate",
        payload: "raw JSON dict → OrderIn (validated) | 422 error details",
        concept: `
<p><b>Pydantic</b> models are DTOs with built-in validation and serialization (Bean Validation plus Jackson in one).
FastAPI validates the body against the model <i>before</i> your handler runs; invalid input returns <b>422</b> with precise error locations.</p>
<p>Pydantic is used everywhere: API bodies, settings (<code>pydantic-settings</code>), ETL row validation, and <b>LLM structured output</b>. Learn it well.</p>
<p>This one runs in the browser. Edit the payload and break it on purpose.</p>`,
        code: `from pydantic import BaseModel, Field, ValidationError, field_validator

class Item(BaseModel):
    sku: str = Field(min_length=2)
    qty: int = Field(gt=0, le=100)

class OrderIn(BaseModel):
    customer: str
    items: list[Item] = Field(min_length=1)

    @field_validator("customer")
    @classmethod
    def normalise(cls, v: str) -> str:
        return v.strip().lower()

good = OrderIn.model_validate({"customer": "  Ana ", "items": [{"sku": "A1", "qty": "2"}]})
print(good)                    # "2" was coerced to int 2
print(good.model_dump_json())

try:
    OrderIn.model_validate({"customer": "bob", "items": [{"sku": "A", "qty": 0}]})
except ValidationError as e:
    for err in e.errors():     # what FastAPI returns as a 422
        print(err["loc"], "→", err["msg"])
`,
        compare: {
          lang: "Java (Bean Validation)",
          code: `public record Item(@Size(min = 2) String sku,
                   @Min(1) @Max(100) int qty) {}

public record OrderIn(@NotNull String customer,
                      @NotEmpty @Valid List<Item> items) {}
// + @Valid @RequestBody in the controller`,
        },
        tip: "Separate models for input and output (<code>OrderIn</code>, <code>OrderOut</code>) so you never leak internal fields such as password hashes. Set <code>response_model=OrderOut</code> on the route.",
        quiz: {
          q: "What HTTP status does FastAPI return when the body fails Pydantic validation?",
          options: ["400", "422", "500"],
          answer: 1,
          why: "422 Unprocessable Entity, with a list of errors and their locations.",
        },
      },
      {
        title: "Dependency injection with Depends()",
        node: "deps",
        payload: "Depends(get_db) → Session   Depends(api_key_auth) → User",
        concept: `
<p>FastAPI's DI is function-based: a dependency is any callable, and the framework calls it per request and injects the result.
Dependencies can depend on other dependencies and can <code>yield</code> for setup and teardown, which is perfect for DB sessions.</p>
<p>In tests you swap them with <code>app.dependency_overrides[get_db] = fake_db</code>, the equivalent of <code>@MockBean</code>.</p>`,
        code: `from typing import Annotated
from fastapi import Depends, FastAPI, Header, HTTPException

app = FastAPI()

class OrderRepo:                                  # your "service/repository"
    def __init__(self):
        self._rows: dict[int, dict] = {}
    def add(self, data: dict) -> dict:
        row = {"id": len(self._rows) + 1, **data}
        self._rows[row["id"]] = row
        return row

_repo = OrderRepo()

def get_repo() -> OrderRepo:                      # a provider
    return _repo

def require_api_key(x_api_key: Annotated[str, Header()]) -> str:
    if x_api_key != "dev":
        raise HTTPException(status_code=401, detail="bad api key")
    return x_api_key

Repo = Annotated[OrderRepo, Depends(get_repo)]

@app.post("/orders", status_code=201, dependencies=[Depends(require_api_key)])
def create_order(body: dict, repo: Repo):
    return repo.add(body)
`,
        run: false,
        compare: {
          lang: "ASP.NET Core",
          code: `builder.Services.AddScoped<IOrderRepo, OrderRepo>();

[HttpPost("/orders")]
[Authorize(Policy = "ApiKey")]
public IActionResult Create(OrderIn body, [FromServices] IOrderRepo repo)
    => Created("", repo.Add(body));`,
        },
        tip: "With <code>yield</code> dependencies (<code>def get_db(): db = Session(); yield db; db.close()</code>) cleanup is guaranteed, like a scoped service being disposed.",
        quiz: {
          q: "How do you replace a dependency in tests?",
          options: [
            "Monkeypatch the import",
            "<code>app.dependency_overrides[original] = fake</code>",
            "Restart the app with a flag",
          ],
          answer: 1,
          why: "Overrides are the built-in, clean way to inject fakes.",
        },
      },
      {
        title: "Handler + database: business logic & persistence",
        node: "handler",
        payload: "OrderIn → INSERT INTO orders ... → row(id=42)",
        concept: `
<p>The handler should be thin: validate (already done), call a service, return a model. For persistence, <b>SQLAlchemy 2.0</b> is the Hibernate/EF of Python;
<b>SQLModel</b> combines it with Pydantic. Below, the stdlib <code>sqlite3</code> keeps it runnable in the browser.</p>
<p>Always use <b>parameterised queries</b> (<code>?</code> placeholders), never f-strings, to avoid SQL injection.</p>`,
        code: `import sqlite3
from dataclasses import dataclass

conn = sqlite3.connect(":memory:")
conn.row_factory = sqlite3.Row
conn.execute("CREATE TABLE orders (id INTEGER PRIMARY KEY, customer TEXT, total REAL)")

@dataclass
class OrderService:
    db: sqlite3.Connection

    def create(self, customer: str, total: float) -> dict:
        with self.db:  # commits on success, rolls back on error
            cur = self.db.execute(
                "INSERT INTO orders (customer, total) VALUES (?, ?)",  # parameterised
                (customer, total),
            )
        return self.get(cur.lastrowid)

    def get(self, order_id: int) -> dict | None:
        row = self.db.execute("SELECT * FROM orders WHERE id = ?", (order_id,)).fetchone()
        return dict(row) if row else None

svc = OrderService(conn)
print(svc.create("ana", 99.9))
print(svc.create("bob", 15.0))
print(svc.get(3))  # None → the route would raise HTTPException(404)
`,
        compare: {
          lang: "Spring Data JPA",
          code: `@Entity class Order { @Id @GeneratedValue Long id; String customer; double total; }

interface OrderRepo extends JpaRepository<Order, Long> {}

@Service class OrderService {
    @Transactional
    Order create(String c, double t) { return repo.save(new Order(c, t)); }
}`,
        },
        tip: "Interviewers love the N+1 query problem. In SQLAlchemy you fix it with <code>selectinload()</code> or <code>joinedload()</code>, the same idea as JPA fetch joins.",
        quiz: {
          q: "Which is safe against SQL injection?",
          options: [
            "<code>f\"SELECT * FROM t WHERE id = {user_id}\"</code>",
            "<code>execute(\"SELECT * FROM t WHERE id = ?\", (user_id,))</code>",
            "<code>\"SELECT ... id = \" + str(user_id)</code>",
          ],
          answer: 1,
          why: "Placeholders send data separately from SQL, so input can never change the query structure.",
        },
      },
      {
        title: "Response serialization & testing the whole flow",
        node: "response",
        payload: '201 Created  {"id":1,"customer":"ana","total":99.9}',
        concept: `
<p>The return value is filtered through <code>response_model</code>, serialized to JSON and sent with the right status.
Errors become JSON through <code>HTTPException</code> or custom exception handlers (like <code>@ControllerAdvice</code>).</p>
<p>Testing is where Python shines: <code>TestClient</code> runs the full stack in-process, with no server needed. The full working service and tests are in <code>labs/02_api</code>.</p>`,
        code: `# labs/02_api/test_app.py  →  run:  pytest labs/02_api -q
from fastapi.testclient import TestClient
from app import app

client = TestClient(app)

def test_create_and_fetch_order():
    r = client.post("/orders", headers={"X-API-Key": "dev"},
                    json={"customer": "Ana", "items": [{"sku": "A1", "qty": 2}]})
    assert r.status_code == 201
    order = r.json()
    assert order["customer"] == "ana"

    r = client.get(f"/orders/{order['id']}")
    assert r.status_code == 200

def test_validation_error_returns_422():
    r = client.post("/orders", headers={"X-API-Key": "dev"},
                    json={"customer": "x", "items": []})
    assert r.status_code == 422
`,
        run: false,
        compare: {
          lang: "Spring MockMvc",
          code: `mockMvc.perform(post("/orders")
        .contentType(APPLICATION_JSON).content(json))
    .andExpect(status().isCreated())
    .andExpect(jsonPath("$.customer").value("ana"));`,
        },
        tip: "Portfolio idea: a FastAPI service with Pydantic models, SQLAlchemy, pytest tests, a Dockerfile and a GitHub Actions workflow. That covers about 80% of junior Python backend job descriptions.",
        quiz: {
          q: "What does <code>response_model=OrderOut</code> do?",
          options: [
            "Validates the request body",
            "Filters and validates the returned data and documents it in OpenAPI",
            "Caches the response",
          ],
          answer: 1,
          why: "It shapes the output: extra fields are dropped and the schema appears in <code>/docs</code>.",
        },
      },
    ],
  },

  // ---------------------------------------------------------------- ETL
  {
    id: "etl",
    title: "Python for ETL & Data",
    icon: "🔄",
    tagline: "Move a messy CSV through extract, validate, transform and load, then make it production-grade.",
    nodes: [
      { id: "extract", label: "extract" },
      { id: "validate", label: "validate" },
      { id: "transform", label: "transform (pandas)" },
      { id: "aggregate", label: "aggregate" },
      { id: "load", label: "load" },
      { id: "orchestrate", label: "orchestrate" },
    ],
    steps: [
      {
        title: "Extract: read files and APIs without loading everything",
        node: "extract",
        payload: "orders.csv (raw strings, bad rows included)",
        concept: `
<p>Sources are CSV/JSON files, databases, S3 buckets and REST APIs. The stdlib <code>csv</code> and <code>json</code> modules plus generators let you
stream rows of any size. Treat <b>everything as strings</b> until you validate it.</p>`,
        code: `import csv, io

RAW = """order_id,customer,country,amount,created_at
1,Ana,ES,120.50,2026-01-03
2,bob,us,35,2026-01-04
3,,ES,80,2026-01-04
4,Carla,MX,abc,2026-01-05
5,Ana,ES,42.10,2026-02-01
2,bob,us,35,2026-01-04
"""

def extract(fileobj):
    """Yield one dict per row. In real life: open('orders.csv', newline='')."""
    yield from csv.DictReader(fileobj)

rows = list(extract(io.StringIO(RAW)))
print(len(rows), "rows")
print(rows[0])
`,
        compare: {
          lang: "Java",
          code: `try (var reader = Files.newBufferedReader(Path.of("orders.csv"))) {
    CSVParser parser = CSVFormat.DEFAULT.withFirstRecordAsHeader().parse(reader);
    for (CSVRecord r : parser) { ... }
}`,
        },
        tip: "For APIs, paginate with a generator: <code>while url: page = get(url); yield from page['items']; url = page['next']</code>. Callers never need to know about pagination.",
        quiz: {
          q: "What type are the values returned by <code>csv.DictReader</code>?",
          options: ["Inferred (int, float…)", "Always str", "bytes"],
          answer: 1,
          why: "CSV has no types. Parsing and validation are your job.",
        },
      },
      {
        title: "Validate: quarantine bad rows instead of crashing",
        node: "validate",
        payload: "raw dict → Order ✓  |  raw dict → rejected[] ✗ (with reason)",
        concept: `
<p>Real data is dirty. A good pipeline <b>never dies on one bad row</b>: it validates each record, keeps the good ones, and writes the bad ones to a
<b>dead-letter / quarantine</b> output with the reason. Pydantic is perfect for this.</p>`,
        code: `import csv, io
from datetime import date
from pydantic import BaseModel, Field, ValidationError, field_validator

RAW = """order_id,customer,country,amount,created_at
1,Ana,ES,120.50,2026-01-03
2,bob,us,35,2026-01-04
3,,ES,80,2026-01-04
4,Carla,MX,abc,2026-01-05
5,Ana,ES,42.10,2026-02-01
2,bob,us,35,2026-01-04
"""

class Order(BaseModel):
    order_id: int
    customer: str = Field(min_length=1)
    country: str
    amount: float = Field(ge=0)
    created_at: date

    @field_validator("customer", "country")
    @classmethod
    def clean(cls, v: str) -> str:
        return v.strip()

def validate(rows):
    good, bad = [], []
    for i, row in enumerate(rows, start=2):  # line 1 is the header
        try:
            good.append(Order.model_validate(row))
        except ValidationError as e:
            bad.append({"line": i, "row": row, "error": e.errors()[0]["msg"]})
    return good, bad

good, bad = validate(csv.DictReader(io.StringIO(RAW)))
print(f"{len(good)} valid, {len(bad)} rejected")
for b in bad:
    print("  line", b["line"], "→", b["error"])
`,
        compare: {
          lang: "C#",
          code: `foreach (var row in rows) {
    var result = validator.Validate(row);   // FluentValidation
    if (result.IsValid) good.Add(row);
    else bad.Add((row, result.Errors.First().ErrorMessage));
}`,
        },
        tip: "Track and alert on the <b>reject rate</b>. A jump from 0.1% to 30% usually means the upstream schema changed, and you want to know before your dashboards are wrong.",
        quiz: {
          q: "A row has <code>amount = \"abc\"</code>. A good pipeline should…",
          options: ["Crash so someone notices", "Set amount to 0 silently", "Quarantine the row with a reason and continue"],
          answer: 2,
          why: "Quarantine keeps the pipeline running while keeping bad data visible and auditable.",
        },
      },
      {
        title: "Transform with pandas: vectorised, not loops",
        node: "transform",
        payload: "DataFrame[order_id, customer, country, amount, created_at] → cleaned + derived columns",
        concept: `
<p><b>pandas</b> is the Excel/SQL of Python: a <code>DataFrame</code> is a table with typed columns. The golden rule is to use
<b>vectorised column operations</b> (implemented in C) instead of Python loops; they are often 100× faster.</p>
<p>Core moves: <code>read_csv</code>, <code>astype</code>, <code>to_datetime</code>, boolean filtering, <code>drop_duplicates</code>, <code>assign</code>, <code>str</code> accessors.
First run downloads pandas into your browser (~10 s).</p>`,
        code: `import io
import pandas as pd

RAW = """order_id,customer,country,amount,created_at
1,Ana,ES,120.50,2026-01-03
2,bob,us,35,2026-01-04
3,,ES,80,2026-01-04
4,Carla,MX,abc,2026-01-05
5,Ana,ES,42.10,2026-02-01
2,bob,us,35,2026-01-04
"""

df = pd.read_csv(io.StringIO(RAW), dtype=str)

df = (
    df.drop_duplicates()
      .assign(
          customer=lambda d: d["customer"].str.strip().str.title(),
          country=lambda d: d["country"].str.upper(),
          amount=lambda d: pd.to_numeric(d["amount"], errors="coerce"),
          created_at=lambda d: pd.to_datetime(d["created_at"]),
      )
      .dropna(subset=["customer", "amount"])
      .astype({"order_id": int})
)
df["month"] = df["created_at"].dt.to_period("M").astype(str)
df["is_big"] = df["amount"] > 100          # vectorised, no loop

print(df)
print(df.dtypes)
`,
        compare: {
          lang: "SQL",
          code: `SELECT DISTINCT order_id,
       INITCAP(TRIM(customer)) AS customer,
       UPPER(country)          AS country,
       TRY_CAST(amount AS DECIMAL) AS amount,
       DATE_TRUNC('month', created_at) AS month,
       amount > 100 AS is_big
FROM raw_orders
WHERE customer IS NOT NULL AND TRY_CAST(amount AS DECIMAL) IS NOT NULL;`,
        },
        tip: "<code>df.apply(lambda row: ..., axis=1)</code> is a Python loop in disguise. Reach for column operations, <code>np.where</code> or <code>.map</code> first. For data that does not fit in RAM, look at <b>Polars</b> or <b>DuckDB</b>.",
        quiz: {
          q: "Fastest way to add <code>price_with_tax</code> to a 10M-row DataFrame?",
          options: [
            "<code>for i, row in df.iterrows(): ...</code>",
            "<code>df['price_with_tax'] = df['price'] * 1.21</code>",
            "<code>df.apply(lambda r: r.price * 1.21, axis=1)</code>",
          ],
          answer: 1,
          why: "A vectorised operation runs in compiled code over the whole column at once.",
        },
      },
      {
        title: "Aggregate: groupby, merge, pivot",
        node: "aggregate",
        payload: "orders × countries → revenue per country per month",
        concept: `
<p>Analytics questions map to <code>groupby().agg()</code> (GROUP BY), <code>merge</code> (JOIN) and <code>pivot_table</code>.
If you know SQL, you already know the logic. Learn the syntax.</p>`,
        code: `import pandas as pd

orders = pd.DataFrame({
    "order_id": [1, 2, 5, 6, 7],
    "country":  ["ES", "US", "ES", "MX", "US"],
    "month":    ["2026-01", "2026-01", "2026-02", "2026-02", "2026-02"],
    "amount":   [120.5, 35.0, 42.1, 60.0, 99.0],
})
countries = pd.DataFrame({"country": ["ES", "US", "MX"],
                          "region": ["EMEA", "AMER", "AMER"]})

enriched = orders.merge(countries, on="country", how="left")      # JOIN

summary = (enriched.groupby(["region", "month"], as_index=False)  # GROUP BY
                   .agg(revenue=("amount", "sum"),
                        orders=("order_id", "count"),
                        avg_ticket=("amount", "mean")))
print(summary.round(2))

print(enriched.pivot_table(index="region", columns="month",
                           values="amount", aggfunc="sum", fill_value=0))
`,
        compare: {
          lang: "SQL",
          code: `SELECT c.region, o.month,
       SUM(o.amount) AS revenue,
       COUNT(o.order_id) AS orders,
       AVG(o.amount) AS avg_ticket
FROM orders o LEFT JOIN countries c ON o.country = c.country
GROUP BY c.region, o.month;`,
        },
        tip: "After a <code>merge</code>, check the row count. An unexpected increase means duplicate keys on the right side; pass <code>validate=\"many_to_one\"</code> to catch it.",
        quiz: {
          q: "pandas' equivalent of SQL JOIN is…",
          options: ["<code>concat</code>", "<code>merge</code>", "<code>pivot</code>"],
          answer: 1,
          why: "<code>merge</code> joins on keys; <code>concat</code> stacks tables.",
        },
      },
      {
        title: "Load: idempotent writes to a database",
        node: "load",
        payload: "DataFrame → UPSERT INTO fact_orders (re-runnable safely)",
        concept: `
<p>Loading must be <b>idempotent</b>: running the same job twice must not duplicate data. Use <b>upserts</b> (<code>INSERT ... ON CONFLICT DO UPDATE</code>)
or replace a whole partition (delete month, insert month) inside one transaction.</p>
<p>Targets: Postgres (via SQLAlchemy), a warehouse (Snowflake, BigQuery), or Parquet files in a data lake.</p>`,
        code: `import sqlite3

rows = [  # output of the transform step
    (1, "Ana", "ES", 120.5, "2026-01"),
    (2, "Bob", "US", 35.0, "2026-01"),
    (5, "Ana", "ES", 42.1, "2026-02"),
]

db = sqlite3.connect(":memory:")
db.execute("""CREATE TABLE fact_orders (
    order_id INTEGER PRIMARY KEY, customer TEXT, country TEXT,
    amount REAL, month TEXT)""")

UPSERT = """INSERT INTO fact_orders VALUES (?, ?, ?, ?, ?)
ON CONFLICT(order_id) DO UPDATE SET amount = excluded.amount,
                                    customer = excluded.customer"""

def load(rows):
    with db:                      # one transaction: all or nothing
        db.executemany(UPSERT, rows)

load(rows)
load(rows)                        # run twice: still 3 rows
load([(2, "Bob", "US", 40.0, "2026-01")])   # a correction updates in place
print(db.execute("SELECT COUNT(*) FROM fact_orders").fetchone())
print(db.execute("SELECT * FROM fact_orders WHERE order_id = 2").fetchone())
`,
        compare: {
          lang: "Java JDBC",
          code: `try (var ps = conn.prepareStatement(UPSERT)) {
    conn.setAutoCommit(false);
    for (var r : rows) { ps.setInt(1, r.id()); ...; ps.addBatch(); }
    ps.executeBatch();
    conn.commit();
}`,
        },
        tip: "Interview answer for \"how do you make a pipeline safe to retry?\": idempotent loads (upsert or partition overwrite), deterministic transforms, and a watermark (\"last processed timestamp\") stored with the data.",
        quiz: {
          q: "Your job crashed halfway and is retried. What prevents duplicates?",
          options: ["Plain INSERT", "Idempotent upserts or partition overwrite inside a transaction", "A bigger server"],
          answer: 1,
          why: "Idempotency means re-running produces the same final state.",
        },
      },
      {
        title: "Orchestrate & observe: production pipelines",
        node: "orchestrate",
        payload: "schedule → extract ▸ validate ▸ transform ▸ load → logs, metrics, retries",
        concept: `
<p>In production, steps become tasks in a DAG run by an orchestrator: <b>Airflow</b> (industry standard), <b>Prefect</b> or <b>Dagster</b> (modern, Pythonic).
They provide scheduling, retries, backfills and monitoring. Your job is to write <b>small, pure, testable functions</b>, which the orchestrator then wires together.</p>
<p>Below is the core idea in plain Python: composable steps, retries with backoff, and structured logging.</p>`,
        code: `import logging, random, time
from functools import wraps

logging.basicConfig(level=logging.INFO, format="%(levelname)s %(message)s", force=True)
log = logging.getLogger("etl")

def retry(times=3, backoff=0.1):
    def deco(fn):
        @wraps(fn)
        def wrapper(*a, **kw):
            for attempt in range(1, times + 1):
                try:
                    return fn(*a, **kw)
                except ConnectionError as e:
                    log.warning("%s failed (attempt %d/%d): %s", fn.__name__, attempt, times, e)
                    if attempt == times:
                        raise
                    time.sleep(backoff * 2 ** attempt)   # exponential backoff
        return wrapper
    return deco

random.seed(7)

@retry(times=4)
def extract():
    if random.random() < 0.6:
        raise ConnectionError("API timeout")
    return [{"id": 1, "amount": "10"}, {"id": 2, "amount": "x"}]

def transform(rows):
    out = [r | {"amount": float(r["amount"])} for r in rows if r["amount"].isdigit()]
    log.info("transform: %d in, %d out", len(rows), len(out))
    return out

def load(rows):
    log.info("load: wrote %d rows", len(rows))

def run_pipeline():
    start = time.perf_counter()
    load(transform(extract()))
    log.info("pipeline ok in %.2fs", time.perf_counter() - start)

run_pipeline()
`,
        compare: {
          lang: "Airflow (Python)",
          code: `from airflow.decorators import dag, task

@dag(schedule="@daily", catchup=False)
def orders_pipeline():
    @task(retries=3)
    def extract(): ...
    @task
    def transform(rows): ...
    @task
    def load(rows): ...
    load(transform(extract()))

orders_pipeline()`,
        },
        tip: "The full pipeline, with tests, lives in <code>labs/03_etl</code>. Data engineering roles also expect SQL, Parquet, a cloud store (S3/GCS) and dbt, so pair this track with SQL practice.",
        quiz: {
          q: "What should the orchestrator (Airflow, Prefect) handle, not your code?",
          options: ["Business transformations", "Scheduling, retries, backfills and monitoring", "Column validation rules"],
          answer: 1,
          why: "Keep business logic in plain, testable functions; let the orchestrator run them.",
        },
      },
    ],
  },

  // ---------------------------------------------------------------- AI
  {
    id: "ai",
    title: "Python for AI & LLMs",
    icon: "🤖",
    tagline: "Trace a user question through an LLM app: prompt, model call, tools, retrieval, structured output and evals.",
    nodes: [
      { id: "input", label: "user input" },
      { id: "prompt", label: "prompt" },
      { id: "llm", label: "LLM API" },
      { id: "structured", label: "structured output" },
      { id: "tools", label: "tool loop" },
      { id: "rag", label: "retrieval (RAG)" },
      { id: "eval", label: "evals" },
    ],
    steps: [
      {
        title: "Why Python owns AI",
        node: "input",
        payload: '"Which of my orders shipped late?"',
        concept: `
<p>Every major model provider ships a Python SDK first, and the ecosystem (NumPy, pandas, PyTorch, scikit-learn, Hugging Face) is Python.
As an <b>AI application engineer</b> you mostly do not train models. You build <b>systems around them</b>: prompts, API calls, tools, retrieval, evaluation, plus the API and ETL skills from the other tracks.</p>
<p>The underlying math is vectors. Text becomes a list of numbers (an <b>embedding</b>), and "similar meaning" becomes "small angle between vectors".
Here is cosine similarity in pure Python; NumPy does the same thing faster.</p>`,
        code: `import math

def cosine(a: list[float], b: list[float]) -> float:
    dot = sum(x * y for x, y in zip(a, b))
    return dot / (math.sqrt(sum(x * x for x in a)) * math.sqrt(sum(y * y for y in b)))

# toy 3-d "embeddings": [about_shipping, about_money, about_food]
vectors = {
    "my parcel is delayed":   [0.9, 0.1, 0.0],
    "refund my payment":      [0.1, 0.9, 0.0],
    "best pizza in town":     [0.0, 0.1, 0.9],
}
query = [0.8, 0.3, 0.0]  # "where is my package?"

for text, vec in sorted(vectors.items(), key=lambda kv: -cosine(query, kv[1])):
    print(f"{cosine(query, vec):.3f}  {text}")
`,
        compare: {
          lang: "Java",
          code: `double dot = 0, na = 0, nb = 0;
for (int i = 0; i < a.length; i++) {
    dot += a[i] * b[i]; na += a[i] * a[i]; nb += b[i] * b[i];
}
double cosine = dot / (Math.sqrt(na) * Math.sqrt(nb));`,
        },
        tip: "Job titles to search: <i>AI Engineer</i>, <i>LLM Engineer</i>, <i>Applied AI</i>, <i>ML Platform</i>. They ask for Python, FastAPI, an LLM SDK, RAG, vector databases and evals, all covered in this track.",
        quiz: {
          q: "In an embedding space, two texts with similar meaning have…",
          options: ["The same length", "A high cosine similarity", "The same tokens"],
          answer: 1,
          why: "Embeddings put similar meanings close together; cosine measures the angle between them.",
        },
      },
      {
        title: "Prompts are code: templates, roles, versioning",
        node: "prompt",
        payload: "system: role + rules | user: context + question",
        concept: `
<p>A request to a chat model is a list of <b>messages</b> with roles (<code>user</code>, <code>assistant</code>) plus a <b>system prompt</b>
that sets behaviour. Treat prompts like code: keep them in files or constants, template them, version them, and test them.</p>
<p>Good prompts give context, say clearly what you want, show the output format, and separate data from instructions (for example with XML-style tags).</p>`,
        code: `from string import Template

SYSTEM = """You are a support assistant for an online shop.
Answer only from the order data provided. If the data does not contain
the answer, say so. Reply in at most three sentences."""

USER_TEMPLATE = Template("""<orders>
$orders
</orders>

Question: $question""")

def build_messages(orders: list[dict], question: str) -> tuple[str, list[dict]]:
    order_lines = "\\n".join(f"- #{o['id']} {o['status']} (promised {o['promised']})" for o in orders)
    user = USER_TEMPLATE.substitute(orders=order_lines, question=question)
    return SYSTEM, [{"role": "user", "content": user}]

system, messages = build_messages(
    [{"id": 1, "status": "delivered 2026-03-04", "promised": "2026-03-01"},
     {"id": 2, "status": "in transit", "promised": "2026-03-10"}],
    "Which of my orders shipped late?",
)
print(system, "\\n---")
print(messages[0]["content"])
`,
        compare: {
          lang: "C#",
          code: `var user = $"""
<orders>
{string.Join("\\n", orders.Select(o => $"- #{o.Id} {o.Status}"))}
</orders>

Question: {question}
""";`,
        },
        tip: "Never paste untrusted user text into the <i>system</i> prompt. Keep it in the user message, inside tags, so instructions and data stay separate (a first defence against prompt injection).",
        quiz: {
          q: "Where should untrusted user-provided text go?",
          options: ["In the system prompt", "In the user message, clearly delimited", "Appended to tool definitions"],
          answer: 1,
          why: "Keeping instructions (system) separate from data (user content) reduces prompt-injection risk.",
        },
      },
      {
        title: "Calling an LLM API (Claude Python SDK)",
        node: "llm",
        payload: "messages.create(model, system, messages) → content blocks + usage",
        concept: `
<p>An LLM call is an HTTPS request. The official SDK handles auth, retries and typed responses.
Read the API key from an environment variable, never hard-code it. Check <code>stop_reason</code> and track <code>usage</code> (tokens are your cost).</p>
<p>The browser version below uses a <b>fake client</b> with the same shape, so you can run it without a key. The real version is in the comments and in <code>labs/04_ai</code>.</p>`,
        code: `# Real version (run locally):
#   pip install anthropic   and   export ANTHROPIC_API_KEY=...
#
#   import anthropic
#   client = anthropic.Anthropic()            # reads ANTHROPIC_API_KEY
#   response = client.messages.create(
#       model="claude-opus-5-5",
#       max_tokens=1024,
#       system=system,
#       messages=messages,
#   )

from dataclasses import dataclass

@dataclass
class Block: type: str; text: str
@dataclass
class Usage: input_tokens: int; output_tokens: int
@dataclass
class Response: content: list; stop_reason: str; usage: Usage

class FakeClient:                              # same shape as the real SDK
    class messages:
        @staticmethod
        def create(model, max_tokens, messages, system=None):
            q = messages[-1]["content"]
            return Response([Block("text", f"(fake {model}) You asked: {q!r}")],
                            "end_turn", Usage(len(q) // 4, 12))

client = FakeClient()
response = client.messages.create(
    model="claude-opus-5-5", max_tokens=1024,
    system="You are concise.",
    messages=[{"role": "user", "content": "Explain Python generators in one line."}],
)
if response.stop_reason == "max_tokens":
    print("warning: answer was cut off")
print("".join(b.text for b in response.content if b.type == "text"))
print("tokens:", response.usage)
`,
        compare: {
          lang: "Java SDK",
          code: `AnthropicClient client = AnthropicOkHttpClient.fromEnv();
Message msg = client.messages().create(MessageCreateParams.builder()
    .model("claude-opus-5-5")
    .maxTokens(1024)
    .addUserMessage("Explain Python generators in one line.")
    .build());`,
        },
        tip: "Stream long answers to users (<code>client.messages.stream(...)</code>) and serve them from FastAPI with a <code>StreamingResponse</code>. That is where your async and generator knowledge pays off.",
        quiz: {
          q: "Where should the API key come from?",
          options: ["A constant in the code", "An environment variable or secret manager", "The prompt"],
          answer: 1,
          why: "Keys in code end up in git history. The SDK reads <code>ANTHROPIC_API_KEY</code> from the environment automatically.",
        },
      },
      {
        title: "Structured output: make the LLM return validated data",
        node: "structured",
        payload: "free text → JSON → Pydantic model (or retry)",
        concept: `
<p>Applications need <b>data</b>, not prose. Ask for JSON that matches a schema, then <b>validate it with Pydantic</b>, the same tool from the API and ETL tracks.
Modern APIs can enforce a JSON schema for you (structured outputs), but validation on your side is still your safety net.</p>
<p>Typical uses: extracting fields from emails or invoices, classifying tickets, routing requests.</p>`,
        code: `import json
from typing import Literal
from pydantic import BaseModel, Field, ValidationError

class Ticket(BaseModel):
    category: Literal["shipping", "billing", "product", "other"]
    urgency: int = Field(ge=1, le=5)
    order_id: int | None = None
    summary: str = Field(max_length=120)

# Pretend these came back from the model:
llm_outputs = [
    '{"category": "shipping", "urgency": 4, "order_id": 1042, "summary": "Parcel 5 days late"}',
    '{"category": "angry", "urgency": 9, "summary": "???"}',
    'Sure! Here is the JSON you asked for...',
]

def parse_ticket(raw: str) -> Ticket | None:
    try:
        return Ticket.model_validate(json.loads(raw))
    except (json.JSONDecodeError, ValidationError) as e:
        # in production: retry, sending the error back to the model
        print("  invalid:", str(e).splitlines()[0])
        return None

for raw in llm_outputs:
    print(parse_ticket(raw))

print(json.dumps(Ticket.model_json_schema()["properties"]["category"]))
`,
        compare: {
          lang: "C#",
          code: `var ticket = JsonSerializer.Deserialize<Ticket>(raw);
var errors = new List<ValidationResult>();
bool ok = Validator.TryValidateObject(ticket, new(ticket), errors, true);`,
        },
        tip: "<code>Model.model_json_schema()</code> gives you a JSON Schema to send to the model. Your Pydantic model is the single source of truth for both the prompt and the validation.",
        quiz: {
          q: "The model returned JSON with <code>urgency: 9</code> (allowed 1–5). Best response?",
          options: ["Store it anyway", "Validation fails → retry with the error message or fall back", "Clamp it silently to 5"],
          answer: 1,
          why: "Fail loudly and let the model correct itself, or route to a fallback. Silent fixes hide bugs.",
        },
      },
      {
        title: "Tool use: the agent loop",
        node: "tools",
        payload: "model → tool_use{name, input} → your function → tool_result → model → answer",
        concept: `
<p>With <b>tool use</b> (function calling), you describe your Python functions with a JSON schema. The model decides when to call one and
returns a <code>tool_use</code> block. <i>Your</i> code runs the function and sends the result back. You repeat until the model answers.
That loop is what people call an <b>agent</b>.</p>
<p>The scripted fake model below follows exactly the message protocol of the real API, so you can watch the loop run.</p>`,
        code: `import json

ORDERS = {1042: {"status": "in transit", "eta": "2026-03-12"}}

def get_order_status(order_id: int) -> dict:          # a real Python function
    return ORDERS.get(order_id, {"error": "not found"})

TOOLS = [{
    "name": "get_order_status",
    "description": "Look up shipping status and ETA for an order id.",
    "input_schema": {"type": "object",
                     "properties": {"order_id": {"type": "integer"}},
                     "required": ["order_id"]},
}]
REGISTRY = {"get_order_status": get_order_status}

def fake_model(messages, tools):
    """Scripted stand-in for client.messages.create(...)"""
    last = messages[-1]["content"]
    if isinstance(last, str):        # first turn → ask to call a tool
        return {"stop_reason": "tool_use", "content": [
            {"type": "tool_use", "id": "tu_1", "name": "get_order_status", "input": {"order_id": 1042}}]}
    result = json.loads(last[0]["content"])
    return {"stop_reason": "end_turn", "content": [
        {"type": "text", "text": f"Order 1042 is {result['status']}, arriving {result['eta']}."}]}

messages = [{"role": "user", "content": "Where is order 1042?"}]
while True:                                            # ← the agent loop
    response = fake_model(messages, TOOLS)
    messages.append({"role": "assistant", "content": response["content"]})
    if response["stop_reason"] != "tool_use":
        break
    results = []
    for block in response["content"]:
        if block["type"] == "tool_use":
            print("model calls →", block["name"], block["input"])
            output = REGISTRY[block["name"]](**block["input"])
            results.append({"type": "tool_result", "tool_use_id": block["id"],
                            "content": json.dumps(output)})
    messages.append({"role": "user", "content": results})

print("answer:", response["content"][0]["text"])
`,
        compare: {
          lang: "Java (pseudo)",
          code: `while (true) {
    Message r = client.messages().create(params(messages, tools));
    messages.add(assistant(r.content()));
    if (r.stopReason() != StopReason.TOOL_USE) break;
    messages.add(user(r.content().stream()
        .filter(ContentBlock::isToolUse)
        .map(t -> toolResult(t.id(), registry.call(t.name(), t.input())))
        .toList()));
}`,
        },
        tip: "Tools are an attack surface. Validate tool inputs, give tools the least privilege they need, and require human confirmation for anything destructive (payments, deletes, emails).",
        quiz: {
          q: "Who actually executes the tool function?",
          options: ["The model provider's servers", "Your Python code", "The browser"],
          answer: 1,
          why: "The model only <i>requests</i> a call. Your code decides whether to run it and sends back the result.",
        },
      },
      {
        title: "RAG: retrieval-augmented generation",
        node: "rag",
        payload: "docs → chunks → index → top-k for query → prompt context → grounded answer",
        concept: `
<p>Models do not know <i>your</i> data. <b>RAG</b> fixes that: split documents into chunks, index them, retrieve the most relevant chunks
for each question, and put them in the prompt. In production you use an embedding model and a vector database (pgvector, Qdrant, Chroma).</p>
<p>Below is a complete retriever in pure Python using TF-IDF vectors, with the same pipeline shape as a real one.</p>`,
        code: `import math, re
from collections import Counter

DOCS = {
    "returns.md":  "You can return any product within 30 days. Refunds are issued to the original payment method within 5 business days.",
    "shipping.md": "Standard shipping takes 3 to 5 days. Express shipping takes 1 day. Late parcels can be reported after 7 days.",
    "warranty.md": "Electronics have a 2 year warranty. The warranty does not cover accidental damage.",
}

STOP = {"the", "a", "to", "my", "i", "can", "be", "is", "are", "how", "until", "get", "any", "you", "of", "in", "within", "after"}

def tokenize(text):                            # lowercase, drop stopwords, crude stemming
    return [w.rstrip("s") for w in re.findall(r"[a-z]+", text.lower()) if w not in STOP]

def chunk(text):                               # one sentence per chunk
    return [c.strip() for c in re.split(r"(?<=[.!?])\\s+", text) if c.strip()]

chunks = [(name, c) for name, text in DOCS.items() for c in chunk(text)]
df = Counter(t for _, c in chunks for t in set(tokenize(c)))
N = len(chunks)

def vector(text):                              # TF-IDF "embedding"
    tf = Counter(tokenize(text))
    return {t: n * math.log((N + 1) / (df.get(t, 0) + 1)) for t, n in tf.items()}

def cosine(a, b):
    dot = sum(a[t] * b.get(t, 0) for t in a)
    na, nb = math.sqrt(sum(v * v for v in a.values())), math.sqrt(sum(v * v for v in b.values()))
    return dot / (na * nb) if na and nb else 0.0

index = [(name, c, vector(c)) for name, c in chunks]

def retrieve(query, k=2):
    q = vector(query)
    return sorted(index, key=lambda item: -cosine(q, item[2]))[:k]

question = "how many days until I get my refund?"
context = "\\n".join(f"[{name}] {c}" for name, c, _ in retrieve(question))
print("Retrieved context:\\n" + context)
print("\\nPrompt sent to the LLM:\\n" +
      f"<context>\\n{context}\\n</context>\\nAnswer using only the context. Cite the file.\\nQ: {question}")
`,
        compare: {
          lang: "Concept",
          code: `Indexing (offline, an ETL job!):
  load docs → chunk → embed(chunk) → store(vector, text, metadata)

Query (online, an API endpoint!):
  embed(question) → vector_db.search(top_k) → build prompt → LLM → answer + citations`,
        },
        tip: "RAG is ETL (indexing) plus an API (querying) plus an LLM, so this track combines everything you have learned. Most quality problems come from <b>retrieval</b> (chunking, metadata, hybrid keyword + vector search), not from the model.",
        quiz: {
          q: "Most RAG answer-quality problems come from…",
          options: ["The temperature setting", "Retrieving the wrong or incomplete chunks", "The model's size"],
          answer: 1,
          why: "If the right context is not retrieved, even the best model cannot answer correctly.",
        },
      },
      {
        title: "Evals: tests for non-deterministic systems",
        node: "eval",
        payload: "dataset[(input, expected)] → run system → score → compare versions",
        concept: `
<p>You cannot unit-test an LLM with exact string asserts, but you <b>can</b> measure it. An <b>eval</b> is a dataset of inputs with expected properties,
a runner, and a scorer (exact match, rules, or another LLM as judge). Run it every time you change a prompt, model or retriever.</p>
<p>This is the skill that separates AI engineers from people who only write demos. Below, an eval measures the retriever from the previous step.</p>`,
        code: `# A retrieval eval: does the right document come back in the top-k?
cases = [
    ("how long do refunds take",            "returns.md"),
    ("is express delivery available",       "shipping.md"),
    ("does warranty cover dropping my phone","warranty.md"),
    ("my parcel is late what can I do",     "shipping.md"),
    ("I dropped my phone, is it covered?",  "warranty.md"),  # no shared keywords!
]

# toy retriever: keyword overlap (swap in the TF-IDF one from the RAG step)
DOCS = {
    "returns.md":  "return product 30 days refund payment business days",
    "shipping.md": "standard express shipping days late parcels reported",
    "warranty.md": "electronics 2 year warranty accidental damage",
}
def retrieve(q, k=1):
    words = set(q.lower().split())
    return sorted(DOCS, key=lambda d: -len(words & set(DOCS[d].split())))[:k]

def run_eval(k):
    hits = 0
    for question, expected in cases:
        got = retrieve(question, k)
        ok = expected in got
        hits += ok
        print(f"{'✓' if ok else '✗'} {question!r:45} → {got}")
    print(f"recall@{k} = {hits}/{len(cases)} = {hits / len(cases):.0%}\\n")

run_eval(k=1)
run_eval(k=2)
# The miss is a synonym problem ("dropped" vs "accidental damage").
# Keyword search can't see it; embeddings or hybrid search can. Evals show you where.
`,
        compare: {
          lang: "Analogy",
          code: `Unit tests      → assert exact output     (deterministic code)
Evals           → score over a dataset    (probabilistic systems)
Regression gate → CI fails if score drops below threshold`,
        },
        tip: "Start with 20–50 real examples, not 5,000 synthetic ones. Track the score per version in a table, and put the eval in CI like any other test. Labs: <code>labs/04_ai/eval_rag.py</code>.",
        quiz: {
          q: "You changed the system prompt. How do you know it is better?",
          options: ["Try two questions by hand", "Re-run the eval set and compare scores", "Ask the model if it is better"],
          answer: 1,
          why: "Only a fixed dataset with a score tells you whether the change helped or hurt.",
        },
      },
    ],
  },

  // ---------------------------------------------------------------- ASYNC
  {
    id: "async",
    title: "Concurrency & async",
    icon: "⚡",
    tagline: "The GIL, threads, processes and asyncio: pick the right model for I/O-bound vs CPU-bound work.",
    nodes: [
      { id: "gil", label: "the GIL" },
      { id: "threads", label: "threads (I/O)" },
      { id: "procs", label: "processes (CPU)" },
      { id: "asyncio", label: "asyncio" },
      { id: "choose", label: "choosing" },
    ],
    steps: [
      {
        title: "The GIL: why Python threads are different",
        node: "gil",
        payload: "1 interpreter → 1 thread runs Python bytecode at a time",
        concept: `
<p>In CPython, the <b>Global Interpreter Lock</b> allows only one thread to execute Python bytecode at a time. Consequences:</p>
<ul>
<li><b>I/O-bound</b> work (HTTP, DB, files, LLM calls): threads and asyncio work well, because the GIL is released while waiting.</li>
<li><b>CPU-bound</b> work in pure Python: threads do <i>not</i> speed it up. Use processes, or libraries that run in C (NumPy, pandas) and release the GIL.</li>
</ul>
<p>Python 3.13+ ships an experimental <i>free-threaded</i> build without the GIL. Mention it in interviews, but the rules above still describe most production systems.</p>`,
        code: `import time

def cpu_work(n=300_000):
    return sum(i * i for i in range(n))

start = time.perf_counter()
for _ in range(4):
    cpu_work()
print(f"4 × CPU task sequentially: {time.perf_counter() - start:.2f}s")
print("With threads this would take about the same time because of the GIL.")
print("With 4 processes it can be ~4× faster on 4 cores.")
`,
        compare: {
          lang: "Java",
          code: `// Java threads run truly in parallel on all cores:
ExecutorService pool = Executors.newFixedThreadPool(4);
for (int i = 0; i < 4; i++) pool.submit(() -> cpuWork());
// In Python, the equivalent for CPU work is ProcessPoolExecutor.`,
        },
        tip: "The one-sentence interview answer: \"Threads or asyncio for I/O-bound work, multiprocessing for CPU-bound pure-Python work, and vectorised libraries whenever possible.\"",
        quiz: {
          q: "You need to call 100 slow HTTP endpoints. Is the GIL a problem?",
          options: ["Yes, use processes", "No, the GIL is released while waiting on I/O", "Yes, Python can't do this"],
          answer: 1,
          why: "Waiting on the network does not hold the GIL, so threads and asyncio give real speedups here.",
        },
      },
      {
        title: "Threads for I/O: concurrent.futures",
        node: "threads",
        payload: "ThreadPoolExecutor(max_workers=8).map(fetch, urls)",
        concept: `
<p><code>concurrent.futures</code> is Python's <code>ExecutorService</code>. <code>ThreadPoolExecutor</code> is the simplest way to speed up
blocking I/O in synchronous code (for example <code>requests</code> calls in an ETL job). Below, a simulated 0.3 s call shows the speedup.</p>
<p>(Threads do not run in the browser sandbox, so run this one locally.)</p>`,
        code: `import time
from concurrent.futures import ThreadPoolExecutor, as_completed

def fetch(url: str) -> str:
    time.sleep(0.3)             # simulates a network call (releases the GIL)
    return f"{url} → 200"

urls = [f"https://api.example.com/items/{i}" for i in range(10)]

start = time.perf_counter()
with ThreadPoolExecutor(max_workers=10) as pool:
    futures = {pool.submit(fetch, u): u for u in urls}
    for fut in as_completed(futures):
        print(fut.result())
print(f"10 calls in {time.perf_counter() - start:.2f}s (sequential would be 3s)")
`,
        run: false,
        compare: {
          lang: "Java",
          code: `ExecutorService pool = Executors.newFixedThreadPool(10);
List<Future<String>> fs = urls.stream()
    .map(u -> pool.submit(() -> fetch(u))).toList();
for (Future<String> f : fs) System.out.println(f.get());`,
        },
        tip: "Swap <code>ThreadPoolExecutor</code> for <code>ProcessPoolExecutor</code> and the same code runs CPU-bound tasks in parallel across cores. Same API.",
        quiz: {
          q: "<code>concurrent.futures</code> is closest to which Java API?",
          options: ["CompletableFuture only", "ExecutorService", "ForkJoin streams"],
          answer: 1,
          why: "Executors with <code>submit</code>, futures and <code>map</code>, the same mental model.",
        },
      },
      {
        title: "Processes for CPU-bound work",
        node: "procs",
        payload: "ProcessPoolExecutor → N interpreters, N GILs, N cores",
        concept: `
<p>Each process has its own interpreter and its own GIL, so you get real parallelism. The trade-off: arguments and results are <b>pickled</b>
(serialised) between processes, so send small inputs and do big work. Web servers use the same idea: <code>uvicorn --workers 4</code> starts 4 processes.</p>`,
        code: `# Run locally: python this_file.py
import time
from concurrent.futures import ProcessPoolExecutor

def cpu_work(n: int) -> int:
    return sum(i * i for i in range(n))

if __name__ == "__main__":          # required for multiprocessing on Windows/macOS
    jobs = [3_000_000] * 8

    start = time.perf_counter()
    [cpu_work(n) for n in jobs]
    print(f"sequential: {time.perf_counter() - start:.2f}s")

    start = time.perf_counter()
    with ProcessPoolExecutor() as pool:
        list(pool.map(cpu_work, jobs))
    print(f"processes:  {time.perf_counter() - start:.2f}s")
`,
        run: false,
        compare: {
          lang: "C#",
          code: `Parallel.ForEach(jobs, n => CpuWork(n));
// .NET threads are truly parallel; Python needs processes for this.`,
        },
        tip: "Before reaching for processes, check whether NumPy, pandas or Polars can do the work vectorised. That is often faster than any amount of parallel Python.",
        quiz: {
          q: "Why must data sent to a process pool be small-ish?",
          options: ["The GIL limits it", "It is pickled and copied between processes", "Processes share no CPU"],
          answer: 1,
          why: "Inter-process communication serialises everything, which costs time and memory.",
        },
      },
      {
        title: "asyncio: thousands of concurrent I/O tasks",
        node: "asyncio",
        payload: "event loop ⟲ await fetch() × 100 → asyncio.gather",
        concept: `
<p><code>async</code>/<code>await</code> works like C#'s and JavaScript's: a single thread runs an <b>event loop</b>, and each <code>await</code> yields control while waiting.
It scales to thousands of concurrent connections, which makes it ideal for API servers, web scraping and calling LLMs in parallel.</p>
<ul>
<li><code>asyncio.gather(*tasks)</code> ≈ <code>Task.WhenAll</code>. <code>asyncio.TaskGroup</code> (3.11+) adds structured error handling.</li>
<li><code>asyncio.Semaphore</code> limits concurrency (respect rate limits!).</li>
<li>Rule: never call blocking code inside <code>async def</code>. Use async libraries (httpx, asyncpg) or <code>asyncio.to_thread</code>.</li>
</ul>`,
        code: `import asyncio, random, time

random.seed(1)

async def call_llm(i: int, sem: asyncio.Semaphore) -> str:
    async with sem:                               # at most 5 in flight
        await asyncio.sleep(random.uniform(0.1, 0.3))   # network wait
        return f"summary #{i}"

async def main():
    sem = asyncio.Semaphore(5)
    start = time.perf_counter()
    results = await asyncio.gather(*(call_llm(i, sem) for i in range(20)))
    print(results[:3], "...")
    print(f"20 calls in {time.perf_counter() - start:.2f}s (sequential ≈ 4s)")

await main()   # top-level await works in the browser; locally use asyncio.run(main())
`,
        compare: {
          lang: "C#",
          code: `var sem = new SemaphoreSlim(5);
var tasks = Enumerable.Range(0, 20).Select(async i => {
    await sem.WaitAsync();
    try { await Task.Delay(200); return $"summary #{i}"; }
    finally { sem.Release(); }
});
var results = await Task.WhenAll(tasks);`,
        },
        tip: "In C#, calling an async method starts it. In Python, calling a coroutine function only <i>creates</i> a coroutine. Nothing runs until you <code>await</code> it or schedule it with <code>create_task</code>/<code>gather</code>.",
        quiz: {
          q: "What does <code>coro = fetch()</code> do when <code>fetch</code> is <code>async def</code>?",
          options: ["Starts the request immediately", "Creates a coroutine object; nothing runs until awaited", "Blocks until done"],
          answer: 1,
          why: "Unlike C# Tasks, Python coroutines are lazy.",
        },
      },
      {
        title: "Choosing the right tool",
        node: "choose",
        payload: "I/O-bound → asyncio / threads | CPU-bound → processes / vectorise",
        concept: `
<table>
<tr><th>Workload</th><th>Use</th><th>Example</th></tr>
<tr><td>Many API/LLM calls in an async app</td><td><b>asyncio</b> + httpx</td><td>FastAPI endpoint fanning out to 3 services</td></tr>
<tr><td>Some blocking I/O in sync code</td><td><b>ThreadPoolExecutor</b></td><td>ETL downloading 500 files</td></tr>
<tr><td>Heavy pure-Python computation</td><td><b>ProcessPoolExecutor</b></td><td>Parsing 10k PDFs</td></tr>
<tr><td>Numeric / tabular data</td><td><b>NumPy / pandas / Polars</b></td><td>Aggregating 50M rows</td></tr>
<tr><td>Long-running background jobs</td><td><b>Task queue</b> (Celery, RQ, Arq)</td><td>Send emails, re-index documents</td></tr>
</table>`,
        code: `def choose(io_bound: bool, already_async: bool, numeric: bool) -> str:
    if numeric:
        return "vectorise with NumPy / pandas / Polars"
    if io_bound:
        return "asyncio + async libraries" if already_async else "ThreadPoolExecutor"
    return "ProcessPoolExecutor (or a task queue for background jobs)"

scenarios = {
    "FastAPI endpoint calling 3 microservices": (True, True, False),
    "nightly script downloading 500 CSVs":      (True, False, False),
    "resize 10,000 images":                     (False, False, False),
    "sum revenue over 50M rows":                (False, False, True),
}
for name, args in scenarios.items():
    print(f"{name:45} → {choose(*args)}")
`,
        compare: {
          lang: "Mapping",
          code: `Java/C# thread pool (CPU)   → Python ProcessPoolExecutor
Java/C# thread pool (I/O)   → Python ThreadPoolExecutor
C# async/await, CompletableFuture → Python asyncio
Spring @Async / Hangfire    → Celery / RQ / Arq`,
        },
        tip: "Being able to explain this table clearly is a strong signal in Python interviews for both backend and data roles.",
        quiz: {
          q: "Resize 10,000 images in pure Python as fast as possible:",
          options: ["asyncio", "ThreadPoolExecutor", "ProcessPoolExecutor"],
          answer: 2,
          why: "CPU-bound work needs multiple processes to use multiple cores.",
        },
      },
    ],
  },

  // ---------------------------------------------------------------- PROD
  {
    id: "prod",
    title: "Job-ready engineering",
    icon: "🚀",
    tagline: "The professional toolchain: tests, types, config, logging, packaging and a 30-day plan.",
    nodes: [
      { id: "test", label: "pytest" },
      { id: "types", label: "typing" },
      { id: "config", label: "config & logs" },
      { id: "ship", label: "docker & CI" },
      { id: "plan", label: "career plan" },
    ],
    steps: [
      {
        title: "Testing with pytest",
        node: "test",
        payload: "test_*.py → plain assert → fixtures → parametrize",
        concept: `
<p><b>pytest</b> is the standard. Tests are plain functions with plain <code>assert</code>: no classes, no <code>assertEquals</code>.
<b>Fixtures</b> provide setup and teardown through dependency injection (by parameter name); <code>@pytest.mark.parametrize</code> gives you data-driven tests.
Use <code>unittest.mock</code> or the <code>monkeypatch</code> fixture for mocks.</p>`,
        code: `# test_pricing.py → run: pytest -q
import pytest

def apply_discount(total: float, code: str | None) -> float:
    rates = {"SAVE10": 0.10, "VIP": 0.25}
    if code and code not in rates:
        raise ValueError(f"unknown code {code}")
    return round(total * (1 - rates.get(code, 0)), 2)

@pytest.fixture
def cart_total():            # injected by parameter name
    return 200.0

@pytest.mark.parametrize("code, expected", [
    (None, 200.0), ("SAVE10", 180.0), ("VIP", 150.0),
])
def test_discounts(cart_total, code, expected):
    assert apply_discount(cart_total, code) == expected

def test_unknown_code_raises(cart_total):
    with pytest.raises(ValueError, match="unknown code"):
        apply_discount(cart_total, "FREE")
`,
        run: false,
        compare: {
          lang: "JUnit 5",
          code: `@ParameterizedTest
@CsvSource({",200.0", "SAVE10,180.0", "VIP,150.0"})
void discounts(String code, double expected) {
    assertEquals(expected, applyDiscount(200.0, code));
}

@Test
void unknownCode() {
    assertThrows(IllegalArgumentException.class, () -> applyDiscount(200, "FREE"));
}`,
        },
        tip: "Every lab in <code>labs/</code> has pytest tests. Run <code>pytest labs -q</code> to see them pass, then break the code to see them fail.",
        quiz: {
          q: "How does a pytest test receive a fixture?",
          options: ["Via @Autowired", "By declaring a parameter with the fixture's name", "By calling it manually"],
          answer: 1,
          why: "pytest matches parameter names to fixtures and injects them.",
        },
      },
      {
        title: "Typing: get your compiler back",
        node: "types",
        payload: "type hints + mypy/pyright → errors before runtime",
        concept: `
<p>Add hints everywhere, then run <b>mypy</b> or <b>pyright</b> in CI. You get most of the safety you are used to from Java and C#.
Learn: <code>list[int]</code>, <code>dict[str, float]</code>, <code>X | None</code>, <code>Literal</code>, <code>TypedDict</code>, <code>Protocol</code>, generics with <code>TypeVar</code> or the 3.12 <code>def first[T](...)</code> syntax, and <code>Callable</code>.</p>`,
        code: `from typing import Literal, TypedDict, Callable

Status = Literal["new", "paid", "shipped"]

class OrderDict(TypedDict):
    id: int
    status: Status
    total: float

def first[T](items: list[T]) -> T | None:      # generics (Python 3.12+)
    return items[0] if items else None

def apply(orders: list[OrderDict], rule: Callable[[OrderDict], bool]) -> list[int]:
    return [o["id"] for o in orders if rule(o)]

orders: list[OrderDict] = [
    {"id": 1, "status": "paid", "total": 10.0},
    {"id": 2, "status": "new", "total": 99.0},
]
print(first(orders))
print(apply(orders, lambda o: o["status"] == "paid"))

# mypy would flag these at "compile" time:
# orders.append({"id": "3", "status": "lost", "total": 1})
# first(orders)["total"] + 1     # error: value might be None
`,
        compare: {
          lang: "Java",
          code: `static <T> Optional<T> first(List<T> items) {
    return items.isEmpty() ? Optional.empty() : Optional.of(items.get(0));
}
List<Integer> apply(List<Order> orders, Predicate<Order> rule) { ... }`,
        },
        tip: "<code>T | None</code> is Python's <code>Optional&lt;T&gt;</code>. Type checkers force you to handle <code>None</code> before use, which catches a whole class of bugs.",
        quiz: {
          q: "What enforces type hints?",
          options: ["The Python interpreter at runtime", "Static checkers like mypy/pyright (and libraries like Pydantic)", "Nothing; they are just comments"],
          answer: 1,
          why: "The interpreter ignores them; checkers and some libraries use them.",
        },
      },
      {
        title: "Configuration & logging (12-factor)",
        node: "config",
        payload: "ENV vars → Settings (validated) | logger → stdout (JSON)",
        concept: `
<p>Config comes from <b>environment variables</b>, validated at startup. In real projects use <code>pydantic-settings</code>. Log to stdout with the
<code>logging</code> module (never <code>print</code> in services), and use structured/JSON logs in production.</p>`,
        code: `import json, logging, os
from dataclasses import dataclass

@dataclass(frozen=True)
class Settings:
    database_url: str
    debug: bool = False
    workers: int = 2

    @classmethod
    def from_env(cls) -> "Settings":
        return cls(
            database_url=os.environ.get("DATABASE_URL", "sqlite:///dev.db"),
            debug=os.environ.get("DEBUG", "false").lower() == "true",
            workers=int(os.environ.get("WORKERS", "2")),
        )

class JsonFormatter(logging.Formatter):
    def format(self, record):
        return json.dumps({"level": record.levelname, "logger": record.name,
                           "msg": record.getMessage(), **getattr(record, "ctx", {})})

handler = logging.StreamHandler()
handler.setFormatter(JsonFormatter())
log = logging.getLogger("orders")
log.handlers = [handler]
log.setLevel(logging.INFO)

settings = Settings.from_env()
log.info("service starting", extra={"ctx": {"workers": settings.workers}})
log.warning("slow query", extra={"ctx": {"ms": 812, "table": "orders"}})
`,
        compare: {
          lang: "Spring Boot",
          code: `@ConfigurationProperties(prefix = "app")
public record Settings(String databaseUrl, boolean debug, int workers) {}

private static final Logger log = LoggerFactory.getLogger(Orders.class);
log.info("service starting workers={}", settings.workers());`,
        },
        tip: "Use <code>logger = logging.getLogger(__name__)</code> in each module, the same idea as <code>LoggerFactory.getLogger(MyClass.class)</code>.",
        quiz: {
          q: "Where should a service read its database password from?",
          options: ["A hard-coded constant", "An environment variable / secret store", "A comment in the code"],
          answer: 1,
          why: "12-factor apps keep config, especially secrets, out of the code.",
        },
      },
      {
        title: "Ship it: Docker & CI",
        node: "ship",
        payload: "Dockerfile → image → GitHub Actions (ruff, mypy, pytest) → deploy",
        concept: `
<p>A small, standard Dockerfile and a CI workflow that lints, type-checks and tests. These two files make any portfolio project look professional.</p>`,
        code: `# ---- Dockerfile ----
# FROM python:3.13-slim
# WORKDIR /app
# COPY requirements.txt .
# RUN pip install --no-cache-dir -r requirements.txt
# COPY . .
# CMD ["uvicorn", "app:app", "--host", "0.0.0.0", "--port", "8000"]

# ---- .github/workflows/ci.yml ----
# on: [push, pull_request]
# jobs:
#   test:
#     runs-on: ubuntu-latest
#     steps:
#       - uses: actions/checkout@v4
#       - uses: actions/setup-python@v5
#         with: { python-version: "3.13" }
#       - run: pip install -r requirements.txt ruff mypy pytest
#       - run: ruff check . && mypy . && pytest -q

checklist = ["pyproject/requirements pinned", "ruff clean", "mypy clean",
             "pytest green", "Dockerfile", "README with run instructions"]
for item in checklist:
    print("☐", item)
`,
        compare: {
          lang: "Java",
          code: `# FROM eclipse-temurin:21-jre
# COPY target/app.jar /app.jar
# CMD ["java", "-jar", "/app.jar"]
# CI: mvn -B verify`,
        },
        tip: "Recruiters open your GitHub. One polished repo with tests, CI and a clear README is worth more than ten tutorial folders.",
        quiz: {
          q: "Minimum CI gates for a Python service?",
          options: ["Only build the Docker image", "Lint (ruff), type-check (mypy), tests (pytest)", "Manual QA"],
          answer: 1,
          why: "These catch style, type and behaviour regressions automatically.",
        },
      },
      {
        title: "Your 30-day plan to job-ready",
        node: "plan",
        payload: "week 1 core → week 2 API → week 3 ETL → week 4 AI + portfolio",
        concept: `
<table>
<tr><th>Week</th><th>Focus</th><th>Deliverable</th></tr>
<tr><td>1</td><td>Core track + async track. Solve 15 easy/medium problems in Python (LeetCode/Exercism) to build fluency.</td><td><code>labs/01_core</code> green</td></tr>
<tr><td>2</td><td>API track: FastAPI, Pydantic, SQLAlchemy, pytest.</td><td>Extend <code>labs/02_api</code> with update/delete and pagination</td></tr>
<tr><td>3</td><td>ETL track: pandas, idempotent loads, SQL.</td><td>Run <code>labs/03_etl</code> on a real public dataset</td></tr>
<tr><td>4</td><td>AI track: SDK, tool use, RAG, evals.</td><td>A RAG API over your own docs: FastAPI + retrieval + Claude + an eval set + Docker + CI</td></tr>
</table>
<p>That final project is a strong portfolio piece because it combines all three job profiles: <b>API + data pipeline + AI</b>.</p>`,
        code: `plan = {
    1: ["core track", "async track", "15 coding problems"],
    2: ["FastAPI service", "Pydantic", "SQLAlchemy", "pytest"],
    3: ["pandas pipeline", "idempotent load", "SQL practice"],
    4: ["LLM SDK", "tool use", "RAG", "evals", "Docker + CI"],
}
done = {1: 0, 2: 0, 3: 0, 4: 0}   # update as you go

for week, topics in plan.items():
    pct = done[week] / len(topics)
    bar = "█" * int(pct * 20) + "░" * (20 - int(pct * 20))
    print(f"week {week} {bar} {pct:4.0%}  {', '.join(topics)}")
`,
        compare: {
          lang: "Your advantage",
          code: `You already know: OOP, design patterns, DI, testing, SQL, HTTP, concurrency.
You are learning: Python idioms + the ecosystem (FastAPI, pandas, LLM SDKs).
→ Pitch yourself as "a backend engineer who now builds with Python and AI",
  not as a Python beginner.`,
        },
        tip: "In interviews, translate your Java/C# experience: \"In Spring I used X; in FastAPI the equivalent is Y, and here is the trade-off.\" It shows depth, not just syntax.",
        quiz: {
          q: "Strongest single portfolio project for API + data + AI roles?",
          options: ["A to-do list app", "A RAG API with an ingestion pipeline, evals, tests, Docker and CI", "A calculator"],
          answer: 1,
          why: "It demonstrates all three skill sets plus professional engineering practices.",
        },
      },
    ],
  },
];
