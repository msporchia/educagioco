// La partita lasciata a metà: uscire non butta via niente (la stessa
// promessa del sotterraneo). Quasi tutto si rifà (lo scenario sta nella
// tappa, i numeri dell'eroe sono una funzione dei potenziamenti); si
// scrive solo quello che è successo. Il perché di ogni scelta (i
// mostri si spingono via invece di sparire, dopo il traguardo non si
// salva più): docs/survivors/regole.md.
import { Partita, Regole } from './partita.js'
import { MOSTRI } from '../dati/mostri.js'
import { OGGETTI } from '../dati/oggetti.js'
import { soglia, CFG } from '../dati/taratura.js'

// 2: gli oggetti a terra e la cassa che apre un'offerta. Un salvataggio
// di versione 1 si butta (riprendeva senza oggetti e con «livello»
// scritto sopra le carte di una cassa).
export const VERSIONE = 2

// quanto spazio si trova davanti chi riprende: poco più della metà
// della gittata dell'arco (275), li vede arrivare ma non è già addosso
export const SPAZIO = 170

// tetti di salvataggio: si tengono i nemici/gemme/oggetti più vicini
// (i lontani, riprendendo, sarebbero arrivati comunque)
export const MAX_NEMICI = 140
const MAX_GEMME = 120
export const MAX_OGGETTI = 8

const vicini = (roba, eroe, quanti) => roba.length <= quanti ? roba : [...roba]
  .sort((a, b) => (a.x - eroe.x) ** 2 + (a.y - eroe.y) ** 2
                - ((b.x - eroe.x) ** 2 + (b.y - eroe.y) ** 2))
  .slice(0, quanti)

const arrotonda = n => Math.round(n * 10) / 10

// `tappa` è l'indice nella campagna (-1 è la Sopravvivenza), non la
// tappa intera: la tabella sta nel codice e cambia con le versioni.
export function scrivi(partita, tappa) {
  const p = partita
  if (!p || p.finita || p.conquistata) return null
  const e = p.eroe
  return {
    v: VERSIONE,
    tappa,
    tempo: arrotonda(p.tempo),
    livello: p.livello,
    xp: p.xp,
    uccisi: p.uccisi,
    ferite: p.ferite,
    casse: p.casse,   // il tetto della cassa (cassaAmmessa): senza, uscire e rientrare lo azzererebbe
    daSpendere: p.daSpendere || 0,   // i potenziamenti guadagnati e non ancora scelti
    eroe: { x: arrotonda(e.x), y: arrotonda(e.y), cuori: e.cuori,
            cuoriMax: e.cuoriMax, guarda: e.guarda, passi: arrotonda(e.passi),
            rotta: Math.round(e.rotta * 100) / 100, bombe: e.bombe || 0 },
    potenziamenti: { ...p.potenziamenti },
    // le tre carte in attesa si salvano per chiave e si rivestono
    // riprendendo: rigenerarle farebbe uscire e rientrare finché non
    // capita un'offerta migliore
    offerta: p.offerta ? p.offerta.map(c => c.chiave) : null,
    cassa: p.motivoOfferta === 'cassa' || undefined,
    nemici: vicini(p.nemici, e, MAX_NEMICI).map(n => ({
      t: n.tipo, x: arrotonda(n.x), y: arrotonda(n.y),
      vita: arrotonda(n.vita), max: arrotonda(n.vitaMax),
      passo: arrotonda(n.passo), massa: arrotonda(n.massa),
      ...(n.rotta ? { rx: n.rotta.x, ry: n.rotta.y } : {}),
      ...(n.capo ? { capo: 1 } : {}),
    })),
    tCapo: p.tCapo,
    gemme: vicini(p.gemme, e, MAX_GEMME)
      .map(g => ({ x: arrotonda(g.x), y: arrotonda(g.y), val: g.val })),
    oggetti: vicini(p.oggetti, e, MAX_OGGETTI)
      .map(o => ({ t: o.tipo, x: arrotonda(o.x), y: arrotonda(o.y), resta: arrotonda(o.resta) })),
  }
}

