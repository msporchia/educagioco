#!/usr/bin/env python3
"""I terreni di Castle Battle già pronti, gli scorci della mappa e l'insegna: dalle sorgenti al modulo del gioco.

    python3 strumenti/sprite/terreni-arena.py

Per ogni chiave (bosco, palude, neve, lava: le chiavi storiche, i posti sono quelli di `scena/ambienti.js`) prende il dipinto
`sorgenti/arena/terreno-<chiave>.{png,webp,jpg}`, e se non c'è ancora il disegno `sorgenti/arena/schemi/terreno-<chiave>.png`
(lo fa `npm run disegni:arena`). Un terreno è il pezzo di mondo `PEZZO_DI_MONDO`, largo 3:2, col campo in mezzo, e non si
stira: se l'immagine non è 3:2 lo strumento si ferma. La copertina è `sorgenti/home/copertina-arena.*`, che vale anche per la home:
dopo si lancia `copertine.py`. Scrive `src/giochi/arena/dati/terreni-pronti.js`.
I dipinti valgono quando ci sono tutti e quattro: uno solo in mezzo ai disegni stona (`--prova` li prende lo stesso, per guardarne uno in partita: poi si rilancia senza). Un terreno dipinto ha il suo ponte (`PONTE_DIPINTO`), e il gioco non ci mette il suo.
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
MODULO = REPO / 'src' / 'giochi' / 'arena' / 'dati' / 'terreni-pronti.js'
CHIAVI = ['bosco', 'palude', 'neve', 'lava']
LARGO = 1536            # quanto resta largo un terreno: è quello che ChatGPT dà
INSEGNA = 1024
PANORAMA = (640, (20, 176, 340, 268))   # quanto è largo lo scorcio della mappa, e il suo pezzo di mondo: il fiume e le rive
MONDO = (-225, 0, 810, 540)
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


def scorcio(im):
    largo, (x0, y0, x1, y1) = PANORAMA
    w, h = im.size
    k = w / MONDO[2]
    pezzo = im.crop((round((x0 - MONDO[0]) * k), round((y0 - MONDO[1]) * k), round((x1 - MONDO[0]) * k), round((y1 - MONDO[1]) * k)))
    return pezzo.resize((largo, round(largo * (y1 - y0) / (x1 - x0))), Image.LANCZOS)


def main():
    voci, panorami, dipinti = {}, {}, []
    tutti = '--prova' in sys.argv or all(trova(SORGENTI, f'terreno-{chiave}') for chiave in CHIAVI)
    for chiave in CHIAVI:
        p = (tutti and trova(SORGENTI, f'terreno-{chiave}')) or trova(SORGENTI / 'schemi', f'terreno-{chiave}')
        if not p:
            sys.exit(f'manca il terreno {chiave}: npm run disegni:arena')
        im = Image.open(p).convert('RGB')
        w, h = im.size
        if abs(w / h - 1.5) > 0.02:
            sys.exit(f'{p.name} è {w}×{h}: un terreno è 3:2 orizzontale e non si stira (voce 8 di DA-GENERARE.md)')
        voci[chiave], peso = dati_url(im.resize((LARGO, LARGO * 2 // 3), Image.LANCZOS))
        panorami[chiave], _ = dati_url(scorcio(im))
        if p.parent == SORGENTI:
            dipinti.append(chiave)
        print(f"  {chiave}: {p.parent.name}/{p.name}, {peso // 1024} KB")
    insegna, p = '', trova(HOME, 'copertina-arena')
    if p:
        im = Image.open(p)
        insegna, peso = dati_url(im.resize((INSEGNA, round(im.size[1] * INSEGNA / im.size[0])), Image.LANCZOS))
        print(f'  insegna: {peso // 1024} KB (per la home: python3 strumenti/sprite/copertine.py)')
    MODULO.write_text('/* GENERATO da strumenti/sprite/terreni-arena.py: non si tocca a mano.\n'
                      '   I terreni di Castle Battle già pronti (docs/arena/grafica.md): chiave → l\'immagine (dipinta, o disegnata a monte), il pezzo di\n'
                      '   mondo che copre, gli scorci della mappa e l\'insegna. */\n'
                      'export const PEZZO_DI_MONDO = { x: -225, y: 0, w: 810, h: 540 }\n'
                      'export const TERRENI_PRONTI = {'
                      + ''.join(f"\n  {k}: '{v}'," for k, v in voci.items())
                      + '\n}\nexport const PANORAMI = {'
                      + ''.join(f"\n  {k}: '{v}'," for k, v in panorami.items())
                      + '\n}\n'
                      f"export const INSEGNA = '{insegna}'\n"
                      f"export const PONTE_DIPINTO = {dipinti!r}\n")
    print(f'{MODULO.relative_to(REPO)}: {MODULO.stat().st_size // 1024} KB')


if __name__ == '__main__':
    main()
