// I compagni sulla scena: Watson e i gatti che girano per la fattoria. Nessuna regola di gioco: camminano sulla griglia del
// motore (`percorsoVerso`, `libera`) evitando ostacoli e pezzi, a tempo (dt), e si fanno toccare. Cosa decidere lo dicono le
// funzioni pure di `dati/compagni.js`; qui si muovono i corpi. La posizione non si salva: ripartono vicino alla casa.
// Vedi docs/fattoria3d/compagni.md.
import * as THREE from 'three'
import { segna } from '../../../grafica/elementi3d.js'
import { compagniAl, scegliMeta, scegliMetaAttorno, cellaLiberaVicina, cellaDi, decidiCane, decidiGatto, durataDi, SOGLIA_RICHIAMO, DIST_INCONTRO,
  scegliInterazioneCane, sequenzaCane, sequenzaRichiamo, sequenzaSonno, sequenzaSveglia, carezzaCane, scegliRispostaGatto, sequenzaGatto,
  chiamaIlGatto, sequenzaGattoChiamato,
  sequenzaGattoSopra, incontroGattoCane, sequenzaIncontro } from '../dati/compagni.js'
import { posaCane, posaGatto, impostaDettaglio } from './modelli-compagni.js'
import { vestiBestia } from './modelli-addobbi.js'
import { creaBestia, posaPiccolo, posaBeagle } from './modelli-bestie.js'
import { decidiPiccolo, ePiccolo } from '../dati/bestie.js'
import { POSTI, postoLibero, postiLiberi, scegliPosto } from '../dati/posti-compagni.js'
import { PEZZI } from '../dati/catalogo.js'
import { alleggeriOmbre } from './ottimizza.js'

const LOD_METRI = 12                              // oltre questa distanza dalla camera un compagno si disegna con le geometrie povere (modelli-compagni.js)
const CASA = [0.5, -6.5]                       // davanti alla porta della casa
const VEL = { cane: { vaga: 2.4, segue: 3.6, corsa: 5.6 }, gatto: { vaga: 1.5, fugge: 3.8 }, coniglio: { vaga: 1.8 }, pappagallo: { vaga: 1.2 } }
const FASE_PER_METRO = { cane: 2.6, gatto: 5, coniglio: 3.2, pappagallo: 3.2 }   // quanto avanza il passo per metro percorso
const ang = (a, b, k) => { let d = b - a; d = Math.atan2(Math.sin(d), Math.cos(d)); return a + d * k }

export class Compagni {
  constructor(scena, motore, eroe, fx, ui, rnd = Math.random) {
    this.scena = scena; this.m = motore; this.eroe = eroe; this.fx = fx; this.ui = ui; this.rnd = rnd
    this.camera = null          // la camera di three (la mette il mondo): oltre `LOD_METRI` i compagni usano le geometrie povere
    this.lista = []; this.t = 0; this.inattivo = 0; this.tSync = 0
    this.ultimaCane = null; this.incontri = 0          // l'ultima festa di Watson (mai due uguali di fila); gli incontri gatto-cane fatti
    this.sync(true)
  }

