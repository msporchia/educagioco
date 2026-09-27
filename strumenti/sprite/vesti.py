#!/usr/bin/env python3
"""Vestire le carte del castello: coi ritagli di una scena generata (il
provvisorio) o col foglio del terreno, quando c'è.

    python3 strumenti/sprite/vesti.py --atlante
    python3 strumenti/sprite/vesti.py --provino bosco uscita.png      (o una scena: td_1.png)
    python3 strumenti/sprite/vesti.py --provino-foglio bosco uscita.png
    python3 strumenti/sprite/vesti.py --creature uscita.png

`--atlante` scrive i due moduli **generati** che il gioco `castello`
compone nel browser (`src/giochi/castello/dati/vestiti.js`, i pezzi dei
tre vestiti, e `figure.js`, torri e mostri): vedi `atlante()` in fondo.
Si rilancia ogni volta che arriva un'immagine: il foglio del terreno di
un vestito (`terreno-bosco.png`…), il foglio delle torri (`torri-1.png`),
un foglio di mostri che camminano (`mostri-cammino-A.png`…) — dove
salvarli e con che prompt farli lo dice `DA-GENERARE.md`, qui accanto.
Gli altri tre sono provini da guardare: i pezzi di un vestito (o di una
scena), il foglio del terreno scontornato coi rettangoli del suo
foglietto sopra, tutte le creature.

**Dal 27 settembre 2026 i tre vestiti hanno il loro foglio del terreno**
(`terreno-bosco.png`, `-neve`, `-lava`: vedi «il foglio del terreno» più
sotto), e quello che segue sulle scene resta come ripiego e per il
provino di una scena qualsiasi. Il campo non si porta dietro ventiquattro mappe già vestite —
peserebbero dieci volte tanto — ma i pezzi, e la composizione la rifà
`src/giochi/castello/scena/vestito.js` con la stessa logica di `vesti()`
qui sotto. **Chi cambia `vesti()` cambia anche quello**, se no la
battaglia finta e il gioco si vestono in due modi.

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
import base64
import importlib.util
import io
import json
import sys
from functools import lru_cache
from pathlib import Path
from PIL import Image, ImageDraw, ImageFilter

sys.path.insert(0, str(Path(__file__).parent))
import righe  # noqa: E402

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


def cella_di_strada(striscia, vv, giro=0, A=A, B=B, sfuma=0):
    """Una cella di strada coi suoi versi, dal solo rettilineo. `A`..`B` è
    dove sta la striscia nel rettilineo, orlo compreso; `sfuma` quanti
    pixel dell'orlo sfumano nel prato (il foglio del terreno ha per orlo
    un filo d'erba, e un filo d'erba con lo spigolo netto si vede)."""
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
            r, g, b = ps[col, lungo][:3]
            pi[x, y] = (r, g, b, 255 if dist >= sfuma else 255 * (dist + 1) // (sfuma + 1))
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

    # Due maschere, e la differenza conta. Le figure che il vestito
    # **ridisegna** — un albero tondo nel bosco è un abete nella neve e
    # un vulcanello nella lava — si scontornano col fondo di questa scena.
    # Quelle che il vestito **lascia uguali** — il castello, la bocca, le
    # piazzole — con quello del riferimento: sulla lava il fondo è viola-
    # grigio come le pietre del castello, e la maschera della scena ci
    # apriva dei buchi.
    fondo = maschera_del_fondo(scena)
    fondo_rif = maschera_prato()

    def figura(cx, cy, w, h, maschera=fondo, piccole=40):
        x0, y0 = cx - w // 2, cy - h // 2
        im = scena.crop((x0, y0, x0 + w, y0 + h)).convert('RGBA')
        im.putalpha(sagoma(maschera, cx, cy, w, h, piccole))
        return im
    p['piazzola'] = [figura(x, y, 64, 64, fondo_rif) for x, y in PIAZZOLA]
    p['albero'] = [figura(x, y, 112, 120) for x, y in ALBERI]
    p['decoro'] = [figura(x, y, 96, 96) for x, y in DECORI]
    p['bocca'] = scena.crop(BOCCA).convert('RGBA')
    p['bocca'].putalpha(sfumatura(*p['bocca'].size, 10))
    # il castello senza il prato che gli sta attorno: sopra le mura deve
    # vedersi la strada che ci arriva, non una toppa d'erba
    p['castello'] = scena.crop(CASTELLO).convert('RGBA')
    x0, y0, x1, y1 = CASTELLO
    p['castello'].putalpha(sagoma(fondo_rif, (x0 + x1) // 2, (y0 + y1) // 2, x1 - x0, y1 - y0, 400))
    # l'acqua che entra dal bordo: nella scena è il lago di sinistra,
    # aperto verso il bordo; qui si gira, così il lago ha la riva a
    # sinistra e il taglio a destra come quello che il foglio promette
    # (`lago` di `pezzi_dal_foglio`). Uno stagno in mezzo al campo la
    # scena non ce l'ha: `vesti()` lo fa con la metà di sinistra del
    # lago e il suo specchio
    lago = scena.crop(STAGNO).transpose(Image.FLIP_LEFT_RIGHT).convert('RGBA')
    lago.putalpha(sfumatura(*lago.size, 12))
    p['lago'] = lago
    p['fondo'] = p['prato'][0].convert('RGBA')
    return p


# ── il foglio del terreno ────────────────────────────────────────────
#
# Il prompt 2 della scheda (`sorgenti/castello/generati/PROMPT-scenario.md`)
# chiede **il foglio dei pezzi**: tre fondi, la finestra di strada, bocca,
# castello, acqua, alberi del fitto, decori piccoli e grandi, cose per
# terra. Sta accanto alle scene come `terreno-<vestito>.png`, e un vestito
# che ce l'ha si prende tutto da lì e non più dai ritagli della scena: si
# rilancia `vesti.py --atlante` e basta.
#
# Dove sta ogni pezzo lo dice il foglietto, `terreno-<vestito>.json`, nel
# formato di `FORMATO.md`: `da` e `cella` in pixel del foglio, `misura`
# quanto deve venire in pixel di gioco (una cella = 64). **I fogli veri non
# stanno sulla griglia chiesta** — quello del bosco ha la finestra della
# strada a ~56 px per cella e alberi e decori più grandi del chiesto — quindi
# ogni pezzo ha il suo rettangolo misurato, largo qualche pixel più del
# disegno (i rivestimenti di neve e lava si spostano fino a 5 px), e dopo
# la misura il pezzo si stringe sull'alfa: il margine non arriva al gioco.
#
# Un foglietto può dire `"come": "terreno-bosco.json"`: prende da lì tutto
# quello che non dice lui, e i pezzi uno per uno (`"sprite": {"fondo":
# {"evita": "acceso"}}` aggiunge una chiave al fondo e lascia il resto). È
# così che neve e lava, rifatte sul foglio del bosco pezzo per pezzo,
# dicono solo il loro fondo.
#
# Il fondo del foglio (`fondo` del foglietto) lo toglie `senza_fondo`, qui
# sotto: `"scacchiera"` per la trasparenza **dipinta** (il bosco), un
# colore `[255, 0, 255]` per il magenta pieno che si chiede adesso.

GENERATI = Path(__file__).parent / 'sorgenti' / 'castello' / 'generati'


def foglietto(nome):
    """Un foglietto, con quello da cui eredita (`come`) sotto di lui."""
    fg = json.loads((GENERATI / nome).read_text())
    if 'come' not in fg:
        return fg
    base = foglietto(fg['come'])
    fuori = {**base, **{k: v for k, v in fg.items() if k != 'sprite'}}
    fuori['sprite'] = {k: {**v, **fg.get('sprite', {}).get(k, {})} for k, v in base['sprite'].items()}
    for k, v in fg.get('sprite', {}).items():
        fuori['sprite'].setdefault(k, v)
    return fuori


def foglio_del_terreno(vestito):
    """(immagine, foglietto) del foglio di quel vestito, o None."""
    png = GENERATI / f'terreno-{vestito}.png'
    if not png.exists():
        return None
    nome = f'terreno-{vestito}.json'
    return png, foglietto(nome if (GENERATI / nome).exists() else 'terreno-bosco.json')


# La scacchiera dipinta: i due grigi chiari della «trasparenza» che il
# generatore ha disegnato coi pixel veri, (254,254,254)/(253,253,253) e
# (229,229,229)/(228,228,228). Grigio vuol dire canali quasi uguali, chiaro
# vuol dire sopra 200: le pietre del castello sono grigie ma più scure, e i
# fiori bianchi stanno dentro i cespugli, dove l'allagamento non arriva.
def e_scacchiera(c):
    return max(c[:3]) - min(c[:3]) < 12 and min(c[:3]) > 200


def allaga_dai_bordi(px, largo, alto, e_fondo):
    """Toglie il fondo camminando dal bordo del foglio: via solo quello che
    si raggiunge da fuori, mai un pixel chiuso dentro una sagoma."""
    visti = bytearray(largo * alto)
    coda = [(x, y) for x in range(largo) for y in (0, alto - 1)]
    coda += [(x, y) for y in range(alto) for x in (0, largo - 1)]
    while coda:
        x, y = coda.pop()
        i = y * largo + x
        if visti[i]:
            continue
        visti[i] = 1
        if not e_fondo(px[x, y]):
            continue
        px[x, y] = (0, 0, 0, 0)
        for p, q in ((x + 1, y), (x - 1, y), (x, y + 1), (x, y - 1)):
            if 0 <= p < largo and 0 <= q < alto and not visti[q * largo + p]:
                coda.append((p, q))


@lru_cache(maxsize=None)
def senza_fondo(png, fondo, tolleranza=60, frangia=55):
    """Il foglio in RGBA, col fondo tolto come dice il foglietto.

    `"trasparente"` — c'è già. `"scacchiera"` — la trasparenza dipinta,
    allagata dai bordi (`e_scacchiera`). Un colore — un fondo pieno,
    che si chiede magenta perché **quel colore non compare in nessun
    pezzo**: e siccome non compare, qui si toglie in tre passi.

      1. dai bordi, entro `tolleranza` per canale: il magenta del
         generatore non è mai (255,0,255) pieno, ma (247,4,250),
         (250,2,251), (246,10,245)…;
      2. **anche dove l'allagamento non arriva**: fra le traverse di una
         staccionata, fra i tronchi, dentro un ciuffo, il fondo resta
         chiuso in una tasca — e lì è sempre fondo, per la stessa ragione;
      3. **la frangia**: sull'orlo dei pezzi il generatore mescola il
         fondo col contorno, e restano pixel viola di mezzo. Si tolgono
         quelli che toccano il trasparente e sono ancora del fondo per
         più di `frangia` (per il magenta: quanto rosso e blu superano il
         verde), due giri. Il viola di mezzo non è un colore dei pezzi —
         la roccia della lava è viola-grigia, e dentro i pezzi non passa
         mai 50 — ma resta una soglia sulla tinta, non sul colore: è quello
         che distingue la frangia di un contorno scuro da quella di un
         cristallo arancione."""
    im = Image.open(png).convert('RGBA')
    if fondo == 'trasparente':
        return im
    px = im.load()
    largo, alto = im.size
    if fondo == 'scacchiera':
        allaga_dai_bordi(px, largo, alto, e_scacchiera)
        # la frangia della scacchiera: il contorno scuro mescolato col
        # grigio chiaro, un filo bianco attorno a ogni albero
        sfrangia(px, largo, alto, lambda c: max(c[:3]) - min(c[:3]) < 16 and min(c[:3]) > 140)
        return im
    f = tuple(fondo)
    vicino = lambda c: max(abs(c[i] - f[i]) for i in range(3)) <= tolleranza
    allaga_dai_bordi(px, largo, alto, lambda c: c[3] and vicino(c))
    for y in range(alto):
        for x in range(largo):
            if px[x, y][3] and vicino(px[x, y]):
                px[x, y] = (0, 0, 0, 0)
    alti = [i for i in range(3) if f[i] > 127]
    bassi = [i for i in range(3) if f[i] <= 127]
    sfrangia(px, largo, alto,
             lambda c: min(c[i] for i in alti) - max((c[i] for i in bassi), default=0) > frangia)
    return im


def tasche(px, largo, alto, e_tasca, minima=12):
    """Toglie le macchie di pixel `e_tasca` grandi almeno `minima`: il
    fondo chiuso dentro una sagoma, dove l'allagamento non arriva."""
    visti = bytearray(largo * alto)
    for y in range(alto):
        for x in range(largo):
            if visti[y * largo + x] or not px[x, y][3] or not e_tasca(px[x, y]):
                continue
            macchia, coda = [], [(x, y)]
            visti[y * largo + x] = 1
            while coda:
                i, j = coda.pop()
                macchia.append((i, j))
                for p, q in ((i + 1, j), (i - 1, j), (i, j + 1), (i, j - 1)):
                    if 0 <= p < largo and 0 <= q < alto and not visti[q * largo + p] \
                            and px[p, q][3] and e_tasca(px[p, q]):
                        visti[q * largo + p] = 1
                        coda.append((p, q))
            if len(macchia) >= minima:
                for i, j in macchia:
                    px[i, j] = (0, 0, 0, 0)


