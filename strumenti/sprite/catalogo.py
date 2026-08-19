#!/usr/bin/env python3
"""Il catalogo: da un mucchio di ritagli, l'elenco delle **cose**.

Un atlante, da solo, è una mappa di rettangoli: `bambina_giu0`,
`bambina_giu1`, `fontana0`, `bosco-0-14`. Chi lo legge deve sapere che
`_giu0` vuol dire «primo fotogramma del verso giù» e che `fontana0` è un
fotogramma mentre `bancone` è una cosa sola — cioè deve conoscere la
convenzione di quel foglio. E le convenzioni sono tre, una per gioco,
perché ognuna è nata quando serviva.

Il risultato è che ogni consumatore rifà lo stesso lavoro e lo rifà a
modo suo: gli atlanti della fattoria e del sotterraneo esportano tutti e
due `ATTORI`, ricavato con la stessa espressione regolare `_giu0` — che
nel sotterraneo non trova mai niente, perché lì i fotogrammi si chiamano
`eroe-corsa-0`. Metà delle funzioni esportate sono inerti e nessuno se
n'era accorto: non lanciano, tornano un elenco vuoto.

**Qui il raggruppamento smette di essere una convenzione di nome e
diventa un dato.** Chi ritaglia lo sa già — sta ritagliando il terzo
fotogramma del verso giù della bambina, ce l'ha in mano — e invece di
cucirlo dentro una stringa perché qualcun altro la ricucia, lo dichiara.

Una **voce** è una cosa che uno userebbe: la bambina, la fontana, una
tessera di bosco. Dentro ha le sue pose, e ogni posa i suoi fotogrammi:

    {'id': 'bambina', 'famiglia': 'attore',
     'pose': {'giu': ['bambina_giu0', …], 'lato': […], 'su': […]}}
    {'id': 'fontana', 'famiglia': 'oggetto',
     'pose': {'fermo': ['fontana0', 'fontana1', 'fontana2']}}
    {'id': 'bosco-0-14', 'famiglia': 'tessera', 'materia': 'bosco',
     'pose': {'fermo': ['bosco-0-14']}}

Sempre la stessa forma, anche quando la posa è una e il fotogramma pure:
un banco di prova che deve mostrare «la fontana, e di fianco i suoi tre
pezzi» non vuole due strade a seconda che la cosa sia animata o no.
"""
import base64
import json
from pathlib import Path

# I tre versi in cui cammina un attore. Le pose di lato guardano a
# DESTRA: la sinistra è la stessa specchiata e nell'atlante non c'è.
VERSI = ('giu', 'lato', 'su')

# Le famiglie. Non è un'etichetta decorativa: dice **come si posa** un
# pezzo, e chi disegna si comporta di conseguenza.
#   attore   cammina, ha versi e fotogrammi, si appoggia col piede
#   oggetto  sta fermo in un posto, si appoggia col piede, può animarsi
#   tessera  riempie la sua casella e non sborda
#   fondo    una tessera che sta sotto tutto
#   figura   più grande di una casella, si appoggia e sborda in alto
FAMIGLIE = ('attore', 'oggetto', 'tessera', 'fondo', 'figura')

