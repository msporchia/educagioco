// Cosa fa l'eroe davanti a ogni cosa: gli passa il gesto (anima), a metà gesto chiede al motore di farlo davvero e racconta
// il risultato (testi che volano, scintille). Le regole sono del motore; qui si decide solo cosa mostrare e cosa dire.
// Le finestre (la scelta del seme, il menu delle macchine, le conferme) sono della vista: si chiamano da `ui`.
import * as THREE from 'three'
import { COLTURE } from '../dati/colture.js'
import { COSTI } from '../dati/regole.js'
import { EDIFICI, PEZZI } from '../dati/catalogo.js'
import { MACCHINE } from '../dati/ricette.js'
import { PRODOTTI_ANIMALI } from '../dati/animali.js'
import { dettoDi, dettoDiRifiuto } from './detti.js'

export { dettoDi, dettoDiRifiuto }

export class Azioni {
  constructor(ctx) { this.c = ctx }
  get m() { return this.c.m }

  /** Un tocco su una cosa: l'eroe l'ha raggiunta, ora la fa. `b`: { kind: 'cosa', id } (anche un edificio) | { kind: 'albero', n } | { kind: 'ostacolo', n }. */
  fai(b) {
    const { eroe, pezzi, fx } = this.c
    if (eroe.az) return
    if (b.kind === 'albero') return this.abbatti(this.m.albero(b.n))
    if (b.kind === 'ostacolo') return this.togli(this.m.ostacolo(b.n))
    eroe.faccia(pezzi.centroDi(b))
    if (b.kind === 'edificio') return this.edificio(b.tipo)
    const cosa = this.m.cosa(b.id)
    if (!cosa) return
    switch (cosa.tipo) {
      case 'campo': return this.campo(cosa)
      case 'recinto': return this.cura(cosa)
      case 'pollaio': case 'stalla': return this.curaBestie(cosa)
      case 'bacheca': case 'bancarella': pezzi.salta(cosa.id); return this.c.ui.apriBanco()      // il foglio degli ordini
      case 'fontana': pezzi.salta(cosa.id); fx.parla('Che bella!'); return
      case 'molo': case 'molo_v': return this.pescaDalMolo(cosa)         // toccare il molo: si lancia in punta
      case 'stagno': case 'laghetto': return this.pescaSu(Math.floor(this.centro(cosa).x), Math.floor(this.centro(cosa).z))      // l'acqua costruita: la pesca (se il tocco non l'ha già fatto)
      case 'trattore': pezzi.salta(cosa.id); return this.c.ui.apriMappa && this.c.ui.apriMappa()      // porta ai vicini (docs/fattoria3d/vicini.md)
      default: if (EDIFICI[cosa.tipo]) return this.edificio(cosa.tipo)         // una macchina o la mongolfiera
    }
  }

  // ── i campi ──
  campo(c) {
    const m = this.m
    if (m.campoMaturo(c)) return this.falcia(c)
    if (m.campoVuoto(c)) return this.c.ui.scegliSeme(k => this.semina(c, k))
    this.c.fx.parla(`Sta crescendo… ${m.restoSecondi(c)}s`)
  }
  semina(c, coltura) {
    const { eroe, fx, ui } = this.c, p = this.centro(c)
    eroe.faccia(p)
    eroe.avvia('semina', 1.1, t => {
      if (t > 0.5 && !eroe.az.fatto.has('s')) {
        eroe.az.fatto.add('s'); this.m.semina(c.id, coltura)
        fx.scoppietta(p.clone().setY(0.4), 0x8a6a3a, 14, 1.2, 1.4); ui.cambio()
      }
    })
  }
  falcia(c) {
    const { eroe, fx, ui } = this.c, p = this.centro(c)
    eroe.avvia('falcia', 1.7, t => {
      c.tile.forEach((tt, k) => {
        const quando = 0.12 + k * 0.2                  // t è la frazione 0..1 del gesto
        if (tt === null || t <= quando || eroe.az.fatto.has(k)) return
        const r = this.m.raccogliTessera(c.id, k); if (!r.ok) return
        eroe.az.fatto.add(k)
        const q = new THREE.Vector3(p.x + (k % 2 ? 0.5 : -0.5), 0.3, p.z + (k < 2 ? -0.5 : 0.5)), col = COLTURE[r.coltura]
        fx.scoppietta(q, this.c.colore(r.coltura), 10, 1.8, 2.6); fx.volo(col.pezzo ? '+1' : '+1 ' + col.emoji, q, 1.0, r.coltura); ui.cambio()
      })
    })
  }

