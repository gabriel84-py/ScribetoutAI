from fastapi import APIRouter, UploadFile, File, HTTPException, Request
from fastapi.responses import JSONResponse
import os
from fastapi.templating import Jinja2Templates
from fastapi.responses import HTMLResponse
import uuid
from datetime import datetime

router = APIRouter(prefix="", tags=["crop"])
templates = Jinja2Templates(directory="/Users/gabrieljeanvermeille/PycharmProjects/ScribetoutAI/src/web_site/templates")

# Dossier pour stocker les images uploadées (chemin absolu)
UPLOAD_DIR = "/Users/gabrieljeanvermeille/PycharmProjects/ScribetoutAI/src/web_site/static/uploads"
os.makedirs(UPLOAD_DIR, exist_ok=True)

# Route pour servir la page HTML
@router.get("/", response_class=HTMLResponse)
async def read_root(request: Request):
    return templates.TemplateResponse("crop.html", {"request": request})


@router.post("/crop")
async def upload_image(image: UploadFile = File(...)):
    try:
        # Vérifie que le fichier est une image
        if not image.content_type or not image.content_type.startswith("image/"):
            raise HTTPException(status_code=400, detail="Le fichier doit être une image.")

        # Générer un nom de fichier unique avec timestamp
        file_extension = os.path.splitext(image.filename)[1] if image.filename else ".jpg"
        if not file_extension:
            file_extension = ".jpg"
        
        unique_filename = f"cropped_{datetime.now().strftime('%Y%m%d_%H%M%S')}_{uuid.uuid4().hex[:8]}{file_extension}"
        file_path = os.path.join(UPLOAD_DIR, unique_filename)

        # Sauvegarde l'image
        with open(file_path, "wb") as buffer:
            content = await image.read()
            buffer.write(content)

        return JSONResponse(
            status_code=200,
            content={
                "message": "Image recadrée envoyée et sauvegardée avec succès !",
                "filename": unique_filename,
                "path": file_path
            }
        )
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Erreur lors de l'enregistrement: {str(e)}")
