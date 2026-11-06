/* LA SOSTA — il livello lasciato a metà: tutto quello che serve per riprenderlo, stanza compresa.
   Puro, gira in Node. Vedi docs/core/ripresa.md. */
import { CUCINE, orologio } from '../../data/bancarella-cucine.js'

const VERSIONE = 2                 // la 1 era il mercato: non si legge più

export const scrivi = f => JSON.parse(JSON.stringify({ v: VERSIONE, ...f }))

export function leggi(s) {
  if (!s || s.v !== VERSIONE || !CUCINE[s.livello] || !s.cucina?.celle || !Array.isArray(s.coda) || !s.coda.length) return null
  return JSON.parse(JSON.stringify(s))
}

/* Quello che dice la carta in cima ai livelli. */
export function dice(s) {
  const g = leggi(s)
  const c = g && CUCINE[g.livello]
  return g && { nome: c.nome, tappa: c.durata ? `restano ${orologio(g.hud.resta ?? c.durata)}` : `ordinazioni ${g.nTappa + 1} di ${c.tappe}`,
                cuori: c.durata ? 0 : g.hud.cuori, serviti: g.hud.serviti }
}
