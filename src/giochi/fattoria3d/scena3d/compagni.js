// I compagni sulla scena: Watson e i gatti che girano per la fattoria. Nessuna regola di gioco: camminano sulla griglia del
// motore (`percorsoVerso`, `libera`) evitando ostacoli e pezzi, a tempo (dt), e si fanno toccare. Cosa decidere lo dicono le
// funzioni pure di `dati/compagni.js`; qui si muovono i corpi. La posizione non si salva: ripartono vicino alla casa.
// Vedi docs/fattoria3d/compagni.md.
import * as THREE from 'three'
import { compagniAl, scegliMeta, cellaLiberaVicina, cellaDi, decidiCane, decidiGatto, durataDi } from '../dati/compagni.js'
import { creaCompagno, posaCane, posaGatto } from './modelli-compagni.js'
import { PEZZI } from '../dati/catalogo.js'
import { alleggeriOmbre } from './ottimizza.js'

const CASA = [0.5, -6.5]                       // davanti alla porta della casa
const VEL = { cane: { vaga: 2.4, segue: 3.6, corsa: 5.6 }, gatto: { vaga: 1.5, fugge: 3.8 } }
const ALTEZZA_SEDILE = 0.45                     // la seduta della panchina (vedi modelli.js)
const ang = (a, b, k) => { let d = b - a; d = Math.atan2(Math.sin(d), Math.cos(d)); return a + d * k }

export class Compagni {
  constructor(scena, motore, eroe, fx, ui, rnd = Math.random) {
    this.scena = scena; this.m = motore; this.eroe = eroe; this.fx = fx; this.ui = ui; this.rnd = rnd
    this.lista = []; this.t = 0; this.inattivo = 0; this.tSync = 0
    this.sync(true)
  }

  /** Chi c'è a questo livello e non è ancora in scena arriva; `senzaAvviso` al caricamento (non è una novità). */
  sync(senzaAvviso = false) {
    for (const d of compagniAl(this.m.livello())) {
      if (this.lista.some(c => c.def.id === d.id)) continue
      const grp = creaCompagno(d); alleggeriOmbre(grp); this.scena.add(grp)
      const c = { def: d, grp, tipo: d.tipo, x: CASA[0], z: CASA[1], dir: 0, stato: 'sta', tStato: 0, dur: 2, percorso: [], poi: null,
                  velo: 0, fase: Math.random() * 6, corsa: false, sopra: null, salto: null, guarda: null, controllo: 0 }
      this.lista.push(c)
      const altri = this.lista.filter(o => o !== c).map(o => [o.x, o.z, 1.2])
      const cella = scegliMeta({ libera: (i, j) => this.m.libera(i, j), centro: CASA, rMin: 0.5, rMax: 3, rnd: this.rnd, evita: altri })
        || cellaLiberaVicina((i, j) => this.m.libera(i, j), CASA[0], CASA[1])
      if (cella) { c.x = cella[0] + 0.5; c.z = cella[1] + 0.5 }
      c.dir = this.rnd() * Math.PI * 2
      grp.position.set(c.x, 0, c.z); grp.rotation.y = c.dir
      if (!senzaAvviso) { this.fx.scoppietta(grp.position, 0xffe27a, 10, 1.4, 2.2); this.ui.avviso(d.arrivo) }
    }
  }

  // ── il tocco ──
  /** Il compagno colpito da un raggio, se c'è. */
  bersaglio(raggio) {
    const zone = this.lista.map(c => c.grp.userData.colpo).filter(Boolean)
    if (!zone.length) return null
    const h = raggio.intersectObjects(zone, false)[0]
    return h ? this.lista.find(c => c.grp.userData.colpo === h.object) : null
  }
  /** Si fa toccare: il cane abbaia e fa festa, il gatto fa le fusa. */
  tocca(c) {
    const p = c.grp.position
    this.fx.volo(c.def.verso, p, c.tipo === 'cane' ? 1.4 : 0.8)
    this.fx.scoppietta(new THREE.Vector3(p.x, p.y + (c.tipo === 'cane' ? 0.9 : 0.4), p.z), 0xff7a9a, 5, 0.8, 1.8)
    c.percorso = []; c.poi = null; c.guarda = [this.eroe.x, this.eroe.z]
    this._stato(c, c.tipo === 'cane' ? 'festa' : 'fusa')
  }

