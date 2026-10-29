// L'ultima misura del telefono (zona dei grandi → «Misura questo telefono», docs/core/vecchio-telefono-veri.md): l'ultimo log degli fps
// veri resta qui, fuori dai profili come il contatore fps, per rileggerla e mandarla dopo.
import { load, save, flush } from './storage.js'

const CHIAVE = 'benchmark'

/** { fps }: { quando, log }, se c'è (le chiavi vecchie, `sintetico`, `veri` e `scale`, restano e non si mostrano). */
export async function ultimeMisure() {
  try { const c = await load(CHIAVE); return c && typeof c === 'object' ? c : {} } catch (e) { return {} }
}

export async function salvaMisura(tipo, log) {
  const c = await ultimeMisure()
  c[tipo] = { quando: Date.now(), log }
  save(CHIAVE, c)
  return flush()
}
