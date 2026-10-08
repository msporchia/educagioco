import { createApp } from 'vue'
import App from './App.vue'
import { installa, riparaSeChiesto } from './incidenti.js'
import { avviaGiudizi } from './store/giudizi.js'
import { avviaSalto } from './store/salto.js'
import { sorveglia } from './aggiornamento.js'
import './emoji/emoji.css'
import './style.css'

// Le emoji sono un font nostro (docs/core/emoji.md): una tela che disegna prima che sia
// decodificato scrive le emoji col font del telefono e non le ridisegna. Si aspetta, ma non a lungo.
const emojiPronte = () => {
  try {
    return Promise.race([
      document.fonts.load('16px "Emoji Gioco"', '🐰'),
      new Promise(r => setTimeout(r, 1500)),
    ]).catch(() => {})
  } catch { return Promise.resolve() }
}

if (!riparaSeChiesto()) {   // prima di tutto: non ha senso montare l'app se la si sta buttando via
  const app = createApp(App)
  installa(app, { versione: __VERSIONE__.id })   // PRIMA del mount: un errore nel primo disegno va preso
  avviaGiudizi()
  avviaSalto()
  emojiPronte().then(() => app.mount('#app'))
}

sorveglia()
