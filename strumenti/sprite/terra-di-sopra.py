#!/usr/bin/env python3
"""La terra di sopra del sotterraneo: dalla mappa generata al modulo del gioco.

    python3 strumenti/sprite/terra-di-sopra.py             # rifà src/giochi/sotterraneo/dati/terra-mappa.js e terra-icone.js
    python3 strumenti/sprite/terra-di-sopra.py --proponi   # tmp/terra/proposta.txt: la maschera letta dai colori
    python3 strumenti/sprite/terra-di-sopra.py --provino   # tmp/terra/provino.png: maschera, posti e chi indica sopra la mappa
    python3 strumenti/sprite/terra-di-sopra.py --giunta    # tmp/terra/giunta-*.png: la giunta ingrandita, com'è e accostata a secco

La mappa sono due pezzi generati accostati (`generati/mappa_sotterraneo.png` e
`mappa_sotterraneo_2.png`, che sta a destra): lo strumento li mette su una tela
sola (`compone`), sfuma la giunta nel bosco e ci stende il sentiero; il gioco
mostra la tela intera e ci posa sopra solo le cose che cambiano. Tutto quello
che il codice sa della mappa — dove si cammina, dove stanno le aperture, dove
si parte — sta nel foglietto `sorgenti/sotterraneo/terra-di-sopra.json`, e qui
si copia nel modulo insieme all'immagine in WebP (il build resta un file solo).
Dalla stessa tela ritaglia le icone delle discese (un tondo sfumato per posto,
in un modulo a parte: la home le usa senza tirarsi dietro la mappa).
Il perché e come si corregge la maschera: `docs/sotterraneo/terra-strumento.md`.

Serve `pillow` (con WebP).
"""
import base64
import colorsys
import io
import json
import math
import sys
from pathlib import Path

from PIL import Image, ImageDraw, ImageFilter

QUI = Path(__file__).parent
REPO = Path(__file__).resolve().parents[2]
FOGLIETTO = QUI / 'sorgenti' / 'sotterraneo' / 'terra-di-sopra.json'
TMP = REPO / 'tmp' / 'terra'

TESTA = """/* GENERATO da strumenti/sprite/terra-di-sopra.py — non si scrive a mano.

   La mappa della terra di sopra e quello che il gioco sa di lei, copiati dal
   foglietto `strumenti/sprite/sorgenti/sotterraneo/terra-di-sopra.json`: si
   corregge lì e si rilancia lo strumento. Vedi docs/sotterraneo/terra-di-sopra.md.

   MAPPA     la tela intera ({largo}×{alto}, i due pezzi accostati), WebP in base64 ({kb} KB)
   CELLA     il lato di una cella della maschera, in pixel della mappa
   MASCHERA  una riga per fila di celle: `.` si cammina, `#` no
   POSTI     le aperture (le discese e l'abisso): `riquadro` [x, y, largo, alto] in pixel della
             mappa, `piede` la cella dove l'eroe si ferma per entrare,
             `ingresso` [x, y, largo, alto] l'ellisse del cerchietto attorno
             all'ingresso (sta dentro la mappa, non copre il disegno)
   PARTENZA, MINATORE, CARTELLO  dove si comincia, dove sta il minatore (e
             `accanto`, dove ci si ferma per parlargli), il cartello
   MERCANTI  chi vende sulla terra di sopra (dati/mercanti.js): `piede` dove
             sta fermo, `accanto` dove ci si ferma per aprire il banco
   PERSONAGGI chi dà le missioni (dati/missioni.js): `piede` e `accanto` come
             i mercanti
   PORTALE   il portale gemello, che compare con una discesa lasciata a metà:
             `piede` dove sta, `accanto` dove ci si ferma e dove si arriva
*/
"""

TESTA_ICONE = """/* GENERATO da strumenti/sprite/terra-di-sopra.py — non si scrive a mano.

   Le icone delle discese: un tondo ritagliato dalla mappa della terra di
   sopra attorno al `riquadro` di ogni posto, sfumato ai bordi, {lato}×{lato}
   in WebP ({kb} KB in tutto). Si mostrano dove una discesa compare in piccolo
   (la discesa a metà, «riprendi da qui», il portale). Il posto di una discesa:
   POSTO_DI in dati/terra.js. Vedi docs/sotterraneo/terra-di-sopra.md.
*/
"""


def leggi():
    return json.loads(FOGLIETTO.read_text())


_TELA = {}


def mappa(fg):
    """La tela intera: i pezzi accostati, la giunta sfumata, il sentiero steso."""
    if 'tela' not in _TELA:
        _TELA['tela'] = compone(fg)
    return _TELA['tela']


