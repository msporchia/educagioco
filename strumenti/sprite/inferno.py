#!/usr/bin/env python3
"""I pezzi dell'inferno che nessuno ha dipinto, fatti in codice dai pezzi che ci sono (scena `sotterraneo_6.png` e tavole `arredo-inferno.png`).

    python3 strumenti/sprite/inferno.py            # riscrive sotterraneo_6_derivati.png e .json
    python3 strumenti/sprite/inferno.py --provino  # e un foglio da guardare in tmp/inferno.png

Poi `python3 strumenti/sprite/atlante.py sotterraneo`. Regola «prima in codice, poi dipinto» (docs/sotterraneo/scenari.md, «L'inferno»):
un pezzo che manca si ricava da quelli dipinti, e se non regge si fa chiedere al modello. Cosa esce, in pixel di gioco:

  inferno-porta-chiara   la porta di legno più chiara
  inferno-fianco-*       le porte viste da sopra in un muro laterale (tavola stretta di 6×20), colori campionati da ogni porta
  inferno-scala-chiusa   la scala in cornice di pietra chiusa dalla grata col lucchetto (la grata e il lucchetto stanno in
                         `per_i_derivati` del foglietto della tavola: nell'atlante non servono)
"""
import json
import sys

from PIL import Image, ImageEnhance

import derivati

SCENA = 'sotterraneo/generati/sotterraneo_6.png'
ARREDO = 'sotterraneo/generati/arredo-inferno.png'
FOGLIO = 'sotterraneo_6_derivati'


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


def fianco(colore, ferro=False, oro=False):
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


def costruisci():
    sc = derivati.tessere_di(SCENA)
    ar = derivati.tessere_di(ARREDO)
    p = {}
    semplice = ar['inferno-porta-semplice']
    p['inferno-porta-chiara'] = chiara(semplice)
    col = {k: colore_medio(v, (v.width // 3, v.height // 2, 2 * v.width // 3, 4 * v.height // 5))
           for k, v in (('semplice', semplice), ('ferro', sc['inferno-porta-ferro']), ('bella', sc['inferno-porta-bella']),
                        ('chiara', p['inferno-porta-chiara']))}
    p['inferno-fianco-semplice'] = fianco(col['semplice'])
    p['inferno-fianco-ferro'] = fianco(col['ferro'], ferro=True)
    p['inferno-fianco-bella'] = fianco(col['bella'], oro=True)
    p['inferno-fianco-chiara'] = fianco(col['chiara'])
    solo = derivati.tessere_di(ARREDO, 'per_i_derivati')
    p['inferno-scala-chiusa'] = scala_chiusa(ar['inferno-scala-aperta'], solo['inferno-grata'], solo['inferno-lucchetto'])
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
            "la porta chiara, i fianchi e la scala chiusa. "
            "Dalla scena sotterraneo_6.png e dalla tavola arredo-inferno.png.")
    foglietto = {
        '__': nota, 'fondo': 'trasparente', 'cella': [1, 1],
        'famiglie': {'inferno-porta': 'figura', 'inferno-fianco': 'figura', 'inferno-scala': 'figura'},
        'trasforma': {'inferno-porta': {'giri': 1}, 'inferno-fianco': {'giri': 1, 'specchia': False},
                      'inferno-scala': {'giri': 1, 'specchia': False}},
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
