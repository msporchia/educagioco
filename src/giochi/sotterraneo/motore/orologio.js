// L'orologio del sotterraneo (docs/sotterraneo/orologio.md): il tempo del gioco si conta in passi dell'eroe, le celle percorse. Fermo,
// in pausa o sotto una domanda non scorre. Ogni passo fa tornare un poco di mana (la stessa quota del globo massimo per tutte le
// classi: l'intelligenza conta alzando il globo) e consuma gli incanti preparati (motore/preparati.js). Sono metodi di Corsa
// (`Object.assign(Corsa.prototype, ...)` in fondo a corsa.js); gira in Node.
import { MANA_PER_PASSO } from '../dati/mondo.js'

export const MetodiDellOrologio = {
  // `n` passi dell'eroe: uno per cella percorsa (`camminando`), PASSI_PER_TURNO per ogni turno dell'eroe nello scontro. Il mana torna solo
  // camminando: nello scontro lo ridanno le risposte giuste (e il bastone), e un turno che lo ridesse pure sposterebbe tutte le misure
  faiPassi(n = 1, camminando = false) {
    this.passi += n
    if (camminando) this.ricaricaCamminando(n)
    this.consumaIPreparati(n)
  },

  // il mana torna a passi, con il resto che non è ancora un punto (un punto di globo vale più passi del globo piccolo: il cavaliere ne
  // vuole cento, il mago venticinque); a globo pieno il resto si butta
  ricaricaCamminando(n) {
    if (this.energia >= this.energiaMax) { this.manaCammino = 0; return }
    this.manaCammino += n * this.energiaMax * MANA_PER_PASSO
    const interi = Math.floor(this.manaCammino + 1e-9)
    if (interi <= 0) return
    this.manaCammino = Math.max(0, this.manaCammino - interi)
    this.energia = Math.min(this.energiaMax, this.energia + interi)
  },
}