# ── i pezzi accostati ───────────────────────────────────────────────
# I pezzi sono generati uno per volta e stanno uno accanto all'altro: dove si
# toccano, il bosco è fitto da una parte e dall'altra ma non combacia. La
# giunta si sfuma a blocchi da 4 px (un pixel del disegno), non per trasparenza:
# due boschi sovrapposti a mezzo tono farebbero fantasmi, a blocchi un
# ciuffo di chioma passa all'altro come passerebbe una macchia di foglie.
# Oltre il proprio bordo ogni pezzo continua specchiato: così la scelta fra
# i due, dentro la fascia, ha sempre un pixel da dare.
def liscia(t):
    t = max(0.0, min(1.0, t))
    return t * t * (3 - 2 * t)


def ruido(x, y, scala, seme):
    """Rumore di valori, 0..1, a macchie larghe `scala` px: le macchie di chioma."""
    def r(i, j):
        n = math.sin(i * 127.1 + j * 311.7 + seme * 74.7) * 43758.5453
        return n - math.floor(n)
    gx, gy = x / scala, y / scala
    i, j = math.floor(gx), math.floor(gy)
    fx, fy = liscia(gx - i), liscia(gy - j)
    a = r(i, j) * (1 - fx) + r(i + 1, j) * fx
    b = r(i, j + 1) * (1 - fx) + r(i + 1, j + 1) * fx
    return a * (1 - fy) + b * fy


def sentiero_dirt(im, riquadro, seme, bordo):
    """La maschera del sentiero in un riquadro: la macchia di terra battuta
    (come la legge `tipo`) che tocca il punto `seme`, chiusa dei buchi dei
    sassolini e allargata di `bordo` px, così il sentiero si porta dietro il
    suo bordo d'erba e non le case, i sassi e le chiome lì accanto."""
    x, y, w, h = riquadro
    c = im.crop((x, y, x + w, y + h))
    px = c.load()
    m = Image.new('L', c.size, 0)
    mp = m.load()
    for j in range(h):
        for i in range(w):
            if tipo(*px[i, j]) == 'terra':
                mp[i, j] = 255
    m = m.filter(ImageFilter.MaxFilter(7)).filter(ImageFilter.MinFilter(7))      # chiude i buchi
    mp = m.load()
    s0 = (seme[0] - x, seme[1] - y)
    if mp[s0] == 0:
        raise SystemExit(f'il sentiero: il seme {seme} non è su terra battuta')
    visti, pila = {s0}, [s0]
    while pila:
        i, j = pila.pop()
        for n in ((i + 1, j), (i - 1, j), (i, j + 1), (i, j - 1)):
            if 0 <= n[0] < w and 0 <= n[1] < h and n not in visti and mp[n] > 0:
                visti.add(n)
                pila.append(n)
    sola = Image.new('L', c.size, 0)
    sp = sola.load()
    for i, j in visti:
        sp[i, j] = 255
    sola = sola.filter(ImageFilter.MaxFilter(bordo * 2 + 1))                    # il bordo d'erba
    return c, sola.filter(ImageFilter.GaussianBlur(3))


def compone(fg):
    pezzi = [(Image.open(FOGLIETTO.parent / p['file']).convert('RGB'), p['x']) for p in fg['pezzi']]
    largo = max(im.size[0] + x for im, x in pezzi)
    alto = max(im.size[1] for im, _ in pezzi)
    tela = Image.new('RGB', (largo, alto))
    for im, x in pezzi:
        tela.paste(im, (x, 0))
    for g in fg.get('giunte', []):
        giunta(tela, pezzi, g)
    return tela


