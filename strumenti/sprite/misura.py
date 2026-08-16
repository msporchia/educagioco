#!/usr/bin/env python3
"""Misura un foglio di sprite, per poterne scrivere il foglietto.

    python3 strumenti/sprite/misura.py sorgenti/td/PVX1O.png
    python3 strumenti/sprite/misura.py sorgenti/td/PVX1O.png --regione=0,430,1408,768
    python3 strumenti/sprite/misura.py sorgenti/td/PVX1O.png --regione=0,0,1408,378 --celle
    python3 strumenti/sprite/misura.py sorgenti/td/d8Rn3.png --griglia=13,15,71.31,80,69,76
    python3 strumenti/sprite/misura.py sorgenti/td/d8Rn3.png --figure

── PERCHÉ NON È UN'EURISTICA ────────────────────────────────────────
`torri.py` indovinava la geometria a ogni giro, e sbagliava in silenzio.
Questo attrezzo indovina anche lui — ma **una volta sola, sotto gli
occhi di qualcuno**, e quello che stampa si incolla nel foglietto e
diventa un dato scritto. La differenza non è la matematica: è chi ha
l'ultima parola. Qui ce l'ha chi guarda i provini.

Serve perché contare a mano centoventicinque rettangoli su tre fogli è
il modo sicuro di sbagliarne qualcuno, e di scoprirlo a schermo.

Stampa due cose, e la seconda solo se la chiedi:

  · **le bande** — dove il foglio è pieno e dove è vuoto, riga per riga
    e colonna per colonna. Da lì si leggono origine, passo e cella di
    una griglia regolare, che è quello che il foglietto vuole sapere.
  · **le figure** (`--figure`) — il rettangolo di ogni macchia di pixel
    attaccati. Serve quando la griglia non c'è: figure disposte a mano,
    misure tutte diverse.

E due modi di raccogliere quelle macchie in celle, perché una figura
sola quasi mai è una macchia sola — la fiamma sopra il cannone non
tocca il cannone, e a contare le macchie escono due torri dove ce n'è
una:

  · **`--celle`** — le colonne le danno i **separatori** disegnati sul
    foglio (righe sottili e alte quanto tutta la tabella), le righe le
    danno le bande piene. Dentro ogni cella le macchie si uniscono in
    un rettangolo solo. È il caso dei fogli a tabella, dove le colonne
    non hanno tutte la stessa larghezza e una griglia a passo fisso
    mentirebbe.
  · **`--griglia=x0,y0,passoX,passoY,largh,alt`** — quando la griglia
    c'è per davvero. Dice quali celle hanno qualcosa dentro e qual è il
    rettangolo vero di quel qualcosa, che è sempre più stretto della
    cella.
"""
import json
import sys
from pathlib import Path

from PIL import Image

QUI = Path(__file__).parent


def alfa(im, soglia=8):
    """La maschera del pieno: dove il foglio ha qualcosa."""
    a = im.convert('RGBA').getchannel('A')
    return a.point(lambda v: 255 if v > soglia else 0).load(), im.width, im.height


def bande(pieno, quante, altre, orizzontale):
    """Gli intervalli pieni lungo un asse: (inizio, quanto)."""
    out, s = [], None
    for i in range(quante):
        c = any(pieno[i, j] if orizzontale else pieno[j, i] for j in range(altre))
        if c and s is None:
            s = i
        elif not c and s is not None:
            out.append((s, i - s))
            s = None
    if s is not None:
        out.append((s, quante - s))
    return out


def passo_di(inizi):
    """Il passo medio fra gli inizi, e quanto ballano. Un passo che balla
    di più di un pixel non è una griglia: è roba messa a mano."""
    if len(inizi) < 2:
        return None, 0
    salti = [b - a for a, b in zip(inizi, inizi[1:])]
    medio = sum(salti) / len(salti)
    return medio, max(abs(s - medio) for s in salti)


