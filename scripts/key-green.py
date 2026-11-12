"""Knock a flat chroma-key green background out of an image.

Usage: python -I scripts/key-green.py <input.png> <output.png> [--pad 0.06]
Keeps the largest opaque component, fills interior holes, adds padding.
"""

import sys
from collections import deque

from PIL import Image, ImageFilter


def key(src_path: str, out_path: str, pad_ratio: float = 0.06) -> None:
    src = Image.open(src_path).convert("RGB")
    w, h = src.size
    px = src.load()
    out = Image.new("RGBA", (w, h))
    op = out.load()

    for y in range(h):
        for x in range(w):
            r, g, b = px[x, y]
            excess = g - max(r, b)
            if excess <= 12:
                a = 255
            elif excess >= 70:
                a = 0
            else:
                a = int(255 * (1 - (excess - 12) / 58.0))
            if a > 0:
                op[x, y] = (r, min(g, max(r, b)), b, a)
            else:
                op[x, y] = (r, g, b, 0)

    alpha = out.split()[3]
    mask = alpha.point(lambda v: 255 if v > 110 else 0)
    mask = mask.filter(ImageFilter.MaxFilter(5)).filter(ImageFilter.MinFilter(5))

    m = mask.load()
    seen = bytearray(w * h)
    best: list[tuple[int, int]] = []
    for y in range(h):
        for x in range(w):
            if m[x, y] and not seen[y * w + x]:
                comp = []
                q = deque([(x, y)])
                seen[y * w + x] = 1
                while q:
                    cx, cy = q.popleft()
                    comp.append((cx, cy))
                    for dx, dy in ((1, 0), (-1, 0), (0, 1), (0, -1)):
                        nx, ny = cx + dx, cy + dy
                        if 0 <= nx < w and 0 <= ny < h and m[nx, ny] and not seen[ny * w + nx]:
                            seen[ny * w + nx] = 1
                            q.append((nx, ny))
                if len(comp) > len(best):
                    best = comp

    keep = bytearray(w * h)
    for cx, cy in best:
        keep[cy * w + cx] = 1

    ap = alpha.load()
    for y in range(h):
        row = y * w
        for x in range(w):
            if not keep[row + x]:
                ap[x, y] = 0

    out.putalpha(alpha)
    bbox = out.getbbox()
    out = out.crop(bbox)
    side = max(out.size)
    pad = int(side * pad_ratio)
    canvas = Image.new("RGBA", (side + 2 * pad, side + 2 * pad), (0, 0, 0, 0))
    canvas.paste(out, (pad + (side - out.size[0]) // 2, pad + (side - out.size[1]) // 2))
    canvas.save(out_path)
    print(f"{out_path}: {canvas.size}")


if __name__ == "__main__":
    args = [a for a in sys.argv[1:] if not a.startswith("--")]
    key(args[0], args[1])
