// «Riprendi da qui» in home: la partita a metà riparte senza passare dalla
// carta in cima alla mappa. Vedi docs/core/ripresa.md («Dalla home»).
import { watch, nextTick } from 'vue'

let chiesta = null
export const chiediRipresa = chiave => { chiesta = chiave }
// App.vue a ogni cambio di schermata: uscendo dal gioco la richiesta si scorda
export const lasciaRipresa = vista => { if (chiesta !== vista) chiesta = null }
export function prendiRipresa() { const c = chiesta; chiesta = null; return !!c }

// per la carta di un gioco: appena c'è una partita a metà, e se è stata chiesta, riparte
export function riprendiSeChiesta(ripresa, riprendi) {
  watch(ripresa, r => { if (r && prendiRipresa()) nextTick(riprendi) }, { immediate: true })
}
