#!/usr/bin/env python3
"""Il catalogo comune delle creature: leggerlo, misurarlo, guardarlo.

    python3 strumenti/sprite/creature.py provino                    # tutte, in tmp/creature/provino.png
    python3 strumenti/sprite/creature.py provino zombie ragno       # solo quelle
    python3 strumenti/sprite/creature.py controlla                  # i guasti del catalogo (esce 1 se ce n'è)
    python3 strumenti/sprite/creature.py catalogo                   # riscrive docs/core/creature-catalogo-*.md
    python3 strumenti/sprite/creature.py riga mostri-1 --y=0,110    # le figure di una fascia del foglio grande
    python3 strumenti/sprite/creature.py misura mostri-1 polpo 8,640,500,760 --quanti=4
    python3 strumenti/sprite/creature.py misura mostri-1 polpo 8,640,500,760 --quanti=4 --scrivi
    python3 strumenti/sprite/creature.py vedi mostri-1 --regione=0,600,800,800   # il foglio, con la riga dei numeri

Una creatura sta **in un posto solo**: `sorgenti/creature/creature.json`.
Questo modulo è anche la libreria che lo legge (`atlante.py` per il
sotterraneo, `vesti.py` per il castello): le coordinate dei fotogrammi, i
passi dai video, la loro messa alla misura. Il perché e come si aggiunge
una creatura: docs/core/creature.md.

Le coordinate sono in pixel del **foglio grande** (1536×1024): è la misura
a cui il castello ritaglia. Il sotterraneo le porta alla sua griglia
(scala 4) arrotondando in fuori (`in_griglia`).

`misura` prende una regione `x0,y0,x1,y1` attorno a **una** creatura,
la spezza nei fotogrammi (colonne vuote fra l'uno e l'altro, `--vuoto` per
quante ne bastano: 8 di ripiego) e stampa i rettangoli: ognuno largo quanto
la sua sagoma, tutti alti quanto la banda intera (i piedi restano fermi) e
con tre pixel di margine per le sfumature del bordo. `--quanti` ne tiene i
primi N, `--salta` ne scarta i primi K. `--scrivi` aggiunge la creatura al
catalogo (senza descrizione: si scrive a mano, nello stesso file).

`provino` fa una tavola con ogni creatura: i fotogrammi del respiro, e in
una striscia sotto i passi se li ha, col rettangolo disegnato. Bordo verde:
tenuta; rosso: scartata. Una riga rossa dice dove il rettangolo taglia o
morde il vicino (alfa ≥ 128 appena fuori dei suoi lati).
"""
import argparse
import json
import math
import re
import sys
from functools import lru_cache
from pathlib import Path

from PIL import Image, ImageChops, ImageDraw, ImageFilter, ImageFont

QUI = Path(__file__).resolve().parent
REPO = QUI.parent.parent
SORGENTI = QUI / 'sorgenti' / 'creature'
CATALOGO = SORGENTI / 'creature.json'
PASSI = SORGENTI / 'passi'
FUORI = REPO / 'tmp' / 'creature'
DOC_CORE = REPO / 'docs' / 'core'
GIOCHI = ('sotterraneo', 'castello')
ELEMENTI = ('fisico', 'fuoco', 'gelo', 'fulmine', 'veleno', 'sacro')
SOGLIA = 128                      # alfa da cui un pixel è creatura (sotto è bagliore)
MARGINE = 3                       # pixel attorno alla sagoma, per le sfumature del bordo
CONTORNO = (28, 16, 22, 255)
FONT = '/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf'


# ── il catalogo ──────────────────────────────────────────────────────

def carica():
    return json.loads(CATALOGO.read_text())


def salva(dati):
    """Una creatura per riga, così un ritocco è un diff di una riga."""
    testa = {k: v for k, v in dati.items() if k != 'creature'}
    righe = [f'  {json.dumps(k)}: {json.dumps(v, ensure_ascii=False)}' for k, v in testa.items()]
    corpo = ',\n'.join(f'    {json.dumps(k)}: {json.dumps(v, ensure_ascii=False)}'
                       for k, v in dati['creature'].items())
    CATALOGO.write_text('{\n' + ',\n'.join(righe) + ',\n  "creature": {\n' + corpo + '\n  }\n}\n')


def per_gioco(gioco, dati=None):
    """{chiave: scheda} delle creature che quel gioco disegna, nell'ordine del catalogo."""
    dati = dati or carica()
    return {k: v for k, v in dati['creature'].items() if gioco in v.get('giochi', [])}


