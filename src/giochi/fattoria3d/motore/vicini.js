/* I vicini: le regole di una visita, senza schermo (niente DOM, niente three, niente Vue) e senza sapere cos'è il profilo.
   `Vicini` lavora su due cose: il motore di casa (per togliere e dare roba, l'esperienza, le monete: tutto passa dai suoi metodi,
   mai dalla borsa direttamente) e le fattorie visitabili, che sono DATI (dati/vicini.js): la visita non tocca mai il mondo vivo di
   chi gioca. Tutto ciò che può non riuscire torna { ok: false, motivo, … } e non cambia niente. Vedi docs/fattoria3d/vicini.md.
   Il verso è quello di tutto il gioco: niente si vende per monete. Aiutare dà ESPERIENZA e roba del vicino; le monete escono
   (si compra), non entrano mai. */
import { COLTURE } from '../dati/colture.js'
import { RICETTE, emojiDi, nuovoId } from '../dati/ricette.js'
import { PRODOTTI_ANIMALI } from '../dati/animali.js'
import { PEZZI, EDIFICI } from '../dati/catalogo.js'
import { lottoDi, dentro, chiave, idCella, cellaDa, cellaDaId, stradeDiSerie, lottoPerId } from '../dati/mondo.js'
import { generaLotto } from '../dati/lotti.js'
import { premioDi } from '../dati/ordini.js'
import { VICINI, VERSIONE_VISITA, normalizzaFattoriaVisitabile, merce, livelloDellaMerce, prezzoPer, premioMassimo,
         POSTO_CASSA, POSTO_MERCATO, MISURE_POSTI, RINNOVO_CASSA_MS, RINNOVO_MERCATO_MS } from '../dati/vicini.js'
import { Fattoria3d } from './fattoria3d.js'
import { VERSIONE_STATO } from './stato.js'

export const VERSIONE_VICINI = 1
export const VOLTE_PER_BARATTO = 2          // quante volte si può fare lo stesso baratto prima che il vicino aspetti
const ORA_VISITA = 1_000_000_000_000        // l'orologio della scena di una visita: fermo, così il grano non cambia e niente scade

const oggetto = v => v && typeof v === 'object' && !Array.isArray(v) ? v : {}
const numero = (v, d = 0) => Number.isFinite(v) && v >= 0 ? v : d
const contatori = v => Object.fromEntries(Object.entries(oggetto(v)).filter(([k, n]) => typeof k === 'string' && k.length < 40 && numero(n) > 0).map(([k, n]) => [k, Math.floor(numero(n))]))
/** Come `contatori`, ma le chiavi sono merci: quelle di prima della 2D si traducono (e si sommano). Per cassa e mercato. */
const contatoriDiMerci = v => {
  const out = {}
  for (const [k, n] of Object.entries(contatori(v))) { const nuovo = nuovoId(k); out[nuovo] = (out[nuovo] || 0) + n }
  return out
}

// ── lo stato che si salva (profile.campagne.fattoria3d.cfg.vicini), a parte da quello della fattoria ──
export const statoVicini = () => ({ v: VERSIONE_VICINI, visite: {}, cassa: {}, mercato: {} })

/** Rimette in forma lo stato letto (o niente): mai un'eccezione. Chi non c'è più (un vicino tolto) si scorda da sé al salvataggio. */
export function normalizzaVicini(letto) {
  const s = statoVicini()
  if (!letto || typeof letto !== 'object') return s
  s.visite = contatori(letto.visite)
  for (const [id, c] of Object.entries(oggetto(letto.cassa)).slice(0, 40)) {
    const x = oggetto(c)
    s.cassa[id] = { date: contatoriDiMerci(x.date), riapre: Number.isFinite(x.riapre) ? x.riapre : null }
  }
  for (const [id, m] of Object.entries(oggetto(letto.mercato)).slice(0, 40)) {
    const x = oggetto(m)
    s.mercato[id] = { venduti: contatoriDiMerci(x.venduti), scambi: contatori(x.scambi), rinnovo: Number.isFinite(x.rinnovo) ? x.rinnovo : null }
  }
  return s
}

/** Mette `n` di `k` nelle scorte di chi gioca (i raccolti in `merci`, i prodotti in `prodotti`). */
export function dai(motore, k, n) {
  if (COLTURE[k]) motore.s.merci[k] = (motore.s.merci[k] || 0) + n
  else motore.s.prodotti[k] = (motore.s.prodotti[k] || 0) + n
}

