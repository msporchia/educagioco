/* ═══════════════════════════════════════════════════════════════════
   I VICINI DELLA FATTORIA 3D, COL DITO — docs/fattoria3d/vicini.md

   Il test unitario prova le regole; questo dice che **la visita sta in piedi nel browser**: il trattore si compra e si tocca (l'eroe ci
   cammina), apre la mappa dei villaggi, quelli che non hai il livello sono grigi e dicono il livello; si sceglie un villaggio, il
   trattore parte e compare la sua fattoria su una tela sua (quella di casa aspetta ferma), con «Torna a casa» sempre in vista; la
   cassa si riempie dalle scorte e dà esperienza (mai monete), al mercato si compra con le monete e si vende in cambio di esperienza e
   roba del vicino; tornando a casa la tela è una sola e il mondo di casa ricomincia; contatori e vicini si salvano.
   Il dito è vero (`Input.dispatchTouchEvent`): un `page.click()` non porta i pointer del tocco (docs/core/il-dito.md). I tasti dei
   fogli sono bottoni e si toccano col click.
   `node test/esegui.mjs fattoria3d-vicini --niente-build`
   tempo: 40
   ═══════════════════════════════════════════════════════════════════ */
import { apriBrowser, apriGioco, azzera, semina, attendi, scatto, scegli, leggiProfilo } from '../aiuto/browser.mjs'
import { controlla, uguale, riassunto } from '../aiuto/verifica.mjs'
import { sogliaDi } from '../../src/giochi/fattoria3d/dati/livelli.js'
import { PEZZI } from '../../src/giochi/fattoria3d/dati/catalogo.js'

const browser = await apriBrowser()
const { page, errori } = await apriGioco(browser)
await azzera(page)
await semina(page, { coins: 200, settings: { eta: 8, sperimentali: true } })

const cdp = await page.context().newCDPSession(page)
const tocca = async (x, y) => {
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x, y }] }); await attendi(page, 60)
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] })
}
const schermoDi = (x, z) => page.evaluate(([x, z]) => {
  const { mondo } = window.__fattoria3d, r = mondo.canvas.getBoundingClientRect(), [px, py] = mondo.proietta({ x, y: 0, z })
  return [r.left + px, r.top + py]
}, [x, z])
const stato = () => page.evaluate(() => JSON.parse(JSON.stringify(window.__fattoria3d.motore.s)))
const fermo = async () => { await attendi(page, 400); for (let i = 0; i < 100; i++) { if (await page.evaluate(() => { const m = window.__fattoria3d.mondo; return m.eroe.fermo })) break; await attendi(page, 150) } await attendi(page, 250) }
const monete = () => page.evaluate(() => window.__fattoria3d.motore.monete())          // quelle vere, vive
const tele = () => page.locator('canvas.f3-tela, canvas.f3-vic-tela').count()   // le tele di scena: i canvas dei disegni delle merci non contano

await scegli(page, 'fattoria3d')
await page.waitForSelector('[data-f3="campo"] canvas', { timeout: 10000 })
await page.waitForFunction(() => !!(window.__fattoria3d && window.__fattoria3d.mondo), null, { timeout: 15000 })
await attendi(page, 800)

