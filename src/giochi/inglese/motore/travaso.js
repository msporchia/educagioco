// Chi aveva vinto delle tappe dei mondi di prima non perde niente: una
// tappa nuova nasce vinta se tutto quello che insegna era già in tappe
// vinte — una di parole se ogni sua parola c'era, una di frasi se c'era la
// sua struttura, la 🏁 se tutto il resto del suo mondo è vinto. Le chiavi
// vecchie restano in `vinte` (niente si butta); non si contano più.
// Vedi docs/lingue/mondi.md («Chi ha già giocato»).
import { MONDI, TAPPE } from '../dati/mondi.js'
import { TAPPE_DI_PRIMA } from '../dati/travaso.js'

const ATTUALI = new Set(TAPPE.map(t => t.id))
export const quanteVinte = vinte => Object.keys(vinte || {}).filter(id => ATTUALI.has(id)).length

// Le vinte dopo il travaso (un oggetto nuovo; quelle già vinte restano col loro giorno).
export function travasate(vinte = {}) {
  const vecchie = Object.keys(vinte).filter(id => TAPPE_DI_PRIMA[id])
  if (!vecchie.length) return { ...vinte }
  const tempi = vecchie.map(id => vinte[id]).filter(Number.isFinite)
  const quando = tempi.length ? Math.min(...tempi) : 1
  const parole = new Set(vecchie.flatMap(id => TAPPE_DI_PRIMA[id].parole))
  const forme = new Set(vecchie.flatMap(id => TAPPE_DI_PRIMA[id].forme))
  const out = { ...vinte }
  const segna = t => { if (!out[t.id]) out[t.id] = quando }
  for (const m of MONDI) {
    for (const t of m.tappe) {
      if (t.bandiera) continue
      const tutto = t.frasi ? t.forme.every(f => forme.has(f)) : t.parole.every(p => parole.has(p))
      if (tutto) segna(t)
    }
    const b = m.tappe[m.tappe.length - 1]
    if (b && b.bandiera && m.tappe.every(t => t === b || out[t.id])) segna(b)
  }
  return out
}

// Sul profilo: vero se qualcosa è cambiato (allora va salvato).
export function travasa(c) {
  if (!c) return false
  const prima = c.vinte && typeof c.vinte === 'object' ? c.vinte : {}
  const dopo = travasate(prima)
  const cambiato = Object.keys(dopo).length !== Object.keys(prima).length
  c.vinte = dopo
  const conta = quanteVinte(dopo)
  if (c.tappa !== conta) { c.tappa = conta; return true }
  return cambiato
}