const dettaglio = k => { const m = merce(k) || {}; return { k, nome: m.nome || k, emoji: emojiDi(k, COLTURE) } }

export class Vicini {
  /** `motore`: la Fattoria3d di chi gioca. `fattorie`: gli snapshot già in forma (di serie i quattro villaggi). */
  constructor({ motore, stato = null, fattorie = VICINI } = {}) {
    this.m = motore
    this.s = normalizzaVicini(stato)
    this.fattorie = new Map()
    for (const f of fattorie) this.aggiungi(f)
  }

  /** Aggiunge (o sostituisce) una fattoria visitabile da un dato qualunque. Torna lo snapshot normalizzato o null. */
  aggiungi(letto) {
    const f = normalizzaFattoriaVisitabile(letto)
    if (f) this.fattorie.set(f.id, f)
    return f
  }
  fattoria(id) { return this.fattorie.get(id) || null }
  ora() { return this.m.ora() }

  // ── la mappa ──
  /** I villaggi in ordine di livello: quelli che non si possono ancora visitare dicono il livello. */
  elenco() {
    const liv = this.m.livello()
    return [...this.fattorie.values()].sort((a, b) => a.liv - b.liv).map(f => ({
      id: f.id, nome: f.nome, emoji: f.proprietario.emoji, proprietario: f.proprietario.nome, tema: f.tema, liv: f.liv,
      aperto: f.liv <= liv, visite: this.s.visite[f.id] || 0, cassa: this.cassaAperta(f.id),
    }))
  }
  _chiusa(f) { return f.liv > this.m.livello() ? { ok: false, motivo: 'non-sbloccato', liv: f.liv } : null }

  /** Si entra in un villaggio: conta una visita. Torna lo snapshot da disegnare. */
  entra(id) {
    const f = this.fattoria(id)
    if (!f) return { ok: false, motivo: 'sconosciuto' }
    const no = this._chiusa(f); if (no) return no
    this.s.visite[id] = (this.s.visite[id] || 0) + 1
    this.m._evento('visita', { vicino: id })
    return { ok: true, fattoria: f }
  }

  // ── la cassa: si riempie con roba precisa, un po' alla volta ──
  _cassa(id) {
    const f = this.fattoria(id)
    let c = this.s.cassa[id]
    if (!c) c = this.s.cassa[id] = { date: {}, riapre: null }
    if (c.riapre !== null && this.ora() >= c.riapre) { c.date = {}; c.riapre = null }       // il tempo avanza anche a pagina chiusa
    return { c, f }
  }
  cassaAperta(id) { const { c } = this._cassa(id); return c.riapre === null }
  _cassaPiena(f, c) { return f.cassa.chiede.length > 0 && f.cassa.chiede.every(x => (c.date[x.k] || 0) >= x.n) }

  /** Consegna alla cassa fino a `n` pezzi di `k` (di serie tutto quello che serve e che si ha). Dà esperienza a ogni consegna e, a
      cassa piena, il dono del vicino. Non toglie e non dà monete. */
  aiuta(id, k, n = Infinity) {
    const f = this.fattoria(id)
    if (!f) return { ok: false, motivo: 'sconosciuto' }
    const no = this._chiusa(f); if (no) return no
    const { c } = this._cassa(id), voce = f.cassa.chiede.find(x => x.k === k)
    if (!voce) return { ok: false, motivo: 'non-chiesto' }
    if (c.riapre !== null) return { ok: false, motivo: 'cassa-piena', restoMs: Math.max(0, c.riapre - this.ora()) }
    const manca = voce.n - (c.date[k] || 0)
    if (manca <= 0) return { ok: false, motivo: 'gia-pronto' }
    const ha = this.m.scortaDi(k)
    if (ha <= 0) return { ok: false, motivo: 'mancano', mancano: { [k]: manca } }
    const q = Math.max(1, Math.min(manca, ha, Number.isFinite(n) ? Math.floor(n) : manca))
    this.m._togli(k, q)
    c.date[k] = (c.date[k] || 0) + q
    const premio = premioDi({ [k]: q })
    this.m._guadagna(premio)
    this.m._evento('aiuto', { vicino: id, come: 'cassa', n: q })
    const r = { ok: true, k, n: q, premio, completa: false, dono: null }
    if (this._cassaPiena(f, c)) {
      c.riapre = this.ora() + f.cassa.rinnovoMs
      r.completa = true
      if (f.cassa.dono) { dai(this.m, f.cassa.dono.k, f.cassa.dono.n); r.dono = { ...f.cassa.dono } }
      this.m._evento('cassa-piena', { vicino: id, dono: r.dono })
    }
    return r
  }

