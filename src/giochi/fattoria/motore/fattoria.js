/* ═══════════════════════════════════════════════════════════════════
   LE REGOLE DELLA FATTORIA, SENZA SCHERMO

   Classe pura: non tocca il DOM, non importa Vue, non sa che esista un
   profilo. Gira uguale nel browser e in Node, ed è l'unico motivo per
   cui una fattoria si può *giocare in un test* invece di provarla a
   occhio — comprare dieci pezzi di terra, sgombrare il bosco, contare
   le monete e vedere se l'economia sta in piedi.

   ── LE MONETE ENTRANO DA FUORI ────────────────────────────────────
   La fattoria conosce i **prezzi** (che sono dato) ma non il
   salvadanaio: riceve una `borsa` con due metodi, `quante()` e
   `paga(n)`. In gioco è il profilo, nei test è un finto portafoglio da
   quattro righe. Così le regole economiche stanno tutte qui — e non
   sparse fra un componente Vue e un pannello — restando provabili.

   ── COSA C'È DENTRO ───────────────────────────────────────────────
     piazzole   quali pezzi di terra sono tuoi           `"3,4" → 1`
     limiti     fin dove arriva il mondo    `{ x0, y0, x1, y1 }`
     cose       quello che hai messo giù     `{ i, id, g, x, y }`
     ostacoli   quello che il bosco aveva già     `"14,9" → 'albero'`
     magazzino  quello che hai comprato e non è in mappa   `id → n`
     granaio    il raccolto: grano, mais, mangime  `prodotto → n`
     bestie     le tue, coi bisogni e **dove stanno**  `{ chi, nome, x, y, … }`

   ── IL RACCOLTO NON È IL MAGAZZINO ────────────────────────────────
   Sono due cassetti diversi e restano diversi. Nel `magazzino` stanno le
   **cose** che hai comprato e messo via — una panchina, un barile — e da
   lì tornano in mappa identiche. Nel `granaio` sta la **roba** che si
   consuma: tre grani diventano due mangimi, e il mangime finisce in una
   ciotola. Metterli insieme vorrebbe dire una panchina con una
   scadenza e un grano che si può ripiazzare sul prato.

   Il granaio ha un tetto (`capienza`, in `dati/coltivazioni.js`) e ogni
   silo in mappa lo alza. Quello che non ci sta **non si raccoglie**: il
   campo resta pronto, e questo non è un intoppo ma il modo in cui il
   gioco chiede un silo senza scriverlo.

   ── IL MONDO NON È UNA COSTANTE ───────────────────────────────────
   Non c'è più un `PIAZZOLE = 7`: `limiti` dice fin dove arriva la
   mappa e cresce da sé (`allarga()`) per lasciare sempre due piazzole
   comprabili attorno alla terra posseduta. Le coordinate non si
   rinumerano mai — verso l'alto e verso sinistra diventano negative —
   perché il bosco si ricava dalle coordinate, e rinumerare vorrebbe
   dire spostare gli alberi che il bambino ha già visto.

   Le posizioni sono in **celle**, mai in pixel: lo zoom cambia mentre
   si gioca, e un mondo misurato in pixel andrebbe riscalato ogni volta.

   ── DOVE SI PUÒ METTERE IL PIEDE ──────────────────────────────────
   `calpestabile(cx, cy)` è **la sola risposta** alla domanda «qui ci si
   può stare?», e ci passano tutti: chi cammina (`motore/camminata.js`,
   che la riceve da fuori e non sa cosa sia una casa), chi fa comparire
   un animale (`cellaLibera`) e chi posa una cosa (`libera`, che è la
   stessa domanda con un piede più largo). Erano quattro conti in
   quattro posti, e quello dentro al disegno ne conosceva solo un
   quarto: per questo il cane attraversava le case.

   ── PERCHÉ NON SI PERDE MAI NIENTE ────────────────────────────────
   Non c'è nessun metodo che distrugge. Quello che rimetti via va in
   magazzino e da lì si ripiazza gratis quante volte vuoi; non ti
   rimborsa, ma non sparisce. È la regola su cui un bambino conta.
   ═══════════════════════════════════════════════════════════════════ */
import {
  CELLE, PRIMA, ULTIMA, COSTO_SPOSTARE, LIMITI_VECCHI, celleDi, dentroI,
  limitiPer, piazzolaDi, DENSITA_BOSCO, caso, chiave, prezzoPiazzola,
} from '../dati/mondo.js'
import { PER_ID, PARTENZA, piedeDi, eCampo, eSilo, siloDi, macchinaDi,
         statiDi, prezzoDellaVoce } from '../dati/catalogo.js'
import {
  PER_COLTURA, PER_RICETTA, PRODOTTI, SILI, capienza, costoIngrandimento,
  siloDelProdotto, quantoCresciuto, stadioDi, minutiCheMancano,
} from '../dati/coltivazioni.js'
import { livelloPer, avanzamento, livelloDellaVoce, sogliaDi } from '../dati/livelli.js'
import { OSTACOLI, TIPI } from '../dati/ostacoli.js'
import { BASE, prezzoDi, siPassa } from '../dati/terreni.js'
import { nuovo as bisogniNuovi, scendi, gradisce } from '../dati/bisogni.js'
import { ANIMALI, famigliaDi } from '../dati/animali.js'
import { primaLibera } from '../../../motore/passi.js'

/* Quanto è grosso l'ostacolo più grosso del bosco. Serve a trovare chi
   copre una cella guardando **poche caselle indietro** invece di
   scorrere tutto il bosco: `calpestabile` lo chiede una volta per
   cella, e cercare una strada lo chiede qualche migliaio di volte di
   fila. */
const PIEDE_MASSIMO = Object.values(OSTACOLI).reduce(
  (m, o) => [Math.max(m[0], o.piede[0]), Math.max(m[1], o.piede[1])], [1, 1])

/* Una borsa che non paga mai: serve a far girare la fattoria in un test
   che dell'economia non gliene importa niente. */
export const borsaInfinita = () => ({ quante: () => Infinity, paga: () => true })

export class Fattoria {
  /* `dato` è quello che torna da `serializza()`: un oggetto semplice,
     buono da mettere in un profilo. Senza, nasce una fattoria nuova. */
  constructor({ borsa = borsaInfinita(), dato = null } = {}) {
    this.borsa = borsa
    if (dato) this.deserializza(dato)
    else this.nuova()
  }

  /* ═══════════ nascere ═══════════ */
  nuova() {
    this.piazzole = {}
    this.cose = []
    this.ostacoli = {}
    this.magazzino = {}
    this.granaio = {}
    /* Quante volte è stato ingrandito ciascun silo. Tutte le famiglie
       ci sono da subito, a zero: un serializza/deserializza deve dare
       la stessa fattoria, e un oggetto che nasce vuoto e si rilegge
       pieno di zeri non è la stessa fattoria. */
    this.silos = Object.fromEntries(Object.keys(SILI).map(fam => [fam, 0]))
    /* Quanto si è speso qui dentro, in tutto e da sempre: è
       l'esperienza della fattoria (`dati/livelli.js`), e non scende
       mai. Non si azzera nemmeno mettendo via le cose — quello che hai
       imparato a fare non si disimpara. */
    this.speso = 0
    this.terreno = {}
    this.bestie = []
    this.prossimo = 1

    for (let px = PRIMA; px <= ULTIMA; px++)
      for (let py = PRIMA; py <= ULTIMA; py++) this.piazzole[chiave(px, py)] = 1

    this.limiti = limitiPer(Object.keys(this.piazzole))
    this.semina(this.limiti)

    const c0 = PRIMA * CELLE
    for (const p of PARTENZA)
      this.cose.push({ i: this.prossimo++, id: p.id, g: p.g || 0,
                       x: c0 + p.dx, y: c0 + p.dy })
    return this
  }

