import json

from assistant import FakeClient, execute, get_order, run
from eval_rag import GATE, recall_at
from rag import Chunk, Index, cosine, tokenize


def test_tokenize_stems_and_drops_stopwords():
    assert tokenize("The Refunds are issued") == ["refund", "issued"]


def test_cosine_bounds():
    assert cosine({"a": 1.0}, {"a": 2.0}) == 1.0
    assert cosine({"a": 1.0}, {"b": 1.0}) == 0.0


def test_search_ranks_relevant_chunk_first():
    idx = Index.build([Chunk("x.md", "refunds take five days"), Chunk("y.md", "shipping is free")])
    assert idx.search("when will my refund arrive")[0][1].source == "x.md"


def test_retrieval_eval_meets_gate():
    assert recall_at(Index.from_dir(), k=3) >= GATE


def test_tool_errors_are_reported_not_raised():
    out, is_error = execute("get_order", {"order_id": "not-an-int-but-fine"})
    assert json.loads(out)["error"] and not is_error
    out, is_error = execute("get_order", {"wrong_arg": 1})
    assert is_error and "TypeError" in out
    assert json.loads(get_order(1042))["status"] == "in transit"


def test_agent_loop_with_fake_model():
    answer = run("Order 1042 is late, what can I do?", FakeClient(), verbose=False)
    assert "[shipping.md]" in answer
