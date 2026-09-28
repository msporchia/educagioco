/* L'albero di una merce: il consiglio srotolato, tutta la strada e a che punto è (puro, gira in Node).
   Contratto completo (nodo, via, le tre garanzie) in docs/fattoria/pagina-albero.md. */
import { COLTURE, RICETTE, PRODOTTI, PROFONDITA, RESA } from './coltivazioni.js'
import { valoreDi, minutiDi, megliaDi } from './mercato.js'
import { livelloDelProdotto, livelloDellaVoce } from './livelli.js'
import { laMacchina, eCampo, macchinaDi } from './catalogo.js'
import { comeAvere } from '../motore/consiglio.js'

const roba = id => PRODOTTI[id] || { nome: id, emoji: '📦' }

// Aperta: arrivata col livello, lei e la sua macchina (non ancora presa conta come premio, non come merce futura).
const aperta = (f, r) => {
  if ((r.liv || 1) > f.livello) return false
  const m = laMacchina(r.dove)
  return !m || livelloDellaVoce(m) <= f.livello
}

// Quale strada, fra quelle aperte: megliaDi, la stessa funzione del consiglio — vedi docs/fattoria/pagina-albero.md.
const haTuttoIn = f => r => Object.keys(r.prende || {}).every(k => f.quantoHo(k) >= r.prende[k])
const costoVia = v => v.che === 'coltura'
  ? (v.c.semina || 0) + (v.c.raccolta || 0)
  : Object.entries(v.r.prende || {}).reduce((n, [k, q]) => n + q * valoreDi(k), v.r.costo || 0)
const minutiVia = v => v.che === 'coltura'
  ? v.c.minuti || 0
  : Object.entries(v.r.prende || {}).reduce((n, [k, q]) => n + q * minutiDi(k), v.r.minuti || 0)

// Le altre strade aperte, dette con dove si fanno (l'id da solo non direbbe niente a un bambino).
const altraStrada = v => {
  const m = v.che === 'coltura' ? null : laMacchina(v.r.dove)
  return {
    id: v.id,
    nome: v.che === 'coltura' ? v.c.nome : v.r.nome,
    // La voce intera e non il solo nome: il genere sta lì (la in dati/catalogo.js).
    dove: m ? { nome: m.nome, la: !!m.la, plurale: !!m.plurale } : null,
  }
}

// Lo stato della macchina di una riga, con la fila: ok/lavora/compra/premio — vedi docs/fattoria/pagina-albero.md.
function statoMacchina(f, r, ora) {
  const dove = r.dove
  const voce = laMacchina(dove)
  if (!voce) return null
  const tutte = f.cose.filter(c => macchinaDi(c) === dove)
  const base = { id: voce.id, nome: voce.nome, manca: 0, ne: 0, piena: false,
                 unPosto: false, prezzo: null, arriva: null }
  if (!tutte.length) {
    const liv = livelloDellaVoce(voce)
    if (liv > f.livello) return { ...base, stato: 'compra', arriva: liv }
    if (!f.sbloccata(voce.id)) return { ...base, stato: 'premio' }
    return { ...base, stato: 'compra', prezzo: f.quantoCosta(voce.id) }
  }
  const stati = tutte.map(c => f.statoMacchina(c, ora)).filter(Boolean)
  if (stati.some(s => s.pronto)) return { ...base, stato: 'ok' }
  const suoi = stati.flatMap(s => s.coda).filter(p => !p.pronto && p.ricetta.da === r.da)
    .sort((a, b) => a.manca - b.manca)
  if (suoi.length) return { ...base, stato: 'lavora', ne: suoi.length, manca: suoi[0].manca }
  if (stati.some(s => s.libera)) return { ...base, stato: 'ok' }
  const prima = stati.filter(s => s.lavora).sort((a, b) => a.manca - b.manca)[0]
  return { ...base, stato: 'lavora', piena: true, manca: prima ? prima.manca : 0,
           unPosto: stati.every(s => s.posti === 1) }
}

function statoCampo(f, coltura, ora) {
  const campi = f.cose.filter(eCampo).map(c => f.statoCampo(c, ora)).filter(Boolean)
  if (!campi.length) return { stato: 'nessuno', manca: 0 }
  const suoi = campi.filter(s => s.coltura && s.coltura.id === coltura)
  if (suoi.some(s => s.pronto)) return { stato: 'pronto', manca: 0 }
  const cresce = suoi.filter(s => !s.vuoto && !s.pronto).sort((a, b) => a.manca - b.manca)[0]
  if (cresce) return { stato: 'cresce', manca: cresce.manca }
  if (campi.some(s => s.vuoto)) return { stato: 'libero', manca: 0 }
  return { stato: 'occupati', manca: 0 }
}

