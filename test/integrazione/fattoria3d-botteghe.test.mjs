/* ═══════════════════════════════════════════════════════════════════
   LE BOTTEGHE DEL PAESE DELLA FATTORIA 3D, COL DITO — docs/fattoria3d/botteghe.md

   Il test unitario prova le regole; questo dice che **la bottega sta in piedi nel browser**: si compra e si mette sul prato (come ogni edificio),
   si tocca con un tocco vero (l'eroe cammina fin lì), il foglio si apre con la ✕ in alto a destra, un bancone ha un cliente per mestiere con una
   merce sola, «Consegna» è spento finché manca roba e toccarlo dice cosa manca, con la roba dà esperienza (mai monete), accende un cuore, il
   bancone aspetta; al quinto cuore arriva un bancone in più; il cartello sull'edificio conta i clienti pronti; il foglio sta in 360 px senza
   scorrere di lato. In più, al livello 70, la mongolfiera ha quattro file.
   Il dito è vero (`Input.dispatchTouchEvent`): un `page.click()` non porta i pointer del tocco (docs/core/il-dito.md).
   `node test/esegui.mjs fattoria3d-botteghe --niente-build`
   tempo: 40
   ═══════════════════════════════════════════════════════════════════ */
import { apriBrowser, apriGioco, azzera, semina, attendi, scatto, scegli, leggiProfilo } from '../aiuto/browser.mjs'
import { controlla, uguale, riassunto } from '../aiuto/verifica.mjs'
import { sogliaDi } from '../../src/giochi/fattoria3d/dati/livelli.js'
import { EDIFICI } from '../../src/giochi/fattoria3d/dati/catalogo.js'

const browser = await apriBrowser()
const { page, errori } = await apriGioco(browser)
await azzera(page)
await semina(page, { coins: 5000, settings: { eta: 8, sperimentali: true } })

const cdp = await page.context().newCDPSession(page)
const tocca = async (x, y) => {
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x, y }] }); await attendi(page, 60)
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] })
}
const toccaEl = async sel => { await page.locator(sel).first().scrollIntoViewIfNeeded().catch(() => {}); const r = await page.locator(sel).first().boundingBox(); await tocca(r.x + r.width / 2, r.y + r.height / 2) }
const schermoDi = (x, z) => page.evaluate(([x, z]) => {
  const { mondo } = window.__fattoria3d, r = mondo.canvas.getBoundingClientRect(), [px, py] = mondo.proietta({ x, y: 0, z })
  return [r.left + px, r.top + py]
}, [x, z])
const m3 = (fn, arg) => page.evaluate(fn, arg)
const fermo = async () => { await attendi(page, 400); for (let i = 0; i < 100; i++) { if (await page.evaluate(() => { const m = window.__fattoria3d.mondo; return m.eroe.fermo })) break; await attendi(page, 150) } await attendi(page, 250) }
const monete = () => page.evaluate(() => window.__fattoria3d.motore.monete())          // quelle vere, vive

await scegli(page, 'fattoria3d')
await page.waitForSelector('[data-f3="campo"] canvas', { timeout: 10000 })
await page.waitForFunction(() => !!(window.__fattoria3d && window.__fattoria3d.mondo), null, { timeout: 15000 })
await attendi(page, 800)

const TIPO = 'bottega_osteria'
const E = EDIFICI[TIPO]

/* ── sotto il livello la bottega non si compra; al livello giusto sì, e si mette sul prato ── */
const prima = await m3(t => { const { motore } = window.__fattoria3d; motore.s.esperienza = 0; return motore.compraPezzo(t).motivo }, TIPO)
uguale('sotto il livello non si compra', prima, 'non-sbloccato')
const monetePrima = await monete()
const idCosa = await m3(([t, liv]) => {
  const { motore, mondo } = window.__fattoria3d
  motore.s.esperienza = liv
  for (const o of motore.ostacoli) if (!o.tolto) motore._togliSenzaPagare(o)
  const r0 = mondo.canvas.getBoundingClientRect(), buoni = []
  for (let j = -3; j < 7; j++) for (let i = -6; i < 5; i++) {
    if (!motore.puoMettere(t, i, j).ok) continue
    const [px, py, v] = mondo.proietta({ x: i + 1.5, y: 0, z: j + 1.5 })
    if (v && px > 60 && px < r0.width - 60 && py > 140 && py < r0.height - 200) buoni.push([i, j, Math.hypot(i + 1.5 - mondo.eroe.x, j + 1.5 - mondo.eroe.z)])
  }
  const lontani = buoni.filter(b => b[2] >= 3).sort((a, b) => a[2] - b[2])          // non sotto l'eroe: un tocco sul contadino fermo apre il guardaroba
  const posto = lontani[0] || buoni[buoni.length - 1]
  const r = motore.compraEMetti(t, posto[0], posto[1])
  mondo.pezzi.sincronizza(); mondo.cambiato()
  return r.ok ? r.cosa.id : null
}, [TIPO, sogliaDi(E.liv)])
controlla('la bottega si compra e si mette sul prato', idCosa !== null)
uguale('costa quello della 2D, in monete vere', monetePrima - await monete(), E.prezzo)
await attendi(page, 800)
const cosa = await m3(id => JSON.parse(JSON.stringify(window.__fattoria3d.motore.cosa(id))), idCosa)

