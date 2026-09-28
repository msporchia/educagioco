/* Le regole della fattoria, senza schermo: classe pura, gira uguale in Node e nel browser. Riceve
   una borsa {quante(),paga(n)} e non conosce il profilo. Vedi docs/fattoria/regole.md e catena.md. */
import {
  CELLE, PRIMA, ULTIMA, COSTO_SPOSTARE, LIMITI_VECCHI, celleDi, dentroI,
  limitiPer, piazzolaDi, DENSITA_BOSCO, caso, chiave, prezzoPiazzola,
} from '../dati/mondo.js'
import { PER_ID, PARTENZA, piedeDi, eCampo, eSilo, eMercato, eMongolfiera, siloDi, macchinaDi,
         laMacchina, statiDi, prezzoDellaVoce, quantiVersi, puoSpecchiare }
  from '../dati/catalogo.js'
import {
  PER_COLTURA, PER_RICETTA, PRODOTTI, SILI, COLTURE, RICETTE,
  ricetteDi, postiPerMerce, costoIngrandimento,
  merciDi, siloDelProdotto, quantoCresciuto, stadioDi, minutiCheMancano, PROFONDITA,
  MINUTO,
} from '../dati/coltivazioni.js'
import { postiDellaFila, prezzoDellaFila, PREZZI_DELLA_FILA } from '../dati/coda.js'
import { livelloPer, avanzamento, livelloDellaVoce, sogliaDi, ULTIMO,
         premiDi, premioDi, chiaveDi, SOGLIE_ORA, livelloVecchioPer } from '../dati/livelli.js'
import { OSTACOLI, TIPI } from '../dati/ostacoli.js'
import { BASE, prezzoDi, siPassa } from '../dati/terreni.js'
import { nuovo as bisogniNuovi, scendi, gradisce, tuttoAPosto, premiaSeStaBene }
  from '../dati/bisogni.js'
import { ANIMALI, famigliaDi, premioBenessere } from '../dati/animali.js'
import { PER_ID as ADDOBBI_PER_ID, staA, addossoA, addobbiPer } from '../dati/addobbi.js'
import { qualcosaDaConsegnare } from './mercato.js'
import { daConsegnareIn, leggiLeBotteghe } from './botteghe.js'
import { aspettoDellaMongolfiera, leggiLaMongolfiera } from './mongolfiera.js'
import { postoDi } from '../dati/catalogo.js'
import { primaLibera } from '../../../motore/passi.js'

// Il più grosso ostacolo del bosco: calpestabile guarda poche celle indietro invece di scorrere tutto.
const PIEDE_MASSIMO = Object.values(OSTACOLI).reduce(
  (m, o) => [Math.max(m[0], o.piede[0]), Math.max(m[1], o.piede[1])], [1, 1])

// Una borsa che non paga mai: per far girare la fattoria in un test senza economia.
export const borsaInfinita = () => ({ quante: () => Infinity, paga: () => true })

