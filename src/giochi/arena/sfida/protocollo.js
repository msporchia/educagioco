// La sfida in due, il pezzo che non sa niente di schermi né di rete: due copie della stessa partita che si scambiano
// solo le mosse (docs/arena/multigiocatore.md). Ognuno promette «fino al tick H non ti mando altre mosse» e manda le
// sue con il tick in cui valgono; la partita avanza di un tick solo quando di tutte e due le parti si sa tutto.
// Il mondo è uno solo: chi ospita è `io`, l'ospite è `nem`. Il motore gira a passi fissi (`PASSO`), quindi due copie
// con le stesse mosse agli stessi tick restano identiche al bit (`unita/arena-lockstep`).
import { PASSO } from '../motore/partita.js'
import { fotoDi, aPezzi, applicaFoto } from './foto.js'

export const RITARDO = 6          // tick di anticipo con cui una mossa si applica (0,3 s): il tempo di arrivare all'altro
export const BLOCCO = 4           // quanti tick si promettono in più alla volta (0,2 s): meno messaggi, più ritardo
export const OGNI_IMPRONTA = 100  // ogni quanti tick si confronta lo stato (5 s)
const MAX_RIALLINEAMENTI = 30     // oltre, le copie si separano di continuo e non è più un caso: la sfida finisce
const CADENZA_PEZZI = 0.05        // secondi fra un pezzo della fotografia e il prossimo (20 al secondo: il servizio ne ammette 30)
const MEMORIA_MOSSE = 2 * 100     // tick di mosse già fatte che si tengono, per rifarle se l'ospite torna indietro
const SOGLIA_ATTESA = 20          // tick d'anticipo oltre i quali un messaggio è troppo avanti per essere vero

const AZIONI = ['costruisci', 'potenzia', 'vendi', 'miniera', 'ripara', 'castello', 'bomba', 'sbagliata']

const intero = (n, min, max) => Number.isInteger(n) && n >= min && n <= max
/* una mossa com'è nel messaggio: [tick, azione, chi, dove]; chi e dove, se ci sono, sono una truppa o una piazzola */
function mossaValida(m, daTick) {
  if (!Array.isArray(m) || m.length < 2 || m.length > 4) return false
  const [k, azione, chi, dove] = m
  if (!intero(k, daTick, 1e6) || !AZIONI.includes(azione)) return false
  if (chi !== undefined && chi !== null && typeof chi !== 'string' && !intero(chi, 0, 20)) return false
  if (dove !== undefined && dove !== null && !intero(dove, 0, 20)) return false
  return true
}

/* L'impronta: poche cifre che riassumono la partita (monete, vita di castelli e muri, caserme, truppe e dove stanno). Si confronta
   con una tolleranza: uno scarto da ultima cifra non è una partita diversa, e se è l'inizio di una vera divergenza cresce da sé
   fino a superarla (allora si riallinea). I conteggi (caserme, livelli, truppe) invece devono essere uguali. */
const VOCI = 17
const TOLLERANZA = 0.02                       // relativa; più 1 in assoluto
const ESATTE = new Set([0, 7, 8, 9, 10, 11, 12])    // fine, caserme, livelli delle caserme, numero di truppe
export function improntaDi(p) {
  const v = [p.fine ? 1 : 0]
  for (const l of ['io', 'nem']) v.push(p.lati[l].monete)
  for (const l of ['io', 'nem']) v.push(p.castelli.find(c => c.lato === l).hp)
  for (const l of ['io', 'nem']) v.push(p.muri.find(m => m.lato === l).hp)
  for (const l of ['io', 'nem']) v.push(p.caserme.filter(c => c.lato === l).length)
  for (const l of ['io', 'nem']) v.push(p.caserme.filter(c => c.lato === l).reduce((s, c) => s + c.liv, 0))
  for (const l of ['io', 'nem']) v.push(p.unita.filter(u => u.lato === l).length)
  for (const l of ['io', 'nem']) v.push(p.unita.filter(u => u.lato === l).reduce((s, u) => s + u.hp, 0))
  for (const l of ['io', 'nem']) v.push(p.unita.filter(u => u.lato === l).reduce((s, u) => s + u.y, 0))
  return v
}
export function impronteSimili(a, b) {
  if (!Array.isArray(a) || !Array.isArray(b) || a.length !== VOCI || b.length !== VOCI) return false
  return a.every((x, i) => (ESATTE.has(i) ? x === b[i] : Math.abs(x - b[i]) <= 1 + TOLLERANZA * Math.max(Math.abs(x), Math.abs(b[i]))))
}

/* chi propone e chi accetta: la firma delle regole (`firmaEquilibrio`) dice se le due copie giocano lo stesso gioco. Decide l'host:
   il terreno e quanto corrono le monete; in due non c'è un nemico, quindi nessuno ha un vantaggio o uno svantaggio */
