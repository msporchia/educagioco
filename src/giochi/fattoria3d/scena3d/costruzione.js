// Costruire: dal menu «Costruisci qui» un pezzo va sulla cella premuta (se ci sta si compra e si mette in un gesto; se no resta lì il
// fantasma, «parcheggiato», e il dito lo sistema); un pezzo già messo si riprende tenendolo premuto e si trascina. Al rilascio si
// costruisce (e, se il pezzo non è ancora pagato, paga: un solo gesto); il fantasma mostra dove va, verde se ci sta e se bastano le
// monete. E le strade a pennello. Le regole di cosa ci sta sono del motore (`puoCompraEMettere`): qui si guida il fantasma, si chiede
// e si racconta.
import { misureDi } from '../dati/catalogo.js'     // PEZZI e EDIFICI: anche gli edifici si costruiscono e si spostano

import { dentro } from '../dati/mondo.js'
import { tingi, buttaFantasma } from './modelli.js'
import { dettoDi } from './azioni.js'
import { cellaSottoIlDito, scartoDellaPresa, dentroIlPezzo, velocitaBordo, SOLLEVA_PX, SOPRA_UI_PX, SOTTO_UI_PX } from './trascinamento-puro.js'

// WYSIWYG: la cella del fantasma è quella dove si costruisce. Il centro del pezzo cade sul punto del suolo che il dito tiene (vedi
// `trascinamento-puro.js`): un pezzo nuovo `SOLLEVA_PX` più in su del dito (nello schermo, non nel mondo), uno già messo o già
// parcheggiato dov'era rispetto al dito al momento della presa.

const PRESA_NUOVO = { px: SOLLEVA_PX, off: { x: 0, z: 0 } }

function lineaDiCelle(a, b) {
  const out = []; let [i, j] = a; const [i1, j1] = b
  const di = Math.abs(i1 - i), dj = -Math.abs(j1 - j), si = i < i1 ? 1 : -1, sj = j < j1 ? 1 : -1; let err = di + dj
  for (let n = 0; n < 80; n++) {
    out.push([i, j]); if (i === i1 && j === j1) break
    const e2 = 2 * err; if (e2 >= dj) { err += dj; i += si } if (e2 <= di) { err += di; j += sj }
  }
  return out
}

export class Costruzione {
  constructor(ctx) {
    this.c = ctx
    this.D = { attivo: false, tipo: null, spostando: null, parcheggiato: false, i: 0, j: 0, ok: false, fant: null, presa: PRESA_NUOVO, dentro: false, dito: null }
    this.tratto = null; this.ultimaCella = null
    this.pennelloDito = null        // il dito che disegna: { x, y, gesto }, per scorrere ai bordi anche da fermo
    this._camPrima = null
  }
  get m() { return this.c.m }
  get attivo() { return this.D.attivo }
  /** Un fantasma scelto dal menu che aspetta un posto: il dito lo trascina o lo tocca (`dito.js`). */
  get parcheggiato() { return this.D.attivo && this.D.parcheggiato }

  // ── il fantasma ──
  /** Un pezzo già messo si sposta (🪙 1 al rilascio); uno della barra si compra e si mette: rosso anche se mancano le monete. */
  _valido() {
    const D = this.D
    return D.spostando ? this.m.puoMettere(D.tipo, D.i, D.j, D.spostando.id) : this.m.puoCompraEMettere(D.tipo, D.i, D.j)
  }
  _aggiorna() {
    const D = this.D; if (!D.fant) return
    const d = misureDi(D.tipo); D.fant.position.set(D.i + d.w / 2, 0, D.j + d.d / 2)
    const p = this._valido(); D.ok = p.ok; D.motivo = p.motivo; D.costo = p.costo; D.liv = p.liv; tingi(D.fant, p.ok)
  }
  _suDito(x, y) {
    const D = this.D, p = this.c.puntaSuolo(x, y - D.presa.px); if (!p) return
    const d = misureDi(D.tipo), a = cellaSottoIlDito(p, d.w, d.d, D.presa.off)
    D.i = a.i; D.j = a.j; this._aggiorna()
  }
  _sulBordo(y) { const r = this.c.ui.zonaDrop(); return !!r && y > r.top }

