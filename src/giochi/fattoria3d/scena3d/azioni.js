// Cosa fa l'eroe davanti a ogni cosa: gli passa il gesto (anima), a metà gesto chiede al motore di farlo davvero e racconta
// il risultato (testi che volano, scintille). Le regole sono del motore; qui si decide solo cosa mostrare e cosa dire.
// Le finestre (la scelta del seme, la pasticceria, le conferme) sono della vista: si chiamano da `ui`.
import * as THREE from 'three'
import { COLTURE } from '../dati/colture.js'
import { MONGOLFIERA } from '../dati/regole.js'
import { EDIFICI, PEZZI } from '../dati/catalogo.js'
import { MACCHINE } from '../dati/ricette.js'
import { ANIMALI, PRODOTTI_ANIMALI } from '../dati/animali.js'
import { lottoPerId } from '../dati/mondo.js'
import { dettoDi, dettoDiRifiuto } from './detti.js'

export { dettoDi, dettoDiRifiuto }

export class Azioni {
  constructor(ctx) { this.c = ctx }
  get m() { return this.c.m }

  /** Un tocco su una cosa: l'eroe l'ha raggiunta, ora la fa. `b`: { kind: 'cosa', id } | { kind: 'edificio', tipo } | { kind: 'albero', n }. */
  fai(b) {
    const { eroe, pezzi, fx } = this.c
    if (eroe.az) return
    if (b.kind === 'albero') return this.abbatti(this.m.alberi[b.n])
    eroe.faccia(pezzi.centroDi(b))
    if (b.kind === 'edificio') return this.edificio(b.tipo)
    const cosa = this.m.cosa(b.id)
    if (!cosa) return
    switch (cosa.tipo) {
      case 'campo': return this.campo(cosa)
      case 'recinto': return this.cura(cosa)
      case 'pollaio': case 'stalla': return this.curaBestie(cosa)
      case 'bancarella': pezzi.salta(cosa.id); return this.c.ui.apriBanco()      // il foglio degli ordini
      case 'fontana': pezzi.salta(cosa.id); fx.parla('Che bella!')
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
        fx.scoppietta(q, this.c.colore(r.coltura), 10, 1.8, 2.6); fx.volo('+1 ' + col.emoji, q, 1.0); ui.cambio()
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
        if (!r.ok) return fx.parla(dettoDi(r.motivo, { per: 'nutrirle' }))
        pezzi.richiama(c.id, { x: eroe.x - p.x, z: eroe.z - p.z })
        pezzi.sincronizza()
        const testo = { cresciuta: '🐑 è cresciuta!', nata: '🐣 è nata una pecorella!', pasto: '🍼 +1', cuore: '❤️' }[r.evento]
        fx.volo(testo, p, 1.8)
        if (r.evento === 'cresciuta') fx.scoppietta(p.clone().setY(0.8), 0xffd24a, 12, 1.6, 2.4)
        if (r.evento === 'nata') fx.scoppietta(p.clone().setY(0.8), 0xff9ab8, 14, 1.6, 2.4)
        ui.cambio()
      })
    }
    fx.parla(dettoDi(pr.motivo, { per: 'nutrirle', secondi: pr.secondi }))
  }

  // ── il pollaio e la stalla: prima si raccoglie, poi si nutre; se non c'è altro, si dice perché (e si offre un'altra bestia) ──
  curaBestie(c) {
    const { eroe, fx, ui, pezzi } = this.c, p = this.centro(c), pr = this.m.provaCuraBestie(c.id), A = ANIMALI[c.tipo]
    if (pr.azione === 'raccogli') {
      return eroe.avvia('semina', 1.2, t => {
        if (t <= 0.5 || eroe.az.fatto.has('r')) return
        eroe.az.fatto.add('r'); const r = this.m.raccogliProdotti(c.id)
        if (!r.ok) return
        pezzi.sincronizza()
        fx.volo('+' + r.n + ' ' + PRODOTTI_ANIMALI[r.prodotto].emoji, p, 1.8); fx.scoppietta(p.clone().setY(0.7), 0xfff2c4, 10, 1.4, 2.0); ui.cambio()
      })
    }
    if (pr.azione === 'nutri') {
      return eroe.avvia('semina', 1.0, t => {
        if (t <= 0.5 || eroe.az.fatto.has('n')) return
        eroe.az.fatto.add('n')
        const r = this.m.nutriBestie(c.id)
        if (!r.ok) return fx.parla(dettoDi(r.motivo, { per: 'nutrirle' }))
        pezzi.sincronizza()
        fx.volo('🍽️ ×' + r.n, p, 1.8); ui.cambio()
      })
    }
    if (pr.motivo === 'lavora') return this.offriBestia(c, pr.secondi)
    fx.parla(dettoDi(pr.motivo, { per: 'nutrirle', secondi: pr.secondi, servono: pr.servono, mangia: pr.mangia }))
  }
  /** Le bestie lavorano: la riga di cosa manca e, se c'è un posto, il tasto per comprarne un'altra (si chiude con «Chiudi»). */
  offriBestia(c, secondi) {
    const { fx, ui, pezzi, eroe } = this.c, m = this.m, A = ANIMALI[c.tipo], nome = A.emoji + ' ' + PEZZI[c.tipo].nome
    const stato = `${c.bestie.length} su ${A.posti} ${A.bestie}. ${dettoDi('lavora', { secondi })}`
    const fa = () => {
      const r = m.compraBestia(c.id)
      if (!r.ok) return this.dici(dettoDiRifiuto(r, { mancano: A.prezzoBestia - m.monete() }))
      pezzi.sincronizza(); fx.scoppietta(this.centro(c).setY(0.8), 0xffd24a, 16, 2.4, 3); eroe.avvia('esulta', 0.9); ui.cambio()
    }
    if (c.bestie.length >= A.posti) return fx.parla(dettoDi('pieno', { secondi, bestie: A.bestie }))
    if (c.bestie.length >= m.postiBestie(c)) {
      const r = m.compraBestia(c.id)                               // rifiuta con `non-sbloccato` e il livello del prossimo posto
      return ui.chiedi(nome, `${stato} Un'altra: ${dettoDiRifiuto(r).toLowerCase()}.`, [{ t: 'Chiudi', quieto: true }])
    }
    ui.chiedi(nome, stato, [
      { t: `+ ${A.bestia[0].toUpperCase() + A.bestia.slice(1)} ${A.emoji} · 🪙 ${A.prezzoBestia}`, fn: fa },
      { t: 'Chiudi', quieto: true },
    ])
  }

  // ── gli alberi ──
  abbatti(a) {
    const { eroe, fx, ui, terreno } = this.c
    if (!a || eroe.az) return
    const p = this.m.puoAbbattere(a.n)
    if (!p.ok) return
    eroe.faccia(new THREE.Vector3(a.i + 0.5, 0, a.j + 0.5))
    eroe.avvia('abbatti', 1.7, t => {
      if (t <= 0.62 || eroe.az.fatto.has('c')) return
      eroe.az.fatto.add('c')
      const r = this.m.abbatti(a.n)
      if (!r.ok) return
      terreno.togliAlbero(a.n); fx.cade(a, { x: eroe.x, z: eroe.z })
      fx.volo('+' + r.legna + ' 🪵', new THREE.Vector3(a.i + 0.5, 0, a.j + 0.5), 1.8); ui.cambio()
    })
  }

  // ── gli edifici unici ──
  edificio(tipo) {
    const { eroe, fx, ui } = this.c, m = this.m
    if (!m.s.posseduti[tipo]) return this.offriEdificio(tipo)
    if (MACCHINE[tipo]) return ui.apriMacchina(tipo)           // il menu della SUA macchina
    const centro = this.c.pezzi.centroDi({ kind: 'edificio', tipo })
    const M = m.s.mongolfiera
    if (M.cassa) {
      const r = m.ritiraCassa()
      if (r.ok) { fx.volo('+' + r.lana + ' 🧶', centro, 3); eroe.avvia('esulta', 0.9); ui.cambio() }
      return
    }
    if (M.fine) return fx.parla(dettoDi('in-viaggio'))
    const r = m.carica()
    if (r.ok) { eroe.avvia('semina', 0.8); fx.volo('−' + MONGOLFIERA.carico + ' raccolti', centro, 3); ui.cambio() }
    else fx.parla(`Carica ${MONGOLFIERA.carico} raccolti sulla mongolfiera`)
  }
  /** Un edificio non ancora tuo: dice il prezzo, il livello a cui arriva e (se manca) il terreno da comprare prima. */
  offriEdificio(tipo) {
    const e = EDIFICI[tipo], { fx, ui, eroe, pezzi } = this.c, m = this.m
    const ok = { t: 'Ho capito', quieto: true }
    if (e.liv > m.livello()) {
      return ui.chiedi(e.nome, `Arriva al livello ${e.liv}. Poi costerà 🪙 ${e.prezzo}.`, [ok])
    }
    const lotti = m.lottiMancanti(tipo).map(lottoPerId).filter(Boolean)
    if (lotti.length) {
      const prossimo = lotti.find(l => m.confina(l))          // il primo che si può comprare adesso
      const testo = `Sta su un terreno che non è ancora tuo. ${prossimo ? 'Compra prima il terreno qui accanto' : 'Allarga la fattoria fin qui'}, poi costerà 🪙 ${e.prezzo}.`
      return ui.chiedi(e.nome, testo, prossimo
        ? [{ t: 'Vai al terreno', fn: () => this.offriLotto(prossimo) }, { t: 'Non ora', quieto: true }]
        : [ok])
    }
    ui.chiedi(e.nome, `Costa 🪙 ${e.prezzo}. Ce n'è uno solo e resta qui.`, [
      { t: `Compra · 🪙 ${e.prezzo}`, fn: () => {
        const r = this.m.compraEdificio(tipo)
        if (!r.ok) return this.dici(dettoDiRifiuto(r, { mancano: e.prezzo - this.m.monete() }))
        pezzi.sincronizza()
        fx.scoppietta(pezzi.centroDi({ kind: 'edificio', tipo }).setY(1), 0xffd24a, 24, 3.5, 4); eroe.avvia('esulta', 1); ui.cambio()
      } },
      { t: 'Non ora', quieto: true },
    ])
  }
  /** Una riga che si vede sempre: nel fumetto dell'eroe, e nella barra del costruire se è aperta. */
  dici(testo) { this.c.fx.parla(testo); this.c.ui.avviso(testo) }

  // ── il terreno ──
  offriLotto(l) {
    const { ui, fx, terreno } = this.c, m = this.m
    if (!m.confina(l)) return this.dici(dettoDi('non-confina'))
    const pr = m.prezzoLotto()
    ui.chiedi('Terreno', `Allarga la fattoria: un lotto in più dove camminare, costruire e disegnare strade. Costa 🪙 ${pr}.`, [
      { t: `Compra · 🪙 ${pr}`, fn: () => {
        const r = m.compraLotto(l.id)
        if (!r.ok) return this.dici(dettoDiRifiuto(r, { mancano: pr - m.monete() }))
        fx.scoppietta(new THREE.Vector3(l.i + 2, 0.8, l.j + 2), 0xffd24a, 28, 4, 4)
        terreno.ridisegnaLotti(); ui.cambio()
      } },
      { t: 'Non ora', quieto: true },
    ])
  }

  centro(c) { return new THREE.Vector3(c.i + this.c.misure(c.tipo).w / 2, 0, c.j + this.c.misure(c.tipo).d / 2) }
}