def figure(pieno, W, H, minimo=200):
    """Le macchie di pixel attaccati, col loro rettangolo. Scansione a
    riempimento su una pila: niente ricorsione, i fogli sono grandi."""
    visto = bytearray(W * H)
    fuori = []
    for y0 in range(H):
        for x0 in range(W):
            if visto[y0 * W + x0] or not pieno[x0, y0]:
                continue
            pila = [(x0, y0)]
            visto[y0 * W + x0] = 1
            x1 = x2 = x0
            y1 = y2 = y0
            n = 0
            while pila:
                x, y = pila.pop()
                n += 1
                x1, x2 = min(x1, x), max(x2, x)
                y1, y2 = min(y1, y), max(y2, y)
                for dx, dy in ((1, 0), (-1, 0), (0, 1), (0, -1)):
                    a, b = x + dx, y + dy
                    if 0 <= a < W and 0 <= b < H and not visto[b * W + a] and pieno[a, b]:
                        visto[b * W + a] = 1
                        pila.append((a, b))
            if n >= minimo:
                fuori.append((x1, y1, x2 - x1 + 1, y2 - y1 + 1))
    return sorted(fuori, key=lambda r: (r[1] // 20, r[0]))


def unisci(rett):
    """Un rettangolo che contiene tutti gli altri."""
    x1 = min(x for x, _, _, _ in rett)
    y1 = min(y for _, y, _, _ in rett)
    x2 = max(x + w for x, _, w, _ in rett)
    y2 = max(y + h for _, y, _, h in rett)
    return [x1, y1, x2 - x1, y2 - y1]


def separatori(fig, alto):
    """Le righe sottili e alte quanto la tabella: sono i confini delle
    colonne, disegnati da chi ha fatto il foglio. Fidarsi di quelli è
    meglio che dedurre un passo da figure che non sono centrate."""
    return sorted(x for x, _, w, h in fig if w <= 8 and h >= alto * 0.85)


def per_celle(fig, colonne, righe):
    """Ogni macchia nella sua cella, e le macchie di una cella unite."""
    dentro = {}
    for r in fig:
        x, y, w, h = r
        cx, cy = x + w / 2, y + h / 2
        c = sum(1 for s in colonne if s < cx)
        f = next((i for i, (a, q) in enumerate(righe) if a <= cy < a + q), None)
        if f is None:
            continue
        dentro.setdefault((f, c), []).append(r)
    return {k: unisci(v) for k, v in sorted(dentro.items())}


def per_griglia(pieno, W, H, g, x0, y0):
    """Quali celle della griglia hanno qualcosa dentro, e dove sta
    davvero: il rettangolo stretto attorno ai pixel pieni, non la cella."""
    gx, gy, px, py, cw, ch = g
    fuori = {}
    riga = 0
    while gy + riga * py + ch <= y0 + H + 2:
        col = 0
        while gx + col * px + cw <= x0 + W + 2:
            ax, ay = int(round(gx + col * px)) - x0, int(round(gy + riga * py)) - y0
            x1 = y1 = 10 ** 6
            x2 = y2 = -1
            for y in range(max(0, ay), min(H, ay + int(ch))):
                for x in range(max(0, ax), min(W, ax + int(cw))):
                    if pieno[x, y]:
                        x1, x2 = min(x1, x), max(x2, x)
                        y1, y2 = min(y1, y), max(y2, y)
            if x2 >= 0:
                fuori[(riga, col)] = [x1 + x0, y1 + y0, x2 - x1 + 1, y2 - y1 + 1]
            col += 1
        riga += 1
    return fuori


def main():
    args = [a for a in sys.argv[1:] if not a.startswith('--')]
    if not args:
        print(__doc__)
        return 1
    f = Path(args[0])
    if not f.is_absolute() and not f.exists():
        f = QUI / f
    im = Image.open(f)
    pieno, W, H = alfa(im)

    reg = next((a.split('=')[-1] for a in sys.argv if a.startswith('--regione')), None)
    if reg:
        x0, y0, x1, y1 = (int(v) for v in reg.split(','))
    else:
        x0, y0, x1, y1 = 0, 0, W, H

    print(f'{f.name}  {W}×{H}  regione {x0},{y0} → {x1},{y1}')

    ritaglio = im.crop((x0, y0, x1, y1))
    p2, w2, h2 = alfa(ritaglio)
    righe = bande(p2, h2, w2, False)
    colonne = bande(p2, w2, h2, True)

    for nome, b, off in (('righe', righe, y0), ('colonne', colonne, x0)):
        inizi = [i + off for i, _ in b]
        medio, ballo = passo_di(inizi)
        print(f'\n  {nome}: {len(b)} bande piene')
        print(f'    inizi   {inizi}')
        print(f'    misure  {[q for _, q in b]}')
        if medio:
            print(f'    passo   {medio:.2f}  (balla di {ballo:.2f} px)'
                  + ('   ← griglia regolare' if ballo <= 1.5 else '   ← non è una griglia'))

    if '--figure' in sys.argv or '--celle' in sys.argv:
        fig = figure(p2, w2, h2)
        if '--figure' in sys.argv:
            print(f'\n  figure: {len(fig)}')
            print('    ' + json.dumps([[x + x0, y + y0, w, h] for x, y, w, h in fig]))
        if '--celle' in sys.argv:
            # I confini si possono anche dettare: quando si guarda una
            # fascia sola, i separatori del foglio ci cascano dentro
            # tagliati e non si riconoscono più da soli.
            dettate = next((a.split('=')[-1] for a in sys.argv
                            if a.startswith('--colonne')), None)
            sep = ([float(v) - x0 for v in dettate.split(',')] if dettate
                   else separatori(fig, h2))
            resto = [r for r in fig if not (r[2] <= 8 and r[3] >= h2 * 0.85)]
            print(f'\n  separatori a x = {[s + x0 for s in sep]}'
                  f'  → {len(sep) + 1} colonne')
            # le righe si rifanno SENZA i separatori: quelli sono alti
            # quanto tutta la tabella e da soli la fanno sembrare una
            # banda unica
            fasce = []
            for y, h in sorted((r[1], r[3]) for r in resto):
                if fasce and y <= fasce[-1][0] + fasce[-1][1]:
                    fasce[-1][1] = max(fasce[-1][1], y + h - fasce[-1][0])
                else:
                    fasce.append([y, h])
            righe = [tuple(f) for f in fasce]
            print(f'  righe (senza separatori): {[(a + y0, q) for a, q in righe]}')
            celle = per_celle(resto, sep, righe)
            print(f'  celle piene: {len(celle)}')
            for (f, c), r in celle.items():
                print(f'    riga {f} colonna {c:2d}   '
                      f'[{r[0] + x0}, {r[1] + y0}, {r[2]}, {r[3]}]')

    if '--tabella' in sys.argv:
        # Fasce piene in verticale, e dentro ognuna le bande piene in
        # orizzontale: è il ritaglio giusto per un foglio disegnato a
        # mano libera, dove le colonne non cadono su nessun passo — e
        # sono quasi tutti così, perché li ha fatti un generatore.
        # Due bande separate da un pelo di vuoto sono la stessa cosa: un
        # ciuffo d'erba che non tocca il resto non è una tessera nuova.
        def salda(b, vicino=6, minimo=30):
            fuori = []
            for a, q in b:
                if fuori and a - (fuori[-1][0] + fuori[-1][1]) <= vicino:
                    fuori[-1][1] = a + q - fuori[-1][0]
                else:
                    fuori.append([a, q])
            return [f for f in fuori if f[1] >= minimo]

        print('\n  tabella:')
        # Il vuoto fra due tessere vicine è di pochi pixel, poco più di
        # quello che separa due pezzi della stessa tessera: si salda
        # stretto e si scarta quello che resta troppo magro per essere
        # una cella.
        for f, (a, q) in enumerate(salda(righe, 2, 20)):
            fascia = ritaglio.crop((0, a, w2, a + q))
            p3, w3, h3 = alfa(fascia)
            cols = salda(bande(p3, w3, h3, True), 3, 30)
            print(f'    riga {f}  (y {a + y0}, alta {q}): {len(cols)} celle')
            print('      ' + json.dumps([[x + x0, a + y0, w, q] for x, w in cols]))

    gri = next((a.split('=')[-1] for a in sys.argv if a.startswith('--griglia')), None)
    if gri:
        g = [float(v) for v in gri.split(',')]
        celle = per_griglia(p2, w2, h2, g, x0, y0)
        print(f'\n  griglia: {len(celle)} celle piene')
        for (f, c), r in celle.items():
            print(f'    riga {f} colonna {c:2d}   {r}')
    return 0


if __name__ == '__main__':
    sys.exit(main())