def giunta(tela, pezzi, g):
    """Sfuma la giunta fra due pezzi e ci stende il sentiero."""
    gx, fascia = g['x'], g['fascia']
    (a, ax), (b, bx) = [p for p in pezzi if p[1] in (g['a'], g['b'])]
    L, A = tela.size
    # il pezzo di sinistra prosegue specchiato oltre il suo bordo, quello di destra prima del suo
    strato_a = tela.copy()
    strato_a.paste(a.transpose(Image.FLIP_LEFT_RIGHT), (ax + a.size[0], 0))
    strato_b = tela.copy()
    strato_b.paste(b.transpose(Image.FLIP_LEFT_RIGHT), (bx - b.size[0], 0))
    x0, x1 = gx - fascia // 2, gx + fascia // 2
    # la scelta si fa su una griglia di blocchi da 4 px; un filtro mediano toglie i blocchi isolati
    # (i coriandoli), così un ciuffo di chioma passa intero e non a pezzetti
    bl, ba = (x1 - x0) // 4, A // 4
    blocchi = Image.new('L', (bl, ba), 0)
    bp = blocchi.load()
    for by in range(ba):
        for bxx in range(bl):
            x = x0 + bxx * 4
            w = liscia((x + 2 - x0) / fascia)
            # due scale di macchie, così il bordo non è una riga dritta
            n = 0.7 * ruido(x, by * 4, g.get('macchia', 28), 1) + 0.3 * ruido(x, by * 4, 14, 2)
            n = min(0.999, max(0.0, 0.5 + (n - 0.5) * 1.8))
            bp[bxx, by] = 255 if n < w else 0
    blocchi = blocchi.filter(ImageFilter.MedianFilter(g.get('mediano', 3)))
    scelta = Image.new('L', tela.size, 0)
    scelta.paste(blocchi.resize((bl * 4, ba * 4), Image.NEAREST), (x0, 0))
    tela.paste(Image.composite(strato_b, strato_a, scelta).crop((x0, 0, x1, A)), (x0, 0))
    if 'sentiero' in g:
        stendi_sentiero(tela, a, ax, g['sentiero'])


def bezier(p, n):
    pts = []
    for i in range(n + 1):
        t = i / n
        u = 1 - t
        pts.append((u ** 3 * p[0][0] + 3 * u * u * t * p[1][0] + 3 * u * t * t * p[2][0] + t ** 3 * p[3][0],
                    u ** 3 * p[0][1] + 3 * u * u * t * p[1][1] + 3 * u * t * t * p[2][1] + t ** 3 * p[3][1]))
    return pts


def campiona(im, x, y):
    """Il colore in (x, y) con l'interpolazione bilineare."""
    x0, y0 = int(math.floor(x)), int(math.floor(y))
    fx, fy = x - x0, y - y0
    px = im.load()
    W, H = im.size
    def at(i, j):
        v = px[min(max(i, 0), W - 1), min(max(j, 0), H - 1)]
        return v if isinstance(v, tuple) else (v,)
    a, b, c, d = at(x0, y0), at(x0 + 1, y0), at(x0, y0 + 1), at(x0 + 1, y0 + 1)
    return tuple(round((a[k] * (1 - fx) + b[k] * fx) * (1 - fy) + (c[k] * (1 - fx) + d[k] * fx) * fy)
                 for k in range(len(a)))