  /** Chi c'è a questo livello (i compagni gratis) o è una bestia di casa che hai preso (docs/fattoria3d/bestie-di-casa.md) e non è ancora in scena arriva;
      `senzaAvviso` al caricamento (non è una novità). Il nome cambia da sé quando glielo dai (anche a Watson e ai gatti). */
  sync(senzaAvviso = false) {
    const cura = this.m.cura
    const gratis = compagniAl(this.m.livello()).map(c => (cura ? { ...c, nome: cura.nomeDi(c.id) } : c))
    for (const d of [...gratis, ...(cura ? cura.compagniPresi() : [])]) {
      const dentro = this.lista.find(c => c.def.id === d.id)
      if (dentro) { dentro.def.nome = d.nome; if (cura) vestiBestia(dentro.grp, cura.addossoA(d.id)); continue }
      const grp = creaBestia(d); alleggeriOmbre(grp); if (cura) vestiBestia(grp, cura.addossoA(d.id)); this.scena.add(segna(grp, 'animali'))
      const c = { def: d, grp, tipo: d.tipo, x: CASA[0], z: CASA[1], dir: 0, stato: 'sta', tStato: 0, dur: 2, percorso: [], poi: null,
                  velo: 0, fase: Math.random() * 6, corsa: false, sopra: null, salto: null, guarda: null, controllo: 0,
                  seq: null, iSeq: 0, sub: '', evFatti: new Set(), carezze: null, prossimoIncontro: 0, altro: null, bastoneFino: 0 }
      this.lista.push(c)
      const altri = this.lista.filter(o => o !== c).map(o => [o.x, o.z, 1.2])
      const casa = this._casa(c)
      const cella = scegliMeta({ libera: (i, j) => this.m.libera(i, j), centro: casa, rMin: 0.5, rMax: 3, rnd: this.rnd, evita: altri })
        || cellaLiberaVicina((i, j) => this.m.libera(i, j), casa[0], casa[1])
      if (cella) { c.x = cella[0] + 0.5; c.z = cella[1] + 0.5 }
      c.dir = this.rnd() * Math.PI * 2
      grp.position.set(c.x, 0, c.z); grp.rotation.y = c.dir
      if (!senzaAvviso) { this.fx.scoppietta(grp.position, 0xffe27a, 10, 1.4, 2.2); this.ui.avviso(d.arrivo) }
    }
  }

  /** Dove sta di casa: la cella dove il bambino ha messo la bestia, o davanti alla porta. */
  _casa(c) { const k = c.def.daCurare && this.m.cura.casaDi(c.def.id); return k ? [k[0] + 0.5, k[1] + 0.5] : CASA }
  /** La bestia di casa spostata dal foglio (gratis): scompare e riappare, in una nuvola, nella nuova cella, che da ora è casa sua. */
  portaA(id, i, j) {
    const c = this.lista.find(o => o.def.id === id)
    if (!c) return false
    this.fx.scoppietta(new THREE.Vector3(c.x, 0.3, c.z), 0xffffff, 6, 0.9, 1.6)
    c.x = i + 0.5; c.z = j + 0.5; c.percorso = []; c.poi = null; c.seq = null; c.salto = null; c.sopra = null
    this._stato(c, 'sta')
    this.fx.scoppietta(new THREE.Vector3(c.x, 0.3, c.z), 0xffe27a, 8, 1, 1.8)
    return true
  }
  /** Una coccola o un pasto dal foglio: cuoricini e il suo verso (se non è già in sequenza). */
  festa(id) {
    const c = this.lista.find(o => o.def.id === id)
    if (!c) return false
    if (c.seq || c.salto) { this.fx.scoppietta(new THREE.Vector3(c.x, c.grp.position.y + (c.tipo === 'cane' ? 0.9 : 0.4), c.z), 0xff7a9a, 6, 0.9, 1.8); return true }
    this._toccaSemplice(c)
    return true
  }
  /** Il nome di chi si chiama: quello dato dal bambino alle bestie di casa, quello vero ai compagni gratis. */
  _nome(c) { return c.def.nome }

