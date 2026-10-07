#!/usr/bin/env python3
"""Le mappe delle isole di Passo passo: dal fondale dipinto al modulo del gioco.

    python3 strumenti/sprite/isole-passo-passo.py             # rifà i moduli di tutti i foglietti
    python3 strumenti/sprite/isole-passo-passo.py zaino       # solo quello dello zaino (o valle)
    python3 strumenti/sprite/isole-passo-passo.py --provino   # tmp/isole/provino*.png: sentieri, caselle, ponti e blocchi sopra il fondale

Due mondi, un foglietto ciascuno: la valle (`isole.json`, fondale
`isole_1.png`, modulo `dati/isole-mappa.js`) e lo zaino (`zaino.json`,
`isole_2.png`, `dati/zaino-mappa.js`). Il fondale si tiene com'è: il gioco lo
mostra intero e ci posa sopra le caselle, il segnalino, i blocchi e il
fumetto. Quello che il codice sa del fondale sta nel foglietto
(`sorgenti/passo-passo/`): per ogni isola la linea dei sentieri (una
spezzata in pixel dell'immagine), i ponti, le tane, le caselle speciali.
Lo strumento distribuisce le caselle sui sentieri, cuce sentieri e ponti in
un grafo (incroci dove una linea tocca l'altra) e lo copia nel modulo insieme
all'immagine in WebP. Il perché: `docs/passo-passo/mappa.md`.

Serve `pillow` (con WebP).
"""
import base64
import hashlib
import io
import json
import math
import sys
from pathlib import Path

from PIL import Image, ImageDraw

QUI = Path(__file__).parent
REPO = Path(__file__).resolve().parents[2]
SORGENTI = QUI / 'sorgenti' / 'passo-passo'
FOGLIETTI = {'valle': 'isole.json', 'zaino': 'zaino.json'}     # il mondo e il suo foglietto
TMP = REPO / 'tmp' / 'isole'

AGGANCIO = 30        # un capo di sentiero più vicino di così a un altro sentiero ci si attacca
STESSO = 14          # due tagli più vicini di così sono lo stesso punto
BLOCCO = 24          # il blocco di un ponte sta a tanto dal capo, sul ponte
SPAZIO = 8           # fra due caselle almeno tanto, per un dito
SOSTA = 150          # un arco più lungo si spezza in soste

TESTA = """/* GENERATO da strumenti/sprite/isole-passo-passo.py — non si scrive a mano.

   Il fondale della mappa delle isole e il grafo che ci sta sopra, ricavati
   dal foglietto `strumenti/sprite/sorgenti/passo-passo/{foglietto}`: si
   corregge lì e si rilancia lo strumento. Vedi docs/passo-passo/mappa.md.

   MAPPA   il fondale ({largo}×{alto}), WebP in base64 ({kb} KB)
   ISOLE   per isola (la chiave è quella di motore/strade.js): quante caselle, dove sta il cartello
   NODI    {{ id, tipo, isola, x, y }}: `casella` (con `k`, l'ordine sull'isola), `incrocio`, `capo`
           (un sentiero che finisce), `sosta` (a metà di un arco lungo: su un ponte
           non è di un'isola), `tana` (con `nuvola` se sul fondale non c'è il buco: l'animale
           cambia in una nuvoletta), `passaggio` (la tana che porta all'altro mondo, con
           `cartello` [x, y], il centro del suo nome), `sentiero` (le caselle speciali, con
           `etichetta` [x, y], dove comincia il nome: a metà altezza, da lì verso destra)
   ARCHI   {{ a, b, tipo: terra | erba | ponte | tunnel, ponte?, punti }}: i pezzi di strada fra due nodi
   PONTI   per ponte: le due isole e il blocco di ciascun capo [x, y, gradi]
   LIBERE  le isole sempre aperte (la riva da cui si arriva): non hanno caselle
   FIRMA   l'impronta del foglietto: un test la confronta
*/
"""


def leggi(mondo):
    return json.loads((SORGENTI / FOGLIETTI[mondo]).read_text())


def firma(mondo):
    return hashlib.sha1((SORGENTI / FOGLIETTI[mondo]).read_bytes()).hexdigest()[:12]


# ── le spezzate ─────────────────────────────────────────────────────
def lunghezze(p):
    s = [0.0]
    for a, b in zip(p, p[1:]):
        s.append(s[-1] + math.dist(a, b))
    return s


