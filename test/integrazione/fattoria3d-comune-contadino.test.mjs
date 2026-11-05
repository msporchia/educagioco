/* ═══════════════════════════════════════════════════════════════════
   IL CONTADINO DELL'AMICO QUANDO LA RETE SINGHIOZZA (docs/fattoria3d/in-comune.md, «La linea del contadino»)

   Due pagine nella fattoria in comune, ognuna col suo proxy cattivo davanti al servizio in locale: le mosse passano per richieste
   che si aprono ogni volta, il contadino per un filo che resta aperto, e il guasto colpisce solo il filo. Si misura per quanto il
   contadino dell'altro sparisce mentre le sue mosse arrivano. Serve `wrangler dev`: `cd servizio/inoltro && npx wrangler dev`, poi
   `SERVIZIO=http://localhost:8787 node test/esegui.mjs fattoria3d-comune-contadino`; senza, salta.
   tempo: 150
   ═══════════════════════════════════════════════════════════════════ */
import { apriBrowser, apriGioco, semina, seminaAmici, attendi, scegli } from '../aiuto/browser.mjs'
import { proxyCattivo } from '../aiuto/proxy-cattivo.mjs'
import { controlla, riassunto } from '../aiuto/verifica.mjs'

const SERVIZIO = (process.env.SERVIZIO || '').replace(/\/$/, '')
const locale = /^http:\/\/(localhost|127\.0\.0\.1):\d+$/.test(SERVIZIO)
const vivo = locale && await fetch(`${SERVIZIO}/amici/comune`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: '{}' }).then(r => r.status === 400, () => false)
if (!vivo) { console.log('⚠️  salto: serve il servizio in locale (SERVIZIO=http://localhost:8787 con wrangler dev)'); process.exit(0) }

const browser = await apriBrowser()
const veri = errori => errori.filter(e => !/WebSocket connection|WebSocket is already|Failed to load resource|net::ERR|ERR_/.test(e))
const CHIAVE = Array.from({ length: 32 }, () => 'abcdefghijklmnopqrstuvwxyz0123456789'[Math.floor(Math.random() * 36)]).join('')
const amico = (id, nome) => ({ chiave: CHIAVE, id, nome, visto: 1, bacheca: null })
const pronto = p => p.waitForFunction(() => !!(window.__fattoria3d && window.__fattoria3d.mondo), null, { timeout: 20000 })

async function telefono(giocatore, altro, porta) {
  const T = await apriGioco(browser, { giocatori: [giocatore] })
  await T.page.addInitScript(s => {
    globalThis.__SERVIZIO_SFIDE__ = s
    const W = WebSocket
    window.__fili = []                  // come sono finiti i fili degli amici
    window.WebSocket = class extends W {
      constructor(u, p) { super(u, p); if (/presenza/.test(u)) { const r = { codice: null }; window.__fili.push(r); this.addEventListener('close', e => { r.codice = e.code; r.ragione = e.reason }) } }
    }
  }, `http://127.0.0.1:${porta}`)
  await semina(T.page, { coins: 5000, settings: { eta: 8, sperimentali: true } }, giocatore)
  await seminaAmici(T.page, [amico(altro.id, altro.nome)], giocatore)
  await scegli(T.page, 'fattoria3d')
  await pronto(T.page)
  await T.page.click('[data-f3="apri-comune"]')
  await T.page.waitForSelector('[data-f3="dialogo"]', { timeout: 5000 })
  await T.page.click('[data-f3="dialogo"] [data-scelta="0"]')
  await T.page.waitForFunction(() => /Con /.test(document.querySelector('.barra-app .dove')?.innerText || '') && !!window.__fattoria3d?.mondo, null, { timeout: 20000 })
  return T
}

