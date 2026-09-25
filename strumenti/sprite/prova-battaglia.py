#!/usr/bin/env python3
"""Una battaglia finta sulle carte vestite: torri e mostri, per vedere
l'effetto finale e capire cosa manca.

    python3 strumenti/sprite/prova-battaglia.py carte.json uscita.png

La lancia `carte-castello.mjs`, che le carte (con le loro vie) le fa col
generatore vero del gioco. Niente qui è il gioco: è una fotografia messa
in posa, con tutto quello che c'è già in casa —

  · **le torri** da `sorgenti/castello/non-usati/PVX1O.png`, il foglio di
    agosto con le torri in tre stadi: dodici colonne, e le nostre quattro
    coi loro otto rami ci stanno quasi una a una (`FIGURE`). ⚠ Quel foglio
    ha la provenienza non documentata, come `terreni.png`: va rifatto col
    generatore prima di pubblicare, ed è anche l'occasione di farlo nella
    mano delle scene;
  · **i mostri** dai fogli generati del sotterraneo (`mostri-1.png`,
    `mostri-2.png`), coi loro foglietti: sei dei diciotto del castello ci
    sono già (`MOSTRI`), gli altri no, e la prova lo dice.
"""
import json
import sys
from pathlib import Path
from PIL import Image, ImageDraw

import vesti

QUI = Path(__file__).parent
C = vesti.C
FOGLIO_TORRI = QUI / 'sorgenti' / 'castello' / 'non-usati' / 'PVX1O.png'
MOSTRI_SOT = QUI / 'sorgenti' / 'sotterraneo' / 'generati'
SCENE = QUI / 'sorgenti' / 'castello' / 'generati'

# ── le torri: dove sta ognuna nel foglio ─────────────────────────────
# Le colonne del foglio, misurate (i separatori sono righe verticali
# piene), e le tre bande degli stadi.
COLONNE = ['Archer', 'Magic', 'Frost', 'Poison', 'Bomb', 'Sniper', 'Rapid Fire Archer',
           'Fire', 'Lightning', 'Arcane', 'Artillery', 'Support']
SEPARATORI = [0, 129, 245, 365, 495, 620, 743, 864, 975, 1083, 1193, 1302, 1408]
STADI = [(19, 106), (125, 233), (256, 373)]
# (torre, stadio, ramo) → (colonna, riga). Lo stadio 0 è la torre com'è
# nata (livelli 1-3), poi il ramo sceglie la figura: 1 cresciuta, 2 al
# massimo. Il ghiaccio col ramo della bufera resta nella sua colonna, che
# finisce in un tornado; la brina prende i cristalli di «Arcane».
FIGURE = {
    ('arciere', 0, None): ('Archer', 0),
    ('arciere', 1, 'cecchino'): ('Sniper', 1), ('arciere', 2, 'cecchino'): ('Sniper', 2),
    ('arciere', 1, 'raffica'): ('Rapid Fire Archer', 1), ('arciere', 2, 'raffica'): ('Rapid Fire Archer', 2),
    ('magica', 0, None): ('Magic', 0),
    ('magica', 1, 'veleno'): ('Poison', 1), ('magica', 2, 'veleno'): ('Poison', 2),
    ('magica', 1, 'catena'): ('Lightning', 1), ('magica', 2, 'catena'): ('Lightning', 2),
    ('ghiaccio', 0, None): ('Frost', 0),
    ('ghiaccio', 1, 'bufera'): ('Frost', 1), ('ghiaccio', 2, 'bufera'): ('Frost', 2),
    ('ghiaccio', 1, 'brina'): ('Arcane', 1), ('ghiaccio', 2, 'brina'): ('Arcane', 2),
    ('bombe', 0, None): ('Bomb', 0),
    ('bombe', 1, 'mortaio'): ('Artillery', 1), ('bombe', 2, 'mortaio'): ('Artillery', 2),
    ('bombe', 1, 'napalm'): ('Fire', 1), ('bombe', 2, 'napalm'): ('Fire', 2),
}
SCALA_TORRI = 0.72

# ── i mostri: quelli del castello che il sotterraneo ha già ─────────
# nome nel castello → nome nel foglietto del sotterraneo
MOSTRI = {'slime': 'melma', 'pipistrello': 'pipistrello', 'lupo': 'lupo',
          'golem': 'golem', 'troll': 'troll', 'fantasma': 'fantasma'}
SCALA_MOSTRI = 2.5


def torre(foglio, colonna, riga):
    i = COLONNE.index(colonna)
    x0, x1 = SEPARATORI[i] + 3, SEPARATORI[i + 1] - 3
    y0, y1 = STADI[riga]
    cella = foglio.crop((x0, y0, x1, y1))
    box = cella.split()[3].point(lambda v: 255 if v > 100 else 0).getbbox()
    im = cella.crop(box)
    return im.resize((round(im.width * SCALA_TORRI), round(im.height * SCALA_TORRI)), Image.LANCZOS)


