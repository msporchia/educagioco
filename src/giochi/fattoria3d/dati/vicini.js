/* I vicini: le fattorie che si possono visitare. Una fattoria visitabile è UN DATO serializzabile e versionato (uno
   «snapshot»): la visita legge solo lui, mai il mondo vivo di chi gioca. Oggi i quattro villaggi li scrive il computer qui
   sotto; domani lo stesso formato verrà dal profilo di un amico (`esportaLaMiaFattoria`, motore/vicini.js). Perciò
   `normalizzaFattoriaVisitabile` non si fida di niente: scarta ciò che non conosce, taglia i testi e RICALCOLA i numeri che
   regalano qualcosa (premi, doni), così uno snapshot altrui non può pagare più del banco. Dato puro, niente disegno.
   Vedi docs/fattoria3d/vicini.md. */
import { COLTURE } from './colture.js'
import { RICETTE } from './ricette.js'
import { PRODOTTI_ANIMALI } from './animali.js'
import { PEZZI, EDIFICI } from './catalogo.js'
import { LOTTI, LOTTI_INIZIALI, lottiDelPosto, lottoDi, dentro } from './mondo.js'
import { livelloDelPezzo, livelloDellaColtura, livelloDellaRicetta } from './livelli.js'
import { tettoDi } from './ordini.js'

export const VERSIONE_VISITA = 1

// ── i numeri ──
export const FRAZIONE_PREMIO = 0.25       // un baratto dà esperienza per un quarto del tetto di ciò che si consegna…
export const FRAZIONE_DONO = 0.5          // …e roba (sua) per metà: in tutto mai più di ciò che pagherebbe il banco (premio 0,5 del tetto)
export const PREZZO_MIN = 0.8             // un vicino non vende sotto l'80% di ciò che vale (il tetto in monete di quel che costa fare)
export const RINNOVO_CASSA_MS = 10 * 60_000
export const RINNOVO_MERCATO_MS = 15 * 60_000
export const QUANTI_MAX = 9               // per voce
export const VOCI_MAX = 6
export const CHIEDE_MAX = 3
export const COSE_MAX = 120

// i posti di serie dei due luoghi che si toccano: la cassa (1×1) e il banco del mercato (2×1), davanti all'ingresso
export const POSTO_CASSA = { i: -2, j: 5 }
export const POSTO_MERCATO = { i: 1, j: 5 }
export const MISURE_POSTI = { cassa: { w: 1, d: 1 }, mercato: { w: 2, d: 1 } }

// le facce che un vicino può avere (tutte nel font delle emoji del gioco: un'emoji arrivata da fuori non si disegnerebbe)
export const FACCE = ['👵', '👴', '🧑‍🌾', '👨‍🍳', '🎩', '🌻']

// ── le merci: raccolti (COLTURE), prodotti delle macchine (RICETTE) e di pollaio e stalla (PRODOTTI_ANIMALI) ──
export const eMerce = k => typeof k === 'string' && !!(COLTURE[k] || RICETTE[k] || PRODOTTI_ANIMALI[k])
export const merce = k => COLTURE[k] || RICETTE[k] || PRODOTTI_ANIMALI[k] || null
/** Da che livello si fa questa merce (uova e latte: da quando c'è il pollaio o la stalla). */
export const livelloDellaMerce = k =>
  COLTURE[k] ? livelloDellaColtura(k) : PRODOTTI_ANIMALI[k] ? livelloDelPezzo(PRODOTTI_ANIMALI[k].dove) : RICETTE[k] ? livelloDellaRicetta(k) : Infinity

/** Quanto vale una merce in monete: il tetto di ordini.js (🪙6 al minuto di quel che costa farla). */
export const valoreDi = (k, n = 1) => tettoDi({ [k]: n })
/** Il prezzo al pezzo che un vicino chiede, dato il suo carattere (1 = il valore): sempre intero, almeno 1. */
export const prezzoPer = (k, carattere = 1) => Math.max(1, Math.ceil(valoreDi(k) * carattere))
export const prezzoMinimo = k => Math.max(1, Math.ceil(valoreDi(k) * PREZZO_MIN))
/** L'esperienza massima di un baratto in cui si consegnano `n` di `k`. */
export const premioMassimo = (k, n) => Math.max(1, Math.floor(valoreDi(k, n) * FRAZIONE_PREMIO))
/** Quanti pezzi di `d` si possono dare in cambio di `n` di `k` (può essere 0: allora `d` non va bene). */
export const donoMassimo = (k, n, d) => Math.floor(valoreDi(k, n) * FRAZIONE_DONO / valoreDi(d))
/** Il dono di una cassa riempita: vale al più metà del suo tetto. */
export const donoCassaMassimo = (chiede, d) => Math.floor(chiede.reduce((v, c) => v + valoreDi(c.k, c.n), 0) * FRAZIONE_DONO / valoreDi(d))

