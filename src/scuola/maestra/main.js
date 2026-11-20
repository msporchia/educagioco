import { createApp } from 'vue'
import App from './App.vue'
import '../../emoji/emoji.css'
import '../../style.css'
import './maestra.css'

createApp(App).mount('#app')

// fuori dal disco e nella build, la pagina si riapre anche senza internet (docs/scuola/ripieghi.md)
if (import.meta.env.PROD && /^https?:$/.test(location.protocol) && 'serviceWorker' in navigator) {
  navigator.serviceWorker.register('./sw.js').catch(() => { /* senza: si va avanti come prima */ })
}
