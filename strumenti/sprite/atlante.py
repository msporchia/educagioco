#!/usr/bin/env python3
"""Rifà gli atlanti dei giochi dai fogli in `sorgenti/`.

    python3 strumenti/sprite/atlante.py
    python3 strumenti/sprite/atlante.py sotterraneo   # solo quel bersaglio
    python3 strumenti/sprite/atlante.py --provini     # e un foglio da guardare

── UN GENERATORE, PIÙ BERSAGLI ──────────────────────────────────────
Gli atlanti sono più di uno — la fattoria, il sotterraneo — e ognuno
prende solo i fogli che gli servono: impacchettare tutto insieme
vorrebbe dire portarsi le tessere del dungeon dentro la fattoria, cioè
pagare in peso quello che non si disegna mai. **Per chi sia un foglio lo
dice la cartella in cui sta**: un `atlante.json` accanto alle sorgenti
dice nome, dove scrivere il modulo e quanto vale una tessera, e vale per
tutto quello che ha sotto. Un bersaglio nuovo è una cartella e dieci
righe di JSON — nessun elenco cablato qui dentro da tenere allineato.

Restano **un attrezzo solo e un comando solo**: due script che leggono
la stessa cartella finiscono, prima o poi, con un atlante e una tabella
che non combaciano più — e quel guasto si presenta come uno sprite
sbagliato a schermo, cioè tardi.

── OGNI SORGENTE PORTA LA SUA GEOMETRIA ─────────────────────────────
Accanto a `pappagallo.png` sta `pappagallo.json`, che dice com'è fatto
quel foglio: quanto è ingrandito, com'è il fondo, dove cadono i
fotogrammi, quali sprite ne escono. Un foglio senza foglietto non viene
letto — e va bene così: **niente più euristiche**.

È il punto della faccenda. Finora la geometria la indovinava questo
script, e ogni foglio generato da un modello diverso arrivava fatto a
modo suo: 272×256 a quattro fotogrammi, poi 1071×1008 col fondo a
scacchiera dipinta, poi 1536×1024 a sei fotogrammi su otto righe. Ogni
volta l'euristica si rompeva **in silenzio** — cani tagliati a metà,
scacchiera addosso, versi invertiti — e lo si scopriva a schermo. Con un
foglietto per sorgente non c'è niente da indovinare: se arriva un foglio
fatto in un modo mai visto, si scrivono dieci righe di JSON e lo script
non cambia.

Il formato del foglietto sta in `FORMATO.md`. Serve `pillow`.
"""
import base64
import json
import re
import sys
from pathlib import Path

from PIL import Image, ImageOps

from attori import allaga, fondi_di, sfrangia

QUI = Path(__file__).parent
REPO = Path(__file__).resolve().parents[2]
SORGENTI = QUI / 'sorgenti'
LARGO = 256                       # larghezza dell'atlante, in pixel

# I marcatori fra cui vive l'atlante dentro un prototipo. Un `poc/` è un
# file solo apribile col doppio click, quindi non può importare un
# modulo: l'atlante gli si innesta fra queste due righe, e tutto il resto
# del file resta quello scritto a mano.
APRE = '/* ═══ ATLANTE GENERATO — non si scrive a mano ═══ */'
CHIUDE = '/* ═══ fine dell\'atlante generato ═══ */'