/* ── il cartello e il tocco vero ── */
controlla('un cliente c\'è già, ma senza roba il cartello non dice niente', await m3(t => window.__fattoria3d.motore.bottegaPronta(t), TIPO) === 0)
for (let prova = 0; prova < 4 && await page.locator('[data-f3="bottega"]').count() === 0; prova++) {
  await tocca(...await schermoDi(cosa.i + 1.5, cosa.j + 1.5))
  await fermo()
}
await page.waitForSelector('[data-f3="bottega"]', { timeout: 12000 })
controlla('toccare la bottega apre il suo foglio', await page.locator(`[data-f3="bottega"][data-bottega="${TIPO}"]`).count() === 1)
uguale('un bancone, un cliente', await page.locator('[data-f3="bancone"]').count(), 1)
uguale('cinque cuori, nessuno acceso', await page.locator('[data-f3="bottega-fama"] .cuore').count() + ':' + await page.locator('[data-f3="bottega-fama"] .cuore.pieno').count(), '5:0')
controlla('la ✕ è in alto a destra del foglio', await m3(() => { const f = document.querySelector('[data-f3="bottega"]').getBoundingClientRect(), x = document.querySelector('[data-f3="bottega"] [data-chiudi]').getBoundingClientRect(); return x.right > f.right - 80 && x.top < f.top + 60 && x.width >= 44 }))
controlla('il cliente ha un mestiere, una merce sola e un premio in ⭐', await m3(() => { const b = document.querySelector('[data-f3="bancone"]'); return b.querySelectorAll('[data-chiede]').length === 1 && /^\+\d+ ⭐$/.test(b.querySelector('[data-f3="premio"]').textContent.trim()) && b.querySelector('.ritratto').textContent.trim().length > 0 }))
uguale('«Consegna» è spento senza la roba', await page.locator('[data-f3="bottega-consegna"]').getAttribute('aria-disabled'), 'true')
const xp0 = await m3(() => window.__fattoria3d.motore.esperienza())
await toccaEl('[data-f3="bottega-consegna"]')
await attendi(page, 300)
controlla('toccarlo dice cosa manca', /Ti mancano/.test(await page.locator('[data-f3="bottega-msg"]').innerText()))
uguale('e non consegna niente', await m3(() => window.__fattoria3d.motore.esperienza()), xp0)

/* ── 360 px: il foglio non scorre di lato ── */
await page.setViewportSize({ width: 360, height: 700 })
await attendi(page, 400)
controlla('a 360 px il foglio e la pagina non scorrono di lato', await m3(() => { const f = document.querySelector('[data-f3="bottega"]'); return f.scrollWidth <= f.clientWidth + 1 && document.documentElement.scrollWidth <= window.innerWidth + 1 }))
await scatto(page, 'fattoria3d-bottega')
await page.setViewportSize({ width: 1280, height: 800 })
await attendi(page, 300)

/* ── con la roba: esperienza e mai monete, un cuore, il bancone aspetta ── */
const cliente = await m3(t => {
  const { motore } = window.__fattoria3d, c = motore.vistaBottega(t).banconi.find(b => b.cliente)
  for (const x of c.chiede) { if (motore.s.merci[x.k] !== undefined) motore.s.merci[x.k] += x.n; else if (x.k === 'lana') motore.s.lana += x.n; else motore.s.prodotti[x.k] = (motore.s.prodotti[x.k] || 0) + x.n }
  window.__fattoria3d.mondo.cambiato()
  return { id: c.id, xp: c.xp }
}, TIPO)
await attendi(page, 700)
uguale('con la roba il tasto si accende', await page.locator('[data-f3="bottega-consegna"]').getAttribute('aria-disabled'), 'false')
controlla('e il cartello sull\'edificio conta un cliente pronto', await page.evaluate(() => [...document.querySelectorAll('.f3-badge')].some(e => !e.hidden && /1 pronto!/.test(e.textContent))))
const mon0 = await monete(), xpA = await m3(() => window.__fattoria3d.motore.esperienza())
await toccaEl('[data-f3="bottega-consegna"]')
await attendi(page, 500)
uguale('consegnando, l\'esperienza sale del premio', await m3(() => window.__fattoria3d.motore.esperienza()) - xpA, cliente.xp)
uguale('non entrano monete', await monete(), mon0)
controlla('il foglio dice a chi e quanto', /Consegnato a .+: \+\d+ ⭐/.test(await page.locator('[data-f3="bottega-msg"]').innerText()))
uguale('un cuore è acceso', await page.locator('[data-f3="bottega-fama"] .cuore.pieno').count(), 1)
controlla('il bancone aspetta, e dice quanti minuti', /fra \d+ min/.test(await page.locator('[data-f3="bottega-attesa"]').innerText()))
controlla('sono 10–20 minuti', await m3(() => { const n = +document.querySelector('[data-f3="bottega-attesa"]').dataset.minuti; return n >= 10 && n <= 20 }))

