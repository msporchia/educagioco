#!/usr/bin/env python3
"""Vestire le carte del castello con una scena generata — il provvisorio.

    python3 strumenti/sprite/vesti.py --provino td_1.png uscita.png

Le carte (`src/giochi/castello/motore/carta.js`) sono scritte a
caratteri; qui ogni carattere diventa un pezzo **preso dalla scena**
(`td_1.png`, `td_2.png`, `td_3.png`), senza aspettare il foglio dei
pezzi. È un provvisorio dichiarato, e serve a vedere se il vestito sta
bene sulle carte. Le tre scene hanno la stessa geometria (è la stessa
scena rivestita), quindi **tutto si misura su `td_1` e vale per tutte e
tre**: dove prendere i pezzi, e quali pixel di un ritaglio sono prato.

Tre cose imparate col primo giro, che incollava ritagli quadrati:

  · **la strada non si ritaglia, si ricompone.** Nella scena la striscia
    non sta mai esattamente nello stesso posto né è larga uguale (fra 29
    e 38 px), e due ritagli accostati facevano un gradino a ogni cella.
    Adesso si prende **un solo** rettilineo (`STRISCIA`) e ogni cella la
    si ricompone da lui: il colore di un pixel è quello del rettilineo
    alla stessa distanza dall'orlo, e l'orlo è dove la strada non
    prosegue. Negli angoli interni la distanza si conta dallo spigolo, e
    l'orlo fa la sua L. I bordi combaciano per costruzione.
  · **il prato non si posa a piastrelle**: toppe più grandi di una cella,
    coi bordi sfumati, che si sovrappongono. Una piastrella per cella si
    leggeva come una scacchiera.
  · **alberi, massi e piazzole sono figure, non quadrati**: si scontornano
    togliendo il fondo, e lungo il bordo del fitto si posano alberi interi
    che sbordano nel prato. Un albero tagliato al bordo della cella è la
    cosa più brutta che si possa vedere su una mappa.

Chi lo usa per disegnare le carte è `scacchiera.py --carte … --vesti`.
"""
import sys
from functools import lru_cache
from pathlib import Path
from PIL import Image, ImageDraw, ImageFilter

C = 64
RIFERIMENTO = Path(__file__).parent / 'sorgenti' / 'castello' / 'generati' / 'td_1.png'

# ── la strada: un rettilineo solo ────────────────────────────────────
# Il tratto verticale sotto la bocca di mezzo, fra y 130 e 254: lì la
# striscia è larga uguale riga per riga (orlo scuro, bordo bruno, terra,
# bordo bruno, orlo scuro) e centrata a x 511. Il ritaglio è largo una
# cella, e la striscia ne occupa `A`..`B`.
STRISCIA = (479, 130, 543, 254)
A, B = 5, 59                       # dove comincia e finisce la striscia, orli compresi

# ── il resto: prese dalla scena, in pixel, centri ────────────────────
PIAZZOLA = [(421, 348), (646, 348), (799, 414), (294, 556), (626, 556)]
# alberi, cespugli e massi isolati: si ritagliano larghi e si scontornano
ALBERI = [(330, 305), (378, 560), (372, 925), (380, 1160), (330, 760), (555, 525), (618, 930)]
DECORI = [(270, 375), (580, 210), (390, 225), (175, 652), (130, 810), (690, 700), (802, 170), (428, 135)]
BOCCA = (416, 0, 608, 128)                # tre celle per due, quella di mezzo
CASTELLO = (384, 1240, 682, 1470)         # dal pennone al piede, senza la strada che gli passa a destra
STAGNO = (0, 250, 250, 475)               # il lago di sinistra: la riva su tre lati
# dove cercare il bosco fitto: le fasce di bordo, lontano da laghi e castello
FASCE_DEL_FITTO = [(0, 480, 100, 1330), (0, 1330, 380, 1536), (700, 1380, 1024, 1536),
                   (900, 60, 1024, 520)]

TOPPA = 96                                # una toppa di prato o di fitto: una cella e mezza
SFUMA = 16                                # quanto sfuma il bordo di una toppa


# ── misurare il riferimento, una volta ───────────────────────────────

