// I gesti col dito (docs/fattoria3d/campi.md): un tocco su un campo porta accanto l'attrezzo giusto (i semi se è vuoto, il falcetto se è
// pronto) e l'attrezzo si trascina sui campi, uno o tanti: il campo cambia sotto il dito, senza aspettare il contadino. Allo stesso modo un tocco
// su una ciotola porta i cibi, sulla tinozza gli animali da lavare, su un recinto la nuvoletta col mangime: si trascinano dentro
// (docs/fattoria3d/cura-sul-prato.md). Le regole sono del motore.
const VICINO = 70, MANO = 52             // a quanti pixel dal bersaglio il dito conta come «dentro», e di quanto la figura in mano sta sopra il dito: vale anche lei

export class Attrezzi {
  constructor(mondo) { this.w = mondo; this.aperto = null; this.fatti = null; this.presa = null; this.sopra = false; this.estraneo = null }

  /** Un tocco su un campo: l'attrezzo se c'è qualcosa da fare, se no quanto manca. */
  tocco(c) {
    const { m, azioni } = this.w
    if (m.campoVuoto(c) || m.campoMaturo(c)) this.apri(c)
    else azioni.campo(c)
  }
  /** `seme`: la coltura da mostrare per prima (un consiglio che dice cosa seminare). */
  apri(c, seme = null) { this._accanto(c, { tipo: this.w.m.campoVuoto(c) ? 'semi' : 'falce', seme }) }
  /** Un tocco su una ciotola: i cibi, solo se ha fame. */
  ciotola(c) {
    const { m, pezzi } = this.w, id = c.bestia, nome = m.cura.nomeDi(id)
    pezzi.salta(c.id)
    if (!m.cura.haFame(id)) return this._no(`${nome} non ha fame: quando ne avrà, ti chiamerà dalla sua ciotola`)
    const voci = m.cura.perLaCiotola(id), chiesto = voci.find(g => g.vuole)
    this._accanto(c, { tipo: 'ciotola', bestia: id, voci, riga: chiesto ? `${nome} vorrebbe ${chiesto.emoji} ${chiesto.nome.toLowerCase()}` : `${nome} ha fame!` })
  }
  /** Un tocco sulla tinozza: chi è sporco, in vignetta. */
  tinozza(c) {
    const { m, pezzi } = this.w, sporche = m.cura.sporche()
    pezzi.salta(c.id)
    if (!sporche.length) return this._no('Sono tutti puliti: la tinozza serve quando qualcuno si sporca')
    this._accanto(c, { tipo: 'tinozza', voci: sporche.map(id => ({ id, nome: m.cura.nomeDi(id), emoji: '🐾' })), riga: 'Trascinalo nella tinozza: 🪙 1' })
  }
  /** La nuvoletta sopra un recinto: il mangime che chiede. `riga`: quello che manca, se non ne hai. */
  recinto(c, riga = '') {
    const voci = this.w.m.mangimeDi(c)
    this._accanto(c, { tipo: 'recinto', voci, riga: riga || `Hanno fame: trascina qui ${voci[0].nome.toLowerCase()}` })
  }
  /** Un gesto che non fa niente lo dice: nel fumetto del contadino e in cima alla scena (lui può essere lontano). */
  _no(testo) { this.w.fx.parla(testo); this.w.ui.rifiuto?.(testo) }
  _accanto(c, info) {
    const w = this.w, [x, y] = w.proietta(w.pezzi.centroDi({ kind: 'cosa', id: c.id }), 0.3)
    this.aperto = { ...info, id: c.id, x, y, larghezza: w.rect.width, altezza: w.rect.height }
    w.ui.attrezzi(this.aperto)
  }
  chiudi() {
    if (!this.aperto) return
    this.aperto = null; this.fatti = null; this.presa = null; this.sopra = false; this.estraneo = null
    this.w.ui.attrezzi(null)
  }
  /** Il contadino va al primo campo che ne ha bisogno e lì compare l'attrezzo (il tasto di «E adesso?»). */
  vaiAlCampo(che, seme = null) {
    const w = this.w, { m } = w, c = m.s.cose.find(x => x.tipo === 'campo' && (che === 'semina' ? m.campoVuoto(x) : m.campoMaturo(x)))
    if (!c) return
    const b = { kind: 'cosa', id: c.id }
    if (!w.eroe.vaiA(w.celleDiServizio(b), () => this.apri(c, seme), w.centroDi(b))) this.apri(c, seme)
  }