/* il bambino che cammina avanti e indietro, e chi guarda: quando il contadino dell'altro c'è e quando no */
const passeggia = p => p.evaluate(() => {
  const { motore: m, mondo } = window.__fattoria3d, e = mondo.eroe, [i0, j0] = e.cella()
  const mete = [[i0 + 4, j0], [i0 - 4, j0], [i0, j0 + 4], [i0, j0 - 4]].filter(c => m.percorsoVerso([i0, j0], [c]))
  let n = 0
  window.__passeggia = setInterval(() => { if (e.fermo) e.vaiA([mete[n++ % mete.length]]) }, 100)
})
const guarda = p => p.evaluate(() => {
  window.__assenze = []; let da = null
  window.__guarda = setInterval(() => {
    const c = !!window.__fattoria3d?.mondo.ospite?.visibile, t = performance.now()
    if (!c && da === null) da = t
    if (c && da !== null) { window.__assenze.push(Math.round(t - da)); da = null }
  }, 50)
  window.__assenteDa = () => da === null ? 0 : Math.round(performance.now() - da)
})
const assenze = p => p.evaluate(() => { const a = window.__assenze; window.__assenze = []; return { finite: a, ora: window.__assenteDa() } })
const presente = p => p.waitForFunction(() => window.__fattoria3d.mondo.ospite?.visibile, null, { timeout: 30000 }).then(() => true, () => false)

const pa = await proxyCattivo(new URL(SERVIZIO).port), pb = await proxyCattivo(new URL(SERVIZIO).port)
// bambini tutti loro: due telefoni con lo stesso id si cacciano dal servizio a vicenda, e le prove possono girare insieme
const A = await telefono('ugo', { id: 'bancoada00000', nome: 'Ada' }, pa.porta)
const B = await telefono('ada', { id: 'bancougo00000', nome: 'Ugo' }, pb.porta)
const a = A.page, b = B.page
await passeggia(a)
controlla('il contadino dell\'amico arriva', await presente(b))
await guarda(b)
await attendi(b, 3000)
controlla('a rete sana il contadino non sparisce mai', (await assenze(b)).finite.length === 0)

/* una mossa che deve arrivare anche a filo morto: è la prova che il bambino sta giocando */
const mossa = () => a.evaluate(() => { const m = window.__fattoria3d.motore, l = m.lottiComprabili()[0]; return m.compraLotto(l.id).ok ? l.id : null })
const arriva = id => b.waitForFunction(i => Object.prototype.hasOwnProperty.call(window.__fattoria3d.motore.s.lotti, i), id, { timeout: 20000 }).then(() => true, () => false)

async function prova(nome, guasto, tetto) {
  await attendi(b, 1500); await assenze(b)
  await guasto()
  const id = await mossa()
  const passa = await arriva(id)
  await attendi(b, 8000)
  const torna = await presente(b)
  await attendi(b, 300)
  const { finite } = await assenze(b), piu = Math.max(0, ...finite)
  const fili = await a.evaluate(() => window.__fili.filter(f => f.codice !== null).map(f => `${f.codice} ${f.ragione || ''}`.trim()))
  console.log(`   ${nome}: mossa ${passa ? 'arrivata' : 'persa'}, contadino sparito ${finite.length} volte, al massimo ${(piu / 1000).toFixed(1)} s; fili chiusi: ${fili.join(' · ') || 'nessuno'}`)
  controlla(`${nome}: la mossa dell'amico arriva`, passa)
  controlla(`${nome}: il contadino non resta sparito per più di ${tetto / 1000} s`, torna && piu <= tetto, `${(piu / 1000).toFixed(1)} s`)
  controlla(`${nome}: il servizio non chiude il filo`, !fili.some(f => f.startsWith('1008')))
}

await prova('filo morto in silenzio', () => pa.buco(), 3000)
await prova('rete piantata per 6 secondi', () => pa.ferma(6000), 3000)
await prova('filo tagliato', () => pa.taglia(), 3000)
await prova('il filo dell\'altro morto in silenzio', () => pb.buco(), 3000)

for (const [chi, T] of [['Ugo', A], ['Ada', B]]) controlla(`nessun errore (${chi})`, veri(T.errori).length === 0, veri(T.errori).join(' · '))
pa.chiudi(); pb.chiudi()
await browser.close()
riassunto('il contadino dell\'amico quando la rete singhiozza')