  // ── il tocco ──
  /** Il compagno colpito da un raggio, se c'è. */
  bersaglio(raggio) {
    const zone = this.lista.map(c => c.grp.userData.colpo).filter(Boolean)
    if (!zone.length) return null
    const h = raggio.intersectObjects(zone, false)[0]
    return h ? this.lista.find(c => c.grp.userData.colpo === h.object) : null
  }
  /** Si fa toccare. Watson: lontano lo chiama il contadino e arriva di corsa, poi fa una festa (sempre diversa); i gatti, se lontani, li chiama per nome e rispondono a modo
      loro (si avvicinano, restano lì, si voltano, fanno una cosa buffa). Se l'eroe non sta fermo, il vecchio «Bau!» o «Prrr…» sul posto. */
  tocca(c) {
    if (c.def.daCurare) {                                                    // una bestia di casa: il suo verso e i cuoricini, e si apre il suo foglio (viste/Bestia.vue)
      this._toccaSemplice(c)
      if (this.ui.apriBestia) this.ui.apriBestia(c.def.id)
      return
    }
    if (c.salto || (c.seq && !(c.tipo === 'cane' && c.stato === 'dorme' && !c.seq.incontro))) return        // già occupato: un tocco non lo riavvia
    const e = this.eroe, dist = Math.hypot(e.x - c.x, e.z - c.z)
    if (c.tipo === 'cane') {
      if (c.stato === 'dorme') return this._avviaSeq(c, sequenzaSveglia())
      if (!e.fermo) {
        if (dist > SOGLIA_RICHIAMO) { this.fx.parla(this._nome(c) + '!'); return this._decidi(c) }
        return this._toccaSemplice(c)
      }
      if (dist > SOGLIA_RICHIAMO) {
        e.faccia({ x: c.x, z: c.z }); this.fx.parla(this._nome(c) + '!'); e.avvia('chiama', 0.9)
        const id = this.ultimaCane = scegliInterazioneCane(this.ultimaCane, this.rnd)
        return this._avviaSeq(c, [...sequenzaRichiamo(), ...sequenzaCane(id)])
      }
      const car = c.carezze = carezzaCane(c.carezze, this.t)
      if (car.dorme) return this._avviaSeq(c, sequenzaSonno(this.rnd))
      return this._avviaSeq(c, sequenzaCane(this.ultimaCane = scegliInterazioneCane(this.ultimaCane, this.rnd)))
    }
    if (c.sopra) return this._avviaSeq(c, sequenzaGattoSopra())            // si sveglia stiracchiandosi e resta dov'è
    if (!e.fermo) return this._toccaSemplice(c)
    const r = scegliRispostaGatto(dist, this.rnd, c.def.variante)
    if (chiamaIlGatto(dist, e.fermo)) {                                      // lontano: il contadino lo chiama per nome, poi il gatto risponde a modo suo
      e.faccia({ x: c.x, z: c.z }); this.fx.parla(this._nome(c) + '!'); e.avvia('chiama', 0.9)
      return this._avviaSeq(c, sequenzaGattoChiamato(r, c.def.variante, this.rnd))
    }
    this._avviaSeq(c, sequenzaGatto(r, c.def.variante, dist <= 1.3, this.rnd))
  }
  _toccaSemplice(c) {
    const p = c.grp.position
    this.fx.volo(c.def.verso, p, c.tipo === 'cane' ? 1.4 : 0.8)
    this.fx.scoppietta(new THREE.Vector3(p.x, p.y + (c.tipo === 'cane' ? 0.9 : 0.4), p.z), 0xff7a9a, 5, 0.8, 1.8)
    c.percorso = []; c.poi = null; c.guarda = [this.eroe.x, this.eroe.z]
    this._stato(c, c.tipo === 'gatto' ? 'fusa' : 'festa')
  }

