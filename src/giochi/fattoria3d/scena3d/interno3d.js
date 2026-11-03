// La base di ogni posto dove si entra (docs/fattoria3d/casa.md, docs/fattoria3d/botteghe.md): una scena sua su una tela sua, mentre la
// fattoria aspetta ferma (come la visita a un vicino). Il renderer, la luce, la telecamera della fattoria, il contadino che cammina sulle
// celle che dice chi la estende, i pavimenti e i muri con le porte, il dito. La telecamera guarda da sud come fuori: i muri orizzontali
// fra lei e il contadino si abbassano, come nel sotterraneo. Chi estende (Casa3d, Bottega3d) mette il resto e risponde a `tocca`.
import * as THREE from 'three'
import { segui, rilascia } from '../../../grafica/rilascio3d.js'
import { Eroe } from './eroe.js'
import { Camera, zoomMorbido, dentroLimiti } from './camera.js'
import { Effetti } from './effetti.js'
import { disegnaTrama } from './trame-pure.js'
import { percorso } from '../motore/percorso.js'
import { scalaPer } from '../dati/degrado.js'
import { PARETI } from '../dati/interni.js'

export const ALTO = 2.3, SPESSORE = 0.24                         // i muri: alti e spessi
const BASSO = 0.32                                              // quanto resta di un muro abbassato
const FONDO = new THREE.Color(0x2a2219)                         // fuori: buio caldo
const ESTERNO = 0xa8784a                                        // il lato di fuori dei muri: i tronchi della casa
const SOGLIA = 16, ATTESA_PREMUTO = 450, FANTASMA_MS = 450, FANTASMA_PX = 40
const VICINO = 0.55                                             // dentro la camera sta più vicina che fuori
const AVANTI = 2.4                                              // e guarda un po' oltre il contadino: la stanza è davanti a lui

// ── le trame del pavimento e della carta: un canvas per finitura, disegnato una volta ──
const trame = new Map()
function trama(chiave, lato, disegna) {
  if (typeof document === 'undefined') return null
  if (!trame.has(chiave)) {
    const c = document.createElement('canvas'); c.width = c.height = lato
    disegna(c.getContext('2d'), lato)
    const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.wrapS = t.wrapT = THREE.RepeatWrapping
    trame.set(chiave, t)
  }
  return trame.get(chiave)
}
function tramaDelPavimento(p) {
  return trama('pav:' + p.c + p.motivo, 128, (x, n) => {
    const c = new THREE.Color(p.c), scuro = '#' + c.clone().multiplyScalar(0.8).getHexString(), chiaro = '#' + c.clone().lerp(new THREE.Color(0xffffff), 0.15).getHexString()
    x.fillStyle = p.c; x.fillRect(0, 0, n, n)
    if (p.motivo === 'assi') for (let k = 0; k < 4; k++) { x.fillStyle = k % 2 ? chiaro : p.c; x.fillRect(0, k * n / 4, n, n / 4); x.fillStyle = scuro; x.fillRect(0, k * n / 4, n, 2); x.fillRect(((k * 37) % 4) * n / 4 + n / 8, k * n / 4, 2, n / 4) }
    else if (p.motivo === 'piastrelle') { x.fillStyle = scuro; for (let k = 0; k < 2; k++) { x.fillRect(k * n / 2, 0, 2, n); x.fillRect(0, k * n / 2, n, 2) } }
    else if (p.motivo === 'scacchi') { x.fillStyle = '#3b3b40'; for (let a = 0; a < 2; a++) for (let b = 0; b < 2; b++) if ((a + b) % 2) x.fillRect(a * n / 2, b * n / 2, n / 2, n / 2) }
    else { x.globalAlpha = 0.12; x.fillStyle = scuro; for (let k = 0; k < 60; k++) x.fillRect((k * 53) % n, (k * 29) % n, 3, 3); x.globalAlpha = 1 }
  })
}
const materiali = new Map()
export function materiale(chiave, fai) { if (!materiali.has(chiave)) materiali.set(chiave, fai()); return materiali.get(chiave) }
/** Il materiale di un pavimento (`{ c, motivo }`, come PAVIMENTI di dati/interni.js). */
export function pavimentoDi(p) {
  return materiale('pav:' + p.c + p.motivo, () => { const t = tramaDelPavimento(p); return new THREE.MeshStandardMaterial({ color: t ? 0xffffff : p.c, map: t, roughness: 0.95 }) })
}
/** Il materiale delle pareti: un colore (id di PARETI o un esadecimale) e la carta. */
export function muroDi({ pareti, carta = 'unita' }) {
  const c = (PARETI.find(p => p.id === pareti) || { c: pareti && pareti[0] === '#' ? pareti : PARETI[0].c }).c
  return materiale('muro:' + c + carta, () => {
    const t = carta && carta !== 'unita' ? trama('carta:' + c + carta, 64, (x, n) => disegnaTrama(x, n, c, carta)) : null
    return new THREE.MeshStandardMaterial({ color: t ? 0xffffff : c, map: t, roughness: 1 })
  })
}
export const muroEsterno = () => materiale('esterno', () => new THREE.MeshStandardMaterial({ color: ESTERNO, roughness: 1 }))

