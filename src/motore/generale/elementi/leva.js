import { Elemento } from '../elemento.js'
import { Esito } from '../azioni/esiti.js'

/* ═══════════════════════════════════════════════════════════════════
   LA LEVA — il primo congegno: la si preme, e lei comanda ad altri

   Non fa niente da sola: `collegata` è la lista di chi deve sentirsi
   dire qualcosa quando questa scatta. «premi qui e liberi il tesoro,
   ma anche l'orco» diventa scrivibile perché la leva può avere PIÙ DI
   UNA cosa in lista, e ognuna riceve lo stesso comando (`apri`) senza
   che la leva sappia che cos'è — lo sa il destinatario (§8.2 del piano
   in `docs/generale_improvements.md`).

   IL COMANDO ARRIVA AL BATTITO DOPO, non subito: si accoda in
   `m.comandiPendenti` e lo consegna `passo()`, con lo stesso principio
   già in piedi per i segnali (`m.pendenti`) — se due elementi si
   comandano a vicenda (una leva che ne sblocca un'altra che rimanda
   indietro un comando) si rimbalzano un messaggio al giro, non un
   ciclo infinito nello stesso istante.

   PREMUTA UNA VOLTA, FATTO PER SEMPRE: non è un interruttore che si
   spegne ripremendolo. Un congegno che torna indietro è un'idea in più
   da spiegare, e nessun livello del Generale ne ha bisogno oggi. */
export class Leva extends Elemento {
  get tipo () { return 'congegno' }
  get em () { return '🕹️' }

  constructor (id, d) {
    super(id, d)
    /* i nomi di quello a cui questa leva è collegata: il filo lo
       dichiara il livello, cosa succede quando arriva lo decide chi
       riceve — qui non ci si scrive mai «apre la grata» */
    this.collegata = d.collegata || []
    this.premuta = false
  }

  azzera () { this.premuta = false }

  chiedi (q) {
    if (q === 'premuto') return this.premuta
    return null
  }

  accetta (cmd) { return cmd === 'premi' }

  ricevi (cmd, chi, ctx) {
    if (cmd !== 'premi') return null
    if (this.premuta) return { esito: Esito.finitoSubito() }
    this.premuta = true
    const N = this.nomeIn(ctx.mondo)
    /* il comando parte ma non arriva subito: la coda dei congegni si
       consegna a fine passo, esattamente come quella dei segnali —
       vedi il commento accanto a `m.comandiPendenti` in generale.js */
    for (const id of this.collegata)
      ctx.mondo.comandiPendenti.push({ cmd: 'apri', a: id, mittente: this })
    return { esito: Esito.finito(), penso: `premo ${N}`, siVede: `preme ${N}` }
  }

  /* in celle, un solo fatto: se è già stata premuta. Il disegno del
     congegno (a molla, a corda, a ruota) è un mestiere di un altro —
     qui si consegna solo lo stato. `alone: true` perché è una cosa che
     si nomina in un ordine, non arredo dipinto sul fondale (§8.4 bis
     del piano, «l'alone sui toccabili») */
  faccia () {
    return [{ che: 'leva', x: this.x, y: this.y, premuta: this.premuta, alone: true }]
  }

  /* come `Porta.nomeChiave`: traduce un id collegato nel nome che il
     livello gli ha dato, per parlarne nel registro e nella scheda */
  nomeCollegato (mondo, id) { return ((mondo.livello.nomi || {})[id]) || id }

  scheda (ctx) {
    const m = ctx && ctx.m
    /* UNA REAZIONE CHE NON SI PUÒ LEGGERE NON È UNA REGOLA DEL MONDO,
       È UNA SORPRESA: la scheda dice per esteso a cosa questa leva è
       collegata e cosa succede, non solo che è «una leva». */
    if (!this.collegata.length)
      return [this.premuta ? 'è già stata premuta' : 'non è ancora stata premuta']
    const frase = this.collegata
      .map(id => `si apre ${m ? this.nomeCollegato(m, id) : id}`)
      .join(', ')
    const righe = [`quando la premi: ${frase}`]
    if (this.premuta) righe.push('è già stata premuta')
    return righe
  }
}
