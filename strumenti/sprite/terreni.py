#!/usr/bin/env python3
"""Porta dentro i fogli del castello a tessere.

    python3 strumenti/sprite/terreni.py              # rifà l'atlante
    python3 strumenti/sprite/terreni.py --provini    # ...e un foglio da guardare

Fratello di `atlante.py`, e sta a parte per una ragione sola: quello
ritaglia **figure** — un cane, una torre, un attore con i suoi
fotogrammi — mentre qui si ritaglia un **mondo a griglia**, e sono due
mestieri con due problemi diversi. Una figura la si dichiara e si prende;
una tessera bisogna anche sapere **come si attacca a quelle vicine**, e
quello non si dichiara: si misura.

Le tre cose che fa, e nessuna delle tre la fa `atlante.py`:

  1. **ritaglia per griglia**. Il foglietto dice origine, passo e misura
     della cella; il passo può non essere intero, perché un foglio
     disegnato a mano libera non cade mai su multipli tondi.
  2. **scolla il terreno**. Di una tessera di strada tiene la strada e la
     frangia del ciglio, e butta il prato: così il fondo lo si dipinge
     una volta sola e le strade ci si posano sopra. È il modo standard di
     fare le transizioni — *overlay*, o *decal* — e serve a non ritrovarsi
     un secondo verde attorno alla strada, che è esattamente quello che
     si vedeva quando ogni tessera si portava dietro il suo pezzo di
     prato.
  3. **misura gli attacchi**. Per ogni lato dice se la strada lo
     attraversa e **dove**: in mezzo, di lato a sinistra, di lato a
     destra. Chi dipinge non chiede più «la curva a nord-est»: chiede al
     risolutore di `grafica/tessere.js` una tessera che si innesti con le
     vicine, e per quello contano solo gli attacchi. È il motivo per cui
     qui i nomi delle tessere sono numeri (`bosco-7`) e non descrizioni:
     un nome che descrive è un nome che prima o poi mente.

Serve `pillow`. Il foglietto sta accanto al foglio, vedi FORMATO.md e la
sezione «una griglia di tessere» in fondo.
"""
import base64
import json
import sys
from pathlib import Path

from PIL import Image

QUI = Path(__file__).parent
REPO = Path(__file__).resolve().parents[2]
SORGENTI = QUI / 'sorgenti' / 'td'
LARGO = 512                       # larghezza dell'atlante, in pixel
SPICCHI = 6                       # in quante fette si guarda un lato

MODULO = """/* GENERATO da strumenti/sprite/terreni.py — non si scrive a mano.

   Ritagliato dai fogli in `strumenti/sprite/sorgenti/td/`, ognuno col suo
   foglietto `.json`. Il PNG intero pesa {kb} KB: sta qui in base64 perché
   il build deve restare un file solo.

   PEZZI      nome → [x, y, largo, alto] dentro l'atlante
   ATTACCHI   nome → dove la strada tocca ogni lato: `·` da nessuna parte,
              `c` in mezzo, `sx`/`dx` di lato. Due tessere si accostano se
              il lato che si guardano dice la stessa cosa — il N di quella
              sotto contro il S di quella sopra. Chi le sceglie è
              `componiPercorso` in `grafica/tessere.js`.
   AMBIENTI   nome → le strade e i prati di quel posto. Le strade sono
              **scollate**: portano la strada e la frangia del ciglio, e
              vanno posate SOPRA un prato, non al posto suo.
   FIGURE     quello che non è terreno: torri, castello, bocche. */
export const TESSERA = {tessera}

export const ATLANTE = 'data:image/png;base64,{b64}'

export const PEZZI = {mappa}

export const ATTACCHI = {attacchi}

export const AMBIENTI = {ambienti}

export const FIGURE = {figure}

/* Il catalogo di un ambiente, pronto per il risolutore: ogni tessera
   nelle sue pose (quattro giri per due versi, senza i doppioni). Sta qui
   e non nel gioco perché è una funzione dei dati, non una scelta di
   nessuno. */
export const nomiDi = ambiente => (AMBIENTI[ambiente] || {{}}).strade || []
export const pratiDi = ambiente => (AMBIENTI[ambiente] || {{}}).prati || []
"""


