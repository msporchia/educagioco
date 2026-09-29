// Il colpo: viaggia fra la torre e il nemico. Una freccia si porta dietro
// chi ha preso di mira (va a vuoto se muore nel frattempo); i colpi a zona
// prendono tutti quelli dentro il cerchio. Non sa niente di immunità: chi è
// immune se lo scrolla di dosso da sé (Nemico.ferisci).
import { dist } from '../../grafica/geometria.js'
import { Schizzo } from './schizzo.js'

const VOLO = 4.5      // quanto in fretta copre la distanza: t va da 0 a 1
const RIMBALZO = 78   // quanto lontano cerca il rimbalzo della catena

export class Colpo {
  constructor({ x, y, tx, ty, t = 0, tipo, preso = null, danno, area = 0,
                veleno = 0, durata = 0, rimbalzi = 0 }) {
    this.x = x; this.y = y            // da dove è partito
    this.tx = tx; this.ty = ty        // dove va a cadere
    this.t = t                        // negativo: la salva è ancora in canna
    this.tipo = tipo
    this.preso = preso
    this.danno = danno; this.area = area
    this.veleno = veleno; this.durata = durata; this.rimbalzi = rimbalzi
    this.fatto = false
  }

  avanza(dt) {
    this.t += dt * VOLO
    return this.t >= 1
  }

  // il gelo non passa da qui: non è un colpo, è una folata
  impatto(nemici, via, dove = null) {
    this.fatto = true
    const punto = dove || (n => via.puntoA(n.d))
    const presi = []
    if (this.area) {
      const centro = { x: this.tx, y: this.ty }
      for (const n of nemici) if (n.bersaglio && dist(punto(n), centro) <= this.area) presi.push(n)
    } else if (this.preso && this.preso.bersaglio) {
      presi.push(this.preso)
    }
    const morti = presi.filter(n => n.ferisci(this.danno, this.tipo))
    for (const n of presi) if (n.bersaglio) n.avvelena(this.veleno, this.durata, this.tipo)
    return {
      colpiti: presi.length, morti,
      rimbalzi: this.rimbalzi ? this.saltaAddosso(nemici, presi, punto) : [],
      schizzo: this.area
        ? new Schizzo({ x: this.tx, y: this.ty, max: this.area, tipo: this.tipo,
                        cresce: 9, spegne: 3.2 })
        : null,
    }
  }

  // la catena salta solo su chi può ferire: rimbalzare su un immune
  // sarebbe un colpo buttato
  saltaAddosso(nemici, presi, punto) {
    const nuovi = []
    const toccati = new Set(presi)
    let da = { x: this.tx, y: this.ty }
    let danno = this.danno
    for (let k = 0; k < this.rimbalzi; k++) {
      let vicino = null, minima = RIMBALZO
      for (const n of nemici) {
        if (!n.bersaglio || toccati.has(n) || n.immuneA(this.tipo)) continue
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
