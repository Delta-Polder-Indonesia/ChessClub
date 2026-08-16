#!/usr/bin/env python3
"""Chroma-key the isolated knight and build light/dark transparent marks."""

from __future__ import annotations

from pathlib import Path

import cv2
import numpy as np

# Akar repo diturunkan dari lokasi skrip ini (scripts/ -> <repo>),
# bukan path absolut, agar skrip jalan di mesin mana pun.
ROOT = Path(__file__).resolve().parents[1] / "public" / "images"
SRC = ROOT / "logo-nobg-source.png"
NAVY = np.array([159, 47, 11], dtype=np.float32)  # BGR #0B2F9F


def chroma_key(bgr: np.ndarray) -> np.ndarray:
    hsv = cv2.cvtColor(bgr, cv2.COLOR_BGR2HSV)
    h, s, v = (c.astype(np.float32) for c in cv2.split(hsv))

    dh = np.minimum(np.abs(h - 60.0), 180.0 - np.abs(h - 60.0))
    score = (
        (1.0 - np.clip(dh / 20.0, 0, 1))
        * np.clip((s - 100) / 130.0, 0, 1)
        * np.clip((v - 130) / 100.0, 0, 1)
    )

    keep_white = (s < 45) & (v > 175)
    keep_gold = (h >= 14) & (h <= 40) & (s > 55) & (v > 110)
    keep_red = ((h <= 12) | (h >= 168)) & (s > 70) & (v > 70)
    keep_blue = (h >= 90) & (h <= 145) & (s > 55) & (v > 35)
    keep_dark_green = (h >= 35) & (h <= 95) & (v < 145) & (s > 40)
    keep = keep_white | keep_gold | keep_red | keep_blue | keep_dark_green

    alpha = 1.0 - np.clip(score, 0, 1)
    alpha[keep] = 1.0
    hard_key = (dh < 16) & (s > 170) & (v > 175) & ~keep
    alpha[hard_key] = 0.0

    # Despill green fringe on remaining pixels
    out = bgr.astype(np.float32)
    gch, bch, rch = out[:, :, 1], out[:, :, 0], out[:, :, 2]
    rb = np.maximum(rch, bch)
    spill = (gch > rb + 4) & (alpha > 0.02)
    out[:, :, 1] = np.where(spill, rb, gch)

    # Push semi-transparent edge of the (white) knight toward white
    edge = (alpha > 0.08) & (alpha < 0.92) & (s < 80)
    for i in range(3):
        out[:, :, i] = np.where(edge, np.maximum(out[:, :, i], 235), out[:, :, i])

    rgba = np.dstack([out, np.clip(alpha * 255, 0, 255)])
    return rgba.astype(np.uint8)


def crop_alpha(rgba: np.ndarray, pad: int = 16) -> np.ndarray:
    ys, xs = np.where(rgba[:, :, 3] > 10)
    x0, x1 = max(0, xs.min() - pad), min(rgba.shape[1], xs.max() + pad + 1)
    y0, y1 = max(0, ys.min() - pad), min(rgba.shape[0], ys.max() + pad + 1)
    return rgba[y0:y1, x0:x1]


def square_pad(rgba: np.ndarray) -> np.ndarray:
    h, w = rgba.shape[:2]
    side = max(h, w)
    canvas = np.zeros((side, side, 4), dtype=np.uint8)
    y, x = (side - h) // 2, (side - w) // 2
    canvas[y : y + h, x : x + w] = rgba
    return canvas


def recolor_white_to_navy(rgba: np.ndarray) -> np.ndarray:
    """Recolor the knight silhouette to navy; leave star, board, pedestal."""
    out = rgba.copy()
    hsv = cv2.cvtColor(out[:, :, :3], cv2.COLOR_BGR2HSV)
    h, s, v = (c.astype(np.float32) for c in cv2.split(hsv))
    a = out[:, :, 3]

    red = ((h <= 12) | (h >= 168)) & (s > 70) & (v > 70) & (a > 12)
    blue = (h >= 90) & (h <= 145) & (s > 55) & (v > 40) & (a > 12)
    green = (h >= 35) & (h <= 95) & (s > 50) & (v < 170) & (a > 12)
    colorful = ((red | blue | green).astype(np.uint8) * 255)
    colorful = cv2.morphologyEx(colorful, cv2.MORPH_CLOSE, np.ones((9, 9), np.uint8))
    ccnts, _ = cv2.findContours(colorful, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
    board = np.zeros(a.shape, dtype=bool)
    if ccnts:
        # smallest compact colorful patch is the 2x2 board (pedestal is larger/wider)
        def score(c):
            x, y, w, h_ = cv2.boundingRect(c)
            aspect = w / max(h_, 1)
            return abs(1.0 - aspect) * 1000 + (0 if 200 < w * h_ < 25000 else 10000)

        board_c = min(ccnts, key=score)
        x, y, w, h_ = cv2.boundingRect(board_c)
        m = 4
        board[max(0, y - m) : y + h_ + m, max(0, x - m) : x + w + m] = True

    gold = (h >= 14) & (h <= 40) & (s > 55) & (v > 110)
    light = (v > 140) & (s < 120) & (a > 10) & ~gold & ~board

    bgr = out[:, :, :3].astype(np.float32)
    for i in range(3):
        bgr[:, :, i] = np.where(light, NAVY[i], bgr[:, :, i])
    out[:, :, :3] = bgr.astype(np.uint8)
    return out


def composite(fg: np.ndarray, bg_bgr: tuple[int, int, int]) -> np.ndarray:
    bg = np.zeros_like(fg)
    bg[:, :] = (*bg_bgr, 255)
    a = fg[:, :, 3:4].astype(np.float32) / 255.0
    mix = fg.astype(np.float32) * a + bg.astype(np.float32) * (1 - a)
    return mix.astype(np.uint8)


def main() -> None:
    bgr = cv2.imread(str(SRC), cv2.IMREAD_COLOR)
    rgba = square_pad(crop_alpha(chroma_key(bgr)))
    light = rgba
    dark = recolor_white_to_navy(rgba)

    for name, img in (("logo-mark-light.png", light), ("logo-mark-dark.png", dark)):
        resized = cv2.resize(img, (400, 400), interpolation=cv2.INTER_AREA)
        cv2.imwrite(str(ROOT / name), resized)
        print(name, (ROOT / name).stat().st_size)

    light_s = cv2.resize(light, (480, 480), interpolation=cv2.INTER_AREA)
    dark_s = cv2.resize(dark, (480, 480), interpolation=cv2.INTER_AREA)
    cv2.imwrite("/tmp/preview-light-on-dark.png", composite(light_s, (22, 22, 16)))
    cv2.imwrite("/tmp/preview-dark-on-white.png", composite(dark_s, (255, 255, 255)))
    cv2.imwrite("/tmp/preview-light-on-white.png", composite(light_s, (255, 255, 255)))
    cv2.imwrite("/tmp/preview-dark-on-dark.png", composite(dark_s, (22, 22, 16)))


if __name__ == "__main__":
    main()
