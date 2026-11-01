/* ═══════════════════════════════════════════════════════════════════
   LE BESTIE DI CASA DELLA FATTORIA 3D, COL DITO — docs/fattoria3d/bestie-di-casa.md

   Si apre il menu «Costruisci» (🏗), la scheda Animali offre le quattro bestie col prezzo della 2D; una chiusa dice il livello; una a cui
   mancano le monete lo dice e non cambia niente; con le monete si prende (🪙90 il beagle), arriva in scena e si apre il battesimo: un nome si
   TOCCA (e sotto si può scrivere: «✎ Nome» nel foglio, una parola scritta e «Va bene» la salva). Un tocco vero sulla bestia in scena apre il suo foglio (✕ in alto a destra): tre bisogni, i cibi suoi, una carezza
   gratis che non costa; un cibo dà da mangiare e scala le monete; «Sposta» porta la bestia dove si tocca (gratis, salvato); a 360 px il foglio
   non scorre di lato e i bottoni sono alti almeno 44 px.
   Il dito è vero (`Input.dispatchTouchEvent`): un `page.click()` non porta i pointer del tocco (docs/core/il-dito.md).
   `node test/esegui.mjs fattoria3d-bestie --niente-build`
   tempo: 40
   ═══════════════════════════════════════════════════════════════════ */
import { apriBrowser, apriGioco, azzera, semina, attendi, scatto, scegli } from '../aiuto/browser.mjs'
import { controlla, uguale, riassunto } from '../aiuto/verifica.mjs'
import { sogliaDi } from '../../src/giochi/fattoria3d/dati/livelli.js'

const browser = await apriBrowser()
const { page, errori } = await apriGioco(browser)
await azzera(page)
await semina(page, { coins: 500, settings: { eta: 8, sperimentali: true } })

const cdp = await page.context().newCDPSession(page)
const tocca = async (x, y) => {
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x, y }] }); await attendi(page, 60)
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] })
}
const toccaEl = async sel => { await page.locator(sel).first().scrollIntoViewIfNeeded().catch(() => {}); const r = await page.locator(sel).first().boundingBox(); await tocca(r.x + r.width / 2, r.y + r.height / 2) }
const m3 = (fn, arg) => page.evaluate(fn, arg)
const monete = () => page.evaluate(() => window.__fattoria3d.motore.monete())

await scegli(page, 'fattoria3d')
await page.waitForSelector('[data-f3="campo"] canvas', { timeout: 10000 })
await page.waitForFunction(() => !!(window.__fattoria3d && window.__fattoria3d.mondo), null, { timeout: 15000 })
await attendi(page, 800)

const livello = liv => m3(e => { const { motore, mondo } = window.__fattoria3d; motore.s.esperienza = e; mondo.cambiato() }, sogliaDi(liv))
const apriAnimali = async () => {
  await toccaEl('[data-f3="az-costruisci"]')
  await page.waitForSelector('[data-f3="costruisci-qui"]', { timeout: 3000 })
  await toccaEl('[data-f3="costruisci-qui"] [data-scheda="animali"]')
  await attendi(page, 200)
}

/* ── la scheda Animali offre le bestie, chiuse sotto il livello ── */
await livello(3)
await apriAnimali()
controlla('le quattro bestie sono nella scheda Animali', await page.locator('[data-carta^="bestia:"]').count() === 4)
await toccaEl('[data-carta="bestia:beagle"]')
controlla('chiuso: dice il livello 15', /livello 15/i.test(await page.locator('[data-f3="costruisci-msg"]').innerText()))
uguale('niente monete spese', await monete(), 500)
await scatto(page, 'fattoria3d-bestie-menu')
await toccaEl('[data-f3="costruisci-qui"] [data-chiudi]')

