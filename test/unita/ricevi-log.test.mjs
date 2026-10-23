/* IL RICEVITORE DEI LOG E L'INVIO DIRETTO, SENZA BROWSER
   Difende: la sonda, un POST che scrive il file con la riga DATI, il rifiuto del troppo grande e di Origin/Host
   estranei, e le due funzioni dell'app (con fetch finta) che non lanciano mai.
   `node test/esegui.mjs ricevi-log --niente-build` */
import http from 'node:http'
import os from 'node:os'
import { mkdtempSync, readFileSync, existsSync, rmSync } from 'node:fs'
import { join } from 'node:path'
import { creaRicevitore, ostePermesso, LIMITE } from '../../strumenti/ricevi-log.mjs'
import { sondaRicevitore, mandaAlRicevitore } from '../../src/grafica/benchmark/invio-diretto.js'
import { controlla, uguale, riassunto } from '../aiuto/verifica.mjs'

const cartella = mkdtempSync(join(os.tmpdir(), 'ricevuti-'))
const righe = []
const server = creaRicevitore({ dist: cartella, cartella: join(cartella, 'r'), registra: s => righe.push(s) })
await new Promise(ok => server.listen(0, '127.0.0.1', ok))
const origin = `http://127.0.0.1:${server.address().port}`

const chiedi = (metodo, corpo, intest = {}) => new Promise(ok => {
  const q = http.request(origin + '/ricevi-log', { method: metodo, headers: intest }, r => {
    let t = ''; r.on('data', c => t += c); r.on('end', () => ok({ stato: r.statusCode, corpo: t, h: r.headers }))
  })
  q.on('error', () => ok({ stato: 0, corpo: '', h: {} }))
  q.end(corpo)
})

try {
  uguale('host di casa', [ostePermesso('192.168.1.5'), ostePermesso('100.101.2.3'), ostePermesso('nas.tail0b2414.ts.net'), ostePermesso('8.8.8.8'), ostePermesso('example.com')].join(), 'true,true,true,false,false')

  const sonda = await chiedi('GET')
  uguale('sonda', sonda.corpo, '{"ok":true,"v":1}')
  controlla('sonda dall\'app', await sondaRicevitore(origin))

  const testo = 'MISURA\nK | schermo\nDATI {"v":2,"k":"veri"}'
  const r = await chiedi('POST', JSON.stringify({ testo, agente: 'Redmi Note 7' }), { 'content-type': 'application/json' })
  const j = JSON.parse(r.corpo)
  controlla('POST ok', r.stato === 200 && j.ok && existsSync(j.file), r.corpo)
  controlla('il file ha il testo con la riga DATI', readFileSync(j.file, 'utf8').includes('DATI {"v":2,"k":"veri"}'))
  controlla('nome col modello', /\d{4}-\d\d-\d\dT\d{4}-redmi-note-7\.txt$/.test(j.file), j.file)
  controlla('riga in console', righe[0].startsWith('ricevuto: ') && righe[0].includes('byte)'))

  const app = await mandaAlRicevitore({ testo: 'prova\nDATI {}' }, origin)
  controlla('mandaAlRicevitore', app.ok && existsSync(app.file))

  const grande = await chiedi('POST', JSON.stringify({ testo: 'x'.repeat(LIMITE + 10) }))
  uguale('troppo grande', grande.stato, 413)
  const estraneo = await chiedi('POST', JSON.stringify({ testo: 'a' }), { origin: 'https://example.com' })
  uguale('origine estranea', estraneo.stato, 403)
  controlla('niente CORS aperto', !estraneo.h['access-control-allow-origin'])
  const hostEstraneo = await chiedi('GET', undefined, { host: 'example.com' })
  uguale('host estraneo', hostEstraneo.stato, 403)
  const lan = await chiedi('GET', undefined, { origin: 'http://192.168.1.9:8787' })
  uguale('CORS per la LAN', lan.h['access-control-allow-origin'], 'http://192.168.1.9:8787')
  uguale('senza testo', (await chiedi('POST', '{}')).stato, 400)

  // le funzioni dell'app con fetch finta
  const vera = globalThis.fetch
  globalThis.fetch = async () => { throw new Error('rete') }
  uguale('sonda senza rete', await sondaRicevitore('http://x'), false)
  uguale('invio senza rete', (await mandaAlRicevitore({ testo: 'a' }, 'http://x')).ok, false)
  globalThis.fetch = async () => ({ ok: false, status: 500, json: async () => { throw new Error('no') } })
  uguale('invio con risposta rotta', (await mandaAlRicevitore({ testo: 'a' }, 'http://x')).errore, 'risposta 500')
  uguale('sonda con risposta rotta', await sondaRicevitore('http://x'), false)
  globalThis.fetch = async () => ({ ok: true, status: 200, json: async () => ({ ok: true, file: '/f.txt' }) })
  uguale('invio finto', (await mandaAlRicevitore({ testo: 'a' }, 'http://x')).file, '/f.txt')
  globalThis.fetch = vera
} finally {
  server.close(); rmSync(cartella, { recursive: true, force: true })
}
riassunto('ricevi-log')