  /** Comincia a trascinare una cosa già messa (`daSpostare`: tenuta premuta) o un pezzo nuovo. */
  inizia(tipo, daSpostare, x, y) {
    const D = this.D
    Object.assign(D, { attivo: true, tipo, spostando: daSpostare || null, parcheggiato: false, presa: PRESA_NUOVO, dentro: false, dito: null })
    if (daSpostare) {                                                   // si vede il fantasma, non il pezzo, e il dito tiene il punto che ha preso
      const d = misureDi(tipo), p = this.c.puntaSuolo(x, y)
      if (p) D.presa = { px: 0, off: scartoDellaPresa(p, daSpostare.i, daSpostare.j, d.w, d.d) }
      this.c.pezzi.nascondi(daSpostare.id, true)
    }
    D.fant = this.c.creaFantasma(tipo, daSpostare); this.c.scena.add(D.fant)
    this.c.terreno.mostraGriglia(true)
    this.muovi(x, y)
  }
  muovi(x, y) {
    const D = this.D, su = this._sulBordo(y), { ui } = this.c
    D.dito = { x, y }
    D.fant.visible = !su
    if (!su) this._suDito(x, y)
    ui.trascinando({ emoji: misureDi(D.tipo).emoji, x, y, su, perMettereVia: su && !!D.spostando, perAnnullare: su && !D.spostando, nuovo: !D.spostando, parcheggiato: D.parcheggiato })
    const prezzo = !D.spostando && D.costo ? ` (🪙 ${D.costo})` : ''
    ui.avviso(su ? (D.spostando ? 'Rilascia qui per mettere via (🪙 1)' : 'Portalo sulla mappa e rilascia')
                 : (D.ok ? 'Rilascia per costruire qui' + prezzo : dettoDi(D.motivo, { costo: D.costo, liv: D.liv })))
  }
  /** Il dito si stacca: se ci sta si costruisce o si sposta, sulla barra si rimette via, altrimenti niente cambia. */
  rilascia(x, y) {
    const D = this.D; if (!D.attivo) return
    const su = this._sulBordo(y), { ui } = this.c, m = this.m, visto = D.dito
    D.dito = null                                                   // il dito è alzato: la camera non scorre più
    // si costruisce dove il fantasma si vede: ricalcola solo se il dito si è staccato altrove dall'ultimo punto visto
    if (!su && (!visto || Math.hypot(visto.x - x, visto.y - y) > 0.5)) this._suDito(x, y)
    const ok = D.ok, motivo = D.motivo, costo = D.costo, liv = D.liv, tipo = D.tipo, c0 = D.spostando, i = D.i, j = D.j
    if (D.parcheggiato && !su && !ok) {                             // il fantasma del menu resta finché non trova posto (o non lo si annulla)
      return ui.avviso(dettoDi(motivo, { costo, liv }))
    }
    this._fine()
    if (c0) {
      if (su) {
        const r = m.mettiVia(c0.id)
        if (!r.ok) return this._dice(dettoDi(r.motivo, { mancano: 1 }))
        this.c.cambiato(); return ui.avviso(misureDi(tipo).nome + ' messo via: lo ritrovi nel menu Costruisci')
      }
      if (!ok) return this._dice(dettoDi(motivo))
      const r = m.spostaPezzo(c0.id, i, j)
      if (!r.ok) return this._dice(dettoDi(r.motivo, { mancano: 1 }))
      this.c.cambiato(); return ui.avviso('Spostato')
    }
    if (su) return ui.avviso('')
    if (!ok) return this._dice(dettoDi(motivo, { costo, liv }))     // un rilascio che non va non perde niente
    this._compraEMetti(tipo, i, j)
  }
  /** Compra (se serve) e mette: un gesto, con le scintille. Se non va non cambia niente e lo dice. */
  _compraEMetti(tipo, i, j) {
    const { ui, fx } = this.c, r = this.m.compraEMetti(tipo, i, j)
    if (!r.ok) { this._dice(dettoDi(r.motivo, { costo: r.costo, liv: r.liv })); return r }
    this.c.pezzi.sincronizza(); this.c.pezzi.fanNascere(r.cosa.id)
    fx.scoppietta(this.c.pezzi.centroDi({ kind: 'cosa', id: r.cosa.id }).setY(0.5), 0xfff2a0, 14, 2.4, 3)
    this.c.cambiato(); ui.avviso(misureDi(tipo).nome + ' costruito' + (r.costo ? ` (🪙 ${r.costo})` : ''))
    return r
  }

