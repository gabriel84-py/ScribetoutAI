# routes/index.py
from fastapi import APIRouter, Request
from fastapi.responses import HTMLResponse
from fastapi.templating import Jinja2Templates

router = APIRouter(prefix="/download", tags=["download"])
templates = Jinja2Templates(directory="/Users/gabrieljeanvermeille/PycharmProjects/ScribetoutAI/src/web_site/templates")

@router.get("/", response_class=HTMLResponse)
def dashboard(request: Request, texte):
    return templates.TemplateResponse(
        "download.html",
        {"request": request, "texte": texte}
    )
