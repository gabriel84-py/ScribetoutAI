const uploadInput = document.getElementById('upload-input');
const cropButton = document.getElementById('crop-button');
const previewSection = document.getElementById('preview-section');
const messageDiv = document.getElementById('message');
const canvas = document.getElementById('crop-canvas');
const ctx = canvas.getContext('2d');

let image = null;
let imageLoaded = false;
let points = [];
let selectedPoint = null;
let isDragging = false;

// Constantes
const POINT_RADIUS = 10;
const POINT_COLOR = '#667eea';
const POINT_HOVER_COLOR = '#764ba2';
const LINE_COLOR = '#667eea';
const LINE_WIDTH = 2;
const SHADE_COLOR = 'rgba(0, 0, 0, 0.4)';

// Initialiser les points du quadrilatère
function initializePoints(img) {
  const imgWidth = img.width;
  const imgHeight = img.height;
  const margin = Math.min(imgWidth, imgHeight) * 0.1;
  
  points = [
    { x: margin, y: margin },
    { x: imgWidth - margin, y: margin },
    { x: imgWidth - margin, y: imgHeight - margin },
    { x: margin, y: imgHeight - margin }
  ];
}

// Charger et afficher l'image
function loadImage(file) {
  const reader = new FileReader();
  reader.onload = (event) => {
    const img = new Image();
    img.onload = () => {
      image = img;
      imageLoaded = true;
      
      // Ajuster la taille du canvas pour l'image
      const maxWidth = Math.min(800, window.innerWidth - 100);
      const maxHeight = window.innerHeight * 0.7;
      
      let displayWidth = img.width;
      let displayHeight = img.height;
      
      // Redimensionner si nécessaire
      if (displayWidth > maxWidth) {
        const ratio = maxWidth / displayWidth;
        displayWidth = maxWidth;
        displayHeight = img.height * ratio;
      }
      
      if (displayHeight > maxHeight) {
        const ratio = maxHeight / displayHeight;
        displayHeight = maxHeight;
        displayWidth = displayWidth * ratio;
      }
      
      canvas.width = displayWidth;
      canvas.height = displayHeight;
      
      // Initialiser les points proportionnellement
      const scaleX = displayWidth / img.width;
      const scaleY = displayHeight / img.height;
      
      const margin = Math.min(displayWidth, displayHeight) * 0.1;
      points = [
        { x: margin, y: margin },
        { x: displayWidth - margin, y: margin },
        { x: displayWidth - margin, y: displayHeight - margin },
        { x: margin, y: displayHeight - margin }
      ];
      
      // Ajuster les points existants si nécessaire
      if (points.length === 4) {
        points.forEach((point, index) => {
          point.scaleX = scaleX;
          point.scaleY = scaleY;
        });
      }
      
      previewSection.classList.add('active');
      draw();
      cropButton.disabled = false;
    };
    img.src = event.target.result;
  };
  reader.readAsDataURL(file);
}

