/* ═══════════════════════════════════════════════════════════════════
   LA FATTORIA 3D, COL DITO — docs/fattoria3d/

   Il test unitario prova le regole; questo dice che **il gioco vero sta in
   piedi nel browser**: è in prova (carta dietro l'interruttore), si apre sul
   prato in WebGL, un pezzo non pagato chiede la conferma appena lo si comincia
   a trascinare e poi si trascina dalla barra fino alla mappa, si semina e si
   raccoglie armando l'azione, le monete sono quelle vere e il resto (raccolti,
   terra, alberi) sta nello stato suo e sopravvive a un ricaricamento. Senza
   WebGL 2 si dice e si torna in home.
   Il dito è vero (`Input.dispatchTouchEvent`): un `page.click()` non trascina
   e non porta i pointer del tocco (docs/core/il-dito.md).
   `node test/esegui.mjs fattoria3d --niente-build`
   tempo: 60
   ═══════════════════════════════════════════════════════════════════ */
import { apriBrowser, apriGioco, azzera, semina, attendi, scatto, scegli, leggiProfilo } from '../aiuto/browser.mjs'
import { controlla, uguale, nota, riassunto } from '../aiuto/verifica.mjs'

const browser = await apriBrowser()
const { page, errori } = await apriGioco(browser)
await azzera(page)
await semina(page, { coins: 300, settings: { eta: 8, sperimentali: true } })

const cdp = await page.context().newCDPSession(page)
const giu = (x, y) => cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x, y }] })
const muovi = (x, y) => cdp.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x, y }] })
const su = () => cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] })
const tocca = async (x, y) => { await giu(x, y); await attendi(page, 60); await su() }
const toccaEl = async sel => { const r = await page.locator(sel).boundingBox(); await tocca(r.x + r.width / 2, r.y + r.height / 2) }
async function trascina(da, a) {
  await giu(da[0], da[1])
  for (let k = 1; k <= 10; k++) { await muovi(da[0] + (a[0] - da[0]) * k / 10, da[1] + (a[1] - da[1]) * k / 10); await attendi(page, 30) }
  await attendi(page, 80); await su()
}
// dove cade sullo schermo (px della pagina) un punto del mondo
const schermoDi = (x, z) => page.evaluate(([x, z]) => {
  const { mondo } = window.__fattoria3d, r = mondo.canvas.getBoundingClientRect(), [px, py] = mondo.proietta({ x, y: 0, z })
  return [r.left + px, r.top + py]
}, [x, z])
const stato = () => page.evaluate(() => JSON.parse(JSON.stringify(window.__fattoria3d.motore.s)))
const fermo = async () => { for (let i = 0; i < 100; i++) { if (await page.evaluate(() => { const m = window.__fattoria3d.mondo; return m.eroe.fermo && !m.coda.length })) break; await attendi(page, 150) } await attendi(page, 200) }
const monete = async () => (await leggiProfilo(page)).coins

/* ── la carta è in prova: dietro l'interruttore ── */
controlla('la carta sta in home (interruttore acceso)', await page.locator('[data-indice="fattoria3d"]').count() === 1)

/* ── si apre sul prato ── */
await scegli(page, 'fattoria3d')
await page.waitForSelector('[data-f3="campo"] canvas', { timeout: 10000 })
await page.waitForFunction(() => !!(window.__fattoria3d && window.__fattoria3d.mondo), null, { timeout: 15000 })
await attendi(page, 1200)
uguale('la barra dice dove siamo', (await page.locator('.barra-app .dove').innerText()).trim(), 'Fattoria 3D')
uguale('le quattro azioni ci sono', await page.locator('[data-f3^="az-"]').count(), 4)
controlla('c\'è un campo vuoto da seminare', (await stato()).cose.length === 1 && (await page.locator('.f3-n').first().innerText()).trim() === '1')
const disegna = await page.evaluate(() => window.__fattoria3d.mondo.statistiche())
controlla('la scena disegna davvero (draw call e triangoli)', disegna.calls > 20 && disegna.triangoli > 2000, `${disegna.calls} draw, ${disegna.triangoli} triangoli`)
await scatto(page, 'fattoria3d-prato')