def punto_a(p, cum, s):
    s = max(0.0, min(cum[-1], s))
    for i in range(len(p) - 1):
        if cum[i + 1] >= s:
            t = (s - cum[i]) / ((cum[i + 1] - cum[i]) or 1)
            return (p[i][0] + (p[i + 1][0] - p[i][0]) * t, p[i][1] + (p[i + 1][1] - p[i][1]) * t)
    return tuple(p[-1])


def proietta(p, cum, q):
    """Il punto della spezzata più vicino a q: (s, distanza, punto)."""
    meglio = None
    for i in range(len(p) - 1):
        ax, ay = p[i]
        bx, by = p[i + 1]
        dx, dy = bx - ax, by - ay
        l2 = dx * dx + dy * dy or 1
        t = max(0.0, min(1.0, ((q[0] - ax) * dx + (q[1] - ay) * dy) / l2))
        x, y = ax + dx * t, ay + dy * t
        d = math.dist((x, y), q)
        if meglio is None or d < meglio[1]:
            meglio = (cum[i] + math.sqrt(l2) * t, d, (x, y))
    return meglio


def pezzo(p, cum, s0, s1):
    """La spezzata fra s0 e s1 (s0 < s1)."""
    out = [punto_a(p, cum, s0)]
    for i in range(1, len(p) - 1):
        if s0 < cum[i] < s1:
            out.append(tuple(p[i]))
    out.append(punto_a(p, cum, s1))
    return out


def tondo(v):
    return round(v, 1)


def stacco(a, b):
    """Quanto due caselle quadrate stanno lontane: conta la più larga delle due distanze, in x o in y."""
    return max(abs(a[0] - b[0]), abs(a[1] - b[1]))


def distribuisci(p, cum, n, m0, m1):
    """Le s di n caselle fra m0 e (fine - m1): la prima a m0, ognuna dopo alla prima s dove lo
    stacco dalla precedente arriva a d, e d il più grande che ci sta. Su un sentiero che gira in
    diagonale due caselle a passo uguale lungo la strada si toccherebbero."""
    L = cum[-1]
    if n == 1:
        return [(m0 + L - m1) / 2]

    def posa(d):
        out = [m0]
        s = m0
        while len(out) < n:
            q = punto_a(p, cum, out[-1])
            while s < L - m1 and stacco(punto_a(p, cum, s), q) < d:
                s += 0.5
            if s > L - m1:
                return None
            out.append(s)
        return out

    basso, alto = 0.0, L
    for _ in range(40):
        d = (basso + alto) / 2
        if posa(d):
            basso = d
        else:
            alto = d
    out = posa(basso)
    # quello che avanza in fondo si spartisce: le caselle stanno in mezzo fra i margini (se non
    # si stringono in una curva: allora restano dove sono)
    resto = (L - m1) - out[-1]
    spostate = [s + resto / 2 for s in out]
    minimo = lambda v: min(stacco(punto_a(p, cum, a), punto_a(p, cum, b)) for a, b in zip(v, v[1:]))
    return spostate if minimo(spostate) >= minimo(out) - 1.0 else out


