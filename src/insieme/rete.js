// Il filo fra due telefoni (docs/core/insieme.md): un tavolo sul servizio di inoltro e un `Canale` che non si rompe a ogni
// caduta. Il gioco ci mette dentro oggetti e li riceve dall'altra parte, tutti, una volta sola e in ordine; sotto, il canale
// si ricollega da solo, rimanda quello che l'altro non ha confermato e dice com'è la linea (io / l'altro). Non sa di giochi.
export const SERVIZIO = 'https://sfida.educagioco.workers.dev'
// per provare con il servizio in locale (`wrangler dev`): una prova mette qui l'indirizzo prima che la pagina parta
export const indirizzo = () => globalThis.__SERVIZIO_SFIDE__ || SERVIZIO
export const CODICE = /^[A-Z]{5}$/

// Un telefono può perdere una richiesta ogni tanto, a caso (visto dal vivo: 1 su 4 sul telefono di una bambina, verso qualunque
// indirizzo). Il tempo tipico è un decimo di secondo: aspettarne più di 3-4 vuol dire che quella richiesta è persa, e si rifà.
const TENTATIVI = 3
const ATTESA_CREAZIONE = 3500       // ms

/* un tavolo nuovo, con il `posto` di chi lo crea prenotato (sarà l'host: lo stesso posto va dato al suo Canale). Torna il codice di
   5 lettere, o un errore con la frase da dire al bambino. Una richiesta persa si rifà (creare un tavolo due volte non fa danni:
   quello senza nessuno scade da solo). */
export async function creaTavolo({ posto, servizio = indirizzo(), fetchImpl = globalThis.fetch, tentativi = TENTATIVI, attesa = ATTESA_CREAZIONE } = {}) {
  let r = null, corpo = null
  for (let i = 0; i < tentativi && !r; i++) {
    const ctl = new AbortController(), t = setTimeout(() => ctl.abort(), attesa)
    try {
      const x = await fetchImpl(`${servizio}/tavolo/nuovo?posto=${posto}`, { signal: ctl.signal })
      corpo = x.ok ? await x.json() : null
      r = x
    } catch { r = null }
    clearTimeout(t)
  }
  if (!r) throw new Error('non riesco a collegarmi: serve internet')
  if (r.status === 429) throw new Error('hai creato troppe sfide, riprova fra un po\'')
  if (!r.ok) throw new Error('il servizio delle sfide non risponde ora')
  const { codice } = corpo || {}
  if (!CODICE.test(codice || '')) throw new Error('il servizio delle sfide non risponde ora')
  return codice
}

/* i tempi del canale, in millisecondi (il perché di ognuno: docs/core/insieme.md, «I tempi») */
export const TEMPI = {
  giro: 250,          // ogni quanto il canale si guarda intorno
  battito: 1000,      // senza niente da dire, ogni secondo si dà notizia all'altro (con la conferma di quello che è arrivato)
  ping: 2000,         // e si chiede al servizio se il filo c'è
  sordo: 6000,        // senza niente dal servizio per tanto, il filo è morto anche se il telefono non se n'è accorto
  muto: 5000,         // senza niente dall'altro per tanto, «non risponde» (il servizio lo crede collegato)
  apertura: 5000,     // un collegamento che non si apre in tanto si lascia e se ne apre un altro
  ripeti: 2500,       // quello che l'altro non ha confermato in tanto si rimanda
  grazia: 125000,     // quanto si aspetta di ritrovare il filo, o l'altro, prima di dire che è finita (il servizio: 120 s)
  rientri: [0, 500, 1000, 2000, 3000],
}
export const PEZZO = 800             // caratteri: un oggetto più lungo viaggia a pezzi (il servizio ne accetta 2048 a messaggio)
const MAX_FUORI = 5000               // messaggi non confermati: oltre, l'altro è troppo indietro per essere ancora lì
const PER_GIRO = 8                   // quelli in coda partono al massimo così a ogni giro (32 al secondo: il servizio ne lascia 40)

const orologioVero = {
  ora: () => Date.now(),
  dopo: (ms, f) => setTimeout(f, ms),
  ogni: (ms, f) => setInterval(f, ms),
  ferma: id => clearTimeout(id),
}

/* il posto di questo telefono al tavolo: una parola casuale che ha solo lui, per riprenderlo dopo una caduta */
export const nuovoPosto = () => Array.from(crypto.getRandomValues(new Uint8Array(20)), x => 'abcdefghijklmnopqrstuvwxyz0123456789'[x % 36]).join('')

