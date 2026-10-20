// L'eroe: cammina lungo un percorso (o corre, se la meta è lontana), si gira verso la cosa, e fa il gesto del momento (semina,
// falcia, abbatte, esulta). Decide il movimento e la posa, non le regole: la strada la dice il motore, e cosa succede alla fine
// di un gesto lo dice chi l'ha chiesto (`fn` a ogni passo del gesto, `fine` alla fine).
import { creaContadino } from './modelli-compagni.js'
import { ASPETTO_ERO } from '../dati/compagni.js'
import { PARTENZA } from '../dati/mondo.js'

const VEL = 4.8, VEL_STRADA = 6.6, FATTORE_CORSA = 1.75, CORSA_DA = 9
const ang = (a, b, k) => { let d = b - a; d = Math.atan2(Math.sin(d), Math.cos(d)); return a + d * k }

export class Eroe {
  constructor(scena, motore, effetti) {
    this.m = motore; this.fx = effetti
    this.grp = creaContadino(ASPETTO_ERO)
    scena.add(this.grp)
    this.x = PARTENZA.x; this.z = PARTENZA.z; this.dir = Math.PI
    this.percorso = []; this.dopo = null; this.verso = null; this.az = null
    this.fase = 0; this.vel = 0; this.corsa = false
    this.alVia = null                   // chi vuole saperlo quando parte un nuovo percorso (la camera torna a seguirlo)
    this.grp.position.set(this.x, 0, this.z)
  }

  get posizione() { return this.grp.position }
  get fermo() { return !this.az && !this.percorso.length }
  cella() { return [Math.floor(this.x), Math.floor(this.z)] }
  faccia(verso) { if (verso) this.dir = Math.atan2(verso.x - this.x, verso.z - this.z) }

  /** Va alla più vicina fra le celle `celle` e, arrivato, chiama `dopo` (e si gira verso `verso`). Torna se ci arriva. */
  vaiA(celle, dopo, verso) {
    this.alVia?.()
    const via = this.m.percorsoVerso(this.cella(), celle)
    if (!via) { this.fx.parla('Non ci arrivo…'); return false }
    this.percorso = via.map(([i, j]) => [i + 0.5, j + 0.5])
    let lung = 0, px = this.x, pz = this.z
    for (const [x, z] of this.percorso) { lung += Math.hypot(x - px, z - pz); px = x; pz = z }
    this.corsa = lung > CORSA_DA                     // lontano: il contadino corre
    this.dopo = dopo || null; this.verso = verso || null
    if (!this.percorso.length && dopo) { this.dopo = null; dopo() }
    return true
  }
  ferma() { this.percorso = []; this.dopo = null; this.verso = null; this.corsa = false }

  avvia(tipo, dur, fn, fine) { this.az = { tipo, t: 0, dur, fn, fine, fatto: new Set() } }

  aggiorna(dt, tt) {
    this.vel = 0
    if (this.az) {
      const a = this.az; a.t += dt
      if (a.fn) a.fn(a.t / a.dur, dt)
      if (a.t >= a.dur) { const f = a.fine; this.az = null; f && f() }
    } else if (this.percorso.length) {
      const [px, pz] = this.percorso[0], dx = px - this.x, dz = pz - this.z, d = Math.hypot(dx, dz)
      const vel = (this.m.eStrada(Math.floor(this.x), Math.floor(this.z)) ? VEL_STRADA : VEL) * (this.corsa ? FATTORE_CORSA : 1)
      const v = Math.min(d, vel * dt)
      if (d > 0.001) { this.x += dx / d * v; this.z += dz / d * v; this.dir = ang(this.dir, Math.atan2(dx, dz), Math.min(1, dt * 14)); this.vel = v / dt; this.fase += dt * 12 * vel / VEL }
      if (d - v < 0.01) {
        this.percorso.shift()
        if (!this.percorso.length) {
          this.corsa = false
          const f = this.dopo; this.dopo = null
          if (this.verso) { this.faccia(this.verso); this.verso = null }
          if (f) f()
        }
      }
    }
    this.grp.position.x = this.x; this.grp.position.z = this.z; this.grp.rotation.y = this.dir
    this._posa(tt)
  }

  _posa(tt) {
    const u = this.grp.userData
    u.testa.rotation.set(0, 0, 0); u.gambe.forEach(g => { g.rotation.x = 0 }); u.bracci.forEach(b => b.rotation.set(0, 0, 0)); u.busto.rotation.set(0, 0, 0); u.busto.scale.set(1, 1, 1); u.busto.position.y = 0.34
    this.grp.position.y = 0; u.falce.visible = false; u.ascia.visible = false
    const a = this.az
    if (a) {
      const p = a.t / a.dur
      if (a.tipo === 'semina') {
        u.busto.rotation.x = 0.5 * Math.sin(Math.min(1, p) * Math.PI)
        u.bracci[1].rotation.x = -0.6 - Math.sin(tt * 22) * 0.6; u.bracci[0].rotation.x = 0.3
      } else if (a.tipo === 'falcia') {
        u.falce.visible = true
        const sw = 0.5 - 0.5 * Math.cos(p * Math.PI * 6)                     // tre passate
        u.bracci[1].rotation.x = -1.35; u.bracci[1].rotation.z = -0.9 + sw * 1.8; u.bracci[0].rotation.x = -0.6
        u.busto.rotation.y = -0.6 + sw * 1.2; u.busto.rotation.x = 0.2
        u.gambe[0].rotation.x = 0.3; u.gambe[1].rotation.x = -0.3
      } else if (a.tipo === 'abbatti') {
        u.ascia.visible = true
        const col = Math.pow(Math.max(0, Math.sin(p * Math.PI * 4)), 2)             // quattro colpi
        u.bracci[1].rotation.x = -2.5 + col * 1.9; u.bracci[0].rotation.x = -1.2 + col * 1.0
        u.busto.rotation.x = 0.1 + col * 0.35; u.gambe[0].rotation.x = 0.3; u.gambe[1].rotation.x = -0.3
      } else if (a.tipo === 'esulta') {
        const s = Math.sin(Math.min(1, p) * Math.PI)
        this.grp.position.y = s * 0.35; u.bracci.forEach(b => { b.rotation.x = -2.6 * s })
      }
    } else if (this.vel > 0.1) {
      const s = Math.sin(this.fase), c = this.corsa ? 1 : 0
      u.gambe[0].rotation.x = s * (0.8 + 0.4 * c); u.gambe[1].rotation.x = -s * (0.8 + 0.4 * c)
      u.bracci[0].rotation.x = -s * (0.7 + 0.6 * c); u.bracci[1].rotation.x = s * (0.7 + 0.6 * c)
      u.busto.position.y = 0.34 + Math.abs(s) * (0.045 + 0.04 * c); u.busto.rotation.x = 0.1 + 0.25 * c
      u.testa.rotation.z = Math.sin(s * 0.5) * 0.06; u.testa.rotation.x = -0.05 - 0.1 * c
    } else { u.busto.position.y = 0.34 + Math.sin(tt * 2) * 0.005; u.busto.scale.y = 1 + Math.sin(tt * 2) * 0.012; u.testa.rotation.y = Math.sin(tt * 0.6) * 0.12 }
  }
}
