#!/usr/bin/env python3
"""Gli schemi da allegare ai prompt di uno scenario del sotterraneo.

    python3 strumenti/sprite/scenario.py

Scrive, accanto alla scheda `sorgenti/sotterraneo/generati/PROMPT-scenario.md`,
le due immagini che la scheda dice di allegare:

  · `PROMPT-scenario-pianta.png` — la pianta della scena, 16×24 celle da
    64 px: la stessa misura dell'immagine che si chiede, cella per cella;
  · `PROMPT-scenario-foglio.png` — lo schema del foglio dei pezzi, 24×16
    celle: dove va ogni pezzo e quanto è grande.

**La pianta non sta scritta qui**: la si legge dal prompt 1 della scheda,
che è dove deve stare comunque — il generatore la riceve come testo. Due
copie diventerebbero due piante diverse, e lo schema allegato direbbe una
cosa mentre il prompt ne dice un'altra.

Prima di disegnare si controlla **la regola del muro**: una cella di
roccia con del pavimento sotto è una faccia, e una faccia ha sempre del
pavimento sotto. Una pianta che la viola chiede al generatore proprio il
difetto che lo scenario nuovo esiste per togliere.

Colori piatti e **nessuna linea di griglia**, apposta: un generatore copia
quello che vede, e una griglia disegnata qui tornerebbe come un pavimento
a tabella. Serve `pillow`.
"""
import re
import sys
from pathlib import Path

from PIL import Image, ImageDraw

QUI = Path(__file__).parent
CARTELLA = QUI / 'sorgenti' / 'sotterraneo' / 'generati'
SCHEDA = CARTELLA / 'PROMPT-scenario.md'

C = 64                                   # una cella, in pixel dell'immagine chiesta
LARGO, ALTO = 16, 24                     # la scena: 1024×1536, verticale

TETTO = set('#')
FACCIA = set('=tgPA')                    # le porte di fronte stanno nella fila delle facce
CAMMINA = set('.,oLlFS')                 # le porte di fianco sono un varco

COLORE = {
    'tetto': (46, 38, 34), 'bordo': (150, 132, 116),
    'faccia': (150, 72, 52), 'corona': (214, 200, 176), 'spigolo': (88, 40, 30),
    '.': (206, 194, 170), ',': (176, 142, 104), 'o': (96, 168, 196),
    'legno': (110, 62, 30), 'telaio': (92, 64, 44), 'buio': (18, 14, 12),
    'pietra': (120, 120, 128), 'acqua': (60, 140, 220), 'ferro': (70, 78, 88),
}

# I due pezzi interi del foglio (fascia 3): li descrive a parole il
# prompt 2, e qui servono solo a disegnarli nello schema.
STANZETTA = ['#####', '#===#', '#...#', '#####']
PILASTRO = ['.....', '.###.', '.===.', '.....']


def pianta_dalla_scheda():
    """Le 24 righe di fila fatte solo di simboli della pianta, lunghe 16."""
    riga = re.compile(r'^[#=tgPA.,oLlFS]{%d}$' % LARGO)
    righe = SCHEDA.read_text().splitlines()
    for i in range(len(righe) - ALTO + 1):
        if all(riga.match(r) for r in righe[i:i + ALTO]):
            return righe[i:i + ALTO]
    raise SystemExit(f'in {SCHEDA.name} non trovo una pianta di {LARGO}×{ALTO}')


def guasti(righe):
    h, w = len(righe), len(righe[0])

    def a(x, y):
        return righe[y][x] if 0 <= x < w and 0 <= y < h else '#'
    fuori = []
    for y in range(h):
        for x in range(w):
            c, sotto = a(x, y), a(x, y + 1)
            if c in TETTO and sotto in CAMMINA:
                fuori.append(f'({x},{y}) è tetto ma sotto si cammina: è una faccia')
            if c in FACCIA and sotto not in CAMMINA:
                fuori.append(f'({x},{y}) è una faccia ma sotto non si cammina')
            if c in 'Ll' and a(x, y - 1) not in FACCIA:
                fuori.append(f'({x},{y}) porta di fianco: sopra ci va la faccia del moncone')
    return fuori


