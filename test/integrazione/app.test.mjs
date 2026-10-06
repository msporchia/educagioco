import { apriBrowser, apriGioco, scatto, GIOCATORE, ALTRO, scegli } from '../aiuto/browser.mjs'

const browser = await apriBrowser()
const errors = []
const raccolti = []   // gli elenchi degli errori si riempiono mentre il test gira

/* Due giocatori, perché più sotto si prova che i profili non si
   mescolano: con uno solo la fila per cambiare bambino non c'è proprio. */
async function apri(size) {
  const { page, errori } = await apriGioco(browser, { viewport: size,
                                                      giocatori: [GIOCATORE, ALTRO] })
  raccolti.push(errori)
  return page
}

/* ══════════ 1. avvio, archivio, navigazione ══════════ */
const page = await apri({ width: 390, height: 844 })
const avvio = await page.evaluate(() => ({
  // la home non ha più un'intestazione col nome: si guarda chi è acceso
  giocatore: document.querySelector('.fascia [data-nome]')?.textContent,
  giochi: [...document.querySelectorAll('.carta b')].map(x => x.textContent),
  archivio: document.querySelector('.mini,.avviso')?.textContent.trim().slice(0, 40),
}))

/* ══════════ 2. INGLESE: si gioca, le monete arrivano ══════════
   English è la mappa del tesoro (src/giochi/inglese): si entra nella
   prima tappa e si risponde giusto qualche volta, leggendo la risposta
   dal DOM — `data-giusta` sulle opzioni, `data-posto` sulle tessere. */
await scegli(page, 'inglese')
await page.waitForSelector('[data-mappa-inglese] [data-tappa]')
const mappaEn = await page.evaluate(() => ({
  tappe: document.querySelectorAll('[data-tappa]').length,
  aperte: document.querySelectorAll('[data-tappa][data-stato="aperta"]').length,
}))
await page.click('[data-tappa][data-stato="aperta"]')      // la prima aperta: quale sia lo decide l'età
const formati = {}
let giusteEn = 0
for (let i = 0; i < 6; i++) {
  await page.waitForSelector('[data-domanda]')
  await page.waitForTimeout(400)
  const f = await page.locator('[data-domanda]').getAttribute('data-formato')
  formati[f] = (formati[f] || 0) + 1
  if (await page.locator('[data-banco] [data-tessera]').count()) {
    const t = await page.locator('[data-banco] [data-tessera][data-posto]').evaluateAll(
      els => els.map(e => [e.dataset.tessera, +e.dataset.posto]).sort((a, b) => a[1] - b[1]))
    for (const [id] of t) await page.click(`[data-banco] [data-tessera="${id}"]`)
    await page.click('[data-azione="consegna"]')
  } else await page.click('[data-opzione][data-giusta]')
  await page.waitForSelector('[data-esito]')
  if (await page.locator('[data-esito="giusta"]').count()) giusteEn++
  await page.waitForSelector('[data-esito]', { state: 'detached', timeout: 12000 })
}
const inglese = { turni: 6, giuste: giusteEn, formati }
await page.click('.barra-app button[aria-label="indietro"]')
await page.waitForSelector('[data-mappa-inglese]')

const dopoInglese = await page.evaluate(giuste => ({
  monete: +document.querySelector('.gettone b').textContent,
  giuste,
}), giusteEn)

/* ══════════ 3. MATEMATICA ══════════
   Dalla mappa dell'inglese alla home: il tasto indietro è quello della
   barra, uguale in ogni schermata. */
await page.click('.barra-app button[aria-label="indietro"]')
await page.waitForSelector('.carte')
await scegli(page, 'mate')
// non più un menu di spunte: la campagna dei pianeti, e si parte dal primo aperto
await page.waitForSelector('.scaletta')
const mate = await page.evaluate(async () => {
  document.querySelector('.pianeta:not([disabled])').click()
  await new Promise(r => setTimeout(r, 200))
  return { inGioco: !!document.querySelector('.domanda'),
           domanda: document.querySelector('.domanda')?.textContent.replace(/\s+/g, ' ').trim(),
           bersaglio: document.querySelector('.bersaglio')?.textContent.replace(/\s+/g, ' ').trim() }
})

await page.waitForTimeout(400)
await scatto(page, 'app-mate')

/* ══════════ 4. persistenza attraverso un reload ══════════
   La riga da guardare è quella della carta delle tabelline: dice a che
   pianeta è arrivato QUESTO bambino, ed è quindi anche la prova che i
   due profili non si mescolano. */
await page.reload()
await page.waitForSelector('.carte')
const dopoReload = await page.evaluate(() => ({
  riga: document.querySelector('.carta.mate i').textContent.replace(/\s+/g, ' ').trim(),
  giocatore: document.querySelector('.fascia [data-nome]')?.textContent,
}))

/* ══════════ 5. profili separati ══════════
   Si guardano le monete: il primo giocatore ha giocato, il secondo
   no, quindi se i due numeri sono uguali i profili si stanno
   mescolando. La riga dei pianeti da sola non basterebbe — a inizio
   partita sono entrambi al primo. */
const foto = () => page.evaluate(() => ({
  monete: +document.querySelector('.fascia .numeri').textContent.replace(/\D+/g, '').slice(0, 4) || 0,
  pianeta: document.querySelector('.carta.mate i').textContent.replace(/\s+/g, ' ').trim(),
}))
// si cambia bambino dal profilo, che si apre dalla riga in cima alla home
async function cambia(chi) {
  await page.click('[data-azione="profilo"]')
  await page.click(`[data-giocatore="${chi}"]`)
  await page.waitForSelector('.carte')
  await page.waitForTimeout(400)
}
const prima = await foto()
await cambia(ALTRO)
const altro = await foto()
await cambia(GIOCATORE)
const separati = { primo: prima, altro, tornatoAlPrimo: await foto() }

for (const elenco of raccolti) errors.push(...elenco)
console.log(JSON.stringify({ avvio, mappaEn, inglese, dopoInglese, mate,
                             dopoReload, separati, errori: errors }, null, 1))
await browser.close()
