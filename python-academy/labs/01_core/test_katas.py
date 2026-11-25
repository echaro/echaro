"""Tests for katas.py. Set KATA_IMPL=solutions to run them against the reference answers."""
import importlib
import itertools
import os

import pytest

impl = importlib.import_module(os.environ.get("KATA_IMPL", "katas"))


def todo(fn, *args, **kwargs):
    """Call a kata; skip the test (instead of failing) while it is still a TODO."""
    try:
        return fn(*args, **kwargs)
    except NotImplementedError:
        pytest.skip(f"TODO: implement {fn.__qualname__}")


def test_word_frequencies():
    assert todo(impl.word_frequencies, "b a b a c b", 2) == [("b", 3), ("a", 2)]
    assert todo(impl.word_frequencies, "Zed zed apple Apple", 2) == [("apple", 2), ("zed", 2)]


def test_group_by_status():
    orders = [{"id": 1, "status": "paid"}, {"id": 2, "status": "new"}, {"id": 3, "status": "paid"}]
    assert todo(impl.group_by_status, orders) == {"paid": [1, 3], "new": [2]}


def test_chunked_is_lazy_and_handles_remainder():
    assert list(todo(impl.chunked, range(5), 2)) == [[0, 1], [2, 3], [4]]
    infinite = todo(impl.chunked, itertools.count(), 3)
    assert next(iter(infinite)) == [0, 1, 2]


@pytest.mark.parametrize("nested, expected", [
    ([], []),
    ([1, 2], [1, 2]),
    ([1, [2, [3, [4]]], 5], [1, 2, 3, 4, 5]),
])
def test_flatten(nested, expected):
    assert todo(impl.flatten, nested) == expected


def test_shopping_cart():
    cart = impl.ShoppingCart()
    todo(cart.add, "apple", 0.5, qty=4)
    cart.add("pear", 1.25)
    cart.add("apple", 0.5)
    total = cart.total() if callable(cart.total) else cart.total
    assert total == 3.75
    assert len(cart) == 6
    assert impl.ShoppingCart() == impl.ShoppingCart()   # dataclass value equality
