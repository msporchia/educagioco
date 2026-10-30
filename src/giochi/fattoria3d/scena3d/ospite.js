// Il contadino dell'amico nella fattoria in comune (docs/fattoria3d/in-comune.md): lo stesso corpo e la stessa camminata
// dell'eroe, guidati da dove l'amico dice di essere (pochi messaggi al secondo) invece che dal dito. Cammina verso l'ultimo
// punto arrivato, salta se è rimasto troppo indietro, fa i gesti che l'amico fa; il nome gli sta sopra la testa. Se l'amico
// tace per qualche secondo (è uscito, ha perso la rete) sparisce.
import { Eroe } from './eroe.js'

const SALTA_DA = 5            // celle: più lontano di così non lo si fa camminare, lo si mette lì
const DURATA_GESTO = 0.9      // s: il gesto di chi guarda dura sempre uguale (il motore non lo aspetta)
export const SPARISCE = 6000  // ms senza notizie

export class Ospite {
  constructor({ scena, motore, effetti, sopra, vista, nome, abito }) {
    this.eroe = new Eroe(scena, motore, effetti, abito)
    this.eroe.grp.visible = false
    this.vista = vista
    this.abito = abito
    this.el = document.createElement('div')
    this.el.className = 'f3-ospite'; this.el.dataset.f3 = 'ospite'; this.el.textContent = nome; this.el.hidden = true
    sopra.appendChild(this.el)
    this.visto = 0; this.dir = null
  }

  get visibile() { return this.eroe.grp.visible }

  /** Un segno di vita: dove sta, verso dove guarda, se corre, il gesto che ha cominciato. */
  qui({ x, z, d, r, g }) {
    const e = this.eroe
    if (!this.visibile || Math.hypot(x - e.x, z - e.z) > SALTA_DA) { e.x = x; e.z = z; e.dir = d; e.percorso = [] }
    else if (Math.hypot(x - e.x, z - e.z) > 0.05) e.percorso = [[x, z]]
    e.corsa = !!r; this.dir = d
    if (g && !e.az) e.avvia(g, DURATA_GESTO)
    this.visto = performance.now()
    e.grp.visible = true
  }

  vesti(abito) { this.abito = abito; const v = this.visibile; this.eroe.vesti(abito); this.eroe.grp.visible = v }

  aggiorna(dt, tt) {
    if (!this.visibile) return
    if (performance.now() - this.visto > SPARISCE) return this.nascondi()
    const e = this.eroe
    e.aggiorna(dt, tt)
    if (e.fermo && this.dir !== null) e.dir += Math.atan2(Math.sin(this.dir - e.dir), Math.cos(this.dir - e.dir)) * Math.min(1, dt * 10)
    const [x, y, visto] = this.vista.proietta(e.posizione, 2.1)
    this.el.hidden = !visto
    if (visto) { this.el.style.left = x + 'px'; this.el.style.top = y + 'px' }
  }

  nascondi() { this.eroe.grp.visible = false; this.el.hidden = true; this.eroe.ferma() }
  via() { this.eroe.grp.removeFromParent(); this.el.remove() }
}
