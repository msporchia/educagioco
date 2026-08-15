#!/usr/bin/env python3
"""Rifà l'atlante di `fattoria-gfx.html` dal set CC0 di ArMM1998.

    python3 poc/atlante-gfx.py ~/scaricati/gfx      # la cartella gfx/ dello zip
    python3 poc/atlante-gfx.py ~/scaricati/gfx --provini

Il prototipo è un HTML unico: l'atlante ci vive dentro, in base64, su una
riga sola. Questo script ritaglia dal set solo le tessere che servono, le
impacchetta, e **riscrive quella riga sul posto** — il resto del file non
lo tocca, quindi si può continuare a modificarlo a mano.

La sorgente non è versionata apposta: si scarica da
https://opengameart.org/content/zelda-like-tilesets-and-sprites
(CC0 1.0, ArMM1998). Serve `pillow`.

Il set è tutto quello che c'è: **animali non ne ha**, e infatti nel
prototipo non ce ne sono. Vedi `fattoria.md`.
"""
import base64
import json
import subprocess
import re
import sys
from pathlib import Path

from PIL import Image

T = 16
QUI = Path(__file__).parent
REPO = Path(__file__).resolve().parents[2]
SORGENTI = QUI / 'sorgenti' / 'gfx'


# ── il dizionario delle tessere non sta qui ──────────────────────────
# Sta in `src/giochi/fattoria/dati/tessere.js`, ed è l'unico posto dove
# stanno delle coordinate. Lo si legge da lì invece di tenerne una copia:
# due copie di una tabella vogliono dire, prima o poi, due tabelle diverse
# — e quel guasto si presenta come uno sprite sbagliato a schermo, che è
# il modo peggiore di scoprirlo. Aggiungere una tessera è una riga di là.
TESSERE_JS = REPO / 'src/giochi/fattoria/dati/tessere.js'


def leggi_tessere():
    """Il dizionario, letto dal file che lo possiede. Lo estrae Node: è
    già una dipendenza del repo, e un parser fatto a mano su del
    JavaScript commentato è un guasto che aspetta."""
    fuori = subprocess.run(
        ['node', '-e',
         "import(process.argv[1]).then(m => console.log(JSON.stringify(m.TESSERE)))",
         str(TESSERE_JS.resolve())],
        capture_output=True, text=True)
    if fuori.returncode:
        raise SystemExit(f'non riesco a leggere {TESSERE_JS.name}:\n{fuori.stderr.strip()}')
    return {n: tuple(v) for n, v in json.loads(fuori.stdout).items()}


PEZZI = leggi_tessere()

# il personaggio: tre versi per quattro fotogrammi, in celle 16x32.
# Le bande si trovano misurando character.png: y = 0, 32, 64, passo 32.
VERSI = {'giu': 0, 'lato': 32, 'su': 64}

# La bambina non è disegnata da zero: è quello stesso sprite ridipinto.
# Tiene scheletro, tempi e tavolozza dell'originale — sono quelli a farla
# stare nello stile, non la mano di chi la ritocca.
CAPO_S = (67, 46, 39, 255)      # capelli, ombra
CAPO_C = (106, 72, 52, 255)     # capelli, luce
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
    # i capelli scendono ai due lati del viso: a 16 px di larghezza sono le
    # uniche due colonne libere, ed è per questo che un'arma in mano non ci sta
    for i, y in enumerate(range(alto + 6, alto + 14)):
        metti(0, y, CAPO_S)
        metti(1, y, CAPO_C if i < 6 else CAPO_S)
        metti(15, y, CAPO_S)
        metti(14, y, CAPO_C if i < 6 else CAPO_S)
    metti(1, alto + 14, CAPO_S)
    metti(14, alto + 14, CAPO_S)
    return im


# Di lato un quadrupede e' lungo: un cane di profilo occupa 24-28 px, non
# 16. La cella di «lato» e' larga il doppio — la mette cosi' `attori.py`, che
# normalizza all'importazione. Qui basta saperlo leggere; il gioco no, perche'
# la larghezza di ogni pezzo sta gia' scritta nell'atlante.
LARGHEZZE = {'giu': T, 'lato': T * 2, 'su': T}
CANONICO = (T * 2 * 4, 32 * 3)          # la misura di un foglio normalizzato


def taglia_attore(foglio, nome, ritagli, filtro=None):
    """Un attore e' sempre tre versi per quattro fotogrammi. Le celle sono
    16x32, tranne quelle di lato che sono 32x32: e' l'unica differenza, e
    tagliare tutto a 16 spezzava in due i cani."""
    canonico = foglio.size == CANONICO
    for i, verso in enumerate(VERSI):
        larg = LARGHEZZE[verso] if canonico else T
        y0 = i * 32 if canonico else VERSI[verso]
        for fr in range(4):
            p = foglio.crop((fr * larg, y0, fr * larg + larg, y0 + 32))
            ritagli[f'{nome}_{verso}{fr}'] = filtro(p) if filtro else p


