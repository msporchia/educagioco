// L'albero delle abilità, i punti e le caselle (docs/sotterraneo/abilita.md). Funzioni pure sulla crescita
// dell'avventura (motore/crescita.js), come i punti delle caratteristiche: `albero` dice il grado di ogni nodo
// imparato, `caselle` le abilità che si portano nello scontro. Cosa fanno nello scontro lo sa motore/corsa.js.
import { RAMI, NODI, GRADI, LIVELLI_PER_GRADO, CASELLE_ABILITA, PUNTI_ABILITA_PER_LIVELLO } from '../dati/abilita.js'
import { livelloDi } from '../dati/livelli.js'

const livelloDella = cr => livelloDi(cr ? cr.esp : 0)
export const gradoDi = (cr, id) => (cr && cr.albero && cr.albero[id]) || 0
export const spesiDella = cr => Object.values((cr && cr.albero) || {}).reduce((a, b) => a + b, 0)
export const puntiAbilita = cr => Math.max(0, (livelloDella(cr) - 1) * PUNTI_ABILITA_PER_LIVELLO - spesiDella(cr))

// il livello che serve per il grado `g` di un nodo: il suo gradino, e due livelli in più per ogni grado sopra il primo
export const livelloPer = (nodo, g) => nodo.dal + (g - 1) * LIVELLI_PER_GRADO

// perché un nodo non si può imparare adesso, in parole da bambino (o '' se si può). Il nodo sopra nel ramo va
// imparato prima: è quello che fa un albero
export function perchéNonImpari(cr, classe, id) {
  const nodo = NODI[id]
  if (!nodo || nodo.classe !== classe) return 'non è un\'abilità di questo eroe'
  const g = gradoDi(cr, id)
  if (g >= GRADI) return 'è già al massimo'
  const serve = livelloPer(nodo, g + 1)
  if (livelloDella(cr) < serve) return `dal livello ${serve}`
  const ramo = RAMI[classe].find(r => r.chiave === nodo.ramo)
  const sopra = nodo.gradino > 0 ? ramo.nodi[nodo.gradino - 1] : null
  if (sopra && !gradoDi(cr, sopra.id)) return `prima ${sopra.nome}`
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
    const v = Math.min(GRADI, Number.isFinite(g) && g > 0 ? Math.floor(g) : 0, resta)
    if (v > 0) { albero[id] = v; resta -= v }
  }
  const caselle = caselleDella(dato).map(id => (id && albero[id] && !NODI[id].sempre ? id : null))
  return { albero, caselle: caselle.map((id, i) => (caselle.indexOf(id) === i ? id : null)) }
}

// il giocatore finto e le misure: dove andrebbe il prossimo punto seguendo un ramo, poi il resto in fila.
// Torna l'id, o null se non c'è niente da imparare
export function prossimoNodo(cr, classe, ramo = null) {
  const rami = RAMI[classe] || []
  const ordine = ramo ? [rami.find(r => r.chiave === ramo), ...rami.filter(r => r.chiave !== ramo)].filter(Boolean) : rami
  for (const r of ordine) for (const nodo of r.nodi) if (puoiImparare(cr, classe, nodo.id)) return nodo.id
  return null
}

