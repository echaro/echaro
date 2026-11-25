"""Reference answers for katas.py."""
from __future__ import annotations

from collections import Counter, defaultdict
from dataclasses import dataclass, field
from itertools import islice
from typing import Iterable, Iterator


def word_frequencies(text: str, top: int = 3) -> list[tuple[str, int]]:
    counts = Counter(text.lower().split())
    return sorted(counts.items(), key=lambda kv: (-kv[1], kv[0]))[:top]


def group_by_status(orders: list[dict]) -> dict[str, list[int]]:
    groups: defaultdict[str, list[int]] = defaultdict(list)
    for order in orders:
        groups[order["status"]].append(order["id"])
    return dict(groups)


def chunked(items: Iterable, size: int) -> Iterator[list]:
    it = iter(items)
    while batch := list(islice(it, size)):   # the walrus operator assigns and tests
        yield batch


def flatten(nested: list) -> list:
    def walk(xs):
        for x in xs:
            if isinstance(x, list):
                yield from walk(x)
            else:
                yield x
    return list(walk(nested))


@dataclass
class ShoppingCart:
    lines: dict[str, tuple[float, int]] = field(default_factory=dict)

    def add(self, name: str, price: float, qty: int = 1) -> None:
        _, current = self.lines.get(name, (price, 0))
        self.lines[name] = (price, current + qty)

    def total(self) -> float:
        return round(sum(price * qty for price, qty in self.lines.values()), 2)

    def __len__(self) -> int:
        return sum(qty for _, qty in self.lines.values())