  /* ═══════════ il bosco ═══════════
     Non si tira a caso: si ricava dalle coordinate, così la stessa
     fattoria riaperta domani ha gli stessi alberi negli stessi posti —
     e un test può dire «lì c'è un masso» e restare vero.

     Si semina **solo dove non è già stato seminato** (`gia`, il mondo di
     prima): un albero sgomberato è un albero che non deve ricrescere, e
     rigenerare una zona vecchia lo farebbe tornare. Per lo stesso motivo
     l'ordine di scorrimento resta quello di sempre — cx fuori, cy dentro
     — perché la regola «niente pezzi grossi a metà» guarda chi è già
     stato messo giù nella stessa riga. */
  semina(zona, gia = null) {
    const { cx0, cy0, cx1, cy1 } = celleDi(zona)
    for (let cx = cx0; cx < cx1; cx++)
      for (let cy = cy0; cy < cy1; cy++) {
        if (gia && dentroI(gia, piazzolaDi(cx), piazzolaDi(cy))) continue
        if (this.cellaMia(cx, cy)) continue
        if (caso(cx, cy, 1) > DENSITA_BOSCO) continue
        const t = TIPI[((caso(cx, cy, 2) * 977) | 0) % TIPI.length]
        const [larg] = OSTACOLI[t].piede
        if (cx % larg) continue                   // niente pezzi grossi a metà
        let libero = true
        for (let i = 0; i < larg; i++) if (this.ostacoli[chiave(cx + i, cy)]) libero = false
        if (libero) this.ostacoli[chiave(cx, cy)] = t
      }
  }

  /* Il mondo tiene il passo con la terra comprata: due piazzole di
     margine su ogni lato, sempre. Si chiama dopo ogni acquisto e
     all'apertura di un salvataggio — è l'unico posto che fa crescere la
     mappa, e semina il bosco solo sulla striscia appena comparsa. */
  allarga() {
    const prima = this.limiti
    const dopo = limitiPer(Object.keys(this.piazzole), prima)
    if (dopo.x0 === prima.x0 && dopo.y0 === prima.y0 &&
        dopo.x1 === prima.x1 && dopo.y1 === prima.y1) return false
    this.limiti = dopo
    this.semina(dopo, prima)
    return true
  }

  serializza() {
    return { piazzole: this.piazzole, cose: this.cose, ostacoli: this.ostacoli,
             magazzino: this.magazzino, granaio: this.granaio, silos: this.silos,
             speso: this.speso,
             terreno: this.terreno,
             limiti: this.limiti, bestie: this.bestie, prossimo: this.prossimo }
  }

  /* Regge un salvataggio di ieri senza pretendere una migrazione: quello
     che manca si rimette a posto qui, e un id che non è più in catalogo
     si butta invece di far cadere tutto il disegno. */
  deserializza(d) {
    this.piazzole = (d && d.piazzole) || {}
    /* Un tipo di ostacolo che non esiste più si butta **qui**, non lo si
       lascia arrivare a chi disegna. È già successo due volte: prima col
       `palo` diventato una staccionata girata, poi con l'albero e la
       siepe tolti dal bosco perché erano anche in vendita. Un salvataggio
       di ieri non deve poter far cadere il gioco di oggi, e un `undefined`
       che arriva fino al disegno diventa una schermata di guasto. */
    this.ostacoli = Object.fromEntries(
      Object.entries((d && d.ostacoli) || {}).filter(([, tipo]) => OSTACOLI[tipo]))
    this.magazzino = (d && d.magazzino) || {}
    /* Le bestie si rileggono **tutte**, anche quelle che oggi non si
       sanno disegnare: chi non ha lo sprite viene ignorato da chi mette
       in scena, non buttato via qui. Un travaso a senso unico non deve
       cancellare niente per strada. */
    /* Erano nomi di sprite e basta, prima che si potessero battezzare:
       una stringa diventa una bestia senza nome, e il salvataggio di
       ieri si rilegge senza chiedere niente a nessuno. */
    this.bestie = ((d && d.bestie) || [])
      .map(b => typeof b === 'string' ? { chi: b, nome: '' } : b)
      .filter(b => b && typeof b.chi === 'string')
    /* `acqua` era il nome di prima, quando la materia era una sola:
       un salvataggio di ieri si rilegge senza chiedere una migrazione. */
    this.terreno = (d && d.terreno) ||
      Object.fromEntries(Object.keys((d && d.acqua) || {}).map(k => [k, 'acqua']))
    /* Il granaio tiene solo prodotti che esistono ancora, e quantità
       sane: una coltura tolta dalla tabella non deve lasciare in
       archivio una voce che nessuno sa più disegnare né spendere. */
    this.granaio = Object.fromEntries(
      Object.entries((d && d.granaio) || {})
        .filter(([k, n]) => PRODOTTI[k] && n > 0)
        .map(([k, n]) => [k, Math.floor(n)]))
    /* Quello che un campo o una macchina ha per le mani viaggia **dentro
       la cosa** (`coltura`/`seminato`, `lavoro`), e va rimesso qui: la
       riga qui sotto ricopia campo per campo, e chi ne aggiunge uno senza
       nominarlo lo perde a ogni riapertura senza che niente sembri rotto.
       Una coltura o una ricetta che oggi non c'è più si scorda — il campo
       torna vuoto invece di restare seminato di niente per sempre. */
    this.cose = ((d && d.cose) || []).filter(c => c && PER_ID[c.id])
      .map(c => {
        const cosa = { i: c.i, id: c.id, g: c.g || 0, x: c.x | 0, y: c.y | 0 }
        if (c.coltura && PER_COLTURA[c.coltura] && c.seminato > 0) {
          cosa.coltura = c.coltura
          cosa.seminato = c.seminato
        }
        if (c.lavoro && PER_RICETTA[c.lavoro.ricetta] && c.lavoro.da > 0)
          cosa.lavoro = { ricetta: c.lavoro.ricetta, da: c.lavoro.da }
        return cosa
      })
    this.prossimo = Math.max(1, (d && d.prossimo) || 0,
                             ...this.cose.map(c => (c.i || 0) + 1))
    /* Quanto è stato ingrandito ciascun silo. Va letto **dopo** le
       cose, perché un salvataggio di ieri non ce l'ha e si ricava da
       quelle: allora i silos si sommavano, e chi ne aveva messi tre
       aveva pagato 360 monete per della capienza. Quella spesa non si
       butta — vale un ingrandimento a testa oltre il primo, che è il
       silo stesso. Non è la regola di oggi (oggi si paga 20, non 120):
       è il cambio di una valuta che non esiste più. */
    /* Una fattoria di ieri non ha `speso` e ha già delle cose in mappa:
       si stima da quelle, al prezzo di listino. Meglio di zero — chi ha
       già mezza fattoria non deve ritrovarsi al livello 1 con tutto
       richiuso — e non è un regalo, perché quelle monete le ha spese
       davvero. */
    this.speso = Number.isFinite(d && d.speso) && d.speso > 0 ? Math.floor(d.speso)
      : this.stimaLoSpeso()
    this.silos = {}
    for (const fam of Object.keys(SILI)) {
      const salvato = d && d.silos && d.silos[fam]
      this.silos[fam] = Number.isFinite(salvato) && salvato > 0 ? Math.floor(salvato)
        : d && d.silos ? 0
        : Math.max(0, this.cose.filter(c => siloDi(c) === fam).length - 1)
    }
    if (!Object.keys(this.piazzole).length) return this.nuova()
    /* Una fattoria salvata quando il mondo era 7×7 fisso non ha
       `limiti`, e il suo bosco arriva fin dove arrivava quel mondo: si
       riparte da lì e si semina solo la terra nuova. Dare per scontato
       un mondo più piccolo di quello vero farebbe ricrescere il bosco
       dove era stato sgomberato. */
    const l = d && d.limiti
    this.limiti = l && ['x0', 'y0', 'x1', 'y1'].every(k => Number.isFinite(l[k]))
      ? { x0: l.x0, y0: l.y0, x1: l.x1, y1: l.y1 } : { ...LIMITI_VECCHI }
    this.allarga()
    return this
  }

