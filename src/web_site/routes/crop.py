from fastapi import APIRouter, UploadFile, File, HTTPException, Request
from fastapi.responses import JSONResponse
import os
from fastapi.templating import Jinja2Templates
from fastapi.responses import HTMLResponse

router = APIRouter(prefix="/api", tags=["download"])
templates = Jinja2Templates(directory="/Users/gabrieljeanvermeille/PycharmProjects/ScribetoutAI/src/web_site/templates")


# Dossier pour stocker les images uploadées
UPLOAD_DIR = "uploads"
os.makedirs(UPLOAD_DIR, exist_ok=True)

# Route pour servir la page HTML
@router.get("/", response_class=HTMLResponse)
async def read_root(request: Request):
    return templates.TemplateResponse("crop.html", {"request": request})


@router.post("/crop")
async def upload_image(image: UploadFile = File(...)):
    try:
        # Vérifie que le fichier est une image
        if not image.content_type.startswith("image/"):
            raise HTTPException(status_code=400, detail="Le fichier doit être une image.")

        # Chemin pour sauvegarder l'image
        file_path = os.path.join(UPLOAD_DIR, image.filename)

        # Sauvegarde l'image
        with open(file_path, "wb") as buffer:
            buffer.write(await image.read())

        return JSONResponse(
            status_code=200,
            content={"message": "Image reçue et sauvegardée avec succès !", "filename": image.filename}
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
