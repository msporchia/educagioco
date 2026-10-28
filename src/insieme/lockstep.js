// Due copie della stessa partita che si scambiano solo le mosse (docs/core/insieme.md, «Il lockstep»). Ognuno promette «fino al
// tick H non ti mando altre mosse» e manda le sue con il tick in cui valgono; la partita avanza di un tick solo quando di tutte e due
// le parti si sa tutto, quindi una rete lenta rallenta il campo ma non separa le copie. Ogni tanto si confronta un'impronta dello
// stato; se le copie si sono separate, l'host manda la sua fotografia e l'ospite riparte da lì.
// Non sa di quale gioco: il gioco gli dà un `motore` (sotto), e il canale (rete.js) consegna tutto, in ordine, anche dopo una caduta.
//
// motore = {
//   passo: secondi di un tick (fisso),  avanza(): un tick,  applica(ruolo, mossa): una mossa ('host' | 'ospite'),
//   valida(mossa): è una mossa di questo gioco?,  impronta(): numeri,  simili(a, b): due impronte dicono la stessa partita?,
//   foto(): tutto lo stato (un oggetto JSON),  rimetti(foto),  fine(): null o com'è finita,  finisci(f): finisce così
// }

export const RITARDO = 12         // tick di anticipo con cui una mossa si applica: il tempo di arrivare all'altro (0,6 s a 20 tick)
export const BLOCCO = 4           // quanti tick si promettono in più alla volta: meno messaggi, più ritardo
export const OGNI_IMPRONTA = 100  // ogni quanti tick si confronta lo stato
const MAX_RIALLINEAMENTI = 30     // oltre, le copie si separano di continuo e non è più un caso: la sfida finisce
const MEMORIA_MOSSE = 200         // tick di mosse già fatte che si tengono, per rifarle se l'ospite torna indietro
// tick d'anticipo oltre i quali una promessa è troppo avanti per essere vera: ogni mossa fatta mentre si aspetta l'altro sposta
// la promessa di un tick, e un bambino può farne parecchie in due minuti di rete che non c'è (con 40 la sfida si rompeva)
const SOGLIA_ATTESA = 4000
const MAX_RECUPERO = 1            // secondi: dopo una lunga attesa non si recupera di colpo

const intero = (n, min, max) => Number.isInteger(n) && n >= min && n <= max

export class Lockstep {
  /* `motore`: come sopra; `ruolo`: 'host' o 'ospite'; `invia(oggetto)`: lo dà al canale; `alGuasto(motivo)`: le copie si sono
     separate per sempre, o l'altro manda cose senza senso */
  constructor({ motore, ruolo, invia, alGuasto = () => {} }) {
    this.m = motore
    this.mio = ruolo === 'host' ? 'host' : 'ospite'
    this.suo = this.mio === 'host' ? 'ospite' : 'host'
    this.invia = invia
    this.alGuasto = alGuasto
    this.k = 0                         // tick già simulati
    this.acc = 0
    this.hoMio = RITARDO + BLOCCO      // fino a qui (escluso) le mie mosse sono tutte note all'altro
    this.hoLoro = RITARDO + BLOCCO     // e fino a qui le sue sono tutte note a me
    this.mosse = new Map()             // tick → [{ ruolo, mossa }]
    this.impronte = { mie: new Map(), sue: new Map() }
    this.rotta = null
    this.riallineo = null              // le copie si sono separate: l'host aspetta l'«ok», l'ospite la fotografia
    this.riallineamenti = 0
    this.confrontate = 0               // quante impronte sono state messe a confronto: se resta zero non si è controllato niente
    this.fineAltro = null              // com'è finita per l'altro, se me l'ha detto
    this.annunciata = false
    this.aspettati = 0                 // secondi passati fermi ad aspettare l'altro (per la diagnosi)
  }

  /* fermi perché dell'altro non si sa ancora abbastanza (la rete è lenta, o lui è fermo) */
  get inAttesa() { return !this.rotta && (!!this.riallineo || this.k >= Math.min(this.hoMio, this.hoLoro)) }

  /* una mossa di chi gioca qui: vale al primo tick che non ho ancora promesso */
  scegli(mossa) {
    if (this.rotta || this.m.fine()) return false
    const k = this.hoMio
    this.metti(k, this.mio, mossa)
    this.hoMio = k + 1
    this.invia({ t: 'k', h: this.hoMio, c: [[k, mossa]] })
    return true
  }

  metti(k, ruolo, mossa) {
    if (!this.mosse.has(k)) this.mosse.set(k, [])
    this.mosse.get(k).push({ ruolo, mossa })
  }