def nome_in(gioco, chiave, scheda):
    """Come si chiama nell'atlante di quel gioco (`alias`): il sotterraneo ha già uno `scheletro`, da 0x72."""
    return (scheda.get('alias') or {}).get(gioco, chiave)


def fotogrammi_in(gioco, scheda):
    """I rettangoli del respiro che quel gioco prende: tutti, o quelli di `scelta[gioco]` (indici).
    Il castello non sceglie mai: i suoi sono quelli del catalogo, com'erano."""
    tutti = scheda['fotogrammi']
    voluti = (scheda.get('scelta') or {}).get(gioco)
    return [tutti[i] for i in voluti] if voluti is not None else list(tutti)


@lru_cache(maxsize=None)
def foglio(nome):
    return Image.open(SORGENTI / f'{nome}.png').convert('RGBA')


def in_griglia(rett, scala):
    """Un rettangolo del foglio grande alla griglia del foglio ridotto, arrotondato in fuori:
    (da, cella). Quelli che sono già multipli della scala restano esatti."""
    x, y, w, h = rett
    x0, y0 = x // scala, y // scala
    return [x0, y0], [math.ceil((x + w) / scala) - x0, math.ceil((y + h) / scala) - y0]


def respiro_grande(chiave, fogli=None, dati=None):
    """I fotogrammi del respiro com'è il foglio grande, ritagliati. `fogli` è {nome: immagine}: chi
    vuole il foglio già ripulito (il castello toglie il bagliore) lo passa, gli altri lo prendono com'è."""
    d = (dati or carica())['creature'][chiave]
    f = (fogli or {}).get(d['foglio']) or foglio(d['foglio'])
    return [f.crop((x, y, x + w, y + h)) for x, y, w, h in d['fotogrammi']]


# ── i passi dai video ────────────────────────────────────────────────
# `cammino.py` tiene di un video di Grok Imagine solo i passi: una riga di lato e una di fronte, in
# `sorgenti/creature/passi/<chiave>.png` col suo `.json`. Qui si portano **alla misura della creatura**
# (alta quanto il suo respiro, che è di lato: la stessa scala vale per la riga di fronte, così girandosi
# non cambia taglia) e si ridà il contorno scuro che riducendo si perde.

def passi_di(chiave):
    png = PASSI / f'{chiave}.png'
    return (png, json.loads(png.with_suffix('.json').read_text())) if png.exists() else None


def chi_cammina():
    return sorted(p.stem for p in PASSI.glob('*.png'))


def contornata(im, spessore=2):
    """La figura con `spessore` pixel di contorno scuro attorno."""
    t = Image.new('RGBA', (im.width + 2 * spessore, im.height + 2 * spessore))
    t.paste(im, (spessore, spessore))
    for _ in range(spessore):
        a = t.getchannel('A').point(lambda v: 255 if v >= SOGLIA else 0)
        attorno = a.filter(ImageFilter.MaxFilter(3))
        bordo = ImageChops.subtract(attorno, a)
        t.paste(Image.new('RGBA', t.size, CONTORNO), (0, 0), bordo)
    return t


def pieni(quadri):
    """Quanti pixel pieni in media in un fotogramma."""
    return sum(q.getchannel('A').point(lambda v: 255 if v >= SOGLIA else 0).histogram()[255]
               for q in quadri) / len(quadri)


def passi_alla_misura(chiave, respiro, spessore=2):
    """{'lato': [fotogrammi], 'fronte': [fotogrammi]} alla misura di `respiro` (i suoi fotogrammi, nella
    scala del gioco che chiama), col contorno di `spessore` pixel."""
    png, fg = passi_di(chiave)
    im = Image.open(png).convert('RGBA')
    cw, ch = fg['cella']
    alto = respiro[0].getbbox()
    alto = alto[3] - alto[1]
    righe_ = {}
    for r, verso in enumerate(fg['righe']):
        quadri = [im.crop((i * cw, r * ch, (i + 1) * cw, (r + 1) * ch)) for i in range(fg['passi'])]
        bb = [q.getbbox() for q in quadri]
        box = (min(b[0] for b in bb), min(b[1] for b in bb), max(b[2] for b in bb), max(b[3] for b in bb))
        righe_[verso] = [q.crop(box) for q in quadri]
    base = righe_.get('lato') or righe_['fronte']
    k = alto / base[0].height
    if fg.get('misura') == 'area':
        # chi salta e si schiaccia ha il riquadro alto quanto il salto:
        # a misurarlo così la melma a terra veniva metà di prima
        k = (pieni(respiro) / pieni(base)) ** 0.5
    fuori = {}
    for verso, quadri in righe_.items():
        fuori[verso] = []
        for q in quadri:
            q = q.convert('RGBa').resize((max(1, round(q.width * k)), max(1, round(q.height * k))),
                                          Image.BOX).convert('RGBA')
            q.putalpha(q.getchannel('A').point(lambda v: 255 if v >= SOGLIA else 0))
            fuori[verso].append(contornata(q, spessore) if spessore else q)
    return fuori


