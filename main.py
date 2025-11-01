#main.py
from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles
from pathlib import Path
from src.web_site.routes import main, download, endpoint, crop

app = FastAPI()

# Chemins relatifs
BASE_DIR = Path(__file__).parent
STATIC_DIR = BASE_DIR / "src" / "web_site" / "static"

# Servir le dossier static
app.mount("/static", StaticFiles(directory=str(STATIC_DIR)), name="static")

# Routes
"""
app.include_router(main.router)
app.include_router(download.router)
app.include_router(endpoint.router)
"""
app.include_router(crop.router)