export class Interno3d {
  /** `cammina(i, j)`: dove il contadino può stare; `ingresso` { i, j }: dove compare; `centro` { x, z, r }: dove sta la luce e quanto è larga la sua ombra. */
  constructor({ canvas, sopra, ui, qualita, abito = null, cammina, ingresso, centro }) {
    this.canvas = canvas; this.sopra = sopra; this.ui = ui; this.q = qualita
    this.renderer = segui(new THREE.WebGLRenderer({ canvas, antialias: true }))
    this.renderer.shadowMap.enabled = true; this.renderer.shadowMap.type = THREE.PCFShadowMap
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping; this.renderer.toneMappingExposure = 1.05
    this.scena = new THREE.Scene(); this.scena.background = FONDO
    this.scena.add(new THREE.HemisphereLight(0xfff4e0, 0x8a6a4a, 1.35))
    this.sole = new THREE.DirectionalLight(0xfff0d8, 1.6)
    this.sole.castShadow = !!qualita.ombre; this.sole.shadow.mapSize.set(1024, 1024)
    this.sole.position.set(centro.x - 6, 16, centro.z + 8); this.sole.target.position.set(centro.x, 0, centro.z)
    Object.assign(this.sole.shadow.camera, { left: -centro.r, right: centro.r, top: centro.r, bottom: -centro.r, near: 1, far: 50 })
    this.sole.shadow.bias = -0.0004; this.sole.shadow.normalBias = 0.03
    this.scena.add(this.sole, this.sole.target)
    this.camera = new Camera(new THREE.DirectionalLight())          // la camera della fattoria: il suo sole è finto, quello vero sta fermo qui
    this.vista = { proietta: (p, extra) => this.proietta(p, extra), frustum: () => null }
    this.fx = new Effetti(this.scena, sopra, this.vista, qualita)

    this.cammina = cammina
    this.strada = { percorsoVerso: (da, celle) => percorso(cammina, () => false, da, celle), sullaStrada: () => false, quotaPasso: () => 0 }
    this.eroe = new Eroe(this.scena, this.strada, this.fx, abito)    // il motore gli presta solo la strada
    this.eroe.x = ingresso.i + 0.5; this.eroe.z = ingresso.j + 0.5; this.eroe.dir = Math.PI
    this.eroe.alVia = () => this.camera.segui()
    this.camera.x = this.eroe.x; this.camera.z = this.eroe.z

    this.stanze = new THREE.Group(); this.scena.add(this.stanze)     // pavimenti e muri: si rifanno tutti insieme
    this.muri = []                                                   // { mesh, orizzontale, linea, architrave }
    this.dito = new DitoInterno(this)
    this.t0 = performance.now(); this.tPrima = this.t0; this.vivo = false; this.giroId = 0
    this.ro = typeof ResizeObserver === 'function' ? new ResizeObserver(() => this.adatta()) : null
    this.ro?.observe(canvas)
    this.adatta()
  }

