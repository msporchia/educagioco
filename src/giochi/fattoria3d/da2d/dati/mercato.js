/* Il mercato: chi ordina e quanto rende un ordine (dato puro; le regole stanno in motore/mercato.js).
   Paga esperienza, mai monete (niente si vende) — vedi docs/fattoria/chi-chiede.md e regole.md. */
import { COLTURE, RICETTE, PRODOTTI, PROFONDITA, profonditaDi } from './coltivazioni.js'
import { livelloDelProdotto } from './livelli.js'

// I clienti sono mestieri, non nomi propri. vuole restringe chi può chiedere una merce (clientiPer);
// chi non lo dichiara (la nonna, il bottegaio) prende di tutto — vedi docs/fattoria/chi-chiede.md.
export const CLIENTI = [
  { id: 'fornaio',     nome: 'Il fornaio',     emoji: '🥖',
    vuole: ['grano', 'uova', 'latte', 'patate', 'farina', 'pane', 'biscotti'] },
  { id: 'pasticcera',  nome: 'La pasticcera',  emoji: '🧁',
    vuole: ['uova', 'latte', 'fragole', 'miele', 'merenda', 'burro', 'torta',
            'crostata', 'biscotti', 'gelato', 'frullato', 'marmellata',
            'caramelle', 'zucchero'] },
  { id: 'nonna',       nome: 'La nonna',       emoji: '👵' },
  { id: 'cuoco',       nome: 'Il cuoco',       emoji: '👨‍🍳',
    vuole: ['tartufi', 'patate', 'melanzane', 'peperoni', 'cavolfiori', 'aglio',
            'formaggio', 'burro', 'minestrone', 'conserva', 'salsa', 'parmigiana',
            'pasta', 'lasagne', 'fritto', 'arancini'] },
  { id: 'maestra',     nome: 'La maestra',     emoji: '🍎',
    vuole: ['fragole', 'carote', 'latte', 'uova', 'merenda', 'pane', 'torta',
            'crostata', 'succo', 'biscotti', 'frullato'] },
  { id: 'bottegaio',   nome: 'Il bottegaio',   emoji: '🏪' },
  { id: 'veterinaria', nome: 'La veterinaria', emoji: '🩺',
    vuole: ['mangime', 'pastone', 'becchime', 'foraggio', 'beverone', 'pastura'] },
  { id: 'giardiniere', nome: 'Il giardiniere', emoji: '🌻',
    vuole: ['concime', 'fiori', 'zucche', 'lavanda', 'fieno'] },
  // Il bidello è il secondo cliente della mensa: la merenda che la maestra non chiede.
  { id: 'bidello',     nome: 'Il bidello',     emoji: '🧹',
    vuole: ['pane', 'succo', 'latte', 'minestrone', 'pasta', 'biscotti',
            'gelato', 'sapone'] },
  // I quattro mestieri dell'orto: una merce senza uno che la chiede per mestiere finisce al bottegaio.
  { id: 'pizzaiolo',   nome: 'Il pizzaiolo',   emoji: '🍕',
    vuole: ['pomodori', 'cipolle', 'aglio', 'melanzane', 'peperoni', 'grano',
            'salsa', 'farina', 'pizza'] },
  { id: 'fruttivendola', nome: 'La fruttivendola', emoji: '🥕',
    vuole: ['pomodori', 'patate', 'cipolle', 'cavolfiori', 'carote', 'fragole',
            'zucche', 'mais', 'barbabietola'] },
  { id: 'apicoltore',  nome: 'L\'apicoltore',  emoji: '🐝',
    vuole: ['miele', 'fiori', 'cipolle'] },
  { id: 'sarta',       nome: 'La sarta',       emoji: '🧵',
    vuole: ['lana', 'stoffa', 'maglione', 'maglione_lavanda', 'sacchetto',
            'sciarpa_lana', 'berretto'] },
  // L'oste vuole quello che si mette in tavola: tiene il pane fuori dalle mani del solo fornaio.
  { id: 'oste',        nome: 'L\'oste',        emoji: '🍽️',
    vuole: ['pane', 'tartufi', 'uova', 'latte', 'formaggio', 'polenta',
            'minestrone', 'salsa', 'pizza', 'lasagne', 'patatine', 'arancini'] },
  // La lavandaia non chiede solo il sapone: anche lavanda e stoffa, per dare un banco a chi non ha ancora la tintoria.
  { id: 'lavandaia',   nome: 'La lavandaia',   emoji: '🧼',
    vuole: ['sapone', 'lavanda', 'stoffa', 'sacchetto'] },
  // Il settimo mestiere dell'albero nuovo: riso e pesce crudi, sushi e maki dalla bottega.
  { id: 'sushi',       nome: 'Il cuoco del sushi', emoji: '🍣',
    vuole: ['riso', 'pesce', 'sushi', 'maki'] },
]

