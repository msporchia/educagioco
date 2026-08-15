/* ═══════════════════════════════════════════════════════════════════
   LA CASSA — dove si paga, e con cosa.

   Il motore non sa cosa sia un'operazione in colonna: chi compra dice
   quanto paga, e basta. Questa classe è il posto dove le due cose si
   incontrano — quanto costa una torre, quale conto la compra, a che
   gradino della scaletta.

   Le tre regole che tiene:

   · **la difficoltà non la decide il gioco, la decide il livello della
     torre**. Si costruisce al livello 1 — l'operazione senza riporti — e
     si sale un gradino per volta, ogni volta con un calcolo più
     difficile. Il tetto è quello della tappa (`cap`).
   · **che conto chiede una torre**: il suo, salvo che i genitori abbiano
     spento le divisioni — allora le bombe chiedono moltiplicazioni più
     difficili (`contoDi` in data/ops.js). Il resto del gioco non se ne
     accorge: cambia il conto, non la torre.
   · **per la torre magica il moltiplicatore esce dalle tabelline
     deboli**: la torre che si compra con una moltiplicazione è anche il
     modo per far ripassare quello che sta scivolando via.
   ═══════════════════════════════════════════════════════════════════ */
import { GENERATORI, contoDi, gradoDi, segnoDi, ramiDi } from '../../data/ops.js'
import { costoNuovaTorre, costoSalita, RAMI_DA } from '../../data/castello.js'
import { item, divisioniAccese, contiPermessi } from '../../store/profile.js'
import { weight } from '../../store/srs.js'

export class Cassa {
  constructor(tappa = null) { this.tappa = tappa }

  /* la tappa cambia il tetto della scaletta e nient'altro */
  perTappa(tappa) { this.tappa = tappa; return this }

  get divisioni() { return divisioniAccese() }
  /* cosa si può chiedere: le divisioni e le moltiplicazioni insieme,
     perché il ripiego è una scala e non due interruttori indipendenti —
     spente tutte e due, le Bombe scendono di due scalini e non di uno */
  get sa() { return contiPermessi() }
  get tetto() { return this.tappa ? this.tappa.cap : 1 }

  conto(t) { return contoDi(t, this.sa) }
  segno(t) { return segnoDi(t, this.sa) }
  chiave(t) { return 'op:' + this.conto(t) }

  /* ── i prezzi ──
     costruire sale con le torri già in piedi, potenziare col livello */
  costoNuova(quante) { return costoNuovaTorre(quante) }
  costoSalita(torre) { return costoSalita(torre.lv) }

  potenziabile(torre) { return torre.lv < this.tetto }

  /* ── il bivio ──
     I due mestieri fra cui scegliere, e solo nel momento giusto: la
     tappa deve offrirli, la torre deve stare per arrivare al gradino
     del bivio, e non deve averne già preso uno. Fuori da lì l'elenco è
     vuoto e la scheda mostra il solito tasto — che è come dire che il
     bivio non esiste, senza doverlo scrivere due volte. */
  rami(torre) {
    if (!torre || torre.ramo || !this.tappa || !this.tappa.rami) return []
    if (!this.potenziabile(torre)) return []
    return this.gradino(torre) === RAMI_DA ? ramiDi(torre.tipo) : []
  }
  /* che gradino chiede: una torre nuova il primo, una già in campo il suo più uno */
  gradino(torre) { return torre ? Math.min(this.tetto, torre.lv + 1) : 1 }

  /* l'operazione che compra questa torre a questo gradino */
  operazione(tipo, torre = null) { return this.operazioneA(tipo, this.gradino(torre)) }

  operazioneA(tipo, gradino) {
    const k = this.conto(tipo)
    const lv = gradoDi(tipo, gradino, this.sa)
    return k === 'mul' ? GENERATORI.mul(lv, this.moltiplicatoreDebole()) : GENERATORI[k](lv)
  }

  /* fra le otto tabelline, quella che sta scivolando via di più: si
     pesca a caso ma con il peso del ripasso, così non esce sempre la
     stessa e non esce mai una che è già solida */
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
