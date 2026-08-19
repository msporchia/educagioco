#!/usr/bin/env python3
"""Come si toglie un fondo, e come si misura un foglio che non si conosce.

Non ritaglia piu' niente: da quando ogni sorgente ha il suo foglietto
`.json` (vedi FORMATO.md) i ritagli li fa `atlante.py`, che legge quello.
Qui restano le due cose che un foglietto non puo' dichiarare perche' non
si sanno guardando:

  · **togliere il fondo** — `fondi_di`, `allaga`, `sfrangia`. Il fondo si
    toglie allagando dai bordi, mai per colore: un cane bianco ha addosso
    lo stesso bianco della carta, e cancellando «tutto il bianco» gli si
    aprono buchi in mezzo alla schiena. E i colori del fondo si
    raggruppano prima di contarli, se no un JPEG che sgrana una scacchiera
    in centinaia di grigi non ne fa riconoscere nemmeno uno.
  · **misurare un foglio nuovo** — `scala`, `gruppi`, per capire dove
    cadono le bande e i fotogrammi quando si scrive il suo foglietto la
    prima volta.

    python3 strumenti/sprite/attori.py sorgenti/cane-bobtail2.png
"""
import sys
from collections import Counter
from pathlib import Path

from PIL import Image

QUI = Path(__file__).parent
REPO = Path(__file__).resolve().parents[2]
ATTORI = QUI / 'attori'
CELLA_W, CELLA_H = 16, 32
FOTOGRAMMI = 4
FOGLIO_W, FOGLIO_H = 272, 256          # la misura di character.png
COLORI = 12


def fondi_di(im, tolleranza=26):
    """I colori del fondo, che sono **più di uno**: certi generatori
    consegnano la scacchiera da «trasparente» disegnata coi pixel veri —
    è un JPEG, di trasparente non ha niente. Si prendono guardando una
    striscia di bordo e tenendo quelli che ne occupano una fetta seria."""
    w, h = im.size
    px = im.convert('RGB').load()
    bordo = Counter()
    for x in range(w):
        for y in (0, 1, h - 2, h - 1):
            bordo[px[x, y]] += 1
    for y in range(h):
        for x in (0, 1, w - 2, w - 1):
            bordo[px[x, y]] += 1
    # I colori si **raggruppano** prima di contarli. Un JPEG sgrana un grigio
    # piatto in centinaia di grigi appena diversi, e contandoli uno per uno
    # nessuno pesa abbastanza per sembrare un fondo: la scacchiera restava
    # addosso all'animale. Presi a mucchi, invece, saltano fuori i due
    # colori veri.
    quanti = sum(bordo.values()) or 1
    mucchi = []
    for c, n in bordo.most_common():
        for m in mucchi:
            if max(abs(c[i] - m['c'][i]) for i in range(3)) <= tolleranza:
                m['n'] += n
                break
        else:
            mucchi.append({'c': c, 'n': n})
    fondi = [m['c'] for m in mucchi if m['n'] / quanti > 0.06]
    return fondi or [mucchi[0]['c']]


def e_fondo(c, fondi, tolleranza=26):
    return any(max(abs(c[i] - f[i]) for i in range(3)) <= tolleranza for f in fondi)


