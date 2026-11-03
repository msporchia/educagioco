/* Gli addobbi delle bestie nella fattoria 3D (dato puro): dodici, ognuno un piccolo modello (scena3d/modelli-addobbi.js) che si vede in scena.
   Il catalogo è di questo gioco, non di un altro: gli id sono le chiavi dei salvataggi (anche di quelli convertiti dalla 2D) e non si rinominano.
   Fascia «una cosetta»: 🪙6–30. Dove cade un aggancio su ogni corpo lo dice `AGGANCI` in scena3d/modelli-addobbi.js. Vedi docs/fattoria3d/addobbi.md. */
import { curabile } from './bestie.js'
import { tintaValida } from '../../../grafica/persona/tinte.js'

/** Ritingere un addobbo (la tavolozza di quindici tinte, grafica/persona/tinte.js): il primo colore di un addobbo, il suo, viene con lui;
    un'altra tinta si compra una volta per addobbo e poi è tua per sempre. Prezzo provvisorio, da confermare (docs/fattoria3d/addobbi.md). */
export const PREZZO_TINTA = 5
/** Le tinte comprate, lette da un salvataggio: { id dell'addobbo: [tinte] }. Quelle che non esistono si buttano; un salvataggio di prima non ne ha. */
export function tinteAddobbiInForma(letto) {
  const fuori = {}
  if (!letto || typeof letto !== 'object' || Array.isArray(letto)) return fuori
  for (const [id, l] of Object.entries(letto)) {
    if (!PER_ID[id] || !Array.isArray(l)) continue
    const t = [...new Set(l.map(tintaValida).filter(Boolean))]
    if (t.length) fuori[id] = t
  }
  return fuori
}
/** Un addobbo con la sua tinta, come lo vuole la scena (`id@tinta`, o l'id solo se è del suo colore). */
export const conTinta = (id, tinta) => (tintaValida(tinta) ? `${id}@${tinta}` : id)
export const leggiTinta = chiave => { const [id, t] = String(chiave || '').split('@'); return { id, tinta: tintaValida(t) } }

/** Dove si attacca qualcosa a una bestia. */
export const AGGANCI_TUTTI = ['testa', 'muso', 'collo', 'schiena']
// `per`: solo di quelle famiglie (senza = di tutte). `stagione`: si compra solo in quella festa (comprato resta). Ordine: per aggancio, poi per prezzo.
export const ADDOBBI = [
  { id: 'fiore', nome: 'Fiorellino', emoji: '🌸', prezzo: 6, dove: 'testa' },
  { id: 'cappellino', nome: 'Cappellino', emoji: '🧢', prezzo: 12, dove: 'testa' },
  { id: 'cilindro', nome: 'Cilindro', emoji: '🎩', prezzo: 18, dove: 'testa' },
  { id: 'corona', nome: 'Coroncina', emoji: '👑', prezzo: 24, dove: 'testa' },
  { id: 'cappello_strega', nome: 'Cappello da strega', emoji: '🧙', prezzo: 8, dove: 'testa', stagione: 'halloween' },
  { id: 'occhialini', nome: 'Occhialini', emoji: '👓', prezzo: 10, dove: 'muso' },
  { id: 'occhiali', nome: 'Occhiali da sole', emoji: '🕶️', prezzo: 16, dove: 'muso' },
  { id: 'fiocco', nome: 'Fiocco', emoji: '🎀', prezzo: 8, dove: 'collo' },
  { id: 'sciarpa', nome: 'Sciarpa', emoji: '🧣', prezzo: 14, dove: 'collo' },
  { id: 'campanella', nome: 'Campanella', emoji: '🔔', prezzo: 10, dove: 'collo', per: ['gatto'] },
  { id: 'mantellina', nome: 'Mantellina', emoji: '🧥', prezzo: 20, dove: 'schiena' },
  { id: 'zainetto', nome: 'Zainetto', emoji: '🎒', prezzo: 22, dove: 'schiena' },
]
export const PER_ID = Object.fromEntries(ADDOBBI.map(a => [a.id, a]))
export const addobbo = id => PER_ID[id] || null

/** Dove porta qualcosa una bestia: il pappagallo non ha la schiena (ha le ali), come nella 2D. */
export const portaDi = famiglia => (famiglia === 'pappagallo' ? ['testa', 'muso', 'collo'] : AGGANCI_TUTTI)

/** Sta a quella bestia (id 3D di una bestia che si cura)? La famiglia (la campanella è dei gatti) e l'aggancio. */
export function staA(id, bestia) {
  const a = PER_ID[id], b = curabile(bestia)
  if (!a || !b) return false
  if (a.per && !a.per.includes(b.famiglia)) return false
  return portaDi(b.famiglia).includes(a.dove)
}

/** Quelli che si mostrano a una bestia: quelli che le stanno, e di una festa solo in quella festa (o se li hai già: comprato resta).
    Per aggancio, poi la festa di oggi prima, poi per prezzo. `tieni`: gli id che hai (nel cassetto o addosso). */
export const addobbiPer = (bestia, { stagione = '', tieni = [] } = {}) =>
  ADDOBBI.filter(a => staA(a.id, bestia) && (!a.stagione || a.stagione === stagione || tieni.includes(a.id)))
    .sort((x, y) => AGGANCI_TUTTI.indexOf(x.dove) - AGGANCI_TUTTI.indexOf(y.dove) || !!y.stagione - !!x.stagione || x.prezzo - y.prezzo)

/** Il cassetto (gli addobbi comprati e non addosso) letto da un salvataggio: { id: quanti }. */
export function cassettoInForma(letto) {
  const fuori = {}
  if (!letto || typeof letto !== 'object' || Array.isArray(letto)) return fuori
  for (const [id, n] of Object.entries(letto)) if (PER_ID[id] && Number.isFinite(n) && n >= 1) fuori[id] = Math.min(99, Math.floor(n))
  return fuori
}

export function guastiDegliAddobbi3d() {
  const g = []
  for (const a of ADDOBBI) {
    if (!a.emoji) g.push(`${a.id}: senza emoji per la carta`)
    if (!AGGANCI_TUTTI.includes(a.dove)) g.push(`${a.id}: l'aggancio «${a.dove}» non esiste`)
    if (!(a.prezzo >= 6 && a.prezzo <= 30)) g.push(`${a.id}: 🪙${a.prezzo} è fuori dalla fascia di una cosetta (6–30)`)
  }
  const visti = new Set()
  for (const a of ADDOBBI) { if (visti.has(a.id)) g.push(`${a.id}: id doppio`); visti.add(a.id); if (!a.nome) g.push(`${a.id}: senza nome`) }
  for (const dove of AGGANCI_TUTTI) if (!ADDOBBI.some(a => a.dove === dove)) g.push(`sull'aggancio «${dove}» non si mette niente`)
  return g
}
