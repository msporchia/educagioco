#!/usr/bin/env python3
"""I passi di una creatura, presi da un video di Grok Imagine.

    python3 strumenti/sprite/cammino.py video.mp4 <creatura> --cerca
    python3 strumenti/sprite/cammino.py video.mp4 <creatura> --lato 34:17 --fronte 120:22

Chiesti come immagine, i fogli di passi non vengono (due prove, 28
settembre 2026: otto figure per riga anche chiedendone quattro, pose
uguali, armi che cambiano a metà). Chiesta come **video**, la camminata
viene: una creatura su fondo bianco, animata «sul posto», prima di lato e
poi di fronte — il prompt sta in `DA-GENERARE.md`, voce 5.

Il video non si conserva: si tengono **solo i passi**, in
`sorgenti/castello/cammino/<creatura>.png` — due righe (di lato, di
fronte) di sei fotogrammi ciascuna, col bianco tolto e al massimo `ALTO`
pixel d'altezza (il doppio di quanto serve in campo: il video è molto più
grande, e sei fotogrammi alla sua misura pesano più di un mega) — e accanto il `.json` che dice da quale video e da quali
fotogrammi vengono. È `vesti.py --atlante` che poi li porta alla misura
della creatura e ci rimette il contorno.

`--cerca` stampa i giri che si chiudono meglio su sé stessi (inizio e
periodo in fotogrammi, e quanto differisce l'ultimo dal primo): il giro
di lato sta nella prima parte del video, quello di fronte dopo che la
creatura si è girata. Si guarda anche il provino (`--provino file.png`),
perché il conto non sa dove la creatura si sta girando.

I fotogrammi si leggono con `gst-launch-1.0` (ffmpeg qui non c'è).
"""
import argparse
import json
import subprocess
import sys
import tempfile
from collections import deque
from pathlib import Path

from PIL import Image, ImageChops, ImageDraw

CAMMINO = Path(__file__).parent / 'sorgenti' / 'castello' / 'cammino'
PASSI = 6
BIANCO = 215     # sopra questo (su tutti e tre i canali) un pixel è fondo
CHIUSO = 30      # un'isola di bianco chiusa dentro la figura, da quanti pixel in su è fondo
ALTO = 160       # l'altezza massima di una riga conservata: il doppio di quanto serve in campo


def fotogrammi(video, cartella):
    subprocess.run(['gst-launch-1.0', '-q', 'filesrc', f'location={video}', '!', 'decodebin', '!',
                    'videoconvert', '!', 'pngenc', '!', 'multifilesink',
                    f'location={cartella}/f%03d.png'], check=True)
    return sorted(Path(cartella).glob('f*.png'))


def differenza(a, b):
    a = a.convert('L').resize((184, 100))
    b = b.convert('L').resize((184, 100))
    h = ImageChops.difference(a, b).histogram()
    return sum(k * v for k, v in enumerate(h)) / (184 * 100)


def scontorna(im):
    """Il bianco del fondo tolto: quello che si raggiunge dal bordo, e le
    isole di bianco chiuse fra un'ala e il corpo, se sono grandi — i denti
    e i riflessi sono piccoli e restano."""
    im = im.convert('RGBA')
    W, H = im.size
    p = im.load()
    chiaro = lambda c: min(c[:3]) >= BIANCO
    visto = bytearray(W * H)

    def allaga(semi):
        q, preso = deque(semi), []
        while q:
            x, y = q.popleft()
            if not (0 <= x < W and 0 <= y < H) or visto[y * W + x] or not chiaro(p[x, y]):
                continue
            visto[y * W + x] = 1
            preso.append((x, y))
            q.extend(((x + 1, y), (x - 1, y), (x, y + 1), (x, y - 1)))
        return preso

    bordo = [(x, 0) for x in range(W)] + [(x, H - 1) for x in range(W)] + \
            [(0, y) for y in range(H)] + [(W - 1, y) for y in range(H)]
    for xy in allaga(bordo):
        p[xy] = (0, 0, 0, 0)
    for y in range(H):
        for x in range(W):
            if not visto[y * W + x] and chiaro(p[x, y]):
                isola = allaga([(x, y)])
                if len(isola) >= CHIUSO:
                    for xy in isola:
                        p[xy] = (0, 0, 0, 0)
    return im


