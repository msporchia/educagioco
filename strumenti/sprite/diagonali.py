#!/usr/bin/env python3
"""I pezzi diagonali della cripta, fatti in codice dalle sue tessere dritte.

    python3 strumenti/sprite/diagonali.py            # riscrive il foglio e il foglietto
    python3 strumenti/sprite/diagonali.py --provino  # e un foglio da guardare in tmp/diagonali.png
    python3 strumenti/sprite/atlante.py sotterraneo  # poi si rifà l'atlante

Le stanze smussate e le cappelle hanno muri che girano di 45°, ma le tessere sono
dritte: un muro obliquo usciva come una scaletta di quadrati. Qui i pezzi che
mancano si ricavano dalle tessere che ci sono (`sotterraneo_4.png`, ritagliata
come fa `atlante.py`), così restano della stessa mano. Regola e perché:
docs/sotterraneo/scenari.md, «I muri in diagonale».

Il metodo, in pixel del disegno (una cella è 16×16, un pixel è 4×4 a schermo):
  · la linea corre per gli angoli opposti della cella, a gradini di UN pixel;
  · la roccia (il «tetto») viene dalla tessera della roccia, mascherata col triangolo;
  · il bordo chiaro dal bordo dritto vero (`cripta-bordo-n`), letto in profondità
    dalla linea (la riga chiara e la fascia scura) e fatto correre lungo la diagonale;
  · la faccia dalla faccia dritta (`cripta-faccia-fila`), con la sua altezza,
    spostata di un pixel per colonna: una parete obliqua è una fascia di 16 pixel
    di altezza, larga una cella e alta due (la cella e quella sopra).
Dove nella cella c'è pavimento il pezzo è trasparente: sotto resta il pavimento vero.
"""
import json
import math
import sys
from pathlib import Path

from PIL import Image

import atlante

T = 16                                   # una cella, in pixel del disegno
SORGENTE = 'sotterraneo/generati/sotterraneo_4.png'
FOGLIO = atlante.SORGENTI / 'sotterraneo/generati/sotterraneo_4_diagonali'
REPO = atlante.REPO


def tessere_della_cripta():
    """Le tessere dritte della cripta, come le ritaglia atlante.py."""
    f = atlante.SORGENTI / SORGENTE
    fg = json.loads(f.with_suffix('.json').read_text())
    fg['_file'] = str(f)
    im = atlante.pulisci(atlante.alla_misura_vera(atlante.senza_alone(Image.open(f).convert('RGBA'), fg), fg), fg)
    r, pv, fa, tr, an = {}, {}, {}, {}, {}
    atlante.ritagli_di(im, fg, pv, r, fa, tr, an)
    return r


CORONAMENTO = [0, 1, 1, 2]              # le righe della faccia dritta che fanno il coronamento, la seconda doppia


def profondita(h):
    """Quanto si è entrati nella roccia, in pixel di un bordo dritto, dopo `h` pixel orizzontali
    dalla linea: una diagonale a 45° va in profondità di 1/√2 per colonna."""
    return int((h + 0.5) / math.sqrt(2))


def taglio(t, lato):
    """Una cella di roccia tagliata in diagonale, col suo bordo chiaro: `so` (roccia in basso a
    sinistra) o `se` (in basso a destra); il resto trasparente."""
    roccia, bordo = t['cripta-tetto'].load(), t['cripta-bordo-n'].load()
    larghezza_bordo, altezza_bordo = t['cripta-bordo-n'].size
    pezzo = Image.new('RGBA', (T, T), (0, 0, 0, 0))
    px = pezzo.load()
    for y in range(T):
        for u in range(T):
            x = u if lato == 'so' else T - 1 - u          # `se` è lo specchio di `so`
            h = y - u - 1                                  # pixel dalla linea, dentro la roccia
            if h < 0:
                continue                                   # pavimento
            d = profondita(h)
            # la colonna del bordo dritto segue la direzione della linea: celle vicine si saldano
            c = (u + y) % larghezza_bordo
            px[x, y] = bordo[c, d] if d < altezza_bordo else roccia[x, y]
    return pezzo