  // ── il battito ──
  aggiorna(dt, tt) {
    this.t = tt
    const e = this.eroe
    this.inattivo = e.az || e.percorso.length ? 0 : this.inattivo + dt
    this.tSync += dt
    if (this.tSync > 1) { this.tSync = 0; this.sync() }
    for (const c of this.lista) this._uno(c, dt)
  }

  _uno(c, dt) {
    const m = this.m, g = c.grp
    c.tStato += dt
    // un pezzo messo proprio qui sotto: si sposta nella cella libera più vicina
    if (!c.sopra && !c.salto) {
      const [i, j] = cellaDi(c.x, c.z)
      if (!m.libera(i, j)) { const v = cellaLiberaVicina((a, b) => m.libera(a, b), c.x, c.z); if (v) { c.x = v[0] + 0.5; c.z = v[1] + 0.5 } c.percorso = []; this._stato(c, 'sta') }
    }
    if (c.sopra && !this._sopraValido(c)) this._scendi(c)
    if (c.salto) this._saltaDietro(c, dt)
    else if (c.percorso.length) this._cammina(c, dt)
    else c.velo = 0
    if (!c.salto && !c.percorso.length) {
      const fine = c.tStato >= c.dur
      if (c.poi && c.stato !== c.poi.stato && (c.stato === 'segue' || c.stato === 'vaga' || c.stato === 'fugge')) this._arrivato(c)
      else if (fine || this._interrotto(c)) this._decidi(c)
    }
    // girarsi: dove si va, o verso chi si guarda
    if (c.velo === 0 && !c.salto) {
      const verso = c.guarda || (c.tipo === 'cane' && c.stato === 'siede' && Math.hypot(this.eroe.x - c.x, this.eroe.z - c.z) < 8 ? [this.eroe.x, this.eroe.z] : null)
      if (verso) c.dir = ang(c.dir, Math.atan2(verso[0] - c.x, verso[1] - c.z), Math.min(1, dt * 4))
    }
    g.position.x = c.x; g.position.z = c.z; g.rotation.y = c.dir
    c.rialzo = (c.rialzo || 0) + (this.m.quotaPasso(c.x, c.z) - (c.rialzo || 0)) * Math.min(1, dt * 14)     // su un ponte si sale
    if (!c.salto) g.position.y = c.sopra ? c.sopra.y : c.rialzo
    const vmax = c.tipo === 'cane' ? VEL.cane.corsa : VEL.gatto.fugge
    const pose = { stato: c.stato, vel: c.velo / vmax, fase: c.fase, t: this.t, p: Math.min(1, c.tStato / (c.dur || 1)) }
    if (c.velo > 0) pose.stato = 'vaga'
    if (c.tipo === 'cane') posaCane(g, { ...pose, vel: c.velo > 0 ? Math.max(0.3, pose.vel) : 0 })
    else posaGatto(g, { ...pose, vel: c.velo > 0 ? Math.max(0.3, pose.vel) : 0 })
  }

  _stato(c, stato) { c.stato = stato; c.tStato = 0; c.dur = durataDi(stato, this.rnd) }

  _interrotto(c) {
    const e = this.eroe, d = Math.hypot(e.x - c.x, e.z - c.z)
    if (c.tipo === 'cane') {
      if (c.stato === 'festa' || c.tStato < 0.6) return false
      return (d > 7 || ((!e.fermo || e.az) && d > 3.2)) && c.stato !== 'segue'
    }
    const cane = this.lista.find(o => o.tipo === 'cane')
    return !!cane && !c.sopra && c.stato !== 'fugge' && Math.hypot(cane.x - c.x, cane.z - c.z) < 1.6
  }