  // ── dal menu «Costruisci qui» ──
  /**
   * Il pezzo scelto va sulla cella (i, j) premuta. Fra i modi di posarlo che la coprono sceglie quello più centrato che ci sta: se uno
   * c'è, compra e mette subito → { esito: 'messo' }; se c'è ma mancano le monete → { esito: 'rifiuto', motivo, costo, liv } e non cambia
   * niente; se nessuno ci sta (occupata, fuori terreno) il fantasma resta lì → { esito: 'fantasma' }.
   */
  daMenu(tipo, i, j, punto = null) {
    const d = misureDi(tipo), m = this.m
    const rif = punto ? { x: punto.x, z: punto.z } : { x: i + 0.5, z: j + 0.5 }        // il punto premuto (o il centro della cella): il pezzo vi si centra
    let scelto = null, meglio = Infinity
    for (let a = 0; a < d.w; a++) for (let b = 0; b < d.d; b++) {
      const ai = i - a, aj = j - b
      if (!m.puoMettere(tipo, ai, aj).ok) continue
      const dist = Math.hypot(ai + d.w / 2 - rif.x, aj + d.d / 2 - rif.z)
      if (dist < meglio) { meglio = dist; scelto = [ai, aj] }
    }
    if (!scelto) {
      const a = cellaSottoIlDito(rif, d.w, d.d)
      this.parcheggia(tipo, a.i, a.j)
      return { esito: 'fantasma' }
    }
    const p = m.puoCompraEMettere(tipo, scelto[0], scelto[1])
    if (!p.ok) return { esito: 'rifiuto', motivo: p.motivo, costo: p.costo, liv: p.liv }
    const r = this._compraEMetti(tipo, scelto[0], scelto[1])
    return r.ok ? { esito: 'messo' } : { esito: 'rifiuto', motivo: r.motivo, costo: r.costo, liv: r.liv }
  }
  /** Il fantasma di un pezzo nuovo sta fermo in (i, j), verde o rosso, e aspetta: lo si trascina, o lo si tocca dove si vuole. */
  parcheggia(tipo, i, j) {
    if (this.D.attivo) this._fine()
    const D = this.D
    Object.assign(D, { attivo: true, tipo, spostando: null, parcheggiato: true, i, j, presa: PRESA_NUOVO, dentro: false, dito: null })
    D.fant = this.c.creaFantasma(tipo, null); this.c.scena.add(D.fant)
    this.c.terreno.mostraGriglia(true)
    this._aggiorna()
    this.c.ui.trascinando({ emoji: misureDi(tipo).emoji, x: 0, y: 0, su: false, perMettereVia: false, perAnnullare: false, nuovo: true, parcheggiato: true })
    this.c.ui.avviso(D.ok ? `Trascinalo dove vuoi e lascialo, o toccalo qui${D.costo ? ` (🪙 ${D.costo})` : ''}` : 'Qui non ci sta: trascinalo in un posto libero, o tocca per annullare')
  }
  /** Il dito preme (col fantasma parcheggiato): se preme sul fantasma lo afferra tenendo il punto preso; se preme altrove lo porterà sollevato. */
  prendi(x, y) {
    const D = this.D; if (!D.attivo || !D.parcheggiato) return
    const p = this.c.puntaSuolo(x, y), d = misureDi(D.tipo)
    D.dito = null; D.presa = PRESA_NUOVO; D.dentro = false
    if (p && dentroIlPezzo(p, D.i, D.j, d.w, d.d)) { D.dentro = true; D.presa = { px: 0, off: scartoDellaPresa(p, D.i, D.j, d.w, d.d) } }
  }
  /** Un tocco (non una strisciata) col fantasma parcheggiato: sul fantasma costruisce lì; altrove, se il posto toccato va, costruisce lì; se no annulla senza perdere niente. */
  tocco(x, y) {
    const D = this.D; if (!D.attivo || !D.parcheggiato) return
    const p = this.c.puntaSuolo(x, y), { ui } = this.c
    if (p && !D.dentro) { const d = misureDi(D.tipo), a = cellaSottoIlDito(p, d.w, d.d); D.i = a.i; D.j = a.j; this._aggiorna() }
    const ok = D.ok, motivo = D.motivo, costo = D.costo, liv = D.liv, tipo = D.tipo, i = D.i, j = D.j
    this._fine()
    if (!p || !ok) return p ? this._dice(dettoDi(motivo, { costo, liv })) : ui.avviso('')
    this._compraEMetti(tipo, i, j)
  }
  /** Un rifiuto: una riga nella fascia e nel fumetto dell'eroe (dopo un rilascio la fascia sparisce, il fumetto resta). */
  _dice(testo) { this.c.ui.avviso(testo); if (testo) this.c.fx.parla(testo) }
  /** Il tocco è finito o è stato annullato: niente più scorrimento ai bordi. */
  alzaDito() { this.D.dito = null; this.pennelloDito = null }
  annullaTrascinamento() { if (this.D.attivo) this._fine() }
  _fine() {
    const D = this.D
    if (D.fant) { this.c.scena.remove(D.fant); buttaFantasma(D.fant); D.fant = null }
    if (D.spostando) this.c.pezzi.nascondi(D.spostando.id, false)
    Object.assign(D, { attivo: false, tipo: null, spostando: null, parcheggiato: false, presa: PRESA_NUOVO, dentro: false, dito: null })
    this.c.ui.trascinando(null)
    if (!this.c.cmd.strumento) this.c.terreno.mostraGriglia(false)
  }

