/* ═══════════════════════════════════════════════════════════════════
   LE CARTE — il vocabolario del programma, dal gradino del ripeti in là

   Fino alle buche il programma è una fila di frecce, e basta. Poi
   arrivano le carte che **ne contengono altre**: 🔁 ripeti N volte, con
   dentro le frecce da ripetere. La fila però resta una fila — un elenco
   piatto di stringhe, com'era — e un ciclo ci sta dentro come una
   coppia di segni, l'apertura col suo numero e la chiusura:

     ['destra', 'ripeti-4', 'destra', 'giu', 'fine', 'destra']
         →       🔁 4 (        →       ↓     )        →

   Piatta perché è così che si scrive col dito: il cursore è un numero
   fra una carta e l'altra, e mettere o togliere una carta è uno
   `splice`, dentro o fuori da un ciclo che sia. L'albero serve a chi
   esegue e a chi disegna la scatola, e si ricava da qui (`albero`).
   Un livello di prima che non ha cicli ha una fila che è esattamente
   quella di sempre: niente cambia per i primi ventiquattro.

   ── LO ZAINO ──────────────────────────────────────────────────────
   Un livello dei gradini nuovi dichiara quante carte tiene la fila
   (`zaino`), e la strada, scritta freccia per freccia, non ci sta: il
   ciclo non è una comodità, è l'unico modo di farcela stare. È la regola
   che l'ha fatto nascere, detta da chi l'ha chiesta: «senza i cicli non
   riescono fisicamente a starci le freccine». Non è un par: le stelle
   restano le tre di sempre, e meno carte non vale di più.

   Si contano le carte che si toccano — una freccia, un salto, un 🔁 — e
   la chiusura no: è il bordo della scatola, non una carta.

   ── LE TESTE DELLE SCATOLE ────────────────────────────────────────
   Le scatole sono due, e la loro testa dice tutto:
     ripeti-5        🔁 5 volte
     ripeti-rosso    🔁 fino al rosso: si fa un giro, e alla fine di
                     ogni giro il coniglio guarda cosa ha sotto i piedi —
                     «vai su fino alla cella rossa». Almeno un giro sempre:
                     in un angolo ci sei già sopra, e «fino al rosso» vuol
                     dire il prossimo
     ripeti-casa     🔁 fino a casa: finché non si arriva alla tana (che
                     vince, come sempre, dovunque si arrivi)
     se-rosso        ❓ se sei sul rosso: quello che ha dentro si fa una
                     volta, o non si fa
   Il colore è quello di una lastra (`LASTRE` in `dati/mondo.js`).

   ── NIENTE VALORI DI COMODO ───────────────────────────────────────
   Una scatola nuova nasce con la N (`ripeti-N`, `se-N`): il valore è da
   scegliere, e ▶ non parte finché ne resta una (vedi il costruttore,
   dove la regola è nata). Un numero già scritto si legge come l'unico
   possibile.
   ═══════════════════════════════════════════════════════════════════ */
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

/* le carte che un livello può mettere in mano oltre alle frecce. Le
   prime tre sono tre teste della stessa scatola: un livello le accende
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

/* ── scrivere un programma nei dati ──
   Le soluzioni dei livelli si scrivono così, e si leggono:
     programma('destra', ripeti(4, 'destra', 'giu'), 'destra')
     programma(ripeti('casa', se('rosso', 'giu'), se('blu', 'destra'))) */
export const ripeti = (v, ...corpo) => [apri(v), ...corpo.flat(Infinity), FINE]
export const se = (colore, ...corpo) => [apriSe(colore), ...corpo.flat(Infinity), FINE]
export const programma = (...pezzi) => pezzi.flat(Infinity)

/* ── l'albero ──
   Ogni nodo sa dove sta nella fila piatta (`i`), così chi disegna e chi
   esegue possono dire «questa carta» con lo stesso numero:
     { che: 'mossa', i, m }
     { che: 'ripeti', i, fine, volte, fino, corpo: [nodi] }
                         `volte` un numero, o `fino` un colore o `casa`
     { che: 'se', i, fine, colore, corpo: [nodi] }
   Una fila scritta male non fa esplodere niente: una chiusura senza
   apertura si salta, un'apertura senza chiusura si chiude in fondo (lo
   dice `guastiDellaFila`, ma chi gioca non deve accorgersene). */
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

/* ── una fila scritta bene ──
   Aperture e chiusure appaiate, numeri che esistono, e le mosse dette
   da chi le conosce (`mosse`: l'elenco di chi le sa, qui non si importa
   il mondo). Serve ai test e alle soluzioni scritte nei livelli. */
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