def stendi_sentiero(tela, a, ax, sg):
    """Il sentiero che esce dal bordo del primo pezzo entra nel bosco. Non si
    disegna niente: si prende un pezzo di sentiero già disegnato (`sorgente`,
    da un punto a un altro del suo asse, col suo bordo d'erba) e lo si stende
    lungo la `curva` che porta dall'uscita al villaggio, tirandolo quanto basta
    per coprirla. Prima si rimette l'originale sopra la fascia, che se lo
    mangerebbe."""
    (sx0, sy0), (sx1, sy1) = sg['sorgente']
    riq = sg['riquadro']
    c, m = sentiero_dirt(a, [riq[0] - ax, riq[1], riq[2], riq[3]], [sx1 - ax, sy1], sg.get('bordo', 8))
    # l'originale, dove la fascia l'ha toccato
    tela.paste(c, (riq[0], riq[1]), m)
    # la sorgente: un asse dritto, `lunga` px, con la sua normale
    Ls = math.hypot(sx1 - sx0, sy1 - sy0)
    ux, uy = (sx1 - sx0) / Ls, (sy1 - sy0) / Ls
    nx, ny = -uy, ux
    pts = bezier(sg['curva'], 240)
    cum = [0.0]
    for p, q in zip(pts, pts[1:]):
        cum.append(cum[-1] + math.hypot(q[0] - p[0], q[1] - p[1]))
    S = cum[-1]
    mezza = sg.get('mezza', 34)
    # per ogni pixel vicino alla curva: il punto più vicino dell'asse, a che distanza di lato
    xs = [p[0] for p in pts]
    ys = [p[1] for p in pts]
    box = (int(min(xs) - mezza - 2), int(min(ys) - mezza - 2), int(max(xs) + mezza + 2), int(max(ys) + mezza + 2))
    meglio = {}
    for k, (qx, qy) in enumerate(pts):
        k2 = min(k + 1, len(pts) - 1)
        k1 = max(k - 1, 0)
        tx, ty = pts[k2][0] - pts[k1][0], pts[k2][1] - pts[k1][1]
        lt = math.hypot(tx, ty) or 1
        tx, ty = tx / lt, ty / lt
        for yy in range(int(qy) - mezza - 1, int(qy) + mezza + 2):
            for xx in range(int(qx) - mezza - 1, int(qx) + mezza + 2):
                d2 = (xx - qx) ** 2 + (yy - qy) ** 2
                if d2 < meglio.get((xx, yy), (1e18,))[0]:
                    lat = (xx - qx) * -ty + (yy - qy) * tx
                    meglio[(xx, yy)] = (d2, cum[k], lat)
    fade = sg.get('sfuma', 14)
    mp = m.load()
    tp = tela.load()
    for (xx, yy), (d2, s_, lat) in meglio.items():
        if abs(lat) > mezza or not (0 <= xx < tela.size[0] and 0 <= yy < tela.size[1]):
            continue
        u = s_ / S * Ls                        # lungo la sorgente
        qx = sx0 + ux * u + nx * lat
        qy = sy0 + uy * u + ny * lat
        i, j = qx - riq[0], qy - riq[1]
        if not (0 <= i < c.size[0] - 1 and 0 <= j < c.size[1] - 1):
            continue
        al = campiona(m, i, j)[0] / 255
        al *= min(1.0, s_ / fade, (S - s_) / fade)      # attacca e finisce senza gradino
        if al <= 0:
            continue
        col = c.getpixel((round(i), round(j)))
        v = tp[xx, yy]
        tp[xx, yy] = tuple(round(v[k] * (1 - al) + col[k] * al) for k in range(3))



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
    for nome in ('partenza', 'minatore', 'portale'):
        if not passa(*fg[nome]['piede']):
            guasti.append(f'{nome}: il piede {fg[nome]["piede"]} non è camminabile')
    if not passa(*fg['minatore']['accanto']):
        guasti.append(f'minatore: dove si sta per parlargli {fg["minatore"]["accanto"]} non è camminabile')
    if not passa(*fg['portale']['accanto']):
        guasti.append(f'portale: dove ci si ferma {fg["portale"]["accanto"]} non è camminabile')
    fermi = [tuple(fg['minatore']['piede'])]
    fissi = {**fg.get('mercanti', {}), **fg.get('personaggi', {})}
    for nome, chi in fissi.items():   # non `m`: è la maschera, e `passa` la legge
        for campo in ('piede', 'accanto'):
            if not passa(*chi[campo]):
                guasti.append(f'{nome}: {campo} {chi[campo]} non è camminabile')
        fermi.append(tuple(chi['piede']))
    if len(set(fermi)) != len(fermi):
        guasti.append('due che stanno fermi nella stessa cella')
    for nome, chi in [('minatore', fg['minatore']), ('portale', fg['portale'])] + list(fissi.items()):
        if tuple(chi['accanto']) in fermi:
            guasti.append(f'{nome}: ci si fermerebbe addosso a qualcuno che sta fermo ({chi["accanto"]})')
    if not passa(*fg['cartello']['piede']):
        guasti.append(f'il piede del cartello {fg["cartello"]["piede"]} non è camminabile')
    if guasti:
        raise SystemExit('il foglietto non torna:\n  ' + '\n  '.join(guasti))


def genera():
    fg = leggi()
    im = mappa(fg)
    controlla(fg, im)
    b64 = in_base64(im, 'WEBP', quality=fg['qualita'], method=6)
    kb = len(b64) * 3 // 4 // 1024
    dest = REPO / fg['modulo']
    corpo = TESTA.format(largo=im.size[0], alto=im.size[1], kb=kb)
    corpo += f"\nexport const LARGO = {im.size[0]}, ALTO = {im.size[1]}\n"
    corpo += f"export const CELLA = {fg['cella']}\n\n"
    corpo += 'export const MASCHERA = [\n' + ''.join(f"  '{r}',\n" for r in fg['maschera']) + ']\n\n'
    corpo += 'export const POSTI = {\n' + ''.join(
        f"  {js(n)}: {js(p)},\n" for n, p in fg['posti'].items()) + '}\n\n'
    for nome in ('partenza', 'minatore', 'cartello', 'mercanti', 'personaggi', 'portale'):
        corpo += f"export const {nome.upper()} = {js(fg.get(nome, {}))}\n"
    corpo += f"\nexport const MAPPA = 'data:image/webp;base64,{b64}'\n"
    dest.write_text(corpo)
    print(f'{dest.relative_to(REPO)}: mappa {im.size[0]}×{im.size[1]}, {kb} KB')
    icone(fg, im)