  // ── il mercato ──
  _mercato(id) {
    let m = this.s.mercato[id]
    if (!m) m = this.s.mercato[id] = { venduti: {}, scambi: {}, rinnovo: null }
    if (m.rinnovo !== null && this.ora() >= m.rinnovo) { m.venduti = {}; m.scambi = {}; m.rinnovo = null }
    return m
  }
  _avviaRinnovo(f, m) { if (m.rinnovo === null) m.rinnovo = this.ora() + f.mercato.rinnovoMs }
  restoMercatoMs(id) { const m = this._mercato(id); return m.rinnovo === null ? 0 : Math.max(0, m.rinnovo - this.ora()) }

  /** Si compra da lui, in monete: `n` pezzi di `k` al prezzo scritto sul banco. I pezzi finiscono nelle scorte. Niente esperienza:
      le monete cambiano forma, non si creano (e il livello sale solo spendendo per costruire). */
  compra(id, k, n = 1) {
    const f = this.fattoria(id)
    if (!f) return { ok: false, motivo: 'sconosciuto' }
    const no = this._chiusa(f); if (no) return no
    const voce = f.mercato.vende.find(x => x.k === k)
    if (!voce) return { ok: false, motivo: 'non-venduto' }
    const m = this._mercato(id), rimasti = voce.n - (m.venduti[k] || 0)
    if (rimasti <= 0) return { ok: false, motivo: 'esaurito', restoMs: this.restoMercatoMs(id) }
    const q = Math.max(1, Math.min(rimasti, Math.floor(n) || 1)), costo = voce.prezzo * q
    if (this.m.monete() < costo) return { ok: false, motivo: 'poche-monete', costo, mancano: costo - this.m.monete() }
    if (!this.m._paga(costo)) return { ok: false, motivo: 'poche-monete', costo, mancano: costo }
    dai(this.m, k, q)
    m.venduti[k] = (m.venduti[k] || 0) + q
    this._avviaRinnovo(f, m)
    this.m._evento('aiuto', { vicino: id, come: 'acquisto', n: q })
    return { ok: true, k, n: q, costo }
  }

  /** Si vende a lui: il baratto numero `i` (consegni `n` di `k`, ricevi esperienza e, se c'è, roba sua). Mai monete. */
  vendi(id, i) {
    const f = this.fattoria(id)
    if (!f) return { ok: false, motivo: 'sconosciuto' }
    const no = this._chiusa(f); if (no) return no
    const b = f.mercato.compra[i]
    if (!b) return { ok: false, motivo: 'non-comprato' }
    const m = this._mercato(id)
    if ((m.scambi[i] || 0) >= VOLTE_PER_BARATTO) return { ok: false, motivo: 'esaurito', restoMs: this.restoMercatoMs(id) }
    const ha = this.m.scortaDi(b.k)
    if (ha < b.n) return { ok: false, motivo: 'mancano', mancano: { [b.k]: b.n - ha } }
    this.m._togli(b.k, b.n)
    m.scambi[i] = (m.scambi[i] || 0) + 1
    this._avviaRinnovo(f, m)
    this.m._guadagna(b.premio)
    if (b.da) dai(this.m, b.da.k, b.da.n)
    this.m._evento('aiuto', { vicino: id, come: 'vendita', n: b.n })
    return { ok: true, k: b.k, n: b.n, premio: b.premio, da: b.da ? { ...b.da } : null }
  }

