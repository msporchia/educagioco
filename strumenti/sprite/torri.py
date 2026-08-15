#!/usr/bin/env python3
"""Porta dentro un foglio di torri e terreni generato, per il campo del castello.

    python3 strumenti/sprite/torri.py            # rifà poc/castello-atlante.js
    python3 strumenti/sprite/torri.py --provini  # ...e un foglio da guardare

Fratello di `attori.py`, e per lo stesso motivo: quello che restituisce un
generatore di immagini non è mai già pronto. Qui il foglio è una **tabella**
— dodici famiglie di torre in colonna, tre stadi in riga, e sotto le tessere
del terreno — su una scacchiera «trasparente» che di trasparente non ha
niente, perché è un JPEG.

Le tre cose che fa:

  1. **ritaglia**. Le torri per griglia (colonna = famiglia, riga = stadio:
     quello che il campo del castello chiama STADIO, 1-3 / 4-6 / 7-10), i
     terreni a componenti connesse, perché lì la griglia è irregolare e
     contare le celle a mano è il modo sicuro di sbagliare.
  2. **toglie il fondo**. La scacchiera si riconosce dal *pattern* e non dal
     colore: mezze torri sono di pietra grigia, e cancellare «tutto il
     grigio» le buca in mezzo.
  3. **rimpicciolisce**. Il foglio è a risoluzione piena e finto-pixel-art:
     le run di colore non cadono su nessuna griglia. Ridotto alla misura
     vera — tessera 32 — e con la tavolozza tagliata, torna a essere pixel
     art per davvero.

Il risultato è un PNG solo in base64 dentro `poc/castello-atlante.js`, con la
tabella dei ritagli accanto: un file solo, come vuole il build.

── QUESTO ATTREZZO È PROVVISORIO ──
`atlante.py` non indovina più niente: legge il foglietto `.json` accanto alla
sorgente (vedi `FORMATO.md`) e ignora i fogli che non ce l'hanno. È la strada
giusta, e questo file è la strada vecchia — indovina tutto, e infatti sbaglia
in silenzio: sei torri escono con un pezzo di scacchiera addosso, e i nomi
dei terreni sono quelli che gli abbiamo dato contando le figure a occhio, non
quelli delle figure (`erba-alta` è un lastricato).

Quello che manca al foglietto per descrivere questo foglio è che qui le
griglie sono **due**, e nessuna delle due ha il passo uguale alla cella. Le
misure sono queste, e sono l'unica cosa di questo file che valga la pena
salvare:

    torri     12 colonne a passo 117,33 px, tre bande: y 4-115, 115-245,
              245-380 (nel secondo foglio: 44-120, 120-193, 193-268)
    terreni   celle da 74 px a passo 99 × 82, la prima a (10, 443)
    scala     74 → 32, cioè una tessera di terreno vale 32 px veri

Quando il foglietto saprà dire «una tabella di celle a passo P», questo file
si butta e restano quelle sette righe.
"""
import base64
import io
import sys
from collections import Counter, deque
from pathlib import Path

from PIL import Image

QUI = Path(__file__).parent
REPO = Path(__file__).resolve().parents[2]
SORGENTI = QUI / 'sorgenti'
USCITA = REPO / 'poc' / 'castello-atlante.js'

TESSERA = 32                 # quanto vale una tessera di terreno, in pixel veri
SCALA = TESSERA / 74.0       # nel foglio una tessera è 74 px
COLORI = 64                  # la tavolozza dell'atlante intero

# ── i due fogli ───────────────────────────────────────────────────────
# Le colonne sono le famiglie, nell'ordine in cui stanno scritte sotto al
# foglio. I nomi sono i nostri: quello che il gioco chiederà.
TORRI_1 = ['arciere', 'magica', 'ghiaccio', 'veleno', 'bomba', 'cecchino',
           'raffica', 'fuoco', 'fulmine', 'arcana', 'mortaio', 'forte']
TORRI_2 = ['tesla', 'golem', 'pianta', 'plasma', 'santuario', 'missile',
           'fonte', 'cannoni', 'acido', 'anime', 'faro', 'cittadella']

