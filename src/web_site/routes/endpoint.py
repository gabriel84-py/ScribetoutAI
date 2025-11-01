"""# routes/index.py
from fastapi import APIRouter, Request, UploadFile, File
from fastapi.responses import HTMLResponse, RedirectResponse
from fastapi.templating import Jinja2Templates
from src.models import main
import os, shutil

UPLOAD_DIR = "/Users/gabrieljeanvermeille/PycharmProjects/ScribetoutAI/src/web_site/static/uploads"

router = APIRouter(prefix="/endpoint", tags=["racine"])
templates = Jinja2Templates(directory="/Users/gabrieljeanvermeille/PycharmProjects/ScribetoutAI/src/web_site/templates")

@router.post("/", response_class=HTMLResponse)
async def dashboard(request: Request, image: UploadFile=File(...)):

    image_path = f"{UPLOAD_DIR}/{image.filename}"
    with open(image_path, "wb") as buffer:
        shutil.copyfileobj(image.file, buffer)
    image_url = f"{image_path}"
    
    print(image_url)
    result = main.main(image_url)

    return RedirectResponse(f"/download?texte={result}", status_code=303)

"""