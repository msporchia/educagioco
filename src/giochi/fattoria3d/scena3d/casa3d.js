// Dentro la casa (docs/fattoria3d/casa.md): una scena sua, su una tela sua, mentre la fattoria aspetta ferma (come la visita a un vicino).
// Le stanze comprate col loro pavimento e le pareti, i muri con le porte, i mobili, e il contadino che cammina fra loro. Le regole sono
// del motore (`motore.compraMobile`, `spostaMobile`…), le finestre della vista (`ui`). La telecamera guarda da sud come fuori: i muri
// fra lei e il contadino si abbassano, come nel sotterraneo, così una stanza dietro un'altra si vede.
//
// `ui`: cambio(), fogliAperti(), apriMobile(id), apriGuardaroba(), esci(), offriStanza(id), mano(info | null).
import * as THREE from 'three'
import { segui, rilascia } from '../../../grafica/rilascio3d.js'
import { Eroe } from './eroe.js'
import { Camera, zoomMorbido, dentroLimiti } from './camera.js'
import { Effetti } from './effetti.js'
import { creaAnteprime } from './anteprime.js'
import { fantasma, buttaFantasma, tingi } from './modelli.js'
import { creaMobile } from './mobili.js'
import { disegnaTrama } from './trame-pure.js'
import { percorso } from '../motore/percorso.js'
import { scalaPer } from '../dati/degrado.js'
import { STANZE, STANZA, MOBILI, ARMADIO, PAVIMENTI, PARETI, PORTA_DI_CASA, INGRESSO, LARGHEZZA, PROFONDITA,
         origine, stanzaDi, confinano, portaFra, misureMobile, ruotabileMobile } from '../dati/interni.js'

const ALTO = 2.3, BASSO = 0.32, SPESSORE = 0.24                // i muri: alti, abbassati, spessi
const FONDO = new THREE.Color(0x2a2219)                         // fuori dalla casa: buio caldo
const ESTERNO = 0xa8784a                                        // il lato di fuori dei muri: i tronchi della casa
const SOGLIA = 16, ATTESA_PREMUTO = 450, FANTASMA_MS = 450, FANTASMA_PX = 40
const VICINO = 0.55                                             // dentro la camera sta più vicina che fuori
const AVANTI = 2.4                                              // e guarda un po' oltre il contadino: la stanza è davanti a lui

// ── le trame del pavimento e della carta: un canvas per finitura, disegnato una volta ──
const trameCasa = new Map()
function trama(chiave, lato, disegna) {
  if (typeof document === 'undefined') return null
  if (!trameCasa.has(chiave)) {
    const c = document.createElement('canvas'); c.width = c.height = lato
    disegna(c.getContext('2d'), lato)
    const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.wrapS = t.wrapT = THREE.RepeatWrapping
    trameCasa.set(chiave, t)
  }
  return trameCasa.get(chiave)
}
function trameDelPavimento(p) {
  return trama('pav:' + p.id, 128, (x, n) => {
    const c = new THREE.Color(p.c), scuro = '#' + c.clone().multiplyScalar(0.8).getHexString(), chiaro = '#' + c.clone().lerp(new THREE.Color(0xffffff), 0.15).getHexString()
    x.fillStyle = p.c; x.fillRect(0, 0, n, n)
    if (p.motivo === 'assi') for (let k = 0; k < 4; k++) { x.fillStyle = k % 2 ? chiaro : p.c; x.fillRect(0, k * n / 4, n, n / 4); x.fillStyle = scuro; x.fillRect(0, k * n / 4, n, 2); x.fillRect(((k * 37) % 4) * n / 4 + n / 8, k * n / 4, 2, n / 4) }
    else if (p.motivo === 'piastrelle') { x.fillStyle = scuro; for (let k = 0; k < 2; k++) { x.fillRect(k * n / 2, 0, 2, n); x.fillRect(0, k * n / 2, n, 2) } }
    else if (p.motivo === 'scacchi') { x.fillStyle = '#3b3b40'; for (let a = 0; a < 2; a++) for (let b = 0; b < 2; b++) if ((a + b) % 2) x.fillRect(a * n / 2, b * n / 2, n / 2, n / 2) }
    else { x.globalAlpha = 0.12; x.fillStyle = scuro; for (let k = 0; k < 60; k++) x.fillRect((k * 53) % n, (k * 29) % n, 3, 3); x.globalAlpha = 1 }
  })
}
const tramaDellaCarta = (colore, carta) => trama('carta:' + colore + carta, 64, (x, n) => disegnaTrama(x, n, colore, carta))
const materiali = new Map()
function materiale(chiave, fai) { if (!materiali.has(chiave)) materiali.set(chiave, fai()); return materiali.get(chiave) }

