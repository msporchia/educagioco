/* ═══════════════════════════════════════════════════════════════════
   «C'È UNA VERSIONE NUOVA»

   Il service worker si aggiorna da sé — `skipWaiting()` in installazione,
   le cache vecchie cancellate all'attivazione — ma **la pagina già aperta
   resta quella di prima**: il JavaScript è in memoria, e finché non si
   ricarica il bambino gioca alla versione di ieri. Su un telefono
   installato quella pagina può restare aperta per giorni.

   Perché è un problema vero solo adesso: finché il gioco stava su due
   telefoni di casa lo si riapriva a mano. Con più famiglie sopra, la
   metà delle segnalazioni che arrivano è «da me non succede» — e la
   risposta è quasi sempre che stanno su due versioni diverse.

   ── DUE COSE CHE NON SI FANNO ──
   1. **Non si ricarica da soli.** Un reload in mezzo a un'ondata butta
      via la partita, e a un bambino sembra che il gioco sia crollato.
      Si dice che c'è, e ricarica lui quando gli va.
   2. **Non si dice dentro un gioco.** Il cartello vive in home
      (`views/HomeView.vue`), dove non c'è niente da perdere.
   ═══════════════════════════════════════════════════════════════════ */
import { ref } from 'vue'

export const versioneNuova = ref(false)

/* Ogni mezz'ora si richiede il service worker al sito. Senza questo, una
   pagina lasciata aperta non va a vedere mai più: il controllo automatico
   del browser passa dal caricamento della pagina, che è precisamente
   quello che qui non succede. */
const OGNI = 30 * 60 * 1000

export function sorveglia () {
  /* Da `file://` il browser vieta i service worker, ed è giusto così: il
     file unico è già tutto lì dentro. Se la registrazione fallisce non si
     dice niente a nessuno — vuol dire che si gioca senza offline, non che
     il gioco è rotto. */
  if (!('serviceWorker' in navigator) || !location.protocol.startsWith('http')) return

  window.addEventListener('load', () => {
    navigator.serviceWorker.register('./sw.js').then(reg => {
      setInterval(() => reg.update().catch(() => {}), OGNI)

      reg.addEventListener('updatefound', () => {
        const nuovo = reg.installing
        /* Senza controller è la **prima** installazione: non c'è niente
           di vecchio a schermo, e dire «c'è una versione nuova» a chi ha
           appena aperto il gioco per la prima volta è solo confusione. */
        if (!navigator.serviceWorker.controller || !nuovo) return
        nuovo.addEventListener('statechange', () => {
          if (nuovo.state === 'installed' || nuovo.state === 'activated') versioneNuova.value = true
        })
      })
    }).catch(() => { /* pazienza */ })
  })
}

export function aggiornaOra () {
  location.reload()
}