/* ── con il livello ma senza monete ── */
await livello(15)
await m3(() => { const { motore } = window.__fattoria3d; motore.borsa.paga(motore.monete() - 40) })
await apriAnimali()
controlla('aperto, il beagle costa 🪙90 come in 2D', /90/.test(await page.locator('[data-carta="bestia:beagle"]').innerText()))
await toccaEl('[data-carta="bestia:beagle"]')
controlla('senza monete lo dice e il menu resta', /Servono/.test(await page.locator('[data-f3="costruisci-msg"]').innerText()) && await page.locator('[data-f3="costruisci-qui"]').count() === 1)
uguale('e non cambia niente', await monete(), 40)
uguale('e non l\'hai', await m3(() => window.__fattoria3d.motore.cura.ho('beagle')), false)
await toccaEl('[data-f3="costruisci-qui"] [data-chiudi]')

/* ── si prende ── */
await m3(() => { const { motore } = window.__fattoria3d; motore.borsa.paga(-400) })
const prima = await monete()
await apriAnimali()
await toccaEl('[data-carta="bestia:beagle"]')
await page.waitForSelector('[data-f3="battesimo"]', { timeout: 3000 })
uguale('costa 90 monete', prima - await monete(), 90)
controlla('si apre il battesimo con nomi da toccare', await page.locator('[data-f3="battesimo"] [data-nome]').count() >= 6)
await scatto(page, 'fattoria3d-bestie-battesimo')
await toccaEl('[data-f3="battesimo"] [data-nome="Birba"]')
uguale('il nome scelto è salvato', await m3(() => window.__fattoria3d.motore.cura.nomeDi('beagle')), 'Birba')
await attendi(page, 1500)
controlla('la bestia è in scena', await m3(() => window.__fattoria3d.mondo.compagni.lista.some(c => c.def.id === 'beagle' && c.def.nome === 'Birba')))

/* ── il tocco sulla bestia apre il suo foglio ── */
const schermoDi = (x, z) => m3(([x, z]) => { const { mondo } = window.__fattoria3d, r = mondo.canvas.getBoundingClientRect(), [px, py] = mondo.proietta({ x, y: 0.3, z }); return [r.left + px, r.top + py] }, [x, z])
const apriFoglio = async () => {
  for (let prova = 0; prova < 6 && await page.locator('[data-f3="bestia"]').count() === 0; prova++) {
    const [x, z] = await m3(() => { const c = window.__fattoria3d.mondo.compagni.lista.find(o => o.def.id === 'beagle'); return [c.x, c.z] })
    await tocca(...await schermoDi(x, z))
    await attendi(page, 500)
  }
}
await apriFoglio()
controlla('un tocco vero sulla bestia apre il foglio', await page.locator('[data-f3="bestia"]').count() === 1)
controlla('il foglio ha il suo nome', /Birba/.test(await page.locator('[data-f3="bestia-nome"]').innerText()))
uguale('tre bisogni', await page.locator('[data-bisogno]').count(), 3)
controlla('i cibi sono solo i suoi (cane: osso e bistecca, non carota)', await page.locator('[data-cibo="osso"]').count() === 1 && await page.locator('[data-cibo="carota"]').count() === 0)
await scatto(page, 'fattoria3d-bestie-foglio')

/* ── carezza gratis, cibo a pagamento, coccola ── */
await m3(() => { const { motore } = window.__fattoria3d; motore.borsa.paga(motore.monete() - 0) })
const m0 = await monete()
await toccaEl('[data-azione="carezza"]')
uguale('la carezza è gratis', await monete(), m0)
controlla('e lo dice', /contento/.test(await page.locator('[data-f3="bestia-msg"]').innerText()))
await m3(() => { const { motore } = window.__fattoria3d; motore.cura.casa.beagle.pancia = 0.2; motore.borsa.paga(-50) })
await attendi(page, 400)
const m1 = await monete()
await toccaEl('[data-cibo="osso"]')
uguale('l\'osso costa 5', m1 - await monete(), 5)
await toccaEl('[data-coccola="spazzola"]')
controlla('la spazzola costa 🪙1 o dice che non serve', [1, 0].includes(m1 - 5 - await monete()))

