/* La tappa delle pozioni lasciata a metà, nel browser: si esce con ←, si
   rientra, la mappa offre in cima «torno da dove ero» e il banco è com'era
   (cliente, sbagli, attrezzo e pezzi). Anche dopo aver ricaricato la
   pagina, anche con la dose già nel calderone, e mai in silenzio: una tappa
   nuova chiede prima di buttarla. Vedi docs/pozioni/sosta.md.
   `node test/esegui.mjs pozioni-sosta`
   tempo: 60 */
import { apriBrowser, apriGioco, azzera, semina, leggiProfilo, scatto, attendi }
  from '../aiuto/browser.mjs'
import { controlla, uguale, riassunto } from '../aiuto/verifica.mjs'

const browser = await apriBrowser()
const { page, errori } = await apriGioco(browser)
await azzera(page)
/* la tappa 1 («Arriva il chilo») è già la prossima: le prime due sono aperte */
await semina(page, { settings: { eta: 9 },
                     campagne: { pozioni: { tappa: 1, libera: false, stelle: {}, cfg: {} } } })

async function entra() {
  await page.click('.carta.gioco[data-gioco="pozioni"]')
  await page.waitForSelector('.pz-mappa')
}
const indietro = () => page.click('button[aria-label="indietro"]')

/* i gesti passano dalla porta del gioco (`window.__poz`), uno alla volta come
   li farebbe un dito: la dose si compone coi pezzi più grandi che ci stanno */
const dosa = fino => page.evaluate(async fino => {
  const attesa = ms => new Promise(r => setTimeout(r, ms))
  const Z = window.__poz, p = Z.partita.value
  await attesa(420)                                    // la finestra cieca
  const ing = p.daFare[0]
  if (!p.strumento) {
    Z.prendi(ing.nome); await attesa(30)
    Z.posa(p.consigliato().chiave); await attesa(30)
  }
  let resto = ing.dose.base - p.messo
  const pezzi = [...p.strumento.pezzi].sort((a, b) => b - a)
  const tuttiI = []
  for (const pz of pezzi) while (resto >= pz) { tuttiI.push(pz); resto -= pz }
  for (const pz of fino === 'pezzo' ? tuttiI.slice(0, 1) : tuttiI) { Z.metti(pz); await attesa(30) }
  if (fino === 'tutto') Z.conferma()
}, fino)

const stato = () => page.evaluate(() => {
  const p = window.__poz.partita.value
  return p && {
    vista: window.__poz.vista.value, n: p.n, sbagli: p.sbagli, sbagliQui: p.sbagliQui,
    corrente: p.corrente, strumento: p.strumento && p.strumento.chiave, messi: [...p.messi],
    pozione: p.ricetta.nome, cliente: p.ricetta.cliente,
    voci: p.ricetta.ingredienti.map(i => `${i.nome} ${i.dose.testo} ${i.fatto}`),
    scaffale: p.ricetta.scaffale.map(s => s.nome), dosi: p.dosi.length,
  }
})

await entra()
await page.click('.pz-tappa[data-tappa="1"]')
await page.waitForSelector('.pz-banco')
uguale('senza una sosta la tappa comincia subito', await page.locator('[data-chiede]').count(), 0)

/* il primo cliente servito, il secondo con uno sbaglio e una dose a metà */
await dosa('tutto')
await page.waitForFunction(() => window.__poz.partita.value.n === 1, null, { timeout: 5000 })
await attendi(page, 500)
{
  const altro = await page.evaluate(() => {
    const p = window.__poz.partita.value
    return p.ricetta.scaffale.find(s => !p.ricetta.ingredienti.some(i => i.nome === s.nome)).nome
  })
  await attendi(page, 400)
  await page.evaluate(nome => window.__poz.prendi(nome), altro)
  await page.waitForSelector('[data-esito][data-codice="ingrediente"]')
  await page.waitForSelector('[data-esito]', { state: 'detached', timeout: 15000 })
}
await dosa('pezzo')
const lasciata = await stato()
controlla('la prova parte da un cliente a metà',
          lasciata.n === 1 && lasciata.sbagli === 1 && lasciata.messi.length === 1 && !!lasciata.strumento,
          JSON.stringify(lasciata))

/* ← dal banco porta alla mappa, e la carta c'è */
await indietro()
await page.waitForSelector('[data-ripresa]')
controlla('la carta dice a che cliente si era',
          /cliente 2 di 4/.test(await page.locator('[data-ripresa]').textContent()))