/* Il canale. Stati che legge chi gioca (`alCambio()` a ogni cambio):
   `io`     'apro' (il primo collegamento) | 'su' | 'giu' (caduto, mi ricollego)
   `altro`  'mai' (non è ancora arrivato) | 'su' | 'giu' (il servizio dice che è caduto) | 'muto' (collegato ma non si sente)
   `finito` null finché va, poi il perché: 'via' (l'altro se n'è andato) | 'caduto' (non ritrovo il filo) | 'mio' (ho chiuso io)
            | 'rete' (non sono mai riuscito a entrare) | 'nessuno' (il codice non c'è) | 'piena' | 'andato' | 'chiuso' (il tavolo è
            scaduto) | 'indietro' (l'altro non conferma più niente)
   `ruolo`  'host' (chi ha creato il tavolo) | 'ospite', appena il servizio lo dice */
export class Canale {
  constructor(codice, { posto = nuovoPosto(), servizio = indirizzo(), WebSocketImpl = globalThis.WebSocket, tempo = orologioVero, tempi = {},
                        alMessaggio = () => {}, alCambio = () => {}, ascolta = typeof document !== 'undefined' } = {}) {
    Object.assign(this, { codice, posto, servizio, WebSocketImpl, tempo, alMessaggio, alCambio })
    this.tempi = { ...TEMPI, ...tempi }
    this.io = 'apro'; this.altro = 'mai'; this.finito = null; this.ruolo = null
    this.ws = null; this.aperto = false
    this.n = 0                         // l'ultimo messaggio mio numerato
    this.ricevuto = 0                  // fin qui (compreso) ho tutto quello dell'altro, in fila
    this.fuori = []                    // i miei che l'altro non ha ancora confermato: { quadro, inviato }
    this.pezzi = ''                    // un oggetto lungo che arriva a pezzi
    this.chiudendo = false
    const ora = tempo.ora()
    this.dalServizio = ora; this.dallAltro = ora; this.allAltro = 0; this.pingato = 0; this.chiesto = 0
    this.giuDa = null                  // da quando il mio filo è caduto
    this.notizia = ora                 // l'ultima volta che è arrivato qualcosa dall'altro telefono (non dal servizio): dice se c'è ancora
    this.rientro = 0
    this.attesa = 0
    this.diario = { cadute: 0, rimandati: 0, ultima: null }      // per capire cosa è successo (lo dice il cartello)
    this.giro = tempo.ogni(this.tempi.giro, () => this.guarda())
    this.ascolta = ascolta
    if (ascolta) {
      this.risveglio = () => { if (!document.hidden) this.riprendi() }
      document.addEventListener('visibilitychange', this.risveglio)
      addEventListener('online', this.risveglio)
    }
    this.apri()
  }

  /* un oggetto per l'altro: arriverà, una volta sola e dopo quelli mandati prima, anche se nel frattempo la linea cade */
  manda(d) {
    if (this.finito || this.chiudendo) return false
    const testo = JSON.stringify(d)
    if (testo.length <= PEZZO) this.accoda({ t: 'm', n: ++this.n, d })
    else for (let da = 0; da < testo.length; da += PEZZO) {
      const ultimo = da + PEZZO >= testo.length
      this.accoda(ultimo ? { t: 'm', n: ++this.n, f: testo.slice(da, da + PEZZO) } : { t: 'm', n: ++this.n, f: testo.slice(da, da + PEZZO), p: 1 })
    }
    if (this.fuori.length > MAX_FUORI) this.fine('indietro')
    return true
  }

  /* un messaggio nuovo parte subito, se non c'è coda davanti (l'ordine conta: chi riceve scarta quelli che saltano la fila) */
  accoda(quadro) {
    const coda = this.fuori.length && !this.fuori.at(-1).inviato
    const v = { quadro, inviato: 0 }
    this.fuori.push(v)
    if (!coda && this.puoMandare()) this.spedisci(v)
  }

  puoMandare() { return this.io === 'su' && (this.altro === 'su' || this.altro === 'muto') }

  spedisci(v) {
    v.quadro.a = this.ricevuto
    if (this.scrivi(v.quadro)) v.inviato = this.tempo.ora()
  }

  /* fa partire quelli in coda, in fila, non più di `quanti` */
  svuota(quanti = PER_GIRO) {
    if (!this.puoMandare()) return
    for (const v of this.fuori) {
      if (v.inviato) continue
      if (quanti-- <= 0) break
      this.spedisci(v)
      if (!v.inviato) break                                         // il filo non scrive: si riprova al prossimo giro
    }
  }