// Il granaio è uno solo, spartito in ordine di lettura: due rami non dicono tutti e due "ne hai 3" se insieme ne servono 6.
function spartisci(f, prodotto, servono, resto) {
  if (!resto.has(prodotto)) resto.set(prodotto, f.quantoHo(prodotto))
  const ce = resto.get(prodotto)
  resto.set(prodotto, Math.max(0, ce - Math.max(0, servono)))
  return ce
}

export function alberoDi(f, prodotto, ora = Date.now()) {
  return ramoDi(f, prodotto, ora, 1, PROFONDITA, new Map())
}

function ramoDi(f, prodotto, ora, servono, giri, resto) {
  if (!PRODOTTI[prodotto]) return null
  const pr = roba(prodotto)
  const ho = spartisci(f, prodotto, servono, resto)
  const nodo = { prodotto, nome: pr.nome, emoji: pr.emoji, pezzo: pr.pezzo || null,
                 servono, ho, stato: ho >= servono ? 'ok' : 'manca', arriva: null,
                 via: null, rami: [] }
  if (giri <= 0) return { ...nodo, stato: 'arriva', arriva: null }

  // Le strade aperte, col loro costo; vince la più economica.
  const vie = []
  for (const c of COLTURE)
    if (c.da === prodotto && f.colturaAperta(c.id)) vie.push({ che: 'coltura', id: c.id, c })
  for (const r of RICETTE)
    if (r.da === prodotto && aperta(f, r)) vie.push({ che: 'ricetta', id: r.id, r })
  if (!vie.length) {
    const quando = livelloDelProdotto(prodotto)
    return { ...nodo, stato: 'arriva',
             arriva: quando > f.livello && Number.isFinite(quando) ? quando : null }
  }
  // Fra due ricette decide megliaDi; una coltura contro una ricetta si confronta su costo e minuti.
  const meglio = megliaDi(haTuttoIn(f))
  vie.sort((a, b) => (a.che === 'ricetta' && b.che === 'ricetta')
    ? meglio(a.r, b.r)
    : costoVia(a) - costoVia(b) || minutiVia(a) - minutiVia(b))
  const scelta = vie[0]

  // La frase e il tasto sono quelli del consiglio: una riga verde non ha niente da fare.
  const consiglio = nodo.stato === 'ok' ? null : comeAvere(f, prodotto, ora)
  if (scelta.che === 'coltura') {
    const c = scelta.c
    nodo.via = { che: 'coltura', id: c.id, nome: c.nome, minuti: c.minuti, costo: c.raccolta,
                 macchina: null, campo: statoCampo(f, c.id, ora),
                 alternative: vie.slice(1).map(altraStrada),
                 azione: consiglio ? consiglio.azione : null,
                 testo: consiglio ? consiglio.testo : '' }
    return nodo
  }
  const r = scelta.r
  nodo.via = { che: 'ricetta', id: r.id, nome: r.nome, minuti: r.minuti, costo: r.costo,
               macchina: statoMacchina(f, r, ora), campo: null,
               alternative: vie.slice(1).map(altraStrada),
               azione: consiglio ? consiglio.azione : null,
               testo: consiglio ? consiglio.testo : '' }
  // Quanti giri di macchina: servono scende moltiplicato (due stoffe vogliono due giri, ognuno due lane).
  const giriDiMacchina = Math.max(1, Math.ceil(servono / (r.resa || RESA)))
  nodo.rami = Object.entries(r.prende || {})
    .map(([k, q]) => ramoDi(f, k, ora, q * giriDiMacchina, giri - 1, resto))
    .filter(Boolean)
  return nodo
}

// Le righe in fila con le rotaie (guide/ultimo/guideSotto): un rientro solo non basta con rami paralleli — vedi pagina-albero.md.
export function righeDi(nodo, livello = 0, fuori = [], guide = [], ultimo = true) {
  if (!nodo) return fuori
  const guideSotto = livello === 0 ? [] : [...guide, !ultimo]
  fuori.push({ ...nodo, livello, guide, ultimo, guideSotto })
  nodo.rami.forEach((r, i) =>
    righeDi(r, livello + 1, fuori, guideSotto, i === nodo.rami.length - 1))
  return fuori
}

// Le foglie: devono essere colture o nodi arriva, mai una ricetta a metà.
export const foglieDi = nodo => righeDi(nodo).filter(n => !n.rami.length)

// Quanto è profondo: per il test contro PROFONDITA.
export const profonditaDellAlbero = nodo =>
  nodo ? 1 + Math.max(0, ...nodo.rami.map(profonditaDellAlbero)) : 0
