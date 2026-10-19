// Costruire: si trascina un pezzo (dalla barra, o riprendendone uno già messo) fino a dove si vuole e al rilascio si
// costruisce; il fantasma mostra dove va, verde se ci sta. E le strade a pennello. Le regole di cosa ci sta sono del motore
// (`puoMettere`): qui si guida il fantasma, si chiede e si racconta. Un'azione si può annullare (↶).
import { PEZZI } from '../dati/catalogo.js'

import { dentro } from '../dati/mondo.js'
import { tingi } from './modelli.js'
import { dettoDi } from './azioni.js'

const SOPRA_IL_DITO = 1.6          // durante il trascinamento il fantasma sta più in su, per non stare sotto il dito

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
    this.D = { attivo: false, tipo: null, spostando: null, i: 0, j: 0, ok: false, fant: null }
    this.ultima = null
    this.tratto = null; this.ultimaCella = null
  }
  get m() { return this.c.m }
  get attivo() { return this.D.attivo }

  // ── il fantasma ──
  _valido() { const D = this.D; return this.m.puoMettere(D.tipo, D.i, D.j, D.spostando ? D.spostando.id : 0) }
  _aggiorna() {
    const D = this.D; if (!D.fant) return
    const d = PEZZI[D.tipo]; D.fant.position.set(D.i + d.w / 2, 0, D.j + d.d / 2)
    const p = this._valido(); D.ok = p.ok; D.motivo = p.motivo; tingi(D.fant, p.ok)
  }
  _suDito(x, y) {
    const p = this.c.puntaSuolo(x, y); if (!p) return
    const d = PEZZI[this.D.tipo]
    this.D.i = Math.round(p.x - d.w / 2); this.D.j = Math.round(p.z - d.d / 2 - SOPRA_IL_DITO); this._aggiorna()
  }
  _sulBordo(y) { const r = this.c.ui.zonaDrop(); return !!r && y > r.top }

  /** Comincia a trascinare un pezzo del tipo dato (dalla barra) o una cosa già messa (`daSpostare`). */
  inizia(tipo, daSpostare, x, y) {
    const D = this.D
    Object.assign(D, { attivo: true, tipo, spostando: daSpostare || null })
    if (daSpostare) this.c.pezzi.nascondi(daSpostare.id, true)          // si vede il fantasma, non il pezzo
    D.fant = this.c.creaFantasma(tipo, daSpostare); this.c.scena.add(D.fant)
    this.c.terreno.mostraGriglia(true)
    this.muovi(x, y)
  }
  muovi(x, y) {
    const D = this.D, su = this._sulBordo(y), { ui } = this.c
    D.fant.visible = !su
    if (!su) this._suDito(x, y)
    ui.trascinando({ emoji: PEZZI[D.tipo].emoji, x, y, su, perMettereVia: su && !!D.spostando })
    ui.avviso(su ? (D.spostando ? 'Rilascia qui per mettere via (🪙 1)' : 'Portalo sulla mappa e rilascia')
                 : (D.ok ? 'Rilascia per costruire qui' : dettoDi(D.motivo)))
  }
  /** Il dito si stacca: se ci sta si costruisce o si sposta, sulla barra si rimette via, altrimenti niente cambia. */
  rilascia(x, y) {
    const D = this.D; if (!D.attivo) return
    const su = this._sulBordo(y), { ui, fx } = this.c, m = this.m
    this._suDito(x, y)                                              // ricalcola dove sta, con la mappa di adesso
    const ok = D.ok, motivo = D.motivo, tipo = D.tipo, c0 = D.spostando, i = D.i, j = D.j
    this._fine()
    if (c0) {
      if (su) {
        const r = m.mettiVia(c0.id)
        if (!r.ok) return ui.avviso(dettoDi(r.motivo, { mancano: 1 }))
        this.c.cambiato(); return ui.avviso(PEZZI[tipo].nome + ' messo via: lo ritrovi in Costruisci')
      }
      if (!ok) return ui.avviso(dettoDi(motivo))
      const da = { i: c0.i, j: c0.j }, r = m.spostaPezzo(c0.id, i, j)
      if (!r.ok) return ui.avviso(dettoDi(r.motivo, { mancano: 1 }))
      if (r.costo) this.ultima = { tipo: 'sposta', id: c0.id, da, costo: r.costo }
      this.c.cambiato(); return ui.avviso('Spostato', !!this.ultima)
    }
    if (su) return ui.avviso('')
    if (!ok) return ui.avviso(dettoDi(motivo))
    const r = m.mettiPezzo(tipo, i, j)
    if (!r.ok) return ui.avviso(dettoDi(r.motivo))
    this.c.pezzi.sincronizza(); this.c.pezzi.fanNascere(r.cosa.id)
    fx.scoppietta(this.c.pezzi.centroDi({ kind: 'cosa', id: r.cosa.id }).setY(0.5), 0xfff2a0, 14, 2.4, 3)
    this.ultima = { tipo: 'nuovo', id: r.cosa.id }
    this.c.cambiato(); ui.avviso(PEZZI[tipo].nome + ' costruito', true)
  }
  annullaTrascinamento() { if (this.D.attivo) this._fine() }
  _fine() {
    const D = this.D
    if (D.fant) { this.c.scena.remove(D.fant); D.fant = null }
    if (D.spostando) this.c.pezzi.nascondi(D.spostando.id, false)
    Object.assign(D, { attivo: false, tipo: null, spostando: null })
    this.c.ui.trascinando(null)
    if (!this.c.cmd.costruendo) this.c.terreno.mostraGriglia(false)
  }

  // ── le strade a pennello ──
  pennello(x, y, gesto) {
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
    this.ultimaCella = null
    if (this.tratto && this.tratto.celle.length) {
      this.ultima = { tipo: 'strada', celle: this.tratto.celle, costo: this.tratto.costo }
      this.c.ui.avviso(gesto === 'strada' ? `Strada fatta (🪙 ${this.tratto.costo})` : 'Tolta', true)
    }
    this.tratto = null
  }

  /** ↶ l'ultima cosa fatta torna com'era (e la monetina torna indietro). */
  annulla() {
    const u = this.ultima, m = this.m; if (!u) return
    this.ultima = null
    if (u.tipo === 'nuovo') m.mettiVia(u.id, { gratis: true, forza: true })
    else if (u.tipo === 'sposta') { m.spostaPezzo(u.id, u.da.i, u.da.j, { gratis: true }); m.rimborsa(u.costo) }
    else if (u.tipo === 'strada') {
      for (const c of u.celle) { if (c.aggiunta) m.togliStrada(c.i, c.j); else m.disegnaStrada(c.i, c.j, { gratis: true }) }
      m.rimborsa(u.costo); this.c.terreno.ridisegnaStrade()
    }
    this.c.cambiato(); this.c.ui.avviso('Annullato')
  }
  dimentica() { this.ultima = null }
}
