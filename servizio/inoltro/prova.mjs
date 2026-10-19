// Prova il servizio di inoltro, in locale (`npx wrangler dev`, poi `node prova.mjs`) o sul tuo indirizzo:
//   node prova.mjs https://sfida.<tuo-sottodominio>.workers.dev
// Crea una stanza, collega due client finti e controlla: i ruoli, l'inoltro, il terzo che non entra,
// il messaggio troppo grande, il codice sbagliato e l'«via» quando uno se ne va.
const BASE = (process.argv[2] || 'http://localhost:8787').replace(/\/$/, '')
const WS = BASE.replace(/^http/, 'ws')
let guasti = 0
const controlla = (cosa, ok, dettaglio = '') => { console.log(`${ok ? '✅' : '❌'} ${cosa}${ok ? '' : ' — ' + dettaglio}`); if (!ok) guasti++ }
const pausa = ms => new Promise(r => setTimeout(r, ms))

function apri(codice) {
  return new Promise((ok, no) => {
    const ws = new WebSocket(`${WS}/entra/${codice}`)
    const arrivati = []
    ws.addEventListener('message', e => arrivati.push(JSON.parse(e.data)))
    ws.addEventListener('open', () => ok({ ws, arrivati }))
    ws.addEventListener('error', () => no(new Error('non si apre')))
  })
}

const { codice } = await (await fetch(`${BASE}/crea`)).json()
controlla('una stanza nuova ha un codice di 5 lettere', /^[A-Z]{5}$/.test(codice), codice)

const a = await apri(codice)
await pausa(200)
controlla('il primo è l\'host', a.arrivati[0]?.t === 'ciao' && a.arrivati[0].ruolo === 'host', JSON.stringify(a.arrivati))
const b = await apri(codice)
await pausa(300)
controlla('il secondo è l\'ospite', b.arrivati[0]?.ruolo === 'ospite', JSON.stringify(b.arrivati))
controlla('quando sono in due lo sanno tutti e due', a.arrivati.some(m => m.t === 'pronti') && b.arrivati.some(m => m.t === 'pronti'))

a.ws.send(JSON.stringify({ t: 'mossa', k: 12, azione: 'costruisci' }))
b.ws.send(JSON.stringify({ t: 'mossa', k: 13, azione: 'potenzia' }))
await pausa(300)
controlla('la mossa dell\'host arriva all\'ospite, tale e quale', b.arrivati.some(m => m.t === 'mossa' && m.k === 12 && m.azione === 'costruisci'))
controlla('e quella dell\'ospite all\'host', a.arrivati.some(m => m.t === 'mossa' && m.k === 13))
controlla('ma non torna a chi l\'ha mandata', !a.arrivati.some(m => m.k === 12))

const terzo = await apri(codice).then(() => 'entrato', () => 'respinto')
controlla('un terzo non entra', terzo === 'respinto', terzo)
const sbagliato = await apri('ZZZZZ').then(() => 'entrato', () => 'respinto')
controlla('un codice che non esiste non entra', sbagliato === 'respinto', sbagliato)

let chiuso = null
b.ws.addEventListener('close', e => { chiuso = e.code })
b.ws.send('x'.repeat(2000))
await pausa(300)
controlla('un messaggio troppo grande chiude chi lo manda', chiuso === 1009, String(chiuso))
await pausa(300)
controlla('e l\'altro lo sa', a.arrivati.some(m => m.t === 'via'))
a.ws.close()

const c = await fetch(`${BASE}/crea`).then(r => r.json())
controlla('si possono creare altre stanze', /^[A-Z]{5}$/.test(c.codice || ''))
console.log(guasti ? `\n❌ ${guasti} controlli falliti` : '\n✅ tutto a posto')
process.exit(guasti ? 1 : 0)
