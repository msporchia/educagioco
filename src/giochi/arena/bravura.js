// Quanto è bravo il bambino, operazione per operazione: il grado del modulo `conti`
// da cui partono i conti di Castle Battle. Si muove giocando (giusto e svelto sale,
// sbagliato scende) e la prima volta parte da quello che si sa già: le tabelline
// degli asteroidi per × e ÷, l'età per tutte. Puro: il profilo lo legge Gioco.vue.
// Vedi docs/arena/calcoli.md.
import conti from '../../quiz/moduli/conti.js'
import { livelloDegliAnni } from '../../quiz/nucleo/classi.js'
import { frontieraTabelline } from '../../store/marea.js'

// il tetto del calcolo a mente: entro il cento, tabelline fino al 12; le tre cifre sono del castello
export const GRADO_A_MENTE = 7
// da dove si parte la prima volta, al massimo: sopra resta da guadagnare giocando
export const PARTENZA_MAX = 5
// dentro una battaglia i conti salgono di un grado ogni tanti conti giusti, fino a RAMPA_MAX gradi sopra la base
export const RAMPA_OGNI = 3
export const RAMPA_MAX = 3
// sotto questi secondi un conto giusto è svelto e fa salire
export const SVELTO = 6
export const PASSO = { svelto: 1 / 3, lento: 0, sbagliato: -1 / 2 }

const TIPO = { '+': 'somma', '−': 'differenza', '×': 'prodotto', '÷': 'quoziente' }
export const OPERAZIONI = Object.keys(TIPO)

const dentro = (g, alto = GRADO_A_MENTE) => Math.max(1, Math.min(alto, g))

// il grado più alto che sta all'età: il suo livello 0-100 non supera quello degli anni
export function gradoDellEta(op, eta) {
  const tipo = conti.tipi.find(t => t.chiave === 'conti:' + TIPO[op])
  const qui = livelloDegliAnni(eta)
  let g = 1
  for (const [grado, livello] of Object.entries(tipo.livello)) if (livello <= qui) g = Math.max(g, +grado)
  return g
}

// dalle tabelline che reggono negli asteroidi: un gradino sopra quello che sa già
export function gradoDelleTabelline(items) {
  const f = frontieraTabelline(items || {})
  return f >= 9 ? 6 : f >= 7 ? 5 : f >= 5 ? 4 : f >= 3 ? 3 : f >= 2 ? 2 : 0
}

export function partenza(op, { eta, items } = {}) {
  let g = eta == null ? 3 : gradoDellEta(op, eta)
  const tab = gradoDelleTabelline(items)
  if (op === '×') g = Math.max(g, tab)
  if (op === '÷') g = Math.max(g, tab - 1)
  return dentro(g, PARTENZA_MAX)
}

// la base di ogni operazione: quella salvata, o la partenza per quelle mai giocate
export function basi(salvate, ctx) {
  const out = {}
  for (const op of OPERAZIONI) {
    const s = salvate && salvate[op]
    out[op] = typeof s === 'number' && Number.isFinite(s) ? dentro(s) : partenza(op, ctx)
  }
  return out
}

// il grado di un conto: la base di inizio battaglia, più un grado ogni RAMPA_OGNI conti giusti già fatti.
// Cresce solo col procedere della battaglia, mai con la scelta: il prezzo non c'entra più
export const gradoDi = (base, giusti) =>
  dentro(Math.round(base) + Math.min(RAMPA_MAX, Math.floor(giusti / RAMPA_OGNI)))

export function dopoLaRisposta(base, { giusto, tempo }) {
  const passo = !giusto ? PASSO.sbagliato : tempo <= SVELTO ? PASSO.svelto : PASSO.lento
  return dentro(base + passo)
}