@lru_cache(maxsize=None)
def riferimento():
    return Image.open(RIFERIMENTO).convert('RGB')


def e_prato(r, g, b):
    """Nel bosco il prato è l'unica cosa verde e chiara."""
    return g > r + 12 and g > b + 20 and g > 100


@lru_cache(maxsize=None)
def maschera_prato():
    """Tutta la scena di riferimento: 255 dove non è prato."""
    rif = riferimento()
    m = Image.new('L', rif.size)
    pr, pm = rif.load(), m.load()
    for y in range(rif.height):
        for x in range(rif.width):
            pm[x, y] = 0 if e_prato(*pr[x, y]) else 255
    return m


@lru_cache(maxsize=None)
def toppe_di_prato(n=18):
    """Le finestre di `TOPPA` px senza niente sopra, cercate da sole."""
    m = maschera_prato().load()
    cand = []
    for y in range(80, 1330, 16):
        for x in range(40, 1024 - TOPPA - 40, 16):
            sporco = sum(1 for j in range(y, y + TOPPA, 4) for i in range(x, x + TOPPA, 4) if m[i, j])
            cand.append((sporco, x, y))
    cand.sort()
    scelte = []
    for _, x, y in cand:
        if all(abs(x - a) >= TOPPA or abs(y - b) >= TOPPA for a, b in scelte):
            scelte.append((x, y))
        if len(scelte) >= n:
            break
    return scelte


@lru_cache(maxsize=None)
def toppe_di_fitto(n=16):
    """Le finestre dentro le fasce di bordo dove non c'è quasi prato."""
    m = maschera_prato().load()
    cand = []
    for x0, y0, x1, y1 in FASCE_DEL_FITTO:
        for y in range(y0, y1 - TOPPA + 1, 12):
            for x in range(x0, max(x0 + 1, x1 - TOPPA + 1), 12):
                pieno = sum(1 for j in range(y, y + TOPPA, 4) for i in range(x, x + TOPPA, 4) if m[i, j])
                cand.append((-pieno, x, y))
    cand.sort()
    scelte = []
    for _, x, y in cand:
        if all(abs(x - a) >= TOPPA * 0.7 or abs(y - b) >= TOPPA * 0.7 for a, b in scelte):
            scelte.append((x, y))
        if len(scelte) >= n:
            break
    return scelte


@lru_cache(maxsize=None)
def sfumatura(w, h, bordo=SFUMA):
    a = Image.new('L', (w, h))
    pa = a.load()
    for y in range(h):
        for x in range(w):
            d = min(x, y, w - 1 - x, h - 1 - y)
            pa[x, y] = min(255, int(255 * (d + 1) / bordo))
    return a


def maschera_del_fondo(scena):
    """255 dove non è fondo, **per questa scena**. Il fondo lo dicono le
    toppe di prato — le stesse coordinate in ogni scena, perché la
    geometria è la stessa — e si prendono i colori che ci stanno spesso:
    sulla neve il bianco-azzurro, sulla lava il viola scuro. Un colore
    raro nelle toppe (un ciuffo, un fiore) non entra: se no il fondo
    passerebbe attraverso il contorno delle figure."""
    q = lambda r, g, b: (r >> 4, g >> 4, b >> 4)
    conta = {}
    for x, y in toppe_di_prato():
        for c in list(scena.crop((x, y, x + TOPPA, y + TOPPA)).getdata()):
            conta[q(*c)] = conta.get(q(*c), 0) + 1  # noqa
    tot = sum(conta.values())
    palette = {k for k, n in conta.items() if n > tot * 0.004}
    m = Image.new('L', scena.size)
    ps, pm = scena.load(), m.load()
    for y in range(scena.height):
        for x in range(scena.width):
            pm[x, y] = 0 if q(*ps[x, y]) in palette else 255
    return m