MODULO = """/* GENERATO da strumenti/sprite/atlante.py — non si scrive a mano.

   Ritagliato dai fogli in `strumenti/sprite/sorgenti/`, ognuno col suo
   foglietto `.json` che ne descrive la geometria (vedi FORMATO.md).
   Il PNG intero pesa {kb} KB: sta qui in base64 perché il build deve
   restare un file solo.

   PEZZI: nome → [x, y, larghezza, altezza] dentro l'atlante.
   DA: nome → da quale foglio arriva, per ritrovarlo.
   PERSONE e BESTIE: chi è un attore controllabile e chi è un animale, vedi
   sotto. */
export const ATLANTE = 'data:image/png;base64,{b64}'

/* Quanto vale una cella di terreno, in pixel dello sprite. È una misura
   del **foglio**, non del gioco: la dichiara `atlante.json` accanto alle
   sorgenti e la si rilegge da qui, così cambiando set non resta un 16
   scritto a mano da qualche parte a dire il contrario. */
export const TESSERA = {tessera}

export const PEZZI = {mappa}

export const DA = {provenienza}

/* Un attore è chiunque cammini: tre versi — giù, di lato, su — per N
   fotogrammi. Le pose di lato guardano a DESTRA: la sinistra è la stessa
   specchiata, e non esiste nell'atlante. Chi è un attore si ricava dai
   pezzi, non da un elenco a mano. */
export const VERSI = ['giu', 'lato', 'su']
export const pezzoAttore = (chi, verso, fr) => PEZZI[`${{chi}}_${{verso}}${{fr}}`] || null

export const ATTORI = [...new Set(Object.keys(PEZZI)
  .map(n => /^(.+)_giu0$/.exec(n)).filter(Boolean).map(m => m[1]))].sort()

/* PERSONE e BESTIE: la stessa distinzione di ATTORI, ma per chi PILOTA e
   chi no — un bambino sceglie con che personaggio vedersi in mappa, non
   con che cane. Non si ricava dal nome (un cane si può chiamare in mille
   modi): viene dal `tipo` dichiarato nel foglietto della sorgente
   (FORMATO.md), e lo scrive `atlante.py` una volta per tutte qui sotto —
   niente elenco da tenere allineato a mano quando arriva un personaggio
   nuovo. */
export const PERSONE = {persone}

export const BESTIE = {bestie}

/* Quanti fotogrammi ha davvero un verso: i fogli non ne hanno tutti
   quattro, e contarli qui evita di disegnare un buco. */
export function fotogrammi(chi, verso = 'giu') {{
  let n = 0
  while (PEZZI[`${{chi}}_${{verso}}${{n}}`]) n++
  return n
}}
"""


# ── i filtri ─────────────────────────────────────────────────────────
# La bambina non è disegnata da zero: è il bimbo ridipinto. Tiene
# scheletro, tempi e tavolozza dell'originale — sono quelli a farla stare
# nello stile, non la mano di chi la ritocca. A 16 px di larghezza i
# capelli lunghi occupano le due sole colonne libere, ed è per questo che
# un'arma in mano non ci starebbe.
CAPO_S = (67, 46, 39, 255)
CAPO_C = (106, 72, 52, 255)
TUNICA = {(196, 60, 60, 255): (86, 148, 74, 255),
          (136, 46, 46, 255): (54, 102, 52, 255),
          (104, 28, 28, 255): (36, 72, 40, 255)}


def bambina(cella):
    im = cella.copy()
    px = im.load()
    alto = next((y for y in range(im.height) for x in range(im.width)
                 if px[x, y] in (CAPO_S, CAPO_C)), 0)

    def metti(x, y, c):
        if 0 <= x < im.width and 0 <= y < im.height:
            px[x, y] = c

    for y in range(im.height):
        for x in range(im.width):
            if px[x, y] in TUNICA:
                px[x, y] = TUNICA[px[x, y]]
    for i, y in enumerate(range(alto + 6, alto + 14)):
        metti(0, y, CAPO_S)
        metti(1, y, CAPO_C if i < 6 else CAPO_S)
        metti(im.width - 1, y, CAPO_S)
        metti(im.width - 2, y, CAPO_C if i < 6 else CAPO_S)
    metti(1, alto + 14, CAPO_S)
    metti(im.width - 2, alto + 14, CAPO_S)
    return im


def foglietti():
    """Ogni immagine che ha il suo `.json` accanto. Le altre si ignorano:
    un foglio senza foglietto è un foglio che non sappiamo leggere, e
    tirare a indovinare è esattamente quello che si vuole smettere."""
    fuori = []
    for f in sorted(SORGENTI.rglob('*')):
        if f.suffix.lower() not in ('.png', '.jpg', '.jpeg'):
            continue
        g = f.with_suffix('.json')
        if g.exists():
            fuori.append((f, json.loads(g.read_text())))
    return fuori