export const RITMO_MONETE = { min: 0.05, max: 1.5 }
/* Le monete sono tarate per un campo fermo mentre si calcola: un'azione costava circa `AZIONE_A_CAMPO_FERMO` secondi di gioco.
   In due il campo corre anche mentre si risponde (l'utente: «ogni bambino ci mette 10 secondi a domanda»), quindi per avere le
   stesse monete a ogni azione la crescita si divide per il tempo in più: 2,5 / (2,5 + secondi a risposta). Lo sceglie chi crea la stanza. */
export const AZIONE_A_CAMPO_FERMO = 2.5
export const ritmoPer = secondiARisposta => AZIONE_A_CAMPO_FERMO / (AZIONE_A_CAMPO_FERMO + secondiARisposta)
export const proponi = ({ firma, seme, terreno, ritmoMonete = ritmoPer(10) }) => ({ t: 'inizio', firma, seme, terreno, ritmoMonete })
export function accetta(proposta, { firma, terreni }) {
  if (!proposta || proposta.t !== 'inizio') return { t: 'no', motivo: 'proposta' }
  if (proposta.firma !== firma) return { t: 'no', motivo: 'versione' }       // regole diverse: le due partite si dividerebbero subito
  if (!Number.isInteger(proposta.seme) || !terreni.includes(proposta.terreno)) return { t: 'no', motivo: 'proposta' }
  if (!(proposta.ritmoMonete >= RITMO_MONETE.min && proposta.ritmoMonete <= RITMO_MONETE.max)) return { t: 'no', motivo: 'proposta' }
  return { t: 'pronto' }
}

export class Sessione {
  /* `partita`: la partita già creata (stesso seme, `umano`); `ruolo`: 'host' o 'ospite'; `invia(messaggio)`: dà un oggetto al
     servizio; `alDivergere(motivo)`: chiamato se le due copie non sono più uguali o l'altro manda cose senza senso */
  constructor({ partita, ruolo, invia, alDivergere = () => {} }) {
    this.p = partita
    this.mio = ruolo === 'host' ? 'io' : 'nem'
    this.suo = ruolo === 'host' ? 'nem' : 'io'
    this.invia = invia
    this.alDivergere = alDivergere
    this.k = 0                         // tick già simulati
    this.acc = 0
    this.hoMio = RITARDO + BLOCCO      // fino a qui (escluso) le mie mosse sono tutte note all'altro
    this.hoLoro = RITARDO + BLOCCO     // e fino a qui le sue sono tutte note a me
    this.mosse = new Map()             // tick → [{ lato, azione, chi, dove }]
    this.impronte = { mie: new Map(), sue: new Map() }
    this.rotta = null
    this.riallineo = null              // se le copie si sono separate: l'host manda la sua, l'ospite aspetta (vedi `confronta`)
    this.riallineamenti = 0
    this.arrivo = null                 // i pezzi della fotografia che arrivano all'ospite
    this.confrontate = 0               // quante impronte sono state messe a confronto: se resta zero non si è controllato niente
  }

  get inAttesa() { return !this.rotta && this.k >= Math.min(this.hoMio, this.hoLoro) }

  /* una mossa del giocatore: vale al primo tick che non ho ancora promesso */
  scegli(azione, chi, dove) {
    if (this.rotta || this.p.fine) return false
    const k = this.hoMio
    this.metti(k, this.mio, azione, chi, dove)
    this.hoMio = k + 1
    this.invia({ t: 'k', h: this.hoMio, c: [[k, azione, chi ?? null, dove ?? null]] })
    return true
  }

  metti(k, lato, azione, chi, dove) {
    if (!this.mosse.has(k)) this.mosse.set(k, [])
    this.mosse.get(k).push({ lato, azione, chi: chi ?? undefined, dove: dove ?? undefined })
  }

  /* arriva un messaggio dell'altro */
  ricevi(m) {
    if (this.rotta || !m || typeof m !== 'object') return
    if (m.t === 'k') {
      if (!intero(m.h, this.hoLoro, this.k + SOGLIA_ATTESA + BLOCCO + RITARDO + 1) || !Array.isArray(m.c) || m.c.length > 8) return this.rompi('messaggio senza senso')
      for (const x of m.c) {
        if (!mossaValida(x, this.hoLoro) || x[0] >= m.h) return this.rompi('mossa fuori dal tempo promesso')
        this.metti(x[0], this.suo, x[1], x[2], x[3])
      }
      this.hoLoro = m.h
    } else if (m.t === 'i') {
      if (!Array.isArray(m.v) || m.v.length !== VOCI || !m.v.every(Number.isFinite) || !intero(m.k, 0, 1e7)) return this.rompi('impronta senza senso')
      if (this.riallineo) return                                    // le impronte di prima della fotografia non contano più
      this.impronte.sue.set(m.k, m.v)
      this.confronta(m.k)
    } else if (m.t === 's' && this.mio === 'nem') this.ricevePezzo(m)
    else if (m.t === 'ok' && this.riallineo?.invio) this.riparti()
  }

