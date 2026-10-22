/* «Come si fa» di una merce: tutta la strada dal campo alla cosa finita, e a che punto si è (puro, gira in Node).
   Il modello è dati/albero.js della fattoria di sempre (docs/fattoria/pagina-albero.md), ma più corto: qui non ci sono silos, scomparti né
   baule, e le bestie hanno il loro mangime come ramo (un uovo vuole becchime, il becchime vuole grano).
   `alberoDi(m, k)` legge il motore `m` (livello, scorte, edifici, campi, macchine) e torna un nodo:
   `{ k, nome, emoji, servono, ho, stato: 'ok' | 'manca' | 'arriva', arriva, via, rami }`, dove
   - `stato`: 'ok' se ne hai abbastanza, 'manca' se no, 'arriva' se la strada si apre solo più avanti (`arriva` = il livello);
   - `via`: dove si fa — `{ che: 'campo' | 'macchina' | 'bestie' | 'molo', tipo, nome, emoji, art, stato, secondi (quanto ci mette), manca (secondi che restano
     se lavora o cresce), arriva (il livello), prezzo }` o null; `stato` dice 'ok', 'pronto', 'lavora', 'cresce', 'libero', 'nessuno', 'compra', 'magazzino', 'arriva';
   - `rami`: gli ingredienti (le cose da avere prima), ognuno un nodo uguale.
   `servono` si moltiplica scendendo (due stoffe vogliono due giri, ognuno due lane) e la scorta è una sola, spartita fra i rami in ordine di
   lettura: due rami che vogliono grano non dicono tutti e due «ne hai 3» se insieme ne chiedono 6. Una strada sola per riga: fra due ricette
   aperte vince quella di cui hai già gli ingredienti, poi la più precoce. L'azione di un nodo che manca (`azione`) la dà chi chiama, di solito
   `comeAvere` di motore/consiglio.js, così la frase e il tasto sono quelli del consiglio. Vedi docs/fattoria3d/guida.md («Come si fa»). */
import { COLTURE } from './colture.js'
import { RICETTE, merceDi } from './ricette.js'
import { PRODOTTI_ANIMALI, LANA, ANIMALI } from './animali.js'
import { PECORE } from './regole.js'
import { PEZZI, EDIFICI } from './catalogo.js'
import { livelloDellaColtura, livelloDellaRicetta, livelloDelPezzo } from './livelli.js'

/** Quante fasi al massimo (il mangime delle bestie conta: uova → becchime → grano è già tre). */
export const PROFONDITA = 8

const luogo = t => EDIFICI[t] || PEZZI[t] || { nome: t, emoji: '📦' }
const roba = k => merceDi(k) || { nome: k, emoji: '📦' }

/** Il mangime e i pasti che una bestia vuole per fare una merce: `[{ k, n }]` (vuoto per il pesce, che non mangia). */
function mangimeDi(k, pezzo) {
  if (LANA[k]) return PECORE.mangia.map(x => ({ k: x, n: PECORE.pastiPerLana || 1 }))
  const a = ANIMALI[pezzo]
  return a ? [{ k: a.mangia[0], n: a.pasti || 1 }] : []
}

// Lo stato della macchina che fa la ricetta: ok (c'è, anche col pronto da ritirare) · lavora · compra · magazzino · arriva
function viaMacchina(m, id, r) {
  const tipo = r.dove, d = luogo(tipo), base = { che: 'macchina', tipo, nome: d.nome, emoji: d.emoji, art: d.art || null, secondi: Math.round(r.ms / 1000), manca: 0, arriva: null, prezzo: null }
  if (!m.s.posseduti[tipo]) {
    if (m.nelMagazzino(tipo) > 0) return { ...base, stato: 'magazzino' }
    const liv = livelloDelPezzo(tipo)
    return liv > m.livello() ? { ...base, stato: 'arriva', arriva: liv } : { ...base, stato: 'compra', prezzo: m.prezzoPezzo(tipo) }
  }
  const Q = m.macchina(tipo), ora = m.ora()
  if ((Q.pronti[r.da || id] || 0) > 0) return { ...base, stato: 'pronto' }
  const suoi = Q.coda.filter(x => x.ric === id && x.fine != null).map(x => Math.max(0, Math.ceil((x.fine - ora) / 1000))).sort((a, b) => a - b)
  if (Q.coda.some(x => x.ric === id)) return { ...base, stato: 'lavora', manca: suoi[0] || 0 }
  return { ...base, stato: 'ok' }
}

function viaCampo(m, k) {
  const c = COLTURE[k], campi = m.s.cose.filter(x => x.tipo === 'campo')
  const base = { che: 'campo', tipo: 'campo', nome: 'Campo', emoji: '🌾', art: 'il', secondi: Math.round(c.ms / 1000), manca: 0, arriva: null, prezzo: null }
  if (!campi.length) return { ...base, stato: 'nessuno' }
  if (campi.some(x => m.campoMaturo(x))) return { ...base, stato: 'pronto' }
  const cresce = campi.filter(x => !m.campoVuoto(x)).map(x => m.restoSecondi(x)).filter(s => s > 0).sort((a, b) => a - b)
  if (cresce.length) return { ...base, stato: 'cresce', manca: cresce[0] }
  return { ...base, stato: campi.some(x => m.campoVuoto(x)) ? 'libero' : 'occupati' }
}