  // ── scorrere ai bordi: ogni fotogramma, col dito che tiene un pezzo (o disegna) ──
  /** Il bordo utile dello schermo (px della pagina): sotto la barra in alto, sopra la fascia «metti via» (o la barra delle strade) in basso. */
  _area() {
    const r = this.c.rettangolo(), z = this.c.ui.zonaDrop()
    return { sinistra: r.left, destra: r.right, alto: r.top + SOPRA_UI_PX, basso: z ? z.top : r.bottom - SOTTO_UI_PX }
  }
  /**
   * Col dito sul pezzo (o sul pennello) vicino a un bordo la camera scorre, a velocità che cresce verso il bordo (celle/s × `dt`: col
   * tempo, non coi fotogrammi); il fantasma resta sotto il dito perché la cella si ricalcola con la camera di adesso, anche a dito
   * fermo. Va chiamato dopo `camera.muovi`. Se la camera si è spostata da sola (l'eroe cammina) la cella si ricalcola lo stesso.
   */
  fotogramma(dt) {
    const D = this.D, cam = this.c.camera
    const pun = this.pennelloDito, dito = D.attivo && D.dito ? D.dito : null
    if (!dito && !pun) { this._camPrima = null; return }
    const t = dito || pun
    if (dito && this._sulBordo(dito.y)) return                       // sulla fascia «metti via» non si scorre
    const v = velocitaBordo(t.x, t.y, this._area())
    let mossa = false
    if (v.x || v.z) { cam.scorri(v.x * dt, v.z * dt); mossa = true }
    const k = this._camPrima, mosso = !k || k.x !== cam.x || k.z !== cam.z
    this._camPrima = { x: cam.x, z: cam.z }
    if (!mossa && !mosso) return
    cam.cam.updateMatrixWorld()                                      // `puntaSuolo` legge la matrice, che altrimenti è quella dell'ultimo disegno
    if (dito) this.muovi(dito.x, dito.y)
    else this.pennello(pun.x, pun.y, pun.gesto)
  }

  // ── le strade a pennello ──
  pennello(x, y, gesto) {
    this.pennelloDito = { x, y, gesto }
    const p = this.c.puntaSuolo(x, y); if (!p) return
    const cella = [Math.floor(p.x), Math.floor(p.z)]
    const da = this.ultimaCella || cella; this.ultimaCella = cella
    if (!this.tratto) this.tratto = { celle: [], costo: 0 }
    let cambiato = false
    for (const [i, j] of lineaDiCelle(da, cella)) {
      if (!dentro(i, j)) continue
      if (gesto === 'strada') {
        const r = this.m.disegnaStrada(i, j)
        if (r.ok) { this.tratto.celle.push({ i, j, aggiunta: true }); this.tratto.costo += r.costo; cambiato = true }
        else if (r.motivo === 'poche-monete') { this.c.ui.avviso('Hai finito le monete: niente altra strada'); break }
      } else if (this.m.togliStrada(i, j).ok) { this.tratto.celle.push({ i, j, aggiunta: false }); cambiato = true }
    }
    if (cambiato) { this.c.terreno.ridisegnaStrade(); this.c.ui.cambio() }
  }
  finisciTratto(gesto) {
    this.ultimaCella = null; this.pennelloDito = null
    if (this.tratto && this.tratto.celle.length) {
      this.c.ui.avviso(gesto === 'strada' ? `Strada fatta (🪙 ${this.tratto.costo})` : 'Tolta')
    }
    this.tratto = null
  }
}
