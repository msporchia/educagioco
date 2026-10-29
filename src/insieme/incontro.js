// Una partita in due, dal tavolo alla fine (docs/core/insieme.md): apre il canale, fa accordare i due telefoni (chi siede per
// primo propone, l'altro accetta), crea la stessa partita su tutti e due e la fa correre col lockstep. Non sa di schermi né di
// quale gioco: il gioco gli dà una `regola` (sotto) e legge `stato`, `linea` e `motivo` a ogni `alCambio()`.
//
// regola = {
//   versione: una firma di tutto quello che deve essere uguale sui due telefoni (regole, motore),
//   proponi(scelte): la proposta dell'host (oggetto JSON, con il seme),   accetta(proposta): null se va bene, se no il perché,
//   crea(proposta, parti): il `motore` del lockstep (lockstep.js), con la partita dentro,
//   e, per i giochi in cui ognuno porta qualcosa di suo (il sotterraneo: il proprio eroe), anche
//   presentati(): la parte di chi gioca qui (oggetto JSON),   accettaParte(parte): null se quella dell'altro va bene, se no il perché.
//   `parti` è allora { host, ospite }: le stesse sui due telefoni
// }
import { Canale } from './rete.js'
import { Lockstep } from './lockstep.js'
import { tieniAcceso } from './schermo.js'

/* cosa dire al bambino quando la sfida finisce male: dal perché del canale o del lockstep */
export const PAROLE = {
  via: 'l\'altro se n\'è andato',
  caduto: 'si è persa la linea e non è tornata',
  rete: 'non riesco a collegarmi: serve internet',
  nessuno: 'non trovo nessuna sfida con questo codice',
  piena: 'in questa sfida giocano già in due',
  andato: 'questa sfida è già finita',
  chiuso: 'la sfida è scaduta',
  indietro: 'l\'altro telefono non risponde più',
  versione: 'uno dei due ha una versione diversa del gioco: aggiornatelo',
  proposta: 'la sfida non è valida',
  parte: 'l\'eroe dell\'altro non si può portare qui',
  separate: 'le due partite si sono separate',
}

/* `stato`: 'attesa' (seduto, da solo) → 'trattativa' (in due, si accordano) → 'gioco' → 'finita' | 'rotta'
   `linea`: com'è il filo adesso, { io: 'su'|'giu'|'apro', altro: 'mai'|'su'|'giu'|'muto' } (vedi rete.js) */
export class Incontro {
  /* `scelte`: quello che ha deciso chi crea (null per chi entra); `opzioni` vanno al canale (posto, servizio, WebSocketImpl, tempo…) */
  constructor({ codice, regola, scelte = null, alCambio = () => {}, opzioni = {} }) {
    Object.assign(this, { codice, regola, scelte, alCambio })
    this.stato = 'attesa'
    this.motivo = ''
    this.perche = ''                   // la chiave di PAROLE, per chi vuole sapere senza leggere la frase
    this.lockstep = null
    this.motore = null
    this.proposta = null
    this.acceso = null                 // lo schermo tenuto acceso mentre si gioca
    this.canale = new Canale(codice, { ...opzioni, alMessaggio: d => this.ricevi(d), alCambio: () => this.lineaCambiata() })
  }

  get ruolo() { return this.canale.ruolo }
  get linea() { return { io: this.canale.io, altro: this.canale.altro } }
  get partita() { return this.motore?.partita || null }