  // ── le sequenze: una fila di passi a tempo (dati/compagni.js), con eventi (versi, cuori) e, se serve, una camminata ──
  _avviaSeq(c, passi) {
    c.percorso = []; c.poi = null; c.corsa = false
    passi.eroeFermoAlVia = this.eroe.fermo
    c.seq = passi; c.iSeq = 0
    this._iniziaPasso(c); this._eventi(c)
  }
  _iniziaPasso(c) {
    const s = c.seq[c.iSeq]
    if (!s) return this._fineSeq(c)
    c.evFatti = new Set()
    if (s.va) return this._vaSeq(c, s.va)
    c.stato = s.stato; c.sub = s.sub || ''; c.tStato = 0; c.dur = s.dur; c.guarda = this._mira(c, s.guarda)
    if (s.cane) this._passoCane(c, s.cane)
  }
  _passoSeq(c) {
    const s = c.seq[c.iSeq]
    if (!s) return this._fineSeq(c)
    c.guarda = this._mira(c, s.guarda)
    this._eventi(c)
    if (c.tStato >= s.dur) { c.iSeq++; this._iniziaPasso(c) }
  }
  _eventi(c) {
    const s = c.seq?.[c.iSeq]
    for (const [t, nome] of s?.ev || []) if (c.tStato >= t && !c.evFatti.has(t + nome)) { c.evFatti.add(t + nome); this._evento(c, nome) }
  }
  _fineSeq(c) {
    c.seq = null; c.sub = ''; c.guarda = null; c.velo = 0
    const e = this.eroe
    if (c.tipo === 'cane' && e.fermo && Math.hypot(e.x - c.x, e.z - c.z) < 4) return this._stato(c, 'siede')      // finita la festa, se è vicino si siede (non è la soglia del richiamo)
    this._decidi(c)
  }
  _interrompi(c) { c.seq = null; c.percorso = []; c.poi = null; c.corsa = false; c.sub = ''; c.velo = 0; this._decidi(c) }
  _eroeSiMuove() { const e = this.eroe; return e.percorso.length > 0 || (!!e.az && e.az.tipo !== 'chiama') }
  /** Dove si guarda: l'eroe, l'altro animale dell'incontro, o dalla parte opposta all'eroe (indifferenza). */
  _mira(c, tipo) {
    const e = this.eroe
    if (tipo === 'eroe') return [e.x, e.z]
    if (tipo === 'altro') return c.altro ? [c.altro.x, c.altro.z] : null
    if (tipo === 'via') return [2 * c.x - e.x, 2 * c.z - e.z]
    return null
  }
  /** Un passo che cammina: verso l'eroe (a r celle), verso il cane o lontano da lui; arrivato, la sequenza riprende. */
  _vaSeq(c, va) {
    const libera = (i, j) => this.m.libera(i, j), e = this.eroe, cane = this.lista.find(o => o.tipo === 'cane' && !o.def.daCurare)
    let centro = [e.x, e.z], evita = this._altri(c)
    if (va.verso === 'cane' && cane) { centro = [cane.x, cane.z]; evita = evita.filter(([x, z]) => x !== cane.x || z !== cane.z) }
    else if (va.verso === 'lontano') { centro = [c.x, c.z]; if (cane) evita = [[cane.x, cane.z, 2], ...evita] }
    const meta = scegliMetaAttorno({ libera, centro, rMin: va.r[0], rMax: va.r[1], rnd: this.rnd, evita })
    c.sub = ''; c.guarda = null
    if (!this._vai(c, meta, c.tipo === 'cane' ? 'segue' : 'vaga', { corsa: !!va.corsa, poi: { riprendi: true } })) { c.seq = null; this._stato(c, 'sta') }
  }
  /** Il passo del gatto dice cosa fa il cane nell'incontro. */
  _passoCane(gatto, spec) {
    const cane = gatto.altro
    if (!cane || (cane.seq && !cane.seq.incontro)) return
    const passi = [{ stato: 'incontra', sub: spec.sub, dur: spec.dur, guarda: 'altro' }]; passi.incontro = true
    cane.percorso = []; cane.poi = null; cane.corsa = false
    cane.seq = passi; cane.iSeq = 0; cane.evFatti = new Set(); cane.stato = 'incontra'; cane.sub = spec.sub; cane.tStato = 0; cane.dur = spec.dur
  }
  /** Un gatto e Watson si incontrano: il cane aspetta fermo, il gatto va da lui e si salutano. */
  _incontra(gatto, cane, esito) {
    const attesa = [{ stato: 'sta', dur: 6, guarda: 'altro' }]; attesa.incontro = true
    cane.percorso = []; cane.poi = null; cane.corsa = false; cane.velo = 0
    cane.seq = attesa; cane.iSeq = 0; cane.evFatti = new Set(); cane.stato = 'sta'; cane.sub = ''; cane.tStato = 0; cane.dur = 6
    gatto.altro = cane; cane.altro = gatto; this.incontri++
    const passi = sequenzaIncontro(esito); passi.incontro = true
    this._avviaSeq(gatto, passi)
  }
  _evento(c, nome) {
    const p = c.grp.position, cane = c.tipo === 'cane'
    const volo = t => this.fx.volo(t, p, cane ? 1.4 : 0.8)
    const cuori = (n, f) => this.fx.scoppietta(new THREE.Vector3(p.x, p.y + (cane ? 0.9 : 0.4), p.z), 0xff7a9a, n, f, 1.8)
    switch (nome) {
      case 'bau': case 'bauP': return volo('Bau!')
      case 'bau2': return volo('Bau! Bau!')
      case 'cuori': return cuori(5, 0.8)
      case 'raffica': return cuori(14, 1.4)
      case 'hrr': return volo('Hrrr')
      case 'ciu': return volo('Ciù!')
      case 'zzz': return volo('Zzz…')
      case 'prrr': return volo('Prrr…')
      case 'miao': return volo('Miao!')
      case 'mrr': return volo('Mrr')
      case 'posa': return this._posaBastone(c)
    }
  }
  /** Il bastoncino lascia la bocca di Watson e resta ai piedi dell'eroe per un paio di secondi. */
  _posaBastone(c) {
    const b = c.grp.userData.bastone, e = this.eroe
    if (!b || b.parent !== c.grp.userData.testa) return
    c.grp.updateMatrixWorld(true); this.scena.attach(b)
    const dx = c.x - e.x, dz = c.z - e.z, d = Math.hypot(dx, dz) || 1
    b.position.set(e.x + dx / d * 0.45, 0.03, e.z + dz / d * 0.45); b.rotation.set(0, 0.5 + this.rnd() * 2, Math.PI / 2); b.visible = true
    c.bastoneFino = this.t + 2
  }
  _rimettiBastone(c) {
    const b = c.grp.userData.bastone, base = b.userData.base
    b.removeFromParent(); c.grp.userData.testa.add(b); b.position.copy(base.p); b.rotation.copy(base.r); b.visible = false; c.bastoneFino = 0
  }

