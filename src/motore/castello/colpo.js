// Il colpo: viaggia fra la torre e il nemico. Una freccia si porta dietro
// chi ha preso di mira (va a vuoto se muore nel frattempo); i colpi a zona
// prendono tutti quelli dentro il cerchio. Non sa niente di immunità: chi è
// immune se lo scrolla di dosso da sé (Nemico.ferisci).
import { dist } from '../../grafica/geometria.js'
import { Schizzo, DURATE, chiaveEffetto } from './schizzo.js'

const VOLO = 4.5      // quanto in fretta copre la distanza: t va da 0 a 1
// chi lancia in alto ci mette di più, il cecchino e il fulmine meno (chiave: ramo o tipo)
const VOLI = { cecchino: 7, catena: 12, sub: 3, veleno: 2.4, div: 2.8, mortaio: 2.1, napalm: 2.6 }
const RIMBALZO = 78   // quanto lontano cerca il rimbalzo della catena

export class Colpo {
  constructor({ x, y, tx, ty, t = 0, tipo, ramo = null, preso = null, danno, area = 0,
                veleno = 0, durata = 0, rimbalzi = 0 }) {
    this.x = x; this.y = y            // da dove è partito
    this.tx = tx; this.ty = ty        // dove va a cadere
    this.t = t                        // negativo: la salva è ancora in canna
    this.tipo = tipo; this.ramo = ramo
    this.volo = VOLI[ramo] || VOLI[tipo] || VOLO
    this.preso = preso
    this.danno = danno; this.area = area
    this.veleno = veleno; this.durata = durata; this.rimbalzi = rimbalzi
    this.fatto = false
  }

  avanza(dt) {
    this.t += dt * this.volo
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
      // ogni colpo lascia il suo segno, anche la freccia: dipende dal ramo
      schizzo: new Schizzo({ x: this.tx, y: this.ty, max: this.area, tipo: this.tipo, ramo: this.ramo,
                             stile: true, da: { x: this.x, y: this.y },
                             // la catena scarica su tutti quelli dentro l'area: il disegno li raggiunge
                             punti: this.ramo === 'catena' ? presi.slice(0, 6).map(punto) : null,
                             dura: DURATE[chiaveEffetto(this.tipo, this.ramo)] }),
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
                             tipo: this.tipo, ramo: this.ramo, preso: vicino, danno }))
      da = p
    }
    return nuovi
  }
}
