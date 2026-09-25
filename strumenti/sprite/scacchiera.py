#!/usr/bin/env python3
"""Gli schemi da allegare ai prompt di uno scenario del castello.

    python3 strumenti/sprite/scacchiera.py
    python3 strumenti/sprite/scacchiera.py --carte carte.json uscita.png

(la seconda forma la lancia `carte-castello.mjs`, che le carte le fa col
generatore vero del gioco)

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
    """Una cella di strada: una striscia larga metà cella nel mezzo, coi
    bracci verso i lati da cui la strada prosegue, e l'orlo attorno. Il
    fondo della cella resta com'è: ai lati della strada c'è un quarto di
    cella di prato."""
    q, o = C // 4, 5
    bracci = {'N': (q, 0, 3 * q, 2 * q), 'S': (q, 2 * q, 3 * q, C),
              'O': (0, q, 2 * q, 3 * q), 'E': (2 * q, q, C, 3 * q)}
    pezzi = [(q, q, 3 * q, 3 * q)] + [bracci[v] for v in vv]
    # prima l'orlo, allargato di traverso al braccio; poi la strada sopra
    for v, (a, b, c, e) in zip(' ' + vv, pezzi):
        if v in 'NS':
            a, c = a - o, c + o
        elif v in 'OE':
            b, e = b - o, e + o
        else:
            a, b, c, e = a - o, b - o, c + o, e + o
        rett(d, x0 + a, y0 + b, x0 + c, y0 + e, COLORE['orlo'])
    for a, b, c, e in pezzi:
        rett(d, x0 + a, y0 + b, x0 + c, y0 + e, COLORE['strada'])


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
    che salgono di una cella sopra. Si vede di fronte, col portone verso
    chi guarda: la strada arriva alle sue mura da sopra."""
    top = y0 + (4 - piede - 1) * C
    fondo_y = y0 + 4 * C - 4
    rett(d, x0 + C + 16, top + C, x0 + 4 * C - 16, top + 2 * C, COLORE['pietra'])     # il mastio, dietro
    rett(d, x0 + 8, top + 2 * C - 8, x0 + 5 * C - 8, fondo_y, COLORE['muro'])
    for tx in (0, 4):
        rett(d, x0 + tx * C + 4, top + 12, x0 + tx * C + C - 4, fondo_y, COLORE['pietra'])
        d.polygon([(x0 + tx * C + 2, top + 16), (x0 + tx * C + C // 2, top - 26),
                   (x0 + tx * C + C - 2, top + 16)], fill=COLORE['tetto'])
    d.polygon([(x0 + C + 12, top + C + 4), (x0 + 5 * C // 2, top + 10),
               (x0 + 4 * C - 12, top + C + 4)], fill=COLORE['tetto'])
    # il portone, in basso nel mezzo
    rett(d, x0 + 2 * C + 12, fondo_y - 56, x0 + 3 * C - 12, fondo_y, COLORE['buio'])


def stagno(d, x0, y0, w, h):
    d.ellipse([x0 + 2, y0 + 2, x0 + w * C - 3, y0 + h * C - 3], fill=COLORE['riva'])
    d.ellipse([x0 + 12, y0 + 12, x0 + w * C - 13, y0 + h * C - 13], fill=COLORE['~'])


def lago_dal_bordo(d, x0, y0, w, h):
    """Un lago che entra dal bordo destro del campo: la riva frastagliata
    verso il prato, e il lato del bordo tagliato dritto."""
    d.ellipse([x0 + 2, y0 + 2, x0 + 2 * w * C, y0 + h * C - 3], fill=COLORE['riva'])
    d.ellipse([x0 + 14, y0 + 14, x0 + 2 * w * C, y0 + h * C - 15], fill=COLORE['~'])
    rett(d, x0 + w * C, y0, x0 + 2 * w * C + 4, y0 + h * C, (255, 255, 255))


def masso(d, x0, y0, w=2, h=2):
    d.ellipse([x0 + 10, y0 + 18, x0 + w * C - 10, y0 + h * C - 8], fill=COLORE['sasso'])
    d.ellipse([x0 + 18, y0 + 14, x0 + w * C - 40, y0 + h * C // 2], fill=COLORE['cespuglio'])


def per_terra(d, x0, y0):
    d.ellipse([x0 + 18, y0 + 24, x0 + 46, y0 + 40], fill=COLORE['sasso'])


# ── la pianta ────────────────────────────────────────────────────────

def disegna_pianta(righe, uscita=None):
    """Una pianta qualunque, grande quanto è: quella della scheda (16×24)
    o la carta di una tappa (12×22). Torna l'immagine, e se c'è
    un'uscita la scrive."""
    ALTO, LARGO = len(righe), len(righe[0])
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
    if uscita:
        im.save(uscita)
    return im


# ── le carte delle tappe ─────────────────────────────────────────────

def disegna_carte(carte, uscita, per_riga=6, largo=256):
    """Tutte le carte in un foglio solo, col nome sotto e un bordo rosso
    su quelle che non rispettano la scacchiera. Le carte le scrive
    `carte-castello.mjs` col generatore vero del gioco."""
    alto = largo * 22 // 12
    righe = (len(carte) + per_riga - 1) // per_riga
    foglio = Image.new('RGB', (per_riga * (largo + 16) + 16, righe * (alto + 40) + 16), (24, 26, 24))
    d = ImageDraw.Draw(foglio)
    for i, c in enumerate(carte):
        x0 = 16 + (i % per_riga) * (largo + 16)
        y0 = 16 + (i // per_riga) * (alto + 40)
        im = disegna_pianta(c['righe']).resize((largo, alto), Image.LANCZOS)
        foglio.paste(im, (x0, y0))
        g = guasti(c['righe']) + c.get('guasti', [])
        if g:
            d.rectangle([x0 - 3, y0 - 3, x0 + largo + 2, y0 + alto + 2], outline=(230, 40, 40), width=3)
        d.text((x0, y0 + alto + 6), f"{c['campagna']} · {c['nome']}" + (f'  -- {len(g)} fuori regola' if g else ''),
               fill=(230, 230, 220))
    foglio.save(uscita)
    return foglio


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
    # 1 — i tre fondi da 4×4 celle; a destra le due piazzole e i due stagni
    for i, c in enumerate('.,^'):
        fondo(d, i * 5 * C, 0, c, 4, 4)
    piazzola(d, 15 * C, 0)
    piazzola(d, 15 * C, 2 * C)
    stagno(d, 17 * C, 0, 2, 2)
    stagno(d, 20 * C, 0, 3, 3)
    # 2 — la finestra, la bocca, il castello, il lago dal bordo, tre decori grandi
    a = lettore(FINESTRA)
    fondo(d, 0, 5 * C, '.', 5, 5)
    for y in range(5):
        for x in range(5):
            if a(x, y) == STRADA:
                vv = ''.join(v for v, (dx, dy) in PASSI.items() if a(x + dx, y + dy) == STRADA)
                strada(d, x * C, (5 + y) * C, vv)
    bocca(d, 6 * C, 5 * C)
    castello(d, 10 * C, 6 * C)
    lago_dal_bordo(d, 16 * C, 5 * C, 3, 5)
    masso(d, 20 * C, 5 * C)
    masso(d, 20 * C, 8 * C)
    masso(d, 6 * C, 8 * C)
    # 3 — sei pezzi del fitto, alti due celle, e sei decori da una cella
    for k in range(6):
        albero(d, k * 2 * C, 11 * C)
        cespuglio(d, (12 + k * 2) * C, 12 * C)
    # 4 — dodici cose per terra, una per cella
    for k in range(12):
        per_terra(d, k * 2 * C, 14 * C)
    im.save(uscita)


def main():
    if len(sys.argv) > 1 and sys.argv[1] == '--carte':
        import json
        carte = json.loads(Path(sys.argv[2]).read_text())
        disegna_carte(carte, sys.argv[3])
        rotte = [c['nome'] for c in carte if guasti(c['righe']) or c.get('guasti')]
        print(f'{len(carte)} carte in {sys.argv[3]}' + (f'; fuori regola: {", ".join(rotte)}' if rotte else ''))
        return
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