  // ── il battito ──
  aggiorna(dt, tt) {
    this.t = tt
    const e = this.eroe
    this.inattivo = e.az || e.percorso.length ? 0 : this.inattivo + dt
    this.tSync += dt
    if (this.tSync > 1) { this.tSync = 0; this.sync() }
    for (const c of this.lista) { this._uno(c, dt); if (c.bastoneFino && this.t >= c.bastoneFino) this._rimettiBastone(c) }
  }

  _uno(c, dt) {
    const m = this.m, g = c.grp
    c.tStato += dt
    if (c.seq && !c.seq.incontro && c.seq.eroeFermoAlVia && this._eroeSiMuove()) this._interrompi(c)      // l'eroe parte o lavora: la festa finisce
    // un pezzo messo proprio qui sotto: si sposta nella cella libera più vicina
    if (!c.sopra && !c.salto) {
      const [i, j] = cellaDi(c.x, c.z)
      if (!m.libera(i, j)) { const v = cellaLiberaVicina((a, b) => m.libera(a, b), c.x, c.z); if (v) { c.x = v[0] + 0.5; c.z = v[1] + 0.5 } c.percorso = []; c.seq = null; this._stato(c, 'sta') }
    }
    if (c.sopra && !this._sopraValido(c)) this._scendi(c)
    if (c.salto) this._saltaDietro(c, dt)
    else if (c.percorso.length) this._cammina(c, dt)
    else c.velo = 0
    if (!c.salto && !c.percorso.length) {
      const fine = c.tStato >= c.dur
      if (c.seq) { if (c.poi?.riprendi) this._arrivato(c); else this._passoSeq(c) }
      else if (c.poi && c.stato !== c.poi.stato && (c.stato === 'segue' || c.stato === 'vaga' || c.stato === 'fugge')) this._arrivato(c)
      else if (fine || this._interrotto(c)) this._decidi(c)
    }
    // girarsi: dove si va, o verso chi si guarda
    if (c.velo === 0 && !c.salto) {
      const verso = c.guarda || (c.tipo === 'cane' && c.stato === 'siede' && Math.hypot(this.eroe.x - c.x, this.eroe.z - c.z) < 8 ? [this.eroe.x, this.eroe.z] : null)
      if (verso) c.dir = ang(c.dir, Math.atan2(verso[0] - c.x, verso[1] - c.z), Math.min(1, dt * 4))
    }
    const passo = c.seq?.[c.iSeq]
    if (passo?.giri && !c.percorso.length && c.tStato < passo.dur * 0.78) { c.dir += dt * passo.giri * Math.PI * 2 / (passo.dur * 0.78); c.fase += dt * 7 }   // gira su sé stesso
    g.position.x = c.x; g.position.z = c.z; g.rotation.y = c.dir
    c.rialzo = (c.rialzo || 0) + (this.m.quotaPasso(c.x, c.z) - (c.rialzo || 0)) * Math.min(1, dt * 14)     // su un ponte si sale
    if (!c.salto) g.position.y = c.sopra ? c.sopra.y : c.rialzo
    const vmax = c.tipo === 'cane' ? VEL.cane.corsa : c.tipo === 'gatto' ? VEL.gatto.fugge : VEL[c.tipo].vaga
    const pose = { stato: c.stato, vel: c.velo / vmax, fase: c.fase, t: this.t, p: Math.min(1, c.tStato / (c.dur || 1)), sub: c.sub }
    if (c.velo > 0) pose.stato = 'vaga'
    if (this.camera) {                                           // il dettaglio dalla distanza (con isteresi: niente andirivieni sulla soglia)
      const d = this.camera.position.distanceTo(g.position)
      impostaDettaglio(g, d > (g.userData.dettaglioBasso ? LOD_METRI - 1.5 : LOD_METRI))
    }
    const posa = { ...pose, vel: c.velo > 0 ? Math.max(0.3, pose.vel) : 0 }
    if (c.tipo === 'cane') (c.def.variante === 'beagle' ? posaBeagle : posaCane)(g, posa)
    else if (c.tipo === 'gatto') posaGatto(g, posa)
    else posaPiccolo(g, posa)
  }

