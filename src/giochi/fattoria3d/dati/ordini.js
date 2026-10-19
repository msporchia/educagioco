/* Chi chiede: il banco della bancarella e i suoi ordini (dato puro; le regole stanno in motore/ordini.js).
   Niente si vende: un ordine consegnato paga ESPERIENZA, mai monete, e mai più del tempo che costa (🪙6 al minuto).
   Non c'è un elenco di ordini: si compongono da colture e ricette vere (`livello` dice cosa si può chiedere).
   Vedi docs/fattoria3d/ordini.md. */
import { COLTURE } from './colture.js'
import { RICETTE } from './ricette.js'
import { livelloDellaColtura, livelloDellaRicetta } from './livelli.js'

// Il paese: chi passa al banco. Nessuno chiede una cosa sola per mestiere: il banco è per tutti.
export const CLIENTI = [
  { id: 'nonna',      nome: 'La nonna',        emoji: '👵' },
  { id: 'fornaio',    nome: 'Il fornaio',      emoji: '🥖' },
  { id: 'maestra',    nome: 'La maestra',      emoji: '🍎' },
  { id: 'cuoco',      nome: 'Il cuoco',        emoji: '👨‍🍳' },
  { id: 'postino',    nome: 'Il postino',      emoji: '📮' },
  { id: 'pescatore',  nome: 'Il pescatore',    emoji: '🎣' },
  { id: 'giardiniere', nome: 'Il giardiniere', emoji: '🌻' },
  { id: 'sindaco',    nome: 'Il sindaco',      emoji: '🎩' },
  { id: 'bidello',    nome: 'Il bidello',      emoji: '🧹' },
  { id: 'veterinaria', nome: 'La veterinaria', emoji: '🩺' },
]
export const clienteDi = id => CLIENTI.find(c => c.id === id) || CLIENTI[0]

export const POSTI = 3                 // ordini aperti insieme
export const LIVELLO_BANCO = 2         // il livello della bancarella: da lì il banco chiede
export const RIPOSO_MS = 3 * 60_000    // un ordine rifiutato lascia il posto vuoto per tre minuti
export const CHIEDE_MAX = 3            // al più tre cose diverse in un ordine
export const QUANTI_RACCOLTI = [1, 4]  // quantità di un raccolto: da 1 a 4
export const QUANTI_PRODOTTI = [1, 2]  // quantità di un prodotto: 1 o 2

// 🪙6 = un minuto di esercizio ([calibrazione]): il cambio con cui si controlla che un ordine non renda più del tempo che costa.
export const MONETE_AL_MINUTO = 6
// Si paga la metà del tetto: più campi crescono insieme, quindi il tempo vero di un raccolto è minore del suo `ms`.
export const FRAZIONE_DEL_TETTO = 0.5

/** Il tempo (ms) per avere uno di questi: un raccolto matura, un prodotto è la ricetta più i suoi ingredienti. */
export function msDi(k, giri = 5) {
  if (COLTURE[k]) return COLTURE[k].ms
  const r = RICETTE[k]
  if (!r || giri <= 0) return Infinity
  return r.ms + Object.entries(r.ing).reduce((n, [i, q]) => n + q * msDi(i, giri - 1), 0)
}
export const livelloDi = k => COLTURE[k] ? livelloDellaColtura(k) : livelloDellaRicetta(k)
export const eProdotto = k => !!RICETTE[k] && !COLTURE[k]

export const minutiDi = chiede => Object.entries(chiede).reduce((n, [k, q]) => n + q * msDi(k), 0) / 60000
/** Il tetto in esperienza di un ordine: quel che vale il tempo che costa. */
export const tettoDi = chiede => MONETE_AL_MINUTO * minutiDi(chiede)
/** L'esperienza che rende un ordine: sempre un intero, almeno 1, mai sopra il tetto. */
export const premioDi = chiede => Math.max(1, Math.floor(tettoDi(chiede) * FRAZIONE_DEL_TETTO))
/** Da che livello si può chiedere: il più alto fra le cose chieste (e almeno il banco). */
export const livelloDelOrdine = chiede => Math.max(LIVELLO_BANCO, ...Object.keys(chiede).map(livelloDi))

/** Cosa si può chiedere a questo livello: { raccolti: [chiavi], prodotti: [chiavi] } (solo ciò che si fa davvero). */
export function chiedibili(livello) {
  const ok = k => Number.isFinite(livelloDi(k)) && livelloDi(k) <= livello
  return { raccolti: Object.keys(COLTURE).filter(ok), prodotti: Object.keys(RICETTE).filter(ok) }
}

export function guastiDegliOrdini() {
  const g = []
  if (new Set(CLIENTI.map(c => c.id)).size !== CLIENTI.length) g.push('due clienti con lo stesso id')
  if (CLIENTI.length < 8 || CLIENTI.length > 10) g.push(`i clienti sono ${CLIENTI.length}: da 8 a 10`)
  for (const c of CLIENTI) if (!c.nome || !c.emoji) g.push(`${c.id}: manca nome o emoji`)
  if (CLIENTI.length <= POSTI) g.push('i clienti non bastano a riempire il banco')
  if (!(POSTI >= 1)) g.push('nessun posto al banco')
  if (!(MONETE_AL_MINUTO === 6)) g.push('il cambio è 🪙6 al minuto (calibrazione)')
  if (!(FRAZIONE_DEL_TETTO > 0 && FRAZIONE_DEL_TETTO <= 1)) g.push('la frazione del tetto sta fra 0 e 1')
  for (const k of [...Object.keys(COLTURE), ...Object.keys(RICETTE)]) {
    if (!Number.isFinite(msDi(k)) || !Number.isFinite(livelloDi(k))) g.push(`${k}: tempo o livello non calcolabile`)
  }
  // al livello del banco si deve poter chiedere: almeno due raccolti, e nessun prodotto prima delle macchine
  const b = chiedibili(LIVELLO_BANCO)
  if (b.raccolti.length < 2) g.push(`al livello ${LIVELLO_BANCO} i raccolti da chiedere sono meno di due`)
  if (b.prodotti.length) g.push(`al livello ${LIVELLO_BANCO} si chiedono già prodotti: ${b.prodotti.join(', ')}`)
  // ogni cosa fattibile si può chiedere da sola, con premio dentro il tetto
  for (const k of [...Object.keys(COLTURE), ...Object.keys(RICETTE)]) {
    const chiede = { [k]: 1 }
    if (premioDi(chiede) > tettoDi(chiede) + 1e-9) g.push(`${k}: il premio supera il tetto`)
  }
  return g
}