# ── i guasti ─────────────────────────────────────────────────────────

def guasti(dati=None):
    dati = dati or carica()
    g = []
    scala = dati['scala']
    W, H = dati['dimensione']
    visti = set()
    for k, v in dati['creature'].items():
        if not re.fullmatch(r'[a-z]+(-[a-z]+)*', k):
            g.append(f'{k}: la chiave vuole lettere minuscole e trattini')
        if v.get('foglio') not in dati['fogli']:
            g.append(f'{k}: foglio «{v.get("foglio")}» sconosciuto')
            continue
        fr = v.get('fotogrammi') or []
        if len(fr) < 2:
            g.append(f'{k}: meno di due fotogrammi')
        for r in fr:
            x, y, w, h = r
            if x < 0 or y < 0 or x + w > W or y + h > H:
                g.append(f'{k}: un fotogramma cade fuori dal foglio {r}')
        if len(v.get('morte') or []) > 2:
            g.append(f'{k}: «morte» ha più di due figure')
        for r in v.get('morte') or []:
            x, y, w, h = r
            if x < 0 or y < 0 or x + w > W or y + h > H:
                g.append(f'{k}: una figura di «morte» cade fuori dal foglio {r}')
        if len({r[3] for r in fr}) > 1:
            g.append(f'{k}: i fotogrammi non hanno la stessa altezza (i piedi ballerebbero)')
        for gioco, quali in (v.get('scelta') or {}).items():
            if gioco not in v.get('giochi', []) or len(quali) < 2 or any(i >= len(fr) for i in quali):
                g.append(f'{k}: «scelta» per {gioco} non vale (due pose almeno, fra quelle che ci sono)')
        for gioco in v.get('giochi', []):
            if gioco not in GIOCHI:
                g.append(f'{k}: gioco «{gioco}» sconosciuto')
            n = nome_in(gioco, k, v)
            if (gioco, n) in visti:
                g.append(f'{k}: il nome «{n}» è già preso in {gioco}')
            visti.add((gioco, n))
        if v.get('nitido') and k in chi_cammina():
            g.append(f'{k}: «nitido» e i passi insieme: i passi non hanno il pezzo grande, la creatura cambierebbe faccia camminando')
        if not v.get('giochi') and v.get('tenuta'):
            g.append(f'{k}: tenuta ma non serve a nessun gioco')
        s = v.get('scheda') or {}
        for campo in ('che', 'elemento', 'combatte', 'dove', 'ruolo'):
            if not s.get(campo):
                g.append(f'{k}: nella scheda manca «{campo}»')
        for campo in ('elemento', 'resiste', 'teme'):
            for e in ([s.get(campo)] if campo == 'elemento' else s.get(campo, [])):
                if e and e not in ELEMENTI:
                    g.append(f'{k}: {campo} «{e}» non è un elemento ({", ".join(ELEMENTI)})')
        if not v.get('tenuta') and not v.get('perche'):
            g.append(f'{k}: scartata senza dire perché')
    for p in chi_cammina():
        if p not in dati['creature']:
            g.append(f'passi/{p}.png: «{p}» non è nel catalogo')
        elif not (PASSI / f'{p}.json').exists():
            g.append(f'passi/{p}.png senza il suo .json')
    return g


# ── il catalogo scritto (docs/core/creature-catalogo.md) ─────────────

