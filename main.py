#main.py
from fastapi import FastAPI, Request
from fastapi.staticfiles import StaticFiles
from src.web_site.routes import main, download, endpoint
from fastapi import FastAPI

app = FastAPI()
#Servir le dossier static
app.mount("/static", StaticFiles(directory="src/web_site/static"), name="static")

app.include_router(main.router)
app.include_router(download.router)
app.include_router(endpoint.router)