def faccia(t, lato, parita):
    """La faccia di una parete che scende in diagonale: larga una cella e alta due (la cella e
    quella sopra). `no` sale verso destra (roccia in alto a sinistra), `ne` scende verso destra.
    Ogni colonna è la colonna della faccia dritta, spostata di un pixel rispetto alla vicina;
    `parita` dice a quale metà della fila di due celle sta la cella (la tela ripete la fila)."""
    fila = t['cripta-faccia-fila'].load()
    larga, alta = t['cripta-faccia-fila'].size
    pezzo = Image.new('RGBA', (T, 2 * T), (0, 0, 0, 0))
    px = pezzo.load()
    # il coronamento (le tre righe chiare) a 45° sembra più sottile della metà della sua altezza: si allunga di
    # una riga, e per restare alti 16 si perde l'ultima di mattoni
    righe = CORONAMENTO + list(range(3, 3 + alta - len(CORONAMENTO)))
    for u in range(T):
        sopra = T - u if lato == 'no' else u               # dove comincia la fascia in questa colonna
        for r, da in enumerate(righe[:alta]):
            px[u, sopra + r] = fila[(parita * T + u) % larga, da]
    return pezzo


PEZZI = {
    'cripta-taglio-so': lambda t: taglio(t, 'so'),
    'cripta-taglio-se': lambda t: taglio(t, 'se'),
    **{f'cripta-faccia-{lato}-{p}': (lambda t, lato=lato, p=p: faccia(t, lato, p))
       for lato in ('no', 'ne') for p in (0, 1)},
}


def costruisci():
    t = tessere_della_cripta()
    return {nome: f(t) for nome, f in PEZZI.items()}


def scrivi(pezzi):
    nomi = sorted(pezzi)
    foglio = Image.new('RGBA', (T * len(nomi), 2 * T), (0, 0, 0, 0))
    sprite = {}
    for i, nome in enumerate(nomi):
        foglio.paste(pezzi[nome], (T * i, 0))
        sprite[nome] = {'da': [T * i, 0], 'cella': list(pezzi[nome].size)}
    foglio.save(FOGLIO.with_suffix('.png'), optimize=True)
    foglietto = {
        '__': 'Il foglietto di sotterraneo_4_diagonali.png: i pezzi per i muri obliqui della cripta, costruiti '
              'in codice da `strumenti/sprite/diagonali.py` dalle tessere dritte di sotterraneo_4.png (il PNG si '
              'rifà col comando, non si tocca). Fondo trasparente: dove nella cella c\'è pavimento il pezzo è vuoto.',
        'fondo': 'trasparente',
        'cella': [1, 1],
        'famiglie': {'cripta-faccia': 'tessera', 'cripta-taglio': 'tessera'},
        'trasforma': {'cripta-faccia': {'giri': 1}, 'cripta-taglio': {'giri': 1}},
        'sprite': sprite,
    }
    FOGLIO.with_suffix('.json').write_text(json.dumps(foglietto, indent=2, ensure_ascii=False) + '\n')
    print(f'{FOGLIO.relative_to(REPO)}.png: {len(nomi)} pezzi, {foglio.width}×{foglio.height}')


def provino(pezzi):
    """I pezzi ingranditi su grigio, fianco a fianco con le tessere da cui vengono."""
    t = tessere_della_cripta()
    S = 10
    voci = [('cripta-faccia-fila', t['cripta-faccia-fila']), ('cripta-bordo-n', t['cripta-bordo-n'])] + sorted(pezzi.items())
    largo = sum(p.width * S + 12 for _, p in voci) + 12
    alto = max(p.height for _, p in voci) * S + 24
    fondo = Image.new('RGBA', (largo, alto), (90, 90, 120, 255))
    x = 12
    for _, p in voci:
        g = p.resize((p.width * S, p.height * S), Image.NEAREST)
        fondo.paste(g, (x, 12), g)
        x += g.width + 12
    dest = REPO / 'tmp/diagonali.png'
    dest.parent.mkdir(exist_ok=True)
    fondo.save(dest)
    print(dest.relative_to(REPO))


if __name__ == '__main__':
    p = costruisci()
    scrivi(p)
    if '--provino' in sys.argv:
        provino(p)