def sfrangia(px, largo, alto, e_frangia, giri=2):
    """Toglie i pixel `e_frangia` **che toccano il trasparente**, un giro
    per volta: dentro una sagoma non si entra mai."""
    for _ in range(giri):
        orlo = []
        for y in range(1, alto - 1):
            for x in range(1, largo - 1):
                c = px[x, y]
                if not c[3] or not e_frangia(c):
                    continue
                if not (px[x + 1, y][3] and px[x - 1, y][3] and px[x, y + 1][3] and px[x, y - 1][3]):
                    orlo.append((x, y))
        for x, y in orlo:
            px[x, y] = (0, 0, 0, 0)


def ritaglia(im, fg, nome):
    """Un pezzo del foglio come dice il foglietto: il rettangolo, le
    correzioni (`cancella`), la misura del gioco, e poi stretto sull'alfa
    — il margine del rettangolo serve a prendere il disegno anche dove un
    rivestimento l'ha spostato di qualche pixel, e non arriva al gioco."""
    # `da` si conta in celle del foglietto, `cella` è la misura del pezzo,
    # e tutti e due si moltiplicano per la scala: com'è in FORMATO.md
    d = fg['sprite'][nome]
    sc = fg.get('scala', 1)
    gx, gy = fg.get('cella', [1, 1])
    cw, ch = d.get('cella', [gx, gy])
    x, y = d['da'][0] * gx * sc, d['da'][1] * gy * sc
    w, h = cw * sc, ch * sc
    pz = im.crop((x, y, x + w, y + h))
    if d.get('tasche') and fg.get('fondo') == 'scacchiera':
        # la scacchiera chiusa dentro il pezzo — fra le traverse di una
        # staccionata — dove l'allagamento non arriva. Sul foglio intero
        # non si può: un grigio chiaro è anche un fiore bianco o una pietra
        # del castello. Quindi lo dichiara il pezzo, e vale solo lì
        pz = pz.copy()
        tasche(pz.load(), pz.width, pz.height, lambda c: max(c[:3]) - min(c[:3]) < 16 and min(c[:3]) > 150)
        sfrangia(pz.load(), pz.width, pz.height, lambda c: max(c[:3]) - min(c[:3]) < 24 and min(c[:3]) > 120)
    if d.get('cancella'):
        dr = ImageDraw.Draw(pz)
        for a, b, cw, ch in d['cancella']:
            dr.rectangle([a, b, a + cw - 1, b + ch - 1], fill=(0, 0, 0, 0))
    mw, mh = d.get('misura', [w, h])
    if (mw, mh) != pz.size:
        pz = pz.resize((mw, mh), Image.LANCZOS)
        # l'orlo che la riduzione lascia quasi trasparente: sotto un
        # ottavo è un alone, non un pezzo
        pz.putalpha(pz.getchannel('A').point(lambda v: 0 if v < 32 else v))
    tieni = pz.getchannel('A').getbbox()
    return pz.crop(tieni) if tieni else pz


