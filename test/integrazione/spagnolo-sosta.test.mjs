/* La tappa di spagnolo lasciata a metà, nel browser: si esce con ←, si rientra, la
   mappa offre in cima «torno da dove ero» e la tappa riprende con la stessa
   domanda, le stesse giuste e le monete già prese (nessuna pagata due volte).
   Anche dopo aver ricaricato la pagina, e mai in silenzio: una tappa nuova
   chiede prima di buttarla. Una tappa vinta toglie la carta.
   Vedi docs/lingue/sosta.md.
   `node test/esegui.mjs spagnolo-sosta` */
import { apriBrowser, apriGioco, azzera, semina, attendi, leggiProfilo, scatto } from '../aiuto/browser.mjs'
import { controlla, uguale, riassunto } from '../aiuto/verifica.mjs'

const PRIMA = 'prima-colores'
const SECONDA = 'prima-animales'
const TERZA = 'prima-juguetes'
const browser = await apriBrowser()
const { page, errori } = await apriGioco(browser)
await azzera(page)
// la prima tappa vinta: la seconda è aperta, e si può cominciare l'una o l'altra
await semina(page, { coins: 50, campagne: { spagnolo: { tappa: 1, libera: false, stelle: {}, cfg: {},
                                                        vinte: { [PRIMA]: Date.now() - 86400000 } } } })

async function entra() {
  await page.click('.carta.gioco[data-gioco="spagnolo"]')
  await page.waitForSelector('[data-mappa-inglese] [data-tappa]')
}
const esci = async () => {
  await page.click('button[aria-label="indietro"]')
  await page.waitForSelector('[data-mappa-inglese]')
}
const monete = async () => { await attendi(page, 500); return (await leggiProfilo(page)).coins }
const conto = () => page.locator('[data-conto]').innerText().then(t => t.replace(/\s+/g, ' ').trim())
const domanda = () => page.locator('[data-domanda]').evaluate(e => e.innerText.replace(/\s+/g, ' ').trim())
async function rispondi(giusta = true) {
  await page.waitForSelector('[data-domanda]')
  await attendi(page, 400)                                   // la finestra cieca
  await page.locator(`[data-domanda] [data-opzione]${giusta ? '[data-giusta]' : ':not([data-giusta])'}`).first().click()
  await page.waitForSelector(`[data-esito="${giusta ? 'giusta' : 'sbagliata'}"]`)
  // l'esito se ne va, o l'ultima giusta lascia il posto al cartello
  await page.waitForFunction(() => !document.querySelector('[data-esito]') || document.querySelector('[data-fine]'),
                             null, { timeout: 9000 })
}