# ── il ritaglio ──────────────────────────────────────────────────────
def celle_di(g):
    """Le caselle di una griglia, in pixel: `colonne` e `righe` sono
    elenchi di `[inizio, misura]`.

    Non c'è un passo, ed è voluto. Su questi fogli le colonne stanno fra
    54 e 68 pixel e le righe fra 73 e 84: un passo medio sbaglia di dieci
    pixel all'ultima colonna, cioè di un sesto di tessera, e il ritaglio
    comincia a pescare da quella accanto. Sono misure, non una griglia —
    e le misure si scrivono, non si deducono. Le legge `misura.py`."""
    for riga, (y, h) in enumerate(g['righe']):
        for col, (x, w) in enumerate(g['colonne']):
            yield riga, col, (x, y, w, h)


def terreno_di(t):
    """Il colore del terreno di una tessera: la mediana dei quattro
    angoli. Negli angoli c'è terreno quasi sempre — una strada entra dai
    lati e passa per il mezzo — e la mediana regge il caso della
    diagonale, che di angoli suoi ne sporca due su quattro."""
    w, h = t.size
    px = t.load()
    # ben dentro l'angolo, non sul filo: sul filo c'è la cornice del
    # riquadro, e prenderla per terreno ribalta tutto il ragionamento —
    # diventa «terreno» il nero, e allora sembra strada tutto il resto
    a, b = max(2, w // 6), max(2, h // 6)
    ang = [c for c in (px[a, b], px[w - 1 - a, b], px[a, h - 1 - b], px[w - 1 - a, h - 1 - b])
           if c[3] > 100]
    if not ang:
        return None
    return tuple(sorted(c[i] for c in ang)[len(ang) // 2] for i in range(3))


def scolla(t, soglia=60, frangia=3):
    """La tessera senza il suo terreno: resta la strada, più la frangia
    del ciglio, e tutto il resto diventa trasparente.

    Si tiene solo quello che **tocca un bordo**: un fiore in mezzo al
    prato è lontano dal colore del terreno quanto la strada, ma non è
    strada, e da solo diventerebbe una chiazza che galleggia sul fondo
    di un altro ambiente."""
    w, h = t.size
    terra = terreno_di(t)
    if terra is None:
        return t, False
    px = t.load()

    def lontano(c):
        return c[3] > 60 and sum((c[i] - terra[i]) ** 2 for i in range(3)) > soglia ** 2

    macchia = [[lontano(px[x, y]) for y in range(h)] for x in range(w)]
    tieni = [[False] * h for _ in range(w)]
    pila = [(x, y) for x in range(w) for y in (0, 1, h - 2, h - 1) if macchia[x][y]]
    pila += [(x, y) for y in range(h) for x in (0, 1, w - 2, w - 1) if macchia[x][y]]
    for x, y in pila:
        tieni[x][y] = True
    while pila:
        x, y = pila.pop()
        for dx, dy in ((1, 0), (-1, 0), (0, 1), (0, -1)):
            a, b = x + dx, y + dy
            if 0 <= a < w and 0 <= b < h and macchia[a][b] and not tieni[a][b]:
                tieni[a][b] = True
                pila.append((a, b))

    # la frangia: quel tanto di terreno attorno alla strada che il disegno
    # le ha messo addosso — i ciuffi sul ciglio, l'ombra
    largo = [[False] * h for _ in range(w)]
    for x in range(w):
        for y in range(h):
            if not tieni[x][y]:
                continue
            for dx in range(-frangia, frangia + 1):
                for dy in range(-frangia, frangia + 1):
                    if dx * dx + dy * dy > frangia * frangia:
                        continue
                    a, b = x + dx, y + dy
                    if 0 <= a < w and 0 <= b < h:
                        largo[a][b] = True

    fuori = t.copy()
    q = fuori.load()
    quanti = 0
    for x in range(w):
        for y in range(h):
            if largo[x][y]:
                quanti += 1
            else:
                q[x, y] = (0, 0, 0, 0)
    return fuori, quanti


def attacchi(t, dentro=3):
    """Dove la strada attraversa ogni lato, letto sulla tessera **già
    scollata**: lì il pieno è la strada, e non serve più sapere di che
    colore fosse il terreno di quell'ambiente.

    Si legge un filo dentro il bordo — sul bordo esatto ci sono l'ombra e
    la sfumatura del ricampionamento, che mentono — e si riduce a tre
    casi. La misura esatta in pixel non servirebbe: due tessere disegnate
    a mano non avranno mai lo stesso pixel sul bordo, avranno però la
    strada nello stesso posto, ed è quella che deve combaciare."""
    w, h = t.size
    px = t.load()
    fuori = {}
    for v in 'NSOE':
        acceso = []
        for s in range(SPICCHI):
            if v in 'NS':
                a, b = s * w // SPICCHI, (s + 1) * w // SPICCHI
                punti = [(i, dentro if v == 'N' else h - 1 - dentro) for i in range(a, b)]
            else:
                a, b = s * h // SPICCHI, (s + 1) * h // SPICCHI
                punti = [(dentro if v == 'O' else w - 1 - dentro, j) for j in range(a, b)]
            if sum(1 for x, y in punti if px[x, y][3] > 120) >= len(punti) * 0.6:
                acceso.append(s)
        if not acceso:
            fuori[v] = '·'
        else:
            centro = (sum(acceso) / len(acceso)) / (SPICCHI - 1)
            fuori[v] = 'sx' if centro < 0.36 else 'dx' if centro > 0.64 else 'c'
    return fuori


# ── i fogli ──────────────────────────────────────────────────────────
def tessere_di(im, fg, ritagli, att, ambienti, tessera):
    """Un foglio a griglia: ogni fila è un ambiente, ogni casella una
    tessera."""
    g = fg['griglia']
    file = fg['file']
    orlo = fg.get('orlo', 0)

    def taglia(box, dentro=0):
        x, y, w, h = box
        return im.crop((x + dentro, y + dentro, x + w - dentro,
                        y + h - dentro)).resize((tessera, tessera), Image.BOX)

    persi = 0
    for riga, col, box in celle_di(g):
        chi = file.get(str(riga))
        if not chi:
            continue
        t = taglia(box, orlo)
        if not t.getbbox():
            continue
        t, resta = scolla(t, fg.get('soglia', 60), fg.get('frangia', 3))
        if not resta:
            continue
        a = attacchi(t)
        # una tessera che non attraversa nessun lato non compone niente:
        # è un pezzo decorativo, e in un catalogo di strade fa solo
        # perdere tempo al risolutore
        if all(v == '·' for v in a.values()):
            persi += 1
            continue
        nome = f'{chi}-{col + riga * len(g["colonne"])}'
        ritagli[nome] = t
        att[nome] = a
        ambienti.setdefault(chi, {'strade': [], 'prati': []})['strade'].append(nome)
    return persi


def prati_di(im, fg, ritagli, ambienti, tessera):
    """I terreni pieni: quelli non si scollano da niente, sono il fondo.

    Qui la mappatura è **per colonna** e non per fila, perché su questi
    fogli i terreni stanno tutti in una riga sola, uno accanto all'altro:
    erba, erba fiorita, sabbia, neve, lava, ciottoli. Un ambiente può
    prenderne più d'uno, ed è così che il prato smette di essere una
    mattonella ripetuta."""
    g = fg['prati']
    quali = g['terreni']
    orlo = g.get('orlo', 0)
    for _, col, box in celle_di(g):
        chi = quali.get(str(col))
        if not chi:
            continue
        x, y, w, h = box
        t = im.crop((x + orlo, y + orlo, x + w - orlo,
                     y + h - orlo)).resize((tessera, tessera), Image.BOX)
        if not t.getbbox():
            continue
        nome = f'{chi}-prato-{col}'
        ritagli[nome] = t
        ambienti.setdefault(chi, {'strade': [], 'prati': []})['prati'].append(nome)


def figure_di(im, fg, ritagli, figure, scala):
    """Quello che non è terreno: torri, castello, bocche. Qui il nome
    conta eccome — il gioco chiede «l'arciere di secondo stadio» — e
    infatti si dichiara, uno per uno, invece di misurarlo."""
    for nome, box in fg['figure'].items():
        if nome.startswith('__'):
            continue
        x, y, w, h = box
        t = im.crop((x, y, x + w, y + h))
        if not t.getbbox():
            print(f'  ! {nome} è tutto trasparente: coordinate sbagliate?')
            continue
        if scala != 1:
            t = t.resize((max(1, round(w * scala)), max(1, round(h * scala))), Image.BOX)
        ritagli[nome] = t
        figure.append(nome)


def impacchetta(ritagli):
    x = y = riga = 0
    mappa, dove = {}, {}
    for nome, im in sorted(ritagli.items(), key=lambda kv: (-kv[1].height, kv[0])):
        if x + im.width > LARGO:
            x, y, riga = 0, y + riga, 0
        dove[nome] = (x, y, im)
        mappa[nome] = [x, y, im.width, im.height]
        x += im.width
        riga = max(riga, im.height)
    atlante = Image.new('RGBA', (LARGO, y + riga), (0, 0, 0, 0))
    for nome, (px, py, im) in dove.items():
        atlante.paste(im, (px, py))
    return atlante, mappa


def provini(ritagli, att, dove):
    """Ogni pezzo col suo nome e i suoi attacchi. Un attacco letto male
    non lancia niente: fa una strada che si spezza, e si scopre a schermo
    — cioè tardi. Guardarli tutti insieme costa dieci secondi."""
    from PIL import ImageDraw
    COL, PASSO = 10, 84
    nomi = sorted(ritagli)
    righe = (len(nomi) + COL - 1) // COL
    f = Image.new('RGBA', (COL * PASSO, righe * PASSO), (36, 36, 42, 255))
    d = ImageDraw.Draw(f)
    for i, nome in enumerate(nomi):
        im = ritagli[nome]
        z = min(2, max(1, 64 // max(im.width, im.height)))
        g = im.resize((im.width * z, im.height * z), Image.NEAREST)
        cx, cy = (i % COL) * PASSO, (i // COL) * PASSO
        f.alpha_composite(g, (cx + max(0, (PASSO - g.width) // 2), cy + 20))
        d.text((cx + 2, cy + 2), nome[:14], fill=(255, 240, 120))
        if nome in att:
            a = att[nome]
            d.text((cx + 2, cy + 11), ' '.join(f'{v}{a[v]}' for v in 'NSOE' if a[v] != '·'),
                   fill=(150, 220, 255))
    dove.parent.mkdir(parents=True, exist_ok=True)
    f.save(dove)
    print('  provini in', dove.relative_to(REPO))


def main():
    conf = json.loads((SORGENTI / 'atlante.json').read_text())
    tessera = conf.get('tessera', 36)
    ritagli, att, ambienti, figure = {}, {}, {}, []

    for f in sorted(SORGENTI.glob('*.json')):
        if f.name == 'atlante.json':
            continue
        fg = json.loads(f.read_text())
        sorgente = SORGENTI / fg['foglio']
        im = Image.open(sorgente).convert('RGBA')
        prima = len(ritagli)
        if fg.get('griglia'):
            persi = tessere_di(im, fg, ritagli, att, ambienti, tessera)
            if persi:
                print(f'    {persi} tessere senza strada, lasciate fuori')
        if fg.get('prati'):
            prati_di(im, fg, ritagli, ambienti, tessera)
        if fg.get('figure'):
            figure_di(im, fg, ritagli, figure, fg.get('scala', 1))
        print(f'  {fg["foglio"]}: {len(ritagli) - prima} pezzi')

    if not ritagli:
        print('nessun pezzo: i foglietti sono da scrivere')
        return 1

    atlante, mappa = impacchetta(ritagli)
    png = QUI / '.terreni.png'
    atlante.save(png, optimize=True)
    b64 = base64.b64encode(png.read_bytes()).decode()
    png.unlink()
    kb = len(b64) * 3 // 4 // 1024

    dest = REPO / conf['modulo']
    dest.parent.mkdir(parents=True, exist_ok=True)
    breve = lambda o: json.dumps(o, separators=(',', ':'), sort_keys=True)
    dest.write_text(MODULO.format(
        kb=kb, b64=b64, tessera=tessera, mappa=breve(mappa), attacchi=breve(att),
        ambienti=breve(ambienti), figure=breve(sorted(figure))))

    print(f'atlante {atlante.width}×{atlante.height}, {kb} KB di PNG, {len(mappa)} pezzi '
          f'({len(att)} tessere, {len(figure)} figure) → {dest.relative_to(REPO)}')
    for chi, roba in sorted(ambienti.items()):
        print(f'    {chi}: {len(roba["strade"])} strade, {len(roba["prati"])} prati')
    if '--provini' in sys.argv:
        provini(ritagli, att, REPO / 'poc/scatti/terreni-castello.png')
    return 0


if __name__ == '__main__':
    sys.exit(main())