  // ── la misura e la proiezione ──
  adatta() {
    this.rect = this.canvas.getBoundingClientRect()
    const l = Math.max(1, Math.round(this.rect.width)), a = Math.max(1, Math.round(this.rect.height))
    this.renderer.setPixelRatio(scalaPer(window.devicePixelRatio || 1, this.q.scala || 1, 0))
    this.renderer.setSize(l, a, false)
    this.camera.adatta(l, a)
  }
  proietta(p, extra = 0) {
    const v = new THREE.Vector3(p.x, p.y + extra, p.z).project(this.camera.cam)
    return [(v.x * 0.5 + 0.5) * this.rect.width, (-v.y * 0.5 + 0.5) * this.rect.height, v.z < 1]
  }
  _raggio(cx, cy) {
    const r = this.canvas.getBoundingClientRect(), rg = new THREE.Raycaster()
    rg.setFromCamera(new THREE.Vector2((cx - r.left) / r.width * 2 - 1, -((cy - r.top) / r.height) * 2 + 1), this.camera.cam)
    return rg
  }
  puntaSuolo(cx, cy) { const p = new THREE.Vector3(); return this._raggio(cx, cy).ray.intersectPlane(new THREE.Plane(new THREE.Vector3(0, 1, 0), 0), p) ? p : null }

  // ── pavimenti e muri ──
  svuotaStanze() { for (const o of [...this.stanze.children]) { this.stanze.remove(o); o.geometry?.dispose() } this.muri = [] }
  /** Un pavimento da (x0, z0) largo `w` e profondo `d`: una piastrella ogni due celle. */
  pavimento(x0, z0, w, d, mat) {
    const geo = new THREE.PlaneGeometry(w, d); geo.rotateX(-Math.PI / 2)
    const uv = geo.attributes.uv; for (let k = 0; k < uv.count; k++) uv.setXY(k, uv.getX(k) * w / 2, uv.getY(k) * d / 2)
    const pav = new THREE.Mesh(geo, mat); pav.receiveShadow = true; pav.position.set(x0 + w / 2, 0, z0 + d / 2)
    this.stanze.add(pav)
  }
  /** Un muro sulla riga `linea` (il centro della riga di celle del muro), da `da` ad `a`, con un buco largo una cella in `buco` (la porta) o
      senza. Due facce: `dentro` verso il lato `-verso`, `fuori` verso `verso` (+1: verso +z o +x). */
  muro({ orizzontale, linea, da, a, buco = null, dentro, fuori, verso }) {
    const pezzi = buco === null ? [[da, a]] : [[da, buco], [buco + 1, a]]
    for (const [x0, x1] of pezzi) {
      const lung = x1 - x0; if (lung <= 0) continue
      for (const [mat, lato] of [[dentro, -1], [fuori, 1]]) {
        const geo = orizzontale ? new THREE.BoxGeometry(lung, ALTO, SPESSORE / 2) : new THREE.BoxGeometry(SPESSORE / 2, ALTO, lung)
        geo.translate(0, ALTO / 2, 0)
        const uv = geo.attributes.uv; for (let k = 0; k < uv.count; k++) uv.setXY(k, uv.getX(k) * lung / 1.2, uv.getY(k) * ALTO / 1.2)        // la carta ripete ogni 1,2 celle, non una volta per muro
        const mesh = new THREE.Mesh(geo, mat); mesh.castShadow = true; mesh.receiveShadow = true
        const off = lato * verso * SPESSORE / 4
        if (orizzontale) mesh.position.set((x0 + x1) / 2, 0, linea + off); else mesh.position.set(linea + off, 0, (x0 + x1) / 2)
        this.stanze.add(mesh)
        this.muri.push({ mesh, orizzontale, linea })
      }
    }
    if (buco !== null) {                                                   // l'architrave sopra la porta e la soglia di legno
      const leg = materiale('stipite', () => new THREE.MeshStandardMaterial({ color: 0x7a4f2c, roughness: 0.9 }))
      const sopra = new THREE.Mesh(orizzontale ? new THREE.BoxGeometry(1, 0.5, SPESSORE + 0.02) : new THREE.BoxGeometry(SPESSORE + 0.02, 0.5, 1), leg)
      sopra.geometry.translate(0, 0.25, 0)
      const soglia = new THREE.Mesh(orizzontale ? new THREE.BoxGeometry(1, 0.02, SPESSORE + 0.1) : new THREE.BoxGeometry(SPESSORE + 0.1, 0.02, 1), leg)
      if (orizzontale) { sopra.position.set(buco + 0.5, ALTO - 0.5, linea); soglia.position.set(buco + 0.5, 0.01, linea) }
      else { sopra.position.set(linea, ALTO - 0.5, buco + 0.5); soglia.position.set(linea, 0.01, buco + 0.5) }
      this.stanze.add(sopra, soglia)
      this.muri.push({ mesh: sopra, orizzontale, linea, architrave: true })
    }
  }
  /** I muri orizzontali fra la camera e il contadino si abbassano (il fronte sempre): il davanti non copre mai chi è dietro. */
  _abbassaMuri(dt) {
    const k = Math.min(1, dt * 8), z = this.eroe.z
    for (const w of this.muri) {
      const basso = w.orizzontale && w.linea > z - 0.2
      const meta = basso ? (w.architrave ? 0 : BASSO / ALTO) : 1
      w.mesh.scale.y += (meta - w.mesh.scale.y) * k
      w.mesh.visible = w.mesh.scale.y > 0.02
    }
  }
  /** Va alla cella libera più vicina a (i, j). */
  vaiVicino(i, j) {
    const cand = []
    for (let a = -2; a <= 2; a++) for (let b = -2; b <= 2; b++) if (this.cammina(i + a, j + b)) cand.push([i + a, j + b, Math.hypot(a, b)])
    cand.sort((u, v) => u[2] - v[2])
    if (cand.length) this.eroe.vaiA([[cand[0][0], cand[0][1]]], null, null)
  }

