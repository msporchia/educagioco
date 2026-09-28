/* LE CARTE — il vocabolario del programma, dal gradino del ripeti in là.
   Vedi docs/passo-passo/zaino.md per lo zaino e le teste delle scatole. */
import { LASTRE } from './mondo.js'

export const APRI = 'ripeti-'
export const SE = 'se-'
export const FINE = 'fine'
export const N = 'N'
export const CASA = 'casa'
/* quante volte si può ripetere: da due (una volta sola non è un ciclo)
   a nove, che su una mappa da nove per undici basta e avanza */
export const VOLTE = [2, 3, 4, 5, 6, 7, 8, 9]
export const COLORI = Object.keys(LASTRE)

/* le prime tre sono teste della stessa scatola: un livello le accende
   una per una, e la scelta della testa offre solo quelle accese */
export const CARTE = {
  ripeti: { icona: '🔁', nome: 'ripeti tante volte' },
  fino:   { icona: '🚩', nome: 'ripeti fino a un colore' },
  casa:   { icona: '🏠', nome: 'ripeti fino a casa' },
  se:     { icona: '❓', nome: 'se' },
}

export const apri = v => APRI + (v == null ? N : v)
export const apriSe = v => SE + (v == null ? N : v)
export const eRipeti = t => typeof t === 'string' && t.startsWith(APRI)
export const eSe = t => typeof t === 'string' && t.startsWith(SE)
export const eApri = t => eRipeti(t) || eSe(t)
export const eFine = t => t === FINE
/* il valore di una testa: un numero, un colore, `casa` — o `null`, se
   è ancora la N */
export function valoreDi(t) {
  if (!eApri(t)) return null
  const v = t.slice(eSe(t) ? SE.length : APRI.length)
  if (v === N) return null
  return /^\d+$/.test(v) ? Number(v) : v
}
/* il numero di un ciclo, o `null` se non è un numero */
export function volteDi(t) {
  const v = valoreDi(t)
  return typeof v === 'number' ? v : null
}
/* la stessa testa con un altro valore */
export const conValore = (t, v) => (eSe(t) ? apriSe(v) : apri(v))

/* quante carte occupa una fila nello zaino: tutto tranne le chiusure */
export const carteDi = (fila = []) => fila.reduce((n, t) => n + (eFine(t) ? 0 : 1), 0)
export const conCicli = (fila = []) => fila.some(eApri)

/* le N ancora da scegliere: gli indici delle teste senza valore */
export const daScegliere = (fila = []) =>
  fila.reduce((l, t, i) => (eApri(t) && valoreDi(t) == null ? [...l, i] : l), [])

/* i valori che una testa può prendere: il ripeti un numero, un colore o
   la casa, il se solo un colore */
export function valoreBuono(t, v) {
  if (v == null) return true
  if (eSe(t)) return COLORI.includes(v)
  return VOLTE.includes(v) || COLORI.includes(v) || v === CASA
}

/* le soluzioni dei livelli si scrivono così:
   programma('destra', ripeti(4, 'destra', 'giu'), 'destra') */
export const ripeti = (v, ...corpo) => [apri(v), ...corpo.flat(Infinity), FINE]
export const se = (colore, ...corpo) => [apriSe(colore), ...corpo.flat(Infinity), FINE]
export const programma = (...pezzi) => pezzi.flat(Infinity)

/* la fila piatta come nodi ({ che: 'mossa'|'ripeti'|'se', i, ... corpo }),
   ognuno con l'indice `i` nella fila di partenza. Una fila scritta male
   non esplode: una chiusura senza apertura si salta, un'apertura senza
   chiusura si chiude in fondo. */
export function albero(fila = []) {
  const radice = []
  const pila = [{ corpo: radice }]
  for (let i = 0; i < fila.length; i++) {
    const t = fila[i]
    if (eApri(t)) {
      const v = valoreDi(t)
      const nodo = eSe(t)
        ? { che: 'se', i, fine: -1, colore: v, corpo: [] }
        : { che: 'ripeti', i, fine: -1, volte: typeof v === 'number' ? v : null,
            fino: typeof v === 'string' ? v : null, corpo: [] }
      pila.at(-1).corpo.push(nodo)
      pila.push(nodo)
    } else if (eFine(t)) {
      if (pila.length > 1) pila.pop().fine = i
    } else {
      pila.at(-1).corpo.push({ che: 'mossa', i, m: t })
    }
  }
  while (pila.length > 1) pila.pop().fine = fila.length
  return radice
}

/* la chiusura di un'apertura, e l'apertura di una chiusura */
export function chiusuraDi(fila, i) {
  let d = 0
  for (let j = i; j < fila.length; j++) {
    if (eApri(fila[j])) d++
    else if (eFine(fila[j]) && --d === 0) return j
  }
  return -1
}
export function aperturaDi(fila, j) {
  let d = 0
  for (let i = j; i >= 0; i--) {
    if (eFine(fila[i])) d++
    else if (eApri(fila[i]) && --d === 0) return i
  }
  return -1
}

/* aperture e chiusure appaiate, valori che esistono, mosse note a chi
   le riceve (`mosse`, se dato) */
export function guastiDellaFila(fila, { mosse = null, dove = 'fila' } = {}) {
  const guasti = []
  let d = 0
  for (const [i, t] of fila.entries()) {
    if (eApri(t)) {
      d++
      if (!valoreBuono(t, valoreDi(t))) guasti.push(`${dove}: «${t}» in ${i} non è una testa che esiste`)
    } else if (eFine(t)) {
      if (--d < 0) { guasti.push(`${dove}: una chiusura senza apertura in ${i}`); d = 0 }
    } else if (mosse && !mosse.includes(t)) {
      guasti.push(`${dove}: «${t}» in ${i} non è una mossa`)
    }
    if (eApri(t) && eFine(fila[i + 1])) guasti.push(`${dove}: un ciclo vuoto in ${i}`)
  }
  if (d > 0) guasti.push(`${dove}: ${d} ${d === 1 ? 'ciclo non chiuso' : 'cicli non chiusi'}`)
  return guasti
}
