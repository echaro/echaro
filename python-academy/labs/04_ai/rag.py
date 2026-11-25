"""A dependency-free retriever: the "R" in RAG.

Pipeline (the same shape as production RAG):
    indexing (offline, an ETL job):  load docs → chunk → vectorise → store
    query    (online, an API call):  vectorise question → top-k by cosine → build prompt

Here vectors are TF-IDF over words, so it runs anywhere. In production you swap
`vectorise` for an embedding model and the list for a vector DB (pgvector, Qdrant, Chroma).

    python rag.py "how long do refunds take?"
"""
from __future__ import annotations

import math
import re
import sys
from collections import Counter
from dataclasses import dataclass, field
from pathlib import Path

DOCS_DIR = Path(__file__).parent / "docs"
STOP = set("a an the to of in on for and or is are be can you your we our it its my i me "
           "how what when do does at by with as if after before any from this that".split())


def tokenize(text: str) -> list[str]:
    """Lowercase, drop stopwords, crude plural stemming."""
    return [w[:-1] if w.endswith("s") and len(w) > 3 else w
            for w in re.findall(r"[a-z0-9]+", text.lower()) if w not in STOP]


@dataclass(frozen=True)
class Chunk:
    source: str
    text: str


def chunk_markdown(source: str, text: str) -> list[Chunk]:
    """One chunk per non-heading line (our docs are one fact per line)."""
    return [Chunk(source, line.strip()) for line in text.splitlines()
            if line.strip() and not line.startswith("#")]


@dataclass
class Index:
    chunks: list[Chunk] = field(default_factory=list)
    df: Counter = field(default_factory=Counter)
    vectors: list[dict[str, float]] = field(default_factory=list)

    @classmethod
    def from_dir(cls, path: Path = DOCS_DIR) -> "Index":
        chunks = [c for f in sorted(path.glob("*.md")) for c in chunk_markdown(f.name, f.read_text())]
        return cls.build(chunks)

    @classmethod
    def build(cls, chunks: list[Chunk]) -> "Index":
        idx = cls(chunks=chunks)
        idx.df = Counter(t for c in chunks for t in set(tokenize(c.text)))
        idx.vectors = [idx.vectorise(c.text) for c in chunks]
        return idx

    def vectorise(self, text: str) -> dict[str, float]:
        n = len(self.chunks)
        tf = Counter(tokenize(text))
        return {t: c * math.log((n + 1) / (self.df.get(t, 0) + 1)) + c * 0.01 for t, c in tf.items()}

    def search(self, query: str, k: int = 3) -> list[tuple[float, Chunk]]:
        q = self.vectorise(query)
        scored = [(cosine(q, v), c) for v, c in zip(self.vectors, self.chunks)]
        return [s for s in sorted(scored, key=lambda s: -s[0])[:k] if s[0] > 0]


def cosine(a: dict[str, float], b: dict[str, float]) -> float:
    dot = sum(w * b.get(t, 0.0) for t, w in a.items())
    na = math.sqrt(sum(w * w for w in a.values()))
    nb = math.sqrt(sum(w * w for w in b.values()))
    return dot / (na * nb) if na and nb else 0.0


def build_context(results: list[tuple[float, Chunk]]) -> str:
    return "\n".join(f'<doc source="{c.source}">{c.text}</doc>' for _, c in results)


if __name__ == "__main__":
    question = " ".join(sys.argv[1:]) or "how long do refunds take?"
    index = Index.from_dir()
    print(f"{len(index.chunks)} chunks indexed. Query: {question!r}\n")
    for score, chunk in index.search(question):
        print(f"{score:.3f}  [{chunk.source}] {chunk.text}")
