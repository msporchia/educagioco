/* LA SOSTA — il livello lasciato a metà: tutto quello che serve per riprenderlo, stanza compresa.
   Puro, gira in Node. Vedi docs/core/ripresa.md. */
import { CUCINE } from '../../data/bancarella-cucine.js'

const VERSIONE = 2                 // la 1 era il mercato: non si legge più

export const scrivi = f => JSON.parse(JSON.stringify({ v: VERSIONE, ...f }))

export function leggi(s) {
  if (!s || s.v !== VERSIONE || !CUCINE[s.livello] || !s.cucina?.celle || !Array.isArray(s.coda) || !s.coda.length) return null
  return JSON.parse(JSON.stringify(s))
}

/* Quello che dice la carta in cima ai livelli. */
export function dice(s) {
  const g = leggi(s)
  return g && { nome: CUCINE[g.livello].nome, tappa: `ordinazioni ${g.nTappa + 1} di ${CUCINE[g.livello].tappe}`,
                cuori: g.hud.cuori, serviti: g.hud.serviti }
}
