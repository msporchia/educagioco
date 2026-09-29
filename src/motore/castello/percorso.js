// Il percorso: le strade e le piazzole della carta a scacchiera, in unità
// del mondo. Le decide `sullaCarta` (motore/castello/carta.js) in
// coordinate 0-1, strada a squadra e piazzole nelle loro celle: qui si
// scalano e basta, e le strade diventano tracciati su cui si cammina.
import { tracciato } from '../../grafica/geometria.js'

export class Percorso {
  // `forme`: una spezzata 0-1 per strada; `posti`: [x, y, strada] in 0-1,
  // nell'ordine in cui si occupano (dall'ingresso)
  constructor(forme, posti, misure) {
    this.forme = forme
    this.posti = posti
    this.ridimensiona(misure)
  }

  ridimensiona({ W, H, S }) {
    this.W = W; this.H = H; this.S = S
    this.vie = this.forme.map(f => tracciato(f.map(([x, y]) => ({ x: x * W, y: y * H }))))
    this.postazioni = this.posti.map(([x, y, via = 0]) => ({ x: x * W, y: y * H, via }))
    return this
  }

  viaN(k = 0) { return this.vie[Math.min(k || 0, this.vie.length - 1)] }
  get quanteVie() { return this.vie.length }

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
