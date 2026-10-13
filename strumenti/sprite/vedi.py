#!/usr/bin/env python3
"""Guarda i pezzi dell'atlante di un gioco com'è uscito (non i fogli sorgente): ingranditi, su un fondo scuro e con la
cella da 16 px accanto, per giudicare se un pezzo sta bene a schermo.

    python3 strumenti/sprite/vedi.py sotterraneo cantine-botte cantine-scaffale   # per nome
    python3 strumenti/sprite/vedi.py sotterraneo cantine-                          # per prefisso (finisce in trattino) o parte del nome
    python3 strumenti/sprite/vedi.py sotterraneo cripta- --nitido --scala 6       # il pezzo nitido (WebP) accanto al piccolo
    python3 strumenti/sprite/vedi.py sotterraneo cantine- --fuori tmp/pezzi/cantine.png

Scrive `tmp/pezzi/<nome>.png` (di difetto il primo nome o prefisso). Il riquadro giallo scuro è una cella di gioco (16 px,
col fondo del pezzo): dice quanto è grande il pezzo accanto all'eroe (14×16). Legge `src/giochi/<gioco>/dati/atlante.js`.
"""
import argparse
import base64
import io
import json
import re
import sys
from pathlib import Path

from PIL import Image, ImageDraw, ImageFont

RADICE = Path(__file__).resolve().parent.parent.parent


def leggi(gioco):
    testo = (RADICE / 'src' / 'giochi' / gioco / 'dati' / 'atlante.js').read_text()
    def blocco(nome):
        m = re.search(rf'^export const {nome} = (.*)$', testo, re.M)
        return m.group(1).rstrip(';') if m else None
    def immagine(nome):
        b = blocco(nome)
        return Image.open(io.BytesIO(base64.b64decode(b.split(',', 1)[1].rstrip("'")))).convert('RGBA') if b else None
    pezzi = json.loads(blocco('PEZZI'))
    nitidi = json.loads(blocco('NITIDI')) if blocco('NITIDI') else {}
    return pezzi, immagine('ATLANTE'), nitidi, immagine('NITIDO') if nitidi else None


def main():
    a = argparse.ArgumentParser(description=__doc__.split('\n')[0])
    a.add_argument('gioco')
    a.add_argument('nomi', nargs='+', help='nomi, o prefissi, o parti del nome')
    a.add_argument('--scala', type=int, default=8)
    a.add_argument('--nitido', action='store_true', help='accanto al piccolo, il pezzo nitido (dove c\'è)')
    a.add_argument('--fuori')
    o = a.parse_args()
    pezzi, atlante, nitidi, nitido = leggi(o.gioco)
    scelti = []
    for n in o.nomi:
        trovati = [k for k in sorted(pezzi) if k == n or (n.endswith('-') and k.startswith(n)) or (not n.endswith('-') and n in k and n != k and n not in pezzi)]
        if not trovati:
            print(f'  ! niente nell\'atlante per «{n}»', file=sys.stderr)
        scelti += [k for k in trovati if k not in scelti]
    if not scelti:
        sys.exit(1)
    COL = 6 if not o.nitido else 4
    s = o.scala
    CW = max(pezzi[k][2] for k in scelti) * s + 24
    CW = max(CW, 16 * s + 24)
    CH = max(pezzi[k][3] for k in scelti) * s + 60
    if o.nitido:
        CW *= 2
    righe = (len(scelti) + COL - 1) // COL
    F = Image.new('RGB', (COL * CW, righe * CH), (44, 42, 52))
    d = ImageDraw.Draw(F)
    font = ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf', 12)
    for i, k in enumerate(scelti):
        cx, cy = (i % COL) * CW, (i // COL) * CH
        x, y, w, h = pezzi[k]
        p = atlante.crop((x, y, x + w, y + h)).resize((w * s, h * s), Image.NEAREST)
        base = cy + 24 + max(pezzi[j][3] for j in scelti) * s
        F.paste(p, (cx + 12, base - h * s), p)
        d.rectangle((cx + 12, base - 16 * s, cx + 12 + 16 * s, base), outline=(120, 120, 70))   # una cella di gioco
        if o.nitido and k in nitidi:
            nx, ny, nw, nh = nitidi[k]
            q = nitido.crop((nx, ny, nx + nw, ny + nh)).resize((w * s, h * s), Image.LANCZOS)
            F.paste(q, (cx + CW // 2 + 12, base - h * s), q)
        d.text((cx + 6, cy + 4), f'{k}  {w}×{h}', font=font, fill=(255, 210, 90))
    dove = Path(o.fuori) if o.fuori else RADICE / 'tmp' / 'pezzi' / (re.sub(r'[^\w-]+', '_', o.nomi[0]).strip('_') + '.png')
    dove.parent.mkdir(parents=True, exist_ok=True)
    F.save(dove)
    print(dove)


if __name__ == '__main__':
    main()
