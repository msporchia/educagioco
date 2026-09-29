/* Il muro non si scrive a un grande: il gioco reagisce da sé. Per una
   settimana la tipologia arriva più di rado (il fondo della banda di
   nucleo/bisogno.js) e, quando arriva, il «Si fa così» si legge prima di
   rispondere. Puro (test/unita/alleggerire): i segni stanno nel profilo,
   `settings.alleggerite` e `settings.vaBene`, e li scrive quiz/memoria.js.
   Vedi docs/apprendimento/la-domanda.md#il-muro-lo-sistema-il-gioco. */

import { consiglioDa } from './consiglio.js'
import { BISOGNO } from './nucleo/bisogno.js'

export const SETTIMANA = 7 * 86400000

// un segno è { quando, ok, err }: il conto di quel momento, da cui ripartono le prove nuove
export const segnoDa = (it, quando) => ({ quando, ok: it?.ok || 0, err: it?.err || 0 })

// quello che è successo dopo il segno; un conto azzerato («↻ ricomincia a contare») riparte da zero
export function contoDopo(it, segno) {
  const ok = it?.ok || 0
  const err = it?.err || 0
  if (!segno || ok < (segno.ok || 0) || err < (segno.err || 0)) return { ok, err, quante: ok + err }
  const o = ok - (segno.ok || 0)
  const e = err - (segno.err || 0)
  return { ok: o, err: e, quante: o + e }
}

const eMuro = conto => consiglioDa(conto)?.verso === -1

export const alleggeritaDa = (segno, now = Date.now()) =>
  !!segno && now - (segno.quando || 0) < SETTIMANA

// una settimana sola: dopo, si torna a guardare solo le risposte date da allora
export function daAlleggerire(it, segno, now = Date.now()) {
  if (alleggeritaDa(segno, now)) return false
  return eMuro(contoDopo(it, segno))
}

// «Va bene così» toglie la riga finché non arrivano otto prove nuove che dicono ancora muro
export const ancoraDifficile = (it, vaBene) => eMuro(contoDopo(it, vaBene))

// dentro la banda, mai fuori: la tipologia esce meno, non sparisce
export const bisognoAlleggerito = (base, attiva) => (attiva ? BISOGNO.min : base)

// il metodo prima della domanda: solo se c'è, e solo se alleggerita
export const comeSiFaPrima = (domanda, attiva) => (attiva && domanda?.aiuto) || ''
