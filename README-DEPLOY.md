# Déploiement sur Railway

## Instructions

1. **Renommez les fichiers requirements** :
   ```bash
   mv requirements.txt requirements-dev.txt
   mv requirements-web.txt requirements.txt
   ```

2. **Configurez Railway** :
   - Port : Railway utilisera automatiquement la variable `$PORT`
   - Start Command : `uvicorn main:app --host 0.0.0.0 --port $PORT`

3. **Variables d'environnement** (optionnelles) :
   - Aucune variable nécessaire pour l'instant

## Fichiers créés pour Railway

- `requirements-web.txt` : Dépendances minimales pour le web (sans ML)
- `railway.json` : Configuration Railway
- `.railwayignore` : Fichiers à ignorer lors du déploiement
- `nixpacks.toml` : Configuration Nixpacks pour Railway

## Note

Si Railway détecte automatiquement Python et utilise `requirements.txt`, assurez-vous que ce fichier contient seulement les dépendances web minimales.

