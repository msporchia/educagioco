#!/usr/bin/env python3
"""Le copertine dipinte della home: dai sorgenti al modulo del gioco.

    python3 strumenti/sprite/copertine.py            # rifà src/components/home/copertine-dipinte.js
    python3 strumenti/sprite/copertine.py --collana  # e tmp/copertine/collana.png, lo stile da allegare

Le sorgenti sono `sorgenti/home/copertina-<chiave>.{png,jpg,webp}` (la chiave
del gioco: `torri`, `passo`, `sotterraneo`…) e i fogli da quattro elencati in
`fogli.json` (un nome di file e quattro chiavi: alto a sinistra, alto a
destra, basso a sinistra, basso a destra), tagliati a croce e senza la riga
bianca fra un quadro e l'altro (la croce si cerca, i quadri non sono sempre uguali). Ognuna si porta sulla stessa `TELA` 3:2 (il
pezzo in mezzo, ingrandito o ridotto) e diventa una voce del modulo: ridotta a
`LARGA` px e codificata con `codifica.py`, col `fondo` della carta preso dal
colore medio del dipinto, e l'`icona` dell'indice e di «riprendi» ritagliata
col quadrato di `icone.json`, in pixel della tela. Un gioco senza sorgente
resta con la copertina disegnata in codice. Le misure, il prompt e
cosa si è scelto: `sorgenti/home/PROMPT-copertine.md` e docs/core/home.md.

Serve `pillow` (con WebP).
"""
import base64
import json
import re
import sys
from pathlib import Path

from PIL import Image

import codifica

QUI = Path(__file__).resolve().parent
REPO = QUI.parent.parent
SORGENTI = QUI / 'sorgenti' / 'home'
MODULO = REPO / 'src' / 'components' / 'home' / 'copertine-dipinte.js'

# la carta del carosello mostra il disegno a 176 px (`ARTE` in Carosello.vue): tre volte, per i telefoni a 3×
LARGA = 528
ALTA = LARGA * 2 // 3
# l'indice mostra l'icona a ~64 px: tre volte
ICONA = 192
# la misura comune di ogni sorgente: i quadrati di `icone.json` sono in questi pixel
TELA = (1536, 1024)


