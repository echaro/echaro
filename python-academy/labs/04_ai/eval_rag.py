"""Retrieval eval: does the right document come back in the top-k?

    python eval_rag.py           # prints recall@1 and recall@3, exits 1 if below the gate

Change tokenize(), chunking or k in rag.py and re-run to see whether quality moves.
Put this in CI like any other test: a prompt or retriever change that lowers the score fails the build.
"""
import sys

from rag import Index

CASES = [
    ("how many days do refunds take", "returns.md"),
    ("can I send back a gift card", "returns.md"),
    ("is there next day delivery", "shipping.md"),
    ("my parcel has not arrived after two weeks", "shipping.md"),
    ("do you ship to mexico", "shipping.md"),
    ("my screen cracked, is it covered", "warranty.md"),
    ("how do I make a warranty claim", "warranty.md"),
    ("can I pay with paypal", "account.md"),
    ("I want to change my delivery address", "account.md"),
    ("I dropped my phone in water", "warranty.md"),   # synonym-heavy: hard for keyword search
]
GATE = 0.8


def recall_at(index: Index, k: int, verbose: bool = False) -> float:
    hits = 0
    for question, expected in CASES:
        sources = [c.source for _, c in index.search(question, k=k)]
        hit = expected in sources
        hits += hit
        if verbose:
            print(f"  {'✓' if hit else '✗'} {question:45} → {sources}")
    return hits / len(CASES)


if __name__ == "__main__":
    index = Index.from_dir()
    r1 = recall_at(index, 1, verbose=True)
    r3 = recall_at(index, 3)
    print(f"\nrecall@1 = {r1:.0%}   recall@3 = {r3:.0%}   (gate: recall@3 ≥ {GATE:.0%})")
    sys.exit(0 if r3 >= GATE else 1)