  /* per capire perché una sfida si è rotta: si legge sul cartello e in console */
  diagnosi() {
    const c = this.canale, s = this.lockstep, d = c.diario
    const filo = `filo: ${d.cadute} cadute${d.ultima ? ` (l'ultima: ${d.ultima.codice}${d.ultima.ragione ? ' «' + d.ultima.ragione + '»' : ''})` : ''}, ${d.rimandati} rimandati, io ${c.io}, l'altro ${c.altro}`
    if (!s) return `prima di partire; ${filo}`
    return `al tick ${s.k}, ${s.riallineamenti} riallineamenti, ${s.aspettati.toFixed(0)} s ad aspettare l'altro, ` +
           `l'altro ${s.fineAltro ? 'aveva finito (' + s.fineAltro + ')' : 'non aveva finito'}; ${filo}`
  }

  cambia(stato, perche = '') {
    if (this.stato === 'finita' || this.stato === 'rotta') return
    if (stato === 'rotta') {
      this.perche = perche
      this.motivo = `${PAROLE[perche] || perche} [${this.diagnosi()}]`
      console.warn('[insieme] rotta:', this.motivo)
    }
    this.stato = stato
    if (stato === 'finita' || stato === 'rotta') { this.spegni(); this.canale.chiudi() }
    this.alCambio()
  }

  lineaCambiata() {
    const c = this.canale
    if (c.finito && c.finito !== 'mio') {
      // l'altro che se ne va a partita finita (anche solo dall'altra parte: il suo «fine» è arrivato prima) non è un guasto
      if (c.finito === 'via' && this.stato === 'gioco' && (this.motore.fine() || this.lockstep.fineAltro)) return this.alCambio()
      return this.cambia('rotta', c.finito)
    }
    if (this.stato === 'attesa' && c.altro !== 'mai') {
      this.stato = 'trattativa'
      if (this.ruolo === 'host') {
        this.proposta = this.regola.proponi(this.scelte)
        this.canale.manda({ t: 'inizio', v: this.regola.versione, proposta: this.proposta, ...this.miaParte() })
      }
    }
    this.alCambio()
  }

  ricevi(d) {
    if (!d || typeof d !== 'object') return
    if (this.stato === 'trattativa') {
      if (d.t === 'inizio' && this.ruolo === 'ospite') {
        const no = d.v !== this.regola.versione ? 'versione' : this.regola.accetta(d.proposta) || this.suaParte(d)
        if (no) { this.canale.manda({ t: 'no', motivo: no }); return this.cambia('rotta', no) }
        const mia = this.miaParte()
        this.canale.manda({ t: 'pronto', ...mia })
        this.parti(d.proposta, this.regola.presentati ? { host: d.parte, ospite: mia.parte } : undefined)
      } else if (d.t === 'pronto' && this.ruolo === 'host') {
        const no = this.suaParte(d)
        if (no) { this.canale.manda({ t: 'no', motivo: no }); return this.cambia('rotta', no) }
        this.parti(this.proposta, this.regola.presentati ? { host: this.miaParte().parte, ospite: d.parte } : undefined)
      }
      else if (d.t === 'no' && this.ruolo === 'host') this.cambia('rotta', d.motivo === 'versione' ? 'versione' : 'proposta')
      return
    }
    if (this.stato === 'gioco') this.lockstep.ricevi(d)
  }

  /* la parte di chi gioca qui, da mandare all'altro (niente per i giochi in cui non si porta niente) */
  miaParte() {
    if (!this.regola.presentati) return {}
    this._parte ??= this.regola.presentati()
    return { parte: this._parte }
  }
  /* quella arrivata dall'altro: null se va bene */
  suaParte(d) {
    if (!this.regola.presentati) return null
    return this.regola.accettaParte(d.parte) || null
  }

  parti(proposta, parti) {
    this.proposta = proposta
    this.parti_ = parti || null
    this.motore = this.regola.crea(proposta, parti)
    this.lockstep = new Lockstep({ motore: this.motore, ruolo: this.ruolo, invia: d => this.canale.manda(d),
      alGuasto: motivo => this.cambia('rotta', motivo === 'le due partite si sono separate' ? 'separate' : motivo) })
    this.acceso = tieniAcceso()
    this.cambia('gioco')
  }

  /* il tempo che passa (dal battito del gioco) */
  avanza(dt) { if (this.stato === 'gioco') this.lockstep.avanza(dt) }

  /* una mossa di chi gioca qui */
  scegli(mossa) { return this.stato === 'gioco' && this.lockstep.scegli(mossa) }

  /* la partita è finita qui (il gioco l'ha detto ai bambini): si lascia il tavolo, dopo aver consegnato quello che restava */
  finisci() { this.cambia('finita') }

  chiudi() { this.spegni(); this.canale.chiudi() }

  spegni() { this.acceso?.lascia(); this.acceso = null }
}
