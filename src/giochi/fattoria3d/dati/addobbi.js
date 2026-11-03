/* Gli addobbi delle bestie nella fattoria 3D (dato puro): gli stessi dodici della 2D (id, nome, prezzo, aggancio, la campanella solo ai gatti,
   il cappello da strega solo a Halloween: src/giochi/fattoria3d/da2d/dati/addobbi.js), ma tutti in vendita. Nella 2D cinque erano sospesi perché
   un'emoji di fiocco o di zainetto non sta su una bestia a quattro zampe; in 3D ognuno è un modello (scena3d/modelli-addobbi.js).
   Dove cade un aggancio su ogni corpo lo dice `AGGANCI` in scena3d/modelli-addobbi.js. Vedi docs/fattoria3d/addobbi.md. */
import { ADDOBBI as ADDOBBI_2D } from '../da2d/dati/addobbi.js'
import { AGGANCI_TUTTI } from '../da2d/dati/animali.js'
import { curabile } from './bestie.js'
import { COLORI, COLORI_2D, NATALE, chiaveDi } from './addobbi-colori.js'

export { AGGANCI_TUTTI, COLORI }
// L'emoji della carta per quello che nella 2D era un disegno in pixel.
const EMOJI = { cappello_strega: '🧙' }
const coi = (a, colori) => ({ ...a, liv: a.liv || 1, colori: colori.map(id => ({ id, nome: COLORI[id][0], hex: COLORI[id][1] })) })
/** I dodici della 2D (che si riconoscono dall'ordine e dai prezzi: un test li confronta) e poi quelli di Natale, solo 3D. Ognuno ha i suoi `colori`. */
export const ADDOBBI = [
  ...ADDOBBI_2D.map(a => coi({ id: a.id, nome: a.nome, emoji: a.emoji || EMOJI[a.id], prezzo: a.prezzo, dove: a.dove,
    ...(a.per ? { per: a.per } : {}), ...(a.stagione ? { stagione: a.stagione } : {}) }, COLORI_2D[a.id])),
  ...NATALE.map(a => coi({ id: a.id, nome: a.nome, emoji: a.emoji, prezzo: a.prezzo, dove: a.dove, liv: a.liv, stagione: 'natale' }, a.colori)),
]
export const N_ADDOBBI_2D = ADDOBBI_2D.length
export const PER_ID = Object.fromEntries(ADDOBBI.map(a => [a.id, a]))
export const addobbo = id => PER_ID[id] || null

/** La chiave `<id>:<colore>` di un addobbo posseduto o addosso; l'id solo (un salvataggio di prima) vale il colore di base. Null se non esiste. */
export const chiaveAddobbo = valore => chiaveDi(valore, id => (PER_ID[id] ? PER_ID[id].colori.map(c => c.id) : null))
/** Una chiave (o un id) → { addobbo, colore } con il colore intero ({ id, nome, hex }), o null. */
export function leggiAddobbo(valore) {
  const k = chiaveAddobbo(valore)
  if (!k) return null
  const [id, colore] = k.split(':'), a = PER_ID[id]
  return { chiave: k, addobbo: a, colore: a.colori.find(c => c.id === colore) }
}
export const faChiave = (id, colore) => id + ':' + colore

/** Dove porta qualcosa una bestia: il pappagallo non ha la schiena (ha le ali), come nella 2D. */
export const portaDi = famiglia => (famiglia === 'pappagallo' ? ['testa', 'muso', 'collo'] : AGGANCI_TUTTI)

/** Sta a quella bestia (id 3D di una bestia che si cura)? La famiglia (la campanella è dei gatti) e l'aggancio. */
export function staA(valore, bestia) {
  const a = PER_ID[String(valore).split(':')[0]], b = curabile(bestia)
  if (!a || !b) return false
  if (a.per && !a.per.includes(b.famiglia)) return false
  return portaDi(b.famiglia).includes(a.dove)
}

/** Quelli che si mostrano a una bestia: quelli che le stanno, e di una festa solo in quella festa (o se li hai già: comprato resta).
    Per aggancio, poi la festa di oggi prima, poi per prezzo. `tieni`: gli id che hai (nel cassetto o addosso). */
export const addobbiPer = (bestia, { stagione = '', tieni = [] } = {}) =>
  ADDOBBI.filter(a => staA(a.id, bestia) && (!a.stagione || a.stagione === stagione || tieni.includes(a.id)))
    .sort((x, y) => AGGANCI_TUTTI.indexOf(x.dove) - AGGANCI_TUTTI.indexOf(y.dove) || !!y.stagione - !!x.stagione || x.prezzo - y.prezzo)

/** Il cassetto (gli addobbi comprati e non addosso) letto da un salvataggio: { chiave: quanti }. Un id solo (salvataggio di prima) diventa il colore
    di base; un colore che non esiste si butta. */
export function cassettoInForma(letto) {
  const fuori = {}
  if (!letto || typeof letto !== 'object' || Array.isArray(letto)) return fuori
  for (const [id, n] of Object.entries(letto)) {
    const k = chiaveAddobbo(id)
    if (k && Number.isFinite(n) && n >= 1) fuori[k] = Math.min(99, (fuori[k] || 0) + Math.floor(n))
  }
  return fuori
}
export function guastiDegliAddobbi3d() {
  const g = []
  for (const a of ADDOBBI) {
    if (!a.emoji) g.push(`${a.id}: senza emoji per la carta`)
    if (!AGGANCI_TUTTI.includes(a.dove)) g.push(`${a.id}: l'aggancio «${a.dove}» non esiste`)
    if (!(a.prezzo >= 6 && a.prezzo <= 30)) g.push(`${a.id}: 🪙${a.prezzo} è fuori dalla fascia di una cosetta (6–30)`)
    if (!(a.liv >= 1 && a.liv <= 70)) g.push(`${a.id}: livello ${a.liv} fuori scala`)
    if (a.colori.length < 3) g.push(`${a.id}: pochi colori, non è uno scaffale`)
    if (new Set(a.colori.map(c => c.id)).size !== a.colori.length) g.push(`${a.id}: un colore doppio`)
  }
  if (ADDOBBI.slice(0, N_ADDOBBI_2D).map(a => a.id).join() !== ADDOBBI_2D.map(a => a.id).join()) g.push('i primi addobbi non sono quelli della 2D')
  for (const dove of AGGANCI_TUTTI) if (!ADDOBBI.some(a => a.dove === dove)) g.push(`sull'aggancio «${dove}» non si mette niente`)
  return g
}