  _stato(c, stato) { c.stato = stato; c.tStato = 0; c.dur = durataDi(stato, this.rnd) }

  _interrotto(c) {
    if (c.def.daCurare) return false
    const e = this.eroe, d = Math.hypot(e.x - c.x, e.z - c.z)
    if (c.tipo === 'cane') {
      if (c.stato === 'festa' || c.tStato < 0.6) return false
      return (d > 7 || ((!e.fermo || e.az) && d > 3.2)) && c.stato !== 'segue'
    }
    const cane = this.lista.find(o => o.tipo === 'cane' && !o.def.daCurare)
    return !!cane && !c.sopra && c.stato !== 'fugge' && !cane.seq && cane.stato !== 'dorme' && this.t >= c.prossimoIncontro && Math.hypot(cane.x - c.x, cane.z - c.z) < DIST_INCONTRO
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
    c.velo = passo / dt; c.fase += dt * c.velo * FASE_PER_METRO[c.tipo]
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
    return !!cosa && cosa.tipo === p.tipo && cosa.i === p.i && cosa.j === p.j
  }
  _scendi(c) {
    const v = cellaLiberaVicina((a, b) => this.m.libera(a, b), c.x, c.z)
    c.sopra = null
    if (v) this._salta(c, v[0] + 0.5, v[1] + 0.5, 0, 0.45)
    c.poi = null; this._stato(c, 'sta')
  }

  // ── cosa fare adesso ──
  /** Da dove stare lontani scegliendo una meta: gli altri compagni dove sono e, se camminano, dove stanno andando (se no due arrivano nella stessa cella). */
  _altri(c) {
    return this.lista.filter(o => o !== c).flatMap(o => {
      const fine = o.percorso && o.percorso.length ? o.percorso[o.percorso.length - 1] : null
      return fine ? [[o.x, o.z, 1.3], [fine[0], fine[1], 1.3]] : [[o.x, o.z, 1.3]]
    })
  }
  _vai(c, meta, stato, { poi = null, corsa = false, guarda = null } = {}) {
    if (!meta) { this._stato(c, 'sta'); return false }
    const via = this.m.percorsoVerso(cellaDi(c.x, c.z), [meta])
    if (!via) { this._stato(c, 'sta'); return false }
    c.percorso = via.map(([i, j]) => [i + 0.5, j + 0.5]); c.corsa = corsa; c.poi = poi || { stato: 'sta' }; c.guarda = guarda
    c.stato = stato; c.tStato = 0; c.dur = 999
    if (!c.percorso.length) this._arrivato(c)
    return true
  }
  _arrivato(c) {
    const poi = c.poi; c.percorso = []; c.corsa = false; c.velo = 0
    if (poi?.riprendi) { c.poi = null; c.iSeq++; return this._iniziaPasso(c) }                 // una camminata di sequenza: si passa al passo dopo
    if (poi?.posto) {                                            // sale sul posto (o si corica accanto), se c'è ancora e nessun altro l'ha preso
      const p = poi.posto, cosa = this.m.cosa(p.id), def = POSTI[p.tipo]
      if (cosa && cosa.tipo === p.tipo && cosa.i === p.i && cosa.j === p.j && postoLibero(this.lista, p.id, c)) {
        c.sopra = { id: p.id, tipo: p.tipo, i: p.i, j: p.j, y: def.quota }; c.guarda = null
        if (def.accanto) { c.dir = def.dir; c.poi = null; this._stato(c, 'dorme'); return }
        this._salta(c, p.x, p.z, def.quota); c.stato = 'salta'; c.poi = { stato: 'dorme' }; c.dir = def.dir; c.tStato = 0; c.dur = 999
        return
      }
    }
    c.poi = null; this._stato(c, poi?.stato || 'sta')
  }