// ── la normalizzazione: mai un'eccezione, mai un dato che non si può disegnare ──
const oggetto = v => v && typeof v === 'object' && !Array.isArray(v) ? v : {}
const intero = (v, min, max, d) => Number.isFinite(v) ? Math.min(max, Math.max(min, Math.round(v))) : d
const testo = (v, max, d = '') => typeof v === 'string' ? v.replace(/[\u0000-\u001f<>]/g, ' ').replace(/\s+/g, ' ').trim().slice(0, max) || d : d
const TIPI_COSE = Object.keys(PEZZI)
const TEMI = ['orto', 'mulino', 'pecore', 'frutteto', 'misto']

function coseInForma(letto) {
  const out = []
  for (const c of (Array.isArray(letto) ? letto : []).slice(0, COSE_MAX)) {
    if (!c || !TIPI_COSE.includes(c.tipo) || !Number.isInteger(c.i) || !Number.isInteger(c.j)) continue
    const x = { tipo: c.tipo, i: c.i, j: c.j }
    if (c.tipo === 'campo') {
      x.coltura = COLTURE[c.coltura] ? c.coltura : 'grano'
      x.cresc = Number.isFinite(c.cresc) ? Math.min(1, Math.max(0, c.cresc)) : 1          // 0..1: quanto è cresciuto (1 = maturo)
    }
    if (c.tipo === 'recinto') x.pecore = intero(c.pecore, 1, 4, 2)
    if (c.tipo === 'pollaio') x.bestie = intero(c.bestie, 1, 6, 3)
    if (c.tipo === 'stalla') x.bestie = intero(c.bestie, 1, 4, 2)
    out.push(x)
  }
  return out
}

function vendeInForma(letto) {
  const out = [], visti = new Set()
  for (const v of (Array.isArray(letto) ? letto : [])) {
    if (out.length >= VOCI_MAX) break
    if (!v || !eMerce(v.k) || visti.has(v.k) || !Number.isFinite(livelloDellaMerce(v.k))) continue
    visti.add(v.k)
    out.push({ k: v.k, n: intero(v.n, 1, QUANTI_MAX, 3), prezzo: intero(v.prezzo, prezzoMinimo(v.k), 999, prezzoPer(v.k)) })
  }
  return out
}

function compraInForma(letto) {
  const out = []
  for (const v of (Array.isArray(letto) ? letto : [])) {
    if (out.length >= VOCI_MAX) break
    if (!v || !eMerce(v.k)) continue
    const n = intero(v.n, 1, QUANTI_MAX, 3), x = { k: v.k, n, premio: intero(v.premio, 1, premioMassimo(v.k, n), premioMassimo(v.k, n)), da: null }
    const d = oggetto(v.da)
    if (eMerce(d.k)) {
      const tetto = donoMassimo(v.k, n, d.k)
      if (tetto >= 1) x.da = { k: d.k, n: intero(d.n, 1, tetto, tetto) }
    }
    out.push(x)
  }
  return out
}

function chiedeInForma(letto) {
  const out = [], visti = new Set()
  for (const v of (Array.isArray(letto) ? letto : [])) {
    if (out.length >= CHIEDE_MAX) break
    if (!v || !eMerce(v.k) || visti.has(v.k)) continue
    visti.add(v.k); out.push({ k: v.k, n: intero(v.n, 1, QUANTI_MAX, 2) })
  }
  return out
}

/** Una cella libera per un posto (cassa o mercato): quella detta se sta dentro i lotti, se no la prima vicina all'ingresso. */
function postoInForma(letto, d, lotti) {
  const l = oggetto(letto)
  const ok = (i, j) => Number.isInteger(i) && Number.isInteger(j) && dentro(i, j) && !!lotti[lottoDi(i, j).id]
  return ok(l.i, l.j) ? { i: l.i, j: l.j } : { ...d }
}

