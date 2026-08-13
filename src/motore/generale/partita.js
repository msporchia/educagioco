/* ═══════════════════════════════════════════════════════════════════
   PARTITA — far girare una scena, un battito per volta

   Il vecchio `passo()` era lungo trecento righe e sapeva tutto: come si
   esegue una fila, chi ascolta cosa, quando un segnale sveglia
   qualcuno, quando la scena si è piantata. Adesso sa fare quattro cose
   in fila, e per ognuna chiede a chi la sa fare:

       1. ogni personaggio fa il suo passo   (l'orchestratore è suo)
       2. si consegnano i messaggi partiti   (li consegna il messaggio)
       3. si guarda chi ha vinto o perso     (lo dicono le domande)
       4. e se non è successo NIENTE, si dice perché

   ── PERCHÉ I MESSAGGI ARRIVANO AL BATTITO DOPO ──
   Un segnale mandato adesso si sente al giro dopo, uguale per tutti.
   Senza, l'ordine in cui girano i personaggi deciderebbe chi sente cosa
   — e siccome quell'ordine viene dalla legenda del livello, spostare un
   orco da un angolo all'altro cambierebbe chi vince.

   ── E PERCHÉ LO STALLO È UN ERRORE, NON UN'ATTESA ──
   Se in un giro intero nessuno ha speso un battito, niente potrà più
   cambiare: si sta aspettando qualcosa che non arriverà. Farlo girare
   per trecento turni e poi dire «tempo scaduto» è vero e inutile; dire
   «la ladra aspetta il via libera, e non lo manderà più nessuno» è una
   diagnosi su cui si può lavorare.
   ═══════════════════════════════════════════════════════════════════ */
import { Registro } from './registro.js'
import { compilaFila } from './azioni/indice.js'
import { domandaDa, tutteVere } from './domande/indice.js'
import { Contesto } from './contesto.js'

/* oltre questi passi la scena è in giro a vuoto: si chiude e lo dice */
export const PASSI_MASSIMI = 300

export class Partita {
  constructor (mondo, piano) {
    this.mondo = mondo
    this.registro = new Registro(mondo)
    /* la vista legge `mondo.traccia`: è lo stesso array, non una copia */
    mondo.traccia = this.registro.righe
    mondo.partita = this

    mondo.azzeraPartita()
    mondo.traccia = this.registro.righe
    /* rigiocare la scena: ogni cosa si rimette com'era da sé — è il
       patto di `azzera()`, e una cosa nuova non può dimenticarselo */
    for (const k in mondo.cose) {
      const cosa = mondo.cose[k]
      if (cosa && typeof cosa.azzera === 'function') cosa.azzera()
    }
    mondo.unita.forEach(u => u.azzera())

    this.piano = piano || {}
    mondo.registraRoutine(this.piano)
    /* ── UNA SCENA PUÒ AVERE IL SUO PIANO NEMICO ──
       Le varianti finora spostavano solo le cose: dove sta l'orco, dove
       la chiave. Ma «da che parte entra» non è una posizione — è un
       ORDINE, e senza questo il piano nemico sarebbe per forza lo stesso
       in tutte le scene. Le unità del giocatore non si toccano mai:
       quelle le comandi tu. */
    const scena = mondo.ordiniScena
    if (scena) for (const id in scena) {
      const u = mondo.perId[id]
      if (u && u.fazione !== mondo.mia) this.piano[id] = scena[id]
    }
    /* qui il piano scritto smette di esistere e diventa un albero di
       azioni: da adesso in poi nessuno rilegge più il dato */
    mondo.unita.forEach(u => u.parti(compilaFila(this.piano[u.id] || [])))

    this.vince = (mondo.livello.vince || []).map(domandaDa).filter(Boolean)
    this.perde = (mondo.livello.perde || []).map(domandaDa).filter(Boolean)
  }

