/* ═══════════════════════════════════════════════════════════════════
   LA GUIDA DELLA FATTORIA 3D, COL DITO — docs/fattoria3d/guida.md

   Il `?` della barra apre la guida della 3D; il primo giro (una riga con il
   👇 e l'anello sull'unica cosa da toccare) accompagna dal campo vuoto al
   primo raccolto e al menu delle costruzioni, poi tace per sempre (anche
   dopo un ricaricamento); «E adesso?» dice la cosa più utile e porta lì col
   suo tasto; un «non si può» sotto un foglio (manca il grano per la farina)
   porta con sé il passo e il tasto per farlo.
   Il banco di prova salta le spiegazioni: qui si rimettono (`spiegazioni: true`).
   `node test/esegui.mjs fattoria3d-guida --niente-build`
   tempo: 60
   ═══════════════════════════════════════════════════════════════════ */
import { apriBrowser, apriGioco, azzera, semina, attendi, scatto, scegli, leggiProfilo } from '../aiuto/browser.mjs'
import { controlla, uguale, riassunto } from '../aiuto/verifica.mjs'

const browser = await apriBrowser()
const { page, errori } = await apriGioco(browser, { spiegazioni: true })
await azzera(page)
await semina(page, { coins: 300, settings: { eta: 8, sperimentali: true } })

const cdp = await page.context().newCDPSession(page)
const tocca = async (x, y) => {
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x, y }] }); await attendi(page, 60)
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] })
}
const toccaEl = async sel => { await page.locator(sel).scrollIntoViewIfNeeded().catch(() => {}); const r = await page.locator(sel).boundingBox(); await tocca(r.x + r.width / 2, r.y + r.height / 2) }
const riga = async () => (await page.locator('[data-guida-riga]').count()) ? (await page.locator('[data-guida-riga]').innerText()).trim() : null
const indicato = sel => page.locator(sel + '[data-indicato]').count()
const motore = fn => page.evaluate(fn)

await scegli(page, 'fattoria3d')
await page.waitForFunction(() => !!(window.__fattoria3d && window.__fattoria3d.mondo), null, { timeout: 15000 })
await attendi(page, 1200)

/* ── il ? della barra ── */
controlla('il ? c\'è nella barra', await page.locator('[data-azione="aiuto"]').count() === 1)
await toccaEl('[data-azione="aiuto"]')
await page.waitForSelector('[data-azione="chiudi-aiuto"]')
controlla('il foglio parla della fattoria 3D', /fattoria 3D/i.test(await page.locator('body').innerText()))
await toccaEl('[data-azione="chiudi-aiuto"]')
await attendi(page, 300)

/* ── il primo giro ── */
controlla('la riga c\'è e dice di seminare', /Semina/.test(await riga() || ''), await riga())
uguale('l\'anello è su 🌱 Semina', await indicato('[data-f3="az-semina"]'), 1)
controlla('la manina c\'è (per chi non legge)', await page.locator('[data-f3="az-semina"][data-indicato="mano"]').count() === 1)
await scatto(page, 'fattoria3d-guida-semina')
await toccaEl('[data-f3="az-semina"]')
await page.waitForSelector('[data-f3="semi"]')
await attendi(page, 200)
uguale('nel foglio dei semi l\'anello è sul grano', await indicato('[data-seme="grano"]'), 1)
controlla('la riga non sta sotto il foglio (sta in alto)', await page.locator('.f3-guida.su').count() === 1)
await toccaEl('[data-seme="grano"]')
await attendi(page, 300)
controlla('armato: dice di toccare il campo', /campo/.test(await riga() || ''), await riga())
// il contadino semina (il tocco sul campo è provato in fattoria3d.test.mjs): qui lo stato
await motore(() => { const { motore: m, mondo } = window.__fattoria3d; const c = m.s.cose.find(x => x.tipo === 'campo'); m.semina(c.id, 'grano'); mondo.cambiato() })
await attendi(page, 600)
controlla('il grano cresce: la riga lo dice', /cresce/.test(await riga() || ''), await riga())
await motore(() => { const { motore: m } = window.__fattoria3d; const t0 = Date.now(); m.ora = () => t0 + 60000 })
await attendi(page, 700)
uguale('maturo: l\'anello è su ✂️ Raccogli', await indicato('[data-f3="az-raccogli"]'), 1)
await motore(() => { const { motore: m, mondo } = window.__fattoria3d; const c = m.s.cose.find(x => x.tipo === 'campo'); for (let k = 0; k < c.tile.length; k++) m.raccogliTessera(c.id, k); mondo.cambiato() })
await attendi(page, 700)
uguale('raccolto: l\'anello passa a 🏗 Costruisci', await indicato('[data-f3="az-costruisci"]'), 1)
controlla('…con una riga che dice bravo', /Bravo/.test(await riga() || ''), await riga())
await toccaEl('[data-f3="az-costruisci"]')
await page.waitForSelector('[data-f3="costruisci-qui"]')
await attendi(page, 900)
await toccaEl('[data-f3="costruisci-qui"] [data-chiudi]')
await attendi(page, 900)
uguale('visto il menu, la guida tace', await riga(), null)
uguale('…e non resta nessun anello', await page.locator('[data-indicato]').count(), 0)
controlla('…e lo ricorda (profilo)', ((await leggiProfilo(page)).campagne.fattoria3d.cfg.guida || {}).finita === true)