/* ── semina armata: 🌱 → una coltura → si tocca il campo → l'eroe ci va e semina ── */
await toccaEl('[data-f3="az-semina"]')
await page.waitForSelector('[data-f3="semi"]')
await toccaEl('[data-seme="carota"]')
await attendi(page, 300)
controlla('il tasto 🌱 è armato e mostra la coltura', (await page.locator('[data-f3="az-semina"].acceso').count()) === 1 && /🥕/.test(await page.locator('.f3-seme').innerText()))
const campo = (await stato()).cose[0]
await tocca(...await schermoDi(campo.i + 1, campo.j + 1))
await fermo()
const dopoSemina = (await stato()).cose[0]
uguale('il campo è seminato a carote', dopoSemina.coltura, 'carota')
controlla('le quattro tessere stanno crescendo', dopoSemina.tile.every(t => t !== null))
await scatto(page, 'fattoria3d-seminato')

/* ── raccogli armato: il tempo passa (si sposta l'orologio del motore) ── */
await page.evaluate(() => { const m = window.__fattoria3d.motore, o = m.ora; m.ora = () => o() + 60000 })
await attendi(page, 600)
controlla('il numero sul tasto ✂️ dice un campo pronto', (await page.locator('[data-f3="az-raccogli"] .f3-n').innerText()).trim() === '1')
await toccaEl('[data-f3="az-raccogli"]')
await tocca(...await schermoDi(campo.i + 1, campo.j + 1))
await fermo()
const raccolto = await stato()
uguale('quattro carote in scorta', raccolto.merci.carota, 4)
controlla('lo vede anche il HUD', /🥕 4/.test(await page.locator('[data-f3="scorte"]').innerText()))
await toccaEl('[data-f3="az-libero"]')

/* ── costruire trascinando: la conferma arriva appena si comincia, poi si trascina dalla barra alla mappa ── */
await toccaEl('[data-f3="az-costruisci"]')
await page.waitForSelector('[data-f3="vassoio"]')
const prima = await monete()
const carta = await page.locator('[data-carta="campo"]').boundingBox()
const cx = carta.x + carta.width / 2, cy = carta.y + carta.height / 2
await giu(cx, cy); for (let k = 1; k <= 6; k++) { await muovi(cx, cy - k * 12); await attendi(page, 30) } await su()
await page.waitForSelector('[data-f3="dialogo"]', { timeout: 3000 })
controlla('un pezzo non pagato chiede la conferma appena lo si trascina', /Comprare: Campo/.test(await page.locator('.f3-dialogo h2').innerText()))
await page.locator('[data-scelta="0"]').click()
await attendi(page, 400)
const dopoAcquisto = await stato()
uguale('il campo comprato sta nel magazzino', dopoAcquisto.magazzino.campo, 1)
controlla('le monete vere sono scese del prezzo', prima - await monete() === 28, `da ${prima} a ${await monete()}`)
// si trascina dalla barra alla mappa, in un posto libero e proprio (il fantasma sta 1,6 celle sopra il dito)
await page.evaluate(() => { window.__fattoria3d.mondo.imposta({ vista: 'vicino' }) })
await attendi(page, 1500)
const meta = await schermoDi(-2, 2.6)
await trascina([cx, cy], meta)
await attendi(page, 500)
const costruito = await stato()
uguale('un campo in più sulla mappa', costruito.cose.length, 2)
uguale('e il magazzino è vuoto', costruito.magazzino.campo || 0, 0)
controlla('compare «↶ Annulla»', await page.locator('[data-f3="annulla"]').count() === 1)
await scatto(page, 'fattoria3d-costruito')
await page.locator('[data-f3="annulla"]').click()
await attendi(page, 300)
const annullato = await stato()
controlla('annullare rimette il pezzo nel magazzino', annullato.cose.length === 1 && annullato.magazzino.campo === 1)
await toccaEl('[data-chiudi]')
await attendi(page, 300)
controlla('la ✕ chiude il vassoio', await page.locator('[data-f3="vassoio"]').count() === 0)

