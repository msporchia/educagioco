/* ═══════════════════════════════════════════════════════════════════
   LA PAUSA, COL DITO — sugli asteroidi

   `integrazione/pausa` prova il pezzo comune sulla corsa; qui si prova
   che gli asteroidi lo usano davvero, e le due cose che di loro sono
   diverse.

   La prima è **il `?`**. C'era da sempre e non fermava niente: si
   apriva il foglio di «come si gioca» e intanto i sassi continuavano a
   scendere sulla nave, cioè leggere la spiegazione costava le vite
   della partita in corso. È il caso che un test unitario non può
   vedere, perché il foglio lo apre la barra e il cielo lo muove un
   `requestAnimationFrame`.

   La seconda è **il cronometro della risposta**. Gli asteroidi non
   contano i secondi con un `setTimeout`: misurano da quando il sasso
   giusto è in scena (`prontaIl`, un istante di parete) a quando lo si
   tocca, e quel numero finisce in `store/srs.js`, che di lì decide
   cos'è difficile e quando ripassarlo. Con la partita ferma dietro il
   velo il cronometro continuava a correre: mezz'ora col telefono in
   tasca e 7×8 risultava un calcolo da mezz'ora di riflessione, per
   sempre e con un campione solo. Qui la pausa dura cinque secondi, che
   bastano a distinguerlo da qualunque esitazione vera.

   Che i sassi stiano fermi si guarda sulle loro `y` (`__mate`), e non
   sul punteggio: durante la pausa il punteggio non si muove nemmeno se
   il cielo scende: si muove solo quando qualcuno tocca.

   `node test/esegui.mjs pausa-asteroidi --niente-build`
   tempo: 60
   ═══════════════════════════════════════════════════════════════════ */
import { apriBrowser, apriGioco, azzera, attendi, scatto, leggiProfilo } from '../aiuto/browser.mjs'
import { controlla, uguale, nota, riassunto } from '../aiuto/verifica.mjs'

const browser = await apriBrowser()
const { page, errori } = await apriGioco(browser)
await azzera(page)

/* dove stanno i sassi, in una riga sola: è la sola cosa che si muove a
   ogni fotogramma e che nessuno può muovere di nascosto */
const cielo = () => page.evaluate(() => window.__mate.asteroidi()
  .filter(a => !a.morto).map(a => Math.round(a.y)).join(','))
const veli = () => page.locator('[data-pausa]').count()
const bottoni = (nome) => page.locator(`button[aria-label="${nome}"]`)

/* ---------- 1. si entra in una tappa ---------- */
await page.getByText('Asteroidi', { exact: true }).click()
await page.waitForSelector('.scaletta', { timeout: 5000 })
uguale('sulla mappa non c\'è niente da fermare', await bottoni('pausa').count(), 0)

await page.locator('.pianeta').first().click()
await page.waitForSelector('button[aria-label="pausa"]', { timeout: 5000 })
uguale('in volo il ⏸ c\'è', await bottoni('pausa').count(), 1)

/* Il volo non comincia nell'istante in cui si tocca la tappa, e non è un
   difetto: la prima partita in assoluto porta il cartello di un
   traguardo («l'hai provato»), che App.vue tiene a schermo intero per
   tre secondi buoni — e quello adesso ferma il cielo come tutto il
   resto, perché un premio non si paga con una vita. Quindi qui si
   aspetta che i sassi comincino a scendere davvero invece di dare per
   scontato che comincino subito. */
const primaCovata = await cielo()
let mosso = 0
for (let i = 1; i <= 20 && !mosso; i++) {
  await attendi(page, 400)
  if (await cielo() !== primaCovata) mosso = i * 400
}
controlla('e intanto i sassi scendono', mosso > 0, 'fermi per otto secondi')
nota(`il cielo comincia a scendere dopo ${mosso} ms`)

/* ---------- 2. il ⏸ ferma il cielo ---------- */
await bottoni('pausa').click()
uguale('il velo compare', await veli(), 1)

/* il fantasma: il dito che ha premuto ⏸ si lascia dietro un click, che
   arriva a chi sta sotto **in quel momento** — cioè al velo appena nato,
   che si toglierebbe da solo dopo un fotogramma di pausa */
await page.evaluate(() => document.querySelector('[data-azione="riprendi"]')?.click())
uguale('il click che il dito si lascia dietro non la toglie', await veli(), 1)

const fermi = await cielo()
await attendi(page, 1200)
uguale('e i sassi non scendono di un pixel', await cielo(), fermi)
controlla('il velo dice dove si era',
          (await page.locator('[data-pausa]').textContent()).includes('tappa'))
await scatto(page, 'pausa-asteroidi')

