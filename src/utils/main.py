"""import cv2
import numpy as np
import tensorflow as tf
from mrcnn.config import Config
from mrcnn.model import MaskRCNN
import mrcnn.model as modellib

# Configuration
class InferenceConfig(Config):
    NAME = "coco"
    GPU_COUNT = 1
    IMAGES_PER_GPU = 1
    NUM_CLASSES = 1 + 80  # COCO a 80 classes

config = InferenceConfig()

# Charger le modèle pré-entraîné
model = modellib.MaskRCNN(mode="inference", config=config, model_dir=".")
model.load_weights("mask_rcnn_coco.h5", by_name=True)

# Charger l'image
image = cv2.imread("/Users/gabrieljeanvermeille/PycharmProjects/ScribetoutAI/src/utils/IMG_5359.jpg")
image = cv2.cvtColor(image, cv2.COLOR_BGR2RGB)

# Détecter les objets
results = model.detect([image], verbose=1)
r = results[0]

# Rogner les objets détectés comme "book" ou "laptop"
for i in range(r['rois'].shape[0]):
    class_id = r['class_ids'][i]
    # Vérifie si la classe détectée est "book" ou "laptop" (ajuste les IDs selon COCO)
    if class_id in [73, 62]:  # 73: book, 62: laptop
        y1, x1, y2, x2 = r['rois'][i]
        feuille_rognee = image[y1:y2, x1:x2]
        cv2.imwrite("feuille_rognee_ia.jpg", cv2.cvtColor(feuille_rognee, cv2.COLOR_RGB2BGR))
"""