  /* L'ospite mette insieme la fotografia dell'host e si rimette dov'è lui. Le mosse già fatte restano in memoria: l'ospite
     può tornare indietro di qualche tick, e quelle dell'altro che valgono da lì in poi le rifà. */
  ricevePezzo(m) {
    if (!intero(m.id, 0, 1e6) || !intero(m.n, 1, 400) || !intero(m.i, 0, m.n - 1) || typeof m.d !== 'string' || m.d.length > 500) return this.rompi('foto senza senso')
    this.riallineo = this.riallineo || { invio: null }
    if (!this.arrivo || this.arrivo.id !== m.id) this.arrivo = { id: m.id, n: m.n, parti: [], quante: 0 }
    if (this.arrivo.parti[m.i] === undefined) { this.arrivo.parti[m.i] = m.d; this.arrivo.quante++ }
    if (this.arrivo.quante < this.arrivo.n) return
    try { this.k = applicaFoto(this.p, this.arrivo.parti.join('')) } catch { return this.rompi('foto storta') }
    this.arrivo = null
    this.invia({ t: 'ok' })
    this.riparti()
  }

  /* chi aveva fermato la partita la riprende: le impronte di prima non servono più */
  riparti() {
    this.riallineo = null
    this.acc = 0
    this.impronte.mie.clear(); this.impronte.sue.clear()
    for (const k of this.mosse.keys()) if (k < this.k - MEMORIA_MOSSE) this.mosse.delete(k)
  }

  confronta(k) {
    const mia = this.impronte.mie.get(k), sua = this.impronte.sue.get(k)
    if (mia === undefined || sua === undefined) return
    this.impronte.mie.delete(k); this.impronte.sue.delete(k)
    this.confrontate++
    if (impronteSimili(mia, sua)) return
    // Le copie si sono separate oltre la tolleranza (la rete non c'entra: la rete ritarda e basta). Si torna a una sola: l'host manda la sua
    // fotografia e l'ospite la prende, ferme tutte e due finché non è arrivata. Troppe volte di fila: è un guasto vero.
    if (++this.riallineamenti > MAX_RIALLINEAMENTI) return this.rompi('le due partite si sono separate')
    if (this.mio === 'io') this.riallineo = { invio: { pezzi: aPezzi(fotoDi(this.p, this.k), this.riallineamenti), i: 0, att: 0 } }
    else this.riallineo = this.riallineo || { invio: null }
  }

  rompi(motivo) { this.rotta = motivo; this.alDivergere(motivo) }

  /* il tempo vero che passa: simula quanti tick si possono, e promette all'altro i prossimi */
  avanza(dt) {
    if (this.rotta) return
    if (this.riallineo) {                                           // ferme: l'host manda la fotografia, l'ospite aspetta
      const v = this.riallineo.invio
      if (v) for (v.att += dt; v.att >= CADENZA_PEZZI && v.i < v.pezzi.length; v.att -= CADENZA_PEZZI) this.invia(v.pezzi[v.i++])
      return
    }
    this.acc = Math.min(this.acc + dt, 1)                          // dopo una lunga attesa non si recupera di colpo
    while (this.acc >= PASSO && !this.riallineo && !this.p.fine && this.k < Math.min(this.hoMio, this.hoLoro)) {
      // due mosse sullo stesso tick: ogni copia le ha ricevute in un ordine suo, quindi si applicano sempre nello stesso
      // (prima chi ospita, poi l'ospite; le mosse di uno stesso giocatore restano come le ha date)
      const dovute = (this.mosse.get(this.k) || []).slice().sort((x, y) => (x.lato === 'io' ? 0 : 1) - (y.lato === 'io' ? 0 : 1))
      for (const m of dovute) {
        if (m.azione === 'sbagliata') this.p.sbagliata(m.lato, m.chi)
        else this.p.fai(m.lato, m.azione, m.chi, m.dove)
      }
      this.p.avanza(PASSO)
      this.k++
      this.acc -= PASSO
      if (this.k % OGNI_IMPRONTA === 0) {
        for (const k of this.mosse.keys()) if (k < this.k - MEMORIA_MOSSE) this.mosse.delete(k)
        const v = improntaDi(this.p)
        this.impronte.mie.set(this.k, v)
        this.invia({ t: 'i', k: this.k, v })
        this.confronta(this.k)
      }
    }
    if (this.acc >= PASSO && this.k >= Math.min(this.hoMio, this.hoLoro)) this.acc = Math.min(this.acc, PASSO)   // fermi in attesa dell'altro
    // promettere i prossimi tick: sempre RITARDO avanti, a blocchi
    if (!this.p.fine && this.hoMio - this.k < RITARDO) {
      this.hoMio = this.k + RITARDO + BLOCCO
      this.invia({ t: 'k', h: this.hoMio, c: [] })
    }
  }
}
