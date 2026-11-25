import asyncio

import fanout


def test_asyncio_fan_out_is_concurrent():
    import time
    start = time.perf_counter()
    result = asyncio.run(fanout.fan_out_async(limit=20))
    assert result == list(range(fanout.N_CALLS))
    assert time.perf_counter() - start < fanout.N_CALLS * fanout.LATENCY / 4


def test_io_benchmarks_threads_and_asyncio_beat_sequential():
    t = fanout.io_benchmarks()
    assert t["threads"] < t["sequential"] / 3
    assert t["asyncio"] < t["sequential"] / 3
