/* perché: la cucina in due: il pulsantino, la consegna col tocco vero, i conti che non fermano l'orologio, la fine, e due pagine vere se il servizio risponde
   a parte perché: potrebbe stare in `bancarella-cucina` (stessa stanza, stesso tocco sulla consegna); sta a parte perché parte da una partita in due e può saltare il pezzo coi due telefoni
   La cucina in due: da soli nella partita di prova (il pulsantino, la consegna, i conti che non fermano l'orologio, la fine), e due
   pagine vere se il servizio risponde: `SERVIZIO=` come in arena-sfida, senza salta. Vedi docs/bancarella/in-due.md.
   tempo: 60 */
import { apriBrowser, apriGioco, azzera, semina, attendi, scatto, TELEFONO } from '../aiuto/browser.mjs'
import { controlla, uguale, nota, riassunto } from '../aiuto/verifica.mjs'

const S = fa => `(() => { const S = window.__shop.due.value.m.S; ${fa} })()`
const browser = await apriBrowser()
const { page, errori } = await apriGioco(browser, { viewport: TELEFONO })
await azzera(page)
await semina(page, { settings: { eta: 8 } })

const pronta = p => p.waitForFunction(() => window.__cucina3d?.grafica()?.fotogrammi > 3, undefined, { timeout: 20000 })
// il piatto della prima ordinazione in mano a `ruolo`, e il tocco vero sulla consegna
async function aConsegnare(p, ruolo) {
  await p.evaluate(S(`const c = S.cucina.celle.find(k => k.tipo === 'consegna'); S.cuochi['${ruolo}'].cuoco.mano = { piatto: true, cose: [], pronto: S.ordini[0].piatto, daInfornare: false, forno: '' }`))
}
async function toccaConsegna(p) {
  const id = await p.evaluate(S(`return S.cucina.celle.find(k => k.tipo === 'consegna').id`))
  const d = await p.evaluate(i => window.__cucina3d.dove(i), id)
  await p.mouse.click(d.x, d.y)
}
// il resto coi soldi del cassetto: a questa età la cassa lo dice
async function daiResto(p) {
  const pezzi = await p.evaluate(() => { const S = window.__shop; return S.scomponi(S.cliente.value.resto, S.cliente.value.monete) })
  for (const v of pezzi) await p.click(`[data-v="${v}"]`)
}

/* ---------- 1. la prova da soli ---------- */
await page.evaluate(() => { location.hash = 'bancarella=due&menu=pochi&minuti=5' })
await page.waitForSelector('[data-resta]', { timeout: 8000 })
await pronta(page)
uguale('quattro ordinazioni, ognuna col pulsantino', await page.locator('[data-prenota]').count(), 4)
uguale('niente pausa', await page.locator('button[aria-label="pausa"]').count(), 0)
await page.locator('[data-prenota]').first().click()
await page.waitForSelector('[data-ordine][data-di="mia"]', { timeout: 2000 })
await page.locator('[data-prenota]').first().click()
await page.waitForFunction(() => !document.querySelector('[data-ordine][data-di="mia"]'), undefined, { timeout: 2000 })

await aConsegnare(page, 'host')
await toccaConsegna(page)
await page.waitForSelector('[data-ordine][data-di="mia"]', { timeout: 2000 })
await page.waitForSelector('[data-porge]', { timeout: 8000 })
await scatto(page, 'cucina-in-due-conto')
{
  const prima = await page.evaluate(S('return S.resta'))
  await attendi(page, 500)
  controlla('mentre conti l\'orologio corre', await page.evaluate(S('return S.resta')) < prima)
}
await daiResto(page)
await page.waitForFunction(() => window.__shop.hud.serviti === 1, undefined, { timeout: 5000 })
// il foglio se ne va un attimo dopo il cliente servito: si aspetta lui, non si guarda nello stesso istante
controlla('il foglio si chiude', !!await page.waitForSelector('[data-porge]', { state: 'detached', timeout: 3000 }).then(() => true, () => false))
controlla('e il cuoco torna libero', !!await page.waitForFunction(S('return S.cuochi.host.calcola === 0'), undefined, { timeout: 3000 }).then(() => true, () => false))
await page.evaluate(S('S.resta = 0.3'))
await page.waitForSelector('[data-fine-in-due]', { timeout: 4000 })
controlla('a fine partita dice quante insieme', /Insieme: 1/.test(await page.locator('[data-fine-in-due]').innerText()))
uguale('nessun errore in console', errori.length, 0)
if (errori.length) errori.forEach(e => nota(e))