/* ── gli alberi si abbattono, e un lotto non tuo si compra ── */
// un albero del terreno tuo che stia bene a schermo (non sotto le barre), il più vicino all'eroe
const albero = await page.evaluate(() => {
  const { motore, mondo } = window.__fattoria3d, r = mondo.canvas.getBoundingClientRect(), e = mondo.eroe
  const vis = motore.alberiNelTerreno().map(a => ({ a, p: mondo.proietta({ x: a.i + 0.5, y: 0, z: a.j + 0.5 }) }))
    .filter(({ p }) => p[2] && p[0] > 40 && p[0] < r.width - 40 && p[1] > 90 && p[1] < r.height - 170)
    .sort((u, v) => Math.hypot(u.a.i - e.x, u.a.j - e.z) - Math.hypot(v.a.i - e.x, v.a.j - e.z))
  const a = (vis[0] || { a: motore.alberiNelTerreno()[0] }).a
  return { n: a.n, i: a.i, j: a.j }
})
await tocca(...await schermoDi(albero.i + 0.5, albero.j + 0.5))
await fermo()
const tagliato = await stato()
controlla('l\'albero è abbattuto e c\'è la legna', tagliato.tagliati.includes(albero.n) && tagliato.legna === 2)
controlla('la legna si vede nel HUD', /🪵 2/.test(await page.locator('[data-f3="lana"]').innerText()))
const lottoNord = { i: -14 + 3 * 4 + 2, j: -12 + 1 * 4 + 2 }
await tocca(...await schermoDi(lottoNord.i, lottoNord.j))
await page.waitForSelector('[data-f3="dialogo"]', { timeout: 3000 })
controlla('toccare un terreno non tuo apre l\'acquisto', /Terreno/.test(await page.locator('.f3-dialogo h2').innerText()))
await page.locator('[data-scelta="0"]').click()
await attendi(page, 500)
const comprato = await stato()
uguale('il lotto è tuo', Object.keys(comprato.lotti).length, 10)

/* ── i contatori e le monete: l'albo li legge, e lo stato sta nel profilo ── */
await attendi(page, 600)
const profilo = await leggiProfilo(page)
controlla('i contatori sono saliti', profilo.totals.fattoria3dRaccolti === 4 && profilo.totals.fattoria3dAlberi === 1 && profilo.totals.fattoria3dTerre === 1,
         JSON.stringify(profilo.totals))
const st = profilo.campagne.fattoria3d && profilo.campagne.fattoria3d.cfg.stato
controlla('lo stato è in campagne.fattoria3d.cfg.stato', !!st && st.merci.carota === 4, '')
controlla('la fattoria di sempre non è stata toccata', !((profilo.campagne.fattoria || {}).cfg || {}).stato, '')

/* ── si esce, si ricarica, si rientra: tutto com'era ── */
await page.locator('button[aria-label="indietro"]').click()
await page.waitForSelector('.carte', { timeout: 8000 })
await attendi(page, 600)
await page.reload()
await page.waitForSelector('.carte', { timeout: 10000 })
await scegli(page, 'fattoria3d')
await page.waitForFunction(() => !!(window.__fattoria3d && window.__fattoria3d.mondo), null, { timeout: 15000 })
const riletto = await stato()
uguale('dopo il ricaricamento i lotti sono quelli di prima', Object.keys(riletto.lotti).length, 10)
uguale('e l\'albero è ancora a terra', riletto.tagliati.includes(albero.n), true)
uguale('e le carote in scorta', riletto.merci.carota, 4)
await scatto(page, 'fattoria3d-ritorno')

/* ── senza WebGL 2 si dice e si torna in home ── */
const { page: senza } = await apriGioco(browser, { hash: 'fattoria3d&tela=niente', attesa: null })
await senza.waitForSelector('[data-senza-3d]', { timeout: 8000 })
controlla('senza WebGL il messaggio c\'è', await senza.locator('[data-senza-3d]').count() === 1)
await senza.locator('[data-azione="esci-3d"]').click()
await senza.waitForSelector('.carte', { timeout: 8000 })
controlla('e si torna in home', true)

controlla('nessun errore in console', errori.length === 0, errori.join(' · '))
await browser.close()
riassunto('Fattoria 3D col dito')
