# routes/index.py
from fastapi import APIRouter, Request
from fastapi.responses import HTMLResponse
from fastapi.templating import Jinja2Templates

router = APIRouter(prefix="", tags=["racine"])
templates = Jinja2Templates(directory="/Users/gabrieljeanvermeille/PycharmProjects/ScribetoutAI/src/web_site/templates")

@router.get("/", response_class=HTMLResponse)
def dashboard(request: Request):
    return templates.TemplateResponse(
        "index.html",
        {"request": request}
    )
