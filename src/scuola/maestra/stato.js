/* Il quaderno vivo della pagina: quello di quaderno.js reso reattivo e salvato in localStorage. Lo storico, che cambia a
   ogni risposta, si salva al più una volta al secondo (e subito se la pagina si chiude). Vedi docs/scuola/quaderno.md. */
import { reactive } from 'vue'
import * as Q from './quaderno.js'

const storage = (() => { try { return globalThis.localStorage ?? null } catch { return null } })()

export const quaderno = reactive(Q.carica(storage))
export const avvisi = reactive({ pieno: false })

export function salva(parti) {
  avvisi.pieno = !Q.salva(quaderno, storage, parti)
}

let presto = null
export function salvaPresto() {
  if (presto) return
  presto = setTimeout(() => { presto = null; salva(['storico']) }, 1000)
}
function subito() { if (presto) { clearTimeout(presto); presto = null; salva(['storico']) } }
globalThis.addEventListener?.('pagehide', subito)
globalThis.addEventListener?.('visibilitychange', () => { if (document.visibilityState === 'hidden') subito() })

export const voceDi = id => quaderno.storico.find(v => v.id === id) || null
export const classeDi = id => quaderno.classi.find(c => c.id === id) || null
export const lezioneDi = id => quaderno.lezioni.find(l => l.id === id) || null
