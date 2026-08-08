/* ═══════════════════════════════════════════════════════════════════
   IL COLPO — quello che viaggia fra la torre e il nemico.

   Si porta dietro *chi* ha preso di mira: una freccia colpisce quel
   nemico lì e nessun altro, e se nel frattempo è morto va a vuoto — ed
   è giusto così. I colpi a zona invece non guardano in faccia nessuno:
   prendono tutti quelli dentro il cerchio.

   Il danno lo applica lui, il conto dei morti lo tiene la battaglia:
   qui non esistono energia né punteggio.
   ═══════════════════════════════════════════════════════════════════ */
import { dist } from '../../grafica/geometria.js'
import { Schizzo } from './schizzo.js'

/* quanto in fretta copre la distanza: `t` va da 0 a 1 */
const VOLO = 4.5

export class Colpo {
  constructor({ x, y, tx, ty, t = 0, tipo, preso = null, danno, area = 0 }) {
    this.x = x; this.y = y            // da dove è partito
    this.tx = tx; this.ty = ty        // dove va a cadere
    this.t = t                        // negativo: la salva è ancora in canna
    this.tipo = tipo
    this.preso = preso
    this.danno = danno; this.area = area
    this.fatto = false
  }

  /* torna `true` nel fotogramma in cui arriva */
  avanza(dt) {
    this.t += dt * VOLO
    return this.t >= 1
  }

  /* L'arrivo: chi prende, chi muore, e l'esplosione se è un colpo a
     zona. Il gelo non passa da qui — non è un colpo, è una folata. */
  impatto(nemici, via) {
    this.fatto = true
    const presi = []
    if (this.area) {
      const centro = { x: this.tx, y: this.ty }
      for (const n of nemici) if (dist(via.puntoA(n.d), centro) <= this.area) presi.push(n)
    } else if (this.preso && this.preso.vivo) {
      presi.push(this.preso)
    }
    const morti = presi.filter(n => n.ferisci(this.danno, this.tipo))
    return {
      colpiti: presi.length, morti,
      // l'esplosione è secca: si apre subito e si spegne subito
      schizzo: this.area
        ? new Schizzo({ x: this.tx, y: this.ty, max: this.area, tipo: this.tipo,
                        cresce: 9, spegne: 3.2 })
        : null,
    }
  }
}
