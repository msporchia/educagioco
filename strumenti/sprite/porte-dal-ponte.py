#!/usr/bin/env python3
"""Le porte di Castle Battle ricavate dal ponte dipinto, non dipinte a parte (docs/arena/grafica.md, «La porta è il ponte»).

    python3 strumenti/sprite/porte-dal-ponte.py [provino.png]

Una porta dipinta a parte resta una figurina posata sul ponte: è vista di fronte su una mappa vista dall'alto, con la sua luce e il suo
contorno. Qui la porta nasce dai pixel del terreno: le torri sono i due pilastri di una testata del ponte, alzati copiando il loro
fusto, e fra loro un muretto merlato fatto con la fascia di pietra che attraversa il piano lì. Sono le stesse pietre, la stessa luce
e la stessa grana per costruzione. Dove stanno pilastri e fascia, per ogni terreno: `sorgenti/arena/porte-dal-ponte.json`, in pixel
del dipinto `terreno-<posto>.png`. In cima la porta del nemico, in fondo quella di chi gioca, che si guarda da dietro (la sbarra).

Scrive `src/giochi/arena/dati/porte-dal-ponte.js`: `PORTE['palude:nem:rotta']` → [x, y, largo, alto] nell'atlante e il
rettangolo di mondo dove va, così la scena la posa esattamente sopra il dipinto, senza misure sue.
"""
import base64
import json
import re
import sys
from pathlib import Path

from PIL import Image, ImageDraw, ImageEnhance

sys.path.insert(0, str(Path(__file__).parent))
import codifica  # noqa: E402

QUI = Path(__file__).resolve().parent
REPO = QUI.parent.parent
SORGENTI = QUI / 'sorgenti' / 'arena'
MODULO = REPO / 'src' / 'giochi' / 'arena' / 'dati' / 'porte-dal-ponte.js'
TERRENI = REPO / 'src' / 'giochi' / 'arena' / 'dati' / 'terreni-pronti.js'
STATI = ('intera', 'rotta')            # crollata non c'è niente: restano i pilastri del ponte, come sono dipinti
NERO, BRUNO = (19, 13, 4, 255), (97, 64, 25, 255)
LEGNO, LEGNO_SCURO, VENA = (120, 70, 32, 255), (96, 54, 24, 255), (52, 28, 10, 255)
FERRO, ORO = (58, 58, 66, 255), (255, 200, 60, 255)
# i colori degli stendardi già per squadra: la scena non ricolora queste porte, che hanno i cristalli azzurri del canyon
STENDARDO = {'io': ((30, 70, 205, 255), (18, 42, 140, 255)), 'nem': ((200, 36, 30, 255), (128, 20, 16, 255))}


def scurito(im, k):
    return ImageEnhance.Brightness(im).enhance(k)


def pilastro(terreno, box, alzo):
    """Il pilastro alzato: il cappello spostato in su di `alzo`, e sotto il fusto copiato da quello che c'è sotto il cappello.
    Torna (immagine, x, y) in pixel del dipinto."""
    x0, y0, x1, y1 = box
    fx0, fx1 = x0 + 3, x1 - 3                                       # il fusto è più stretto del cappello
    im = Image.new('RGBA', (x1 - x0, y1 - y0 + alzo), (0, 0, 0, 0))
    fusto = terreno.crop((fx0, y1, fx1, y1 + alzo))
    im.paste(fusto, (fx0 - x0, y1 - y0))
    cappello = terreno.crop((x0, y0, x1, y1))
    maschera = Image.new('L', cappello.size, 0)
    d = ImageDraw.Draw(maschera)
    alto = cappello.height
    d.rectangle((0, int(alto * 0.36), cappello.width - 1, alto - 1), fill=255)          # la piastra
    d.ellipse((int(cappello.width * 0.12), 0, int(cappello.width * 0.88), int(alto * 0.75)), fill=255)   # la cupola
    im.paste(cappello, (0, 0), maschera)
    return im, x0, y0 - alzo


