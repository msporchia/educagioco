/* ═══════════════════════════════════════════════════════════════════
   LA FATTORIA IN COMUNE — DUE TELEFONI E IL SERVIZIO (docs/fattoria3d/in-comune.md)

   Due pagine (due bambini già amici) con la fattoria 3D. Dal 🤝 si entra nella fattoria in comune: quello che uno costruisce e
   semina l'altro lo trova, e quello che l'altro compra arriva al primo mentre gioca, senza toccargli le monete. La propria fattoria
   resta com'era; uscendo e rientrando la fattoria in comune è ancora lì. Senza servizio si dice che serve internet, senza errori.
   **Serve il servizio nuovo** (la migrazione v6): in locale `cd servizio/inoltro && npx wrangler dev`, poi
   `SERVIZIO=http://localhost:8787 node test/esegui.mjs fattoria3d-comune`; senza `SERVIZIO` si prova quello pubblicato. Se il
   servizio non ha la fattoria in comune, il test lo dice e salta.
   tempo: 60
   ═══════════════════════════════════════════════════════════════════ */
import { apriBrowser, apriGioco, semina, seminaAmici, attendi, scegli, scatto } from '../aiuto/browser.mjs'
import { controlla, uguale, riassunto } from '../aiuto/verifica.mjs'

const SERVIZIO = (process.env.SERVIZIO || 'https://sfida.educagioco.workers.dev').replace(/\/$/, '')
const vivo = await fetch(`${SERVIZIO}/amici/comune`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: '{}' })
  .then(r => r.status === 400, () => false)
if (!vivo) { console.log(`⚠️  salto: il servizio su ${SERVIZIO} non ha la fattoria in comune (lo prova \`SERVIZIO=http://localhost:8787\` con wrangler dev)`); process.exit(0) }

const browser = await apriBrowser()
const veri = errori => errori.filter(e => !/WebSocket connection|Failed to load resource|net::ERR|ERR_/.test(e))
// una chiave nuova a ogni giro: il servizio in locale tiene le fattorie delle prove di prima
const CHIAVE = Array.from({ length: 32 }, () => 'abcdefghijklmnopqrstuvwxyz0123456789'[Math.floor(Math.random() * 36)]).join('')
const amico = (id, nome) => ({ chiave: CHIAVE, id, nome, visto: 1, bacheca: null })

async function telefono(giocatore, altro, servizio = SERVIZIO) {
  const T = await apriGioco(browser, { giocatori: [giocatore] })
  await T.page.addInitScript(s => { globalThis.__SERVIZIO_SFIDE__ = s }, servizio)
  await semina(T.page, { coins: 5000, settings: { eta: 8, sperimentali: true } }, giocatore)
  await seminaAmici(T.page, [amico(altro.id, altro.nome)], giocatore)
  await scegli(T.page, 'fattoria3d')
  await pronto(T.page)
  return T
}
const pronto = p => p.waitForFunction(() => !!(window.__fattoria3d && window.__fattoria3d.mondo), null, { timeout: 20000 })
async function entraInComune(p) {
  await p.click('[data-f3="apri-comune"]')
  await p.waitForSelector('[data-f3="dialogo"]', { timeout: 5000 })
  await p.click('[data-f3="dialogo"] [data-scelta="0"]')
  await p.waitForFunction(() => /Con /.test(document.querySelector('.barra-app .dove')?.innerText || '') && !!window.__fattoria3d?.mondo, null, { timeout: 20000 })
    .catch(async e => {        // si dice dove si è fermato: la barra, l'attesa, il primo errore
      const d = await p.evaluate(() => ({ barra: document.querySelector('.barra-app .dove')?.innerText, attesa: document.querySelector('[data-f3="comune-attesa"]')?.innerText, mondo: !!window.__fattoria3d?.mondo }))
      throw new Error(`non sono entrato nella fattoria in comune: ${JSON.stringify(d)} ${[A, B].filter(Boolean).flatMap(T => veri(T.errori)).slice(0, 3).join(' · ')}`)
    })
}
/* fa un gesto col motore della pagina, come la scena (le mosse si registrano sul motore, non sul dito) */
const fai = (p, codice, arg) => p.evaluate(codice, arg)
const monete = p => p.evaluate(() => window.__fattoria3d.motore.monete())

let A = null, B = null
A = await telefono('leonardo', { id: 'bancomelody00', nome: 'Melody' })
const a = A.page
controlla('con un amico, nella fattoria c\'è il 🤝', await a.locator('[data-f3="apri-comune"]').isVisible())
const casaA = await fai(a, () => window.__fattoria3d.motore.s.cose.length)
await scatto(a, 'comune-1-il-tasto')

/* ── Leonardo entra per primo: la fattoria in comune nasce, e lui ci mette un campo e semina ── */
await entraInComune(a)
controlla('nella barra c\'è con chi è la fattoria', /melody/i.test(await a.locator('.barra-app .dove').innerText()))
controlla('dentro la fattoria in comune il 🤝 lascia il posto al 🏠', await a.locator('[data-f3="torna-mia"]').count() > 0 && await a.locator('[data-f3="apri-comune"]').count() === 0)
const campo = await fai(a, () => {
  const { motore: m, mondo } = window.__fattoria3d
  for (let j = -3; j < 8; j++) for (let i = -6; i < 6; i++) if (m.puoMettere('campo', i, j).ok) {
    m.compraEMetti('campo', i, j); const c = m.cosaSu(i, j); m.semina(c.id, 'grano'); mondo.cambiato(); return { id: c.id, i, j }
  }
  return null
})
controlla('Leonardo mette un campo e semina il grano', !!campo)
await attendi(a, 1500)                                   // le mosse partono da sole

