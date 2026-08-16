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
     bestie     le tue, coi bisogni e **dove stanno**  `{ chi, nome, x, y, … }`

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
import { PER_ID, PARTENZA, piedeDi } from '../dati/catalogo.js'
import { OSTACOLI, TIPI } from '../dati/ostacoli.js'
import { BASE, prezzoDi, siPassa } from '../dati/terreni.js'
import { nuovo as bisogniNuovi, scendi, gradisce } from '../dati/bisogni.js'
import { famigliaDi } from '../dati/animali.js'
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
             magazzino: this.magazzino, terreno: this.terreno, limiti: this.limiti,
             bestie: this.bestie, prossimo: this.prossimo }
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
    this.cose = ((d && d.cose) || []).filter(c => c && PER_ID[c.id])
      .map(c => ({ i: c.i, id: c.id, g: c.g || 0, x: c.x | 0, y: c.y | 0 }))
    this.prossimo = Math.max(1, (d && d.prossimo) || 0,
                             ...this.cose.map(c => (c.i || 0) + 1))
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
    this.borsa.paga(costo)
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
    if (costo) this.borsa.paga(costo)
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
    this.borsa.paga(o.costo)
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
    const finto = { id, g: g === null ? (sposta ? sposta.g : 0) : g }
    const [w, h] = piedeDi(finto, v)
    if (!this.libera(cx, cy, w, h, sposta)) return { ok: false, motivo: 'non-ci-sta' }

    if (sposta) {
      /* rimettere una cosa esattamente dov'era è gratis: se no chi
         cambia idea a metà gesto si ritrova punito per niente */
      if (sposta.x === cx && sposta.y === cy) return { ok: true, costo: 0, cosa: sposta }
      if (this.borsa.quante() < COSTO_SPOSTARE)
        return { ok: false, motivo: 'poche-monete', costo: COSTO_SPOSTARE }
      this.borsa.paga(COSTO_SPOSTARE)
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
    if (this.borsa.quante() < v.prezzo)
      return { ok: false, motivo: 'poche-monete', costo: v.prezzo }
    this.borsa.paga(v.prezzo)
    const cosa = { i: this.prossimo++, id, g: finto.g, x: cx, y: cy }
    this.cose.push(cosa)
    return { ok: true, costo: v.prezzo, cosa }
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
    if (this.borsa.quante() < prezzo) return { ok: false, motivo: 'poche-monete', costo: prezzo }
    this.borsa.paga(prezzo)
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
    if (this.borsa.quante() < cibo.prezzo)
      return { ok: false, motivo: 'poche-monete', costo: cibo.prezzo }
    this.borsa.paga(cibo.prezzo)
    b.pancia = Math.min(1, b.pancia + cibo.quanto)
    b.quando = Date.now()
    return { ok: true, costo: cibo.prezzo }
  }

  /* Spazzolare resta gratis; giocare costa una monetina (il perché, e la
     conseguenza da tenere d'occhio, stanno in `dati/bisogni.js`). Il
     prezzo è del gesto, non di questo metodo: qui si legge e basta. */
  coccola(chi, gesto) {
    const b = this.stato(chi)
    if (!b) return { ok: false, motivo: 'non-e-tua' }
    if (b[gesto.bisogno] > 0.93) return { ok: false, motivo: 'non-serve' }
    const costo = gesto.prezzo || 0
    if (this.borsa.quante() < costo) return { ok: false, motivo: 'poche-monete', costo }
    if (costo) this.borsa.paga(costo)
    b[gesto.bisogno] = Math.min(1, b[gesto.bisogno] + gesto.quanto)
    b.quando = Date.now()
    return { ok: true, costo }
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

  /* ═══════════ il magazzino ═══════════ */
  quantiNe(id) { return this.magazzino[id] || 0 }

  mettiVia(cosa) {
    const i = this.cose.indexOf(cosa)
    if (i < 0) return { ok: false, motivo: 'non-in-mappa' }
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
    if (this.borsa.quante() < v.prezzo)
      return { ok: false, motivo: 'poche-monete', costo: v.prezzo }
    this.borsa.paga(v.prezzo)
    this.magazzino[id] = this.quantiNe(id) + 1
    return { ok: true, costo: v.prezzo }
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
