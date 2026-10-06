/* LA PARTITA LASCIATA A METÀ — vedi docs/passo-passo/sosta.md.
   Una sosta sola per il gioco, con dentro la fila di ogni livello (sotto
   la chiave, mai l'indice) e il sentiero senza fine. Si scrive quello che
   il bambino ha fatto: la fila, il cursore, i gradini del 💡 scesi. Il
   resto (la mappa, la scala, cosa vale) si rifà dal codice; il posto del
   sentiero no, perché è fatto a caso con quello che si sapeva allora.
   Puro: gira in Node e si prova in `unita/passo-passo-sosta`. */
import { PASSI, SALTI, MASSIMO_FILA, LEGENDA } from '../dati/mondo.js'
import { eApri, eSe, eFine, valoreDi, valoreBuono, carteDi } from '../dati/carte.js'
import { CAMPAGNA } from '../dati/campagna.js'
import { scalaDi } from './aiuti.js'
import { SVELA } from '../../aiuti.js'

export const VERSIONE = 1
const SCALA = scalaDi()

/* pagato e svelato non si scrivono: li dicono i gradini scesi */
export const pagatoDa = presi => SCALA.slice(0, presi).some(p => p.prezzo > 0)
export const svelatoDa = presi => SCALA.slice(0, presi).some(p => p.che === SVELA)

const intero = (n, da, a) => Number.isInteger(n) && n >= da && n <= a
const oggetto = x => !!x && typeof x === 'object' && !Array.isArray(x)

/* una fila si può rimettere in quel posto: le carte che il posto offre,
   le scatole chiuse, lo zaino che la tiene */
export function filaBuona(fila, tappa) {
  if (!Array.isArray(fila) || fila.length > MASSIMO_FILA) return false
  if (tappa.zaino && carteDi(fila) > tappa.zaino) return false
  const carte = tappa.carte || []
  let d = 0
  for (const t of fila) {
    if (typeof t !== 'string') return false
    if (eApri(t)) {
      if (eSe(t) ? !carte.includes('se') : !carte.some(c => c !== 'se')) return false
      if (!valoreBuono(t, valoreDi(t))) return false
      d++
    } else if (eFine(t)) {
      if (--d < 0) return false
    } else if (!PASSI.includes(t) && !(tappa.salti && SALTI.includes(t))) return false
  }
  return d === 0
}

/* ── la fila di un posto ── vuota e senza aiuti non c'è niente da tenere */
export function scriviFila({ fila = [], cursore = 0, presi = 0, carta = null } = {}) {
  if (!fila.length && !presi) return null
  return { fila: fila.slice(), cursore, presi, carta: typeof carta === 'string' ? carta : null }
}

export function leggiFila(dato, tappa) {
  if (!oggetto(dato) || !tappa || !filaBuona(dato.fila, tappa)) return null
  if (!intero(dato.cursore, 0, dato.fila.length) || !intero(dato.presi, 0, SCALA.length)) return null
  return { fila: dato.fila.slice(), cursore: dato.cursore, presi: dato.presi,
           carta: typeof dato.carta === 'string' ? dato.carta : null }
}

/* ── il sentiero senza fine ──
   `posto` è il sentiero in gioco, o `null` se quello di prima è vinto e il
   prossimo non è ancora nato: rinasce uguale dal seme. Una serie che non
   ha fatto niente non si scrive. */
export function scriviSerie({ seme, sentieri = 0, serie = 0, prima = null, chiusa = null,
                              posto = null, fila = null } = {}) {
  const qui = posto ? scriviFila(fila || {}) : null
  if (!sentieri && !serie && !qui) return null
  const { chiave, ...senza } = posto || {}
  return { seme, sentieri, serie, prima, chiusa: chiusa || null,
           posto: posto ? JSON.parse(JSON.stringify(senza)) : null, fila: qui }
}

/* il posto è quello di allora: si guarda solo che si possa ancora leggere */
function postoBuono(t) {
  if (!oggetto(t) || !Array.isArray(t.mappa) || !t.mappa.length) return false
  const largo = typeof t.mappa[0] === 'string' ? t.mappa[0].length : 0
  if (!largo || t.mappa.some(r => typeof r !== 'string' || r.length !== largo)) return false
  const lettere = t.mappa.join('')
  if ([...lettere].some(ch => !LEGENDA[ch])) return false
  return [...lettere].filter(ch => LEGENDA[ch].partenza).length === 1
}

export function leggiSerie(dato) {
  if (!oggetto(dato) || !intero(dato.seme, 1, 1e9)) return null
  if (!intero(dato.sentieri, 0, 1e6) || !intero(dato.serie, 0, dato.sentieri)) return null
  if (dato.posto != null && !postoBuono(dato.posto)) return null
  const fila = dato.posto && dato.fila != null ? leggiFila(dato.fila, dato.posto) : null
  /* una fila che non torna: il posto resta (la serie è sua), la fila no */
  return { seme: dato.seme, sentieri: dato.sentieri, serie: dato.serie,
           prima: typeof dato.prima === 'string' ? dato.prima : null,
           chiusa: typeof dato.chiusa === 'string' ? dato.chiusa : null,
           posto: dato.posto || null, fila }
}

/* ── tutta la sosta ── */
export function scrivi({ livelli = {}, sentiero = null } = {}) {
  const tenuti = Object.fromEntries(Object.entries(livelli).filter(([, f]) => f))
  if (!Object.keys(tenuti).length && !sentiero) return null
  // una copia: il profilo non deve tenere in mano gli oggetti del gioco
  return JSON.parse(JSON.stringify({ v: VERSIONE, livelli: tenuti, sentiero: sentiero || null }))
}

/* torna sempre un quaderno: quello che non torna se ne va, e il posto
   ricomincia. Le file stanno sotto la chiave del livello, che non cambia
   mai: un livello tolto lascia la sua fila, che qui si butta */
export function leggi(dato) {
  const vuoto = { livelli: {}, sentiero: null }
  if (!oggetto(dato) || dato.v !== VERSIONE) return vuoto
  const livelli = {}
  for (const [chiave, f] of Object.entries(oggetto(dato.livelli) ? dato.livelli : {})) {
    const qui = leggiFila(f, CAMPAGNA.find(t => t.chiave === chiave))
    if (qui) livelli[chiave] = qui
  }
  return { livelli, sentiero: leggiSerie(dato.sentiero) }
}

/* cosa dice la mappa in cima: solo il sentiero, perché la fila di un
   livello si ritrova entrandoci */
export function dice(dato) {
  const s = leggi(dato).sentiero
  if (!s) return null
  const pezzi = [`sentiero ${s.sentieri + 1}`]
  if (s.posto && s.posto.nome) pezzi.push(s.posto.nome)
  if (s.serie) pezzi.push(`${s.serie} di fila`)
  return { emoji: '♾️', nome: 'Il sentiero senza fine', dettaglio: pezzi.join(' · ') }
}
