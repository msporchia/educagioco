// I pezzi in scena: un gruppo per ogni cosa del motore (e per i due edifici unici), tenuti allineati a quello che il motore dice e
// animati ogni fotogramma (il grano che cresce, le pecore che vagano, la fontana, il fumo del forno, il pallone che parte).
// Non sa le regole: legge lo stato e disegna. I cartelli sugli edifici (prezzo, cottura) sono qui.
import * as THREE from 'three'
import { creaCampo, aggiornaCampo, creaPasticceria, creaMongolfiera, creaBancarella, creaBacheca, creaFontana, creaRecinto, muoviPecore,
         sincronizzaPecore, fantasma, creaMulino, creaPanificio, creaConserviera, creaGelateria, creaAiuola, creaPanchina,
         creaPozzo, creaSpaventapasseri, creaTrattore, creaSegnaposto, creaPollaio, creaStalla, creaCaseificio, sincronizzaBestie, muoviBestie } from './modelli.js'
import { creaPonte, creaPasserella, creaTavolo } from './modelli-passaggi.js'
import { EDIFICI, PEZZI } from '../dati/catalogo.js'
import { RICETTE, MACCHINE } from '../dati/ricette.js'
import { MONGOLFIERA } from '../dati/regole.js'
import { ANIMALI, PRODOTTI_ANIMALI } from '../dati/animali.js'


const CREA = {
  campo: () => creaCampo(Math.random() * 99 + 1),
  recinto: c => creaRecinto(c && c.pecore),
  pollaio: c => creaPollaio(c && c.bestie),
  stalla: c => creaStalla(c && c.bestie),
  bancarella: () => creaBancarella(),
  bacheca: () => creaBacheca(),
  fontana: () => creaFontana(),
  aiuola: () => creaAiuola(),
  panchina: () => creaPanchina(),
  pozzo: () => creaPozzo(),
  spaventapasseri: () => creaSpaventapasseri(),
  trattore: () => creaTrattore(),
  ponte: () => creaPonte(),
  passerella: () => creaPasserella(),
  tavolo: () => creaTavolo(),
}
const CREA_EDIFICIO = {
  pasticceria: creaPasticceria, mongolfiera: creaMongolfiera,
  mulino: creaMulino, panificio: creaPanificio, conserviera: creaConserviera, gelateria: creaGelateria, caseificio: creaCaseificio,
}
/** Un tipo senza disegno non rompe la scena: una scatola grigia della sua misura. */
const modelloDi = (tipo, d, c) => (CREA[tipo] ? CREA[tipo](c) : creaSegnaposto(d.w, d.d))

export const centroDi = (c, d) => new THREE.Vector3(c.i + d.w / 2, 0, c.j + d.d / 2)

export class Pezzi {
  constructor(scena, motore, effetti, vista, qualita) {
    this.scena = scena; this.m = motore; this.fx = effetti; this.vista = vista; this.q = qualita
    this.voci = new Map()           // id (numero) o tipo (edificio) → voce
    this.tFumo = 0
    this.sulCompraBestia = null     // la porta verso il pulsante «＋» dei cartelli: la mette il mondo (scena3d/azioni.js `compraBestia`)
    this.sincronizza()
  }