  /* ═══════════ il livello della fattoria ═══════════
     L'esperienza sono **le monete spese qui dentro** — il perché sta in
     `dati/livelli.js`. Ci passano tutti i pagamenti, ed è il motivo per
     cui in questo file non si chiama più `this.borsa.paga()` da nessuna
     parte: uno solo dimenticato sarebbe un livello che cresce piano
     senza che nessuno capisca perché. */
  spendi(n) {
    /* `paga(-n)` incassa (sgombrare il bosco rendeva, in una vecchia
       versione): un'entrata non è esperienza. */
    if (n > 0) this.speso = (this.speso || 0) + n
    return this.borsa.paga(n)
  }

  get livello() { return livelloPer(this.speso) }

  /* Tutto quello che la pagina dei livelli deve sapere, in un colpo:
     livello, nome, quanto manca al prossimo. */
  get avanzamento() { return avanzamento(this.speso) }

  /* Una fattoria salvata prima che i livelli esistessero: quanto avrà
     speso, guardando quello che ha in mappa e in magazzino.

     E **non meno di quanto serve a tenersi quello che ha già**: chi
     aveva un pollaio dev'essere almeno al livello del pollaio, se no il
     giorno dell'aggiornamento se lo ritrova in mappa e non nel baule —
     cioè una cosa che ha comprato e non può più ricomprare. La somma
     dei prezzi da sola non basta, perché i prezzi di listino sono più
     bassi di quello che si è speso davvero (rincari, semine, cibo). */
  stimaLoSpeso() {
    let n = 0
    for (const c of this.cose) n += (PER_ID[c.id] || {}).prezzo || 0
    for (const [id, q] of Object.entries(this.magazzino))
      n += ((PER_ID[id] || {}).prezzo || 0) * q
    const serve = Math.max(1,
      ...this.cose.map(c => livelloDellaVoce(PER_ID[c.id])),
      ...Object.keys(this.magazzino).map(id => livelloDellaVoce(PER_ID[id])),
      ...this.bestie.map(b => (ANIMALI[b.chi] || {}).liv || 1))
    return Math.max(n, sogliaDi(serve))
  }

  /* Se una cosa è già arrivata. Il baule mostra solo lo sbloccato, ma
     la regola sta **qui**: una schermata che filtra è una comodità, un
     motore che accetta tutto è un buco — e questo motore lo usa anche
     chi scrive un test. */
  sbloccata(id) {
    const v = PER_ID[id]
    return !!v && livelloDellaVoce(v) <= this.livello
  }

  /* ═══════════ il terreno ═══════════ */
  mia(px, py) { return !!this.piazzole[chiave(px, py)] }

  cellaMia(cx, cy) {
    return this.mia(piazzolaDi(cx), piazzolaDi(cy))
  }

  /* Si compra solo quello che tocca casa: la fattoria cresce da sé, non
     a macchia di leopardo con dei buchi in mezzo. */
  comprabile(px, py) {
    if (!dentroI(this.limiti, px, py) || this.mia(px, py)) return false
    return this.mia(px - 1, py) || this.mia(px + 1, py) ||
           this.mia(px, py - 1) || this.mia(px, py + 1)
  }

  get quantePiazzole() { return Object.keys(this.piazzole).length }
  get prezzoDellaProssima() { return prezzoPiazzola(this.quantePiazzole) }

  compraPiazzola(px, py) {
    if (!this.comprabile(px, py)) return { ok: false, motivo: 'non-si-tocca' }
    const costo = this.prezzoDellaProssima
    if (this.borsa.quante() < costo) return { ok: false, motivo: 'poche-monete', costo }
    this.spendi(costo)
    this.piazzole[chiave(px, py)] = 1
    /* Comprato il bordo, il margine si è assottigliato: il mondo cresce
       subito, così il pezzo appena preso ha già altra terra intorno da
       desiderare. */
    const cresciuto = this.allarga()
    return { ok: true, costo, cresciuto }
  }

  /* ═══════════ l'acqua si dipinge ═══════════
     Uno stagno non è un oggetto 3×3 che o ci sta o non ci sta: è una
     **macchia di celle**, della forma che vuoi. Qui si segna solo dove
     c'è acqua; che aspetto abbia il bordo lo decide chi disegna
     guardando i vicini (`scena/bordi.js`), e non è una cosa che il
     motore debba sapere.

     Costa a cella, e si può togliere: scavare una pozza e ripensarci
     non deve essere una condanna. Come tutto il resto, non rimborsa.

     `terreno` tiene **solo le celle diverse dal prato**: una fattoria
     tutta d'erba non deve portarsi dietro milleottocento voci che
     dicono «qui c'è erba». Chi non è scritto è `BASE`. */
  materiaDi(cx, cy) { return this.terreno[chiave(cx, cy)] || BASE }

  eAcqua(cx, cy) { return this.materiaDi(cx, cy) === 'acqua' }

  get quantaAcqua() {
    return Object.values(this.terreno).filter(m => m === 'acqua').length
  }

  dipingi(cx, cy, materia) {
    if (this.materiaDi(cx, cy) === materia) return { ok: true, costo: 0 }
    if (!this.cellaMia(cx, cy)) return { ok: false, motivo: 'non-e-tua' }
    if (!this.libera(cx, cy, 1, 1)) return { ok: false, motivo: 'occupata' }
    const costo = prezzoDi(materia)
    if (this.borsa.quante() < costo) return { ok: false, motivo: 'poche-monete', costo }
    if (costo) this.spendi(costo)
    if (materia === BASE) delete this.terreno[chiave(cx, cy)]
    else this.terreno[chiave(cx, cy)] = materia
    return { ok: true, costo, materia }
  }