def rettilineo(im, fg):
    """Il tratto dritto della strada, già centrato: una cella di largo, e
    la striscia nel mezzo. Il centro **si misura** — dove il profilo della
    strada è più simmetrico — perché i rivestimenti spostano il disegno di
    qualche pixel, e una strada presa storta avrebbe l'orlo più largo da
    una parte che dall'altra."""
    s = ritaglia(im, fg, 'strada').convert('RGB')
    d = fg['sprite']['strada']
    px = s.load()
    cols = [tuple(sum(px[x, y][i] for y in range(s.height)) / s.height for i in range(3))
            for x in range(s.width)]
    m = s.width // 2
    diff = lambda a, b: sum(abs(a[i] - b[i]) for i in range(3))
    centro = min(range(m - 8, m + 9),
                 key=lambda c: sum(diff(cols[c - k], cols[c + k]) for k in range(1, 26)))
    x0 = centro - C // 2
    return s.crop((x0, 0, x0 + C, s.height)), d['striscia'], d.get('sfuma', 0)


def quiete(pz, evita):
    """Quanto c'è di quello che il foglietto dice di evitare, in un pezzo:
    `"acceso"` sono i cristalli arancioni della lava — chiesti via, e
    arrivati lo stesso — che su un fondo ripetuto sembrano gemme sparse."""
    if evita != 'acceso':
        return 0
    d = pz.convert('RGB').tobytes()
    return sum(1 for i in range(0, len(d), 3) if max(d[i], d[i + 1], d[i + 2]) > 200 and d[i] > d[i + 1] + 60)


def toppe_dall_interno(fondo, n, seme, evita=None):
    """`n` toppe da `TOPPA` px dall'interno di un fondo del foglio. I fondi
    veri hanno **un orlo** — un bordo d'erba, di neve, di sassi — e non si
    ripetono come piastrelle: il foglietto ne prende l'interno, e qui se ne
    ritagliano finestre sparse, metà girate a specchio. Con `evita` si
    tengono le finestre più tranquille fra tante provate."""
    lx, ly = fondo.width - TOPPA + 1, fondo.height - TOPPA + 1
    posti = [((k * 37 + seme * 23) % lx, (k * 53 + seme * 31) % ly) for k in range(n * (4 if evita else 1))]
    if evita:
        posti = sorted(posti, key=lambda q: quiete(fondo.crop((*q, q[0] + TOPPA, q[1] + TOPPA)), evita))[:n]
    fuori = []
    for k, (ox, oy) in enumerate(posti):
        t = fondo.crop((ox, oy, ox + TOPPA, oy + TOPPA)).convert('RGB')
        fuori.append(t.transpose(Image.FLIP_LEFT_RIGHT) if k % 2 else t)
    return fuori


def pezzi_dal_foglio(vestito):
    """Gli stessi pezzi di `pezzi()`, presi dal foglio: stesse chiavi, e in
    più quelle che la scena non ha (`stagno`, `stagnetto`, `qua`,
    `grande`, `terra`). None se il foglio di quel vestito non c'è."""
    trovato = foglio_del_terreno(vestito)
    if not trovato:
        return None
    png, fg = trovato
    fondo = fg.get('fondo', 'trasparente')
    im = senza_fondo(png, tuple(fondo) if isinstance(fondo, list) else fondo)
    pz = lambda nome: ritaglia(im, fg, nome)
    famiglia = lambda pref: [pz(k) for k in sorted(fg['sprite'], key=lambda s: (len(s), s))
                             if k.startswith(pref + '-') and k[len(pref) + 1:].isdigit()]
    p = {'dal_foglio': True}
    striscia, (a, b), sfuma = rettilineo(im, fg)
    p['strada'] = {vv: [cella_di_strada(striscia, vv, g, a, b, sfuma) for g in range(3)] for vv in VERSI}
    # quante toppe: dall'interno di un quadrato ne escono poche diverse
    # davvero, e ognuna pesa nel file unico — dieci, e metà girate
    evita = lambda nome: fg['sprite'][nome].get('evita')
    p['prato'] = toppe_dall_interno(pz('fondo'), 10, 1, evita('fondo'))
    p['fondo'] = p['prato'][0]
    p['qua'] = toppe_dall_interno(pz('fondo-qua'), 6, 2, evita('fondo-qua'))
    p['fitto'] = toppe_dall_interno(pz('fitto'), 10, 3, evita('fitto'))
    p['piazzola'] = famiglia('piazzola')
    p['albero'] = famiglia('albero')
    p['decoro'] = famiglia('decoro')
    p['grande'] = famiglia('decoro-grande')
    p['terra'] = famiglia('terra')
    for nome in ('bocca', 'castello', 'lago', 'stagno', 'stagnetto'):
        p[nome] = pz(nome)
    return p


