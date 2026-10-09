#!/usr/bin/env python3
"""Il regno del castello: dalla mappa generata al modulo del gioco.

    python3 strumenti/sprite/regno-castello.py             # rifà src/giochi/castello/dati/regno.js
    python3 strumenti/sprite/regno-castello.py --provino   # tmp/regno/provino.png: i posti sopra la mappa

La mappa è un'immagine sola (`generati/regno-2.png`, da ChatGPT). Tutto quello
che il codice sa di lei — i ponti che la generazione ha perso, i pezzi di
sentiero che li collegano, dove stanno le venti tappe e le quattro libere —
sta nel foglietto `sorgenti/castello/regno.json`; qui si compone e si copia nel
modulo insieme all'immagine in WebP (il build resta un file solo). Il perché:
`docs/castello/regno.md`.

Serve `pillow` (con WebP).
"""
import base64
import json
import math
import sys
from pathlib import Path

from PIL import Image, ImageDraw, ImageFilter

import codifica

QUI = Path(__file__).parent
REPO = Path(__file__).resolve().parents[2]
FOGLIETTO = QUI / 'sorgenti' / 'castello' / 'regno.json'
DEST = REPO / 'src' / 'giochi' / 'castello' / 'dati' / 'regno.js'
TMP = REPO / 'tmp' / 'regno'

TESTA = """/* GENERATO da strumenti/sprite/regno-castello.py — non si scrive a mano.

   La mappa del regno del castello e dove stanno le tappe, copiate dal
   foglietto strumenti/sprite/sorgenti/castello/regno.json. L'immagine è
   WebP senza perdita, colori a passo 12 (strumenti/sprite/codifica.py).
   Vedi docs/castello/regno.md. */
"""


def ritaglia_ponte(r, da, a, largo=40):
    """Il ponte vero, raddrizzato, col mare tolto: un pixel è acqua se il blu domina."""
    ang = math.degrees(math.atan2(a[1] - da[1], a[0] - da[0]))
    m = ((da[0] + a[0]) / 2, (da[1] + a[1]) / 2)
    lungo = math.dist(da, a)
    dritto = r.rotate(ang, center=m, resample=Image.BICUBIC)
    pz = dritto.crop((int(m[0] - lungo / 2 - 6), int(m[1] - largo / 2),
                      int(m[0] + lungo / 2 + 6), int(m[1] + largo / 2)))
    al = Image.new('L', pz.size, 0)
    px = pz.load()
    for y in range(pz.height):
        for x in range(pz.width):
            R, G, B = px[x, y]
            al.putpixel((x, y), 0 if (B > R + 35 and B > G - 5) else 255)
    pz.putalpha(al.filter(ImageFilter.MinFilter(3)).filter(ImageFilter.MaxFilter(3)))
    return pz, lungo


def posa_ponte(tela, pz, lungo, da, a):
    """Il ponte da `da` ad `a`: allungato alla distanza, girato al verso."""
    p = pz.resize((int(pz.width * math.dist(da, a) / lungo), pz.height), Image.BICUBIC)
    p = p.rotate(-math.degrees(math.atan2(a[1] - da[1], a[0] - da[0])), expand=True, resample=Image.BICUBIC)
    m = ((da[0] + a[0]) / 2, (da[1] + a[1]) / 2)
    tela.paste(p, (int(m[0] - p.width / 2), int(m[1] - p.height / 2)), p)


def stendi_sentiero(tela, terra, punti, largo=24):
    """Un pezzo di sentiero con la terra di una radura, col bordo d'erba scura come gli altri."""
    w, h = tela.size
    tr = Image.new('RGB', (w, h))
    for y in range(0, h, terra.height):
        for x in range(0, w, terra.width):
            tr.paste(terra, (x, y))
    m = Image.new('L', (w, h), 0)
    d = ImageDraw.Draw(m)
    d.line(punti, fill=255, width=largo, joint='curve')
    for x, y in punti:
        d.ellipse((x - largo / 2, y - largo / 2, x + largo / 2, y + largo / 2), fill=255)
    tela.paste((118, 132, 50), (0, 0), m.filter(ImageFilter.MaxFilter(5)).filter(ImageFilter.GaussianBlur(1)))
    tela.paste(tr, (0, 0), m.filter(ImageFilter.GaussianBlur(1)))


def compone(fg):
    r = Image.open(QUI / 'sorgenti' / 'castello' / fg['sorgente']).convert('RGB')
    tela = r.copy()
    terra = r.crop(tuple(fg['terra']))
    for s in fg['sentieri']:
        stendi_sentiero(tela, terra, [tuple(p) for p in s])
    pz, lungo = ritaglia_ponte(r, fg['ponte']['da'], fg['ponte']['a'])
    for da, a in fg['ponti']:
        posa_ponte(tela, pz, lungo, da, a)
    return tela


def provino(tela, fg):
    TMP.mkdir(parents=True, exist_ok=True)
    p = tela.copy()
    d = ImageDraw.Draw(p)
    for i, (x, y) in enumerate(fg['posti']):
        r = 22 if i % 5 == 4 else 16
        d.ellipse((x - r, y - r, x + r, y + r), outline=(255, 230, 0), width=4)
        d.text((x - 3, y - 6), str(i % 5 + 1), fill=(255, 255, 255))
    for x, y in fg['libere'].values():
        d.ellipse((x - 18, y - 18, x + 18, y + 18), outline=(255, 0, 255), width=4)
    p.save(TMP / 'provino.png')
    print(f'{(TMP / "provino.png").relative_to(REPO)}')


def scrivi(tela, fg):
    dati = codifica.webp(tela, fg.get('passo', codifica.PASSO))
    b64 = base64.b64encode(dati).decode()
    corpo = TESTA
    corpo += f'\nexport const LARGO = {tela.width}\nexport const ALTO = {tela.height}\n'
    corpo += "\n// le venti tappe, nell'ordine di TAPPE: cinque per isola, l'ultima è il capo\n"
    corpo += 'export const POSTI = [\n' + ''.join(f'  [{x}, {y}],\n' for x, y in fg['posti']) + ']\n'
    corpo += '\n// le quattro partite libere, sui torrioni del castello in mezzo\n'
    corpo += 'export const LIBERE_POSTI = {\n' + ''.join(
        f"  '{k}': [{x}, {y}],\n" for k, (x, y) in fg['libere'].items()) + '}\n'
    corpo += f"\nexport const MAPPA = 'data:image/webp;base64,{b64}'\n"
    DEST.write_text(corpo, encoding='utf-8', newline='\n')
    print(f'{DEST.relative_to(REPO)}: mappa {tela.width}×{tela.height}, {codifica.riga(tela, dati)}')


def main():
    fg = json.loads(FOGLIETTO.read_text(encoding='utf-8'))
    tela = compone(fg)
    if '--provino' in sys.argv:
        return provino(tela, fg)
    scrivi(tela, fg)


if __name__ == '__main__':
    main()