/* ── il trattore: il livello e il posto sulla mappa (il livello si porta a 9: Nonna Rita e Tonio sì, gli altri no) ── */
uguale('di partenza una tela sola', await tele(), 1)
const LIV = sogliaDi(9)
const idTrattore = await page.evaluate(liv => {
  const { motore, mondo } = window.__fattoria3d
  motore.s.esperienza = liv
  motore.s.merci.grano = 8; motore.s.merci.carota = 4
  // un posto libero sul prato di partenza, il più vicino all'eroe fra quelli che si vedono bene (i sassi si tolgono: non sono la prova)
  for (const o of motore.ostacoli) if (!o.tolto) motore._togliSenzaPagare(o)
  const r0 = mondo.canvas.getBoundingClientRect(), buoni = []
  for (let j = -3; j < 7; j++) for (let i = -6; i < 5; i++) {
    if (!motore.puoMettere('trattore', i, j).ok) continue
    const [px, py, v] = mondo.proietta({ x: i + 1, y: 0, z: j + 1 })
    if (v && px > 60 && px < r0.width - 60 && py > 140 && py < r0.height - 200) buoni.push([i, j, Math.hypot(i + 1 - mondo.eroe.x, j + 1 - mondo.eroe.z)])
  }
  buoni.sort((a, b) => a[2] - b[2])
  const posto = buoni[0]
  const r = motore.compraEMetti('trattore', posto[0], posto[1])          // si paga davvero: 40 monete
  mondo.cambiato()
  return r.ok ? r.cosa.id : null
}, LIV)
controlla('il trattore è nel catalogo e si mette sul prato', !!PEZZI.trattore && !!idTrattore)
await attendi(page, 500)
const t = (await stato()).cose.find(c => c.tipo === 'trattore')
// un tocco vero: l'eroe cammina fino al trattore. Watson e i gatti si accarezzano prima di tutto: se uno sta proprio lì sotto il dito,
// il tocco è suo e si riprova (come farebbe una bambina)
for (let prova = 0; prova < 4 && await page.locator('[data-f3="mappa"]').count() === 0; prova++) {
  await tocca(...await schermoDi(t.i + 1, t.j + 1))
  await fermo()
}
await page.waitForSelector('[data-f3="mappa"]', { timeout: 12000 })
controlla('toccare il trattore apre la mappa dei villaggi', await page.locator('[data-f3="mappa"]').count() === 1)
uguale('i villaggi sono quattro', await page.locator('[data-vicino]').count(), 4)
uguale('due si possono visitare', await page.locator('[data-vicino][data-aperto="true"]').count(), 2)
await scatto(page, 'fattoria3d-mappa')

/* ── un villaggio ancora grigio dice il livello e non parte ── */
await page.locator('[data-vicino="zio-beppe"]').click()
await attendi(page, 300)
controlla('un villaggio grigio dice il livello', /livello 11/i.test(await page.locator('[data-f3="mappa-msg"]').innerText()))
uguale('e la tela è ancora una', await tele(), 1)

/* ── il viaggio e la visita ── */
await page.locator('[data-vicino="nonna-rita"]').click()
await page.waitForSelector('[data-f3="viaggio"]', { timeout: 3000 })
controlla('il trattore parte (il cartello del viaggio)', await page.locator('[data-f3="viaggio"]').count() === 1)
await page.waitForSelector('[data-f3="torna-casa"]', { timeout: 15000 })
await attendi(page, 1200)
uguale('la visita ha una tela sua: due tele', await tele(), 2)
controlla('il mondo di casa aspetta fermo', await page.evaluate(() => window.__fattoria3d.mondo.vivo === false))
controlla('«Torna a casa» è in vista', await page.locator('[data-f3="torna-casa"]').isVisible())
controlla('chi ci ospita si vede', /Nonna Rita/.test(await page.locator('[data-f3="vicino-chi"]').innerText()))
controlla('la sua storia compare, in due righe', (await page.locator('[data-f3="storia"] p').count()) === 2)
await scatto(page, 'fattoria3d-visita')
await page.locator('[data-f3="storia-ok"]').click()
uguale('la storia si chiude', await page.locator('[data-f3="storia"]').count(), 0)
const profilo1 = await leggiProfilo(page)

/* ── la cassa: si dà roba dalle scorte, esperienza e basta ── */
const xp0 = (await stato()).esperienza, mon0 = await monete()
await page.locator('[data-f3="apri-cassa"]').click()
await page.waitForSelector('[data-f3="cassa"]')
controlla('la cassa chiede grano, carote e mais', await page.locator('[data-chiede="grano"]').count() === 1 && await page.locator('[data-chiede="carota"]').count() === 1 && await page.locator('[data-chiede="mais"]').count() === 1)
controlla('il tasto di ciò che non si ha è spento (ma si tocca: dice perché)', await page.locator('[data-aiuta="mais"]').getAttribute('data-puoi') === 'false')
await page.locator('[data-aiuta="mais"]').dispatchEvent('click')          // aria-disabled: per Playwright è spento, per il dito si tocca
controlla('toccare il tasto spento dice cosa manca', /mancano/i.test(await page.locator('[data-f3="visita-msg"]').innerText()))
await page.locator('[data-aiuta="grano"]').click()
await attendi(page, 300)
controlla('si consegna: il grano scende e l\'esperienza sale', (await stato()).merci.grano === 4 && (await stato()).esperienza > xp0, JSON.stringify({ g: (await stato()).merci.grano, xp: (await stato()).esperienza }))
controlla('la riga dice 4/4', /4\/4/.test(await page.locator('[data-chiede="grano"]').innerText()))
await page.locator('[data-aiuta="carota"]').click()
await attendi(page, 200)
await scatto(page, 'fattoria3d-cassa')
await page.evaluate(() => { window.__fattoria3d.motore.s.merci.mais = 2 })
await attendi(page, 500)                                          // il battito rilegge le scorte
await page.locator('[data-aiuta="mais"]').click()
await attendi(page, 300)
controlla('cassa piena: il vicino lo dice e regala', /Cassa piena/.test(await page.locator('[data-f3="visita-msg"]').innerText()) && ((await stato()).prodotti.uova || 0) >= 1)
controlla('a cassa piena il tasto non c\'è più da usare e si dice quando riapre', /Riapre fra/.test(await page.locator('[data-f3="cassa-chiusa"]').innerText()))
uguale('le monete non si toccano aiutando', await monete(), mon0)
await page.locator('[data-f3="cassa"] [data-chiudi]').click()
uguale('il foglio si chiude con la ✕', await page.locator('[data-f3="cassa"]').count(), 0)

