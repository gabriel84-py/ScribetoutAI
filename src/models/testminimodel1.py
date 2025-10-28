import torch
from torchvision import transforms
from PIL import Image
from minimodel1 import CRNN, alphabet  # on reprend l’architecture

# =========================
# Setup
# =========================
nclass = len(alphabet) + 1
device = torch.device("cuda" if torch.cuda.is_available() else "mps" if torch.backends.mps.is_available() else "cpu")

model = CRNN(imgH=32, nc=1, nclass=nclass, nh=256).to(device)
model.load_state_dict(torch.load("crnn_epoch5.pt.pt", map_location=device))
model.eval()

# =========================
# Transform pour l’inférence
# =========================
transform = transforms.Compose([
    transforms.Resize((32, 512)),
    transforms.ToTensor(),
    transforms.Normalize((0.5,), (0.5,))
])

idx_to_char = {i: c for i, c in enumerate(alphabet)}

# =========================
# Conversion indices → texte
# =========================
def indices_to_text(indices):
    return ''.join([idx_to_char[i] for i in indices])

# =========================
# Fonction de prédiction
# =========================
def predict(model, image_path):
    image = Image.open(image_path).convert("L")
    image = transform(image).unsqueeze(0).to(device)
    with torch.no_grad():
        preds = model(image)  # [W, B, nclass]
        preds_idx = preds.argmax(2).squeeze(1).cpu().numpy()
        # Remove duplicates and blanks
        blank = nclass - 1
        char_list = []
        prev = -1
        for p in preds_idx:
            if p != prev and p != blank:
                char_list.append(p)
            prev = p
        return indices_to_text(char_list)

# =========================
# Exemple d'utilisati
image_path = "/Volumes/T7 Shield/RIMES-2011-Lines/Test/Images/eval2011-0_000002.jpg"
text = predict(model, image_path)
print("Texte prédit :", text)
