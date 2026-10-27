/* La cura delle bestie di casa (G6): comprarle, nutrirle, coccolarle, dare un nome, spostarle. Le regole sono quelle della fattoria di sempre
   (src/giochi/fattoria/motore/fattoria.js: compraBestia, nutri, coccola, rinominaBestia, spostaBestia), le tabelle sono in `dati/bestie.js`.
   Lo stato sta in `stato.casa` (un record per bestia). Principi: una bestia non sta mai male e non muore (i bisogni non scendono sotto
   `FONDO`); il rifiuto viene PRIMA del pagamento (sbagliare costa solo il gesto); una coccola gratis c'è sempre; il premio è esperienza,
   mai monete, una volta per ciclo. Vedi docs/fattoria3d/bestie-di-casa.md. */
import { BESTIE, IDS_BESTIE, cibo as ciboPerId, coccola as coccolaPerId, gradisce, scendi, tuttoAPosto, premiaSeStaBene, nuovo, pulisciNome, comeCompagno, perche } from '../dati/bestie.js'

const PIENO = 0.93          // sopra, un bisogno è «a posto» e il gesto non serve (come in 2D)

export class Cura {
  /** `m`: la Fattoria3d (monete, esperienza, scorte, terreno). */
  constructor(m) { this.m = m }

  get casa() { return this.m.s.casa }
  ho(id) { return !!this.casa[id] }
  /** Le bestie tue, nell'ordine in cui sono nel catalogo. */
  tue() { return IDS_BESTIE.filter(id => this.ho(id)) }
  /** La bestia com'è adesso (il calo si applica leggendo: non dipende da quanto spesso si guarda), o null se non è tua. */
  stato(id) {
    const b = this.casa[id]
    if (!b) return null
    return scendi(b, this.m.ora())
  }
  nomeDi(id) { const b = this.casa[id]; return (b && b.nome) || (BESTIE[id] && BESTIE[id].nome) || '' }
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
    if (!c || !gradisce(c, BESTIE[id].famiglia)) return { ok: false, motivo: 'non-gli-piace', perche: perche(id, c && c.id) }
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
    if (!this.casa[id]) return { ok: false, motivo: 'non-e-tua' }
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
    const xp = BESTIE[id].premio
    this.m._guadagna(xp)
    return { xp }
  }

  /** Dà (o cambia) il nome: gratis e sempre. '' lo toglie (torna il nome della razza). */
  battezza(id, nome) {
    const b = this.casa[id]
    if (!b) return { ok: false, motivo: 'non-e-tua' }
    const n = pulisciNome(nome)
    if (n) b.nome = n; else delete b.nome
    return { ok: true, nome: this.nomeDi(id) }
  }

  /** Dove sta di casa: la cella dove l'hai messa, o null (davanti alla casa). */
  casaDi(id) { const b = this.casa[id]; return b && Number.isInteger(b.i) ? [b.i, b.j] : null }
  /** La sposta, gratis: la cella dev'essere sul tuo terreno e libera. */
  sposta(id, i, j) {
    const b = this.casa[id]
    if (!b) return { ok: false, motivo: 'non-e-tua' }
    if (!this.m.cellaPropria(i, j) || !this.m.libera(i, j)) return { ok: false, motivo: 'non-ci-sta' }
    b.i = i; b.j = j
    return { ok: true, costo: 0 }
  }

  /** Le bestie tue nella forma dei compagni (per la scena); il nome è quello scelto. */
  compagniPresi() { return this.tue().map(id => comeCompagno(id, this.nomeScelto(id))) }
}
