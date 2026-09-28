// La scaletta degli asteroidi — pianeti e stazioni fusi in una fila sola.
// Il perché dei criteri di fusione e di ogni giunzione: docs/asteroidi/scaletta.md.
import { CAMPAGNA } from './tabelline.js'
import { STAZIONI, CONCETTI } from './calcolo.js'

// I capitoli spezzano la fila in blocchi per la mappa.
// Voci: `p<i>` = pianeta in CAMPAGNA, `m<i>` = stazione in STAZIONI.
const CAPITOLI_ORDINE = [
  { emoji: '🚀', titolo: 'Si comincia',
    che: 'I primi conti e le prime due tabelline, quelle che sono una regola.',
    voci: ['m0', 'm1', 'p0', 'p1'] },
  { emoji: '🌑', titolo: 'Le decine',
    che: 'Le decine tonde, gli amici del dieci, e le tabelline che si contano.',
    voci: ['m2', 'p2', 'm3', 'p3'] },
  { emoji: '🌓', titolo: 'Le tabelline di mezzo',
    che: 'Il 4 e il 6 si fanno raddoppiando, il 7 è il più tosto. E la prima decina da scavalcare.',
    voci: ['p4', 'm4', 'p5', 'p6'] },
  { emoji: '🌗', titolo: 'Due cifre',
    che: 'I numeri diventano grandi, ma le colonne non si parlano ancora. E le ultime due tabelline.',
    voci: ['m5', 'p7', 'p8'] },
  { emoji: '☄️', titolo: 'I conti che si portano',
    che: 'Il riporto e il prestito, e poi la scorciatoia dei quasi tondi.',
    voci: ['m6', 'm7'] },
  { emoji: '🌠', titolo: 'Moltiplicare e dividere a mente',
    che: 'Prima il sole, con tutte le tabelline insieme: poi si moltiplica e si divide in grande.',
    voci: ['p9', 'm8', 'm9'] },
  { emoji: '⭐', titolo: 'Fino a mille, e la prova',
    che: 'I numeri grandi, e poi la prova: niente di nuovo, nessuno sconto.',
    voci: ['m10', 'm11'] },
]

const daCodice = c => {
  const i = +c.slice(1)
  return c[0] === 'p'
    ? { tipo: 'pianeta', i, T: CAMPAGNA[i] }
    : { tipo: 'mente', i, T: STAZIONI[i] }
}

// `pos` è la posizione unica nella fila (n = pos+1, per il bambino); `i`
// resta l'indice nella campagna di provenienza, per chi parla ancora di
// pianeti/stazioni separati (premio tappa, tavola pitagorica, mappa concetti).
export const SCALETTA = CAPITOLI_ORDINE
  .flatMap((c, cap) => c.voci.map(codice => ({ ...daCodice(codice), cap })))
  .map((v, pos) => ({ ...v, pos, n: pos + 1 }))

export const CAPITOLI = CAPITOLI_ORDINE.map(({ emoji, titolo, che }) => ({ emoji, titolo, che }))

// Il volo infinito dopo la fila (vedi docs/asteroidi/volo.md); chi pesca
// cosa sta in store/volo.js. Nessuna `portata`: non è una tappa della fila,
// e chi non ne dichiara una è sempre alla portata di tutti.
export const VOLO = {
  i: -1, nome: 'Volo infinito', emoji: '♾️',
  nuova: null, tabelle: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10],
  nuovi: [], concetti: CONCETTI.map(c => c.id), esempio: 'tutto',
  dritta: 'Tabelline e conti a mente insieme, sempre più tosti, senza fine.',
  bersaglio: Infinity, mirate: 0,
}

/* ═══════════ le domande che si fanno sulla fila ═══════════
   Tutto quello che segue lavora su UN numero: quante voci della fila
   sono state passate. Sono funzioni pure — girano in Node e non
   importano il profilo. */

/* il contatore, letto dal campo degli asteroidi del profilo */
export const filaDi = mate => Math.max(0, Math.round((mate && mate.fila) || 0))

// I due travasi fra il contatore unico e i due specchi mate.tappa/calc.tappa.
// filaDaCampagne tiene la posizione più avanzata compatibile con i due
// contatori (migrazione volutamente generosa: docs/asteroidi/scaletta.md).
export function campagneDaFila(fila) {
  const fatte = SCALETTA.slice(0, Math.max(0, Math.min(SCALETTA.length, fila)))
  return { pianeta: fatte.filter(v => v.tipo === 'pianeta').length,
           mente: fatte.filter(v => v.tipo === 'mente').length }
}

export function filaDaCampagne(pianeti = 0, mente = 0) {
  let ultima = -1
  for (const v of SCALETTA) if (v.i < (v.tipo === 'pianeta' ? pianeti : mente)) ultima = v.pos
  return ultima + 1
}

/* dove si porta il contatore chi ha appena superato questa voce */
export const filaDopo = v => v.pos + 1

// vale uguale per un pianeta e per una stazione
export const superata = (v, fila) => v.pos < fila

// tenuto dentro i bordi della fila, per chi chiama senza saperne la lunghezza
export const posizioneOra = fila => Math.max(0, Math.min(SCALETTA.length, fila))

// superata, oppure la prossima; chi chiama ci mette davanti `tuttoAperto()`
// (vedi `tappaAperta` in store/profile.js)
export const raggiunta = (v, fila) => v.pos <= fila

// la prossima voce aperta dopo questa: salta le già superate (si torna
// dov'era) e quelle ancora chiuse per età
export function dopoDi(voce, fila, aperta = v => raggiunta(v, fila)) {
  const da = SCALETTA.findIndex(v => v.pos === voce.pos)
  if (da < 0) return null
  const resto = SCALETTA.slice(da + 1)
  return resto.find(v => aperta(v) && !superata(v, fila)) ||
         resto.find(v => aperta(v)) || null
}

// La tappa che il boss può assaggiare: nessuna se non porta niente di nuovo
// (Sole, «La prova», volo, o non c'è un dopo) — dettagli in
// docs/asteroidi/scaletta.md. Fuori da questi casi il boss resta un boss ma
// pesca di casa (chiaveDelBoss) e va segnato sul motore come tutte le altre.
export function daAssaggiare(voce) {
  if (!voce) return null                  // un volo infinito non ha nessun dopo
  const dopo = (voce.tipo === 'mente' ? STAZIONI : CAMPAGNA)[voce.i + 1] || null
  if (!dopo) return null
  return (voce.tipo === 'mente' ? dopo.nuovi.length : dopo.nuova) ? dopo : null
}
