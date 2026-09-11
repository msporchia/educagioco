/* ═══════════════════════════════════════════════════════════════════
   LA PARTITA — una tappa giocata, cliente dopo cliente

   Nessuno schermo: si riceve una tappa e si risponde ai gesti.

     prendi(nome)        un ingrediente dallo scaffale, in mano
     posa(strumento)     l'ingrediente in mano va su un attrezzo
     metti(pezzo)        un peso sul piatto, un misurino, un pezzo
     togli() / svuota()  si torna indietro
     riponi()            si cambia attrezzo, senza penale
     conferma()          «nel calderone»: giusto o sbagliato
     riprendi()          dopo un esito, si va avanti

   Il tempo non è un avversario: non c'è pazienza che scende, non ci
   sono cuori. Il gioco vecchio ne aveva, e il risultato era un
   cartello da leggere con una barra che scendeva sopra. Qui si sbaglia
   e si rilegge, e quello che si perde sono le stelle della tappa — tre
   senza sbagli, due con pochi, una comunque. La tappa **si finisce
   sempre**.

   Ogni sbaglio è detto: cosa non va (`perche`) e come si fa
   (`spiegazione`, per intero, anche se la tappa non la mostrava più).
   Ed è **il primo tentativo** su una dose quello che conta per il
   motore di apprendimento: la conversione la si sa o non la si sa
   prima di vedersela svolta.
   ═══════════════════════════════════════════════════════════════════ */
import { STRUMENTO, FAMIGLIA } from '../dati/misure.js'
import { generaRicetta } from './ricetta.js'
import { verdetto, componibile, spiegazione, perche, chiaveDi, scalini } from './misura.js'
import { dosiDellaTappa, MONETE_A_DOSE } from '../dati/campagna.js'

export class Partita {
  constructor(tappa, { rnd = Math.random } = {}) {
    this.tappa = tappa
    this.rnd = rnd
    this.strumenti = tappa.strumenti.map(k => STRUMENTO[k])
    this.n = 0                    // il cliente in corso
    this.ricetta = null
    this.corrente = -1            // indice dell'ingrediente in lavorazione
    this.inMano = false           // l'ingrediente è preso ma non ancora posato
    this.strumento = null
    this.messi = []               // i pezzi nell'attrezzo, in unità base
    this.esito = null             // { tipo: 'giusto'|'sbaglio', ... } finché non si riprende
    this.sbagli = 0               // in tutta la tappa
    this.sbagliRicetta = 0        // su questa pozione: zero vuol dire perfetta
    this.sbagliQui = 0            // su questa dose
    this.dosi = []                // quello che ogni dose ha detto al motore di apprendimento
    this.pozioni = 0
    this.perfette = 0
    this.finita = false
    this.ultime = []
    this.nuovaRicetta()
  }

  /* ── dove siamo ── */
  get ingrediente() { return this.corrente >= 0 ? this.ricetta.ingredienti[this.corrente] : null }
  get dose() { return this.ingrediente ? this.ingrediente.dose : null }
  get famiglia() { return this.dose ? FAMIGLIA[this.dose.famiglia] : null }
  get messo() { return this.messi.reduce((s, p) => s + p, 0) }
  get occupato() { return !!this.esito || this.finita }
  get daFare() { return this.ricetta ? this.ricetta.ingredienti.filter(i => !i.fatto) : [] }
  /* la fase, per chi disegna: scaffale → inMano → dosa */
  get fase() {
    if (!this.ingrediente) return 'scaffale'
    return this.strumento ? 'dosa' : 'inMano'
  }

  nuovaRicetta() {
    this.ricetta = generaRicetta(this.tappa, this.rnd, { evita: this.ultime })
    this.ultime = this.ricetta.ingredienti.map(i => i.dose)
    this.corrente = -1; this.inMano = false; this.strumento = null; this.messi = []
    this.sbagliQui = 0; this.sbagliRicetta = 0; this.esito = null
  }