  /* Rimettere il prato è togliere: la materia di base non si scrive. */
  spiana(cx, cy) {
    if (this.materiaDi(cx, cy) === BASE) return { ok: false, motivo: 'gia-prato' }
    delete this.terreno[chiave(cx, cy)]
    return { ok: true }
  }

  /* Le due vecchie porte, tenute perché ci passa già del codice: sono
     la stessa cosa con la materia scritta dentro. */
  dipingiAcqua(cx, cy) { return this.dipingi(cx, cy, 'acqua') }
  togliAcqua(cx, cy) { return this.spiana(cx, cy) }

  /* ═══════════ chi occupa cosa ═══════════ */
  ingombro(cosa) {
    const p = piedeDi(cosa)
    return { x: cosa.x, y: cosa.y, w: p[0], h: p[1] }
  }

  /* `salta` è quello che si sta spostando: sé stesso non è un ostacolo
     per sé stesso, e va saltato **qui** — se lo si riconoscesse dopo,
     una staccionata girata che copre la cella di un'altra cosa
     nasconderebbe quell'altra cosa e la lascerebbe sovrapporre. */
  cosaSotto(cx, cy, salta = null) {
    for (let i = this.cose.length - 1; i >= 0; i--) {
      if (this.cose[i] === salta) continue
      const g = this.ingombro(this.cose[i])
      if (cx >= g.x && cx < g.x + g.w && cy >= g.y && cy < g.y + g.h) return this.cose[i]
    }
    return null
  }

  ostacoloSotto(cx, cy) {
    for (let dx = 0; dx < PIEDE_MASSIMO[0]; dx++)
      for (let dy = 0; dy < PIEDE_MASSIMO[1]; dy++) {
        const x = cx - dx, y = cy - dy
        const k = chiave(x, y)
        const tipo = this.ostacoli[k]
        const o = OSTACOLI[tipo]
        if (!o || dx >= o.piede[0] || dy >= o.piede[1]) continue
        return { k, x, y, tipo, ...o }
      }
    return null
  }

  /* ═══════════ una cella sola, e le due domande che le si fanno ═══════════
     «Ci si posa qualcosa?» e «ci si cammina?» sono lo stesso conto —
     è terra mia, non è acqua, non c'è bosco, non c'è già qualcosa —
     tranne per un punto solo: quello che il catalogo dichiara `sotto`
     (un orto, dei fiori, una radura) è **terreno, non oggetto**. Ci si
     cammina sopra e non ci si posa sopra, ed è la stessa riga che
     decide l'ordine di disegno.

     L'ingombro di quello che c'è si chiede a `ingombro()`, che passa da
     `piedeDi()`: una staccionata girata occupa [1,2] e non [2,1], e
     leggere `v.piede` bloccherebbe le celle sbagliate. */
  cellaBuona(cx, cy, { salta = null, camminando = false } = {}) {
    if (!this.cellaMia(cx, cy)) return false
    if (!siPassa(this.materiaDi(cx, cy))) return false      // in acqua non si posa e non si passa
    if (this.ostacoloSotto(cx, cy)) return false
    const c = this.cosaSotto(cx, cy, salta)
    if (!c) return true
    const v = PER_ID[c.id]
    if (!v) return true              // un id che non c'è più non blocca niente
    return camminando && !!v.sotto
  }

  /* Dove si può mettere il piede. Una domanda sola, e prima erano
     quattro conti sparsi in quattro posti — di cui uno, quello dentro
     al disegno, ne conosceva solo il primo: per questo il cane
     attraversava le case. */
  calpestabile(cx, cy) { return this.cellaBuona(cx, cy, { camminando: true }) }

  /* Una cosa ci sta se il suo piede cade tutto su terra tua, e non
     inciampa in niente. */
  libera(cx, cy, w, h, salta = null) {
    for (let i = 0; i < w; i++) for (let j = 0; j < h; j++)
      if (!this.cellaBuona(cx + i, cy + j, { salta })) return false
    return true
  }

  /* ═══════════ sgombrare ═══════════
     Costa e basta: non rende niente. Il perché sta in `dati/ostacoli.js`
     — un bosco che paga sarebbe una seconda fonte di monete che non
     passa da nessun esercizio, e la fattoria smetterebbe di essere la
     ricompensa di qualcosa. */
  sgombra(cx, cy) {
    const o = this.ostacoloSotto(cx, cy)
    if (!o) return { ok: false, motivo: 'niente-da-sgombrare' }
    if (this.borsa.quante() < o.costo) return { ok: false, motivo: 'poche-monete', costo: o.costo }
    this.spendi(o.costo)
    delete this.ostacoli[o.k]
    return { ok: true, costo: o.costo, tipo: o.tipo }
  }

  /* ═══════════ mettere giù ═══════════
     Un solo metodo per le due cose che sembrano diverse e non lo sono:
     posare qualcosa di nuovo e spostare qualcosa che c'è già. Cambia
     solo chi paga cosa. */
  posa(id, cx, cy, { sposta = null, g = null } = {}) {
    const v = PER_ID[id]
    if (!v) return { ok: false, motivo: 'non-esiste' }
    /* Quello che il livello non ha ancora aperto non si posa — nemmeno
       se è già in magazzino, che è il caso di chi ha messo via una cosa
       comprata prima. Spostare invece resta libero: una cosa già in
       mappa è tua, e il livello non torna mai indietro. */
    if (!sposta && !this.sbloccata(id))
      return { ok: false, motivo: 'non-sbloccato', liv: livelloDellaVoce(v) }
    /* Di un silo ce n'è **uno solo per tipo**: la capienza è del tipo e
       si compra ingrandendo, quindi il secondo non conterrebbe niente
       di più. Il baule non lo rivende, e qui si dice di no anche a chi
       ne avesse uno in magazzino da prima. */
    if (!sposta && v.unico && this.quanteNeHo(id) > 0)
      return { ok: false, motivo: 'ne-hai-gia' }
    const finto = { id, g: g === null ? (sposta ? sposta.g : 0) : g }
    const [w, h] = piedeDi(finto, v)
    if (!this.libera(cx, cy, w, h, sposta)) return { ok: false, motivo: 'non-ci-sta' }

    if (sposta) {
      /* rimettere una cosa esattamente dov'era è gratis: se no chi
         cambia idea a metà gesto si ritrova punito per niente */
      if (sposta.x === cx && sposta.y === cy) return { ok: true, costo: 0, cosa: sposta }
      if (this.borsa.quante() < COSTO_SPOSTARE)
        return { ok: false, motivo: 'poche-monete', costo: COSTO_SPOSTARE }
      this.spendi(COSTO_SPOSTARE)
      sposta.x = cx; sposta.y = cy
      return { ok: true, costo: COSTO_SPOSTARE, cosa: sposta }
    }

    if (this.quantiNe(id) > 0) {
      this.magazzino[id]--
      if (!this.magazzino[id]) delete this.magazzino[id]
      const cosa = { i: this.prossimo++, id, g: finto.g, x: cx, y: cy }
      this.cose.push(cosa)
      return { ok: true, costo: 0, dalMagazzino: true, cosa }
    }
    const prezzo = this.quantoCosta(id)
    if (this.borsa.quante() < prezzo)
      return { ok: false, motivo: 'poche-monete', costo: prezzo }
    this.spendi(prezzo)
    const cosa = { i: this.prossimo++, id, g: finto.g, x: cx, y: cy }
    this.cose.push(cosa)
    return { ok: true, costo: prezzo, cosa }
  }

