#!/usr/bin/env python3
"""Rifà l'atlante della fattoria dai fogli in `sorgenti/`.

    python3 strumenti/sprite/atlante.py
    python3 strumenti/sprite/atlante.py --provini     # e un foglio da guardare

── OGNI SORGENTE PORTA LA SUA GEOMETRIA ─────────────────────────────
Accanto a `pappagallo.png` sta `pappagallo.json`, che dice com'è fatto
quel foglio: quanto è ingrandito, com'è il fondo, dove cadono i
fotogrammi, quali sprite ne escono. Un foglio senza foglietto non viene
letto — e va bene così: **niente più euristiche**.

È il punto della faccenda. Finora la geometria la indovinava questo
script, e ogni foglio generato da un modello diverso arrivava fatto a
modo suo: 272×256 a quattro fotogrammi, poi 1071×1008 col fondo a
scacchiera dipinta, poi 1536×1024 a sei fotogrammi su otto righe. Ogni
volta l'euristica si rompeva **in silenzio** — cani tagliati a metà,
scacchiera addosso, versi invertiti — e lo si scopriva a schermo. Con un
foglietto per sorgente non c'è niente da indovinare: se arriva un foglio
fatto in un modo mai visto, si scrivono dieci righe di JSON e lo script
non cambia.

Il formato del foglietto sta in `FORMATO.md`. Serve `pillow`.
"""
import base64
import json
import sys
from pathlib import Path

from PIL import Image

from attori import allaga, fondi_di, sfrangia

QUI = Path(__file__).parent
REPO = Path(__file__).resolve().parents[2]
SORGENTI = QUI / 'sorgenti'
LARGO = 256                       # larghezza dell'atlante, in pixel

MODULO = """/* GENERATO da strumenti/sprite/atlante.py — non si scrive a mano.

   Ritagliato dai fogli in `strumenti/sprite/sorgenti/`, ognuno col suo
   foglietto `.json` che ne descrive la geometria (vedi FORMATO.md).
   Il PNG intero pesa {kb} KB: sta qui in base64 perché il build deve
   restare un file solo.

   PEZZI: nome → [x, y, larghezza, altezza] dentro l'atlante.
   DA: nome → da quale foglio arriva, per ritrovarlo. */
export const ATLANTE = 'data:image/png;base64,{b64}'

export const PEZZI = {mappa}

export const DA = {provenienza}

/* Un attore è chiunque cammini: tre versi — giù, di lato, su — per N
   fotogrammi. Le pose di lato guardano a DESTRA: la sinistra è la stessa
   specchiata, e non esiste nell'atlante. Chi è un attore si ricava dai
   pezzi, non da un elenco a mano. */
export const VERSI = ['giu', 'lato', 'su']
export const pezzoAttore = (chi, verso, fr) => PEZZI[`${{chi}}_${{verso}}${{fr}}`] || null

export const ATTORI = [...new Set(Object.keys(PEZZI)
  .map(n => /^(.+)_giu0$/.exec(n)).filter(Boolean).map(m => m[1]))].sort()

/* Quanti fotogrammi ha davvero un verso: i fogli non ne hanno tutti
   quattro, e contarli qui evita di disegnare un buco. */
export function fotogrammi(chi, verso = 'giu') {{
  let n = 0
  while (PEZZI[`${{chi}}_${{verso}}${{n}}`]) n++
  return n
}}
"""


# ── i filtri ─────────────────────────────────────────────────────────
# La bambina non è disegnata da zero: è il bimbo ridipinto. Tiene
# scheletro, tempi e tavolozza dell'originale — sono quelli a farla stare
# nello stile, non la mano di chi la ritocca. A 16 px di larghezza i
# capelli lunghi occupano le due sole colonne libere, ed è per questo che
# un'arma in mano non ci starebbe.
CAPO_S = (67, 46, 39, 255)
CAPO_C = (106, 72, 52, 255)
TUNICA = {(196, 60, 60, 255): (86, 148, 74, 255),
          (136, 46, 46, 255): (54, 102, 52, 255),
          (104, 28, 28, 255): (36, 72, 40, 255)}