# ── il grafo ────────────────────────────────────────────────────────
class Grafo:
    def __init__(self, fg):
        self.fg = fg
        self.prefisso = fg.get('prefisso', '')      # gli id dei punti senza nome non si scambiano fra mondi
        self.nodi = {}
        self.ordine = []
        self.strade = []
        self.conta = {'incrocio': 0, 'capo': 0, 'sosta': 0}
        for s in fg['sentieri']:
            self.strade.append({'isola': s['isola'], 'punti': [tuple(q) for q in s['punti']],
                                'tipo': 'erba' if s.get('erba') else 'terra', 'tagli': [], 'dati': s})
        for s in self.strade:
            s['cum'] = lunghezze(s['punti'])

    def nodo(self, id, tipo, isola, xy, **extra):
        if id not in self.nodi:
            self.nodi[id] = {'id': id, 'tipo': tipo, 'isola': isola, 'x': tondo(xy[0]), 'y': tondo(xy[1]), **extra}
            self.ordine.append(id)
        return id

    def nuovo(self, tipo, isola, xy):
        self.conta[tipo] += 1
        return self.nodo(f'{self.prefisso}{tipo}:{self.conta[tipo]}', tipo, isola, xy)

    def taglia(self, strada, s, fai):
        """Un taglio sulla strada a s: se ce n'è già uno lì vicino è quello, se no lo fa `fai(punto)`."""
        p = punto_a(strada['punti'], strada['cum'], s)
        for s2, id in strada['tagli']:
            n = self.nodi[id]
            if math.dist((n['x'], n['y']), p) <= STESSO:
                return id
        id = fai(p)
        strada['tagli'].append((s, id))
        return id

    def vicina(self, isola, q, fuori=None):
        meglio = None
        for st in self.strade:
            if st['isola'] != isola or st is fuori:
                continue
            s, d, p = proietta(st['punti'], st['cum'], q)
            if meglio is None or d < meglio[2]:
                meglio = (st, s, d)
        return meglio

    def costruisci(self):
        fg = self.fg
        # 1. le caselle, distribuite sui sentieri della loro isola, nell'ordine del foglietto
        prossima = {}
        for st in self.strade:
            n = st['dati'].get('caselle', 0)
            if not n:
                continue
            m0, m1 = st['dati'].get('margini', [30, 30])
            for s in distribuisci(st['punti'], st['cum'], n, m0, m1):
                k = prossima.get(st['isola'], 0)
                prossima[st['isola']] = k + 1
                id = self.nodo(f"{st['isola']}:{k}", 'casella', st['isola'], punto_a(st['punti'], st['cum'], s), k=k)
                st['tagli'].append((s, id))
        # 2. le caselle speciali, sul sentiero più vicino della loro isola
        for nome, sp in fg.get('speciali', {}).items():
            st, s, d = self.vicina(sp['isola'], sp['punto'])
            if d > 20:
                raise SystemExit(f'{nome}: {sp["punto"]} sta a {d:.0f} px dal sentiero più vicino')
            self.taglia(st, s, lambda p, nome=nome, sp=sp: self.nodo(nome, 'sentiero', sp['isola'], p,
                                                                     etichetta=sp['etichetta']))
        # 3. i capi dei sentieri: dove toccano un altro sentiero della stessa isola, un incrocio
        for st in self.strade:
            for capo in (0, -1):
                s_qui = 0.0 if capo == 0 else st['cum'][-1]
                q = st['punti'][capo]
                if any(abs(s - s_qui) < 1 or math.dist((self.nodi[i]['x'], self.nodi[i]['y']), q) <= STESSO
                       for s, i in st['tagli']):
                    continue
                v = self.vicina(st['isola'], q, fuori=st)
                if v and v[2] <= AGGANCIO:
                    altra, s2, _ = v
                    id = self.taglia(altra, s2, lambda p, isola=st['isola']: self.nuovo('incrocio', isola, p))
                    st['tagli'].append((s_qui, id))
        # 4. i ponti: ogni capo si attacca al sentiero più vicino della sua isola
        self.ponti = []
        for pn in fg['ponti']:
            capi = []
            for capo, isola in ((0, pn['isole'][0]), (-1, pn['isole'][1])):
                q = pn['punti'][capo]
                v = self.vicina(isola, q)
                if not v or v[2] > AGGANCIO:
                    raise SystemExit(f'il ponte {pn["nome"]}: il capo {q} non tocca un sentiero di {isola}')
                st, s, _ = v
                capi.append(self.taglia(st, s, lambda p, isola=isola: self.nuovo('incrocio', isola, p)))
            self.ponti.append({**pn, 'capi': capi})
        # 5. le tane
        self.tane = []
        for nome, t in fg.get('tane', {}).items():
            if 'da' in t:          # un passaggio sotto terra: da un'isola all'altra, l'animale cambia
                # un punto solo (la valle: tutte e due le bocche lì) o due: quello di `da` e quello di `a`
                punti = t['punti'] if 'punti' in t else [t['punto'], t['punto']]
                ids = []
                for lato, isola, punto in (('da', t['da'], punti[0]), ('a', t['a'], punti[1])):
                    extra = {'nuvola': True} if lato == 'da' and t.get('nuvola') else {}
                    tid = self.nodo(f'tana:{nome}:{lato}', 'tana', isola, punto, **extra)
                    v = self.vicina(isola, punto)
                    if not v or v[2] > 70:
                        raise SystemExit(f'la tana {nome}/{lato}: {punto} sta lontana da un sentiero di {isola}')
                    st, s, _ = v
                    attacco = self.taglia(st, s, lambda p, isola=isola: self.nuovo('incrocio', isola, p))
                    self.tane.append({'a': attacco, 'b': tid, 'tipo': 'terra'})
                    ids.append(tid)
                self.tane.append({'a': ids[0], 'b': ids[1], 'tipo': 'tunnel'})
            else:                  # la tana che porta all'altro mondo
                tid = self.nodo(f'tana:{nome}', 'passaggio', t['isola'], t['punto'], cartello=t['cartello'])
                st, s, _ = self.vicina(t['isola'], t['punto'])
                attacco = self.taglia(st, s, lambda p, isola=t['isola']: self.nuovo('incrocio', isola, p))
                self.tane.append({'a': attacco, 'b': tid, 'tipo': 'terra'})
        # 6. i capi rimasti liberi
        for st in self.strade:
            for capo in (0, -1):
                s_qui = 0.0 if capo == 0 else st['cum'][-1]
                q = st['punti'][capo]
                if any(math.dist((self.nodi[i]['x'], self.nodi[i]['y']), q) <= STESSO for s, i in st['tagli']):
                    continue
                st['tagli'].append((s_qui, self.nuovo('capo', st['isola'], q)))
        # 7. gli archi
        self.archi = []
        for st in self.strade:
            tagli = sorted(st['tagli'])
            for (s0, a), (s1, b) in zip(tagli, tagli[1:]):
                if a == b:
                    continue
                pz = pezzo(st['punti'], st['cum'], s0, s1)
                self.arco(a, b, st['tipo'], pz)
        for pn in self.ponti:
            a, b = pn['capi']
            self.arco(a, b, 'ponte', [tuple(q) for q in pn['punti']], ponte=pn['nome'])
            pn['linea'] = self.archi[-1]['punti']
        for t in self.tane:
            na, nb = self.nodi[t['a']], self.nodi[t['b']]
            self.arco(t['a'], t['b'], t['tipo'], [(na['x'], na['y']), (nb['x'], nb['y'])])
        # 8. le soste: un arco lungo si spezza, così toccando a metà di un ponte il segnalino si
        #    ferma lì; quelle di un ponte non sono di un'isola, e fino al blocco ci si arriva
        lunghi, self.archi = self.archi, []
        for e in lunghi:
            p = [tuple(q) for q in e['punti']]
            cum = lunghezze(p)
            k = 1 if e['tipo'] == 'tunnel' else math.ceil(cum[-1] / SOSTA)
            if k <= 1:
                self.archi.append(e)
                continue
            isola = None if e['tipo'] == 'ponte' else self.nodi[e['a']]['isola']
            extra = {'ponte': e['ponte']} if 'ponte' in e else {}
            prima = e['a']
            for j in range(1, k + 1):
                id = e['b'] if j == k else self.nuovo('sosta', isola, punto_a(p, cum, cum[-1] * j / k))
                if j < k and 'ponte' in e:
                    self.nodi[id]['ponte'] = e['ponte']
                self.arco(prima, id, e['tipo'], pezzo(p, cum, cum[-1] * (j - 1) / k, cum[-1] * j / k), **extra)
                prima = id
        return self

    def arco(self, a, b, tipo, punti, **extra):
        na, nb = self.nodi[a], self.nodi[b]
        # i capi sono quelli dei nodi: la spezzata parte e arriva lì
        pz = [(na['x'], na['y'])] + [tuple(q) for q in punti[1:-1]] + [(nb['x'], nb['y'])]
        self.archi.append({'a': a, 'b': b, 'tipo': tipo, **extra,
                           'punti': [[tondo(x), tondo(y)] for x, y in pz]})

    def blocchi(self):
        """Per ogni ponte, dove sta il blocco di ciascun capo: sul ponte, a BLOCCO px dal capo."""
        out = {}
        for pn in self.ponti:
            p = [tuple(q) for q in pn['linea']]
            cum = lunghezze(p)
            b = {}
            b0, b1 = pn.get('blocco', [BLOCCO, BLOCCO])
            for isola, s, verso in ((pn['isole'][0], b0, 1), (pn['isole'][1], cum[-1] - b1, -1)):
                x, y = punto_a(p, cum, s)
                x2, y2 = punto_a(p, cum, s + 4 * verso)
                b[isola] = [tondo(x), tondo(y), round(math.degrees(math.atan2(y2 - y, x2 - x)))]
            out[pn['nome']] = {'isole': pn['isole'], 'blocchi': b}
        return out


