// Il contafotogrammi per provare i giochi sul telefono (docs/core/vecchio-telefono.md): si accende fra gli interruttori
// dei grandi, è del telefono e non di un bambino (come il tasto «salta»). Le ultime misure restano qui, fuori dai profili.
import { ref } from 'vue'
import { load, save, flush } from './storage.js'

const CHIAVE = 'contafps'
const TENUTE = 6

export const fpsAcceso = ref(false)
export const misure = ref([])   // dalla più recente

// mai il booleano nudo: storage.js scarta un `true` salvato da solo (vedi docs/core/archivio.md)
export async function avviaFps() {
  const c = await load(CHIAVE)
  fpsAcceso.value = c?.acceso === true
  misure.value = Array.isArray(c?.misure) ? c.misure : []
}

function scrivi() { save(CHIAVE, { acceso: fpsAcceso.value, misure: misure.value }); return flush() }
export function accendiFps(si) { fpsAcceso.value = !!si; return scrivi() }
export function aggiungiMisura(m) { misure.value = [m, ...misure.value].slice(0, TENUTE); return scrivi() }
export function dimenticaMisure() { misure.value = []; return scrivi() }

// i numeri di una corsa di fotogrammi (ms fra due fotogrammi), gli stessi di strumenti/vecchio-telefono.mjs
export function riassumi(dt) {
  if (!dt.length) return null
  const o = dt.slice().sort((a, b) => a - b)
  const q = x => o[Math.min(o.length - 1, Math.floor(x * o.length))]
  const tot = dt.reduce((a, b) => a + b, 0)
  return { fps: Math.round(1000 * dt.length / tot), p50: Math.round(q(.5)), p95: Math.round(q(.95)), p99: Math.round(q(.99)),
           l33: dt.filter(d => d > 33).length, l50: dt.filter(d => d > 50).length, n: dt.length, s: Math.round(tot / 1000) }
}