# ── quanti quarti di giro regge un pezzo ─────────────────────────────
# La domanda «perché non posso girare quest'oggetto di novanta gradi?»
# ha due risposte diverse a seconda di **come è disegnato**, e finché la
# differenza non sta scritta da nessuna parte la si riscopre ogni volta.
#
# Un pezzo guardato **a piombo dall'alto** — una strada, un pavimento,
# una pozza — non ha un sopra: girarlo di un quarto dà un pezzo giusto,
# ed è gratis. È quello che fa già il castello, dove una curva sola
# copre tutti e quattro i gomiti (`pose()` in `grafica/tessere.js`).
#
# E per una tessera girare non è nemmeno solo una faccenda di pixel:
# **permuta i suoi attacchi**, e la permutazione è scritta
# (`giraSocket`, sempre in `grafica/tessere.js` — un quarto di giro
# manda il lato ovest a nord e ribalta destra e sinistra su due lati
# su quattro, perché un bordo che era a sinistra, girato, si legge in
# alto). Quindi una tessera girata non è «la stessa immagine storta»:
# è una tessera a tutti gli effetti, che il risolutore può incastrare
# sapendo esattamente come si attacca alle vicine.
#
# Un pezzo disegnato **con una faccia** — un barile, uno steccato, una
# fontana, una casa — ha un davanti che si vede e un'ombra che cade in
# una direzione sola. Girarlo di novanta gradi non lo gira: lo fa
# cadere. La faccia finisce di lato, l'ombra punta in su, e la luce di
# quel pezzo smette di essere d'accordo con quella di tutti gli altri.
# Per quello i fogli disegnano lo steccato orizzontale e quello
# verticale come **due pezzi**, e non è uno spreco: sono due vedute.
#
# Lo specchio invece è quasi sempre lecito, perché non tocca né il sopra
# né la direzione della luce se la luce viene dall'alto — ed è il motivo
# per cui i fogli disegnano un verso solo e l'altro si fa a schermo.
#
# Girare **a schermo** (`ctx.rotate`) o **nell'atlante** (otto copie di
# ogni pezzo) danno lo stesso risultato: la prima costa niente in byte e
# quasi niente in tempo, la seconda moltiplica per otto un file che il
# telefono scarica. Quindi si gira a schermo, sempre; qui si dichiara
# soltanto **se si può**.
GIRI = {'tessera': 4, 'fondo': 4, 'attore': 1, 'oggetto': 1, 'figura': 1}

# ── e la domanda che `giri` da solo non sa fare ──────────────────────
# `giri` conta i quarti di giro leciti **a passo costante**: 1 vuol dire
# solo il dritto, 2 vuol dire dritto e mezzo giro, 4 vuol dire tutti e
# quattro. Sono tre casi su quattro, e il quarto manca.
#
# Il caso che manca è la siepe. Una siepe si può mettere per il lungo o
# per il ritto — di quarto è ancora una siepe, ed è l'unico modo di
# chiudere un cortile con un foglio che la disegna sdraiata e basta — ma
# **ribaltata no**: ha un filo d'ombra sotto, e a mezzo giro ce l'ha in
# cima. Sta a gambe per aria. Con `giri` da solo bisogna scegliere fra
# perdere il verso utile (1) e regalare quello sbagliato (4).
#
# Sono due libertà indipendenti, ed è per questo che vogliono due campi:
#   · **si corica?**  il pezzo può stare per il ritto invece che per il
#     lungo → è quello che conta `giri`
#   · **si ribalta?** il sopra può diventare il sotto → è `ribalta`
#
# Combinandoli vengono tutti e quattro i casi, e l'insieme dei giri
# leciti è questo:
#
#     giri 1              → {0°}
#     giri 2, ribalta     → {0°, 180°}
#     giri 2, no ribalta  → {0°}
#     giri 4, ribalta     → {0°, 90°, 180°, 270°}
#     giri 4, no ribalta  → {0°, 90°}      ← la siepe
#
# Il ripiego è `True`, e non per pigrizia: chi è disegnato davvero a
# piombo dall'alto — una pozza, un pavimento, del pietrisco — un sopra
# non ce l'ha, quindi ribaltarlo non vuol dire niente e non fa danni.
# Chi invece un'ombra ce l'ha lo dichiara, e lo dichiara guardandolo:
# è il tipo di difetto che nessun controllo automatico trova, perché il
# pezzo ribaltato è formalmente ineccepibile — solo, è capovolto.