def controlla(fg, g, im):
    """Quello che si sbaglia correggendo il foglietto a mano."""
    guasti = []
    lato = fg['lato']
    caselle = [n for n in g.nodi.values() if n['tipo'] in ('casella', 'sentiero')]
    for n in caselle:
        mezzo = lato * (0.68 if n['tipo'] == 'sentiero' else 0.5)
        if n['x'] - mezzo < 0 or n['y'] - mezzo < 0 or n['x'] + mezzo > im.size[0] or n['y'] + mezzo > im.size[1]:
            guasti.append(f'{n["id"]} esce dal fondale')
    def mezzo(n):
        return lato * (0.68 if n['tipo'] == 'sentiero' else 0.5)
    for i, a in enumerate(caselle):
        for b in caselle[i + 1:]:
            d = stacco((a['x'], a['y']), (b['x'], b['y'])) - mezzo(a) - mezzo(b)
            if d < SPAZIO:
                guasti.append(f'{a["id"]} e {b["id"]} si toccano (fra i bordi {d:.0f} px, ne servono {SPAZIO})')
    # il blocco (la sbarra, 54×30, posata col piede sul punto) non copre una casella
    for nome, pn in g.blocchi().items():
        for isola, (x, y, _) in pn['blocchi'].items():
            for n in caselle:
                m = mezzo(n)
                if abs(n['x'] - x) < 27 + m and n['y'] - m < y + 9 and n['y'] + m > y - 22:
                    guasti.append(f'il blocco del ponte {nome} dalla parte di {isola} copre {n["id"]}')
    for isola, dati in fg['isole'].items():
        n = sum(1 for x in g.nodi.values() if x['tipo'] == 'casella' and x['isola'] == isola)
        if n != dati['caselle']:
            guasti.append(f'{isola}: {n} caselle, il foglietto ne vuole {dati["caselle"]} (contando i "caselle" dei suoi sentieri)')
    # tutto si raggiunge da tutto
    vicini = {id: set() for id in g.nodi}
    for e in g.archi:
        vicini[e['a']].add(e['b'])
        vicini[e['b']].add(e['a'])
    visti, pila = {g.ordine[0]}, [g.ordine[0]]
    while pila:
        for v in vicini[pila.pop()]:
            if v not in visti:
                visti.add(v)
                pila.append(v)
    staccati = [id for id in g.nodi if id not in visti]
    if staccati:
        guasti.append('nodi staccati dal resto: ' + ', '.join(staccati))
    if guasti:
        raise SystemExit('il foglietto non torna:\n  ' + '\n  '.join(guasti))