  // ── chi estende risponde a questi ──
  tocca() {}
  /** Tenendo premuto in (x, y): una funzione da chiamare dopo l'attesa, o null. */
  daTenere() { return null }
  /** Il mobile in mano (solo in casa): finché c'è, il dito lo porta. */
  get inMano() { return false }
  portaInMano() {}
  aggiorna() {}

  /** Il contadino cambia abito, anche qui. */
  vesti(abito) { this.eroe.vesti(abito) }

  // ── il battito ──
  avvia() {
    if (this.vivo) return
    this.vivo = true; this.tPrima = performance.now()
    const giro = ts => { if (!this.vivo) return; this.giroId = requestAnimationFrame(giro); this._fotogramma(ts) }
    this.giroId = requestAnimationFrame(giro)
  }
  ferma() { this.vivo = false; cancelAnimationFrame(this.giroId) }
  _fotogramma(ts) {
    const dt = Math.min(0.05, (ts - this.tPrima) / 1000); this.tPrima = ts
    const tt = (ts - this.t0) / 1000
    this.eroe.aggiorna(dt, tt)
    this.aggiorna(dt, tt)
    this.fx.aggiorna(dt, this.eroe.posizione)
    this.camera.muovi(dt, { eroe: { x: this.eroe.x, z: this.eroe.z - AVANTI, vel: this.eroe.vel }, distanza: (this.q.camera || 22) * VICINO })
    this._abbassaMuri(dt)
    this.renderer.render(this.scena, this.camera.cam)
  }
  get cameraLibera() { return this.camera.libera.on }
  tornaAllEroe() { this.camera.segui() }
  via() {
    this.ferma(); this.ro?.disconnect(); this.dito.via()
    this.fx.via()
    for (const o of this.stanze.children) o.geometry?.dispose()
    rilascia(this.renderer)
  }
}

/** Il dito dentro: un tocco fa (`tocca`); un dito che scorre sposta la vista (o il mobile in mano); due dita zoomano; tenere premuto fa
    quello che dice `daTenere`. Soglia di 16 px (docs/core/il-dito.md). */
