import os
import sys
from pathlib import Path

# Add ProjectX root to sys.path
root_dir = str(Path(__file__).resolve().parent.parent)
if root_dir not in sys.path:
    sys.path.insert(0, root_dir)

import uvicorn

if __name__ == "__main__":
    host = os.getenv("API_HOST", "127.0.0.1")
    port = int(os.getenv("API_PORT", 8000))
    uvicorn.run("backend.app.main:app", host=host, port=port, reload=False)