  /* ── l'attrezzo che questa dose vorrebbe ──
     Quello che conta nella sua unità se ci sta; se no, fra quelli su
     cui ci sta, il più vicino di scalini. Serve al cartello svolto
     («usa la bilancia del mercato») e al finto giocatore, non al
     verdetto: qualunque attrezzo su cui la dose si compone va bene. */
  consigliato(dose = this.dose) {
    if (!dose) return null
    const suoi = this.strumenti.filter(s => s.famiglia === dose.famiglia && componibile(dose.base, s))
    if (!suoi.length) return null
    return suoi.sort((a, b) =>
      Math.abs(scalini(dose.unita, a.unita)) - Math.abs(scalini(dose.unita, b.unita)))[0]
  }

  /* ── il cartello sopra il banco ──
     Quanto si dice lo decide la tappa; dopo uno sbaglio su questa
     dose si dice tutto, qualunque cosa dica la tappa. Prima di posare
     si parla dell'attrezzo consigliato, dopo di quello scelto. */
  get aiuto() {
    /* «come si gioca» parla anche prima che ci sia una dose in mano:
       dice cosa prendere dallo scaffale */
    if (this.tappa.aiuto === 'gioco' && !this.sbagliQui) return { livello: 'gioco', gioco: true }
    /* e il conto pure: prima di prendere si parla della prossima dose
       della ricetta, così si legge il cartello guardando la pergamena */
    const d = this.dose || (this.daFare[0] ? this.daFare[0].dose : null)
    if (!d) return null
    const livello = this.sbagliQui ? 'svolto' : this.tappa.aiuto
    if (!livello) return null
    const str = this.strumento || this.consigliato(d)
    if (!str) return null
    const sp = spiegazione(d, str.unita, livello)
    if (!sp) return null
    /* la dose viaggia col cartello: prima di prendere non c'è nessun
       ingrediente in mano, e chi disegna non deve andarsela a cercare */
    return { livello, dose: d, strumento: str,
             consiglia: !this.strumento && this.strumenti.length > 1 && livello === 'svolto', ...sp }
  }

  /* ── i gesti ── */
  prendi(nome) {
    if (this.occupato) return null
    const i = this.ricetta.ingredienti.findIndex(x => x.nome === nome && !x.fatto)
    if (i < 0) {
      const sullo = this.ricetta.scaffale.find(x => x.nome === nome)
      if (!sullo) return null
      const fatto = this.ricetta.ingredienti.find(x => x.nome === nome)
      return this.sbaglio('ingrediente', fatto
        ? `${nome[0].toUpperCase() + nome.slice(1)} è già nel calderone.`
        : `${nome[0].toUpperCase() + nome.slice(1)} non è nella ricetta: leggi cosa chiede.`)
    }
    /* cambiare ingrediente a metà dosatura si può: si ricomincia da vuoto */
    if (i !== this.corrente) this.sbagliQui = 0
    this.corrente = i; this.inMano = true; this.strumento = null; this.messi = []
    return { ok: true, ingrediente: this.ingrediente }
  }

  lascia() { if (!this.occupato && !this.strumento) { this.inMano = false; this.corrente = -1 } }

  posa(chiave) {
    if (this.occupato || !this.ingrediente) return null
    const str = this.strumenti.find(s => s.chiave === chiave)
    if (!str) return null
    const v = verdetto(this.dose, str, 0)
    if (v === 'famiglia' || v === 'nonCiSta') {
      this.inMano = true
      return this.sbaglio(v, perche(this.dose, str, v), str)
    }
    this.strumento = str; this.inMano = false; this.messi = []
    return { ok: true, strumento: str }
  }

  metti(pezzo) {
    if (this.occupato || !this.strumento) return false
    if (!this.strumento.pezzi.includes(pezzo)) return false
    if (this.messo + pezzo > this.strumento.limite) return false   // non ci sta più
    this.messi.push(pezzo)
    return true
  }
  togli() { if (!this.occupato) return this.messi.pop() ?? null; return null }
  svuota() { if (!this.occupato) this.messi = [] }
  riponi() { if (!this.occupato) { this.strumento = null; this.messi = []; this.inMano = true } }

