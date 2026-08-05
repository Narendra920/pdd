"""
train_landmark_model.py
=======================
Trains a CNN regression model to predict 3 mandibular landmarks
(Condylion, Gonion, Menton) from OPG images.

Architecture : MobileNetV2 backbone (pretrained) + regression head → 6 outputs (x,y × 3)
Loss         : Smooth L1 (Huber) — robust to outliers
Optimizer    : AdamW with cosine-annealing LR schedule
Output       : saved model  →  dataset/landmark_model.pth
               training log →  dataset/training_log.csv
"""

import os, csv, time, random
import numpy as np
import pandas as pd
import cv2
import torch
import torch.nn as nn
import torch.optim as optim
from torch.utils.data import Dataset, DataLoader, random_split
from torchvision import models, transforms

# ─────────────────────────────── CONFIG ───────────────────────────────
DATASET_DIR  = r"c:\Users\ksubb\OneDrive\Desktop\mandibular\dataset"
CSV_PATH     = os.path.join(DATASET_DIR, "mandibular_landmarks_analysis.csv")
MODEL_PATH   = os.path.join(DATASET_DIR, "landmark_model.pth")
LOG_PATH     = os.path.join(DATASET_DIR, "training_log.csv")

IMG_SIZE     = 224          # MobileNetV2 standard input
BATCH_SIZE   = 16
EPOCHS       = 30
LR           = 1e-3
VAL_SPLIT    = 0.15         # 15 % validation
SEED         = 42

device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
print(f"[INFO] Using device: {device}")

random.seed(SEED); np.random.seed(SEED); torch.manual_seed(SEED)

# ─────────────────────────────── DATASET ──────────────────────────────
class OPGLandmarkDataset(Dataset):
    def __init__(self, df, img_dir, transform=None):
        self.df        = df.reset_index(drop=True)
        self.img_dir   = img_dir
        self.transform = transform

        # Normalise coords to [0,1] using each image's actual size
        self._cached_sizes = {}

    def _get_hw(self, img_name):
        if img_name not in self._cached_sizes:
            path = os.path.join(self.img_dir, img_name)
            img  = cv2.imread(path)
            if img is None:
                self._cached_sizes[img_name] = (1, 1)
            else:
                h, w = img.shape[:2]
                self._cached_sizes[img_name] = (h, w)
        return self._cached_sizes[img_name]

    def __len__(self):
        return len(self.df)

    def __getitem__(self, idx):
        row      = self.df.iloc[idx]
        img_name = row["Image"]
        path     = os.path.join(self.img_dir, img_name)

        img = cv2.imread(path)
        if img is None:
            img = np.zeros((IMG_SIZE, IMG_SIZE, 3), dtype=np.uint8)
        img = cv2.cvtColor(img, cv2.COLOR_BGR2RGB)

        H, W = img.shape[:2]

        # Normalise landmarks to [0,1]
        landmarks = np.array([
            row["Co_X"] / W, row["Co_Y"] / H,
            row["Go_X"] / W, row["Go_Y"] / H,
            row["Me_X"] / W, row["Me_Y"] / H,
        ], dtype=np.float32)

        if self.transform:
            from PIL import Image as PILImage
            img = PILImage.fromarray(img)
            img = self.transform(img)
        else:
            img = torch.from_numpy(img.transpose(2,0,1)).float() / 255.0

        return img, torch.tensor(landmarks)


# ─────────────────────────────── MODEL ────────────────────────────────
class LandmarkNet(nn.Module):
    def __init__(self):
        super().__init__()
        backbone        = models.mobilenet_v2(weights=models.MobileNet_V2_Weights.DEFAULT)
        in_features     = backbone.classifier[1].in_features
        backbone.classifier = nn.Identity()          # remove original head
        self.backbone   = backbone
        self.head       = nn.Sequential(
            nn.Dropout(0.3),
            nn.Linear(in_features, 256),
            nn.ReLU(),
            nn.Dropout(0.2),
            nn.Linear(256, 6),
            nn.Sigmoid()                             # keeps outputs in [0,1]
        )

    def forward(self, x):
        feat = self.backbone(x)
        return self.head(feat)


# ─────────────────────────────── TRANSFORMS ───────────────────────────
train_tf = transforms.Compose([
    transforms.Resize((IMG_SIZE, IMG_SIZE)),
    transforms.RandomHorizontalFlip(p=0.0),         # no H-flip (jaws are asymmetric)
    transforms.ColorJitter(brightness=0.3, contrast=0.3),
    transforms.RandomRotation(5),
    transforms.ToTensor(),
    transforms.Normalize([0.485,0.456,0.406],[0.229,0.224,0.225]),
])
val_tf = transforms.Compose([
    transforms.Resize((IMG_SIZE, IMG_SIZE)),
    transforms.ToTensor(),
    transforms.Normalize([0.485,0.456,0.406],[0.229,0.224,0.225]),
])