/* ── Melody entra e trova il campo ── */
B = await telefono('melody', { id: 'bancoleonardo', nome: 'Leonardo' })
const b = B.page
await entraInComune(b)
const visto = await fai(b, id => { const c = window.__fattoria3d.motore.cosa(id); return c && { tipo: c.tipo, coltura: c.coltura } }, campo.id)
controlla('Melody trova il campo di Leonardo, seminato a grano, con lo stesso id', visto?.tipo === 'campo' && visto.coltura === 'grano', JSON.stringify(visto))

/* ── Melody compra un lotto: Leonardo lo vede arrivare mentre gioca, e le sue monete non si muovono ── */
const moneteA = await monete(a), moneteB = await monete(b)
const lotto = await fai(b, () => { const m = window.__fattoria3d.motore, l = m.lottiComprabili()[0]; return m.compraLotto(l.id).ok ? l.id : null })
controlla('Melody compra un lotto con le sue monete', !!lotto && await monete(b) < moneteB)
const arrivato = await a.waitForFunction(id => { const m = window.__fattoria3d.motore; return Object.prototype.hasOwnProperty.call(m.s.lotti, id) }, lotto, { timeout: 15000 }).then(() => true, () => false)
controlla('il lotto di Melody arriva a Leonardo mentre gioca', arrivato)
uguale('le monete di Leonardo non si muovono', await monete(a), moneteA)
const avviso = await a.locator('[data-f3="avviso-livello"]').innerText().catch(() => '')
await scatto(a, 'comune-2-arriva-melody')
controlla('e sopra la scena c\'è chi l\'ha fatto', /melody/i.test(avviso), avviso)

/* ── i due contadini: quello di Leonardo cammina nella scena di Melody, col suo nome, e sparisce quando esce ── */
const meta = await fai(a, () => {
  const { motore: m, mondo } = window.__fattoria3d, e = mondo.eroe, [i0, j0] = e.cella()
  for (let r = 3; r < 8; r++) for (const [i, j] of [[i0 + r, j0], [i0 - r, j0], [i0, j0 + r], [i0, j0 - r]]) {
    const via = m.percorsoVerso([i0, j0], [[i, j]])
    if (via && via.length >= 2) { e.vaiA([[i, j]]); return [i + 0.5, j + 0.5] }
  }
  return null
})
controlla('Leonardo cammina fino a un posto lontano', !!meta)
const vede = await b.waitForFunction(([x, z]) => { const o = window.__fattoria3d.mondo.ospite; return !!o && o.visibile && Math.hypot(o.eroe.x - x, o.eroe.z - z) < 0.6 }, meta, { timeout: 10000 }).then(() => true, () => false)
controlla('Melody vede il contadino di Leonardo arrivare dove è andato', vede)
controlla('col suo nome sopra la testa', /leonardo/i.test(await b.locator('[data-f3="ospite"]').innerText().catch(() => '')))
await scatto(b, 'comune-4-due-contadini')

/* ── la propria fattoria resta com'era; rientrando, quella in comune è ancora lì ── */
await a.click('[data-f3="torna-mia"]')
const sparito = await b.waitForFunction(() => !window.__fattoria3d.mondo.ospite?.visibile, null, { timeout: 5000 }).then(() => true, () => false)
controlla('Leonardo esce e il suo contadino sparisce da Melody', sparito)
await a.waitForFunction(() => !/Con /.test(document.querySelector('.barra-app .dove')?.innerText || '') && !!window.__fattoria3d?.mondo, null, { timeout: 20000 })
uguale('tornato a casa, la fattoria di Leonardo ha le cose di prima', await fai(a, () => window.__fattoria3d.motore.s.cose.length), casaA)
await entraInComune(a)
controlla('rientrando, il campo e il lotto sono ancora lì', await fai(a, ([id, l]) => { const m = window.__fattoria3d.motore; return !!m.cosa(id) && !!m.s.lotti[l] }, [campo.id, lotto]))

/* ── senza servizio: si dice che serve internet, senza errori ── */
const C = await apriGioco(browser, { giocatori: ['ugo'] })
await C.page.addInitScript(() => { globalThis.__SERVIZIO_SFIDE__ = 'http://127.0.0.1:9' })
await semina(C.page, { coins: 100, settings: { eta: 8, sperimentali: true } }, 'ugo')
await seminaAmici(C.page, [amico('bancoleonardo', 'Leonardo')], 'ugo')
await scegli(C.page, 'fattoria3d'); await pronto(C.page)
await C.page.click('[data-f3="apri-comune"]'); await C.page.click('[data-f3="dialogo"] [data-scelta="0"]')
await C.page.waitForSelector('[data-f3="comune-attesa"][data-errore]', { timeout: 20000 }).catch(() => {})
await scatto(C.page, 'comune-3-senza-rete')
controlla('senza rete la fattoria in comune dice che serve internet', /internet/i.test(await C.page.locator('[data-f3="comune-attesa"]').innerText().catch(() => '')))

for (const [chi, T] of [['Leonardo', A], ['Melody', B], ['senza rete', C]]) controlla(`nessun errore (${chi})`, veri(T.errori).length === 0, veri(T.errori).join(' · '))
await browser.close()
riassunto('fattoria in comune: due telefoni')