export const clienteDi = id => CLIENTI.find(c => c.id === id) || CLIENTI[0]

// Chi non dichiara vuole c'è sempre; se nessuno la vuole ci sono tutti (mai un ordine senza cliente).
export function clientiPer(chiede) {
  const merci = Object.keys(chiede || {})
  const suoi = CLIENTI.filter(c => !c.vuole || c.vuole.some(p => merci.includes(p)))
  return suoi.length ? suoi : CLIENTI
}

// Tre ordini alla volta: uno chiude chi non ha nulla, dieci sono un elenco da leggere.
export const POSTI = 3

// Numeri piccoli apposta ("tre grano" si conta sulle dita); tre pezzi stanno anche nello scomparto più piccolo.
export const MERCI_MAX = 3
export const PEZZI_MAX = 3

// Un rifiutato aspetta, un consegnato riempie subito: se no si scorre finché esce quello facile.
export const RIPOSO_MIN = 5

// PREMIO_BASE il disturbo di portare la roba, PER_GESTO quanto vale un gesto, BONUS_FASE il bonus per fase.
export const PREMIO_BASE = 6
export const PER_GESTO = 2
export const BONUS_FASE = 0.2

// 🪙6 = un minuto di esercizio: il cambio con cui si controlla che un ordine non renda più del tempo che chiede.
export const MONETE_AL_MINUTO = 6

// Risalgono la catena da soli, sulla strada più economica e più svelta — vedi docs/fattoria/catena.md.
const menoDi = (a, b) => (a < b ? a : b)

// giri è PROFONDITA di dati/coltivazioni.js, non un numero scritto qui.
export function valoreDi(prodotto, giri = PROFONDITA) {
  if (giri <= 0 || !PRODOTTI[prodotto]) return Infinity
  let min = Infinity
  for (const c of COLTURE)
    if (c.da === prodotto) min = menoDi(min, (c.semina || 0) + (c.raccolta || 0))
  for (const r of RICETTE) {
    if (r.da !== prodotto) continue
    let n = r.costo || 0
    for (const [k, q] of Object.entries(r.prende || {})) n += q * valoreDi(k, giri - 1)
    min = menoDi(min, n)
  }
  return min
}

export function minutiDi(prodotto, giri = PROFONDITA) {
  if (giri <= 0 || !PRODOTTI[prodotto]) return Infinity
  let min = Infinity
  for (const c of COLTURE) if (c.da === prodotto) min = menoDi(min, c.minuti || 0)
  for (const r of RICETTE) {
    if (r.da !== prodotto) continue
    let n = r.minuti || 0
    for (const [k, q] of Object.entries(r.prende || {})) n += q * minutiDi(k, giri - 1)
    min = menoDi(min, n)
  }
  return min
}

// Quanti gesti (non monete) ci vogliono per un pezzo: paga il premio, perché i gesti costano quasi tutti uguale.
export function gestiDi(prodotto, giri = PROFONDITA) {
  if (giri <= 0 || !PRODOTTI[prodotto]) return Infinity
  let min = Infinity
  for (const c of COLTURE) if (c.da === prodotto) min = menoDi(min, 1)
  for (const r of RICETTE) {
    if (r.da !== prodotto) continue
    let n = 1
    for (const [k, q] of Object.entries(r.prende || {})) n += q * gestiDi(k, giri - 1)
    min = menoDi(min, n)
  }
  return min
}

// Quanto rende un pezzo, senza la base: mongolfiera e botteghe pagano pezzo per pezzo con lo stesso conto.
export function premioDelPezzo(prodotto) {
  const g = gestiDi(prodotto), f = profonditaDi(prodotto)
  if (!Number.isFinite(g) || !Number.isFinite(f)) return 0
  return PER_GESTO * g * (1 + BONUS_FASE * (f - 1))
}