controlla('e dello sbaglio', /1 sbaglio/.test(await page.locator('[data-ripresa]').textContent()))
await scatto(page, 'pozioni-ripresa')
await attendi(page, 500)
const profilo0 = await leggiProfilo(page)
uguale('la sosta sta in profile.campagne.pozioni', profilo0.campagne.pozioni.sosta.chiave, 'massa-grande')

/* la pagina che sparisce (il telefono in tasca): si ricarica e la carta c'è ancora */
await page.evaluate(() => document.dispatchEvent(new Event('visibilitychange')))
await page.evaluate(() => window.dispatchEvent(new Event('pagehide')))
await attendi(page, 500)
await page.reload()
await page.waitForSelector('.carte')
await entra()
uguale('anche dopo aver ricaricato la pagina', await page.locator('[data-ripresa]').count(), 1)

/* toccare un'altra tappa non la butta in silenzio */
await page.click('.pz-tappa[data-tappa="0"]')
uguale('una tappa nuova chiede prima', await page.locator('[data-chiede]').count(), 1)
await page.click('[data-chiede] [data-azione="riprendi-invece"]')
await page.waitForSelector('.pz-banco')
uguale('«no, torno a quella di prima» riprende la partita',
       JSON.stringify(await stato()), JSON.stringify(lasciata))
uguale('con attrezzo e pezzi com\'erano', await page.locator('[data-dosa]').count(), 1)
uguale('e il conto svolto dopo lo sbaglio',
       await page.locator('[data-aiuto][data-livello="svolto"]').count(), 1)

/* la dose finita e subito ←: è già nel calderone, pagata e imparata */
await dosa('tutto')
await page.waitForSelector('[data-esito][data-codice="giusto"]')
await indietro()
await page.waitForSelector('[data-ripresa]')
await attendi(page, 500)
const aMeta = await leggiProfilo(page)
uguale('le dosi dette al motore sono due', aMeta.totals.misure, 2)
await page.click('[data-ripresa] [data-azione="riprendi"]')
await page.waitForSelector('.pz-banco')
await page.waitForFunction(() => window.__poz.partita.value.n === 2, null, { timeout: 5000 })
await attendi(page, 600)
const dopo = await leggiProfilo(page)
uguale('la pozione si conta una volta sola', dopo.totals.pozioni, 2)
uguale('e la perfetta è solo la prima', dopo.totals.pozioniPerfette, 1)
uguale('e la dose non si conta due volte', dopo.totals.misure, 2)

/* il resto della tappa, e le monete dicono il totale: quelle prima dell'uscita restano nel conto */
for (let g = 0; g < 8 && await page.locator('[data-fine]').count() === 0; g++) {
  await dosa('tutto')
  await attendi(page, 1300)
}
uguale('la tappa finisce', await page.locator('[data-fine="tappa"]').count(), 1)
uguale('le monete sono quelle di tutta la tappa, anche prima dell\'uscita',
       (await page.locator('[data-monete]').innerText()).trim(),
       `+${await page.evaluate(() => window.__poz.partita.value.monete)} 🪙`)
uguale('con una stella in meno per lo sbaglio', (await page.locator('[data-stelle]').innerText()).trim(), '⭐⭐')
await page.click('[data-fine] [data-azione="mappa"]')
await attendi(page, 500)
uguale('finita la tappa la carta non c\'è', await page.locator('[data-ripresa]').count(), 0)
uguale('e la sosta nemmeno', (await leggiProfilo(page)).campagne.pozioni.sosta, undefined)

/* una tappa nuova a metà, poi un'altra: chiede, e scegliendola la vecchia si butta */
await page.click('.pz-tappa[data-tappa="0"]')
await page.waitForSelector('.pz-banco')
await dosa('pezzo')
await indietro()
await page.waitForSelector('[data-ripresa]')
await page.click('.pz-tappa[data-tappa="1"]')
uguale('chiede anche dalla tappa a metà', await page.locator('[data-chiede]').count(), 1)
await page.click('[data-chiede] [data-azione="comincia"]')
await page.waitForSelector('.pz-banco')
uguale('e scelta la nuova si comincia da capo', (await stato()).n, 0)
await indietro()
await page.waitForSelector('[data-ripresa]')
controlla('la carta è quella della tappa nuova',
          /Arriva il chilo/.test(await page.locator('[data-ripresa]').textContent()))
await page.click('[data-ripresa] [data-azione="scorda"]')
uguale('«lascio perdere» toglie la carta', await page.locator('[data-ripresa]').count(), 0)
await attendi(page, 500)
uguale('e la sosta', (await leggiProfilo(page)).campagne.pozioni.sosta, undefined)

uguale('nessun errore in console', errori.join(' · '), '')
await browser.close()
riassunto('pozioni — la tappa lasciata a metà, nel browser')