def bambina(cella):
    im = cella.copy()
    px = im.load()
    alto = next((y for y in range(im.height) for x in range(im.width)
                 if px[x, y] in (CAPO_S, CAPO_C)), 0)

    def metti(x, y, c):
        if 0 <= x < im.width and 0 <= y < im.height:
            px[x, y] = c

    for y in range(im.height):
        for x in range(im.width):
            if px[x, y] in TUNICA:
                px[x, y] = TUNICA[px[x, y]]
    for i, y in enumerate(range(alto + 6, alto + 14)):
        metti(0, y, CAPO_S)
        metti(1, y, CAPO_C if i < 6 else CAPO_S)
        metti(im.width - 1, y, CAPO_S)
        metti(im.width - 2, y, CAPO_C if i < 6 else CAPO_S)
    metti(1, alto + 14, CAPO_S)
    metti(im.width - 2, alto + 14, CAPO_S)
    return im


def foglietti():
    """Ogni immagine che ha il suo `.json` accanto. Le altre si ignorano:
    un foglio senza foglietto è un foglio che non sappiamo leggere, e
    tirare a indovinare è esattamente quello che si vuole smettere."""
    fuori = []
    for f in sorted(SORGENTI.rglob('*')):
        if f.suffix.lower() not in ('.png', '.jpg', '.jpeg'):
            continue
        g = f.with_suffix('.json')
        if g.exists():
            fuori.append((f, json.loads(g.read_text())))
    return fuori


