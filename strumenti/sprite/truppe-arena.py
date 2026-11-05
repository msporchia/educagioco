#!/usr/bin/env python3
"""Le truppe dipinte di Castle Battle: lo schema delle pose da dare a chi dipinge, e il foglio dipinto tagliato per il gioco.

    python3 strumenti/sprite/truppe-arena.py

Scrive `sorgenti/arena/schemi/truppe.png`: 1536×1024, sette colonne e cinque righe, in ordine di lettura le pose di
`fotogrammiDi()` truppa per truppa, col piede in fondo alla casella. Serve alla voce 12 di DA-GENERARE.md.
Se c'è il foglio dipinto `sorgenti/arena/truppe.png`, stessa griglia, taglia ogni casella e scrive `src/giochi/arena/dati/truppe-dipinte.js`:
ogni pezzo ha il nome della posa e la scala di quella di prima, così il gioco lo mette dove stava. In `truppe.json`, `uguali` dice
quali caselle (da 1, come nella voce) prendono il disegno di un'altra: una posa uscita male.
"""
import base64
import io
import json
import re
import subprocess
import sys
from pathlib import Path

from PIL import Image

sys.path.insert(0, str(Path(__file__).parent))
import codifica  # noqa: E402
import righe  # noqa: E402

QUI = Path(__file__).resolve().parent
REPO = QUI.parent.parent
ATLANTE = REPO / 'src' / 'giochi' / 'castello' / 'dati' / 'figure.js'
SORGENTI = QUI / 'sorgenti' / 'arena'
SCHEMA = SORGENTI / 'schemi' / 'truppe.png'
MODULO = REPO / 'src' / 'giochi' / 'arena' / 'dati' / 'truppe-dipinte.js'
LARGO, ALTO, COLONNE, RIGHE, MARGINE = 1536, 1024, 7, 5, 12
ATLANTE_LARGO = 1024
POSE = """
import { CREATURA, fotogrammiDi } from './src/giochi/arena/scena/figure.js'
import { PEZZI } from './src/giochi/castello/dati/figure.js'
console.log(JSON.stringify(Object.keys(CREATURA).map(id => fotogrammiDi(id).map(nome => [nome, PEZZI[nome]]))))
"""


def scala(pose):
    """Una scala per truppa, non per posa: le pose di una truppa restano grandi uguali."""
    cella_w, cella_h = LARGO // COLONNE, ALTO // RIGHE
    return min((cella_w - 2 * MARGINE) / max(p[1][2] for p in pose), (cella_h - 2 * MARGINE) / max(p[1][3] for p in pose))


def schema(truppe):
    dati = re.search(r"IMMAGINE = 'data:image/webp;base64,([^']+)'", ATLANTE.read_text()).group(1)
    atlante = Image.open(io.BytesIO(base64.b64decode(dati))).convert('RGBA')
    cella_w, cella_h = LARGO // COLONNE, ALTO // RIGHE
    foglio, n = Image.new('RGBA', (LARGO, ALTO), (0, 0, 0, 0)), 0
    for pose in truppe:
        k = scala(pose)
        for _, (x, y, w, h) in pose:
            figura = atlante.crop((x, y, x + w, y + h)).resize((round(w * k), round(h * k)), Image.NEAREST)
            cx, cy = (n % COLONNE) * cella_w, (n // COLONNE) * cella_h
            foglio.alpha_composite(figura, (cx + (cella_w - figura.width) // 2, cy + cella_h - MARGINE - figura.height))
            n += 1
    assert n == COLONNE * RIGHE, f'{n} pose: la voce 12 ne dice {COLONNE * RIGHE}'
    foglio.save(SCHEMA)
    print(f'{SCHEMA.relative_to(REPO)}: {n} pose')


def casella(foglio, n, k):
    """La figura della casella n (da 0), simmetrica attorno al centro e tagliata ai piedi, alla scala delle pose di prima."""
    w, h = foglio.width / COLONNE, foglio.height / RIGHE
    x0, y0 = round((n % COLONNE) * w), round((n // COLONNE) * h)
    fig = foglio.crop((x0, y0, round(x0 + w), round(y0 + h)))
    l, t, r, b = fig.getchannel('A').point(lambda a: 255 if a >= 32 else 0).getbbox()
    mezzo = max(fig.width / 2 - l, r - fig.width / 2)
    fig = fig.crop((round(fig.width / 2 - mezzo), t, round(fig.width / 2 + mezzo), b))
    # premoltiplicato: il fondo trasparente è bianco, e un ridimensionamento diretto lascerebbe un alone chiaro
    return fig.convert('RGBa').resize((max(1, round(fig.width / k)), max(1, round(fig.height / k))), Image.LANCZOS).convert('RGBA')


def taglia(truppe, sorgente):
    foglio = righe.senza_alone(Image.open(sorgente).convert('RGBA'))
    uguali = {int(a) - 1: b - 1 for a, b in json.loads((SORGENTI / 'truppe.json').read_text())['uguali'].items()}
    pezzi, n = [], 0
    for pose in truppe:
        k = scala(pose) * foglio.width / LARGO
        for nome, _ in pose:
            pezzi.append((nome, casella(foglio, uguali.get(n, n), k)))
            n += 1
    pezzi.sort(key=lambda p: -p[1].height)
    pos, xx, yy, alto = {}, 0, 0, 0
    for nome, fig in pezzi:
        if xx + fig.width > ATLANTE_LARGO:
            xx, yy, alto = 0, yy + alto + 2, 0
        pos[nome] = [xx, yy, fig.width, fig.height]
        xx, alto = xx + fig.width + 2, max(alto, fig.height)
    im = Image.new('RGBA', (ATLANTE_LARGO, yy + alto), (0, 0, 0, 0))
    for nome, fig in pezzi:
        im.alpha_composite(fig, tuple(pos[nome][:2]))
    dati = codifica.webp(im)
    print(f'  {len(pos)} pezzi, atlante {codifica.riga(im, dati)}')
    MODULO.write_text('/* GENERATO da strumenti/sprite/truppe-arena.py: non si tocca a mano.\n'
                      '   Le truppe dipinte di Castle Battle (docs/arena/grafica.md). PEZZI: la posa → [x, y, largo, alto] in px dell\'atlante,\n'
                      '   alla scala delle pose del castello. */\n'
                      'export const PEZZI = {\n'
                      + ''.join(f"  '{a}': {json.dumps(b)},\n" for a, b in sorted(pos.items()))
                      + '}\n'
                      f"export const ATLANTE = 'data:image/webp;base64,{base64.b64encode(dati).decode()}'\n")
    print(f'{MODULO.relative_to(REPO)}: {len(dati) // 1024} KB')


def main():
    truppe = json.loads(subprocess.check_output(['node', '--input-type=module', '-e', POSE], cwd=REPO, text=True))
    schema(truppe)
    if (SORGENTI / 'truppe.png').exists():
        taglia(truppe, SORGENTI / 'truppe.png')


if __name__ == '__main__':
    main()
