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
REPO = Path(__file__).resolve().parents[2]
ATTORI = QUI / 'attori'
CELLA_W, CELLA_H = 16, 32
FOGLIO_W, FOGLIO_H = 272, 256          # la misura di character.png
COLORI = 12


def fondi_di(im, tolleranza=26):
    """I colori del fondo, che sono **più di uno**: certi generatori
    consegnano la scacchiera da «trasparente» disegnata coi pixel veri —
    è un JPEG, di trasparente non ha niente. Si prendono guardando una
    striscia di bordo e tenendo quelli che ne occupano una fetta seria."""
    w, h = im.size
    px = im.convert('RGB').load()
    bordo = Counter()
    for x in range(w):
        for y in (0, 1, h - 2, h - 1):
            bordo[px[x, y]] += 1
    for y in range(h):
        for x in (0, 1, w - 2, w - 1):
            bordo[px[x, y]] += 1
    # I colori si **raggruppano** prima di contarli. Un JPEG sgrana un grigio
    # piatto in centinaia di grigi appena diversi, e contandoli uno per uno
    # nessuno pesa abbastanza per sembrare un fondo: la scacchiera restava
    # addosso all'animale. Presi a mucchi, invece, saltano fuori i due
    # colori veri.
    quanti = sum(bordo.values()) or 1
    mucchi = []
    for c, n in bordo.most_common():
        for m in mucchi:
            if max(abs(c[i] - m['c'][i]) for i in range(3)) <= tolleranza:
                m['n'] += n
                break
        else:
            mucchi.append({'c': c, 'n': n})
    fondi = [m['c'] for m in mucchi if m['n'] / quanti > 0.06]
    return fondi or [mucchi[0]['c']]


def e_fondo(c, fondi, tolleranza=26):
    return any(max(abs(c[i] - f[i]) for i in range(3)) <= tolleranza for f in fondi)


def scala(im):
    """Quanto è ingrandito il foglio. Si misura dal passo fra le bande.

    Le bande si trovano cercando le righe che hanno **qualcosa che non è
    fondo**, non le righe scure: contro una scacchiera grigia il grigio è
    più scuro di mezzo cane bianco, e cercando il buio si trovava una
    banda sola lunga tutto il foglio."""
    w, h = im.size
    px = im.convert('RGB').load()
    fondi = fondi_di(im)
    scuri = [y for y in range(h)
             if sum(1 for x in range(w) if not e_fondo(px[x, y], fondi)) > 3]
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


# ── quale banda è quale ──────────────────────────────────────────────
# Un umano ha tre versi in tre bande di fila. Un quadrupede no: nel suo
# foglio la metà di sopra è l'animale **in piedi**, visto di fronte e di
# spalle, e la metà di sotto è quello **di profilo, su quattro zampe**.
# Prendere la seconda banda come «di lato», che è la regola dell'umano,
# dava un cane che camminava su due zampe appena ti spostavi di lato: non
# era lo specchio sbagliato, era proprio la posa sbagliata.
#
# Si normalizza **all'importazione**: quello che finisce in `attori/` è
# sempre nella forma canonica — giù a y=0, di lato a y=32, su a y=64 — e
# il generatore dell'atlante non ha bisogno di sapere chi cammina su due
# zampe e chi su quattro.
MAPPE = {
    'umano':      {'giu': 0, 'lato': 1, 'su': 2},
    'quadrupede': {'giu': 0, 'lato': 4, 'su': 2},
}
CANONICA = {'giu': 0, 'lato': 1, 'su': 2}


def riordina(im, mappa):
    if mappa == CANONICA:
        return im
    fuori = Image.new('RGBA', im.size, (0, 0, 0, 0))
    for verso, dove in CANONICA.items():
        da = mappa[verso] * CELLA_H
        banda = im.crop((0, da, im.width, min(im.height, da + CELLA_H)))
        fuori.paste(banda, (0, dove * CELLA_H))
    return fuori