  /** Allinea i gruppi alle cose del motore: ne crea di nuovi, toglie quelli spariti, rifà un edificio appena comprato. */
  sincronizza() {
    const vivi = new Set()
    for (const c of this.m.cose) {
      vivi.add(c.id)
      if (!this.voci.has(c.id)) this._creaCosa(c)
      else if (c.pecore) sincronizzaPecore(this.voci.get(c.id).grp, c.pecore)
      else if (c.bestie) sincronizzaBestie(this.voci.get(c.id).grp, c.bestie)
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
    const d = PEZZI[c.tipo], grp = modelloDi(c.tipo, d, c)
    grp.userData.bersaglio = { kind: 'cosa', id: c.id }
    grp.position.copy(centroDi(c, d)); this.scena.add(grp)
    this.voci.set(c.id, { id: c.id, kind: 'cosa', c, d, grp, badge: c.bestie || c.pecore ? this.fx.nuovoCartello(() => this.sulCompraBestia && this.sulCompraBestia(c.id)) : c.tipo === 'bacheca' ? this.fx.nuovoBadge() : null, anello: null, salto: 0, nasce: undefined, richiamo: null, chiave: '' })
  }
  _creaEdificio(tipo, mio) {
    const e = EDIFICI[tipo], grp = CREA_EDIFICIO[tipo] ? CREA_EDIFICIO[tipo]() : creaSegnaposto(e.w, e.d)
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
  modello(tipo, c) { return modelloDi(tipo, PEZZI[tipo], c) }

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
      } else if (v.badge && !g.visible) v.badge.el.style.visibility = 'hidden'      // un pezzo sollevato non lascia il suo cartello (e il suo «＋») a mezz'aria
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
      const lana = this.m.lanaPronta(c).length
      v.badge.imposta(lana ? `🧶 ${lana} pront${lana === 1 ? 'a' : 'e'}!` : '', lana ? 'pronto' : '')
      this._conto(v, c)
    } else if (c.bestie) {
      muoviBestie(g, dt, tt, c.bestie, adesso)
      // il cartello del cortile: quanto c'è da raccogliere, oppure i secondi che mancano, oppure che hanno fame
      const A = ANIMALI[c.tipo], pronte = c.bestie.filter(b => b.fine !== null && b.fine <= adesso).length
      const lavora = c.bestie.filter(b => b.fine !== null && b.fine > adesso).map(b => b.fine - adesso)
      const fame = c.bestie.some(b => b.fine === null)
      v.badge.imposta(pronte ? `${PRODOTTI_ANIMALI[A.prodotto].emoji} ${pronte} pront${pronte === 1 ? 'o' : 'i'}!`
        : fame ? `${A.emoji} ha fame` : lavora.length ? `⏳ ${Math.ceil(Math.min(...lavora) / 1000)}s` : '', pronte ? 'pronto' : '')
      this._conto(v, c)
    } else if (c.tipo === 'bacheca') {
      // i foglietti sono gli ordini aperti; sul cartello quelli che si possono consegnare adesso (come le macchine, i pronti)
      if (tt - (v.tOrdini ?? -9) > 0.5) {
        v.tOrdini = tt
        const aperti = this.m.ordini().filter(o => !o.attesa), pronti = aperti.filter(o => o.pronto).length
        g.userData.mostraFogli(Math.min(aperti.length, g.userData.fogli.length), aperti.map(o => o.tipo))
        v.badge.imposta(pronti ? `🧺 ${pronti} pront${pronti === 1 ? 'o' : 'i'}!` : '', pronti ? 'pronto' : '')
      }
    } else if (g.userData.anima) g.userData.anima(tt)              // fontana, spaventapasseri
  }

  /** Il conto «🐄 2/4» e il prezzo sul pulsante del cartello; il pulsante è spento (grigio, ma tocca) se mancano monete. */
  _conto(v, c) {
    const q = this.m.infoBestie(c)
    v.badge.bestie(q, !q.pieno && this.m.monete() < q.prezzo)
  }

  _edificio(v, g, dt, tt, adesso) {
    const s = this.m.s, e = v.d
    if (!v.mio) {
      const chiuso = e.liv > this.m.livello()                                   // un fantasma dice il prezzo, o il livello a cui arriva
      v.badge.imposta(chiuso ? `🔒 Livello ${e.liv} · ${e.nome}` : `🪙 ${e.prezzo} · ${e.nome}`, chiuso ? 'chiuso' : 'vendita'); return
    }
    if (MACCHINE[v.tipo]) {
      // ogni macchina: pronti da ritirare, oppure la cottura in corso e i posti occupati
      const Q = s.macchine[v.tipo], posti = MACCHINE[v.tipo].posti
      if (g.userData.gira) g.userData.gira.rotation.y += dt * 0.8
      if (g.userData.anima) g.userData.anima(dt, tt)
      const cuoce = Q.coda.length > 0, cadenza = cuoce ? 0.35 : v.tipo === 'pasticceria' ? Infinity : 0.6   // gli altri fumano anche a riposo
      if (g.userData.fumo && tt - (v.tFumo || 0) > cadenza) { v.tFumo = tt; this.fx.fumata(g.position.clone().add(g.userData.fumo)) }
      const pronti = this.m.prontiIn(v.tipo), prima = Object.keys(Q.pronti).find(k => Q.pronti[k] > 0)
      v.badge.imposta(pronti ? `${RICETTE[prima].emoji} ${pronti} pront${pronti === 1 ? 'o' : 'i'}!`
        : cuoce ? `🔥 ${Math.max(0, Math.ceil(((Q.coda[0].fine || adesso) - adesso) / 1000))}s · ${Q.coda.length}/${posti}` : '', pronti ? 'pronto' : '')
    } else if (v.tipo === 'mongolfiera') {
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