def cella(d, x0, y0, c, vicino=lambda dx, dy: '#', fondo=None):
    """Una cella della pianta con l'angolo in alto a sinistra in (x0, y0)."""
    if c in FACCIA:
        d.rectangle([x0, y0, x0 + C - 1, y0 + C - 1], fill=COLORE['faccia'])
        d.rectangle([x0, y0, x0 + C - 1, y0 + 9], fill=COLORE['corona'])
        for dx, lato in ((-1, x0), (1, x0 + C - 5)):          # gli spigoli ai capi
            if vicino(dx, 0) not in FACCIA:
                d.rectangle([lato, y0 + 10, lato + 4, y0 + C - 1], fill=COLORE['spigolo'])
    else:
        base = {'#': COLORE['tetto'], 'L': COLORE[','], 'l': COLORE[','],
                'F': COLORE['o'], 'S': COLORE['.']}.get(c) or COLORE[c]
        d.rectangle([x0, y0, x0 + C - 1, y0 + C - 1], fill=fondo or base)
    if c == '#':
        # il bordo chiaro dove il tetto finisce: sopra verso il pavimento,
        # di lato anche verso una faccia — è il muro laterale che sale
        # fino al coronamento, come in una stanza vista a tre quarti
        if vicino(0, -1) in CAMMINA:
            d.rectangle([x0, y0, x0 + C - 1, y0 + 5], fill=COLORE['bordo'])
        if vicino(-1, 0) in CAMMINA | FACCIA:
            d.rectangle([x0, y0, x0 + 5, y0 + C - 1], fill=COLORE['bordo'])
        if vicino(1, 0) in CAMMINA | FACCIA:
            d.rectangle([x0 + C - 6, y0, x0 + C - 1, y0 + C - 1], fill=COLORE['bordo'])
    if c == 't':
        d.rectangle([x0 + 28, y0 + 30, x0 + 35, y0 + 52], fill=(60, 44, 36))
        d.ellipse([x0 + 22, y0 + 12, x0 + 41, y0 + 34], fill=(255, 170, 40))
    if c == 'g':
        for k in range(5):
            d.rectangle([x0 + 14 + k * 8, y0 + 18, x0 + 17 + k * 8, y0 + 54], fill=COLORE['ferro'])
    if c in 'PA':                                   # l'arco sale di mezza cella sul tetto
        d.rectangle([x0 + 8, y0 - 12, x0 + 55, y0 + C - 1], fill=COLORE['telaio'])
        d.ellipse([x0 + 8, y0 - 30, x0 + 55, y0 + 6], fill=COLORE['telaio'])
        dentro = COLORE['legno'] if c == 'P' else COLORE['buio']
        d.rectangle([x0 + 14, y0 - 2, x0 + 49, y0 + C - 1], fill=dentro)
        d.ellipse([x0 + 14, y0 - 20, x0 + 49, y0 + 12], fill=dentro)
    if c == 'L':                                    # l'anta di traverso nel varco
        d.rectangle([x0 + 22, y0 + 2, x0 + 41, y0 + C - 3], fill=COLORE['legno'])
    if c == 'l':                                    # l'anta aperta, accostata al muro
        d.rectangle([x0 + 2, y0 + 2, x0 + 13, y0 + C - 3], fill=COLORE['legno'])
    if c == 'F':
        fontana(d, x0, y0 - C // 2, piena=True)
    if c == 'S':
        scala(d, x0, y0)


def fontana(d, x0, y0, piena):
    """Una fontanella alta una cella e mezza: la vasca larga in basso, il
    piede corto e la coppa in cima. Col piede lungo e la coppa piccola la
    sagoma era quella di un'ampolla, cioè di una pozione: la cosa da
    raccogliere che lo schema non deve suggerire."""
    acqua = COLORE['acqua'] if piena else (70, 60, 52)
    d.ellipse([x0 + 2, y0 + 44, x0 + 61, y0 + 92], fill=COLORE['pietra'])
    d.ellipse([x0 + 10, y0 + 51, x0 + 53, y0 + 83], fill=acqua)
    d.rectangle([x0 + 27, y0 + 22, x0 + 36, y0 + 64], fill=COLORE['pietra'])
    d.ellipse([x0 + 12, y0 + 12, x0 + 51, y0 + 30], fill=COLORE['pietra'])
    d.ellipse([x0 + 18, y0 + 15, x0 + 45, y0 + 25], fill=acqua)


def scala(d, x0, y0, grata=False):
    d.rectangle([x0 + 4, y0 + 4, x0 + 59, y0 + 59], fill=COLORE['buio'])
    for k in range(4):
        d.rectangle([x0 + 8, y0 + 8 + k * 12, x0 + 55, y0 + 14 + k * 12],
                    fill=(120 - k * 22, 110 - k * 20, 100 - k * 18))
    if grata:
        for k in range(5):
            d.rectangle([x0 + 6 + k * 12, y0 + 4, x0 + 10 + k * 12, y0 + 59], fill=COLORE['ferro'])
        d.rectangle([x0 + 26, y0 + 26, x0 + 37, y0 + 39], fill=(200, 170, 60))


def disegna(righe, im, ox=0, oy=0):
    d = ImageDraw.Draw(im)
    h, w = len(righe), len(righe[0])

    def a(x, y):
        return righe[y][x] if 0 <= x < w and 0 <= y < h else '#'
    # prima le celle, poi porte e fontane, che salgono sulla cella di sopra
    for alti in (False, True):
        for y in range(h):
            for x in range(w):
                c = a(x, y)
                if (c in 'PAF') == alti:
                    cella(d, ox + x * C, oy + y * C, c, lambda dx, dy, x=x, y=y: a(x + dx, y + dy))


def pianta(righe, uscita):
    im = Image.new('RGB', (LARGO * C, ALTO * C))
    disegna(righe, im)
    im.save(uscita)


def foglio(uscita):
    """Le cinque fasce del prompt 2, dall'alto in basso, su 24×16 celle."""
    im = Image.new('RGB', (24 * C, 16 * C), (255, 255, 255))
    d = ImageDraw.Draw(im)

    def blocco(cx, cy, w, h, colore):
        d.rectangle([int(cx * C), int(cy * C), int((cx + w) * C) - 1, int((cy + h) * C) - 1],
                    fill=colore)

    # 1 — i quattro fondi da 4×4 celle; a destra le due scale e le due fontane
    for i, colore in enumerate((COLORE['.'], COLORE[','], COLORE['o'], COLORE['tetto'])):
        blocco(i * 5, 0, 4, 4, colore)
    scala(d, 20 * C, 0)
    scala(d, 22 * C, 0, grata=True)
    fontana(d, 20 * C, 2 * C, piena=True)
    fontana(d, 22 * C, 2 * C, piena=False)
    # 2 — le facce: una fila da sei, una da due coi capi, una sola, sei varianti
    for inizio, quante in ((0, 6), (7, 2), (10, 1)):
        for i in range(quante):
            cella(d, (inizio + i) * C, 5 * C, '=',
                  lambda dx, dy, i=i, q=quante: '=' if 0 <= i + dx < q else '#')
    for k, c in enumerate('tg===='):
        cella(d, (12 + 2 * k) * C, 5 * C, c)
    # 3 — la stanzetta e il pilastro, poi le porte: sei di fronte, sei di fianco
    disegna(STANZETTA, im, 0, 7 * C)
    disegna(PILASTRO, im, 6 * C, 7 * C)
    for k in range(6):
        cella(d, (12 + 2 * k) * C, int(7.5 * C), 'A' if k == 5 else 'P')
        cella(d, (12 + 2 * k) * C, 10 * C, 'l' if k == 5 else 'L')
    # 4 — il mercante in due pose, e sette pezzi di arredo scelti dal generatore
    for cx in (0, 2.5):
        blocco(cx, 12.5, 1.5, 1, (150, 110, 70))
        d.ellipse([int(cx * C) + 22, 12 * C - 4, int(cx * C) + 74, int(12.5 * C) + 20],
                  fill=(90, 60, 110))
    for k in range(7):
        blocco(5 + k * 2.5, 12, 1.5, 2, (190, 180, 168))
    # 5 — dodici cose per terra, una per cella
    for k in range(12):
        x0, y0 = k * 2 * C, 15 * C
        d.ellipse([x0 + 10, y0 + 16, x0 + 54, y0 + 48], fill=(150, 150, 150))
    im.save(uscita)


def main():
    righe = pianta_dalla_scheda()
    g = guasti(righe)
    if g:
        raise SystemExit('la pianta non rispetta la regola del muro:\n  ' + '\n  '.join(g))
    pianta(righe, CARTELLA / 'PROMPT-scenario-pianta.png')
    foglio(CARTELLA / 'PROMPT-scenario-foglio.png')
    print('la pianta rispetta la regola del muro; scritti PROMPT-scenario-pianta.png '
          'e PROMPT-scenario-foglio.png in', CARTELLA.relative_to(QUI.parents[1]))


if __name__ == '__main__':
    sys.exit(main())
