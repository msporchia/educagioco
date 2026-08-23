#!/usr/bin/env python3
"""Porta dentro i fogli del castello a tessere.

    python3 strumenti/sprite/terreni.py              # rifà l'atlante
    python3 strumenti/sprite/terreni.py --provini    # ...e un foglio da guardare

Fratello di `atlante.py`, e sta a parte per una ragione sola: quello
ritaglia **figure** — un cane, una torre, un attore con i suoi
fotogrammi — mentre qui si ritaglia un **mondo a griglia**, e sono due
mestieri con due problemi diversi. Una figura la si dichiara e si prende;
una tessera bisogna anche sapere **come si attacca a quelle vicine**, e
quello non si dichiara: si misura.

Le tre cose che fa, e nessuna delle tre la fa `atlante.py`:

  1. **ritaglia per griglia**. Il foglietto dice origine, passo e misura
     della cella; il passo può non essere intero, perché un foglio
     disegnato a mano libera non cade mai su multipli tondi.
  2. **scolla il terreno**. Di una tessera di strada tiene la strada e la
     frangia del ciglio, e butta il prato: così il fondo lo si dipinge
     una volta sola e le strade ci si posano sopra. È il modo standard di
     fare le transizioni — *overlay*, o *decal* — e serve a non ritrovarsi
     un secondo verde attorno alla strada, che è esattamente quello che
     si vedeva quando ogni tessera si portava dietro il suo pezzo di
     prato.
  3. **misura gli attacchi**. Per ogni lato dice se la strada lo
     attraversa e **dove**: in mezzo, di lato a sinistra, di lato a
     destra. Chi dipinge non chiede più «la curva a nord-est»: chiede al
     risolutore di `grafica/tessere.js` una tessera che si innesti con le
     vicine, e per quello contano solo gli attacchi. È il motivo per cui
     qui i nomi delle tessere sono numeri (`bosco-7`) e non descrizioni:
     un nome che descrive è un nome che prima o poi mente.

Serve `pillow`. Il foglietto sta accanto al foglio, vedi FORMATO.md e la
sezione «una griglia di tessere» in fondo.
"""
import json
import re
import sys
from pathlib import Path

from PIL import Image

from catalogo import Catalogo, breve, scrivi

QUI = Path(__file__).parent
REPO = Path(__file__).resolve().parents[2]
RADICE = QUI / 'sorgenti'


def cartella_mia():
    """Dove stanno i fogli che ritaglia **questo** attrezzo.

    Non è cablata, e non deve esserlo: la cartella di un gioco si
    rinomina (`sorgenti/td/` è diventata `sorgenti/castello/`) e un
    percorso scritto qui dentro si accorge del cambio nel modo peggiore,
    cioè scrivendo un atlante vuoto sopra quello buono. Chi lo dice è
    lo stesso `atlante.json` che apre il bersaglio, con la riga
    `"attrezzo": "terreni"` — la stessa che fa saltare la cartella ad
    `atlante.py`. Una dichiarazione, letta da tutti e due."""
    quali = [g.parent for g in sorted(RADICE.rglob('atlante.json'))
             if json.loads(g.read_text()).get('attrezzo') == 'terreni']
    if not quali:
        raise SystemExit(f'nessun atlante.json con "attrezzo": "terreni" sotto {RADICE}')
    if len(quali) > 1:
        raise SystemExit('più di una cartella dichiara «terreni»: '
                         + ', '.join(str(q.relative_to(RADICE)) for q in quali))
    return quali[0]

LARGO = 512                       # larghezza dell'atlante, in pixel
NIENTE = '·'                     # il lato che la strada non attraversa
MISURA = 36                       # a che misura si legge la forma di una tessera

EXTRA_DOC = """
   ── e quello che ha di suo un mondo a tessere ──
   ATTACCHI   nome → dove la strada tocca ogni lato: `·` da nessuna
              parte, `c` in mezzo, `sx`/`dx` di lato. Due tessere si
              accostano se il lato che si guardano dice la stessa cosa —
              il N di quella sotto contro il S di quella sopra. Chi le
              sceglie è `componiPercorso` in `grafica/tessere.js`.
   AMBIENTI   materia → le sue strade e i suoi fondi.
   FIGURE     quello che non è terreno: torri, castello, bocche.
"""

