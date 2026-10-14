#!/usr/bin/env python3
"""Le caserme dipinte di Castle Battle: dal foglio al modulo del gioco.

    python3 strumenti/sprite/caserme-arena.py [provino.png]

Legge `sorgenti/arena/caserme.json` (il foglio e cosa c'è in ogni riga), trova le
figure da sé con `righe.py` e controlla che i conti tornino. Ogni figura poggia su
una piazzola, e le piazzole del foglio non sono tutte della stessa misura: si
misura la larghezza della piazzola (la fascia in basso) e ogni figura si scala
perché la piazzola sia larga `PIAZZOLA` px. Il punto d'appoggio è il centro della
piazzola, in basso: lì il gioco posa la figura. Scrive
`src/giochi/arena/dati/caserme-dipinte.js` (un atlante WebP e i pezzi). Perché e
come le usa la scena: docs/arena/grafica.md.
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
MODULO = REPO / 'src' / 'giochi' / 'arena' / 'dati' / 'caserme-dipinte.js'
PIAZZOLA = 128          # la larghezza comune della piazzola, in px dell'atlante
LARGO = 1024            # la larghezza dell'atlante
FASCIA = 0.12           # quanto in basso si guarda per misurare la piazzola


def piazzola(fig):
    """(centro x, larghezza) della piazzola: i pixel pieni nella fascia più bassa."""
    w, h = fig.size
    a = fig.getchannel('A')
    xs = [x for y in range(int(h * (1 - FASCIA)), h) for x in range(w) if a.getpixel((x, y)) >= 128]
    return (min(xs) + max(xs) + 1) / 2, max(xs) + 1 - min(xs)


def main():
    scheda = json.loads((SORGENTI / 'caserme.json').read_text())
    foglio = righe.senza_alone(Image.open(SORGENTI / scheda['foglio']))
    trovate = righe.righe_di_figure(foglio, stacco=scheda['stacco'])
    attese = [len(r) for r in scheda['righe']]
    if [len(r) for r in trovate] != attese:
        sys.exit(f"attese righe da {attese}, trovate da {[len(r) for r in trovate]}: "
                 f"python3 strumenti/sprite/righe.py {SORGENTI / scheda['foglio']} provino.png")
    if len(sys.argv) > 1:
        righe.provino(foglio, trovate, sys.argv[1])
    pezzi = []
    for nomi, rettangoli in zip(scheda['righe'], trovate):
        for nome, (x, y, w, h) in zip(nomi, rettangoli):
            if not nome:
                continue
            fig = foglio.crop((x, y, x + w, y + h))
            cx, largo = piazzola(fig)
            k = PIAZZOLA / largo
            fig = fig.resize((max(1, round(w * k)), max(1, round(h * k))), Image.LANCZOS)
            pezzi.append((nome, fig, round(cx * k), fig.size[1]))
    # l'atlante: a scaffali, dal più alto
    pezzi.sort(key=lambda p: -p[1].size[1])
    atlante, pos, xx, yy, alto = [], {}, 0, 0, 0
    for nome, fig, cx, piede in pezzi:
        w, h = fig.size
        if xx + w > LARGO:
            xx, yy, alto = 0, yy + alto + 2, 0
        pos[nome] = [xx, yy, w, h, cx, piede]
        atlante.append((fig, xx, yy))
        xx, alto = xx + w + 2, max(alto, h)
    im = Image.new('RGBA', (LARGO, yy + alto), (0, 0, 0, 0))
    for fig, x, y in atlante:
        im.alpha_composite(fig, (x, y))
    dati = codifica.webp(im)
    print(f'  {len(pos)} pezzi, atlante {codifica.riga(im, dati)}')
    corpo = ('/* GENERATO da strumenti/sprite/caserme-arena.py: non si tocca a mano.\n'
             '   Le caserme dipinte di Castle Battle (docs/arena/grafica.md). PEZZI: nome →\n'
             '   [x, y, largo, alto, centro della piazzola, piede], in px dell\'atlante; la\n'
             f'   piazzola di ogni pezzo è larga PIAZZOLA px. */\n'
             f'export const PIAZZOLA = {PIAZZOLA}\n'
             'export const PEZZI = {\n'
             + ''.join(f"  '{n}': {json.dumps(v)},\n" for n, v in sorted(pos.items()))
             + '}\n'
             f"export const ATLANTE = 'data:image/webp;base64,{base64.b64encode(dati).decode()}'\n")
    MODULO.write_text(corpo)
    print(f'{MODULO.relative_to(REPO)}: {len(dati) // 1024} KB')


if __name__ == '__main__':
    main()
