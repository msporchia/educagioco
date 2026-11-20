/* A SCUOLA — i livelli dei gradini scelti in giro, la scala del 💡 senza
   monete e come si racconta un ▶ alla maestra. Puro, gira in Node: vedi
   docs/passo-passo/scuola.md. */
import { CAMPAGNA } from '../dati/campagna.js'
import { MOSSE, ATTACCA } from '../dati/mondo.js'
import { carteDi, eApri, eSe, eFine, valoreDi, CASA } from '../dati/carte.js'
import { RAGIONA } from '../../aiuti.js'
import { STRADE } from './strade.js'
import { INGREDIENTI } from './generatore.js'
import { scalaDi } from './aiuti.js'
import { risolvi } from './risolutore.js'
import { TANA, SBATTE, SPLASH, STANCO, PERSA, CADUTO } from './mondo.js'

export const PROTAGONISTI = ['coniglio', 'cane', 'guerriero']
// i testi che vanno alla maestra (il tetto del servizio, docs/scuola/protocollo.md)
export const LUNGO = 40

/* `{ gradini, protagonista }`: gli indici dei livelli di quei gradini sulla strada del protagonista, nel suo ordine.
   Senza limite, o con un limite che non chiede niente, `null`: è casa */
export function tappeDelLimite(limite) {
  if (!limite || !PROTAGONISTI.includes(limite.protagonista) || !Array.isArray(limite.gradini)) return null
  const giro = STRADE[limite.protagonista].filter(i => limite.gradini.includes(CAMPAGNA[i].scalino))
  return giro.length ? giro : null
}

// finito l'ultimo si ricomincia dal primo (il guerriero; coniglio e cane passano ai posti nuovi, sotto)
export const dopoNelGiro = (giro, i) => giro[(giro.indexOf(i) + 1) % giro.length]

/* finiti i livelli scelti, posti nuovi dal generatore dei sentieri (scelta dell'utente: chi va veloce non rifà sempre gli
   stessi). Le regole e le carte sono quelle dei gradini della strada fino al più alto scelto; il seme viene dai gradini,
   così tutta la classe trova gli stessi posti nello stesso ordine. Il guerriero un sentiero non ce l'ha: `null` */
export function generatoDelLimite(limite) {
  const giro = tappeDelLimite(limite)
  if (!giro || limite.protagonista === 'guerriero') return null
  const strada = STRADE[limite.protagonista]
  const fin = Math.max(...giro.map(i => strada.indexOf(i)))
  const sbloccati = [...new Set(strada.slice(0, fin + 1).map(i => INGREDIENTI[CAMPAGNA[i].scalino]).filter(Boolean))]
  if (limite.protagonista === 'cane' && !sbloccati.includes('cane')) sbloccati.push('cane')
  let seme = 7
  for (const c of `${limite.protagonista}:${[...limite.gradini].sort().join(',')}`) seme = (Math.imul(seme, 31) + c.charCodeAt(0)) >>> 0
  return { strada: limite.protagonista, sbloccati, seme: (seme % 99991) + 1 }
}

// il 💡 a scuola: solo i gradini gratis che fanno ragionare (docs/core/aiuti.md); il profilo non ha monete
export const scalaAScuola = () => scalaDi().filter(p => p.che === RAGIONA)

// tagliata senza spezzare un'emoji a metà
function corto(s) {
  if (s.length <= LUNGO) return s
  const pezzi = typeof Intl !== 'undefined' && Intl.Segmenter
    ? [...new Intl.Segmenter('it', { granularity: 'grapheme' }).segment(s)].map(x => x.segment) : Array.from(s)
  let fuori = ''
  for (const p of pezzi) { if (fuori.length + p.length > LUNGO - 1) break; fuori += p }
  return fuori + '…'
}

/* ═══════════ una fila in breve: «→→↓», «🔁3(→↓)», «🚩rosso(→)» ═══════════ */
const FRECCE = { su: '↑', giu: '↓', sinistra: '←', destra: '→' }
const SALTI = { su: '⇑', giu: '⇓', sinistra: '⇐', destra: '⇒' }
function carta(t) {
  if (t === ATTACCA) return '⚔️'
  if (eFine(t)) return ')'
  if (eApri(t)) {
    const v = valoreDi(t)
    if (eSe(t)) return `❓${FRECCE[v] || v}(`
    return typeof v === 'number' ? `🔁${v}(` : v === CASA ? '🔁🏠(' : `🚩${v}(`
  }
  const m = MOSSE[t]
  return m ? (m.salto ? SALTI : FRECCE)[m.verso] : '?'
}
export const inBreve = fila => fila.map(carta).join('')
const quante = (liv, fila) => { const n = carteDi(fila); return `${n} ${liv.zaino ? (n === 1 ? 'carta' : 'carte') : (n === 1 ? 'freccia' : 'frecce')}` }

/* la soluzione da dire alla maestra: con lo zaino la più corta delle scritte, senza la strada più corta con la carota
   (quella della quarta stella, docs/passo-passo/stelle-e-aiuti.md) */
export function soluzioneDi(liv) {
  if (liv.zaino) return liv.soluzioni.reduce((a, b) => (carteDi(b) < carteDi(a) ? b : a))
  return risolvi(liv, { carota: true }) || risolvi(liv, { carota: false }) || []
}
export function attesaDi(liv) {
  const s = soluzioneDi(liv)
  return corto(`${quante(liv, s)}: ${inBreve(s)}`)
}

/* com'è andato un ▶, da `esegui` (`dove` è l'indice nella fila: la carta è contata come nello zaino) */
export function dataDi(liv, fila, esito) {
  const n = carteDi(fila.slice(0, esito.dove + 1))
  const alla = `alla ${n}ª ${liv.zaino ? 'carta' : 'freccia'}`
  const meta = liv.guerriero ? 'dalla principessa' : liv.cane ? 'il gregge nel recinto' : 'a casa'
  const premio = liv.guerriero ? 'la corona' : liv.cane ? "l'osso" : 'la carota'
  const usate = quante(liv, fila)
  switch (esito.esito) {
    case TANA: return corto(`${meta}${esito.carota ? ` con ${premio}` : ''} · ${usate}`)
    case SBATTE: return corto(`sbatte ${alla}`)
    case SPLASH: return corto(`in acqua ${alla}`)
    case CADUTO: return corto(`colpito ${alla}`)
    case PERSA: return corto(`pecora incastrata ${alla}`)
    case STANCO: return corto(`gira a vuoto ${alla}`)
    default: return corto(liv.cane ? `pecore fuori dal recinto · ${usate}` : `si ferma prima · ${usate}`)
  }
}
