// L'albero delle abilità, i punti e le caselle (docs/sotterraneo/abilita.md). Funzioni pure sulla crescita
// dell'avventura (motore/crescita.js), come i punti delle caratteristiche: `albero` dice il grado di ogni nodo
// imparato, `caselle` le abilità che si portano nello scontro. Cosa fanno nello scontro lo sa motore/corsa.js.
import { RAMI, NODI, LIVELLI_PER_GRADO, CASELLE_ABILITA, PUNTI_ABILITA_PER_LIVELLO, nodiSopra } from '../dati/abilita.js'
import { livelloDi, GEMME_PER_RIASSEGNARE } from '../dati/livelli.js'

const livelloDella = cr => livelloDi(cr ? cr.esp : 0)
export const gradoDi = (cr, id) => (cr && cr.albero && cr.albero[id]) || 0
export const spesiDella = cr => Object.values((cr && cr.albero) || {}).reduce((a, b) => a + b, 0)
export const puntiAbilita = cr => Math.max(0, (livelloDella(cr) - 1) * PUNTI_ABILITA_PER_LIVELLO - spesiDella(cr))

// il livello che serve per il grado `g` di un nodo: il suo gradino, e due livelli in più per ogni grado sopra il primo
export const livelloPer = (nodo, g) => nodo.dal + (g - 1) * LIVELLI_PER_GRADO

// perché un nodo non si può imparare adesso, in parole da bambino (o '' se si può). La riga sopra nel ramo va
// aperta prima: basta aver imparato uno dei suoi nodi (quando sono due si sceglie), ed è quello che fa un albero
export function perchéNonImpari(cr, classe, id) {
  const nodo = NODI[id]
  if (!nodo || nodo.classe !== classe) return 'non è un\'abilità di questo eroe'
  const g = gradoDi(cr, id)
  const serve = livelloPer(nodo, g + 1)
  if (livelloDella(cr) < serve) return `dal livello ${serve}`
  const sopra = nodiSopra(nodo)
  if (sopra.length && !sopra.some(x => gradoDi(cr, x.id))) return `prima ${sopra.map(x => x.nome).join(' o ')}`
  if (puntiAbilita(cr) <= 0) return 'nessun punto da dare'
  return ''
}
export const puoiImparare = (cr, classe, id) => !perchéNonImpari(cr, classe, id)

// un punto dato a un nodo: torna la crescita nuova, o null. Un'abilità appena imparata va da sé in una casella
// vuota: senza, chi la impara a metà discesa non la troverebbe nello scontro e penserebbe di non averla presa
export function impara(cr, classe, id) {
  if (!puoiImparare(cr, classe, id)) return null
  const albero = { ...((cr && cr.albero) || {}), [id]: gradoDi(cr, id) + 1 }
  let caselle = caselleDella(cr)
  if (!NODI[id].sempre && !caselle.includes(id)) {
    const vuota = caselle.indexOf(null)
    if (vuota >= 0) caselle = caselle.map((x, i) => (i === vuota ? id : x))
  }
  return { ...cr, albero, caselle }
}

// le tre caselle, sempre tre posti (null = vuoto)
export function caselleDella(cr) {
  const c = Array.isArray(cr && cr.caselle) ? cr.caselle : []
  return Array.from({ length: CASELLE_ABILITA }, (_, i) => c[i] || null)
}

// un'abilità imparata nella casella `i` (null la svuota). Se stava già in un'altra casella le due si scambiano:
// la stessa abilità non sta in due posti, e quella che c'era non sparisce
export function metti(cr, i, id) {
  if (!(i >= 0 && i < CASELLE_ABILITA)) return null
  if (id != null && (!NODI[id] || NODI[id].sempre || !gradoDi(cr, id))) return null
  const caselle = caselleDella(cr)
  const prima = caselle[i]
  const j = id != null ? caselle.indexOf(id) : -1
  caselle[i] = id
  if (j >= 0 && j !== i) caselle[j] = prima
  return { ...cr, caselle }
}

