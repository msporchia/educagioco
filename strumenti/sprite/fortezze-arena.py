#!/usr/bin/env python3
"""Le fortezze dipinte di Castle Battle: dal foglio al modulo del gioco.

    python3 strumenti/sprite/fortezze-arena.py [provino.png]
    python3 strumenti/sprite/fortezze-arena.py --testate

`--testate` scrive gli allegati della voce 9c: il ponte di ogni terreno dipinto ritagliato con le due rive
(`sorgenti/arena/schemi/ponte-<posto>.png`), perché la porta si dipinga sopra la sua testata, con la sua pietra.
Un foglio `"facoltativo"` che non c'è ancora si salta.

Legge `sorgenti/arena/fortezze.json` (i fogli e cosa c'è in ogni riga), trova le figure da sé con `righe.py` e
controlla che i conti tornino. Un nome che torna in un foglio dopo vince su quello di prima. Il provino è uno per
foglio: `provino-1.png`, `provino-2.png`… Ogni pezzo si porta alla sua larghezza (`LARGHEZZE`), senza stirarlo; il punto
d'appoggio è il piede. Scrive `src/giochi/arena/dati/fortezze-dipinte.js` (un atlante WebP e i pezzi). Come le usa la
scena: docs/arena/grafica.md.
"""
import base64
import json
import sys
from pathlib import Path

from PIL import Image

sys.path.insert(0, str(Path(__file__).parent))
import codifica  # noqa: E402
import righe  # noqa: E402
import vesti  # noqa: E402

QUI = Path(__file__).resolve().parent
REPO = QUI.parent.parent
SORGENTI = QUI / 'sorgenti' / 'arena'
MODULO = REPO / 'src' / 'giochi' / 'arena' / 'dati' / 'fortezze-dipinte.js'
LARGHEZZE = {'castello': 306, 'porta': 144}    # px dell'atlante; il castello è largo quanto quello del foglio di prima
LARGO = 1024


def pulito(sorgente, fondo):
    """Il foglio senza fondo. Di difetto è trasparente con l'alone; `"scacchiera"` è la trasparenza dipinta
    (ChatGPT, la riga della cenere): via dai bordi, poi le tasche chiuse dentro le figure, come il buco del
    portone rotto, e il filo chiaro che resta attorno."""
    if fondo != 'scacchiera':
        return righe.senza_alone(Image.open(sorgente))
    im = vesti.senza_fondo(str(sorgente), 'scacchiera').copy()
    px, w, h = im.load(), im.width, im.height
    vesti.tasche(px, w, h, lambda c: max(c[:3]) - min(c[:3]) < 16 and min(c[:3]) > 150)
    vesti.sfrangia(px, w, h, lambda c: max(c[:3]) - min(c[:3]) < 24 and min(c[:3]) > 120)
    return im


def testate():
    """Il ponte di ogni terreno con un po' di riva sopra e sotto: il ponte sta al centro, largo il 10% e fra il 41% e il 56% dell'altezza."""
    for posto in ('bosco', 'palude', 'neve', 'lava'):
        terreno = Image.open(SORGENTI / f'terreno-{posto}.png').convert('RGB')
        w, h = terreno.size
        uscita = SORGENTI / 'schemi' / f'ponte-{posto}.png'
        terreno.crop((round(w * 0.36), round(h * 0.3), round(w * 0.64), round(h * 0.67))).save(uscita)
        print(uscita.relative_to(REPO))


def main():
    if sys.argv[1:] == ['--testate']:
        return testate()
    scheda = json.loads((SORGENTI / 'fortezze.json').read_text())
    figure = {}
    for i, f in enumerate(scheda['fogli'], 1):
        sorgente = SORGENTI / f['foglio']
        if not sorgente.exists() and f.get('facoltativo'):
            continue
        if not sorgente.exists():
            sys.exit(f'manca {sorgente.relative_to(REPO)}: voci 9 e 9b di strumenti/sprite/DA-GENERARE.md')
        foglio = pulito(sorgente, f.get('fondo'))
        trovate = righe.righe_di_figure(foglio, stacco=f['stacco'])
        attese = [len(r) for r in f['righe']]
        if [len(r) for r in trovate] != attese:
            sys.exit(f"{f['foglio']}: attese righe da {attese}, trovate da {[len(r) for r in trovate]}: "
                     f"python3 strumenti/sprite/righe.py {sorgente} provino.png")
        if len(sys.argv) > 1:
            uscita = Path(sys.argv[1])
            righe.provino(foglio, trovate, str(uscita.with_name(f'{uscita.stem}-{i}{uscita.suffix}')))
        for nomi, rettangoli in zip(f['righe'], trovate):
            for nome, (x, y, w, h) in zip(nomi, rettangoli):
                k = LARGHEZZE[nome.split(':')[0]] / w
                figure[nome] = foglio.crop((x, y, x + w, y + h)).resize((max(1, round(w * k)), max(1, round(h * k))), Image.LANCZOS)
    pezzi = list(figure.items())
    # l'atlante: a scaffali, dal più alto
    pezzi.sort(key=lambda p: -p[1].size[1])
    atlante, pos, xx, yy, alto = [], {}, 0, 0, 0
    for nome, fig in pezzi:
        w, h = fig.size
        if xx + w > LARGO:
            xx, yy, alto = 0, yy + alto + 2, 0
        pos[nome] = [xx, yy, w, h]
        atlante.append((fig, xx, yy))
        xx, alto = xx + w + 2, max(alto, h)
    im = Image.new('RGBA', (LARGO, yy + alto), (0, 0, 0, 0))
    for fig, x, y in atlante:
        im.alpha_composite(fig, (x, y))
    dati = codifica.webp(im)
    print(f'  {len(pos)} pezzi, atlante {codifica.riga(im, dati)}')
    MODULO.write_text('/* GENERATO da strumenti/sprite/fortezze-arena.py: non si tocca a mano.\n'
                      '   Castelli e porte dipinti di Castle Battle (docs/arena/grafica.md). PEZZI: nome →\n'
                      '   [x, y, largo, alto], in px dell\'atlante. Vuoto = restano quelli di dati/opere-disegnate.js. */\n'
                      'export const PEZZI = {\n'
                      + ''.join(f"  '{n}': {json.dumps(v)},\n" for n, v in sorted(pos.items()))
                      + '}\n'
                      f"export const ATLANTE = 'data:image/webp;base64,{base64.b64encode(dati).decode()}'\n")
    print(f'{MODULO.relative_to(REPO)}: {len(dati) // 1024} KB')


if __name__ == '__main__':
    main()