  // ── il dito con l'attrezzo in mano ──
  get _suiCampi() { return this.aperto && (this.aperto.tipo === 'semi' || this.aperto.tipo === 'falce') }
  prendi(k) { this.fatti = new Set(); this.presa = k; this.estraneo = null }
  /** Il dito è passato su (x, y). Sui campi ognuno si fa una volta sola, e un rifiuto (lo scomparto pieno, poche monete) lo dice e ferma il giro; altrove si guarda solo se è sopra il bersaglio. */
  passa(x, y) {
    if (!this.fatti || !this.aperto) return
    if (!this._suiCampi) {
      const su = this._dentro(x, y)
      if (su !== this.sopra) { this.sopra = su; this.w.ui.attrezzi({ ...this.aperto, sopra: su }) }
      return
    }
    const { m, azioni } = this.w, p = this.w.puntaSuolo(x, y), c = p && m.cosaSu(Math.floor(p.x), Math.floor(p.z))
    if (!c || c.tipo !== 'campo' || this.fatti.has(c.id)) return
    const semi = this.aperto.tipo === 'semi'
    if (!(semi ? m.campoVuoto(c) : m.campoMaturo(c))) { this.estraneo = this.estraneo || c; return }      // il primo campo su cui l'attrezzo non serve: se la passata non fa altro, si dice perché
    this.fatti.add(c.id)
    if (!(semi ? azioni.semina(c, this.presa) : azioni.raccogli(c))) this.fatti = null
  }
  /** Il dito è passato su un campo dove l'attrezzo non serve e non ha fatto altro: dice cos'ha quel campo e cosa farci. */
  _nonServe(c) {
    const { m, azioni } = this.w
    if (this.aperto.tipo === 'semi') return m.campoMaturo(c) ? azioni.dici('È già pronto: raccoglilo col falcetto') : azioni.campo(c)
    return m.campoVuoto(c) ? azioni.dici('È vuoto: prima semina qualcosa') : azioni.campo(c)
  }
  _dentro(x, y) {
    const { m, rect } = this.w, a = this.aperto, p = this.w.puntaSuolo(x, y), c = p && m.cosaSu(Math.floor(p.x), Math.floor(p.z))
    if (c && c.id === a.id) return true
    const dx = x - (rect.left || 0) - a.x, dy = y - (rect.top || 0) - a.y
    return Math.hypot(dx, dy) < VICINO || Math.hypot(dx, dy - MANO) < VICINO
  }
  /** Il dito si alza: sui campi fatto qualcosa si chiude, se no l'attrezzo resta lì e si riprova; altrove va dentro solo se è sopra il bersaglio. */
  lascia() {
    const fatto = this.fatti && this.fatti.size > 0, sopra = this.sopra, estraneo = this.estraneo
    this.fatti = null; this.sopra = false; this.estraneo = null
    if (this._suiCampi) {
      if (fatto) this.chiudi()
      else if (estraneo) this._nonServe(estraneo)           // una passata che non ha fatto niente non fa finta di niente
      return
    }
    if (!this.aperto) return
    if (sopra) this.metti(this.presa)
    else this.w.ui.attrezzi(this.aperto)
  }
  /** Quello che si è portato (o toccato: chi ha quattro anni trascina male) va dentro. Se il motore dice di no resta aperto. */
  metti(k) {
    const a = this.aperto, { m, ui, azioni } = this.w
    if (!a) return
    if (a.tipo === 'ciotola' ? ui.riempi(a.bestia, k) : a.tipo === 'tinozza' ? ui.lava(k) : azioni.nutriRecinto(m.cosa(a.id))) this.chiudi()
  }
}
