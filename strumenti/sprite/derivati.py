#!/usr/bin/env python3
"""I pezzi derivati: pezzi geometrici ricavati in codice da tessere già dipinte, invece di generarne di nuovi.

Libreria, non comando: chi la usa è una configurazione per scena (oggi `diagonali.py`, i muri obliqui del
sotterraneo). Quando conviene, come si usa, i limiti: docs/core/sprite.md, «I pezzi derivati in codice».

Le funzioni, in ordine di uso:
  tessere_di(sorgente)       le tessere di un foglio, ritagliate come fa atlante.py (stesso fondo, stessa scala)
  triangolo / quarto_di_cerchio   una maschera 'L' (255 = dentro) per tagliare una tessera con una forma
  mascherata(tessera, maschera)   la tessera dove la maschera copre, trasparente altrove
  profondita(h)              quanto si è entrati in un bordo dopo `h` pixel di una diagonale a 45°
  bordo_su_diagonale(...)    la roccia tagliata da una diagonale, col suo bordo che corre lungo la linea
  faccia_su_diagonale(...)   una fascia di muro spostata di un pixel per colonna: la faccia di una parete obliqua
  scrivi_foglio(...)         il foglio PNG e il suo foglietto, nel formato di atlante.py
  provino(...)               i pezzi ingranditi accanto alle tessere da cui vengono, da guardare
Il PNG che esce non si tocca a mano: si rifà col comando della configurazione, poi `atlante.py <gioco>`.
"""
import json
import math
from pathlib import Path

from PIL import Image

import atlante

REPO = atlante.REPO
SORGENTI = atlante.SORGENTI


def tessere_di(sorgente):
    """Le tessere di un foglio sorgente (`sotterraneo/generati/sotterraneo_4.png`), come le ritaglia atlante.py."""
    f = SORGENTI / sorgente
    fg = json.loads(f.with_suffix('.json').read_text())
    fg['_file'] = str(f)
    im = atlante.pulisci(atlante.alla_misura_vera(atlante.senza_alone(Image.open(f).convert('RGBA'), fg), fg), fg)
    r, pv, fa, tr, an = {}, {}, {}, {}, {}
    atlante.ritagli_di(im, fg, pv, r, fa, tr, an)
    return r


def triangolo(dim, angolo):
    """Maschera quadrata col triangolo che ha l'angolo retto in `angolo` ('no', 'ne', 'so', 'se'); la diagonale passa per gli
    angoli opposti della cella, a gradini di un pixel."""
    m = Image.new('L', (dim, dim), 0)
    px = m.load()
    for y in range(dim):
        for x in range(dim):
            u = x if angolo[1] == 'o' else dim - 1 - x          # distanza dal lato verticale del triangolo
            v = y if angolo[0] == 'n' else dim - 1 - y          # e dal lato orizzontale
            if u + v < dim - 1:
                px[x, y] = 255
    return m


def quarto_di_cerchio(dim, angolo, raggio=None):
    """Maschera quadrata col quarto di cerchio centrato nell'angolo ('no', 'ne', 'so', 'se'), di `raggio` pixel (di difetto la cella)."""
    r = dim if raggio is None else raggio
    m = Image.new('L', (dim, dim), 0)
    px = m.load()
    for y in range(dim):
        for x in range(dim):
            u = x if angolo[1] == 'o' else dim - 1 - x
            v = y if angolo[0] == 'n' else dim - 1 - y
            if (u + 0.5) ** 2 + (v + 0.5) ** 2 <= r * r:
                px[x, y] = 255
    return m


def mascherata(tessera, maschera):
    """La tessera dove la maschera copre, trasparente altrove (la maschera può essere più piccola: si tiene il suo angolo in alto a sinistra)."""
    pezzo = Image.new('RGBA', maschera.size, (0, 0, 0, 0))
    pezzo.paste(tessera.crop((0, 0) + maschera.size), (0, 0), maschera)
    return pezzo


def profondita(h):
    """Quanto si è entrati nella roccia, in pixel di un bordo dritto, dopo `h` pixel orizzontali dalla linea: una diagonale a 45° va
    in profondità di 1/√2 per colonna."""
    return int((h + 0.5) / math.sqrt(2))


