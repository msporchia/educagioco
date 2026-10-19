// La regia di una sfida: dal collegamento aperto alla partita che gira. Fa parlare i due telefoni (chi propone, chi accetta,
// la firma delle regole), crea la stessa partita su tutti e due e tiene la `Sessione` che si scambia le mosse. Non sa di
// schermi: Gioco.vue le dà un canale e riceve i cambi di stato (docs/arena/multigiocatore.md).
import { Partita } from '../motore/partita.js'
import { caso } from '../motore/banco.js'
import { firmaEquilibrio } from '../motore/firma.js'
import { TERRENI, truppeDelTerreno } from '../dati/regole.js'
import { Sessione, proponi, accetta, ritmoPer } from './protocollo.js'

export const TOLLERANZA_VIA = 15000  // ms: dopo il «via» dell'altro si aspetta di arrivare alla fine della partita
export const SILENZIO = 15          // secondi senza messaggi dall'altro (durante il gioco ce ne sono sempre) prima di dire che non risponde

/* chi sono: 'attesa' (collegato, da solo) → 'trattativa' (in due, si accordano) → 'gioco' → 'finita' | 'rotta' */
export class Regia {
  /* `canale`: { invia, chiudi }; `host`: { terreno, secondiARisposta } se si crea la stanza; `alCambio(stato)` ad ogni cambio */
  constructor({ canale, host = null, alCambio = () => {}, firma = firmaEquilibrio(), seme = (Math.random() * 2 ** 31) | 0 }) {
    this.canale = canale
    this.host = host
    this.firma = firma
    this.seme = seme
    this.alCambio = alCambio
    this.stato = 'attesa'
    this.ruolo = null
    this.motivo = ''
    this.sessione = null
    this.partita = null
    this.ultimo = Date.now()
    this.viaDa = 0                     // quando l'altro ha chiuso il collegamento a partita ancora in corso
  }

  get mio() { return this.ruolo === 'host' ? 'io' : 'nem' }
  get silenzio() { return (Date.now() - this.ultimo) / 1000 }

  /* per capire perché una sfida si è rotta: si legge sul cartello e in console */
  diagnosi() {
    const s = this.sessione
    if (!s) return `ancora prima di partire, ${this.silenzio.toFixed(0)} s dall'ultima notizia`
    return `a ${s.p.t.toFixed(0)} s di gioco (tick ${s.k}), ${s.riallineamenti} riallineamenti, ultima notizia ${this.silenzio.toFixed(0)} s fa, ` +
           `l'altro ${s.fineAltro ? 'aveva annunciato la fine (' + s.fineAltro + ')' : 'non aveva annunciato la fine'}, qui ${s.p.fine ? 'era finita (' + s.p.fine + ')' : 'non era finita'}`
  }

  cambia(stato, motivo = '') {
    if (stato === 'rotta') { const d = this.diagnosi(); console.warn('[sfida] rotta:', motivo, '—', d); motivo = `${motivo} [${d}]` }
    this.stato = stato; this.motivo = motivo
    this.alCambio(stato)
  }

  /* un messaggio dal servizio o dall'altro telefono */
  ricevi(m) {
    this.ultimo = Date.now()
    if (m.t === 'ciao') { this.ruolo = m.ruolo; return }
    if (m.t === 'pronti') {
      this.cambia('trattativa')
      if (this.ruolo === 'host') {
        this.canale.invia(proponi({ firma: this.firma, seme: this.seme, terreno: this.host.terreno, ritmoMonete: ritmoPer(this.host.secondiARisposta) }))
      }
      return
    }
    if (m.t === 'via') {
      if (this.stato === 'gioco' && !this.partita.fine) this.viaDa = Date.now()          // forse ha solo finito prima: gli si dà il tempo di arrivarci
      else if (this.stato === 'attesa' || this.stato === 'trattativa') this.cambia('rotta', 'l\'altro se n\'è andato')
      return
    }
    if (this.stato === 'trattativa') {
      if (m.t === 'inizio' && this.ruolo === 'ospite') {
        const r = accetta(m, { firma: this.firma, terreni: TERRENI })
        this.canale.invia(r)
        if (r.t === 'pronto') this.parti(m.seme, m.terreno, m.ritmoMonete)
        else this.cambia('rotta', r.motivo === 'versione' ? 'uno dei due ha una versione diversa del gioco: aggiornatelo' : 'la sfida non è valida')
      } else if (m.t === 'pronto' && this.ruolo === 'host') this.parti(this.seme, this.host.terreno, ritmoPer(this.host.secondiARisposta))
      else if (m.t === 'no' && this.ruolo === 'host') this.cambia('rotta', m.motivo === 'versione' ? 'uno dei due ha una versione diversa del gioco: aggiornatelo' : 'la sfida non è valida')
      return
    }
    if (this.stato === 'gioco') this.sessione.ricevi(m)
  }

  parti(seme, terreno, ritmoMonete) {
    this.terreno = terreno
    this.partita = new Partita({ rnd: caso(seme), registra: true,
      sfida: { truppe: truppeDelTerreno(terreno), umano: true, durata: Infinity, ritmoMonete } })
    this.sessione = new Sessione({ partita: this.partita, ruolo: this.ruolo, invia: m => this.canale.invia(m),
      alDivergere: motivo => this.cambia('rotta', motivo === 'le due partite si sono separate' ? 'le due partite si sono separate' : 'qualcosa è andato storto') })
    this.cambia('gioco')
  }

  /* da chiamare a ogni battito: se l'altro ha chiuso e la partita non è finita nemmeno qui entro pochi secondi, è andato via davvero */
  controlla() {
    if (!this.viaDa || this.stato !== 'gioco') return
    if (this.partita.fine) this.viaDa = 0
    else if (Date.now() - this.viaDa > TOLLERANZA_VIA) this.cambia('rotta', 'l\'altro se n\'è andato')
  }

  chiudi() { this.canale.chiudi() }
}
