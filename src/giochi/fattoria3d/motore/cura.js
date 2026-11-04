/* La cura delle bestie di casa (G6): comprarle, nutrirle, coccolarle, dare un nome, spostarle. Le regole sono quelle della fattoria di sempre
   (src/giochi/fattoria3d/da2d/motore/fattoria.js: compraBestia, nutri, coccola, rinominaBestia, spostaBestia), le tabelle sono in `dati/bestie.js`.
   Lo stato sta in `stato.casa` (un record per bestia). Principi: una bestia non sta mai male e non muore (i bisogni non scendono sotto
   `FONDO`); il rifiuto viene PRIMA del pagamento (sbagliare costa solo il gesto); una coccola gratis c'è sempre; il premio è esperienza,
   mai monete, una volta per ciclo. I compagni (Watson e i gatti di casa) si adottano e si curano allo stesso modo, ma non si spostano:
   girano per la fattoria. Nessun animale è un regalo del livello: il record nasce quando lo si adotta (`compra`). Vedi docs/fattoria3d/bestie-di-casa.md. */
import { BESTIE, IDS_BESTIE, CURATI, curabile, cibo as ciboPerId, coccola as coccolaPerId, gradisce, scendi, tuttoAPosto, premiaSeStaBene, nuovo, pulisciNome, comeCompagno, perche,
  prezzoAdozione, FAME, FELICE, SPORCO, FONDO, cibiPer, ciboChiesto } from '../dati/bestie.js'
import { COMPAGNI, DAVANTI_CASA } from '../dati/compagni.js'
import { addobbiPer, staA, leggiAddobbo, faChiave, chiaveAddobbo } from '../dati/addobbi.js'
import { vestitiBestiaInForma } from '../dati/bestie.js'

const PIENO = 0.93          // sopra, un bisogno è «a posto» e il gesto non serve (come in 2D)
const PANCIA_TORTA = 0.5    // la torta nella ciotola: fa festa e riempie anche la pancia

export class Cura {
  /** `m`: la Fattoria3d (monete, esperienza, scorte, terreno). */
  constructor(m) { this.m = m }

  get casa() { return this.m.s.casa }
  /** Il record di una bestia tua, o null. Nessun animale arriva da solo: il record c'è dall'adozione (un salvataggio di prima lo ebbe da `normalizza`, `adozioni`). */
  _record(id) { return this.casa[id] || null }
  ho(id) { return !!this._record(id) }
  /** Le bestie di casa adottate, nell'ordine in cui sono nel catalogo (senza Watson e i gatti di casa). */
  tue() { return IDS_BESTIE.filter(id => this.ho(id)) }
  /** Watson e i gatti di casa che hai adottato. */
  compagniTuoi() { return Object.keys(CURATI).filter(id => this.ho(id)) }
  /** Tutte quelle che si curano adesso: i compagni, poi le bestie di casa. */
  curate() { return [...this.compagniTuoi(), ...this.tue()] }
  /** La bestia com'è adesso (il calo si applica leggendo: non dipende da quanto spesso si guarda), o null se non è tua. */
  stato(id) {
    const b = this._record(id)
    if (!b) return null
    return scendi(b, this.m.ora())
  }
  nomeDi(id) { const b = this.casa[id]; return (b && b.nome) || (curabile(id) && curabile(id).nome) || '' }
  /** Il nome scelto dal bambino, o '' se non l'ha ancora dato. */
  nomeScelto(id) { const b = this.casa[id]; return (b && b.nome) || '' }

  /** Adotta un animale (una razza o uno dei compagni): esperienza come ogni spesa, mai monete. { ok, costo } o un rifiuto (`sconosciuta`, `gia-tua`, `non-sbloccato` con `liv`, `poche-monete` con `costo`). */
  compra(id) {
    const d = BESTIE[id] || CURATI[id]
    if (!d) return { ok: false, motivo: 'sconosciuta' }
    if (this.ho(id)) return { ok: false, motivo: 'gia-tua' }
    const chiusa = this.m._chiusa(d.liv)
    if (chiusa) return chiusa
    const costo = this.prezzoDi(id)
    if (!this.m._spendi(costo)) return { ok: false, motivo: 'poche-monete', costo }
    this.casa[id] = { ...nuovo(this.m.ora()), premiato: false }
    this.sistema()
    this.m._evento('bestiaDiCasa', { bestia: id })
    return { ok: true, costo }
  }
  /** Quanto costa adottarlo adesso: il suo prezzo, più lo scatto per ogni animale che hai già. */
  prezzoDi(id) { const d = BESTIE[id] || CURATI[id]; return d ? prezzoAdozione(d.prezzo, this.curate().length) : 0 }