// un dato storto non porta giù il gioco: nodi sconosciuti, di un'altra classe o oltre il grado si buttano, e
// se i punti spesi sono più di quelli che il livello concede si toglie dalla fine. Le caselle tengono solo le
// abilità imparate. `classe` può mancare (si tiene tutto ciò che esiste)
export function rileggiAlbero(dato, esp, classe = null) {
  const albero = {}
  let resta = (livelloDi(esp || 0) - 1) * PUNTI_ABILITA_PER_LIVELLO
  const a = dato && typeof dato.albero === 'object' && dato.albero ? dato.albero : {}
  for (const [id, g] of Object.entries(a)) {
    const nodo = NODI[id]
    if (!nodo || (classe && nodo.classe !== classe)) continue
    const v = Math.min(Number.isFinite(g) && g > 0 ? Math.floor(g) : 0, resta)
    if (v > 0) { albero[id] = v; resta -= v }
  }
  const caselle = caselleDella(dato).map(id => (id && albero[id] && !NODI[id].sempre ? id : null))
  return { albero, caselle: caselle.map((id, i) => (caselle.indexOf(id) === i ? id : null)) }
}

// dimenticare l'albero (l'utente, 9 ottobre): i punti tornano da dare e le caselle si svuotano, e si paga in gemme
// a punto (GEMME_PER_RIASSEGNARE). null se non c'è niente da dimenticare
export const costoDelDimenticare = cr => spesiDella(cr) * GEMME_PER_RIASSEGNARE
export function dimentica(cr) {
  if (!spesiDella(cr)) return null
  return { ...cr, albero: {}, caselle: caselleDella(null) }
}

// il giocatore finto e le misure: dove andrebbe il prossimo punto seguendo un ramo, poi il resto in fila.
// Torna l'id, o null se non c'è niente da imparare
export function prossimoNodo(cr, classe, ramo = null) {
  const rami = RAMI[classe] || []
  const ordine = ramo ? [rami.find(r => r.chiave === ramo), ...rami.filter(r => r.chiave !== ramo)].filter(Boolean) : rami
  for (const r of ordine) for (const nodo of r.nodi) if (puoiImparare(cr, classe, nodo.id)) return nodo.id
  return null
}

// La strada del giocatore finto (motore/banco.js) e dell'eroe che il gioco si aspetta (motore/forza.js): l'albero preso come
// lo prenderebbe un bambino che guarda cosa serve, non un ottimizzatore. In fila: un'abilità che colpisce, la difesa o la
// cura entro il livello 4, il resto del ramo che picchia, un'area; e solo rami che non vogliono un'arma in mano (Furia,
// Giuramento, Luna, Bosco, Fucina, Pietra, Arcano) o la vogliono sempre (il fuoco del mago, che comincia con la verga e poi lascia il lavoro all'Arcano): la roba attesa cambia l'arma da
// una discesa all'altra (la Mazza di Grumo, l'arco al posto della spada), e un ramo che per metà della storia non vale
// non è una strada.
// Finita la fila si migliorano i nodi nello stesso ordine. Gli id sono chiavi del salvataggio (dati/abilita.js)
export const STRADA = {
  cavaliere: ['colpo-furioso', 'preghiera', 'rabbia', 'cuore-saldo', 'carica', 'luce-sacra', 'macello', 'giudizio', 'tempesta-di-colpi'],
  elfa: ['raggio-di-luna', 'rovi', 'luce-d-argento', 'linfa', 'notte-gelida', 'spore', 'falce-di-luna', 'ortica', 'luna-piena'],
  mago: ['dardo-di-fuoco', 'scudo-arcano', 'fonte-arcana', 'raggio-arcano', 'fulmine', 'catena-di-fulmini', 'fiamma-viva', 'mente-lucida', 'sfera-di-fuoco', 'esplosione', 'specchio'],
  nano: ['martello-caldo', 'pelle-di-pietra', 'fornace', 'rune', 'ferro-rovente', 'cuore-di-pietra', 'scintille-di-fucina', 'pugno-di-pietra', 'colata'],
}

// il prossimo punto sulla strada: il primo nodo della fila che si può imparare e non si ha ancora, poi il primo che si può
// migliorare, poi (la fila è finita) il primo nodo qualunque. null se non c'è niente da imparare
export function prossimoDellaStrada(cr, classe) {
  const fila = STRADA[classe] || []
  return fila.find(id => !gradoDi(cr, id) && puoiImparare(cr, classe, id)) ||
         fila.find(id => puoiImparare(cr, classe, id)) ||
         prossimoNodo(cr, classe)
}

// tutti i punti abilità da dare, dati sulla strada (l'eroe atteso a un livello li ha già spesi)
export function conLaStrada(cr, classe) {
  let c = cr
  for (let i = 0; i < 400 && puntiAbilita(c) > 0; i++) {
    const id = prossimoDellaStrada(c, classe)
    const n = id && impara(c, classe, id)
    if (!n) break
    c = n
  }
  return c
}

