// I pezzi in scena: un gruppo per ogni cosa del motore (e per i due edifici unici), tenuti allineati a quello che il motore dice e
// animati ogni fotogramma (il grano che cresce, le pecore che vagano, la fontana, il fumo del forno, il pallone che parte).
// Non sa le regole: legge lo stato e disegna. I cartelli sugli edifici (prezzo, cottura) sono qui.
import * as THREE from 'three'
import { creaCampo, aggiornaCampo, creaPasticceria, creaMongolfiera, creaBancarella, creaFontana, creaRecinto, muoviPecore,
         sincronizzaPecore, fantasma } from './modelli.js'
import { EDIFICI, PEZZI } from '../dati/catalogo.js'
import { RICETTE, FORNO_POSTI } from '../dati/ricette.js'
import { MONGOLFIERA } from '../dati/regole.js'


const CREA = {
  campo: () => creaCampo(Math.random() * 99 + 1),
  recinto: c => creaRecinto(c && c.pecore),
  bancarella: () => creaBancarella(),
  fontana: () => creaFontana(),
}
const CREA_EDIFICIO = { pasticceria: creaPasticceria, mongolfiera: creaMongolfiera }

export const centroDi = (c, d) => new THREE.Vector3(c.i + d.w / 2, 0, c.j + d.d / 2)

export class Pezzi {
  constructor(scena, motore, effetti, vista, qualita) {
    this.scena = scena; this.m = motore; this.fx = effetti; this.vista = vista; this.q = qualita
    this.voci = new Map()           // id (numero) o tipo (edificio) → voce
    this.tFumo = 0
    this.sincronizza()
  }

  /** Allinea i gruppi alle cose del motore: ne crea di nuovi, toglie quelli spariti, rifà un edificio appena comprato. */
  sincronizza() {
    const vivi = new Set()
    for (const c of this.m.cose) {
      vivi.add(c.id)
      if (!this.voci.has(c.id)) this._creaCosa(c)
      else if (c.pecore) sincronizzaPecore(this.voci.get(c.id).grp, c.pecore)
    }
    for (const tipo of Object.keys(EDIFICI)) {
      vivi.add(tipo)
      const mio = !!this.m.s.posseduti[tipo], v = this.voci.get(tipo)
      if (!v) this._creaEdificio(tipo, mio)
      else if (v.mio !== mio) { this._togli(tipo); this._creaEdificio(tipo, mio) }
    }
    for (const id of [...this.voci.keys()]) if (!vivi.has(id)) this._togli(id)
    // ciò che si è mosso: la posizione la dice il motore
    for (const c of this.m.cose) { const v = this.voci.get(c.id); if (v && !v.nasce) v.grp.position.copy(centroDi(c, PEZZI[c.tipo])) }
  }

  _creaCosa(c) {
    const d = PEZZI[c.tipo], grp = CREA[c.tipo](c)
    grp.userData.bersaglio = { kind: 'cosa', id: c.id }
    grp.position.copy(centroDi(c, d)); this.scena.add(grp)
    this.voci.set(c.id, { id: c.id, kind: 'cosa', c, d, grp, badge: null, anello: null, salto: 0, nasce: undefined, richiamo: null, chiave: '' })
  }
  _creaEdificio(tipo, mio) {
    const e = EDIFICI[tipo], grp = CREA_EDIFICIO[tipo]()
    if (!mio) fantasma(grp)
    grp.userData.bersaglio = { kind: 'edificio', tipo }
    grp.position.copy(centroDi({ i: e.slot.i, j: e.slot.j }, e)); this.scena.add(grp)
    this.voci.set(tipo, { id: tipo, kind: 'edificio', tipo, mio, d: e, grp, badge: this.fx.nuovoBadge(), anello: null })
  }
  _togli(id) {
    const v = this.voci.get(id); if (!v) return
    this.scena.remove(v.grp); v.badge?.togli()
    if (v.anello) this.scena.remove(v.anello)
    this.voci.delete(id)
  }

  /** Il modello di un pezzo di quel tipo, per il fantasma di chi lo sta trascinando. */
  modello(tipo, c) { return CREA[tipo](c) }

  /** Un pezzo appena messo: compare con un piccolo rimbalzo. */
  fanNascere(id) { const v = this.voci.get(id); if (v) { v.nasce = 0; v.grp.scale.setScalar(0.01) } }
  salta(id) { const v = this.voci.get(id); if (v) v.salto = 0.5 }
  richiama(id, verso) { const v = this.voci.get(id); if (v) v.richiamo = verso }
  nascondi(id, si) { const v = this.voci.get(id); if (v) v.grp.visible = !si }
  gruppi() { return [...this.voci.values()].map(v => v.grp) }
  voce(id) { return this.voci.get(id) }
  centroDi(bersaglio) {
    const v = this.voci.get(bersaglio.kind === 'cosa' ? bersaglio.id : bersaglio.tipo)
    return centroDi(bersaglio.kind === 'cosa' ? v.c : { i: v.d.slot.i, j: v.d.slot.j }, v.d)
  }