  /* scrive sul filo; `allAltro` falso per quello che resta al servizio (il ping), che non dà notizie all'altro */
  scrivi(quadro, allAltro = true) {
    if (!this.ws || !this.aperto) return false
    try { this.ws.send(typeof quadro === 'string' ? quadro : JSON.stringify(quadro)) } catch { return false }
    if (allAltro) this.allAltro = this.tempo.ora()
    return true
  }

  /* quello che l'altro non ha confermato (dopo `da`) torna in coda, e riparte in fila al ritmo della coda: lui scarta i doppioni */
  rimanda(da = -1) {
    let quanti = 0
    for (const v of this.fuori) if (v.quadro.n > da && v.inviato) { v.inviato = 0; quanti++ }
    this.diario.rimandati += quanti
    this.svuota()
  }

  apri() {
    if (this.finito || this.ws) return
    let w
    try { w = new this.WebSocketImpl(`${this.servizio.replace(/^http/, 'ws')}/tavolo/${this.codice}?posto=${this.posto}`) } catch { return this.caduto(null) }
    this.ws = w; this.aperto = false
    const mio = () => this.ws === w
    const lento = this.tempo.dopo(this.tempi.apertura, () => { if (mio() && !this.aperto) this.lascia(w, { codice: 0, ragione: 'lento' }) })
    w.addEventListener('open', () => {
      if (!mio()) return
      this.tempo.ferma(lento)
      this.aperto = true
      this.dalServizio = this.tempo.ora()
    })
    w.addEventListener('message', e => { if (mio()) this.leggi(e.data) })
    const chiuso = e => { this.tempo.ferma(lento); if (mio()) this.caduto({ codice: e?.code ?? 0, ragione: e?.reason || '' }) }
    w.addEventListener('close', chiuso)
    w.addEventListener('error', chiuso)
  }

  /* un filo che non serve più (lento, o sordo): si chiude e se ne apre un altro */
  lascia(w, perche) {
    try { w.close() } catch { /* già chiuso */ }
    if (this.ws === w) this.caduto(perche)
  }

  caduto(perche) {
    this.ws = null; this.aperto = false
    if (this.finito) return
    if (perche) this.diario.ultima = perche
    if (this.io === 'su') this.diario.cadute++
    if (this.io !== 'giu' && this.io !== 'apro') { this.io = 'giu'; this.alCambio() }
    if (this.giuDa === null) this.giuDa = this.tempo.ora()
    const ritardo = this.tempi.rientri[Math.min(this.rientro++, this.tempi.rientri.length - 1)]
    this.tempo.ferma(this.attesa)
    this.attesa = this.tempo.dopo(ritardo, () => this.apri())
  }

  leggi(testo) {
    let m
    try { m = JSON.parse(testo) } catch { return }
    if (!m || typeof m !== 'object' || typeof m.t !== 'string') return
    const ora = this.tempo.ora()
    this.dalServizio = ora
    if (m.t === 'pong') return
    if (m.t === 'ciao') {
      this.ruolo = m.ruolo === 'ospite' ? 'ospite' : 'host'
      this.io = 'su'; this.giuDa = null; this.rientro = 0
      this.dallAltro = ora                                          // ero via io: all'altro si dà tempo da adesso
      if (m.andato) return this.fine('via')
      if (m.altro) this.arrivaAltro()
      else if (this.altro !== 'mai') this.altro = 'giu'
      this.alCambio()
      return
    }
    if (m.t === 'su') { this.arrivaAltro(); this.alCambio(); return }       // rientrato: quello che gli ho mandato mentre mancava è perso
    if (m.t === 'giu') { if (this.altro !== 'giu') { this.altro = 'giu'; this.alCambio() } return }
    if (m.t === 'via') return this.fine('via')
    if (m.t === 'no') return this.fine(['nessuno', 'piena', 'andato', 'chiuso'].includes(m.perche) ? m.perche : 'nessuno')
    // da qui, roba dell'altro telefono
    if (!['m', 'b', 'r'].includes(m.t)) return
    this.dallAltro = ora; this.notizia = ora
    if (this.altro !== 'su') { this.arrivaAltro(false); this.alCambio() }     // solo zitto per un po': i miei sono in viaggio
    if (Number.isInteger(m.a)) this.confermati(m.a)
    if (m.t === 'r' && Number.isInteger(m.a)) this.rimanda(m.a)
    if (m.t === 'm' && Number.isInteger(m.n)) this.arriva(m)
  }

  /* l'altro c'è (di nuovo): gli si dice cosa si è ricevuto, e se era rientrato gli si rimanda quello che non ha confermato */
  arrivaAltro(rimandare = true) {
    if (this.altro === 'mai') this.notizia = this.tempo.ora()
    this.altro = 'su'; this.dallAltro = this.tempo.ora()
    this.scrivi({ t: 'b', a: this.ricevuto })
    if (rimandare) this.rimanda()
    else this.svuota()
  }

