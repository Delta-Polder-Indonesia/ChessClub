#!/usr/bin/env python3
"""Rebuild a clean circular badge PNG + a detailed SVG knight path."""

from __future__ import annotations

import math
from pathlib import Path

import cv2
import numpy as np

ROOT = Path("/home/user/WebCatur")
SRC = ROOT / "public/images/logo-concept.png"
OUT = ROOT / "public"


def contour_to_d(contour: np.ndarray, sx: float, sy: float, ox: float, oy: float) -> str:
    pts = contour.reshape(-1, 2).astype(np.float64)
    if len(pts) < 3:
        return ""
    parts = [f"M{pts[0, 0] * sx + ox:.2f} {pts[0, 1] * sy + oy:.2f}"]
    for i in range(1, len(pts)):
        parts.append(f"L{pts[i, 0] * sx + ox:.2f} {pts[i, 1] * sy + oy:.2f}")
    parts.append("Z")
    return "".join(parts)


def star_d(cx: float, cy: float, r_out: float, r_in: float, n: int = 5) -> str:
    pts = []
    for i in range(n * 2):
        ang = -math.pi / 2 + i * math.pi / n
        r = r_out if i % 2 == 0 else r_in
        pts.append((cx + r * math.cos(ang), cy + r * math.sin(ang)))
    d = [f"M{pts[0][0]:.2f} {pts[0][1]:.2f}"]
    for x, y in pts[1:]:
        d.append(f"L{x:.2f} {y:.2f}")
    d.append("Z")
    return "".join(d)


