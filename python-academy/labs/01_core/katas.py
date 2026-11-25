"""Core katas: Python idioms for Java/C# developers.

Each function has a docstring and a TODO. Implement it, then run:

    pytest 01_core -q

Unimplemented katas are reported as SKIPPED; they turn into PASSED as you go.
Reference answers live in solutions.py — try first, peek later.
"""
from __future__ import annotations

from dataclasses import dataclass, field
from typing import Iterable, Iterator


def word_frequencies(text: str, top: int = 3) -> list[tuple[str, int]]:
    """Return the `top` most common lowercase words as (word, count), most common first.
    Ties are broken alphabetically. Hint: collections.Counter, sorted(key=...).

    >>> word_frequencies("the cat and the hat and the bat", 2)
    [('the', 3), ('and', 2)]
    """
    raise NotImplementedError


def group_by_status(orders: list[dict]) -> dict[str, list[int]]:
    """Group order ids by their "status" key, preserving input order.
    Hint: collections.defaultdict(list) or dict.setdefault.

    >>> group_by_status([{"id": 1, "status": "paid"}, {"id": 2, "status": "new"}, {"id": 3, "status": "paid"}])
    {'paid': [1, 3], 'new': [2]}
    """
    raise NotImplementedError


def chunked(items: Iterable, size: int) -> Iterator[list]:
    """Lazily yield lists of `size` items (the last one may be shorter). Must work on
    infinite iterators, so do not call len() or list() on `items`. Hint: itertools.islice.

    >>> list(chunked(range(5), 2))
    [[0, 1], [2, 3], [4]]
    """
    raise NotImplementedError


def flatten(nested: list) -> list:
    """Flatten arbitrarily nested lists. Hint: recursion + isinstance, or a generator with `yield from`.

    >>> flatten([1, [2, [3, [4]]], 5])
    [1, 2, 3, 4, 5]
    """
    raise NotImplementedError


@dataclass
class ShoppingCart:
    """A cart with value semantics. Implement `add`, `total` (a @property would be nicer — feel free
    to change it), and `__len__` returning the number of units.

    >>> cart = ShoppingCart(); cart.add("apple", 0.5, qty=4); cart.add("pear", 1.25)
    >>> cart.total(), len(cart)
    (3.25, 5)
    """

    lines: dict[str, tuple[float, int]] = field(default_factory=dict)  # name -> (unit price, qty)

    def add(self, name: str, price: float, qty: int = 1) -> None:
        raise NotImplementedError

    def total(self) -> float:
        raise NotImplementedError

    def __len__(self) -> int:
        raise NotImplementedError
