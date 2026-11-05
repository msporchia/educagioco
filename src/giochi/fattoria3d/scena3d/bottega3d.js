// Dentro una bottega del paese (docs/fattoria3d/botteghe.md, «Dentro»), sopra la base degli interni (interno3d.js): la sala col bancone,
// tre tavolini e i clienti, che sono persone vere (il corpo del contadino con un abito suo: dati/dentro-botteghe.js). Un cliente entra
// dalla porta, va al suo tavolino e aspetta col fumetto di quello che vuole; servito (o mandato via) esce, e il posto resta vuoto finché
// non arriva il prossimo, coi minuti del motore. Le regole sono di motore/botteghe.js: qui si legge `vistaBottega` e si mostra.
//
// `ui`: cambio(), fogliAperti(), servi(id), apriElenco(), esci(), fumetti(lista).
import * as THREE from 'three'
import { Interno3d, pavimentoDi, muroDi, muroEsterno } from './interno3d.js'
import { Eroe } from './eroe.js'
import { mat, scatola, cilindro, sfera, testoTex } from './modelli.js'
import { creaMobile } from './mobili.js'
import { SALA, PORTA, INGRESSO_SALA, POSTI, TEMI, calpestabileInSala, abitoDelCliente } from '../dati/dentro-botteghe.js'

const OGNI = 0.4                          // ogni quanto si rilegge la bottega (s)

export class Bottega3d extends Interno3d {
  constructor({ canvas, sopra, motore, ui, qualita, abito = null, tipo, nome }) {
    super({ canvas, sopra, ui, qualita, abito, cammina: calpestabileInSala, ingresso: INGRESSO_SALA,
            centro: { x: SALA.i0 + SALA.w / 2, z: SALA.j0 + SALA.d / 2, r: 10 } })
    this.m = motore; this.tipo = tipo; this.tema = TEMI[tipo] || TEMI.bottega_pasticceria
    this.clienti = new Map()               // id del cliente → { eroe, k, stato: 'entra' | 'qui' | 'esce' }
    this.attesa = 0; this._firma = ''
    this._sala(nome)
    this._leggi()
  }

  // ── la sala: pavimento, muri, bancone con la merce della bottega, tavolini, un po' di arredo ──
  _sala(nome) {
    const { i0, j0, w, d } = SALA, t = this.tema
    this.svuotaStanze()
    this.pavimento(i0 - 0.5, j0 - 0.5, w + 1, d + 1, pavimentoDi(t.pavimento))
    const dentro = muroDi({ pareti: t.pareti, carta: t.carta }), fuori = muroEsterno()
    this.muro({ orizzontale: true, linea: j0 - 0.5, da: i0 - 1, a: i0 + w + 1, dentro, fuori, verso: -1 })
    this.muro({ orizzontale: true, linea: j0 + d + 0.5, da: i0 - 1, a: i0 + w + 1, buco: PORTA.i, dentro, fuori, verso: 1 })
    this.muro({ orizzontale: false, linea: i0 - 0.5, da: j0 - 1, a: j0 + d + 1, dentro, fuori, verso: -1 })
    this.muro({ orizzontale: false, linea: i0 + w + 0.5, da: j0 - 1, a: j0 + d + 1, dentro, fuori, verso: 1 })

    const g = new THREE.Group(), legno = mat(t.bancone), piano = mat(0xf3ead8)
    const bx = i0 + w / 2, bz = j0 + 0.5
    scatola(g, w - 2, 0.9, 0.8, legno, bx, 0.45, bz); scatola(g, w - 1.9, 0.08, 0.9, piano, bx, 0.94, bz)
    this._merce(g, t.merce, bx, bz, w - 2)
    if (typeof document !== 'undefined') {                                   // l'insegna sulla parete di fondo
      const ins = new THREE.Mesh(new THREE.PlaneGeometry(3.2, 0.6), new THREE.MeshStandardMaterial({ map: testoTex(nome, { sfondo: t.bancone }), roughness: 0.8 }))
      ins.position.set(bx, 1.85, j0 - 0.36); g.add(ins)
    }
    for (const p of POSTI) {                                                 // i tavolini: tondi, una gamba sola
      const x = p.tavolo.i + 0.5, z = p.tavolo.j + 0.5
      cilindro(g, 0.42, 0.42, 0.06, piano, x, 0.62, z, 16); cilindro(g, 0.06, 0.08, 0.6, mat(0x5a3a22), x, 0.3, z, 8)
      sfera(g, 0.08, mat(t.bancone), x + 0.12, 0.7, z - 0.05, 1, 0.7, 1, 8)
    }
    for (const [tipo, i, j] of [['pianta', i0, j0], ['pianta', i0 + w - 1, j0], ['pianta', i0, j0 + d - 1], ['pianta', i0 + w - 1, j0 + d - 1]]) {
      const m = creaMobile(tipo, 'bianco'); m.position.set(i + 0.5, 0, j + 0.5); g.add(m)
    }
    const orologio = creaMobile('orologio', 'rosso'); orologio.position.set(i0 + 0.5, 0.35, j0 + 0.5); g.add(orologio)
    this.stanze.add(g)
  }
  /** Sopra il bancone, quello che la bottega vende: torte, botti, vassoi, bobine. */
  _merce(g, merce, bx, bz, largo) {
    const colori = [0xf29ac0, 0xf6d36b, 0xd9534f, 0x9b6fd1, 0x6fbf73, 0x63b3ed]
    for (let k = 0; k < 6; k++) {
      const x = bx - largo / 2 + 0.6 + k * (largo - 1.2) / 5, c = mat(colori[k % colori.length])
      if (merce === 'torte') { cilindro(g, 0.24, 0.26, 0.2, c, x, 1.08, bz, 14); cilindro(g, 0.25, 0.25, 0.04, mat(0xfff4e6), x, 1.2, bz, 14); sfera(g, 0.05, mat(0xd9534f), x, 1.25, bz, 1, 1, 1, 6) }
      else if (merce === 'botti') { const b = cilindro(g, 0.24, 0.24, 0.42, mat(0x8a5a33), x, 1.22, bz, 12); b.rotation.z = Math.PI / 2; cilindro(g, 0.255, 0.255, 0.04, mat(0x4a4a50), x, 1.22, bz, 12).rotation.z = Math.PI / 2 }
      else if (merce === 'vassoi') { scatola(g, 0.5, 0.04, 0.34, mat(0x9aa0a6), x, 1.0, bz); sfera(g, 0.09, c, x - 0.1, 1.08, bz, 1, 0.7, 1, 8); cilindro(g, 0.06, 0.05, 0.14, mat(0xf4f2ec), x + 0.13, 1.1, bz, 8) }
      else { cilindro(g, 0.13, 0.13, 0.26, c, x, 1.11, bz, 12); cilindro(g, 0.15, 0.15, 0.03, mat(0x8a5a33), x, 0.99, bz, 12); cilindro(g, 0.15, 0.15, 0.03, mat(0x8a5a33), x, 1.25, bz, 12) }
    }
  }