# ── le icone delle discese ──────────────────────────────────────────
# Un'emoji non dice quale pozzo: un pezzo della mappa sì. Si ritaglia un
# quadrato attorno al `riquadro` del posto (`margine` volte il lato più
# lungo), lo si rimpicciolisce a `lato` e lo si chiude in un tondo pieno fino
# a `pieno` del raggio e sfumato oltre, così sta su qualunque fondo.
def icona(im, riquadro, ic):
    x, y, w, h = riquadro
    cx, cy = x + w / 2, y + h / 2
    mezzo = max(w, h) * ic.get('margine', 1.1) / 2
    lato = ic.get('lato', 96)
    c = im.crop((round(cx - mezzo), round(cy - mezzo), round(cx + mezzo), round(cy + mezzo)))
    c = c.resize((lato, lato), Image.LANCZOS).convert('RGBA')
    pieno = ic.get('pieno', 0.72)
    m = Image.new('L', (lato, lato), 0)
    mp = m.load()
    for j in range(lato):
        for i in range(lato):
            d = math.hypot(i + 0.5 - lato / 2, j + 0.5 - lato / 2) / (lato / 2)
            a = 1 if d < pieno else 0 if d >= 1 else 1 - liscia((d - pieno) / (1 - pieno))
            mp[i, j] = round(a * 255)
    c.putalpha(m)
    return c


def icone(fg, im):
    ic = fg['icone']
    dati = {n: in_base64(icona(im, p['riquadro'], ic), 'WEBP', quality=ic.get('qualita', 80), method=6)
            for n, p in fg['posti'].items()}
    kb = sum(len(b) for b in dati.values()) * 3 // 4 // 1024
    dest = REPO / ic['modulo']
    corpo = TESTA_ICONE.format(lato=ic.get('lato', 96), kb=kb)
    corpo += '\nexport const ICONE = {\n' + ''.join(
        f"  {js(n)}: 'data:image/webp;base64,{b}',\n" for n, b in dati.items()) + '}\n'
    dest.write_text(corpo)
    print(f'{dest.relative_to(REPO)}: {len(dati)} icone, {kb} KB')


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


def guarda_giunta():
    """La giunta ingrandita: a sinistra i pezzi accostati a secco, a destra
    com'è dopo lo strumento; in tre foto (alto, basso, il sentiero). Si guarda
    a occhio e se stona si scrive il riquadro da ridipingere."""
    fg = leggi()
    pezzi = [(Image.open(FOGLIETTO.parent / p['file']).convert('RGB'), p['x']) for p in fg['pezzi']]
    secco = Image.new('RGB', mappa(fg).size)
    for im, x in pezzi:
        secco.paste(im, (x, 0))
    tela = mappa(fg)
    TMP.mkdir(parents=True, exist_ok=True)
    for g in fg.get('giunte', []):
        gx = g['x']
        for nome, (y0, y1, mezza, zoom) in {'alta': (0, 768, 240, 1), 'bassa': (768, 1536, 240, 1),
                                            'sentiero': (1020, 1340, 200, 2)}.items():
            box = (gx - mezza, y0, gx + mezza, y1)
            a, b = secco.crop(box), tela.crop(box)
            fuori = Image.new('RGB', (a.size[0] * 2 * zoom + 8, a.size[1] * zoom), (255, 0, 255))
            fuori.paste(a.resize((a.size[0] * zoom, a.size[1] * zoom), Image.NEAREST), (0, 0))
            fuori.paste(b.resize((b.size[0] * zoom, b.size[1] * zoom), Image.NEAREST), (a.size[0] * zoom + 8, 0))
            fuori.save(TMP / f'giunta-{nome}.png')
    print('tmp/terra/giunta-alta.png, giunta-bassa.png, giunta-sentiero.png (a sinistra a secco, a destra com\'è)')


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
    for m in fg.get('mercanti', {}).values():
        piede(m['piede'], (255, 140, 40, 255))
        piede(m['accanto'], (255, 200, 120, 160))
    for nome, m in fg.get('personaggi', {}).items():
        piede(m['piede'], (40, 220, 220, 255))
        piede(m['accanto'], (150, 240, 240, 160))
        d.text((m['piede'][0] * c, m['piede'][1] * c - 12), nome, fill=(255, 255, 255, 255))
    piede(fg['portale']['piede'], (150, 120, 255, 255))
    piede(fg['portale']['accanto'], (190, 170, 255, 160))
    TMP.mkdir(parents=True, exist_ok=True)
    Image.alpha_composite(im, velo).save(TMP / 'provino.png')
    print('tmp/terra/provino.png')


if __name__ == '__main__':
    if '--proponi' in sys.argv:
        proponi()
    elif '--provino' in sys.argv:
        provino()
    elif '--giunta' in sys.argv:
        guarda_giunta()
    else:
        genera()
