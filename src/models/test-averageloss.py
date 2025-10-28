import os
import torch
from torch.utils.data import DataLoader
from minimodel1 import CRNN, RIMESDataset, text_to_indices, alphabet  # ou copier l’architecture
import torch.nn as nn

# =========================
# Setup
# =========================
device = torch.device("cuda" if torch.cuda.is_available() else "mps" if torch.backends.mps.is_available() else "cpu")
nclass = len(alphabet) + 1

dataset = RIMESDataset(
    "/Volumes/T7 Shield/RIMES-2011-Lines/Train/Images",
    "/Volumes/T7 Shield/RIMES-2011-Lines/Train/train_labels.csv",
    transform=None  # ou ton transform existant
)
dataloader = DataLoader(dataset, batch_size=8, shuffle=False, collate_fn=lambda x: tuple(zip(*x)))
criterion = nn.CTCLoss(blank=nclass - 1)

# =========================
# Liste des fichiers .pt
# =========================
pt_folder = "./"  # dossier contenant tes crnn_epochX.pt
pt_files = [f for f in os.listdir(pt_folder) if f.endswith(".pt")]

# =========================
# Calcul average loss pour chaque modèle
# =========================
for pt_file in sorted(pt_files):
    model = CRNN(imgH=32, nc=1, nclass=nclass, nh=256).to(device)
    model.load_state_dict(torch.load(os.path.join(pt_folder, pt_file), map_location=device))
    model.eval()

    total_loss = 0
    num_batches = 0

    with torch.no_grad():
        for images, texts in dataloader:
            images_batch = torch.stack(images).to(device)
            targets_list = [torch.tensor(text_to_indices(t), dtype=torch.long) for t in texts]
            target_lengths = torch.tensor([len(t) for t in targets_list], dtype=torch.long)
            targets = torch.cat(targets_list).to(device)

            preds = model(images_batch)
            preds_lengths = torch.full((images_batch.size(0),), fill_value=preds.size(0), dtype=torch.long)

            if (target_lengths > preds_lengths).any():
                continue

            loss = criterion(preds, targets, preds_lengths, target_lengths)
            total_loss += loss.item()
            num_batches += 1

    avg_loss = total_loss / num_batches if num_batches > 0 else float('nan')
    print(f"{pt_file}: average loss = {avg_loss:.4f}")
