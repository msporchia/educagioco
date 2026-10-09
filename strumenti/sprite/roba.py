#!/usr/bin/env python3
"""Le figure della roba del sotterraneo: guardarle, sceglierle, ritagliarle.

    python3 strumenti/sprite/roba.py                        # tutte, in tmp/roba/catalogo.png
    python3 strumenti/sprite/roba.py bastone scudo          # solo quelle categorie
    python3 strumenti/sprite/roba.py spada-29 veste-07      # solo quelle figure
    python3 strumenti/sprite/roba.py --elemento fuoco --stile mago --libere
    python3 strumenti/sprite/roba.py --foglietto bastone-11 veste-07
    python3 strumenti/sprite/roba.py --gioco                # gli aspetti: foglietti e dati/aspetti.js

Le figure stanno in `sorgenti/sotterraneo/generati/roba.json`, una per
voce: il foglio, il rettangolo sul foglio grande e la descrizione (cos'è,
elemento, materia, a chi sta bene, pregio). Quali sono già in gioco non
è scritto lì: lo dicono i foglietti, e si ricava qui. `--foglietto`
stampa le righe da incollare nel foglietto del loro foglio, alla sua
scala. `--gioco` porta in gioco ogni figura che ha un `pezzo`: scrive le
sue righe in un blocco dei foglietti e la tabella `ASPETTI` in
`src/giochi/sotterraneo/dati/aspetti.js`; poi si rilancia `atlante.py`.
Il perché: docs/sotterraneo/figure.md.
"""
import argparse
import json
import math
from pathlib import Path

from PIL import Image, ImageDraw, ImageFont

QUI = Path(__file__).resolve().parent
GENERATI = QUI / 'sorgenti' / 'sotterraneo' / 'generati'
FUORI = QUI.parent.parent / 'tmp' / 'roba'
ASPETTI_JS = QUI.parent.parent / 'src' / 'giochi' / 'sotterraneo' / 'dati' / 'aspetti.js'
INIZIO, FINE = '__aspetti', '__aspetti-fine'


def figure():
    return json.loads((GENERATI / 'roba.json').read_text())['figure']


def scrivi(dati):
    """Una figura per riga, così un ritocco a mano è un diff di una riga."""
    righe = ',\n'.join('    ' + json.dumps(v, ensure_ascii=False) for v in dati['figure'])
    (GENERATI / 'roba.json').write_text('{\n  "__": ' + json.dumps(dati['__'], ensure_ascii=False)
                                        + ',\n  "figure": [\n' + righe + '\n  ]\n}\n')


def foglietto_di(foglio):
    return json.loads((GENERATI / foglio).with_suffix('.json').read_text())


def in_gioco(voci):
    """Lo sprite di ogni figura già ritagliata: il centro del suo ritaglio
    cade dentro il rettangolo della figura. Gli aspetti (chiamati come la
    figura) non contano: sono il blocco che scrive `--gioco`."""
    ids = {v['id'] for v in voci}
    fuori, fogli = {}, {}
    for v in voci:
        if v['foglio'] not in fogli:
            fg = foglietto_di(v['foglio'])
            s = fg.get('scala', 1)
            fogli[v['foglio']] = [(k, (p['da'][0] + p['cella'][0] / 2) * s, (p['da'][1] + p['cella'][1] / 2) * s)
                                  for k, p in fg['sprite'].items()
                                  if isinstance(p, dict) and 'da' in p and k not in ids]
        x, y, w, h = v['rettangolo']
        for k, cx, cy in fogli[v['foglio']]:
            if x <= cx <= x + w and y <= cy <= y + h:
                fuori[v['id']] = k
    return fuori


