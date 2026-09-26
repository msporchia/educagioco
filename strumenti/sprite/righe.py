#!/usr/bin/env python3
"""Un foglio di figure **a righe**, letto da sé: le righe e, in ogni riga,
le figure da sinistra a destra.

    python3 strumenti/sprite/righe.py foglio.png [provino.png]

Stampa quante righe ha trovato e quante figure per riga, e col secondo
argomento disegna un provino coi rettangoli sopra: è da lì che si vede
se una fiamma staccata è finita in una figura sua.

Serve ai fogli che il castello chiede **già disposti a righe**
(`DA-GENERARE.md`): le torri (quattro righe da cinque) e i mostri che
camminano (sei righe da otto). Lì il foglietto sarebbe una tabella di
quaranta rettangoli da misurare a mano ogni volta che un foglio si rifà,
e il foglio stesso dice già tutto: **il prompt promette un vuoto di
almeno mezza cella fra una figura e l'altra**, e quel vuoto è il
separatore. Quindi:

  · **le righe** sono le bande piene dell'alfa lette su tutta la
    larghezza, e due bande staccate da meno di `stacco` pixel sono la
    stessa riga — il cristallo che galleggia sopra la torre magica, le
    ali di un pipistrello più in alto del corpo;
  · **le figure** di una riga sono le macchie di pixel attaccati, e due
    macchie staccate da meno di `stacco` in orizzontale sono la stessa
    figura — la fiamma davanti alla bocca del cannone, le scintille.

`stacco` è 24 px, più di un terzo della mezza cella (32) che il prompt
chiede: sotto non si confondono due figure vicine, sopra non si
spezzano le fiamme. Non è un'euristica che indovina una griglia: la
griglia non c'è, e il lettore **conta** — chi lo usa dice quante righe e
quante figure si aspetta, e se i conti non tornano si ferma e lo dice
invece di ritagliare storto.

`alone`: i fogli tornano spesso con un bagliore a bassa alfa attorno a
ogni figura (`FORMATO.md`). Sotto la soglia il pixel sparisce, sopra
resta com'è: il corpo di queste figure è dipinto morbido, e renderlo
pieno ne indurirebbe i bordi.
"""
import sys
from pathlib import Path

from PIL import Image, ImageDraw

sys.path.insert(0, str(Path(__file__).parent))
import misura  # noqa: E402

STACCO = 24
ALONE = 128


def senza_alone(im, soglia=ALONE):
    """Il foglio col bagliore tolto: alfa a zero sotto la soglia."""
    im = im.convert('RGBA')
    a = im.getchannel('A').point(lambda v: v if v >= soglia else 0)
    im.putalpha(a)
    return im


def _unisci_intervalli(iv, stacco):
    fuori = []
    for a, b in sorted(iv):
        if fuori and a <= fuori[-1][1] + stacco:
            fuori[-1][1] = max(fuori[-1][1], b)
        else:
            fuori.append([a, b])
    return fuori


def righe_di_figure(im, stacco=STACCO, soglia=ALONE, minimo=12):
    """[[ [x, y, largo, alto], … ], …]: una lista per riga, dall'alto, e in
    ogni riga le figure da sinistra. Il rettangolo di una figura è il suo,
    stretto; chi vuole i piedi allineati usa `banda()` per l'altezza."""
    pieno, W, H = misura.alfa(im, soglia)
    bande = [[y, y + h] for y, h in misura.bande(pieno, H, W, False)]
    bande = _unisci_intervalli(bande, stacco)
    macchie = misura.figure(pieno, W, H, minimo=minimo)
    righe = []
    for y0, y1 in bande:
        dentro = [m for m in macchie if y0 <= m[1] + m[3] / 2 < y1]
        gruppi = []
        for x, y, w, h in sorted(dentro):
            if gruppi and x <= gruppi[-1][2] + stacco:
                g = gruppi[-1]
                g[1], g[2], g[3] = min(g[1], y), max(g[2], x + w), max(g[3], y + h)
            else:
                gruppi.append([x, y, x + w, y + h])
        righe.append([[x0, ya, x1 - x0, yb - ya] for x0, ya, x1, yb in gruppi])
    return righe


def banda(riga):
    """Dal più alto al più basso delle figure di una riga: ritagliate con
    quest'altezza comune, i piedi restano sulla stessa linea."""
    return min(r[1] for r in riga), max(r[1] + r[3] for r in riga)


def conta(righe, quante_righe, per_riga, nome):
    """Ferma tutto se il foglio non è come il prompt l'ha chiesto."""
    trovate = [len(r) for r in righe]
    if len(righe) != quante_righe or any(n != per_riga for n in trovate):
        raise SystemExit(f'{nome}: attese {quante_righe} righe da {per_riga} figure, '
                         f'trovate {len(righe)} righe da {trovate}. '
                         f'Guarda il provino: python3 strumenti/sprite/righe.py {nome} provino.png')


def provino(im, righe, uscita):
    fondo = Image.new('RGBA', im.size, (70, 74, 80, 255))
    fondo.alpha_composite(im.convert('RGBA'))
    d = ImageDraw.Draw(fondo)
    for i, riga in enumerate(righe):
        for j, (x, y, w, h) in enumerate(riga):
            d.rectangle([x, y, x + w - 1, y + h - 1], outline=(255, 70, 70), width=2)
            d.text((x + 3, y + 2), f'{i}.{j}', fill=(255, 255, 160))
    fondo.convert('RGB').save(uscita)


if __name__ == '__main__':
    if len(sys.argv) < 2:
        sys.exit(__doc__)
    im = senza_alone(Image.open(sys.argv[1]))
    r = righe_di_figure(im)
    print(f'{len(r)} righe: ' + ' · '.join(str(len(x)) for x in r) + ' figure')
    if len(sys.argv) > 2:
        provino(im, r, sys.argv[2])
