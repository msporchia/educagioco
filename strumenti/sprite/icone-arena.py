#!/usr/bin/env python3
"""Le icone dipinte dei comandi di Castle Battle: dal foglio al modulo del gioco.

    python3 strumenti/sprite/icone-arena.py [provino.png]

Legge `sorgenti/arena/icone.json` (il foglio e cosa c'è in ogni riga), trova le figure da sé con `righe.py` e controlla che i
conti tornino. Ogni icona si porta dentro lo stesso quadrato di `LATO` px, centrata e senza stirarla: stesse misure per tutte, è
il motivo per cui esiste questo foglio. Scrive `src/giochi/arena/dati/icone-dipinte.js`. Voce 11 di DA-GENERARE.md.
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
MODULO = REPO / 'src' / 'giochi' / 'arena' / 'dati' / 'icone-dipinte.js'
LATO = 96
COLONNE = 6


def main():
    scheda = json.loads((SORGENTI / 'icone.json').read_text())
    sorgente = SORGENTI / scheda['foglio']
    if not sorgente.exists():
        sys.exit(f'manca {sorgente.relative_to(REPO)}: voce 11 di strumenti/sprite/DA-GENERARE.md')
    foglio = righe.senza_alone(Image.open(sorgente))
    trovate = righe.righe_di_figure(foglio, stacco=scheda['stacco'])
    attese = [len(r) for r in scheda['righe']]
    if [len(r) for r in trovate] != attese:
        sys.exit(f"attese righe da {attese}, trovate da {[len(r) for r in trovate]}: "
                 f"python3 strumenti/sprite/righe.py {sorgente} provino.png")
    if len(sys.argv) > 1:
        righe.provino(foglio, trovate, sys.argv[1])
    nomi = [n for r in scheda['righe'] for n in r]
    rettangoli = [q for r in trovate for q in r]
    im = Image.new('RGBA', (COLONNE * LATO, -(-len(nomi) // COLONNE) * LATO), (0, 0, 0, 0))
    pos = {}
    for i, (nome, (x, y, w, h)) in enumerate(zip(nomi, rettangoli)):
        k = LATO / max(w, h)
        fig = foglio.crop((x, y, x + w, y + h)).resize((max(1, round(w * k)), max(1, round(h * k))), Image.LANCZOS)
        cx, cy = i % COLONNE * LATO, i // COLONNE * LATO
        im.alpha_composite(fig, (cx + (LATO - fig.size[0]) // 2, cy + (LATO - fig.size[1]) // 2))
        pos[nome] = [i % COLONNE, i // COLONNE, COLONNE, im.size[1] // LATO]
    dati = codifica.webp(im)
    print(f'  {len(pos)} icone, {codifica.riga(im, dati)}')
    MODULO.write_text('/* GENERATO da strumenti/sprite/icone-arena.py: non si tocca a mano.\n'
                      '   Le icone dipinte dei comandi di Castle Battle (docs/arena/grafica.md): nome → [colonna, riga, colonne, righe].\n'
                      '   Vuoto = restano quelle disegnate di viste/Icona.vue. */\n'
                      'export const ICONE = {\n'
                      + ''.join(f"  '{n}': {json.dumps(v)},\n" for n, v in sorted(pos.items()))
                      + '}\n'
                      f"export const ATLANTE = 'data:image/webp;base64,{base64.b64encode(dati).decode()}'\n")
    print(f'{MODULO.relative_to(REPO)}: {len(dati) // 1024} KB')


if __name__ == '__main__':
    main()