# ── fotogrammi o varianti? ───────────────────────────────────────────
# Più pezzi sotto lo stesso nome vogliono dire due cose opposte, e i
# nomi non le distinguono. `fontana0..2` sono **fotogrammi**: la stessa
# fontana in tre momenti, e vanno fatti scorrere. `arbusto0..25` sono
# **varianti**: ventisei cespugli diversi, e farli scorrere fa
# lampeggiare un cespuglio che si trasforma in un altro venticinque
# volte al secondo.
#
# Su questi fogli le varianti sono la stragrande maggioranza — dei
# quarantadue gruppi della fattoria, le animazioni vere sono meno di
# dieci — quindi il ripiego è **variante**, e l'animazione si dichiara.
# È anche il verso giusto in cui sbagliare: un'animazione dichiarata per
# sbaglio si vede subito e dà fastidio, una che manca lascia una cosa
# ferma e nessuno se ne accorge finché non la si guarda apposta.
#
# Chi disegna sceglie di conseguenza: i fotogrammi si scorrono
# sull'orologio, le varianti si pescano dal posto (`variante()` in
# `grafica/tessere.js`) così un cespuglio resta lo stesso cespuglio.


class Catalogo:
    """Si riempie mentre si ritaglia, e alla fine sa dire cosa c'è.

    `aggiungi` si chiama una volta per pezzo, nel punto in cui il pezzo
    viene tagliato — che è l'unico posto dove si sa con certezza di chi
    è, in che posa e a che fotogramma."""

    def __init__(self):
        self.voci = {}

    def aggiungi(self, pezzo, *, famiglia, chi=None, posa='fermo', giri=None,
                 specchia=True, ribalta=True, anima=None, **extra):
        """`pezzo` è il nome dentro l'atlante, `chi` è la cosa a cui
        appartiene (di default è il pezzo stesso: una cosa sola, un
        fotogramma solo). I fotogrammi si accodano nell'ordine in cui
        arrivano, che è l'ordine in cui vanno mostrati.

        `giri` di solito lo detta la famiglia, e si scrive a mano solo
        quando quel pezzo lì fa eccezione — un tombino disegnato a
        piombo in mezzo a un foglio di oggetti con la faccia."""
        if famiglia not in FAMIGLIE:
            raise ValueError(f'famiglia sconosciuta: {famiglia}')
        chi = chi or pezzo
        v = self.voci.setdefault(chi, {
            'id': chi, 'famiglia': famiglia, 'pose': {},
            'giri': GIRI[famiglia] if giri is None else giri,
            'specchia': specchia,
            'ribalta': ribalta,
            # un attore cammina, e quello è sempre un'animazione; per tutto
            # il resto vedi la nota qui sotto
            'anima': famiglia == 'attore' if anima is None else anima,
        })
        v['pose'].setdefault(posa, []).append(pezzo)
        v.update({k: q for k, q in extra.items() if q is not None})
        return v

    def scarta(self, pezzo):
        """Toglie un pezzo, e la voce con lui se resta vuota. Serve a chi
        genera per sottoinsiemi — quello che il gioco non nomina non si
        genera (vedi `terreni.py`) — e va fatto qui invece che a mano,
        se no resta una voce che punta a un ritaglio che non c'è più."""
        for chi, v in list(self.voci.items()):
            for posa, pezzi in list(v['pose'].items()):
                if pezzo in pezzi:
                    v['pose'][posa] = [p for p in pezzi if p != pezzo]
                    if not v['pose'][posa]:
                        del v['pose'][posa]
            if not v['pose']:
                del self.voci[chi]

    def elenco(self, pezzi_veri=None):
        """L'elenco ordinato, pronto da scrivere. `pezzi_veri` è la mappa
        dei ritagli sopravvissuti: una voce che punta a un pezzo che non
        c'è è un buco a schermo, e va tolta qui dove si vede."""
        fuori = []
        for chi in sorted(self.voci):
            v = dict(self.voci[chi])
            if pezzi_veri is not None:
                v['pose'] = {p: [n for n in f if n in pezzi_veri]
                             for p, f in v['pose'].items()}
                v['pose'] = {p: f for p, f in v['pose'].items() if f}
                if not v['pose']:
                    continue
            fuori.append(v)
        return fuori