  _cammina(c, dt) {
    const m = this.m, [px, pz] = c.percorso[0]
    if (!m.libera(Math.floor(px), Math.floor(pz))) { c.percorso = []; c.velo = 0; this._decidi(c); return }   // l'hanno chiusa: si ripensa
    const v0 = (VEL[c.tipo][c.stato] || VEL[c.tipo].vaga) * (c.corsa ? (c.tipo === 'cane' ? VEL.cane.corsa / VEL.cane.segue : 1) : 1)
    const dx = px - c.x, dz = pz - c.z, d = Math.hypot(dx, dz), passo = Math.min(d, v0 * dt)
    if (d > 0.001) {
      c.x += dx / d * passo; c.z += dz / d * passo
      c.dir = ang(c.dir, Math.atan2(dx, dz), Math.min(1, dt * 10))
    }
    c.velo = passo / dt; c.fase += dt * c.velo * (c.tipo === 'cane' ? 2.6 : 5)
    if (d - passo < 0.01) c.percorso.shift()
  }

  /** Sale sulla panchina con un salto, o ne scende. */
  _salta(c, ax, az, ay, dur = 0.55) { c.salto = { da: [c.x, c.z, c.grp.position.y], a: [ax, az, ay], t: 0, dur }; c.velo = 0 }
  _saltaDietro(c, dt) {
    const s = c.salto; s.t += dt
    const k = Math.min(1, s.t / s.dur), e = k * k * (3 - 2 * k)
    c.x = s.da[0] + (s.a[0] - s.da[0]) * e; c.z = s.da[1] + (s.a[1] - s.da[1]) * e
    c.grp.position.y = s.da[2] + (s.a[2] - s.da[2]) * e + Math.sin(k * Math.PI) * 0.25
    c.dir = ang(c.dir, Math.atan2(s.a[0] - s.da[0], s.a[1] - s.da[1]), Math.min(1, dt * 12))
    if (k >= 1) { c.salto = null; if (c.stato === 'salta') this._stato(c, c.poi?.stato || 'dorme') ; c.poi = null }
  }
  _sopraValido(c) {
    const p = c.sopra, cosa = this.m.cosa(p.id)
    return !!cosa && cosa.tipo === 'panchina' && cosa.i === p.i && cosa.j === p.j
  }
  _scendi(c) {
    const v = cellaLiberaVicina((a, b) => this.m.libera(a, b), c.x, c.z)
    c.sopra = null
    if (v) this._salta(c, v[0] + 0.5, v[1] + 0.5, 0, 0.45)
    c.poi = null; this._stato(c, 'sta')
  }

  // ── cosa fare adesso ──
  _altri(c) { return this.lista.filter(o => o !== c).map(o => [o.x, o.z, 1.3]) }
  _vai(c, meta, stato, { poi = null, corsa = false, guarda = null } = {}) {
    if (!meta) return this._stato(c, 'sta')
    const via = this.m.percorsoVerso(cellaDi(c.x, c.z), [meta])
    if (!via) return this._stato(c, 'sta')
    c.percorso = via.map(([i, j]) => [i + 0.5, j + 0.5]); c.corsa = corsa; c.poi = poi || { stato: 'sta' }; c.guarda = guarda
    c.stato = stato; c.tStato = 0; c.dur = 999
    if (!c.percorso.length) this._arrivato(c)
  }
  _arrivato(c) {
    const poi = c.poi; c.percorso = []; c.corsa = false; c.velo = 0
    if (poi?.panchina) {                                         // il gatto sale sulla panchina, se c'è ancora
      const p = poi.panchina, cosa = this.m.cosa(p.id)
      if (cosa && cosa.tipo === 'panchina' && cosa.i === p.i && cosa.j === p.j) {
        c.sopra = { id: p.id, i: p.i, j: p.j, y: ALTEZZA_SEDILE }; c.guarda = null
        this._salta(c, p.x, p.z, ALTEZZA_SEDILE); c.stato = 'salta'; c.poi = { stato: 'dorme' }; c.dir = Math.PI / 2; c.tStato = 0; c.dur = 999
        return
      }
    }
    c.poi = null; this._stato(c, poi?.stato || 'sta')
  }