// Dessiner l'image et les points
function draw() {
  if (!image || !imageLoaded) return;
  
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  
  // Dessiner l'image
  ctx.drawImage(image, 0, 0, canvas.width, canvas.height);
  
  // Dessiner la zone ombragée (hors du quadrilatère)
  ctx.fillStyle = SHADE_COLOR;
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.lineTo(canvas.width, 0);
  ctx.lineTo(canvas.width, canvas.height);
  ctx.lineTo(0, canvas.height);
  ctx.closePath();
  
  // Soustraction du quadrilatère
  ctx.moveTo(points[0].x, points[0].y);
  for (let i = 1; i < points.length; i++) {
    ctx.lineTo(points[i].x, points[i].y);
  }
  ctx.closePath();
  ctx.fill('evenodd');
  
  // Dessiner les lignes du quadrilatère
  ctx.strokeStyle = LINE_COLOR;
  ctx.lineWidth = LINE_WIDTH;
  ctx.beginPath();
  ctx.moveTo(points[0].x, points[0].y);
  for (let i = 1; i < points.length; i++) {
    ctx.lineTo(points[i].x, points[i].y);
  }
  ctx.closePath();
  ctx.stroke();
  
  // Dessiner les points
  points.forEach((point, index) => {
    const isHovered = selectedPoint === index;
    ctx.fillStyle = isHovered ? POINT_HOVER_COLOR : POINT_COLOR;
    ctx.beginPath();
    ctx.arc(point.x, point.y, POINT_RADIUS, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = 'white';
    ctx.lineWidth = 2;
    ctx.stroke();
  });
}

// Trouver le point le plus proche de la position de la souris
function getPointAt(x, y) {
  for (let i = 0; i < points.length; i++) {
    const point = points[i];
    const distance = Math.sqrt(
      Math.pow(point.x - x, 2) + Math.pow(point.y - y, 2)
    );
    if (distance <= POINT_RADIUS * 2) {
      return i;
    }
  }
  return null;
}

// Gestionnaires d'événements de la souris
canvas.addEventListener('mousedown', (e) => {
  const rect = canvas.getBoundingClientRect();
  const x = e.clientX - rect.left;
  const y = e.clientY - rect.top;
  
  const pointIndex = getPointAt(x, y);
  if (pointIndex !== null) {
    selectedPoint = pointIndex;
    isDragging = true;
    canvas.style.cursor = 'grabbing';
  }
});

canvas.addEventListener('mousemove', (e) => {
  const rect = canvas.getBoundingClientRect();
  const x = e.clientX - rect.left;
  const y = e.clientY - rect.top;
  
  if (isDragging && selectedPoint !== null) {
    // Limiter les points dans les limites du canvas
    points[selectedPoint].x = Math.max(POINT_RADIUS, Math.min(canvas.width - POINT_RADIUS, x));
    points[selectedPoint].y = Math.max(POINT_RADIUS, Math.min(canvas.height - POINT_RADIUS, y));
    draw();
  } else {
    const pointIndex = getPointAt(x, y);
    if (pointIndex !== null) {
      canvas.style.cursor = 'grab';
    } else {
      canvas.style.cursor = 'crosshair';
    }
  }
});

canvas.addEventListener('mouseup', () => {
  isDragging = false;
  selectedPoint = null;
  canvas.style.cursor = 'crosshair';
});

canvas.addEventListener('mouseleave', () => {
  isDragging = false;
  selectedPoint = null;
  canvas.style.cursor = 'crosshair';
  draw();
});

// Gestionnaires d'événements tactiles (mobile)
canvas.addEventListener('touchstart', (e) => {
  e.preventDefault();
  const touch = e.touches[0];
  const rect = canvas.getBoundingClientRect();
  const x = touch.clientX - rect.left;
  const y = touch.clientY - rect.top;
  
  const pointIndex = getPointAt(x, y);
  if (pointIndex !== null) {
    selectedPoint = pointIndex;
    isDragging = true;
  }
});

canvas.addEventListener('touchmove', (e) => {
  e.preventDefault();
  if (isDragging && selectedPoint !== null) {
    const touch = e.touches[0];
    const rect = canvas.getBoundingClientRect();
    const x = touch.clientX - rect.left;
    const y = touch.clientY - rect.top;
    
    points[selectedPoint].x = Math.max(POINT_RADIUS, Math.min(canvas.width - POINT_RADIUS, x));
    points[selectedPoint].y = Math.max(POINT_RADIUS, Math.min(canvas.height - POINT_RADIUS, y));
    draw();
  }
});

canvas.addEventListener('touchend', (e) => {
  e.preventDefault();
  isDragging = false;
  selectedPoint = null;
});

// Fonction pour extraire l'image dans le quadrilatère (transformation perspective)
function extractQuadrilateral() {
  if (!image || points.length !== 4) return null;
  
  // Convertir les points du canvas vers les coordonnées de l'image originale
  const scaleX = image.width / canvas.width;
  const scaleY = image.height / canvas.height;
  
  const srcPoints = points.map(p => ({
    x: p.x * scaleX,
    y: p.y * scaleY
  }));
  
  // Calculer les dimensions du rectangle de sortie
  const width = Math.max(
    Math.abs(srcPoints[1].x - srcPoints[0].x),
    Math.abs(srcPoints[2].x - srcPoints[3].x)
  );
  const height = Math.max(
    Math.abs(srcPoints[3].y - srcPoints[0].y),
    Math.abs(srcPoints[2].y - srcPoints[1].y)
  );
  
  // Créer un canvas temporaire pour la transformation
  const outputCanvas = document.createElement('canvas');
  outputCanvas.width = width;
  outputCanvas.height = height;
  const outputCtx = outputCanvas.getContext('2d');
  
  // Dessiner avec transformation perspective simple
  // On utilise une approximation par homographie
  outputCtx.save();
  
  // Créer un canvas source pour l'extraction
  const sourceCanvas = document.createElement('canvas');
  sourceCanvas.width = image.width;
  sourceCanvas.height = image.height;
  const sourceCtx = sourceCanvas.getContext('2d');
  sourceCtx.drawImage(image, 0, 0);
  
  // Transformation perspective avec clip
  // Simplification: on dessine directement avec les 4 points
  const destPoints = [
    { x: 0, y: 0 },
    { x: width, y: 0 },
    { x: width, y: height },
    { x: 0, y: height }
  ];
  
  // Utiliser une transformation d'homographie
  // Algorithme simplifié pour transformer le quadrilatère en rectangle
  outputCtx.globalCompositeOperation = 'source-over';
  
  // Dessiner avec clipPath et transformation
  outputCtx.beginPath();
  outputCtx.moveTo(destPoints[0].x, destPoints[0].y);
  for (let i = 1; i < destPoints.length; i++) {
    outputCtx.lineTo(destPoints[i].x, destPoints[i].y);
  }
  outputCtx.closePath();
  outputCtx.clip();
  
  // Transformation matrix pour projeter le quadrilatère vers le rectangle
  const transform = getPerspectiveTransform(srcPoints, destPoints);
  outputCtx.setTransform(
    transform.a, transform.b,
    transform.c, transform.d,
    transform.e, transform.f
  );
  
  outputCtx.drawImage(sourceCanvas, 0, 0);
  outputCtx.restore();
  
  return outputCanvas;
}

// Calculer la matrice de transformation perspective
function getPerspectiveTransform(src, dst) {
  // Algorithme simplifié: on calcule les coefficients de l'homographie
  // Pour simplifier, on utilise une transformation affine qui est une bonne approximation
  // pour les petites déformations
  
  // Calcul de la transformation affine (8 paramètres)
  const A = [];
  const b = [];
  
  for (let i = 0; i < 4; i++) {
    A.push([
      src[i].x, src[i].y, 1, 0, 0, 0,
      -src[i].x * dst[i].x, -src[i].y * dst[i].x
    ]);
    A.push([
      0, 0, 0, src[i].x, src[i].y, 1,
      -src[i].x * dst[i].y, -src[i].y * dst[i].y
    ]);
    b.push(dst[i].x);
    b.push(dst[i].y);
  }
  
  // Résolution du système linéaire (méthode simplifiée)
  // Pour une vraie transformation perspective, on devrait résoudre avec SVD
  // Ici, on utilise une approximation
  
  // Approximation: transformation affine via getTransformMatrix
  const matrix = approximateTransform(src, dst);
  
  return matrix;
}

// Approximation de transformation (simplifiée pour performance)
function approximateTransform(src, dst) {
  // On calcule une transformation affine qui minimise l'erreur
  // Pour une vraie perspective, il faudrait une homographie complète
  // mais cela nécessite une résolution de système 8x8
  
  // Transformation simplifiée: on utilise la moyenne des transformations par paire
  let sx = 0, sy = 0, tx = 0, ty = 0, rotation = 0;
  
  // Calculer les dimensions moyennes
  const srcWidth = (src[1].x - src[0].x + src[2].x - src[3].x) / 2;
  const srcHeight = (src[3].y - src[0].y + src[2].y - src[1].y) / 2;
  const dstWidth = dst[1].x - dst[0].x;
  const dstHeight = dst[3].y - dst[0].y;
  
  sx = dstWidth / srcWidth;
  sy = dstHeight / srcHeight;
  
  // Translation
  const srcCenterX = (src[0].x + src[1].x + src[2].x + src[3].x) / 4;
  const srcCenterY = (src[0].y + src[1].y + src[2].y + src[3].y) / 4;
  const dstCenterX = (dst[0].x + dst[1].x + dst[2].x + dst[3].x) / 4;
  const dstCenterY = (dst[0].y + dst[1].y + dst[2].y + dst[3].y) / 4;
  
  tx = dstCenterX - srcCenterX * sx;
  ty = dstCenterY - srcCenterY * sy;
  
  return {
    a: sx, b: 0, c: 0, d: sy, e: tx, f: ty
  };
}

// Récupérer un pixel de l'image
function getPixel(imageData, x, y, width) {
  const index = (y * width + x) * 4;
  return [
    imageData.data[index],
    imageData.data[index + 1],
    imageData.data[index + 2],
    imageData.data[index + 3]
  ];
}

// Fonction améliorée avec vraie transformation perspective
function extractQuadrilateralPerspective() {
  if (!image || points.length !== 4) return null;
  
  const scaleX = image.width / canvas.width;
  const scaleY = image.height / canvas.height;
  
  const srcPoints = points.map(p => ({
    x: p.x * scaleX,
    y: p.y * scaleY
  }));
  
  // Calculer le rectangle de destination (bounding box)
  const minX = Math.min(...srcPoints.map(p => p.x));
  const maxX = Math.max(...srcPoints.map(p => p.x));
  const minY = Math.min(...srcPoints.map(p => p.y));
  const maxY = Math.max(...srcPoints.map(p => p.y));
  
  const width = Math.ceil(maxX - minX);
  const height = Math.ceil(maxY - minY);
  
  if (width <= 0 || height <= 0) {
    console.error('Dimensions invalides:', width, height);
    return null;
  }
  
  // Créer le canvas de sortie
  const outputCanvas = document.createElement('canvas');
  outputCanvas.width = width;
  outputCanvas.height = height;
  const outputCtx = outputCanvas.getContext('2d');
  
  // Points de destination (rectangle normalisé)
  const dstPoints = [
    { x: srcPoints[0].x - minX, y: srcPoints[0].y - minY },
    { x: srcPoints[1].x - minX, y: srcPoints[1].y - minY },
    { x: srcPoints[2].x - minX, y: srcPoints[2].y - minY },
    { x: srcPoints[3].x - minX, y: srcPoints[3].y - minY }
  ];
  
  // Dessiner l'image source
  const sourceCanvas = document.createElement('canvas');
  sourceCanvas.width = image.width;
  sourceCanvas.height = image.height;
  const sourceCtx = sourceCanvas.getContext('2d');
  sourceCtx.drawImage(image, 0, 0);
  
  // Extraire pixel par pixel avec interpolation bilinéaire
  const imageData = sourceCtx.getImageData(0, 0, image.width, image.height);
  const outputImageData = outputCtx.createImageData(width, height);
  
  // Initialiser avec des pixels transparents/noirs
  for (let i = 0; i < outputImageData.data.length; i += 4) {
    outputImageData.data[i] = 0;     // R
    outputImageData.data[i + 1] = 0; // G
    outputImageData.data[i + 2] = 0; // B
    outputImageData.data[i + 3] = 255; // A
  }
  
  // Transformation inverse: pour chaque pixel de destination, trouver le pixel source
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      // Coordonnées normalisées dans le rectangle de destination (0-1)
      const u = width > 1 ? x / (width - 1) : 0;
      const v = height > 1 ? y / (height - 1) : 0;
      
      // Interpolation bilinéaire dans le quadrilatère source
      // Top edge : interpolation entre point 0 (haut-gauche) et point 1 (haut-droit)
      const topX = srcPoints[0].x * (1 - u) + srcPoints[1].x * u;
      const topY = srcPoints[0].y * (1 - u) + srcPoints[1].y * u;
      
      // Bottom edge : interpolation entre point 3 (bas-gauche) et point 2 (bas-droit)
      const bottomX = srcPoints[3].x * (1 - u) + srcPoints[2].x * u;
      const bottomY = srcPoints[3].y * (1 - u) + srcPoints[2].y * u;
      
      // Interpolation verticale entre top et bottom
      const srcX = topX * (1 - v) + bottomX * v;
      const srcY = topY * (1 - v) + bottomY * v;
      
      // Clamping des coordonnées source
      const clampedX = Math.max(0, Math.min(image.width - 1, srcX));
      const clampedY = Math.max(0, Math.min(image.height - 1, srcY));
      
      // Interpolation bilinéaire pour une meilleure qualité
      const x1 = Math.floor(clampedX);
      const y1 = Math.floor(clampedY);
      const x2 = Math.min(x1 + 1, image.width - 1);
      const y2 = Math.min(y1 + 1, image.height - 1);
      
      const fx = clampedX - x1;
      const fy = clampedY - y1;
      
      // S'assurer que les coordonnées sont valides
      if (x1 >= 0 && x1 < image.width && y1 >= 0 && y1 < image.height &&
          x2 >= 0 && x2 < image.width && y2 >= 0 && y2 < image.height) {
        
        // Pixels voisins
        const p11 = getPixel(imageData, x1, y1, image.width);
        const p21 = getPixel(imageData, x2, y1, image.width);
        const p12 = getPixel(imageData, x1, y2, image.width);
        const p22 = getPixel(imageData, x2, y2, image.width);
        
        // Interpolation bilinéaire
        const dstIndex = (y * width + x) * 4;
        for (let i = 0; i < 4; i++) {
          const val = 
            p11[i] * (1 - fx) * (1 - fy) +
            p21[i] * fx * (1 - fy) +
            p12[i] * (1 - fx) * fy +
            p22[i] * fx * fy;
          outputImageData.data[dstIndex + i] = Math.round(Math.max(0, Math.min(255, val)));
        }
      }
    }
  }
  
  outputCtx.putImageData(outputImageData, 0, 0);
  return outputCanvas;
}