def giro(quadri, inizio, periodo):
    scelti = [inizio + round(k * periodo / PASSI) for k in range(PASSI)]
    ims = [scontorna(Image.open(quadri[i])) for i in scelti]
    # un riquadro comune: i piedi restano sulla stessa linea
    bb = [im.getbbox() for im in ims]
    box = (min(b[0] for b in bb), min(b[1] for b in bb), max(b[2] for b in bb), max(b[3] for b in bb))
    ims = [im.crop(box) for im in ims]
    k = min(1, ALTO / ims[0].height)
    # ridotti premoltiplicati: il bianco tolto non sbiadisce gli orli
    ims = [im.convert('RGBa').resize((round(im.width * k), round(im.height * k)), Image.BOX).convert('RGBA')
           for im in ims]
    return ims, scelti


def cerca(quadri):
    n = len(quadri)
    ims = [Image.open(q) for q in quadri]
    for nome, (da, a) in (('prima metà', (4, n // 2 + 10)), ('seconda metà', (n // 2, n))):
        prove = sorted((round(differenza(ims[s], ims[s + p]), 2), s, p)
                       for s in range(da, a) for p in range(8, 34) if s + p < a)
        print(f'{nome}: ' + '  '.join(f'{s}:{p} ({d})' for d, s, p in prove[:5]))


def provino(quadri, uscita):
    n = len(quadri)
    fr = list(range(0, n, max(1, n // 25)))
    W, H = 368, 200
    sh = Image.new('RGB', (W * 5, H * ((len(fr) + 4) // 5)), 'white')
    d = ImageDraw.Draw(sh)
    for i, f in enumerate(fr):
        sh.paste(Image.open(quadri[f]).convert('RGB').resize((W, H)), ((i % 5) * W, (i // 5) * H))
        d.text(((i % 5) * W + 4, (i // 5) * H + 4), str(f), fill='red')
    sh.save(uscita)


def main():
    ap = argparse.ArgumentParser(description=__doc__.split('\n')[0])
    ap.add_argument('video')
    ap.add_argument('creatura')
    ap.add_argument('--cerca', action='store_true')
    ap.add_argument('--provino')
    ap.add_argument('--lato', help='inizio:periodo in fotogrammi')
    ap.add_argument('--fronte', help='inizio:periodo in fotogrammi')
    a = ap.parse_args()
    with tempfile.TemporaryDirectory() as tmp:
        quadri = fotogrammi(a.video, tmp)
        print(f'{len(quadri)} fotogrammi')
        if a.provino:
            provino(quadri, a.provino)
        if a.cerca:
            cerca(quadri)
        if not (a.lato or a.fronte):
            return
        righe, fonte = [], {'video': Path(a.video).name, 'passi': PASSI}
        for verso in ('lato', 'fronte'):
            v = getattr(a, verso)
            if not v:
                continue
            inizio, periodo = map(int, v.split(':'))
            ims, scelti = giro(quadri, inizio, periodo)
            righe.append((verso, ims))
            fonte[verso] = {'inizio': inizio, 'periodo': periodo, 'fotogrammi': scelti}
    cw = max(im.width for _, ims in righe for im in ims)
    ch = max(im.height for _, ims in righe for im in ims)
    foglio = Image.new('RGBA', (cw * PASSI, ch * len(righe)))
    for r, (_, ims) in enumerate(righe):
        for i, im in enumerate(ims):
            # in basso e al centro della sua cella: il piede sta sul fondo
            foglio.paste(im, (i * cw + (cw - im.width) // 2, r * ch + ch - im.height))
    CAMMINO.mkdir(parents=True, exist_ok=True)
    png = CAMMINO / f'{a.creatura}.png'
    foglio.save(png, optimize=True)
    fonte['righe'] = [v for v, _ in righe]
    fonte['cella'] = [cw, ch]
    png.with_suffix('.json').write_text(json.dumps(fonte, ensure_ascii=False, indent=1) + '\n')
    print(f'{png}: {len(righe)} righe da {PASSI}, celle {cw}×{ch}')


if __name__ == '__main__':
    sys.exit(main())
