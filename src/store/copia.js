// Quando è stata l'ultima volta che i progressi sono stati salvati su un file (docs/genitori/riordino.md): serve all'avviso in cima a «Casa»
// («ultimo salvataggio: 12 giorni fa»). Sta fuori dai profili, è del telefono: la copia è di tutti i bambini.
import { ref } from 'vue'
import { load, save, flush } from './storage.js'

const CHIAVE = 'ultima-copia'
export const GIORNI_VECCHIA = 14           // oltre, la copia è «vecchia» e un avviso lo dice
export const ultima = ref(null)             // quando (ms) o null se non si è mai salvato

export async function leggiCopia() {
  const c = await load(CHIAVE)
  ultima.value = Number.isFinite(c?.quando) ? c.quando : null
  return ultima.value
}

export async function segnaCopia(quando = Date.now()) {
  ultima.value = quando
  save(CHIAVE, { quando })              // mai il booleano nudo: storage.js lo scarta (docs/core/archivio.md)
  return flush()
}

/* quanti giorni sono passati (intero), o null se non c'è mai stata una copia */
export const giorniDaUltima = (quando, oggi = Date.now()) =>
  (Number.isFinite(quando) ? Math.max(0, Math.floor((oggi - quando) / 86400000)) : null)

/* «mai», «vecchia» o null (a posto) */
export function statoCopia(quando, oggi = Date.now()) {
  const g = giorniDaUltima(quando, oggi)
  if (g == null) return 'mai'
  return g >= GIORNI_VECCHIA ? 'vecchia' : null
}
