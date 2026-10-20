// Il filo verso il servizio di inoltro (servizio/inoltro, docs/arena/multigiocatore.md): crea una stanza e apre il collegamento.
// Niente di Castle Battle qui dentro: due funzioni e un canale che manda e riceve oggetti. `WebSocket` e `fetch` si possono
// passare da fuori, per provarlo senza rete.
export const SERVIZIO = 'https://sfida.educagioco.workers.dev'
export const CODICE = /^[A-Z]{5}$/

// Un telefono può perdere una richiesta ogni tanto, a caso (visto dal vivo: 1 su 4 sul telefono di una bambina, verso qualunque
// indirizzo). Il tempo tipico è un decimo di secondo: aspettarne più di 3-4 vuol dire che quella richiesta è persa, e si rifà.
const TENTATIVI = 3
const ATTESA_CREAZIONE = 3500       // ms
const ATTESA_APERTURA = 4000        // ms

/* una stanza nuova: torna il codice di 5 lettere, o un errore con la frase da dire al bambino. Una richiesta persa si rifà
   (creare una stanza due volte non fa danni: quella senza risposta scade da sola). */
export async function creaStanza({ servizio = SERVIZIO, fetchImpl = globalThis.fetch, tentativi = TENTATIVI, attesa = ATTESA_CREAZIONE } = {}) {
  let r = null, corpo = null
  for (let i = 0; i < tentativi && !r; i++) {
    const ctl = new AbortController(), t = setTimeout(() => ctl.abort(), attesa)
    try {
      const x = await fetchImpl(`${servizio}/crea`, { signal: ctl.signal })
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

/* entra nella stanza: `canale.invia(oggetto)`, `canale.chiudi()`; `alMessaggio(oggetto)` e `allaChiusura(motivo, dettaglio)` dicono
   cosa arriva. Un collegamento che non si apre in `attesa` ms si lascia e se ne prova un altro (fino a `tentativi`); un codice che
   non esiste o una stanza piena non si aprono mai: `allaChiusura('non entra')` dopo l'ultimo tentativo */
export function collega(codice, { servizio = SERVIZIO, WebSocketImpl = globalThis.WebSocket, alMessaggio, allaChiusura, allApertura = () => {},
                                  tentativi = TENTATIVI, attesa = ATTESA_APERTURA, pausa = 300 }) {
  let ws = null, aperto = false, chiuso = false, provati = 0, timer = 0
  // il codice e la ragione con cui il servizio (o la rete) ha chiuso: 1006 = caduta la rete, 1008 = troppi messaggi, 1009 = messaggio troppo grande
  const fine = (motivo, e) => { if (!chiuso) { chiuso = true; clearTimeout(timer); allaChiusura(motivo, e ? { codice: e.code, ragione: e.reason || '', pulita: !!e.wasClean } : null) } }
  const tenta = () => {
    provati++
    const w = new WebSocketImpl(`${servizio.replace(/^http/, 'ws')}/entra/${codice}`)
    ws = w
    const viva = () => ws === w && !chiuso
    // prima dell'apertura un fallimento è un tentativo da rifare; dopo, è la fine del collegamento
    const fallito = (motivo, e) => {
      if (!viva()) return
      if (aperto) return fine(motivo, e)
      clearTimeout(timer)
      ws = null                                        // questo tentativo non conta più
      try { w.close() } catch { /* già chiuso */ }
      if (provati < tentativi) setTimeout(() => { if (!chiuso) tenta() }, pausa)
      else fine('non entra', e)
    }
    timer = setTimeout(() => fallito('lento'), attesa)
    w.addEventListener('open', () => { if (!viva()) return; clearTimeout(timer); aperto = true; allApertura() })
    w.addEventListener('message', e => {
      if (!viva()) return
      let m
      try { m = JSON.parse(e.data) } catch { return }
      if (m && typeof m === 'object') alMessaggio(m)
    })
    w.addEventListener('close', e => fallito('chiuso', e))
    w.addEventListener('error', e => fallito('errore', e))
  }
  tenta()
  return {
    invia: m => { if (aperto && !chiuso && ws) ws.send(JSON.stringify(m)) },
    chiudi: () => { chiuso = true; clearTimeout(timer); try { ws?.close() } catch { /* già chiuso */ } },
  }
}