  _decidi(c) {
    const m = this.m, e = this.eroe, libera = (i, j) => m.libera(i, j)
    c.guarda = null
    if (c.sopra) {                                               // se stava su una panchina, dopo il sonno scende
      if (c.stato === 'dorme' || c.stato === 'sta') return this._scendi(c)
    }
    if (c.tipo === 'cane') {
      const dist = Math.hypot(e.x - c.x, e.z - c.z)
      const d = decidiCane({ dist, eroeFermo: e.fermo, eroeLavora: !!e.az, eroeInattivo: this.inattivo }, this.rnd)
      if (d.vai === 'eroe') {
        const meta = scegliMeta({ libera, centro: [e.x, e.z], rMin: 1.6, rMax: 3, rnd: this.rnd, evita: this._altri(c) })
        return this._vai(c, meta, 'segue', { corsa: !!d.fretta, poi: { stato: dist > 3 ? 'sta' : 'siede' } })
      }
      if (d.vai === 'campo') {
        const campi = m.cose.filter(k => k.tipo === 'campo')
        if (!campi.length) return this._stato(c, 'sta')
        const k = campi[Math.floor(this.rnd() * campi.length)], dim = PEZZI.campo
        const centro = [k.i + dim.w / 2, k.j + dim.d / 2]
        const meta = scegliMeta({ libera, centro, rMin: 1.4, rMax: 2.4, rnd: this.rnd, evita: this._altri(c) })
        return this._vai(c, meta, 'vaga', { poi: { stato: 'annusa' }, guarda: centro })
      }
      if (d.vai === 'attorno') {
        const meta = scegliMeta({ libera, centro: [e.x, e.z], rMin: 2, rMax: 6, rnd: this.rnd, evita: this._altri(c) })
        return this._vai(c, meta, 'vaga', { poi: { stato: 'sta' } })
      }
      return this._stato(c, d.stato)
    }
    // il gatto
    const cane = this.lista.find(o => o.tipo === 'cane')
    const vicino = !!cane && Math.hypot(cane.x - c.x, cane.z - c.z) < 3
    const panchine = m.cose.filter(k => k.tipo === 'panchina')
    const d = decidiGatto({ dormePosto: panchine.length > 0, vicinoAlCane: vicino }, this.rnd)
    const evita = cane ? [[cane.x, cane.z, 3.5], ...this._altri(c)] : this._altri(c)
    if (d.vai === 'lontano') return this._vai(c, scegliMeta({ libera, centro: [c.x, c.z], rMin: 4, rMax: 7, rnd: this.rnd, evita }), 'fugge', { poi: { stato: 'siede' } })
    if (d.vai === 'attorno') return this._vai(c, scegliMeta({ libera, centro: [c.x, c.z], rMin: 2, rMax: 5, rnd: this.rnd, evita }), 'vaga', { poi: { stato: 'sta' } })
    if (d.vai === 'posto') {
      const b = panchine[Math.floor(this.rnd() * panchine.length)], dim = PEZZI.panchina
      const centro = [b.i + dim.w / 2, b.j + dim.d / 2]
      const meta = scegliMeta({ libera, centro, rMin: 1.2, rMax: 2.2, rnd: this.rnd, evita })
      return this._vai(c, meta, 'vaga', { poi: { stato: 'dorme', panchina: { id: b.id, i: b.i, j: b.j, x: centro[0], z: centro[1] + 0.05 } } })
    }
    return this._stato(c, d.stato)
  }

  via() {
    for (const c of this.lista) this.scena.remove(c.grp)
    this.lista = []
  }
}
