/* ═══════════════════════════════════════════════════════════════════
   LO SCHIZZO — quello che resta lì dopo il colpo.

   Non fa danno e non decide niente: si allarga e sbiadisce. Sta nel
   motore e non nella grafica per una ragione sola — deve morire con la
   partita e ripartire con lei, e chi disegna non tiene niente in mano
   fra un fotogramma e l'altro.

   Ne esistono due famiglie. Lo schizzo con `stile` è l'effetto di un colpo
   o di una folata di gelo, diverso per ogni tiro e ogni ramo (vedi
   docs/castello/effetti.md): vive `dura` secondi e si disegna a quell'età.
   Senza `stile` resta lo sbuffo di chi si è appena diviso in due
   (`dividi`), che dice «non è morto: adesso sono due».
   ═══════════════════════════════════════════════════════════════════ */
import { TORRI } from '../../data/ops.js'
// quanto vive l'effetto di ogni tiro (chiave: il ramo, o l'aspetto della torre)
// (misurate sull'età «interna» dell'effetto: il disegno scorre `VEL_EFFETTI` volte più svelto)
export const VEL_EFFETTI = 1.5
const INTERNE = {
  arciere: 0.5, cecchino: 0.6, raffica: 0.4,
  magica: 0.9, veleno: 1.9, catena: 0.9,
  bombe: 1.5, mortaio: 1.7, napalm: 2.1,
  ghiaccio: 1.5, bufera: 1.5, brina: 1.5,
}
export const DURATE = Object.fromEntries(Object.entries(INTERNE).map(([k, v]) => [k, v / VEL_EFFETTI]))
export const chiaveEffetto = (tipo, ramo) => ramo || TORRI[tipo].aspetto

export class Schizzo {
  constructor({ x, y, max, tipo, ramo = null, gelo = false, dividi = false, cresce = 5, spegne = 2.4,
                stile = null, da = null, punti = null, dura = 1 }) {
    this.x = x; this.y = y
    this.r = 0; this.max = max        // l'onda si ferma al raggio d'azione
    this.vita = 1
    this.tipo = tipo; this.ramo = ramo; this.gelo = gelo; this.dividi = dividi
    this.cresce = cresce; this.spegne = spegne
    // con `stile` il disegno è un effetto vero (grafica/castello/effetti-impatto.js):
    // vive `dura` secondi e sa da dove è venuto il colpo (`da`)
    this.stile = stile; this.da = da; this.punti = punti; this.dura = dura; this.eta = 0
  }

  /* torna `false` quando è finito e va tolto di mezzo */
  avanza(dt) {
    this.eta += dt
    if (this.stile) { this.vita = 1 - this.eta / this.dura; return this.vita > 0 }
    this.r = Math.min(this.max, this.r + this.max * dt * this.cresce)
    this.vita -= dt * this.spegne
    return this.vita > 0
  }
}
