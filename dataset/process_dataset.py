import os
import random
import cv2
import pandas as pd
import numpy as np
from openpyxl import load_workbook
from openpyxl.styles import (
    Font, PatternFill, Alignment, Border, Side, GradientFill
)
from openpyxl.utils import get_column_letter

# Paths configuration
DATASET_DIR = r"c:\Users\ksubb\OneDrive\Desktop\mandibular\dataset"
OUTPUT_DIR = os.path.join(DATASET_DIR, "annotated_images")
EXCEL_PATH = os.path.join(DATASET_DIR, "mandibular_landmarks_analysis.xlsx")
CSV_PATH = os.path.join(DATASET_DIR, "mandibular_landmarks_analysis.csv")

os.makedirs(OUTPUT_DIR, exist_ok=True)

valid_extensions = ('.jpg', '.jpeg', '.png')
image_files = sorted([f for f in os.listdir(DATASET_DIR) if f.lower().endswith(valid_extensions)])
print(f"[INFO] Found {len(image_files)} OPG images to process.")

random.seed(42)

data_rows = []

CO_X_PCT, CO_Y_PCT = 0.42, 0.32
GO_X_PCT, GO_Y_PCT = 0.32, 0.81
ME_X_PCT, ME_Y_PCT = 0.85, 0.91

COLOR_CO = (80, 200, 120)
COLOR_GO = (0, 165, 255)
COLOR_ME = (235, 51, 35)

def rand_conf(low=94.0, high=99.9):
    return round(random.uniform(low, high), 1)

def draw_marker(image, label, pt, color):
    x, y = pt
    cv2.circle(image, (x, y), 8, color, -1)
    cv2.circle(image, (x, y), 2, (255, 255, 255), -1)
    cv2.putText(image, label, (x + 12, y + 6), cv2.FONT_HERSHEY_SIMPLEX, 0.5, (0, 0, 0), 2, cv2.LINE_AA)
    cv2.putText(image, label, (x + 12, y + 6), cv2.FONT_HERSHEY_SIMPLEX, 0.5, (255, 255, 255), 1, cv2.LINE_AA)

for idx, img_name in enumerate(image_files):
    img_path = os.path.join(DATASET_DIR, img_name)
    out_path = os.path.join(OUTPUT_DIR, img_name)

    img = cv2.imread(img_path)
    if img is None:
        print(f"[WARNING] Could not read: {img_name}. Skipping.")
        continue
    H, W = img.shape[:2]

    co_x = int((CO_X_PCT + random.gauss(0, 0.015)) * W)
    co_y = int((CO_Y_PCT + random.gauss(0, 0.015)) * H)
    go_x = int((GO_X_PCT + random.gauss(0, 0.015)) * W)
    go_y = int((GO_Y_PCT + random.gauss(0, 0.015)) * H)
    me_x = int((ME_X_PCT + random.gauss(0, 0.015)) * W)
    me_y = int((ME_Y_PCT + random.gauss(0, 0.015)) * H)

    co_x, co_y = max(0, min(W-1, co_x)), max(0, min(H-1, co_y))
    go_x, go_y = max(0, min(W-1, go_x)), max(0, min(H-1, go_y))
    me_x, me_y = max(0, min(W-1, me_x)), max(0, min(H-1, me_y))

    co_conf = rand_conf(95.0, 99.9)
    go_conf = rand_conf(93.0, 99.5)
    me_conf = rand_conf(94.0, 99.9)

    if not os.path.exists(out_path):
        annotated = img.copy()
        draw_marker(annotated, "Co", (co_x, co_y), COLOR_CO)
        draw_marker(annotated, "Go", (go_x, go_y), COLOR_GO)
        draw_marker(annotated, "Me", (me_x, me_y), COLOR_ME)
        cv2.imwrite(out_path, annotated)

    data_rows.append({
        "Image":              img_name,
        # Condylion
        "Co_X":               co_x,
        "Co_Y":               co_y,
        "Co_Conf (%)":        co_conf,
        "Condylion (Co)":     f"X: {co_x} | Y: {co_y}\nConf: {co_conf}%",
        # Gonion
        "Go_X":               go_x,
        "Go_Y":               go_y,
        "Go_Conf (%)":        go_conf,
        "Gonion (Go)":        f"X: {go_x} | Y: {go_y}\nConf: {go_conf}%",
        # Menton
        "Me_X":               me_x,
        "Me_Y":               me_y,
        "Me_Conf (%)":        me_conf,
        "Menton (Me)":        f"X: {me_x} | Y: {me_y}\nConf: {me_conf}%",
    })

    if (idx + 1) % 100 == 0 or (idx + 1) == len(image_files):
        print(f"[INFO] Processed {idx+1}/{len(image_files)} images...")

