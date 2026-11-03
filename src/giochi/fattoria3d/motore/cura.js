/* La cura delle bestie di casa (G6): comprarle, nutrirle, coccolarle, dare un nome, spostarle. Le regole sono quelle della fattoria di sempre
   (src/giochi/fattoria3d/da2d/motore/fattoria.js: compraBestia, nutri, coccola, rinominaBestia, spostaBestia), le tabelle sono in `dati/bestie.js`.
   Lo stato sta in `stato.casa` (un record per bestia). Principi: una bestia non sta mai male e non muore (i bisogni non scendono sotto
   `FONDO`); il rifiuto viene PRIMA del pagamento (sbagliare costa solo il gesto); una coccola gratis c'è sempre; il premio è esperienza,
   mai monete, una volta per ciclo. I compagni gratis (Watson e i gatti) si curano allo stesso modo: il loro record nasce da sé quando arrivano
   col livello, e non si comprano né si spostano. Vedi docs/fattoria3d/bestie-di-casa.md. */
import { BESTIE, IDS_BESTIE, CURATI, curabile, cibo as ciboPerId, coccola as coccolaPerId, gradisce, scendi, tuttoAPosto, premiaSeStaBene, nuovo, pulisciNome, comeCompagno, perche } from '../dati/bestie.js'
import { compagniAl } from '../dati/compagni.js'
import { addobbo as addobboPerId, addobbiPer, staA, PREZZO_TINTA, conTinta } from '../dati/addobbi.js'
import { tintaValida } from '../../../grafica/persona/tinte.js'
import { vestitiBestiaInForma } from '../dati/bestie.js'

const PIENO = 0.93          // sopra, un bisogno è «a posto» e il gesto non serve (come in 2D)

export class Cura {
  /** `m`: la Fattoria3d (monete, esperienza, scorte, terreno). */
  constructor(m) { this.m = m }

  get casa() { return this.m.s.casa }
  /** Il record di una bestia tua, o null. Un compagno gratis arrivato col livello lo riceve la prima volta che lo si guarda (bisogni di uno nuovo). */
  _record(id) {
    if (!this.casa[id] && CURATI[id] && CURATI[id].liv <= this.m.livello()) this.casa[id] = { ...nuovo(this.m.ora()), premiato: false }
    return this.casa[id] || null
  }
  ho(id) { return !!this._record(id) }
  /** Le bestie di casa comprate, nell'ordine in cui sono nel catalogo (senza i compagni gratis). */
  tue() { return IDS_BESTIE.filter(id => this.ho(id)) }
  /** Tutte quelle che si curano adesso: i compagni arrivati, poi le bestie di casa. */
  curate() { return [...compagniAl(this.m.livello()).map(c => c.id).filter(id => CURATI[id]), ...this.tue()] }
  /** La bestia com'è adesso (il calo si applica leggendo: non dipende da quanto spesso si guarda), o null se non è tua. */
  stato(id) {
    const b = this._record(id)
    if (!b) return null
    return scendi(b, this.m.ora())
  }
  nomeDi(id) { const b = this.casa[id]; return (b && b.nome) || (curabile(id) && curabile(id).nome) || '' }
  /** Il nome scelto dal bambino, o '' se non l'ha ancora dato. */
  nomeScelto(id) { const b = this.casa[id]; return (b && b.nome) || '' }

  /** Prende una bestia: esperienza come ogni spesa, mai monete. { ok, costo } o un rifiuto (`sconosciuta`, `gia-tua`, `non-sbloccato` con `liv`, `poche-monete` con `costo`). */
  compra(id) {
    const d = BESTIE[id]
    if (!d) return { ok: false, motivo: 'sconosciuta' }
    if (this.ho(id)) return { ok: false, motivo: 'gia-tua' }
    const chiusa = this.m._chiusa(d.liv)
    if (chiusa) return chiusa
    if (!this.m._spendi(d.prezzo)) return { ok: false, motivo: 'poche-monete', costo: d.prezzo }
    this.casa[id] = { ...nuovo(this.m.ora()), premiato: false }
    this.m._evento('bestiaDiCasa', { bestia: id })
    return { ok: true, costo: d.prezzo }
  }

  /** Dà da mangiare. `cibo`: l'oggetto o l'id. Rifiuti: `non-e-tua`, `non-gli-piace` (con `perche`), `non-ha-fame`, `manca-roba` (con `prodotto`), `poche-monete` (con `costo`). */
  nutri(id, cibo) {
    const b = this.stato(id), c = ciboPerId(typeof cibo === 'string' ? cibo : cibo && cibo.id)
    if (!b) return { ok: false, motivo: 'non-e-tua' }
    if (!c || !gradisce(c, curabile(id).famiglia)) return { ok: false, motivo: 'non-gli-piace', perche: perche(id, c && c.id) }
    if (b.pancia > PIENO) return { ok: false, motivo: 'non-ha-fame' }
    return this._dai(id, b, c, 'pancia')
  }

