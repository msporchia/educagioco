/* ═══════════════════════════════════════════════════════════════════
   IL SOTTERRANEO, TOCCATO COL DITO

   Il test unitario gioca le sei discese e conta le domande; questo dice
   che **il dito ci arriva**: che la carta compaia in home coi giochi in
   prova accesi, che il campo si disegni davvero (un canvas nero non dà
   nessun errore e sembra a posto in ogni altro controllo), che un tocco
   faccia camminare, e che il foglio dello zaino salga e scenda.

   I tocchi si mandano **come tocchi** (`Input.dispatchTouchEvent` via
   CDP) e non con `page.click()`: alzato il dito il browser manda anche
   un `click`, e lo manda a chi sta sotto il dito in quel momento — cioè
   al foglio appena aperto, che si prenderebbe il tocco su un tasto che
   nessuno ha premuto. Col mouse non succede, ed è il motivo per cui
   quel guasto si vede solo dal telefono.

   Quello che qui **non** si prova è il foglio che si apre toccando una
   cosa nel campo: dov'è quella cosa a schermo lo sa solo il gioco, e un
   tocco a caso che a volte la prende e a volte no sarebbe un test che
   racconta storie diverse. Quel pezzo lo copre `unita/sotterraneo`, che
   tocca le cose per riferimento invece che per coordinate.
   `node test/esegui.mjs sotterraneo`
   tempo: 60
   ═══════════════════════════════════════════════════════════════════ */
import { apriBrowser, apriGioco, azzera, semina, scatto, attendi }
  from '../aiuto/browser.mjs'
import { controlla, uguale, nota, riassunto } from '../aiuto/verifica.mjs'

const browser = await apriBrowser()
const { page, errori } = await apriGioco(browser)
await azzera(page)

await semina(page, { coins: 300, settings: { sperimentali: true } })


/* ---------- 1. la carta, e le sei discese ---------- */
const carta = page.locator('.carta.gioco[data-gioco="sotterraneo"]')
controlla('la carta è in home coi giochi in prova accesi', await carta.count() === 1)
await carta.click()
await page.waitForSelector('.sot-tappe', { timeout: 5000 })
uguale('ci sono sei discese', await page.locator('.sot-tappa').count(), 6)
controlla('solo la prima è aperta',
          await page.locator('.sot-tappa:not([disabled])').count() === 1)

await page.locator('.sot-tappa[data-tappa="0"]').click()
await page.waitForSelector('.sot-tela', { timeout: 5000 })
await attendi(page, 600)

/* ---------- 2. il campo si disegna ----------
   Un canvas nero non dà nessun errore: si contano i pixel accesi, che è
   l'unico modo di accorgersi che «funziona» ma non si vede niente. */
const acceso = await page.evaluate(() => {
  const c = document.querySelector('.sot-tela')
  const d = c.getContext('2d').getImageData(0, 0, c.width, c.height).data
  let n = 0
  for (let i = 0; i < d.length; i += 160) if (d[i] > 24 || d[i + 1] > 24) n++
  return n
})
controlla('il sotterraneo si vede, non è tutto nero', acceso > 200, `${acceso} campioni accesi`)
controlla('e la fascia dice a che piano si è',
          (await page.locator('.sot-piede').textContent()).includes('piano 1'))
await scatto(page, 'sotterraneo-campo')

/* ---------- 3. un tocco fa camminare ---------- */
const cdp = await page.context().newCDPSession(page)
const box = await page.locator('.sot-tela').boundingBox()
async function tocca(x, y) {
  const punti = [{ x, y }]
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: punti })
  await attendi(page, 60)
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] })
}

/* Attorno all'eroe, e da più parti: un tocco solo può cadere sulla
   roccia — di là non si passa, e non si è mosso niente senza che niente
   sia rotto. Si prova in quattro versi e basta che uno cambi la
   scena, che è quello che farebbe anche un bambino. */
const attorno = () => page.evaluate(() => {
  const c = document.querySelector('.sot-tela')
  return c.getContext('2d').getImageData(c.width / 2 - 60, c.height / 2 - 60, 120, 120).data.join()
})
const prima = await attorno()
let mosso = false
for (const [dx, dy] of [[0, -70], [70, 0], [0, 70], [-70, 0]]) {
  await tocca(box.x + box.width / 2 + dx, box.y + box.height / 2 + dy)
  await attendi(page, 800)
  if (await attorno() !== prima) { mosso = true; break }
}
controlla('dopo un tocco l\'eroe si è mosso', mosso)

/* ---------- 4. lo zaino sale e scende ---------- */
await page.locator('[data-azione="zaino"]').click()
await page.waitForSelector('.sot-foglio', { timeout: 3000 })
uguale('lo zaino ha sei tasche', await page.locator('.sot-tasca').count(), 6)
await page.locator('[data-azione="chiudi"]').click()
await attendi(page, 300)
uguale('e si richiude', await page.locator('.sot-foglio').count(), 0)

/* ---------- 5. si esce a metà, e la discesa resta lì ----------
   La cosa che rende giocabile una discesa da venti minuti: si chiude e
   si riprende. Il giro si prova **dall'archivio vero** — si esce, si
   torna alla mappa, si riprende — perché il salvataggio passa dal
   profilo e il test unitario quel pezzo non lo tocca. */
await page.locator('button[aria-label="indietro"]').click()
await page.waitForSelector('.sot-tappe', { timeout: 5000 })
controlla('uscendo a metà la discesa resta in sospeso',
          await page.locator('[data-ripresa]').count() === 1)
controlla('e la carta dice a che piano si era',
          (await page.locator('.sot-ripresa .sot-dove').textContent()).includes('piano 1'))

/* ---------- 6. la seconda discesa si vede come la prima ----------
   Tornando alle discese il `v-if` smonta il campo, quindi la discesa
   dopo trova **un altro canvas**: un pittore rimasto agganciato al primo
   continuava a dipingere su una tela staccata dal DOM. Niente errori,
   niente di rotto in nessun altro controllo — solo lo schermo nero, e
   solo dalla seconda in poi. Per questo il conto dei pixel si rifà
   invece di darlo per buono al primo giro. */
await page.locator('[data-azione="riprendi"]').click()
await page.waitForSelector('.sot-tela', { timeout: 5000 })
await attendi(page, 600)
const ancora = await page.evaluate(() => {
  const c = document.querySelector('.sot-tela')
  const d = c.getContext('2d').getImageData(0, 0, c.width, c.height).data
  let n = 0
  for (let i = 0; i < d.length; i += 160) if (d[i] > 24 || d[i + 1] > 24) n++
  return n
})
controlla('anche la discesa ripresa si vede', ancora > 200, `${ancora} campioni accesi`)

/* ---------- 7. e si può anche lasciar perdere ---------- */
await page.locator('button[aria-label="indietro"]').click()
await page.waitForSelector('.sot-tappe', { timeout: 5000 })
await page.locator('[data-azione="scorda"]').click()
await attendi(page, 300)
uguale('lasciata perdere, la carta sparisce', await page.locator('[data-ripresa]').count(), 0)
await page.locator('.sot-tappa[data-tappa="0"]').click()
await page.waitForSelector('.sot-tela', { timeout: 5000 })
controlla('e si ricomincia senza che nessuno chieda niente',
          await page.locator('.sot-velo').count() === 0)

uguale('nessun errore in console', errori.join(' · '), '')
nota('il tocco che apre un foglio dal campo lo prova unita/sotterraneo')

await browser.close()
riassunto('il sotterraneo col dito')