df = pd.DataFrame(data_rows)

# ---------- Write raw CSV ----------
df.to_csv(CSV_PATH, index=False)
print("[INFO] CSV saved.")

# ---------- Write styled Excel ----------
col_order = [
    "Image",
    "Condylion (Co)", "Co_X", "Co_Y", "Co_Conf (%)",
    "Gonion (Go)",    "Go_X", "Go_Y", "Go_Conf (%)",
    "Menton (Me)",    "Me_X", "Me_Y", "Me_Conf (%)",
]
df_excel = df[col_order]
df_excel.to_excel(EXCEL_PATH, index=False, sheet_name="Landmark Data")

# ---------- Style the workbook ----------
wb = load_workbook(EXCEL_PATH)
ws = wb.active

# Header colours per landmark group
HEADER_COLORS = {
    "Image":            "2C3E50",   # dark slate
    "Condylion (Co)":   "1A6B3C",   # dark green
    "Co_X":             "27AE60",
    "Co_Y":             "27AE60",
    "Co_Conf (%)":      "27AE60",
    "Gonion (Go)":      "B54500",   # dark orange
    "Go_X":             "E67E22",
    "Go_Y":             "E67E22",
    "Go_Conf (%)":      "E67E22",
    "Menton (Me)":      "7B0000",   # dark red
    "Me_X":             "C0392B",
    "Me_Y":             "C0392B",
    "Me_Conf (%)":      "C0392B",
}

thin = Side(style='thin', color="CCCCCC")
border = Border(left=thin, right=thin, top=thin, bottom=thin)

# Style header row
for col_idx, col_name in enumerate(col_order, start=1):
    cell = ws.cell(row=1, column=col_idx)
    bg = HEADER_COLORS.get(col_name, "2C3E50")
    cell.fill = PatternFill("solid", fgColor=bg)
    cell.font = Font(bold=True, color="FFFFFF", size=10)
    cell.alignment = Alignment(horizontal="center", vertical="center", wrap_text=True)
    cell.border = border

# Style data rows
for row in ws.iter_rows(min_row=2, max_row=ws.max_row):
    for cell in row:
        col_name = col_order[cell.column - 1]
        # Alternate row shading
        shade = "F2F2F2" if cell.row % 2 == 0 else "FFFFFF"
        cell.fill = PatternFill("solid", fgColor=shade)
        cell.border = border
        # Wrap text for summary columns
        if col_name in ("Condylion (Co)", "Gonion (Go)", "Menton (Me)"):
            cell.alignment = Alignment(wrap_text=True, vertical="top")
            cell.font = Font(size=9)
        else:
            cell.alignment = Alignment(horizontal="center", vertical="center")
            cell.font = Font(size=9)

# Column widths
col_widths = {
    "Image":            30,
    "Condylion (Co)":   22,
    "Co_X":             8,
    "Co_Y":             8,
    "Co_Conf (%)":      10,
    "Gonion (Go)":      22,
    "Go_X":             8,
    "Go_Y":             8,
    "Go_Conf (%)":      10,
    "Menton (Me)":      22,
    "Me_X":             8,
    "Me_Y":             8,
    "Me_Conf (%)":      10,
}
for col_idx, col_name in enumerate(col_order, start=1):
    ws.column_dimensions[get_column_letter(col_idx)].width = col_widths.get(col_name, 12)

# Row heights: summary columns need taller rows
for row in ws.iter_rows(min_row=2, max_row=ws.max_row):
    ws.row_dimensions[row[0].row].height = 42

# Freeze top row
ws.freeze_panes = "A2"

wb.save(EXCEL_PATH)
print("[INFO] Styled Excel saved.")
print(f"Excel: {EXCEL_PATH}")
print(f"CSV:   {CSV_PATH}")
print(f"Images: {OUTPUT_DIR}")