def catalogo_md(dati=None):
    """{nome del file: testo}: il catalogo descritto, un file per foglio dipinto (ognuno sotto le 250 righe)."""
    dati = dati or carica()
    c = dati['creature']
    cam = set(chi_cammina())
    tenute = [k for k, v in c.items() if v.get('tenuta')]
    fuori = {}
    for n, foglio_png in dati['fogli'].items():
        suoi = [k for k, v in c.items() if v['foglio'] == n]
        r = [f'# Il catalogo delle creature — {foglio_png}',
             '',
             '<!-- GENERATO da `python3 strumenti/sprite/creature.py catalogo` dal campo `scheda` di '
             '`strumenti/sprite/sorgenti/creature/creature.json`: non si scrive a mano, si ritocca il JSON. -->',
             '',
             f'{len(suoi)} creature di `{foglio_png}`; in tutto il catalogo {len(c)}: **{len(tenute)} tenute** '
             f'(almeno due pose di respiro coerenti), {len(c) - len(tenute)} scartate, {len(cam)} con i passi dai video. '
             'L\'altro foglio: ' + ', '.join(f'[{x}](creature-catalogo-{x[-1]}.md)' for x in dati['fogli'] if x != n)
             + '. La regola, i giochi che le prendono e come se ne aggiunge una: [creature.md](creature.md). '
             'Le ambientazioni del sotterraneo: [../sotterraneo/ambientazioni.md](../sotterraneo/ambientazioni.md).',
             '',
             'Ogni voce: come è fatta, **come combatterebbe** (resiste/teme fra parentesi), **dove** sta bene, il **ruolo** '
             '(comune, caporale, grosso, variante) e il giudizio sulle pose. Dopo il nome: `S` sotterraneo, `C` castello, '
             '`P` ha i passi dai video; poi l\'elemento, l\'altezza del fotogramma nella griglia del sotterraneo '
             '(le creature del gioco sono alte 14-26 px, l\'eroe 28).', '']
        for k in suoi:
            v = c[k]
            s = v.get('scheda') or {}
            sigle = ''.join(x for x, g in (('S', 'sotterraneo'), ('C', 'castello')) if g in v.get('giochi', []))
            if k in cam:
                sigle += 'P'
            taglia = f'{round(v["fotogrammi"][0][3] / dati["scala"])} px' if v.get('fotogrammi') else ''
            difese = []
            if s.get('resiste'):
                difese.append('resiste ' + ', '.join(s['resiste']))
            if s.get('teme'):
                difese.append('teme ' + ', '.join(s['teme']))
            r.append(f'### {k} `{sigle or "-"}` · {s.get("elemento", "?")} · {taglia}')
            r.append(f'{s.get("che", "")} **Combatte:** {s.get("combatte", "")}'
                     + (f' ({"; ".join(difese)}).' if difese else ''))
            r.append(f'**Dove:** {s.get("dove", "")} **Ruolo:** {s.get("ruolo", "")} '
                     f'**{"Tenuta" if v.get("tenuta") else "Scartata"}:** {v.get("perche") or "pose coerenti."}')
            r.append('')
        fuori[f'creature-catalogo-{n[-1]}.md'] = '\n'.join(r).rstrip() + '\n'
    return fuori


# ── misurare un foglio ───────────────────────────────────────────────

def maschera(im):
    a = im.getchannel('A').point(lambda v: 255 if v >= SOGLIA else 0)
    return a.load()


def fasce(piene, inizio, vuoto):
    """Gli intervalli pieni (inizio, quanto); `vuoto` = quanti vuoti di fila separano due figure."""
    fuori, s, bianchi = [], None, 0
    for i, p in enumerate(piene):
        if p:
            if s is None:
                s = i
            bianchi = 0
        elif s is not None:
            bianchi += 1
            if bianchi >= vuoto:
                fuori.append((inizio + s, i - bianchi + 1 - s))
                s = None
    if s is not None:
        fuori.append((inizio + s, len(piene) - bianchi - s))
    return fuori


def figure_in(pieno, regione, vuoto):
    """Le figure staccate lungo x dentro una regione: [x, y, largo, alto] di ognuna (rettangolo stretto)."""
    x0, y0, x1, y1 = regione
    piene = [any(pieno[x, y] for y in range(y0, y1)) for x in range(x0, x1)]
    out = []
    for x, w in fasce(piene, x0, vuoto):
        ys = [y for y in range(y0, y1) if any(pieno[i, y] for i in range(x, x + w))]
        if ys:
            out.append([x, min(ys), w, max(ys) - min(ys) + 1])
    return out


def con_margine(figure, W, H):
    """I rettangoli da mettere nel catalogo: larghezza propria, altezza della banda intera, un margine."""
    y1 = max(0, min(f[1] for f in figure) - MARGINE)
    y2 = min(H, max(f[1] + f[3] for f in figure) + MARGINE)
    return [[max(0, f[0] - MARGINE), y1, min(W, f[0] + f[2] + MARGINE) - max(0, f[0] - MARGINE), y2 - y1]
            for f in figure]


