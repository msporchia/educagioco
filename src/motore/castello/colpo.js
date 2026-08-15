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

/* quanto lontano cerca il rimbalzo della catena, in unità */
const RIMBALZO = 78

export class Colpo {
  constructor({ x, y, tx, ty, t = 0, tipo, preso = null, danno, area = 0,
                veleno = 0, durata = 0, rimbalzi = 0 }) {
    this.x = x; this.y = y            // da dove è partito
    this.tx = tx; this.ty = ty        // dove va a cadere
    this.t = t                        // negativo: la salva è ancora in canna
    this.tipo = tipo
    this.preso = preso
    this.danno = danno; this.area = area
    /* quello che il colpo lascia dietro di sé: un male che continua
       (veleno, o fuoco) e la voglia di rimbalzare su chi sta vicino */
    this.veleno = veleno; this.durata = durata; this.rimbalzi = rimbalzi
    this.fatto = false
  }

  /* torna `true` nel fotogramma in cui arriva */
  avanza(dt) {
    this.t += dt * VOLO
    return this.t >= 1
  }

  /* L'arrivo: chi prende, chi muore, l'esplosione se è un colpo a zona,
     e i rimbalzi se è una catena. Il gelo non passa da qui — non è un
     colpo, è una folata. */
  impatto(nemici, via, dove = null) {
    this.fatto = true
    const punto = dove || (n => via.puntoA(n.d))
    const presi = []
    if (this.area) {
      const centro = { x: this.tx, y: this.ty }
      for (const n of nemici) if (dist(punto(n), centro) <= this.area) presi.push(n)
    } else if (this.preso && this.preso.vivo) {
      presi.push(this.preso)
    }
    const morti = presi.filter(n => n.ferisci(this.danno, this.tipo))
    for (const n of presi) n.avvelena(this.veleno, this.durata)
    return {
      colpiti: presi.length, morti,
      /* i rimbalzi della catena: mezzo danno ciascuno, sul vivo più
         vicino che non abbia già preso. Escono di qui come colpi nuovi,
         così viaggiano e si vedono come tutti gli altri. */
      rimbalzi: this.rimbalzi ? this.saltaAddosso(nemici, presi, punto) : [],
      // l'esplosione è secca: si apre subito e si spegne subito
      schizzo: this.area
        ? new Schizzo({ x: this.tx, y: this.ty, max: this.area, tipo: this.tipo,
                        cresce: 9, spegne: 3.2 })
        : null,
    }
  }

  saltaAddosso(nemici, presi, punto) {
    const nuovi = []
    const toccati = new Set(presi)
    let da = { x: this.tx, y: this.ty }
    let danno = this.danno
    for (let k = 0; k < this.rimbalzi; k++) {
      let vicino = null, minima = RIMBALZO
      for (const n of nemici) {
        if (!n.vivo || toccati.has(n)) continue
        const d = dist(punto(n), da)
        if (d < minima) { minima = d; vicino = n }
      }
      if (!vicino) break
      toccati.add(vicino)
      danno /= 2
      const p = punto(vicino)
      nuovi.push(new Colpo({ x: da.x, y: da.y, tx: p.x, ty: p.y, t: -0.1 * (k + 1),
                             tipo: this.tipo, preso: vicino, danno }))
      da = p
    }
    return nuovi
  }
}
