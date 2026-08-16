/* ═══════════════════════════════════════════════════════════════════
   IL NEMICO — chi cammina e chi incassa.

   Sa quattro cose sole: avanzare lungo la strada, prendere freddo,
   prendere danno e continuare a stare male (il veleno, e il fuoco che è
   lo stesso meccanismo con un altro nome). Non sa quanti punti vale,
   non sa chi l'ha colpito, non sa quando la partita finisce: quello è
   affare della battaglia.

   La resistenza è la sola regola che porta addosso: la torre a cui
   resiste gli fa un terzo del danno. È la ragione per cui conviene
   tenere in campo torri diverse invece di una sola altissima — con una
   sola, l'ondata che le resiste passa quasi intera — e quindi per cui
   si finisce col fare tutte e quattro le operazioni.
   ═══════════════════════════════════════════════════════════════════ */
import { RESISTENZA } from '../../data/mostri.js'

/* di quanto rallenta un gelo che non dice quanto frena */
const FRENO_BASE = 0.45

export class Nemico {
  constructor({ d = 0, vita, vel, bestia, vola = false, resiste = null, via = 0 }) {
    this.d = d                       // quanti metri di strada ha già fatto
    this.via = via                   // e su quale delle strade li ha fatti
    this.vita = vita; this.vitaMax = vita
    this.vel = vel
    this.bestia = bestia; this.vola = vola; this.resiste = resiste
    this.gelo = 0; this.freno = 0; this.fragile = 1
    this.male = 0; this.perQuanto = 0   // il veleno: quanto al secondo, e per quanto
    this.arrivato = false
  }

  /* Un passo. Torna `true` se è arrivato in fondo, cioè se il castello
     ha appena perso un cuore. Qui dentro passa anche il tempo del gelo e
     quello del veleno: sono le due cose che continuano da sole. */
  cammina(dt, lunghezza) {
    const rall = this.gelo > 0 ? 1 - (this.freno || FRENO_BASE) : 1
    this.gelo = Math.max(0, this.gelo - dt)
    if (this.gelo === 0) { this.freno = 0; this.fragile = 1 }
    if (this.perQuanto > 0) {
      const quanto = Math.min(dt, this.perQuanto)
      this.vita -= this.male * quanto
      this.perQuanto -= quanto
    }
    this.d += this.vel * rall * dt
    if (this.d >= lunghezza) { this.vita = 0; this.arrivato = true }
    return this.arrivato
  }

  /* se due torri gelano lo stesso nemico vale il freno migliore, non
     l'ultimo arrivato */
  gela(durata, freno, fragile = 1) {
    this.gelo = Math.max(this.gelo, durata)
    this.freno = Math.max(this.freno || 0, freno)
    this.fragile = Math.max(this.fragile || 1, fragile)
  }

  /* Il veleno — e il fuoco, che è la stessa cosa vista da un'altra
     torre. Non si somma all'infinito: due dosi valgono la più forte e
     la più lunga, se no due torri di veleno scioglierebbero qualunque
     cosa e il ramo diventerebbe l'unica scelta sensata. */
  avvelena(quanto, durata) {
    if (!quanto || !durata) return
    this.male = Math.max(this.male, quanto)
    this.perQuanto = Math.max(this.perQuanto, durata)
  }

  /* Torna `true` se questo colpo l'ha finito. Chi è gelato dalla brina
     è più fragile, ed è il solo modo in cui il ghiaccio partecipa al
     danno: la fragilità **moltiplica anche il colpo smorzato**, quindi
     gelare un mostro rende meno inutile la torre a cui resiste — ed è
     giusto così, perché il gelo è l'unica torre che non si può mai
     sbagliare a comprare. */
  ferisci(danno, tipo) {
    const smorza = this.resiste && this.resiste === tipo ? RESISTENZA : 1
    this.vita -= danno * smorza * (this.fragile || 1)
    return this.vita <= 0
  }

  get vivo() { return this.vita > 0 }
  get quota() { return this.vita / this.vitaMax }   // 0–1, per la barretta
}