def alla_misura_vera(im, fg):
    """Il foglio riportato alla sua misura in pixel veri. Non si indovina:
    il foglietto dice quante celle è largo, e il resto è una divisione."""
    cw, ch = fg['cella']
    # `foglio` dice quante celle e' largo il foglio; senza, si tiene la
    # misura che ha — un foglio gia' alla misura vera non ha niente da dire
    col, rig = fg.get('foglio') or (im.width // cw, im.height // ch)
    vera = (col * cw, rig * ch)
    if im.size != vera:
        # BOX fa la media di ogni blocco: è il contrario dell'ingrandimento
        # che il foglio ha subito, ed è l'unico filtro che non inventa pixel
        im = im.resize(vera, Image.BOX)
    return im


def pulisci(im, fg):
    """Toglie il fondo, se il foglietto dice che ce n'è uno da togliere."""
    fondo = fg.get('fondo', 'trasparente')
    if fondo == 'trasparente':
        return im
    px = im.load()
    fondi = fondi_di(im) if fondo == 'auto' else [tuple(fondo)]
    largo, alto = im.size
    allaga(px, fondi, 26, largo, alto)
    allaga(px, fondi, 40, largo, alto)
    sfrangia(px, fondi, largo, alto)

    # Meno colori. Il ricampionamento di un JPEG ne lascia migliaia e la
    # pixel art ne vuole una decina: senza, i bordi restano sporchi, e
    # l'atlante pesa il doppio per del rumore che nessuno vede.
    n = fg.get('colori', 12)
    if n:
        opachi = Image.new('RGB', im.size, fondi[0][:3])
        opachi.paste(im.convert('RGB'), (0, 0), im)
        tav = opachi.quantize(colors=n, method=Image.MAXCOVERAGE).convert('RGB').load()
        for y in range(alto):
            for x in range(largo):
                if px[x, y][3]:
                    px[x, y] = tav[x, y] + (255,)
    return im


def ritagli_di(im, fg, provenienza, ritagli):
    cw, ch = fg['cella']
    for nome, d in fg['sprite'].items():
        if nome.startswith('__'):            # note per chi legge, non sprite
            continue
        pw, ph = d.get('cella', [cw, ch])
        quanti = d.get('quanti', 1)
        # il passo di default è la larghezza dello sprite stesso: i
        # fotogrammi di un'animazione stanno attaccati uno dopo l'altro
        passo = d.get('passo', [max(1, pw // cw), 0])
        for i in range(quanti):
            x = (d['da'][0] + passo[0] * i) * cw
            y = (d['da'][1] + passo[1] * i) * ch
            if x + pw > im.width or y + ph > im.height:
                print(f'  ! {nome}{i if quanti > 1 else ""} cade fuori dal foglio')
                continue
            chi = f'{nome}{i}' if quanti > 1 else nome
            ritagli[chi] = im.crop((x, y, x + pw, y + ph))
            provenienza[chi] = provenienza.get(chi) or Path(fg['_file']).name


def impacchetta(ritagli):
    x = y = riga = 0
    mappa, dove = {}, {}
    for nome, im in sorted(ritagli.items(), key=lambda kv: -kv[1].height):
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


def provini(ritagli, dove):
    """Ogni pezzo col suo nome: le coordinate si sbagliano, e guardarle
    tutte insieme è il modo più rapido di accorgersene."""
    from PIL import ImageDraw
    COL, PASSO = 8, 96
    righe = (len(ritagli) + COL - 1) // COL
    f = Image.new('RGBA', (COL * PASSO, righe * PASSO), (250, 250, 250, 255))
    d = ImageDraw.Draw(f)
    for i, nome in enumerate(sorted(ritagli)):
        im = ritagli[nome]
        z = min(4, max(1, 72 // max(im.width, im.height)))
        g = im.resize((im.width * z, im.height * z), Image.NEAREST)
        f.alpha_composite(g, (max(0, (i % COL) * PASSO + (PASSO - g.width) // 2),
                              max(12, (i // COL) * PASSO + 12)))
        d.text(((i % COL) * PASSO + 3, (i // COL) * PASSO + 2), nome, fill=(0, 0, 0))
    dove.parent.mkdir(exist_ok=True)
    f.save(dove)
    print('  provini in', dove.relative_to(REPO))


def main():
    fogli = foglietti()
    if not fogli:
        print(f'nessun foglio con foglietto in {SORGENTI}')
        return 1

    ritagli, provenienza = {}, {}
    for f, fg in fogli:
        fg['_file'] = str(f)
        utili = [n for n in (fg.get('sprite') or {}) if not n.startswith('__')]
        if not utili:
            print(f'  {f.name}: foglietto senza sprite, da calibrare — saltato')
            continue
        im = pulisci(alla_misura_vera(Image.open(f).convert('RGBA'), fg), fg)
        prima = len(ritagli)
        ritagli_di(im, fg, provenienza, ritagli)
        print(f'  {f.name}: {len(ritagli) - prima} pezzi')

    # Le copie: uno sprite che è un altro sprite ridipinto. La bambina è
    # il bimbo con altri capelli e un'altra tunica — stesso scheletro,
    # stessi tempi. È un filtro, non una geometria, e per questo si
    # dichiara a parte invece di far finta che sia un'altra zona del foglio.
    FILTRI = {'bambina': bambina}
    for f, fg in fogli:
        for nuovo, d in (fg.get('copie') or {}).items():
            filtro = FILTRI.get(d.get('filtro'))
            for nome in [n for n in list(ritagli) if n.startswith(d['da'] + '_')]:
                chi = nuovo + nome[len(d['da']):]
                ritagli[chi] = filtro(ritagli[nome]) if filtro else ritagli[nome].copy()
                provenienza[chi] = provenienza[nome]

    atlante, mappa = impacchetta(ritagli)
    png = QUI / '.atlante.png'
    atlante.save(png)
    b64 = base64.b64encode(png.read_bytes()).decode()
    png.unlink()

    dest = REPO / 'src/giochi/fattoria/dati/atlante.js'
    dest.write_text(MODULO.format(
        kb=len(b64) * 3 // 4 // 1024, b64=b64,
        mappa=json.dumps(mappa, separators=(',', ':'), sort_keys=True),
        provenienza=json.dumps(provenienza, separators=(',', ':'), sort_keys=True)))

    print(f'atlante {atlante.width}×{atlante.height}, '
          f'{len(b64) * 3 // 4 // 1024} KB di PNG, {len(mappa)} pezzi '
          f'→ {dest.relative_to(REPO)}')
    if '--provini' in sys.argv:
        provini(ritagli, REPO / 'poc/scatti/atlante.png')
    return 0


if __name__ == '__main__':
    sys.exit(main())
