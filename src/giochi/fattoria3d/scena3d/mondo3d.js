// Il mondo 3D: mette insieme il terreno, i pezzi, l'eroe, la telecamera, gli effetti e il dito, e li fa girare. È l'unico file che
// sa di three come renderer. Le regole le dice il motore (`motore`), le finestre le apre la vista (`ui`): qui si disegna, si
// raggiunge una cosa e si fa il suo gesto. Vedi docs/fattoria3d/scena.md.
//
// `ui` (le porte verso Gioco.vue): cambio(), chiedi(titolo, testo, bottoni), scegliSeme(cb), apriMacchina(tipo),
//   avviso(testo), chiudiCostruzione(), fogliAperti(), zonaDrop() → DOMRect|null, trascinando(info|null).
import * as THREE from 'three'
import { Terreno } from './terreno.js'
import { Pezzi } from './pezzi.js'
import { Eroe } from './eroe.js'
import { Compagni } from './compagni.js'
import { Effetti } from './effetti.js'
import { Camera } from './camera.js'
import { Azioni } from './azioni.js'
import { Costruzione } from './costruzione.js'
import { Dito } from './dito.js'
import { ASPETTO, fantasma } from './modelli.js'
import { PEZZI, EDIFICI } from '../dati/catalogo.js'
import { LOTTI, lottoDi } from '../dati/mondo.js'

const CIELO = new THREE.Color(0xbfe0f0)

