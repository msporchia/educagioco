/* ═══════════════════════════════════════════════════════════════════
   IL NEMICO — chi cammina e chi incassa.

   Sa poche cose: avanzare lungo la strada, prendere freddo, prendere
   danno, continuare a stare male (il veleno, e il fuoco che è lo stesso
   meccanismo con un altro nome) e, se è fatto così, rialzarsi una volta.
   Non sa quanti punti vale, non sa chi l'ha colpito, non sa quando la
   partita finisce: quello è affare della battaglia — che è anche chi lo
   divide in due quando cade, perché dividersi vuol dire mettere in campo
   dei nemici nuovi, e i nemici in campo li tiene lei.

   L'immunità è la regola che porta addosso: le torri a cui è immune non
   gli fanno niente — né danno, né veleno, né gelo. È la ragione per cui
   conviene tenere in campo torri diverse invece di una sola altissima:
   con una sola, l'ondata che ne è immune passa intera.
   ═══════════════════════════════════════════════════════════════════ */
import { ABILITA } from '../../data/mostri.js'

/* di quanto rallenta un gelo che non dice quanto frena */
const FRENO_BASE = 0.45

/* quanto resta in aria il segno «immune» sopra la testa: abbastanza per
   leggerlo, non tanto da restare acceso per tutta l'ondata sotto una
   torre che spara ogni mezzo secondo */
export const RESPINTO = 0.7

export class Nemico {
  /* `immune`: le torri (chiavi di `TORRI`) che non lo toccano.
     `abilita`: 'dividi' | 'risorge' | null, già decisa dall'ondata (una
     tappa che le spegne passa null).
     `paga`: quanti nemici vale quando cade — 1 un mostro, mezzo un pezzo
     di chi si è diviso, un'ondata intera il capo.
     `capo`, `taglia`: il capo è uno solo e grande, e chi si è diviso è
     più piccolo; la taglia la guarda solo chi disegna. */
  constructor({ d = 0, vita, vel, bestia, vola = false, immune = [], abilita = null,
                capo = false, paga = 1, taglia = 1, pezzo = false, via = 0, onda = 0 }) {
    this.d = d                       // quanti metri di strada ha già fatto
    this.via = via                   // e su quale delle strade li ha fatti
    this.onda = onda                 // da che ondata viene: la chiude quando non c'è più nessuno
    this.vita = vita; this.vitaMax = vita
    this.vel = vel
    this.bestia = bestia; this.vola = vola
    this.immune = immune || []
    this.abilita = abilita
    this.capo = capo; this.paga = paga; this.taglia = taglia; this.pezzo = pezzo
    this.gelo = 0; this.freno = 0; this.fragile = 1
    this.male = 0; this.perQuanto = 0   // il veleno: quanto al secondo, e per quanto
    this.aTerra = 0; this.risorto = false
    this.respinto = 0                // da quanto una torre gli è rimbalzata addosso
    this.arrivato = false
  }

  /* una torre lo tocca? */
  immuneA(tipo) { return this.immune.includes(tipo) }

  /* Un passo. Torna `true` se è arrivato in fondo, cioè se il castello
     ha appena perso un cuore. Qui dentro passa anche il tempo del gelo,
     quello del veleno e quello di chi è a terra e sta per rialzarsi. */
  cammina(dt, lunghezza) {
    this.respinto = Math.max(0, this.respinto - dt)
    if (this.aTerra > 0) {
      /* a terra non si cammina e non si soffre: si aspetta. Rialzarsi è
         tornare in piedi con metà della vita, sgelato e pulito */
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
      /* il veleno può farlo cadere, e chi si rialza si rialza anche da lì */
      if (this.vita <= 0) { this.cade(); return false }
    }
    this.d += this.vel * rall * dt
    if (this.d >= lunghezza) { this.vita = 0; this.aTerra = 0; this.arrivato = true }
    return this.arrivato
  }

  /* se due torri gelano lo stesso nemico vale il freno migliore, non
     l'ultimo arrivato. Chi è immune al ghiaccio non gela: torna `false`,
     e la torre sa di aver soffiato a vuoto. */
  gela(durata, freno, fragile = 1, tipo = null) {
    if (tipo && this.immuneA(tipo)) { this.respingi(); return false }
    if (this.aTerra > 0) return false
    this.gelo = Math.max(this.gelo, durata)
    this.freno = Math.max(this.freno || 0, freno)
    this.fragile = Math.max(this.fragile || 1, fragile)
    return true
  }

  /* Il veleno — e il fuoco, che è la stessa cosa vista da un'altra
     torre. `quanto` è al secondo. Non si somma all'infinito: due dosi
     valgono la più forte e la più lunga, se no due torri di veleno
     scioglierebbero qualunque cosa e il ramo diventerebbe l'unica scelta
     sensata. Chi è immune alla torre è immune anche al suo veleno. */
  avvelena(quanto, durata, tipo = null) {
    if (!quanto || !durata || (tipo && this.immuneA(tipo)) || this.aTerra > 0) return
    this.male = Math.max(this.male, quanto)
    this.perQuanto = Math.max(this.perQuanto, durata)
  }

  /* Torna `true` se questo colpo l'ha finito **davvero** — non se è
     solo caduto per rialzarsi. Chi è gelato dalla brina è più fragile,
     ed è il solo modo in cui il ghiaccio partecipa al danno. Chi è
     immune a questa torre non si fa niente: resta solo il segno sopra
     la testa, perché un colpo che non fa niente si deve vedere. */
  ferisci(danno, tipo) {
    /* chi è già caduto in questo stesso fotogramma — sotto la bomba di
       prima, o di veleno — non si ammazza una seconda volta: contarlo
       due volte vorrebbe dire pagarlo due volte */
    if (!this.bersaglio) return false
    if (this.immuneA(tipo)) { this.respingi(); return false }
    this.vita -= danno * (this.fragile || 1)
    return this.vita <= 0 ? this.cade() : false
  }

  respingi() { this.respinto = RESPINTO }

  /* ── cadere ──
     Chi si rialza, la prima volta resta a terra: né vivo né morto,
     niente veleno addosso e niente gelo. Torna `true` solo se è finita. */
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

  /* vivo è anche chi è a terra: non è ancora finita, e non va tolto dal
     campo. Bersaglio invece no — le torri non sprecano colpi su di lui */
  get vivo() { return this.vita > 0 || this.aTerra > 0 }
  get bersaglio() { return this.vita > 0 && !this.arrivato }
  get quota() { return Math.max(0, this.vita / this.vitaMax) }   // 0–1, per la barretta
}
