#!/usr/bin/env python3
"""Le fortezze dipinte di Castle Battle: dal foglio al modulo del gioco.

    python3 strumenti/sprite/fortezze-arena.py [provino.png]

Legge `sorgenti/arena/fortezze.json` (il foglio e cosa c'è in ogni riga), trova le figure da sé con `righe.py` e
controlla che i conti tornino. Ogni pezzo si porta alla sua larghezza (`LARGHEZZE`), senza stirarlo; il punto
d'appoggio è il piede. Scrive `src/giochi/arena/dati/fortezze-dipinte.js` (un atlante WebP e i pezzi). Come le usa la
scena: docs/arena/grafica.md.
"""
import base64
import json
import sys
from pathlib import Path

from PIL import Image

sys.path.insert(0, str(Path(__file__).parent))
import codifica  # noqa: E402
import righe  # noqa: E402

QUI = Path(__file__).resolve().parent
REPO = QUI.parent.parent
SORGENTI = QUI / 'sorgenti' / 'arena'
MODULO = REPO / 'src' / 'giochi' / 'arena' / 'dati' / 'fortezze-dipinte.js'
LARGHEZZE = {'castello': 306, 'porta': 144, 'ponte': 120}    # px dell'atlante; il castello è largo quanto quello del foglio di prima
LARGO = 1024


def main():
    scheda = json.loads((SORGENTI / 'fortezze.json').read_text())
    sorgente = SORGENTI / scheda['foglio']
    if not sorgente.exists():
        sys.exit(f'manca {sorgente.relative_to(REPO)}: voce 9 di strumenti/sprite/DA-GENERARE.md')
    foglio = righe.senza_alone(Image.open(sorgente))
    trovate = righe.righe_di_figure(foglio, stacco=scheda['stacco'])
    attese = [len(r) for r in scheda['righe']]
    if [len(r) for r in trovate] != attese:
        sys.exit(f"attese righe da {attese}, trovate da {[len(r) for r in trovate]}: "
                 f"python3 strumenti/sprite/righe.py {sorgente} provino.png")
    if len(sys.argv) > 1:
        righe.provino(foglio, trovate, sys.argv[1])
    pezzi = []
    for nomi, rettangoli in zip(scheda['righe'], trovate):
        for nome, (x, y, w, h) in zip(nomi, rettangoli):
            k = LARGHEZZE[nome.split(':')[0]] / w
            fig = foglio.crop((x, y, x + w, y + h)).resize((max(1, round(w * k)), max(1, round(h * k))), Image.LANCZOS)
            pezzi.append((nome, fig))
    # l'atlante: a scaffali, dal più alto
    pezzi.sort(key=lambda p: -p[1].size[1])
    atlante, pos, xx, yy, alto = [], {}, 0, 0, 0
    for nome, fig in pezzi:
        w, h = fig.size
        if xx + w > LARGO:
            xx, yy, alto = 0, yy + alto + 2, 0
        pos[nome] = [xx, yy, w, h]
        atlante.append((fig, xx, yy))
        xx, alto = xx + w + 2, max(alto, h)
    im = Image.new('RGBA', (LARGO, yy + alto), (0, 0, 0, 0))
    for fig, x, y in atlante:
        im.alpha_composite(fig, (x, y))
    dati = codifica.webp(im)
    print(f'  {len(pos)} pezzi, atlante {codifica.riga(im, dati)}')
    MODULO.write_text('/* GENERATO da strumenti/sprite/fortezze-arena.py: non si tocca a mano.\n'
                      '   Castelli, porte e ponti dipinti di Castle Battle (docs/arena/grafica.md). PEZZI: nome →\n'
                      '   [x, y, largo, alto], in px dell\'atlante. Vuoto = restano quelli di dati/opere-disegnate.js. */\n'
                      'export const PEZZI = {\n'
                      + ''.join(f"  '{n}': {json.dumps(v)},\n" for n, v in sorted(pos.items()))
                      + '}\n'
                      f"export const ATLANTE = 'data:image/webp;base64,{base64.b64encode(dati).decode()}'\n")
    print(f'{MODULO.relative_to(REPO)}: {len(dati) // 1024} KB')


if __name__ == '__main__':
    main()
