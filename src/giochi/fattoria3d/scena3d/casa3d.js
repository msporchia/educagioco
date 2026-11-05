// Dentro la casa (docs/fattoria3d/casa.md), sopra la base degli interni (interno3d.js): le stanze comprate col loro pavimento e le pareti,
// i muri con le porte, le stanze in vendita col loro cartello, i mobili e il mobile in mano. Le regole sono del motore (`motore.compraMobile`,
// `spostaMobile`…), le finestre della vista (`ui`).
//
// `ui`: cambio(), fogliAperti(), apriMobile(id), apriGuardaroba(), esci(), offriStanza(id), mano(info | null), rifiuto({ motivo }).
import * as THREE from 'three'
import { Interno3d, pavimentoDi, muroDi, muroEsterno, materiale } from './interno3d.js'
import { creaAnteprime } from './anteprime.js'
import { fantasma, buttaFantasma, tingi } from './modelli.js'
import { cellaSottoIlDito, scartoDellaPresa, velocitaBordo } from './trascinamento-puro.js'
import { creaMobile } from './mobili.js'
import { STANZE, STANZA, MOBILI, PAVIMENTI, PORTA_DI_CASA, INGRESSO, LARGHEZZA, PROFONDITA,
         origine, stanzaDi, confinano, portaFra, misureMobile, ruotabileMobile } from '../dati/interni.js'

const CARTELLO_ALTO = 1.25, DITO_LARGO = 14
const SOPRA_LA_STRISCIA = 1.8                                  // quanto la camera si sposta verso il basso, perché la stanza stia sopra la striscia dei colori
const BORDO_LATI = 56, BORDO_SU = 84, BORDO_GIU = 100          // un cartello fuori schermo resta sul bordo, sotto la testata e sopra i tasti

/** Il pavimento accennato di una stanza in vendita: un tratteggio sul buio, come un lotto da comprare fuori. */
const pavimentoInVendita = () => materiale('in-vendita', () => {
  const n = 32, c = document.createElement('canvas'); c.width = STANZA.w * n; c.height = STANZA.d * n
  const x = c.getContext('2d')
  x.fillStyle = 'rgba(255,211,106,.14)'; x.fillRect(0, 0, c.width, c.height)
  x.strokeStyle = '#ffd36a'; x.lineWidth = 5; x.setLineDash([18, 12]); x.strokeRect(6, 6, c.width - 12, c.height - 12)
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace
  return new THREE.MeshBasicMaterial({ map: t, transparent: true })
})

export class Casa3d extends Interno3d {
  constructor({ canvas, sopra, motore, ui, qualita, abito = null }) {
    super({ canvas, sopra, ui, qualita, abito, cammina: (i, j) => motore.calpestabileInCasa(i, j), ingresso: INGRESSO,
            centro: { x: LARGHEZZA / 2, z: PROFONDITA / 2, r: 16 } })
    this.m = motore
    this.mobili = new Map()              // id → { grp, firma }
    this.badge = new Map()               // stanza da comprare → cartello
    this.mano = null                     // il mobile in mano: { tipo, id, i, j, rot, colore, trama, grp, ok }
    this.prova = null                    // pavimento e pareti in prova: { stanza, finitura }, finché non si pagano
    this._qui = 0                        // la stanza dove sta il contadino (sulle porte, l'ultima)
    this._firmaStanze = ''
    this.sincronizza()
  }