def allaga(px, fondi, tolleranza=26):
    """Toglie il fondo partendo dai bordi. Non per colore: un cane bianco ha
    addosso lo stesso bianco della carta, e cancellando «tutto il bianco»
    gli si aprono buchi in mezzo alla schiena. Via va solo quello che si
    raggiunge camminando dal bordo, cioè quello che sta fuori dalla sagoma."""
    visti = bytearray(FOGLIO_W * FOGLIO_H)
    coda = [(x, y) for x in range(FOGLIO_W) for y in (0, FOGLIO_H - 1)]
    coda += [(x, y) for y in range(FOGLIO_H) for x in (0, FOGLIO_W - 1)]
    via = 0
    while coda:
        x, y = coda.pop()
        if x < 0 or y < 0 or x >= FOGLIO_W or y >= FOGLIO_H:
            continue
        i = y * FOGLIO_W + x
        if visti[i]:
            continue
        visti[i] = 1
        c = px[x, y]
        if c[3] and not e_fondo(c, fondi, tolleranza):
            continue
        if c[3]:
            px[x, y] = (0, 0, 0, 0)
            via += 1
        coda += [(x + 1, y), (x - 1, y), (x, y + 1), (x, y - 1)]
    return via


def normalizza(sorgente, nome, guarda=False, mappa=CANONICA):
    im = Image.open(sorgente).convert('RGB')
    w, h = im.size

    if (w, h) != (FOGLIO_W, FOGLIO_H):
        # Prima si guarda la **forma**, non il contenuto: se le proporzioni
        # sono già quelle di un foglio (272:256), l'ingrandimento è quello e
        # non c'è niente da indovinare. Misurare il passo fra le bande è la
        # strada lunga, e contro una scacchiera dipinta sbaglia — i quadretti
        # del fondo, sgranati dal JPEG, sembrano contenuto.
        forma = (w / h) / (FOGLIO_W / FOGLIO_H)
        if abs(forma - 1) > 0.01:
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
        im = im.resize((FOGLIO_W, FOGLIO_H), Image.BOX)
        print(f'  {w}×{h} → {FOGLIO_W}×{FOGLIO_H} (scala {w / FOGLIO_W:.3f})')

    fuori = Image.new('RGBA', (FOGLIO_W, FOGLIO_H), (0, 0, 0, 0))
    fuori.paste(im.convert('RGBA'), (0, 0))
    px = fuori.load()

    # Il fondo si toglie **partendo dai bordi e allagando**, non per colore:
    # un cane bianco ha addosso lo stesso bianco della carta, e cancellando
    # «tutto il bianco» gli si aprono buchi in mezzo alla schiena. Quello che
    # va via è solo il bianco che sta fuori dalla sagoma, cioè quello che si
    # raggiunge camminando dal bordo.
    fondi = fondi_di(im)
    fondo = fondi[0]

    def somiglia(c):
        return e_fondo(c, fondi)

    via = allaga(px, fondi)

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

    # Seconda passata, con la mano un po' più larga. La prima lascia dei
    # filamenti: il JPEG sporca il fondo lungo i bordi degli sprite quel
    # tanto che basta a farlo passare per disegno, e in mappa si vedono come
    # righine bianche in mezzo agli animali. Ripartendo dai bordi non c'è
    # rischio di bucare l'animale — si può togliere solo quello che è
    # attaccato al fuori, e il fuori è già tutto trasparente.
    via += allaga(px, fondi, 40)

    fuori = riordina(fuori, mappa)

    ATTORI.mkdir(exist_ok=True)
    dove = ATTORI / f'{nome}.png'
    fuori.save(dove)
    resta = sum(1 for p in fuori.getdata() if p[3])
    print(f'  {dove.relative_to(REPO)} — fondo {fondo[:3]} tolto '
          f'({via} pixel), restano {resta} pixel su {FOGLIO_W * FOGLIO_H}')

    if guarda:
        prova = REPO / 'poc/scatti' / f'attore-{nome}.png'
        prova.parent.mkdir(exist_ok=True)
        fondo_prova = Image.new('RGBA', fuori.size, (255, 0, 255, 255))
        fondo_prova.alpha_composite(fuori)
        fondo_prova.resize((FOGLIO_W * 4, FOGLIO_H * 4), Image.NEAREST).save(prova)
        print(f'  da guardare: {prova.relative_to(REPO)} '
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
    mappa = MAPPE['quadrupede'] if '--zampe' in sys.argv else MAPPE['umano']
    print(f'{sorgente.name} → {nome}' + (' (quattro zampe)' if '--zampe' in sys.argv else ''))
    if normalizza(sorgente, nome, '--guarda' in sys.argv, mappa) is None:
        return 1
    print('ora: python3 strumenti/sprite/atlante.py')
    return 0


if __name__ == '__main__':
    sys.exit(main())
