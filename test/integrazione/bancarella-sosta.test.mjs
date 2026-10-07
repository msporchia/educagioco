/* La giornata della bancarella lasciata a metà, nel browser: si esce con ←
   col cliente a metà della spesa, si rientra, la mappa offre in cima «torno
   da dove ero» e la giornata riprende ferma, com'era: stesso banco, stessi
   cuori, la stessa fila e la roba già data. Anche dopo aver ricaricato la
   pagina, e mai in silenzio: una giornata nuova chiede prima di buttarla.
   Vedi docs/bancarella/regole.md, «Lasciare a metà».
   `node test/esegui.mjs bancarella-sosta` */
import { apriBrowser, apriGioco, azzera, attendi, scatto, scegli, giocaGiornata } from '../aiuto/browser.mjs'
import { controlla, uguale, riassunto } from '../aiuto/verifica.mjs'

const browser = await apriBrowser()
const { page, errori } = await apriGioco(browser)
await azzera(page)

async function entra() {
  await scegli(page, 'bancarella')
  await page.waitForSelector('[data-mondo]')
}

// la prima giornata: un cliente servito, il secondo a metà della spesa
await entra()
await giocaGiornata(page, 'banchetto')
await page.waitForFunction(() => window.__shop && !window.__shop.cambio.value, null, { timeout: 4000 })
const chiesti = () => page.evaluate(() =>
  window.__shop.cliente.value.articoli.flatMap(a => Array(a.quanti).fill(a.emoji)))
for (const em of await chiesti()) {
  await page.locator(`.cesta[data-em="${em}"]`).click()
  await attendi(page, 120)
}
const daDare = await page.evaluate(() => {
  const S = window.__shop
  return S.scomponi(S.cliente.value.resto, S.cliente.value.monete)
})
for (const v of daDare) {
  await page.locator(`.scomparto[data-v="${v}"]`).first().click()
  await attendi(page, 80)
}
await page.waitForFunction(() => window.__shop.hud.serviti === 1 &&
                                  window.__shop.momento.value === 'raccolta', null, { timeout: 4000 })
await attendi(page, 300)
const [primo] = await chiesti()
await page.locator(`.cesta[data-em="${primo}"]`).click()
await attendi(page, 200)

const comEra = () => page.evaluate(() => {
  const S = window.__shop
  const c = S.cliente.value
  return { fase: S.fase.value, tappa: S.tappa.value, cuori: S.hud.cuori, serviti: S.hud.serviti,
           monete: S.guadagno.monete, presi: S.presi.value.join(''),
           ceste: S.esposti.value.map(p => p.emoji).join(''),
           fila: S.coda.value.map(x => x.articoli.map(a => a.emoji + a.quanti).join('') + x.paga).join('|'),
           pazienza: c ? c.restaPazienza : 0 }
})
const lasciata = await comEra()
controlla('la prova parte da una giornata cominciata, col cliente a metà',
          lasciata.serviti === 1 && lasciata.presi === primo && lasciata.monete > 0,
          JSON.stringify(lasciata))

/* ← col cliente a metà: si torna a casa, e rientrando la carta c'è */
await page.click('button[aria-label="indietro"]')
await page.waitForSelector('.carte')
await entra()
await page.waitForSelector('[data-ripresa]')
controlla('la carta dice a che banco si era',
          /banco 1 di/.test(await page.locator('[data-ripresa]').textContent()),
          await page.locator('[data-ripresa]').textContent())
await scatto(page, 'bancarella-ripresa')

await page.click('[data-ripresa] [data-azione="riprendi"]')
await attendi(page, 300)
const ripresa = await comEra()
uguale('si riprende al banco', ripresa.fase, 'gioco')
uguale('con lo stesso banco, cuori e serviti',
       JSON.stringify([ripresa.tappa, ripresa.cuori, ripresa.serviti]),
       JSON.stringify([lasciata.tappa, lasciata.cuori, lasciata.serviti]))
uguale('le stesse ceste, nello stesso ordine', ripresa.ceste, lasciata.ceste)
uguale('la stessa fila: nessuno ha cambiato spesa', ripresa.fila, lasciata.fila)
uguale('il cliente ha già quello che gli era stato dato', ripresa.presi, lasciata.presi)
controlla('e la pazienza non è tornata piena', ripresa.pazienza <= lasciata.pazienza &&
          ripresa.pazienza > lasciata.pazienza - 2, `${lasciata.pazienza} → ${ripresa.pazienza}`)
uguale('la giornata ripresa aspetta un tocco', await page.locator('[data-pausa]').count(), 1)
uguale('le monete di prima restano nel conto della giornata', ripresa.monete, lasciata.monete)

/* la pagina che sparisce (il telefono in tasca, l'app chiusa): si ricarica e
   la carta c'è ancora */
await page.click('[data-pausa] [data-azione="riprendi"]', { delay: 400 })
await attendi(page, 600)
await page.evaluate(() => document.dispatchEvent(new Event('visibilitychange')))
await page.evaluate(() => window.dispatchEvent(new Event('pagehide')))
await attendi(page, 500)
await page.reload()
await page.waitForSelector('.carte')
await entra()
uguale('anche dopo aver ricaricato la pagina', await page.locator('[data-ripresa]').count(), 1)

/* toccare un'altra giornata non la butta in silenzio: nemmeno dalla piazza */
await page.locator('[data-citta="bologna"]').click()
await page.click('[data-fumetto-per="bologna"] [data-azione="entra"]')
uguale('anche nella piazza la carta resta in cima', await page.locator('[data-piazza]').count() && await page.locator('[data-ripresa]').count(), 1)
await page.locator('[data-camp="banchetto"]').click()
await page.click('[data-fumetto-per="banchetto"] [data-azione="gioca"]')
uguale('una giornata nuova chiede prima', await page.locator('[data-chiede]').count(), 1)
await page.click('[data-chiede] [data-azione="comincia"]')
await attendi(page, 200)
uguale('e scelta la nuova, si comincia da zero',
       await page.evaluate(() => window.__shop.hud.serviti), 0)
await page.click('button[aria-label="indietro"]')
await page.waitForSelector('.carte')
await entra()
// la giornata nuova appena aperta ha lasciato la sua sosta: si butta e la mappa resta pulita
await page.click('[data-ripresa] [data-azione="scorda"]')
uguale('«lascio perdere» toglie la carta', await page.locator('[data-ripresa]').count(), 0)

uguale('nessun errore in console', errori.join(' · '), '')
await browser.close()
riassunto('bancarella — la giornata lasciata a metà, nel browser')
