# Lets each lab import its own modules (e.g. `from app import app`) when pytest runs from any folder.
import sys
from pathlib import Path

for lab in Path(__file__).parent.iterdir():
    if lab.is_dir() and not lab.name.startswith((".", "_")):
        sys.path.insert(0, str(lab))
