#!/usr/bin/env python3
"""I terreni dipinti di Castle Battle e l'insegna della mappa: dalle sorgenti al modulo del gioco.

    python3 strumenti/sprite/terreni-arena.py

Legge `sorgenti/arena/terreno-<chiave>.{png,webp,jpg}` (bosco, palude, neve, lava: le chiavi storiche, i posti sono quelli
di `scena/ambienti.js`) e `sorgenti/home/copertina-arena.*`. Un terreno è il pezzo di mondo `DIPINTO`, largo 3:2, col campo
in mezzo, e non si stira: se l'immagine non è 3:2 lo strumento si ferma. Scrive `src/giochi/arena/dati/terreni-dipinti.js`;
quello che manca resta disegnato in codice. La copertina vale anche per la home: dopo si lancia `copertine.py`.
Perché e come: docs/arena/grafica.md, voci 8 e 10 di DA-GENERARE.md.
"""
import base64
import io
import sys
from pathlib import Path

from PIL import Image

QUI = Path(__file__).resolve().parent
REPO = QUI.parent.parent
SORGENTI = QUI / 'sorgenti' / 'arena'
HOME = QUI / 'sorgenti' / 'home'
MODULO = REPO / 'src' / 'giochi' / 'arena' / 'dati' / 'terreni-dipinti.js'
CHIAVI = ['bosco', 'palude', 'neve', 'lava']
LARGO = 1536            # quanto resta largo un terreno: è quello che ChatGPT dà
INSEGNA = 1024
QUALITA = 84            # i dipinti sono pieni di grana: senza perdita peserebbero il triplo


def trova(cartella, nome):
    for est in ('png', 'webp', 'jpg', 'jpeg'):
        p = cartella / f'{nome}.{est}'
        if p.exists():
            return p
    return None


def dati_url(im):
    b = io.BytesIO()
    im.convert('RGB').save(b, 'WEBP', quality=QUALITA, method=6)
    return 'data:image/webp;base64,' + base64.b64encode(b.getvalue()).decode(), len(b.getvalue())


def main():
    voci = {}
    for chiave in CHIAVI:
        p = trova(SORGENTI, f'terreno-{chiave}')
        if not p:
            print(f'  {chiave}: niente sorgente, resta il disegno in codice')
            continue
        im = Image.open(p)
        w, h = im.size
        if abs(w / h - 1.5) > 0.02:
            sys.exit(f'{p.name} è {w}×{h}: un terreno è 3:2 orizzontale e non si stira (voce 8 di DA-GENERARE.md)')
        voci[chiave], peso = dati_url(im.resize((LARGO, LARGO * 2 // 3), Image.LANCZOS))
        print(f'  {chiave}: {w}×{h}, {peso // 1024} KB')
    insegna, p = '', trova(HOME, 'copertina-arena')
    if p:
        im = Image.open(p)
        insegna, peso = dati_url(im.resize((INSEGNA, round(im.size[1] * INSEGNA / im.size[0])), Image.LANCZOS))
        print(f'  insegna: {peso // 1024} KB (per la home: python3 strumenti/sprite/copertine.py)')
    MODULO.write_text('/* GENERATO da strumenti/sprite/terreni-arena.py: non si tocca a mano.\n'
                      '   I terreni dipinti di Castle Battle (docs/arena/grafica.md): chiave → l\'immagine, e il pezzo di mondo che copre.\n'
                      '   Quello che manca resta disegnato in codice. */\n'
                      'export const DIPINTO = { x: -225, y: 0, w: 810, h: 540 }\n'
                      'export const TERRENI_DIPINTI = {'
                      + ''.join(f"\n  {k}: '{v}'," for k, v in voci.items())
                      + ('\n' if voci else '') + '}\n'
                      f"export const INSEGNA = '{insegna}'\n")
    print(f'{MODULO.relative_to(REPO)}: {MODULO.stat().st_size // 1024} KB')


if __name__ == '__main__':
    main()
