/* ═══════════════════════════════════════════════════════════════════
   IL DITO SUL CAMPO

   Il campo si tocca in due modi, e sono lo stesso gesto finché non si
   muove: fermo, si apre la scheda di quello che si è toccato — una
   torre da far salire, una piazzola dove costruire; scivolando, la
   torre cambia postazione. Spostare non costa energia — è tattica, non
   acquisto — ma vale solo sulle piazzole libere, che si illuminano
   mentre si trascina.

   Qui c'è la **regola** del gesto: quando comincia, cosa ha preso il
   dito, quale piazzola è a tiro, dove finisce. Il DOM — coordinate del
   canvas, telecamera da invertire, cattura del puntatore — resta nel
   componente: sono le cose che non si possono provare senza browser, e
   non devono stare nella stessa scatola.
   ═══════════════════════════════════════════════════════════════════ */

/* quanto lontano deve andare il dito prima che sia uno spostamento e non
   un tocco, e fin dove si cerca la torre e la piazzola (in unità) */
const SOGLIA = 10
const RAGGIO_TORRE = 26
const RAGGIO_PIAZZOLA = 44

export class Trascino {
  constructor({ tocca, apri, suona = () => {} }) {
    this.tocca = tocca              // il dito si alza su una torre senza aver mosso
    this.apri = apri || (() => {})  // ...o su una piazzola libera
    this.suona = suona
    this.motore = null; this.S = 1
    this.attivo = null              // { torre, da, mosso, posto } oppure { piazzola }
  }

  /* una partita nuova, o uno schermo di misura diversa */
  attacca(motore, S) { this.motore = motore; this.S = S; this.attivo = null }
  misura(S) { this.S = S }

  get mosso() { return !!this.attivo && this.attivo.mosso }
  /* la torre che il dito ha in mano, se ne ha una: il resto del mondo
     chiede questo e non deve sapere com'è fatto `attivo` */
  get torre() { return this.attivo && this.attivo.torre ? this.attivo.torre : null }
  /* la piazzola su cui la torre in mano sta per atterrare, se ce n'è una */
  get posto() { return this.attivo && this.attivo.posto != null ? this.attivo.posto : -1 }

  torreSotto(x, y) {
    let vicina = null, minima = RAGGIO_TORRE * this.S
    for (const t of this.motore.torri) {
      const d = Math.hypot(t.x - x, t.y - y)
      if (d <= minima) { minima = d; vicina = t }
    }
    return vicina
  }

  /* la piazzola libera più vicina al dito, se ce n'è una a tiro: torna
     l'indice, che è come il motore le chiama */
  postoLibero(x, y, sciolta = null) {
    let scelto = -1, minima = RAGGIO_PIAZZOLA * this.S
    this.motore.postazioni.forEach((p, i) => {
      if (!this.motore.libera(i, sciolta)) return
      const d = Math.hypot(p.x - x, p.y - y)
      if (d <= minima) { minima = d; scelto = i }
    })
    return scelto
  }

  /* torna `true` se ha preso qualcosa: solo allora il componente si
     tiene il puntatore */
  giu(x, y) {
    if (!this.motore) return false
    const t = this.torreSotto(x, y)
    if (t) {
      this.attivo = { torre: t, da: { x: t.x, y: t.y }, mosso: false, posto: -1 }
      return true
    }
    /* niente torre: se il dito è caduto vicino a una piazzola vuota, è
       lì che si vuole costruire. Si decide al rilascio, come per le
       torri, così un tocco storto si può ancora annullare uscendo. */
    const p = this.postoLibero(x, y)
    if (p < 0) return false
    this.attivo = { piazzola: p, da: { x, y }, mosso: false }
    return true
  }

  muovi(x, y) {
    const g = this.attivo
    if (!g || !g.torre) return
    if (!g.mosso && Math.hypot(x - g.da.x, y - g.da.y) < SOGLIA * this.S) return
    g.mosso = true
    g.torre.sposta(x, y)
    g.posto = this.postoLibero(x, y, g.torre)
  }

  su() {
    const g = this.attivo
    if (!g) return
    this.attivo = null
    if (g.piazzola != null) { this.apri(g.piazzola); return }
    if (!g.mosso) { this.tocca(g.torre); return }
    if (g.posto >= 0) {
      const p = this.motore.postazioni[g.posto]
      g.torre.sposta(p.x, p.y); this.suona('compra')
    } else g.torre.sposta(g.da.x, g.da.y)      // fuori dalle piazzole: torna a casa
  }
}