  // ── la ciotola e la tinozza: pezzi veri, che arrivano con gli animali (docs/fattoria3d/cura-sul-prato.md) ──
  ciotolaDi(id) { return this.m.s.cose.find(c => c.tipo === 'ciotola_bestia' && c.bestia === id) || null }
  tinozza() { return this.m.s.cose.find(c => c.tipo === 'tinozza') || null }
  /** Mette la ciotola a chi non ce l'ha, e la tinozza col primo animale: all'adozione e all'apertura (chi aveva già gli animali le trova sul prato). */
  sistema() {
    for (const id of this.curate()) if (!this.ciotolaDi(id)) { const k = this.casaDi(id); this._dono('ciotola_bestia', k ? [k[0] + 0.5, k[1] + 0.5] : DAVANTI_CASA, { bestia: id }) }
    if (this.curate().length && !this.tinozza()) this._dono('tinozza', [DAVANTI_CASA[0] + 4, DAVANTI_CASA[1] + 1])
  }
  /** Un pezzo regalato nel posto libero più vicino al punto (mai sul punto: davanti alla porta si passa). Niente posto: niente pezzo, ci riprova alla prossima apertura. */
  _dono(tipo, [x, z], resto = {}) {
    const m = this.m, fila = []
    for (let a = -9; a <= 9; a++) for (let b = -9; b <= 9; b++) {
      const i = Math.floor(x) + a, j = Math.floor(z) + b, d = Math.hypot(a, b)
      if (d >= 1.5) fila.push([d, i, j])
    }
    fila.sort((u, v) => u[0] - v[0] || u[1] - v[1] || u[2] - v[2])
    const p = fila.find(([, i, j]) => m.puoMettere(tipo, i, j).ok)
    if (!p) return null
    const c = { id: m.s.prossimoId++, tipo, i: p[1], j: p[2], ...resto }
    m.s.cose.push(c); m._occupa(c, c.id)
    return c
  }

  // ── la fame ──
  haFame(id) { const b = this.stato(id); return !!b && b.pancia < FAME }
  /** C'è almeno una cosa che le si può dare, con le scorte o con le monete? */
  puoNutrire(id) { const d = curabile(id); return !!d && cibiPer(d.famiglia).some(c => (c.da ? this.m.scortaDi(c.da) > 0 : c.prezzo <= this.m.monete())) }
  /** Insiste finché non mangia; se non hai niente da darle si mette tranquilla: non è una colpa. */
  insiste(id) { return this.haFame(id) && this.puoNutrire(id) }
  /** Cosa chiede la ciotola. */
  vuole(id) { const d = curabile(id), b = this.casa[id]; return d && b ? ciboChiesto(d.famiglia, b.pasti, k => this.m.scortaDi(k)) : null }
  /** I gettoni della ciotola: cosa chiede, poi quello che puoi dare, poi il resto. La torta c'è solo se ce l'hai. */
  perLaCiotola(id) {
    const d = curabile(id), m = this.m, chiesto = this.vuole(id)
    const voce = (c, k = c.id) => ({ id: k, nome: c.nome, emoji: c.emoji, k: c.da || null, prezzo: c.prezzo || 0, n: c.da ? m.scortaDi(c.da) : null, ok: c.da ? m.scortaDi(c.da) > 0 : c.prezzo <= m.monete(), vuole: !!chiesto && c.id === chiesto.id })
    const fila = cibiPer(d.famiglia).map(c => voce(c)), t = coccolaPerId('festa')
    if (m.scortaDi(t.da) > 0) fila.push({ ...voce(t, 'festa'), nome: 'Torta' })
    return fila.sort((a, b) => b.vuole - a.vuole || b.ok - a.ok || a.prezzo - b.prezzo)
  }
  /** Mette nella ciotola, se ha fame: un cibo (`nutri`), o la torta (`festa`), che riempie la pancia e fa festa. Conta il pasto: la prossima volta chiederà un'altra cosa. */
  riempi(id, k) {
    if (this.stato(id) && !this.haFame(id)) return { ok: false, motivo: 'non-ha-fame' }
    const r = k === 'festa' ? this._torta(id) : this.nutri(id, k)
    if (r.ok) this.casa[id].pasti = (this.casa[id].pasti || 0) + 1
    return r
  }
  _torta(id) {
    const b = this.stato(id), g = coccolaPerId('festa')
    if (!b) return { ok: false, motivo: 'non-e-tua' }
    const r = this._dai(id, b, g, 'gioco')
    if (r.ok) b.pancia = Math.min(1, b.pancia + PANCIA_TORTA)
    return r
  }

