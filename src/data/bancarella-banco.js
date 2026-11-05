/* IL BANCO TUO — quello che l'incasso compra: la tenda, il carretto, la merce.
   Vedi docs/bancarella/banco.md. Tutto in centesimi: sono gli euro del gioco,
   non le 🪙. Puro, gira in Node. */
import { LISTINO, BANCHI } from './bancarella.js'
import { cucinaPulita } from './bancarella-cucine.js'

/* La scala del carretto: quante ceste stanno sul banco. */
export const CARRETTI = [
  { nome: 'Il carretto',        ceste: 4, prezzo: 0 },
  { nome: 'Il carretto grande', ceste: 5, prezzo: 2000 },
  { nome: 'La bancarella',      ceste: 6, prezzo: 5500 },
  { nome: 'Il chiosco',         ceste: 7, prezzo: 12000 },
  { nome: 'La bottega',         ceste: 8, prezzo: 21000 },
]

/* La scala della tenda: all'ombra i clienti aspettano di più (secondi). */
export const TENDE = [
  { nome: 'Il telo',                pazienza: 0,  prezzo: 0 },
  { nome: 'La tenda a righe',       pazienza: 4,  prezzo: 1500 },
  { nome: 'La tenda grande',        pazienza: 8,  prezzo: 4000 },
  { nome: 'La tenda con la frangia', pazienza: 12, prezzo: 9000 },
  { nome: 'La tenda d\'oro',        pazienza: 16, prezzo: 17000 },
]

/* La merce con cui si comincia. Quattro cose in euro tondi per banco, perché
   le prime giornate sommano a mente, e una per ogni passo fine, se no le
   giornate dei centesimi avrebbero il cartellino tondo (`unita/bancarella-banco`). */
export const MERCE_BASE = {
  frutta:  ['🍌', '🍇', '🥭', '🍍', '🍎', '🍐', '🍓', '🍊'],
  verdura: ['🍆', '🧄', '🫑', '🎃', '🥕', '🥔', '🍅', '🥒'],
  forno:   ['🥨', '🍩', '🥪', '🍔', '🥐', '🥯', '🍰', '🥖'],
  frigo:   ['🥛', '🧃', '🥚', '🍦', '🧈', '🧀', '🐟', '🥓'],
  dolci:   ['🍿', '🥠', '🍫', '🍡', '🍬', '🥤', '🍯', '🍮'],
}
const IN_BASE = new Set(Object.values(MERCE_BASE).flat())

/* Il prezzo di un prodotto nuovo: chi rende di più costa di più. */
export const prezzoMerce = prezzo => Math.max(1000, Math.ceil(prezzo * 6 / 500) * 500)

/* I prodotti da comprare, banco per banco. */
export const MERCE_NUOVA = Object.fromEntries(Object.keys(BANCHI).map(b => [b,
  LISTINO.filter(([e, , , banco]) => banco === b && !IN_BASE.has(e))
    .map(([emoji, nome, prezzo]) => ({ emoji, nome, prezzo, costa: prezzoMerce(prezzo) }))
    .sort((x, y) => x.costa - y.costa)]))

const intero = (n, max) => (Number.isInteger(n) && n >= 0 ? Math.min(n, max) : 0)

/* Il banco salvato, messo a posto. Chi giocava prima di oggi si ritrova in
   cassa quello che ha già incassato (`incassato`): niente va perso. */
export function bancoPulito(salvato, incassato = 0) {
  const s = salvato && typeof salvato === 'object' ? salvato : null
  const vendibili = new Set(Object.values(MERCE_NUOVA).flat().map(m => m.emoji))
  return {
    cassa: s && Number.isInteger(s.cassa) && s.cassa >= 0 ? s.cassa : Math.max(0, Math.round(incassato) || 0),
    tenda: intero(s && s.tenda, TENDE.length - 1),
    carretto: intero(s && s.carretto, CARRETTI.length - 1),
    merce: s && Array.isArray(s.merce) ? [...new Set(s.merce.filter(e => vendibili.has(e)))] : [],
    cucina: cucinaPulita(s && s.cucina),
  }
}

export const cesteDi = b => CARRETTI[b.carretto].ceste
export const pazienzaDi = b => TENDE[b.tenda].pazienza
export const merceMia = b => new Set([...IN_BASE, ...b.merce])

/* Il prossimo gradino di una scala, o `null` in cima. */
const prossimo = (scala, livello) => scala[livello + 1] || null
export const prossimaTenda = b => prossimo(TENDE, b.tenda)
export const prossimoCarretto = b => prossimo(CARRETTI, b.carretto)

/* Una voce da comprare: { che: 'tenda' | 'carretto' } o { che: 'merce', emoji }.
   Quanto costa, o `null` se non c'è più niente da comprare lì. */
export function costoDi(b, voce) {
  if (voce.che === 'tenda') return prossimaTenda(b)?.prezzo ?? null
  if (voce.che === 'carretto') return prossimoCarretto(b)?.prezzo ?? null
  if (b.merce.includes(voce.emoji)) return null
  const m = Object.values(MERCE_NUOVA).flat().find(x => x.emoji === voce.emoji)
  return m ? m.costa : null
}

/* Il banco dopo l'acquisto, o `null` se non si può: la cassa non va mai sotto zero. */
export function compra(b, voce) {
  const costa = costoDi(b, voce)
  if (costa === null || costa > b.cassa) return null
  const dopo = { ...b, merce: [...b.merce], cassa: b.cassa - costa }
  if (voce.che === 'tenda') dopo.tenda++
  else if (voce.che === 'carretto') dopo.carretto++
  else dopo.merce.push(voce.emoji)
  return dopo
}

/* C'è qualcosa alla portata della cassa? È il pallino sul tasto del banco. */
export function puoiComprare(b) {
  const voci = [{ che: 'tenda' }, { che: 'carretto' },
                ...Object.values(MERCE_NUOVA).flat().map(m => ({ che: 'merce', emoji: m.emoji }))]
  return voci.some(v => { const c = costoDi(b, v); return c !== null && c <= b.cassa })
}
