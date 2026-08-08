/* ═══════════════════════════════════════════════════════════════════
   IL NEMICO — chi cammina e chi incassa.

   Sa tre cose sole: avanzare lungo la strada, prendere freddo, prendere
   danno. Non sa quanti punti vale, non sa chi l'ha colpito, non sa
   quando la partita finisce: quello è affare della battaglia.

   Il punto debole è la sola regola che porta addosso: la torre giusta
   gli fa il doppio. È la ragione per cui conviene tenere in campo torri
   diverse invece di una sola altissima — e quindi per cui si finisce
   col fare tutte e quattro le operazioni.
   ═══════════════════════════════════════════════════════════════════ */
import { DOPPIO } from '../../data/mostri.js'

/* di quanto rallenta un gelo che non dice quanto frena */
const FRENO_BASE = 0.45

export class Nemico {
  constructor({ d = 0, vita, vel, bestia, vola = false, debole = null }) {
    this.d = d                       // quanti metri di strada ha già fatto
    this.vita = vita; this.vitaMax = vita
    this.vel = vel
    this.bestia = bestia; this.vola = vola; this.debole = debole
    this.gelo = 0; this.freno = 0
    this.arrivato = false
  }

  /* Un passo. Torna `true` se è arrivato in fondo, cioè se il castello
     ha appena perso un cuore. */
  cammina(dt, lunghezza) {
    const rall = this.gelo > 0 ? 1 - (this.freno || FRENO_BASE) : 1
    this.gelo = Math.max(0, this.gelo - dt)
    this.d += this.vel * rall * dt
    if (this.d >= lunghezza) { this.vita = 0; this.arrivato = true }
    return this.arrivato
  }

  /* se due torri gelano lo stesso nemico vale il freno migliore, non
     l'ultimo arrivato */
  gela(durata, freno) {
    this.gelo = Math.max(this.gelo, durata)
    this.freno = Math.max(this.freno || 0, freno)
  }

  /* torna `true` se questo colpo l'ha finito */
  ferisci(danno, tipo) {
    this.vita -= danno * (this.debole && this.debole === tipo ? DOPPIO : 1)
    return this.vita <= 0
  }

  get vivo() { return this.vita > 0 }
  get quota() { return this.vita / this.vitaMax }   // 0–1, per la barretta
}
