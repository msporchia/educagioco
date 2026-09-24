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

   ── NIENTE VALORI DI COMODO ───────────────────────────────────────
   Un 🔁 nuovo nasce `ripeti-N`: la N è da scegliere, e ▶ non parte
   finché ne resta una (vedi il costruttore, dove la regola è nata). Un
   numero già scritto si legge come l'unico possibile.
   ═══════════════════════════════════════════════════════════════════ */

export const APRI = 'ripeti-'
export const FINE = 'fine'
export const N = 'N'
/* quante volte si può ripetere: da due (una volta sola non è un ciclo)
   a nove, che su una mappa da sette per nove basta e avanza */
export const VOLTE = [2, 3, 4, 5, 6, 7, 8, 9]

/* le carte che un livello può mettere in mano oltre alle frecce */
export const CARTE = {
  ripeti: { icona: '🔁', nome: 'ripeti' },
}

export const apri = n => APRI + (n == null ? N : n)
export const eApri = t => typeof t === 'string' && t.startsWith(APRI)
export const eFine = t => t === FINE
/* il numero di un ciclo, o `null` se è ancora la N */
export function volteDi(t) {
  if (!eApri(t)) return null
  const v = t.slice(APRI.length)
  return v === N ? null : Number(v)
}

/* quante carte occupa una fila nello zaino: tutto tranne le chiusure */
export const carteDi = (fila = []) => fila.reduce((n, t) => n + (eFine(t) ? 0 : 1), 0)
export const conCicli = (fila = []) => fila.some(eApri)

/* le N ancora da scegliere: gli indici delle aperture senza numero */
export const daScegliere = (fila = []) =>
  fila.reduce((l, t, i) => (eApri(t) && volteDi(t) == null ? [...l, i] : l), [])

/* ── scrivere un programma nei dati ──
   Le soluzioni dei livelli si scrivono così, e si leggono:
     programma('destra', ripeti(4, 'destra', 'giu'), 'destra') */
export const ripeti = (n, ...corpo) => [apri(n), ...corpo.flat(Infinity), FINE]
export const programma = (...pezzi) => pezzi.flat(Infinity)

/* ── l'albero ──
   Ogni nodo sa dove sta nella fila piatta (`i`), così chi disegna e chi
   esegue possono dire «questa carta» con lo stesso numero:
     { che: 'mossa', i, m }
     { che: 'ripeti', i, fine, volte, corpo: [nodi] }
   Una fila scritta male non fa esplodere niente: una chiusura senza
   apertura si salta, un'apertura senza chiusura si chiude in fondo (lo
   dice `guastiDellaFila`, ma chi gioca non deve accorgersene). */
export function albero(fila = []) {
  const radice = []
  const pila = [{ corpo: radice }]
  for (let i = 0; i < fila.length; i++) {
    const t = fila[i]
    if (eApri(t)) {
      const nodo = { che: 'ripeti', i, fine: -1, volte: volteDi(t), corpo: [] }
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
      const v = volteDi(t)
      if (v != null && !VOLTE.includes(v)) guasti.push(`${dove}: «${t}» in ${i}, si ripete da 2 a 9 volte`)
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
