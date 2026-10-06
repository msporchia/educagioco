/* La battaglia lasciata a metà, nel browser: si esce con ←, si rientra, la
   mappa offre in cima «torno da dove ero» e la battaglia riprende ferma,
   com'era. Anche dopo aver ricaricato la pagina, e mai in silenzio: una
   tappa nuova chiede prima di buttarla. Vedi docs/castello/sosta.md.
   `node test/esegui.mjs castello-sosta` */
import { apriBrowser, apriGioco, attendi, scatto } from '../aiuto/browser.mjs'
import { controlla, uguale, riassunto } from '../aiuto/verifica.mjs'

const browser = await apriBrowser()
const { page, errori } = await apriGioco(browser)

async function entra() {
  await page.click('.carta.gioco[data-gioco="torri"]')
  await page.waitForSelector('.tappe')
}

// la prima tappa: una torre pagata col conto, l'ondata chiamata, i mostri in strada
await entra()
const prima = await page.evaluate(async () => {
  const attesa = ms => new Promise(r => setTimeout(r, ms))
  const T = window.__td
  T.inizia(0)
  T.scegliTorre('add')
  await attesa(80)
  const tasti = [...document.querySelectorAll('.tastiera button')]
  T.op.value.passi.forEach(p => tasti.find(x => +x.textContent === p.atteso).click())
  await attesa(200)
  T.chiamaOnda()
  await attesa(1500)
  return { onda: T.hud.onda, energia: T.hud.energia, cuori: T.hud.cuori,
           torri: T.torri().length, nemici: T.nemici().length, monete: T.monete.prese }
})
controlla('la prova parte da una battaglia cominciata',
          prima.onda === 1 && prima.torri === 1 && prima.nemici > 0, JSON.stringify(prima))

const comEra = () => page.evaluate(() => {
  const T = window.__td
  return { fase: T.fase.value, onda: T.hud.onda, energia: T.hud.energia, cuori: T.hud.cuori,
           torri: T.torri().length, nemici: T.nemici().length,
           strada: T.nemici().map(n => Math.round(n.d)).join(',') }
})
// il velo della pausa copre anche il ←: si guarda a campo che cammina, e
// fra la lettura e il tocco i mostri fanno al più qualche passo
const lasciata = await comEra()

/* ← in mezzo all'ondata: si torna a casa, e rientrando la carta c'è */
await page.click('button[aria-label="indietro"]')
await page.waitForSelector('.carte')
await entra()
await page.waitForSelector('[data-ripresa]')
controlla('la carta dice a che ondata si era',
          /ondata 1 di/.test(await page.locator('[data-ripresa]').textContent()))
await scatto(page, 'castello-ripresa')

await page.click('[data-ripresa] [data-azione="riprendi"]')
await attendi(page, 300)
const ripresa = await comEra()
uguale('si riprende in battaglia', ripresa.fase, 'gioco')
uguale('con la stessa ondata, energia, cuori e torri',
       JSON.stringify([ripresa.onda, ripresa.energia, ripresa.cuori, ripresa.torri]),
       JSON.stringify([lasciata.onda, lasciata.energia, lasciata.cuori, lasciata.torri]))
const passi = ripresa.strada.split(',').map((d, k) => d - lasciata.strada.split(',')[k])
controlla('e i mostri dov\'erano', passi.length === lasciata.nemici && passi.every(p => p >= 0 && p <= 4),
          `${lasciata.strada} → ${ripresa.strada}`)
uguale('il campo ripreso aspetta un tocco', await page.locator('[data-pausa]').count(), 1)
uguale('le monete di prima restano nel conto della partita',
       await page.evaluate(() => window.__td.monete.prese), prima.monete)

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

/* toccare un'altra tappa non la butta in silenzio */
await page.click('.tap:not(.chiusa)')
uguale('una tappa nuova chiede prima', await page.locator('[data-chiede]').count(), 1)
await page.click('[data-chiede] [data-azione="comincia"]')
await attendi(page, 200)
uguale('e scelta la nuova, si gioca quella', await page.evaluate(() => window.__td.hud.onda), 0)
await page.click('button[aria-label="indietro"]')
await page.waitForSelector('.carte')
await entra()
// la tappa nuova appena aperta ha lasciato la sua sosta: si butta e la mappa resta pulita
await page.click('[data-ripresa] [data-azione="scorda"]')
uguale('«lascio perdere» toglie la carta', await page.locator('[data-ripresa]').count(), 0)

uguale('nessun errore in console', errori.join(' · '), '')
await browser.close()
riassunto('castello — la battaglia lasciata a metà, nel browser')
