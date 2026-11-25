"""Start Python Academy locally.

    python serve.py            # http://localhost:8000
    python serve.py --port 9000 --no-browser

Uses only the standard library, so it works before you install anything.
"""
import argparse
import functools
import http.server
import webbrowser
from pathlib import Path

WEB_DIR = Path(__file__).resolve().parent / "web"


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    parser.add_argument("--port", type=int, default=8000)
    parser.add_argument("--no-browser", action="store_true")
    args = parser.parse_args()

    handler = functools.partial(http.server.SimpleHTTPRequestHandler, directory=WEB_DIR)
    with http.server.ThreadingHTTPServer(("127.0.0.1", args.port), handler) as httpd:
        url = f"http://localhost:{args.port}/"
        print(f"Python Academy running at {url}  (Ctrl+C to stop)")
        if not args.no_browser:
            webbrowser.open(url)
        try:
            httpd.serve_forever()
        except KeyboardInterrupt:
            print("\nbye")


if __name__ == "__main__":
    main()
