"""A support assistant: RAG + tool use + an agent loop, on the Claude API.

    pip install anthropic
    export ANTHROPIC_API_KEY=...        # or `ant auth login`
    python assistant.py "My order 1042 is late and I want a refund. What are my options?"

Without credentials it runs in --offline mode with a scripted fake model, so you can
still watch the loop: python assistant.py --offline "..."

What to study here:
  * TOOLS: JSON-schema descriptions of plain Python functions.
  * run(): the agent loop. The model asks for tools, *your* code runs them, results go back.
  * Every assistant turn is appended back unchanged (it may contain thinking blocks).
"""
from __future__ import annotations

import argparse
import json
import os
from typing import Any, Callable

from rag import Index, build_context

MODEL = "claude-opus-5-5"
SYSTEM = """You are the support assistant of an online shop.
Use the search_policies tool for questions about policies and get_order for order data.
Answer only from tool results; if they do not contain the answer, say you don't know.
Cite policy sources in brackets, e.g. [returns.md]. Keep answers under 120 words."""

INDEX = Index.from_dir()
ORDERS = {
    1042: {"status": "in transit", "shipped": "2026-03-01", "promised": "2026-03-05", "total_eur": 89.0},
    1043: {"status": "delivered", "shipped": "2026-02-20", "promised": "2026-02-25", "total_eur": 15.5},
}


# ----------------------------------------------------------------- tools (plain Python)
def search_policies(query: str) -> str:
    results = INDEX.search(query, k=3)
    return build_context(results) or "no matching policy found"


def get_order(order_id: int) -> str:
    order = ORDERS.get(order_id)
    return json.dumps(order if order else {"error": f"order {order_id} not found"})


REGISTRY: dict[str, Callable[..., str]] = {"search_policies": search_policies, "get_order": get_order}

TOOLS = [
    {
        "name": "search_policies",
        "description": "Search the shop's policy documents (returns, shipping, warranty, payments). "
                       "Returns the most relevant passages with their source file.",
        "input_schema": {"type": "object", "properties": {"query": {"type": "string"}},
                         "required": ["query"], "additionalProperties": False},
        "strict": True,
    },
    {
        "name": "get_order",
        "description": "Get status, ship date, promised delivery date and total for an order id.",
        "input_schema": {"type": "object", "properties": {"order_id": {"type": "integer"}},
                         "required": ["order_id"], "additionalProperties": False},
        "strict": True,
    },
]


def execute(name: str, args: dict[str, Any]) -> tuple[str, bool]:
    try:
        return REGISTRY[name](**args), False
    except Exception as e:                       # report tool errors back to the model
        return f"{type(e).__name__}: {e}", True


# ----------------------------------------------------------------- the agent loop
def run(question: str, client: Any, max_turns: int = 8, verbose: bool = True) -> str:
    messages: list[dict[str, Any]] = [{"role": "user", "content": question}]
    for _ in range(max_turns):
        response = client.create(system=SYSTEM, tools=TOOLS, messages=messages)
        # Append the assistant turn exactly as returned (it may include thinking blocks).
        messages.append({"role": "assistant", "content": response.content})

        if response.stop_reason == "refusal":
            return "The request was declined."
        if response.stop_reason != "tool_use":
            return "".join(b.text for b in response.content if b.type == "text")

        results = []
        for block in response.content:
            if block.type == "tool_use":
                output, is_error = execute(block.name, block.input)
                if verbose:
                    print(f"  → {block.name}({json.dumps(block.input)})\n    {output[:160]}")
                results.append({"type": "tool_result", "tool_use_id": block.id,
                                "content": output, "is_error": is_error})
        messages.append({"role": "user", "content": results})   # all results in ONE message
    return "Stopped: too many tool calls."


# ----------------------------------------------------------------- clients
class ClaudeClient:
    """Thin wrapper so run() does not care whether the model is real or fake."""

    def __init__(self) -> None:
        import anthropic
        self.client = anthropic.Anthropic()      # reads ANTHROPIC_API_KEY / `ant auth login`

    def create(self, **kwargs: Any) -> Any:
        # Server-side fallbacks: if the request is declined by a safety classifier,
        # the API retries it on a fallback model inside the same call.
        return self.client.beta.messages.create(
            model=MODEL,
            max_tokens=16000,
            betas=["server-side-fallback-2026-07-01"],
            fallbacks="default",
            **kwargs,
        )


class _Block(dict):
    __getattr__ = dict.__getitem__


class FakeClient:
    """Scripted model with the same message protocol, for running without an API key."""

    def create(self, system: str, tools: list, messages: list) -> Any:
        tool_turns = sum(1 for m in messages if m["role"] == "user" and isinstance(m["content"], list))
        question = messages[0]["content"]
        script = [
            [("get_order", {"order_id": 1042})],
            [("search_policies", {"query": "late parcel report"}), ("search_policies", {"query": question})],
        ]
        if tool_turns < len(script):
            blocks = [_Block(type="tool_use", id=f"tu_{tool_turns}_{i}", name=n, input=a)
                      for i, (n, a) in enumerate(script[tool_turns])]
            return _Block(stop_reason="tool_use", content=blocks)
        text = ("(offline demo) Order 1042 shipped on 2026-03-01 and was promised for 2026-03-05. "
                "Parcels late by more than 7 days can be reported for investigation [shipping.md]. "
                "You can return items within 30 days of delivery; refunds take 5 business days [returns.md].")
        return _Block(stop_reason="end_turn", content=[_Block(type="text", text=text)])


def main() -> None:
    p = argparse.ArgumentParser()
    p.add_argument("question", nargs="*", default=["My order 1042 is late and I want a refund. What can I do?"])
    p.add_argument("--offline", action="store_true", help="use the scripted fake model")
    args = p.parse_args()
    question = " ".join(args.question)

    offline = args.offline
    if not offline:
        try:
            client: Any = ClaudeClient()
        except ImportError:
            print("anthropic is not installed (pip install anthropic); running --offline.\n")
            offline = True
    if offline:
        client = FakeClient()

    print(f"Q: {question}\n")
    try:
        answer = run(question, client)
    except Exception as e:  # most often: no credentials configured
        if offline:
            raise
        print(f"API call failed ({type(e).__name__}: {e}).\nRe-run with --offline, or set ANTHROPIC_API_KEY.")
        return
    print(f"\nA: {answer}")


if __name__ == "__main__":
    main()