  /* ═══════════ girare ═══════════
     Non ruota dei pixel — cambia tessera, e solo dove il set ha davvero
     la variante. Se girato non ci sta, si torna com'era: meglio un
     rifiuto che una staccionata dentro una casa. */
  gira(cosa) {
    const v = PER_ID[cosa.id]
    if (!v || !v.giri || v.giri.length < 2) return { ok: false, motivo: 'non-si-gira' }
    const prima = cosa.g || 0
    const dopo = (prima + 1) % v.giri.length
    cosa.g = dopo
    const [w, h] = piedeDi(cosa, v)
    if (!this.libera(cosa.x, cosa.y, w, h, cosa)) {
      cosa.g = prima
      return { ok: false, motivo: 'non-ci-sta' }
    }
    return { ok: true, verso: dopo }
  }

  /* ═══════════ le bestie ═══════════
     Una bestia si prende e si sposta come un oggetto — questa è la
     scelta nuova, e ribalta quella di prima («una bestia non si posa,
     non si sposta»). Il perché sta in `dati/animali.js`: siccome non
     attraversa la staccionata, spostarla **è** il modo di metterla nel
     recinto, e non serve inventare un recinto che chiude.

     Da lì viene la cosa che si scorda: **dove sta una bestia si salva**
     (`x`, `y`, in celle). Se rinascesse in mezzo al prato a ogni
     apertura, quello che la bambina aveva chiuso nel recinto se ne
     sarebbe uscito da solo durante la notte.

     Una per tipo — due beagle identici sono due disegni uguali, non due
     cani. */
  hoLaBestia(chi) { return this.bestie.some(b => b.chi === chi) }

  laBestia(chi) { return this.bestie.find(b => b.chi === chi) || null }

  compraBestia(chi, prezzo, nome = '', dove = null) {
    if (this.hoLaBestia(chi)) return { ok: false, motivo: 'gia-tua' }
    const a = ANIMALI[chi]
    if (a && (a.liv || 1) > this.livello)
      return { ok: false, motivo: 'non-sbloccato', liv: a.liv }
    if (this.borsa.quante() < prezzo) return { ok: false, motivo: 'poche-monete', costo: prezzo }
    this.spendi(prezzo)
    const casa = this.cellaLibera(dove ? dove.x : PRIMA * CELLE + 8,
                                  dove ? dove.y : PRIMA * CELLE + 10)
    const bestia = { chi, nome: String(nome || '').slice(0, 16).trim(),
                     x: casa.x, y: casa.y, ...bisogniNuovi() }
    this.bestie.push(bestia)
    return { ok: true, costo: prezzo, bestia }
  }

  /* Prenderla e posarla dove si vuole. **Non costa**, e questa è
     l'eccezione a `COSTO_SPOSTARE`: una panchina resta dove la metti,
     una bestia dopo un minuto è già da un'altra parte per conto suo —
     farsi pagare per uno spostamento che l'animale disfa da sé sarebbe
     una presa in giro. */
  spostaBestia(chi, cx, cy) {
    const b = this.laBestia(chi)
    if (!b) return { ok: false, motivo: 'non-e-tua' }
    if (!this.calpestabile(cx, cy)) return { ok: false, motivo: 'non-ci-sta' }
    b.x = cx; b.y = cy
    return { ok: true, costo: 0, bestia: b }
  }

  /* Dove va messa in scena all'apertura: dove l'avevamo lasciata, e se
     quel posto non c'è più (una casa costruita sopra, l'acqua dipinta)
     la cella buona più vicina — sparire non è un'opzione. */
  dovEra(chi) {
    const b = this.laBestia(chi)
    const c0 = PRIMA * CELLE
    if (!b) return this.cellaLibera(c0 + 8, c0 + 10)
    if (typeof b.x !== 'number' || typeof b.y !== 'number') {
      const dove = this.cellaLibera(c0 + 8, c0 + 10)
      b.x = dove.x; b.y = dove.y
      return dove
    }
    return this.cellaLibera(b.x, b.y)
  }

  /* Chi guarda le bestie camminare annota ogni tanto dove sono
     arrivate: è quello che rende «l'ho chiuso nel recinto» una cosa che
     resta anche a gioco chiuso. */
  annota(chi, cx, cy) {
    const b = this.laBestia(chi)
    if (!b) return false
    b.x = cx | 0; b.y = cy | 0
    return true
  }

  /* Come sta, adesso. Il calo si applica **leggendo**: chi guarda fa
     scendere e riscrive l'orologio, così il conto non dipende da quanto
     spesso si guarda — che è l'errore classico di questi bisogni. Una
     bestia salvata prima che esistessero se li trova al volo. */
  stato(chi, ora = Date.now()) {
    const b = this.laBestia(chi)
    if (!b) return null
    if (typeof b.pancia !== 'number') Object.assign(b, bisogniNuovi(ora))
    return scendi(b, ora)
  }

  /* Dare da mangiare costa, ed è il motivo per cui una bestia è un
     impegno e non una spesa una volta sola.

     E il cibo dev'essere **il suo**: un pappagallo la bistecca non la
     tocca. Il rifiuto viene prima del pagamento — chi sbaglia ciotola
     non perde monete, perde solo il gesto: è una cosa da imparare, non
     una trappola. */
  nutri(chi, cibo) {
    const b = this.stato(chi)
    if (!b) return { ok: false, motivo: 'non-e-tua' }
    if (!gradisce(cibo, famigliaDi(chi))) return { ok: false, motivo: 'non-gli-piace' }
    if (b.pancia > 0.93) return { ok: false, motivo: 'non-ha-fame' }
    /* Un cibo si paga in monete **o** si scala dal granaio: il mangime
       del mulino è già stato pagato coltivandolo (vedi `dati/bisogni.js`).
       Il controllo viene prima di toccare qualunque cosa, come per il
       cibo sbagliato: chi non ha mangime non perde il gesto e non perde
       niente. */
    if (cibo.da) {
      if (!this.quantoHo(cibo.da)) return { ok: false, motivo: 'manca-roba', prodotto: cibo.da }
      this.togli(cibo.da, 1)
    } else {
      if (this.borsa.quante() < cibo.prezzo)
        return { ok: false, motivo: 'poche-monete', costo: cibo.prezzo }
      this.spendi(cibo.prezzo)
    }
    b.pancia = Math.min(1, b.pancia + cibo.quanto)
    b.quando = Date.now()
    return { ok: true, costo: cibo.prezzo || 0, prodotto: cibo.da || null }
  }