export class Mondo3d {
  constructor({ canvas, sopra, motore, ui, qualita }) {
    this.canvas = canvas; this.sopra = sopra; this.m = motore; this.ui = ui; this.q = qualita
    // cosa sta facendo il bambino: lo imposta la vista (barra delle azioni, vassoio)
    this.cmd = { modo: 'libero', seme: 'grano', costruendo: false, strumento: null, vista: 'vicino', pan: { x: 0, z: 0 } }
    this.rect = canvas.getBoundingClientRect()

    this.renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: 'high-performance' })
    this.renderer.shadowMap.enabled = true; this.renderer.shadowMap.type = THREE.PCFShadowMap
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping; this.renderer.toneMappingExposure = 1.05
    this.scena = new THREE.Scene()
    this.scena.background = CIELO; this.scena.fog = new THREE.Fog(CIELO, 38, 90)
    this.scena.add(new THREE.HemisphereLight(0xdff1ff, 0x7a9a5a, 1.05))
    this.sole = new THREE.DirectionalLight(0xfff0d0, 2.3)
    this.sole.castShadow = true; this.sole.shadow.mapSize.set(1024, 1024)
    Object.assign(this.sole.shadow.camera, { left: -14, right: 14, top: 14, bottom: -14, near: 1, far: 60 })
    this.sole.shadow.bias = -0.0004; this.sole.shadow.normalBias = 0.03
    this.scena.add(this.sole, this.sole.target)
    this.camera = new Camera(this.sole)

    this.vista = { proietta: (p, extra) => this.proietta(p, extra) }
    this.fx = new Effetti(this.scena, sopra, this.vista, qualita)
    this.terreno = new Terreno(this.scena, motore)
    this.pezzi = this.creaPezzi()
    this.eroe = new Eroe(this.scena, motore, this.fx)
    this.eroe.alVia = () => this.camera.segui()
    this.compagni = new Compagni(this.scena, motore, this.eroe, this.fx, ui)

    this.ctx = {
      m: motore, ui, fx: this.fx, scena: this.scena, terreno: this.terreno, pezzi: this.pezzi, eroe: this.eroe, cmd: this.cmd,
      puntaSuolo: (x, y) => this.puntaSuolo(x, y),
      misure: tipo => PEZZI[tipo] || EDIFICI[tipo],
      colore: k => ASPETTO[k].fc,
      cambiato: () => this.cambiato(),
      creaFantasma: (tipo, c) => { const g = this.pezzi.modello(tipo, c); fantasma(g); return g },
    }
    this.azioni = new Azioni(this.ctx)
    this.costruzione = new Costruzione(this.ctx)
    this.pezzi.sulCompraBestia = id => this.azioni.compraBestia(id)
    this.dito = new Dito(this)
    this.coda = []                 // gli id dei campi che l'eroe farà uno dopo l'altro (semina o raccogli armati)
    this.badgeLotti = {}

    this.stat = { dts: new Float32Array(120), cpus: new Float32Array(120), n: 0, info: { calls: 0, triangoli: 0, geometrie: 0, texture: 0, dpr: 1 }, fps: 0, nF: 0, tF: 0 }
    this.t0 = performance.now(); this.tPrima = this.t0; this.giroId = 0; this.vivo = false
    this.ro = typeof ResizeObserver === 'function' ? new ResizeObserver(() => this.adatta()) : null
    this.ro?.observe(canvas)
    this.applica(qualita)
    this.adatta()
  }

  /** Il gruppo dei pezzi in scena: una visita ne usa uno suo (scena3d/visita.js). */
  creaPezzi() { return new Pezzi(this.scena, this.m, this.fx, this.vista, this.q) }

  // ── la misura e la proiezione ──
  adatta() {
    this.rect = this.canvas.getBoundingClientRect()
    const l = Math.max(1, Math.round(this.rect.width)), a = Math.max(1, Math.round(this.rect.height))
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, this.q.scala))
    this.renderer.setSize(l, a, false)
    this.camera.adatta(l, a)
  }
  /** Dove cade sullo schermo (px della tela) un punto del mondo, alzato di `extra`. */
  proietta(p, extra = 0) {
    const v = new THREE.Vector3(p.x, p.y + extra, p.z).project(this.camera.cam)
    return [(v.x * 0.5 + 0.5) * this.rect.width, (-v.y * 0.5 + 0.5) * this.rect.height, v.z < 1]
  }
  _raggio(cx, cy) {
    const r = this.canvas.getBoundingClientRect()
    const ndc = new THREE.Vector2((cx - r.left) / r.width * 2 - 1, -((cy - r.top) / r.height) * 2 + 1)
    const rg = new THREE.Raycaster(); rg.setFromCamera(ndc, this.camera.cam)
    return rg
  }
  /** Il punto del suolo sotto il dito (coordinate della pagina). */
  puntaSuolo(cx, cy) {
    const p = new THREE.Vector3()
    return this._raggio(cx, cy).ray.intersectPlane(new THREE.Plane(new THREE.Vector3(0, 1, 0), 0), p) ? p : null
  }

  // ── cosa c'è sotto il dito ──
  /** { kind: 'cosa', id } | { kind: 'edificio', tipo } | { kind: 'albero', n } | { kind: 'ostacolo', n } | null */
  bersaglioSotto(cx, cy) {
    const rg = this._raggio(cx, cy)
    const hit = rg.intersectObjects(this.pezzi.gruppi(), true)[0]
    let o = hit && hit.object
    while (o && !o.userData.bersaglio) o = o.parent
    if (o) return o.userData.bersaglio
    const a = rg.intersectObjects(this.terreno.istanzeAlberi, false)
      .map(h => this.m.alberi[h.instanceId]).find(x => x && x.tagliabile && !x.tagliato)
    if (a) return { kind: 'albero', n: a.n }
    const sx = rg.intersectObjects(this.terreno.istanzeOstacoli, false)
      .map(h => this.m.ostacoli[this.terreno.ostacoloDi(h.object, h.instanceId)]).find(x => x && !x.tolto)
    if (sx) return { kind: 'ostacolo', n: sx.n }
    const p = this.puntaSuolo(cx, cy); if (!p) return null
    const i = Math.floor(p.x), j = Math.floor(p.z), c = this.m.cosaSu(i, j)
    if (c) return { kind: 'cosa', id: c.id }
    const sasso = this.m.ostacoloSu(i, j)                                  // il dito è largo: la cella basta
    if (sasso) return { kind: 'ostacolo', n: sasso.n }
    for (const [tipo, e] of Object.entries(EDIFICI)) if (i >= e.slot.i && i < e.slot.i + e.w && j >= e.slot.j && j < e.slot.j + e.d) return { kind: 'edificio', tipo }
    return null
  }
  /** Un lotto non tuo sotto il dito, se c'è. */
  lottoSotto(cx, cy) {
    const p = this.puntaSuolo(cx, cy); if (!p) return null
    const l = lottoDi(Math.floor(p.x), Math.floor(p.z))
    return l && !this.m.posseduto(l) ? l : null
  }
  /** Le celle da cui si può servire una cosa: il davanti per gli edifici, tutta la cornice per il resto. */
  celleDiServizio(b) {
    let i, j, w, d, davanti = false
    if (b.kind === 'cosa') { const c = this.m.cosa(b.id), x = PEZZI[c.tipo]; i = c.i; j = c.j; w = x.w; d = x.d }
    else if (b.kind === 'edificio') { const e = EDIFICI[b.tipo]; i = e.slot.i; j = e.slot.j; w = e.w; d = e.d; davanti = true }
    else { const a = b.kind === 'ostacolo' ? this.m.ostacoli[b.n] : this.m.alberi[b.n]; i = a.i; j = a.j; w = 1; d = 1 }
    const out = []
    if (davanti) for (let a = 0; a < w; a++) out.push([i + a, j + d])
    else {
      for (let a = 0; a < w; a++) out.push([i + a, j - 1], [i + a, j + d])
      for (let b2 = 0; b2 < d; b2++) out.push([i - 1, j + b2], [i + w, j + b2])
    }
    return out.filter(([x, y]) => this.m.libera(x, y))
  }
  centroDi(b) {
    if (b.kind === 'albero' || b.kind === 'ostacolo') { const a = b.kind === 'albero' ? this.m.alberi[b.n] : this.m.ostacoli[b.n]; return new THREE.Vector3(a.i + 0.5, 0, a.j + 0.5) }
    return this.pezzi.centroDi(b)
  }

  // ── toccare ──
  tocca(x, y) {
    const { cmd, ui, m, eroe } = this
    if (ui.fogliAperti()) return
    if (cmd.costruendo) return this._toccaCostruzione(x, y)
    const amico = this.compagni.bersaglio(this._raggio(x, y))           // Watson e i gatti si accarezzano prima di tutto
    if (amico) return this.compagni.tocca(amico)
    const b = this.bersaglioSotto(x, y)
    const campo = b && b.kind === 'cosa' && m.cosa(b.id) && m.cosa(b.id).tipo === 'campo' ? m.cosa(b.id) : null
    if (campo && cmd.modo !== 'libero') {                      // semina e raccogli: si toccano più campi, l'eroe li fa in fila
      if (!this.applicabile(campo)) return this.fx.parla(cmd.modo === 'semina' ? 'Qui è già seminato' : 'Non è ancora pronto')
      return this._accoda(campo.id)
    }
    if (eroe.az) return
    this.svuotaCoda()
    if (b && b.kind === 'albero') {
      const a = m.alberi[b.n], l = lottoDi(a.i, a.j)
      if (l && !m.posseduto(l)) return this.azioni.offriLotto(l)               // ciò che sta in un terreno non tuo si compra
      return eroe.vaiA(this.celleDiServizio(b), () => this.azioni.abbatti(a), this.centroDi(b))
    }
    if (b && b.kind === 'ostacolo') {
      const o = m.ostacoli[b.n], l = lottoDi(o.i, o.j)
      if (l && !m.posseduto(l)) return this.azioni.offriLotto(l)
      return eroe.vaiA(this.celleDiServizio(b), () => this.azioni.togli(o), this.centroDi(b))
    }
    if (b && b.kind === 'edificio' && this._edificioDaLontano(b.tipo)) return this.azioni.offriEdificio(b.tipo)   // dice livello o terreno, senza camminare
    if (b) return eroe.vaiA(this.celleDiServizio(b), () => this.azioni.fai(b), this.centroDi(b))
    const l = this.lottoSotto(x, y); if (l) return this.azioni.offriLotto(l)
    const p = this.puntaSuolo(x, y); if (!p) return
    const i = Math.floor(p.x), j = Math.floor(p.z), cand = []
    for (let a = -2; a <= 2; a++) for (let b2 = -2; b2 <= 2; b2++) if (m.libera(i + a, j + b2)) cand.push([i + a, j + b2, Math.hypot(a, b2)])
    cand.sort((u, v) => u[2] - v[2])
    if (cand.length) eroe.vaiA([[cand[0][0], cand[0][1]]], null, null)
  }
  /** Un edificio che non è ancora tuo e che non si può comprare adesso (livello o terreno che mancano): l'eroe non ci cammina, sta fuori dal suo terreno. */
  _edificioDaLontano(tipo) {
    return !this.m.s.posseduti[tipo] && (EDIFICI[tipo].liv > this.m.livello() || this.m.lottiMancanti(tipo).length > 0)
  }
  _toccaCostruzione(x, y) {
    const b = this.bersaglioSotto(x, y)
    if (b && b.kind === 'edificio') return this.azioni.fai(b)                 // un edificio unico: si compra anche da qui
    if (b && b.kind === 'ostacolo') { const o = this.m.ostacoli[b.n], l = lottoDi(o.i, o.j); if (l && !this.m.posseduto(l)) this.azioni.offriLotto(l); return this.ui.chiudiCostruzione() }
    if (!b) { const l = this.lottoSotto(x, y); if (l) return this.azioni.offriLotto(l) }
    this.ui.chiudiCostruzione()                                               // un tocco vero sulla mappa (non una strisciata: `dito.js` lo distingue) chiude il vassoio
  }

  // ── semina e raccogli armati: la coda ──
  applicabile(c) { return c.tipo === 'campo' && (this.cmd.modo === 'semina' ? this.m.campoVuoto(c) : this.cmd.modo === 'raccogli' ? this.m.campoMaturo(c) : false) }
  _accoda(id) { if (!this.coda.includes(id)) { this.coda.push(id); this.pezzi.segnaCoda(id, true) } }
  svuotaCoda() { for (const id of this.coda) this.pezzi.segnaCoda(id, false); this.coda.length = 0 }
  /** Mette in coda tutti i campi adatti, dal più vicino. Torna quanti. */
  tutti() {
    const { eroe, m } = this
    const lista = m.cose.filter(c => this.applicabile(c)).sort((a, b) => Math.hypot(a.i - eroe.x, a.j - eroe.z) - Math.hypot(b.i - eroe.x, b.j - eroe.z))
    lista.forEach(c => this._accoda(c.id))
    return lista.length
  }
  _eseguiInCoda(id) {
    const c = this.m.cosa(id); const { eroe } = this
    if (!c || eroe.az || !this.applicabile(c)) return
    eroe.faccia(this.pezzi.centroDi({ kind: 'cosa', id }))
    if (this.cmd.modo === 'semina') this.azioni.semina(c, this.cmd.seme)
    else this.azioni.falcia(c)
  }

  /** Dopo che il motore ha cambiato qualcosa che si vede: i gruppi, il terreno, i cartelli. */
  cambiato() { this.pezzi.sincronizza(); this.terreno.ridisegnaStrade(); this.ui.cambio() }

  // ── cosa sta facendo il bambino: la vista lo dice, qui si applica ──
  imposta(nuovo) {
    const c = this.cmd, costruiva = c.costruendo
    Object.assign(c, nuovo)
    if (nuovo.modo) this.svuotaCoda()
    if (c.costruendo && !costruiva) { this.svuotaCoda(); this.camera.zoom = 1; c.pan = { x: 0, z: 0 }; this.terreno.mostraGriglia(true) }
    if (!c.costruendo && costruiva) { this.costruzione.annullaTrascinamento(); this.camera.zoom = 1; this.terreno.mostraGriglia(false) }
  }
  rettangoloVista() {
    if (this.cmd.vista === 'tutto') {
      const mie = this.m.lottiMiei()
      const i = Math.min(...mie.map(l => l.i)), j = Math.min(...mie.map(l => l.j))
      return { i, j, w: Math.max(...mie.map(l => l.i + l.w)) - i, d: Math.max(...mie.map(l => l.j + l.d)) - j }
    }
    return { i: this.eroe.x - 5, j: this.eroe.z - 6, w: 10, d: 12 }          // «vicino»: attorno all'eroe
  }
  get cameraLibera() { return this.camera.libera.on }

  // ── il battito ──
  avvia() {
    if (this.vivo) return
    this.vivo = true; this.tPrima = performance.now()
    const giro = ts => { if (!this.vivo) return; this.giroId = requestAnimationFrame(giro); this._fotogramma(ts) }
    this.giroId = requestAnimationFrame(giro)
  }
  ferma() { this.vivo = false; cancelAnimationFrame(this.giroId) }

  _fotogramma(ts) {
    const inizio = performance.now(), dtReale = ts - this.tPrima
    const dt = Math.min(0.05, dtReale / 1000); this.tPrima = ts
    const tt = (ts - this.t0) / 1000
    const { m, eroe, ui } = this
    if (m.tick()) ui.cambio()
    eroe.aggiorna(dt, tt)
    this.compagni.aggiorna(dt, tt)
    if (this.coda.length && eroe.fermo && !eroe.dopo && !ui.fogliAperti()) {          // il prossimo della coda
      const id = this.coda.shift(); this.pezzi.segnaCoda(id, false)
      const c = m.cosa(id)
      if (c && this.applicabile(c)) eroe.vaiA(this.celleDiServizio({ kind: 'cosa', id }), () => this._eseguiInCoda(id), this.pezzi.centroDi({ kind: 'cosa', id }))
    }
    this.pezzi.aggiorna(dt, tt)
    this.terreno.muovi(dt)
    this.fx.aggiorna(dt, eroe.posizione)
    this._badgeLotti()
    this.camera.muovi(dt, {
      eroe: { x: eroe.x, z: eroe.z, vel: eroe.vel }, distanza: this.q.camera,
      costruzione: this.cmd.costruendo ? { pan: this.cmd.pan, rettangolo: this.rettangoloVista() } : null,
    })
    this.renderer.render(this.scena, this.camera.cam)
    this._misura(dtReale, performance.now() - inizio, ts)
  }

  /** I cartelli del prezzo dei soli lotti che confinano coi tuoi, vicini all'eroe (o tutti, in costruzione). */
  _badgeLotti() {
    const m = this.m, e = this.eroe
    for (const l of LOTTI) {
      const mostra = !m.posseduto(l) && m.confina(l) && (this.cmd.costruendo || Math.hypot(l.i + 2 - e.x, l.j + 2 - e.z) < 8)
      let b = this.badgeLotti[l.id]
      if (!mostra) { if (b) b.el.hidden = true; continue }
      b = this.badgeLotti[l.id] || (this.badgeLotti[l.id] = this.fx.nuovoBadge())
      b.imposta(`🪙 ${m.prezzoLotto()}`, 'vendita')
      const [x, y, visto] = this.proietta(new THREE.Vector3(l.i + 2, 0, l.j + 2), 0.6)
      b.metti(x, y, visto && x > 20 && x < this.rect.width - 20 && y > 20 && y < this.rect.height - 100, true)
    }
  }

  _misura(dtReale, cpu, ts) {
    const s = this.stat, i = s.n % 120
    s.dts[i] = dtReale; s.cpus[i] = cpu; s.n++; s.nF++
    if (ts - s.tF > 500) {
      s.fps = s.nF * 1000 / (ts - s.tF); s.nF = 0; s.tF = ts
      const r = this.renderer.info
      s.info = { calls: r.render.calls, triangoli: r.render.triangles, geometrie: r.memory.geometries, texture: r.memory.textures, dpr: this.renderer.getPixelRatio() }
    }
  }
  /** Le statistiche per il pannello delle opzioni: fps, il fotogramma peggiore, il lavoro del JS, e cosa si disegna. */
  statistiche() {
    const s = this.stat, k = Math.min(s.n, 120)
    const dts = [...s.dts.slice(0, k)].sort((a, b) => b - a)
    const cpu = k ? [...s.cpus.slice(0, k)].reduce((a, b) => a + b, 0) / k : 0
    return { fps: s.fps, peggiore: dts[0] || 0, p1: dts[Math.floor(dts.length * 0.01)] || 0, cpu, ...s.info,
             grafico: Array.from({ length: 120 }, (_, n) => s.dts[(s.n + n) % 120]), cose: this.m.cose.length, prove: this.m.prove.length }
  }
  gpu() {
    try {
      const gl = this.renderer.getContext(), e = gl.getExtension('WEBGL_debug_renderer_info')
      return e ? gl.getParameter(e.UNMASKED_RENDERER_WEBGL) : 'non dichiarata'
    } catch (x) { return '?' }
  }

  // ── le opzioni di qualità ──
  applica(q) {
    this.q = q
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, q.scala)); this.adattaSenzaRect()
    this.sole.castShadow = q.ombre
    if (this.sole.shadow.mapSize.x !== q.ombraRes) {
      this.sole.shadow.mapSize.set(q.ombraRes, q.ombraRes)
      if (this.sole.shadow.map) { this.sole.shadow.map.dispose(); this.sole.shadow.map = null }
    }
    this.terreno.applica(q)
    this.scena.fog.near = q.nebbia ? 38 : 1e6; this.scena.fog.far = q.nebbia ? 90 : 2e6
    this.fx.q = q; this.pezzi.q = q
  }
  adattaSenzaRect() { if (this.rect) this.renderer.setSize(Math.max(1, Math.round(this.rect.width)), Math.max(1, Math.round(this.rect.height)), false) }
  stress(tipo, n) { if (tipo) this.m.aggiungiProve(tipo, n); else this.m.togliProve(); this.pezzi.sincronizza() }

  // ── il trascinamento dalla barra (la vista passa le coordinate della pagina) ──
  iniziaDaCarta(tipo, x, y) { this.costruzione.inizia(tipo, null, x, y) }
  muoviTrascinamento(x, y) { this.costruzione.muovi(x, y) }
  rilascia(x, y) { this.costruzione.rilascia(x, y) }
  annullaTrascinamento() { this.costruzione.annullaTrascinamento() }
  tornaAllEroe() { this.camera.segui() }

  via() {
    this.ferma(); this.ro?.disconnect(); this.dito.via()
    this.pezzi.via(); this.fx.via(); this.terreno.via(); this.compagni.via()
    try { this.renderer.dispose() } catch (e) { /* già andato */ }
  }
}
