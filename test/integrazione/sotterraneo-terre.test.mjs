/* ═══════════════════════════════════════════════════════════════════
   LE TERRE SUCCESSIVE, COL DITO — docs/sotterraneo/terre-successive.md

   Nel Sotterraneo 3D, con le tombe del vento già ripulite nella prima
   terra (un salvataggio di prima delle terre: niente `terraOra`), la
   porta delle terre in fondo alla landa è aperta: il minatore la
   annuncia, toccandola si passa nella seconda terra (la stessa mappa,
   i mostri più su di 14, la porta di là chiusa) e l'avventura lo
   ricorda anche ricaricando. La prima terra resta com'era. Nella seconda
   il minatore racconta i volti nuovi delle discese, e la pietra del
   villaggio (accesa con la sua domanda) riporta nella piazza della prima.
   Si tocca come un telefono (`Input.dispatchTouchEvent`).
   `node test/esegui.mjs sotterraneo-terre`
   tempo: 240
   ═══════════════════════════════════════════════════════════════════ */
import { apriBrowser, apriGioco, azzera, semina, scatto, attendi, leggiProfilo, mondoPronto, toccaNelMondo, nelDialogo, scegli } from '../aiuto/browser.mjs'
import { uguale, controlla, riassunto } from '../aiuto/verifica.mjs'
import { MONDO } from '../../src/giochi/sotterraneo/motore/avventure.js'
import { TERRE } from '../../src/giochi/sotterraneo/dati/mondo-aperto.js'

const EROE = 'cavaliere'
const roba = { v: 1, gemme: 0, zaino: [], mano: 'spada', mancina: 'scudo-ferro', corpo: 'corazza', dito: null, torcia: 0, torce: 0 }

const browser = await apriBrowser()
const { page, errori } = await apriGioco(browser)
const cdp = await page.context().newCDPSession(page)
async function tocca(x, y) {
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x, y }] })
  await attendi(page, 60)
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] })
}
const avventura = async () => ((await leggiProfilo(page)).campagne.sotterraneo.cfg.avventure[EROE])
const nelMondo = async () => {
  await page.waitForSelector('[data-mondo3d], [data-terra], .sot-eroe[data-eroe]', { state: 'attached', timeout: 30000 })
  await mondoPronto(page)
  await attendi(page, 1500)
}

await azzera(page)
await page.setViewportSize({ width: 390, height: 844 })
// la storia finita e le tombe ripulite nella prima terra; il minatore conosciuto (parla subito della porta)
const mondo = { parlato: true, dungeon: { tombe: { rifatti: 1 } } }
const a = { tappa: 7, libera: true, stelle: { 0: 3 }, missioni: {}, roba, mondo }
await semina(page, { coins: 300, settings: { sperimentali: true },
  campagne: { sotterraneo: { tappa: 7, libera: true, stelle: { 0: 3 }, cfg: { mondo: MONDO, eroe: EROE, avventure: { [EROE]: a } } } } })
await scegli(page, 'sotterraneo3d')
await nelMondo()

/* ── nella prima terra: la porta è aperta e il minatore la annuncia ── */
uguale('si comincia nella prima terra', await page.locator('[data-mondo3d]').getAttribute('data-terra-ora'), '1')
uguale('la porta delle terre è aperta', await page.locator('[data-bersaglio][data-terre]').getAttribute('data-terre'), '1')
// accanto al minatore (il salto delle prove), poi lo si tocca
await page.evaluate(() => window.__mondo3d.vai('minatore'))
await attendi(page, 1500)
for (let n = 0; n < 3 && !(await page.locator('[data-dialogo-testo]').count()); n++) {
  await toccaNelMondo(page, '[data-minatore]', { tocca })
  await page.waitForSelector('[data-dialogo-testo]', { timeout: 15000 }).catch(() => null)
}
await page.waitForSelector('[data-dialogo-testo]', { timeout: 5000 })
const detto = await page.locator('[data-dialogo-testo]').innerText()
controlla('il minatore dice la porta, per prima cosa', /porta di pietra/.test(detto), detto)
await scatto(page, 'sotterraneo-terre-minatore')
await nelDialogo(page, '[data-scelta="ciao"]', { tocca: async sel => { const b = await page.locator(sel).first().boundingBox(); await tocca(b.x + b.width / 2, b.y + b.height / 2) } })
await page.waitForFunction(() => !document.querySelector('[data-dialogo]'), null, { timeout: 10000 })