class DitoInterno {
  constructor(posto) {
    this.c = posto; this.canvas = posto.canvas; this.punti = new Map(); this.inizio = null; this.lungo = 0
    this.giu = e => this._giu(e); this.muovi = e => this._muovi(e); this.su = e => this._fine(e); this.niente = e => e.preventDefault()
    this.rotella = e => { e.preventDefault(); const cam = this.c.camera; cam.zoom = dentroLimiti(cam.zoom * Math.exp(e.deltaY * 0.0015)) }
    const k = this.canvas
    k.addEventListener('pointerdown', this.giu); k.addEventListener('pointermove', this.muovi); k.addEventListener('pointerup', this.su)
    k.addEventListener('pointercancel', this.su); k.addEventListener('contextmenu', this.niente); k.addEventListener('wheel', this.rotella, { passive: false })
  }
  via() {
    const k = this.canvas; clearTimeout(this.lungo)
    k.removeEventListener('pointerdown', this.giu); k.removeEventListener('pointermove', this.muovi); k.removeEventListener('pointerup', this.su)
    k.removeEventListener('pointercancel', this.su); k.removeEventListener('contextmenu', this.niente); k.removeEventListener('wheel', this.rotella)
  }
  _distanza() { const [a, b] = [...this.punti.values()]; return Math.hypot(a[0] - b[0], a[1] - b[1]) }
  _giu(e) {
    const c = this.c
    this.canvas.setPointerCapture(e.pointerId); this.punti.set(e.pointerId, [e.clientX, e.clientY])
    clearTimeout(this.lungo)
    if (this.punti.size === 2) { this.pinch0 = this._distanza(); this.zoom0 = c.camera.zoom; this.inizio = null; return }
    const ini = this.inizio = { x: e.clientX, y: e.clientY, trascina: false }
    if (c.ui.fogliAperti()) return
    if (c.inMano) { ini.mano = true; c.portaInMano(e.clientX, e.clientY); return }
    const fai = c.daTenere(e.clientX, e.clientY)
    if (fai) this.lungo = setTimeout(() => {
      if (this.inizio !== ini || ini.trascina || this.punti.size !== 1 || c.ui.fogliAperti()) return
      try { navigator.vibrate && navigator.vibrate(30) } catch (x) { /* niente vibrazione */ }
      ini.fatto = true; fai()
    }, ATTESA_PREMUTO)
  }
  _muovi(e) {
    if (!this.punti.has(e.pointerId)) return
    const c = this.c; this.punti.set(e.pointerId, [e.clientX, e.clientY])
    if (this.punti.size === 2) { c.camera.zoom = Math.max(0.1, Math.min(8, this.zoom0 * this.pinch0 / Math.max(1, this._distanza()))); return }
    const ini = this.inizio; if (!ini) return
    const d = Math.hypot(e.clientX - ini.x, e.clientY - ini.y)
    if (d > 10) { clearTimeout(this.lungo); this.lungo = 0 }
    if (!ini.trascina && d > SOGLIA) ini.trascina = true
    if (ini.mano) return c.portaInMano(e.clientX, e.clientY)
    if (!ini.trascina || c.ui.fogliAperti()) return
    const prima = ini.u || ini; ini.u = { x: e.clientX, y: e.clientY }
    const p0 = c.puntaSuolo(prima.x, prima.y), p1 = c.puntaSuolo(e.clientX, e.clientY)
    if (p0 && p1) c.camera.trascina(p0, p1)
  }
  _fine(e) {
    if (!this.punti.has(e.pointerId)) return
    const c = this.c, su = e.type === 'pointerup'
    if (this.punti.size === 2) c.camera.zoom = dentroLimiti(zoomMorbido(c.camera.zoom))
    this.punti.delete(e.pointerId); clearTimeout(this.lungo); this.lungo = 0
    const ini = this.inizio; this.inizio = null
    if (!ini || !su) return
    if (e.pointerType !== 'mouse') zittisciIlFantasma(e.clientX, e.clientY)          // il click che il dito si lascia dietro non deve premere il foglio appena aperto
    if (!ini.trascina && !ini.fatto && !ini.mano && !c.ui.fogliAperti()) c.tocca(e.clientX, e.clientY)
  }
}
function zittisciIlFantasma(x, y) {
  const t0 = performance.now(), smetti = () => removeEventListener('click', zitto, true)
  const zitto = ev => {
    if (performance.now() - t0 > FANTASMA_MS) return smetti()
    if (Math.hypot(ev.clientX - x, ev.clientY - y) > FANTASMA_PX) return
    ev.stopPropagation(); ev.preventDefault(); smetti()
  }
  addEventListener('click', zitto, true)
  setTimeout(smetti, FANTASMA_MS + 20)
}
