// L'ultima misura del telefono (zona dei grandi → «Misura questo telefono», docs/core/vecchio-telefono.md): il log di ognuna delle due
// prove (a scene sintetiche e coi modelli veri) resta qui, fuori dai profili come il contatore fps, per rileggerla e mandarla dopo.
import { load, save, flush } from './storage.js'

const CHIAVE = 'benchmark'

/** { sintetico: { quando, log }, veri: { quando, log } }, quelle che ci sono. */
export async function ultimeMisure() {
  try { const c = await load(CHIAVE); return c && typeof c === 'object' ? c : {} } catch (e) { return {} }
}

export async function salvaMisura(tipo, log) {
  const c = await ultimeMisure()
  c[tipo] = { quando: Date.now(), log }
  save(CHIAVE, c)
  return flush()
}
