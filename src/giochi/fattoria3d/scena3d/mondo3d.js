// Il mondo 3D: mette insieme il terreno, i pezzi, l'eroe, la telecamera, gli effetti e il dito, e li fa girare. È l'unico file che
// sa di three come renderer. Le regole le dice il motore (`motore`), le finestre le apre la vista (`ui`): qui si disegna, si
// raggiunge una cosa e si fa il suo gesto. Vedi docs/fattoria3d/scena.md.
//
// `ui` (le porte verso Gioco.vue): cambio(), chiedi(titolo, testo, bottoni), scegliSeme(cb), apriMacchina(tipo),
//   avviso(testo), chiudiCostruzione(), fogliAperti(), zonaDrop() → DOMRect|null, trascinando(info|null).
import * as THREE from 'three'
import { Terreno } from './terreno.js'
import { Pezzi } from './pezzi.js'
import { creaAnteprime } from './anteprime.js'
import { creaScaldo } from './scaldo-puro.js'
import { Eroe } from './eroe.js'
import { Compagni } from './compagni.js'
import { Effetti } from './effetti.js'
import { Camera } from './camera.js'
import { Azioni } from './azioni.js'
import { Costruzione } from './costruzione.js'
import { Dito } from './dito.js'
import { ASPETTO, fantasma } from './modelli.js'
import { PEZZI, EDIFICI } from '../dati/catalogo.js'
import { lottoDi } from '../dati/mondo.js'
import { LIVELLI, scalaPer, nuovoDegrado, passoDegrado, descriviDegrado } from '../dati/degrado.js'

const CIELO = new THREE.Color(0xbfe0f0)
const _v = new THREE.Vector3()        // di scorta per `proietta`: niente oggetti nuovi a ogni cartello a ogni fotogramma

