// Una schermata caricata quando serve: nel sito spezzato (vite.config.js) ogni gioco è un file suo, che il service
// worker ha già in cassa; nel file unico il build lo rimette dentro la pagina e questo è solo un rinvio di un istante.
// Se il file non c'è (senza rete e non ancora scaricato) il bambino lo legge, invece di restare davanti al bianco.
import { defineAsyncComponent, h } from 'vue'

const Attesa = { render: () => h('div', { class: 'schermo' }, [h('div', { class: 'centro' }, [h('h1', 'Un attimo…')])]) }
const Mancante = {
  render: () => h('div', { class: 'schermo' }, [h('div', { class: 'centro' }, [
    h('h1', 'Questo gioco non è ancora sul telefono'),
    h('p', 'Serve internet una volta sola per scaricarlo.'),
    h('button', { onClick: () => location.reload() }, 'Riprova'),
  ])]),
}

export const caricaQuando = caricatore => defineAsyncComponent({
  loader: caricatore,
  loadingComponent: Attesa,
  delay: 150,          // sotto questo non si mostra nulla: il file in cassa arriva prima di un battito
  errorComponent: Mancante,
})