def bersagli():
    """Un atlante per cartella: `atlante.json` dice dove scrivere il
    modulo e quanto vale una tessera. Un foglio appartiene al bersaglio
    della cartella in cui sta, o della prima cartella sopra di lui che
    ne dichiari uno — così la fattoria, che tiene le sue sorgenti sparse
    in `sorgenti/` e in due sottocartelle, continua a bastarne uno solo.

    Due giochi non possono condividere un atlante: uno che carica
    duecento tessere di terreno per disegnare un cane si porta dietro
    un PNG che non gli serve, e il build deve restare un file solo."""
    fuori = {}
    for g in sorted(SORGENTI.rglob('atlante.json')):
        fuori[g.parent] = json.loads(g.read_text())
    if not fuori:
        raise SystemExit(f'nessun atlante.json sotto {SORGENTI}')
    return fuori


def di_chi(f, posti):
    """Il bersaglio di un foglio: la cartella dichiarata più vicina,
    risalendo."""
    p = f.parent
    while True:
        if p in posti:
            return p
        if p == SORGENTI:
            return None
        p = p.parent


def alla_misura_vera(im, fg):
    """Il foglio riportato alla sua misura in pixel veri. Non si indovina:
    il foglietto dice quante celle è largo, e il resto è una divisione."""
    cw, ch = fg['cella']
    # `foglio` dice quante celle e' largo il foglio; senza, si tiene la
    # misura che ha — un foglio gia' alla misura vera non ha niente da dire
    col, rig = fg.get('foglio') or (im.width // cw, im.height // ch)
    vera = (col * cw, rig * ch)
    if im.size != vera:
        # BOX fa la media di ogni blocco: è il contrario dell'ingrandimento
        # che il foglio ha subito, ed è l'unico filtro che non inventa pixel
        im = im.resize(vera, Image.BOX)
    return im


def pulisci(im, fg):
    """Toglie il fondo, se il foglietto dice che ce n'è uno da togliere."""
    fondo = fg.get('fondo', 'trasparente')
    if fondo == 'trasparente':
        return im
    px = im.load()
    fondi = fondi_di(im) if fondo == 'auto' else [tuple(fondo)]
    largo, alto = im.size
    allaga(px, fondi, 26, largo, alto)
    allaga(px, fondi, 40, largo, alto)
    sfrangia(px, fondi, largo, alto)

    # Meno colori. Il ricampionamento di un JPEG ne lascia migliaia e la
    # pixel art ne vuole una decina: senza, i bordi restano sporchi, e
    # l'atlante pesa il doppio per del rumore che nessuno vede.
    n = fg.get('colori', 12)
    if n:
        opachi = Image.new('RGB', im.size, fondi[0][:3])
        opachi.paste(im.convert('RGB'), (0, 0), im)
        tav = opachi.quantize(colors=n, method=Image.MAXCOVERAGE).convert('RGB').load()
        for y in range(alto):
            for x in range(largo):
                if px[x, y][3]:
                    px[x, y] = tav[x, y] + (255,)
    return im


def ritagli_px(im, fg, provenienza, ritagli):
    """I ritagli dichiarati **in pixel**, presi da un file accanto al
    foglio (`"ritagli": "pezzi.json"`, `{nome: [x, y, largo, alto]}`).

    Serve per i fogli che una griglia non ce l'hanno: 0x72 mette i muri
    a 16×16, le porte a 32×32, i personaggi a 16×28 e la moneta a 6×7 a
    coordinate che non sono multiple di niente. Dichiararli in celle
    vorrebbe dire una `cella` diversa per ogni riga, cioè scrivere le
    coordinate due volte. E quel file di solito **esiste già**, scritto
    dall'autore del set: si punta a quello invece di copiarlo, così di
    coordinate ne resta una copia sola."""
    tabella = json.loads((Path(fg['_file']).parent / fg['ritagli']).read_text())
    for nome, r in sorted(tabella.items()):
        if nome.startswith('__'):            # note per chi legge, non pezzi
            continue
        x, y, w, h = r
        if x < 0 or y < 0 or x + w > im.width or y + h > im.height:
            print(f'  ! {nome} cade fuori dal foglio ({x},{y} {w}×{h})')
            continue
        pezzo = im.crop((x, y, x + w, y + h))
        # un ritaglio tutto trasparente non è mai voluto: sono coordinate
        # sbagliate, e a schermo si presenta come un buco senza errori
        if not pezzo.getbbox():
            print(f'  ! {nome} è tutto trasparente: coordinate sbagliate?')
            continue
        ritagli[nome] = pezzo
        provenienza[nome] = provenienza.get(nome) or Path(fg['_file']).name


def ritagli_di(im, fg, provenienza, ritagli):
    if fg.get('ritagli'):
        return ritagli_px(im, fg, provenienza, ritagli)
    cw, ch = fg['cella']
    for nome, d in fg['sprite'].items():
        if nome.startswith('__'):            # note per chi legge, non sprite
            continue
        pw, ph = d.get('cella', [cw, ch])
        quanti = d.get('quanti', 1)
        # il passo di default è la larghezza dello sprite stesso: i
        # fotogrammi di un'animazione stanno attaccati uno dopo l'altro
        passo = d.get('passo', [max(1, pw // cw), 0])
        for i in range(quanti):
            x = (d['da'][0] + passo[0] * i) * cw
            y = (d['da'][1] + passo[1] * i) * ch
            if x + pw > im.width or y + ph > im.height:
                print(f'  ! {nome}{i if quanti > 1 else ""} cade fuori dal foglio')
                continue
            chi = f'{nome}{i}' if quanti > 1 else nome
            pezzo = im.crop((x, y, x + pw, y + ph))
            # `specchia`: alcuni fogli disegnano un quadrupede di lato che
            # guarda a sinistra, e la convenzione (FORMATO.md) vuole che
            # `_lato` guardi sempre a destra — la sinistra la fa `ctx.scale
            # (-1,1)` a schermo. Si dichiara nel foglietto invece di
            # rigirare il PNG sorgente, che resta la prova di quello che ha
            # dato il generatore.
            if d.get('specchia'):
                pezzo = ImageOps.mirror(pezzo)
            ritagli[chi] = pezzo
            provenienza[chi] = provenienza.get(chi) or Path(fg['_file']).name


def impacchetta(ritagli):
    x = y = riga = 0
    mappa, dove = {}, {}
    # per altezza decrescente, e a parità per nome: senza il secondo
    # criterio due giri dello stesso attrezzo impacchettano diverso, e un
    # file generato che cambia da solo non si distingue da uno che cambia
    # perché è cambiato qualcosa
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


def provini(ritagli, dove):
    """Ogni pezzo col suo nome: le coordinate si sbagliano, e guardarle
    tutte insieme è il modo più rapido di accorgersene."""
    from PIL import ImageDraw
    COL, PASSO = 8, 96
    righe = (len(ritagli) + COL - 1) // COL
    f = Image.new('RGBA', (COL * PASSO, righe * PASSO), (250, 250, 250, 255))
    d = ImageDraw.Draw(f)
    for i, nome in enumerate(sorted(ritagli)):
        im = ritagli[nome]
        z = min(4, max(1, 72 // max(im.width, im.height)))
        g = im.resize((im.width * z, im.height * z), Image.NEAREST)
        f.alpha_composite(g, (max(0, (i % COL) * PASSO + (PASSO - g.width) // 2),
                              max(12, (i // COL) * PASSO + 12)))
        d.text(((i % COL) * PASSO + 3, (i // COL) * PASSO + 2), nome, fill=(0, 0, 0))
    dove.parent.mkdir(exist_ok=True)
    f.save(dove)
    print('  provini in', dove.relative_to(REPO))


def innesta(dove, blocco):
    """Rimette il blocco generato fra i due marcatori di un prototipo. Se
    i marcatori non ci sono lo dice, invece di appiccicare roba in fondo
    al file: un atlante finito fuori dallo `<script>` non dà nessun
    errore — semplicemente non fa niente, ed è mezz'ora persa a capire
    perché è tutto nero."""
    testo = dove.read_text()
    if APRE not in testo or CHIUDE not in testo:
        raise SystemExit(f'in {dove.name} mancano i marcatori:\n  {APRE}\n  {CHIUDE}')
    dove.write_text(re.sub(re.escape(APRE) + '.*?' + re.escape(CHIUDE),
                           lambda _: blocco, testo, flags=re.S))


def costruisci(bers, fogli, con_provini):
    """Un atlante, dai fogli di quella cartella. `bers` è il suo
    `atlante.json`: nome, dove scrivere il modulo, quanto vale una
    tessera, e il prototipo da tenere allineato se ce n'è uno."""
    bersaglio = bers['nome']
    # Il `tipo` (persona/bestia) è dichiarato una volta per foglio, non per
    # sprite: un foglio intero è o l'uno o l'altro, e ridirlo sprite per
    # sprite sarebbe solo rumore da tenere allineato. Si tiene per NOME DEL
    # FILE, non per foglietto: le copie (la bambina) non hanno un file loro
    # e vanno cercate per provenienza, sotto.
    TIPI_VALIDI = ('persona', 'bestia')
    tipo_di_file = {}
    ritagli, provenienza = {}, {}
    print(f'{bersaglio}:')
    for f, fg in fogli:
        t = fg.get('tipo')
        if t is not None and t not in TIPI_VALIDI:
            print(f'  ! {f.name}: tipo "{t}" sconosciuto, atteso persona o bestia')
            t = None
        tipo_di_file[f.name] = t
        utili = [n for n in (fg.get('sprite') or {}) if not n.startswith('__')]
        if not utili and not fg.get('ritagli'):
            print(f'  {f.name}: foglietto senza sprite, da calibrare — saltato')
            continue
        im = pulisci(alla_misura_vera(Image.open(f).convert('RGBA'), fg), fg)
        prima = len(ritagli)
        ritagli_di(im, fg, provenienza, ritagli)
        print(f'  {f.name}: {len(ritagli) - prima} pezzi')

    # Le copie: uno sprite che è un altro sprite ridipinto. La bambina è
    # il bimbo con altri capelli e un'altra tunica — stesso scheletro,
    # stessi tempi. È un filtro, non una geometria, e per questo si
    # dichiara a parte invece di far finta che sia un'altra zona del foglio.
    FILTRI = {'bambina': bambina}
    for f, fg in fogli:
        for nuovo, d in (fg.get('copie') or {}).items():
            filtro = FILTRI.get(d.get('filtro'))
            for nome in [n for n in list(ritagli) if n.startswith(d['da'] + '_')]:
                chi = nuovo + nome[len(d['da']):]
                ritagli[chi] = filtro(ritagli[nome]) if filtro else ritagli[nome].copy()
                provenienza[chi] = provenienza[nome]

    # Chi è un attore si ricava dai nomi (`_giu0`), come farà poi il JS;
    # di che TIPO è, invece, non lo dice il nome — lo dice da quale file è
    # arrivato. La bambina non ha un file suo (è una copia di character.json,
    # vedi sopra), e infatti eredita `provenienza[nome_originale]`.
    attori = sorted({m.group(1) for n in ritagli
                      for m in [re.match(r'^(.+)_giu0$', n)] if m})
    persone, bestie, senza_tipo = [], [], []
    for chi in attori:
        tipo = tipo_di_file.get(provenienza.get(f'{chi}_giu0', ''))
        (persone if tipo == 'persona' else bestie if tipo == 'bestia' else senza_tipo).append(chi)
    if senza_tipo:
        print(f'  ! senza "tipo" nel foglietto sorgente, fuori da PERSONE e BESTIE: '
              f'{", ".join(senza_tipo)}')

    # Un bersaglio senza un pezzo non è un atlante vuoto, è un bersaglio
    # che questo attrezzo non sa leggere: si dice e si passa oltre invece
    # di scrivere un modulo con dentro niente. Capita quando i fogli di
    # una cartella li ritaglia un altro attrezzo (`"attrezzo"` nel suo
    # `atlante.json`, qui sotto) o quando un foglietto è ancora da
    # calibrare — e un modulo vuoto che sovrascrive quello buono è il
    # genere di guasto che si scopre a schermo.
    if not ritagli:
        print('  nessun pezzo: saltato')
        return

    atlante, mappa = impacchetta(ritagli)
    png = QUI / '.atlante.png'
    atlante.save(png, optimize=True)
    b64 = base64.b64encode(png.read_bytes()).decode()
    png.unlink()
    kb = len(b64) * 3 // 4 // 1024

    dest = REPO / bers['modulo']
    dest.parent.mkdir(parents=True, exist_ok=True)
    dest.write_text(MODULO.format(
        kb=kb, b64=b64, tessera=bers.get('tessera', 32),
        mappa=json.dumps(mappa, separators=(',', ':'), sort_keys=True),
        provenienza=json.dumps(provenienza, separators=(',', ':'), sort_keys=True),
        persone=json.dumps(persone, separators=(',', ':')),
        bestie=json.dumps(bestie, separators=(',', ':'))))

    print(f'  atlante {atlante.width}×{atlante.height}, {kb} KB di PNG, '
          f'{len(mappa)} pezzi → {dest.relative_to(REPO)}')

    # lo stesso atlante dentro il prototipo, se ne ha uno: il poc e il
    # gioco devono disegnare con gli stessi pixel, o quello che si prova
    # su uno non dice niente sull'altro
    poc = REPO / bers['poc'] if bers.get('poc') else None
    if poc and poc.exists():
        innesta(poc, f'{APRE}\n'
                     f"const ATLANTE = 'data:image/png;base64,{b64}'\n"
                     f'const PEZZI = {json.dumps(mappa, separators=(",", ":"), sort_keys=True)}\n'
                     f'{CHIUDE}')
        print(f'  e dentro {poc.relative_to(REPO)}')

    if con_provini:
        provini(ritagli, REPO / f'poc/scatti/atlante-{bersaglio}.png')


def main():
    fogli = foglietti()
    if not fogli:
        print(f'nessun foglio con foglietto in {SORGENTI}')
        return 1
    posti = bersagli()
    nomi = {b['nome']: p for p, b in posti.items()}

    voluti = [a for a in sys.argv[1:] if not a.startswith('--')]
    for a in voluti:
        if a not in nomi:
            raise SystemExit(f'bersaglio "{a}" sconosciuto: {", ".join(sorted(nomi))}')

    # ogni foglio alla cartella che lo rivendica, risalendo
    suoi = {p: [] for p in posti}
    for f, fg in fogli:
        fg['_file'] = str(f)
        p = di_chi(f, posti)
        if p is None:
            print(f'  ! {f.name}: nessun atlante.json sopra di lui, saltato')
            continue
        suoi[p].append((f, fg))

    for p, bers in sorted(posti.items()):
        if voluti and bers['nome'] not in voluti:
            continue
        # Una cartella può dichiarare che la ritaglia **un altro
        # attrezzo** (`"attrezzo": "terreni"`): il castello scolla la
        # strada dal terreno e misura gli attacchi di ogni tessera, due
        # cose che qui dentro sarebbero un ramo morto per tutti gli
        # altri. Dichiararlo è meglio che dedurlo dal fatto che non esce
        # niente: chi legge sa dove andare a guardare.
        if bers.get('attrezzo'):
            print(f'{bers["nome"]}: lo ritaglia {bers["attrezzo"]}.py, saltato')
            continue
        if not suoi[p]:
            print(f'{bers["nome"]}: nessun foglio, saltato')
            continue
        costruisci(bers, suoi[p], '--provini' in sys.argv)
    return 0


if __name__ == '__main__':
    sys.exit(main())