def bordo_su_diagonale(roccia, bordo, lato, T=16):
    """Una cella di roccia tagliata da una diagonale col suo bordo: `so` (roccia in basso a sinistra) o `se` (in basso a destra); il resto
    trasparente. `roccia` è la tessera del tetto, `bordo` il bordo dritto (una striscia alta quanto è profondo, larga una cella): le sue
    righe si leggono in profondità dalla linea, e la colonna segue la direzione della linea, così le celle vicine si saldano. Gli altri
    due versi (`no`, `ne`) non sono bordi ma facce: si fanno con faccia_su_diagonale."""
    r, b = roccia.load(), bordo.load()
    larghezza_bordo, altezza_bordo = bordo.size
    dentro = triangolo(T, 'so').load()
    pezzo = Image.new('RGBA', (T, T), (0, 0, 0, 0))
    px = pezzo.load()
    for y in range(T):
        for u in range(T):
            x = u if lato == 'so' else T - 1 - u          # `se` è lo specchio di `so`
            if not dentro[u, y]:
                continue                                   # dall'altra parte della linea c'è il pavimento
            d = profondita(y - u - 1)                      # pixel dalla linea, dentro la roccia
            c = (u + y) % larghezza_bordo
            px[x, y] = b[c, d] if d < altezza_bordo else r[x, y]
    return pezzo


def faccia_su_diagonale(fila, lato, parita, righe, T=16):
    """La faccia di una parete che scende in diagonale: larga una cella e alta due (la cella e quella sopra). `no` sale verso destra
    (roccia in alto a sinistra), `ne` scende verso destra. Ogni colonna è la colonna della faccia dritta (`fila`), spostata di un
    pixel rispetto alla vicina; `righe` dice quali righe della faccia dritta si prendono, dall'alto, e al più T (la fascia è di T pixel
    d'altezza); `parita` dice a quale metà della fila di due celle sta la cella (la tela ripete la fila)."""
    px_fila = fila.load()
    larga, _ = fila.size
    pezzo = Image.new('RGBA', (T, 2 * T), (0, 0, 0, 0))
    px = pezzo.load()
    for u in range(T):
        sopra = T - u if lato == 'no' else u               # dove comincia la fascia in questa colonna
        for r, da in enumerate(righe[:T]):
            px[u, sopra + r] = px_fila[(parita * T + u) % larga, da]
    return pezzo


def scrivi_foglio(pezzi, percorso, nota, famiglie, T=16):
    """Scrive il foglio (`percorso`.png) e il suo foglietto (`percorso`.json): una riga di pezzi alti due celle, in ordine di nome. `famiglie`
    sono i prefissi dei nomi (`cripta-faccia`, `cripta-taglio`), tutti «tessera» e con un giro solo; `nota` è il perché del file."""
    nomi = sorted(pezzi)
    foglio = Image.new('RGBA', (T * len(nomi), 2 * T), (0, 0, 0, 0))
    sprite = {}
    for i, nome in enumerate(nomi):
        foglio.paste(pezzi[nome], (T * i, 0))
        sprite[nome] = {'da': [T * i, 0], 'cella': list(pezzi[nome].size)}
    foglio.save(percorso.with_suffix('.png'), optimize=True)
    foglietto = {
        '__': nota,
        'fondo': 'trasparente',
        'cella': [1, 1],
        'famiglie': {f: 'tessera' for f in famiglie},
        'trasforma': {f: {'giri': 1} for f in famiglie},
        'sprite': sprite,
    }
    percorso.with_suffix('.json').write_text(json.dumps(foglietto, indent=2, ensure_ascii=False) + '\n')
    print(f'{percorso.relative_to(REPO)}.png: {len(nomi)} pezzi, {foglio.width}×{foglio.height}')


def provino(pezzi, tessere_mostrate, dest, S=10):
    """I pezzi ingranditi su grigio, fianco a fianco con le tessere da cui vengono (`tessere_mostrate`: lista di (nome, immagine))."""
    voci = list(tessere_mostrate) + sorted(pezzi.items())
    largo = sum(p.width * S + 12 for _, p in voci) + 12
    alto = max(p.height for _, p in voci) * S + 24
    fondo = Image.new('RGBA', (largo, alto), (90, 90, 120, 255))
    x = 12
    for _, p in voci:
        g = p.resize((p.width * S, p.height * S), Image.NEAREST)
        fondo.paste(g, (x, 12), g)
        x += g.width + 12
    dest = Path(dest)
    dest.parent.mkdir(exist_ok=True)
    fondo.save(dest)
    print(dest.relative_to(REPO))