  conferma() {
    if (this.occupato || !this.strumento) return null
    const d = this.dose, str = this.strumento
    const v = verdetto(d, str, this.messo)
    if (v !== 'giusto') return this.sbaglio(v, perche(d, str, v), str)
    /* la dose è giusta: al motore di apprendimento si dice la coppia di
       unità, se c'era da convertire e se il risultato non era scritto */
    const chiave = chiaveDi(d.unita, str.unita)
    const svolto = this.tappa.aiuto === 'svolto'
    this.dosi.push({ chiave, giusta: this.sbagliQui === 0, chiesta: !!chiave && !svolto })
    this.ingrediente.fatto = true
    this.esito = { tipo: 'giusto', ingrediente: this.ingrediente, strumento: str,
                   annota: chiave && !svolto && this.sbagliQui === 0 ? { chiave, giusto: true } : null,
                   pozioneFinita: this.daFare.length === 0 }
    return this.esito
  }

  /* uno sbaglio si annota una volta sola per dose, al primo: quello che
     viene dopo è già con la spiegazione davanti */
  sbaglio(tipo, testo, strumento = null) {
    this.sbagli++; this.sbagliQui++; this.sbagliRicetta++
    const d = this.dose
    const chiave = d && strumento && (tipo === 'troppo' || tipo === 'poco')
      ? chiaveDi(d.unita, strumento.unita) : null
    const primo = this.sbagliQui === 1
    const conta = chiave && this.tappa.aiuto !== 'svolto'
    this.esito = { tipo: 'sbaglio', codice: tipo, testo,
                   spiegazione: d && strumento && (tipo === 'troppo' || tipo === 'poco')
                     ? spiegazione(d, strumento.unita, 'svolto') : null,
                   annota: primo && conta ? { chiave, giusto: false } : null }
    return this.esito
  }

  /* dopo l'esito: avanti. Da uno sbaglio sull'attrezzo l'ingrediente
     torna in mano; da una dose sbagliata l'attrezzo resta e si svuota. */
  riprendi() {
    const e = this.esito
    if (!e) return null
    this.esito = null
    if (e.tipo === 'sbaglio') {
      if (e.codice === 'troppo' || e.codice === 'poco') this.messi = []
      else if (e.codice === 'ingrediente') { /* niente in mano: si rilegge */ }
      else { this.strumento = null; this.messi = []; this.inMano = true }
      return { che: 'riprova' }
    }
    this.strumento = null; this.messi = []; this.corrente = -1; this.inMano = false; this.sbagliQui = 0
    if (!e.pozioneFinita) return { che: 'prossimoIngrediente' }
    this.pozioni++
    const perfetta = this.sbagliRicetta === 0
    if (perfetta) this.perfette++
    this.n++
    if (this.n >= this.tappa.clienti) { this.finita = true; return { che: 'tappaFinita', perfetta } }
    this.nuovaRicetta()
    return { che: 'nuovoCliente', perfetta }
  }

  /* ── il bilancio ── */
  get dosiGiuste() { return this.dosi.filter(d => d.giusta).length }
  /* le stelle: tre senza sbagli, due con pochi (uno ogni quattro dosi),
     una comunque — la tappa non si perde */
  get stelle() {
    if (!this.sbagli) return 3
    return this.sbagli <= Math.ceil(dosiDellaTappa(this.tappa) / 4) ? 2 : 1
  }
  /* le monete: una dose azzeccata al primo colpo è una domanda vera
     (`CALIBRAZIONE.md`), e una sbagliata non paga */
  get monete() { return this.dosiGiuste * MONETE_A_DOSE }
}

/* le stelle come le calcola la partita, per chi le vuole senza giocare */
export const stellePer = (sbagli, tappa) =>
  !sbagli ? 3 : sbagli <= Math.ceil(dosiDellaTappa(tappa) / 4) ? 2 : 1
