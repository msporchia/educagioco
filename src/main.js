import { createApp } from 'vue'
import App from './App.vue'
import { installa, riparaSeChiesto } from './incidenti.js'
import { avviaGiudizi } from './store/giudizi.js'
import { sorveglia } from './aggiornamento.js'
import './style.css'

if (!riparaSeChiesto()) {   // prima di tutto: non ha senso montare l'app se la si sta buttando via
  const app = createApp(App)
  installa(app, { versione: __VERSIONE__.id })   // PRIMA del mount: un errore nel primo disegno va preso
  avviaGiudizi()
  app.mount('#app')
}

sorveglia()