/* ---------- una tappa a metà: tre giuste, uno sbaglio, la quinta domanda aperta ---------- */
await entra()
uguale('senza tappe a metà la carta non c\'è', await page.locator('[data-ripresa]').count(), 0)
const m0 = await monete()
await page.locator(`[data-tappa="${PRIMA}"]`).click()
for (let i = 0; i < 3; i++) await rispondi(true)
await rispondi(false)
await page.waitForSelector('[data-domanda]')
await attendi(page, 300)
const lasciata = await domanda()
const contoLasciato = await conto()
const m1 = await monete()
controlla('le tre giuste hanno pagato', m1 > m0, `${m0} → ${m1}`)
controlla('la prova parte da tre giuste', /^✅ 3 \//.test(contoLasciato), contoLasciato)

/* ← in mezzo alla tappa: si torna alla mappa, e la carta c'è */
await esci()
await page.waitForSelector('[data-ripresa]')
const carta = await page.locator('[data-ripresa]').innerText()
controlla('la carta dice dove si era', /✅ 3 di \d+/.test(carta), carta)
await scatto(page, 'spagnolo-ripresa')
uguale('uscire non ha pagato né tolto niente', await monete(), m1)

await page.click('[data-ripresa] [data-azione="riprendi"]')
await page.waitForSelector('[data-domanda]')
uguale('si riprende con la stessa domanda, risposte comprese', await domanda(), lasciata)
uguale('con le stesse giuste', await conto(), contoLasciato)
uguale('la carta sparisce', await page.locator('[data-ripresa]').count(), 0)
uguale('rientrare non ha pagato niente', await monete(), m1)
await rispondi(true)
controlla('una giusta in più conta una volta e paga una volta',
          (await monete()) > m1 && /^✅ 4 \//.test(await conto()), await conto())
await page.waitForSelector('[data-domanda]')

/* ---------- la pagina che sparisce: il telefono in tasca, l'app chiusa ---------- */
const lasciata2 = await domanda()
await page.evaluate(() => window.dispatchEvent(new Event('pagehide')))
await attendi(page, 500)
await page.reload()
await page.waitForSelector('.carte')
await entra()
uguale('anche dopo aver ricaricato la pagina la carta c\'è', await page.locator('[data-ripresa]').count(), 1)
await page.click('[data-ripresa] [data-azione="riprendi"]')
await page.waitForSelector('[data-domanda]')
uguale('e la domanda è quella', await domanda(), lasciata2)
uguale('e le giuste anche', (await conto()).slice(0, 3), '✅ 4')

/* ---------- toccare un'altra tappa non butta la sosta in silenzio ---------- */
await esci()
await page.waitForSelector('[data-ripresa]')
await page.locator(`[data-tappa="${SECONDA}"]`).click()
await page.waitForSelector('[data-chiede]')
uguale('una tappa nuova chiede prima', await page.locator('[data-chiede]').count(), 1)
await page.click('[data-chiede] [data-azione="riprendi-invece"]')
await page.waitForSelector('[data-domanda]')
uguale('«torno a quella di prima» riprende la prima', await domanda(), lasciata2)
await esci()
await page.locator(`[data-tappa="${SECONDA}"]`).click()
await page.waitForSelector('[data-chiede]')
await page.click('[data-chiede] [data-azione="comincia"]')
await page.waitForSelector('[data-domanda]')
uguale('scelta la nuova, si gioca quella da capo', (await conto()).slice(0, 3), '✅ 0')
await esci()
await page.waitForSelector('[data-ripresa]')
controlla('e la carta parla della nuova', (await page.locator('[data-ripresa]').innerText()).includes('✅ 0 di'))
await page.click('[data-ripresa] [data-azione="scorda"]')
uguale('«lascio perdere» toglie la carta', await page.locator('[data-ripresa]').count(), 0)

/* ---------- una tappa vinta non lascia niente: la carta non torna ---------- */
const m2 = await monete()
await page.locator(`[data-tappa="${SECONDA}"]`).click()
let fatte = 0
while (!(await page.locator('[data-fine]').count()) && fatte++ < 40) {
  await page.waitForSelector('[data-domanda], [data-fine]')
  if (await page.locator('[data-fine]').count()) break
  await rispondi(true)
  // ← a metà, una volta: rientrando si riprende e si continua, senza pagare due volte
  if (fatte === 3) {
    await esci()
    await page.click('[data-ripresa] [data-azione="riprendi"]')
  }
}
await page.waitForSelector('[data-fine]', { timeout: 9000 })
const premio = await page.locator('[data-monete-fine]').getAttribute('data-monete').catch(() => null)
const guadagnate = (await monete()) - m2
if (premio !== null) uguale('il cartello dice tutte le monete della tappa, anche di prima della sosta', Number(premio), guadagnate)
else controlla('le monete sono state pagate una volta sola', guadagnate > 0, String(guadagnate))
await page.click('[data-fine] [data-azione="mappa"]')
await page.waitForSelector('[data-mappa-inglese]')
uguale('vinta la tappa, la carta non c\'è', await page.locator('[data-ripresa]').count(), 0)
const profilo = await leggiProfilo(page)
controlla('e la tappa è segnata vinta', !!(profilo.campagne.spagnolo.vinte || {})[SECONDA])
controlla('e nessuna sosta resta nel profilo', !profilo.campagne.spagnolo.sosta)

/* ---------- uscire subito dopo l'ultima giusta non perde la vittoria ---------- */
await page.locator(`[data-tappa="${TERZA}"]`).click()
for (;;) {
  await page.waitForSelector('[data-domanda]')
  const [g, b] = (await conto()).match(/(\d+) \/ (\d+)/).slice(1).map(Number)
  if (g === b - 1) break
  await rispondi(true)
}
await attendi(page, 400)
await page.locator('[data-domanda] [data-opzione][data-giusta]').first().click()
await page.click('button[aria-label="indietro"]')          // prima del cartello, a esito in corso
await page.waitForSelector('[data-mappa-inglese]')
uguale('uscito a risposta finale data, la carta non c\'è', await page.locator('[data-ripresa]').count(), 0)
const dopo = await leggiProfilo(page)
controlla('e la tappa è vinta', !!(dopo.campagne.spagnolo.vinte || {})[TERZA])
controlla('senza una sosta nel profilo', !dopo.campagne.spagnolo.sosta)

uguale('nessun errore in console', errori.join(' · '), '')
await browser.close()
riassunto('spagnolo — la tappa lasciata a metà, nel browser')