# ── il modulo generato ───────────────────────────────────────────────
# La testa è uguale per tutti gli atlanti, e sta scritta una volta sola.
# Prima ce n'era una copia per attrezzo, ed è così che il sotterraneo si
# è ritrovato addosso le funzioni della fattoria.
TESTA = """/* GENERATO da strumenti/sprite/{attrezzo} — non si scrive a mano.

   Ritagliato dai fogli in `strumenti/sprite/sorgenti/`, ognuno col suo
   foglietto `.json`. Il PNG intero pesa {kb} KB: sta qui in base64
   perché il build deve restare un file solo.

   ── quello che ogni atlante ha, uguale ──
   TESSERA  quanto vale una casella in pixel dello sprite. È una misura
            del **foglio**, non del gioco.
   PEZZI    nome → [x, y, largo, alto] dentro l'atlante. È la mappa dei
            rettangoli, e serve a disegnare.
   VOCI     l'elenco delle **cose**: la bambina, la fontana, una tessera
            di bosco. Ognuna con la sua famiglia e le sue pose, e ogni
            posa coi suoi fotogrammi in ordine. Chi legge non deve
            sapere niente di come si chiamano i pezzi — il
            raggruppamento è un dato, non una convenzione da riparsare —
            ed è quello che permette a `strumenti/banco/mondo.html` di
            mostrare qualunque atlante senza sapere di che gioco è.

            Ogni voce dice anche **come la si può rigirare**, con tre
            campi che sono tre domande diverse:
              `giri`     quanti quarti di giro reggono — 4 se è
                         disegnata a piombo dall'alto, 1 se ha una
                         faccia e girarla la farebbe cadere
              `ribalta`  se il sopra può diventare il sotto. Una siepe
                         ha `giri: 4` e `ribalta: false`: per il ritto è
                         ancora una siepe, a gambe per aria no — e con
                         `giri` da solo quel caso non si sa dire
              `specchia` se si può rovesciare destra-sinistra
            Girare si gira a schermo, non nell'atlante: otto copie di
            ogni pezzo costerebbero otto volte il peso e non
            aggiungerebbero niente.
{extra}*/
export const ATLANTE = 'data:image/png;base64,{b64}'

export const TESSERA = {tessera}

export const PEZZI = {pezzi}

export const VOCI = {voci}

/* Le tre domande che si fanno a un catalogo. Stanno qui e non in chi
   legge perché sono una funzione dei dati, non una scelta di nessuno.

   ⚠ `pezziDi` torna **i nomi** dei pezzi, non le loro coordinate: chi
   deve disegnare passa da `PEZZI[nome]`, o da `creaFoglio` di
   `grafica/atlante.js` che i nomi li prende già così. Il nome è
   esplicito apposta — c'era una funzione che tornava le coordinate e
   una che tornava i nomi, si chiamavano quasi uguale, e scambiarle non
   lancia niente: `drawImage` con un argomento non finito, per
   specifica, **torna senza disegnare e senza errori**. Un attore
   invisibile e la console pulita. */
export const voce = id => VOCI.find(v => v.id === id) || null
export const vociDi = famiglia => VOCI.filter(v => v.famiglia === famiglia)
export const pezziDi = (id, posa = 'fermo') => ((voce(id) || {{}}).pose || {{}})[posa] || []
"""


def breve(o):
    return json.dumps(o, separators=(',', ':'), sort_keys=True, ensure_ascii=False)


def scrivi(dest, *, attrezzo, atlante, pezzi, voci, tessera, extra_doc='', coda=''):
    """Scrive il modulo: la parte uguale per tutti, più quello che quel
    tipo di atlante ha di suo (`coda`). Torna `(kb, b64)` — i KB perché
    sono il numero che si guarda quando si decide se un foglio vale la
    pena, il base64 perché c'è chi lo rimette anche dentro un prototipo,
    che essendo un file solo non può importare un modulo."""
    tmp = dest.parent / '.atlante-tmp.png'
    dest.parent.mkdir(parents=True, exist_ok=True)
    atlante.save(tmp, optimize=True)
    b64 = base64.b64encode(tmp.read_bytes()).decode()
    tmp.unlink()
    kb = len(b64) * 3 // 4 // 1024
    dest.write_text(TESTA.format(attrezzo=attrezzo, kb=kb, b64=b64, tessera=tessera,
                                 pezzi=breve(pezzi), voci=breve(voci),
                                 extra=extra_doc) + coda)
    return kb, b64