  /* Spazzolare resta gratis; giocare costa una monetina (il perché, e la
     conseguenza da tenere d'occhio, stanno in `dati/bisogni.js`). Il
     prezzo è del gesto, non di questo metodo: qui si legge e basta. */
  coccola(chi, gesto) {
    const b = this.stato(chi)
    if (!b) return { ok: false, motivo: 'non-e-tua' }
    if (b[gesto.bisogno] > 0.93) return { ok: false, motivo: 'non-serve' }
    /* Una coccola si paga in monete **o** con la roba del granaio, come
       un cibo (`nutri`): la copertina è di lana, e la lana è già stata
       pagata tenendo delle pecore. Il controllo viene prima di toccare
       qualunque cosa, sempre per lo stesso motivo — chi non ce l'ha non
       perde niente, perde solo il gesto. */
    if (gesto.da) {
      if (!this.quantoHo(gesto.da)) return { ok: false, motivo: 'manca-roba', prodotto: gesto.da }
      this.togli(gesto.da, 1)
    } else {
      const costo = gesto.prezzo || 0
      if (this.borsa.quante() < costo) return { ok: false, motivo: 'poche-monete', costo }
      if (costo) this.spendi(costo)
    }
    b[gesto.bisogno] = Math.min(1, b[gesto.bisogno] + gesto.quanto)
    b.quando = Date.now()
    return { ok: true, costo: gesto.prezzo || 0, prodotto: gesto.da || null }
  }

  /* Rinominare è gratis e si può fare sempre: un nome scelto a otto anni
     non deve restare addosso a undici, e far pagare un ripensamento è il
     modo più rapido di far smettere di sceglierne uno. */
  rinominaBestia(chi, nome) {
    const b = this.laBestia(chi)
    if (!b) return { ok: false, motivo: 'non-e-tua' }
    b.nome = String(nome || '').slice(0, 16).trim()
    return { ok: true, nome: b.nome }
  }

  /* ═══════════ i due silos ═══════════
     Il raccolto, che non è il magazzino (il perché sta in testa al
     file). Sta in **due silos separati** — la terra da una parte, le
     bestie dall'altra — e ognuno è piccolo, condiviso e si ingrandisce
     pagando: il ragionamento per esteso sta in `dati/coltivazioni.js`.

     Quello che non ci sta non si raccoglie, e il campo resta pronto ad
     aspettare. Che è il modo in cui il gioco chiede di ingrandire il
     silo senza scriverlo da nessuna parte. */
  quantoHo(prodotto) { return this.granaio[prodotto] || 0 }

  /* Il silo di quella famiglia, se è stato costruito. Costruito vuol
     dire **in mappa**: uno in magazzino è una cosa comprata e non
     ancora messa giù, e finché non è giù non contiene niente. */
  siloIn(famiglia) { return this.cose.find(c => siloDi(c) === famiglia) || null }

  eCostruito(famiglia) { return !!this.siloIn(famiglia) }

  livelloDelSilo(famiglia) {
    return SILI[famiglia] ? Math.max(0, (this.silos || {})[famiglia] | 0) : 0
  }

  /* Zero se il silo non c'è, e zero è diverso da piccolo: senza silo
     quella roba non ha proprio dove finire, e chi chiama lo dice con
     parole diverse (`silo-manca` contro `non-ci-sta`). */
  capienzaDi(famiglia) {
    return this.eCostruito(famiglia) ? capienza(this.livelloDelSilo(famiglia)) : 0
  }

  /* Quanta roba c'è dentro **in tutto**: il tetto è del silo, non del
     singolo prodotto. Era per prodotto, ed era la cosa che non si
     capiva — «di ogni cosa ce ne stanno 90» non si trasforma in un
     numero che si guarda mentre si raccoglie. */
  quantoHoNelSilo(famiglia) {
    return Object.entries(this.granaio)
      .reduce((n, [k, q]) => n + (siloDelProdotto(k) === famiglia ? q : 0), 0)
  }

  /* Quanto ancora ci sta di questo prodotto: quello che avanza nel suo
     silo. Due silos separati vogliono dire che uno pieno non ferma
     l'altro — il raccolto colmo non impedisce di ritirare le uova — che
     è la stessa preoccupazione di prima risolta dividendo invece che
     alzando il tetto. */
  quantoCiSta(prodotto) {
    const fam = siloDelProdotto(prodotto)
    if (!fam) return 0
    return Math.max(0, this.capienzaDi(fam) - this.quantoHoNelSilo(fam))
  }

  /* Perché non ci sta: il silo non c'è, o è pieno. Chi mostra i
     cartelli ha bisogno di saperlo — «costruisci il silo» e
     «ingrandiscilo» sono due cose da fare diverse, e un cartello che
     dice quella sbagliata è peggio di nessun cartello. */
  perchePieno(prodotto) {
    const fam = siloDelProdotto(prodotto)
    return { famiglia: fam, motivo: this.eCostruito(fam) ? 'silo-pieno' : 'silo-manca' }
  }

  /* Quanto costa il prossimo ingrandimento di questo silo. */
  costoDellIngrandimento(famiglia) {
    return costoIngrandimento(this.livelloDelSilo(famiglia))
  }

  /* Ingrandire: due posti in più, e il prossimo costa di più. Non c'è
     nessun tetto agli ingrandimenti — a fermare è il prezzo, che
     raddoppia il passo ogni volta, e un tetto in più sarebbe un secondo
     no da spiegare. */
  ingrandisci(famiglia) {
    if (!SILI[famiglia]) return { ok: false, motivo: 'non-esiste' }
    if (!this.eCostruito(famiglia)) return { ok: false, motivo: 'silo-manca' }
    const costo = this.costoDellIngrandimento(famiglia)
    if (this.borsa.quante() < costo) return { ok: false, motivo: 'poche-monete', costo }
    this.spendi(costo)
    this.silos[famiglia] = this.livelloDelSilo(famiglia) + 1
    return { ok: true, costo, capienza: this.capienzaDi(famiglia),
             livello: this.silos[famiglia] }
  }

  /* Mette via quello che ci sta e **torna quanto ne è rimasto fuori**.
     Chi chiama decide cosa dirne: un raccolto che non ci sta non si
     raccoglie affatto (vedi `raccogli`), perché mezzo campo raccolto è
     uno stato che non si sa disegnare. */
  metti(prodotto, n) {
    if (!PRODOTTI[prodotto] || !(n > 0)) return n | 0
    const ci = Math.min(n, this.quantoCiSta(prodotto))
    if (ci > 0) this.granaio[prodotto] = this.quantoHo(prodotto) + ci
    return n - ci
  }

  togli(prodotto, n) {
    if (this.quantoHo(prodotto) < n) return false
    this.granaio[prodotto] -= n
    if (this.granaio[prodotto] <= 0) delete this.granaio[prodotto]
    return true
  }