  // ── lo sporco e la tinozza ──
  /** Chi si vede sporco, dal più sporco. */
  sporche() { return this.curate().filter(id => this.stato(id).pelo < SPORCO).sort((a, b) => this.casa[a].pelo - this.casa[b].pelo) }
  /** Si sporca un po' (si è rotolata, ha scavato): mai sotto il fondo. */
  sporca(id, quanto) { const b = this.stato(id); if (b) b.pelo = Math.max(FONDO, b.pelo - quanto) }
  /** Si può cominciare il bagno? Il rifiuto viene prima di strofinare: null se va bene, se no quello che direbbe `lava`. */
  rifiutoBagno(id) {
    const b = this.stato(id), g = coccolaPerId('spazzola')
    if (!b) return { ok: false, motivo: 'non-e-tua' }
    if (b.pelo > PIENO) return { ok: false, motivo: 'non-serve' }
    if (g.prezzo > this.m.monete()) return { ok: false, motivo: 'poche-monete', costo: g.prezzo }
    return null
  }
  /** Il bagno finito: 🪙1, e la lascia pulita del tutto. Rifiuti: quelli di `coccola`. */
  lava(id) {
    const b = this.stato(id), g = coccolaPerId('spazzola')
    if (!b) return { ok: false, motivo: 'non-e-tua' }
    if (b.pelo > PIENO) return { ok: false, motivo: 'non-serve' }
    return this._dai(id, b, { ...g, quanto: 1 }, 'pelo')
  }

