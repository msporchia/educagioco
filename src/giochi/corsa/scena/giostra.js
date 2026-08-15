/* ═══════════════════════════════════════════════════════════════════
   LA GIOSTRA — il battito del gioco

   Un `requestAnimationFrame` con due accortezze e nient'altro: il passo
   di tempo in secondi, e il tetto a 50 millisecondi. Il tetto serve
   davvero — quando un bambino cambia scheda e torna, il browser consegna
   un salto di trenta secondi tutto insieme, e senza tetto la corsa
   riparte con mezza tappa già passata sotto i piedi.

   Non sa cosa faccia il passo che le si dà: avanza un motore, dipinge un
   canvas, tutti e due. Chi la usa la ferma quando la schermata sparisce,
   o resta a girare a vuoto per sempre.
   ═══════════════════════════════════════════════════════════════════ */

export class Giostra {
  constructor(passo, { tetto = 0.05 } = {}) {
    this.passo = passo
    this.tetto = tetto
    this.giro = 0
    this.ultimo = 0
  }

  get accesa() { return this.giro !== 0 }

  avvia() {
    if (this.giro || typeof requestAnimationFrame !== 'function') return this
    this.ultimo = 0
    const battito = ora => {
      this.giro = requestAnimationFrame(battito)
      const dt = this.ultimo ? Math.min(this.tetto, (ora - this.ultimo) / 1000) : 0
      this.ultimo = ora
      if (dt > 0) this.passo(dt)
    }
    this.giro = requestAnimationFrame(battito)
    return this
  }

  ferma() {
    if (this.giro) cancelAnimationFrame(this.giro)
    this.giro = 0
    return this
  }
}
