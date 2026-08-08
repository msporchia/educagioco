import { createApp } from 'vue'
import App from './App.vue'
import './style.css'
createApp(App).mount('#app')

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