  // ── cosa si vede: una fotografia pronta per il foglio (la vista non fa conti) ──
  scheda(id) {
    const f = this.fattoria(id); if (!f) return null
    const { c } = this._cassa(id), m = this._mercato(id), ora = this.ora()
    const monete = this.m.monete()
    return {
      id, nome: f.nome, proprietario: f.proprietario, storia: f.storia, liv: f.liv,
      cassa: {
        righe: f.cassa.chiede.map(x => {
          const dato = Math.min(x.n, c.date[x.k] || 0), ha = this.m.scortaDi(x.k)
          return { ...dettaglio(x.k), n: x.n, dato, ha, finita: dato >= x.n, puoi: dato < x.n && ha > 0 && c.riapre === null }
        }),
        chiusa: c.riapre !== null, restoMs: c.riapre === null ? 0 : Math.max(0, c.riapre - ora),
        dono: f.cassa.dono ? { ...dettaglio(f.cassa.dono.k), n: f.cassa.dono.n } : null,
      },
      mercato: {
        restoMs: m.rinnovo === null ? 0 : Math.max(0, m.rinnovo - ora),
        vende: f.mercato.vende.map(v => {
          const rimasti = v.n - (m.venduti[v.k] || 0)
          return { ...dettaglio(v.k), prezzo: v.prezzo, rimasti, esaurito: rimasti <= 0, ha: this.m.scortaDi(v.k), puoi: rimasti > 0 && monete >= v.prezzo }
        }),
        compra: f.mercato.compra.map((b, i) => {
          const rimasti = VOLTE_PER_BARATTO - (m.scambi[i] || 0), ha = this.m.scortaDi(b.k)
          return { i, ...dettaglio(b.k), n: b.n, ha, premio: b.premio, da: b.da ? { ...dettaglio(b.da.k), n: b.da.n } : null, rimasti, puoi: rimasti > 0 && ha >= b.n }
        }),
      },
    }
  }

  serializza() { return JSON.parse(JSON.stringify(this.s)) }
}

// ═════════ la scena di una visita: un motore di SOLA LETTURA costruito dallo snapshot ═════════

/** Lo stato di una `Fattoria3d` che rappresenta lo snapshot: campi com'erano, bestie al lavoro, e dentro la terra sua niente alberi né sassi. */
export function statoDaSnapshot(f) {
  const lotti = Object.fromEntries(f.lotti.map(id => [id, true]))
  const lottiTuoi = f.lotti.map(lottoPerId).filter(Boolean)
  const cose = f.cose.map((c, n) => {
    const x = { id: n + 1, tipo: c.tipo, i: c.i, j: c.j }
    if (c.tipo === 'campo') {
      x.coltura = c.coltura
      x.tile = Array.from({ length: 4 }, () => ORA_VISITA - Math.round(c.cresc * COLTURE[c.coltura].ms))        // la crescita è l'età: ORA − cresc·ms
    }
    if (c.tipo === 'recinto') x.pecore = Array.from({ length: c.pecore }, () => ({ eta: 'adulta', t0: ORA_VISITA - 1e9 }))
    if (c.bestie) x.bestie = Array.from({ length: c.bestie }, () => ({ fine: ORA_VISITA + 1e9 }))                // al lavoro: niente fame, niente uova da raccogliere
    return x
  })
  for (const e of f.edifici) cose.push({ id: cose.length + 1, tipo: e.tipo, i: e.i, j: e.j })          // gli edifici stanno dove dice lo snapshot
  return {
    v: VERSIONE_STATO, lotti, strade: f.strade, cose,
    posseduti: Object.fromEntries(f.edifici.map(e => [e.tipo, true])),
    tagliati: lottiTuoi.flatMap(l => generaLotto(l.a, l.b).alberi.map(a => a.n)),
    ostacoli: lottiTuoi.flatMap(l => generaLotto(l.a, l.b).ostacoli.map(o => o.id)),
  }
}

/** Il motore di una visita: la stessa classe del gioco, senza borsa (non si paga niente) e con l'orologio fermo. `soloLettura` lo
    dice alla scena (niente fantasmi di edifici da comprare, niente cartelli). Cassa e banco sono due ostacoli in più. */
export function motoreDiVisita(f) {
  const m = new Fattoria3d({ stato: statoDaSnapshot(f), borsa: { quante: () => 0, paga: () => false }, ora: () => ORA_VISITA, rnd: () => 0.5 })
  m.soloLettura = true
  for (const [nome, p] of Object.entries(f.posti)) {
    const d = MISURE_POSTI[nome]
    for (let a = 0; a < d.w; a++) for (let b = 0; b < d.d; b++) if (dentro(p.i + a, p.j + b)) m.bloccoFisso.add(chiave(p.i + a, p.j + b))
  }
  return m
}

// ═════════ domani: la fattoria di chi gioca diventa uno snapshot ═════════

