// La visita: la stessa tela e gli stessi pezzi del mondo di casa, ma su un motore di SOLA LETTURA costruito da uno snapshot
// (motore/vicini.js `motoreDiVisita`): niente costruire, niente alberi, niente cartelli di prezzo.
// Si cammina e si tocca solo ciò che il vicino offre: la cassa e il banco del mercato, che qui sono due cose in più
// (non sono pezzi del catalogo: stanno nello snapshot, in `posti`). Non sa le regole: dice alla vista `ui.apriLuogo('cassa' | 'mercato')`.
// Vedi docs/fattoria3d/vicini.md.
import * as THREE from 'three'
import { Mondo3d } from './mondo3d.js'
import { Pezzi } from './pezzi.js'
import { creaCassa, creaBancarella } from './modelli.js'
import { MISURE_POSTI } from '../dati/vicini.js'

const BADGE_NULLO = { el: { hidden: true }, testo: '', imposta() {}, bestie() {}, metti() {}, togli() {} }

/** I pezzi di una visita: i cartelli di cottura e di uova non ci sono (non sono tuoi); gli edifici sono cose come le altre, dove li ha messi il vicino. */
class PezziVisita extends Pezzi {
  _creaCosa(c) { super._creaCosa(c); this._senzaCartelli(c.id) }
  _senzaCartelli(id) { const v = this.voci.get(id); if (v) { v.badge?.togli(); v.badge = BADGE_NULLO } }
}

const STUB_COSTRUZIONE = {
  attivo: false, tratto: null, ultimaCella: null,
  inizia() {}, muovi() {}, rilascia() {}, annullaTrascinamento() {}, ruota() {}, pennello() {}, finisciTratto() {}, annulla() {},
  parcheggiato: false, fotogramma() {}, alzaDito() {}, prendi() {}, tocco() {},
}

export class Visita extends Mondo3d {
  /** `fattoria`: lo snapshot normalizzato che si sta visitando. `ui.apriLuogo(nome)` apre il foglio della cassa o del mercato. */
  constructor({ canvas, sopra, motore, ui, qualita, fattoria, abito = null }) {
    super({ canvas, sopra, motore, ui, qualita, abito })
    this.fattoria = fattoria
    this.costruzione = STUB_COSTRUZIONE           // il dito lungo e il pennello non fanno niente: la fattoria non è tua
    this.luoghi = []
    for (const [nome, crea, testo] of [['cassa', creaCassa, '📦 La cassa'], ['mercato', creaBancarella, '🛒 Il mercato']]) {
      const p = fattoria.posti[nome], d = MISURE_POSTI[nome], grp = crea()
      grp.position.set(p.i + d.w / 2, 0, p.j + d.d / 2); grp.userData.bersaglio = { kind: 'luogo', luogo: nome }
      this.scena.add(grp)
      const badge = this.fx.nuovoBadge(); badge.imposta(testo, 'pronto')
      this.luoghi.push({ nome, grp, badge, i: p.i, j: p.j, w: d.w, d: d.d })
    }
  }

  creaPezzi() { return new PezziVisita(this.scena, this.m, this.fx, this.vista, this.q) }

  // ── niente che si costruisce, si taglia o si compra ──
  bersaglioSotto() { return null }                  // il dito lungo non solleva niente
  _badgeLotti() {}                                  // niente prezzi sui lotti
  lottoSotto() { return null }

  /** Il luogo (cassa o mercato) sotto il dito: sul modello, o sulla cella (il dito è largo: basta un giro attorno). */
  luogoSotto(x, y) {
    const hit = this._raggio(x, y).intersectObjects(this.luoghi.map(l => l.grp), true)[0]
    let o = hit && hit.object
    while (o && !(o.userData.bersaglio && o.userData.bersaglio.kind === 'luogo')) o = o.parent
    if (o) return this.luoghi.find(l => l.grp === o)
    const p = this.puntaSuolo(x, y); if (!p) return null
    return this.luoghi.find(l => p.x >= l.i - 0.5 && p.x <= l.i + l.w + 0.5 && p.z >= l.j - 0.5 && p.z <= l.j + l.d + 0.5) || null
  }
  /** Le celle libere attorno a un luogo: da lì lo si serve. */
  celleDi(l) {
    const out = []
    for (let a = -1; a <= l.w; a++) for (let b = -1; b <= l.d; b++) if (a < 0 || a >= l.w || b < 0 || b >= l.d) out.push([l.i + a, l.j + b])
    return out.filter(([i, j]) => this.m.libera(i, j))
  }

  tocca(x, y) {
    const { ui, eroe, m } = this
    if (ui.fogliAperti() || eroe.az) return
    const l = this.luogoSotto(x, y)
    if (l) {
      const centro = new THREE.Vector3(l.i + l.w / 2, 0, l.j + l.d / 2)
      return void eroe.vaiA(this.celleDi(l), () => { eroe.faccia(centro); ui.apriLuogo(l.nome) }, centro)
    }
    const p = this.puntaSuolo(x, y); if (!p) return
    const i = Math.floor(p.x), j = Math.floor(p.z), cand = []
    for (let a = -2; a <= 2; a++) for (let b = -2; b <= 2; b++) if (m.libera(i + a, j + b)) cand.push([i + a, j + b, Math.hypot(a, b)])
    cand.sort((u, v) => u[2] - v[2])
    if (cand.length) eroe.vaiA([[cand[0][0], cand[0][1]]], null, null)
  }

  _fotogramma(ts) {
    super._fotogramma(ts)
    for (const l of this.luoghi) {
      const [x, y, visto] = this.proietta(l.grp.position, l.grp.userData.altezza || 1.2)
      l.badge.metti(x, y, visto && x > 20 && x < this.rect.width - 20 && y > 20 && y < this.rect.height - 20)
    }
  }

  via() {
    for (const l of this.luoghi) { l.badge.togli(); this.scena.remove(l.grp) }
    super.via()
    try { this.renderer.forceContextLoss() } catch (e) { /* già andato */ }       // un contesto in meno quando si torna a casa
  }
}