  /* ═══════════ i campi ═══════════
     Un campo è una `cosa` come le altre, con due campi in più quando è
     seminato: `coltura` (cos'è) e `seminato` (quando). Il tempo si
     **legge**, non si aggiorna: `quantoCresciuto` fa il conto dall'ora
     vera, quindi il gioco chiuso per una notte fa crescere il grano
     esattamente come restare a guardarlo, e non c'è nessun orologio da
     tenere in vita.

     **Niente marcisce**: a crescita finita il campo resta pronto per
     sempre. La spiegazione lunga sta in `dati/coltivazioni.js` — in due
     parole, questo posto è il premio per gli esercizi fatti altrove, e
     un raccolto che scade lo trasformerebbe in un dovere. */
  statoCampo(cosa, ora = Date.now()) {
    if (!eCampo(cosa)) return null
    const c = PER_COLTURA[cosa.coltura]
    if (!c || !cosa.seminato) return { vuoto: true, coltura: null, quanto: 0, pronto: false }
    const quanto = quantoCresciuto(cosa.seminato, c.minuti, ora)
    return {
      vuoto: false, coltura: c, quanto, pronto: quanto >= 1,
      manca: minutiCheMancano(cosa.seminato, c.minuti, ora),
      stadio: stadioDi(c, quanto),
    }
  }

  /* `seminaCampo` e non `semina`: `semina()` è già il bosco che nasce
     dalle coordinate, ed è un'altra cosa per un altro scopo. Due metodi
     con lo stesso nome qui dentro vorrebbero dire che il secondo
     cancella il primo, e il bosco smetterebbe di nascere senza che
     nessun test parli di alberi. */
  seminaCampo(cosa, colturaId, ora = Date.now()) {
    const s = this.statoCampo(cosa)
    if (!s) return { ok: false, motivo: 'non-e-un-campo' }
    if (!s.vuoto) return { ok: false, motivo: 'gia-seminato' }
    const c = PER_COLTURA[colturaId]
    if (!c) return { ok: false, motivo: 'non-esiste' }
    if ((c.liv || 1) > this.livello)
      return { ok: false, motivo: 'non-sbloccato', liv: c.liv }
    if (this.borsa.quante() < c.semina)
      return { ok: false, motivo: 'poche-monete', costo: c.semina }
    if (c.semina) this.spendi(c.semina)
    cosa.coltura = c.id
    cosa.seminato = ora
    return { ok: true, costo: c.semina, coltura: c }
  }

  /* Raccogliere costa, e chi è a zero monete **non perde niente**: il
     campo resta pronto e aspetta il primo esercizio fatto. È la stessa
     idea della spazzola gratis in `dati/bisogni.js` — non si resta mai
     chiusi fuori da quello che è già proprio.

     Il silo pieno — o non ancora costruito — si comporta allo stesso
     modo, e per lo stesso motivo: non si raccoglie, non si paga, il
     grano resta nel campo. */
  raccogli(cosa, ora = Date.now()) {
    const s = this.statoCampo(cosa, ora)
    if (!s) return { ok: false, motivo: 'non-e-un-campo' }
    if (s.vuoto) return { ok: false, motivo: 'niente-da-raccogliere' }
    if (!s.pronto) return { ok: false, motivo: 'non-e-pronto', manca: s.manca }
    const c = s.coltura
    if (this.quantoCiSta(c.da) < c.resa)
      return { ok: false, ...this.perchePieno(c.da), prodotto: c.da, quanto: c.resa }
    if (this.borsa.quante() < c.raccolta)
      return { ok: false, motivo: 'poche-monete', costo: c.raccolta }
    if (c.raccolta) this.spendi(c.raccolta)
    this.metti(c.da, c.resa)
    delete cosa.coltura
    delete cosa.seminato
    return { ok: true, costo: c.raccolta, prodotto: c.da, quanto: c.resa }
  }

  /* ═══════════ le macchine ═══════════
     Stesso orologio dei campi, mestiere diverso: prende roba dal granaio
     e dopo un po' ne rende un'altra. `lavoro` è `{ ricetta, da }` e sta
     dentro la cosa, così un mulino spostato si porta dietro quello che
     stava macinando.

     La roba si prende **al momento di avviare**, non a lavoro finito: se
     no si potrebbe far partire dieci volte lo stesso mulino con lo stesso
     grano, e il granaio sarebbe una promessa invece di una scorta. */
  statoMacchina(cosa, ora = Date.now()) {
    const quale = macchinaDi(cosa)
    if (!quale) return null
    const l = cosa.lavoro
    const r = l && PER_RICETTA[l.ricetta]
    if (!r) return { macchina: quale, ferma: true, ricetta: null, quanto: 0, pronto: false }
    const quanto = quantoCresciuto(l.da, r.minuti, ora)
    return {
      macchina: quale, ferma: false, ricetta: r, quanto, pronto: quanto >= 1,
      manca: minutiCheMancano(l.da, r.minuti, ora),
    }
  }

  /* Cosa manca per fare questa ricetta, e quanto. Serve a chi mostra il
     pannello: un tasto spento senza il perché è un tasto rotto, e il
     perché qui è sempre un numero («ti serve un grano in più»). */
  cheMancaPer(ricettaId) {
    const r = PER_RICETTA[ricettaId]
    if (!r) return null
    const manca = []
    for (const [k, n] of Object.entries(r.prende))
      if (this.quantoHo(k) < n) manca.push({ prodotto: k, quanti: n - this.quantoHo(k) })
    return { manca, monete: Math.max(0, r.costo - this.borsa.quante()) }
  }

  avvia(cosa, ricettaId, ora = Date.now()) {
    const s = this.statoMacchina(cosa, ora)
    if (!s) return { ok: false, motivo: 'non-e-una-macchina' }
    if (!s.ferma) return { ok: false, motivo: 'sta-lavorando' }
    const r = PER_RICETTA[ricettaId]
    if (!r || r.dove !== s.macchina) return { ok: false, motivo: 'non-esiste' }
    const che = this.cheMancaPer(ricettaId)
    if (che.manca.length) return { ok: false, motivo: 'manca-roba', manca: che.manca }
    if (this.borsa.quante() < r.costo)
      return { ok: false, motivo: 'poche-monete', costo: r.costo }
    /* Prima la roba, poi le monete, poi si parte: se una delle due
       mancasse a metà si resterebbe con il granaio scucito e niente in
       macchina. I controlli qui sopra lo escludono, e l'ordine è la
       cintura di sicurezza. */
    for (const [k, n] of Object.entries(r.prende)) this.togli(k, n)
    if (r.costo) this.spendi(r.costo)
    cosa.lavoro = { ricetta: r.id, da: ora }
    return { ok: true, costo: r.costo, ricetta: r }
  }

  /* Ritirare è gratis: si è già pagato avviando. E come il campo, quello
     che è pronto **aspetta** — una macchina finita non butta via niente
     se nessuno passa a prenderlo. */
  ritira(cosa, ora = Date.now()) {
    const s = this.statoMacchina(cosa, ora)
    if (!s) return { ok: false, motivo: 'non-e-una-macchina' }
    if (s.ferma) return { ok: false, motivo: 'non-sta-lavorando' }
    if (!s.pronto) return { ok: false, motivo: 'non-e-pronto', manca: s.manca }
    const r = s.ricetta
    if (this.quantoCiSta(r.da) < r.resa)
      return { ok: false, ...this.perchePieno(r.da), prodotto: r.da, quanto: r.resa }
    this.metti(r.da, r.resa)
    delete cosa.lavoro
    return { ok: true, costo: 0, prodotto: r.da, quanto: r.resa }
  }

