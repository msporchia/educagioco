// La cassa: dove si paga e con cosa. Il motore non sa cosa sia
// un'operazione in colonna; questa classe fa da ponte fra il prezzo di una
// torre, il conto che la compra e il gradino della scaletta. Vedi
// docs/castello/operazioni.md.
import { GENERATORI, contoDi, gradoDi, segnoDi, ramiDi } from '../../data/ops.js'
import { costoNuovaTorre, costoSalita, RAMI_DA } from '../../data/castello.js'
import { item, divisioniAccese, contiPermessi } from '../../store/profile.js'
import { weight } from '../../store/srs.js'

export class Cassa {
  constructor(tappa = null) { this.tappa = tappa }

  perTappa(tappa) { this.tappa = tappa; return this }

  get divisioni() { return divisioniAccese() }
  // il ripiego è una scala, non due interruttori indipendenti: vedi
  // docs/castello/operazioni.md
  get sa() { return contiPermessi() }
  get tetto() { return this.tappa ? this.tappa.cap : 1 }

  conto(t) { return contoDi(t, this.sa) }
  segno(t) { return segnoDi(t, this.sa) }
  chiave(t) { return 'op:' + this.conto(t) }

  costoNuova(quante, tipo) { return costoNuovaTorre(quante, tipo) }
  costoSalita(torre) { return costoSalita(torre.lv, torre.tipo) }

  potenziabile(torre) { return torre.lv < this.tetto }

  // I due mestieri fra cui scegliere, solo al gradino giusto e se non ne ha
  // già preso uno: fuori da lì l'elenco è vuoto (il bivio non esiste).
  rami(torre) {
    if (!torre || torre.ramo || !this.tappa || !this.tappa.rami) return []
    if (!this.potenziabile(torre)) return []
    return this.gradino(torre) === RAMI_DA ? ramiDi(torre.tipo) : []
  }
  gradino(torre) { return torre ? Math.min(this.tetto, torre.lv + 1) : 1 }

  operazione(tipo, torre = null) { return this.operazioneA(tipo, this.gradino(torre)) }

  operazioneA(tipo, gradino) {
    const k = this.conto(tipo)
    const lv = gradoDi(tipo, gradino, this.sa)
    return k === 'mul' ? GENERATORI.mul(lv, this.moltiplicatoreDebole()) : GENERATORI[k](lv)
  }

  // Il ghiaccio si compra con moltiplicazioni: il moltiplicatore esce dalla
  // tabellina che sta scivolando via di più (pesata col ripasso).
  moltiplicatoreDebole() {
    const ora = Date.now()
    const cand = []
    for (let m = 2; m <= 9; m++) {
      let peggio = 0
      for (let b = 1; b <= 10; b++) {
        const k = 'math:' + Math.min(m, b) + 'x' + Math.max(m, b)
        peggio = Math.max(peggio, weight(item(k), ora, { useTime: true }))
      }
      cand.push([m, peggio])
    }
    const tot = cand.reduce((s, c) => s + c[1], 0)
    let r = Math.random() * tot
    for (const [m, w] of cand) { r -= w; if (r <= 0) return m }
    return cand[cand.length - 1][0]
  }
}
