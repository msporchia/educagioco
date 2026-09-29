// Il dito sul campo: fermo apre la scheda di quello che si è toccato,
// scivolando la torre cambia postazione (a pagamento, vedi
// docs/castello/torri.md). Qui c'è solo la regola del gesto; il DOM resta
// nel componente.
const SOGLIA = 10
const RAGGIO_TORRE = 26
const RAGGIO_PIAZZOLA = 44

export class Trascino {
  constructor({ tocca, apri, avvisa = () => {}, costo = 0, suona = () => {} }) {
    this.tocca = tocca              // il dito si alza su una torre senza aver mosso
    this.apri = apri || (() => {})  // ...o su una piazzola libera
    this.avvisa = avvisa
    this.costo = costo              // quanto costa spostare, per dirlo a chi non ce l'ha
    this.suona = suona
    this.motore = null; this.S = 1
    this.attivo = null              // { torre, da, mosso, posto } oppure { piazzola }
  }

  attacca(motore, S) { this.motore = motore; this.S = S; this.attivo = null }
  misura(S) { this.S = S }

  get mosso() { return !!this.attivo && this.attivo.mosso }
  get torre() { return this.attivo && this.attivo.torre ? this.attivo.torre : null }
  get posto() { return this.attivo && this.attivo.posto != null ? this.attivo.posto : -1 }

  torreSotto(x, y) {
    let vicina = null, minima = RAGGIO_TORRE * this.S
    for (const t of this.motore.torri) {
      const d = Math.hypot(t.x - x, t.y - y)
      if (d <= minima) { minima = d; vicina = t }
    }
    return vicina
  }

  postoLibero(x, y, sciolta = null) {
    let scelto = -1, minima = RAGGIO_PIAZZOLA * this.S
    this.motore.postazioni.forEach((p, i) => {
      if (!this.motore.libera(i, sciolta)) return
      const d = Math.hypot(p.x - x, p.y - y)
      if (d <= minima) { minima = d; scelto = i }
    })
    return scelto
  }

  // torna true se ha preso qualcosa: solo allora il componente tiene il puntatore
  giu(x, y) {
    if (!this.motore) return false
    const t = this.torreSotto(x, y)
    if (t) {
      this.attivo = { torre: t, da: { x: t.x, y: t.y }, mosso: false, posto: -1 }
      return true
    }
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
    // chi decide se lo spostamento si può fare (e lo fa pagare) è il motore
    if (g.posto < 0 || !this.motore.sposta(g.torre, g.posto)) {
      g.torre.sposta(g.da.x, g.da.y)
      if (g.posto >= 0) this.avvisa(`Servono ${this.costo} ⚡ per spostarla`)
    }
  }
}
