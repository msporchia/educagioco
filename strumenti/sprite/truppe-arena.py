#!/usr/bin/env python3
"""Lo schema delle truppe di Castle Battle: tutte le pose che il gioco usa, in un foglio da dare a ChatGPT.

    python3 strumenti/sprite/truppe-arena.py

Scrive `sorgenti/arena/schemi/truppe.png`: 1536×1024, sette colonne e cinque righe, in ordine di lettura le pose di
`fotogrammiDi()` truppa per truppa, col piede in fondo alla casella. Serve alla voce 12 di DA-GENERARE.md.
"""
import base64
import io
import json
import re
import subprocess
from pathlib import Path

from PIL import Image

QUI = Path(__file__).resolve().parent
REPO = QUI.parent.parent
ATLANTE = REPO / 'src' / 'giochi' / 'castello' / 'dati' / 'figure.js'
SCHEMA = QUI / 'sorgenti' / 'arena' / 'schemi' / 'truppe.png'
LARGO, ALTO, COLONNE, RIGHE, MARGINE = 1536, 1024, 7, 5, 12
POSE = """
import { CREATURA, fotogrammiDi } from './src/giochi/arena/scena/figure.js'
import { PEZZI } from './src/giochi/castello/dati/figure.js'
console.log(JSON.stringify(Object.keys(CREATURA).map(id => fotogrammiDi(id).map(nome => PEZZI[nome]))))
"""


def main():
    truppe = json.loads(subprocess.check_output(['node', '--input-type=module', '-e', POSE], cwd=REPO, text=True))
    dati = re.search(r"IMMAGINE = 'data:image/webp;base64,([^']+)'", ATLANTE.read_text()).group(1)
    atlante = Image.open(io.BytesIO(base64.b64decode(dati))).convert('RGBA')
    cella_w, cella_h = LARGO // COLONNE, ALTO // RIGHE
    foglio, n = Image.new('RGBA', (LARGO, ALTO), (0, 0, 0, 0)), 0
    for pose in truppe:
        # una scala per truppa, non per posa: le pose di una truppa restano grandi uguali
        k = min((cella_w - 2 * MARGINE) / max(p[2] for p in pose), (cella_h - 2 * MARGINE) / max(p[3] for p in pose))
        for x, y, w, h in pose:
            figura = atlante.crop((x, y, x + w, y + h)).resize((round(w * k), round(h * k)), Image.NEAREST)
            cx, cy = (n % COLONNE) * cella_w, (n // COLONNE) * cella_h
            foglio.alpha_composite(figura, (cx + (cella_w - figura.width) // 2, cy + cella_h - MARGINE - figura.height))
            n += 1
    assert n == COLONNE * RIGHE, f'{n} pose: la voce 12 ne dice {COLONNE * RIGHE}'
    foglio.save(SCHEMA)
    print(f'{SCHEMA.relative_to(REPO)}: {n} pose')


if __name__ == '__main__':
    main()