  confermati(a) {
    while (this.fuori.length && this.fuori[0].quadro.n <= a) this.fuori.shift()
    if (this.chiudendo && !this.fuori.length) this.addio()
  }

  arriva(m) {
    if (m.n <= this.ricevuto) return                                 // un doppione (rimandato): l'ho già
    if (m.n > this.ricevuto + 1) {                                   // ne manca qualcuno prima: lo chiedo, questo arriverà di nuovo
      const ora = this.tempo.ora()
      if (ora - this.chiesto > 1000) { this.chiesto = ora; this.scrivi({ t: 'r', a: this.ricevuto }) }
      return
    }
    this.ricevuto = m.n
    if (typeof m.f === 'string') {
      this.pezzi += m.f
      if (m.p) return
      const testo = this.pezzi
      this.pezzi = ''
      try { m = { d: JSON.parse(testo) } } catch { return }
    }
    if (m.d !== undefined && !this.finito) this.alMessaggio(m.d)
  }

  /* il giro: battito, ping, il filo sordo, l'altro muto, i rimandi, e quando smettere di aspettare */
  guarda() {
    if (this.finito) return
    const ora = this.tempo.ora(), T = this.tempi
    if (this.aperto) {
      if (ora - this.dalServizio > T.sordo) return this.lascia(this.ws, { codice: 0, ragione: 'sordo' })
      if (ora - this.pingato >= T.ping) { this.pingato = ora; this.scrivi('{"t":"ping"}', false) }
    }
    if (this.io === 'su' && this.aperto) {
      if (this.altro === 'su' || this.altro === 'muto') {
        if (ora - this.allAltro >= T.battito) this.scrivi({ t: 'b', a: this.ricevuto })
        if (this.altro === 'su' && ora - this.dallAltro > T.muto) { this.altro = 'muto'; this.alCambio() }
        // la rete di sicurezza: l'altro dà notizie da dopo che gli ho mandato il più vecchio, ma non lo conferma. Se invece tace,
        // non si rimanda niente: i miei sono fermi in viaggio con i suoi, e un'onda di doppioni non aiuta
        const vecchio = this.fuori[0]
        if (vecchio?.inviato && ora - vecchio.inviato > T.ripeti && this.dallAltro > vecchio.inviato + T.ripeti / 2) this.rimanda()
        else this.svuota()
      }
    }
    if (this.giuDa !== null && this.io !== 'apro' && ora - this.giuDa > T.grazia) return this.fine('caduto')
    if (this.io === 'apro' && this.giuDa !== null && ora - this.giuDa > T.apertura * 3) return this.fine('rete')   // non sono mai entrato
    // l'altro tace da troppo (giù, o collegato ma muto): conta da quando ha parlato davvero, non dai miei rientri
    if (this.altro !== 'mai' && this.altro !== 'su' && this.io === 'su' && ora - this.notizia > T.grazia) return this.fine('via')
  }

  /* lo schermo è tornato acceso, o la rete è tornata: non si aspetta il prossimo tentativo */
  riprendi() {
    if (this.finito) return
    const ora = this.tempo.ora()
    if (!this.ws) { this.rientro = 0; this.tempo.ferma(this.attesa); this.apri(); return }
    this.dalServizio = ora; this.dallAltro = Math.max(this.dallAltro, ora - this.tempi.muto / 2)    // i timer a schermo spento non giravano
    this.pingato = ora; this.scrivi('{"t":"ping"}', false)
  }

  /* chi esce per scelta: prima che arrivi all'altro quello che ho mandato (al massimo tre secondi), poi l'addio */
  chiudi() {
    if (this.finito || this.chiudendo) return
    if (!this.fuori.length || !this.puoMandare()) return this.addio()
    this.chiudendo = true
    this.tempo.dopo(3000, () => this.addio())
  }

  addio() {
    if (this.finito) return
    this.scrivi({ t: 'addio' })
    this.fine('mio')
  }

  fine(perche) {
    if (this.finito) return
    this.finito = perche
    this.tempo.ferma(this.giro); this.tempo.ferma(this.attesa)
    if (this.ascolta) { document.removeEventListener('visibilitychange', this.risveglio); removeEventListener('online', this.risveglio) }
    const w = this.ws
    this.ws = null; this.aperto = false
    try { w?.close(1000) } catch { /* già chiuso */ }
    this.alCambio()
  }
}