def cmd_riga(o):
    im = foglio(o.foglio)
    pieno = maschera(im)
    y0, y1 = (int(v) for v in o.y.split(',')) if o.y else (0, im.height)
    x0, x1 = (int(v) for v in o.x.split(',')) if o.x else (0, im.width)
    for x, y, w, h in figure_in(pieno, (x0, y0, x1, y1), o.vuoto):
        print(f'x {x:4}  largo {w:3}   y {y:4}  alto {h:3}  (fondo {y + h})')


def cmd_misura(o):
    im = foglio(o.foglio)
    pieno = maschera(im)
    fig = figure_in(pieno, tuple(int(v) for v in o.regione.split(',')), o.vuoto)[o.salta:]
    if o.quanti:
        fig = fig[:o.quanti]
    if not fig:
        print('niente in quella regione')
        return 1
    rett = con_margine(fig, im.width, im.height)
    print(json.dumps(rett))
    if o.scrivi:
        dati = carica()
        if o.nome in dati['creature'] and not o.rifai:
            print(f'  ! «{o.nome}» è già nel catalogo: con --rifai si cambiano solo i rettangoli')
            return 1
        if o.nome in dati['creature']:
            dati['creature'][o.nome].update({'foglio': o.foglio, 'fotogrammi': rett})
        else:
            dati['creature'][o.nome] = {'foglio': o.foglio, 'fotogrammi': rett, 'giochi': ['sotterraneo'],
                                        'tenuta': True}
        salva(dati)
        print(f'  → «{o.nome}» nel catalogo: la scheda e il giudizio si scrivono a mano')
    return 0


