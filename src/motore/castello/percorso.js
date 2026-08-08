/* ═══════════════════════════════════════════════════════════════════
   IL PERCORSO — la strada e le sue piazzole.

   La tappa scrive la sua forma in coordinate 0–1, che non sanno niente
   di schermi. Qui diventano una strada vera, smussata, e ai suoi lati
   nascono le postazioni dove si può costruire.

   È l'unico posto del motore che tocca la geometria: chi cammina
   (`Nemico`) chiede solo «dove sono dopo tot metri», chi spara
   (`Torre`) chiede solo «quanto è lontano quel nemico».

   Vive anche a schermo cambiato: `ridimensiona` rifà strada e piazzole
   con le misure nuove, e il resto del motore non se ne accorge.
   ═══════════════════════════════════════════════════════════════════ */
import { smussa, tracciato } from '../../grafica/geometria.js'
import { GEOMETRIA } from '../../data/castello.js'

export class Percorso {
  constructor(forma, quante, misure) {
    this.forma = forma
    this.quante = quante
    this.ridimensiona(misure)
  }

  /* Il tracciato è quello della tappa, smussato: resta una spezzata —
     quindi camminarci sopra e misurarla costa quanto prima — ma curva
     come una strada vera. */
  ridimensiona({ W, H, S }) {
    this.W = W; this.H = H; this.S = S
    this.via = tracciato(smussa(this.forma.map(([x, y]) => ({ x: x * W, y: y * H }))))
    this.postazioni = this.piazzole()
    return this
  }

  /* Le postazioni stanno ai lati della strada, alternate, e si occupano
     **partendo da dove entrano i mostri**.

     Prima si partiva dal castello, e con le tappe lunghe di ieri —
     dieci, quindici torri comprate — la differenza non si vedeva:
     la strada si riempiva tutta comunque. Da quando una tappa si
     vince con due o tre torri, quella scelta è diventata il difetto
     più grosso del gioco: le torri si ammassavano davanti alla porta
     e il mostro faceva l'ottantacinque per cento della strada senza
     che nessuno gli sparasse. Un tower defense in cui si combatte
     solo sullo zerbino.

     Partendo dall'ingresso il combattimento si vede dove deve
     vedersi, e soprattutto **il ghiaccio ritrova il suo mestiere**:
     gelare un nemico appena entrato gli allunga tutta la strada che
     ha davanti, gelarlo davanti al castello non gli toglie niente,
     perché il tempo è già finito. Restano ammassate, e va bene:
     concentrare il fuoco è una difesa, spalmarlo su una strada
     lunga con tre torri non lo è.

     ⚠ I numeri non stanno qui: stanno in `GEOMETRIA`, dentro
     `data/castello.js`, perché **cambiano l'equilibrio** e devono
     entrare nella firma che dice quando la taratura è stantia. Questa
     stessa funzione è già stata cambiata una volta senza che il test se
     ne accorgesse, e per un giorno il gioco ha girato su vite tarate
     per un campo che non esisteva più. Chi tocca il *codice* qui sotto
     — il passo, il lato alternato, il rientro dai bordi — deve
     incrementare `GEOMETRIA.v`: i dati non sanno descriverlo da soli. */
  piazzole() {
    const { W, H, S } = this
    const posti = []
    const passo = this.via.lunghezza / (this.quante + 1)
    for (let i = 1; i <= this.quante; i++) {
      const p = this.via.puntoA(passo * i)
      const n = this.via.normaleA(passo * i)
      const off = GEOMETRIA.scostamento * S * (i % 2 ? 1 : -1)
      const m = GEOMETRIA.margine * S
      posti.push({ x: Math.max(m, Math.min(W - m, p.x + n.x * off)),
                   y: Math.max(m, Math.min(H - m, p.y + n.y * off)) })
    }
    // chi si occupa per primo: l'ingresso, o il castello come si faceva prima
    return GEOMETRIA.dallIngresso ? posti : posti.reverse()
  }

  /* da qui in giù è il tracciato che risponde: chi ha in mano un
     `Percorso` non deve sapere che dentro c'è un `tracciato` */
  get lunghezza() { return this.via.lunghezza }
  get punti() { return this.via.punti }
  get inizio() { return this.via.inizio }
  get fine() { return this.via.fine }
  puntoA(d) { return this.via.puntoA(d) }
  normaleA(d, passo) { return this.via.normaleA(d, passo) }
  campiona(passo) { return this.via.campiona(passo) }
}