  /** Una coccola (spazzola, gioca, copertina, festa, bagnetto). Rifiuti: `non-e-tua`, `sconosciuta`, `non-serve`, `manca-roba`, `poche-monete`. */
  coccola(id, gesto) {
    const b = this.stato(id), g = coccolaPerId(typeof gesto === 'string' ? gesto : gesto && gesto.id)
    if (!b) return { ok: false, motivo: 'non-e-tua' }
    if (!g) return { ok: false, motivo: 'sconosciuta' }
    if (b[g.bisogno] > PIENO) return { ok: false, motivo: 'non-serve' }
    return this._dai(id, b, g, g.bisogno)
  }

  /** Una carezza: gratis, sempre, a chiunque (anche a zero monete e con il granaio vuoto). Non riempie niente: fa solo bene al cuore (cuoricini nella scena). */
  carezza(id) {
    if (!this._record(id)) return { ok: false, motivo: 'non-e-tua' }
    this.m._evento('carezza', { bestia: id })
    return { ok: true, costo: 0 }
  }

  /** Il pagamento in scorta o in monete (il rifiuto viene prima di tutto), poi il bisogno sale e, se è tutto a posto, il premio. */
  _dai(id, b, gesto, bisogno) {
    const m = this.m
    if (gesto.da) {
      if (m.scortaDi(gesto.da) < 1) return { ok: false, motivo: 'manca-roba', prodotto: gesto.da }
      m._togli(gesto.da, 1)
    } else if (gesto.prezzo) {
      if (gesto.prezzo > m.monete()) return { ok: false, motivo: 'poche-monete', costo: gesto.prezzo }
      m._spendi(gesto.prezzo)
    }
    const eraAPosto = tuttoAPosto(b)
    b[bisogno] = Math.min(1, b[bisogno] + gesto.quanto)
    b.quando = m.ora()
    m._evento(bisogno === 'pancia' ? 'pasto' : 'coccola', { bestia: id })
    return { ok: true, costo: gesto.prezzo || 0, prodotto: gesto.da || null, premio: this._premia(id, b, eraAPosto) }
  }

  /** Tutti e tre i bisogni nella fascia alta, e prima non lo erano: esperienza (un quindicesimo del prezzo), una volta per ciclo. */
  _premia(id, b, eraAPosto) {
    if (!premiaSeStaBene(b, eraAPosto)) return null
    const xp = curabile(id).premio
    this.m._guadagna(xp)
    return { xp }
  }

  /** Dà (o cambia) il nome: gratis e sempre. '' lo toglie (torna il nome della razza). */
  battezza(id, nome) {
    const b = this._record(id)
    if (!b) return { ok: false, motivo: 'non-e-tua' }
    const n = pulisciNome(nome)
    if (n) b.nome = n; else delete b.nome
    return { ok: true, nome: this.nomeDi(id) }
  }

  /** Dove sta di casa: la cella dove l'hai messa, o null (davanti alla casa). */
  casaDi(id) { const b = this.casa[id]; return b && Number.isInteger(b.i) ? [b.i, b.j] : null }
  /** La sposta, gratis: la cella dev'essere sul tuo terreno e libera. Un compagno gratis non si sposta: gira col contadino. */
  sposta(id, i, j) {
    const b = this.casa[id]
    if (!b) return { ok: false, motivo: 'non-e-tua' }
    if (CURATI[id]) return { ok: false, motivo: 'gira-con-te' }
    if (!this.m.cellaPropria(i, j) || !this.m.libera(i, j)) return { ok: false, motivo: 'non-ci-sta' }
    b.i = i; b.j = j
    return { ok: true, costo: 0 }
  }