  /* ═══════════ quello che la scena deve sapere ═══════════
     Chi disegna non conosce il grano e non deve conoscerlo: chiede
     **cosa si vede sopra questa cosa, adesso**, e riceve un nome di
     tessera e un fumetto da mettere in testa quando c'è qualcosa da
     fare. È la stessa divisione dei prezzi — la tela legge
     `prezzoDellaProssima` e non sa come si rincara.

     `sopra` si ripete su ogni cella del piede: quattro germogli su un
     campo 2×2 sono un campo che cresce, uno solo in mezzo è un ciuffo. */
  aspettoDellaCosa(cosa, ora = Date.now()) {
    const c = this.statoCampo(cosa, ora)
    if (c) {
      if (c.vuoto) return null
      /* `alto`: uno stadio non è più una tesserina sull'aiuola, è il
         campo intero, e il mais maturo è due volte più alto del suo
         piede. Chi disegna deve saperlo, perché una cosa alta va
         ordinata come un oggetto — chi le passa dietro ci finisce
         dietro — mentre l'aiuola sotto resta terreno. */
      return { sopra: c.stadio, alto: true, fumetto: c.pronto ? '🧺' : null }
    }
    const m = this.statoMacchina(cosa, ora)
    if (!m) return null
    /* Una macchina coi ritratti — cioè un recinto — non si mette
       qualcosa *sopra*: **cambia disegno**. È l'unico modo di far dire a
       una cosa in che stato è senza aprirla, e quello che si legge da
       lontano è la faccia dell'animale, non un'icona che gli galleggia
       in testa. Il fumetto resta solo per il pronto, che è l'unico stato
       in cui c'è da fare qualcosa. */
    const stati = statiDi(cosa)
    if (stati) return { invece: stati[this.posaDelRecinto(m)],
                        fumetto: m.pronto ? '🧺' : null }
    if (!m.ferma) return { sopra: null, fumetto: m.pronto ? '🧺' : '⏳' }
    return null
  }

  /* Quale dei sei ritratti, dato lo stato della macchina. Le soglie
     stanno qui e non nel catalogo perché sono una lettura
     dell'orologio, e il catalogo l'orologio non ce l'ha; i nomi degli
     stati invece stanno là, insieme ai pezzi che esistono davvero.

     Ferma vuol dire **ha fame**, non «è tranquilla»: un recinto che non
     sta lavorando è un recinto che aspetta da mangiare, ed è esattamente
     quello che si vuole far vedere. Il `calmo` resta il ritratto del
     baule, dove non c'è nessuno stato da raccontare. */
  posaDelRecinto(m) {
    if (m.ferma) return 'fame'
    if (m.pronto) return 'pronto'
    if (m.quanto < 0.34) return 'mangia'
    if (m.quanto < 0.7) return 'felice'
    return 'dorme'
  }

  /* ═══════════ il magazzino ═══════════ */
  quantiNe(id) { return this.magazzino[id] || 0 }

  /* Quante ne ho **in tutto**: in mappa e nel baule. È il numero da cui
     dipende il prezzo della prossima (`quantoCosta`), e conta tutte e
     due le parti apposta — se contasse solo la mappa, mettere via un
     campo e ricomprarlo sarebbe il modo di pagarlo sempre 22. */
  quanteNeHo(id) {
    return this.quantiNe(id) + this.cose.reduce((n, c) => n + (c.id === id ? 1 : 0), 0)
  }

  /* Quanto costa **adesso** questa cosa. Quasi tutte costano sempre
     uguale; il campo rincara a ogni copia (`cresce` in
     `dati/catalogo.js`), come fa il pezzo di terra. Ci passano tutti e
     due i modi di comprare — posando e dal baule — perché due conti
     diversi per lo stesso prezzo sono due conti che prima o poi si
     scostano, e chi guarda il baule vedrebbe un numero e ne pagherebbe
     un altro. */
  quantoCosta(id) {
    return prezzoDellaVoce(PER_ID[id], this.quanteNeHo(id))
  }

  mettiVia(cosa) {
    const i = this.cose.indexOf(cosa)
    if (i < 0) return { ok: false, motivo: 'non-in-mappa' }
    /* Un campo seminato e una macchina al lavoro non si mettono via: nel
       baule non c'è posto per un grano a metà crescita, e metterli via
       vorrebbe dire buttare quello che si sta aspettando. Niente si
       perde — nemmeno per distrazione — quindi si dice no e si aspetta. */
    if (cosa.coltura) return { ok: false, motivo: 'campo-seminato' }
    if (cosa.lavoro) return { ok: false, motivo: 'sta-lavorando' }
    this.cose.splice(i, 1)
    this.magazzino[cosa.id] = this.quantiNe(cosa.id) + 1
    return { ok: true, id: cosa.id }
  }

  /* Comprarne uno senza metterlo giù. Dal baule non ci passa più
     nessuno — lì premere è già posare, e si paga posando — ma resta
     perché comprare e piazzare sono due cose diverse e il magazzino
     esiste lo stesso: chi mette via una panchina la ritrova qui. */
  compra(id) {
    const v = PER_ID[id]
    if (!v) return { ok: false, motivo: 'non-esiste' }
    if (!this.sbloccata(id))
      return { ok: false, motivo: 'non-sbloccato', liv: livelloDellaVoce(v) }
    if (v.unico && this.quanteNeHo(id) > 0) return { ok: false, motivo: 'ne-hai-gia' }
    const prezzo = this.quantoCosta(id)
    if (this.borsa.quante() < prezzo)
      return { ok: false, motivo: 'poche-monete', costo: prezzo }
    this.spendi(prezzo)
    this.magazzino[id] = this.quantiNe(id) + 1
    return { ok: true, costo: prezzo }
  }

  /* ═══════════ per chi guarda da fuori ═══════════ */
  get quanteCose() { return this.cose.length }
  get quantiOstacoli() { return Object.keys(this.ostacoli).length }
  get tipiPosseduti() {
    return new Set([...this.cose.map(c => c.id), ...Object.keys(this.magazzino)]).size
  }

  /* Una cella dove si può stare, buona per far comparire qualcuno che
     cammina. Cerca a cerchi dal punto chiesto invece di tirare a caso —
     un cane che nasce nel bosco è un cane che non si trova più — e la
     ricerca è quella di tutti (`primaLibera` di `motore/passi.js`):
     l'unica cosa che cambia da un gioco all'altro è cosa vuol dire
     «libera», e qui vuol dire calpestabile.

     Se non trova niente torna il punto chiesto: chi ci nasce sopra
     saprà uscirne camminando, e sparire non è un'opzione. */
  cellaLibera(cx, cy, raggio = 6) {
    return primaLibera((x, y) => this.calpestabile(x, y), { x: cx, y: cy }, raggio)
           || { x: cx, y: cy }
  }
}
