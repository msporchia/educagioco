/* ═══════════════════════════════════════════════════════════════════
   LO SCHIZZO — quello che resta lì dopo il colpo.

   Non fa danno e non decide niente: si allarga e sbiadisce. Sta nel
   motore e non nella grafica per una ragione sola — deve morire con la
   partita e ripartire con lei, e chi disegna non tiene niente in mano
   fra un fotogramma e l'altro.

   Ne esistono due, e devono restare diversi: l'esplosione si apre di
   colpo e sparisce (`cresce` alto, `spegne` alto), la folata di gelo si
   allarga piano e resta a sbiadire.
   ═══════════════════════════════════════════════════════════════════ */
export class Schizzo {
  constructor({ x, y, max, tipo, gelo = false, cresce = 5, spegne = 2.4 }) {
    this.x = x; this.y = y
    this.r = 0; this.max = max        // l'onda si ferma al raggio d'azione
    this.vita = 1
    this.tipo = tipo; this.gelo = gelo
    this.cresce = cresce; this.spegne = spegne
  }

  /* torna `false` quando è finito e va tolto di mezzo */
  avanza(dt) {
    this.r = Math.min(this.max, this.r + this.max * dt * this.cresce)
    this.vita -= dt * this.spegne
    return this.vita > 0
  }
}
