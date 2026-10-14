#!/usr/bin/env python3
"""Le macchie di colore dei fogli che nessun ritaglio copre: figure dipinte mai ritagliate.

    python3 strumenti/sprite/non-ritagliato.py                  # tutti i fogli con un foglietto, in tabella
    python3 strumenti/sprite/non-ritagliato.py --json           # come lo legge inutilizzati.mjs --pixel
    python3 strumenti/sprite/non-ritagliato.py --provino        # e i fogli da guardare in tmp/inutilizzati/
    python3 strumenti/sprite/non-ritagliato.py --gioco=fattoria --foglio=merci
    python3 strumenti/sprite/non-ritagliato.py --minimo=600     # macchie più piccole di tanti pixel veri si scartano

Per ogni foglio con un foglietto accanto (`sprite` in celle, `ritagli` in pixel, `figure` su una griglia, o le
creature di `creature.json`) calcola il primo piano (quello che non è fondo: l'alfa, o la differenza dal colore
del fondo che il foglietto dichiara, o dagli angoli), toglie i rettangoli dei ritagli e raggruppa quello che
resta in macchie. Una macchia grande è una figura dipinta che nessuno prende; una piccola è lo spillo di un
ritaglio che taglia. `--provino` scrive, per foglio, `<gioco>__<foglio>.png` (le macchie in arancio, i ritagli in
verde) e `<gioco>__<foglio>-macchie.png` (le macchie ritagliate, una per cella, col numero del rapporto).

I fogli di scena (le stanze del sotterraneo, le mappe) danno molte macchie perché il fondo è dipinto: lì il
numero non dice niente, e il rapporto li segna `scena`. Non scrive niente di versionato (salvo `--scrivi`).

    python3 strumenti/sprite/non-ritagliato.py --gioco=sotterraneo --foglio=sotterraneo_2 \
        --prendi 268,968=cantine-botte:26x19 --prendi 440,980=cantine-scaffale:15x17   # le righe da incollare
    ... --scrivi                                                                      # e le scrive nel foglietto

`--prendi x,y=nome[:LxA]` ritaglia una macchia (la riconosce dall'angolo in alto a sinistra, quello che il provino
scrive sotto il numero: resta valido anche quando le altre macchie cambiano; `x,y,l,a=nome` dà il rettangolo a mano, per
una macchia che tiene insieme più figure) e ne fa la riga del foglietto, nelle
sue coordinate (un foglio ridotto a `scala` le vuole in pixel ridotti) con `misura` se c'è `:LxA`. `--scrivi` la
mette dentro il foglietto: in un `.json` scritto da una macchina riscrive il file, in uno a mano inserisce le righe
prima di `__pezzi-col-nome` / `__aspetti` (i blocchi che `roba.py --gioco` rifà da sé).
"""
import argparse
import json
import math
import re
import sys
from pathlib import Path

from PIL import Image, ImageChops, ImageDraw, ImageFilter, ImageFont

QUI = Path(__file__).resolve().parent
RADICE = QUI.parent.parent
SORGENTI = QUI / 'sorgenti'
FUORI = RADICE / 'tmp' / 'inutilizzati'
QUANTO = 4          # una cella delle macchie è 4×4 pixel veri
FRANGIA = 4         # quanto un ritaglio può sbordare senza che il bordo conti come figura


def foglietto(p):
    try:
        return json.loads(p.read_text())
    except (OSError, ValueError):
        return None


