/* Chi cammina nella fattoria: dove sta, verso dove va, la strada che sta facendo. Lo spazio arriva da
   fuori (buona(x,y), calpestabile), a celle e non in linea d'aria (percorso/accanto di motore/passi.js)
   — vedi docs/fattoria/animali.md. */
import { percorso, accanto } from '../../../motore/passi.js'

// Quanto lontano si sposta chi gira per conto suo: poco, se no sembra che scappi.
export const RAGGIO_VAGO = 4

// Quante mete si provano prima di lasciar perdere: un recinto piccolo pescherebbe per sempre celle fuori.
const PROVE = 12

export class Camminatore {
  constructor(cx, cy, opz = {}) {
    this.x = cx + 0.5
    this.y = cy + 0.5
    this.verso = 'giu'
    this.passo = 0                    // la fase dell'animazione, in secondi camminati
    this.meta = null                  // il centro della cella verso cui si sta andando
    this.strada = []                  // le celle che restano dopo quella
    this.velocita = opz.velocita || 3.4     // celle al secondo
    this.vaga = opz.vaga || 0               // ogni quanti secondi si sposta da sé
    // Il caso arriva da fuori: una passeggiata si deve poter rifare identica in un test.
    this.sorte = opz.sorte || Math.random
    this.attesa = 1 + this.sorte() * 3
  }

  get cella() { return { x: this.x | 0, y: this.y | 0 } }

  // Quello che serve a chi disegna: sta camminando o è fermo.
  get cammina() { return !!this.meta }

  fermati() { this.meta = null; this.strada = [] }

  // Torna false quando non c'è strada (fermi è meglio che dentro un muro); se sulla meta non si può
  // stare, si punta alla cella buona più vicina (accostarsi).
  vaiA(cx, cy, buona) {
    if (!buona) {                     // senza spazio dichiarato: la vecchia riga dritta
      this.strada = []
      this.meta = { x: cx + 0.5, y: cy + 0.5 }
      return true
    }
    const da = this.cella
    const mira = buona(cx, cy) ? { x: cx, y: cy } : accanto(buona, { x: cx, y: cy }, da)
    if (!mira) return false
    const strada = percorso(buona, da, mira)
    if (!strada) return false
    this.strada = strada
    this.meta = null
    this.avanti()
    return true
  }

  // Il passo dopo, se c'è.
  avanti() {
    const c = this.strada.shift()
    this.meta = c ? { x: c.x + 0.5, y: c.y + 0.5 } : null
    return !!this.meta
  }

  // Si consuma lungo tutta la strada, non solo fino alla prima cella, se no si rallenta agli angoli.
  muovi(dt, buona) {
    if (!this.meta && !this.avanti()) { this.vagabonda(dt, buona); return }
    let resto = this.velocita * dt
    this.passo += dt
    while (this.meta && resto > 0) {
      const dx = this.meta.x - this.x, dy = this.meta.y - this.y
      const d = Math.hypot(dx, dy)
      if (Math.abs(dx) > Math.abs(dy)) this.verso = dx > 0 ? 'lato' : 'sinistra'
      else if (dy) this.verso = dy > 0 ? 'giu' : 'su'
      if (d > resto) {
        this.x += dx / d * resto
        this.y += dy / d * resto
        return
      }
      this.x = this.meta.x; this.y = this.meta.y
      resto -= d
      this.avanti()
    }
  }

  // Si prende la prima cella dove si può stare e dove si arriva davvero: uno steccato chiuso non si attraversa.
  vagabonda(dt, buona) {
    if (!this.vaga) return
    this.attesa -= dt
    if (this.attesa > 0) return
    this.attesa = this.vaga * (0.6 + this.sorte())
    const c = this.cella, lato = RAGGIO_VAGO * 2 + 1
    for (let prova = 0; prova < PROVE; prova++) {
      const x = c.x + ((this.sorte() * lato) | 0) - RAGGIO_VAGO
      const y = c.y + ((this.sorte() * lato) | 0) - RAGGIO_VAGO
      if (x === c.x && y === c.y) continue
      if (buona && !buona(x, y)) continue
      if (this.vaiA(x, y, buona)) return
    }
  }
}