/**
 * Rimette in forma uno snapshot letto (da un amico, da un file, da una versione futura) o torna `null` se non è una fattoria
 * che si può visitare. Non lancia mai. Lo snapshot normalizzato ha SEMPRE: v, id, nome, proprietario, tema, liv, storia, lotti
 * (id, i tre per tre di partenza e quelli degli edifici compresi), edifici, cose, strade, posti, mercato, cassa.
 */
export function normalizzaFattoriaVisitabile(letto) {
  try {
    const l = oggetto(letto)
    if (!(Number.isInteger(l.v) && l.v >= 1 && l.v <= VERSIONE_VISITA)) return null     // una versione più nuova del gioco non si legge
    if (typeof l.id !== 'string' || !/^[a-z0-9-]{1,32}$/.test(l.id)) return null
    const p = oggetto(l.proprietario)
    const lotti = { ...LOTTI_INIZIALI }
    for (const id of Array.isArray(l.lotti) ? l.lotti : []) if (LOTTI.some(x => x.id === id)) lotti[id] = true
    const edifici = [...new Set(Array.isArray(l.edifici) ? l.edifici.filter(t => EDIFICI[t]) : [])]
    for (const t of edifici) for (const lo of lottiDelPosto(EDIFICI[t].slot.i, EDIFICI[t].slot.j, EDIFICI[t].w, EDIFICI[t].d)) lotti[lo.id] = true
    const cose = coseInForma(l.cose).filter(c => { const m = PEZZI[c.tipo]; return lottiDelPosto(c.i, c.j, m.w, m.d).length > 0 })
    const posti = { cassa: postoInForma(oggetto(l.posti).cassa, POSTO_CASSA, lotti), mercato: postoInForma(oggetto(l.posti).mercato, POSTO_MERCATO, lotti) }
    const m = oggetto(l.mercato), c = oggetto(l.cassa)
    const chiede = chiedeInForma(c.chiede)
    const dono = oggetto(c.dono)
    const donoOk = eMerce(dono.k) && chiede.length && donoCassaMassimo(chiede, dono.k) >= 1
    return {
      v: VERSIONE_VISITA,
      id: l.id,
      nome: testo(l.nome, 24, 'Una fattoria'),
      proprietario: { nome: testo(p.nome, 16, 'Un vicino'), emoji: FACCE.includes(p.emoji) ? p.emoji : '🧑‍🌾' },
      tema: TEMI.includes(l.tema) ? l.tema : 'misto',
      liv: intero(l.liv, 1, 99, 1),
      storia: (Array.isArray(l.storia) ? l.storia : []).slice(0, 2).map(r => testo(r, 120)).filter(Boolean),
      lotti: Object.keys(lotti),
      edifici,
      cose,
      strade: Array.isArray(l.strade) ? l.strade.filter(Number.isInteger).slice(0, 400) : [],
      posti,
      mercato: {
        vende: vendeInForma(m.vende), compra: compraInForma(m.compra),
        rinnovoMs: intero(m.rinnovoMs, 60_000, 3_600_000, RINNOVO_MERCATO_MS),
      },
      cassa: {
        chiede,
        dono: donoOk ? { k: dono.k, n: intero(dono.n, 1, donoCassaMassimo(chiede, dono.k), donoCassaMassimo(chiede, dono.k)) } : null,
        rinnovoMs: intero(c.rinnovoMs, 60_000, 3_600_000, RINNOVO_CASSA_MS),
      },
    }
  } catch (e) {
    return null
  }
}

// ── i quattro villaggi del computer ──
// Le coordinate sono celle della griglia (vedi dati/mondo.js): il quadrato di partenza va da i −6..5, j −4..7; le strade di serie
// sono la riga j=−1 e le colonne i −1..0 da j=−1 a 7; la cassa sta in (−2,5) e il banco del mercato in (1..2,5).
const campo = (i, j, coltura, cresc = 1) => ({ tipo: 'campo', i, j, coltura, cresc })
const scambio = (k, n, d, nd) => ({ k, n, premio: premioMassimo(k, n), da: d ? { k: d, n: Math.min(nd, Math.max(1, donoMassimo(k, n, d))) } : null })
const vende = (k, n, carattere) => ({ k, n, prezzo: prezzoPer(k, carattere) })