# ─────────────────────────────── MAIN ─────────────────────────────────
def main():
    # Load CSV
    df = pd.read_csv(CSV_PATH)
    print(f"[INFO] Dataset: {len(df)} images")

    full_dataset = OPGLandmarkDataset(df, DATASET_DIR, transform=None)

    # Split train / val
    n_val   = int(len(full_dataset) * VAL_SPLIT)
    n_train = len(full_dataset) - n_val
    train_ds, val_ds = random_split(full_dataset, [n_train, n_val],
                                    generator=torch.Generator().manual_seed(SEED))

    # Apply per-split transforms
    train_ds.dataset = OPGLandmarkDataset(df.iloc[train_ds.indices].reset_index(drop=True),
                                          DATASET_DIR, transform=train_tf)
    val_ds.dataset   = OPGLandmarkDataset(df.iloc[val_ds.indices].reset_index(drop=True),
                                          DATASET_DIR, transform=val_tf)

    train_loader = DataLoader(OPGLandmarkDataset(
        df.iloc[train_ds.dataset.df.index].reset_index(drop=True), DATASET_DIR, train_tf),
        batch_size=BATCH_SIZE, shuffle=True,  num_workers=0, pin_memory=False)

    val_loader   = DataLoader(OPGLandmarkDataset(
        df.iloc[val_ds.dataset.df.index].reset_index(drop=True),   DATASET_DIR, val_tf),
        batch_size=BATCH_SIZE, shuffle=False, num_workers=0, pin_memory=False)

    print(f"[INFO] Train: {len(train_loader.dataset)} | Val: {len(val_loader.dataset)}")

    # Model
    model     = LandmarkNet().to(device)
    criterion = nn.SmoothL1Loss()
    optimizer = optim.AdamW(model.parameters(), lr=LR, weight_decay=1e-4)
    scheduler = optim.lr_scheduler.CosineAnnealingLR(optimizer, T_max=EPOCHS, eta_min=1e-5)

    log_rows  = []
    best_val  = float("inf")

    print("\n" + "="*60)
    print(f"{'Epoch':>6} {'Train Loss':>12} {'Val Loss':>10} {'LR':>10} {'Time':>8}")
    print("="*60)

    for epoch in range(1, EPOCHS + 1):
        t0 = time.time()

        # ── Train ──
        model.train()
        train_loss = 0.0
        for imgs, labels in train_loader:
            imgs, labels = imgs.to(device), labels.to(device)
            optimizer.zero_grad()
            preds = model(imgs)
            loss  = criterion(preds, labels)
            loss.backward()
            optimizer.step()
            train_loss += loss.item() * len(imgs)
        train_loss /= len(train_loader.dataset)

        # ── Validate ──
        model.eval()
        val_loss = 0.0
        with torch.no_grad():
            for imgs, labels in val_loader:
                imgs, labels = imgs.to(device), labels.to(device)
                preds    = model(imgs)
                val_loss += criterion(preds, labels).item() * len(imgs)
        val_loss /= len(val_loader.dataset)

        scheduler.step()
        elapsed = time.time() - t0
        cur_lr  = scheduler.get_last_lr()[0]

        print(f"{epoch:>6} {train_loss:>12.6f} {val_loss:>10.6f} {cur_lr:>10.2e} {elapsed:>7.1f}s")
        log_rows.append({"epoch": epoch, "train_loss": train_loss,
                         "val_loss": val_loss, "lr": cur_lr})

        # Save best model
        if val_loss < best_val:
            best_val = val_loss
            torch.save({
                "epoch":       epoch,
                "model_state": model.state_dict(),
                "val_loss":    best_val,
                "img_size":    IMG_SIZE,
            }, MODEL_PATH)
            print(f"         [BEST] Model saved (val_loss={best_val:.6f})")

    # Save training log
    pd.DataFrame(log_rows).to_csv(LOG_PATH, index=False)
    print("\n" + "="*60)
    print(f"[DONE] Best val loss : {best_val:.6f}")
    print(f"[DONE] Model saved   : {MODEL_PATH}")
    print(f"[DONE] Log saved     : {LOG_PATH}")


if __name__ == "__main__":
    main()
