#!/usr/bin/env python3
"""Porta un foglio di personaggio generato dentro `poc/attori/`.

    python3 poc/attori.py ~/Scaricati/Senza\\ titolo.jpeg bobtail
    python3 poc/attori.py ~/Scaricati/gatto.png gatto --guarda

Un «attore» è chiunque cammini: la bambina, il cane, una gallina. Il formato
è quello di `character.png` del set di ArMM1998, e non è una scelta nostra —
è quello che i generatori di immagini restituiscono se glielo si fa vedere,
il che lo rende lo standard di fatto:

    una tessera 16 largo × 32 alto, quattro fotogrammi per riga,
    bande a passo 32: y=0 verso il basso, y=32 di lato, y=64 verso l'alto.
    Le pose di lato guardano a DESTRA; la sinistra è la stessa specchiata.

Quello che arriva da un generatore non è mai già in quella misura: è un
ingrandimento, spesso JPEG, su fondo bianco. Questo script fa le tre cose
che servono e nient'altro:

  1. **rimpicciolisce alla misura vera.** Non a occhio: misura il passo fra
     le bande scure, ne ricava la scala, e verifica che torni. Se non torna
     lo dice invece di consegnare un foglio storto.
  2. **toglie il fondo**, che è bianco e non trasparente.
  3. **riduce i colori**, perché il ricampionamento di un JPEG ne lascia
     migliaia e la pixel art ne vuole una decina: senza questo passaggio i
     bordi restano sporchi e in gioco si vede.

Il risultato va in `poc/attori/<nome>.png` ed è versionato — è roba nostra,
non un pacchetto scaricato. Poi si rilancia `atlante-gfx.py`, che raccoglie
da sé tutto quello che trova lì dentro.
"""
import sys
from collections import Counter
from pathlib import Path

from PIL import Image

QUI = Path(__file__).parent
ATTORI = QUI / 'attori'
CELLA_W, CELLA_H = 16, 32
FOGLIO_W, FOGLIO_H = 272, 256          # la misura di character.png
COLORI = 12


