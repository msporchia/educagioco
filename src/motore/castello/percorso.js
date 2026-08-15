/* ═══════════════════════════════════════════════════════════════════
   IL PERCORSO — le strade e le loro piazzole.

   La tappa scrive le sue forme in coordinate 0–1, che non sanno niente
   di schermi. Qui diventano strade vere, smussate, e ai loro lati
   nascono le postazioni dove si può costruire.

   È l'unico posto del motore che tocca la geometria: chi cammina
   (`Nemico`) chiede solo «dove sono dopo tot metri **sulla mia
   strada**», chi spara (`Torre`) chiede solo «quanto è lontano quel
   nemico».

   ── una strada o più d'una ──
   Quasi tutte le tappe ne hanno una. Alcune — le ultime, e la partita
   libera — ne hanno due: due ingressi diversi, due file di mostri, un
   castello solo. Le strade **non si fondono mai**: si avvicinano verso
   il fondo e arrivano alla stessa porta da parti diverse. Fonderle
   avrebbe voluto dire piazzole disegnate due volte sullo stesso tratto,
   e soprattutto una partita che si vince mettendo tutto dopo il punto
   in cui si uniscono — cioè una mappa a due ingressi che si gioca come
   se ne avesse uno.

   Le postazioni si spartiscono fra le strade in proporzione a quanto
   sono lunghe, e si occupano **a giro**: prima la più vicina
   all'ingresso della strada A, poi quella della strada B, poi la
   seconda di A… Se si riempisse una strada per volta, la prima torre
   difenderebbe metà campo e l'altra metà passerebbe senza vedere
   nessuno.

   Vive anche a schermo cambiato: `ridimensiona` rifà strade e piazzole
   con le misure nuove, e il resto del motore non se ne accorge.
   ═══════════════════════════════════════════════════════════════════ */
import { smussa, tracciato } from '../../grafica/geometria.js'
import { GEOMETRIA } from '../../data/castello.js'

/* quanto devono starsi larghe due piazzole, in unità: è la stessa
   distanza che `strumenti/valida-percorsi.mjs` pretende, e serve solo
   dove due strade si avvicinano — su una strada sola non capita mai */
const MINIMA_FRA_PIAZZOLE = 42

export class Percorso {
  constructor(forme, quante, misure) {
    // una forma sola o un elenco di forme: si accettano tutte e due
    this.forme = Array.isArray(forme[0][0]) ? forme : [forme]
    this.quante = quante
    this.ridimensiona(misure)
  }

  /* I tracciati sono quelli della tappa, smussati: restano spezzate —
     quindi camminarci sopra e misurarle costa quanto prima — ma curvano
     come strade vere. */
  ridimensiona({ W, H, S }) {
    this.W = W; this.H = H; this.S = S
    this.vie = this.forme.map(f => tracciato(smussa(f.map(([x, y]) => ({ x: x * W, y: y * H })))))
    this.postazioni = this.piazzole()
    return this
  }

  /* la strada numero `k`, e quella di chi non ne ha una: la prima */
  viaN(k = 0) { return this.vie[Math.min(k || 0, this.vie.length - 1)] }
  get quanteVie() { return this.vie.length }

  /* ── quante piazzole per strada ──
     In proporzione alla lunghezza, almeno una ciascuna, e la somma deve
     tornare esattamente a quelle che la tappa ha promesso. */
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
    const quote = this.quote()
    /* prima si dispongono strada per strada, poi si mescolano a giro:
       la fila che ne esce è l'ordine in cui verranno occupate */
    const perVia = this.vie.map((via, k) => {
      const posti = []
      const passo = via.lunghezza / (quote[k] + 1)
      for (let i = 1; i <= quote[k]; i++) {
        const p = via.puntoA(passo * i)
        const n = via.normaleA(passo * i)
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

  /* ── due strade, una piazzola sola ──
     Dove le strade convergono le loro piazzole finiscono l'una addosso
     all'altra: ognuna è disposta sulla sua strada senza sapere niente
     dell'altra. Qui si guardano tutte insieme e chi è troppo vicina a
     una già messa si scosta di lato, dalla parte opposta alla strada.
     Se non basta, si toglie: meglio una piazzola in meno che due
     sovrapposte, che a schermo sono una e a dito sono un terno al
     lotto. */
  sbroglia(fila) {
    if (this.vie.length < 2) return fila
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

  /* da qui in giù è il tracciato principale che risponde: chi ha in mano
     un `Percorso` e non sa niente di strade multiple continua a vedere
     quella che ha sempre visto */
  get via() { return this.vie[0] }
  get lunghezza() { return this.via.lunghezza }
  get punti() { return this.via.punti }
  get inizio() { return this.via.inizio }
  get fine() { return this.via.fine }
  puntoA(d) { return this.via.puntoA(d) }
  normaleA(d, passo) { return this.via.normaleA(d, passo) }
  campiona(passo) { return this.via.campiona(passo) }
}
