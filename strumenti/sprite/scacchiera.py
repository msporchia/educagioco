#!/usr/bin/env python3
"""Gli schemi da allegare ai prompt di uno scenario del castello.

    python3 strumenti/sprite/scacchiera.py

È il fratello di `scenario.py`, che fa la stessa cosa per il sotterraneo.
Scrive, accanto alla scheda `sorgenti/castello/generati/PROMPT-scenario.md`,
le due immagini che la scheda dice di allegare:

  · `PROMPT-scenario-pianta.png` — la pianta della scena, 16×24 celle da
    64 px: la stessa misura dell'immagine che si chiede, cella per cella;
  · `PROMPT-scenario-foglio.png` — lo schema del foglio dei pezzi, 24×16
    celle: dove va ogni pezzo e quanto è grande.

**La pianta non sta scritta qui**: la si legge dal prompt 1 della scheda,
che è dove deve stare comunque — il generatore la riceve come testo. Due
copie diventerebbero due piante diverse.

Prima di disegnare si controlla **la regola della scacchiera**: la strada
è larga una cella e va solo a squadra, quindi una cella di strada si
attacca alle vicine per i lati e mai per gli angoli, e quattro celle di
strada non fanno mai un quadrato (sarebbe una piazza, o due corsie che si
toccano: nessuna delle due esiste nel gioco). Una pianta che la viola
chiede al generatore proprio la strada che il gioco non sa comporre.

Colori piatti e **nessuna linea di griglia**, apposta: un generatore copia
quello che vede, e una griglia disegnata qui tornerebbe come un prato a
tabella. Serve `pillow`.
"""
import re
import sys
from pathlib import Path

from PIL import Image, ImageDraw

QUI = Path(__file__).parent
CARTELLA = QUI / 'sorgenti' / 'castello' / 'generati'
SCHEDA = CARTELLA / 'PROMPT-scenario.md'

C = 64                                   # una cella, in pixel dell'immagine chiesta
LARGO, ALTO = 16, 24                     # la scena: 1024×1536, verticale
SIMBOLI = '.,^~d+oAC'
STRADA = '+'
BOCCA, CASTELLO = 'A', 'C'
PASSI = {'N': (0, -1), 'S': (0, 1), 'O': (-1, 0), 'E': (1, 0)}

COLORE = {
    '.': (118, 164, 84), ',': (146, 180, 92), '^': (42, 86, 50), '~': (70, 138, 206),
    'riva': (176, 164, 118), 'strada': (198, 172, 122), 'orlo': (138, 108, 70),
    'pietra': (156, 152, 146), 'pietra-scura': (98, 94, 90), 'buio': (26, 20, 20),
    'muro': (184, 180, 188), 'tetto': (70, 96, 170), 'cespuglio': (64, 122, 56),
    'sasso': (140, 136, 128),
}


def pianta_dalla_scheda():
    """Le 24 righe di fila fatte solo di simboli della pianta, lunghe 16."""
    riga = re.compile(r'^[%s]{%d}$' % (re.escape(SIMBOLI), LARGO))
    righe = SCHEDA.read_text().splitlines()
    for i in range(len(righe) - ALTO + 1):
        if all(riga.match(r) for r in righe[i:i + ALTO]):
            return righe[i:i + ALTO]
    raise SystemExit(f'in {SCHEDA.name} non trovo una pianta di {LARGO}×{ALTO}')


def lettore(righe):
    h, w = len(righe), len(righe[0])
    return lambda x, y: righe[y][x] if 0 <= x < w and 0 <= y < h else None


def versi(a, x, y):
    """Da dove la strada entra ed esce da questa cella. La bocca di sopra
    e il castello di sotto contano come strada: è lì che comincia e che
    finisce."""
    fuori = ''
    for v, (dx, dy) in PASSI.items():
        c = a(x + dx, y + dy)
        if c == STRADA or (v == 'N' and c == BOCCA) or (v == 'S' and c == CASTELLO):
            fuori += v
    return fuori


def guasti(righe):
    a = lettore(righe)
    h, w = len(righe), len(righe[0])
    fuori = []
    strade = [(x, y) for y in range(h) for x in range(w) if a(x, y) == STRADA]
    for x, y in strade:
        if len(versi(a, x, y)) < 2:
            fuori.append(f'({x},{y}) è un vicolo cieco: la strada deve andare da una bocca al castello')
        if all(a(x + dx, y + dy) == STRADA for dx, dy in ((1, 0), (0, 1), (1, 1))):
            fuori.append(f'({x},{y}) quattro celle di strada in quadrato: la strada è larga una cella')
    for y in range(h):
        for x in range(w):
            if a(x, y) == 'o' and not any(a(x + dx, y + dy) == STRADA for dx, dy in PASSI.values()):
                fuori.append(f'({x},{y}) piazzola lontana dalla strada: una torre lì non vede niente')
    # tutta la strada deve arrivare al castello
    arriva = {(x, y) for x, y in strade if a(x, y + 1) == CASTELLO}
    if not arriva:
        fuori.append('nessuna strada arriva al castello')
    coda = list(arriva)
    while coda:
        x, y = coda.pop()
        for dx, dy in PASSI.values():
            p = (x + dx, y + dy)
            if a(*p) == STRADA and p not in arriva:
                arriva.add(p)
                coda.append(p)
    for x, y in strade:
        if (x, y) not in arriva:
            fuori.append(f'({x},{y}) è strada ma non porta al castello')
    for x in range(w):
        if a(x, 1) == BOCCA and a(x, 2) == STRADA and a(x - 1, 1) != BOCCA:
            fuori.append(f'({x},2) la strada esce dal bordo della bocca e non dal mezzo')
    return fuori