  /* un messaggio dell'altro (il canale li consegna tutti e in ordine) */
  ricevi(d) {
    if (this.rotta || !d || typeof d !== 'object') return
    if (d.t === 'k') {
      if (!intero(d.h, this.hoLoro, this.k + SOGLIA_ATTESA + BLOCCO + RITARDO + 1) || !Array.isArray(d.c) || d.c.length > 8) return this.rompi('messaggio senza senso')
      for (const x of d.c) {
        if (!Array.isArray(x) || x.length !== 2 || !intero(x[0], this.hoLoro, d.h - 1) || !this.m.valida(x[1])) return this.rompi('mossa fuori dal tempo promesso')
        this.metti(x[0], this.suo, x[1])
      }
      this.hoLoro = d.h
    } else if (d.t === 'i') {
      if (!Array.isArray(d.v) || !d.v.every(Number.isFinite) || !intero(d.k, 0, 1e8)) return this.rompi('impronta senza senso')
      if (this.riallineo) return                                    // le impronte di prima della fotografia non contano più
      this.impronte.sue.set(d.k, d.v)
      this.confronta(d.k)
    } else if (d.t === 'fine') {
      // una copia può arrivare alla fine qualche tick prima dell'altra: chi finisce lo dice, e l'altra chiude uguale. Se finiscono
      // tutte e due, vale l'host.
      if (typeof d.f !== 'string' || d.f.length > 20) return this.rompi('fine senza senso')
      this.fineAltro = d.f
      if (!this.m.fine() || this.mio === 'ospite') this.m.finisci(d.f)
    } else if (d.t === 's' && this.mio === 'ospite') {
      if (!intero(d.k, 0, 1e8)) return this.rompi('foto senza senso')
      try { this.m.rimetti(d.foto) } catch { return this.rompi('foto storta') }
      this.k = d.k
      this.invia({ t: 'ok' })
      this.riparti()
    } else if (d.t === 'ok' && this.riallineo && this.mio === 'host') this.riparti()
  }

  /* chi aveva fermato la partita la riprende: le impronte di prima non servono più. Le mosse già fatte restano: l'ospite rimesso
     al tick dell'host può tornare indietro di qualche tick, e quelle che valgono da lì in poi le rifà. */
  riparti() {
    this.riallineo = null
    this.acc = 0
    this.impronte.mie.clear(); this.impronte.sue.clear()
    this.dimentica()
  }

  dimentica() { for (const k of this.mosse.keys()) if (k < this.k - MEMORIA_MOSSE) this.mosse.delete(k) }

  confronta(k) {
    const mia = this.impronte.mie.get(k), sua = this.impronte.sue.get(k)
    if (mia === undefined || sua === undefined) return
    this.impronte.mie.delete(k); this.impronte.sue.delete(k)
    this.confrontate++
    if (this.m.simili(mia, sua)) return
    // Le copie si sono separate (la rete non c'entra: la rete ritarda e basta). Si torna a una sola: l'host manda la sua fotografia,
    // tutte e due ferme finché l'ospite non l'ha presa. Troppe volte: è un guasto vero.
    if (++this.riallineamenti > MAX_RIALLINEAMENTI) return this.rompi('le due partite si sono separate')
    this.riallineo = true
    if (this.mio === 'host') this.invia({ t: 's', k: this.k, foto: this.m.foto() })
  }

  rompi(motivo) { this.rotta = motivo; this.alGuasto(motivo) }

  /* il tempo vero che passa: simula quanti tick si possono, e promette all'altro i prossimi */
  avanza(dt) {
    if (this.rotta) return
    if (this.inAttesa) this.aspettati += dt
    if (this.riallineo) return
    this.acc = Math.min(this.acc + dt, MAX_RECUPERO)
    while (this.acc >= this.m.passo && !this.riallineo && !this.m.fine() && this.k < Math.min(this.hoMio, this.hoLoro)) {
      // due mosse sullo stesso tick: ogni copia le ha ricevute in un ordine suo, quindi si applicano sempre nello stesso
      // (prima chi ospita, poi l'ospite; le mosse di uno stesso giocatore restano come le ha date)
      const dovute = (this.mosse.get(this.k) || []).slice().sort((x, y) => (x.ruolo === 'host' ? 0 : 1) - (y.ruolo === 'host' ? 0 : 1))
      for (const { ruolo, mossa } of dovute) this.m.applica(ruolo, mossa)
      this.m.avanza()
      this.k++
      this.acc -= this.m.passo
      if (this.m.fine() && !this.annunciata) { this.annunciata = true; this.invia({ t: 'fine', f: this.m.fine() }) }
      if (this.k % OGNI_IMPRONTA === 0) {
        this.dimentica()
        const v = this.m.impronta()
        this.impronte.mie.set(this.k, v)
        this.invia({ t: 'i', k: this.k, v })
        this.confronta(this.k)
      }
    }
    if (this.k >= Math.min(this.hoMio, this.hoLoro)) this.acc = Math.min(this.acc, this.m.passo)   // fermi in attesa dell'altro
    // promettere i prossimi tick: sempre RITARDO avanti, a blocchi
    if (!this.m.fine() && this.hoMio - this.k < RITARDO) {
      this.hoMio = this.k + RITARDO + BLOCCO
      this.invia({ t: 'k', h: this.hoMio, c: [] })
    }
  }
}
