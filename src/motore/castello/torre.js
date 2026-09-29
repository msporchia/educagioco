// La torre: tiene solo dove sta, tipo, livello e ramo. Quanto fa male, ogni
// quanto spara, quanto lontano arriva lo chiede a data/ops.js e
// data/castello.js. Non sa quanto costa (lo decide chi compra). `agisci` è
// il suo unico verbo; il ghiaccio è l'unico caso che non lancia un colpo.
import { TORRI } from '../../data/ops.js'
import { tiroConDoni, geloConDoni, raggioDi, doniZero } from '../../data/castello.js'
import { dist } from '../../grafica/geometria.js'
import { Colpo } from './colpo.js'
import { Schizzo } from './schizzo.js'

const RAGGIO_PIU = 0.04   // poco: la crescita che si deve vedere è quella del danno
const NIENTE = doniZero() // i doni a riposo, per chi nasce senza regali

export class Torre {
  constructor({ x, y, tipo, lv = 1, ramo = null, ricarica = 0, doni = null }) {
    this.x = x; this.y = y
    this.tipo = tipo
    this.lv = lv
    this.ramo = ramo
    this.ricarica = ricarica
    this.doni = doni || NIENTE
  }

  get modello() { return TORRI[this.tipo] }
  get gelante() { return !!TORRI[this.tipo].gela }
  raggio(S) {
    return TORRI[this.tipo].raggio * S * (1 + (this.lv - 1) * RAGGIO_PIU) *
           raggioDi(this.ramo) * this.doni.raggio
  }

  // il ramo si sceglie una volta sola: chi ce l'ha già lo tiene
  sale(ramo = null) { this.lv++; if (ramo && !this.ramo) this.ramo = ramo; return this }
  sposta(x, y) { this.x = x; this.y = y; return this }

  dati() {
    return { x: this.x, y: this.y, tipo: this.tipo, lv: this.lv,
             ramo: this.ramo, ricarica: this.ricarica }
  }
  static da(dati) { return new Torre(dati) }

  // `null` se non succede niente, se no { colpi, schizzi, sparo }. Prende di
  // mira solo chi può ferire: con solo immuni a tiro resta ferma e non
  // consuma la ricarica (vedi docs/castello/torri.md).
  agisci(dt, { nemici, via, viaDi, S }) {
    this.ricarica -= dt
    if (this.ricarica > 0) return null
    const raggio = this.raggio(S)
    const dove = n => (viaDi ? viaDi(n) : via).puntoA(n.d)
    const dentro = nemici.filter(n => n.bersaglio && dist(dove(n), this) <= raggio)
    if (!dentro.some(n => !n.immuneA(this.tipo))) return null

    // la cadenza è quella del livello e del ramo: l'arciere alto spara
    // una raffica, il cecchino un colpo solo ogni tanto
    const tiro = tiroConDoni(this.tipo, this.lv, this.ramo, this.doni)
    this.ricarica = tiro.ricarica

    if (this.gelante) {
      const g = geloConDoni(this.lv, this.ramo, this.doni)
      const largo = raggio
      for (const n of dentro) n.gela(g.durata, g.freno, g.fragile, this.tipo)
      return { schizzi: [new Schizzo({ x: this.x, y: this.y, max: largo, tipo: this.tipo,
                                       gelo: true, cresce: 1.1, spegne: 0.8 })] }
    }

    const inFila = dentro.filter(n => !n.immuneA(this.tipo)).sort((a, b) => b.d - a.d)
    const colpi = []
    for (let k = 0; k < tiro.salve; k++) {
      const preso = inFila[Math.min(k, inFila.length - 1)]
      const p = dove(preso)
      // Il colpo parte dalla cima della torre, non dai suoi piedi.
      colpi.push(new Colpo({ x: this.x + (k ? 5 * S : 0), y: this.y - (17 + this.lv * 0.6) * S,
                             tx: p.x, ty: p.y, t: k * -0.18,
                             tipo: this.tipo, preso,
                             danno: tiro.danno, area: tiro.area * S,
                             veleno: tiro.veleno, durata: tiro.durata,
                             rimbalzi: tiro.rimbalzi }))
    }
    return { colpi, sparo: true }
  }
}
