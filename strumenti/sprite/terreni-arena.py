#!/usr/bin/env python3
"""I terreni di Castle Battle già pronti, gli scorci della mappa e l'insegna: dalle sorgenti al modulo del gioco.

    python3 strumenti/sprite/terreni-arena.py

Per ogni chiave (bosco, palude, neve, lava: le chiavi storiche, i posti sono quelli di `scena/ambienti.js`) prende il dipinto
`sorgenti/arena/terreno-<chiave>.{png,webp,jpg}`, e se non c'è ancora il disegno `sorgenti/arena/schemi/terreno-<chiave>.png`
(lo fa `npm run disegni:arena`). Un terreno è il pezzo di mondo `PEZZO_DI_MONDO`, largo 3:2, col campo in mezzo, e non si
stira: se l'immagine non è 3:2 lo strumento si ferma. La copertina è `sorgenti/home/copertina-arena.*`, che vale anche per la home:
dopo si lancia `copertine.py`. Scrive `src/giochi/arena/dati/terreni-pronti.js`.
Se accanto al dipinto c'è `terreno-<chiave>.json`, i suoi `riquadri` (x, y, largo, alto) si coprono con pezzetti dei `campioni`:
così si toglie una cosa che il dipinto ha e il gioco no, senza toccare la sorgente.
Perché e come: docs/arena/grafica.md, voci 8 e 10 di DA-GENERARE.md.
"""
import base64
import io
import json
import random
import sys
from pathlib import Path

from PIL import Image, ImageDraw, ImageFilter, ImageStat

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
TASSELLO, PASSO = 64, 30   # i pezzetti che coprono un riquadro: tanti e sovrapposti, se no si vede il disegno che si ripete


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


def media(im, box):
    return ImageStat.Stat(im.crop(box)).mean


def copri(im, foglietto):
    """Copre i riquadri con pezzetti a caso dei campioni, sfumati e portati al colore del terreno attorno."""
    dati = json.loads(foglietto.read_text())
    caso = random.Random(foglietto.stem)
    maschera = Image.new('L', (TASSELLO, TASSELLO), 0)
    ImageDraw.Draw(maschera).ellipse((8, 8, TASSELLO - 8, TASSELLO - 8), fill=255)
    maschera = maschera.filter(ImageFilter.GaussianBlur(6))
    sorgente = im.copy()
    for x, y, w, h in dati['riquadri']:
        giri = [media(sorgente, b) for b in ((x, y - 14, x + w, y - 4), (x, y + h + 4, x + w, y + h + 14))]
        terra = [sum(c) / len(giri) for c in zip(*giri)]
        posti = [(a, b) for a in range(x - 20, x + w - 20, PASSO) for b in range(y - 20, y + h - 20, PASSO)]
        caso.shuffle(posti)
        for a, b in posti:
            cx, cy, cw, ch = caso.choice(dati['campioni'])
            sx, sy = caso.randint(cx, cx + cw - TASSELLO), caso.randint(cy, cy + ch - TASSELLO)
            pezzo = sorgente.crop((sx, sy, sx + TASSELLO, sy + TASSELLO))
            if caso.random() < 0.5:
                pezzo = pezzo.transpose(Image.FLIP_LEFT_RIGHT)
            scarto = [t - m for t, m in zip(terra, ImageStat.Stat(pezzo).mean)]
            pezzo = Image.merge('RGB', [c.point(lambda v, d=d: max(0, min(255, round(v + d)))) for c, d in zip(pezzo.split(), scarto)])
            im.paste(pezzo, (a, b), maschera)
    return im


def main():
    voci, panorami = {}, {}
    for chiave in CHIAVI:
        p = trova(SORGENTI, f'terreno-{chiave}') or trova(SORGENTI / 'schemi', f'terreno-{chiave}')
        if not p:
            sys.exit(f'manca il terreno {chiave}: npm run disegni:arena')
        im = Image.open(p).convert('RGB')
        w, h = im.size
        if abs(w / h - 1.5) > 0.02:
            sys.exit(f'{p.name} è {w}×{h}: un terreno è 3:2 orizzontale e non si stira (voce 8 di DA-GENERARE.md)')
        foglietto = p.with_suffix('.json')
        if foglietto.exists():
            im = copri(im, foglietto)
        voci[chiave], peso = dati_url(im.resize((LARGO, LARGO * 2 // 3), Image.LANCZOS))
        panorami[chiave], _ = dati_url(scorcio(im))
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
                      f"export const INSEGNA = '{insegna}'\n")
    print(f'{MODULO.relative_to(REPO)}: {MODULO.stat().st_size // 1024} KB')


if __name__ == '__main__':
    main()
