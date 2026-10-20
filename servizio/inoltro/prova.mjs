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

/* ── gli amici (docs/core/amici.md) ── */
const casuale = n => Array.from(crypto.getRandomValues(new Uint8Array(n)), x => 'abcdefghijklmnopqrstuvwxyz0123456789'[x % 36]).join('')
const post = (percorso, corpo) => fetch(`${BASE}${percorso}`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(corpo) })
const chiave = casuale(32)
const cod = await post('/amici/codice', { chiave }).then(r => r.json())
controlla('un codice per abbinarsi: cinque lettere e una scadenza', /^[A-Z]{5}$/.test(cod.codice || '') && cod.scade > Date.now(), JSON.stringify(cod))
controlla('una chiave storta non passa', (await post('/amici/codice', { chiave: 'corta' })).status === 400)
const preso = await post('/amici/riscatta', { codice: cod.codice })
controlla('riscattando si riceve la chiave', (await preso.json()).chiave === chiave)
controlla('e il codice è bruciato (uso singolo)', (await post('/amici/riscatta', { codice: cod.codice })).status === 404)

function apriPresenza() {
  return new Promise((ok, no) => {
    const ws = new WebSocket(`${WS}/amici/presenza`)
    const arrivati = []
    let chiuso = null
    ws.addEventListener('message', e => arrivati.push(JSON.parse(e.data)))
    ws.addEventListener('close', e => { chiuso = e.code })
    ws.addEventListener('open', () => ok({ ws, arrivati, chiuso: () => chiuso, dichiaro: (id, chiavi) => ws.send(JSON.stringify({ k: 'dichiaro', id, chiavi })) }))
    ws.addEventListener('error', () => no(new Error('non si apre')))
  })
}
const altraChiave = casuale(32)
const leo = await apriPresenza(); leo.dichiaro('leonardo1', [chiave, altraChiave]); await pausa(250)
controlla('il primo si presenta: nessun amico c\'è', leo.arrivati[0]?.t === 'ciao' && leo.arrivati[0].presenti.length === 0, JSON.stringify(leo.arrivati))
const mel = await apriPresenza(); mel.dichiaro('melody001', [chiave]); await pausa(300)
controlla('il secondo si presenta e vede che l\'amico c\'è', mel.arrivati[0]?.presenti?.includes(chiave), JSON.stringify(mel.arrivati))
controlla('il primo lo sa (su), per quella chiave', leo.arrivati.some(m => m.t === 'su' && m.chiave === chiave))
leo.ws.send(JSON.stringify({ k: 'a', chiave, m: { k: 'invito', gioco: 'arena', dati: { terreno: 'bosco', secondi: 10 } } })); await pausa(300)
controlla('un invito arriva all\'altro, incartato con la chiave', mel.arrivati.some(m => m.t === 'da' && m.chiave === chiave && m.m.dati?.terreno === 'bosco'))
controlla('e non torna a chi l\'ha mandato', !leo.arrivati.some(m => m.t === 'da'))
leo.ws.send(JSON.stringify({ k: 'a', chiave: altraChiave, m: { k: 'invito' } })); await pausa(200)
controlla('su una chiave senza l\'altro collegato non arriva niente a nessuno', !mel.arrivati.some(m => m.chiave === altraChiave))
const estraneo = await apriPresenza(); estraneo.dichiaro('estraneo01', [chiave]); await pausa(300)
controlla('un terzo non entra in un\'amicizia di due, e nessuno lo vede', estraneo.arrivati[0]?.rifiutate?.includes(chiave) && !leo.arrivati.some(m => m.t === 'su' && m.chiave === chiave && leo.arrivati.filter(x => x.t === 'su').length > 1))
const mel2 = await apriPresenza(); mel2.dichiaro('melody001', [chiave]); await pausa(600)
controlla('chi rientra con lo stesso id prende il posto, e quello vecchio si chiude', mel.ws.readyState >= 2 && mel2.arrivati[0]?.presenti?.includes(chiave), `${mel.ws.readyState} ${JSON.stringify(mel2.arrivati)}`)
controlla('l\'altro non vede «giù» per un collegamento sostituito', !leo.arrivati.some(m => m.t === 'giu'))
mel2.ws.send('x'.repeat(2000)); await pausa(300)
controlla('un messaggio troppo grande chiude chi lo manda', mel2.chiuso() === 1009, String(mel2.chiuso()))
controlla('e l\'altro sa che è giù', leo.arrivati.some(m => m.t === 'giu' && m.chiave === chiave))
const brutto = await apriPresenza(); brutto.ws.send(JSON.stringify({ k: 'dichiaro', id: 'X', chiavi: ['no'] })); await pausa(300)
controlla('una dichiarazione storta chiude chi la manda', brutto.chiuso() === 1003, String(brutto.chiuso()))
leo.ws.close(); estraneo.ws.close()
// per ultimo: indovinare i codici blocca l'indirizzo per un minuto
let ultimoStato = 0
for (let i = 0; i < 12; i++) ultimoStato = (await post('/amici/riscatta', { codice: 'AAAA' + 'BCDEFGHJKLMN'[i] })).status
controlla('dopo dieci codici sbagliati si viene fermati (429)', ultimoStato === 429, String(ultimoStato))
console.log(guasti ? `\n❌ ${guasti} controlli falliti` : '\n✅ tutto a posto')
process.exit(guasti ? 1 : 0)