  // ── le pecore: prima si tosa, poi si nutre ──
  cura(c) {
    const { eroe, fx, ui, pezzi } = this.c, p = this.centro(c), pr = this.m.provaCura(c.id)
    if (pr.azione === 'tosa') {
      return eroe.avvia('semina', 1.2, t => {
        if (t <= 0.5 || eroe.az.fatto.has('t')) return
        eroe.az.fatto.add('t'); const r = this.m.tosa(c.id)
        if (r.ok) { fx.volo('+' + r.n + ' 🧶', p, 1.6); fx.scoppietta(p.clone().setY(0.6), 0xffffff, 12, 1.6, 2.2); ui.cambio() }
      })
    }
    if (pr.azione === 'nutri') {
      return eroe.avvia('semina', 1.0, t => {
        if (t <= 0.5 || eroe.az.fatto.has('n')) return
        eroe.az.fatto.add('n')
        const r = this.m.nutri(c.id)
        if (!r.ok) return fx.parla(dettoDi(r.motivo, { per: 'nutrirle', servono: r.servono, mangia: r.mangia }))
        pezzi.richiama(c.id, { x: eroe.x - p.x, z: eroe.z - p.z })
        pezzi.sincronizza()
        const testo = { cresciuta: '🐑 è cresciuta!', nata: '🐣 è nata una pecorella!', pasto: '🍼 +1', cuore: '❤️', lana: '🍽️ ×' + r.n }[r.evento]
        fx.volo(testo, p, 1.8)
        if (r.evento === 'cresciuta') fx.scoppietta(p.clone().setY(0.8), 0xffd24a, 12, 1.6, 2.4)
        if (r.evento === 'nata') fx.scoppietta(p.clone().setY(0.8), 0xff9ab8, 14, 1.6, 2.4)
        ui.cambio()
      })
    }
    fx.parla(dettoDi(pr.motivo, { per: 'nutrirle', secondi: pr.secondi, servono: pr.servono, mangia: pr.mangia }))
  }

  // ── il pollaio e la stalla: prima si raccoglie, poi si nutre; se non c'è altro, si dice perché. Le bestie si comprano dal cartello ──
  curaBestie(c) {
    const { eroe, fx, ui, pezzi } = this.c, p = this.centro(c), pr = this.m.provaCuraBestie(c.id)
    if (pr.azione === 'raccogli') {
      return eroe.avvia('semina', 1.2, t => {
        if (t <= 0.5 || eroe.az.fatto.has('r')) return
        eroe.az.fatto.add('r'); const r = this.m.raccogliProdotti(c.id)
        if (!r.ok) return
        pezzi.sincronizza()
        fx.volo('+' + r.n + (PRODOTTI_ANIMALI[r.prodotto].pezzo ? '' : ' ' + PRODOTTI_ANIMALI[r.prodotto].emoji), p, 1.8, r.prodotto); fx.scoppietta(p.clone().setY(0.7), 0xfff2c4, 10, 1.4, 2.0); ui.cambio()
      })
    }
    if (pr.azione === 'nutri') {
      return eroe.avvia('semina', 1.0, t => {
        if (t <= 0.5 || eroe.az.fatto.has('n')) return
        eroe.az.fatto.add('n')
        const r = this.m.nutriBestie(c.id)
        if (!r.ok) return fx.parla(dettoDi(r.motivo, { per: 'nutrirle', servono: r.servono, mangia: r.mangia }))
        pezzi.sincronizza()
        fx.volo('🍽️ ×' + r.n, p, 1.8); ui.cambio()
      })
    }
    fx.parla(dettoDi(pr.motivo, { per: 'nutrirle', secondi: pr.secondi, servono: pr.servono, mangia: pr.mangia }))
  }
  /** Il pulsante «＋ 🪙 N» del cartello su un recinto, un pollaio o una stalla: compra una bestia subito, senza conferma (non
      cammina fino all'edificio). Se mancano monete dice quante. */
  compraBestia(id) {
    const { fx, ui, pezzi, eroe, cmd } = this.c, m = this.m, c = m.cosa(id), q = c && m.infoBestie(c)
    if (!q || cmd.strumento || ui.fogliAperti()) return
    const r = m.compraBestia(id)
    if (!r.ok) return this.dici(dettoDiRifiuto(r, { mancano: (r.costo || 0) - m.monete(), bestie: q.bestie }))
    const p = this.centro(c)
    pezzi.sincronizza(); pezzi.salta(id)
    fx.scoppietta(p.clone().setY(0.8), 0xffd24a, 16, 2.4, 3); fx.volo('+1 ' + q.emoji + (r.pappa ? ' 🍽️' : ''), p, 1.8)
    if (!eroe.az) eroe.avvia('esulta', 0.9)
    ui.cambio()
  }