  // ── il gioco: un tocco sull'animale ──
  /** Gratis, sempre. Riempie e può dare il premio solo se non è già felice: da felice ci giochi quanto vuoi, ma non ne viene niente. */
  gioca(id) {
    const b = this.stato(id)
    if (!b) return { ok: false, motivo: 'non-e-tua' }
    if (b.gioco >= FELICE) return { ok: true, costo: 0, felice: true }
    const eraAPosto = tuttoAPosto(b)
    b.gioco = 1; b.quando = this.m.ora()
    this.m._evento('coccola', { bestia: id })
    return { ok: true, costo: 0, premio: this._premia(id, b, eraAPosto) }
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
  quantiNelCassetto(chiave) { return this.cassetto[chiaveAddobbo(chiave)] || 0 }      // l'id solo vale il colore di base
  /** Quello che porta una bestia: { aggancio: id }. */
  addossoA(id) { const b = this.casa[id]; return (b && b.addobbi) || {} }
  /** Gli addobbi da mostrare nel negozio di una bestia, ognuno con `colori` (ognuno con `hai` = quanti nel cassetto e `addosso` = lo porta lei), `addosso`
      (il colore che porta, o null) e `bloccato` (il livello che manca, o 0), `fuoriStagione` (la festa è finita: i colori che non hai non si comprano). Un addobbo si compra in un colore, e quel colore resta tuo. */
  vestiarioDi(id, stagione = '') {
    const su = this.addossoA(id), tieni = [...Object.keys(this.cassetto), ...Object.values(su)].map(k => k.split(':')[0]), liv = this.m.livello()
    return addobbiPer(id, { stagione, tieni }).map(a => {
      const portato = su[a.dove] && su[a.dove].split(':')[0] === a.id ? su[a.dove].split(':')[1] : null
      return { ...a, addosso: portato, bloccato: a.liv > liv ? a.liv : 0, fuoriStagione: !!a.stagione && a.stagione !== stagione, colori: a.colori.map(c => ({ ...c, hai: this.quantiNelCassetto(faChiave(a.id, c.id)), addosso: portato === c.id })) }
    })
  }
  /** Mette un addobbo a una bestia, nel colore dato (`<id>:<colore>`; l'id solo vale il colore di base). Se quel colore non è nel cassetto lo compra
      (il prezzo è sul tasto: ogni colore si paga), e quello che c'era su quell'aggancio torna nel cassetto.
      Rifiuti: `non-e-tua`, `non-esiste`, `non-gli-sta` (con `dove`), `gia-addosso`, `fuori-stagione`, `troppo-presto` (con `liv`), `poche-monete` (con `costo`). */
  vesti(id, chiave, { stagione = '' } = {}) {
    const b = this._record(id), l = leggiAddobbo(chiave)
    if (!b) return { ok: false, motivo: 'non-e-tua' }
    if (!l) return { ok: false, motivo: 'non-esiste' }
    const a = l.addobbo, k = l.chiave
    if (!staA(a.id, id)) return { ok: false, motivo: 'non-gli-sta', dove: a.dove }
    const su = b.addobbi || {}, prima = su[a.dove] || null
    if (prima === k) return { ok: false, motivo: 'gia-addosso' }
    let costo = 0
    if (this.quantiNelCassetto(k) < 1) {
      if (a.stagione && a.stagione !== stagione) return { ok: false, motivo: 'fuori-stagione', stagione: a.stagione }
      if (a.liv > this.m.livello()) return { ok: false, motivo: 'troppo-presto', liv: a.liv }
      if (a.prezzo > this.m.monete()) return { ok: false, motivo: 'poche-monete', costo: a.prezzo }
      this.m._spendi(a.prezzo); costo = a.prezzo
    } else if (--this.cassetto[k] < 1) delete this.cassetto[k]
    if (prima) this.cassetto[prima] = this.quantiNelCassetto(prima) + 1
    b.addobbi = { ...su, [a.dove]: k }
    this.m._evento('vestita', { bestia: id, addobbo: a.id, colore: l.colore.id })
    return { ok: true, costo, addobbo: a, colore: l.colore, tolto: prima }
  }
  /** Toglie quello che una bestia porta su un aggancio: torna nel cassetto, gratis. */
  spoglia(id, dove) {
    const b = this.casa[id], su = b && b.addobbi
    if (!su || !su[dove]) return { ok: false, motivo: 'non-lo-porta' }
    const tolto = su[dove]
    delete su[dove]
    if (!Object.keys(su).length) delete b.addobbi
    this.cassetto[tolto] = this.quantiNelCassetto(tolto) + 1
    return { ok: true, costo: 0, tolto }
  }

  // ── i set salvati di una bestia (docs/fattoria3d/addobbi.md, «I set»): sei posti, quello che porta adesso; rimetterli non compra niente ──
  vestitiDi(id) { const b = this.casa[id]; return (b && b.vestiti) || [] }
  _vestiti(id, f) { const b = this._record(id); if (!b) return { ok: false, motivo: 'non-e-tua' }; const v = vestitiBestiaInForma(f(this.vestitiDi(id))); if (v.length) b.vestiti = v; else delete b.vestiti; return { ok: true, costo: 0 } }
  salvaVestito(id, posto, nome) { return this._vestiti(id, l => [...l.filter(v => v.posto !== posto), { posto, nome, addobbi: { ...this.addossoA(id) } }]) }
  rinominaVestito(id, posto, nome) { return this._vestiti(id, l => l.map(v => (v.posto === posto ? { ...v, nome } : v))) }
  togliVestito(id, posto) { return this._vestiti(id, l => l.filter(v => v.posto !== posto)) }

  /** Watson e i gatti di casa adottati, nella forma di `COMPAGNI` (per la scena); il nome è quello scelto, se no il loro. */
  compagniAdottati() { return this.compagniTuoi().map(id => ({ id, ...COMPAGNI[id], nome: this.nomeDi(id) })) }
  /** Le bestie tue nella forma dei compagni (per la scena); il nome è quello scelto. */
  compagniPresi() { return this.tue().map(id => comeCompagno(id, this.nomeScelto(id))) }
}
