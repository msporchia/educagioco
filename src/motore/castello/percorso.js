// Il percorso: le strade (dalle forme 0-1 della tappa, smussate) e ai loro
// lati le piazzole. Le strade non si fondono mai (vedi campagne.md); le
// postazioni si spartiscono in proporzione alla lunghezza e si occupano a
// giro fra le strade, partendo dall'ingresso.
import { smussa, tracciato } from '../../grafica/geometria.js'
import { GEOMETRIA } from '../../data/castello.js'

// Distanza minima fra due piazzole (la stessa di valida-percorsi.mjs):
// serve solo dove due strade si avvicinano.
const MINIMA_FRA_PIAZZOLE = 42

export class Percorso {
  // `spigoli`/`posti` servono al campo a celle (giochi/castello/): strada
  // già a squadra (non smussare) e piazzole già decise dalla carta.
  constructor(forme, quante, misure, { spigoli = false, posti = null } = {}) {
    // una forma sola o un elenco di forme: si accettano tutte e due
    this.forme = Array.isArray(forme[0][0]) ? forme : [forme]
    this.quante = quante
    this.spigoli = spigoli
    this.posti = posti
    this.ridimensiona(misure)
  }

  ridimensiona({ W, H, S }) {
    this.W = W; this.H = H; this.S = S
    const liscia = this.spigoli ? punti => punti : smussa
    this.vie = this.forme.map(f => tracciato(liscia(f.map(([x, y]) => ({ x: x * W, y: y * H })))))
    // le piazzole dichiarate si scalano e basta: sbrogliarle le sposterebbe
    // fuori dalla loro cella
    this.postazioni = this.posti
      ? this.posti.map(([x, y, via = 0]) => ({ x: x * W, y: y * H, via }))
      : this.piazzole()
    return this
  }

  viaN(k = 0) { return this.vie[Math.min(k || 0, this.vie.length - 1)] }
  get quanteVie() { return this.vie.length }

  // Quante piazzole per strada, in proporzione alla lunghezza: la somma
  // deve tornare esattamente a quelle promesse dalla tappa.
  quote() {
    const lung = this.vie.map(v => v.lunghezza)
    const totale = lung.reduce((s, l) => s + l, 0)
    const quote = lung.map(l => Math.max(1, Math.round(this.quante * l / totale)))
    let resta = this.quante - quote.reduce((s, q) => s + q, 0)
    // gli arrotondamenti si aggiustano sulla strada più lunga, o più corta
    while (resta !== 0) {
      const i = resta > 0 ? lung.indexOf(Math.max(...lung)) : quote.findIndex(q => q > 1)
      if (i < 0) break
      quote[i] += resta > 0 ? 1 : -1
      resta += resta > 0 ? -1 : 1
    }
    return quote
  }

  // Le postazioni stanno ai lati della strada, alternate, e si occupano
  // partendo da dove entrano i mostri (non dal castello): vedi
  // docs/castello/taratura.md. Chi tocca il codice qui sotto (il passo, il
  // lato alternato, il rientro dai bordi) deve incrementare `GEOMETRIA.v`,
  // o la taratura resta fatta per un campo che non esiste più.
  piazzole() {
    const { W, H, S } = this
    const quote = this.quote()
    // prima si dispongono strada per strada, poi si mescolano a giro
    const perVia = this.vie.map((via, k) => {
      const posti = []
      const passo = via.lunghezza / (quote[k] + 1)
      // sfalsate a due a due: dove le strade si fondono (una Y, un anello)
      // le piazzole cadrebbero esattamente una sull'altra
      const sfalso = this.vie.length > 1 ? (k / this.vie.length) * 0.34 : 0
      for (let i = 1; i <= quote[k]; i++) {
        const d = passo * (i + sfalso)
        const p = via.puntoA(d)
        const n = via.normaleA(d)
        const off = GEOMETRIA.scostamento * S * (i % 2 ? 1 : -1)
        const m = GEOMETRIA.margine * S
        posti.push({ x: Math.max(m, Math.min(W - m, p.x + n.x * off)),
                     y: Math.max(m, Math.min(H - m, p.y + n.y * off)), via: k })
      }
      // chi si occupa per primo: l'ingresso, o il castello come si faceva prima
      return GEOMETRIA.dallIngresso ? posti : posti.reverse()
    })
    const fila = []
    for (let i = 0; i < Math.max(...quote); i++)
      for (const posti of perVia) if (posti[i]) fila.push(posti[i])
    return this.sbroglia(fila)
  }

  // Dove le strade convergono (o una strada si attraversa da sé, il
  // bastione) le piazzole finiscono l'una addosso all'altra: qui si
  // scostano, e se non basta si tolgono (meglio una in meno che due
  // sovrapposte, a dito un terno al lotto).
  sbroglia(fila) {
    const minima = MINIMA_FRA_PIAZZOLE * this.S
    const tenute = []
    for (const p of fila) {
      let q = p
      for (let giro = 0; giro < 3; giro++) {
        const addosso = tenute.find(t => Math.hypot(t.x - q.x, t.y - q.y) < minima)
        if (!addosso) break
        const dx = q.x - addosso.x, dy = q.y - addosso.y
        const d = Math.hypot(dx, dy) || 1
        q = { ...q, x: q.x + dx / d * minima * 0.7, y: q.y + dy / d * minima * 0.7 }
      }
      const m = GEOMETRIA.margine * this.S
      q.x = Math.max(m, Math.min(this.W - m, q.x))
      q.y = Math.max(m, Math.min(this.H - m, q.y))
      if (!tenute.some(t => Math.hypot(t.x - q.x, t.y - q.y) < minima * 0.8)) tenute.push(q)
    }
    return tenute
  }

  // da qui in giù è il tracciato principale: chi non sa di strade multiple
  // continua a vedere quella che ha sempre visto
  get via() { return this.vie[0] }
  get lunghezza() { return this.via.lunghezza }
  get punti() { return this.via.punti }
  get inizio() { return this.via.inizio }
  get fine() { return this.via.fine }
  puntoA(d) { return this.via.puntoA(d) }
  normaleA(d, passo) { return this.via.normaleA(d, passo) }
  campiona(passo) { return this.via.campiona(passo) }
}