export class Fattoria {
  // dato è quello che torna da serializza(): senza, nasce una fattoria nuova.
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
    // Tutte le famiglie da subito, a zero: serializza/deserializza deve dare la stessa fattoria.
    this.silos = Object.fromEntries(Object.keys(SILI).map(fam => [fam, 0]))
    // Quanto speso qui dentro, in tutto e da sempre: non scende mai, nemmeno mettendo via le cose.
    this.speso = 0
    // La seconda sorgente del livello (motore/mercato.js): in campo suo, si somma a speso ma è roba diversa.
    this.guadagnato = 0
    this.soglie = SOGLIE_ORA
    // I tre posti del banco, vuoti finché non c'è una bancarella; l'id non si riusa mai.
    this.ordini = []
    this.prossimoOrdine = 1
    this.botteghe = {}
    this.mongolfiera = null
    // Addobbi comprati e non addosso: il guardaroba, come il magazzino. Niente si perde mai.
    this.guardaroba = {}
    // Le file ingrandite delle macchine messe via: il numero da solo non lo ricorderebbe.
    this.fileRiposte = {}
    // I premi del livello 1 si prendono d'ufficio: il baule non deve nascere vuoto.
    this.reclamati = {}
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
    for (const p of premiDi(1)) this.reclamati[p.chiave] = 1
    return this
  }

  // Ricavato dalle coordinate, non a caso: la stessa fattoria riaperta ha gli stessi alberi.
  // Semina solo dove non era già stato seminato, se no un albero sgomberato ricrescerebbe.
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

  // Due piazzole di margine su ogni lato; semina il bosco solo sulla striscia appena comparsa.
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
             speso: this.speso, reclamati: this.reclamati,
             guadagnato: this.guadagnato, soglie: this.soglie, ordini: this.ordini,
             botteghe: this.botteghe, mongolfiera: this.mongolfiera,
             prossimoOrdine: this.prossimoOrdine, guardaroba: this.guardaroba,
             terreno: this.terreno, fileRiposte: this.fileRiposte,
             limiti: this.limiti, bestie: this.bestie, prossimo: this.prossimo }
  }

  // Regge un salvataggio di ieri senza migrazione: quello che manca si rimette qui, un id sparito si butta.
  deserializza(d) {
    const persi = []
    this.piazzole = (d && d.piazzole) || {}
    // Un tipo di ostacolo che non esiste più si butta qui, non arriva a chi disegna.
    this.ostacoli = Object.fromEntries(
      Object.entries((d && d.ostacoli) || {}).filter(([, tipo]) => OSTACOLI[tipo]))
    this.magazzino = (d && d.magazzino) || {}
    // Le bestie si rileggono tutte, anche senza sprite (chi mette in scena le ignora, non qui).
    this.bestie = ((d && d.bestie) || [])
      .map(b => typeof b === 'string' ? { chi: b, nome: '' } : b)
      .filter(b => b && typeof b.chi === 'string')
      // Un addobbo tolto dal catalogo, o che oggi non sta più, torna nel guardaroba invece di sparire.
      .map(b => {
        if (!b.addobbi || typeof b.addobbi !== 'object') return { ...b, addobbi: {} }
        const addobbi = {}
        for (const [dove, id] of Object.entries(b.addobbi)) {
          const a = ADDOBBI_PER_ID[id]
          if (a && a.dove === dove && staA(id, b.chi)) addobbi[dove] = id
          else if (a) persi.push(id)
        }
        return { ...b, addobbi }
      })
      .map(b => ({ ...b, premiato: b.premiato === true }))
    // acqua era il nome di prima, quando la materia era una sola.
    this.terreno = (d && d.terreno) ||
      Object.fromEntries(Object.keys((d && d.acqua) || {}).map(k => [k, 'acqua']))
    this.granaio = Object.fromEntries(
      Object.entries((d && d.granaio) || {})
        .filter(([k, n]) => PRODOTTI[k] && n > 0)
        .map(([k, n]) => [k, Math.floor(n)]))
    // Quello che un campo o una macchina ha per le mani viaggia dentro la cosa; una coltura/ricetta sparita si scorda.
    this.cose = ((d && d.cose) || []).filter(c => c && PER_ID[c.id])
      .map(c => {
        const cosa = { i: c.i, id: c.id, g: c.g || 0, x: c.x | 0, y: c.y | 0 }
        // Lo specchio si scrive solo quando c'è: un m:0 su ogni cosa sarebbero duecento "no" in più.
        if (c.m) cosa.m = 1
        if (c.coltura && PER_COLTURA[c.coltura] && c.seminato > 0) {
          cosa.coltura = c.coltura
          cosa.seminato = c.seminato
        }
        // La fila, e il lavoro di ieri: un salvataggio vecchio si rilegge come una fila di uno.
        const fila = Array.isArray(c.coda) ? c.coda : c.lavoro ? [c.lavoro] : []
        const coda = fila
          .filter(p => p && PER_RICETTA[p.ricetta] && p.da > 0)
          .map(p => ({ ricetta: p.ricetta, da: p.da }))
        if (coda.length) cosa.coda = coda
        if (c.fila > 0) cosa.fila = Math.min(PREZZI_DELLA_FILA.length, Math.floor(c.fila))
        return cosa
      })
    this.prossimo = Math.max(1, (d && d.prossimo) || 0,
                             ...this.cose.map(c => (c.i || 0) + 1))
    // Quanto è stato ingrandito ciascun silo, ricavato dopo le cose per i salvataggi che non ce l'hanno.
    // Una fattoria di ieri non ha speso: si stima da quello che ha in mappa, al prezzo di listino.
    this.speso = Number.isFinite(d && d.speso) && d.speso > 0 ? Math.floor(d.speso)
      : this.stimaLoSpeso()
    // Il banco del mercato: una fattoria di prima del mercato nasce con zero ordini e zero esperienza.
    this.guadagnato = Number.isFinite(d && d.guadagnato) && d.guadagnato > 0
      ? Math.floor(d.guadagnato) : 0
    // Le soglie sono cambiate, il livello no: si aggiunge a speso quello che manca per restare
    // dov'era col metro nuovo (una volta sola: non è un regalo, è il livello che aveva già).
    if (!(d && d.soglie >= SOGLIE_ORA)) {
      const era = livelloVecchioPer(this.speso + this.guadagnato)
      const manca = sogliaDi(era) - (this.speso + this.guadagnato)
      if (manca > 0) this.speso += manca
    }
    this.soglie = SOGLIE_ORA
    this.ordini = ((d && d.ordini) || []).map(o => {
      if (!o) return null
      if (!o.chiede) return o.dal > 0 ? { dal: o.dal } : null
      const chiede = {}
      for (const [k, n] of Object.entries(o.chiede))
        if (PRODOTTI[k] && n > 0) chiede[k] = Math.floor(n)
      if (!Object.keys(chiede).length) return null
      return { id: o.id | 0, chi: o.chi, chiede, xp: Math.max(0, o.xp | 0),
               minuti: Math.max(0, o.minuti | 0), nato: o.nato || 0 }
    })
    this.prossimoOrdine = Math.max(1, (d && d.prossimoOrdine) || 0,
                                   ...this.ordini.map(o => ((o && o.id) || 0) + 1))
    // Le botteghe: una fattoria di prima non ne ha, e nasce vuota.
    this.botteghe = leggiLeBotteghe(d && d.botteghe)
    // La mongolfiera: una fattoria di prima non ce l'ha, e nasce col cielo libero.
    this.mongolfiera = leggiLaMongolfiera(d && d.mongolfiera)
    // Il guardaroba: solo addobbi che esistono ancora, più quello che una bestia non porta più.
    this.guardaroba = {}
    for (const [id, n] of Object.entries((d && d.guardaroba) || {}))
      if (ADDOBBI_PER_ID[id] && n > 0) this.guardaroba[id] = Math.floor(n)
    for (const id of persi) this.guardaroba[id] = (this.guardaroba[id] || 0) + 1
    this.fileRiposte = {}
    for (const [id, lista] of Object.entries((d && d.fileRiposte) || {})) {
      const buone = (Array.isArray(lista) ? lista : [])
        .map(n => Math.min(PREZZI_DELLA_FILA.length, Math.floor(n) || 0)).filter(n => n > 0)
      if (PER_ID[id] && buone.length) this.fileRiposte[id] = buone
    }
    // I premi presi: una fattoria di prima dei premi li considera tutti presi (i suoi livelli sono già passati).
    this.reclamati = {}
    if (d && d.reclamati && typeof d.reclamati === 'object') {
      for (const k of Object.keys(d.reclamati)) if (premioDi(k)) this.reclamati[k] = 1
    } else this.reclamaTutto()
    // Quello già in mano conta come preso comunque: messo via non si potrebbe più tirare fuori.
    for (const c of this.cose) {
      this.reclamati[chiaveDi('cosa', c.id)] = 1
      if (c.coltura) this.reclamati[chiaveDi('coltura', c.coltura)] = 1
    }
    for (const id of Object.keys(this.magazzino)) this.reclamati[chiaveDi('cosa', id)] = 1
    for (const b of this.bestie) this.reclamati[chiaveDi('bestia', b.chi)] = 1
    this.silos = {}
    for (const fam of Object.keys(SILI)) {
      const salvato = d && d.silos && d.silos[fam]
      this.silos[fam] = Number.isFinite(salvato) && salvato > 0 ? Math.floor(salvato)
        : d && d.silos ? 0
        : Math.max(0, this.cose.filter(c => siloDi(c) === fam).length - 1)
    }
    if (!Object.keys(this.piazzole).length) return this.nuova()
    // Un salvataggio col mondo 7×7 fisso non ha limiti: si riparte da lì, senza far ricrescere il bosco sgomberato.
    const l = d && d.limiti
    this.limiti = l && ['x0', 'y0', 'x1', 'y1'].every(k => Number.isFinite(l[k]))
      ? { x0: l.x0, y0: l.y0, x1: l.x1, y1: l.y1 } : { ...LIMITI_VECCHI }
    this.allarga()
    return this
  }

  // Le due sorgenti dell'esperienza (spesa + consegne) — vedi docs/fattoria/livelli.md.
  spendi(n) {
    // paga(-n) incassa (un'entrata non è esperienza).
    if (n > 0) this.speso = (this.speso || 0) + n
    return this.borsa.paga(n)
  }

  // Mercato e bestie non pagano mai monete, solo esperienza (che non scende).
  guadagna(n) {
    if (!(n > 0)) return false
    const prima = this.livello
    this.guadagnato = (this.guadagnato || 0) + Math.floor(n)
    return this.livello > prima
  }

  get esperienza() { return (this.speso || 0) + (this.guadagnato || 0) }

  get livello() { return livelloPer(this.esperienza) }

  get avanzamento() { return avanzamento(this.esperienza) }

  // Una fattoria di prima dei livelli: stima lo speso da quello che ha in mappa, non meno di quanto
  // serve a tenerselo (i prezzi di listino sono più bassi di quanto si è speso davvero).
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

  // I premi: il livello apre, prenderli è un gesto a parte — vedi docs/fattoria/livelli.md.
  reclamato(chiave) { return !!this.reclamati[chiave] }

  // Si ferma all'ultimo livello che porta roba, se no un cheat al livello 300 girerebbe a vuoto.
  daReclamare() {
    const fuori = []
    const fin = Math.min(this.livello, ULTIMO)
    for (let l = 1; l <= fin; l++)
      for (const p of premiDi(l)) if (!this.reclamati[p.chiave]) fuori.push(p)
    return fuori
  }

  reclama(chiave) {
    const p = premioDi(chiave)
    if (!p) return { ok: false, motivo: 'non-esiste' }
    if (p.liv > this.livello) return { ok: false, motivo: 'non-arrivato', liv: p.liv }
    if (this.reclamati[chiave]) return { ok: false, motivo: 'gia-preso' }
    this.reclamati[chiave] = 1
    return { ok: true, premio: p }
  }

  // Non una scorciatoia per chi gioca: la usa la migrazione, il cheat, e chi scrive un test.
  reclamaTutto() {
    for (const p of this.daReclamare()) this.reclamati[p.chiave] = 1
    return this
  }

  // La regola sta qui e non solo nel baule: la usa anche chi scrive un test.
  sbloccata(id) {
    const v = PER_ID[id]
    // Una voce stagionale non è premio di nessun livello: il cancello è la finestra dell'anno.
    if (!v) return false
    // Una sorpresa della fiera si apre avendola nel baule, non è un premio.
    if (v.fiera) return this.quantiNe(id) > 0
    return !!v.stagione || this.reclamato(chiaveDi('cosa', id))
  }

  colturaAperta(id) { return this.reclamato(chiaveDi('coltura', id)) }
  bestiaAperta(chi) { return this.reclamato(chiaveDi('bestia', chi)) }

  /* ═══════════ il terreno ═══════════ */
  mia(px, py) { return !!this.piazzole[chiave(px, py)] }

  cellaMia(cx, cy) {
    return this.mia(piazzolaDi(cx), piazzolaDi(cy))
  }

  // Si compra solo quello che tocca casa: la fattoria cresce da sé, non a macchia di leopardo.
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
    // Il mondo cresce subito: il pezzo appena preso ha già altra terra intorno da desiderare.
    const cresciuto = this.allarga()
    return { ok: true, costo, cresciuto }
  }

  // L'acqua è una macchia di celle, non un oggetto: il bordo lo decide chi disegna (scena/bordi.js).
  // terreno tiene solo le celle diverse dal prato: chi non è scritto è BASE.
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

  // Le due vecchie porte, tenute perché ci passa già del codice.
  dipingiAcqua(cx, cy) { return this.dipingi(cx, cy, 'acqua') }
  togliAcqua(cx, cy) { return this.spiana(cx, cy) }

  /* ═══════════ chi occupa cosa ═══════════ */
  ingombro(cosa) {
    const p = piedeDi(cosa)
    return { x: cosa.x, y: cosa.y, w: p[0], h: p[1] }
  }

  // salta è quello che si sta spostando: va escluso qui, non dopo, se no si nasconderebbe da sé.
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

  // "Ci si posa?" e "ci si cammina?" sono lo stesso conto, tranne un punto: quello che il catalogo
  // dichiara sotto (orto, fiori) è terreno, non oggetto — ci si cammina sopra, non ci si posa.
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

  // Una domanda sola: prima erano quattro conti sparsi, e il disegno ne conosceva solo uno.
  calpestabile(cx, cy) { return this.cellaBuona(cx, cy, { camminando: true }) }

  libera(cx, cy, w, h, salta = null) {
    for (let i = 0; i < w; i++) for (let j = 0; j < h; j++)
      if (!this.cellaBuona(cx + i, cy + j, { salta })) return false
    return true
  }

  // Costa e basta, non rende: vedi dati/ostacoli.js.
  sgombra(cx, cy) {
    const o = this.ostacoloSotto(cx, cy)
    if (!o) return { ok: false, motivo: 'niente-da-sgombrare' }
    if (this.borsa.quante() < o.costo) return { ok: false, motivo: 'poche-monete', costo: o.costo }
    this.spendi(o.costo)
    delete this.ostacoli[o.k]
    return { ok: true, costo: o.costo, tipo: o.tipo }
  }

  posa(id, cx, cy, { sposta = null, g = null } = {}) {
    const v = PER_ID[id]
    if (!v) return { ok: false, motivo: 'non-esiste' }
    // Non ancora aperto non si posa, nemmeno dal magazzino; spostare resta libero (è già tua).
    if (!sposta && !this.sbloccata(id))
      return { ok: false, motivo: 'non-sbloccato', liv: livelloDellaVoce(v) }
    // Un silo per tipo: si guarda la mappa e non il baule (a differenza di compra), se no un silo
    // messo via non si potrebbe più rimettere giù — l'unico modo di perdere qualcosa per sempre.
    if (!sposta && v.unico && this.quantiInMappa(id) > 0)
      return { ok: false, motivo: 'ne-hai-gia' }
    const finto = { id, g: g === null ? (sposta ? sposta.g : 0) : g }
    const [w, h] = piedeDi(finto, v)
    if (!this.libera(cx, cy, w, h, sposta)) return { ok: false, motivo: 'non-ci-sta' }

    if (sposta) {
      // Rimetterla esattamente dov'era è gratis: cambiare idea a metà gesto non è un errore.
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
      // Una macchina dal baule riprende la fila più lunga fra quelle messe via con lei.
      const riposte = this.fileRiposte[id]
      if (riposte && riposte.length) {
        riposte.sort((a, b) => b - a)
        cosa.fila = riposte.shift()
        if (!riposte.length) delete this.fileRiposte[id]
      }
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

  // I versi li conta il catalogo (quantiVersi); un quarto di giro dispari scambia larghezza e
  // profondità, e se girata non ci sta si torna com'era.
  gira(cosa) {
    const v = PER_ID[cosa.id]
    const versi = quantiVersi(v)
    if (!v || versi < 2) return { ok: false, motivo: 'non-si-gira' }
    const prima = cosa.g || 0
    const dopo = (prima + 1) % versi
    cosa.g = dopo
    const [w, h] = piedeDi(cosa, v)
    if (!this.libera(cosa.x, cosa.y, w, h, cosa)) {
      cosa.g = prima
      return { ok: false, motivo: 'non-ci-sta' }
    }
    return { ok: true, verso: dopo }
  }

  // Lo specchio non tocca l'ingombro (stessi pixel, al contrario): non può mai fallire per posto,
  // per questo vive in un campo suo (cosa.m). I cartelli dei campi non si specchiano (la scritta).
  specchia(cosa) {
    const v = PER_ID[cosa.id]
    if (!puoSpecchiare(v)) return { ok: false, motivo: 'non-si-specchia' }
    if (cosa.m) delete cosa.m
    else cosa.m = 1
    return { ok: true, specchio: !!cosa.m }
  }

  // Una bestia si prende e si sposta come un oggetto: spostarla è il modo di metterla nel recinto.
  // Dove sta si salva (x,y): senza, il recinto si svuoterebbe da solo a ogni apertura.
  hoLaBestia(chi) { return this.bestie.some(b => b.chi === chi) }

  laBestia(chi) { return this.bestie.find(b => b.chi === chi) || null }

  compraBestia(chi, prezzo, nome = '', dove = null) {
    if (this.hoLaBestia(chi)) return { ok: false, motivo: 'gia-tua' }
    const a = ANIMALI[chi]
    if (a && !this.bestiaAperta(chi))
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

  // Gratis: una bestia dopo un minuto è già altrove per conto suo, farla pagare sarebbe una beffa.
  spostaBestia(chi, cx, cy) {
    const b = this.laBestia(chi)
    if (!b) return { ok: false, motivo: 'non-e-tua' }
    if (!this.calpestabile(cx, cy)) return { ok: false, motivo: 'non-ci-sta' }
    b.x = cx; b.y = cy
    return { ok: true, costo: 0, bestia: b }
  }

  // Dove l'avevamo lasciata, o la cella buona più vicina se quel posto non c'è più.
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

  // Annotato ogni tanto mentre cammina: rende vero "l'ho chiuso nel recinto" anche a gioco chiuso.
  annota(chi, cx, cy) {
    const b = this.laBestia(chi)
    if (!b) return false
    b.x = cx | 0; b.y = cy | 0
    return true
  }

  // Il calo si applica leggendo (non un orologio a parte): il conto non dipende da quanto spesso si guarda.
  stato(chi, ora = Date.now()) {
    const b = this.laBestia(chi)
    if (!b) return null
    if (typeof b.pancia !== 'number') Object.assign(b, bisogniNuovi(ora))
    return scendi(b, ora)
  }

  // Il cibo dev'essere il suo (gradisce); il rifiuto viene prima del pagamento: sbagliare costa solo il gesto.
  nutri(chi, cibo) {
    const b = this.stato(chi)
    if (!b) return { ok: false, motivo: 'non-e-tua' }
    if (!gradisce(cibo, famigliaDi(chi))) return { ok: false, motivo: 'non-gli-piace' }
    if (b.pancia > 0.93) return { ok: false, motivo: 'non-ha-fame' }
    // Un cibo si paga in monete o si scala dal granaio (già pagato coltivandolo); il controllo viene prima di tutto.
    if (cibo.da) {
      if (!this.quantoHo(cibo.da)) return { ok: false, motivo: 'manca-roba', prodotto: cibo.da }
      this.togli(cibo.da, 1)
    } else {
      if (this.borsa.quante() < cibo.prezzo)
        return { ok: false, motivo: 'poche-monete', costo: cibo.prezzo }
      this.spendi(cibo.prezzo)
    }
    const eraAPosto = tuttoAPosto(b)
    b.pancia = Math.min(1, b.pancia + cibo.quanto)
    b.quando = Date.now()
    return { ok: true, costo: cibo.prezzo || 0, prodotto: cibo.da || null,
             premio: this.premiaIlBenessere(chi, b, eraAPosto) }
  }

  // Se tutti e tre i bisogni sono nella fascia alta e prima non lo erano, paga esperienza — vedi dati/bisogni.js.
  premiaIlBenessere(chi, b, eraAPosto) {
    if (!premiaSeStaBene(b, eraAPosto)) return null
    const xp = premioBenessere(chi)
    return { xp, salito: this.guadagna(xp) }
  }

  // Spazzolare resta gratis, giocare costa una monetina — il perché sta in dati/bisogni.js.
  coccola(chi, gesto) {
    const b = this.stato(chi)
    if (!b) return { ok: false, motivo: 'non-e-tua' }
    if (b[gesto.bisogno] > 0.93) return { ok: false, motivo: 'non-serve' }
    // Si paga in monete o roba del granaio (la lana, già pagata tenendo pecore); il rifiuto viene prima.
    if (gesto.da) {
      if (!this.quantoHo(gesto.da)) return { ok: false, motivo: 'manca-roba', prodotto: gesto.da }
      this.togli(gesto.da, 1)
    } else {
      const costo = gesto.prezzo || 0
      if (this.borsa.quante() < costo) return { ok: false, motivo: 'poche-monete', costo }
      if (costo) this.spendi(costo)
    }
    const eraAPosto = tuttoAPosto(b)
    b[gesto.bisogno] = Math.min(1, b[gesto.bisogno] + gesto.quanto)
    b.quando = Date.now()
    return { ok: true, costo: gesto.prezzo || 0, prodotto: gesto.da || null,
             premio: this.premiaIlBenessere(chi, b, eraAPosto) }
  }

  // Gratis e sempre: far pagare un ripensamento sul nome è il modo più rapido di non sceglierne uno.
  rinominaBestia(chi, nome) {
    const b = this.laBestia(chi)
    if (!b) return { ok: false, motivo: 'non-e-tua' }
    b.nome = String(nome || '').slice(0, 16).trim()
    return { ok: true, nome: b.nome }
  }

  // Catalogo in dati/addobbi.js, agganci nella scheda dell'animale. Due cassetti come per le cose
  // del prato (addosso / guardaroba); un aggancio tiene una cosa sola, il secondo sposta il primo.
  quantiAddobbi(id) { return (this.guardaroba || {})[id] || 0 }

  addobbiDi(chi) {
    const b = this.laBestia(chi)
    return (b && b.addobbi) || {}
  }

  comeEVestita(chi) { return addossoA(this.addobbiDi(chi)) }

  // In vendita più il sospeso che il bambino ha già (guardaroba o addosso).
  vestiarioDi(chi) {
    const tieni = Object.keys(this.guardaroba || {}).filter(id => this.quantiAddobbi(id) > 0)
    return addobbiPer(chi, [...tieni, ...Object.values(this.addobbiDi(chi))])
  }

  compraAddobbo(id) {
    const a = ADDOBBI_PER_ID[id]
    if (!a) return { ok: false, motivo: 'non-esiste' }
    // Un sospeso esiste (si rilegge, si mette, si toglie) ma non si vende.
    if (a.sospeso) return { ok: false, motivo: 'sospeso' }
    if (this.borsa.quante() < a.prezzo)
      return { ok: false, motivo: 'poche-monete', costo: a.prezzo }
    this.spendi(a.prezzo)
    this.guardaroba[id] = this.quantiAddobbi(id) + 1
    return { ok: true, costo: a.prezzo, addobbo: a }
  }

  // "Non ce l'hai" si risolve comprando, "non gli sta" no (non è fra i suoi agganci, e non lo sarà mai).
  vestiBestia(chi, id) {
    const b = this.laBestia(chi)
    if (!b) return { ok: false, motivo: 'non-e-tua' }
    const a = ADDOBBI_PER_ID[id]
    if (!a) return { ok: false, motivo: 'non-esiste' }
    if (!staA(id, chi)) return { ok: false, motivo: 'non-gli-sta', dove: a.dove }
    if (!b.addobbi) b.addobbi = {}
    // Quello che c'era su quell'aggancio torna nel guardaroba: si cambia, non se ne perde uno.
    const prima = b.addobbi[a.dove]
    // "Ce l'ha già addosso" si guarda prima di "non ce l'hai", se no ripremerlo lo farebbe ricomprare.
    if (prima === id) return { ok: false, motivo: 'gia-addosso' }
    if (this.quantiAddobbi(id) < 1) return { ok: false, motivo: 'non-ce-lhai', costo: a.prezzo }
    if (prima) this.guardaroba[prima] = this.quantiAddobbi(prima) + 1
    this.guardaroba[id]--
    if (!this.guardaroba[id]) delete this.guardaroba[id]
    b.addobbi[a.dove] = id
    return { ok: true, addobbo: a, tolto: prima || null }
  }

  // Un primato e non un contatore: mettere e togliere lo stesso cappello venti volte non vale venti.
  get addobbiAddosso() {
    return this.bestie.reduce((n, b) => n + Object.keys(b.addobbi || {}).length, 0)
  }

  spogliaBestia(chi, dove) {
    const b = this.laBestia(chi)
    if (!b || !b.addobbi || !b.addobbi[dove]) return { ok: false, motivo: 'non-lo-porta' }
    const id = b.addobbi[dove]
    delete b.addobbi[dove]
    this.guardaroba[id] = this.quantiAddobbi(id) + 1
    return { ok: true, id }
  }

  // Il raccolto, non il magazzino (vedi in testa al file) — due silos separati, si ingrandiscono pagando.
  quantoHo(prodotto) { return this.granaio[prodotto] || 0 }

  // Costruito vuol dire in mappa: uno in magazzino non contiene ancora niente.
  siloIn(famiglia) { return this.cose.find(c => siloDi(c) === famiglia) || null }

  eCostruito(famiglia) { return !!this.siloIn(famiglia) }

  livelloDelSilo(famiglia) {
    return SILI[famiglia] ? Math.max(0, (this.silos || {})[famiglia] | 0) : 0
  }

  // Zero è diverso da piccolo: senza silo non c'è dove finire (silo-manca contro non-ci-sta).
  capienzaDi(famiglia) {
    return this.eCostruito(famiglia) ? postiPerMerce(this.livelloDelSilo(famiglia)) : 0
  }

  quantoHoNelSilo(famiglia) {
    return Object.entries(this.granaio)
      .reduce((n, [k, q]) => n + (siloDelProdotto(k) === famiglia ? q : 0), 0)
  }

  // Uno scomparto pieno non ferma le altre merci né l'altro silo.
  quantoCiSta(prodotto) {
    const fam = siloDelProdotto(prodotto)
    if (!fam) return 0
    return Math.max(0, this.capienzaDi(fam) - this.quantoHo(prodotto))
  }

  // "costruisci il silo" e "ingrandiscilo" sono due cose da fare diverse: il motivo conta.
  perchePieno(prodotto) {
    const fam = siloDelProdotto(prodotto)
    return { famiglia: fam, motivo: this.eCostruito(fam) ? 'silo-pieno' : 'silo-manca' }
  }

  // Il silo non racconta il futuro: mostra solo gli scomparti già aperti (o con roba dentro), mai
  // quelli di merci che arriveranno fra mesi — quella sorpresa è un premio di livello, non un elenco.
  merciAperte(famiglia) {
    return merciDi(famiglia).filter(
      p => this.quantoHo(p) > 0 || this.ottenibile(p))
  }

  // Una coltura già aperta, o una ricetta ottenibile a sua volta; giri ferma un anello (PROFONDITA).
  ottenibile(prodotto, giri = PROFONDITA) {
    if (giri <= 0) return false
    for (const c of COLTURE)
      if (c.da === prodotto && this.colturaAperta(c.id)) return true
    for (const r of RICETTE) {
      if (r.da !== prodotto) continue
      if ((r.liv || 1) > this.livello) continue
      const m = laMacchina(r.dove)
      if (m && !this.sbloccata(m.id)) continue
      if (Object.keys(r.prende || {}).every(k => this.ottenibile(k, giri - 1))) return true
    }
    return false
  }

  scomparti(famiglia) {
    const posti = this.capienzaDi(famiglia)
    return this.merciAperte(famiglia).map(prodotto => ({
      prodotto, posti, quanti: this.quantoHo(prodotto),
      pieno: posti > 0 && this.quantoHo(prodotto) >= posti,
    }))
  }

  /* Quanto costa il prossimo ingrandimento di questo silo. */
  costoDellIngrandimento(famiglia) {
    return costoIngrandimento(this.livelloDelSilo(famiglia))
  }

  // Nessun tetto: a fermare è il prezzo, che raddoppia il passo ogni volta.
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

  // Chi chiama decide cosa dirne: un raccolto che non ci sta non si raccoglie affatto (vedi raccogli).
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

  // coltura/seminato viaggiano sulla cosa; il tempo si legge dall'ora vera, non si aggiorna.
  // Niente marcisce: a crescita finita il campo resta pronto per sempre — vedi dati/coltivazioni.js.
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

  // seminaCampo e non semina: semina() è già il bosco che nasce dalle coordinate.
  seminaCampo(cosa, colturaId, ora = Date.now()) {
    const s = this.statoCampo(cosa)
    if (!s) return { ok: false, motivo: 'non-e-un-campo' }
    if (!s.vuoto) return { ok: false, motivo: 'gia-seminato' }
    const c = PER_COLTURA[colturaId]
    if (!c) return { ok: false, motivo: 'non-esiste' }
    if (!this.colturaAperta(c.id))
      return { ok: false, motivo: 'non-sbloccato', liv: c.liv }
    if (this.borsa.quante() < c.semina)
      return { ok: false, motivo: 'poche-monete', costo: c.semina }
    if (c.semina) this.spendi(c.semina)
    cosa.coltura = c.id
    cosa.seminato = ora
    return { ok: true, costo: c.semina, coltura: c }
  }

  // A zero monete non si perde niente: il campo resta pronto. Il silo pieno si comporta uguale.
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

  // Un pezzo alla volta, gli altri in fila (coda dentro la cosa, dati/coda.js). da è quando quel
  // pezzo parte (si legge dall'ora, come i campi); la roba si prende mettendo in fila, non a lavoro finito.
  statoMacchina(cosa, ora = Date.now()) {
    const quale = macchinaDi(cosa)
    if (!quale) return null
    const posti = postiDellaFila(cosa.fila)
    const coda = (cosa.coda || []).map((p, i) => {
      const r = PER_RICETTA[p.ricetta]
      if (!r) return null
      const fine = p.da + r.minuti * MINUTO
      const pronto = ora >= fine
      const partito = ora >= p.da
      return { i, ricetta: r, da: p.da, fine, pronto,
               lavora: partito && !pronto, aspetta: !partito,
               quanto: quantoCresciuto(p.da, r.minuti, ora),
               manca: pronto ? 0 : Math.max(1, Math.ceil((fine - ora) / MINUTO)) }
    }).filter(Boolean)
    const lavora = coda.find(p => p.lavora) || null
    const pronti = coda.filter(p => p.pronto)
    const primo = lavora || pronti[0] || null
    return {
      macchina: quale, coda, posti, liberi: Math.max(0, posti - coda.length),
      /* quante volte è stata ingrandita, e quanto costa la prossima */
      fila: cosa.fila || 0, prezzoFila: prezzoDellaFila(cosa.fila),
      lavora, pronti: pronti.length,
      /* in fila e non ancora partiti */
      inAttesa: coda.filter(p => p.aspetta).length,
      /* Le quattro parole di prima, rilette sulla fila. `ferma` è la
         macchina **vuota** — niente dentro, né da fare né da ritirare —
         e `libera` quella dove si può mettere qualcosa, che adesso è
         un'altra domanda: un mulino che macina ha ancora due posti. */
      ferma: !coda.length,
      libera: coda.length < posti,
      pronto: pronti.length > 0,
      ricetta: primo ? primo.ricetta : null,
      quanto: lavora ? lavora.quanto : pronti.length ? 1 : 0,
      manca: lavora ? lavora.manca : 0,
    }
  }

  // Un tasto spento senza il perché è un tasto rotto: qui il perché è sempre un numero.
  cheMancaPer(ricettaId) {
    const r = PER_RICETTA[ricettaId]
    if (!r) return null
    const manca = []
    for (const [k, n] of Object.entries(r.prende))
      if (this.quantoHo(k) < n) manca.push({ prodotto: k, quanti: n - this.quantoHo(k) })
    return { manca, monete: Math.max(0, r.costo - this.borsa.quante()) }
  }

  // Si chiama ancora avvia perché a macchina vuota è esattamente quello.
  avvia(cosa, ricettaId, ora = Date.now()) {
    const s = this.statoMacchina(cosa, ora)
    if (!s) return { ok: false, motivo: 'non-e-una-macchina' }
    const r = PER_RICETTA[ricettaId]
    if (!r || r.dove !== s.macchina) return { ok: false, motivo: 'non-esiste' }
    if (!s.libera) return { ok: false, motivo: 'fila-piena', posti: s.posti }
    const che = this.cheMancaPer(ricettaId)
    if (che.manca.length) return { ok: false, motivo: 'manca-roba', manca: che.manca }
    if (this.borsa.quante() < r.costo)
      return { ok: false, motivo: 'poche-monete', costo: r.costo }
    // Prima la roba, poi le monete, poi si parte: i controlli sopra escludono un fallimento a metà.
    for (const [k, n] of Object.entries(r.prende)) this.togli(k, n)
    if (r.costo) this.spendi(r.costo)
    // Parte quando finisce l'ultimo che c'è, pronto o no: un pronto non ritirato non fa aspettare nessuno.
    const da = Math.max(ora, ...s.coda.map(p => p.fine))
    cosa.coda = [...(cosa.coda || []), { ricetta: r.id, da }]
    return { ok: true, costo: r.costo, ricetta: r, da,
             fine: da + r.minuti * MINUTO, subito: da === ora }
  }

  // Un pezzo non ancora partito rende tutto (roba, monete, esperienza) e chi veniva dopo si fa avanti.
  // Se il silo non ha più posto il pezzo resta in fila: meglio un no che perdere qualcosa.
  togliDallaFila(cosa, indice, ora = Date.now()) {
    const s = this.statoMacchina(cosa, ora)
    if (!s) return { ok: false, motivo: 'non-e-una-macchina' }
    const p = s.coda.find(q => q.i === indice)
    if (!p) return { ok: false, motivo: 'non-in-fila' }
    if (!p.aspetta) return { ok: false, motivo: p.pronto ? 'e-pronto' : 'sta-lavorando' }
    const r = p.ricetta
    for (const [k, n] of Object.entries(r.prende))
      if (this.quantoCiSta(k) < n) return { ok: false, ...this.perchePieno(k), prodotto: k, quanto: n }
    for (const [k, n] of Object.entries(r.prende)) this.metti(k, n)
    if (r.costo) {
      const tieni = Math.max(0, sogliaDi(this.livello) - (this.guadagnato || 0))
      this.speso = Math.max(Math.min(this.speso, tieni), (this.speso || 0) - r.costo)
      this.borsa.paga(-r.costo)
    }
    const coda = cosa.coda.filter((_, i) => i !== indice)
    /* la catena da rifare: chi aspettava dopo il pezzo tolto */
    for (let i = indice; i < coda.length; i++) {
      if (coda[i].da <= ora) continue
      const prima = coda[i - 1]
      const rp = prima && PER_RICETTA[prima.ricetta]
      coda[i] = { ...coda[i],
                  da: rp ? Math.max(ora, prima.da + rp.minuti * MINUTO) : ora }
    }
    if (coda.length) cosa.coda = coda
    else delete cosa.coda
    return { ok: true, ricetta: r, reso: { ...r.prende }, monete: r.costo }
  }

  // Gratis (si paga mettendo in fila); prende tutto quello che ci sta, un pezzo non si spezza.
  ritira(cosa, ora = Date.now()) {
    const s = this.statoMacchina(cosa, ora)
    if (!s) return { ok: false, motivo: 'non-e-una-macchina' }
    if (s.ferma) return { ok: false, motivo: 'non-sta-lavorando' }
    if (!s.pronto) return { ok: false, motivo: 'non-e-pronto', manca: s.manca }
    const presi = [], via = new Set()
    let fermo = null
    for (const p of s.coda) {
      if (!p.pronto) continue
      const r = p.ricetta
      if (this.quantoCiSta(r.da) < r.resa) { fermo = fermo || r; continue }
      this.metti(r.da, r.resa)
      via.add(p.i)
      const gia = presi.find(x => x.prodotto === r.da)
      if (gia) gia.quanto += r.resa
      else presi.push({ prodotto: r.da, quanto: r.resa })
    }
    if (!presi.length)
      return { ok: false, ...this.perchePieno(fermo.da), prodotto: fermo.da, quanto: fermo.resa }
    const coda = cosa.coda.filter((_, i) => !via.has(i))
    if (coda.length) cosa.coda = coda
    else delete cosa.coda
    // prodotto/quanto sono il primo preso (per una riga sola); presi è tutto.
    return { ok: true, costo: 0, prodotto: presi[0].prodotto, quanto: presi[0].quanto,
             presi, restano: s.pronti - via.size,
             ...(fermo ? { fermo: fermo.da, ...this.perchePieno(fermo.da) } : {}) }
  }

  ingrandisciLaFila(cosa) {
    if (!macchinaDi(cosa)) return { ok: false, motivo: 'non-e-una-macchina' }
    const costo = prezzoDellaFila(cosa.fila)
    if (costo === null) return { ok: false, motivo: 'al-massimo' }
    if (this.borsa.quante() < costo) return { ok: false, motivo: 'poche-monete', costo }
    this.spendi(costo)
    cosa.fila = (cosa.fila || 0) + 1
    return { ok: true, costo, posti: postiDellaFila(cosa.fila) }
  }

  // La scena chiede solo "cosa si vede sopra, adesso" (nome tessera + fumetto), mai il grano stesso.
  // sopra si ripete su ogni cella del piede.
  aspettoDellaCosa(cosa, ora = Date.now()) {
    // La bancarella non lavora né contiene: aspetta. Muta quando non c'è niente da portare.
    if (eMercato(cosa))
      return qualcosaDaConsegnare(this) ? { sopra: null, fumetto: '📋' } : null
    if (postoDi(cosa))
      return daConsegnareIn(this, cosa.id) ? { sopra: null, fumetto: '📋' } : null
    if (eMongolfiera(cosa)) return aspettoDellaMongolfiera(this, cosa, ora)
    const c = this.statoCampo(cosa, ora)
    if (c) {
      if (c.vuoto) return null
      // alto: il mais maturo è due volte più alto del suo piede, e va ordinato come un oggetto.
      return { sopra: c.stadio, alto: true, fumetto: c.pronto ? '🧺' : null }
    }
    const m = this.statoMacchina(cosa, ora)
    if (!m) return null
    // Un recinto non mette niente sopra: cambia disegno (la faccia dell'animale).
    const stati = statiDi(cosa)
    if (stati) {
      const posa = this.posaDelRecinto(m)
      return {
        invece: stati[posa],
        fumetto: m.pronto ? '🧺' : null,
        /* quanti ce ne sono da ritirare: il 🧺 dice che c'è da fare,
           il numerino quanto — con la fila possono essere tre */
        pronti: m.pronti,
        // Cosa vuole, quando ha fame: non è più dipinto nello sprite (due bestie con la stessa
        // fame avevano disegni diversi). Esce il nome del prodotto, non un disegno.
        vuole: posa === 'fame' ? this.cosaVuole(cosa) : null,
      }
    }
    // Una macchina al lavoro dice cosa sta facendo (non più una clessidra uguale per tutte):
    // il fienile ha quattro ricette, il mulino due.

    // Con la fila vince la faccia di quello che sta facendo, col numerino dei pronti accanto.
    if (m.lavora) {
      const r = m.lavora.ricetta
      const p = PRODOTTI[r.da]
      return { sopra: null,
               fa: p ? { prodotto: r.da, pezzo: p.pezzo || null, testo: p.emoji } : null,
               fumetto: p ? null : '⏳', pronti: m.pronti }
    }
    if (m.pronto) return { sopra: null, fumetto: '🧺', pronti: m.pronti }
    return null
  }

  // Quale dei sei ritratti: le soglie stanno qui (leggono l'orologio), i nomi nel catalogo.
  // Ferma vuol dire ha fame, non "è tranquilla"; con la fila conta solo chi sta lavorando adesso.
  posaDelRecinto(m) {
    const l = m.lavora
    if (!l) return m.pronto ? 'pronto' : 'fame'
    if (l.quanto < 0.34) return 'mangia'
    if (l.quanto < 0.7) return 'felice'
    return 'dorme'
  }

  // Il primo ingrediente della prima ricetta che il recinto sa fare a questo livello (non tutti:
  // il fumetto è una cosa sola). Il livello conta: non manda a cercare roba non ancora aperta.
  cosaVuole(cosa) {
    const quale = macchinaDi(cosa)
    if (!quale) return null
    const r = ricetteDi(quale, this.livello)[0]
    if (!r) return null
    const id = Object.keys(r.prende || {})[0]
    const p = id && PRODOTTI[id]
    if (!p) return null
    // Esce una faccia già decisa (pezzo+testo), non il nome di una merce: la scena non sa cos'è il foraggio.
    return { prodotto: id, pezzo: p.pezzo || null, testo: p.emoji }
  }

  /* ═══════════ il magazzino ═══════════ */
  quantiNe(id) { return this.magazzino[id] || 0 }

  // Quante ne ho giù (in mappa): un silo nel baule non occupa nessun posto.
  quantiInMappa(id) {
    return this.cose.reduce((n, c) => n + (c.id === id ? 1 : 0), 0)
  }

  // In tutto (mappa + baule): conta tutte e due, se no rimettere via e ricomprare pagherebbe sempre il prezzo base.
  quanteNeHo(id) {
    return this.quantiNe(id) + this.quantiInMappa(id)
  }

  // Quasi tutte costano sempre uguale; il campo rincara a ogni copia. Ci passano posa e baule, mai due conti diversi.
  quantoCosta(id) {
    return prezzoDellaVoce(PER_ID[id], this.quanteNeHo(id))
  }

  // Costa quanto spostare (il perché in testa al file); i due no che vengono prima sono gratis.
  mettiVia(cosa) {
    const i = this.cose.indexOf(cosa)
    if (i < 0) return { ok: false, motivo: 'non-in-mappa' }
    // Un campo seminato o una macchina al lavoro non si mettono via: nel baule non c'è posto per una cosa a metà.
    if (cosa.coltura) return { ok: false, motivo: 'campo-seminato' }
    if (cosa.coda && cosa.coda.length) return { ok: false, motivo: 'sta-lavorando' }
    if (this.borsa.quante() < COSTO_SPOSTARE)
      return { ok: false, motivo: 'poche-monete', costo: COSTO_SPOSTARE }
    this.spendi(COSTO_SPOSTARE)
    this.cose.splice(i, 1)
    if (cosa.fila > 0) (this.fileRiposte[cosa.id] = this.fileRiposte[cosa.id] || []).push(cosa.fila)
    this.magazzino[cosa.id] = this.quantiNe(cosa.id) + 1
    return { ok: true, costo: COSTO_SPOSTARE, id: cosa.id }
  }

  // Dal baule non ci passa più nessuno (si paga posando), ma resta: chi mette via una cosa la ritrova qui.
  compra(id) {
    const v = PER_ID[id]
    if (!v) return { ok: false, motivo: 'non-esiste' }
    /* La fiera non si vende: si vince (`motore/mongolfiera.js`). */
    if (v.fiera) return { ok: false, motivo: 'non-in-vendita' }
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

  // Cerca a cerchi dal punto chiesto (primaLibera di motore/passi.js), mai a caso: un cane nato nel
  // bosco è un cane che non si trova più. Se non trova niente torna il punto chiesto.
  cellaLibera(cx, cy, raggio = 6) {
    return primaLibera((x, y) => this.calpestabile(x, y), { x: cx, y: cy }, raggio)
           || { x: cx, y: cy }
  }
}
