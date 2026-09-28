// Il battito del gioco: un requestAnimationFrame col passo in secondi e
// un tetto (50ms) — senza, tornando da una scheda cambiata l'eroe si
// ritrova in mezzo a una folla nata mentre non guardava. Non sa cosa
// faccia il passo che le si dà. Chi la usa la ferma quando la
// schermata sparisce, o resta a girare a vuoto.

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