const DA_SCRIVERE = [
  {
    v: 1, id: 'nonna-rita', nome: 'L\'orto di Nonna Rita', tema: 'orto', liv: 7,
    proprietario: { nome: 'Nonna Rita', emoji: '👵' },
    storia: ['Che bello vederti! Le mie galline fanno le uova più buone del paese.', 'Se mi riempi la cassa ti lascio qualcosa del mio orto.'],
    lotti: [],
    cose: [
      campo(-5, 0, 'carota'), campo(-3, 0, 'grano'), campo(-5, 2, 'pomodoro', 0.6), campo(-3, 2, 'mais'),
      { tipo: 'aiuola', i: -5, j: 5 }, { tipo: 'aiuola', i: -4, j: 5 }, { tipo: 'panchina', i: -5, j: 7 },
      { tipo: 'pollaio', i: 2, j: 0, bestie: 4 }, campo(2, 2, 'patata'), campo(4, 2, 'zucca', 0.4),
      { tipo: 'spaventapasseri', i: 3, j: 4 },
    ],
    mercato: {
      vende: [vende('uova', 4, 0.8), vende('zucca', 4, 0.8), vende('cipolla', 3, 0.8)],
      compra: [scambio('grano', 6, 'uova', 1), scambio('carota', 6, 'zucca', 2), scambio('mais', 5, 'cipolla', 1)],
    },
    cassa: { chiede: [{ k: 'grano', n: 4 }, { k: 'carota', n: 3 }, { k: 'mais', n: 2 }], dono: { k: 'uova', n: 1 } },
  },
  {
    v: 1, id: 'mugnaio-tonio', nome: 'Il mulino di Tonio', tema: 'mulino', liv: 9,
    proprietario: { nome: 'Tonio', emoji: '👨‍🍳' },
    storia: ['Sono Tonio, il mugnaio. Sente come gira? Quella è farina che sta nascendo.', 'Portami un po\' di grano: ho sempre fame di grano.'],
    edifici: ['mulino'],
    cose: [
      campo(-5, 0, 'grano'), campo(-3, 0, 'grano', 0.5), campo(-5, 2, 'mais'), campo(-3, 2, 'grano'),
      campo(2, 0, 'grano'), campo(4, 0, 'mais', 0.7), campo(2, 2, 'grano'), campo(4, 2, 'grano', 0.3),
      { tipo: 'pozzo', i: -3, j: 4 }, { tipo: 'panchina', i: 3, j: 7 },
    ],
    mercato: {
      vende: [vende('farina', 4, 1), vende('farinaMais', 3, 1), vende('panIntegrale', 2, 1)],
      compra: [scambio('grano', 8, 'farina', 2), scambio('mais', 6, 'farinaMais', 1), scambio('patata', 5, 'farina', 1)],
    },
    cassa: { chiede: [{ k: 'grano', n: 6 }, { k: 'mais', n: 3 }, { k: 'farina', n: 1 }], dono: { k: 'farinaMais', n: 2 } },
  },
  {
    v: 1, id: 'zio-beppe', nome: 'Le pecore di Zio Beppe', tema: 'pecore', liv: 11,
    proprietario: { nome: 'Zio Beppe', emoji: '👴' },
    storia: ['Ehi, benvenuta in campagna! Le mie pecore brucano da stamattina.', 'Là in alto vedi la mongolfiera: da lassù la fattoria sembra un francobollo.'],
    edifici: ['mongolfiera'],
    cose: [
      { tipo: 'recinto', i: -5, j: 0, pecore: 4 }, { tipo: 'recinto', i: -5, j: 3, pecore: 3 }, { tipo: 'recinto', i: 2, j: 0, pecore: 4 },
      campo(2, 3, 'zucca'), campo(4, 3, 'cipolla', 0.6), { tipo: 'fontana', i: -3, j: 6 }, { tipo: 'panchina', i: 3, j: 7 },
    ],
    mercato: {
      vende: [vende('tortaCarote', 2, 1.2), vende('frittata', 2, 1.2), vende('latte', 3, 1.2)],
      compra: [scambio('zucca', 6, 'latte', 1), scambio('cipolla', 6, 'tortaCarote', 1), scambio('patata', 8, 'latte', 1)],
    },
    cassa: { chiede: [{ k: 'zucca', n: 3 }, { k: 'pane', n: 2 }, { k: 'patata', n: 3 }], dono: { k: 'frittata', n: 1 } },
  },
  {
    v: 1, id: 'villa-dolce', nome: 'Villa Dolce', tema: 'frutteto', liv: 13,
    proprietario: { nome: 'Villa Dolce', emoji: '🌻' },
    storia: ['Benvenuti a Villa Dolce! Qui le fragole si raccolgono una per una, a mano.', 'E in fondo c\'è la gelateria: il gelato lo facciamo solo con frutta vera.'],
    edifici: ['gelateria'],
    cose: [
      campo(-5, 0, 'fragola'), campo(-3, 0, 'fragola', 0.7), campo(-5, 2, 'fragola'), campo(-3, 2, 'fragola', 0.5),
      campo(2, 0, 'fragola'), campo(4, 0, 'fragola', 0.8), { tipo: 'fontana', i: 2, j: 2 },
      { tipo: 'aiuola', i: -5, j: 5 }, { tipo: 'aiuola', i: -4, j: 5 }, { tipo: 'aiuola', i: 4, j: 5 }, { tipo: 'panchina', i: 3, j: 7 },
    ],
    mercato: {
      vende: [vende('marmellata', 2, 1.5), vende('gelatoFragola', 2, 1.5), vende('melanzana', 3, 1.5), vende('lavanda', 2, 1.5)],
      compra: [scambio('fragola', 6, 'melanzana', 2), scambio('cipolla', 8, 'lavanda', 1), scambio('zucca', 8, 'fragola', 2)],
    },
    cassa: { chiede: [{ k: 'fragola', n: 4 }, { k: 'cipolla', n: 3 }, { k: 'pizza', n: 1 }], dono: { k: 'marmellata', n: 1 } },
  },
]