def pezzi_del_vestito(vestito):
    """I pezzi di un vestito: dal suo foglio se c'è, se no dalla scena."""
    return pezzi_dal_foglio(vestito) or pezzi(Image.open(GENERATI / SCENE[vestito]).convert('RGB'))


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


def acqua(p, x0, x1, alto, w):
    """Il pezzo d'acqua per uno specchio che va da `x0` a `x1`: il lago
    dal bordo se tocca un bordo (girato se è quello di sinistra), lo
    stagno del foglio se c'è, e se no la metà di sinistra del lago col
    suo specchio — così la riva c'è da tutti e due i lati."""
    if x1 == w:
        return p['lago']
    if x0 == 0:
        return p['lago'].transpose(Image.FLIP_LEFT_RIGHT)
    if 'stagno' in p:
        piccolo = x1 - x0 <= 2 and alto <= 2 and 'stagnetto' in p
        return p['stagnetto' if piccolo else 'stagno']
    lago = p['lago']
    m = lago.crop((0, 0, lago.width // 2, lago.height))
    s = Image.new('RGBA', (m.width * 2, m.height))
    s.paste(m, (0, 0))
    s.paste(m.transpose(Image.FLIP_LEFT_RIGHT), (m.width, 0))
    return s


def grandi_e_terra(righe, n_grandi, n_terra, misure_terra):
    """Dove vanno i decori grandi e le cose per terra: due distrazioni che
    ha solo il foglio, e che la carta non scrive — le deduce il vestito
    dai `d` e dal prato, con `caso()` come tutto il resto. **È la stessa
    regola di `grandiETerra` in `scena/vestito.js`.**

      · un decoro grande prende il posto di un `d` (uno su due) che ha
        libero il quadrato di 2×2 in giù a destra — fondo, non fitto né
        acqua — e **lontano una cella da strada, piazzole, bocca e
        castello**: le distrazioni non toccano il gioco (`carta.js`), e
        un masso da due celle attaccato alla strada lo toccherebbe;
      · una cosa per terra sta su una cella di fondo su cinque, **dentro
        la sua cella**: niente sborda sulla strada o su una piazzola.

    Torna ({(x, y): quale decoro grande}, [(x, y, quale, dx, dy)])."""
    h, w = len(righe), len(righe[0])

    def a(i, j):
        return righe[j][i] if 0 <= i < w and 0 <= j < h else None
    grandi, prese = {}, set()
    for y in range(h):
        for x in range(w):
            if not n_grandi or a(x, y) != 'd' or caso(x, y, 2, 12):
                continue
            blocco = [(x, y), (x + 1, y), (x, y + 1), (x + 1, y + 1)]
            if any(a(i, j) not in ('.', ',') for i, j in blocco[1:]):
                continue
            if any(a(i + dx, j + dy) in ('+', 'o', 'A', 'C') for i, j in blocco
                   for dx in (-1, 0, 1) for dy in (-1, 0, 1)):
                continue
            grandi[(x, y)] = caso(x, y, n_grandi, 3)
            prese.update(blocco)
    terra = []
    for y in range(h):
        for x in range(w):
            if not n_terra or a(x, y) not in ('.', ',') or (x, y) in prese or caso(x, y, 5, 13):
                continue
            k = caso(x, y, n_terra, 14)
            tw, th = misure_terra[k]
            terra.append((x, y, k, caso(x, y, C - tw + 1, 15), caso(x, y, C - th + 1, 16)))
    return grandi, terra


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
    im.paste(p['fondo'].convert('RGB').resize((w * C, h * C)), (0, 0))
    for x, y in celle:
        toppa(p['prato'][caso(x, y, len(p['prato']))], x, y)
    # il fondo con qualcosa in più, dove la carta lo chiede e il foglio ce
    # l'ha (la scena no: lì le `,` restano prato)
    if p.get('qua'):
        for x, y in celle:
            if a(x, y) == ',':
                toppa(p['qua'][caso(x, y, len(p['qua']), 8)], x, y)
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
            s = acqua(p, x0, x1, y1 - y0, w)
            s = s.resize(((x1 - x0) * C, (y1 - y0) * C), Image.LANCZOS)
            im.paste(s, (x0 * C, y0 * C), s)
    # 4 — la strada e le piazzole (nel mezzo della cella: quelle del foglio
    #     sono più strette di una cella)
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
                im.paste(pz, (x * C + (C - pz.width) // 2, y * C + (C - pz.height) // 2), pz)
    # 4b — le cose per terra: piatte, sotto a tutte le figure
    grandi, terra = grandi_e_terra(righe, len(p.get('grande', [])), len(p.get('terra', [])),
                                   [t.size for t in p.get('terra', [])])
    for x, y, k, dx, dy in terra:
        pz = p['terra'][k]
        im.paste(pz, (x * C + dx, y * C + dy), pz)
    # 5 — le figure, dall'alto in basso: chi sta più giù copre chi sta su
    figure = []
    for y in range(h):
        for x in range(w):
            c = a(x, y)
            if (x, y) in grandi:
                # un decoro grande: in mezzo alle sue due colonne, coi piedi
                # in fondo alla seconda riga
                pz = p['grande'][grandi[(x, y)]]
                figure.append(((y + 1) * C, pz, x * C + C - pz.width // 2, (y + 2) * C - 6 - pz.height))
            elif c == 'd':
                pz = p['decoro'][caso(x, y, len(p['decoro']), 3)]
                figure.append((y * C, pz, x * C + (C - pz.width) // 2, y * C + (C - pz.height) // 2 - 8))
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
                    pz = p['albero'][caso(x, y, len(p['albero']), 6 + k)]
                    figure.append((y * C + sy, pz, x * C + (C - pz.width) // 2 + sx,
                                   y * C + (C - pz.height) // 2 + sy - 8))
    for _, pz, px_, py_ in sorted(figure, key=lambda f: f[0]):
        im.paste(pz, (px_, py_), pz)
    # 6 — la bocca e il castello
    for y in range(h):
        for x in range(w):
            if a(x, y) == 'A' and a(x - 1, y) != 'A' and a(x, y - 1) != 'A':
                b = p['bocca']
                if p.get('dal_foglio'):
                    # la tana del foglio è una figura intera, col suo
                    # sentiero in fondo: nel mezzo delle tre colonne, e coi
                    # piedi un quarto di cella dentro la prima riga di
                    # strada, che ci si infila sotto
                    im.paste(b, (x * C + (3 * C - b.width) // 2, (y + 2) * C + C // 4 - b.height), b)
                else:
                    im.paste(b, (x * C, y * C), b)
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


def provino(p, uscita):
    """Tutti i pezzi di un vestito, in fila per famiglia: è da qui che si
    vede se una figura ha preso mezzo sasso del vicino. `p` sono i pezzi
    di una scena (`pezzi`) o di un foglio (`pezzi_dal_foglio`)."""
    file = [('strada ' + k, v) for k, v in p['strada'].items()] + [
        (fam, p[fam]) for fam in ('prato', 'qua', 'fitto', 'piazzola', 'albero', 'decoro', 'grande', 'terra')
        if p.get(fam)] + [
        ('bocca, castello, acqua', [p[k] for k in ('bocca', 'castello', 'lago', 'stagno', 'stagnetto') if k in p])]
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


# ── l'atlante per il gioco ───────────────────────────────────────────
#
# Due moduli, e tutti e due si scrivono da qui:
#
#   vestiti.js  i pezzi delle tre scene. **Le misure sono le stesse**
#               nelle tre (la geometria è una, rivestita), quindi la
#               tabella dei rettangoli è una sola e le immagini tre.
#               Le toppe, lo stagno e la bocca hanno già l'alfa sfumato
#               dentro: nel browser una maschera sfumata costerebbe un
#               canvas a parte per ogni toppa posata.
#   figure.js   le torri (dal foglio di agosto, `prova-battaglia.py`) e
#               i mostri coi quattro fotogrammi del respiro (dai fogli
#               del sotterraneo). Alla misura del foglio: una cella da
#               64 px è 16 pixel del disegno anche lì.
#
# WebP con l'alfa e non PNG: sono pezzi di scene dipinte, non pixel art
# a blocchi, e il PNG li pagava tre volte tanto. Quanto pesano lo scrive
# il modulo in testa, e lo stampa il comando.

REPO = Path(__file__).resolve().parents[2]
DATI = REPO / 'src' / 'giochi' / 'castello' / 'dati'
SCENE = {'bosco': 'td_1.png', 'neve': 'td_2.png', 'lava': 'td_3.png'}
QUALITA = 85
# Le figure si pagano di più: quaranta creature da quattro fotogrammi
# sono quasi tutto il peso del castello. A 80 non si distingue da 85 alla
# misura del campo, e il file scende di un settimo.
QUALITA_FIGURE = 80


def prova_battaglia():
    """`prova-battaglia.py` col trattino non si importa per nome: le
    tabelle delle torri e dei mostri stanno lì, e restano lì."""
    spec = importlib.util.spec_from_file_location('prova_battaglia', Path(__file__).parent / 'prova-battaglia.py')
    m = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(m)
    return m


def impacchetta(misure, largo=1024, spazio=2):
    """Scaffali: i pezzi dal più alto al più basso, in file da sinistra a
    destra. Non è il più stretto possibile, ma è stabile — stessi pezzi,
    stesso atlante — ed è quello che serve a un file generato che finisce
    nei diff."""
    ordine = sorted(misure, key=lambda k: (-misure[k][1], -misure[k][0], k))
    posti, x, y, riga = {}, 0, 0, 0
    for k in ordine:
        w, h = misure[k]
        if x + w > largo:
            x, y, riga = 0, y + riga + spazio, 0
        posti[k] = (x, y, w, h)
        x += w + spazio
        riga = max(riga, h)
    return posti, y + riga


def webp(im, qualita=QUALITA):
    buf = io.BytesIO()
    im.save(buf, 'WEBP', quality=qualita, method=6)
    return buf.getvalue()


def pezzi_da_atlante(vestito):
    """I pezzi di un vestito come li vuole il gioco: con un nome ciascuno,
    e l'alfa già dentro. Dal foglio del terreno se c'è, se no dalla scena
    (`pezzi_del_vestito`)."""
    p = pezzi_del_vestito(vestito)
    fuori = {}
    for vv, varianti in p['strada'].items():
        for g, im in enumerate(varianti):
            fuori[f'strada:{vv}:{g}'] = im.convert('RGBA')
    for fam in ('prato', 'fitto', 'qua'):
        for i, im in enumerate(p.get(fam, [])):
            t = im.convert('RGBA')
            t.putalpha(sfumatura(TOPPA, TOPPA))
            fuori[f'{fam}:{i}'] = t
    for fam in ('piazzola', 'albero', 'decoro', 'grande', 'terra'):
        for i, im in enumerate(p.get(fam, [])):
            fuori[f'{fam}:{i}'] = im
    # l'acqua ha già la sua alfa: sfumata se viene dalla scena, la riva
    # vera se viene dal foglio
    for nome in ('bocca', 'castello', 'lago', 'stagno', 'stagnetto'):
        if nome in p:
            fuori[nome] = p[nome]
    # il primo strato, sotto tutte le toppe, tirato su tutto il campo
    fuori['fondo'] = p['fondo'].convert('RGBA')
    quanti = {fam: len(p.get(fam, [])) for fam in ('prato', 'fitto', 'qua', 'piazzola', 'albero', 'decoro',
                                                   'grande', 'terra')}
    return fuori, quanti, bool(p.get('dal_foglio'))


# ── le torri ─────────────────────────────────────────────────────────
#
# Dal foglio nuovo se c'è (`sorgenti/castello/generati/torri-1.png`, il
# prompt 2 di `DA-GENERARE.md`), se no dal foglio di agosto `PVX1O.png`
# con la tabella di `prova-battaglia.py`. Il foglio nuovo è tornato **fuori
# ordine** e con le figure **tutte grandi uguali**, su una griglia regolare
# di cinque per quattro: quale figura è quale torre, di quanto cresce e le
# due correzioni (il disco d'erba sotto, il verde fatto mezzo trasparente)
# le dice il suo foglietto, `torri-1.json`.

TORRI_NUOVE = GENERATI / 'torri-1.png'


def senza_erba(im):
    """Toglie quello che resta del disco d'erba sotto una torre: il verde
    che si raggiunge dal trasparente **passando per il verde**, e solo nel
    quarto basso della figura. I soldati vestiti di verde e la melma del
    veleno sono chiusi dal contorno scuro; l'alone verde del napalm sta
    all'altezza della bocca del cannone, sopra quel quarto."""
    px = im.load()
    w, h = im.size
    da = h * 3 // 4
    erba = lambda c: c[3] and c[1] > c[0] + 12 and c[1] > c[2] + 20 and c[1] > 60
    coda = [(x, y) for y in range(da, h) for x in range(w)
            if not px[x, y][3] and any(0 <= x + dx < w and da <= y + dy < h and erba(px[x + dx, y + dy])
                                       for dx, dy in ((1, 0), (-1, 0), (0, 1), (0, -1)))]
    via = 0
    while coda:
        x, y = coda.pop()
        for p, q in ((x + 1, y), (x - 1, y), (x, y + 1), (x, y - 1)):
            if 0 <= p < w and da <= q < h and erba(px[p, q]):
                px[p, q] = (0, 0, 0, 0)
                via += 1
                coda.append((p, q))
    return via


def figure_della_griglia(im, col, rig, soglia=24):
    """{(riga, colonna): figura} di un foglio a griglia regolare. Una
    figura non è il rettangolo della sua cella: la fiamma del cannone di
    r3c4 sale dentro la cella di sopra, e ritagliando le celle la brina si
    ritrovava in fondo un pezzo di fuoco. Quindi si prendono le macchie
    d'alfa, e ognuna va alla cella dove cade **il suo centro**; poi ogni
    figura si stringe sulle sue macchie, anche oltre il bordo della cella."""
    w, h = im.size
    a = im.getchannel('A').tobytes()
    visti = bytearray(w * h)
    cw, ch = w / col, h / rig
    macchie = {}
    for i0 in range(w * h):
        if visti[i0] or a[i0] < soglia:
            continue
        visti[i0] = 1
        coda, pz = [i0], []
        while coda:
            i = coda.pop()
            pz.append(i)
            x, y = i % w, i // w
            for dx, dy in ((1, 0), (-1, 0), (0, 1), (0, -1), (1, 1), (-1, -1), (1, -1), (-1, 1)):
                p, q = x + dx, y + dy
                j = q * w + p
                if 0 <= p < w and 0 <= q < h and not visti[j] and a[j] >= soglia:
                    visti[j] = 1
                    coda.append(j)
        xs = [i % w for i in pz]
        ys = [i // w for i in pz]
        cella = (min(rig - 1, int((min(ys) + max(ys)) / 2 / ch)), min(col - 1, int((min(xs) + max(xs)) / 2 / cw)))
        macchie.setdefault(cella, []).extend(pz)
    fuori = {}
    for cella, pz in macchie.items():
        xs = [i % w for i in pz]
        ys = [i // w for i in pz]
        x0, y0, x1, y1 = min(xs), min(ys), max(xs) + 1, max(ys) + 1
        maschera = Image.new('L', (x1 - x0, y1 - y0))
        pm = maschera.load()
        for i in pz:
            pm[i % w - x0, i // w - y0] = 255
        f = Image.new('RGBA', maschera.size, (0, 0, 0, 0))
        f.paste(im.crop((x0, y0, x1, y1)), (0, 0), maschera)
        fuori[cella] = f
    return fuori


def torri_dal_foglio(png=TORRI_NUOVE):
    fg = json.loads(png.with_suffix('.json').read_text())
    im = Image.open(png).convert('RGBA')
    col, rig = fg['griglia']
    tagli = {}
    for (r, c), pz in figure_della_griglia(im, col, rig).items():
        if fg.get('pieno'):
            # il verde fatto mezzo trasparente dal ritaglio del disco:
            # sopra la soglia pieno, sotto resta com'è (gli aloni)
            pz.putalpha(pz.getchannel('A').point(lambda v, s=fg['pieno']: 255 if v >= s else v))
        if fg.get('erba'):
            senza_erba(pz)
        tieni = pz.getchannel('A').point(lambda v: 255 if v >= 24 else 0).getbbox()
        tagli[(r, c)] = pz.crop(tieni)
    fuori = {}
    for chiave, (r, c) in fg['figure'].items():
        s = fg['scala'][chiave.split(':')[1]]
        f = tagli[(r, c)]
        fuori[f'torre:{chiave}'] = f.resize((round(f.width * s), round(f.height * s)), Image.LANCZOS)
    return fuori


def torri_di_agosto():
    pb = prova_battaglia()
    foglio = Image.open(pb.FOGLIO_TORRI).convert('RGBA')
    fuori = {}
    for (tipo, stadio, ramo), (col, riga) in pb.FIGURE.items():
        fuori[f'torre:{tipo}:{stadio}:{ramo or ""}'] = pb.torre(foglio, col, riga)
    # la torre salita senza aver preso un ramo (le tappe senza rami): la
    # sua colonna, allo stadio che ha
    for tipo, col in (('arciere', 'Archer'), ('magica', 'Magic'), ('ghiaccio', 'Frost'), ('bombe', 'Bomb')):
        for stadio in (1, 2):
            fuori[f'torre:{tipo}:{stadio}:'] = pb.torre(foglio, col, stadio)
    return fuori


# ── i mostri ─────────────────────────────────────────────────────────
#
# Le creature che il bestiario del castello nomina
# (`src/giochi/castello/scena/bestiario.js`), coi fotogrammi del
# respiro: quelle che il sotterraneo ha già dai suoi foglietti, le altre
# da `creature-castello.json` qui accanto (perché lì e non nei foglietti
# lo dice il suo `__`). `unita/castello-bestiario` pretende che le due
# liste — chi il bestiario nomina e chi l'atlante porta — siano la
# stessa.
#
# **I mostri che camminano** (prompt 5 di `DA-GENERARE.md`): quando c'è
# un foglio `mostri-cammino-<lettera>.png` accanto ai fogli del
# sotterraneo, le sue righe sono le creature di `CAMMINO[lettera]`, in
# quell'ordine, ognuna coi quattro passi di lato e i quattro di fronte.
# Chi cammina lascia a casa il respiro: i pittori lo usano solo dove i
# passi non ci sono.

MOSTRI_SOT = Path(__file__).parent / 'sorgenti' / 'sotterraneo' / 'generati'
CREATURE_CASTELLO = Path(__file__).parent / 'creature-castello.json'
CAMMINO = {
    'A': ['melma', 'scheletro-scudo', 'pipistrello', 'fantasma', 'ragno', 'lupo'],
    'B': ['golem', 'troll', 'scheletro', 'drago', 'grifone', 'pianta'],
    'C': ['serpente', 'scorpione', 'ombra', 'draghetto', 'zombie', 'pipistrello-occhio'],
    'D': ['golem-magma', 'occhio', 'spirito-fuoco', 'granchio', 'bestia-cornuta', 'negromante'],
    'E': ['golem-lava', 'diavoletto', 'melma-viola', 'mostro-viola'],
    'F': ['melma-rosa', 'mummia', 'fantasma-azzurro', 'cinghiale', 'golem-pietra', 'teschio-azzurro'],
    'G': ['golem-ghiaccio', 'tornado', 'ent', 'spirito-elettrico', 'drago-lava', 'tartaruga'],
}


def foglio_del_cammino(lettera):
    return MOSTRI_SOT / f'mostri-cammino-{lettera}.png'


def cammino_dai_fogli():
    """I passi di chi ha il suo foglio: `mostro:<creatura>:lato:<i>` e
    `…:fronte:<i>`. Ogni metà si ritaglia con la sua altezza comune, così
    i piedi restano sulla stessa linea da un passo all'altro."""
    fuori, chi = {}, []
    for lettera, elenco in CAMMINO.items():
        png = foglio_del_cammino(lettera)
        if not png.exists():
            continue
        im = righe.senza_alone(Image.open(png))
        rr = righe.righe_di_figure(im)
        righe.conta(rr, len(elenco), 8, png)
        for creatura, riga in zip(elenco, rr):
            for verso, passi in (('lato', riga[:4]), ('fronte', riga[4:])):
                ya, yb = righe.banda(passi)
                for i, (x, _, w, _) in enumerate(passi):
                    fuori[f'mostro:{creatura}:{verso}:{i}'] = im.crop((x, ya, x + w, yb))
            chi.append(creatura)
    return fuori, chi


# Sotto quest'alfa un pixel dei fogli del sotterraneo è il bagliore
# colorato che il generatore ci ha messo dietro ogni riga, non la
# creatura: il corpo sta quasi tutto sopra 128 e l'orlo morbido fra 64 e
# 128. Tolto, non fa l'alone sul campo e il WebP pesa un sesto di meno.
BAGLIORE = 64


def creature_col_respiro(senza=()):
    """{creatura: [fotogrammi]} del respiro, per chi non cammina."""
    tab = json.loads(CREATURE_CASTELLO.read_text())
    fogli = {n: righe.senza_alone(Image.open(MOSTRI_SOT / f'{n}.png'), BAGLIORE)
             for n in ('mostri-1', 'mostri-2')}
    fuori = {}
    for nome in ('mostri-1', 'mostri-2'):
        f = json.loads((MOSTRI_SOT / f'{nome}.json').read_text())
        sc = f['scala']
        for loro in tab['dai_foglietti']:
            quadri = []
            for i in range(8):
                d = f['sprite'].get(f'{loro}-fermo-{i}')
                if not d:
                    break
                (x, y), (w, h) = d['da'], d['cella']
                quadri.append(fogli[nome].crop((x * sc, y * sc, (x + w) * sc, (y + h) * sc)))
            if quadri:
                fuori[loro] = quadri
    for loro, d in tab['creature'].items():
        fuori[loro] = [fogli[d['foglio']].crop((x, y, x + w, y + h)) for x, y, w, h in d['fotogrammi']]
    mancano = [k for k in tab['dai_foglietti'] if k not in fuori]
    if mancano:
        raise SystemExit(f'creature-castello.json: non nei foglietti del sotterraneo: {", ".join(mancano)}')
    return {k: v for k, v in sorted(fuori.items()) if k not in senza}


AVVISO_TORRI = '''
                  ⚠ `PVX1O.png` (il foglio di agosto) ha la provenienza non
                  documentata: non si pubblica. Manca `torri-1.png`'''


def figure_da_atlante():
    torri = torri_dal_foglio() if TORRI_NUOVE.exists() else torri_di_agosto()
    passi, camminano = cammino_dai_fogli()
    fuori = dict(torri)
    fuori.update(passi)
    respiro = creature_col_respiro(senza=camminano)
    for loro, quadri in respiro.items():
        for i, im in enumerate(quadri):
            fuori[f'mostro:{loro}:{i}'] = im
    creature = sorted(set(respiro) | set(camminano))
    return fuori, creature, {'torri': 'torri-1.png' if TORRI_NUOVE.exists() else 'PVX1O.png (agosto)',
                             'camminano': len(camminano)}


def provino_creature(uscita):
    """Tutte le creature del castello coi loro fotogrammi, e il riquadro
    di ognuno: è da qui che si vede un ritaglio che ha preso il vicino."""
    tutte = creature_col_respiro()
    passi, _ = cammino_dai_fogli()
    for k, im in passi.items():
        _, chi, verso, i = k.split(':')
        tutte.setdefault(f'{chi} {verso}', []).append(im)
    voci = list(tutte.items())
    alto = sum(max(im.height for im in q) + 22 for q in voci[::2]) + 20
    P = Image.new('RGBA', (1500, alto), (70, 74, 80, 255))
    d = ImageDraw.Draw(P)
    y = [10, 10]
    for n, (chi, quadri) in enumerate(voci):
        col = n % 2
        x = 10 + col * 750
        d.text((x, y[col]), chi, fill=(255, 255, 200))
        for im in quadri:
            d.rectangle([x - 1, y[col] + 13, x + im.width, y[col] + 14 + im.height], outline=(255, 80, 80))
            P.alpha_composite(im, (x, y[col] + 14))
            x += im.width + 6
        y[col] += max(im.height for im in quadri) + 22
    P.crop((0, 0, 1500, max(y))).convert('RGB').save(uscita)


def provino_foglio(vestito, uscita):
    """Il foglio del terreno coi rettangoli del foglietto sopra, e il nome
    di ogni pezzo: si guarda questo per ritoccare `da` e `cella`."""
    trovato = foglio_del_terreno(vestito)
    if not trovato:
        raise SystemExit(f'manca {GENERATI / f"terreno-{vestito}.png"}')
    png, fg = trovato
    f = fg.get('fondo', 'trasparente')
    # sul foglio già scontornato: è così che si vede se il fondo se n'è
    # andato tutto, e se si è portato via un pezzo di qualcos'altro
    im = senza_fondo(png, tuple(f) if isinstance(f, list) else f)
    fondo = Image.new('RGBA', im.size, (70, 74, 80, 255))
    fondo.alpha_composite(im)
    d = ImageDraw.Draw(fondo)
    sc = fg.get('scala', 1)
    gx, gy = fg.get('cella', [1, 1])
    for nome, s in fg['sprite'].items():
        x, y = s['da'][0] * gx * sc, s['da'][1] * gy * sc
        w, h = s.get('cella', [gx, gy])
        d.rectangle([x, y, x + w * sc - 1, y + h * sc - 1], outline=(255, 60, 60), width=2)
        d.text((x + 3, y + 2), nome, fill=(255, 255, 120))
    fondo.convert('RGB').save(uscita)


def js_tabella(posti, rientro='  '):
    righe_ = [f"{rientro}'{k}': [{x}, {y}, {w}, {h}]," for k, (x, y, w, h) in sorted(posti.items())]
    return '{\n' + '\n'.join(righe_) + '\n' + rientro[:-2] + '}'


def atlante():
    DATI.mkdir(parents=True, exist_ok=True)
    # ── i vestiti ──
    # Una tabella per vestito: finché vengono tutti dalle scene sono la
    # stessa (la geometria è una, rivestita), ma il giorno che uno ha il
    # suo foglio i suoi pezzi hanno altre misure e altri numeri.
    immagini, pesi, tabelle, quanti, fonti, dal_foglio = {}, {}, {}, {}, {}, {}
    for nome in SCENE:
        pz, q, dal_foglio[nome] = pezzi_da_atlante(nome)
        posti, alto = impacchetta({k: im.size for k, im in pz.items()})
        foglio = Image.new('RGBA', (1024, alto), (0, 0, 0, 0))
        for k, im in pz.items():
            foglio.paste(im, posti[k][:2])
        dati = webp(foglio)
        immagini[nome] = base64.b64encode(dati).decode()
        pesi[nome] = round(len(dati) / 1024)
        tabelle[nome], quanti[nome] = posti, q
        fonti[nome] = f'terreno-{nome}.png' if foglio_del_terreno(nome) else SCENE[nome]
    tot = sum(pesi.values())
    testa = f"""/* GENERATO da strumenti/sprite/vesti.py --atlante — non si scrive a mano.

   I pezzi con cui `scena/vestito.js` compone il campo del castello a
   celle, uno per vestito. Da dove vengono:
{chr(10).join(f'     {k:6} {v}' for k, v in fonti.items())}
   Una scena (`td_1.png`…) è **il provvisorio**, coi ritagli di
   `vesti.py`; un foglio del terreno (`terreno-<vestito>.png`, il prompt
   2 della scheda del castello) è quello vero. Tutti e due stanno in
   `strumenti/sprite/sorgenti/castello/generati/`.

   PEZZI    vestito → nome → [x, y, largo, alto]
              strada:<versi>:<variante>   una cella da {C} px, coi lati da
                                          cui la strada prosegue (N E S O)
              prato:<n> fitto:<n> qua:<n> toppe da {TOPPA} px, già sfumate
                                          (`qua` solo dal foglio: il fondo
                                          con qualcosa in più)
              piazzola:<n> albero:<n> decoro:<n>   figure scontornate
              grande:<n>                  decori da due celle, solo dal foglio
              terra:<n>                   cose per terra, solo dal foglio
              bocca castello fondo
              lago                        l'acqua che entra dal bordo,
                                          riva a sinistra
              stagno stagnetto            l'acqua in mezzo, solo dal foglio
   QUANTI   vestito → quante varianti ha ogni famiglia
   DAL_FOGLIO vestito → true se i pezzi vengono dal foglio: la bocca è
            una figura intera da posare, non un ritaglio di tre celle
   SCENE    vestito → immagine WebP in base64. Pesano {' · '.join(f'{k} {v} KB' for k, v in pesi.items())},
            {tot} KB in tutto (in base64 un terzo di più).
*/
"""
    corpo = (testa +
             f'export const CELLA = {C}\n'
             f'export const TOPPA = {TOPPA}\n'
             f'export const VERSI = {json.dumps(list(VERSI))}\n'
             f'export const DAL_FOGLIO = {json.dumps(dal_foglio)}\n'
             'export const QUANTI = {\n' +
             ''.join(f'  {k}: {json.dumps(v)},\n' for k, v in quanti.items()) + '}\n'
             'export const PEZZI = {\n' +
             ''.join(f'  {k}: {js_tabella(v, "    ")},\n' for k, v in tabelle.items()) + '}\n'
             'export const SCENE = {\n' +
             ''.join(f"  {k}: 'data:image/webp;base64,{v}',\n" for k, v in immagini.items()) +
             '}\n')
    (DATI / 'vestiti.js').write_text(corpo)
    print(f'vestiti.js: {" · ".join(f"{k} {v} KB da {fonti[k]}" for k, v in pesi.items())} di WebP')

    # ── le figure ──
    pz, creature, fonte = figure_da_atlante()
    posti, alto = impacchetta({k: im.size for k, im in pz.items()}, largo=1024)
    foglio = Image.new('RGBA', (1024, alto), (0, 0, 0, 0))
    for k, im in pz.items():
        foglio.paste(im, posti[k][:2])
    dati = webp(foglio, QUALITA_FIGURE)
    kb = round(len(dati) / 1024)
    testa = f"""/* GENERATO da strumenti/sprite/vesti.py --atlante — non si scrive a mano.

   Le torri e i mostri del castello a celle (una cella da {C} px). I
   mostri sono alla misura dei loro fogli; le torri alla scala del loro
   stadio, perché sul foglio sono tutte grandi uguali.

     torre:<aspetto>:<stadio>:<ramo>   da {fonte['torri']}{AVVISO_TORRI if fonte['torri'].startswith('PVX1O') else ''}. Il ramo vuoto
                  è la torre salita senza averne preso uno: quale figura
                  è quale torre lo dice `torri-1.json`, accanto al foglio.
     mostro:<creatura>:<fotogramma>   il respiro, dai fogli del sotterraneo
                  (`mostri-1.png`, `mostri-2.png`): le coordinate stanno nei
                  suoi foglietti e in `strumenti/sprite/creature-castello.json`.
     mostro:<creatura>:lato:<passo>, …:fronte:<passo>   i passi, dai fogli
                  `mostri-cammino-*.png` quando ci sono ({fonte['camminano']} creature oggi).
                  Chi ha i passi non ha il respiro.

   Quale creatura per quale mostro, vestito per vestito, lo dice
   `scena/bestiario.js`. Il WebP pesa {kb} KB.
*/
"""
    corpo = (testa +
             f'export const CREATURE = {json.dumps(creature)}\n'
             f'export const PEZZI = {js_tabella(posti)}\n'
             f"export const IMMAGINE = 'data:image/webp;base64,{base64.b64encode(dati).decode()}'\n")
    (DATI / 'figure.js').write_text(corpo)
    print(f'figure.js: {len(pz)} figure ({len(creature)} creature), {kb} KB di WebP; torri da {fonte["torri"]}')


if __name__ == '__main__':
    if len(sys.argv) == 4 and sys.argv[1] == '--provino':
        # una scena (`td_1.png`) o il nome di un vestito (`bosco`)
        quale = sys.argv[2]
        provino(pezzi_del_vestito(quale) if quale in SCENE else pezzi(Image.open(quale).convert('RGB')),
                sys.argv[3])
    elif len(sys.argv) == 4 and sys.argv[1] == '--provino-foglio':
        provino_foglio(sys.argv[2], sys.argv[3])
    elif len(sys.argv) == 3 and sys.argv[1] == '--creature':
        provino_creature(sys.argv[2])
    elif len(sys.argv) == 2 and sys.argv[1] == '--atlante':
        atlante()
    else:
        sys.exit(__doc__)