# I terreni, letti a componenti connesse e poi ordinati per riga e colonna.
# Un nome per posto; `None` vuol dire «buttalo».
TERRENI_1 = [
    # riga 1 — strade, erbe, muri, alberi
    'strada-v', 'strada-curva-so', 'strada-o', 'strada-t-s',
    'erba0', 'erba1', 'erba-fiori', 'erba-alta',
    'muro-pietra', 'roccia-grezza', 'muro-mattoni', 'sasso-tondo',
    'albero-piccolo', 'pino1', 'pino2', 'pino3', 'albero-tondo', 'albero-autunno',
    # riga 2
    'strada-o2', 'strada-curva-se', 'strada-curva-no', 'strada-t-n',
    'erba-scura', 'erba-cespugli', 'erba-fiori-rossi', 'erba-alta-scura',
    'lastra', 'mattoni2', 'sassi',
    'pino4', 'pino5', 'pino6',
    # riga 3
    'strada-esse', 'acqua', 'acqua-onde', 'riva-o', 'riva-v', 'riva-e',
    'pino7', 'pino8', 'pino9', 'albero-grande',
    'cespuglio1', 'cespuglio2', 'staccionata-o', 'staccionata-t', 'staccionata-v',
    'acqua2', 'acqua-onde2', 'riva-o2',
    'insegna', 'cancello', 'portone',
]


def neutro(c, t=14):
    return abs(c[0] - c[1]) < t and abs(c[1] - c[2]) < t and abs(c[0] - c[2]) < t


def grigi_di(im):
    """I due grigi della scacchiera «trasparente», che di trasparente non ha
    niente perché è un JPEG: i due valori più frequenti fra i pixel neutri
    dei bordi, dove il fondo è scoperto."""
    W, H = im.size
    px = im.load()
    conto = Counter()
    orlo = [(x, y) for x in range(W) for y in (0, 1, H - 2, H - 1)]
    orlo += [(x, y) for y in range(H) for x in (0, 1, W - 2, W - 1)]
    for x, y in orlo:
        c = px[x, y]
        if neutro(c, 10):
            conto[round(sum(c) / 3)] += 1
    picchi = []
    for v, _ in conto.most_common():
        if all(abs(v - p) > 12 for p in picchi):
            picchi.append(v)
        if len(picchi) == 2:
            break
    return picchi if len(picchi) == 2 else [67, 110]


def maschera_di(im, stretta=False):
    """Vero dove c'è disegno. Ce ne vogliono due, e servono a due cose.

    Quella **larga** — grigio neutro e scuro — dice dove stanno le figure:
    il fondo esce nero pieno e i pezzi si contano bene. Ma cancella la
    pietra delle torri, che è dello stesso grigio.

    Quella **stretta** tiene le due tinte del fondo — cinque livelli di grigio
    — cinque livelli di grigio e basta — ed è quella con cui si toglie il
    fondo davvero. Qualche pixel di pietra ci casca dentro lo stesso, ma ci
    casca **sparso**, e un allagamento a quattro vicini non passa
    attraverso dei granelli: è tutto quello che serve."""
    W, H = im.size
    px = im.load()
    a, b = grigi_di(im)
    m = bytearray(W * H)
    for y in range(H):
        r = y * W
        for x in range(W):
            c = px[x, y]
            v = (c[0] + c[1] + c[2]) / 3
            fondo = (neutro(c, 12) and (abs(v - a) < 9 or abs(v - b) < 9)) if stretta \
                else (neutro(c, 14) and v < 130)
            if not fondo:
                m[r + x] = 1

    # i separatori fra una colonna e l'altra: righe verticali scure e
    # neutre, alte quanto il foglio. Non sono disegno, sono impaginazione
    for x in range(W):
        scuri = sum(1 for y in range(0, H, 2)
                    if neutro(px[x, y], 16) and sum(px[x, y]) / 3 < 82)
        if scuri > H / 2 * 0.72:
            for y in range(H):
                m[y * W + x] = 0
    return m


