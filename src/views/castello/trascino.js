/* ═══════════════════════════════════════════════════════════════════
   IL DITO SUL CAMPO

   Il campo si tocca in due modi, e sono lo stesso gesto finché non si
   muove: fermo, la torre sale di livello; scivolando, la torre cambia
   postazione. Spostare non costa energia — è tattica, non acquisto — ma
   vale solo sulle piazzole libere, che si illuminano mentre si trascina.

   Qui c'è la **regola** del gesto: quando comincia, quale torre ha preso
   il dito, quale piazzola è a tiro, dove finisce. Il DOM — coordinate
   del canvas, cattura del puntatore — resta nel componente: sono le due
   cose che non si possono provare senza browser, e non devono stare
   nella stessa scatola.
   ═══════════════════════════════════════════════════════════════════ */

/* quanto lontano deve andare il dito prima che sia uno spostamento e non
   un tocco, e fin dove si cerca la torre e la piazzola (in unità) */
const SOGLIA = 10
const RAGGIO_TORRE = 26
const RAGGIO_PIAZZOLA = 44

export class Trascino {
  constructor({ tocca, suona = () => {} }) {
    this.tocca = tocca              // che fare quando il dito si alza senza aver mosso
    this.suona = suona
    this.motore = null; this.S = 1
    this.attivo = null              // { torre, da, mosso, posto }
  }

  /* una partita nuova, o uno schermo di misura diversa */
  attacca(motore, S) { this.motore = motore; this.S = S; this.attivo = null }
  misura(S) { this.S = S }

  get mosso() { return !!this.attivo && this.attivo.mosso }

  torreSotto(x, y) {
    let vicina = null, minima = RAGGIO_TORRE * this.S
    for (const t of this.motore.torri) {
      const d = Math.hypot(t.x - x, t.y - y)
      if (d <= minima) { minima = d; vicina = t }
    }
    return vicina
  }

  /* la piazzola libera più vicina al dito, se ce n'è una a tiro */
  postoLibero(x, y, sciolta) {
    let scelto = null, minima = RAGGIO_PIAZZOLA * this.S
    for (const p of this.motore.postazioni) {
      if (this.motore.torri.some(t => t !== sciolta && Math.hypot(t.x - p.x, t.y - p.y) < 2)) continue
      const d = Math.hypot(p.x - x, p.y - y)
      if (d <= minima) { minima = d; scelto = p }
    }
    return scelto
  }

  /* torna `true` se ha preso qualcosa: solo allora il componente si
     tiene il puntatore */
  giu(x, y) {
    if (!this.motore) return false
    const t = this.torreSotto(x, y)
    if (!t) return false
    this.attivo = { torre: t, da: { x: t.x, y: t.y }, mosso: false, posto: null }
    return true
  }

  muovi(x, y) {
    const g = this.attivo
    if (!g) return
    if (!g.mosso && Math.hypot(x - g.da.x, y - g.da.y) < SOGLIA * this.S) return
    g.mosso = true
    g.torre.sposta(x, y)
    g.posto = this.postoLibero(x, y, g.torre)
  }

  su() {
    const g = this.attivo
    if (!g) return
    this.attivo = null
    if (!g.mosso) { this.tocca(g.torre); return }
    if (g.posto) { g.torre.sposta(g.posto.x, g.posto.y); this.suona('compra') }
    else g.torre.sposta(g.da.x, g.da.y)      // fuori dalle piazzole: torna a casa
  }
}
