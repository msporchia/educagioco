// Lo stato dello scarico dei giochi, come lo racconta il service worker del sito spezzato (vite.config.js: scaricaBase,
// scaricaGiochi) sul canale 'educagioco-scarico'. La base (home, codice comune) arriva con l'installazione; i giochi
// uno alla volta dopo, quando la pagina lo chiede (`chiediScarico`: riprende da dove era arrivato). Il service worker può
// sparire a metà senza dirlo: se tace, si richiede da qui, anche dentro un gioco. Vedi docs/core/aggiornamento.md.
// Nel file unico il service worker non ha niente da scaricare; da file:// e nel dev server non c'è.
import { reactive } from 'vue'

export const scarico = reactive({
  fase: null,         // 'base' · 'giochi'
  fatti: 0, totale: 0, byteFatti: 0, byteTotale: 0,
  mancanti: [],       // i giochi (cartelle di src/giochi, più 'castello') non ancora sul telefono
  fine: false,
  errore: false,      // qualcosa non è arrivato: si riprova da soli
})

// la chiave di una carta in home → il gruppo di file del suo gioco
const GRUPPO_DI = { codice: 'codice-segreto', prima: 'prima-dopo', passo: 'passo-passo', torri: 'castello', verbi: 'inglese' }
export const gruppoDi = chiave => GRUPPO_DI[chiave] || chiave
export const inArrivo = chiave => scarico.mancanti.includes(gruppoDi(chiave))

// Quando richiedere. Il silenzio è l'unico segno di un service worker che è sparito, e richiedere a uno che sta ancora
// lavorando non fa niente; a vuoto si aspetta il doppio ogni volta, così un telefono pieno o senza rete non insiste
const SILENZIO = 20000, PAUSA_MASSIMA = 5 * 60 * 1000, GUARDA_OGNI = 5000
export const pausaDopo = tentativi => Math.min(PAUSA_MASSIMA, SILENZIO * 2 ** tentativi)
export const daRichiedere = (s, silenzio, tentativi) => !s.fine && silenzio >= pausaDopo(tentativi)

let canale = null
let ultimoSegno = 0, tentativi = 0

export function ascolta() {
  if (canale || typeof BroadcastChannel !== 'function') return
  canale = new BroadcastChannel('educagioco-scarico')
  canale.onmessage = e => {
    const d = e.data || {}
    ultimoSegno = Date.now()
    if (d.fase !== scarico.fase || d.byteFatti > scarico.byteFatti) tentativi = 0
    Object.assign(scarico, d)
  }
  ultimoSegno = Date.now()
  window.addEventListener('online', () => { tentativi = 0; chiediScarico() })
  setInterval(() => {
    if (document.hidden || !daRichiedere(scarico, Date.now() - ultimoSegno, tentativi)) return
    tentativi++
    richiedi()
  }, GUARDA_OGNI)
}

// la base la scarica l'installazione: se si è fermata lì, l'unico modo di riprovarla è un'altra installazione (e se era la
// prima la registrazione non c'è più: `register` la rifà)
function richiedi() {
  const sw = navigator.serviceWorker
  if (!sw) return
  if (scarico.fase === 'base' || !sw.controller) sw.register('./sw.js').then(r => r.update()).catch(() => {})
  chiediScarico()
}

// al service worker attivo (o a quello che comanda la pagina): «guarda cosa manca e scaricalo»
export function chiediScarico(reg) {
  if (typeof navigator === 'undefined' || !navigator.serviceWorker) return
  ultimoSegno = Date.now()
  const sw = (reg && reg.active) || navigator.serviceWorker.controller
  if (sw) sw.postMessage({ tipo: 'scarica' })
}
