/* Il tavolo: due posti e un inoltro che sopporta le cadute (docs/core/insieme.md), senza niente di Cloudflare: così si prova
   con collegamenti finti. Ogni telefono entra con un `posto` suo (una parola casuale che ha solo lui): chi crea il tavolo
   prenota il suo, ed è `host` anche se il suo primo collegamento arriva dopo quello dell'altro; il secondo posto è `ospite`.
   Chi rientra con lo stesso posto riprende il suo, anche dopo una caduta. Un posto vuoto si tiene per
   `GRAZIA`; chi se ne va davvero dice `addio`. Il servizio non legge i messaggi: controlla misura, forma e ritmo, e li gira
   all'altro se c'è (se non c'è si perdono: li rimanda il telefono, che tiene quelli non confermati). */
export const POSTO = /^[a-z0-9]{16,40}$/
export const MAX_BYTE = 2048                     // un pezzo da 800 caratteri, anche con le virgolette raddoppiate
// messaggi: l'onda che arriva tutta insieme dopo che la rete si è piantata passa, un martello no
export const SECCHIO = { pieno: 300, alSecondo: 40 }
export const GRAZIA = 2 * 60 * 1000              // un posto vuoto si tiene due minuti
export const ATTESA = 5 * 60 * 1000              // un tavolo dove l'altro non arriva si chiude dopo cinque minuti
export const DURATA = 90 * 60 * 1000             // e comunque dopo un'ora e mezza dall'arrivo del secondo

export const nuovoTavolo = (ora, postoHost) => ({ nato: ora, scade: ora + ATTESA, posti: [{ posto: postoHost, ruolo: 'host', via: false, assenteDa: null }] })

/* `collegati`: i collegamenti aperti adesso, [{ ws, posto }] (non quelli sostituiti). Le funzioni tornano cosa mandare e a chi
   (`invii: [{ a, msg }]`) e cosa chiudere; non toccano niente di Cloudflare. */
const altroPosto = (stato, posto) => stato.posti.find(p => p.posto !== posto)
const socketDi = (collegati, posto) => collegati.filter(c => c.posto === posto).map(c => c.ws)

/* qualcuno chiede di sedersi con il suo `posto` */
export function entra(stato, collegati, posto, ora) {
  let mio = stato.posti.find(p => p.posto === posto)
  if (!mio) {
    if (stato.posti.length >= 2) return { esito: 'piena' }
    mio = { posto, ruolo: 'ospite', via: false, assenteDa: null }
    stato.posti.push(mio)
    if (mio.ruolo === 'ospite') stato.scade = ora + DURATA       // si gioca
  }
  if (mio.via) return { esito: 'andato' }
  mio.assenteDa = null
  const altro = altroPosto(stato, posto)
  const altriWs = altro ? socketDi(collegati, altro.posto) : []
  const invii = altriWs.map(a => ({ a, msg: { t: 'su' } }))
  return { esito: 'ok', ruolo: mio.ruolo, sostituiti: socketDi(collegati, posto),
           ciao: { t: 'ciao', ruolo: mio.ruolo, altro: altriWs.length > 0, andato: !!altro?.via }, invii }
}

/* un collegamento si chiude (caduto, o con `addio`): l'altro lo sa. `collegati` è senza quello che si chiude. */
export function esce(stato, collegati, posto, ora, { addio = false } = {}) {
  const mio = stato.posti.find(p => p.posto === posto)
  if (!mio || mio.via || socketDi(collegati, posto).length) return { invii: [] }      // già via, o è rientrato da un altro filo
  if (addio) mio.via = true
  else mio.assenteDa = ora
  const altro = altroPosto(stato, posto)
  const invii = altro ? socketDi(collegati, altro.posto).map(a => ({ a, msg: { t: addio ? 'via' : 'giu' } })) : []
  return { invii, fine: tuttiVia(stato) }
}

const tuttiVia = stato => stato.posti.length > 0 && stato.posti.every(p => p.via)

/* il prossimo momento in cui c'è qualcosa da decidere: la scadenza del tavolo o quella di un posto vuoto */
export const prossimo = stato => Math.min(stato.scade, ...stato.posti.filter(p => p.assenteDa !== null && !p.via).map(p => p.assenteDa + GRAZIA))

/* è suonato l'allarme: un posto vuoto da troppo è perso (l'altro lo sa), un tavolo scaduto si chiude */
export function allarme(stato, collegati, ora) {
  if (ora >= stato.scade) return { invii: collegati.map(c => ({ a: c.ws, msg: { t: 'no', perche: 'chiuso' } })), chiudi: collegati.map(c => c.ws), fine: true }
  const invii = []
  for (const p of stato.posti) {
    if (p.via || p.assenteDa === null || ora - p.assenteDa < GRAZIA) continue
    p.via = true
    const altro = altroPosto(stato, p.posto)
    if (altro) for (const a of socketDi(collegati, altro.posto)) invii.push({ a, msg: { t: 'via' } })
  }
  return { invii, chiudi: [], fine: tuttiVia(stato) }
}

/* il ritmo: un secchio che si riempie di `alSecondo` gettoni fino a `pieno`; ogni messaggio ne prende uno */
export function secchio(s = { gettoni: SECCHIO.pieno, ora: 0 }, ora) {
  const gettoni = Math.min(SECCHIO.pieno, s.gettoni + (ora - s.ora) / 1000 * SECCHIO.alSecondo)
  return gettoni >= 1 ? { ok: true, s: { gettoni: gettoni - 1, ora } } : { ok: false, s: { gettoni, ora } }
}

/* un messaggio in arrivo: è da girare, è un addio, o è da rifiutare (e il collegamento si chiude con quel codice) */
export function leggiMessaggio(testo) {
  if (typeof testo !== 'string' || testo.length > MAX_BYTE) return { ok: false, codice: 1009, ragione: 'messaggio troppo grande' }
  let dato
  try { dato = JSON.parse(testo) } catch { return { ok: false, codice: 1003, ragione: 'non è un messaggio' } }
  if (!dato || typeof dato !== 'object' || typeof dato.t !== 'string') return { ok: false, codice: 1003, ragione: 'non è un messaggio' }
  return { ok: true, dato }
}