/* la pausa vale cinque secondi buoni: è il pezzo che serve al controllo
   sul cronometro, più avanti */
await attendi(page, 3800)
uguale('nemmeno dopo cinque secondi', await cielo(), fermi)

/* ---------- 3. si riprende al tocco ---------- */
await page.locator('[data-azione="riprendi"]').click()
uguale('il velo sparisce', await veli(), 0)
await attendi(page, 500)
controlla('e il cielo riparte', await cielo() !== fermi)

/* ---------- 4. il cronometro della risposta sta fermo col cielo ----------
   Si vola ancora un momento — il cronometro parte da quando il sasso
   giusto è in scena, e dopo tutto quel gelo non c'è ancora arrivato — poi
   si colpisce e si guarda cosa è finito in archivio: `t` è il tempo che
   l'SRS ha registrato per quel calcolo, e da lì decide cos'è difficile e
   quando ripassarlo. Senza questo, nel conto ci sarebbero anche i cinque
   secondi di pausa e i tre del cartello. */
await attendi(page, 4200)
const colpito = await page.evaluate(() => {
  const m = window.__mate
  const giusto = m.asteroidi().find(a => a.ok && !a.morto)
  if (!giusto) return null
  const chiave = m.domanda.chiave
  m.colpisci(giusto)
  return chiave
})
controlla('c\'era un sasso da colpire', !!colpito)
// l'archivio scrive con un ritardo (`save`, 350 ms): senza questa
// attesa si rilegge il profilo di prima del colpo, cioè vuoto
await attendi(page, 900)
const t = (await leggiProfilo(page)).items?.[colpito]?.t
/* La forbice è larga apposta: quello che si sta separando non è un
   secondo da due, è un secondo da dieci — senza la pausa nel conto
   finirebbero anche i cinque secondi di velo e i tre del cartello. E il
   pavimento conta quanto il tetto: `t` che non c'è affatto vuol dire
   tempo zero, cioè un sasso colpito prima di essere raggiungibile. */
controlla('la pausa non finisce nel tempo di risposta',
          t > 0 && t < 6000, `${Math.round(t)} ms per ${colpito}`)
nota(`otto secondi fermo e l'SRS ha segnato ${Math.round(t)} ms`)

/* ---------- 5. col foglio del ? aperto il cielo aspetta ----------
   Il `?` non è una pausa e non mostra il velo — è già un foglio sopra il
   gioco, e due veli uno sull'altro sono un gioco rotto — ma ferma la
   partita lo stesso: leggere come si gioca non deve costare le vite
   della partita che si sta giocando. */
await bottoni('aiuto').click()
await page.waitForSelector('[data-azione="chiudi-aiuto"]', { timeout: 5000 })
uguale('il ? non mette un secondo velo', await veli(), 0)
const letti = await cielo()
await attendi(page, 1200)
uguale('ma il cielo aspetta lo stesso', await cielo(), letti)
await page.locator('[data-azione="chiudi-aiuto"]').click()
await attendi(page, 500)
controlla('e chiuso il foglio si riparte', await cielo() !== letti)

/* ---------- 6. il telefono posato ---------- */
const posa = () => page.evaluate(() => {
  Object.defineProperty(document, 'visibilityState', { value: 'hidden', configurable: true })
  document.dispatchEvent(new Event('visibilitychange', { bubbles: true }))
})
const riprendiIlTelefono = () => page.evaluate(() => {
  Object.defineProperty(document, 'visibilityState', { value: 'visible', configurable: true })
  document.dispatchEvent(new Event('visibilitychange', { bubbles: true }))
})

await posa()
uguale('posare il telefono mette in pausa', await veli(), 1)
const posati = await cielo()
await riprendiIlTelefono()
await attendi(page, 800)
uguale('riaprendo il telefono il volo NON riparte da solo', await veli(), 1)
uguale('e nemmeno di un pixel', await cielo(), posati)

/* ---------- 7. uscire non lascia niente acceso ---------- */
await attendi(page, 400)
await page.locator('[data-azione="riprendi"]').click()
await bottoni('indietro').click()
await page.waitForSelector('.scaletta', { timeout: 5000 })
await posa()
uguale('sulla mappa il velo non compare', await veli(), 0)
await riprendiIlTelefono()
await page.locator('.pianeta').first().click()
await page.waitForSelector('button[aria-label="pausa"]', { timeout: 5000 })
uguale('e la tappa nuova non nasce in pausa', await veli(), 0)
const appena = await cielo()
await attendi(page, 500)
controlla('si vola da subito', await cielo() !== appena)

uguale('nessun errore in console', errori.join(' · '), '')
await browser.close()
riassunto('la pausa degli asteroidi')
