"""Same work, four concurrency models. Run it and compare the timings:

    python fanout.py

I/O-bound (simulated network calls): sequential vs threads vs asyncio.
CPU-bound (pure-Python math):         sequential vs threads vs processes.
"""
from __future__ import annotations

import asyncio
import time
from concurrent.futures import ProcessPoolExecutor, ThreadPoolExecutor

N_CALLS, LATENCY = 20, 0.2          # 20 "HTTP calls" of 200 ms each
CPU_JOBS, CPU_N = 4, 2_000_000


def timed(label: str, fn) -> float:
    start = time.perf_counter()
    fn()
    elapsed = time.perf_counter() - start
    print(f"  {label:<24} {elapsed:6.2f}s")
    return elapsed


# ---------------------------------------------------------------- I/O bound
def fetch_sync(i: int) -> int:
    time.sleep(LATENCY)              # blocking wait; releases the GIL
    return i


async def fetch_async(i: int, sem: asyncio.Semaphore) -> int:
    async with sem:                  # cap concurrency, e.g. to respect a rate limit
        await asyncio.sleep(LATENCY)  # non-blocking wait; the loop runs other tasks
        return i


async def fan_out_async(limit: int = 10) -> list[int]:
    sem = asyncio.Semaphore(limit)
    async with asyncio.TaskGroup() as tg:          # structured concurrency (3.11+)
        tasks = [tg.create_task(fetch_async(i, sem)) for i in range(N_CALLS)]
    return [t.result() for t in tasks]


def io_benchmarks() -> dict[str, float]:
    print(f"I/O-bound: {N_CALLS} calls × {LATENCY}s")
    return {
        "sequential": timed("sequential", lambda: [fetch_sync(i) for i in range(N_CALLS)]),
        "threads": timed("ThreadPoolExecutor(10)",
                         lambda: list(ThreadPoolExecutor(10).map(fetch_sync, range(N_CALLS)))),
        "asyncio": timed("asyncio (limit 10)", lambda: asyncio.run(fan_out_async(10))),
    }


# ---------------------------------------------------------------- CPU bound
def crunch(n: int) -> int:
    return sum(i * i % 7 for i in range(n))


def cpu_benchmarks() -> dict[str, float]:
    print(f"\nCPU-bound: {CPU_JOBS} jobs × {CPU_N:,} iterations")
    jobs = [CPU_N] * CPU_JOBS
    with ThreadPoolExecutor(CPU_JOBS) as tp, ProcessPoolExecutor(CPU_JOBS) as pp:
        return {
            "sequential": timed("sequential", lambda: [crunch(n) for n in jobs]),
            "threads": timed("threads (GIL-bound)", lambda: list(tp.map(crunch, jobs))),
            "processes": timed("processes", lambda: list(pp.map(crunch, jobs))),
        }


if __name__ == "__main__":       # required for ProcessPoolExecutor on macOS/Windows
    io_benchmarks()
    cpu_benchmarks()
    print("\nTakeaway: threads/asyncio for waiting, processes (or vectorised libs) for computing.")