def rettangoli_del_foglietto(p, fg, im):
    """I rettangoli dei ritagli, in pixel del foglio vero. None se il foglietto non dichiara ritagli."""
    if fg.get('come'):                                           # neve e lava: i rettangoli sono quelli del bosco
        altro = foglietto(p.parent / fg['come'])
        return rettangoli_del_foglietto(p.parent / fg['come'], altro, im) if altro else None
    if fg.get('ritagli'):
        t = json.loads((p.parent / fg['ritagli']).read_text())
        return [tuple(r) for k, r in t.items() if not k.startswith('__')]
    if fg.get('figure') and fg.get('griglia'):                   # le torri: ogni cella della griglia è una figura
        c, r = fg['griglia']
        w, h = im.width / c, im.height / r
        return [(i * w, j * h, w, h) for i in range(c) for j in range(r)]
    sprite = fg.get('sprite')
    if not isinstance(sprite, dict) or 'cella' not in fg:
        return None
    cw, ch = fg['cella']
    col, rig = fg.get('foglio') or (im.width // cw, im.height // ch)
    fx, fy = im.width / (col * cw), im.height / (rig * ch)       # dalla misura vera al foglio com'è
    fuori = []
    for nome, d in sprite.items():
        if nome.startswith('__') or not isinstance(d, dict) or 'da' not in d:
            continue
        pw, ph = d.get('cella', [cw, ch])
        passo = d.get('passo', [max(1, pw // cw), 0])
        for i in range(d.get('quanti', 1)):
            x, y = (d['da'][0] + passo[0] * i) * cw, (d['da'][1] + passo[1] * i) * ch
            fuori.append((x * fx, y * fy, pw * fx, ph * fy))
    return fuori or None


def primo_piano(im, fg):
    """Maschera L (255 dove c'è disegno): l'alfa se il foglio ne ha, altrimenti la distanza dal fondo."""
    rgba = im.convert('RGBA')
    alfa = rgba.getchannel('A')
    if alfa.getextrema()[0] < 250:
        return alfa.point(lambda v: 255 if v > 24 else 0)
    rgb = rgba.convert('RGB')
    r, g, b = rgb.split()
    fondo = fg.get('fondo')
    angolo = rgb.getpixel((0, 0))
    if fondo != 'trasparente' and not isinstance(fondo, list) and min(angolo) > 150 and max(angolo) - min(angolo) <= 14:
        fondo = 'scacchiera'                                     # bianco o scacchiera dipinta: lo stesso grigio chiaro
    if fondo == 'scacchiera':
        chiaro = ImageChops.darker(ImageChops.darker(r, g), b).point(lambda v: 255 if v > 150 else 0)
        grigio = ImageChops.subtract(ImageChops.lighter(ImageChops.lighter(r, g), b),
                                     ImageChops.darker(ImageChops.darker(r, g), b)).point(lambda v: 255 if v <= 14 else 0)
        return ImageChops.invert(ImageChops.darker(chiaro, grigio))
    if isinstance(fondo, list):
        colore = tuple(fondo[:3])
    else:                                                        # «auto» e il resto: il colore degli angoli
        angoli = [rgb.getpixel(p) for p in ((0, 0), (rgb.width - 1, 0), (0, rgb.height - 1), (rgb.width - 1, rgb.height - 1))]
        colore = sorted(angoli)[len(angoli) // 2]
    d = ImageChops.difference(rgb, Image.new('RGB', rgb.size, colore))
    dr, dg, db = d.split()
    return ImageChops.lighter(ImageChops.lighter(dr, dg), db).point(lambda v: 255 if v > 40 else 0)


def macchie_di(maschera, minimo):
    """Le macchie (bbox in pixel veri, area) della maschera: celle da QUANTO px, un filo di dilatazione per
    tenere insieme i pezzi di una figura."""
    piccola = maschera.reduce(QUANTO).point(lambda v: 255 if v > 24 else 0)
    unite = piccola.filter(ImageFilter.MaxFilter(5))
    L, A = unite.size
    celle = unite.tobytes()
    vere = piccola.tobytes()
    visto = bytearray(L * A)
    fuori = []
    for s in range(L * A):
        if not celle[s] or visto[s]:
            continue
        pila, area, x0, y0, x1, y1 = [s], 0, L, A, 0, 0
        visto[s] = 1
        while pila:
            c = pila.pop()
            y, x = divmod(c, L)
            if vere[c]:
                area += 1
                x0, y0, x1, y1 = min(x0, x), min(y0, y), max(x1, x), max(y1, y)
            for dx, dy in ((1, 0), (-1, 0), (0, 1), (0, -1), (1, 1), (-1, -1), (1, -1), (-1, 1)):
                nx, ny = x + dx, y + dy
                if 0 <= nx < L and 0 <= ny < A:
                    n = ny * L + nx
                    if celle[n] and not visto[n]:
                        visto[n] = 1
                        pila.append(n)
        if area * QUANTO * QUANTO < minimo or not area:
            continue
        fuori.append({'bbox': [x0 * QUANTO, y0 * QUANTO, (x1 - x0 + 1) * QUANTO, (y1 - y0 + 1) * QUANTO],
                      'area': area * QUANTO * QUANTO})
    fuori.sort(key=lambda m: (m['bbox'][1] // 80, m['bbox'][0]))
    for i, m in enumerate(fuori, 1):
        m['n'] = i
    return fuori


def fogli_da_guardare(filtro_gioco, filtro_foglio):
    """(gioco, percorso, immagine, foglietto, rettangoli aggiuntivi) per ogni foglio che ha ritagli dichiarati."""
    trovati = []
    for png in sorted(p for p in SORGENTI.rglob('*') if p.suffix.lower() in ('.png', '.jpg', '.jpeg')):
        gioco = png.relative_to(SORGENTI).parts[0]
        if (filtro_gioco and gioco != filtro_gioco) or (filtro_foglio and filtro_foglio not in png.name):
            continue
        if png.name.startswith('PROMPT-') or png.parent.name in ('passi', 'non-usati', 'non-usate'):
            continue
        j = png.with_suffix('.json')
        if not j.exists():
            continue
        fg = foglietto(j)
        if fg:
            trovati.append((gioco, png, j, fg))
    catalogo = SORGENTI / 'creature' / 'creature.json'
    if catalogo.exists() and (not filtro_gioco or filtro_gioco == 'creature'):
        cat = json.loads(catalogo.read_text())
        for nome, f in cat['fogli'].items():
            if filtro_foglio and filtro_foglio not in nome:
                continue
            rett = [tuple(r) for v in cat['creature'].values() if v['foglio'] == nome for r in v['fotogrammi']]
            trovati.append(('creature', SORGENTI / 'creature' / f, catalogo, {'__rettangoli': rett, 'fondo': 'trasparente'}))
    return trovati


def analizza(gioco, png, j, fg, minimo):
    im = Image.open(png)
    if '__rettangoli' in fg:
        rett = fg['__rettangoli']
    else:
        rett = rettangoli_del_foglietto(j, fg, im)
    if rett is None:
        return {'gioco': gioco, 'foglio': png.name, 'nota': 'il foglietto non dichiara rettangoli', 'macchie': []}
    maschera = primo_piano(im, fg)
    totale = sum(maschera.histogram()[1:]) or 1
    for x, y, w, h in rett:
        d = ImageDraw.Draw(maschera)
        d.rectangle((x - FRANGIA, y - FRANGIA, x + w + FRANGIA - 1, y + h + FRANGIA - 1), fill=0)
    fuori = sum(maschera.histogram()[1:])
    macchie = macchie_di(maschera, minimo)
    scena = png.name.startswith(('sotterraneo_', 'td_', 'mappa_'))
    return {'gioco': gioco, 'foglio': png.name, 'file': str(png.relative_to(RADICE)), 'ritagli': len(rett),
            'quota': round(100 * fuori / totale, 1), 'scena': scena, 'macchie': macchie, '_rett': rett}


def provino(r, png):
    FUORI.mkdir(parents=True, exist_ok=True)
    im = Image.open(png).convert('RGBA')
    sfondo = Image.new('RGBA', im.size, (40, 40, 48, 255))
    sfondo.alpha_composite(im)
    d = ImageDraw.Draw(sfondo)
    for x, y, w, h in r['_rett']:
        d.rectangle((x, y, x + w, y + h), outline=(60, 200, 90, 255))
    font = ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf', max(14, im.width // 70))
    for m in r['macchie']:
        x, y, w, h = m['bbox']
        d.rectangle((x, y, x + w, y + h), outline=(255, 160, 30, 255), width=3)
        d.text((x + 3, y + 1), str(m['n']), font=font, fill=(255, 220, 90, 255))
    scala = min(1.0, 1500 / im.width)
    base = f'{r["gioco"]}__{Path(r["foglio"]).stem}'
    sfondo.convert('RGB').resize((round(im.width * scala), round(im.height * scala)), Image.LANCZOS).save(FUORI / f'{base}.png')
    if not r['macchie']:
        return
    COL, CW, CH = 8, 190, 200
    righe = (len(r['macchie']) + COL - 1) // COL
    F = Image.new('RGB', (COL * CW, righe * CH), (30, 30, 36))
    fd = ImageDraw.Draw(F)
    piccolo = ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf', 12)
    for i, m in enumerate(r['macchie']):
        x, y, w, h = m['bbox']
        c = im.crop((x, y, x + w, y + h))
        fondo = Image.new('RGBA', c.size, (70, 70, 80, 255))
        fondo.alpha_composite(c)
        s = min(170 / c.width, 160 / c.height, 3)
        fondo = fondo.convert('RGB').resize((max(1, round(c.width * s)), max(1, round(c.height * s))), Image.LANCZOS)
        cx, cy = (i % COL) * CW, (i // COL) * CH
        F.paste(fondo, (cx + 10, cy + 20))
        fd.text((cx + 8, cy + 3), f'{m["n"]}  {w}×{h}  ({x},{y})', font=piccolo, fill=(255, 210, 90))
    F.save(FUORI / f'{base}-macchie.png')


def provino_voci(elenco, atlante, dove):
    """Le voci dell'atlante di un gioco che nessuno nomina, ritagliate dall'atlante stesso (PNG), una per cella."""
    voci = json.loads(Path(elenco).read_text())
    im = Image.open(atlante).convert('RGBA')
    COL, CW, CH = 8, 190, 190
    righe = max(1, (len(voci) + COL - 1) // COL)
    F = Image.new('RGB', (COL * CW, righe * CH), (30, 30, 36))
    fd = ImageDraw.Draw(F)
    piccolo = ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf', 11)
    for i, v in enumerate(voci):
        cx, cy = (i % COL) * CW, (i // COL) * CH
        x, y, w, h = v['pezzi'][0]
        c = im.crop((x, y, x + w, y + h))
        fondo = Image.new('RGBA', c.size, (70, 70, 80, 255))
        fondo.alpha_composite(c)
        s = max(1, min(170 // max(1, c.width), 140 // max(1, c.height), 8))
        fondo = fondo.convert('RGB').resize((c.width * s, c.height * s), Image.NEAREST)
        F.paste(fondo, (cx + (CW - fondo.width) // 2, cy + 6))
        fd.text((cx + CW // 2, cy + CH - 36), v['voce'][:30], font=piccolo, fill=(255, 210, 90), anchor='mm')
        fd.text((cx + CW // 2, cy + CH - 20), f'{v["foglio"][:24]} · {len(v["pezzi"])} pz', font=piccolo, fill=(160, 160, 170), anchor='mm')
    Path(dove).parent.mkdir(parents=True, exist_ok=True)
    F.save(dove)
    print(dove)


def riga_di(m, misura, fx, fy):
    """La riga del foglietto per una macchia: `da` e `cella` in pixel del foglio ridotto (quelli di `cella: [1, 1]`)."""
    x, y, w, h = m['bbox']
    da = [math.floor(x / fx), math.floor(y / fy)]
    cella = [math.ceil((x + w) / fx) - da[0], math.ceil((y + h) / fy) - da[1]]
    d = {'da': da, 'cella': cella}
    if misura:
        d['misura'] = misura
    return d


def scrivi_righe(j, nuove):
    """Mette le righe nel foglietto `j`: riscrivendolo se è nel formato delle macchine, se no inserendole a mano."""
    testo = j.read_text()
    dati = json.loads(testo)
    for fine in ('', '\n'):
        if json.dumps(dati, indent=2, ensure_ascii=False) + fine == testo:
            dati['sprite'].update(nuove)
            j.write_text(json.dumps(dati, indent=2, ensure_ascii=False) + fine)
            return 'riscritto'
    righe = testo.split('\n')
    inizio = next(i for i, r in enumerate(righe) if r.strip().startswith('"sprite"'))
    nuove_righe = [f'    "{k}": {{ {json.dumps(v)[1:-1]} }},' for k, v in nuove.items()]
    # prima del primo marcatore di un blocco generato; se non c'è, prima della graffa che chiude `sprite`
    marcatore = next((i for i in range(inizio, len(righe)) if re.match(r'\s+"__(pezzi-col-nome|aspetti)"', righe[i])), None)
    if marcatore is not None:
        righe[marcatore:marcatore] = nuove_righe + ['']
    else:
        chiude = next(i for i in range(inizio + 1, len(righe)) if righe[i] == '  }')
        prima = max(i for i in range(inizio, chiude) if righe[i].strip())
        if not righe[prima].rstrip().endswith(','):
            righe[prima] += ','
        nuove_righe[-1] = nuove_righe[-1].rstrip(',')
        righe[chiude:chiude] = nuove_righe
    j.write_text('\n'.join(righe))
    return 'inserito'


def prendi(o):
    """`--prendi x,y=nome[:LxA]`: le macchie scelte diventano righe del foglietto (stampate, o scritte con --scrivi)."""
    fogli = fogli_da_guardare(o.gioco, o.foglio)
    if len(fogli) != 1:
        sys.exit(f'--prendi vuole un foglio solo: con --gioco e --foglio ne ho trovati {len(fogli)}')
    gioco, png, j, fg = fogli[0]
    r = analizza(gioco, png, j, fg, o.minimo)
    im = Image.open(png)
    cw, ch = fg['cella']
    col, rig = fg.get('foglio') or (im.width // cw, im.height // ch)
    fx, fy = im.width / col, im.height / rig      # quanti pixel del foglio vero fa uno del foglietto
    nuove = {}
    for voce in o.prendi:
        dove, _, resto = voce.partition('=')
        nome, _, misura = resto.partition(':')
        n = [int(v) for v in dove.split(',')]
        if len(n) == 4:                                  # un rettangolo dato a mano, per una macchia che tiene insieme più figure
            m = {'bbox': n}
        else:
            m = next((m for m in r['macchie'] if m['bbox'][0] == n[0] and m['bbox'][1] == n[1]), None)
        if not m:
            sys.exit(f"nessuna macchia con l'angolo in {n[0]},{n[1]}: si leggono nel provino (--provino)")
        if nome in (fg.get('sprite') or {}) or nome in nuove:
            sys.exit(f"«{nome}» c'è già nel foglietto")
        nuove[nome] = riga_di(m, [int(n) for n in misura.split('x')] if misura else None, fx, fy)
    for k, v in nuove.items():
        print(f'    "{k}": {json.dumps(v)},')
    if o.scrivi:
        print(f'→ {j.relative_to(RADICE)}: {scrivi_righe(j, nuove)}')


def main():
    a = argparse.ArgumentParser(description=__doc__.split('\n')[0])
    a.add_argument('--voci', help="un JSON di voci non nominate (da inutilizzati.mjs --provino) da disegnare invece di analizzare i fogli")
    a.add_argument('--atlante', help="con --voci: il PNG dell'atlante da cui ritagliarle")
    a.add_argument('--dove', help='con --voci: dove scrivere il provino')
    a.add_argument('--json', action='store_true')
    a.add_argument('--provino', action='store_true')
    a.add_argument('--gioco')
    a.add_argument('--foglio', help='solo i fogli il cui nome contiene questo testo')
    a.add_argument('--minimo', type=int, default=500, help='pixel veri sotto i quali una macchia si scarta')
    a.add_argument('--prendi', action='append', default=[], metavar='X,Y=NOME[:LxA]',
                   help="la macchia con quell'angolo diventa una riga del foglietto (con `misura` se c'è :LxA)")
    a.add_argument('--scrivi', action='store_true', help='con --prendi: scrive le righe nel foglietto invece di stamparle')
    o = a.parse_args()
    if o.voci:
        provino_voci(o.voci, o.atlante, o.dove)
        return
    if o.prendi:
        prendi(o)
        return
    fogli = []
    for gioco, png, j, fg in fogli_da_guardare(o.gioco, o.foglio):
        r = analizza(gioco, png, j, fg, o.minimo)
        if o.provino and r.get('_rett'):
            provino(r, png)
        r.pop('_rett', None)
        fogli.append(r)
    if o.json:
        print(json.dumps({'fogli': fogli}))
        return
    for r in fogli:
        if 'nota' in r:
            print(f'{r["gioco"]}/{r["foglio"]}: {r["nota"]}')
            continue
        print(f'{r["gioco"]}/{r["foglio"]}: {r["ritagli"]} ritagli, {len(r["macchie"])} macchie, {r["quota"]}% del disegno fuori dai ritagli'
              + ('  (scena)' if r['scena'] else ''))
        for m in r['macchie'][:40]:
            print(f'    {m["n"]:>3}  {m["bbox"]}  {m["area"]} px')
    if o.provino:
        print(f'→ {FUORI.relative_to(RADICE)}/', file=sys.stderr)


if __name__ == '__main__':
    main()
