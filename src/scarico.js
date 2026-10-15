// Lo stato dello scarico dei giochi, come lo racconta il service worker del sito spezzato (vite.config.js: scaricaBase,
// scaricaGiochi) sul canale 'educagioco-scarico'. La base (home, codice comune) arriva con l'installazione; i giochi
// uno alla volta dopo, quando la pagina lo chiede (`chiediScarico`, a ogni avvio: riprende da dove era arrivato).
// Nel file unico e nel dev server non c'è service worker: qui non arriva mai niente. Vedi docs/core/avvio-e-memoria.md.
import { reactive } from 'vue'

export const scarico = reactive({
  fase: null,         // 'base' · 'giochi'
  fatti: 0, totale: 0, byteFatti: 0, byteTotale: 0,
  mancanti: [],       // i giochi (cartelle di src/giochi, più 'castello') non ancora sul telefono
  fine: false,
  errore: false,      // la rete è caduta: riprende da sola quando torna
})

// la chiave di una carta in home → il gruppo di file del suo gioco
const GRUPPO_DI = { codice: 'codice-segreto', prima: 'prima-dopo', passo: 'passo-passo', torri: 'castello', verbi: 'inglese' }
export const gruppoDi = chiave => GRUPPO_DI[chiave] || chiave
export const inArrivo = chiave => scarico.mancanti.includes(gruppoDi(chiave))

let canale = null
export function ascolta() {
  if (canale || typeof BroadcastChannel !== 'function') return
  canale = new BroadcastChannel('educagioco-scarico')
  canale.onmessage = e => {
    const d = e.data || {}
    // i progressi di un gioco solo dicono soltanto quali mancano; la striscia segue il totale
    if (d.fase === 'giochi-un-gioco') { scarico.mancanti = d.mancanti || []; return }
    Object.assign(scarico, { errore: false }, d)
  }
}

// al service worker attivo (o a quello che comanda la pagina): «guarda cosa manca e scaricalo»
export function chiediScarico(reg) {
  if (typeof navigator === 'undefined' || !navigator.serviceWorker) return
  const sw = (reg && reg.active) || navigator.serviceWorker.controller
  if (sw) sw.postMessage({ tipo: 'scarica' })
}
