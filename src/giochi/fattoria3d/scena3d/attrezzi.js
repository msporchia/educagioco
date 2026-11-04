// I campi alla Hay Day (docs/fattoria3d/campi.md): un tocco su un campo porta accanto l'attrezzo giusto (i semi se è vuoto, il falcetto se è
// pronto) e l'attrezzo si trascina sui campi, uno o tanti: il campo cambia sotto il dito, senza aspettare il contadino. Le regole sono del motore.
export class Attrezzi {
  constructor(mondo) { this.w = mondo; this.aperto = null; this.fatti = null; this.seme = null }

  /** Un tocco su un campo: l'attrezzo se c'è qualcosa da fare, se no quanto manca. */
  tocco(c) {
    const { m, azioni } = this.w
    if (m.campoVuoto(c) || m.campoMaturo(c)) this.apri(c)
    else azioni.campo(c)
  }
  /** `seme`: la coltura da mostrare per prima (un consiglio che dice cosa seminare). */
  apri(c, seme = null) {
    const w = this.w, tipo = w.m.campoVuoto(c) ? 'semi' : 'falce'
    const [x, y] = w.proietta(w.pezzi.centroDi({ kind: 'cosa', id: c.id }), 0.3)
    this.aperto = { tipo, id: c.id }
    w.ui.attrezzi({ tipo, x, y, seme, larghezza: w.rect.width, altezza: w.rect.height })
  }
  chiudi() {
    if (!this.aperto) return
    this.aperto = null; this.fatti = null; this.seme = null
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
  prendi(seme) { this.fatti = new Set(); this.seme = seme }
  /** Il dito è passato su (x, y): ogni campo si fa una volta sola. Un rifiuto (lo scomparto pieno, poche monete) lo dice e ferma il giro. */
  passa(x, y) {
    if (!this.fatti || !this.aperto) return
    const { m, azioni } = this.w, p = this.w.puntaSuolo(x, y), c = p && m.cosaSu(Math.floor(p.x), Math.floor(p.z))
    if (!c || c.tipo !== 'campo' || this.fatti.has(c.id)) return
    const semi = this.aperto.tipo === 'semi'
    if (!(semi ? m.campoVuoto(c) : m.campoMaturo(c))) return
    this.fatti.add(c.id)
    if (!(semi ? azioni.semina(c, this.seme) : azioni.raccogli(c))) this.fatti = null
  }
  /** Il dito si alza: fatto qualcosa si chiude, se no l'attrezzo resta lì e si riprova. */
  lascia() {
    const fatto = this.fatti && this.fatti.size > 0
    this.fatti = null
    if (fatto) this.chiudi()
  }
}