function viaBestie(m, pezzo) {
  const d = luogo(pezzo), base = { che: pezzo === 'molo' ? 'molo' : 'bestie', tipo: pezzo, nome: d.nome, emoji: d.emoji, art: d.art || null, secondi: 0, manca: 0, arriva: null, prezzo: null }
  const cosa = m.s.cose.find(x => x.tipo === pezzo)
  if (cosa) return { ...base, stato: 'ok' }
  if (m.nelMagazzino(pezzo) > 0) return { ...base, stato: 'magazzino' }
  const liv = livelloDelPezzo(pezzo)
  return liv > m.livello() ? { ...base, stato: 'arriva', arriva: liv } : { ...base, stato: 'compra', prezzo: m.prezzoPezzo(pezzo) }
}

// Il granaio è uno solo, spartito in ordine di lettura.
function spartisci(m, k, servono, resto) {
  if (!resto.has(k)) resto.set(k, m.scortaDi(k))
  const ce = resto.get(k)
  resto.set(k, Math.max(0, ce - Math.max(0, servono)))
  return ce
}

/** Le ricette aperte che fanno la merce `k` (le varianti di un mangime hanno `da`), la migliore per prima. */
function ricetteAperte(m, k) {
  const tutte = Object.entries(RICETTE).filter(([id, r]) => (r.da || id) === k)
  const ok = tutte.filter(([id]) => livelloDellaRicetta(id) <= m.livello())
  const haTutto = ([, r]) => Object.entries(r.ing).every(([i, q]) => m.scortaDi(i) >= q)
  ok.sort((a, b) => Number(haTutto(b)) - Number(haTutto(a)) || livelloDellaRicetta(a[0]) - livelloDellaRicetta(b[0]))
  return { tutte, ok }
}

/** L'albero di una merce, o null se non è una merce. `azioneDi(k)` (facoltativa) torna `{ azione, testo }` per un nodo che manca. */
export function alberoDi(m, k, azioneDi = null) {
  return ramo(m, k, 1, PROFONDITA, new Map(), azioneDi)
}

function ramo(m, k, servono, giri, resto, azioneDi) {
  const mer = merceDi(k)
  if (!mer) return null
  const ho = spartisci(m, k, servono, resto)
  const nodo = { k, nome: mer.nome, emoji: mer.emoji, servono, ho, stato: ho >= servono ? 'ok' : 'manca', arriva: null, via: null, azione: null, testo: '', etichetta: '', rami: [] }
  const chiedi = () => { if (nodo.stato !== 'ok' && azioneDi) { const c = azioneDi(k); if (c) { nodo.azione = c.azione || null; nodo.testo = c.testo || ''; nodo.etichetta = c.etichetta || '' } } }
  if (giri <= 0) return { ...nodo, stato: 'arriva' }

  if (COLTURE[k]) {
    const liv = livelloDellaColtura(k)
    if (liv > m.livello()) return { ...nodo, stato: 'arriva', arriva: liv }
    nodo.via = viaCampo(m, k)
    chiedi()
    return nodo
  }
  const bestia = LANA[k] || PRODOTTI_ANIMALI[k]
  if (bestia) {
    const liv = livelloDelPezzo(bestia.dove)
    if (liv > m.livello() && !m.s.posseduti[bestia.dove]) return { ...nodo, stato: 'arriva', arriva: liv }
    nodo.via = viaBestie(m, bestia.dove)
    chiedi()
    // il mangime della bestia (le galline vogliono becchime), ma non per il pesce: lo si pesca e basta
    if (bestia.dove !== 'molo')
      nodo.rami = mangimeDi(k, bestia.dove).map(({ k: x, n }) => ramo(m, x, n * servono, giri - 1, resto, azioneDi)).filter(Boolean)
    return nodo
  }
  const { tutte, ok } = ricetteAperte(m, k)
  if (!ok.length) {
    const quando = tutte.length ? Math.min(...tutte.map(([id]) => livelloDellaRicetta(id))) : null
    return { ...nodo, stato: 'arriva', arriva: quando !== null && Number.isFinite(quando) && quando > m.livello() ? quando : null }
  }
  const [id, r] = ok[0]
  nodo.via = { ...viaMacchina(m, id, r), ricetta: id }
  chiedi()
  nodo.rami = Object.entries(r.ing).map(([x, q]) => ramo(m, x, q * servono, giri - 1, resto, azioneDi)).filter(Boolean)
  return nodo
}

/** Le righe in fila con le rotaie (`guide`, `ultimo`, `guideSotto`): un rientro solo non basta con rami paralleli. */
export function righeDi(nodo, livello = 0, fuori = [], guide = [], ultimo = true) {
  if (!nodo) return fuori
  const guideSotto = livello === 0 ? [] : [...guide, !ultimo]
  fuori.push({ ...nodo, livello, guide, ultimo, guideSotto })
  nodo.rami.forEach((r, i) => righeDi(r, livello + 1, fuori, guideSotto, i === nodo.rami.length - 1))
  return fuori
}

/** Le foglie: devono essere colture, bestie o nodi che arrivano più avanti, mai una ricetta a metà. */
export const foglieDi = nodo => righeDi(nodo).filter(n => !n.rami.length)

/** Quanto è profondo (per il test contro PROFONDITA). */
export const profonditaDellAlbero = nodo => (nodo ? 1 + Math.max(0, ...nodo.rami.map(profonditaDellAlbero)) : 0)
