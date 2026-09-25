#!/usr/bin/env python3
"""Vestire le carte del castello con una scena generata — il provvisorio.

    python3 strumenti/sprite/vesti.py --provino td_1.png uscita.png

Le carte (`src/giochi/castello/motore/carta.js`) sono scritte a
caratteri; qui ogni carattere diventa un pezzo **ritagliato dalla scena**
(`td_1.png`, `td_2.png`, `td_3.png`), senza aspettare il foglio dei
pezzi. È un provvisorio dichiarato: la scena non sta sulla griglia e non
ha tutti i pezzi, quindi i ritagli sono presi dove la scena li ha — i
centri della strada misurati, le toppe di prato cercate — e il gioco vero
li prenderà dal foglio. Serve a vedere **se il vestito sta bene sulle
carte**, e a provare una cosa che conta: le tre scene hanno la stessa
geometria (è la stessa scena rivestita), quindi **la stessa tabella di
ritagli vale per tutte e tre**. Se un pezzo esce giusto nel bosco e
storto nella neve, non è così.

Chi lo usa per disegnare le carte è `scacchiera.py --carte … --vesti`.
"""
import sys
from pathlib import Path
from PIL import Image, ImageDraw

# la scena su cui sono misurati i ritagli, e da cui si ricavano le
# maschere: vale per le altre perché hanno la stessa geometria
RIFERIMENTO = Path(__file__).parent / 'sorgenti' / 'castello' / 'generati' / 'td_1.png'

C = 64

# ── la strada: i centri delle celle, misurati su td_1 ────────────────
# Ogni pezzo è la cella di 64×64 centrata dove la striscia (larga mezza
# cella) gira, si innesta o corre dritta. I versi sono quelli da cui la
# strada prosegue. La scena ha i quattro gomiti, due innesti e
# l'incrocio; gli altri due innesti si ottengono girando quelli che ci
# sono di mezzo giro, e il dritto orizzontale anche dal verticale.
STRADA = {
    'NS': [(512, 180), (718, 365), (480, 556), (250, 756), (545, 756), (545, 940), (781, 940), (545, 1120)],
    'EO': [(615, 280), (600, 448), (380, 665), (400, 846), (680, 846), (660, 1031), (625, 1214)],
    'NE': [(512, 280), (250, 846), (545, 1214)],
    'SO': [(718, 280), (545, 665), (781, 846), (704, 1214)],
    'NO': [(718, 448), (781, 1031)],
    'ES': [(480, 448), (250, 665)],
    'NEO': [(480, 665)],
    'NES': [(545, 1031)],
    'NESO': [(545, 846)],
}
# quello che manca si fa girando di mezzo giro quello che c'è
GIRATI = {'ESO': 'NEO', 'NSO': 'NES'}

# ── il resto: prese dalla scena, in pixel ────────────────────────────
# le toppe di prato senza niente sopra (cercate da sole: tutte verdi,
# meno del 4% di pixel che non lo sono), le prime sedici
PRATO = [(176, 944), (208, 192), (288, 144), (384, 256), (416, 864), (576, 592), (640, 192),
         (688, 944), (752, 272), (160, 1040), (720, 752), (240, 1088), (736, 1216), (288, 448),
         (368, 400), (448, 944)]
PIAZZOLA = [(421, 348), (646, 348), (799, 414), (294, 556), (626, 556)]
# cespugli, massi e alberelli isolati, al centro della loro cella
DECORI = [(270, 375), (580, 210), (390, 225), (175, 652), (130, 810), (555, 525), (618, 930),
          (690, 700), (372, 925), (802, 170), (706, 128), (428, 135)]
# il fitto: la colonna di bosco lungo il bordo sinistro
FITTO = [(32, 32 + 64 * i) for i in range(8, 18)] + [(992, 32 + 64 * i) for i in range(2, 8)]
BOCCA = (416, 0, 608, 128)                # tre celle per due, quella di mezzo
CASTELLO = (384, 1240, 682, 1470)         # dal pennone al piede, senza la strada che gli passa a destra
STAGNO = (0, 250, 250, 475)               # il lago di sinistra: la riva su tre lati


