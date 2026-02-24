#!/usr/bin/env python3
"""
scripts/remove_mesh_bg.py

Quita la malla de fondo y produce un PNG con transparencia.

Uso:
  python scripts/remove_mesh_bg.py <input-path> <output-path>

Dependencias:
  pip install opencv-python pillow numpy
"""
import sys
import cv2
import numpy as np
from PIL import Image

def sample_border_pixels(img, border_px=30):
    h, w = img.shape[:2]
    top = img[0:border_px, :, :]
    bottom = img[max(0, h-border_px):h, :, :]
    left = img[:, 0:border_px, :]
    right = img[:, max(0, w-border_px):w, :]
    samples = np.concatenate([top.reshape(-1,3), bottom.reshape(-1,3), left.reshape(-1,3), right.reshape(-1,3)], axis=0)
    return samples.astype(np.float32)

def find_background_centers(samples, k=2):
    criteria = (cv2.TERM_CRITERIA_EPS + cv2.TERM_CRITERIA_MAX_ITER, 30, 1.0)
    attempts = 5
    flags = cv2.KMEANS_PP_CENTERS
    _, _, centers = cv2.kmeans(samples, k, None, criteria, attempts, flags)
    centers = centers.astype(np.uint8)
    return centers

def build_initial_mask(img_bgr, bg_centers, thresh=30):
    img_lab = cv2.cvtColor(img_bgr, cv2.COLOR_BGR2LAB)
    h,w = img_bgr.shape[:2]
    dist_stack = []
    for c in bg_centers:
        c_lab = cv2.cvtColor(np.uint8([[c]]), cv2.COLOR_BGR2LAB).reshape(3)
        diff = img_lab.astype(np.int16) - c_lab.astype(np.int16)
        dist = np.linalg.norm(diff, axis=2)
        dist_stack.append(dist)
    dist_stack = np.stack(dist_stack, axis=2)
    min_dist = dist_stack.min(axis=2)
    mask_init = np.where(min_dist <= thresh, cv2.GC_PR_BGD, cv2.GC_PR_FGD).astype('uint8')
    return mask_init

def refine_mask_with_grabcut(img_bgr, mask_init, iter_count=5):
    mask = mask_init.copy()
    bgdModel = np.zeros((1,65), np.float64)
    fgdModel = np.zeros((1,65), np.float64)
    cv2.grabCut(img_bgr, mask, None, bgdModel, fgdModel, iter_count, cv2.GC_INIT_WITH_MASK)
    return mask

def postprocess_alpha(mask, kernel_size=5):
    fg = np.where((mask==cv2.GC_FGD) | (mask==cv2.GC_PR_FGD), 255, 0).astype('uint8')
    k = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (kernel_size,kernel_size))
    fg = cv2.morphologyEx(fg, cv2.MORPH_OPEN, k, iterations=1)
    fg = cv2.morphologyEx(fg, cv2.MORPH_CLOSE, k, iterations=2)
    fg = cv2.GaussianBlur(fg, (5,5), 0)
    return fg

def remove_mesh_background(input_path, output_path):
    img = cv2.imread(input_path, cv2.IMREAD_UNCHANGED)
    if img is None:
        raise SystemExit(f"No se pudo abrir la imagen: {input_path}")

    if img.shape[2] == 4:
        bgr = img[:,:,:3]
    else:
        bgr = img

    samples = sample_border_pixels(bgr, border_px=max(20, int(min(bgr.shape[:2])*0.05)))
    centers = find_background_centers(samples, k=2)

    mask_init = build_initial_mask(bgr, centers, thresh=28)

    gray = cv2.cvtColor(bgr, cv2.COLOR_BGR2GRAY)
    mask_init = np.where(gray < 20, cv2.GC_BGD, mask_init)
    mask_init = np.where(gray > 235, cv2.GC_BGD, mask_init)

    mask_refined = refine_mask_with_grabcut(bgr, mask_init, iter_count=5)
    alpha_mask = postprocess_alpha(mask_refined, kernel_size=5)

    b,g,r = cv2.split(bgr)
    rgba = cv2.merge([b,g,r, alpha_mask])

    img_out = Image.fromarray(cv2.cvtColor(rgba, cv2.COLOR_BGRA2RGBA))
    img_out.save(output_path)
    print("Guardado:", output_path)

if __name__ == "__main__":
    if len(sys.argv) < 3:
        print("Uso: python scripts/remove_mesh_bg.py input.png output.png")
        sys.exit(1)
    remove_mesh_background(sys.argv[1], sys.argv[2])