/* ── la porta, toccata col dito: «passo dall'altra parte» ── */
// la landa è piena di mostri forti: per questa prova non escono (il cheat delle prove)
await page.evaluate(() => { window.__mondo3d.senzaMostri(); window.__mondo3d.vai('terre:porta-delle-terre') })
await attendi(page, 1500)
await page.waitForFunction(() => window.__sotterraneo3d.pronto, null, { timeout: 30000 })
await page.waitForSelector('[data-bersaglio][data-terre][data-vis="1"]', { timeout: 20000 })
for (let n = 0; n < 4 && !(await page.locator('[data-azione="passa-terra"]').count()); n++) {
  const b = await page.locator('[data-bersaglio][data-terre]').boundingBox()
  await tocca(b.x + b.width / 2, b.y + b.height * 0.6)
  await attendi(page, 1500)
}
await page.waitForSelector('[data-terre-dice][data-aperta="1"]', { timeout: 10000 })
await scatto(page, 'sotterraneo-terre-porta')
{
  const b = await page.locator('[data-azione="passa-terra"]').boundingBox()
  await tocca(b.x + b.width / 2, b.y + b.height / 2)
}
await page.waitForSelector('[data-mondo3d][data-terra-ora="2"]', { timeout: 30000 })
// appena nata la scena, la riga dice dove si è arrivati (dura un paio di secondi)
const benvenuto = await page.waitForFunction(v => [...document.querySelectorAll('[data-avviso-terra]')].some(e => e.textContent.includes(v)),
  TERRE[1].villaggio, { timeout: 30000 }).then(() => true, () => false)
await mondoPronto(page)
await attendi(page, 2000)

/* ── nella seconda terra ── */
{
  const av = await avventura()
  uguale('l\'avventura ricorda la seconda terra', av.terraOra, 2)
  uguale('la prima terra resta com\'era: le tombe ripulite', av.mondo && av.mondo.dungeon && av.mondo.dungeon.tombe && av.mondo.dungeon.tombe.rifatti, 1)
  uguale('il primato della terra raggiunta', (await leggiProfilo(page)).best.sotTerra, 2)
  const m = await page.evaluate(() => ({ terra: window.__mondo3d.m.terra, fascia: window.__mondo3d.m.zone[0].fascia[0] }))
  uguale('il mondo è quello della seconda terra', m.terra, 2)
  uguale('i prati cominciano al 15', m.fascia, 15)
  uguale('di qua la porta è chiusa: le tombe di questa terra non sono ripulite', await page.locator('[data-bersaglio][data-terre]').getAttribute('data-terre'), '0')
  uguale('si riparte dal villaggio', await page.locator('[data-minatore][data-vis="1"]').count(), 1)
  controlla('arrivando, il nome della terra nuova e del suo villaggio', benvenuto)
  await scatto(page, 'sotterraneo-terre-seconda')
}

/* ── uscendo il mondo della seconda si salva in `mondi`; ricaricando si resta lì ── */
await page.click('button[aria-label="indietro"]')
await page.waitForSelector('.carte', { timeout: 15000 })
await attendi(page, 800)   // le scritture in coda dell'archivio
{
  const av = await avventura()
  controlla('il mondo della seconda si salva in `mondi`', !!(av.mondi && av.mondi[2] && av.mondi[2].firma), JSON.stringify(Object.keys(av.mondi || {})))
  uguale('e la prima non si tocca', av.mondo.dungeon.tombe.rifatti, 1)
}
await page.reload()
await page.waitForSelector('.carte', { timeout: 15000 })
await scegli(page, 'sotterraneo3d')
await nelMondo()
uguale('ricaricando, ancora la seconda terra', await page.locator('[data-mondo3d]').getAttribute('data-terra-ora'), '2')