def costruisci(gfx):
    over = Image.open(gfx / 'Overworld.png').convert('RGBA')
    char = Image.open(gfx / 'character.png').convert('RGBA')

    ritagli = {n: over.crop((c * T, r * T, (c + w) * T, (r + h) * T))
               for n, (c, r, w, h) in PEZZI.items()}
    taglia_attore(char, 'bimbo', ritagli)
    taglia_attore(char, 'bambina', ritagli, bambina)

    # tutti gli altri attori arrivano da `poc/attori/`, uno per file. Chi ne
    # aggiunge uno non tocca questo script: ci mette il png e rilancia.
    cartella = QUI / 'attori'
    if cartella.is_dir():
        for f in sorted(cartella.glob('*.png')):
            taglia_attore(Image.open(f).convert('RGBA'), f.stem, ritagli)
            print(f'  attore: {f.stem}')

    LARG = 16 * T
    x = y = riga = 0
    mappa, dove = {}, {}
    for nome, im in sorted(ritagli.items(), key=lambda kv: -kv[1].height):
        if x + im.width > LARG:
            x, y, riga = 0, y + riga, 0
        dove[nome] = (x, y, im)
        mappa[nome] = [x, y, im.width, im.height]
        x += im.width
        riga = max(riga, im.height)

    atlante = Image.new('RGBA', (LARG, y + riga), (0, 0, 0, 0))
    for nome, (px, py, im) in dove.items():
        atlante.paste(im, (px, py))
    return atlante, mappa, ritagli


def provini(ritagli, dove):
    """Un foglio con ogni pezzo e il suo nome: le coordinate si sbagliano, e
    il modo più rapido di accorgersene è guardarle tutte insieme."""
    from PIL import ImageDraw
    COL, PASSO = 8, 96
    righe = (len(ritagli) + COL - 1) // COL
    f = Image.new('RGBA', (COL * PASSO, righe * PASSO), (250, 250, 250, 255))
    d = ImageDraw.Draw(f)
    for i, nome in enumerate(sorted(ritagli)):
        im = ritagli[nome]
        z = min(4, max(1, 72 // max(im.width, im.height)))
        g = im.resize((im.width * z, im.height * z), Image.NEAREST)
        cx = (i % COL) * PASSO + (PASSO - g.width) // 2
        cy = (i // COL) * PASSO + 12 + (PASSO - 16 - g.height) // 2
        f.alpha_composite(g, (max(0, cx), max(12, cy)))
        d.text(((i % COL) * PASSO + 3, (i // COL) * PASSO + 2), nome, fill=(0, 0, 0))
    f.save(dove)
    print('provini in', dove)


MODULO = """/* GENERATO da strumenti/sprite/atlante.py — non si scrive a mano.

   L'atlante è ritagliato dal set CC0 di ArMM1998 (Zelda-like tilesets and
   sprites, https://opengameart.org/content/zelda-like-tilesets-and-sprites)
   più gli attori che stanno in `strumenti/sprite/attori/`. Il PNG intero pesa {kb} KB:
   sta qui dentro in base64 perché il build deve restare un file solo.

   PEZZI: nome → [x, y, larghezza, altezza] dentro l'atlante. */
export const ATLANTE = 'data:image/png;base64,{b64}'

export const PEZZI = {mappa}

/* Un attore è 16×32, quattro fotogrammi per ognuno dei tre versi. Le pose
   di lato guardano a DESTRA: la sinistra è la stessa specchiata, e non
   esiste nell'atlante — esiste nella testa di chi disegna. */
export const VERSI = ['giu', 'lato', 'su']
export const FOTOGRAMMI = 4
export const pezzoAttore = (chi, verso, fr) => PEZZI[`${{chi}}_${{verso}}${{fr}}`] || null

/* Gli attori che l'atlante contiene davvero, ricavati dai pezzi invece che
   scritti a mano: aggiungerne uno è mettere un png in `strumenti/sprite/attori/`. */
export const ATTORI = [...new Set(Object.keys(PEZZI)
  .map(n => /^(.+)_giu0$/.exec(n)).filter(Boolean).map(m => m[1]))].sort()
"""


def scrivi_modulo(b64, mappa):
    """Lo stesso atlante, nella forma che serve al gioco vero.

    Due bersagli e un comando solo apposta: due comandi da ricordare
    vogliono dire, prima o poi, un atlante e una tabella che non
    combaciano più — e quel guasto si presenta come uno sprite sbagliato
    a schermo, che è il modo peggiore di scoprirlo."""
    dove = REPO / 'src/giochi/fattoria/dati/atlante.js'
    if not dove.parent.is_dir():
        return
    dove.write_text(MODULO.format(
        kb=len(b64) * 3 // 4 // 1024, b64=b64,
        mappa=json.dumps(mappa, separators=(',', ':'), sort_keys=True)))
    print(f'  → {dove.relative_to(REPO)}')


def main():
    voci = [a for a in sys.argv[1:] if not a.startswith('--')]
    gfx = Path(voci[0]).expanduser() if voci else SORGENTI
    if not (gfx / 'Overworld.png').exists():
        print(f'in {gfx} non c\'è Overworld.png — passa la cartella gfx/ dello zip')
        return 1

    atlante, mappa, ritagli = costruisci(gfx)
    png = QUI / '.atlante-gfx.png'
    atlante.save(png)
    b64 = base64.b64encode(png.read_bytes()).decode()
    png.unlink()

    pagina = REPO / 'poc/fattoria-gfx.html'
    testo = pagina.read_text()
    testo = re.sub(r"(const ATLANTE = 'data:image/png;base64,)[^']*'",
                   lambda m: m.group(1) + b64 + "'", testo, count=1)
    testo = re.sub(r'(const PEZZI = ).*?;\n',
                   lambda m: m.group(1) + json.dumps(mappa, separators=(',', ':'),
                                                     sort_keys=True) + ';\n',
                   testo, count=1, flags=re.S)
    pagina.write_text(testo)
    scrivi_modulo(b64, mappa)

    print(f'atlante {atlante.width}x{atlante.height}, '
          f'{len(b64) * 3 // 4 // 1024} KB di PNG, {len(mappa)} pezzi '
          f'→ {pagina.name} ({len(testo) // 1024} KB)')
    if '--provini' in sys.argv:
        provini(ritagli, REPO / 'poc/scatti/atlante-gfx.png')
    return 0


if __name__ == '__main__':
    sys.exit(main())