  // ── gli alberi ──
  /** Tagliare un albero costa monete (`COSTI.albero`) e non dà niente: libera la cella. Senza monete l'eroe lo dice e non alza l'ascia. */
  abbatti(a) {
    const { eroe, fx, ui, terreno } = this.c
    if (!a || eroe.az) return
    const p = this.m.puoAbbattere(a.n)
    if (!p.ok) return
    if (this.m.monete() < COSTI.albero) return this.dici(dettoDi('poche-monete', { costo: COSTI.albero, per: 'tagliare un albero' }))
    eroe.faccia(new THREE.Vector3(a.i + 0.5, 0, a.j + 0.5))
    eroe.avvia('abbatti', 1.7, t => {
      if (t <= 0.62 || eroe.az.fatto.has('c')) return
      eroe.az.fatto.add('c')
      const r = this.m.abbatti(a.n)
      if (!r.ok) return
      terreno.togliAlbero(a.n); fx.cade(a, { x: eroe.x, z: eroe.z })
      fx.volo('−🪙 ' + r.costo, new THREE.Vector3(a.i + 0.5, 0, a.j + 0.5), 1.8); ui.cambio()
    })
  }

  // ── i sassi e i cespugli: un gesto breve, 🪙 1, e la cella torna libera ──
  togli(o) {
    const { eroe, fx, ui, terreno } = this.c
    if (!o || eroe.az) return
    const p = this.m.puoTogliere(o.n)
    if (!p.ok) return
    if (this.m.monete() < COSTI.ostacolo) return this.dici(dettoDi('poche-monete', { costo: COSTI.ostacolo, per: o.tipo === 'sasso' ? 'togliere il sasso' : 'togliere il cespuglio' }))
    const centro = new THREE.Vector3(o.i + 0.5, 0, o.j + 0.5)
    eroe.faccia(centro)
    eroe.avvia('semina', 0.9, t => {
      if (t <= 0.5 || eroe.az.fatto.has('o')) return
      eroe.az.fatto.add('o')
      const r = this.m.togliOstacolo(o.n)
      if (!r.ok) return fx.parla(dettoDiRifiuto(r, { costo: r.costo, per: 'togliere questo' }))
      terreno.togliOstacolo(o.n); terreno.ridisegnaErba()
      fx.scoppietta(centro.clone().setY(0.3), o.tipo === 'sasso' ? 0xb8b6ae : 0x5f9a3a, 10, 1.6, 2)
      fx.volo('−🪙 ' + r.costo, centro, 1.2); ui.cambio()
    })
  }

