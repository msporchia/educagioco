// Come si muove il liquido di un globo della barra (docs/sotterraneo/barra.md, «I globi vivi»): il livello mostrato insegue
// quello vero con un ritardo morbido, le onde si alzano a ogni cambio e si calmano, le bolle salgono quando si cura, il lampo
// rosso di un colpo e la luce di una cura si spengono da sé. Non disegna: lo fanno pittore2d.js (canvas 2D) e pittore3d.js
// (WebGL), che leggono lo stesso `fotogramma()`. Fermo, non chiede fotogrammi: `vivo()` dice se ne servono ancora
const RITARDO_COLPO = 0.22     // s: il colpo si vede prima nel vetro, poi il livello scende
const INSEGUE = 5.5            // quanto in fretta il livello mostrato raggiunge quello vero (1/s)
const CALMA = 1.6              // quanto in fretta le onde si calmano (1/s)

export class StatoGlobo {
  constructor(quota = 0) {
    this.vero = quota
    this.mostrato = quota
    this.onda = 0.25          // l'ampiezza delle onde, 0..1 (un filo di moto alla nascita)
    this.fase = 0
    this.lampo = 0            // il rosso di un colpo, 0..1
    this.luce = 0             // la luce di una cura (o dell'energia usata), 0..1
    this.attesa = 0           // quanto manca prima che il livello cominci a scendere
    this.bolle = []           // { x, y, r, v } in unità del globo (-1..1)
    this.t = 0
  }

  // il valore nuovo: scendendo è un colpo (o l'energia spesa), salendo una cura
  imposta(quota, tipo = 'vita') {
    const q = Math.max(0, Math.min(1, quota))
    if (Math.abs(q - this.vero) < 1e-4) return
    if (q < this.vero) {
      if (tipo === 'vita') { this.lampo = 1; this.attesa = RITARDO_COLPO }
      else this.luce = Math.max(this.luce, 0.8)     // l'energia usata: il globo pulsa di luce
      this.onda = Math.min(1, this.onda + 0.7)
    } else {
      this.luce = Math.max(this.luce, 1)
      this.onda = Math.min(1, this.onda + 0.5)
      this.semina(6 + Math.round((q - this.vero) * 14))
    }
    this.vero = q
  }

  semina(n) {
    for (let i = 0; i < n && this.bolle.length < 14; i++) {
      this.bolle.push({ x: (Math.random() * 2 - 1) * 0.6, y: -0.95 + Math.random() * 0.2, r: 0.035 + Math.random() * 0.05,
                        v: 0.5 + Math.random() * 0.7, d: Math.random() * 0.5 })
    }
  }

  // avanza di dt secondi; torna true se serve un altro fotogramma
  avanza(dt) {
    this.t += dt
    this.fase += dt * (2.2 + this.onda * 3)
    if (this.attesa > 0) this.attesa -= dt
    else this.mostrato += (this.vero - this.mostrato) * (1 - Math.exp(-dt * INSEGUE))   // col tempo, non coi fotogrammi (docs/sotterraneo/grafica-3d.md)
    if (Math.abs(this.vero - this.mostrato) < 0.002) this.mostrato = this.vero
    this.onda = Math.max(0, this.onda - dt * CALMA * Math.max(0.3, this.onda))
    this.lampo = Math.max(0, this.lampo - dt * 2.6)
    this.luce = Math.max(0, this.luce - dt * 1.4)
    const pelo = this.mostrato * 2 - 1
    this.bolle = this.bolle.filter(b => {
      if (b.d > 0) { b.d -= dt; return true }
      b.y += b.v * dt
      b.x += Math.sin(this.t * 6 + b.v * 9) * 0.24 * dt   // al secondo: a fotogramma andava il doppio a 120 Hz
      return b.y < pelo - b.r
    })
    return this.vivo()
  }

  vivo() {
    return this.mostrato !== this.vero || this.onda > 0.02 || this.lampo > 0 || this.luce > 0 || this.bolle.length > 0 || this.attesa > 0
  }

  // quello che i pittori disegnano: il pelo del liquido in −1..1 (−1 vuoto, 1 pieno), le onde, i lampi, le bolle
  fotogramma() {
    return { pelo: this.mostrato * 2 - 1, onda: 0.02 + this.onda * 0.07, fase: this.fase, lampo: this.lampo, luce: this.luce,
             bolle: this.bolle.filter(b => b.d <= 0) }
  }
}