  // ── gli addobbi (dati/addobbi.js): si comprano una volta e non si consumano; un aggancio tiene una cosa sola, e una seconda cambia la prima ──
  get cassetto() { return this.m.s.addobbi }
  quantiNelCassetto(id) { return this.cassetto[id] || 0 }
  /** Quello che porta una bestia: { aggancio: id }. */
  addossoA(id) { const b = this.casa[id]; return (b && b.addobbi) || {} }
  /** Le tinte di quello che porta: { aggancio: tinta }. */
  tinteA(id) { const b = this.casa[id]; return (b && b.tinte) || {} }
  /** Quello che porta con le tinte, come lo vuole la scena: { aggancio: 'id@tinta' | 'id' }. */
  addossoTintoA(id) { const su = this.addossoA(id), t = this.tinteA(id); return Object.fromEntries(Object.entries(su).map(([dove, a]) => [dove, conTinta(a, t[dove])])) }
  /** Le tinte comprate per un addobbo (il suo colore non c'è: è sempre suo). */
  tinteDi(addobboId) { return (this.m.s.tinteAddobbi || {})[addobboId] || [] }
  /** Gli addobbi da mostrare nel foglio di una bestia, ognuno con `addosso` (lo porta lei), `tinta` (quella che porta), `hai` (quanti nel cassetto),
      `tinte` (le tinte comprate) e il prezzo. */
  vestiarioDi(id, stagione = '') {
    const su = this.addossoA(id), t = this.tinteA(id), tieni = [...Object.keys(this.cassetto), ...Object.values(su)]
    return addobbiPer(id, { stagione, tieni }).map(a => ({ ...a, addosso: su[a.dove] === a.id, tinta: su[a.dove] === a.id ? t[a.dove] || null : null, hai: this.quantiNelCassetto(a.id), tinte: this.tinteDi(a.id) }))
  }
  /** Mette un addobbo a una bestia: se non è nel cassetto lo compra (il prezzo è sul tasto), e quello che c'era su quell'aggancio torna nel cassetto.
      Rifiuti: `non-e-tua`, `non-esiste`, `non-gli-sta` (con `dove`), `gia-addosso`, `fuori-stagione`, `poche-monete` (con `costo`). */
  vesti(id, addobboId, { stagione = '', tinta = undefined } = {}) {
    const b = this._record(id), a = addobboPerId(addobboId)
    if (!b) return { ok: false, motivo: 'non-e-tua' }
    if (!a) return { ok: false, motivo: 'non-esiste' }
    if (!staA(a.id, id)) return { ok: false, motivo: 'non-gli-sta', dove: a.dove }
    const su = b.addobbi || {}, prima = su[a.dove] || null, t = tintaValida(tinta), primaTinta = (b.tinte || {})[a.dove] || null
    // `tinta` non detta: quella che aveva se è lo stesso addobbo, se no il suo colore
    const nuovaTinta = tinta === undefined ? (prima === a.id ? primaTinta : null) : t
    if (prima === a.id && nuovaTinta === primaTinta) return { ok: false, motivo: 'gia-addosso' }
    const compra = prima !== a.id && this.quantiNelCassetto(a.id) < 1
    // la tinta: col suo colore niente; una tinta tua niente; una nuova costa PREZZO_TINTA, ma viene gratis con l'addobbo appena comprato
    const tintaNuova = !!nuovaTinta && !this.tinteDi(a.id).includes(nuovaTinta)
    const costo = (compra ? a.prezzo : 0) + (tintaNuova && !compra ? PREZZO_TINTA : 0)
    if (compra && a.stagione && a.stagione !== stagione) return { ok: false, motivo: 'fuori-stagione', stagione: a.stagione }
    if (costo > this.m.monete()) return { ok: false, motivo: 'poche-monete', costo }
    if (costo) this.m._spendi(costo)
    if (tintaNuova) this.m.s.tinteAddobbi = { ...(this.m.s.tinteAddobbi || {}), [a.id]: [...this.tinteDi(a.id), nuovaTinta] }
    if (prima !== a.id) {
      if (!compra && --this.cassetto[a.id] < 1) delete this.cassetto[a.id]
      if (prima) this.cassetto[prima] = this.quantiNelCassetto(prima) + 1
      b.addobbi = { ...su, [a.dove]: a.id }
    }
    const tinte = { ...(b.tinte || {}) }
    if (nuovaTinta) tinte[a.dove] = nuovaTinta; else delete tinte[a.dove]
    if (Object.keys(tinte).length) b.tinte = tinte; else delete b.tinte
    this.m._evento('vestita', { bestia: id, addobbo: a.id })
    return { ok: true, costo, addobbo: a, tolto: prima === a.id ? null : prima, tinta: nuovaTinta }
  }
  /** Toglie quello che una bestia porta su un aggancio: torna nel cassetto, gratis. */
  spoglia(id, dove) {
    const b = this.casa[id], su = b && b.addobbi
    if (!su || !su[dove]) return { ok: false, motivo: 'non-lo-porta' }
    const tolto = su[dove]
    delete su[dove]
    if (!Object.keys(su).length) delete b.addobbi
    if (b.tinte) { delete b.tinte[dove]; if (!Object.keys(b.tinte).length) delete b.tinte }
    this.cassetto[tolto] = this.quantiNelCassetto(tolto) + 1
    return { ok: true, costo: 0, tolto }
  }

  // ── i set salvati di una bestia (docs/fattoria3d/addobbi.md): sei posti, quello che porta adesso con le tinte ──
  vestitiDi(id) { const b = this.casa[id]; return (b && b.vestiti) || [] }
  _vestiti(id, f) { const b = this._record(id); if (!b) return { ok: false, motivo: 'non-e-tua' }; const v = vestitiBestiaInForma(f(this.vestitiDi(id))); if (v.length) b.vestiti = v; else delete b.vestiti; return { ok: true, costo: 0 } }
  salvaVestito(id, posto, nome) { return this._vestiti(id, l => [...l.filter(v => v.posto !== posto), { posto, nome, addobbi: { ...this.addossoA(id) }, tinte: { ...this.tinteA(id) } }]) }
  rinominaVestito(id, posto, nome) { return this._vestiti(id, l => l.map(v => (v.posto === posto ? { ...v, nome } : v))) }
  togliVestito(id, posto) { return this._vestiti(id, l => l.filter(v => v.posto !== posto)) }

  /** Le bestie tue nella forma dei compagni (per la scena); il nome è quello scelto. */
  compagniPresi() { return this.tue().map(id => comeCompagno(id, this.nomeScelto(id))) }
}
