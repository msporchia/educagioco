#!/usr/bin/env python3
"""I pezzi dell'inferno che nessuno ha dipinto, fatti in codice dai pezzi che ci sono (scena `sotterraneo_6.png` e tavole `arredo-inferno.png`).

    python3 strumenti/sprite/inferno.py            # riscrive sotterraneo_6_derivati.png e .json
    python3 strumenti/sprite/inferno.py --provino  # e un foglio da guardare in tmp/inferno.png

Poi `python3 strumenti/sprite/atlante.py sotterraneo`. Regola «prima in codice, poi dipinto» (docs/sotterraneo/scenari.md, «L'inferno»):
un pezzo che manca si ricava da quelli dipinti, e se non regge si fa chiedere al modello. Cosa esce, in pixel di gioco:

  inferno-pav-stanze     64×48  il pavimento delle stanze: il ritaglio grezzo della scena con le cuciture sfumate (una banda di 6 px ai bordi)
  inferno-pav-corridoi   16×64  il pavimento dei corridoi, come sopra
  inferno-tetto          64×64  la roccia nera da sopra: massi scuri a macchie (Voronoi sul toro, quindi senza cuciture) e qualche vena di brace
  inferno-medaglione     48×48  un pentagramma inciso sul pavimento, sotto la fontana (la scena ne ha uno con la ciotola dentro, che sulla fontana farebbe doppio)
  inferno-porta-chiara   la porta di legno più chiara
  inferno-porta-aperta   la stessa con l'anta girata e il buio nell'arco
  inferno-fianco-*       le stesse viste da sopra in un muro laterale (tavola stretta di 6×20), colori campionati da ogni porta
  inferno-scala-chiusa   la scala in cornice di pietra chiusa dalla grata col lucchetto
  inferno-fontana-asciutta  la coppa di lava senza lava
"""
import colorsys
import json
import random
import sys

from PIL import Image, ImageDraw, ImageEnhance

import derivati

SCENA = 'sotterraneo/generati/sotterraneo_6.png'
ARREDO = 'sotterraneo/generati/arredo-inferno.png'
FOGLIO = 'sotterraneo_6_derivati'
BANDA = 6                              # larghezza della sfumatura sulle cuciture, in pixel di gioco


def senza_cuciture(im, banda=BANDA):
    """Un ritaglio che si ripete: la banda di destra sfuma verso i pixel di sinistra, quella in basso verso quelli in alto."""
    w, h = im.size
    px = im.load()
    out = im.copy()
    o = out.load()
    for x in range(w - banda, w):
        t = (x - (w - banda) + 1) / (banda + 1)           # 0 dentro, 1 al bordo
        for y in range(h):
            a, b = px[x, y], px[x - (w - banda), y]
            o[x, y] = tuple(round(a[i] * (1 - t) + b[i] * t) for i in range(4))
    px = out.load()
    for y in range(h - banda, h):
        t = (y - (h - banda) + 1) / (banda + 1)
        for x in range(w):
            a, b = px[x, y], px[x, y - (h - banda)]
            o[x, y] = tuple(round(a[i] * (1 - t) + b[i] * t) for i in range(4))
    return out


