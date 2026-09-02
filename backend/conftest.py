import os
import sys

backend_dir = os.path.dirname(os.path.abspath(__file__))
root_dir = os.path.abspath(os.path.join(backend_dir, ".."))

for path in [backend_dir, root_dir]:
    if path not in sys.path:
        sys.path.insert(0, path)