  // ── i clienti: si legge la bottega e si fanno entrare, aspettare, uscire ──
  _leggi() {
    const v = this.m.vistaBottega(this.tipo)
    if (!v || v.stato !== 'aperta') return
    this.vista = v
    const presenti = new Set()
    for (const b of v.banconi) {
      if (!b.cliente || !POSTI[b.i]) continue
      presenti.add(b.id)
      if (this.clienti.has(b.id)) continue
      const e = new Eroe(this.scena, this.strada, this.fx, abitoDelCliente(b.cliente.nome, `${this.tipo}:${b.id}`))
      e.x = PORTA.i + 0.5; e.z = PORTA.j + 0.5; e.dir = Math.PI
      const c = { eroe: e, k: b.i, stato: 'entra' }
      const posto = POSTI[b.i].cliente
      if (!e.vaiA([[posto.i, posto.j]], () => { c.stato = 'qui'; e.dir = 0 }, null)) { e.x = posto.i + 0.5; e.z = posto.j + 0.5; c.stato = 'qui'; e.dir = 0 }
      e.grp.userData.cliente = b.id
      this.clienti.set(b.id, c)
    }
    for (const [id, c] of this.clienti) {
      if (presenti.has(id) || c.stato === 'esce') continue
      c.stato = 'esce'                                                       // servito o mandato via: se ne va dalla porta
      if (!c.eroe.vaiA([[PORTA.i, PORTA.j]], () => this._via(id), null)) this._via(id)
    }
    const firma = JSON.stringify(v.banconi.map(b => [b.id, b.pronto, b.minuti]))
    if (firma !== this._firma) { this._firma = firma; this._dici() }
  }
  _via(id) { const c = this.clienti.get(id); if (c) { c.eroe.grp.removeFromParent(); this.clienti.delete(id); this._dici() } }
  /** Dice alla vista cosa scrivere nei fumetti: chi aspetta (e cosa vuole) e i posti vuoti coi minuti. Dove stanno lo dice `aggiorna`. */
  _dici() {
    if (!this.vista) return
    this.ui.fumetti(this.vista.banconi.map(b => {
      const c = b.cliente ? this.clienti.get(b.id) : null
      return b.cliente ? { k: b.i, id: b.id, qui: !!c && c.stato === 'qui', cliente: b.cliente, chiede: b.chiede, pronto: b.pronto, xp: b.xp } : { k: b.i, attesa: true, minuti: b.minuti }
    }))
  }