  /** Va a un posto libero fra quelli della sua specie: la prenotazione è il `poi.posto` (nessun altro lo sceglie finché lo tiene). */
  _vaiAlPosto(c, evita) {
    const b = scegliPosto(this.lista, this.m.cose, c, this.rnd)
    if (!b) return false
    const dim = this.m.misureCosa(b), def = POSTI[b.tipo]                       // girata o no
    const centro = [b.i + dim.w / 2, b.j + dim.d / 2]
    const meta = scegliMeta({ libera: (i, j) => this.m.libera(i, j), centro, rMin: def.accanto ? 1 : 1.2, rMax: def.accanto ? 1.8 : 2.2, rnd: this.rnd, evita })
    if (!meta) return false
    return this._vai(c, meta, 'vaga', { poi: { stato: 'dorme', posto: { id: b.id, tipo: b.tipo, i: b.i, j: b.j, x: centro[0], z: centro[1] + 0.05 } } })
  }

  _decidi(c) {
    const m = this.m, e = this.eroe, libera = (i, j) => m.libera(i, j)
    c.guarda = null; c.seq = null; c.sub = ''
    if (c.sopra) return this._scendi(c)                          // se stava su una panchina, dopo il sonno scende
    if (c.def.daCurare) {                                        // una bestia di casa sta vicino a casa sua: due passi, poi si siede, annusa, dorme (il gatto si lava)
      const d = decidiPiccolo({}, this.rnd), casa = this._casa(c)
      if (d.vai === 'attorno') return this._vai(c, scegliMeta({ libera, centro: casa, rMin: 1, rMax: 3.5, rnd: this.rnd, evita: this._altri(c) }), 'vaga', { poi: { stato: 'sta' } })
      return this._stato(c, c.tipo === 'gatto' && d.stato === 'annusa' ? 'lava' : d.stato)
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
      if (d.stato === 'dorme' && this._vaiAlPosto(c, this._altri(c))) return true            // a nanna nella cuccia, se c'è e nessuno ci sta
      return this._stato(c, d.stato)
    }
    // il gatto
    const cane = this.lista.find(o => o.tipo === 'cane' && !o.def.daCurare)
    if (cane && !cane.seq && cane.stato !== 'dorme' && !cane.salto) {              // vicino a Watson: di solito lo saluta, ogni tanto (poco) scappa
      const r = incontroGattoCane({ dist: Math.hypot(cane.x - c.x, cane.z - c.z), ora: this.t, prossimo: c.prossimoIncontro }, this.rnd)
      c.prossimoIncontro = r.prossimo
      if (r.esito === 'fuga') return this._vai(c, scegliMeta({ libera, centro: [c.x, c.z], rMin: 2, rMax: 3.5, rnd: this.rnd, evita: [[cane.x, cane.z, 2], ...this._altri(c)] }), 'fugge', { poi: { stato: 'siede' }, guarda: [cane.x, cane.z] })
      if (r.esito) return this._incontra(c, cane, r.esito)
    }
    const d = decidiGatto({ dormePosto: postiLiberi(this.lista, m.cose, c).length > 0 }, this.rnd)
    const evita = cane ? [[cane.x, cane.z, 1.8], ...this._altri(c)] : this._altri(c)
    if (d.vai === 'attorno') return this._vai(c, scegliMeta({ libera, centro: [c.x, c.z], rMin: 2, rMax: 5, rnd: this.rnd, evita }), 'vaga', { poi: { stato: 'sta' } })
    if (d.vai === 'posto') {
      return this._vaiAlPosto(c, evita) || this._stato(c, 'dorme')
    }
    return this._stato(c, d.stato)
  }

  via() {
    for (const c of this.lista) this.scena.remove(c.grp)
    this.lista = []
  }
}