def tre_mezzi(im):
    """Il pezzo centrale a 3:2: un sorgente un po' più alto o più largo non si deforma."""
    w, h = im.size
    if w * 2 > h * 3:
        nw = h * 3 // 2
        return im.crop(((w - nw) // 2, 0, (w - nw) // 2 + nw, h))
    nh = w * 2 // 3
    return im.crop((0, (h - nh) // 2, w, (h - nh) // 2 + nh))


def senza_bianco(im, soglia=235):
    """Toglie dai bordi le righe e le colonne quasi tutte bianche: la croce
    che separa i quadri di un foglio, larga quanto vuole il generatore."""
    g = im.convert('L').point(lambda v: 255 if v >= soglia else 0)
    w, h = im.size
    bianca_riga = lambda y: sum(g.crop((0, y, w, y + 1)).histogram()[255:]) > w * 0.9
    bianca_col = lambda x: sum(g.crop((x, 0, x + 1, h)).histogram()[255:]) > h * 0.9
    alto, basso, sx, dx = 0, h, 0, w
    while alto < basso - 1 and bianca_riga(alto): alto += 1
    while basso - 1 > alto and bianca_riga(basso - 1): basso -= 1
    while sx < dx - 1 and bianca_col(sx): sx += 1
    while dx - 1 > sx and bianca_col(dx - 1): dx -= 1
    return im.crop((sx, alto, dx, basso))


def croce(foglio, soglia=235):
    """Dove passa la croce bianca fra i quattro quadri: la colonna e la riga più bianche
    fra il 30% e il 70% del foglio. I quadri non sono sempre uguali (in `foglio_arena`
    la croce sta a 858 px su 1536); senza una croce chiara, a metà."""
    g = foglio.convert('L').point(lambda v: 255 if v >= soglia else 0)
    w, h = foglio.size
    def piu_bianca(n, linea):
        conti = {i: sum(linea(i).histogram()[255:]) for i in range(int(n * 0.3), int(n * 0.7))}
        i = max(conti, key=conti.get)
        return i, conti[i]
    cx, bx = piu_bianca(w, lambda x: g.crop((x, 0, x + 1, h)))
    cy, by = piu_bianca(h, lambda y: g.crop((0, y, w, y + 1)))
    return (cx if bx > h * 0.5 else w // 2), (cy if by > w * 0.5 else h // 2)


def sorgenti():
    """(chiave, immagine) di ogni copertina: le singole e i quadri dei fogli."""
    for f in sorted(SORGENTI.glob('copertina-*.*')):
        m = re.fullmatch(r'copertina-([a-z0-9-]+)\.(png|jpe?g|webp)', f.name)
        if m:
            yield m.group(1), Image.open(f).convert('RGB')
    fogli = SORGENTI / 'fogli.json'
    for nome, chiavi in (json.loads(fogli.read_text()) if fogli.exists() else {}).items():
        if nome.startswith('_'):
            continue
        if not (SORGENTI / nome).exists():
            print(f'  manca {nome}: le sue quattro restano come prima')
            continue
        foglio = Image.open(SORGENTI / nome).convert('RGB')
        w, h = foglio.size
        cx, cy = croce(foglio)
        quadri = [(0, 0, cx, cy), (cx, 0, w, cy), (0, cy, cx, h), (cx, cy, w, h)]
        for k, quadro in zip(chiavi, quadri):
            if k:
                yield k, senza_bianco(foglio.crop(quadro))


def icona(im, quadrato):
    """Il quadrato del soggetto: quello del foglietto, o il centrale alto quanto l'immagine."""
    w, h = im.size
    x, y, lato = quadrato or ((w - h) // 2, 0, h)
    return im.crop((x, y, x + lato, y + lato)).resize((ICONA, ICONA), Image.LANCZOS)


def b64(dati):
    return 'data:image/webp;base64,' + base64.b64encode(dati).decode()


def collana(sorgenti):
    """Tutte le copertine fatte, in una tavola senza scritte: si allega al
    generatore come stile, e cresce a ogni copertina che arriva."""
    w, h, m, colonne = 768, 512, 24, 3
    righe = (len(sorgenti) + colonne - 1) // colonne
    tavola = Image.new('RGB', (colonne * w + (colonne + 1) * m, righe * h + (righe + 1) * m), 'white')
    for i, im in enumerate(sorgenti):
        tavola.paste(im.resize((w, h), Image.LANCZOS), (m + i % colonne * (w + m), m + i // colonne * (h + m)))
    dest = REPO / 'tmp' / 'copertine' / 'collana.png'
    dest.parent.mkdir(parents=True, exist_ok=True)
    tavola.save(dest)
    print(f'{dest.relative_to(REPO)}: {len(sorgenti)} copertine')


def main():
    quadrati = json.loads((SORGENTI / 'icone.json').read_text())
    voci = {}
    fatte = []
    for k, sorgente in sorted(sorgenti(), key=lambda v: v[0]):
        if k in voci:
            sys.exit(f'{k}: due sorgenti per la stessa copertina')
        tela = tre_mezzi(sorgente).resize(TELA, Image.LANCZOS)
        fatte.append(tela)
        im = tela.resize((LARGA, ALTA), Image.LANCZOS)
        dati = codifica.webp(im)
        ico = icona(tela, quadrati.get(k))
        dati_ico = codifica.webp(ico)
        r, g, b = im.resize((1, 1), Image.BOX).getpixel((0, 0))
        voci[k] = (b64(dati), b64(dati_ico), f'#{r:02x}{g:02x}{b:02x}', len(dati) + len(dati_ico))
        print(f'  {k:12} {codifica.riga(im, dati)}, icona {codifica.riga(ico, dati_ico)}, fondo {voci[k][2]}')
    corpo = ('/* GENERATO da strumenti/sprite/copertine.py: non si tocca a mano.\n'
             '   Le copertine dipinte dei giochi, per chiave (docs/core/home.md). */\n'
             'export const DIPINTE = {\n'
             + ''.join(f"  '{k}': {{ fondo: '{fondo}',\n    src: '{src}',\n    icona: '{ico}' }},\n"
                       for k, (src, ico, fondo, _) in voci.items())
             + '}\n')
    MODULO.write_text(corpo)
    kb = sum(v[3] for v in voci.values()) // 1024
    print(f'{MODULO.relative_to(REPO)}: {len(voci)} copertine, {kb} KB')
    if '--collana' in sys.argv:
        collana(fatte)


if __name__ == '__main__':
    main()