/* ── il mercato: si compra con le monete, si vende per esperienza e roba sua ── */
await page.locator('[data-f3="apri-mercato"]').click()
await page.waitForSelector('[data-f3="mercato"]')
const prima = await monete(), xpPrima = (await stato()).esperienza
await page.locator('[data-compra="uova"]').click()
await attendi(page, 400)
const dopoCompra = await monete()
controlla('comprare costa monete (il prezzo scritto) e mette la roba nelle scorte', dopoCompra < prima && (await stato()).prodotti.uova >= 2, `${prima} → ${dopoCompra}`)
uguale('comprare non è esperienza', (await stato()).esperienza, xpPrima)
await page.evaluate(() => { window.__fattoria3d.motore.s.merci.grano = 6 })
await attendi(page, 500)
const moneteVendi = await monete()
await page.locator('[data-vendi="0"]').click()
await attendi(page, 400)
controlla('vendere dà esperienza e roba, mai monete', (await stato()).esperienza > xpPrima && (await monete()) === moneteVendi, `${moneteVendi} → ${await monete()}`)
await scatto(page, 'fattoria3d-mercato')
await page.locator('[data-f3="mercato"] [data-chiudi]').click()

/* ── tornare a casa: una tela sola, il mondo di casa riparte, tutto salvato ── */
await page.locator('[data-f3="torna-casa"]').click()
await page.waitForFunction(() => !document.querySelector('[data-f3="visita"]') && window.__fattoria3d.mondo.vivo === true, null, { timeout: 8000 })
uguale('tornati a casa la tela è una sola', await tele(), 1)
controlla('il HUD di casa è tornato', await page.locator('[data-f3="hud"]').isVisible())
controlla('e la scena di casa si disegna ancora', (await page.evaluate(() => window.__fattoria3d.mondo.statistiche())).calls > 20)
await attendi(page, 1500)
const profilo = await leggiProfilo(page)
const cfg = profilo.campagne.fattoria3d.cfg
controlla('i vicini stanno nel profilo, accanto allo stato', !!cfg.vicini && cfg.vicini.visite['nonna-rita'] === 1 && !!cfg.stato, JSON.stringify(cfg.vicini))
controlla('i contatori delle visite e degli aiuti sono saliti', (profilo.totals.fattoria3dVisite || 0) === 1 && (profilo.totals.fattoria3dAiuti || 0) >= 5, JSON.stringify(profilo.totals))
controlla('il profilo di prima non aveva i contatori', !(profilo1.totals || {}).fattoria3dAiuti)

/* ── una seconda visita, e «indietro» in visita riporta a casa e non in home ── */
await page.evaluate(() => { const { mondo } = window.__fattoria3d; mondo.ui.apriMappa() })
await page.waitForSelector('[data-f3="mappa"]')
await page.locator('[data-vicino="mugnaio-tonio"]').click()
await page.waitForSelector('[data-f3="torna-casa"]', { timeout: 15000 })
await page.locator('[data-f3="storia-ok"]').click()
await page.locator('.barra-app button').first().click()           // la freccia in alto a sinistra
await page.waitForFunction(() => !document.querySelector('[data-f3="visita"]') && window.__fattoria3d.mondo.vivo === true, null, { timeout: 8000 })
controlla('«indietro» in visita porta a casa, non in home', await page.locator('[data-f3="campo"] canvas.f3-tela').count() === 1 && await page.locator('.carte').count() === 0)

controlla('nessun errore in console', errori.length === 0, errori.join(' · '))
await browser.close()
riassunto('Fattoria 3D — i vicini col dito')