CODA = """
export const ATTACCHI = {attacchi}

export const AMBIENTI = {ambienti}

export const FIGURE = {figure}

export const nomiDi = ambiente => (AMBIENTI[ambiente] || {{}}).strade || []
export const pratiDi = ambiente => (AMBIENTI[ambiente] || {{}}).prati || []
"""


# ── il ritaglio ──────────────────────────────────────────────────────
def bande(quante, pieno, minima):
    """Le fasce piene lungo un asse: `[inizio, misura]`, e si scartano le
    briciole. Una banda larga più di una volta e mezza la mediana sono
    due tessere che si toccano, e si taglia in parti uguali."""
    fuori, i0 = [], None
    for i in range(quante):
        p = pieno(i)
        if p and i0 is None:
            i0 = i
        if not p and i0 is not None:
            fuori.append([i0, i - i0])
            i0 = None
    if i0 is not None:
        fuori.append([i0, quante - i0])
    fuori = [b for b in fuori if b[1] >= minima]
    if not fuori:
        return fuori
    mediana = sorted(b[1] for b in fuori)[len(fuori) // 2]
    spezzate = []
    for x, w in fuori:
        n = max(1, round(w / mediana))
        for k in range(n):
            spezzate.append([x + w * k // n, w // n])
    return spezzate


def griglia_da_alfa(im, minima=30):
    """La griglia, **misurata** invece che scritta.

    Su un foglio di tessere il vuoto fra una e l'altra è trasparente, e
    questo è tutto quello che serve: le file sono le fasce piene lungo
    l'altezza, le colonne le fasce piene *dentro una fila*. Colonne
    dentro una fila e non su tutto il foglio, perché su questi fogli le
    tessere non stanno su una griglia: sono larghe da 54 a 75 pixel, e
    una colonna misurata sull'intero foglio si mangia il corridoio fra
    due tessere della fila accanto.

    Prima queste misure stavano scritte a mano nel foglietto, prese una
    volta con `misura.py`. Sbagliavano: un elenco solo di colonne per
    otto file diverse ritagliava pezzi di tessera, e si vedeva a schermo
    invece che qui. Misurarle a ogni giro costa un decimo di secondo ed è
    l'unica cosa che non può diventare stantia."""
    w, h = im.size
    px = im.load()
    fuori = []
    for y0, hh in bande(h, lambda y: any(px[x, y][3] > 20 for x in range(0, w, 2)), minima):
        colonne = bande(w, lambda x: any(px[x, y][3] > 20 for y in range(y0, y0 + hh)), minima)
        fuori.append((y0, hh, colonne))
    return fuori


def celle_di(griglia):
    """Le caselle di una griglia misurata, in pixel."""
    for riga, (y, h, colonne) in enumerate(griglia):
        for col, (x, w) in enumerate(colonne):
            yield riga, col, (x, y, w, h)


def mediana(px, punti):
    """Il colore di un pugno di pixel, senza farsi tirare dai casi
    strani: un ciuffo d'erba in mezzo alla strada sposta una media, non
    una mediana."""
    c = [px[x, y] for x, y in punti if px[x, y][3] > 100]
    if not c:
        return None
    return tuple(sorted(p[i] for p in c)[len(c) // 2] for i in range(3))


def quadrato(cx, cy, r):
    return [(cx + dx, cy + dy) for dx in range(-r, r + 1) for dy in range(-r, r + 1)]


def maschera_strada(t):
    """Dove passa la strada, dentro una tessera. Torna la maschera e la
    **distanza fra i due colori**, che è la misura di quanto fidarsi.

    Due riferimenti e nient'altro: il *terreno* sono i quattro angoli —
    una strada entra dai lati e passa per il mezzo, negli angoli c'è
    terreno quasi sempre, e la mediana regge il caso della diagonale che
    di angoli suoi ne sporca due — e la *strada* è il centro, perché una
    tessera di strada, qualunque forma abbia, in mezzo ce l'ha. Poi ogni
    pixel va a chi somiglia di più.

    Prima si faceva a soglia — «lontano dal terreno più di tanto» — e
    andava bene solo dove il contrasto era grosso: sulle file di pietra e
    di lava la strada è fatta della stessa materia del fondo, la soglia
    prendeva mezza tessera a caso e ne usciva un catalogo di incroci.
    Confrontare due riferimenti invece di superare una soglia funziona
    anche a contrasto basso; quanto basso lo dice `sep`, e chi legge se
    ne serve per non credere a una lettura che non c'è."""
    w, h = t.size
    px = t.load()
    q = max(3, w // 6)
    ang = (quadrato(q, q, 3) + quadrato(w - 1 - q, q, 3)
           + quadrato(q, h - 1 - q, 3) + quadrato(w - 1 - q, h - 1 - q, 3))
    terra = mediana(px, ang)
    strada = mediana(px, quadrato(w // 2, h // 2, 4))
    if terra is None or strada is None:
        return None, 0
    sep = sum((terra[i] - strada[i]) ** 2 for i in range(3)) ** 0.5

    def vicina(c):
        return (sum((c[i] - strada[i]) ** 2 for i in range(3))
                < sum((c[i] - terra[i]) ** 2 for i in range(3)))

    return [[px[x, y][3] > 100 and vicina(px[x, y]) for y in range(h)] for x in range(w)], sep


def pulisci(m, giri=2, raggio=2):
    """La maschera senza la grana: ogni pixel diventa quello che dice la
    maggioranza dei suoi vicini, un paio di volte.

    Serve dove strada e terreno sono la stessa materia — i ciottoli della
    pietra, la roccia della lava — e la divisione per colore esce a sale
    e pepe: la strada c'è, ma bucata, e un buco sul bordo diventa un lato
    chiuso. Una maggioranza su cinque per cinque non sposta un confine,
    toglie i granelli."""
    for _ in range(giri):
        w, h = len(m), len(m[0])
        nuova = [[False] * h for _ in range(w)]
        for x in range(w):
            a0, a1 = max(0, x - raggio), min(w, x + raggio + 1)
            for y in range(h):
                b0, b1 = max(0, y - raggio), min(h, y + raggio + 1)
                quanti = sum(1 for a in range(a0, a1) for b in range(b0, b1) if m[a][b])
                nuova[x][y] = quanti * 2 > (a1 - a0) * (b1 - b0)
        m = nuova
    return m


def tratto_piu_lungo(acceso):
    """Il tratto continuo più lungo: `(inizio, quanti)`. Serve a non
    contare due volte quello che non è un passaggio — un ciuffo qui, una
    pietra là — quando quello che si cerca è **una** strada che esce."""
    meglio, i0, lungo = (0, 0), None, 0
    for i, p in enumerate(acceso + [False]):
        if p and i0 is None:
            i0, lungo = i, 0
        if p:
            lungo += 1
        elif i0 is not None:
            if lungo > meglio[1]:
                meglio = (i0, lungo)
            i0 = None
    return meglio


def attacchi(m, dentro=2, minima=0.15):
    """Dove la strada attraversa ogni lato, letto sulla maschera: da
    nessuna parte, in mezzo, di lato a sinistra o a destra.

    Si legge un filo dentro il bordo — sul bordo esatto ci sono l'ombra e
    la sfumatura del ricampionamento, che mentono. E si guarda il tratto
    **continuo** più lungo, non quanti pixel sono accesi in tutto: una
    strada che esce da un lato è un passaggio solo, largo; la texture del
    terreno accende pixel sparsi ovunque, e a sommarli fanno una strada
    che non c'è.

    Poi si riduce a tre casi. La misura esatta in pixel non servirebbe:
    due tessere disegnate a mano non avranno mai lo stesso pixel sul
    bordo, avranno però la strada **nello stesso posto**, ed è quella che
    deve combaciare.

    `minima` è la larghezza sotto la quale non è un attacco ma un
    cespuglio: su questi fogli la strada più stretta è larga un quarto di
    tessera, e un cespuglio sul ciglio uno o due pixel."""
    w, h = len(m), len(m[0])
    fuori = {}
    for v in 'NSOE':
        if v in 'NS':
            y = dentro if v == 'N' else h - 1 - dentro
            acceso = [m[i][y] for i in range(w)]
        else:
            x = dentro if v == 'O' else w - 1 - dentro
            acceso = [m[x][j] for j in range(h)]
        i0, quanti = tratto_piu_lungo(acceso)
        if quanti < len(acceso) * minima:
            fuori[v] = NIENTE
        else:
            centro = (i0 + quanti / 2) / len(acceso)
            # Le due soglie non sono a occhio: la distribuzione dei centri
            # su questo foglio ha tre gobbe — attorno a 0,2, attorno a 0,5
            # e attorno a 0,85 — con i vuoti giusto lì in mezzo. È la
            # prova che l'attacco di lato in questi disegni c'è davvero, e
            # non è il tremolio di una mano.
            fuori[v] = 'sx' if centro < 0.37 else 'dx' if centro > 0.66 else 'c'
    return fuori


# ── i fogli ──────────────────────────────────────────────────────────
def taglia(im, box, tessera, orlo=0):
    """Una casella, portata alla misura della tessera. `orlo` mangia un
    filo per parte: sul bordo esatto ci sono la cornice arrotondata e
    l'ombra, che non sono terreno e mentirebbero al momento di dire di
    che colore è il prato."""
    x, y, w, h = box
    return im.crop((x + orlo, y + orlo, x + w - orlo,
                    y + h - orlo)).resize((tessera, tessera), Image.BOX)


def tessere_di(im, griglia, fg, ritagli, att, ambienti, tessera, cat):
    """Un foglio a griglia: ogni fila è un ambiente, ogni casella una
    tessera.

    ── quello che si è provato e non regge ───────────────────────────
    A occhio le otto file sembrano ripetere le stesse sedici forme, e
    sarebbe comodo: la forma si leggerebbe una volta sola nella fila col
    contrasto migliore — quella del bosco, dove la strada di terra sul
    prato si stacca — e varrebbe per la colonna intera, anche dove strada
    e fondo sono la stessa materia. È stato scritto, con un controllo che
    confrontava le letture sicure fra loro. **Il controllo ha detto di
    no**: le file non sono allineate, la colonna 0 è un incrocio in una
    fila e un raccordo a T in quella sopra. Quindi ogni tessera si legge
    per conto suo, e questa nota resta perché la scorciatoia è
    invitante — e falsa.

    Quello che si scarta è la tessera che non attraversa **almeno due
    lati**: un vicolo cieco in questi fogli non c'è, e quando ne esce uno
    è la lettura ad aver sbagliato, non il disegno."""
    file = fg['file']
    orlo = fg.get('orlo', 0)
    dentro = fg.get('dentro', 2)
    minima = fg.get('minima_strada', 0.15)
    persi = []
    for riga, col, box in celle_di(griglia):
        chi = file.get(str(riga))
        if not chi:
            continue
        t = taglia(im, box, tessera, orlo)
        if not t.getbbox():
            continue
        # La forma si legge **sempre alla stessa misura**, comunque si
        # ritagli l'immagine: gli attacchi sono una proprietà della
        # tessera, non del ritaglio. E si legge in piccolo apposta —
        # rimpicciolire media via la grana, che è la stessa cosa che
        # `pulisci` fa a mano. Leggere a 64 px invece che a 36 faceva
        # sparire mezza fila di lava, con la strada dichiarata bucata
        # dove sul foglio non è bucata affatto.
        m, sep = maschera_strada(taglia(im, box, MISURA, orlo))
        a = attacchi(pulisci(m, fg.get('pulizie', 2)), dentro, minima) if m else None
        if not a or sum(1 for v in a.values() if v != NIENTE) < 2:
            persi.append(f'{chi}-{riga}-{col}')
            continue
        nome = f'{chi}-{riga}-{col}'
        ritagli[nome] = t
        att[nome] = a
        ambienti.setdefault(chi, {'strade': [], 'prati': []})['strade'].append(nome)
        cat.aggiungi(nome, famiglia='tessera', materia=chi, attacchi=a, da=fg['foglio'])
    return persi


def prati_di(im, griglia, fg, ritagli, ambienti, tessera, cat):
    """I terreni pieni: quelli non si scollano da niente, sono il fondo.

    Qui la mappatura è **per colonna** e non per fila, perché su questi
    fogli i terreni stanno tutti in una riga sola, uno accanto all'altro:
    erba, erba fiorita, sabbia, neve, lava, ciottoli. Un ambiente può
    prenderne più d'uno, ed è così che il prato smette di essere una
    mattonella ripetuta."""
    g = fg['prati']
    fila = g['fila']
    quali = g['terreni']
    orlo = g.get('orlo', fg.get('orlo', 0))
    if fila >= len(griglia):
        print(f'  ! la fila dei prati ({fila}) non c\'è: il foglio ne ha {len(griglia)}')
        return
    for col, (x, w) in enumerate(griglia[fila][2]):
        chi = quali.get(str(col))
        if not chi:
            continue
        y, h = griglia[fila][0], griglia[fila][1]
        t = taglia(im, (x, y, w, h), tessera, orlo)
        # Un terreno pieno riempie la sua cella: se è quasi tutto
        # trasparente quella casella nel foglio è vuota, e dichiararla
        # vuol dire stendere un fondo che non c'è — a schermo si vede il
        # nero sotto, e sembra un buco nel mondo. Nella fila dei terreni
        # di questo foglio la casella 6 è vuota, e la neve era la 7.
        pieni = sum(1 for p in t.getdata() if p[3] > 100)
        if pieni < tessera * tessera * 0.9:
            print(f'  ! prato {chi} colonna {col}: pieno solo per '
                  f'{100 * pieni // (tessera * tessera)}%, lasciato fuori')
            continue
        nome = f'{chi}-prato-{col}'
        ritagli[nome] = t
        ambienti.setdefault(chi, {'strade': [], 'prati': []})['prati'].append(nome)
        cat.aggiungi(nome, famiglia='fondo', materia=chi, da=fg['foglio'])


def figure_di(im, fg, ritagli, figure, scala, cat):
    """Quello che non è terreno: torri, castello, bocche. Qui il nome
    conta eccome — il gioco chiede «l'arciere di secondo stadio» — e
    infatti si dichiara, uno per uno, invece di misurarlo."""
    for nome, box in fg['figure'].items():
        if nome.startswith('__'):
            continue
        x, y, w, h = box
        t = im.crop((x, y, x + w, y + h))
        if not t.getbbox():
            print(f'  ! {nome} è tutto trasparente: coordinate sbagliate?')
            continue
        if scala != 1:
            t = t.resize((max(1, round(w * scala)), max(1, round(h * scala))), Image.BOX)
        ritagli[nome] = t
        figure.append(nome)
        cat.aggiungi(nome, famiglia='figura', da=fg['foglio'])


def impacchetta(ritagli):
    x = y = riga = 0
    mappa, dove = {}, {}
    for nome, im in sorted(ritagli.items(), key=lambda kv: (-kv[1].height, kv[0])):
        if x + im.width > LARGO:
            x, y, riga = 0, y + riga, 0
        dove[nome] = (x, y, im)
        mappa[nome] = [x, y, im.width, im.height]
        x += im.width
        riga = max(riga, im.height)
    atlante = Image.new('RGBA', (LARGO, y + riga), (0, 0, 0, 0))
    for nome, (px, py, im) in dove.items():
        atlante.paste(im, (px, py))
    return atlante, mappa


def provini(ritagli, att, dove):
    """Ogni pezzo col suo nome e i suoi attacchi. Un attacco letto male
    non lancia niente: fa una strada che si spezza, e si scopre a schermo
    — cioè tardi. Guardarli tutti insieme costa dieci secondi."""
    from PIL import ImageDraw
    COL, PASSO = 10, 84
    nomi = sorted(ritagli)
    righe = (len(nomi) + COL - 1) // COL
    f = Image.new('RGBA', (COL * PASSO, righe * PASSO), (36, 36, 42, 255))
    d = ImageDraw.Draw(f)
    for i, nome in enumerate(nomi):
        im = ritagli[nome]
        z = min(2, max(1, 64 // max(im.width, im.height)))
        g = im.resize((im.width * z, im.height * z), Image.NEAREST)
        cx, cy = (i % COL) * PASSO, (i // COL) * PASSO
        f.alpha_composite(g, (cx + max(0, (PASSO - g.width) // 2), cy + 20))
        d.text((cx + 2, cy + 2), nome[:14], fill=(255, 240, 120))
        if nome in att:
            a = att[nome]
            d.text((cx + 2, cy + 11), ' '.join(f'{v}{a[v]}' for v in 'NSOE' if a[v] != '·'),
                   fill=(150, 220, 255))
    dove.parent.mkdir(parents=True, exist_ok=True)
    f.save(dove)
    print('  provini in', dove.relative_to(REPO))


def nominati_dal_gioco(percorso):
    """Quali materiali il gioco nomina davvero.

    Un atlante che si porta dietro roba che nessuno guarda non è una
    scorta, è peso: quello del castello vale mezzo megabyte dentro un
    file unico che un telefono scarica in tethering, e una famiglia di
    tessere su sette non compariva in nessuna tappa. La regola è
    **quello che non è referenziato non si genera**.

    Il riferimento è la tabella `AMBIENTE_DI` del gioco, che è il posto
    dove sta scritto quale materiale veste quale tappa — cioè l'unico
    posto che sa la risposta. Si legge da lì e non si ricopia qui,
    perché una copia diventa stantia e nessuno se ne accorge finché non
    manca una tessera a schermo.

    Se il file non c'è si genera tutto e lo si dice: un attrezzo che
    tronca in silenzio è peggio di uno che pesa."""
    f = REPO / percorso
    if not f.exists():
        print(f'  ! {percorso} non c\'è: genero tutti i materiali')
        return None
    testo = f.read_text()
    i = testo.find('AMBIENTE_DI')
    if i < 0:
        print(f'  ! in {percorso} non c\'è AMBIENTE_DI: genero tutti i materiali')
        return None
    blocco = testo[i:testo.find('}', i)]
    return set(re.findall(r":\s*'([a-z-]+)'", blocco))


def main():
    SORGENTI = cartella_mia()
    conf = json.loads((SORGENTI / 'atlante.json').read_text())
    tessera = conf.get('tessera', 36)
    voluti = nominati_dal_gioco(conf['referenze']) if conf.get('referenze') else None
    ritagli, att, ambienti, figure = {}, {}, {}, []
    cat = Catalogo()

    # `rglob` e non `glob`: i fogli stanno in una sottocartella
    # (`generati/`), accanto a una `non-usati/` che di foglietti non ne
    # ha. E `foglio` si risolve **accanto al suo foglietto**, come fa
    # `ritagli` in atlante.py: è l'unica lettura che regge uno
    # spostamento di cartella.
    for f in sorted(SORGENTI.rglob('*.json')):
        if f.name == 'atlante.json':
            continue
        fg = json.loads(f.read_text())
        sorgente = f.parent / fg['foglio']
        im = Image.open(sorgente).convert('RGBA')
        prima = len(ritagli)
        griglia = None
        if fg.get('file') or fg.get('prati'):
            griglia = griglia_da_alfa(im, fg.get('minima', 30))
            print(f'    griglia: {len(griglia)} file di '
                  f'{", ".join(str(len(r[2])) for r in griglia)} caselle')
        if fg.get('file'):
            persi = tessere_di(im, griglia, fg, ritagli, att, ambienti, tessera, cat)
            if persi:
                print(f'    {len(persi)} senza strada, lasciate fuori: {", ".join(persi)}')
        if fg.get('prati'):
            prati_di(im, griglia, fg, ritagli, ambienti, tessera, cat)
        if fg.get('figure'):
            figure_di(im, fg, ritagli, figure, fg.get('scala', 1), cat)
        print(f'  {fg["foglio"]}: {len(ritagli) - prima} pezzi')

    if not ritagli:
        print('nessun pezzo: i foglietti sono da scrivere')
        return 1

    if voluti is not None:
        fuori = sorted(set(ambienti) - voluti)
        for chi in fuori:
            roba = ambienti.pop(chi)
            for nome in roba['strade'] + roba['prati']:
                ritagli.pop(nome, None)
                att.pop(nome, None)
        if fuori:
            print(f'  {len(fuori)} materiali che il gioco non nomina, non generati: '
                  f'{", ".join(fuori)}')

    atlante, mappa = impacchetta(ritagli)
    dest = REPO / conf['modulo']
    kb, _ = scrivi(dest, attrezzo='terreni.py', atlante=atlante, pezzi=mappa,
                voci=cat.elenco(mappa), tessera=tessera,
                extra_doc=EXTRA_DOC, coda=CODA.format(
                    attacchi=breve(att), ambienti=breve(ambienti),
                    figure=breve(sorted(figure))))

    print(f'atlante {atlante.width}×{atlante.height}, {kb} KB di PNG, {len(mappa)} pezzi '
          f'({len(att)} tessere, {len(figure)} figure) → {dest.relative_to(REPO)}')
    for chi, roba in sorted(ambienti.items()):
        print(f'    {chi}: {len(roba["strade"])} strade, {len(roba["prati"])} prati')
    if '--provini' in sys.argv:
        provini(ritagli, att, REPO / 'poc/scatti/terreni-castello.png')
    return 0


if __name__ == '__main__':
    sys.exit(main())