def js(v):
    return json.dumps(v, ensure_ascii=False, separators=(',', ':'))


def genera(mondo):
    fg = leggi(mondo)
    im = Image.open(SORGENTI / fg['immagine']).convert('RGB')
    g = Grafo(fg).costruisci()
    controlla(fg, g, im)
    b = io.BytesIO()
    im.save(b, 'WEBP', quality=fg['qualita'], method=6)
    b64 = base64.b64encode(b.getvalue()).decode()
    kb = len(b.getvalue()) // 1024
    corpo = TESTA.format(largo=im.size[0], alto=im.size[1], kb=kb, foglietto=FOGLIETTI[mondo])
    corpo += f"\nexport const LARGO = {im.size[0]}, ALTO = {im.size[1]}\n"
    corpo += f"export const LATO = {fg['lato']}\n"
    corpo += f"export const FIRMA = '{firma(mondo)}'\n"
    corpo += f"export const LIBERE = {js(fg.get('libere', []))}\n\n"
    corpo += 'export const ISOLE = {\n' + ''.join(f"  {js(k)}: {js(v)},\n" for k, v in fg['isole'].items()) + '}\n\n'
    corpo += 'export const NODI = [\n' + ''.join(f"  {js(g.nodi[id])},\n" for id in g.ordine) + ']\n\n'
    corpo += 'export const ARCHI = [\n' + ''.join(f"  {js(e)},\n" for e in g.archi) + ']\n\n'
    corpo += 'export const PONTI = {\n' + ''.join(f"  {js(k)}: {js(v)},\n" for k, v in g.blocchi().items()) + '}\n'
    corpo += f"\nexport const MAPPA = 'data:image/webp;base64,{b64}'\n"
    dest = REPO / fg['modulo']
    dest.write_text(corpo)
    print(f'{dest.relative_to(REPO)}: fondale {im.size[0]}×{im.size[1]}, {kb} KB; '
          f'{len(g.nodi)} nodi, {len(g.archi)} archi')