/* ── il consiglio «E adesso?» ── */
await page.evaluate(() => { const { motore: m, mondo } = window.__fattoria3d; m.ora = Date.now; m.s.esperienza = 1e6; mondo.cambiato() })
await toccaEl('[data-f3="apri-consiglio"]')
await page.waitForSelector('[data-f3="consiglio"]')
controlla('il foglio dice cosa fare', (await page.locator('[data-f3="consiglio-testo"]').innerText()).length > 5)
controlla('…e ha il tasto per farlo', await page.locator('[data-f3="consiglio-fai"]').count() === 1)
controlla('…e la ✕ in alto a destra', await page.locator('[data-f3="consiglio"] [data-chiudi]').count() === 1)
await scatto(page, 'fattoria3d-guida-adesso')
await toccaEl('[data-f3="consiglio-fai"]')
await attendi(page, 400)
uguale('il tasto chiude il foglio', await page.locator('[data-f3="consiglio"]').count(), 0)

/* ── il «non si può» con il passo e il tasto: la farina vuole il grano ── */
await page.evaluate(() => {
  const { motore: m, mondo } = window.__fattoria3d
  m.s.merci.grano = 0
  const [i, j] = m.postoPer('mulino'); const c = { id: m.s.prossimoId++, tipo: 'mulino', i, j }
  m.s.cose.push(c); m._occupa(c, c.id); m.s.posseduti.mulino = true; mondo.cambiato(); mondo.ui.apriMacchina('mulino')
})
await page.waitForSelector('[data-f3="macchina"][data-macchina="mulino"]')
await attendi(page, 500)
await page.locator('[data-ricetta="farina"]').click({ force: true })
await page.waitForSelector('[data-f3="macchina-msg"]')
controlla('il perché c\'è', /Ti mancano/.test(await page.locator('[data-f3="macchina-msg"]').innerText()))
controlla('e il passo per averlo', (await page.locator('[data-f3="consiglio-testo"]').innerText()).length > 5)
await scatto(page, 'fattoria3d-guida-macchina')

/* ── «🌳 Come si fa»: dal «non si può» (la merce che manca) e dall'inventario ── */
controlla('sotto il passo c\'è «Come si fa»', await page.locator('[data-f3="consiglio-albero"]').count() === 1)
await toccaEl('[data-f3="consiglio-albero"]')
await page.waitForSelector('[data-f3="albero"]')
controlla('l\'albero è quello del grano (la merce che manca)', await page.locator('[data-f3="albero"]').getAttribute('data-albero-di') === 'grano')
controlla('il foglio ha la ✕ in alto a destra', await page.locator('[data-f3="albero"] [data-chiudi]').count() === 1)
controlla('la riga del grano dice come sta il campo', (await page.locator('[data-f3="albero"] [data-albero-riga="grano"]').innerText()).length > 5)
await scatto(page, 'fattoria3d-albero')
await toccaEl('[data-f3="albero"] [data-chiudi]')
uguale('la ✕ chiude l\'albero e la macchina resta aperta', (await page.locator('[data-f3="albero"]').count()) + ',' + (await page.locator('[data-f3="macchina"]').count()), '0,1')
await page.evaluate(() => { const { motore: m, mondo } = window.__fattoria3d; m.s.merci.grano = 1; m.s.prodotti.pane = 0; mondo.ui.apriMacchina(null); mondo.cambiato() })
await toccaEl('[data-f3="apri-inventario"]')
await page.waitForSelector('[data-f3="inventario"]')
await page.locator('[data-f3="inventario"] [data-scheda-inv="raccolti"]').click({ force: true })
await toccaEl('[data-f3="inventario"] button[data-merce="grano"]')
await toccaEl('[data-f3="inventario-albero"]')
await page.waitForSelector('[data-f3="albero"]')
uguale('dall\'inventario: l\'albero della merce scelta', await page.locator('[data-f3="albero"]').getAttribute('data-albero-di'), 'grano')
await toccaEl('[data-f3="albero"] [data-chiudi]')
await toccaEl('[data-f3="inventario"] [data-chiudi]')
await page.evaluate(() => { window.__fattoria3d.mondo.ui.apriMacchina('mulino') })
await page.waitForSelector('[data-f3="macchina"][data-macchina="mulino"]')
await page.locator('[data-ricetta="farina"]').click({ force: true })
await page.waitForSelector('[data-f3="consiglio-fai"]')
await toccaEl('[data-f3="consiglio-fai"]')
await attendi(page, 500)
uguale('il tasto chiude la macchina', await page.locator('[data-f3="macchina"]').count(), 0)

/* ── ricaricando, la guida non torna ── */
await page.reload()
await page.waitForSelector('.carte', { timeout: 10000 })
await scegli(page, 'fattoria3d')
await page.waitForFunction(() => !!(window.__fattoria3d && window.__fattoria3d.mondo), null, { timeout: 15000 })
await attendi(page, 800)
uguale('dopo il ricaricamento la guida tace', await riga(), null)

controlla('nessun errore in console', errori.length === 0, errori.join(' · '))
await browser.close()
riassunto('Guida della fattoria 3D')