export class Mondo3d {
  constructor({ canvas, sopra, motore, ui, qualita }) {
    this.canvas = canvas; this.sopra = sopra; this.m = motore; this.ui = ui; this.q = qualita
    // cosa sta facendo il bambino: lo imposta la vista (barra delle azioni, pennello delle strade)
    this.cmd = { modo: 'libero', seme: 'grano', strumento: null }
    this.rect = canvas.getBoundingClientRect()

    this.renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: 'high-performance' })
    this.renderer.shadowMap.enabled = true; this.renderer.shadowMap.type = THREE.PCFShadowMap
    // l'ombra si ridisegna a comando (`_fotogramma`): a ogni fotogramma di serie, più di rado se la macchina non regge (dati/degrado.js)
    this.renderer.shadowMap.autoUpdate = false
    this.deg = nuovoDegrado(0); this.livello = 0; this.legatoCpu = false; this.nFot = 0; this.ombraSporca = true
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
    this.scaldo = creaScaldo(this.pezzi.compitiScaldo())      // i modelli che servono presto, costruiti in tempo morto (scaldo-puro.js)
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

    this.stat = { dts: new Float32Array(120), cpus: new Float32Array(120), logiche: new Float32Array(120), n: 0, info: { calls: 0, triangoli: 0, geometrie: 0, texture: 0, dpr: 1 }, fps: 0, nF: 0, tF: 0 }
    this.t0 = performance.now(); this.tPrima = this.t0; this.giroId = 0; this.vivo = false
    this.ro = typeof ResizeObserver === 'function' ? new ResizeObserver(() => this.adatta()) : null
    this.ro?.observe(canvas)
    this.applica(qualita)
    this.adatta()
  }

  /** L'anteprima 3D (dataURL PNG) di un pezzo o di un edificio, in cache per tipo; le fa col renderer di questa scena, un tipo per fotogramma. */
  anteprima(tipo) {
    if (!this._anteprime) this._anteprime = creaAnteprime(this.renderer, t => this.pezzi.modelloAnteprima(t))
    return this._anteprime.chiedi(tipo)
  }
  anteprimaPronta(tipo) { return this._anteprime ? this._anteprime.leggi(tipo) : null }

  /** Il gruppo dei pezzi in scena: una visita ne usa uno suo (scena3d/visita.js). */
  creaPezzi() { return new Pezzi(this.scena, this.m, this.fx, this.vista, this.q) }

  // ── la misura e la proiezione ──
  adatta() {
    this.rect = this.canvas.getBoundingClientRect()
    const l = Math.max(1, Math.round(this.rect.width)), a = Math.max(1, Math.round(this.rect.height))
    this.renderer.setPixelRatio(this.scalaViva())
    this.renderer.setSize(l, a, false)
    this.camera.adatta(l, a)
  }
  /** Dove cade sullo schermo (px della tela) un punto del mondo, alzato di `extra`. */
  proietta(p, extra = 0) {
    const v = _v.set(p.x, p.y + extra, p.z).project(this.camera.cam)
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
      .map(h => this.terreno.alberoDi(h.instanceId)).find(x => x && !x.tagliato)
    if (a) return { kind: 'albero', n: a.n }
    const sx = rg.intersectObjects(this.terreno.istanzeOstacoli, false)
      .map(h => this.m.ostacolo(this.terreno.ostacoloDi(h.object, h.instanceId))).find(x => x && !x.tolto)
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
    return !this.m.posseduto(l) && this.m.lottiAperti.has(l.k) ? l : null           // il vuoto lontano (fuori dall'anello di due lotti) non apre niente
  }
  /** Le celle da cui si può servire una cosa: il davanti per gli edifici, tutta la cornice per il resto. */
  celleDiServizio(b) {
    let i, j, w, d, davanti = false
    if (b.kind === 'cosa') {
      const c = this.m.cosa(b.id), x = PEZZI[c.tipo]; i = c.i; j = c.j; w = x.w; d = x.d
      if (x.calpestabile) { const su = []; for (let a = 0; a < w; a++) for (let b2 = 0; b2 < d; b2++) su.push([i + a, j + b2]); return su }   // un ponte si tocca per salirci
    }
    else if (b.kind === 'edificio') { const e = EDIFICI[b.tipo]; i = e.slot.i; j = e.slot.j; w = e.w; d = e.d; davanti = true }
    else { const a = b.kind === 'ostacolo' ? this.m.ostacolo(b.n) : this.m.albero(b.n); i = a.i; j = a.j; w = 1; d = 1 }
    const out = []
    if (davanti) for (let a = 0; a < w; a++) out.push([i + a, j + d])
    else {
      for (let a = 0; a < w; a++) out.push([i + a, j - 1], [i + a, j + d])
      for (let b2 = 0; b2 < d; b2++) out.push([i - 1, j + b2], [i + w, j + b2])
    }
    return out.filter(([x, y]) => this.m.libera(x, y))
  }
  centroDi(b) {
    if (b.kind === 'albero' || b.kind === 'ostacolo') { const a = b.kind === 'albero' ? this.m.albero(b.n) : this.m.ostacolo(b.n); return new THREE.Vector3(a.i + 0.5, 0, a.j + 0.5) }
    return this.pezzi.centroDi(b)
  }

  // ── toccare ──
  tocca(x, y) {
    const { cmd, ui, m, eroe } = this
    if (ui.fogliAperti()) return
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
      const a = m.albero(b.n), l = lottoDi(a.i, a.j)
      if (!m.posseduto(l)) return this.azioni.offriLotto(l)               // ciò che sta in un terreno non tuo si compra
      return eroe.vaiA(this.celleDiServizio(b), () => this.azioni.abbatti(a), this.centroDi(b))
    }
    if (b && b.kind === 'ostacolo') {
      const o = m.ostacolo(b.n), l = lottoDi(o.i, o.j)
      if (!m.posseduto(l)) return this.azioni.offriLotto(l)
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
  // ── semina e raccogli armati: la coda ──
  applicabile(c) { return c.tipo === 'campo' && (this.cmd.modo === 'semina' ? this.m.campoVuoto(c) : this.cmd.modo === 'raccogli' ? this.m.campoMaturo(c) : false) }
  _accoda(id) { if (!this.coda.includes(id)) { this.coda.push(id); this.pezzi.segnaCoda(id, true) } }
  svuotaCoda() { for (const id of this.coda) this.pezzi.segnaCoda(id, false); this.coda.length = 0 }
  _eseguiInCoda(id) {
    const c = this.m.cosa(id); const { eroe } = this
    if (!c || eroe.az || !this.applicabile(c)) return
    eroe.faccia(this.pezzi.centroDi({ kind: 'cosa', id }))
    if (this.cmd.modo === 'semina') this.azioni.semina(c, this.cmd.seme)
    else this.azioni.falcia(c)
  }

  /** Dopo che il motore ha cambiato qualcosa che si vede: i gruppi, il terreno, i cartelli. */
  cambiato() { this.pezzi.sincronizza(); this.terreno.ridisegnaStrade(); this.ombraSporca = true; this.ui.cambio() }

  // ── cosa sta facendo il bambino: la vista lo dice, qui si applica ──
  imposta(nuovo) {
    const c = this.cmd
    Object.assign(c, nuovo)
    if (nuovo.modo) { this.svuotaCoda(); this.costruzione.annullaTrascinamento() }
    if ('strumento' in nuovo) {                                 // il pennello delle strade: la griglia c'è finché si disegna
      if (c.strumento) { this.svuotaCoda(); this.costruzione.annullaTrascinamento() }
      this.terreno.mostraGriglia(!!c.strumento || this.costruzione.attivo)
    }
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
    this.terreno.muovi(dt, this.fx)
    this.fx.aggiorna(dt, eroe.posizione)
    this._badgeLotti()
    this.camera.muovi(dt, {
      eroe: { x: eroe.x, z: eroe.z, vel: eroe.vel }, distanza: this.q.camera,
    })
    this.terreno.segui(this.camera.x, this.camera.z)              // il suolo segue la camera; se cambia il lotto al mezzo si rifà la finestra
    const fineLogica = performance.now()
    // l'ombra: subito se qualcosa è cambiato, altrimenti ogni `ombraOgni` fotogrammi (1 = sempre)
    this.renderer.shadowMap.needsUpdate = this.q.ombre && (this.ombraSporca || this.nFot++ % LIVELLI[this.livello].ombraOgni === 0)
    this.ombraSporca = false
    this.renderer.render(this.scena, this.camera.cam)
    this._misura(dtReale, performance.now() - inizio, ts, fineLogica - inizio)
    this._scalda(dtReale)
  }

  /** Un compito del riscaldamento, a fine fotogramma e solo dopo il primo secondo: non prima, non con la macchina in affanno (il degrado
      scende di livello) né con la pagina nascosta. Se la macchina è lenta si rinuncia a ciò che resta: lo si pagherà alla prima richiesta. */
  _scalda(dtReale) {
    const sc = this.scaldo; if (!sc || !sc.restanti) return
    if (this.livello > 0 || (this.stat.fps > 0 && this.stat.fps < 24)) { sc.abbandona(); return }
    if (this.stat.n < 60) return
    sc.passo({ dtMs: dtReale, fps: this.stat.fps, attivo: typeof document === 'undefined' || document.visibilityState !== 'hidden' })
  }

  /** I cartelli del prezzo dei soli lotti che confinano coi tuoi, vicini all'eroe (o tutti quelli della finestra, in costruzione). Un laghetto lo dice. */
  _badgeLotti() {
    const m = this.m, e = this.eroe, tutti = this.cmd.strumento || this.costruzione.attivo
    const mostrati = new Set()
    for (const l of m.lottiComprabili()) {
      if (!(tutti ? this.terreno.dentroFinestra(l.i, l.j) : Math.hypot(l.i + 2 - e.x, l.j + 2 - e.z) < 8)) continue
      const b = this.badgeLotti[l.id] || (this.badgeLotti[l.id] = this.fx.nuovoBadge())
      b.imposta(`🪙 ${m.prezzoLotto()}${m.biomaDi(l) === 'laghetto' ? ' · 🏞️ laghetto' : ''}`, 'vendita')
      const [x, y, visto] = this.proietta(new THREE.Vector3(l.i + 2, 0, l.j + 2), 0.6)
      b.metti(x, y, visto && x > 20 && x < this.rect.width - 20 && y > 20 && y < this.rect.height - 100, true)
      mostrati.add(l.id)
    }
    for (const [id, b] of Object.entries(this.badgeLotti)) if (!mostrati.has(id)) b.el.hidden = true
  }

  _misura(dtReale, cpu, ts, logica = 0) {
    const s = this.stat, i = s.n % 120
    s.dts[i] = dtReale; s.cpus[i] = cpu; s.logiche[i] = logica; s.n++; s.nF++
    if (ts - s.tF > 500) {
      s.fps = s.nF * 1000 / (ts - s.tF); s.nF = 0; s.tF = ts
      const r = this.renderer.info
      s.info = { calls: r.render.calls, triangoli: r.render.triangles, geometrie: r.memory.geometries, texture: r.memory.textures, dpr: this.renderer.getPixelRatio(), programmi: r.programs ? r.programs.length : 0 }
      this._degrada(ts / 1000, s.fps)
    }
  }
  /** Il degrado adattivo (dati/degrado.js): una lettura di fps ogni mezzo secondo. Cambia il pixel ratio e la cadenza dell'ombra, mai le scelte salvate. */
  _degrada(t, fps) {
    const attivo = typeof document === 'undefined' || document.visibilityState !== 'hidden'
    const r = passoDegrado(this.deg, { t, fps, attivo })
    this.deg = r.stato
    if (r.cambio) {
      this.livello = this.deg.livello
      // se il JS riempie il fotogramma la strozzatura è la CPU (draw call): togliere pixel non serve, restano solo le ombre più rade
      const s = this.stat, k = Math.min(s.n, 120), somma = a => { let x = 0; for (let n = 0; n < k; n++) x += a[n]; return x }
      this.legatoCpu = k > 20 && somma(s.cpus) > 0.8 * somma(s.dts)
      this.renderer.setPixelRatio(this.scalaViva()); this.adattaSenzaRect()
      this.ombraSporca = true
      this.stat.info.dpr = this.renderer.getPixelRatio()
    }
  }
  /** Il pixel ratio in uso: la scelta (o lo schermo) meno i gradini del degrado. `q.scala` non cambia. */
  scalaViva() { return scalaPer(window.devicePixelRatio || 1, this.q.scala, this.legatoCpu ? 0 : this.livello) }
  /** Le statistiche per il pannello delle opzioni: fps, il fotogramma peggiore, il lavoro del JS, e cosa si disegna. */
  statistiche() {
    const s = this.stat, k = Math.min(s.n, 120)
    const dts = [...s.dts.slice(0, k)].sort((a, b) => b - a)
    const media = a => k ? [...a.slice(0, k)].reduce((x, y) => x + y, 0) / k : 0
    const cpu = media(s.cpus), logica = media(s.logiche), dtMedio = media(s.dts)
    return { fps: s.fps, peggiore: dts[0] || 0, p1: dts[Math.floor(dts.length * 0.01)] || 0, cpu, ...s.info,
             // il JS della scena, diviso: la logica (eroe, pezzi, effetti, cartelli) e il disegno (three e le chiamate a WebGL); `fuori` è il resto
             // del fotogramma (la GPU che finisce, la pagina, Vue): se il JS è poco e `fuori` è tanto, la strozzatura non è il JS
             logica, disegno: Math.max(0, cpu - logica), fuori: Math.max(0, dtMedio - cpu),
             grafico: Array.from({ length: 120 }, (_, n) => s.dts[(s.n + n) % 120]), cose: this.m.cose.length, prove: this.m.prove.length,
             livello: this.livello, scalaViva: this.renderer.getPixelRatio(), ombraOgni: LIVELLI[this.livello].ombraOgni, degrado: descriviDegrado(this.livello) }
  }
  /** Quante cose di ogni tipo ci sono in scena (per il rapporto): campi, edifici comprati, altri pezzi, compagni, cartelli, mesh e chi proietta ombra. */
  conteggi() {
    let campi = 0, edifici = 0, altri = 0
    for (const v of this.pezzi.voci.values()) { if (v.kind === 'edificio') { if (v.mio) edifici++ } else if (v.c.tipo === 'campo') campi++; else altri++ }
    let mesh = 0, ombre = 0, istanze = 0
    this.scena.traverse(o => { if (o.isMesh) { mesh++; if (o.castShadow) ombre++; if (o.isInstancedMesh) istanze++ } })
    return { campi, edifici, altri, compagni: this.compagni.lista.length, cartelli: this.sopra.querySelectorAll('.f3-badge').length, mesh, ombre, istanze }
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
    this.renderer.setPixelRatio(this.scalaViva()); this.adattaSenzaRect()
    this.sole.castShadow = q.ombre; this.ombraSporca = true
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

  // ── costruire: il menu «Costruisci qui» (viste/CostruisciQui.vue) e il fantasma che resta se la cella non basta ──
  /** La cella dove il tasto 🏗️ costruisce: davanti all'eroe, o la più vicina libera nel terreno tuo. */
  cellaDavanti() {
    const e = this.eroe, m = this.m
    const i0 = Math.floor(e.x + Math.sin(e.dir) * 1.6), j0 = Math.floor(e.z + Math.cos(e.dir) * 1.6)
    let meglio = null
    for (let r = 0; r <= 4 && !meglio; r++) {
      let d = 1e9
      for (let a = -r; a <= r; a++) for (let b = -r; b <= r; b++) {
        if (Math.max(Math.abs(a), Math.abs(b)) !== r) continue
        const i = i0 + a, j = j0 + b
        if (!m.cellaPropria(i, j) || m.blocca(i, j)) continue
        const dd = Math.hypot(i + 0.5 - e.x, j + 0.5 - e.z)
        if (dd < d) { d = dd; meglio = [i, j] }
      }
    }
    return meglio || e.cella()
  }
  /** Una scelta del menu: sulla cella premuta. Dice com'è andata (vedi `Costruzione.daMenu`). */
  costruisciQui(tipo, i, j) { return this.costruzione.daMenu(tipo, i, j) }
  annullaTrascinamento() { this.costruzione.annullaTrascinamento() }
  tornaAllEroe() { this.camera.segui() }

  via() {
    this.ferma(); this.ro?.disconnect(); this.dito.via()
    this.pezzi.via(); this.fx.via(); this.terreno.via(); this.compagni.via()
    this._anteprime?.via()
    try { this.renderer.dispose() } catch (e) { /* già andato */ }
  }
}
