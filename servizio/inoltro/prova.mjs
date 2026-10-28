// Prova il servizio di inoltro, in locale (`npx wrangler dev`, poi `node prova.mjs`) o sul tuo indirizzo:
//   node prova.mjs https://sfida.<tuo-sottodominio>.workers.dev
// Il tavolo (docs/core/insieme.md): i posti, l'inoltro, il ping, chi cade e rientra col suo posto, chi se ne va, i no.
// La stanza di prima (per i telefoni col gioco vecchio): i ruoli, l'inoltro, il terzo che non entra, il messaggio troppo
// grande, il codice sbagliato e l'«via» quando uno se ne va. Poi gli amici.
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

/* ── il tavolo ── */
function siedi(codice, posto) {
  return new Promise(ok => {
    const ws = new WebSocket(`${WS}/tavolo/${codice}?posto=${posto}`)
    const arrivati = []
    let chiuso = null
    ws.addEventListener('message', e => arrivati.push(JSON.parse(e.data)))
    ws.addEventListener('close', e => { chiuso = e.code })
    ws.addEventListener('open', () => ok({ ws, arrivati, chiuso: () => chiuso }))
    ws.addEventListener('error', () => ok({ ws, arrivati, chiuso: () => chiuso ?? 'errore' }))
  })
}
const posto = c => c.repeat(20)
controlla('un tavolo senza il posto di chi lo crea non si fa', (await fetch(`${BASE}/tavolo/nuovo`)).status === 400)
const tav = await (await fetch(`${BASE}/tavolo/nuovo?posto=${posto('h')}`)).json()
controlla('un tavolo nuovo ha un codice di 5 lettere', /^[A-Z]{5}$/.test(tav.codice || ''), JSON.stringify(tav))
const o = await siedi(tav.codice, posto('o'))
await pausa(250)
controlla('chi entra prima di chi ha creato è l\'ospite (il posto dell\'host è prenotato), da solo', o.arrivati[0]?.t === 'ciao' && o.arrivati[0].ruolo === 'ospite' && o.arrivati[0].altro === false, JSON.stringify(o.arrivati))
const h = await siedi(tav.codice, posto('h'))
await pausa(300)
controlla('chi ha creato è l\'host e sa che l\'altro c\'è', h.arrivati[0]?.ruolo === 'host' && h.arrivati[0].altro === true, JSON.stringify(h.arrivati))
controlla('e l\'ospite sa che è arrivato', o.arrivati.some(m => m.t === 'su'))
h.ws.send('{"t":"ping"}'); await pausa(250)
controlla('al ping risponde il servizio, e il ping non arriva all\'altro', h.arrivati.some(m => m.t === 'pong') && !o.arrivati.some(m => m.t === 'ping'))
const grosso = JSON.stringify({ t: 'm', n: 1, a: 0, f: 'x'.repeat(1900) })
h.ws.send(grosso); await pausa(300)
controlla('un messaggio da quasi 2 KB passa, tale e quale', o.arrivati.some(m => m.t === 'm' && m.f?.length === 1900))
o.ws.close(); await pausa(400)
controlla('l\'ospite chiude il filo senza addio: l\'host sente «giù», non «via»', h.arrivati.some(m => m.t === 'giu') && !h.arrivati.some(m => m.t === 'via'), JSON.stringify(h.arrivati.slice(-3)))
const o2 = await siedi(tav.codice, posto('o'))
await pausa(300)
controlla('rientra col suo posto: è ancora l\'ospite, e l\'host lo sa', o2.arrivati[0]?.ruolo === 'ospite' && h.arrivati.some(m => m.t === 'su'), JSON.stringify(h.arrivati))
const o3 = await siedi(tav.codice, posto('o'))
await pausa(400)
controlla('rientra due volte (il primo filo forse morto): il vecchio si chiude, il nuovo resta', (o2.chiuso() === 4000 || o2.ws.readyState >= 2) && o3.arrivati[0]?.ruolo === 'ospite', `${o2.chiuso()} ${o2.ws.readyState} ${JSON.stringify(o3.arrivati)}`)
controlla('e per l\'host non è mai stato «giù»', h.arrivati.filter(m => m.t === 'giu').length === 1)
const terzoT = await siedi(tav.codice, posto('z'))
await pausa(300)
controlla('un terzo: il servizio dice «piena» e chiude', terzoT.arrivati[0]?.t === 'no' && terzoT.arrivati[0].perche === 'piena' && terzoT.chiuso() === 4001, `${JSON.stringify(terzoT.arrivati)} ${terzoT.chiuso()}`)
const nessuno = await siedi('ZZZZZ', posto('n'))
await pausa(300)
controlla('un codice che non c\'è: «nessuno»', nessuno.arrivati[0]?.perche === 'nessuno', JSON.stringify(nessuno.arrivati))
o3.ws.send('{"t":"addio"}'); await pausa(400)
controlla('chi dice addio: l\'altro sente «via»', h.arrivati.some(m => m.t === 'via'))
const torna = await siedi(tav.codice, posto('o'))
await pausa(300)
controlla('e chi ha detto addio non si risiede', torna.arrivati[0]?.perche === 'andato', JSON.stringify(torna.arrivati))
h.ws.close()

/* ── la stanza di prima ── */
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