const SCELTE = 3
/** Un posto per la cassa o il banco: quello di serie se è libero, se no la cella libera più vicina dentro la terra di chi gioca. */
function postoLibero(motore, strade, nome) {
  const { w, d } = MISURE_POSTI[nome], base = nome === 'cassa' ? POSTO_CASSA : POSTO_MERCATO
  const preso = new Set([...stradeDiSerie(), ...strade.map(id => { const c = cellaDaId(id); return c ? chiave(c[0], c[1]) : -1 })])
  for (const c of motore.s.cose) { const m = motore.misure(c.tipo); if (m) for (let a = 0; a < m.w; a++) for (let b = 0; b < m.d; b++) preso.add(chiave(c.i + a, c.j + b)) }       // anche gli edifici sono cose
  const libero = (i, j) => { for (let a = 0; a < w; a++) for (let b = 0; b < d; b++) if (!dentro(i + a, j + b) || !motore.cellaPropria(i + a, j + b) || preso.has(chiave(i + a, j + b))) return false; return true }
  const celle = []
  for (let i = -6; i < 6; i++) for (let j = 0; j < 8; j++) celle.push([i, j, Math.hypot(i - base.i, j - base.j)])
  // il banco e la cassa non si accavallano fra loro: la cassa, scelta prima, è già «presa» per il banco
  const altro = nome === 'mercato' ? postoLibero(motore, strade, 'cassa') : null
  if (altro) for (let a = 0; a < MISURE_POSTI.cassa.w; a++) for (let b = 0; b < MISURE_POSTI.cassa.d; b++) preso.add(chiave(altro.i + a, altro.j + b))
  const scelta = celle.sort((x, y) => x[2] - y[2]).find(([i, j]) => libero(i, j))
  return scelta ? { i: scelta[0], j: scelta[1] } : { ...base }
}
/** Lo snapshot della fattoria di `motore`, pronto da pubblicare (domani: da mandare a un amico). Legge soltanto: non cambia il motore.
    `chi`: { id, nome, proprietario: { nome, emoji } } arriva da fuori (il nome di un bambino non sta mai nel codice). Il mercato e
    la cassa si compongono con ciò che si fa a questo livello, con gli stessi numeri dei villaggi del computer. */
export function esportaLaMiaFattoria(motore, chi = {}) {
  const s = motore.s, liv = motore.livello()
  const fatte = k => Number.isFinite(livelloDellaMerce(k)) && livelloDellaMerce(k) <= liv
  const raccolti = Object.keys(COLTURE).filter(fatte)
  // le merci che più si hanno in scorta per prime: sono quelle che si vedono; poi le più alte che si fanno
  const peso = k => motore.scortaDi(k) * 100 + livelloDellaMerce(k)
  const prodotti = [...Object.keys(RICETTE), ...Object.keys(PRODOTTI_ANIMALI)].filter(fatte).sort((a, b) => peso(b) - peso(a)).slice(0, SCELTE)
  const alti = [...raccolti].sort((a, b) => peso(b) - peso(a)).slice(0, SCELTE)
  const strade = []                                           // le strade disegnate: indici di griglia, come nello stato
  for (const [k, v] of motore.strada) if (v === 1) { const c = cellaDa(k); strade.push(idCella(c[0], c[1])) }
  const cose = s.cose.filter(c => PEZZI[c.tipo]).map(c => {          // gli edifici vanno a parte (`edifici`)
    const x = { tipo: c.tipo, i: c.i, j: c.j }
    if (c.tipo === 'campo') {
      const cr = motore.crescita(c).filter(v => v >= 0)
      x.coltura = c.coltura || 'grano'; x.cresc = cr.length ? Math.max(...cr) : 0
    }
    if (c.tipo === 'recinto') x.pecore = (c.pecore || []).length || 1
    if (c.bestie) x.bestie = c.bestie.length
    return x
  })
  const vendibili = [...prodotti, ...alti].filter((k, n, tutti) => tutti.indexOf(k) === n).slice(0, SCELTE + 1)
  const baratti = alti.map(k => ({ k, n: 4, premio: premioMassimo(k, 4), da: null }))
  const grezzo = {
    v: VERSIONE_VISITA, id: chi.id, nome: chi.nome, proprietario: chi.proprietario, tema: 'misto', liv,
    storia: [], lotti: Object.keys(s.lotti), edifici: s.cose.filter(c => EDIFICI[c.tipo]).map(c => ({ tipo: c.tipo, i: c.i, j: c.j })),
    cose, strade,
    posti: { cassa: postoLibero(motore, strade, 'cassa'), mercato: postoLibero(motore, strade, 'mercato') },
    mercato: { vende: vendibili.map(k => ({ k, n: 3, prezzo: prezzoPer(k, 1.2) })), compra: baratti, rinnovoMs: RINNOVO_MERCATO_MS },
    cassa: { chiede: alti.map(k => ({ k, n: 3 })), dono: null, rinnovoMs: RINNOVO_CASSA_MS },
  }
  return normalizzaFattoriaVisitabile(grezzo)
}