# ── i pezzi, in colori piatti ────────────────────────────────────────

def rett(d, x0, y0, x1, y1, colore):
    d.rectangle([int(x0), int(y0), int(x1) - 1, int(y1) - 1], fill=colore)


def fondo(d, x0, y0, c, w=1, h=1):
    rett(d, x0, y0, x0 + w * C, y0 + h * C, COLORE[c])


def strada(d, x0, y0, vv):
    """Una cella di strada: il fondo della strada fino ai bordi della
    cella, e l'orlo sui lati da cui la strada non prosegue. Negli angoli
    interni — dove la strada gira o si innesta — l'orlo fa un gomito."""
    rett(d, x0, y0, x0 + C, y0 + C, COLORE['strada'])
    o = 8
    if 'N' not in vv:
        rett(d, x0, y0, x0 + C, y0 + o, COLORE['orlo'])
    if 'S' not in vv:
        rett(d, x0, y0 + C - o, x0 + C, y0 + C, COLORE['orlo'])
    if 'O' not in vv:
        rett(d, x0, y0, x0 + o, y0 + C, COLORE['orlo'])
    if 'E' not in vv:
        rett(d, x0 + C - o, y0, x0 + C, y0 + C, COLORE['orlo'])
    for a, b, dx, dy in (('N', 'O', 0, 0), ('N', 'E', C - o, 0), ('S', 'O', 0, C - o), ('S', 'E', C - o, C - o)):
        if a in vv and b in vv:
            rett(d, x0 + dx, y0 + dy, x0 + dx + o, y0 + dy + o, COLORE['orlo'])


def piazzola(d, x0, y0):
    d.ellipse([x0 + 6, y0 + 10, x0 + 57, y0 + 58], fill=COLORE['pietra-scura'])
    d.ellipse([x0 + 8, y0 + 6, x0 + 55, y0 + 50], fill=COLORE['pietra'])


def cespuglio(d, x0, y0):
    d.ellipse([x0 + 12, y0 + 14, x0 + 52, y0 + 52], fill=COLORE['cespuglio'])
    d.ellipse([x0 + 38, y0 + 36, x0 + 58, y0 + 56], fill=COLORE['sasso'])


def albero(d, x0, y0):
    """Un pezzo del fitto, alto due celle: il tronco nella cella di sotto,
    la chioma che sale su quella di sopra."""
    rett(d, x0 + 26, y0 + C + 20, x0 + 38, y0 + 2 * C - 6, (92, 62, 40))
    d.ellipse([x0 + 2, y0 + 8, x0 + 61, y0 + C + 34], fill=COLORE['^'])


def bocca(d, x0, y0):
    """Da dove arrivano i mostri: tre celle per due, e il varco nel mezzo
    della riga di sotto, dove comincia la strada."""
    d.ellipse([x0, y0, x0 + 3 * C - 1, y0 + 2 * C + 20], fill=COLORE['pietra-scura'])
    d.ellipse([x0 + C - 8, y0 + 34, x0 + 2 * C + 7, y0 + 2 * C + 30], fill=COLORE['buio'])


