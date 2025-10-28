import os
import pandas as pd
import torch
import torch.nn as nn
import torch.optim as optim
from torch.utils.data import Dataset, DataLoader
from torchvision import transforms
from PIL import Image
import xml.etree.ElementTree as et


# =========================
# 1️⃣ Dataset RIMES
# =========================
class RIMESDataset(Dataset):
    def __init__(self, images_dir, csv_file, transform=None):
        self.images_dir = images_dir
        self.transform = transform
        self.data = pd.read_csv(csv_file)  # CSV avec colonnes: filename,text

    def __len__(self):
        return len(self.data)

    def __getitem__(self, idx):
        row = self.data.iloc[idx]
        img_path = os.path.join(self.images_dir, row['Filenames'])
        image = Image.open(img_path).convert('L')  # grayscale
        if self.transform:
            image = self.transform(image)
        text = row['Contents']
        return image, text


# =========================
# 2️⃣ Transformations images
# =========================
transform = transforms.Compose([
    transforms.Resize((32, 512)),  # largeur plus grande
    transforms.ToTensor(),
    transforms.Normalize((0.5,), (0.5,))
])



# Exemple d'initialisation du dataset
dataset = RIMESDataset(
    "/Volumes/T7 Shield/RIMES-2011-Lines/Train/Images",
    "/Volumes/T7 Shield/RIMES-2011-Lines/Train/train_labels.csv",
    transform=transform
)

from torch.utils.data import DataLoader
dataloader = DataLoader(dataset, batch_size=8, shuffle=True, collate_fn=lambda x: tuple(zip(*x)))

# =========================
# 3️⃣ CRNN Model
# =========================
class CRNN(nn.Module):
    def __init__(self, imgH, nc, nclass, nh):
        super(CRNN, self).__init__()
        self.cnn = nn.Sequential(
            nn.Conv2d(nc, 64, 3, 1, 1), nn.ReLU(),
            nn.MaxPool2d(2, 2),
            nn.Conv2d(64, 128, 3, 1, 1), nn.ReLU(),
            nn.MaxPool2d(2, 2)
        )
        self.rnn = nn.LSTM(128 * (imgH // 4), nh, bidirectional=True, batch_first=True)
        self.fc = nn.Linear(nh * 2, nclass)

    def forward(self, x):
        conv = self.cnn(x)  # [B, C, H, W]
        b, c, h, w = conv.size()
        assert h == 8, "Height after conv must be 8"  # selon Resize et CNN
        conv = conv.permute(0, 3, 1, 2)  # [B, W, C, H]
        conv = conv.view(b, w, c * h)  # [B, W, C*H]
        rnn_out, _ = self.rnn(conv)
        output = self.fc(rnn_out)  # [B, W, nclass]
        output = output.permute(1, 0, 2)  # pour CTC Loss [W, B, nclass]
        return output


# =========================
# 4️⃣ Training Setup
# =========================
# Exemple de caractères possibles
alphabet = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789 .,;'-"

nclass = len(alphabet) + 1  # +1 pour le blank CTC
model = CRNN(imgH=32, nc=1, nclass=nclass, nh=256)

# CTC Loss
criterion = nn.CTCLoss(blank=nclass - 1)
optimizer = optim.Adam(model.parameters(), lr=1e-3)

# =========================
# 5️⃣ Fonction pour convertir texte en indices et inverse
# =========================
char_to_idx = {c: i for i, c in enumerate(alphabet)}
idx_to_char = {i: c for i, c in enumerate(alphabet)}


def text_to_indices(text):
    return [char_to_idx[c] for c in text if c in char_to_idx]


def indices_to_text(indices):
    return ''.join([idx_to_char[i] for i in indices])


# =========================
# 6️⃣ Exemple d'entraînement
# =========================
def train_one_epoch(model, dataloader, optimizer, criterion, device):
    model.train()
    total_loss = 0
    num_batches = 0

    for images, texts in dataloader:
        # --- Filtrer les textes invalides ---
        filtered_texts = []
        filtered_images = []
        for img, t in zip(images, texts):
            indices = text_to_indices(t)
            if len(indices) > 0:  # ignorer les textes vides
                filtered_texts.append(t)
                filtered_images.append(img)
        if len(filtered_texts) == 0:
            continue  # skip batch si tous les textes sont invalides

        # --- Former le batch d'images ---
        images_batch = torch.stack(filtered_images).to(device)

        # --- Convertir textes en indices ---
        targets_list = [torch.tensor(text_to_indices(t), dtype=torch.long) for t in filtered_texts]
        target_lengths = torch.tensor([len(t) for t in targets_list], dtype=torch.long)
        targets = torch.cat(targets_list).to(device)

        # --- Forward pass ---
        preds = model(images_batch)  # [W, B, nclass]
        preds_lengths = torch.full(
            (images_batch.size(0),),
            fill_value=preds.size(0),
            dtype=torch.long
        )

        # --- Vérification CTC Loss ---
        if (target_lengths > preds_lengths).any():
            print("Warning: target longer than preds, skipping batch")
            continue

        # --- Calcul du loss ---
        loss = criterion(preds, targets, preds_lengths, target_lengths)

        # --- Backward et update ---
        optimizer.zero_grad()
        loss.backward()
        optimizer.step()

        total_loss += loss.item()
        num_batches += 1

    if num_batches > 0:
        print(f"Epoch done, average loss: {total_loss / num_batches:.4f}")
    else:
        print("Epoch done, no valid batches")




# =========================
# 7️⃣ Inférence simple
# =========================
def predict(model, image, device):
    model.eval()
    image = transform(image).unsqueeze(0).to(device)
    with torch.no_grad():
        preds = model(image)  # [W, 1, nclass]
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

device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
model = model.to(device)


for epoch in range(5):  # par exemple 10 epochs
    train_one_epoch(model, dataloader, optimizer, criterion, device)
    torch.save(model.state_dict(), f"crnn_epoch{epoch}.pt")

from PIL import Image
img = Image.open("/Volumes/T7 Shield/RIMES-2011-Lines/Test/Images/eval2011-0_000001.jpg").convert("L")
text = predict(model, img, device)
print("Texte prédit :", text)

