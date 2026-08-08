/* ═══════════════════════════════════════════════════════════════════
   LA TORRE — chi prende di mira e chi spara.

   Di suo tiene tre cose: dove sta, di che tipo è, a che livello è
   arrivata. Tutto il resto — quanto fa male, ogni quanto spara, quanto
   lontano arriva — lo chiede a `data/ops.js` e `data/castello.js`, che
   sono gli unici a saperlo.

   Non sa quanto costa: il prezzo lo decide chi compra (nel gioco è
   l'operazione in colonna appena finita), e la torre si limita a
   nascere e a salire di gradino.

   `agisci` è il suo unico verbo: passa un istante, e se è il momento
   torna i colpi che ha lanciato. Il ghiaccio è il caso strano — non
   lancia niente, gela sul posto — e resta l'unica riga di questo file
   che tratta un tipo diversamente dagli altri.
   ═══════════════════════════════════════════════════════════════════ */
import { TORRI } from '../../data/ops.js'
import { tiroDi, geloDi } from '../../data/castello.js'
import { dist } from '../../grafica/geometria.js'
import { Colpo } from './colpo.js'
import { Schizzo } from './schizzo.js'

/* di quanto si allarga il raggio a ogni gradino: poco, perché la
   crescita che si deve vedere è quella del danno */
const RAGGIO_PIU = 0.04

export class Torre {
  constructor({ x, y, tipo, lv = 1, ricarica = 0 }) {
    this.x = x; this.y = y
    this.tipo = tipo
    this.lv = lv
    this.ricarica = ricarica
  }

  get modello() { return TORRI[this.tipo] }
  get gelante() { return !!TORRI[this.tipo].gela }
  raggio(S) { return TORRI[this.tipo].raggio * S * (1 + (this.lv - 1) * RAGGIO_PIU) }

  sale() { this.lv++; return this }
  sposta(x, y) { this.x = x; this.y = y; return this }

  /* la fotografia da mettere in un'istantanea: dati puri, senza classe,
     così chi la salva non deve sapere che esiste questo file */
  dati() { return { x: this.x, y: this.y, tipo: this.tipo, lv: this.lv, ricarica: this.ricarica } }
  static da(dati) { return new Torre(dati) }

  /* ── un istante di torre ──
     `null` se non è successo niente; se no `{ colpi, schizzi, sparo }`.
     Chi prende di mira: i nemici più avanti, uno per salva. Le bombe
     alte ne lanciano due, e se il secondo bersaglio non c'è ripiegano
     sul primo — due colpi sulla stessa testa, non un colpo sprecato. */
  agisci(dt, { nemici, via, S }) {
    this.ricarica -= dt
    if (this.ricarica > 0) return null
    const raggio = this.raggio(S)
    const dentro = nemici.filter(n => dist(via.puntoA(n.d), this) <= raggio)
    if (!dentro.length) return null

    // la cadenza è quella del livello: l'arciere alto spara una raffica
    const tiro = tiroDi(this.tipo, this.lv)
    this.ricarica = tiro.ricarica

    if (this.gelante) {
      /* il gelo di una torre alta frena di più e dura di più; l'onda si
         allarga *piano* e resta lì a sbiadire: è una folata di freddo,
         non un'esplosione */
      const g = geloDi(this.lv)
      for (const n of dentro) n.gela(g.durata, g.freno)
      return { schizzi: [new Schizzo({ x: this.x, y: this.y, max: raggio, tipo: this.tipo,
                                       gelo: true, cresce: 1.1, spegne: 0.8 })] }
    }

    const inFila = [...dentro].sort((a, b) => b.d - a.d)
    const colpi = []
    for (let k = 0; k < tiro.salve; k++) {
      const preso = inFila[Math.min(k, inFila.length - 1)]
      const p = via.puntoA(preso.d)
      // Il colpo parte dalla cima della torre, non dai suoi piedi.
      colpi.push(new Colpo({ x: this.x + (k ? 5 * S : 0), y: this.y - (17 + this.lv * 0.6) * S,
                             tx: p.x, ty: p.y, t: k * -0.18,
                             tipo: this.tipo, preso,
                             danno: tiro.danno, area: tiro.area * S }))
    }
    return { colpi, sparo: true }
  }
}