/* ── 360 px ── */
await page.setViewportSize({ width: 360, height: 700 })
await attendi(page, 300)
controlla('a 360 px il foglio non scorre di lato', await m3(() => { const f = document.querySelector('[data-f3="bestia"]'); return f.scrollWidth <= f.clientWidth + 1 && document.documentElement.scrollWidth <= window.innerWidth + 1 }))
controlla('i bottoni sono alti almeno 44 px', await m3(() => [...document.querySelectorAll('[data-f3="bestia"] button:not(.f3-chiudi)')].every(b => b.getBoundingClientRect().height >= 44)))
await scatto(page, 'fattoria3d-bestie-360')
await page.setViewportSize({ width: 1280, height: 800 })

/* ── sposta: gratis, e si salva ── */
const m2 = await monete()
await toccaEl('[data-azione="sposta"]')
controlla('il foglio si chiude per toccare dove metterla', await page.locator('[data-f3="bestia"]').count() === 0 && await m3(() => window.__fattoria3d.mondo.inSposta === 'beagle'))
const cella = await m3(() => { const { motore, mondo } = window.__fattoria3d, r = mondo.canvas.getBoundingClientRect()
  for (let j = -8; j < 8; j++) for (let i = -8; i < 8; i++) { if (!motore.cellaPropria(i, j) || !motore.libera(i, j)) continue
    const [px, py, v] = mondo.proietta({ x: i + 0.5, y: 0, z: j + 0.5 }); if (v && px > 80 && px < r.width - 80 && py > 150 && py < r.height - 220 && Math.hypot(i + 0.5 - mondo.eroe.x, j + 0.5 - mondo.eroe.z) > 3) return [i, j] }
  return null })
controlla('c\'è una cella libera in vista', !!cella)
await tocca(...await schermoDi(cella[0] + 0.5, cella[1] + 0.5))
await attendi(page, 600)
uguale('spostare è gratis', await monete(), m2)
uguale('la casa della bestia è lì', String(await m3(() => window.__fattoria3d.motore.cura.casaDi('beagle'))), String(cella))
controlla('e la salva nello stato', await m3(() => JSON.stringify(window.__fattoria3d.motore.serializza().casa.beagle.i) !== undefined))

/* ── un nome scritto, non della lista ── */
await attendi(page, 800)
await apriFoglio()
await toccaEl('[data-azione="nome"]')
await page.waitForSelector('[data-f3="battesimo"]', { timeout: 3000 })
controlla('vuota, «Va bene» non si tocca', await page.locator('[data-azione="scrivi"]').isDisabled())
await toccaEl('[data-f3="battesimo-scrivi"]')
await page.keyboard.type(' Fulmine  Bello ')
await scatto(page, 'fattoria3d-bestie-scrivi')
await toccaEl('[data-azione="scrivi"]')
uguale('il nome scritto è salvato, senza spazi in più', await m3(() => window.__fattoria3d.motore.cura.nomeDi('beagle')), 'Fulmine Bello')
controlla('il battesimo si chiude', await page.locator('[data-f3="battesimo"]').count() === 0)
await attendi(page, 800)
await apriFoglio()
controlla('il foglio dice il nome scritto', /Fulmine Bello/.test(await page.locator('[data-f3="bestia-nome"]').innerText()))
await toccaEl('[data-azione="nome"]')
await page.waitForSelector('[data-f3="battesimo"]', { timeout: 3000 })
uguale('riaperto, la casella lo ripropone', await page.locator('[data-f3="battesimo-scrivi"]').inputValue(), 'Fulmine Bello')
await page.locator('[data-f3="battesimo-scrivi"]').fill('Lampo')
await page.keyboard.press('Enter')
uguale('l\'invio della tastiera salva come «Va bene»', await m3(() => window.__fattoria3d.motore.cura.nomeDi('beagle')), 'Lampo')

controlla('nessun errore JS', errori.length === 0, errori.join(' · '))
await browser.close()
riassunto('Fattoria 3D — le bestie di casa, col dito')