/* ---------- 2. due pagine vere ---------- */
const SERVIZIO = (process.env.SERVIZIO || 'http://localhost:8787').replace(/\/$/, '')
if (await fetch(`${SERVIZIO}/`).then(r => r.status < 500, () => false)) {
  const A = await apriGioco(browser, { viewport: TELEFONO }), B = await apriGioco(browser, { viewport: TELEFONO })
  const a = A.page, b = B.page
  for (const p of [a, b]) {
    await azzera(p)
    await semina(p, { settings: { eta: 8 } })
    await p.evaluate(s => { globalThis.__SERVIZIO_SFIDE__ = s; location.hash = 'bancarella=cucina&dpr=1' }, SERVIZIO)
    await p.waitForSelector('[data-cucine]', { timeout: 8000 })
    await p.click('[data-cucina-in-due]')
  }
  await a.click('[data-sfida-crea]')
  await a.click('[data-minuti-in-due="10"]')
  await a.click('[data-menu-in-due="tante"]')
  await a.click('[data-sfida-vai]')
  await a.waitForSelector('[data-codice]', { timeout: 20000 })
  const codice = (await a.locator('[data-codice]').innerText()).trim()
  await b.click('[data-sfida-entra]')
  await b.locator('[data-sfida-codice-input]').fill(codice)
  await b.click('[data-sfida-vai]')
  for (const p of [a, b]) { await p.waitForSelector('[data-resta]', { timeout: 20000 }); await pronta(p) }
  controlla('dieci minuti su tutti e due', (await b.evaluate(S('return S.resta'))) > 590)
  uguale('la stessa lista', await b.evaluate(S('return S.ordini.map(o => o.piatto).join()')), await a.evaluate(S('return S.ordini.map(o => o.piatto).join()')))

  await a.locator('[data-prenota]').nth(1).click()
  await b.waitForSelector('[data-ordine][data-di="sua"]', { timeout: 5000 })
  controlla('sull\'altro telefono la scheda è dell\'altro', await b.locator('[data-ordine][data-di="sua"] [data-prenota]').isDisabled())
  await a.locator('[data-prenota]').nth(1).click()
  await b.waitForFunction(() => !document.querySelector('[data-ordine][data-di="sua"]'), undefined, { timeout: 5000 })

  await aConsegnare(a, 'host'); await aConsegnare(b, 'host')
  await toccaConsegna(a)
  await a.waitForSelector('[data-porge]', { timeout: 10000 })
  await b.waitForFunction(() => window.__shop.due.value.m.S.cuochi.host.calcola > 0, undefined, { timeout: 5000 })
  uguale('i conti stanno solo sul telefono di chi consegna', await b.locator('[data-porge]').count(), 0)
  await scatto(b, 'cucina-in-due-calcola')
  await daiResto(a)
  for (const p of [a, b]) await p.waitForFunction(() => window.__shop.due.value.m.S.serviti.host === 1, undefined, { timeout: 8000 })
  uguale('e l\'altro cuoco è libero', await b.evaluate(S('return S.cuochi.host.calcola')), 0)
  for (const [n, x] of [['chi crea', A], ['chi entra', B]]) uguale(`${n}: nessun errore in console`, x.errori.length, 0)
} else console.log(`⚠️  salto le due pagine: il servizio non risponde su ${SERVIZIO}`)

await browser.close()
riassunto('La cucina in due')
