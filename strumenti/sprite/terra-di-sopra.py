#!/usr/bin/env python3
"""La terra di sopra del sotterraneo: dalla mappa generata al modulo del gioco.

    python3 strumenti/sprite/terra-di-sopra.py             # rifà src/giochi/sotterraneo/dati/terra-mappa.js
    python3 strumenti/sprite/terra-di-sopra.py --proponi   # tmp/terra/proposta.txt: la maschera letta dai colori
    python3 strumenti/sprite/terra-di-sopra.py --provino   # tmp/terra/provino.png: maschera, posti e chi indica sopra la mappa

La mappa si tiene com'è (`generati/mappa_sotterraneo.png`): il gioco la mostra
intera e ci posa sopra solo le cose che cambiano. Tutto quello che il codice sa
della mappa — dove si cammina, dove stanno le aperture, dove si parte — sta nel
foglietto `sorgenti/sotterraneo/terra-di-sopra.json`, e qui si copia nel modulo
insieme all'immagine in WebP (il build resta un file solo). Il perché e come si
corregge la maschera: `docs/sotterraneo/terra-di-sopra.md`.

Le discese chiuse: quando c'è `generati/mappa_sotterraneo_chiusa.png` (la stessa
mappa ritoccata, vedi la scheda `PROMPT-terra-di-sopra.md`), si ritaglia il
riquadro di ogni posto e il gioco lo posa sopra la discesa chiusa. Senza, il
gioco disegna il suo velo col lucchetto.

Serve `pillow` (con WebP).
"""
import base64
import colorsys
import io
import json
import sys
from pathlib import Path

from PIL import Image, ImageDraw

QUI = Path(__file__).parent
REPO = Path(__file__).resolve().parents[2]
FOGLIETTO = QUI / 'sorgenti' / 'sotterraneo' / 'terra-di-sopra.json'
TMP = REPO / 'tmp' / 'terra'

TESTA = """/* GENERATO da strumenti/sprite/terra-di-sopra.py — non si scrive a mano.

   La mappa della terra di sopra e quello che il gioco sa di lei, copiati dal
   foglietto `strumenti/sprite/sorgenti/sotterraneo/terra-di-sopra.json`: si
   corregge lì e si rilancia lo strumento. Vedi docs/sotterraneo/terra-di-sopra.md.

   MAPPA     l'immagine intera ({largo}×{alto}), WebP in base64 ({kb} KB)
   CELLA     il lato di una cella della maschera, in pixel della mappa
   MASCHERA  una riga per fila di celle: `.` si cammina, `#` no
   POSTI     le sette aperture: `riquadro` [x, y, largo, alto] in pixel della
             mappa, `piede` la cella dove l'eroe si ferma per entrare,
             `ingresso` [x, y, largo, alto] l'ellisse del cerchietto attorno
             all'ingresso (sta dentro la mappa, non copre il disegno)
   PARTENZA, MINATORE, CARTELLO  dove si comincia, dove sta il minatore (e
             `accanto`, dove ci si ferma per parlargli), il cartello
   PEZZE     posto → il riquadro ritagliato dalla mappa con le discese
             chiuse ({pezze}); vuoto finché quella mappa non c'è
*/
"""


def leggi():
    return json.loads(FOGLIETTO.read_text())


def mappa(fg):
    return Image.open(FOGLIETTO.parent / fg['mappa']).convert('RGB')


def in_base64(im, formato, **opz):
    b = io.BytesIO()
    im.save(b, formato, **opz)
    return base64.b64encode(b.getvalue()).decode()


def js(v):
    return json.dumps(v, ensure_ascii=False, separators=(',', ':'))