/* ── nella seconda il minatore non si presenta: racconta i volti nuovi delle discese ── */
await page.evaluate(() => window.__mondo3d.vai('minatore'))
await attendi(page, 1500)
for (let n = 0; n < 3 && !(await page.locator('[data-dialogo-testo]').count()); n++) {
  await toccaNelMondo(page, '[data-minatore]', { tocca })
  await page.waitForSelector('[data-dialogo-testo]', { timeout: 15000 }).catch(() => null)
}
await page.waitForSelector('[data-dialogo-testo]', { timeout: 5000 })
{
  const t = await page.locator('[data-dialogo-testo]').innerText()
  controlla('il minatore dice che le discese hanno un\'altra faccia', /un'altra faccia/.test(t), t)
}
await scatto(page, 'sotterraneo-terre-volti')
await nelDialogo(page, '[data-scelta="ciao"]', { tocca: async sel => { const b = await page.locator(sel).first().boundingBox(); await tocca(b.x + b.width / 2, b.y + b.height / 2) } })
await page.waitForFunction(() => !document.querySelector('[data-dialogo]'), null, { timeout: 10000 })

/* ── il viaggio indietro: la pietra del villaggio, accesa, riporta alla prima terra ── */
await page.evaluate(() => window.__mondo3d.vai('pietra:villaggio'))
await attendi(page, 1500)
for (let n = 0; n < 3 && !(await page.locator('[data-pietra-domanda] .qz-tasto').count()); n++) {
  await toccaNelMondo(page, '[data-pietra="villaggio"]', { tocca })
  await page.waitForSelector('[data-pietra-domanda] .qz-tasto', { timeout: 15000 }).catch(() => null)
}
await page.locator('[data-pietra-domanda] .qz-tasto[data-giusta]').first().click()
await page.waitForSelector('[data-pietra="villaggio"][data-accesa="1"]', { timeout: 8000 })
await page.waitForSelector('[data-fumetto-di="pietra"] [data-azione="torna-terra"]', { timeout: 10000 })
uguale('la pietra offre la prima terra, e nessun\'altra', await page.locator('[data-azione="torna-terra"]').evaluateAll(l => l.map(e => e.dataset.terra).join()), '1')
uguale('e non dice «nessuna meta»', await page.locator('[data-fumetto-di="pietra"] [data-nessuna-meta]').count(), 0)
await scatto(page, 'sotterraneo-terre-pietra')
{
  const b = await page.locator('[data-azione="torna-terra"][data-terra="1"]').boundingBox()
  await tocca(b.x + b.width / 2, b.y + b.height / 2)
}
await page.waitForSelector('[data-mondo3d][data-terra-ora="1"]', { timeout: 30000 })
const aCasa = await page.waitForFunction(v => [...document.querySelectorAll('[data-avviso-terra]')].some(e => e.textContent.includes(v)),
  TERRE[0].villaggio, { timeout: 30000 }).then(() => true, () => false)
await mondoPronto(page)
await attendi(page, 2000)
{
  controlla('tornati, il nome della terra di casa', aCasa)
  uguale('il mondo è quello della prima terra', await page.evaluate(() => window.__mondo3d.m.terra), 1)
  uguale('la porta di qui è aperta come prima', await page.locator('[data-bersaglio][data-terre]').getAttribute('data-terre'), '1')
  uguale('si arriva nella piazza, non alla porta', await page.locator('[data-minatore][data-vis="1"]').count(), 1)
  const av = await avventura()
  uguale('l\'avventura dice la prima terra', av.terraOra, 1)
  uguale('le tombe della prima restano ripulite', av.mondo.dungeon.tombe.rifatti, 1)
  controlla('la seconda resta salvata con la pietra accesa', (av.mondi && av.mondi[2] && av.mondi[2].pietre || []).includes('villaggio'))
  uguale('il primato resta la seconda', (await leggiProfilo(page)).best.sotTerra, 2)
  await scatto(page, 'sotterraneo-terre-ritorno')
}

uguale('nessun errore in console', errori.join(' | '), '')
await browser.close()
riassunto('Le terre successive, col dito')