  /* ═══════════ un battito ═══════════ */
  passo () {
    const m = this.mondo
    if (m.finita) return
    m.eventi = []
    m.colpi = []
    m.allarmi = []

    if (m.passi >= PASSI_MASSIMI) return this.tempoScaduto()
    m.passi++

    /* 1. ognuno fa il suo passo, e dice se il battito l'ha speso */
    let successoQualcosa = false
    for (const u of m.unita.slice()) {
      if (m.finita) break
      if (u.esegui(m, this.registro)) successoQualcosa = true
    }

    /* 2. i messaggi partiti prima arrivano adesso */
    if (this.consegna()) successoQualcosa = true
    if (this.comandiDeiCongegni()) successoQualcosa = true
    if (m.finita) return

    /* 3. quello che si vede si tiene a mente — è la memoria su cui
       lavora «vai da qualcuno», e il motivo per cui una ronda serve
       davvero. E chi è fatto per gridare, grida: vedere un avversario è
       già rumore, e non serve che qualcuno gliel'abbia detto. */
    for (const u of m.vivi()) for (const z of m.vivi()) {
      if (z === u || !u.vede(m, z)) continue
      u.ricorda(z)
      /* e chi è fatto per buttarsi su chi vede, si butta: la reazione a
         vista scatta qui, dove i due che si vedono si stanno già
         scorrendo */
      if (z.fazione !== u.fazione) { u.vedendo(z); m.gridaSe(u, 'visto') }
    }

    /* 4. com'è finita */
    if (tutteVere(this.perde, m))
      return this.finisce(false, m.livello.motivoSconfitta || 'La missione è fallita.')
    if (tutteVere(this.vince, m)) return this.finisce(true, 'Missione compiuta.')

    /* ── LA PARTITA FINISCE PER QUELLO CHE FAI TU, NON PER LORO ──
       Queste due righe guardavano TUTTI quelli in campo, e da lì
       venivano metà dei finali assurdi: **il livello si chiudeva perché
       si era piantato un personaggio che non comandi**. Un orco a cui
       hai appena chiuso la porta in faccia continua a spingerla e non
       riesce — è esattamente quello che volevi che gli succedesse — e
       la partita lo trattava come «non succede più niente, hai perso».
       Lo stesso per una bestia in gabbia che aspetta, o per una guardia
       che sta ancora ascoltando un segnale che nessuno manderà.
       La regola giusta è una sola: **si guarda chi prende ordini da
       te**. Se le tue unità hanno finito e la missione no, hai perso; se
       le tue sono piantate su una cosa che non arriverà, è uno stallo e
       si dice quale. Quello che succede agli altri è il mondo che va
       per conto suo, e se non si muove più nessuno ci pensa il tetto dei
       battiti (`PASSI_MASSIMI`) — che è un finale onesto invece di una
       sconfitta con la ragione sbagliata.

       ── MA «GLI ORDINI SONO FINITI» GUARDA TUTTI, E DEVE ──
       Perché la missione può compiersi **dopo** di te: apri la gabbia e
       il gatto ci mette venti battiti ad arrivare alla sua cesta. Se la
       partita chiudesse appena la tua fila è vuota, quei venti battiti
       non li vedrebbe nessuno e il livello si perderebbe un attimo
       prima di vincerlo — provato, e sono cadute due prove su due. */
    const vivi = m.unita.filter(u => u.eInPiedi())
    const impegnati = vivi.filter(u => u.eImpegnata())
    const inAscolto = vivi.filter(u => !u.eImpegnata() && u.sonoInAscolto)
    const mieiFermi = impegnati.filter(u => u.fazione === m.mia)
    if (!impegnati.length && !inAscolto.length)
      return this.finisce(false, 'Gli ordini sono finiti e la missione non è compiuta.' +
                                 this.ultimoIntoppo())
    if (!successoQualcosa && mieiFermi.length) this.stallo(impegnati, inAscolto)
  }

  /* ═══════════ la consegna ═══════════ */
  consegna () {
    const m = this.mondo
    if (!m.pendenti.length) return false
    const partiti = m.pendenti
    m.pendenti = []
    for (const messaggio of partiti) {
      if (!m.segnaliMandati.includes(messaggio.segnale)) m.segnaliMandati.push(messaggio.segnale)
      /* il mondo non sa chi ascolta cosa: offre il messaggio a tutti, e
         ognuno decide se lo riguarda */
      const destati = []
      for (const u of m.vivi()) {
        if (u.id === messaggio.da) continue
        if (!messaggio.arrivaA(m, u)) continue
        if (u.senti(messaggio)) destati.push(u.comeSiChiama)
      }
      const chiHaMandato = m.perId[messaggio.da]
      if (!chiHaMandato) continue
      const nome = m.nomeDelSegnale(messaggio.segnale)
      const { penso, siVede } = messaggio.racconto(nome, [...new Set(destati)])
      this.registro.scrivi(new Contesto(m, chiHaMandato, this.registro, 'segnali'),
                           null, destati.length ? 'fa' : 'salto', penso, siVede)
    }
    return true
  }

