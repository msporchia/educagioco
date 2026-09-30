// Il nemico: cammina, prende freddo, prende danno, sta male (veleno/fuoco)
// e, se è fatto così, si rialza una volta. Non sa quanto vale, chi l'ha
// colpito o quando finisce la partita: quello è affare della battaglia. Le
// torri a cui è immune non gli fanno niente (né danno, né veleno, né gelo).
import { ABILITA } from '../../data/mostri.js'

const FRENO_BASE = 0.45   // di quanto rallenta un gelo che non dice quanto frena
export const RESPINTO = 0.7   // quanto resta in aria il segno «immune» sopra la testa

export class Nemico {
  constructor({ d = 0, vita, vel, bestia, vola = false, immune = [], abilita = null,
                capo = false, paga = 1, taglia = 1, pezzo = false, via = 0, onda = 0,
                divisioni = abilita === 'dividi' ? 1 : 0 }) {
    this.d = d                       // quanti metri di strada ha già fatto
    this.via = via                   // e su quale delle strade li ha fatti
    this.onda = onda                 // da che ondata viene: la chiude quando non c'è più nessuno
    this.vita = vita; this.vitaMax = vita
    this.vel = vel
    this.bestia = bestia; this.vola = vola
    this.immune = immune || []
    this.abilita = abilita
    this.divisioni = divisioni       // quante volte può ancora dividersi
    this.capo = capo; this.paga = paga; this.taglia = taglia; this.pezzo = pezzo
    this.gelo = 0; this.freno = 0; this.fragile = 1
    this.male = 0; this.perQuanto = 0   // il veleno: quanto al secondo, e per quanto
    this.aTerra = 0; this.risorto = false
    this.respinto = 0                // da quanto una torre gli è rimbalzata addosso
    this.arrivato = false
  }

  immuneA(tipo) { return this.immune.includes(tipo) }

  // Torna true se è arrivato in fondo (il castello ha appena perso un
  // cuore). Passa anche il tempo del gelo, del veleno e di chi è a terra.
  cammina(dt, lunghezza) {
    this.respinto = Math.max(0, this.respinto - dt)
    if (this.aTerra > 0) {
      // a terra non si cammina e non si soffre: rialzarsi è tornare in
      // piedi con metà della vita, sgelato e pulito
      this.aTerra = Math.max(0, this.aTerra - dt)
      if (this.aTerra === 0) {
        this.vita = this.vitaMax * ABILITA.risorge.vita
        this.risorto = true
      }
      return false
    }
    const rall = this.gelo > 0 ? 1 - (this.freno || FRENO_BASE) : 1
    this.gelo = Math.max(0, this.gelo - dt)
    if (this.gelo === 0) { this.freno = 0; this.fragile = 1 }
    if (this.perQuanto > 0) {
      const quanto = Math.min(dt, this.perQuanto)
      this.vita -= this.male * quanto
      this.perQuanto -= quanto
      if (this.vita <= 0) { this.cade(); return false }
    }
    this.d += this.vel * rall * dt
    if (this.d >= lunghezza) { this.vita = 0; this.aTerra = 0; this.arrivato = true }
    return this.arrivato
  }

  // se due torri lo gelano vale il freno migliore, non l'ultimo arrivato
  gela(durata, freno, fragile = 1, tipo = null) {
    if (tipo && this.immuneA(tipo)) { this.respingi(); return false }
    if (this.aTerra > 0) return false
    this.gelo = Math.max(this.gelo, durata)
    this.freno = Math.max(this.freno || 0, freno)
    this.fragile = Math.max(this.fragile || 1, fragile)
    return true
  }

  // due dosi valgono la più forte e la più lunga, non si sommano
  avvelena(quanto, durata, tipo = null) {
    if (!quanto || !durata || (tipo && this.immuneA(tipo)) || this.aTerra > 0) return
    this.male = Math.max(this.male, quanto)
    this.perQuanto = Math.max(this.perQuanto, durata)
  }

  // torna true solo se l'ha finito davvero, non se è solo caduto per rialzarsi
  ferisci(danno, tipo) {
    // chi è già caduto in questo stesso fotogramma non si ammazza due volte
    if (!this.bersaglio) return false
    if (this.immuneA(tipo)) { this.respingi(); return false }
    this.vita -= danno * (this.fragile || 1)
    return this.vita <= 0 ? this.cade() : false
  }

  respingi() { this.respinto = RESPINTO }

  // chi si rialza, la prima volta resta a terra: né vivo né morto
  cade() {
    if (this.abilita === 'risorge' && !this.risorto) {
      this.aTerra = ABILITA.risorge.dopo
      this.vita = 0; this.male = 0; this.perQuanto = 0
      this.gelo = 0; this.freno = 0; this.fragile = 1
      return false
    }
    this.vita = Math.min(this.vita, 0)
    return true
  }

  // vivo è anche chi è a terra; bersaglio no (le torri non sprecano colpi)
  get vivo() { return this.vita > 0 || this.aTerra > 0 }
  get bersaglio() { return this.vita > 0 && !this.arrivato }
  get quota() { return Math.max(0, this.vita / this.vitaMax) }   // 0–1, per la barretta
}