  // ── la pesca: si tocca l'acqua (o la punta del molo); il contadino cammina fino al posto da cui si lancia, lancia, e se resta lì ritira da sé ──
  /** L'acqua più vicina alle celle del molo (di lato, fuori dall'impronta): da lì si lancia se si tocca il molo. */
  pescaDalMolo(cosa) {
    const m = this.m, d = PEZZI[cosa.tipo]
    let meglio = null
    for (let a = 0; a < d.w; a++) for (let b = 0; b < d.d; b++) for (const [di, dj] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
      const i = cosa.i + a + di, j = cosa.j + b + dj
      if (i >= cosa.i && i < cosa.i + d.w && j >= cosa.j && j < cosa.j + d.d) continue
      if (!m.acqua(i, j) || !m.cellaPropria(i, j)) continue
      const lontano = Math.hypot(a - (d.w - 1) / 2, b - (d.d - 1) / 2)            // meglio la punta: l'acqua accanto alla cella più lontana dal centro
      if (!meglio || lontano > meglio.lontano) meglio = { i, j, lontano }
    }
    if (!meglio) return this.dici(dettoDi('non-acqua-vicina'))
    return this.pescaSu(meglio.i, meglio.j)
  }
  /** Un tocco su una cella d'acqua: se si può lancia la lenza dal posto più vicino; se il pesce abbocca lo ritira; se no dice perché. */
  pescaSu(i, j) {
    const { eroe, fx } = this.c, m = this.m
    if (eroe.az) return
    const p = m.provaPesca(i, j)
    if (!p.ok) return this.dici(dettoDi(p.motivo))
    if (p.azione === 'aspetta') return fx.parla(dettoDi('pesca-attesa', { secondi: p.secondi }))
    if (p.azione === 'riposo') return fx.parla(dettoDi('pesca-riposo', { secondi: p.secondi }))
    const verso = new THREE.Vector3(p.i + 0.5, 0, p.j + 0.5)
    const fn = p.azione === 'lancia' ? () => this.lancia(p) : () => this.ritira(p.lotto)
    eroe.vaiA([p.sta], fn, verso)
  }
  /** Il lancio: la canna indietro e avanti, il galleggiante in acqua; il contadino resta lì con la canna alzata (`eroe.pescando`). */
  lancia(p) {
    const { eroe, fx, ui } = this.c
    if (eroe.az) return
    const verso = new THREE.Vector3(p.i + 0.5, 0, p.j + 0.5)
    eroe.faccia(verso)
    eroe.avvia('pesca', 1.5, t => {
      if (t < 0.62 || eroe.az.fatto.has('l')) return
      eroe.az.fatto.add('l')
      const r = this.m.lanciaLenza(p.i, p.j)
      if (!r.ok) return fx.parla(dettoDi(r.motivo, { secondi: r.secondi }))
      eroe.pescando = { lotto: r.lotto, x: p.i + 0.5, z: p.j + 0.5 }
      fx.scoppietta(verso.clone().setY(0.1), 0xbfe6ff, 12, 1.6, 2.4); ui.cambio()
    })
  }
  /** Il ritiro: lo strappo, lo spruzzo, il pesce che vola nell'inventario, e l'esultanza. */
  ritira(lotto) {
    const { eroe, fx, ui, pesca } = this.c
    if (eroe.az) return
    const pos = pesca && pesca.posizioneDi(lotto)
    if (pos) eroe.faccia(pos)
    eroe.avvia('ritira', 1.1, t => {
      if (t < 0.45 || eroe.az.fatto.has('r')) return
      eroe.az.fatto.add('r')
      const r = this.m.ritiraPesca(lotto)
      if (!r.ok) return fx.parla(dettoDi(r.motivo))
      const dove = pos ? pos.clone() : new THREE.Vector3(eroe.x, 0, eroe.z)
      fx.scoppietta(dove.clone().setY(0.15), 0xdff3ff, 16, 2.2, 3.4)
      fx.volo('+' + r.n, dove, 1.2, 'pesce')
      eroe.pescando = null; ui.cambio()
    }, () => { if (!eroe.az) eroe.avvia('esulta', 0.9) })
  }

  // ── gli edifici unici: una volta messi in mappa si toccano e si apre la loro finestra (comprarli e piazzarli è del menu «Costruisci qui») ──
  edificio(tipo) {
    const { ui } = this.c
    if (MACCHINE[tipo]) return ui.apriMacchina(tipo)           // il menu della SUA macchina
    if (tipo === 'mongolfiera') return ui.apriMongolfiera()   // la nave: il foglio con la stiva di casse
  }
  /** Una riga che si vede sempre: nel fumetto dell'eroe, e nella barra del costruire se è aperta. */
  dici(testo) { this.c.fx.parla(testo); this.c.ui.avviso(testo) }

  // ── il terreno ──
  offriLotto(l) {
    const { ui, fx, terreno } = this.c, m = this.m
    if (!m.confina(l)) return this.dici(dettoDi('non-confina'))
    const pr = m.prezzoLotto()
    ui.chiedi('Terreno', `Allarga la fattoria: un lotto in più dove camminare, costruire e disegnare strade.${{ laghetto: ' Qui c\'è un laghetto.', lago: ' Qui c\'è un lago: con un molo ci si pesca.', mare: ' Qui c\'è il mare: con un molo e il porticciolo ci si pesca.', costa: ' Qui c\'è la spiaggia.' }[m.biomaDi(l)] || ''} Costa 🪙 ${pr}.`, [
      { t: `Compra · 🪙 ${pr}`, fn: () => {
        const r = m.compraLotto(l.id)
        if (!r.ok) return this.dici(dettoDiRifiuto(r, { mancano: pr - m.monete() }))
        fx.scoppietta(new THREE.Vector3(l.i + 2, 0.8, l.j + 2), 0xffd24a, 28, 4, 4)
        terreno.ridisegnaTutto(); ui.cambio()
      } },
      { t: 'Non ora', quieto: true },
    ])
  }

  centro(c) { return new THREE.Vector3(c.i + this.c.misure(c.tipo).w / 2, 0, c.j + this.c.misure(c.tipo).d / 2) }
}