def fila(fascia, larga, alta, sfasa):
    """La pietra della fascia ripetuta su `alta` righe, a mattoni sfalsati."""
    fw, fh = fascia.size
    im = Image.new('RGBA', (larga, alta))
    for n, y in enumerate(range(0, alta, fh)):
        dx = (sfasa if n % 2 else 0) % fw
        for x in range(-dx, larga, fw):
            im.paste(fascia, (x, y))
    return im


def stendardo(d, cx, y, lato):
    chiaro, scuro = STENDARDO[lato]
    d.polygon([(cx - 6, y), (cx + 6, y), (cx + 6, y + 18), (cx, y + 24), (cx - 6, y + 18)], fill=chiaro, outline=NERO)
    d.line([(cx + 5, y + 1), (cx + 5, y + 17)], fill=scuro)
    d.polygon([(cx, y + 7), (cx + 3, y + 10), (cx, y + 13), (cx - 3, y + 10)], fill=ORO)


def portone(d, cx, piede, largo, alto, dietro, rotto):
    l, r, t = cx - largo // 2, cx + largo // 2, piede - alto
    arco = (l, t, r, t + largo)
    # la cornice di pietra chiara attorno all'arco
    d.pieslice((arco[0] - 3, arco[1] - 3, arco[2] + 3, arco[3] + 3), 180, 360, fill=(255, 236, 140, 255), outline=NERO)
    d.rectangle((l - 3, t + largo // 2, r + 3, piede), fill=(255, 236, 140, 255), outline=NERO)
    interno = (40, 24, 12, 255) if rotto else LEGNO
    d.pieslice(arco, 180, 360, fill=interno)
    d.rectangle((l, t + largo // 2, r, piede), fill=interno)
    if rotto:
        for i, (a, b) in enumerate([(l + 2, piede - 4), (r - 6, piede - 2), (cx - 2, piede - 1)]):
            d.polygon([(a, b), (a + 5, b - 14 + 3 * i), (a + 9, b - 12 + 3 * i), (a + 5, b)], fill=LEGNO_SCURO, outline=NERO)
        return
    for x in range(l + 5, r, 6):
        d.line([(x, t + 4), (x, piede)], fill=VENA)
    for y in (t + largo // 2 + 3, piede - 5):
        d.line([(l, y), (r, y)], fill=FERRO, width=2)
    if dietro:                                          # da dietro: la sbarra che lo tiene chiuso
        y = (t + largo // 2 + piede) // 2
        d.rectangle((l - 5, y - 2, r + 5, y + 2), fill=(160, 104, 46, 255), outline=NERO)
    d.line([(cx, t + 2), (cx, piede)], fill=VENA, width=2)


def porta(terreno, testata, stato, lato):
    """Una porta su una testata: (immagine, x, y) in pixel del dipinto."""
    sx, dx, fa = testata['pilastri'][0], testata['pilastri'][1], testata['fascia']
    alzo, piede = testata.get('alzo', 36), testata.get('piede', fa[3])
    fascia = terreno.crop(tuple(fa)).convert('RGBA')
    x0, x1 = sx[0] - 6, dx[2] + 6
    y0, y1 = min(sx[1], dx[1]) - alzo - 12, piede + 12
    im = Image.new('RGBA', (x1 - x0, y1 - y0), (0, 0, 0, 0))
    X, Y = (lambda v: v - x0), (lambda v: v - y0)
    xa, xb = sx[2] - 2, dx[0] + 2                       # il muretto, fra i due pilastri
    faccia, cima = 36, 12
    d = ImageDraw.Draw(im)
    # la faccia del muro, in ombra, poi la cima, al sole, e i merli
    im.paste(scurito(fila(fascia, xb - xa, faccia, fascia.width // 3), 0.9), (X(xa), Y(piede - faccia)))
    im.paste(scurito(fila(fascia, xb - xa, cima, 0), 1.12), (X(xa), Y(piede - faccia - cima)))
    d.line([(X(xa), Y(piede - faccia)), (X(xb), Y(piede - faccia))], fill=BRUNO, width=2)
    d.rectangle((X(xa), Y(piede - faccia - cima), X(xb) - 1, Y(piede) - 1), outline=NERO, width=2)
    merli = [m for m in range(xa + 6, xb - 12, 19)]
    for i, m in enumerate(merli):
        if stato == 'rotta' and i % 2:
            continue
        t = piede - faccia - cima - 10
        im.paste(scurito(fila(fascia, 14, 10, i * 7), 1.12), (X(m), Y(t)))
        d.rectangle((X(m), Y(t), X(m) + 13, Y(t) + 10), outline=NERO, width=2)
    portone(d, X((xa + xb) // 2), Y(piede), 40, 33, lato == 'io', stato == 'rotta')
    if stato == 'rotta':
        for cx, cy in ((xa + 12, piede - 20), (xb - 16, piede - 24)):
            d.line([(X(cx), Y(cy)), (X(cx) + 4, Y(cy) + 6), (X(cx) + 1, Y(cy) + 11), (X(cx) + 5, Y(cy) + 17)], fill=NERO, width=2)
    # le torri: i pilastri alzati, sopra il muretto, con lo stendardo
    for box in (sx, dx):
        torre, tx, ty = pilastro(terreno, box, alzo)
        im.alpha_composite(torre, (X(tx), Y(ty)))
        if stato == 'intera':
            stendardo(d, X((box[0] + box[2]) // 2), Y(box[3] - alzo + 4), lato)
    return im, x0, y0


def main():
    scheda = json.loads((SORGENTI / 'porte-dal-ponte.json').read_text())
    D = dict(re.findall(r'(\w): (-?\d+)', re.search(r'PEZZO_DI_MONDO = \{([^}]*)\}', TERRENI.read_text()).group(1)))
    D = {k: int(v) for k, v in D.items()}
    pezzi = []
    for posto, testate in scheda['posti'].items():
        terreno = Image.open(SORGENTI / f'terreno-{posto}.png').convert('RGB')
        kx, ky = D['w'] / terreno.width, D['h'] / terreno.height
        for lato, chiave in (('nem', 'su'), ('io', 'giu')):
            for stato in STATI:
                im, x, y = porta(terreno, testate[chiave], stato, lato)
                l, t, r, b = im.getchannel('A').getbbox()
                mondo = [round(D['x'] + (x + l) * kx, 2), round(D['y'] + (y + t) * ky, 2), round((r - l) * kx, 2), round((b - t) * ky, 2)]
                pezzi.append((f'{posto}:{lato}:{stato}', im.crop((l, t, r, b)), mondo))
    pos, xx, yy, alto = {}, 0, 0, 0
    for nome, im, mondo in pezzi:
        if xx + im.width > 1024:
            xx, yy, alto = 0, yy + alto + 2, 0
        pos[nome] = [xx, yy, im.width, im.height] + mondo
        xx, alto = xx + im.width + 2, max(alto, im.height)
    atlante = Image.new('RGBA', (1024, yy + alto), (0, 0, 0, 0))
    for nome, im, _ in pezzi:
        atlante.alpha_composite(im, tuple(pos[nome][:2]))
    if len(sys.argv) > 1:
        atlante.save(sys.argv[1])
    dati = codifica.webp(atlante)
    MODULO.write_text('/* GENERATO da strumenti/sprite/porte-dal-ponte.py: non si tocca a mano.\n'
                      '   Le porte di Castle Battle ricavate dal ponte dipinto (docs/arena/grafica.md). PORTE: `<posto>:<lato>:<stato>`\n'
                      '   → [x, y, largo, alto] nell\'atlante, poi [x, y, largo, alto] nel mondo: va posata lì, sopra il dipinto. Crollata non c\'è:\n'
                      '   restano i pilastri del ponte. Gli stendardi hanno già il colore della squadra: non si ricolorano. */\n'
                      'export const PORTE = {\n'
                      + ''.join(f"  '{a}': {json.dumps(b)},\n" for a, b in sorted(pos.items()))
                      + '}\n'
                      f"export const ATLANTE = 'data:image/webp;base64,{base64.b64encode(dati).decode()}'\n")
    print(f'{MODULO.relative_to(REPO)}: {len(pos)} pezzi, {len(dati) // 1024} KB')


if __name__ == '__main__':
    main()