def scala(im):
    """Quanto è ingrandito il foglio. Si misura dal passo fra le bande."""
    w, h = im.size
    px = im.convert('RGB').load()
    scuri = [y for y in range(h)
             if sum(1 for x in range(w) if sum(px[x, y]) < 690) > 3]
    if not scuri:
        return None
    bande, inizio, prec = [], scuri[0], scuri[0]
    for y in scuri[1:]:
        if y != prec + 1:
            bande.append(inizio)
            inizio = y
        prec = y
    bande.append(inizio)
    if len(bande) < 2:
        return None
    passi = [bande[i + 1] - bande[i] for i in range(len(bande) - 1)]
    passi.sort()
    return passi[len(passi) // 2] / CELLA_H   # la mediana, non la media


def normalizza(sorgente, nome, guarda=False):
    im = Image.open(sorgente).convert('RGB')
    w, h = im.size

    if (w, h) != (FOGLIO_W, FOGLIO_H):
        z = scala(im)
        if z is None:
            print(f'  ! in {sorgente.name} non trovo le bande: è un foglio di attore?')
            return None
        atteso_w, atteso_h = round(w / z), round(h / z)
        if abs(atteso_w - FOGLIO_W) > 8 or abs(atteso_h - FOGLIO_H) > 24:
            print(f'  ! {sorgente.name} misurato viene {atteso_w}x{atteso_h}, '
                  f'non {FOGLIO_W}x{FOGLIO_H}: controllalo a mano')
            return None
        # BOX fa la media di ogni blocco: è il contrario dell'ingrandimento
        # che ha subito, ed è l'unico filtro che non inventa pixel nuovi
        im = im.resize((FOGLIO_W, min(FOGLIO_H, atteso_h)), Image.BOX)
        print(f'  scala {z:.3f} → {im.width}x{im.height}')

    fuori = Image.new('RGBA', (FOGLIO_W, FOGLIO_H), (0, 0, 0, 0))
    fuori.paste(im.convert('RGBA'), (0, 0))
    px = fuori.load()

    # Il fondo si toglie **partendo dai bordi e allagando**, non per colore:
    # un cane bianco ha addosso lo stesso bianco della carta, e cancellando
    # «tutto il bianco» gli si aprono buchi in mezzo alla schiena. Quello che
    # va via è solo il bianco che sta fuori dalla sagoma, cioè quello che si
    # raggiunge camminando dal bordo.
    angoli = Counter(px[x, y][:3] for x in (0, 1, FOGLIO_W - 2, FOGLIO_W - 1)
                     for y in (0, 1, im.height - 2, im.height - 1))
    fondo = angoli.most_common(1)[0][0]

    def somiglia(c):
        return max(abs(c[i] - fondo[i]) for i in range(3)) <= 26

    visti = bytearray(FOGLIO_W * FOGLIO_H)
    coda = []
    for x in range(FOGLIO_W):
        for y in (0, im.height - 1):
            coda.append((x, y))
    for y in range(im.height):
        for x in (0, FOGLIO_W - 1):
            coda.append((x, y))
    via = 0
    while coda:
        x, y = coda.pop()
        if x < 0 or y < 0 or x >= FOGLIO_W or y >= im.height:
            continue
        i = y * FOGLIO_W + x
        if visti[i]:
            continue
        visti[i] = 1
        if not somiglia(px[x, y]):
            continue
        px[x, y] = (0, 0, 0, 0)
        via += 1
        coda += [(x + 1, y), (x - 1, y), (x, y + 1), (x, y - 1)]

    # solo adesso si riducono i colori, e solo su quello che è rimasto:
    # il ricampionamento di un JPEG ne lascia migliaia, la pixel art ne
    # vuole una decina, e senza questo passaggio i bordi restano sporchi
    opachi = Image.new('RGB', fuori.size, fondo)
    opachi.paste(fuori.convert('RGB'), (0, 0), fuori)
    tavolozza = opachi.quantize(colors=COLORI, method=Image.MAXCOVERAGE).convert('RGB')
    tpx = tavolozza.load()
    for y in range(FOGLIO_H):
        for x in range(FOGLIO_W):
            if px[x, y][3]:
                px[x, y] = tpx[x, y] + (255,)

    ATTORI.mkdir(exist_ok=True)
    dove = ATTORI / f'{nome}.png'
    fuori.save(dove)
    resta = sum(1 for p in fuori.getdata() if p[3])
    print(f'  {dove.relative_to(QUI.parent)} — fondo {fondo[:3]} tolto '
          f'({via} pixel), restano {resta} pixel su {FOGLIO_W * FOGLIO_H}')

    if guarda:
        prova = QUI / 'scatti' / f'attore-{nome}.png'
        prova.parent.mkdir(exist_ok=True)
        fondo_prova = Image.new('RGBA', fuori.size, (255, 0, 255, 255))
        fondo_prova.alpha_composite(fuori)
        fondo_prova.resize((FOGLIO_W * 4, FOGLIO_H * 4), Image.NEAREST).save(prova)
        print(f'  da guardare: {prova.relative_to(QUI.parent)} '
              f'(il fucsia è il trasparente)')
    return dove


def main():
    voci = [a for a in sys.argv[1:] if not a.startswith('--')]
    if len(voci) < 2:
        print(__doc__)
        return 1
    sorgente = Path(voci[0]).expanduser()
    if not sorgente.exists():
        print(f'{sorgente} non c\'è')
        return 1
    nome = voci[1].strip().lower()
    print(f'{sorgente.name} → {nome}')
    if normalizza(sorgente, nome, '--guarda' in sys.argv) is None:
        return 1
    print('ora: python3 poc/atlante-gfx.py <cartella gfx>')
    return 0


if __name__ == '__main__':
    sys.exit(main())