def cella(scena, cx, cy):
    return scena.crop((cx - C // 2, cy - C // 2, cx + C // 2, cy + C // 2))


def maschera_del_prato(im):
    """Opaco dove non è prato: nel bosco il prato è l'unica cosa verde e
    chiara. La si calcola sul riferimento e si usa per tutte le scene —
    sulla neve e sulla lava il prato non è verde, ma sta negli stessi
    pixel."""
    m = Image.new('L', im.size, 255)
    pm, pi = m.load(), im.load()
    for y in range(im.height):
        for x in range(im.width):
            r, g, b = pi[x, y]
            if g > r + 12 and g > b + 20 and g > 110:
                pm[x, y] = 0
    return m


def pezzi(scena):
    """I pezzi di una scena, tutti dalla stessa tabella."""
    rif = Image.open(RIFERIMENTO).convert('RGB')
    p = {'strada': {}}
    for vv, centri in STRADA.items():
        p['strada'][vv] = [cella(scena, x, y) for x, y in centri]
    for vv, da in GIRATI.items():
        p['strada'][vv] = [im.rotate(180) for im in p['strada'][da]]
    p['prato'] = [scena.crop((x, y, x + C, y + C)) for x, y in PRATO]
    p['piazzola'] = [cella(scena, x, y) for x, y in PIAZZOLA]
    p['decoro'] = [cella(scena, x, y) for x, y in DECORI]
    p['fitto'] = [cella(scena, x, y) for x, y in FITTO]
    p['bocca'] = scena.crop(BOCCA)
    p['castello'] = scena.crop(CASTELLO)
    # il castello senza il prato che gli sta attorno: sopra le mura deve
    # vedersi la strada che ci arriva, non una toppa d'erba
    p['castello'].putalpha(maschera_del_prato(rif.crop(CASTELLO)))
    p['stagno'] = scena.crop(STAGNO)
    return p


def caso(x, y, n, seme=0):
    """Una variante per posto: la stessa cella prende sempre lo stesso pezzo."""
    return ((x * 73856093) ^ (y * 19349663) ^ (seme * 83492791)) % n


def versi(righe, x, y):
    h, w = len(righe), len(righe[0])

    def a(i, j):
        return righe[j][i] if 0 <= i < w and 0 <= j < h else None
    fuori = ''
    for v, (dx, dy) in (('N', (0, -1)), ('E', (1, 0)), ('S', (0, 1)), ('O', (-1, 0))):
        c = a(x + dx, y + dy)
        if c == '+' or (v == 'N' and c == 'A') or (v == 'S' and c == 'C'):
            fuori += v
    return fuori


def vesti(righe, p):
    h, w = len(righe), len(righe[0])
    im = Image.new('RGB', (w * C, h * C))

    def a(i, j):
        return righe[j][i] if 0 <= i < w and 0 <= j < h else None
    # il fondo dappertutto, anche sotto le figure
    for y in range(h):
        for x in range(w):
            im.paste(p['prato'][caso(x, y, len(p['prato']))], (x * C, y * C))
    for y in range(h):
        for x in range(w):
            c = a(x, y)
            if c == '+':
                vv = versi(righe, x, y)
                chiave = ''.join(v for v in 'NESO' if v in vv)
                chiave = {'NS': 'NS', 'EO': 'EO'}.get(chiave, chiave)
                scelte = p['strada'].get(chiave) or p['strada'].get(chiave[::-1])
                if scelte:
                    im.paste(scelte[caso(x, y, len(scelte), 1)], (x * C, y * C))
            elif c == 'o':
                im.paste(p['piazzola'][caso(x, y, len(p['piazzola']), 2)], (x * C, y * C))
            elif c == 'd':
                im.paste(p['decoro'][caso(x, y, len(p['decoro']), 3)], (x * C, y * C))
            elif c == '^':
                im.paste(p['fitto'][caso(x, y, len(p['fitto']), 4)], (x * C, y * C))
    # l'acqua: lo stagno intero sopra ogni specchio, grande quanto il
    # suo riquadro, girato verso il bordo se il bordo lo tocca
    visti = set()
    for y in range(h):
        for x in range(w):
            if a(x, y) != '~' or (x, y) in visti:
                continue
            coda, cc = [(x, y)], []
            visti.add((x, y))
            while coda:
                i, j = coda.pop()
                cc.append((i, j))
                for di, dj in ((1, 0), (-1, 0), (0, 1), (0, -1)):
                    q = (i + di, j + dj)
                    if a(*q) == '~' and q not in visti:
                        visti.add(q)
                        coda.append(q)
            x0, x1 = min(i for i, _ in cc), max(i for i, _ in cc) + 1
            y0, y1 = min(j for _, j in cc), max(j for _, j in cc) + 1
            s = p['stagno']
            if x1 == w:
                s = s.transpose(Image.FLIP_LEFT_RIGHT)
            elif x0 != 0:
                # in mezzo al prato: la metà con la riva, e la stessa specchiata
                m = s.crop((s.width // 2, 0, s.width, s.height))
                s = Image.new('RGB', (m.width * 2, m.height))
                s.paste(m.transpose(Image.FLIP_LEFT_RIGHT), (0, 0))
                s.paste(m, (m.width, 0))
            im.paste(s.resize(((x1 - x0) * C, (y1 - y0) * C), Image.LANCZOS), (x0 * C, y0 * C))
    # le figure: la bocca sopra ogni terzina di A, il castello sul piede
    for y in range(h):
        for x in range(w):
            if a(x, y) == 'A' and a(x - 1, y) != 'A' and a(x, y - 1) != 'A':
                im.paste(p['bocca'], (x * C, y * C))
            if a(x, y) == 'C' and a(x - 1, y) != 'C' and a(x, y - 1) != 'C':
                # la strada prosegue sotto le mura, e il castello ci si posa sopra
                for i in range(x, x + 5):
                    if a(i, y - 1) == '+':
                        im.paste(p['strada']['NS'][0], (i * C, y * C))
                cs = p['castello']
                im.paste(cs, (x * C + (5 * C - cs.width) // 2, h * C - cs.height), cs)
    return im


def provino(scena, uscita):
    """Tutti i pezzi di una scena, in fila per famiglia: è da qui che si
    vede se un ritaglio ha preso mezzo albero o un pezzo di strada."""
    p = pezzi(scena)
    file = [('strada ' + k, v) for k, v in p['strada'].items()] + [
        ('prato', p['prato']), ('piazzola', p['piazzola']), ('decoro', p['decoro']),
        ('fitto', p['fitto']), ('bocca, castello, stagno', [p['bocca'], p['castello'], p['stagno']])]
    alto = sum(max(im.height for im in v) + 24 for _, v in file) + 8
    foglio = Image.new('RGB', (1400, alto), (30, 30, 30))
    d = ImageDraw.Draw(foglio)
    y = 8
    for nome, v in file:
        d.text((8, y), nome, fill=(230, 230, 220))
        x = 8
        for im in v:
            foglio.paste(im, (x, y + 14))
            x += im.width + 6
        y += max(im.height for im in v) + 24
    foglio.save(uscita)


if __name__ == '__main__':
    if len(sys.argv) == 4 and sys.argv[1] == '--provino':
        provino(Image.open(sys.argv[2]).convert('RGB'), sys.argv[3])
    else:
        sys.exit(__doc__)