// Torna una Partita pronta a giocare, o `null` se il salvataggio non si
// può leggere: chi chiama in quel caso comincia una partita nuova.
export function leggi(dato, tappa, { rnd = Math.random, campo = null, mazzo } = {}) {
  if (!dato || dato.v !== VERSIONE || !tappa || !dato.eroe) return null
  try {
    const opzioni = { rnd, campo }
    if (mazzo) opzioni.mazzo = mazzo
    const p = new Partita(new Regole(tappa), opzioni)

    // prima i potenziamenti, poi i numeri che ne dipendono; una carta
    // tolta dal mazzo (le spine) si butta
    p.potenziamenti = Object.fromEntries(Object.entries(dato.potenziamenti || {})
      .filter(([k]) => p.mazzo.some(c => c.chiave === k)))
    p.ricalcola()

    p.tempo = dato.tempo || 0
    p.livello = Math.max(1, dato.livello || 1)
    p.prossima = soglia(p.livello)
    p.xp = Math.max(0, Math.min(dato.xp || 0, p.prossima))
    p.uccisi = dato.uccisi || 0
    p.ferite = dato.ferite || 0
    p.casse = dato.casse || 0
    p.daSpendere = Math.max(0, dato.daSpendere || 0)
    if (Number.isFinite(dato.tCapo)) p.tCapo = dato.tCapo

    const e = dato.eroe
    Object.assign(p.eroe, {
      x: e.x || 0, y: e.y || 0,
      cuoriMax: Math.max(1, e.cuoriMax || p.regole.cuori),
      guarda: e.guarda === -1 ? -1 : 1,
      rotta: Number.isFinite(e.rotta) ? e.rotta : 0,
      passi: e.passi || 0,
      bombe: Math.max(0, Math.min(CFG.bomba.tasca, e.bombe || 0)),
      vx: 0, vy: 0, invuln: 0, mira: 0,
    })
    p.eroe.cuori = Math.max(1, Math.min(e.cuori || 1, p.eroe.cuoriMax))

    // un tipo di mostro che non esiste più si butta
    p.nemici = (dato.nemici || [])
      .filter(n => n && MOSTRI[n.t])
      .map(n => ({
        tipo: n.t, x: n.x, y: n.y,
        r: MOSTRI[n.t].r * (n.capo ? CFG.capo.taglia : 1),
        ...(n.capo ? { capo: true } : {}),
        vita: n.vita, vitaMax: n.max || n.vita,
        passo: n.passo || MOSTRI[n.t].passo, massa: n.massa || 1,
        spx: 0, spy: 0, lampo: 0, gelato: 0, freno: 1, attesa: 0,
        fase: rnd() * 6.3,
        ...(n.rx || n.ry ? { rotta: { x: n.rx || 0, y: n.ry || 0 } } : {}),
      }))
    for (const n of p.nemici) faiSpazio(n, p.eroe, rnd)

    p.gemme = (dato.gemme || []).map(g => ({
      x: g.x, y: g.y, vx: 0, vy: 0, val: g.val || 1, fase: rnd() * 6.3,
    }))

    p.oggetti = (dato.oggetti || [])
      .filter(o => o && OGGETTI[o.t] && o.resta > 0)
      .map(o => ({ tipo: o.t, x: o.x, y: o.y, resta: o.resta, fase: rnd() * 6.3 }))

    if (dato.offerta?.length) {
      const carte = dato.offerta
        .map(k => p.mazzo.find(c => c.chiave === k))
        .filter(Boolean)
        .map(c => p.vestiCarta(c))
        .sort((a, b) => a.prezzo - b.prezzo)
      p.offerta = carte.length ? carte : null
      p.motivoOfferta = p.offerta ? (dato.cassa ? 'cassa' : 'livello') : null
    }
    return p
  } catch {
    // un salvataggio storto non porta giù il gioco: si ricomincia
    return null
  }
}

// chi era addosso all'eroe fa un passo indietro lungo la direzione da
// cui stava arrivando: resta suo il vantaggio di essere vicino, non
// quello di essere già arrivato
function faiSpazio(n, eroe, rnd) {
  let dx = n.x - eroe.x, dy = n.y - eroe.y
  let d = Math.sqrt(dx * dx + dy * dy)
  if (d < 1) {                       // esattamente sopra: da qualche parte va
    const a = rnd() * 6.3
    dx = Math.cos(a); dy = Math.sin(a); d = 1
  }
  if (d >= SPAZIO) return
  n.x = eroe.x + dx / d * SPAZIO
  n.y = eroe.y + dy / d * SPAZIO
}

// due righe per la carta «riprendi»: cosa si sta lasciando in sospeso,
// le legge la mappa senza sapere niente di Partita
export function dice(dato, campagna, libero) {
  if (!dato || dato.v !== VERSIONE) return null
  const t = dato.tappa < 0 ? libero : campagna[dato.tappa]
  if (!t) return null
  return {
    tappa: dato.tappa,
    nome: t.nome,
    scenario: t.scenario,
    libera: dato.tappa < 0,
    tempo: Math.floor(dato.tempo || 0),
    restano: Number.isFinite(t.durata)
      ? Math.max(0, Math.ceil(t.durata - (dato.tempo || 0))) : 0,
    livello: dato.livello || 1,
    cuori: dato.eroe?.cuori || 0,
    cuoriMax: dato.eroe?.cuoriMax || 0,
    uccisi: dato.uccisi || 0,
  }
}
