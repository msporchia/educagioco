#!/usr/bin/env python3
"""Una battaglia finta sulle carte vestite: torri e mostri, per vedere
l'effetto finale e capire cosa manca.

    python3 strumenti/sprite/prova-battaglia.py carte.json uscita.png bestiario.json

La lancia `carte-castello.mjs`, che le carte (con le loro vie) le fa col
generatore vero del gioco. Niente qui è il gioco: è una fotografia messa
in posa, con tutto quello che c'è già in casa —

  · **le torri** dal foglio delle torri, come le ritaglia `vesti.py`
    per il gioco (`torri-<n>.png`);
  · **i mostri** come li ritaglia `vesti.py` per il gioco, e in ogni
    vestito quelli del suo bestiario (`scena/bestiario.js`).

Cosa manca e con che prompt generarlo: `DA-GENERARE.md`, qui accanto.
"""
import json
import sys
from pathlib import Path
from PIL import Image, ImageDraw

import vesti

QUI = Path(__file__).parent
C = vesti.C

# ── i mostri ─────────────────────────────────────────────────────────
# Le creature le ritaglia `vesti.py` (il respiro dai fogli del
# sotterraneo, i passi dai fogli del cammino), e quale fa le veci di
# quale mostro in ogni vestito lo dice il bestiario del gioco, che
# `carte-castello.mjs` passa qui come terzo argomento. Alla misura del
# foglio, perché i fogli dei mostri sono dipinti a scala 4 come le scene:
# una cella da 64 px è 16 pixel del disegno in tutti e due. Ingranditi di
# due e mezzo (la prima prova) avevano la grana più fine della scena e
# sembravano appiccicati.


def in_posa(carta, vestito, torri, bestie):
    """La carta vestita, con una torre per piazzola e i mostri in fila
    sulle strade. `bestie` è la fila delle creature di quel vestito."""
    righe, vie = carta['righe'], carta['vie']
    p = vesti.pezzi_del_vestito(vestito)
    im = vesti.vesti(righe, p).convert('RGBA')
    figure = []
    # le torri: una varietà di tipi, stadi e rami, piazzola per piazzola
    piazzole = [(x, y) for y, r in enumerate(righe) for x, c in enumerate(r) if c == 'o']
    scelte = [k for k in torri if not k.endswith(':') or k.split(':')[2] == '0']
    ordine = [scelte[(k * 7) % len(scelte)] for k in range(len(piazzole))]
    for (x, y), chiave in zip(piazzole, ordine):
        t = torri[chiave]
        figure.append((y * C + C - 10, t, x * C + (C - t.width) // 2, y * C + C - 10 - t.height))
    # i mostri: in fila sulle strade, a passi di tre celle, e guardano
    # dove vanno — le pose sono a destra, la sinistra è specchiata
    k = 0
    for via in vie:
        for i in range(2, len(via) - 1, 3):
            (x, y), (nx, ny) = via[i], via[i + 1]
            b = bestie[k % len(bestie)]
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


def catalogo(torri, bestiario, pose, uscita):
    """Le venti figure di torre come il gioco le chiede, e sotto, un
    vestito per riga, i diciotto mostri con la creatura che li fa."""
    im = Image.new('RGB', (1900, 340 + 150 * len(bestiario)), (40, 42, 40))
    d = ImageDraw.Draw(im)
    x, y = 12, 12
    for chiave, t in torri.items():
        if chiave.endswith(':') and chiave.split(':')[2] != '0':
            continue
        im.paste(t, (x, y + 120 - t.height), t)
        d.text((x, y + 124), chiave[6:].rstrip(':'), fill=(230, 230, 220))
        x += 145
        if x > 1400:
            x, y = 12, y + 150
    y += 20
    for vestito, tab in bestiario.items():
        d.text((12, y), vestito, fill=(250, 220, 120))
        x = 80
        for mostro, chi in tab.items():
            b = pose[chi][0]
            s = min(1, 96 / max(b.size))
            b = b.resize((max(1, round(b.width * s)), max(1, round(b.height * s))), Image.LANCZOS)
            im.paste(b, (x, y + 100 - b.height), b)
            d.text((x, y + 104), mostro, fill=(230, 230, 220))
            d.text((x, y + 116), chi, fill=(160, 170, 160))
            x += 100
        y += 150
    im.save(uscita)


def main():
    carte = json.loads(Path(sys.argv[1]).read_text())
    uscita = Path(sys.argv[2])
    bestiario = json.loads(Path(sys.argv[3]).read_text())
    pz, _, fonte = vesti.figure_da_atlante()
    torri = {k: v for k, v in pz.items() if k.startswith('torre:')}
    pose = {}
    for k, v in pz.items():
        if k.startswith('mostro:'):
            pose.setdefault(k.split(':')[1], []).append(v)
    quale = next(c for c in carte if c['nome'] == 'Le fogne')
    # un vestito per tavola, tutti quelli che il bestiario conosce
    vestiti = tuple(bestiario)
    tavole = [in_posa(quale, v, torri, [pose[c][0] for c in bestiario[v].values()]) for v in vestiti]
    w, h = tavole[0].size
    tutte = Image.new('RGB', (w * len(tavole) + 16 * (len(tavole) - 1), h), (20, 20, 20))
    for i, im in enumerate(tavole):
        tutte.paste(im, (i * (w + 16), 0))
    tutte.save(uscita)
    catalogo(torri, bestiario, pose, uscita.with_name(uscita.stem + '-figure.png'))
    print(f'{uscita.name} e {uscita.stem}-figure.png: torri da {fonte["torri"]}, {len(pose)} creature')


if __name__ == '__main__':
    main()
