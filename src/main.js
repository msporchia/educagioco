import { createApp } from 'vue'
import App from './App.vue'
import { installa, riparaSeChiesto } from './incidenti.js'
import { avviaGiudizi } from './store/giudizi.js'
import './style.css'

/* `#ripara` prima di tutto: se si è qui per buttare via una copia
   dell'app arrivata male, non ha senso montarla prima. */
if (!riparaSeChiesto()) {
  const app = createApp(App)
  /* la rete di sicurezza si stende PRIMA del mount: un errore durante il
     primo disegno è proprio quello che senza cartello lascia lo schermo
     vuoto e nessuna traccia (`incidenti.js`) */
  installa(app, { versione: __VERSIONE__.id })
  /* i tre tasti per giudicare una domanda compaiono solo se un grande
     li ha accesi, e a domanda comparsa non c'è tempo di interrogare
     l'archivio: si legge una volta qui, e non si aspetta — spenti sono
     il caso normale, e un ritardo di mezzo secondo all'avvio per un
     interruttore da sviluppo non si paga. */
  avviaGiudizi()
  app.mount('#app')
}

/* Il service worker: solo se i giochi arrivano da un sito.
   Da `file://` non si registra e non si può — il browser lo vieta — ed è
   giusto così: il file unico è già tutto lì dentro, non ha niente da
   mettere in cache. Se la registrazione fallisce non si dice niente a
   nessuno: vuol dire che si gioca senza offline, non che il gioco è
   rotto, e un bambino non saprebbe cosa farsene dell'avviso. */
if ('serviceWorker' in navigator && location.protocol.startsWith('http')) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('./sw.js').catch(() => { /* pazienza */ })
  })
}
