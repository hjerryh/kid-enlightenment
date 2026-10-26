#!/usr/bin/env python3
"""Render original plush numeral cards (0–19) from the bundled Nunito typeface.

Local deterministic rendering: rounded glyphs, dimensional shading, individual
fibres, and a studio ground shadow. Requires Pillow, numpy, scipy, fontTools.
"""
from pathlib import Path
from io import BytesIO
import math
import numpy as np
from PIL import Image, ImageDraw, ImageFont, ImageFilter
from scipy.ndimage import distance_transform_edt, gaussian_filter
from fontTools.ttLib import TTFont

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / 'public' / 'art' / 'numbers'
OUT.mkdir(parents=True, exist_ok=True)
IDS = 'zero one two three four five six seven eight nine ten eleven twelve thirteen fourteen fifteen sixteen seventeen eighteen nineteen'.split()
PALETTE = ['#9c70c4', '#d86656', '#91b45d', '#e1bb59', '#64b2ce', '#e79a58', '#dca8c0', '#63afb3', '#a87e60', '#8e9da0', '#bb946c', '#94b7cb', '#9e7657', '#dfbe64', '#9ebaa1', '#8d6045', '#92b9cf', '#dd9562', '#91b3c6', '#829fc3']
font_path = ROOT / 'node_modules' / '@fontsource' / 'nunito' / 'files' / 'nunito-latin-800-normal.woff2'
font_file = TTFont(font_path)
font_file.flavor = None
font_bytes = BytesIO()
font_file.save(font_bytes)
font = ImageFont.truetype(BytesIO(font_bytes.getvalue()), 420)
S = 640
Y, X = np.mgrid[:S, :S]


def render(value):
    rng = np.random.default_rng(4200 + value)
    text = str(value)
    box = font.getbbox(text, stroke_width=5)
    glyph = Image.new('L', (box[2] - box[0] + 30, box[3] - box[1] + 30))
    ImageDraw.Draw(glyph).text((15 - box[0], 15 - box[1]), text, font=font, fill=255, stroke_width=5, stroke_fill=255)
    bounds = glyph.getbbox()
    glyph = glyph.crop(bounds)
    height = 432 if value < 10 else 410
    width = round(glyph.width * height / glyph.height)
    width = min(width, 496 if value >= 10 else 390)
    glyph = glyph.resize((width, height), Image.Resampling.LANCZOS)
    mask_image = Image.new('L', (S, S))
    left, top = (S - width) // 2 - 8, 535 - height
    mask_image.paste(glyph, (left, top))
    mask = np.array(mask_image) / 255.
    inside = mask > .5
    dist = distance_transform_edt(inside)
    smooth_dist = gaussian_filter(dist, 1.6)
    gy, gx = np.gradient(smooth_dist)
    radius = 31 if value >= 10 else 40
    bevel = np.clip(smooth_dist / radius, 0, 1)
    z = np.sqrt(np.maximum(0, 1 - (1 - bevel) ** 2))
    normal_strength = (1 - bevel) * .6
    light = .65 + .34 * z + .23 * (-gx - gy) * normal_strength
    light += .06 * (1 - Y / S)
    texture = gaussian_filter(rng.normal(0, 1, (S, S)), .55)
    light = np.clip(light + texture * .035, .4, 1.2)
    rgb = np.array([int(PALETTE[value][i:i + 2], 16) for i in (1, 3, 5)])
    surface = np.clip(rgb[None, None, :] * light[:, :, None], 0, 255).astype(np.uint8)

    # Warm neutral seamless studio backdrop, like a small soft toy photograph.
    glow = np.exp(-((X - 220) ** 2 + (Y - 210) ** 2) / 170000.)
    backdrop = np.zeros((S, S, 3), dtype=np.uint8)
    for i, base in enumerate((230, 224, 214)):
        backdrop[:, :, i] = np.clip(base + glow * 17 - (Y / S) * 4, 0, 255)
    canvas = Image.fromarray(backdrop).convert('RGBA')
    shadow = Image.new('RGBA', (S, S))
    sd = ImageDraw.Draw(shadow)
    sd.ellipse((left - 12, 521, left + width + 39, 563), fill=(63, 52, 41, 70))
    canvas.alpha_composite(shadow.filter(ImageFilter.GaussianBlur(13)))
    contact = Image.new('RGBA', (S, S))
    ImageDraw.Draw(contact).ellipse((left + 22, 528, left + width + 8, 548), fill=(65, 47, 37, 85))
    canvas.alpha_composite(contact.filter(ImageFilter.GaussianBlur(5)))

    # A soft extrusion behind the front face gives the numeral tangible depth.
    for shift in range(13, 0, -3):
        depth = Image.new('RGBA', (S, S))
        color = tuple((rgb * (.56 + (13 - shift) * .015)).astype(int)) + (255,)
        depth.paste(Image.new('RGBA', (S, S), color), (shift, shift // 2), mask_image)
        canvas.alpha_composite(depth)
    front = Image.fromarray(surface).convert('RGBA')
    front.putalpha(mask_image)
    canvas.alpha_composite(front)
    draw = ImageDraw.Draw(canvas)

    # Short curved strands follow the rounded surface. Edge hairs leave the
    # silhouette slightly fuzzy without changing the readable numeral shape.
    ys, xs = np.where(inside)
    picks = rng.choice(len(xs), size=min(28000, len(xs)), replace=False)
    for pick in picks:
        x, y = int(xs[pick]), int(ys[pick])
        near_edge = dist[y, x] < 6
        angle = math.atan2(-gy[y, x], -gx[y, x]) if near_edge else float(rng.normal(-.9 + math.sin(x / 47) * .8 + math.cos(y / 61) * .8, .65))
        length = float(rng.uniform(3.5, 8.5) if near_edge else rng.uniform(3, 9))
        dx, dy = math.cos(angle) * length, math.sin(angle) * length
        shade = float(rng.uniform(.66, 1.28)) * light[y, x]
        color = tuple(np.clip(rgb * shade + (14 if shade > 1 else 0), 0, 255).astype(int)) + (255,)
        bend = float(rng.uniform(-2.5, 2.5))
        points = [(x, y), (x + dx * .48 - dy * bend / 9, y + dy * .48 + dx * bend / 9), (x + dx, y + dy)]
        draw.line(points, fill=color, width=1 if rng.random() < .8 else 2)
    canvas = canvas.convert('RGB').resize((512, 512), Image.Resampling.LANCZOS)
    target = OUT / f'{IDS[value]}.webp'
    canvas.save(target, quality=92, method=6)
    return canvas


if __name__ == '__main__':
    sheet = Image.new('RGB', (5 * 240, 4 * 270), '#f8f8f2')
    sd = ImageDraw.Draw(sheet)
    caption = ImageFont.truetype(BytesIO(font_bytes.getvalue()), 20)
    for value in range(20):
        image = render(value)
        x, y = (value % 5) * 240, (value // 5) * 270
        sheet.paste(image.resize((230, 230), Image.Resampling.LANCZOS), (x + 5, y))
        sd.text((x + 120, y + 241), f'{value} · {IDS[value]}', font=caption, anchor='mt', fill='#394e43')
        print(f'Rendered {value}: {IDS[value]}', flush=True)
    (ROOT / 'docs' / 'screenshots').mkdir(parents=True, exist_ok=True)
    sheet.save(ROOT / 'docs' / 'screenshots' / 'number-art-contact.jpg', quality=92)
