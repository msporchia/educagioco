// Lo spagnolo a mondi non ha una campagna di prima da travasare: il gioco
// di prima (views/LinguaGame.vue) tiene il suo avanzamento in p.esp e qui non
// entra. Restano le funzioni che gioco.js e Gioco.vue chiamano, perché
// l'interfaccia sia quella dell'inglese: travasate è l'identità, quanteVinte
// conta solo le tappe che ci sono. Vedi docs/lingue/spagnolo-motore.md.
import { TAPPE } from '../dati/mondi.js'

const ATTUALI = new Set(TAPPE.map(t => t.id))
export const quanteVinte = vinte => Object.keys(vinte || {}).filter(id => ATTUALI.has(id)).length

// Le vinte come sono (un oggetto nuovo): non c'è niente da far nascere vinto.
export const travasate = (vinte = {}) => ({ ...vinte })

// Sul profilo: tiene `tappa` uguale al conto delle vinte; vero se è cambiato.
export function travasa(c) {
  if (!c) return false
  if (!c.vinte || typeof c.vinte !== 'object') c.vinte = {}
  const conta = quanteVinte(c.vinte)
  if (c.tappa === conta) return false
  c.tappa = conta
  return true
}