  /** L'anello giallo attorno a ciò che è in coda: sta sul terreno, non gira per lo schermo. */
  segnaCoda(id, si) {
    const v = this.voci.get(id); if (!v) return
    if (si && !v.anello) {
      const r = Math.max(v.d.w, v.d.d) * 0.62
      v.anello = new THREE.Mesh(new THREE.RingGeometry(r, r + 0.12, 28), new THREE.MeshBasicMaterial({ color: 0xffc830, side: THREE.DoubleSide, transparent: true, opacity: 0.9 }))
      v.anello.rotation.x = -Math.PI / 2; v.anello.position.y = 0.2; v.grp.add(v.anello)
    }
    if (v.anello) v.anello.visible = !!si
  }

  aggiorna(dt, tt) {
    const adesso = this.m.ora()
    for (const v of this.voci.values()) {
      const g = v.grp
      if (v.kind === 'cosa') this._cosa(v, g, dt, tt, adesso)
      else this._edificio(v, g, dt, tt, adesso)
      if (v.badge && !v.badge.el.hidden && g.visible) {
        const [x, y, visto] = this.vista.proietta(g.position, g.userData.altezza || 1.6)
        v.badge.metti(x, y, visto)
      }
    }
  }

  _cosa(v, g, dt, tt, adesso) {
    const c = v.c
    if (v.nasce !== undefined) {
      v.nasce = Math.min(1, v.nasce + dt * 3); const s = 1 + Math.sin(v.nasce * Math.PI) * 0.15
      g.scale.setScalar(Math.max(0.01, v.nasce * s))
      if (v.nasce >= 1) { g.scale.setScalar(1); v.nasce = undefined }
    }
    if (v.salto) { v.salto -= dt * 1.2; g.position.y = Math.max(0, Math.sin(v.salto * Math.PI * 2)) * 0.18; if (v.salto <= 0) { v.salto = 0; g.position.y = 0 } }
    if (c.tipo === 'campo') {
      const cr = this.m.crescita(c), chiave = cr.map(x => x.toFixed(2)).join(), col = c.coltura || 'grano'
      if (this.q.vento || chiave !== v.chiave) { v.chiave = chiave; aggiornaCampo(g, cr, tt, col, this.q.vento) }
    } else if (c.tipo === 'recinto') {
      muoviPecore(g, dt, tt, v.richiamo, c.pecore, adesso); v.richiamo = null
    } else if (c.tipo === 'fontana') g.userData.anima(tt)
  }

  _edificio(v, g, dt, tt, adesso) {
    const s = this.m.s, e = v.d
    if (!v.mio) { v.badge.imposta(`🪙 ${e.prezzo} · ${e.nome}`, 'vendita'); return }
    if (v.tipo === 'pasticceria') {
      const P = s.pasticceria
      if (g.userData.gira) g.userData.gira.rotation.y += dt * 0.8
      if (P.coda.length && tt - this.tFumo > 0.35) { this.tFumo = tt; this.fx.fumata(g.position.clone().add(g.userData.fumo)) }
      const pronti = this.m.prontiInForno(), prima = Object.keys(P.pronti).find(k => P.pronti[k] > 0)
      v.badge.imposta(pronti ? `${RICETTE[prima].emoji} ${pronti} pront${pronti === 1 ? 'o' : 'i'}!` : P.coda.length ? `🔥 ${Math.max(0, Math.ceil((P.coda[0].fine - adesso) / 1000))}s · ${P.coda.length}/${FORNO_POSTI}` : '', pronti ? 'pronto' : '')
    } else {
      const M = s.mongolfiera, volo = g.userData.volo
      let y = Math.sin(tt * 1.3) * 0.08, x = 0
      if (M.fine) {
        const sec = (adesso - M.fine + MONGOLFIERA.viaggioMs) / 1000, resta = (M.fine - adesso) / 1000
        const q = Math.min(Math.min(1, sec / 4), Math.min(1, resta / 4)); y += q * q * 40; x = q * 18
        volo.visible = q < 0.995
      } else volo.visible = true
      volo.position.set(x, y, 0); volo.rotation.z = Math.sin(tt * 0.9) * 0.02
      g.userData.fiamma.scale.set(1, 1.2 + Math.sin(tt * 14) * 0.4, 1)
      v.badge.imposta(M.cassa ? '🧳 è tornata!' : M.fine ? `☁️ ${Math.max(0, Math.ceil((M.fine - adesso) / 1000))}s` : '', M.cassa ? 'pronto' : '')
    }
  }

  via() { for (const id of [...this.voci.keys()]) this._togli(id) }
}