/** Il materiale delle pareti di una stanza (colore e carta). */
function muroDi(fin) {
  const c = (PARETI.find(p => p.id === fin.pareti) || PARETI[0]).c
  return materiale('muro:' + c + fin.carta, () => {
    const t = fin.carta && fin.carta !== 'unita' ? tramaDellaCarta(c, fin.carta) : null
    return new THREE.MeshStandardMaterial({ color: t ? 0xffffff : c, map: t, roughness: 1 })
  })
}

export class Casa3d {
  constructor({ canvas, sopra, motore, ui, qualita, abito = null }) {
    this.canvas = canvas; this.sopra = sopra; this.m = motore; this.ui = ui; this.q = qualita
    this.renderer = segui(new THREE.WebGLRenderer({ canvas, antialias: true }))
    this.renderer.shadowMap.enabled = true; this.renderer.shadowMap.type = THREE.PCFShadowMap
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping; this.renderer.toneMappingExposure = 1.05
    this.scena = new THREE.Scene(); this.scena.background = FONDO
    this.scena.add(new THREE.HemisphereLight(0xfff4e0, 0x8a6a4a, 1.35))
    this.sole = new THREE.DirectionalLight(0xfff0d8, 1.6)
    this.sole.castShadow = !!qualita.ombre; this.sole.shadow.mapSize.set(1024, 1024)
    this.sole.position.set(LARGHEZZA / 2 - 6, 16, PROFONDITA / 2 + 8); this.sole.target.position.set(LARGHEZZA / 2, 0, PROFONDITA / 2)
    Object.assign(this.sole.shadow.camera, { left: -16, right: 16, top: 16, bottom: -16, near: 1, far: 50 })
    this.sole.shadow.bias = -0.0004; this.sole.shadow.normalBias = 0.03
    this.scena.add(this.sole, this.sole.target)
    this.camera = new Camera(new THREE.DirectionalLight())          // la camera della fattoria: il suo sole è finto, quello vero sta fermo sulla casa
    this.vista = { proietta: (p, extra) => this.proietta(p, extra), frustum: () => null }
    this.fx = new Effetti(this.scena, sopra, this.vista, qualita)

    // il contadino cammina sulle celle libere della casa: il motore gli presta solo la strada
    const m = motore
    this.eroe = new Eroe(this.scena, {
      percorsoVerso: (da, celle) => percorso((i, j) => m.calpestabileInCasa(i, j), () => false, da, celle),
      sullaStrada: () => false, quotaPasso: () => 0,
    }, this.fx, abito)
    this.eroe.x = INGRESSO.i + 0.5; this.eroe.z = INGRESSO.j + 0.5; this.eroe.dir = Math.PI
    this.eroe.alVia = () => this.camera.segui()
    this.camera.x = this.eroe.x; this.camera.z = this.eroe.z

    this.stanze = new THREE.Group(); this.scena.add(this.stanze)
    this.muri = []                       // { mesh, z (la linea del muro), basso: sempre basso }
    this.mobili = new Map()              // id → { grp, firma }
    this.badge = new Map()               // stanza da comprare → cartello
    this.mano = null                     // il mobile in mano: { tipo, id, i, j, rot, colore, trama, grp, ok }
    this._firmaStanze = ''
    this.sincronizza()

    this.dito = new DitoDiCasa(this)
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

  // ── cosa si vede: stanze e muri (rifatti quando cambiano le stanze o le loro finiture), mobili (uno per uno) ──
  sincronizza() {
    const I = this.m.s.interni, firma = JSON.stringify([I.stanze, I.finiture])
    if (firma !== this._firmaStanze) { this._firmaStanze = firma; this._rifaiStanze(I) }
    const visti = new Set()
    for (const o of I.mobili) {
      if (o.i === null || (this.mano && this.mano.id === o.id)) continue
      visti.add(o.id)
      const f = `${o.tipo}:${o.colore}:${o.trama}:${o.i}:${o.j}:${o.rot}`, v = this.mobili.get(o.id)
      if (v && v.firma === f) continue
      if (v) this.scena.remove(v.grp)
      const grp = creaMobile(o.tipo, o.colore, o.trama)
      this._posa(grp, o.tipo, o.i, o.j, o.rot); grp.userData.mobile = o.id
      this.scena.add(grp); this.mobili.set(o.id, { grp, firma: f })
    }
    for (const [id, v] of this.mobili) if (!visti.has(id)) { this.scena.remove(v.grp); this.mobili.delete(id) }
  }
  _posa(grp, tipo, i, j, rot) {
    const x = misureMobile(tipo, rot)
    grp.position.set(i + x.w / 2, 0, j + x.d / 2); grp.rotation.y = MOBILI[tipo].strato === 'muro' ? 0 : rot * Math.PI / 2
  }
  _rifaiStanze(I) {
    for (const o of [...this.stanze.children]) { this.stanze.remove(o); o.geometry?.dispose() }
    this.muri = []
    const tua = id => I.stanze.includes(id)
    for (const id of I.stanze) {                                          // i pavimenti: fino a metà del muro, così fra muro e stanza non c'è il buio
      const s = STANZE[id], { i0, j0 } = origine(s), fin = I.finiture[id], p = PAVIMENTI.find(x => x.id === fin.pavimento) || PAVIMENTI[0]
      const w = STANZA.w + 1, d = STANZA.d + 1, t = trameDelPavimento(p)
      const mat = materiale('pav:' + p.id, () => new THREE.MeshStandardMaterial({ color: t ? 0xffffff : p.c, map: t, roughness: 0.95 }))
      const geo = new THREE.PlaneGeometry(w, d); geo.rotateX(-Math.PI / 2)
      const uv = geo.attributes.uv; for (let k = 0; k < uv.count; k++) uv.setXY(k, uv.getX(k) * w / 2, uv.getY(k) * d / 2)        // una piastrella ogni due celle
      const pav = new THREE.Mesh(geo, mat); pav.receiveShadow = true; pav.position.set(i0 + STANZA.w / 2, 0, j0 + STANZA.d / 2)
      this.stanze.add(pav)
    }
    // i muri: per ogni lato di una stanza tua; se dall'altra parte c'è un'altra stanza tua il muro è uno solo, con la porta in mezzo
    const lati = []
    for (const id of I.stanze) {
      const s = STANZE[id]
      for (const [dc, dr] of [[0, -1], [1, 0], [0, 1], [-1, 0]]) {
        const v = STANZE.find(t => t.c === s.c + dc && t.r === s.r + dr) || null
        if (v && tua(v.id) && v.id < id) continue                         // il muro in comune lo fa una volta sola la stanza col numero più basso
        lati.push({ s, v: v && tua(v.id) ? v : null, dc, dr })
      }
    }
    for (const l of lati) this._muro(l, I)
    // le stanze da comprare: un cartello con il prezzo (il foglio della pianta dice il resto)
    const vista = this.m.vistaInterni()
    for (const st of vista.stanze) {
      const b = this.badge.get(st.id)
      if (st.apribile) {
        const bb = b || this.fx.nuovoBadge(); bb.imposta(`＋ 🪙 ${st.prezzo}`, 'vendita'); this.badge.set(st.id, bb)
      } else if (b) { b.imposta('', ''); this.badge.delete(st.id) }
    }
  }
  /** Un muro lungo un lato di `s`: dritto o con un buco (la porta). Due facce, una per parte: ognuna col colore della sua stanza. */
  _muro({ s, v, dc, dr }, I) {
    const { i0, j0 } = origine(s), W = STANZA.w, D = STANZA.d
    const orizzontale = dr !== 0
    const linea = orizzontale ? (dr < 0 ? j0 - 0.5 : j0 + D + 0.5) : (dc < 0 ? i0 - 0.5 : i0 + W + 0.5)        // il centro della riga di muro
    const da = orizzontale ? i0 - 1 : j0 - 1, a = orizzontale ? i0 + W + 1 : j0 + D + 1                       // anche gli angoli
    let buco = null
    if (v) { const p = portaFra(s, v); buco = orizzontale ? p.i : p.j }
    else if (s.id === 0 && dr > 0) buco = PORTA_DI_CASA.i                                                    // la porta di casa
    const pezzi = buco === null ? [[da, a]] : [[da, buco], [buco + 1, a]]
    const dentro = muroDi(I.finiture[s.id]), fuori = v ? muroDi(I.finiture[v.id]) : materiale('esterno', () => new THREE.MeshStandardMaterial({ color: ESTERNO, roughness: 1 }))
    const verso = orizzontale ? dr : dc                                    // da che parte guarda la faccia di `s` (verso il suo dentro: -verso)
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
  /** I muri orizzontali fra la camera e il contadino si abbassano (il fronte di casa sempre): il davanti non copre mai chi è dietro. */
  _abbassaMuri(dt) {
    const k = Math.min(1, dt * 8), z = this.eroe.z
    for (const w of this.muri) {
      const basso = w.orizzontale && w.linea > z - 0.2
      const meta = basso ? (w.architrave ? 0 : BASSO / ALTO) : 1
      w.mesh.scale.y += (meta - w.mesh.scale.y) * k
      w.mesh.visible = w.mesh.scale.y > 0.02
    }
  }

  // ── il tocco ──
  mobileSotto(cx, cy) {
    const gruppi = [...this.mobili.values()].map(v => v.grp)
    const hit = this._raggio(cx, cy).intersectObjects(gruppi, true)[0]
    let o = hit && hit.object
    while (o && o.userData.mobile === undefined) o = o.parent
    if (o) return o.userData.mobile
    const p = this.puntaSuolo(cx, cy); if (!p) return null                // il dito è largo: la cella basta (non per un tappeto, che sta sotto)
    const i = Math.floor(p.x), j = Math.floor(p.z), I = this.m.s.interni
    const su = I.mobili.filter(o => o.i !== null && MOBILI[o.tipo].strato !== 'muro').filter(o => { const x = misureMobile(o.tipo, o.rot); return i >= o.i && i < o.i + x.w && j >= o.j && j < o.j + x.d })
    return (su.find(o => MOBILI[o.tipo].strato === 'pavimento') || su[0] || {}).id ?? null
  }
  /** Le celle libere attorno a un mobile: da lì lo si usa (l'armadio, davanti). */
  celleAttorno(o) {
    const x = misureMobile(o.tipo, o.rot), out = []
    for (let a = -1; a <= x.w; a++) for (let b = -1; b <= x.d; b++) if (a < 0 || a >= x.w || b < 0 || b >= x.d) out.push([o.i + a, o.j + b])
    return out.filter(([i, j]) => this.m.calpestabileInCasa(i, j))
  }
  tocca(x, y) {
    const { ui, eroe } = this
    if (ui.fogliAperti()) return
    if (this.mano) return this.portaInMano(x, y)
    const id = this.mobileSotto(x, y)
    if (id !== null) {
      const o = this.m.s.interni.mobili.find(m => m.id === id)
      if (o.tipo === ARMADIO) {                                            // l'armadio: il contadino ci va davanti e lo apre
        const x0 = misureMobile(o.tipo, o.rot), centro = new THREE.Vector3(o.i + x0.w / 2, 0, o.j + x0.d / 2)
        if (!eroe.vaiA(this.celleAttorno(o), () => { eroe.faccia(centro); ui.apriGuardaroba() }, centro)) ui.apriGuardaroba()       // murato: si apre lo stesso
        return
      }
      return ui.apriMobile(id)
    }
    const p = this.puntaSuolo(x, y); if (!p) return
    const i = Math.floor(p.x), j = Math.floor(p.z), s = stanzaDi(i, j), I = this.m.s.interni
    if ((i === PORTA_DI_CASA.i && j >= PORTA_DI_CASA.j) || (j > PORTA_DI_CASA.j && Math.abs(i - PORTA_DI_CASA.i) <= 2)) {       // la porta di casa, o fuori davanti: si esce
      return void eroe.vaiA([[PORTA_DI_CASA.i, PORTA_DI_CASA.j]], () => ui.esci(), null)
    }
    if (s && !I.stanze.includes(s.id)) { if (I.stanze.some(t => confinano(STANZE[t], s))) ui.offriStanza(s.id); return }
    const cand = []
    for (let a = -2; a <= 2; a++) for (let b = -2; b <= 2; b++) if (this.m.calpestabileInCasa(i + a, j + b)) cand.push([i + a, j + b, Math.hypot(a, b)])
    cand.sort((u, v) => u[2] - v[2])
    if (cand.length) eroe.vaiA([[cand[0][0], cand[0][1]]], null, null)
  }

  // ── il mobile in mano: uno nuovo dal catalogo (si compra a «Compra») o uno tuo da spostare ──
  /** Prende in mano un mobile nuovo, già col suo colore: compare nel posto libero più vicino al contadino. */
  prendiNuovo(tipo, colore, trama) {
    const I = this.m.s.interni, s = stanzaDi(Math.floor(this.eroe.x), Math.floor(this.eroe.z)) || STANZE[I.stanze[0]]
    const p = this.m.postoPerMobile(tipo, I.stanze.includes(s.id) ? s.id : I.stanze[0], null, Math.floor(this.eroe.x), Math.floor(this.eroe.z - 1))
      || { ...origine(s), rot: 0, i: origine(s).i0, j: origine(s).j0 }
    this._inMano({ tipo, id: null, i: p.i, j: p.j, rot: p.rot || 0, colore, trama })
  }
  /** Prende in mano un mobile tuo (messo o via): si sposta e si gira gratis. */
  prendi(id) {
    const o = this.m.s.interni.mobili.find(m => m.id === id); if (!o) return
    let { i, j, rot } = o
    if (i === null) { const p = this.m.postoPerMobile(o.tipo, I0(this), id, Math.floor(this.eroe.x), Math.floor(this.eroe.z - 1)); i = p ? p.i : origine(STANZE[0]).i0; j = p ? p.j : origine(STANZE[0]).j0; rot = p ? p.rot : 0 }
    this._inMano({ tipo: o.tipo, id, i, j, rot, colore: o.colore, trama: o.trama })
    this.sincronizza()                                                      // il mobile vero sparisce mentre è in mano
  }
  _inMano(h) {
    this.lasciaMano(false)
    const grp = creaMobile(h.tipo, h.colore, h.trama); fantasma(grp); this.scena.add(grp)
    this.mano = { ...h, grp }
    this._aggiornaMano()
  }
  _aggiornaMano() {
    const h = this.mano; if (!h) return
    this._posa(h.grp, h.tipo, h.i, h.j, h.rot)
    h.ok = this.m.mobileCiSta(h.tipo, h.i, h.j, h.rot, h.id).ok
    tingi(h.grp, h.ok)
    this.ui.mano({ tipo: h.tipo, nuovo: h.id === null, ok: h.ok, gira: ruotabileMobile(h.tipo), prezzo: h.id === null ? MOBILI[h.tipo].prezzo : 0 })
  }
  /** Il dito porta il mobile in mano: il centro del mobile sotto il dito. */
  portaInMano(x, y) {
    const h = this.mano, p = this.puntaSuolo(x, y); if (!h || !p) return
    const d = misureMobile(h.tipo, h.rot), i = Math.round(p.x - d.w / 2), j = Math.round(p.z - d.d / 2)
    if (i === h.i && j === h.j) return
    h.i = i; h.j = j
    if (MOBILI[h.tipo].strato === 'muro') { const s = stanzaDi(i, j); if (s) h.j = origine(s).j0 }      // le cose appese scivolano sulla parete di fondo
    this._aggiornaMano()
  }
  giraInMano() { const h = this.mano; if (!h || !ruotabileMobile(h.tipo)) return; h.rot = (h.rot + 1) & 3; this._aggiornaMano() }
  /** Mette giù il mobile in mano: compra (se è nuovo) o sposta. Torna il responso del motore; se va, la mano si svuota. */
  posaMano() {
    const h = this.mano; if (!h) return { ok: false, motivo: 'niente' }
    const r = h.id === null ? this.m.compraMobile(h.tipo, h.i, h.j, h.rot, h.colore, h.trama) : this.m.spostaMobile(h.id, h.i, h.j, h.rot)
    if (r.ok) { this.lasciaMano(); this.ui.cambio() }
    return r
  }
  lasciaMano(avvisa = true) {
    if (!this.mano) return
    this.scena.remove(this.mano.grp); buttaFantasma(this.mano.grp); this.mano = null
    this.sincronizza()
    if (avvisa) this.ui.mano(null)
  }

  /** Il contadino cambia abito, anche qui. */
  vesti(abito) { this.eroe.vesti(abito) }
  /** Dopo che il motore ha cambiato qualcosa (un colore, una stanza, un mobile messo via). */
  cambiato() { this.sincronizza() }
  /** L'anteprima di un mobile col suo colore (`mobile:<tipo>:<colore>:<trama>`), fotografata col renderer di qui. */
  anteprima(chiave) {
    if (!this._anteprime) this._anteprime = creaAnteprime(this.renderer, k => { const [, t, c, tr] = k.split(':'); return creaMobile(t, c, tr === 'null' ? null : tr) })
    return this._anteprime.chiedi(chiave)
  }
  anteprimaPronta(chiave) { return this._anteprime ? this._anteprime.leggi(chiave) : null }

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
    this.fx.aggiorna(dt, this.eroe.posizione)
    this.camera.muovi(dt, { eroe: { x: this.eroe.x, z: this.eroe.z - AVANTI, vel: this.eroe.vel }, distanza: (this.q.camera || 22) * VICINO })
    this._abbassaMuri(dt)
    for (const [id, b] of this.badge) {
      const { i0, j0 } = origine(STANZE[id]), [x, y, visto] = this.proietta(new THREE.Vector3(i0 + STANZA.w / 2, 0, j0 + STANZA.d / 2), 0.4)
      b.metti(x, y, visto && x > 20 && x < this.rect.width - 20 && y > 20 && y < this.rect.height - 60, true)
    }
    this.renderer.render(this.scena, this.camera.cam)
  }
  get cameraLibera() { return this.camera.libera.on }
  tornaAllEroe() { this.camera.segui() }
  via() {
    this.ferma(); this.ro?.disconnect(); this.dito.via()
    for (const b of this.badge.values()) b.el.remove()
    this.lasciaMano(false); this.fx.via(); this._anteprime?.via()
    for (const o of this.stanze.children) o.geometry?.dispose()
    rilascia(this.renderer)
  }
}
const I0 = casa => casa.m.s.interni.stanze[0]

/** Il dito dentro casa: un tocco fa (va, apre, porta il mobile in mano); un dito che scorre sposta la vista (o il mobile in mano); due dita
    zoomano; tenere premuto su un mobile apre il suo foglio (anche l'armadio, che al tocco apre il guardaroba). Soglia di 16 px (docs/core/il-dito.md). */
class DitoDiCasa {
  constructor(casa) {
    this.c = casa; this.canvas = casa.canvas; this.punti = new Map(); this.inizio = null; this.lungo = 0
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
    if (c.mano) { ini.mano = true; c.portaInMano(e.clientX, e.clientY); return }
    const id = c.mobileSotto(e.clientX, e.clientY)
    if (id !== null) this.lungo = setTimeout(() => {
      if (this.inizio !== ini || ini.trascina || this.punti.size !== 1 || c.ui.fogliAperti()) return
      try { navigator.vibrate && navigator.vibrate(30) } catch (x) { /* niente vibrazione */ }
      ini.fatto = true; c.ui.apriMobile(id)
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
    if (!ini.trascina && !ini.fatto && !ini.mano) c.tocca(e.clientX, e.clientY)
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