/** I villaggi del computer, già in forma. L'ordine è quello della mappa (livello d'ingresso crescente). */
export const VICINI = DA_SCRIVERE.map(normalizzaFattoriaVisitabile).filter(Boolean)
export const vicinoPerId = id => VICINI.find(v => v.id === id) || null

export function guastiDeiVicini() {
  const g = []
  if (VICINI.length !== DA_SCRIVERE.length) g.push('un villaggio non si normalizza')
  if (new Set(VICINI.map(v => v.id)).size !== VICINI.length) g.push('due villaggi con lo stesso id')
  for (let a = 1; a < VICINI.length; a++) if (!(VICINI[a].liv > VICINI[a - 1].liv)) g.push(`${VICINI[a].id}: il livello d'ingresso non sale`)
  for (const [n, d] of DA_SCRIVERE.entries()) {
    const v = VICINI[n]; if (!v) continue
    // la normalizzazione non deve aver ritoccato niente: se ha ritoccato, il dato scritto sopra era sbagliato
    if (JSON.stringify(v.mercato.vende) !== JSON.stringify(d.mercato.vende)) g.push(`${v.id}: il mercato che vende è stato ritoccato`)
    if (JSON.stringify(v.mercato.compra) !== JSON.stringify(d.mercato.compra)) g.push(`${v.id}: il mercato che compra è stato ritoccato (un baratto vale troppo, o un dono non ci sta)`)
    if (JSON.stringify(v.cassa.chiede) !== JSON.stringify(d.cassa.chiede)) g.push(`${v.id}: la cassa chiede altro`)
    if (JSON.stringify(v.cassa.dono) !== JSON.stringify(d.cassa.dono)) g.push(`${v.id}: il dono della cassa è stato ritoccato`)
    if (v.cose.length !== d.cose.length) g.push(`${v.id}: ${d.cose.length - v.cose.length} cose scartate`)
    if (v.storia.length !== 2) g.push(`${v.id}: la storia è di due righe`)
    if (!v.mercato.vende.length || !v.mercato.compra.length || !v.cassa.chiede.length) g.push(`${v.id}: manca qualcosa da fare`)
    // si chiede e si compra solo ciò che si fa al livello d'ingresso: la cassa non è mai impossibile
    for (const c of v.cassa.chiede) if (!(livelloDellaMerce(c.k) <= v.liv)) g.push(`${v.id}: la cassa chiede ${c.k}, che si fa dal ${livelloDellaMerce(c.k)}`)
    for (const c of v.mercato.compra) if (!(livelloDellaMerce(c.k) <= v.liv)) g.push(`${v.id}: compra ${c.k}, che si fa dal ${livelloDellaMerce(c.k)}`)
  }
  return g
}