// Gestionnaire d'upload
uploadInput.addEventListener('change', (e) => {
  const file = e.target.files[0];
  if (file) {
    if (!file.type.startsWith('image/')) {
      showMessage('Veuillez sélectionner une image valide.', 'error');
      return;
    }
    loadImage(file);
    hideMessage();
  }
});

// Gestionnaire du bouton de crop
cropButton.addEventListener('click', () => {
  if (!image || !imageLoaded || points.length !== 4) {
    showMessage('Aucune image à recadrer.', 'error');
    return;
  }

  cropButton.disabled = true;
  cropButton.textContent = 'Envoi en cours...';

  // Extraire le quadrilatère
  const croppedCanvas = extractQuadrilateralPerspective();
  
  if (!croppedCanvas) {
    showMessage('Erreur lors du recadrage.', 'error');
    cropButton.disabled = false;
    cropButton.textContent = 'Envoyer l\'image recadrée';
    return;
  }

  croppedCanvas.toBlob((blob) => {
    if (!blob) {
      showMessage('Erreur lors de la création de l\'image.', 'error');
      cropButton.disabled = false;
      cropButton.textContent = 'Envoyer l\'image recadrée';
      return;
    }

    const formData = new FormData();
    formData.append('image', blob, 'cropped-image.jpg');

    fetch('/crop', {
      method: 'POST',
      body: formData,
    })
    .then(response => {
      if (!response.ok) {
        return response.json().then(err => Promise.reject(err));
      }
      return response.json();
    })
    .then(data => {
      showMessage(data.message || 'Image envoyée avec succès !', 'success');
      cropButton.textContent = 'Envoyer l\'image recadrée';
      setTimeout(() => {
        resetForm();
      }, 3000);
    })
    .catch(error => {
      console.error('Erreur :', error);
      const errorMsg = error.detail || error.message || 'Une erreur est survenue lors de l\'envoi.';
      showMessage(errorMsg, 'error');
      cropButton.disabled = false;
      cropButton.textContent = 'Envoyer l\'image recadrée';
    });
  }, 'image/jpeg', 0.9);
});

function showMessage(message, type) {
  messageDiv.textContent = message;
  messageDiv.className = `message ${type}`;
}

function hideMessage() {
  messageDiv.className = 'message';
  messageDiv.textContent = '';
}

function resetForm() {
  uploadInput.value = '';
  previewSection.classList.remove('active');
  image = null;
  imageLoaded = false;
  points = [];
  selectedPoint = null;
  isDragging = false;
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  cropButton.disabled = true;
  hideMessage();
}
// for commit