def scatola(m, W, x0, y0, x1, y1, margine=2):
    """Il rettangolo che contiene davvero il disegno, dentro una cella."""
    minx, miny, maxx, maxy = x1, y1, x0, y0
    for y in range(y0, y1):
        r = y * W
        for x in range(x0, x1):
            if m[r + x]:
                if x < minx: minx = x
                if x > maxx: maxx = x
                if y < miny: miny = y
                if y > maxy: maxy = y
    if maxx < minx:
        return None
    return (max(x0, minx - margine), max(y0, miny - margine),
            min(x1, maxx + 1 + margine), min(y1, maxy + 1 + margine))


def componenti(m, W, H, regione, minimo=900, dilata=2):
    """I pezzi separati dentro una regione. Prima si allarga la maschera di
    un paio di pixel: il JPEG sbriciola le figure grigie in coriandoli, e
    senza questo una roccia esce in quindici pezzi."""
    x0, y0, x1, y1 = regione
    d = bytearray(W * H)
    for y in range(y0, y1):
        for x in range(x0, x1):
            if m[y * W + x]:
                for dy in range(-dilata, dilata + 1):
                    for dx in range(-dilata, dilata + 1):
                        nx, ny = x + dx, y + dy
                        if x0 <= nx < x1 and y0 <= ny < y1:
                            d[ny * W + nx] = 1
    vis = bytearray(W * H)
    fuori = []
    for sy in range(y0, y1):
        for sx in range(x0, x1):
            if vis[sy * W + sx] or not d[sy * W + sx]:
                continue
            q = deque([(sx, sy)])
            vis[sy * W + sx] = 1
            a, b, c, e, n = sx, sy, sx, sy, 0
            while q:
                x, y = q.popleft()
                n += 1
                a = min(a, x); c = max(c, x); b = min(b, y); e = max(e, y)
                for dx, dy in ((1, 0), (-1, 0), (0, 1), (0, -1)):
                    nx, ny = x + dx, y + dy
                    if x0 <= nx < x1 and y0 <= ny < y1 and not vis[ny * W + nx] and d[ny * W + nx]:
                        vis[ny * W + nx] = 1
                        q.append((nx, ny))
            if n >= minimo:
                fuori.append((a + dilata, b + dilata, c - dilata + 1, e - dilata + 1))
    # ordinati come si legge: per fasce di riga, poi da sinistra
    fuori.sort(key=lambda s: (s[1] // 70, s[0]))
    return fuori


def ritaglia(im, m, W, box):
    """Il ritaglio con l'alfa: il fondo si allaga dai bordi, mai per colore."""
    x0, y0, x1, y1 = box
    w, h = x1 - x0, y1 - y0
    sub = im.crop(box).convert('RGBA')
    px = sub.load()
    # il fondo di partenza è la maschera; poi si allaga dai bordi per
    # prendere anche quello che il JPEG ha sporcato
    dentro = [[bool(m[(y0 + y) * W + (x0 + x)]) for x in range(w)] for y in range(h)]
    vuoto = bytearray(w * h)
    q = deque()
    for x in range(w):
        for y in (0, h - 1):
            if not dentro[y][x] and not vuoto[y * w + x]:
                vuoto[y * w + x] = 1; q.append((x, y))
    for y in range(h):
        for x in (0, w - 1):
            if not dentro[y][x] and not vuoto[y * w + x]:
                vuoto[y * w + x] = 1; q.append((x, y))
    while q:
        x, y = q.popleft()
        for dx, dy in ((1, 0), (-1, 0), (0, 1), (0, -1)):
            nx, ny = x + dx, y + dy
            if 0 <= nx < w and 0 <= ny < h and not vuoto[ny * w + nx] and not dentro[ny][nx]:
                vuoto[ny * w + nx] = 1
                q.append((nx, ny))
    for y in range(h):
        for x in range(w):
            if vuoto[y * w + x]:
                px[x, y] = (0, 0, 0, 0)
    return sub


def piena(im, quota=0.9):
    """Se il disegno tocca tutti e quattro i bordi ed è quasi quadrato, è
    una tessera di terreno: sta in griglia e va alla misura esatta."""
    w, h = im.size
    if not (0.85 < w / h < 1.18 and w > 50):
        return False
    a = im.getchannel('A').load()
    for fila in ([(x, 0) for x in range(w)], [(x, h - 1) for x in range(w)],
                 [(0, y) for y in range(h)], [(w - 1, y) for y in range(h)]):
        if sum(1 for x, y in fila if a[x, y] > 128) < len(fila) * quota:
            return False
    return True


def rimpicciolisci(im, scala):
    """Ridurre un RGBA sbava il colore dei pixel trasparenti sui vicini.
    Si tinge il vuoto col colore medio di quello che c'è, si riduce, e si
    ritaglia l'alfa con una soglia: bordi netti, come vuole la pixel art."""
    w = max(1, round(im.width * scala))
    h = max(1, round(im.height * scala))
    px = im.load()
    n, sr, sg, sb = 0, 0, 0, 0
    for y in range(im.height):
        for x in range(im.width):
            r, g, b, a = px[x, y]
            if a > 128:
                n += 1; sr += r; sg += g; sb += b
    medio = (sr // n, sg // n, sb // n) if n else (0, 0, 0)
    pieno = Image.new('RGB', im.size, medio)
    pieno.paste(im, (0, 0), im)
    col = pieno.resize((w, h), Image.LANCZOS)
    alfa = im.getchannel('A').resize((w, h), Image.LANCZOS).point(lambda v: 255 if v > 110 else 0)
    col.putalpha(alfa)
    return col


def impacchetta(pezzi, larghezza=512):
    """Una scaffalatura: le figure in righe, la più alta detta il passo."""
    ordinate = sorted(pezzi.items(), key=lambda kv: -kv[1].height)
    posti, x, y, alta = {}, 0, 0, 0
    for nome, im in ordinate:
        if x + im.width > larghezza:
            x, y, alta = 0, y + alta + 1, 0
        posti[nome] = (x, y, im.width, im.height)
        x += im.width + 1
        alta = max(alta, im.height)
    H = y + alta
    foglio = Image.new('RGBA', (larghezza, H), (0, 0, 0, 0))
    for nome, (px_, py_, _, _) in posti.items():
        foglio.paste(pezzi[nome], (px_, py_))
    return foglio, posti


def taglia_tavolozza(im, colori):
    """La riduzione dei colori si fa sull'atlante intero, se no due tessere
    vicine finiscono su due verdi diversi e il prato sembra una tabella."""
    alfa = im.getchannel('A')
    rgb = im.convert('RGB').quantize(colors=colori, method=Image.MEDIANCUT).convert('RGB')
    rgb.putalpha(alfa)
    return rgb


def torri_da(im, m, W, nomi, righe):
    """Dodici colonne a passo fisso, tre stadi. Il passo lo detta il foglio:
    1408 diviso dodici."""
    fuori = {}
    passo = im.width / len(nomi)
    for i, nome in enumerate(nomi):
        for s, (ya, yb) in enumerate(righe):
            cella = (round(i * passo) + 3, ya, round((i + 1) * passo) - 3, yb)
            box = scatola(m, W, *cella)
            if box:
                fuori[f'{nome}{s + 1}'] = box
    return fuori


def main():
    provini = '--provini' in sys.argv
    pezzi, sorgente = {}, {}

    # ── foglio 1: torri, terreni, alberi ──
    f1 = Image.open(SORGENTI / 'tower_def.jpeg').convert('RGB')
    W1, H1 = f1.size
    largo1, stretto1 = maschera_di(f1), maschera_di(f1, stretta=True)
    for nome, box in torri_da(f1, largo1, W1, TORRI_1, [(4, 115), (115, 245), (245, 380)]).items():
        pezzi[nome] = ritaglia(f1, stretto1, W1, box); sorgente[nome] = 1

    trovati = componenti(largo1, W1, H1, (0, 425, W1, H1))
    if len(trovati) != len(TERRENI_1):
        print(f'! terreni: trovati {len(trovati)}, nomi {len(TERRENI_1)}')
    for nome, box in zip(TERRENI_1, trovati):
        if nome:
            pezzi[nome] = ritaglia(f1, stretto1, W1, box); sorgente[nome] = 1

    # ── foglio 2: solo le torri, che sono l'altra metà del catalogo ──
    f2 = Image.open(SORGENTI / 'tower_def2.jpeg').convert('RGB')
    W2 = f2.width
    largo2, stretto2 = maschera_di(f2), maschera_di(f2, stretta=True)
    for nome, box in torri_da(f2, largo2, W2, TORRI_2, [(44, 120), (120, 193), (193, 268)]).items():
        pezzi[nome] = ritaglia(f2, stretto2, W2, box); sorgente[nome] = 2

    if provini:
        prov = REPO / 'poc' / 'scatti'
        prov.mkdir(exist_ok=True)
        for nome, im in pezzi.items():
            im.save(prov / f'grezzo-{nome}.png')

    # ── alla misura vera, poi in un foglio solo ──
    # Una tessera di terreno va alla misura esatta, non a quella che esce
    # dal conto: 31 px invece di 32 vuol dire una fuga scura fra una
    # tessera e l'altra, e un prato che sembra un pavimento di piastrelle.
    # Si riconosce da sola — è l'unica cosa che riempie il suo quadrato
    # fino ai quattro bordi.
    def alla_misura(im):
        if not piena(im):
            return rimpicciolisci(im, SCALA)
        # il margine di ritaglio porta con sé un filo di scacchiera: sulla
        # tessera diventa una fuga scura fra una zolla e l'altra
        m = 3
        return im.crop((m, m, im.width - m, im.height - m)) \
                 .resize((TESSERA, TESSERA), Image.LANCZOS).convert('RGBA')

    piccoli = {n: alla_misura(im) for n, im in pezzi.items()}
    foglio, posti = impacchetta(piccoli)
    foglio = taglia_tavolozza(foglio, COLORI)

    buf = io.BytesIO()
    foglio.save(buf, 'PNG', optimize=True)
    dati = base64.b64encode(buf.getvalue()).decode()

    # i nomi col trattino vogliono gli apici: `strada-v:` da solo non è
    # una chiave valida, ed è un errore di sintassi che spegne tutto il file
    righe = ',\n  '.join(f"{n if n.isidentifier() else repr(n)}: "
                         f"[{v[0]}, {v[1]}, {v[2]}, {v[3]}]"
                         for n, v in sorted(posti.items()))
    USCITA.write_text(
        "/* GENERATO da strumenti/sprite/torri.py — non si scrive a mano.\n\n"
        f"   {len(posti)} figure ritagliate da `strumenti/sprite/sorgenti/tower_def.jpeg`\n"
        "   e `tower_def2.jpeg`. Una tessera di terreno vale "
        f"{TESSERA} px; le torri sono in scala con quella.\n\n"
        "   `PEZZI[nome] = [x, y, larghezza, altezza]` dentro l'atlante. */\n"
        f"export const TESSERA = {TESSERA}\n\n"
        f"export const PEZZI = {{\n  {righe},\n}}\n\n"
        f"export const ATLANTE = 'data:image/png;base64,{dati}'\n", encoding='utf-8')

    # ...e dentro il poc, che deve aprirsi col doppio click: da `file://`
    # Chrome non lascia importare un modulo, quindi l'atlante ci sta dentro
    poc = REPO / 'poc' / 'castello-gfx.html'
    if poc.exists():
        testo = poc.read_text(encoding='utf-8')
        a = testo.index('/* ↓↓ atlante ↓↓')
        a = testo.index('\n', a) + 1
        b = testo.index('/* ↑↑ atlante ↑↑')
        poc.write_text(testo[:a] + f'const TESSERA = {TESSERA}\n'
                       f'const PEZZI = {{\n  {righe},\n}}\n'
                       f"const ATLANTE = 'data:image/png;base64,{dati}'\n" + testo[b:],
                       encoding='utf-8')

    print(f'{len(posti)} figure, atlante {foglio.width}×{foglio.height}, '
          f'{len(buf.getvalue()) / 1024:.0f} KB → {USCITA.relative_to(REPO)}'
          + (' e poc/castello-gfx.html' if poc.exists() else ''))


if __name__ == '__main__':
    main()