def riga_del_foglietto(v):
    s = foglietto_di(v['foglio']).get('scala', 1)
    x, y, w, h = v['rettangolo']
    da = [x // s, y // s]
    cella = [math.ceil((x + w) / s) - da[0], math.ceil((y + h) / s) - da[1]]
    return f'"{v["id"]}": {{ "da": {da}, "cella": {cella} }}'


def buchi_di(v):
    """Il vuoto dentro un arco o un ciondolo si toglie (FORMATO.md, `buchi`): come i pezzi a mano del foglio."""
    if 'buchi' in v:            # un vuoto più grande del solito, dichiarato sulla figura
        return v['buchi']
    if not v['id'].startswith(('arco', 'amuleto')):
        return None
    return True if v['foglio'] == 'bottino-e-arredo.png' else {'max': 40, 'tolleranza': 40}


def nel_gioco(voci, usate):
    """Gli aspetti: le figure con un `pezzo` che nessun foglietto ritaglia già. Riscrive il blocco fra
    `__aspetti` e `__aspetti-fine` in ogni foglietto (tutto il resto del foglietto resta com'è) e la tabella
    del gioco, che tiene anche le figure di base già in gioco."""
    per_foglio = {}
    for v in voci:
        if v.get('pezzo') and v['id'] not in usate:
            riga = riga_del_foglietto(v)
            b = buchi_di(v)
            if b is not None:
                riga = riga[:-2] + ', "buchi": ' + json.dumps(b).replace('{', '{ ').replace('}', ' }') + ' }'
            per_foglio.setdefault(v['foglio'], []).append('    ' + riga)
    for foglio in ('bottino-e-arredo.png', 'scudi.png', 'armature-e-vesti.png'):
        f = (GENERATI / foglio).with_suffix('.json')
        righe = f.read_text().split('\n')
        dentro = [i for i, r in enumerate(righe) if r.strip().startswith((f'"{INIZIO}"', f'"{FINE}"'))]
        if dentro:
            del righe[dentro[0] - 1 if righe[dentro[0] - 1].strip() == '' else dentro[0]:dentro[-1] + 1]
            righe[dentro[0] - 1] = righe[dentro[0] - 1].rstrip(',')
        if per_foglio.get(foglio):
            fine = max(i for i, r in enumerate(righe) if r.strip() == '}' and righe[i + 1].strip() == '}')
            blocco = ([f'    "{INIZIO}": "generato da strumenti/sprite/roba.py --gioco dal catalogo roba.json: non si tocca a mano",']
                      + [r + ',' for r in per_foglio[foglio]] + [f'    "{FINE}": ""'])
            righe[fine - 1] = righe[fine - 1].rstrip(',') + ','
            righe[fine:fine] = blocco
        testo = '\n'.join(righe)
        json.loads(testo)
        f.write_text(testo)
    tabella = {}
    for v in voci:
        if v.get('pezzo'):
            tabella.setdefault(v['pezzo'], []).append(
                f"{{ sprite: '{usate.get(v['id'], v['id'])}', tinta: '{v.get('elemento', 'nessuno')}', pregio: {v.get('pregio', 1)} }}")
    corpo = ',\n'.join(f"  '{k}': [\n    " + ',\n    '.join(a) + ',\n  ]' for k, a in tabella.items())
    ASPETTI_JS.write_text(
        '// GENERATO da strumenti/sprite/roba.py --gioco dal catalogo roba.json: non si scrive a mano.\n'
        '// Le figure che può avere un pezzo trovato, per base: la tinta (l\'elemento che la figura richiama) e il pregio\n'
        '// (1 da bottega, 4 da leggenda). Chi sceglie è aspettoDi in dati/cose.js (docs/sotterraneo/figure.md)\n'
        'export const ASPETTI = {\n' + corpo + ',\n}\n')
    n = sum(len(r) for r in per_foglio.values())
    print(f'{n} aspetti nei foglietti, {sum(len(a) for a in tabella.values())} figure per {len(tabella)} pezzi → {ASPETTI_JS}')


def catalogo(voci, usate, dove):
    COL, CW, CH = 10, 150, 172
    font = ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf', 13)
    piccolo = ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf', 11)
    F = Image.new('RGB', (COL * CW, max(1, math.ceil(len(voci) / COL)) * CH), 'black')
    D = ImageDraw.Draw(F)
    fogli = {}
    for i, v in enumerate(voci):
        im = fogli.setdefault(v['foglio'], Image.open(GENERATI / v['foglio']).convert('RGB'))
        x, y, w, h = v['rettangolo']
        c = im.crop((x, y, x + w, y + h))
        s = min(118 / c.width, 118 / c.height)
        c = c.resize((round(c.width * s), round(c.height * s)), Image.LANCZOS)
        cx, cy = (i % COL) * CW, (i // COL) * CH
        F.paste(c, (cx + (CW - c.width) // 2, cy + 4 + (118 - c.height) // 2))
        k = usate.get(v['id'])
        D.rectangle((cx + 2, cy + 2, cx + CW - 3, cy + CH - 3),
                    outline=(70, 200, 90) if k else (45, 45, 45), width=3 if k else 1)
        D.text((cx + CW // 2, cy + 132), v['id'], font=font, fill=(230, 230, 230), anchor='mm')
        sotto = k or v.get('pezzo') or '— fuori'
        D.text((cx + CW // 2, cy + 150), sotto[:24], font=piccolo,
               fill=(120, 230, 130) if k else (160, 160, 160), anchor='mm')
    dove.parent.mkdir(parents=True, exist_ok=True)
    F.save(dove)


def main():
    a = argparse.ArgumentParser(description=__doc__.split('\n')[0])
    a.add_argument('categorie', nargs='*', help='categorie (spada ascia arco bastone veste scudo amuleto) o id interi')
    a.add_argument('--elemento')
    a.add_argument('--stile')
    a.add_argument('--materia')
    a.add_argument('--pregio', type=int, help='almeno questo')
    a.add_argument('--libere', action='store_true', help='solo quelle che nessun foglietto ritaglia')
    a.add_argument('--foglietto', nargs='+', metavar='ID')
    a.add_argument('--gioco', action='store_true', help='porta in gioco le figure col loro pezzo')
    o = a.parse_args()
    voci = figure()
    if o.gioco:
        nel_gioco(voci, in_gioco(voci))
        return
    if o.foglietto:
        per_id = {v['id']: v for v in voci}
        for i in o.foglietto:
            v = per_id[i]
            print(f'{v["foglio"]}:  {riga_del_foglietto(v)}')
        return
    usate = in_gioco(voci)
    scelte = [v for v in voci
              if (not o.categorie or v['id'].split('-')[0] in o.categorie or v['id'] in o.categorie)
              and (not o.elemento or v.get('elemento') == o.elemento)
              and (not o.stile or v.get('stile') == o.stile)
              and (not o.materia or v.get('materia') == o.materia)
              and (not o.pregio or v.get('pregio', 0) >= o.pregio)
              and not (o.libere and v['id'] in usate)]
    dove = FUORI / 'catalogo.png'
    catalogo(scelte, usate, dove)
    for v in scelte:
        print(f'{v["id"]:12} {usate.get(v["id"], ""):18} {v.get("nome", "")}')
    print(f'{len(scelte)} figure, {sum(1 for v in scelte if v["id"] in usate)} in gioco → {dove}')


if __name__ == '__main__':
    main()