// Quale strada è la migliore per una merce con più ricette: devono ordinare come il consiglio (stesso
// megliaDi), se no un tasto apre il baule su una macchina diversa da quella scritta in riga.
export const costoDellaRicetta = r =>
  Object.entries(r.prende || {}).reduce((n, [k, q]) => n + q * valoreDi(k), r.costo || 0)
export const minutiDellaRicetta = r =>
  Object.entries(r.prende || {}).reduce((n, [k, q]) => n + q * minutiDi(k), r.minuti || 0)
export const megliaDi = haTutto => (a, b) =>
  (haTutto(b) - haTutto(a))
  || (costoDellaRicetta(a) - costoDellaRicetta(b))
  || (minutiDellaRicetta(a) - minutiDellaRicetta(b))

// Sta qui e non nel motore perché è un numero della tabella: si ritocca leggendo il ragionamento in testa.
export function premioPer(chiede) {
  let pezzi = 0
  for (const [k, n] of Object.entries(chiede || {})) pezzi += n * premioDelPezzo(k)
  return Math.round(PREMIO_BASE + pezzi)
}

// Pesca pesata (non uniforme): mezzo punto per fase oltre la prima, due punti se arrivata di recente —
// senza, le merci profonde e le novità uscivano di rado.
export const NOVITA = 6
export function pesoDellaMerce(prodotto, livello) {
  const f = profonditaDi(prodotto)
  const nuova = livelloDelProdotto(prodotto) > Math.max(1, livello | 0) - NOVITA
  return 1 + 0.5 * (Math.max(1, Number.isFinite(f) ? f : 1) - 1) + (nuova ? 2 : 0)
}

// Minuti veri con un campo e una macchina sola: il tetto del premio, e il numero scritto sotto l'ordine.
export function minutiPer(chiede) {
  let m = 0
  for (const [k, n] of Object.entries(chiede || {})) m += n * minutiDi(k)
  return Number.isFinite(m) ? m : 0
}

// Nessun elenco a mano: si può chiedere quando è ottenibile (livelloDelProdotto).
export const merciDelLivello = livello =>
  Object.keys(PRODOTTI).filter(p => livelloDelProdotto(p) <= Math.max(1, livello | 0))

export function guastiDelMercato() {
  const g = []
  if (!CLIENTI.length) g.push('nessun cliente: il mercato sarebbe vuoto')
  const visti = new Set()
  for (const c of CLIENTI) {
    if (visti.has(c.id)) g.push(`il cliente ${c.id} c'è due volte`)
    visti.add(c.id)
    if (!c.nome || !c.emoji) g.push(`il cliente ${c.id} è senza nome o senza faccia`)
    // Una merce inesistente in vuole non dà errore: quel cliente semplicemente non viene mai per quella roba.
    for (const p of c.vuole || [])
      if (!PRODOTTI[p]) g.push(`${c.id}: vuole «${p}», che non è una merce`)
    if (c.vuole && !c.vuole.length)
      g.push(`${c.id}: dichiara un «vuole» vuoto — non verrebbe mai`)
  }
  // Almeno un cliente che prende di tutto, se no una merce dimenticata non la chiederebbe nessuno.
  if (!CLIENTI.some(c => !c.vuole))
    g.push('nessun cliente prende di tutto: una merce dimenticata non la chiederebbe nessuno')
  if (!(POSTI >= 2 && POSTI <= 4)) g.push('gli ordini aperti non sono due o tre')
  if (!(RIPOSO_MIN > 0)) g.push('rifiutare non fa aspettare: si scorrerebbe fino al facile')
  // Un ordine non rende più del tempo che costa: controllato sul caso peggiore, merce per merce.
  for (const p of Object.keys(PRODOTTI)) {
    const v = valoreDi(p), m = minutiDi(p)
    if (!Number.isFinite(v) || !Number.isFinite(m)) {
      g.push(`nota: ${p} non si produce in nessun modo`)
      continue
    }
    if (!(m > 0)) g.push(`${p} si produce in zero minuti: il tetto del premio non tiene`)
    const reso = premioPer({ [p]: PEZZI_MAX })
    const tempo = MONETE_AL_MINUTO * m * PEZZI_MAX
    if (reso > tempo)
      g.push(`${PEZZI_MAX} ${p} rendono ${reso} e costano ${tempo} di tempo: troppo`)
    // E niente in quantità che non ci sta in uno scomparto appena costruito (8 = SCOMPARTO_BASE).
    if (PEZZI_MAX > 8) g.push('un ordine chiede più di quanto tenga uno scomparto')
  }
  return g
}