def mostri():
    """Il primo fotogramma di ogni mostro che c'è, dai foglietti."""
    fuori = {}
    for nome in ('mostri-1', 'mostri-2'):
        f = json.loads((MOSTRI_SOT / f'{nome}.json').read_text())
        s = f['scala']
        im = Image.open(MOSTRI_SOT / f'{nome}.png').convert('RGBA')
        for nostro, loro in MOSTRI.items():
            d = f['sprite'].get(f'{loro}-fermo-0')
            if not d:
                continue
            (x, y), (w, h) = d['da'], d['cella']
            pz = im.crop((x * s, y * s, (x + w) * s, (y + h) * s))
            pz = pz.resize((w, h), Image.NEAREST)        # alla misura vera, poi su
            fuori[nostro] = pz.resize((round(w * SCALA_MOSTRI), round(h * SCALA_MOSTRI)), Image.NEAREST)
    return fuori


def in_posa(carta, scena, foglio, bestie):
    righe, vie = carta['righe'], carta['vie']
    p = vesti.pezzi(scena)
    im = vesti.vesti(righe, p).convert('RGBA')
    figure = []
    # le torri: una varietà di tipi, stadi e rami, piazzola per piazzola
    piazzole = [(x, y) for y, r in enumerate(righe) for x, c in enumerate(r) if c == 'o']
    scelte = list(FIGURE)
    ordine = [scelte[(k * 7) % len(scelte)] for k in range(len(piazzole))]
    for (x, y), chiave in zip(piazzole, ordine):
        t = torre(foglio, *FIGURE[chiave])
        figure.append((y * C + C - 10, t, x * C + (C - t.width) // 2, y * C + C - 10 - t.height))
    # i mostri: in fila sulle strade, a passi di tre celle, e guardano
    # dove vanno — le pose sono a destra, la sinistra è specchiata
    nomi = list(bestie)
    k = 0
    for via in vie:
        for i in range(2, len(via) - 1, 3):
            (x, y), (nx, ny) = via[i], via[i + 1]
            b = bestie[nomi[k % len(nomi)]]
            k += 1
            if nx < x:
                b = b.transpose(Image.FLIP_LEFT_RIGHT)
            cx, cy = x * C + C // 2, y * C + C // 2 + 10
            figure.append((cy, b, cx - b.width // 2, cy - b.height))
    for _, pz, x, y in sorted(figure, key=lambda f: f[0]):
        # un'ombra piatta sotto i piedi: senza, le figure galleggiano
        ombra = Image.new('RGBA', (pz.width, 12), (0, 0, 0, 0))
        ImageDraw.Draw(ombra).ellipse([pz.width * 0.15, 2, pz.width * 0.85, 11], fill=(0, 0, 0, 70))
        im.alpha_composite(ombra, (x, y + pz.height - 8))
        im.alpha_composite(pz, (x, y))
    return im.convert('RGB')


def catalogo(foglio, bestie, uscita):
    """Le venti figure di torre come il gioco le chiede, e i mostri:
    quelli che ci sono e i nomi di quelli che mancano."""
    sys.path.insert(0, str(QUI))
    im = Image.new('RGB', (1500, 560), (40, 42, 40))
    d = ImageDraw.Draw(im)
    x, y = 12, 12
    for (tipo, stadio, ramo), (col, riga) in FIGURE.items():
        t = torre(foglio, col, riga)
        im.paste(t, (x, y + 90 - t.height), t)
        d.text((x, y + 96), f'{tipo} {stadio}' + (f' {ramo}' if ramo else ''), fill=(230, 230, 220))
        x += 145
        if x > 1400:
            x, y = 12, y + 130
    y += 150
    x = 12
    for nome, b in bestie.items():
        im.paste(b, (x, y + 70 - b.height), b)
        d.text((x, y + 76), nome, fill=(230, 230, 220))
        x += 90
    mancano = ['goblin', 'ragno', 'orco', 'scheletro', 'arpia', 'drago', 'corvo', 'rovo',
               'verme', 'blatta', 'corazziere', 'balestriere']
    d.text((x + 20, y + 30), 'mancano: ' + ', '.join(m for m in mancano if m not in bestie),
           fill=(240, 150, 120))
    im.save(uscita)


def main():
    carte = json.loads(Path(sys.argv[1]).read_text())
    uscita = Path(sys.argv[2])
    foglio = Image.open(FOGLIO_TORRI).convert('RGBA')
    bestie = mostri()
    quale = next(c for c in carte if c['nome'] == 'Le fogne')
    pose = [in_posa(quale, Image.open(SCENE / f).convert('RGB'), foglio, bestie)
            for f in ('td_1.png', 'td_2.png', 'td_3.png')]
    w, h = pose[0].size
    tutte = Image.new('RGB', (w * 3 + 32, h), (20, 20, 20))
    for i, im in enumerate(pose):
        tutte.paste(im, (i * (w + 16), 0))
    tutte.save(uscita)
    catalogo(foglio, bestie, uscita.with_name(uscita.stem + '-figure.png'))
    print(f'{uscita.name} e {uscita.stem}-figure.png: {len(bestie)} mostri su 18')


if __name__ == '__main__':
    main()