  /** Un festeggiamento dopo una consegna: il numero che vola sopra il cliente e il contadino che salta. */
  festeggia(id, testo) {
    const c = this.clienti.get(id), p = c ? c.eroe.posizione : this.eroe.posizione
    this.fx.volo(testo, p, 1.7)
    if (!this.eroe.az) this.eroe.avvia('esulta', 0.9)
  }

  // ── il tocco ──
  clienteSotto(cx, cy) {
    const rg = this._raggio(cx, cy)
    for (const [id, c] of this.clienti) if (c.stato === 'qui' && rg.ray.distanceToPoint(new THREE.Vector3(c.eroe.x, 0.5, c.eroe.z)) < 0.6) return id
    const p = this.puntaSuolo(cx, cy); if (!p) return null                  // il dito è largo: anche il tavolino e il posto
    const i = Math.floor(p.x), j = Math.floor(p.z), posto = POSTI.find(q => q.tavolo.i === i && (j === q.tavolo.j || j === q.cliente.j))
    if (!posto) return null
    for (const [id, c] of this.clienti) if (c.k === posto.k && c.stato === 'qui') return id
    return { vuoto: posto.k }
  }
  tocca(x, y) {
    const { ui, eroe } = this, chi = this.clienteSotto(x, y)
    if (chi && chi.vuoto !== undefined) {
      const b = this.vista && this.vista.banconi[chi.vuoto]
      return void this.fx.parla(b && b.attesa ? `Arriva qualcuno fra ${Math.max(1, b.minuti)} minuti` : 'Qui non c\'è nessuno')
    }
    if (chi !== null) return this.servizio(chi)                            // un cliente: il contadino va a servirlo
    const p = this.puntaSuolo(x, y); if (!p) return
    const i = Math.floor(p.x), j = Math.floor(p.z)
    if (j >= PORTA.j && Math.abs(i - PORTA.i) <= 2) return void eroe.vaiA([[PORTA.i, PORTA.j]], () => ui.esci(), null)       // la porta: si esce
    if (j === SALA.j0 && i >= SALA.i0 && i < SALA.i0 + SALA.w) return ui.apriElenco()                                             // il bancone: tutti i clienti
    this.vaiVicino(i, j)
  }

  /** Il contadino va al tavolino del cliente `id` e, arrivato, lo serve (la consegna la fa la vista). */
  servizio(id) {
    const c = this.clienti.get(id), { eroe, ui } = this; if (!c || c.stato !== 'qui' || eroe.az) return
    const s = POSTI[c.k].servi, verso = new THREE.Vector3(c.eroe.x, 0, c.eroe.z)
    if (!eroe.vaiA([[s.i, s.j], [s.i - 1, s.j], [s.i + 1, s.j]], () => { eroe.faccia(verso); ui.servi(id) }, verso)) ui.servi(id)
  }

  aggiorna(dt, tt) {
    this.attesa -= dt
    if (this.attesa <= 0) {
      this.attesa = OGNI
      if (this.m.tick()) this.ui.cambio()                                   // l'orologio: il prossimo cliente arriva anche con la fattoria ferma
      this._leggi()
    }
    for (const c of this.clienti.values()) {
      const prima = c.stato
      c.eroe.aggiorna(dt, tt)
      if (c.stato === 'qui' && prima !== 'qui') this._dici()
      if (c.stato === 'qui' && !c.eroe.az && c.eroe.percorso.length === 0) {         // aspetta guardando il contadino quando è vicino, se no la sala
        const vicino = Math.hypot(this.eroe.x - c.eroe.x, this.eroe.z - c.eroe.z) < 2.5
        c.eroe.dir += ((vicino ? Math.atan2(this.eroe.x - c.eroe.x, this.eroe.z - c.eroe.z) : 0) - c.eroe.dir) * Math.min(1, dt * 4)
      }
    }
    // i fumetti stanno sopra la testa di chi aspetta e sopra il posto vuoto: la vista li ha scritti, qui si mettono al loro posto
    const fogli = this.sopra.parentElement?.querySelectorAll('[data-fumetto-posto]') || []
    for (const el of fogli) {
      const k = +el.dataset.fumettoPosto, p = POSTI[k]; if (!p) continue
      const [x, y, visto] = this.proietta(new THREE.Vector3(p.cliente.i + 0.5, 0, p.cliente.j + 0.5), el.dataset.vuoto ? 0.5 : 1.75)
      el.style.transform = `translate(${x}px, ${y}px) translate(-50%, -100%)`
      el.style.visibility = visto ? 'visible' : 'hidden'
    }
  }
  via() { for (const c of this.clienti.values()) c.eroe.grp.removeFromParent(); this.clienti.clear(); super.via() }
}
