# services/templating.py
from fastapi.templating import Jinja2Templates
from markupsafe import Markup

templates = Jinja2Templates(directory="templates")