  /* ── LA CODA DEI CONGEGNI ──
     Stesso principio dei messaggi, e per lo stesso motivo: un comando
     mandato adesso arriva al battito dopo. Senza, una leva che ne
     comanda un'altra che rimanda un comando alla prima girerebbe nello
     stesso istante all'infinito; così invece si rimbalzano un messaggio
     al giro, e si vede — non si pianta. */
  comandiDeiCongegni () {
    const m = this.mondo
    if (!m.comandiPendenti.length) return false
    const partiti = m.comandiPendenti
    m.comandiPendenti = []
    for (const c of partiti) {
      const destinatario = m.laCosa(c.a)
      const chiFinto = { id: c.mittente.id, x: c.mittente.x, y: c.mittente.y,
                         fazione: null, emoji: c.mittente.em, comeSiChiama: c.mittente.id,
                         vede: () => false }
      const contesto = new Contesto(m, chiFinto, this.registro, 'congegni')
      const mittente = c.mittente.nomeIn(m)
      /* ── OGNI CONSEGNA LASCIA UNA RIGA COL MITTENTE ──
         Il rischio vero di un modello a eventi è l'azione a distanza:
         una porta che si apre e sullo schermo non c'è nessuno che
         l'ha aperta. */
      if (!destinatario || typeof destinatario.accetta !== 'function' ||
          !destinatario.accetta(c.cmd)) {
        this.registro.scrivi(contesto, null, 'no',
          `${mittente} manda «${c.cmd}» a «${c.a}», ma lì non c'è niente che lo ascolti`,
          'aziona un congegno')
        continue
      }
      const risposta = destinatario.ricevi(c.cmd, null, contesto)
      if (risposta && risposta.esito && risposta.esito.finito && risposta.esito.speso)
        this.registro.scrivi(contesto, null, 'fa',
          `${mittente} dice a ${destinatario.nomeIn(m)}: ${c.cmd}`,
          `${mittente} aziona ${destinatario.nomeIn(m)}`)
    }
    return true
  }

  /* ═══════════ come è finita ═══════════ */
  finisce (vinto, motivo, colpevole) {
    const m = this.mondo
    m.finita = true
    m.vinto = vinto
    m.motivo = motivo
    m.colpevole = colpevole || m.colpevole || null
    /* Perdere senza un ordine colpevole non aiuta nessuno: si indica
       l'ordine che qualcuno dei TUOI stava eseguendo in quel momento —
       un ordine che non hai scritto non è un ordine che puoi
       correggere. */
    if (!vinto && !m.colpevole) {
      const miei = m.unita.filter(u => u.fazione === m.mia)
      const chi = miei.find(u => !u.eInPiedi() && u.ordineOra) || miei.find(u => u.ordineOra)
      if (chi) m.colpevole = { unita: chi.id, ...chi.ordineOra }
      const riga = this.registro.ultimoIntoppo()
      if (riga) m.colpevole = { unita: riga.unita, i: riga.i, filo: riga.filo,
                                ramo: riga.ramo, j: riga.j }
    }
    m.eventi.push(vinto ? 'vinta' : 'persa')
  }

  ultimoIntoppo () {
    const riga = this.registro.ultimoIntoppo()
    return riga ? ` L'ultimo intoppo: ${this.mondo.nomeDi(riga.unita)} — «${riga.testo}».` : ''
  }

  tempoScaduto () {
    /* e se qualcuno dei tuoi è fermo ad aspettare, la scena finisce
       dicendo COSA aspettava: «gira a vuoto» è vero per un ciclo che non
       esce, ma su un'attesa che non arriverà mai è una diagnosi che non
       si può usare */
    const fermo = this.mondo.unita.find(u => u.eInPiedi() && u.fazione === this.mondo.mia && u.attesa)
    this.finisce(false, fermo
      ? `La scena non finisce più: ${fermo.comeSiChiama} è ancora lì — «${fermo.attesa}».`
      : 'La scena non finisce più: qualcuno gira a vuoto.')
  }

  /* ── STALLO ──
     Nessuno ha speso un battito: niente potrà più cambiare. Non è un
     ciclo da far girare — è un errore, e va detto dalla parte di chi
     può rimediare. */
  stallo (impegnati, inAscolto) {
    const m = this.mondo
    const miei = impegnati.filter(u => u.fazione === m.mia)
    const loro = impegnati.filter(u => u.fazione !== m.mia)
    const fermi = lista => lista.some(u => u.attesa)
    if (miei.length && loro.length && fermi(miei) && fermi(loro))
      return this.finisce(false, 'Stallo: vi state aspettando a vicenda, e nessuno fa la prima mossa.',
                          { unita: miei[0].id, ...miei[0].ordineOra })
    if (miei.length) {
      const chi = miei[0]
      const altri = miei.length > 1 ? ` (e con lui ${miei.length - 1} altro/i)` : ''
      return this.finisce(false,
        `Stallo: ${chi.comeSiChiama} è piantato su «${chi.attesa || 'qualcosa'}» e non succederà mai${altri}.`,
        { unita: chi.id, ...chi.ordineOra })
    }
    if (loro.length)
      return this.finisce(false, `Stallo: ${loro[0].comeSiChiama} sta ancora aspettando, e non arriverà.`)
    const chi = inAscolto[0]
    this.finisce(false, chi
      ? `Stallo: ${chi.comeSiChiama} sta ascoltando, ma non manderà più niente nessuno.`
      : 'Stallo: non succede più niente.')
  }

  /* far girare tutto fino alla fine: è quello che usa il test, ed è
     quello che usa il gioco quando vuole sapere com'è finita senza
     guardare. Niente `Math.random` da nessuna parte. */
  finoInFondo () {
    while (!this.mondo.finita) this.passo()
    return this.mondo
  }
}