def tetto(dim=64, semi=1015, n=26):
    """Massi scuri su un toro: ogni pixel prende il seme più vicino (con la distanza che si avvolge), il tono viene dal seme, il filo fra due massi è più scuro."""
    r = random.Random(semi)
    seme = [(r.randrange(dim), r.randrange(dim), r.choice([(26, 20, 22), (31, 24, 27), (22, 17, 19), (36, 28, 31), (28, 21, 24)]), r.random() < 0.10)
            for _ in range(n)]
    im = Image.new('RGBA', (dim, dim))
    px = im.load()

    def dist(x, y, s):
        dx, dy = abs(x - s[0]), abs(y - s[1])
        dx, dy = min(dx, dim - dx), min(dy, dim - dy)
        return dx * dx + dy * dy
    for y in range(dim):
        for x in range(dim):
            ds = sorted(((dist(x, y, s), s) for s in seme), key=lambda t: t[0])
            (d1, s1), (d2, _) = ds[0], ds[1]
            filo = (d2 ** 0.5) - (d1 ** 0.5)
            c = s1[2]
            # il lume viene da in alto a sinistra: il masso è un poco più chiaro dove guarda il lume
            dx, dy = x - s1[0], y - s1[1]
            dx, dy = (dx + dim // 2) % dim - dim // 2, (dy + dim // 2) % dim - dim // 2
            k = 1 + 0.18 * (-(dx + dy) / 14)
            c = tuple(max(0, min(255, round(v * k))) for v in c)
            if filo < 1.6:
                c = (11, 8, 9)
            elif filo < 2.6 and s1[3]:
                c = (70, 26, 18)                      # una vena di brace in qualche filo
            px[x, y] = (*c, 255)
    return im


def medaglione(pav, dim=48):
    """Pentagramma inciso: pavimento, un cerchio, la stella e cinque punti di brace; il bagliore è un cerchio più scuro dentro."""
    base = Image.new('RGBA', (dim, dim))
    for x in range(0, dim, pav.width):
        base.paste(pav.crop((0, 0, min(pav.width, dim - x), dim)), (x, 0))
    d = ImageDraw.Draw(base)
    c, R = (dim - 1) / 2, dim / 2 - 4
    d.ellipse([c - R - 2, c - R - 2, c + R + 2, c + R + 2], outline=(52, 22, 18, 255))
    d.ellipse([c - R, c - R, c + R, c + R], outline=(150, 46, 26, 255))
    import math
    p = [(c + R * math.sin(2 * math.pi * k / 5), c - R * math.cos(2 * math.pi * k / 5)) for k in range(5)]
    for k in range(5):
        a, b = p[k], p[(k + 2) % 5]
        d.line([a, b], fill=(150, 46, 26, 255), width=1)
    for a in p:
        d.ellipse([a[0] - 1.5, a[1] - 1.5, a[0] + 1.5, a[1] + 1.5], fill=(214, 96, 40, 255))
    return base


def colore_medio(im, box):
    px = im.load()
    v = [px[x, y] for x in range(box[0], box[2]) for y in range(box[1], box[3]) if px[x, y][3] > 200]
    return tuple(round(sum(c[i] for c in v) / len(v)) for i in range(3)) if v else (60, 40, 30)


def chiara(porta):
    """Lo stesso legno schiarito verso l'osso: la porta di un posto meno minaccioso."""
    rgb = porta.convert('RGB')
    rgb = ImageEnhance.Brightness(rgb).enhance(1.55)
    rgb = ImageEnhance.Color(rgb).enhance(0.55)
    out = rgb.convert('RGBA')
    out.putalpha(porta.getchannel('A'))
    return out


def aperta(porta):
    """L'arco resta, dentro c'è il buio e a sinistra l'anta girata contro lo stipite."""
    w, h = porta.size
    out = porta.copy()
    px = out.load()
    legno = colore_medio(porta, (w // 3, h // 2, 2 * w // 3, 4 * h // 5))
    x0, x1, y0, y1 = round(w * 0.24), round(w * 0.76), round(h * 0.30), round(h * 0.92)
    for y in range(y0, y1):
        t = (y - y0) / max(1, y1 - y0)
        for x in range(x0, x1):
            if px[x, y][3] < 200:
                continue
            px[x, y] = (round(18 - 8 * t), round(12 - 6 * t), round(12 - 6 * t), 255)
    for y in range(y0 + 1, y1):
        for x in (x0, x0 + 1):
            px[x, y] = (*legno, 255) if x == x0 else tuple(round(v * 0.72) for v in legno) + (255,)
    return out


def fianco(colore, ferro=False, oro=False, aperto=False):
    """La tavola stretta vista da sopra: una guancia di pietra a sinistra (come le facce vere del posto) e il legno a destra."""
    im = Image.new('RGBA', (6, 20), (0, 0, 0, 0))
    px = im.load()
    pietra = [(30, 22, 22), (86, 76, 78), (118, 106, 108), (86, 76, 78)]
    for y in range(1, 19):
        for i, c in enumerate(pietra[:3]):
            px[i + 1, y] = (*c, 255)
    for y in range(2, 19):
        for x in (4, 5):
            px[x, y] = (*(tuple(round(v * (0.7 if x == 5 else 1)) for v in colore)), 255)
    for x in range(1, 6):
        px[x, 1] = (*pietra[2], 255)
        px[x, 19] = (*pietra[0], 255)
    if ferro:
        for y in (6, 13):
            px[4, y] = px[5, y] = (92, 92, 98, 255)
    if oro:
        px[4, 5] = px[4, 11] = px[4, 16] = (210, 160, 50, 255)
    if aperto:
        for y in range(3, 18):
            px[4, y] = px[5, y] = (14, 10, 10, 255)
        for y in range(3, 7):
            px[4, y] = (*colore, 255)
    return im


def scala_chiusa(scala, grata, lucchetto):
    out = scala.copy()
    w, h = scala.size
    g = grata.resize((w - 2, h - 2), Image.NEAREST)
    out.alpha_composite(g, (1, 1))
    lu = lucchetto
    if lu.height > 7:
        lu = lu.resize((max(3, round(lu.width * 7 / lu.height)), 7), Image.NEAREST)
    out.alpha_composite(lu, ((w - lu.width) // 2, h - lu.height - 2))
    return out


def asciutta(coppa):
    """La lava (rossi, arancioni e gialli saturi) diventa pietra scura del colore della coppa."""
    out = coppa.copy()
    px = out.load()
    for y in range(out.height):
        for x in range(out.width):
            r, g, b, a = px[x, y]
            if a < 200:
                continue
            h, s, v = colorsys.rgb_to_hsv(r / 255, g / 255, b / 255)
            if (h < 0.17 or h > 0.96) and s > 0.55 and v > 0.45:
                px[x, y] = (round(34 + 14 * (1 - v)), round(26 + 10 * (1 - v)), round(26 + 10 * (1 - v)), 255)
    return out


def costruisci():
    sc = derivati.tessere_di(SCENA)
    ar = derivati.tessere_di(ARREDO)
    p = {}
    p['inferno-pav-stanze'] = senza_cuciture(sc['inferno-grezzo-pav-stanze'])
    p['inferno-pav-corridoi'] = senza_cuciture(sc['inferno-grezzo-pav-corridoi'])
    p['inferno-tetto'] = tetto()
    p['inferno-medaglione'] = medaglione(p['inferno-pav-stanze'])
    semplice = ar['inferno-porta-semplice']
    p['inferno-porta-chiara'] = chiara(semplice)
    p['inferno-porta-aperta'] = aperta(semplice)
    col = {k: colore_medio(v, (v.width // 3, v.height // 2, 2 * v.width // 3, 4 * v.height // 5))
           for k, v in (('semplice', semplice), ('ferro', sc['inferno-porta-ferro']), ('bella', sc['inferno-porta-bella']),
                        ('chiara', p['inferno-porta-chiara']))}
    p['inferno-fianco-semplice'] = fianco(col['semplice'])
    p['inferno-fianco-ferro'] = fianco(col['ferro'], ferro=True)
    p['inferno-fianco-bella'] = fianco(col['bella'], oro=True)
    p['inferno-fianco-chiara'] = fianco(col['chiara'])
    p['inferno-fianco-aperta'] = fianco(col['semplice'], aperto=True)
    p['inferno-scala-chiusa'] = scala_chiusa(ar['inferno-scala-aperta'], ar['inferno-grata'], ar['inferno-lucchetto'])
    p['inferno-fontana-asciutta'] = asciutta(ar['inferno-coppa-lava'])
    return p


def scrivi(pezzi):
    nomi = sorted(pezzi)
    larghezza, x, y, riga = 256, 0, 0, 0
    posti = {}
    for n in nomi:
        w, h = pezzi[n].size
        if x + w > larghezza:
            x, y, riga = 0, y + riga + 1, 0
        posti[n] = (x, y)
        x += w + 1
        riga = max(riga, h)
    foglio = Image.new('RGBA', (larghezza, y + riga + 1), (0, 0, 0, 0))
    sprite = {}
    for n in nomi:
        foglio.paste(pezzi[n], posti[n])
        sprite[n] = {'da': list(posti[n]), 'cella': list(pezzi[n].size)}
    dest = derivati.SORGENTI / 'sotterraneo/generati' / FOGLIO
    foglio.save(dest.with_suffix('.png'), optimize=True)
    nota = ("Il foglietto di sotterraneo_6_derivati.png: i pezzi dell'inferno costruiti in codice da `strumenti/sprite/inferno.py` (il PNG si rifà col comando, non si tocca): "
            "pavimenti senza cuciture, il tetto, il medaglione del pentagramma, le porte chiara e aperta, i fianchi, la scala chiusa e la fontana asciutta. "
            "Dalla scena sotterraneo_6.png e dalla tavola arredo-inferno.png.")
    foglietto = {
        '__': nota, 'fondo': 'trasparente', 'cella': [1, 1],
        'famiglie': {'inferno-pav': 'fondo', 'inferno-tetto': 'fondo', 'inferno-medaglione': 'fondo', 'inferno-porta': 'figura',
                     'inferno-fianco': 'figura', 'inferno-scala': 'figura', 'inferno-fontana': 'figura'},
        'trasforma': {'inferno-porta': {'giri': 1}, 'inferno-fianco': {'giri': 1, 'specchia': False},
                      'inferno-scala': {'giri': 1, 'specchia': False}, 'inferno-fontana': {'giri': 1}},
        'sprite': sprite,
    }
    dest.with_suffix('.json').write_text(json.dumps(foglietto, indent=2, ensure_ascii=False) + '\n')
    print(f'{dest.relative_to(derivati.REPO)}.png: {len(nomi)} pezzi, {foglio.width}×{foglio.height}')


def provino(pezzi):
    S = 6
    nomi = sorted(pezzi)
    tele = Image.new('RGB', (1400, 1000), (52, 52, 62))
    x = y = riga = 10
    for n in nomi:
        im = pezzi[n]
        g = im.resize((im.width * S, im.height * S), Image.NEAREST)
        if x + g.width > 1390:
            x, y, riga = 10, y + riga + 12, 0
        tele.paste(g, (x, y), g)
        x += g.width + 12
        riga = max(riga, g.height)
    (derivati.REPO / 'tmp').mkdir(exist_ok=True)
    tele.save(derivati.REPO / 'tmp/inferno.png')


if __name__ == '__main__':
    pezzi = costruisci()
    scrivi(pezzi)
    if '--provino' in sys.argv:
        provino(pezzi)