def controlla(fg, im):
    """Quello che si sbaglia correggendo il foglietto a mano: righe di misura
    diversa, caratteri strani, un piede su una cella dove non si cammina."""
    c = fg['cella']
    L, A = im.size[0] // c, im.size[1] // c
    m = fg['maschera']
    guasti = []
    if len(m) != A:
        guasti.append(f'la maschera ha {len(m)} righe, la mappa {A}')
    for i, r in enumerate(m):
        if len(r) != L:
            guasti.append(f'la riga {i} è lunga {len(r)}, non {L}')
        if set(r) - set('.#'):
            guasti.append(f'la riga {i} ha caratteri che non sono . o #')

    def passa(x, y):
        return 0 <= y < len(m) and 0 <= x < len(m[y]) and m[y][x] == '.'

    for nome, p in fg['posti'].items():
        if not passa(*p['piede']):
            guasti.append(f'il piede di {nome} {p["piede"]} non è camminabile')
        i = p.get('ingresso')
        if not i or len(i) != 4 or i[2] <= 0 or i[3] <= 0:
            guasti.append(f'{nome}: manca l\'ingresso [x, y, largo, alto] del cerchietto')
        elif i[0] < 0 or i[1] < 0 or i[0] + i[2] > im.size[0] or i[1] + i[3] > im.size[1]:
            guasti.append(f'{nome}: il cerchietto {i} esce dalla mappa')
    for nome in ('partenza', 'minatore'):
        if not passa(*fg[nome]['piede']):
            guasti.append(f'{nome}: il piede {fg[nome]["piede"]} non è camminabile')
    if not passa(*fg['minatore']['accanto']):
        guasti.append(f'minatore: dove si sta per parlargli {fg["minatore"]["accanto"]} non è camminabile')
    if not passa(*fg['cartello']['piede']):
        guasti.append(f'il piede del cartello {fg["cartello"]["piede"]} non è camminabile')
    if guasti:
        raise SystemExit('il foglietto non torna:\n  ' + '\n  '.join(guasti))


def pezze(fg):
    """Il riquadro di ogni posto dalla mappa chiusa, se c'è."""
    f = FOGLIETTO.parent / fg['chiusa']
    if not f.exists():
        return {}
    im = Image.open(f).convert('RGB')
    vera = mappa(fg)
    if im.size != vera.size:
        # il ritocco può tornare a un'altra misura: si riporta alla mappa, poi si ritaglia
        im = im.resize(vera.size, Image.LANCZOS)
    fuori = {}
    for nome, p in fg['posti'].items():
        x, y, w, h = p['riquadro']
        fuori[nome] = 'data:image/png;base64,' + in_base64(im.crop((x, y, x + w, y + h)), 'PNG', optimize=True)
    return fuori


def genera():
    fg = leggi()
    im = mappa(fg)
    controlla(fg, im)
    b64 = in_base64(im, 'WEBP', quality=fg['qualita'], method=6)
    pz = pezze(fg)
    kb = len(b64) * 3 // 4 // 1024
    dest = REPO / fg['modulo']
    corpo = TESTA.format(largo=im.size[0], alto=im.size[1], kb=kb,
                         pezze=f'{len(pz)} di {len(fg["posti"])}' if pz else 'nessuna')
    corpo += f"\nexport const LARGO = {im.size[0]}, ALTO = {im.size[1]}\n"
    corpo += f"export const CELLA = {fg['cella']}\n\n"
    corpo += 'export const MASCHERA = [\n' + ''.join(f"  '{r}',\n" for r in fg['maschera']) + ']\n\n'
    corpo += 'export const POSTI = {\n' + ''.join(
        f"  {js(n)}: {js(p)},\n" for n, p in fg['posti'].items()) + '}\n\n'
    for nome in ('partenza', 'minatore', 'cartello'):
        corpo += f"export const {nome.upper()} = {js(fg[nome])}\n"
    corpo += '\nexport const PEZZE = {\n' + ''.join(f"  {js(n)}: '{v}',\n" for n, v in pz.items()) + '}\n'
    corpo += f"\nexport const MAPPA = 'data:image/webp;base64,{b64}'\n"
    dest.write_text(corpo)
    print(f'{dest.relative_to(REPO)}: mappa {kb} KB, pezze {len(pz)}')