def provino(mondo):
    """Il fondale con sopra quello che sa il gioco: i sentieri (gialli; l'erba a
    puntini), i ponti (arancio) col blocco di ogni capo, le caselle numerate,
    le speciali, le tane, gli incroci e i cartelli."""
    fg = leggi(mondo)
    im = Image.open(SORGENTI / fg['immagine']).convert('RGBA')
    g = Grafo(fg).costruisci()
    velo = Image.new('RGBA', im.size, (0, 0, 0, 0))
    d = ImageDraw.Draw(velo)
    for e in g.archi:
        p = [tuple(q) for q in e['punti']]
        if e['tipo'] == 'erba':
            cum = lunghezze(p)
            s = 0.0
            while s < cum[-1]:
                x, y = punto_a(p, cum, s)
                d.ellipse([x - 3, y - 3, x + 3, y + 3], fill=(255, 255, 120, 230))
                s += 12
        else:
            colore = {'ponte': (255, 140, 30, 230), 'tunnel': (200, 80, 255, 230)}.get(e['tipo'], (255, 235, 60, 230))
            d.line(p, fill=colore, width=4, joint='curve')
    lato = fg['lato']
    for n in g.nodi.values():
        x, y = n['x'], n['y']
        if n['tipo'] == 'casella':
            h = lato / 2
            d.rounded_rectangle([x - h, y - h, x + h, y + h], radius=12, outline=(255, 255, 255, 255), width=3,
                                fill=(255, 255, 255, 70))
            d.text((x - 12, y - 6), f"{n['isola'][:4]}{n['k']}", fill=(20, 20, 20, 255))
        elif n['tipo'] == 'sentiero':
            h = lato * 0.68
            d.ellipse([x - h, y - h, x + h, y + h], outline=(255, 210, 40, 255), width=4, fill=(255, 240, 160, 90))
            d.text((x - 20, y - 6), n['id'], fill=(20, 20, 20, 255))
            ex, ey = n['etichetta']
            d.rounded_rectangle([ex, ey - 22, ex + 180, ey + 22], radius=12, outline=(255, 210, 40, 255), width=2)
        elif n['tipo'] in ('tana', 'passaggio'):
            d.ellipse([x - 12, y - 12, x + 12, y + 12], outline=(255, 120, 255, 255) if n.get('nuvola') else (200, 80, 255, 255),
                      width=4)
            d.text((x + 14, y - 6), n['id'].replace('tana:', ''), fill=(255, 255, 255, 255))
            if 'cartello' in n:
                cx, cy = n['cartello']
                d.rounded_rectangle([cx - 52, cy - 14, cx + 52, cy + 14], radius=14, outline=(200, 80, 255, 255), width=2)
        elif n['tipo'] == 'incrocio':
            d.ellipse([x - 5, y - 5, x + 5, y + 5], fill=(40, 200, 255, 255))
        elif n['tipo'] == 'sosta':
            d.ellipse([x - 4, y - 4, x + 4, y + 4], fill=(255, 255, 255, 255))
        else:
            d.ellipse([x - 5, y - 5, x + 5, y + 5], fill=(255, 60, 60, 255))
    for pn in g.blocchi().values():
        for isola, (x, y, gradi) in pn['blocchi'].items():
            d.rectangle([x - 14, y - 9, x + 14, y + 9], outline=(230, 30, 30, 255), width=3)
    for isola, dati in fg['isole'].items():
        x, y = dati['cartello']
        mx, my = (14, 14) if dati.get('stemma') else (90, 27)
        d.rectangle([x - mx, y - my, x + mx, y + my], fill=(255, 250, 240, 200),
                            outline=(110, 50, 10, 255), width=2)
        d.text((x - mx + 3, y - 6), isola[:3] if dati.get('stemma') else isola, fill=(110, 50, 10, 255))
    TMP.mkdir(parents=True, exist_ok=True)
    nome = 'provino.png' if mondo == 'valle' else f'provino-{mondo}.png'
    Image.alpha_composite(im, velo).save(TMP / nome)
    print(f'tmp/isole/{nome}')


if __name__ == '__main__':
    mondi = [m for m in FOGLIETTI if m in sys.argv] or list(FOGLIETTI)
    for m in mondi:
        if '--provino' in sys.argv:
            provino(m)
        else:
            genera(m)
