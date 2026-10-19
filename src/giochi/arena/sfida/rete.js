// Il filo verso il servizio di inoltro (servizio/inoltro, docs/arena/multigiocatore.md): crea una stanza e apre il collegamento.
// Niente di Castle Battle qui dentro: due funzioni e un canale che manda e riceve oggetti. `WebSocket` e `fetch` si possono
// passare da fuori, per provarlo senza rete.
export const SERVIZIO = 'https://sfida.educagioco.workers.dev'
export const CODICE = /^[A-Z]{5}$/

/* una stanza nuova: torna il codice di 5 lettere, o un errore con la frase da dire al bambino */
export async function creaStanza({ servizio = SERVIZIO, fetchImpl = globalThis.fetch } = {}) {
  let r
  try { r = await fetchImpl(`${servizio}/crea`) } catch { throw new Error('non riesco a collegarmi: serve internet') }
  if (r.status === 429) throw new Error('hai creato troppe sfide, riprova fra un po\'')
  if (!r.ok) throw new Error('il servizio delle sfide non risponde ora')
  const { codice } = await r.json()
  if (!CODICE.test(codice || '')) throw new Error('il servizio delle sfide non risponde ora')
  return codice
}

/* entra nella stanza: `canale.invia(oggetto)`, `canale.chiudi()`; `alMessaggio(oggetto)` e `allaChiusura(motivo)` dicono
   cosa arriva. Un codice che non esiste o una stanza piena non si aprono: `allaChiusura('non entra')` */
export function collega(codice, { servizio = SERVIZIO, WebSocketImpl = globalThis.WebSocket, alMessaggio, allaChiusura, allApertura = () => {} }) {
  const ws = new WebSocketImpl(`${servizio.replace(/^http/, 'ws')}/entra/${codice}`)
  let aperto = false, chiuso = false
  const fine = motivo => { if (!chiuso) { chiuso = true; allaChiusura(motivo) } }
  ws.addEventListener('open', () => { aperto = true; allApertura() })
  ws.addEventListener('message', e => {
    let m
    try { m = JSON.parse(e.data) } catch { return }
    if (m && typeof m === 'object') alMessaggio(m)
  })
  ws.addEventListener('close', () => fine(aperto ? 'chiuso' : 'non entra'))
  ws.addEventListener('error', () => fine(aperto ? 'errore' : 'non entra'))
  return {
    invia: m => { if (aperto && !chiuso) ws.send(JSON.stringify(m)) },
    chiudi: () => { chiuso = true; try { ws.close() } catch { /* già chiuso */ } },
  }
}
