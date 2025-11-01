"""# handwriting_ocrspace.py

import os
import cv2
import json
import requests
from PIL import Image

# -----------------------------
# Prétraitement de l'image
# -----------------------------
def preprocess(image_path):
    """
    Prétraite une image (contraste, débruitage, binarisation)
    pour améliorer la reconnaissance du texte.
    """
    img = cv2.imread(image_path)
    if img is None:
        raise FileNotFoundError(f"Image introuvable : {image_path}")

    # Conversion en niveaux de gris
    gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)

    # Débruitage léger
    gray = cv2.bilateralFilter(gray, 9, 75, 75)

    # Augmenter le contraste
    gray = cv2.equalizeHist(gray)

    # Seuillage adaptatif (noir et blanc)
    bw = cv2.adaptiveThreshold(
        gray, 255,
        cv2.ADAPTIVE_THRESH_GAUSSIAN_C,
        cv2.THRESH_BINARY,
        15, 10
    )

    # Sauvegarde temporaire du prétraitement
    temp_path = "temp_preprocessed.png"
    cv2.imwrite(temp_path, bw)
    print("[INFO] Image prétraitée sauvegardée :", temp_path)
    return temp_path


# -----------------------------
# Appel de l'API OCR.Space
# -----------------------------
def call_ocr_api(image_path, language="fre"):
    """
    Envoie l'image à l'API OCR.Space et récupère le texte reconnu.
    language = 'fre' pour le français
    """
    api_key = "K86896918888957"
    if not api_key:
        raise EnvironmentError("Variable OCR_SPACE_API_KEY non définie !")

    url_api = "https://api.ocr.space/parse/image"

    with open(image_path, 'rb') as f:
        files = {'file': f}
        data = {
            'apikey': api_key,
            'language': language,
            'isOverlayRequired': False,
            'OCREngine': 2,  # version la plus récente de l’OCR
        }

        print("[INFO] Envoi à OCR.Space...")
        response = requests.post(url_api, files=files, data=data)
        print("wassss")
        if response.status_code != 200:
            raise Exception(f"Erreur API HTTP {response.status_code}")

        print("was if !")

        result = response.json()

        if result.get("IsErroredOnProcessing"):
            raise Exception(f"Erreur OCR.Space : {result.get('ErrorMessage')}")

        text = result["ParsedResults"][0]["ParsedText"]
        print("c okayyy")
        return text


# -----------------------------
# Fonction principale
# -----------------------------
def main(image_path):
    preprocessed = preprocess(image_path)

    texte = call_ocr_api(preprocessed, language="fre")
    print(texte)

    # Sauvegarde du texte
    output_file = "resultat_ocr2.txt"
    with open(output_file, "w", encoding="utf-8") as f:
        f.write(texte)
    print('cb c sauv')
    return texte



if __name__ == "__main__":
    main("va te faire foutre")"""