def sagoma(fondo, cx, cy, w, h, piccole=40):
    """La maschera di una figura intorno a (cx, cy). È prato quello che si
    raggiunge **dal bordo del ritaglio passando per il prato**: le luci
    verdi dentro una chioma sono chiuse dal contorno scuro e restano
    albero. Poi si tiene solo il pezzo attaccato al centro, e i ciuffi
    staccati più piccoli di `piccole` pixel se ne vanno."""
    x0, y0 = cx - w // 2, cy - h // 2
    pm = fondo.crop((x0, y0, x0 + w, y0 + h)).load()
    fuori = [[False] * h for _ in range(w)]
    coda = [(i, j) for i in range(w) for j in (0, h - 1)] + [(i, j) for j in range(h) for i in (0, w - 1)]
    coda = [q for q in coda if not pm[q]]
    for i, j in coda:
        fuori[i][j] = True
    while coda:
        i, j = coda.pop()
        for di, dj in ((1, 0), (-1, 0), (0, 1), (0, -1)):
            p, q = i + di, j + dj
            if 0 <= p < w and 0 <= q < h and not fuori[p][q] and not pm[p, q]:
                fuori[p][q] = True
                coda.append((p, q))
    # i pezzi di figura, e quale tenere: quello che tocca il centro, o il
    # più vicino
    visto = [[False] * h for _ in range(w)]
    pezzi = []
    for i in range(w):
        for j in range(h):
            if fuori[i][j] or visto[i][j]:
                continue
            pz, coda = [], [(i, j)]
            visto[i][j] = True
            while coda:
                a, b = coda.pop()
                pz.append((a, b))
                for di, dj in ((1, 0), (-1, 0), (0, 1), (0, -1)):
                    p, q = a + di, b + dj
                    if 0 <= p < w and 0 <= q < h and not fuori[p][q] and not visto[p][q]:
                        visto[p][q] = True
                        coda.append((p, q))
            pezzi.append(pz)
    m = Image.new('L', (w, h))
    if not pezzi:
        return m
    grandi = [pz for pz in pezzi if len(pz) >= piccole] or pezzi
    tieni = min(grandi, key=lambda pz: min((a - w // 2) ** 2 + (b - h // 2) ** 2 for a, b in pz))
    pm2 = m.load()
    for a, b in tieni:
        pm2[a, b] = 255
    return m


# ── la strada ricomposta ─────────────────────────────────────────────

def specchio(i, n):
    """0, 1, … n-1, n-1, … 1, 0, 0, 1, …: un indice che non ricomincia."""
    i %= 2 * n
    return i if i < n else 2 * n - 1 - i


def cella_di_strada(striscia, vv, giro=0):
    """Una cella di strada coi suoi versi, dal solo rettilineo."""
    ps = striscia.load()
    L = striscia.height
    meta = (B - A) // 2
    im = Image.new('RGBA', (C, C), (0, 0, 0, 0))
    pi = im.load()
    for y in range(C):
        for x in range(C):
            if A <= x < B and A <= y < B:
                d = []
                if 'O' not in vv: d.append(x - A)
                if 'E' not in vv: d.append(B - 1 - x)
                if 'N' not in vv: d.append(y - A)
                if 'S' not in vv: d.append(B - 1 - y)
                # gli angoli interni: dove due lati vicini proseguono
                if 'N' in vv and 'E' in vv: d.append(max(y - A, B - 1 - x))
                if 'E' in vv and 'S' in vv: d.append(max(B - 1 - x, B - 1 - y))
                if 'S' in vv and 'O' in vv: d.append(max(B - 1 - y, x - A))
                if 'O' in vv and 'N' in vv: d.append(max(x - A, y - A))
                dist = min(d) if d else meta
                # corre in verticale se il lato più vicino è di fianco
                lungo_y = dist in (x - A, B - 1 - x) or ('N' in vv and 'S' in vv)
            elif A <= x < B and ((y < A and 'N' in vv) or (y >= B and 'S' in vv)):
                dist = min(x - A, B - 1 - x)
                lungo_y = True
            elif A <= y < B and ((x < A and 'O' in vv) or (x >= B and 'E' in vv)):
                dist = min(y - A, B - 1 - y)
                lungo_y = False
            else:
                continue
            # il campione si prende **lungo** la strada: la riga del
            # rettilineo è la coordinata che corre nel verso della strada
            # avanti e indietro, a specchio: un campione che ricomincia da
            # capo lascia una riga dove si ricuce
            lungo = specchio((y if lungo_y else x) + giro * 29, L)
            if dist >= meta - 4:
                # la terra: dal mezzo del rettilineo
                col = A + 14 + specchio(x if lungo_y else y, B - A - 28)
            else:
                col = A + dist
            r, g, b = ps[col, lungo]
            pi[x, y] = (r, g, b, 255)
    return im


# ── i pezzi di una scena ─────────────────────────────────────────────

VERSI = ('NS', 'EO', 'NE', 'ES', 'SO', 'NO', 'NEO', 'NES', 'ESO', 'NSO', 'NESO')


def pezzi(scena):
    """I pezzi di una scena: tutti dalle stesse coordinate, e tutte le
    maschere misurate sul riferimento."""
    p = {}
    striscia = scena.crop(STRISCIA)
    p['strada'] = {vv: [cella_di_strada(striscia, vv, g) for g in range(3)] for vv in VERSI}
    p['prato'] = [scena.crop((x, y, x + TOPPA, y + TOPPA)) for x, y in toppe_di_prato()]
    p['fitto'] = [scena.crop((x, y, x + TOPPA, y + TOPPA)) for x, y in toppe_di_fitto()]

    fondo = maschera_del_fondo(scena)

    def figura(cx, cy, w, h):
        x0, y0 = cx - w // 2, cy - h // 2
        im = scena.crop((x0, y0, x0 + w, y0 + h)).convert('RGBA')
        im.putalpha(sagoma(fondo, cx, cy, w, h))
        return im
    p['piazzola'] = [figura(x, y, 64, 64) for x, y in PIAZZOLA]
    p['albero'] = [figura(x, y, 112, 120) for x, y in ALBERI]
    p['decoro'] = [figura(x, y, 96, 96) for x, y in DECORI]
    p['bocca'] = scena.crop(BOCCA).convert('RGBA')
    p['bocca'].putalpha(sfumatura(*p['bocca'].size, 10))
    # il castello senza il prato che gli sta attorno: sopra le mura deve
    # vedersi la strada che ci arriva, non una toppa d'erba
    p['castello'] = scena.crop(CASTELLO).convert('RGBA')
    x0, y0, x1, y1 = CASTELLO
    p['castello'].putalpha(sagoma(fondo, (x0 + x1) // 2, (y0 + y1) // 2, x1 - x0, y1 - y0, 400))
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

    def toppa(pezzo, x, y):
        o = (TOPPA - C) // 2
        im.paste(pezzo, (x * C - o, y * C - o), sfumatura(TOPPA, TOPPA))

    # 1 — il prato dappertutto, a toppe sfumate che si sovrappongono,
    #     posate in un ordine mescolato perché non si veda la trama
    celle = sorted(((x, y) for y in range(h) for x in range(w)), key=lambda q: caso(*q, 997, 5))
    im.paste(p['prato'][0].resize((w * C, h * C)), (0, 0))
    for x, y in celle:
        toppa(p['prato'][caso(x, y, len(p['prato']))], x, y)
    # 2 — sotto il fitto, un fondo scuro preso dal bosco della scena:
    #     fra un albero e l'altro deve vedersi sottobosco, non prato
    for x, y in celle:
        if a(x, y) == '^':
            toppa(p['fitto'][caso(x, y, len(p['fitto']), 4)], x, y)
    # 3 — l'acqua: lo stagno intero sopra ogni specchio, grande quanto il
    #     suo riquadro, girato verso il bordo se il bordo lo tocca
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
                m = s.crop((s.width // 2, 0, s.width, s.height))
                s = Image.new('RGB', (m.width * 2, m.height))
                s.paste(m.transpose(Image.FLIP_LEFT_RIGHT), (0, 0))
                s.paste(m, (m.width, 0))
            s = s.resize(((x1 - x0) * C, (y1 - y0) * C), Image.LANCZOS)
            im.paste(s, (x0 * C, y0 * C), sfumatura(*s.size, 12))
    # 4 — la strada e le piazzole
    for y in range(h):
        for x in range(w):
            c = a(x, y)
            if c == '+':
                vv = ''.join(v for v in 'NESO' if v in versi(righe, x, y))
                if vv in p['strada']:
                    pz = p['strada'][vv][caso(x, y, 3, 1)]
                    im.paste(pz, (x * C, y * C), pz)
            elif c == 'o':
                pz = p['piazzola'][caso(x, y, len(p['piazzola']), 2)]
                im.paste(pz, (x * C, y * C), pz)
    # 5 — le figure, dall'alto in basso: chi sta più giù copre chi sta su
    figure = []
    for y in range(h):
        for x in range(w):
            c = a(x, y)
            if c == 'd':
                figure.append((y * C, p['decoro'][caso(x, y, len(p['decoro']), 3)], x, y, 0))
            elif c == '^':
                # il fitto è fatto di alberi interi, tre per cella, che si
                # coprono dall'alto in basso; lungo il bordo si spostano
                # verso il prato e ci sbordano, come fa un bosco vero
                verso = [(dx, dy) for dx, dy in ((1, 0), (-1, 0), (0, 1), (0, -1))
                         if a(x + dx, y + dy) not in ('^', None)]
                vx = sum(d[0] for d in verso) * 12
                vy = sum(d[1] for d in verso) * 12
                for k, (ox, oy) in enumerate(((-14, -18), (16, -4), (-4, 14))):
                    sx = vx + ox + caso(x, y, 11, 7 + k) - 5
                    sy = vy + oy + caso(x, y, 11, 9 + k) - 5
                    figure.append((y * C + sy, p['albero'][caso(x, y, len(p['albero']), 6 + k)],
                                   x, y, (sx, sy)))
    for _, pz, x, y, (sx, sy) in sorted((f[:4] + ((0, 0) if f[4] == 0 else f[4],) for f in figure),
                                        key=lambda f: f[0]):
        im.paste(pz, (x * C + (C - pz.width) // 2 + sx, y * C + (C - pz.height) // 2 + sy - 8), pz)
    # 6 — la bocca e il castello
    for y in range(h):
        for x in range(w):
            if a(x, y) == 'A' and a(x - 1, y) != 'A' and a(x, y - 1) != 'A':
                im.paste(p['bocca'], (x * C, y * C), p['bocca'])
                # l'ultimo quarto sotto l'arco è la strada nostra, non il
                # moncone della scena: è lì che si ricuce
                pz = p['strada']['NS'][0].crop((0, 0, C, C // 3))
                im.paste(pz, ((x + 1) * C, (y + 2) * C - C // 3), pz)
            if a(x, y) == 'C' and a(x - 1, y) != 'C' and a(x, y - 1) != 'C':
                # la strada prosegue sotto le mura, e il castello ci si posa sopra
                for i in range(x, x + 5):
                    if a(i, y - 1) == '+':
                        pz = p['strada']['NS'][0]
                        im.paste(pz, (i * C, y * C), pz)
                cs = p['castello']
                im.paste(cs, (x * C + (5 * C - cs.width) // 2, h * C - cs.height), cs)
    return im


def provino(scena, uscita):
    """Tutti i pezzi di una scena, in fila per famiglia: è da qui che si
    vede se una figura ha preso mezzo sasso del vicino."""
    p = pezzi(scena)
    file = [('strada ' + k, v) for k, v in p['strada'].items()] + [
        ('prato', p['prato']), ('fitto', p['fitto']), ('piazzola', p['piazzola']),
        ('albero', p['albero']), ('decoro', p['decoro']),
        ('bocca, castello, stagno', [p['bocca'], p['castello'], p['stagno']])]
    alto = sum(max(im.height for im in v) + 24 for _, v in file) + 8
    foglio = Image.new('RGB', (1900, alto), (60, 60, 64))
    d = ImageDraw.Draw(foglio)
    y = 8
    for nome, v in file:
        d.text((8, y), nome, fill=(230, 230, 220))
        x = 8
        for im in v:
            foglio.paste(im, (x, y + 14), im if im.mode == 'RGBA' else None)
            x += im.width + 6
        y += max(im.height for im in v) + 24
    foglio.save(uscita)


if __name__ == '__main__':
    if len(sys.argv) == 4 and sys.argv[1] == '--provino':
        provino(Image.open(sys.argv[2]).convert('RGB'), sys.argv[3])
    else:
        sys.exit(__doc__)