def castello(d, x0, y0, piede=3):
    """Il castello: cinque celle di larghezza, `piede` di pianta, e le torri
    che salgono di una cella sopra. Il portone guarda in su, dove arriva
    la strada."""
    top = y0 + (4 - piede - 1) * C
    rett(d, x0 + 8, top + C, x0 + 5 * C - 8, y0 + 4 * C - 4, COLORE['muro'])
    for tx in (0, 4):
        rett(d, x0 + tx * C + 4, top + 12, x0 + tx * C + C - 4, y0 + 4 * C - 4, COLORE['pietra'])
        d.polygon([(x0 + tx * C + 2, top + 16), (x0 + tx * C + C // 2, top - 26),
                   (x0 + tx * C + C - 2, top + 16)], fill=COLORE['tetto'])
    # il mastio sta dietro, nella riga di sotto: davanti al portone la
    # cella è della strada, e una torre lì sopra la coprirebbe
    rett(d, x0 + C + 20, top + 2 * C - 10, x0 + 4 * C - 20, y0 + 4 * C - 12, COLORE['pietra'])
    # il portone, in alto nel mezzo: la strada arriva da lì
    rett(d, x0 + 2 * C + 16, top + C, x0 + 3 * C - 16, top + C + 34, COLORE['buio'])


def stagno(d, x0, y0, w, h):
    d.ellipse([x0 + 2, y0 + 2, x0 + w * C - 3, y0 + h * C - 3], fill=COLORE['riva'])
    d.ellipse([x0 + 12, y0 + 12, x0 + w * C - 13, y0 + h * C - 13], fill=COLORE['~'])


def per_terra(d, x0, y0):
    d.ellipse([x0 + 18, y0 + 24, x0 + 46, y0 + 40], fill=COLORE['sasso'])


# ── la pianta ────────────────────────────────────────────────────────

def disegna_pianta(righe, uscita):
    im = Image.new('RGB', (LARGO * C, ALTO * C))
    d = ImageDraw.Draw(im)
    a = lettore(righe)
    # prima i fondi, poi quello che sta sopra: le figure alte (alberi,
    # bocca, castello) salgono sulla cella di sopra e vanno messe dopo
    for y in range(ALTO):
        for x in range(LARGO):
            c = a(x, y)
            x0, y0 = x * C, y * C
            fondo(d, x0, y0, ',' if c == ',' else '^' if c == '^' else '.')
            if c == '~':
                fondo(d, x0, y0, '~')
            if c == STRADA:
                strada(d, x0, y0, versi(a, x, y))
            if c == 'o':
                piazzola(d, x0, y0)
            if c == 'd':
                cespuglio(d, x0, y0)
    # la riva dello stagno: dove l'acqua confina con la terra
    for y in range(ALTO):
        for x in range(LARGO):
            if a(x, y) != '~':
                continue
            for v, (dx, dy) in PASSI.items():
                if a(x + dx, y + dy) not in ('~', None):
                    x0, y0 = x * C, y * C
                    box = {'N': (x0, y0, x0 + C, y0 + 10), 'S': (x0, y0 + C - 10, x0 + C, y0 + C),
                           'O': (x0, y0, x0 + 10, y0 + C), 'E': (x0 + C - 10, y0, x0 + C, y0 + C)}[v]
                    rett(d, *box, COLORE['riva'])
    for y in range(ALTO):
        for x in range(LARGO):
            # l'angolo in alto a sinistra di ogni blocco
            if a(x, y) == BOCCA and a(x - 1, y) != BOCCA and a(x, y - 1) != BOCCA:
                bocca(d, x * C, y * C)
            if a(x, y) == CASTELLO and a(x - 1, y) != CASTELLO and a(x, y - 1) != CASTELLO:
                castello(d, x * C, (y - 1) * C)
    im.save(uscita)


# ── il foglio ────────────────────────────────────────────────────────

# la finestra di strada: un quadrato di 5×5 celle col giro intorno e la
# croce in mezzo. Ci stanno tutti i casi — i quattro gomiti, i quattro
# innesti, l'incrocio, i dritti nei due versi — e sono tutti dipinti
# nello stesso colpo, quindi l'orlo cade allo stesso posto in ognuno.
FINESTRA = ['+++++', '+.+.+', '+++++', '+.+.+', '+++++']


def disegna_foglio(uscita):
    """Le quattro fasce del prompt 2, dall'alto in basso, su 24×16 celle."""
    im = Image.new('RGB', (24 * C, 16 * C), (255, 255, 255))
    d = ImageDraw.Draw(im)
    # 1 — i tre fondi da 4×4 celle; a destra i due stagni e le due piazzole
    for i, c in enumerate('.,^'):
        fondo(d, i * 5 * C, 0, c, 4, 4)
    stagno(d, 15 * C, 0, 3, 3)
    stagno(d, 19 * C, 0, 2, 2)
    piazzola(d, 22 * C, 0)
    piazzola(d, 22 * C, 2 * C)
    # 2 — la finestra, la bocca, il castello
    a = lettore(FINESTRA)
    for y in range(5):
        for x in range(5):
            x0, y0 = x * C, (5 + y) * C
            if a(x, y) == STRADA:
                # fuori dalla finestra non c'è strada: il giro ha l'orlo
                # anche verso l'esterno
                vv = ''.join(v for v, (dx, dy) in PASSI.items() if a(x + dx, y + dy) == STRADA)
                strada(d, x0, y0, vv)
            else:
                fondo(d, x0, y0, '.')
    bocca(d, 6 * C, 6 * C)
    castello(d, 10 * C, 5 * C)
    # 3 — sei pezzi del fitto, alti due celle, e sei decori da una cella
    for k in range(6):
        albero(d, k * 2 * C, 11 * C)
        cespuglio(d, (12 + k * 2) * C, 12 * C)
    # 4 — dodici cose per terra, una per cella
    for k in range(12):
        per_terra(d, k * 2 * C, 14 * C)
    im.save(uscita)


def main():
    righe = pianta_dalla_scheda()
    g = guasti(righe)
    if g:
        raise SystemExit('la pianta non rispetta la regola della scacchiera:\n  ' + '\n  '.join(g))
    disegna_pianta(righe, CARTELLA / 'PROMPT-scenario-pianta.png')
    disegna_foglio(CARTELLA / 'PROMPT-scenario-foglio.png')
    print('la pianta rispetta la regola della scacchiera; scritti PROMPT-scenario-pianta.png '
          'e PROMPT-scenario-foglio.png in', CARTELLA.relative_to(QUI.parents[1]))


if __name__ == '__main__':
    sys.exit(main())