# ── la proposta dai colori ──────────────────────────────────────────
# Si cammina sul sentiero (terra calda, chiara) e sul prato (verde giallo,
# chiaro); non sugli alberi (verde più scuro e freddo, contorni neri), sull'acqua,
# sulla roccia, sulle case, sulle staccionate. Una cella passa se quasi tutta è
# sentiero o prato e quasi niente è contorno scuro: la proposta è di manica
# larga apposta, il foglietto la corregge a mano.
def tipo(r, g, b):
    h, s, v = colorsys.rgb_to_hsv(r / 255, g / 255, b / 255)
    h *= 360
    if v < 0.28:
        return 'scuro'
    if 180 <= h <= 260 and s > 0.3:
        return 'acqua'
    if s < 0.2:
        return 'roccia'
    if 18 <= h <= 48 and v > 0.5:
        return 'terra'
    if 55 <= h <= 100 and v > 0.38:
        return 'prato'
    return 'altro'          # le chiome sono di un verde più freddo, i tronchi e le staccionate più scuri


def proposta(fg):
    im = mappa(fg)
    c = fg['cella']
    px = im.load()
    righe = []
    for cy in range(im.size[1] // c):
        r = ''
        for cx in range(im.size[0] // c):
            conta = {}
            for y in range(cy * c, cy * c + c, 2):
                for x in range(cx * c, cx * c + c, 2):
                    t = tipo(*px[x, y])
                    conta[t] = conta.get(t, 0) + 1
            n = sum(conta.values())
            buono = (conta.get('terra', 0) + conta.get('prato', 0)) / n
            scuro = conta.get('scuro', 0) / n
            r += '.' if buono > 0.62 and scuro < 0.12 else '#'
        righe.append(r)
    return righe


def proponi():
    fg = leggi()
    righe = proposta(fg)
    TMP.mkdir(parents=True, exist_ok=True)
    (TMP / 'proposta.txt').write_text('\n'.join(righe) + '\n')
    diverse = sum(a != b for r1, r2 in zip(righe, fg['maschera']) for a, b in zip(r1, r2))
    print(f'tmp/terra/proposta.txt: {len(righe)} righe; {diverse} celle diverse dalla maschera del foglietto')


def provino():
    """La mappa con sopra la maschera (rosso dove non si passa), i riquadri dei
    posti, i piedi e chi indica la strada: per correggere il foglietto a occhio."""
    fg = leggi()
    im = mappa(fg).convert('RGBA')
    c = fg['cella']
    velo = Image.new('RGBA', im.size, (0, 0, 0, 0))
    d = ImageDraw.Draw(velo)
    for y, r in enumerate(fg['maschera']):
        for x, ch in enumerate(r):
            if ch == '#':
                d.rectangle([x * c, y * c, x * c + c - 1, y * c + c - 1], fill=(220, 30, 30, 90))
    for x in range(0, im.size[0], c):
        d.line([(x, 0), (x, im.size[1])], fill=(255, 255, 255, 40))
    for y in range(0, im.size[1], c):
        d.line([(0, y), (im.size[0], y)], fill=(255, 255, 255, 40))

    def piede(p, colore):
        x, y = p
        d.ellipse([x * c + 6, y * c + 6, x * c + c - 7, y * c + c - 7], fill=colore)

    for nome, p in fg['posti'].items():
        x, y, w, h = p['riquadro']
        d.rectangle([x, y, x + w, y + h], outline=(255, 220, 60, 255), width=3)
        d.text((x + 4, y + 4), nome, fill=(255, 255, 255, 255))
        ix, iy, iw, ih = p['ingresso']
        d.ellipse([ix, iy, ix + iw, iy + ih], outline=(255, 255, 255, 255), width=3)
        piede(p['piede'], (255, 220, 60, 255))
    x, y, w, h = fg['cartello']['riquadro']
    d.rectangle([x, y, x + w, y + h], outline=(120, 200, 255, 255), width=3)
    piede(fg['cartello']['piede'], (120, 200, 255, 255))
    piede(fg['partenza']['piede'], (80, 255, 120, 255))
    piede(fg['minatore']['piede'], (255, 140, 255, 255))
    piede(fg['minatore']['accanto'], (255, 200, 255, 160))
    TMP.mkdir(parents=True, exist_ok=True)
    Image.alpha_composite(im, velo).save(TMP / 'provino.png')
    print('tmp/terra/provino.png')


if __name__ == '__main__':
    if '--proponi' in sys.argv:
        proponi()
    elif '--provino' in sys.argv:
        provino()
    else:
        genera()