/* ── «non mi va» costa l'attesa ma non dà niente ── */
await m3(t => { const { motore } = window.__fattoria3d; motore.s.botteghe[t].banconi[0] = null; motore.tick(); window.__fattoria3d.mondo.cambiato() }, TIPO)
await attendi(page, 500)
const xpB = await m3(() => window.__fattoria3d.motore.esperienza())
await toccaEl('[data-f3="bottega-rifiuta"]')
await attendi(page, 400)
uguale('rifiutare non dà esperienza', await m3(() => window.__fattoria3d.motore.esperienza()), xpB)
controlla('e il bancone aspetta', await page.locator('[data-f3="bottega-attesa"]').count() === 1 && await page.locator('[data-f3="bancone"]').count() === 0)

/* ── il quinto cuore: un bancone in più, con il suo cliente ── */
await m3(t => { const { motore } = window.__fattoria3d; motore.s.botteghe[t].consegne = 4; motore.s.botteghe[t].banconi = [null]; motore.tick(); window.__fattoria3d.mondo.cambiato() }, TIPO)
await attendi(page, 500)
await m3(t => {
  const { motore } = window.__fattoria3d, c = motore.vistaBottega(t).banconi.find(b => b.cliente)
  for (const x of c.chiede) { if (motore.s.merci[x.k] !== undefined) motore.s.merci[x.k] += x.n; else if (x.k === 'lana') motore.s.lana += x.n; else motore.s.prodotti[x.k] = (motore.s.prodotti[x.k] || 0) + x.n }
  window.__fattoria3d.mondo.cambiato()
}, TIPO)
await attendi(page, 600)
uguale('prima della quinta consegna un bancone solo', await page.locator('[data-f3="bancone"], [data-f3="bottega-attesa"]').count(), 1)
await toccaEl('[data-f3="bottega-consegna"]')
await attendi(page, 500)
controlla('la quinta consegna lo dice: la bottega è famosa', /un bancone in più/.test(await page.locator('[data-f3="bottega-msg"]').innerText()))
uguale('due banconi, e i cuori ripartono', await page.locator('[data-f3="bancone"], [data-f3="bottega-attesa"]').count() + ':' + await page.locator('[data-f3="bottega-fama"] .cuore.pieno').count(), '2:0')
uguale('il bancone nuovo ha già il suo cliente', await page.locator('[data-f3="bancone"]').count(), 1)

/* ── la ✕ chiude, e la bottega e le consegne si salvano ── */
await toccaEl('[data-f3="bottega"] [data-chiudi]')
await attendi(page, 300)
uguale('la ✕ chiude il foglio', await page.locator('[data-f3="bottega"]').count(), 0)
await attendi(page, 2500)
const profilo = await leggiProfilo(page)
const salvato = profilo.campagne.fattoria3d.cfg.stato
controlla('le consegne e i banconi sono nel profilo', salvato.botteghe && salvato.botteghe[TIPO] && salvato.botteghe[TIPO].consegne === 5 && salvato.botteghe[TIPO].banconi.length === 2, JSON.stringify(salvato.botteghe))
controlla('e la bottega è fra le cose', salvato.cose.some(c => c.tipo === TIPO) && salvato.posseduti[TIPO] === true)

/* ── la mongolfiera a quattro file, dal livello 66 ── */
await m3(liv => {
  const { motore, mondo } = window.__fattoria3d
  motore.s.esperienza = liv
  for (const t of ['mongolfiera']) { motore.s.magazzino[t] = 1; for (let j = -10; j < 8 && !motore.s.posseduti[t]; j++) for (let i = -12; i < 10 && !motore.s.posseduti[t]; i++) motore.mettiPezzo(t, i, j) }
  motore.s.mongolfiera = { stiva: null, via: null, riposo: null, giri: 0 }
  motore.tick(); mondo.pezzi.sincronizza(); mondo.cambiato()
}, sogliaDi(66))
await attendi(page, 600)
await m3(() => window.__fattoria3d.mondo.ui.apriMongolfiera())
await page.waitForSelector('[data-f3="mongolfiera"]', { timeout: 5000 })
uguale('al livello 66 la mongolfiera ha quattro file', await page.locator('[data-f3="mongolfiera"] [data-fila][data-merce]').count(), 4)
await toccaEl('[data-f3="mongolfiera"] [data-chiudi]')
await attendi(page, 300)

controlla('nessun errore in console', errori.length === 0, errori.join(' · '))
await browser.close()
riassunto('Fattoria 3D — le botteghe del paese col dito')