def griglia_su(F, x0, y0, x1, y1, z, M, passo=50):
    D = ImageDraw.Draw(F)
    font = ImageFont.truetype(FONT, 10)
    for x in range((x0 // passo) * passo, x1 + 1, passo):
        if x >= x0:
            px = M + (x - x0) * z
            D.line((px, M - 5, px, F.height), fill=(110, 110, 120), width=1)
            D.text((px + 2, 4), str(x), font=font, fill=(220, 220, 220))
    for y in range((y0 // passo) * passo, y1 + 1, passo):
        if y >= y0:
            py = M + (y - y0) * z
            D.line((M - 5, py, F.width, py), fill=(110, 110, 120), width=1)
            D.text((1, py + 1), str(y), font=font, fill=(220, 220, 220))
    return D


def cmd_vedi(o):
    im = foglio(o.foglio)
    x0, y0, x1, y1 = (int(v) for v in o.regione.split(','))
    z = o.zoom
    c = im.crop((x0, y0, x1, y1)).resize((round((x1 - x0) * z), round((y1 - y0) * z)), Image.LANCZOS)
    fondo = Image.new('RGBA', c.size, (70, 70, 80, 255))
    fondo.alpha_composite(c)
    M = 22
    F = Image.new('RGB', (c.width + M, c.height + M), (20, 20, 24))
    F.paste(fondo.convert('RGB'), (M, M))
    D = griglia_su(F, x0, y0, x1, y1, z, M)
    for k, v in carica()['creature'].items():
        if v['foglio'] != o.foglio:
            continue
        for x, y, w, h in v['fotogrammi']:
            if x < x1 and x + w > x0 and y < y1 and y + h > y0:
                D.rectangle((M + (x - x0) * z, M + (y - y0) * z, M + (x + w - x0) * z, M + (y + h - y0) * z),
                            outline=(80, 220, 120))
    dove = FUORI / f'vedi-{o.foglio}-{x0}-{y0}.png'
    dove.parent.mkdir(parents=True, exist_ok=True)
    F.save(dove)
    print(dove)


def difetti(pieno, W, H, r):
    """Dove un rettangolo taglia o morde: alfa appena fuori dei suoi lati, dentro la sua banda."""
    x, y, w, h = r
    v = []
    if x > 0 and any(pieno[x - 1, j] for j in range(y, y + h)):
        v.append('taglia a sinistra')
    if x + w < W and any(pieno[x + w, j] for j in range(y, y + h)):
        v.append('taglia a destra')
    if y > 0 and any(pieno[i, y - 1] for i in range(x, x + w)):
        v.append('taglia in alto')
    if y + h < H and any(pieno[i, y + h] for i in range(x, x + w)):
        v.append('taglia in basso')
    return v


def cmd_provino(o):
    dati = carica()
    scelte = [k for k in dati['creature'] if not o.nomi or k in o.nomi]
    Z, PAD = o.zoom, 8
    masch = {n: maschera(foglio(n)) for n in dati['fogli']}
    voci = []
    if o.sotterraneo:
        # come li riceve l'atlante del sotterraneo: foglio ridotto, griglia di scala 4, il contorno dei passi
        scelte = [k for k in scelte if 'sotterraneo' in dati['creature'][k].get('giochi', [])]
        s = dati['scala']
        for k in scelte:
            v = dati['creature'][k]
            ridotto = foglio(v['foglio']).resize((dati['dimensione'][0] // s, dati['dimensione'][1] // s), Image.BOX)
            reali = []
            for r in fotogrammi_in('sotterraneo', v):
                da, cella = in_griglia(r, s)
                reali.append(ridotto.crop((da[0], da[1], da[0] + cella[0], da[1] + cella[1])))
            z = max(1, round(o.zoom))
            quadri = [q.resize((q.width * z, q.height * z), Image.NEAREST) for q in reali]
            passi = []
            if passi_di(k) and not o.senza_passi:
                p = passi_alla_misura(k, reali, spessore=o.contorno)
                for verso in ('lato', 'fronte'):
                    passi += [q.resize((q.width * z, q.height * z), Image.NEAREST) for q in p[verso]]
            voci.append((k, v, quadri, passi, []))
        scelte = []
    for k in scelte:
        v = dati['creature'][k]
        im = foglio(v['foglio'])
        quadri = []
        for r in v['fotogrammi']:
            c = im.crop((r[0], r[1], r[0] + r[2], r[1] + r[3]))
            quadri.append(c.resize((max(1, round(c.width * Z)), max(1, round(c.height * Z))), Image.LANCZOS))
        guai = sorted({d for r in v['fotogrammi'] for d in difetti(masch[v['foglio']], im.width, im.height, r)})
        passi = []
        if passi_di(k) and not o.senza_passi:
            p = passi_alla_misura(k, [im.crop((r[0], r[1], r[0] + r[2], r[1] + r[3]))
                                      for r in v['fotogrammi']], spessore=2)
            for verso in ('lato', 'fronte'):
                passi += [q.resize((max(1, round(q.width * Z)), max(1, round(q.height * Z))), Image.LANCZOS)
                          for q in p[verso]]
        voci.append((k, v, quadri, passi, guai))
    font = ImageFont.truetype(FONT, 13)
    piccolo = ImageFont.truetype(FONT, 10)
    colonne = o.colonne

    def larg(q):
        return sum(i.width for i in q) + (len(q) + 1) * PAD

    cella_w = max(max(larg(q), larg(p)) for _, _, q, p, _ in voci)
    cella_w = max(cella_w, 260)

    def alti(i):
        k, v, q, p, g = voci[i]
        return 36 + max(x.height for x in q) + (8 + max(x.height for x in p) if p else 0)

    righe_n = -(-len(voci) // colonne)
    altezze = [max(alti(j) for j in range(r * colonne, min(len(voci), (r + 1) * colonne))) for r in range(righe_n)]
    F = Image.new('RGB', (colonne * cella_w, sum(altezze)), (36, 36, 42))
    D = ImageDraw.Draw(F)
    for i, (k, v, quadri, passi, guai) in enumerate(voci):
        riga, col = divmod(i, colonne)
        cx, cy = col * cella_w, sum(altezze[:riga])
        h = altezze[riga]
        ok = v.get('tenuta')
        D.rectangle((cx + 2, cy + 2, cx + cella_w - 3, cy + h - 3),
                    outline=(70, 200, 90) if ok else (220, 80, 80), width=2)
        D.text((cx + 8, cy + 6), k, font=font, fill=(235, 235, 235))
        sigle = ''.join(x for x, g in (('S', 'sotterraneo'), ('C', 'castello')) if g in v.get('giochi', []))
        D.text((cx + cella_w - 8, cy + 8), f'{v["foglio"][-1]}  {sigle}{"  P" if passi_di(k) else ""}',
               font=piccolo, fill=(150, 200, 160), anchor='ra')
        if guai:
            D.text((cx + 8, cy + 24), '!  ' + ', '.join(guai), font=piccolo, fill=(255, 90, 90))
        x = cx + PAD
        base = cy + 36 + max(q.height for q in quadri)
        for q in quadri:
            s = Image.new('RGBA', q.size, (70, 70, 80, 255))
            s.alpha_composite(q)
            F.paste(s.convert('RGB'), (x, base - q.height))
            D.rectangle((x - 1, base - q.height - 1, x + q.width, base), outline=(200, 200, 90))
            x += q.width + PAD
        if passi:
            x = cx + PAD
            base2 = base + 8 + max(q.height for q in passi)
            for q in passi:
                s = Image.new('RGBA', q.size, (70, 70, 80, 255))
                s.alpha_composite(q)
                F.paste(s.convert('RGB'), (x, base2 - q.height))
                x += q.width + 4
    FUORI.mkdir(parents=True, exist_ok=True)
    dove = FUORI / o.uscita
    F.save(dove)
    print(f'{len(voci)} creature → {dove}')
    for k, v, q, p, guai in voci:
        if guai:
            print(f'  ! {k}: {", ".join(guai)}')
    return 0


def cmd_controlla(o):
    g = guasti()
    for x in g:
        print(f'  ! {x}')
    print(f'{len(carica()["creature"])} creature, {len(g)} guasti')
    return 1 if g else 0


# ── la morte, dal foglio ─────────────────────────────────────────────
# I due fogli dipingono, dopo le pose di ogni creatura, come cade: due o tre figure (colpita, a terra, i resti). Il sotterraneo
# ne porta una o due come `<nome>-morto-<i>` (campo `morte` del catalogo: i rettangoli, col fondo ai piedi della creatura).

def morti_di(dati=None, vuoto=5):
    """{chiave: [rettangoli]}: le figure staccate fra l'ultima posa di ogni creatura e la prossima nella sua riga del foglio
    (se non ce n'è una, fino in fondo: i doppioni che il catalogo non tiene finiscono nell'elenco, e si scelgono a occhio).
    Il rettangolo prende un margine attorno alla figura e arriva ai piedi della creatura, così il pezzo posa dove posa lei."""
    dati = dati or carica()
    fuori = {}
    for nome in dati['fogli']:
        im = foglio(nome)
        pieno = maschera(im)
        gente = {k: v for k, v in dati['creature'].items() if v['foglio'] == nome}
        for k, v in gente.items():
            fr = v['fotogrammi']
            alto, piede, fine = min(r[1] for r in fr), max(r[1] + r[3] for r in fr), max(r[0] + r[2] for r in fr)
            dopo = [min(r[0] for r in w['fotogrammi']) for kk, w in gente.items()
                    if kk != k and min(r[0] for r in w['fotogrammi']) >= fine - 2 and abs(min(r[1] for r in w['fotogrammi']) - alto) < 40]
            regione = (fine, max(0, alto - 10), min(dopo) if dopo else im.width, min(im.height, piede + 10))
            fuori[k] = [[max(0, x - MARGINE), max(0, y - MARGINE), w + 2 * MARGINE, max(piede, y + h + MARGINE) - max(0, y - MARGINE)]
                        for x, y, w, h in figure_in(pieno, regione, vuoto)]
    return fuori


def cmd_morti(o):
    dati = carica()
    morti = morti_di(dati, o.vuoto)
    if o.scrivi:
        for voce in o.scrivi:
            nome, _, quali = voce.partition('=')
            if nome not in dati['creature']:
                print(f'  ! «{nome}» non è nel catalogo')
                return 1
            scelte = [int(i) for i in quali.split(',') if i != '']
            if not scelte:
                dati['creature'][nome].pop('morte', None)
                continue
            try:
                dati['creature'][nome]['morte'] = [morti[nome][i] for i in scelte]
            except IndexError:
                print(f'  ! «{nome}» ha {len(morti[nome])} figure, non {max(scelte) + 1}')
                return 1
        salva(dati)
        print(f'  → {len(o.scrivi)} voci scritte nel catalogo')
        return 0
    voci = [k for k in dati['creature'] if (not o.nomi or k in o.nomi) and (o.tutte or 'sotterraneo' in dati['creature'][k].get('giochi', []))]
    Z, PAD = o.zoom, 6
    font = ImageFont.truetype(FONT, 12)
    righe = []
    for k in voci:
        v = dati['creature'][k]
        im = foglio(v['foglio'])
        r0 = v['fotogrammi'][0]
        quadri = [(f'{k}', im.crop((r0[0], r0[1], r0[0] + r0[2], r0[1] + r0[3])))]
        for i, r in enumerate(morti[k][:9]):
            quadri.append((f'{i}', im.crop((r[0], r[1], r[0] + r[2], r[1] + r[3]))))
        righe.append((k, v.get('morte'), quadri))
    larghe = [sum(int(q.width * Z) + PAD for _, q in quadri) for _, _, quadri in righe]
    W = max(larghe) + 20
    alte = [max(int(q.height * Z) for _, q in quadri) + 22 for _, _, quadri in righe]
    F = Image.new('RGB', (W, sum(alte) + 10), (36, 36, 44))
    d = ImageDraw.Draw(F)
    y = 6
    for (k, scelta, quadri), a in zip(righe, alte):
        x = 6
        for etichetta, q in quadri:
            z = q.resize((max(1, int(q.width * Z)), max(1, int(q.height * Z))), Image.LANCZOS)
            sfondo = Image.new('RGBA', z.size, (70, 70, 82, 255))
            sfondo.alpha_composite(z)
            F.paste(sfondo.convert('RGB'), (x, y + 16))
            giusta = scelta and etichetta.isdigit() and morti[k][int(etichetta)] in scelta
            d.text((x, y), etichetta, font=font, fill=(120, 240, 130) if giusta else (255, 210, 90))
            x += z.width + PAD
        y += a
    dove = FUORI / o.uscita
    dove.parent.mkdir(parents=True, exist_ok=True)
    F.save(dove)
    print(dove)
    for k in voci:
        print(f'{k:20} {len(morti[k])} figure' + (f'  → scelte {dati["creature"][k]["morte"]}' if dati['creature'][k].get('morte') else ''))
    return 0


def cmd_catalogo(o):
    for nome, testo in catalogo_md().items():
        (DOC_CORE / nome).write_text(testo)
        print(f'→ docs/core/{nome}  ({len(testo.splitlines())} righe)')
    return 0


def main():
    a = argparse.ArgumentParser(description=__doc__.split('\n')[0])
    sub = a.add_subparsers(dest='cmd', required=True)
    r = sub.add_parser('riga')
    r.add_argument('foglio')
    r.add_argument('--y')
    r.add_argument('--x')
    r.add_argument('--vuoto', type=int, default=8)
    m = sub.add_parser('misura')
    m.add_argument('foglio')
    m.add_argument('nome')
    m.add_argument('regione')
    m.add_argument('--quanti', type=int)
    m.add_argument('--salta', type=int, default=0)
    m.add_argument('--vuoto', type=int, default=8)
    m.add_argument('--scrivi', action='store_true')
    m.add_argument('--rifai', action='store_true', help='con --scrivi, cambia solo i rettangoli di una creatura che c\'è già')
    v = sub.add_parser('vedi')
    v.add_argument('foglio')
    v.add_argument('--regione', required=True)
    v.add_argument('--zoom', type=float, default=1.5)
    p = sub.add_parser('provino')
    p.add_argument('nomi', nargs='*')
    p.add_argument('--zoom', type=float, default=0.6)
    p.add_argument('--colonne', type=int, default=3)
    p.add_argument('--senza-passi', action='store_true')
    p.add_argument('--sotterraneo', action='store_true', help='come li riceve l\'atlante del sotterraneo (griglia ridotta; --zoom intero)')
    p.add_argument('--contorno', type=int, default=1)
    p.add_argument('--uscita', default='provino.png')
    mo = sub.add_parser('morti', help='le figure della morte dopo ogni creatura: guardarle, e scegliere con --scrivi nome=0,2')
    mo.add_argument('nomi', nargs='*')
    mo.add_argument('--zoom', type=float, default=1.2)
    mo.add_argument('--vuoto', type=int, default=5)
    mo.add_argument('--tutte', action='store_true', help='anche le creature che il sotterraneo non prende')
    mo.add_argument('--scrivi', nargs='+', metavar='NOME=I,J', help='scrive `morte` nel catalogo: le figure (da 0) che si tengono, una o due')
    mo.add_argument('--uscita', default='morti.png')
    sub.add_parser('controlla')
    sub.add_parser('catalogo')
    o = a.parse_args()
    return {'riga': cmd_riga, 'misura': cmd_misura, 'vedi': cmd_vedi, 'provino': cmd_provino,
            'controlla': cmd_controlla, 'catalogo': cmd_catalogo, 'morti': cmd_morti}[o.cmd](o)


if __name__ == '__main__':
    sys.exit(main() or 0)