def main() -> None:
    bgr = cv2.imread(str(SRC), cv2.IMREAD_COLOR)
    if bgr is None:
        raise SystemExit(f"cannot read {SRC}")
    h, w = bgr.shape[:2]
    hsv = cv2.cvtColor(bgr, cv2.COLOR_BGR2HSV)

    navy = cv2.inRange(hsv, (95, 70, 35), (140, 255, 210))
    navy = cv2.morphologyEx(navy, cv2.MORPH_CLOSE, np.ones((15, 15), np.uint8))
    cnts, _ = cv2.findContours(navy, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
    disc = max(cnts, key=cv2.contourArea)
    (cx, cy), radius = cv2.minEnclosingCircle(disc)
    cx, cy, radius = float(cx), float(cy), float(radius)
    print(f"disc ({cx:.1f},{cy:.1f}) r={radius:.1f}")

    # ---- clean circular PNG (composite fringe against navy, not white) ----
    size = 1024
    scale = size / (2 * radius)
    xs = (np.arange(size, dtype=np.float32) - size / 2.0) / scale + cx
    ys = (np.arange(size, dtype=np.float32) - size / 2.0) / scale + cy
    map_x, map_y = np.meshgrid(xs, ys)
    warped = cv2.remap(bgr, map_x, map_y, cv2.INTER_LANCZOS4, borderMode=cv2.BORDER_CONSTANT, borderValue=(11, 47, 159))
    yy, xx = np.ogrid[:size, :size]
    dist = np.sqrt((xx - size / 2.0) ** 2 + (yy - size / 2.0) ** 2)
    r_px = size / 2.0 - 0.5
    # soft alpha at the rim
    alpha = np.clip((r_px - dist) * 1.6 + 0.5, 0, 1)
    # push near-white fringe toward navy so it doesn't glow on dark headers
    navy_bgr = np.array([159, 47, 11], dtype=np.float32)  # BGR of #0B2F9F
    wf = warped.astype(np.float32)
    # pixels that are pale (high B+G+R and low chroma) near the rim → navy
    pale = (wf.mean(axis=2) > 200) & (wf.std(axis=2) < 18) & (dist > r_px - 8)
    wf[pale] = navy_bgr
    out = np.dstack([wf, alpha * 255]).astype(np.uint8)
    cv2.imwrite(str(OUT / "images/logo-badge.png"), out)
    print("wrote logo-badge.png")

    # ---- extract knight for SVG ----
    crop_r = int(radius) + 6
    x0 = max(0, int(cx - crop_r))
    y0 = max(0, int(cy - crop_r))
    x1 = min(w, int(cx + crop_r))
    y1 = min(h, int(cy + crop_r))
    crop = bgr[y0:y1, x0:x1]
    ch, cw = crop.shape[:2]
    lcx, lcy = cx - x0, cy - y0
    print(f"crop {cw}x{ch} origin=({x0},{y0}) local_c=({lcx:.1f},{lcy:.1f})")
    crop_hsv = cv2.cvtColor(crop, cv2.COLOR_BGR2HSV)
    yy, xx = np.ogrid[:ch, :cw]
    circ = (xx - lcx) ** 2 + (yy - lcy) ** 2 <= (radius - 8) ** 2

    # White-ish (knight). Allow a bit of saturation so anti-aliased edge stays.
    white = cv2.inRange(crop_hsv, (0, 0, 170), (180, 90, 255))
    white[~circ] = 0
    print("white pixels", int(white.mean() * white.size / 255), "circ", int(circ.sum()))

    # Find the 2x2 board: look for a compact cluster of red/green/blue squares
    red_m = cv2.inRange(crop_hsv, (0, 80, 80), (12, 255, 255)) | cv2.inRange(crop_hsv, (168, 80, 80), (180, 255, 255))
    green_m = cv2.inRange(crop_hsv, (40, 80, 80), (90, 255, 255))
    blue_m = cv2.inRange(crop_hsv, (95, 80, 80), (140, 255, 255))
    color_m = cv2.bitwise_or(red_m, cv2.bitwise_or(green_m, blue_m))
    color_m[~circ] = 0
    color_m = cv2.morphologyEx(color_m, cv2.MORPH_CLOSE, np.ones((7, 7), np.uint8))
    ccnts, _ = cv2.findContours(color_m, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
    board_box = None
    for c in ccnts:
        bx, by, bw, bh = cv2.boundingRect(c)
        area = bw * bh
        aspect = bw / max(bh, 1)
        if 400 < area < 25000 and 0.75 < aspect < 1.35 and bx + bw / 2 < lcx:
            board_box = (bx, by, bw, bh)
            break
    print("board_box", board_box)

    if board_box:
        bx, by, bw, bh = board_box
        m = 3
        white[max(0, by - m) : by + bh + m, max(0, bx - m) : bx + bw + m] = 0

    # Reconnect thin neck/base with a close
    white = cv2.morphologyEx(white, cv2.MORPH_CLOSE, np.ones((9, 9), np.uint8))
    white = cv2.morphologyEx(white, cv2.MORPH_OPEN, np.ones((3, 3), np.uint8))

    nlab, labels, stats, _ = cv2.connectedComponentsWithStats(white, 8)
    # keep the 2 largest (knight body + possible detached base) if close
    areas = [(stats[i, cv2.CC_STAT_AREA], i) for i in range(1, nlab)]
    areas.sort(reverse=True)
    knight = np.zeros_like(white)
    if not areas:
        raise SystemExit("no knight")
    knight[labels == areas[0][1]] = 255
    if len(areas) > 1 and areas[1][0] > 0.08 * areas[0][0]:
        # likely the plinth
        knight[labels == areas[1][1]] = 255
        print(f"merged 2nd component area={areas[1][0]}")

    # close again to join body+base
    knight = cv2.morphologyEx(knight, cv2.MORPH_CLOSE, np.ones((11, 11), np.uint8))

    dbg = cv2.cvtColor(crop, cv2.COLOR_BGR2RGB)
    dbg[knight > 0] = (255, 220, 220)
    cv2.imwrite(str(OUT / "images/logo-trace-debug.png"), cv2.cvtColor(dbg, cv2.COLOR_RGB2BGR))

    cnts, hier = cv2.findContours(knight, cv2.RETR_CCOMP, cv2.CHAIN_APPROX_NONE)
    if hier is None:
        raise SystemExit("no contours")
    hier = hier[0]

    target_r = 100.0
    sx = target_r / radius
    ox = 100 - lcx * sx
    oy = 100 - lcy * sx

    outers, holes = [], []
    for i, c in enumerate(cnts):
        peri = cv2.arcLength(c, True)
        # keep lots of detail
        approx = cv2.approxPolyDP(c, max(0.35, 0.00055 * peri), True)
        d = contour_to_d(approx, sx, sx, ox, oy)
        if not d:
            continue
        if hier[i][3] < 0:
            outers.append((cv2.contourArea(c), d))
        else:
            holes.append((cv2.contourArea(c), d))
    outers.sort(reverse=True)
    holes.sort(reverse=True)
    print(f"outers={len(outers)} holes={len(holes)} pts_outer~")

    knight_d = " ".join([outers[0][1]] + [d for _, d in holes[:6]])

    gold, navy_c, red, green = "#D4A017", "#0B2F9F", "#D52B1E", "#00A651"
    board_white, board_blue = "#F4F6FA", "#1E4FD0"

    # Board placement in viewBox — use detected box if any
    if board_box:
        bx, by, bw, bh = board_box
        vbx, vby = bx * sx + ox, by * sx + oy
        vbs = ((bw + bh) / 2) * sx
    else:
        vbx, vby, vbs = 52.0, 112.0, 16.5

    # Green bottom band between the two gold rings' interior
    def band(r_out, r_in, deg0, deg1) -> str:
        a0, a1 = math.radians(deg0), math.radians(deg1)

        def p(r, a):
            return 100 + r * math.cos(a), 100 + r * math.sin(a)

        p0, p1, p2, p3 = p(r_out, a0), p(r_out, a1), p(r_in, a1), p(r_in, a0)
        # SVG: y-down, 0°=east, 90°=south. Sweep 1 = clockwise.
        return (
            f"M{p0[0]:.2f} {p0[1]:.2f}"
            f"A{r_out:.2f} {r_out:.2f} 0 0 1 {p1[0]:.2f} {p1[1]:.2f}"
            f"L{p2[0]:.2f} {p2[1]:.2f}"
            f"A{r_in:.2f} {r_in:.2f} 0 0 0 {p3[0]:.2f} {p3[1]:.2f}Z"
        )

    # from 40° (SE) clockwise to 140° (SW) — that's the SHORT top way!
    # clockwise from 40 to 140: 40→90→140 is the BOTTOM. Sweep 1 from 40 to 140.
    # In SVG with y-down, angle from +x, clockwise: 40° is SE, 90° is S, 140° is SW. Yes bottom.
    # Wait: math.cos/sin: 0=east, 90=south (because y is down if we use standard math? 
    # math: 0=east, 90=north in standard math (y-up). In SVG y-down, math.sin(90)=1 goes DOWN. So 90=south. Good.
    # Clockwise in screen space from 40° (SE) : 40 → 90 → 140 (SW). That's bottom. 
    # SVG sweep-flag 1 is clockwise in screen space. Good.
    green_arc = band(84.8, 72.8, 38, 142)

    svg = f'''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200" fill="none">
  <circle cx="100" cy="100" r="100" fill="{navy_c}"/>
  <circle cx="100" cy="100" r="93.4" fill="none" stroke="{gold}" stroke-width="2.3"/>
  <circle cx="100" cy="100" r="88.6" fill="none" stroke="{gold}" stroke-width="1.05"/>
  <path d="{star_d(100, 28.6, 7.6, 3.15)}" fill="{gold}"/>
  <path fill="#FFFFFF" fill-rule="evenodd" d="{knight_d}"/>
  <g>
    <rect x="{vbx:.2f}" y="{vby:.2f}" width="{vbs/2:.2f}" height="{vbs/2:.2f}" fill="{red}"/>
    <rect x="{vbx + vbs/2:.2f}" y="{vby:.2f}" width="{vbs/2:.2f}" height="{vbs/2:.2f}" fill="{board_white}"/>
    <rect x="{vbx:.2f}" y="{vby + vbs/2:.2f}" width="{vbs/2:.2f}" height="{vbs/2:.2f}" fill="{green}"/>
    <rect x="{vbx + vbs/2:.2f}" y="{vby + vbs/2:.2f}" width="{vbs/2:.2f}" height="{vbs/2:.2f}" fill="{board_blue}"/>
    <rect x="{vbx:.2f}" y="{vby:.2f}" width="{vbs:.2f}" height="{vbs:.2f}" fill="none" stroke="#081E5C" stroke-width="0.65"/>
  </g>
  <path d="{green_arc}" fill="{green}"/>
</svg>
'''
    (OUT / "logo-mark.svg").write_text(svg, encoding="utf-8")
    print(f"wrote logo-mark.svg ({(OUT / 'logo-mark.svg').stat().st_size} bytes)")


if __name__ == "__main__":
    main()
