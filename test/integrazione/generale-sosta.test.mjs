/* Il piano del Generale lasciato a metà, nel browser: si scrive un ordine,
   si esce con ←, l'elenco dice che il livello è a metà e rientrando il
   piano è lì. Anche dopo aver ricaricato la pagina e uscendo a scena in
   corso; vinto il livello, il piano a metà se ne va. Un livello non butta
   il piano di un altro. Vedi docs/generale/lasciare-a-meta.md.
   `node test/esegui.mjs generale-sosta` */
import { apriBrowser, apriGioco, azzera, attendi, scatto, scegli } from '../aiuto/browser.mjs'
import { controlla, uguale, riassunto } from '../aiuto/verifica.mjs'

const browser = await apriBrowser()
const { page, errori } = await apriGioco(browser)
await azzera(page)

const elenco = async () => {
  await scegli(page, 'generale')
  await page.waitForSelector('.tappa')
}
const entraNel = async k => {
  await page.locator('.tappa').nth(k).click()
  await page.waitForSelector('.campo')
  await attendi(page, 400)
  if (await page.locator('.foglio.cartello').count()) await page.locator('.foglio .capo button').click()
}
const indietro = () => page.click('button[aria-label="indietro"]')
const righe = () => page.locator('.lista .riga').count()
const aMeta = k => page.locator('.tappa').nth(k).locator('[data-a-meta]').count()

/* il primo livello: «apri il forziere», scritto col dito */
await elenco()
await entraNel(0)
await page.locator('.posto').first().click()
await attendi(page, 200)
await page.locator('.foglio-scelta .pezzo', { hasText: 'apri' }).first().click()
await attendi(page, 200)
const punto = await page.evaluate(() => {
  const t = window.__gen.mondo().cose.tesoro
  return window.__gen.dove(t.x, t.y)
})
await page.mouse.click(punto.x, punto.y)
await attendi(page, 300)
uguale('la prova parte da un ordine scritto', await righe(), 1)
// la soluzione vista resta vista: uscire non ridà la seconda stella
await page.evaluate(() => { window.__gen.svelato.value = 'svela' })

/* ← a piano scritto: l'elenco lo dice, e rientrando il piano c'è */
await indietro()
await page.waitForSelector('.tappa')
uguale('l\'elenco dice che il livello è a metà', await aMeta(0), 1)
controlla('e quanti ordini ci sono',
          /1 ordine/.test(await page.locator('[data-a-meta]').first().textContent()))
await scatto(page, 'generale-a-meta')
await entraNel(0)
uguale('rientrando il piano è com\'era', await righe(), 1)
controlla('con lo stesso ordine', /apri/.test(await page.locator('.lista .riga').first().innerText()))
uguale('e l\'aiuto visto resta visto', await page.evaluate(() => window.__gen.svelato.value), 'svela')
await page.evaluate(() => { window.__gen.svelato.value = '' })   // da qui si gioca pulito

/* la pagina che sparisce: si ricarica, e il piano c'è ancora */
await page.evaluate(() => document.dispatchEvent(new Event('visibilitychange')))
await page.evaluate(() => window.dispatchEvent(new Event('pagehide')))
await attendi(page, 500)
await page.reload()
await page.waitForSelector('.carte')
await elenco()
// l'archivio risponde dopo che l'elenco è già a schermo
await page.waitForSelector('[data-a-meta]', { timeout: 3000 }).catch(() => {})
uguale('anche dopo aver ricaricato la pagina', await aMeta(0), 1)
await entraNel(0)
uguale('e il piano si riapre', await righe(), 1)

/* ▶ e si esce a scena in corso: si salva il piano, non la scena */
// il primo livello si vince in pochi passi: si esce al primo, nello stesso giro
const aMezzo = await page.evaluate(async () => {
  document.querySelector('.tasto.via').click()
  for (let i = 0; i < 100 && !window.__gen.mondo().passi; i++) await new Promise(r => setTimeout(r, 10))
  const m = window.__gen.mondo()
  document.querySelector('button[aria-label="indietro"]').click()
  return { passi: m.passi, finita: !!m.finita }
})
controlla('si esce a scena cominciata', aMezzo.passi > 0 && !aMezzo.finita, JSON.stringify(aMezzo))
await page.waitForSelector('.tappa')
await entraNel(0)
uguale('uscendo a scena in corso il piano resta', await righe(), 1)
uguale('e si rientra da fermi', await page.evaluate(() => window.__gen.mondo().passi), 0)

/* vinto il livello, il piano a metà se ne va */
await page.locator('.tasto.via').click()
let vinto = false
for (let i = 0; i < 30 && !vinto; i++) {
  await attendi(page, 500)
  vinto = await page.evaluate(() => !!window.__gen.finito.value)
}
controlla('il piano vince', vinto)
// «Riprova» lascia il piano scritto, ma la partita è finita: uscire non lo ritiene a metà
await page.click('.velo .grigio')
await indietro()
await page.waitForSelector('.tappa')
uguale('vinto, il livello non è più a metà', await aMeta(0), 0)

/* un livello non butta il piano di un altro */
await entraNel(0)
uguale('rientrando in un livello vinto si riparte da capo', await righe(), 0)
await indietro()
await page.waitForSelector('.tappa')
await entraNel(1)
await page.evaluate(() => {
  const g = window.__gen
  g.piano.value[g.unitaOra.value].push({ verbo: 'vai' })
})
await attendi(page, 800)              // il piano si scrive da sé, poco dopo
await indietro()
await page.waitForSelector('.tappa')
uguale('il secondo livello è a metà', await aMeta(1), 1)
await entraNel(0)
await indietro()
await page.waitForSelector('.tappa')
uguale('e aprire il primo non lo butta', await aMeta(1), 1)

uguale('nessun errore in console', errori.join(' · '), '')
await browser.close()
riassunto('generale — il piano lasciato a metà, nel browser')