  // ── cosa si vede: stanze e muri (rifatti quando cambiano le stanze o le loro finiture), mobili (uno per uno) ──
  sincronizza() {
    const I = this.m.s.interni, firma = JSON.stringify([I.stanze, I.finiture, this.prova])
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
    this.svuotaStanze()
    const tua = id => I.stanze.includes(id), fin = id => this.prova?.stanza === id ? this.prova.finitura : I.finiture[id]
    for (const id of I.stanze) {                                          // i pavimenti: fino a metà del muro, così fra muro e stanza non c'è il buio
      const { i0, j0 } = origine(STANZE[id]), p = PAVIMENTI.find(x => x.id === fin(id).pavimento) || PAVIMENTI[0]
      this.pavimento(i0 - 0.5, j0 - 0.5, STANZA.w + 1, STANZA.d + 1, pavimentoDi(p))
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
    for (const l of lati) this._muro(l, fin)
    // le stanze da comprare: il pavimento accennato e un cartello col prezzo
    for (const st of this.m.vistaInterni().stanze) {
      const b = this.badge.get(st.id)
      if (st.apribile) {
        this.badge.set(st.id, b || this.fx.nuovoBadge()); this._prezzoStanza = st.prezzo
        this._inVendita(STANZE[st.id])
      } else if (b) { b.togli(); this.badge.delete(st.id) }
    }
  }
  _inVendita(s) {
    const { i0, j0 } = origine(s), geo = new THREE.PlaneGeometry(STANZA.w, STANZA.d); geo.rotateX(-Math.PI / 2)
    const pav = new THREE.Mesh(geo, pavimentoInVendita()); pav.position.set(i0 + STANZA.w / 2, 0.01, j0 + STANZA.d / 2)
    this.stanze.add(pav)
  }
  /** Un muro lungo un lato di `s`: dritto o con la porta. Ogni faccia col colore della sua stanza; fuori, i tronchi della casa. */
  _muro({ s, v, dc, dr }, fin) {
    const { i0, j0 } = origine(s), W = STANZA.w, D = STANZA.d, orizzontale = dr !== 0
    let buco = null
    if (v) { const p = portaFra(s, v); buco = orizzontale ? p.i : p.j }
    else if (s.id === 0 && dr > 0) buco = PORTA_DI_CASA.i                                                    // la porta di casa
    this.muro({
      orizzontale, buco, verso: orizzontale ? dr : dc,
      linea: orizzontale ? (dr < 0 ? j0 - 0.5 : j0 + D + 0.5) : (dc < 0 ? i0 - 0.5 : i0 + W + 0.5),        // il centro della riga di muro
      da: orizzontale ? i0 - 1 : j0 - 1, a: orizzontale ? i0 + W + 1 : j0 + D + 1,                         // anche gli angoli
      dentro: muroDi(fin(s.id)), fuori: v ? muroDi(fin(v.id)) : muroEsterno(),
    })
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
  /** Il cartello sotto il dito: sta sul muro, sopra un pavimento che è tuo, quindi non basta guardare la cella. */
  _cartelloSotto(cx, cy) {
    for (const [id, b] of this.badge) {
      if (!b.visto) continue
      const r = b.el.getBoundingClientRect()
      if (cx > r.left - DITO_LARGO && cx < r.right + DITO_LARGO && cy > r.top - DITO_LARGO && cy < r.bottom + DITO_LARGO) return id
    }
    return null
  }
  tocca(x, y) {
    const { ui, eroe } = this
    if (this.mano) return this.portaInMano(x, y)
    const cartello = this._cartelloSotto(x, y)
    if (cartello !== null) return ui.offriStanza(cartello)
    const id = this.mobileSotto(x, y)
    if (id !== null) return ui.apriMobile(id)                             // il tocco apre le sue opzioni, anche per l'armadio; tenere premuto lo solleva (`daTenere`)
    const p = this.puntaSuolo(x, y); if (!p) return
    const i = Math.floor(p.x), j = Math.floor(p.z), s = stanzaDi(i, j), I = this.m.s.interni
    if ((i === PORTA_DI_CASA.i && j >= PORTA_DI_CASA.j) || (j > PORTA_DI_CASA.j && Math.abs(i - PORTA_DI_CASA.i) <= 2)) {       // la porta di casa, o fuori davanti: si esce
      return void eroe.vaiA([[PORTA_DI_CASA.i, PORTA_DI_CASA.j]], () => ui.esci(), null)
    }
    if (s && !I.stanze.includes(s.id)) { if (I.stanze.some(t => confinano(STANZE[t], s))) ui.offriStanza(s.id); return }
    this.vaiVicino(i, j)
  }
  /** «Apri l'armadio»: il contadino ci va davanti e lo apre. */
  apriArmadio(o) {
    const { ui, eroe } = this, x0 = misureMobile(o.tipo, o.rot), centro = new THREE.Vector3(o.i + x0.w / 2, 0, o.j + x0.d / 2)
    if (!eroe.vaiA(this.celleAttorno(o), () => { eroe.faccia(centro); ui.apriGuardaroba() }, centro)) ui.apriGuardaroba()       // murato: si apre lo stesso
  }
  daTenere(x, y) { const id = this.mobileSotto(x, y); return id === null ? null : () => this.solleva(id, x, y) }
  get inMano() { return !!this.mano }

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
  /** Tenuto premuto: il mobile si stacca e segue il dito, tenendo il punto che ha preso (docs/core/il-dito.md). */
  solleva(id, x, y) {
    this.prendi(id)
    const h = this.mano, p = this.puntaSuolo(x, y), d = misureMobile(h.tipo, h.rot)
    h.tenuto = true; h.presa = p ? scartoDellaPresa(p, h.i, h.j, d.w, d.d) : null
    this._aggiornaMano()
  }
  /** Il dito si stacca: se ci sta è già posato; se no torna dov'era e il contadino dice perché. `su` falso: il tocco è stato annullato. */
  lasciaDalDito(su = true) {
    const h = this.mano; if (!h || !h.tenuto) return
    const motivo = h.motivo
    if (su && h.ok && this.posaMano().ok) return
    this.lasciaMano()
    if (su) this.ui.rifiuto({ motivo })
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
    const r = this.m.mobileCiSta(h.tipo, h.i, h.j, h.rot, h.id); h.ok = r.ok; h.motivo = r.motivo || null
    tingi(h.grp, h.ok)
    this.ui.mano({ tipo: h.tipo, nuovo: h.id === null, ok: h.ok, motivo: h.motivo, gira: ruotabileMobile(h.tipo), prezzo: h.id === null ? MOBILI[h.tipo].prezzo : 0, tenuto: !!h.tenuto })
  }
  /** Il dito porta il mobile in mano: il centro del mobile sotto il dito. */
  portaInMano(x, y) {
    const h = this.mano, p = this.puntaSuolo(x, y); if (!h || !p) return
    if (h.tenuto) h.dito = { x, y }
    const d = misureMobile(h.tipo, h.rot), { i, j } = cellaSottoIlDito(p, d.w, d.d, h.presa)
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

  /** Dopo che il motore ha cambiato qualcosa (un colore, un mobile messo via). */
  cambiato() { this.sincronizza() }
  /** Una stanza comprata: la festa dove prima c'era il tratteggio. */
  stanzaComprata(id) {
    this.sincronizza()
    const { i0, j0 } = origine(STANZE[id])
    this.fx.scoppietta(new THREE.Vector3(i0 + STANZA.w / 2, 0.8, j0 + STANZA.d / 2), 0xffd24a, 28, 4, 4)
  }
  /** La stanza dove sta il contadino. */
  stanzaQui() { return this._qui }
  /** La camera sulla stanza di cui si scelgono i colori; la riporta sul contadino `tornaAllEroe`. */
  guardaStanza(id) { const { i0, j0 } = origine(STANZE[id]); Object.assign(this.camera.libera, { on: true, x: i0 + STANZA.w / 2, z: j0 + STANZA.d / 2 + SOPRA_LA_STRISCIA }) }
  /** Mostra una stanza con pavimento e pareti in prova (`finitura`), o com'è davvero (`stanza` null). */
  provaFinitura(stanza, finitura = null) { this.prova = stanza === null ? null : { stanza, finitura }; this.sincronizza() }
  /** L'anteprima di un mobile col suo colore (`mobile:<tipo>:<colore>:<trama>`), fotografata col renderer di qui. */
  anteprima(chiave) {
    if (!this._anteprime) this._anteprime = creaAnteprime(this.renderer, k => { const [, t, c, tr] = k.split(':'); return creaMobile(t, c, tr === 'null' ? null : tr) })
    return this._anteprime.chiedi(chiave)
  }
  anteprimaPronta(chiave) { return this._anteprime ? this._anteprime.leggi(chiave) : null }

  /** Dove si aprirebbe la stanza `id`: il punto del muro della sua porta più vicina al contadino. */
  _portaVerso(id) {
    const e = this.eroe, porte = this.m.s.interni.stanze.filter(t => confinano(STANZE[t], STANZE[id])).map(t => portaFra(STANZE[t], STANZE[id]))
    const lontano = p => Math.hypot(p.i + 0.5 - e.x, p.j + 0.5 - e.z)
    return porte.reduce((a, b) => lontano(b) < lontano(a) ? b : a)
  }
  /** I cartelli delle stanze da comprare, sul muro dove si aprirebbe la porta: se è fuori schermo restano sul bordo con la freccia, perché si
      compra solo da lì. Con un mobile in mano o un colore in prova non si vedono. */
  aggiorna(dt) {
    this._scorriColMobile(dt)
    const qui = stanzaDi(Math.floor(this.eroe.x), Math.floor(this.eroe.z)), { width: W, height: H } = this.rect
    if (qui && this.m.s.interni.stanze.includes(qui.id)) this._qui = qui.id
    for (const [id, b] of this.badge) {
      const p = this._portaVerso(id), [x, y] = this.proietta(new THREE.Vector3(p.i + 0.5, 0, p.j + 0.5), CARTELLO_ALTO)
      const cx = Math.max(BORDO_LATI, Math.min(W - BORDO_LATI, x)), cy = Math.max(BORDO_SU, Math.min(H - BORDO_GIU, y))
      b.imposta(`${x < cx ? '← ' : x > cx ? '→ ' : y < cy ? '↑ ' : y > cy ? '↓ ' : ''}＋ 🪙 ${this._prezzoStanza}`, 'vendita')
      b.metti(cx, cy, !this.mano && !this.prova, true)
    }
  }
  /** Col mobile tenuto al dito contro il bordo la vista scorre, e il mobile resta sotto il dito. */
  _scorriColMobile(dt) {
    const t = this.mano?.dito; if (!t || !this.mano.tenuto) return
    const r = this.rect, v = velocitaBordo(t.x, t.y, { sinistra: r.left, destra: r.right, alto: r.top + BORDO_SU, basso: r.bottom - BORDO_GIU })
    if (!v.x && !v.z) return
    this.camera.scorri(v.x * dt, v.z * dt); this.camera.cam.updateMatrixWorld()
    this.portaInMano(t.x, t.y)
  }
  via() {
    for (const b of this.badge.values()) b.el.remove()
    this.lasciaMano(false); this._anteprime?.via()
    super.via()
  }
}
const I0 = casa => casa.m.s.interni.stanze[0]