def scala(im):
    """Quanto è ingrandito il foglio. Si misura dal passo fra le bande.

    Le bande si trovano cercando le righe che hanno **qualcosa che non è
    fondo**, non le righe scure: contro una scacchiera grigia il grigio è
    più scuro di mezzo cane bianco, e cercando il buio si trovava una
    banda sola lunga tutto il foglio."""
    w, h = im.size
    px = im.convert('RGB').load()
    fondi = fondi_di(im)
    scuri = [y for y in range(h)
             if sum(1 for x in range(w) if not e_fondo(px[x, y], fondi)) > 3]
    if not scuri:
        return None
    bande, inizio, prec = [], scuri[0], scuri[0]
    for y in scuri[1:]:
        if y != prec + 1:
            bande.append(inizio)
            inizio = y
        prec = y
    bande.append(inizio)
    if len(bande) < 2:
        return None
    passi = [bande[i + 1] - bande[i] for i in range(len(bande) - 1)]
    passi.sort()
    return passi[len(passi) // 2] / CELLA_H   # la mediana, non la media


# ── quale banda è quale ──────────────────────────────────────────────
# Un umano ha tre versi in tre bande di fila. Un quadrupede no: nel suo
# foglio la metà di sopra è l'animale **in piedi**, visto di fronte e di
# spalle, e la metà di sotto è quello **di profilo, su quattro zampe**.
# Prendere la seconda banda come «di lato», che è la regola dell'umano,
# dava un cane che camminava su due zampe appena ti spostavi di lato: non
# era lo specchio sbagliato, era proprio la posa sbagliata.
#
# Si normalizza **all'importazione**: quello che finisce in `attori/` è
# sempre nella forma canonica — giù a y=0, di lato a y=32, su a y=64 — e
# il generatore dell'atlante non ha bisogno di sapere chi cammina su due
# zampe e chi su quattro.
MAPPE = {
    'umano':      {'giu': 0, 'lato': 1, 'su': 2},
    'quadrupede': {'giu': 0, 'lato': 4, 'su': 2},
}
CANONICA = {'giu': 0, 'lato': 1, 'su': 2}

# Di lato un quadrupede e' **lungo**: un cane visto di profilo occupa 24-28
# px, non 16. Tagliato ogni 16 si spezzava in due, e in gioco camminava a
# meta'. Quindi la cella di «lato» e' larga il doppio — per tutti, anche per
# gli umani che ci ballano dentro: una regola sola vale piu' di due px
# risparmiati, e chi disegna gia' legge la larghezza dal pezzo.
LARGHEZZE = {'giu': CELLA_W, 'lato': CELLA_W * 2, 'su': CELLA_W}


def gruppi(px, y0, larg, alt):
    """Le colonne dove c'e' qualcosa, raccolte a gruppi: sono i fotogrammi.
    Si misurano invece di darli per scontati perche' il passo cambia da una
    banda all'altra, ed e' proprio quello che spezzava il cane."""
    piene = [x for x in range(larg) if any(px[x, y][3] for y in range(y0, y0 + alt))]
    if not piene:
        return []
    fuori, inizio, prec = [], piene[0], piene[0]
    for x in piene[1:]:
        if x > prec + 2:                    # due colonne vuote separano davvero
            fuori.append((inizio, prec))
            inizio = x
        prec = x
    fuori.append((inizio, prec))
    return fuori


def riordina(im, mappa):
    """Rimette le bande nella forma canonica **ricomponendo i fotogrammi uno
    per uno**: ognuno si ritaglia dov'e' davvero e si incolla centrato nella
    sua cella. Copiare la banda di peso non basta — i fogli generati non
    hanno il passo che ci aspettiamo."""
    px = im.load()
    largo = max(LARGHEZZE.values()) * FOTOGRAMMI
    fuori = Image.new('RGBA', (largo, CELLA_H * len(CANONICA)), (0, 0, 0, 0))
    for verso, riga in CANONICA.items():
        y0 = mappa[verso] * CELLA_H
        if y0 + CELLA_H > im.height:
            continue
        cella = LARGHEZZE[verso]
        # Di fronte e di spalle i fotogrammi **si toccano**: fra un cane e
        # l'altro non c'e' una colonna vuota, e cercare i gruppi ne fonde due
        # in uno. Li' il passo fisso e' l'unica cosa che regge. Di lato invece
        # sono staccati e larghi a caso, e li' misurare e' l'unica cosa che
        # regge. Due bande diverse, due regole diverse.
        if cella == CELLA_W:
            tagli = [(i * CELLA_W, i * CELLA_W + CELLA_W - 1) for i in range(FOTOGRAMMI)]
        else:
            tagli = gruppi(px, y0, im.width, CELLA_H)[:FOTOGRAMMI]
        for i, (a, b) in enumerate(tagli):
            pezzo = im.crop((a, y0, min(im.width, b + 1), y0 + CELLA_H))
            if pezzo.width > cella:          # non ci sta: si tiene il centro
                t = (pezzo.width - cella) // 2
                pezzo = pezzo.crop((t, 0, t + cella, CELLA_H))
            fuori.paste(pezzo, (i * cella + (cella - pezzo.width) // 2, riga * CELLA_H))
    return fuori


def allaga(px, fondi, tolleranza=26, largo=None, alto=None):
    """Toglie il fondo partendo dai bordi. Non per colore: un cane bianco ha
    addosso lo stesso bianco della carta, e cancellando «tutto il bianco»
    gli si aprono buchi in mezzo alla schiena. Via va solo quello che si
    raggiunge camminando dal bordo, cioè quello che sta fuori dalla sagoma."""
    largo = largo or FOGLIO_W
    alto = alto or FOGLIO_H
    visti = bytearray(largo * alto)
    coda = [(x, y) for x in range(largo) for y in (0, alto - 1)]
    coda += [(x, y) for y in range(alto) for x in (0, largo - 1)]
    via = 0
    while coda:
        x, y = coda.pop()
        if x < 0 or y < 0 or x >= largo or y >= alto:
            continue
        i = y * largo + x
        if visti[i]:
            continue
        visti[i] = 1
        c = px[x, y]
        if c[3] and not e_fondo(c, fondi, tolleranza):
            continue
        if c[3]:
            px[x, y] = (0, 0, 0, 0)
            via += 1
        coda += [(x + 1, y), (x - 1, y), (x, y + 1), (x, y - 1)]
    return via


def allaga_ombra(px, fondi, largo=None, alto=None, tinta=0.055, sat=0.34):
    """Toglie **l'ombra che il fondo si porta dietro**, e solo quella.

    ── il difetto, per esteso ──
    Un generatore a cui si chiede «gli oggetti su un fondo piatto» quasi
    sempre disegna anche **una macchia d'ombra sotto ogni oggetto**: non è
    il colore del fondo, è il colore del fondo scurito, quindi
    `allaga` — che confronta i canali uno per uno — ci si ferma davanti e
    lascia un anello. Su un fondo grigio non si nota; su un fondo acceso
    diventa un filo rosa sotto ogni sagoma, e a un nono della misura
    quel filo è **un pixel intero** dello sprite finito.

    Alzare la tolleranza di `allaga` non lo risolve: l'ombra più scura e
    il fondo del disegno più chiaro distano uguale dal colore del fondo —
    misurato così, un'ombra magenta e un fianco di lana in penombra sono
    la stessa cosa. Quello che li separa non è **quanto** è lontano il
    colore, è **di che tinta** è: l'ombra resta magenta, la lana resta
    bruna. Quindi qui si guarda la tinta, e la saturazione per non
    toccare i grigi e i bianchi, che di tinta non ne hanno una.

    Resta un allagamento **dai bordi**, come l'altro e per lo stesso
    motivo: così dentro una sagoma non si entra mai, nemmeno se qualcosa
    lì dentro fosse della tinta giusta.

    Si chiede nel foglietto (`"ombra": true`) e di suo è spenta, perché
    vale a una condizione che è il foglio a garantire: **quella tinta non
    deve comparire in nessun oggetto**. È il motivo per cui a chi genera
    un foglio si chiede un fondo magenta e non un fondo verde."""
    largo = largo or FOGLIO_W
    alto = alto or FOGLIO_H
    tinte = [tinta_di(f) for f in fondi]
    visti = bytearray(largo * alto)
    coda = [(x, y) for x in range(largo) for y in (0, alto - 1)]
    coda += [(x, y) for y in range(alto) for x in (0, largo - 1)]
    via = 0
    while coda:
        x, y = coda.pop()
        if x < 0 or y < 0 or x >= largo or y >= alto:
            continue
        i = y * largo + x
        if visti[i]:
            continue
        visti[i] = 1
        c = px[x, y]
        if c[3]:
            t, s = tinta_di(c)
            if s < sat or all(abs((t - f[0] + .5) % 1 - .5) > tinta for f in tinte):
                continue
            px[x, y] = (0, 0, 0, 0)
            via += 1
        coda += [(x + 1, y), (x - 1, y), (x, y + 1), (x, y - 1)]
    return via


def tinta_di(c):
    """Tinta (0..1, in giri) e saturazione di un colore. Scritta a mano e
    non con `colorsys`: si chiama una volta per pixel su fogli da un
    milione di pixel, e la conversione di libreria costa il triplo."""
    r, g, b = c[0], c[1], c[2]
    mx, mn = max(r, g, b), min(r, g, b)
    if mx == mn:
        return 0.0, 0.0
    d = mx - mn
    if mx == r:
        t = ((g - b) / d) % 6
    elif mx == g:
        t = (b - r) / d + 2
    else:
        t = (r - g) / d + 4
    return t / 6, d / mx


def sfrangia(px, fondi, largo=None, alto=None, giri=2):
    """Toglie la frangia. Il JPEG lascia intorno a ogni sagoma un contorno
    di pixel color-fondo che l'allagamento non raggiunge — in mappa sono
    quelle righine bianche che compaiono e spariscono mentre l'animale
    cammina, ed e' la cosa che si nota di piu'. Si tolgono solo i pixel
    color-fondo **che toccano il trasparente**: dentro la sagoma non si
    entra mai."""
    largo = largo or FOGLIO_W
    alto = alto or FOGLIO_H
    via = 0
    for _ in range(giri):
        orlo = []
        for y in range(alto):
            for x in range(largo):
                if not px[x, y][3] or not e_fondo(px[x, y], fondi, 46):
                    continue
                for dx, dy in ((1, 0), (-1, 0), (0, 1), (0, -1)):
                    a, b = x + dx, y + dy
                    if a < 0 or b < 0 or a >= largo or b >= alto or not px[a, b][3]:
                        orlo.append((x, y))
                        break
        for x, y in orlo:
            px[x, y] = (0, 0, 0, 0)
            via += 1
        if not orlo:
            break
    return via


def normalizza(sorgente, nome, guarda=False, mappa=CANONICA):
    im = Image.open(sorgente).convert('RGB')
    w, h = im.size

    if (w, h) != (FOGLIO_W, FOGLIO_H):
        # Prima si guarda la **forma**, non il contenuto: se le proporzioni
        # sono già quelle di un foglio (272:256), l'ingrandimento è quello e
        # non c'è niente da indovinare. Misurare il passo fra le bande è la
        # strada lunga, e contro una scacchiera dipinta sbaglia — i quadretti
        # del fondo, sgranati dal JPEG, sembrano contenuto.
        forma = (w / h) / (FOGLIO_W / FOGLIO_H)
        if abs(forma - 1) > 0.01:
            z = scala(im)
            if z is None:
                print(f'  ! in {sorgente.name} non trovo le bande: è un foglio di attore?')
                return None
            atteso_w, atteso_h = round(w / z), round(h / z)
            if abs(atteso_w - FOGLIO_W) > 8 or abs(atteso_h - FOGLIO_H) > 24:
                print(f'  ! {sorgente.name} misurato viene {atteso_w}x{atteso_h}, '
                      f'non {FOGLIO_W}x{FOGLIO_H}: controllalo a mano')
                return None
        # BOX fa la media di ogni blocco: è il contrario dell'ingrandimento
        # che ha subito, ed è l'unico filtro che non inventa pixel nuovi
        im = im.resize((FOGLIO_W, FOGLIO_H), Image.BOX)
        print(f'  {w}×{h} → {FOGLIO_W}×{FOGLIO_H} (scala {w / FOGLIO_W:.3f})')

    fuori = Image.new('RGBA', (FOGLIO_W, FOGLIO_H), (0, 0, 0, 0))
    fuori.paste(im.convert('RGBA'), (0, 0))
    px = fuori.load()

    # Il fondo si toglie **partendo dai bordi e allagando**, non per colore:
    # un cane bianco ha addosso lo stesso bianco della carta, e cancellando
    # «tutto il bianco» gli si aprono buchi in mezzo alla schiena. Quello che
    # va via è solo il bianco che sta fuori dalla sagoma, cioè quello che si
    # raggiunge camminando dal bordo.
    fondi = fondi_di(im)
    fondo = fondi[0]

    def somiglia(c):
        return e_fondo(c, fondi)

    via = allaga(px, fondi)

    # solo adesso si riducono i colori, e solo su quello che è rimasto:
    # il ricampionamento di un JPEG ne lascia migliaia, la pixel art ne
    # vuole una decina, e senza questo passaggio i bordi restano sporchi
    opachi = Image.new('RGB', fuori.size, fondo)
    opachi.paste(fuori.convert('RGB'), (0, 0), fuori)
    tavolozza = opachi.quantize(colors=COLORI, method=Image.MAXCOVERAGE).convert('RGB')
    tpx = tavolozza.load()
    for y in range(FOGLIO_H):
        for x in range(FOGLIO_W):
            if px[x, y][3]:
                px[x, y] = tpx[x, y] + (255,)

    # Seconda passata, con la mano un po' più larga. La prima lascia dei
    # filamenti: il JPEG sporca il fondo lungo i bordi degli sprite quel
    # tanto che basta a farlo passare per disegno, e in mappa si vedono come
    # righine bianche in mezzo agli animali. Ripartendo dai bordi non c'è
    # rischio di bucare l'animale — si può togliere solo quello che è
    # attaccato al fuori, e il fuori è già tutto trasparente.
    via += allaga(px, fondi, 40)
    via += sfrangia(px, fondi)

    fuori = riordina(fuori, mappa)

    ATTORI.mkdir(exist_ok=True)
    dove = ATTORI / f'{nome}.png'
    fuori.save(dove)
    resta = sum(1 for p in fuori.getdata() if p[3])
    print(f'  {dove.relative_to(REPO)} — fondo {fondo[:3]} tolto '
          f'({via} pixel), restano {resta} pixel su {FOGLIO_W * FOGLIO_H}')

    if guarda:
        prova = REPO / 'poc/scatti' / f'attore-{nome}.png'
        prova.parent.mkdir(exist_ok=True)
        fondo_prova = Image.new('RGBA', fuori.size, (255, 0, 255, 255))
        fondo_prova.alpha_composite(fuori)
        fondo_prova.resize((FOGLIO_W * 4, FOGLIO_H * 4), Image.NEAREST).save(prova)
        print(f'  da guardare: {prova.relative_to(REPO)} '
              f'(il fucsia è il trasparente)')
    return dove


def main():
    """Misura un foglio e propone il suo foglietto: si guarda, si corregge
    quello che serve, e si salva accanto all'immagine."""
    if len(sys.argv) < 2:
        print(__doc__)
        return 1
    f = Path(sys.argv[1]).expanduser()
    im = Image.open(f).convert('RGBA')
    print(f'{f.name}: {im.width}x{im.height} {im.mode}')
    trasparente = im.mode == 'RGBA' and any(p[3] < 255 for p in im.getdata())
    print(f'  fondo: {"trasparente" if trasparente else "da togliere (auto)"}')
    z = scala(im.convert('RGB'))
    if z:
        print(f'  passo fra le bande: {z * CELLA_H:.0f} px → scala ~{z:.3f}')
        print(f'  cioe\' un foglio da {im.width / z:.0f}x{im.height / z:.0f} px veri')
    print('  ora scrivi il foglietto: vedi FORMATO.md')
    return 0


if __name__ == '__main__':
    sys.exit(main())
