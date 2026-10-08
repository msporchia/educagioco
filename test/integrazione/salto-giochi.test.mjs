/* ═══════════════════════════════════════════════════════════════════
   IL TASTO «SALTA» DENTRO I GIOCHI: NON SPORCA NIENTE

   Ogni gioco che fa domande ha il suo «⏭️ salta», e in ognuno vale la
   stessa regola: la partita va avanti come se avesse risposto bene, ma
   **il profilo non cambia** — né il ripasso (`items`), né le monete, né i
   contatori e i record (`totals`, `best`). Si prova guardando il profilo
   su disco prima e dopo il salto, gioco per gioco: un salto che si
   limitasse a chiamare «la risposta giusta» passerebbe da tutti i
   controlli di schermo e pagherebbe, annoterebbe e conterebbe.
   La leva si accende da `#admin` (`salto`); qui si scrive in archivio
   come farebbe il tocco, per non rifare il giro in ogni gioco.
   Il sotterraneo, che vuole un piano e una porta, sta in
   `salto-sotterraneo`. Vedi docs/core/comandi.md.
   `node test/esegui.mjs salto-giochi --niente-build`
   tempo: 120
   ═══════════════════════════════════════════════════════════════════ */
import { apriBrowser, apriGioco, azzera, semina, attendi, scegli, leggiProfilo, giocaGiornata }
  from '../aiuto/browser.mjs'
import { controlla, uguale, nota, riassunto } from '../aiuto/verifica.mjs'

const browser = await apriBrowser()
const { page, errori } = await apriGioco(browser)
await azzera(page)

/* accende la leva come la accenderebbe #admin: la stessa chiave, lo stesso oggetto */
async function accendiLaLeva() {
  await page.evaluate(() => new Promise((ok, ko) => {
    const r = indexedDB.open('giochi-bambini', 1)
    r.onerror = () => ko(new Error('IndexedDB non si apre'))
    r.onsuccess = () => {
      const tx = r.result.transaction('kv', 'readwrite')
      tx.objectStore('kv').put({ acceso: true }, 'tasto-salta')
      tx.oncomplete = ok
      tx.onerror = () => ko(new Error('scrittura fallita'))
    }
  }))
}
/* il profilo senza quello che si muove da sé: il ripasso, il salvadanaio, i contatori, i record */
const foto = async () => {
  await attendi(page, 800)                          // l'archivio scrive a scatto ritardato
  const p = (await leggiProfilo(page)) || {}
  return JSON.stringify({ items: p.items || {}, coins: p.coins || 0, totals: p.totals || {}, best: p.best || {} })
}
const salta = page.locator('[data-azione="salta"]')
/* si riparte da zero, con la leva accesa e un profilo di quell'età */
async function nuovo(profilo = { settings: { eta: 8 } }) {
  await azzera(page)
  await accendiLaLeva()
  await semina(page, profilo)
}
async function tornaInHome() {
  await page.evaluate(() => history.replaceState(null, '', location.pathname))
  await page.reload()
  await page.waitForSelector('.carte', { timeout: 10000 })
}

/* ---------- 1. asteroidi ---------- */
await nuovo()
await scegli(page, 'mate')
await page.waitForFunction(() => window.__mate, null, { timeout: 5000 })
await page.evaluate(() => window.__mate.inizia(0))
await page.waitForFunction(() => window.__mate.fase.value === 'gioco', null, { timeout: 5000 })
await attendi(page, 500)
{
  controlla('asteroidi: il tasto c\'è', await salta.isVisible())
  const prima = await foto()
  await salta.click()
  await attendi(page, 300)
  uguale('asteroidi: il sasso giusto è dato per centrato', await page.evaluate(() => window.__mate.hud.giuste), 1)
  uguale('asteroidi: senza punti', await page.evaluate(() => window.__mate.hud.punti), 0)
  uguale('asteroidi: senza filotto', await page.evaluate(() => window.__mate.hud.serie), 0)
  uguale('asteroidi: ripasso, monete e contatori intatti', await foto(), prima)
}

/* ---------- 2. castello ---------- */
await nuovo()
await scegli(page, 'torri')
await page.waitForSelector('.tappe')
await page.evaluate(() => window.__td.inizia(0))
await attendi(page, 800)
await page.evaluate(() => window.__td.scegliTorre('add'))
await page.waitForSelector('.tastiera button', { timeout: 3000 })
{
  controlla('castello: il conto ha il suo tasto', await salta.isVisible())
  const prima = await foto()
  await salta.click()
  await attendi(page, 400)
  uguale('castello: il conto si chiude', await page.evaluate(() => window.__td.op.value), null)
  controlla('castello: e la torre c\'è', await page.evaluate(() => window.__td.torri().length) === 1)
  /* la torre è costruita davvero, e `totals.torri` conta le torri in piedi, non le risposte: sale di uno.
     Tutto il resto del profilo resta com'era. */
  const dopo = JSON.parse(await foto()), era = JSON.parse(prima)
  uguale('castello: le torri costruite sono una', dopo.totals.torri, era.totals.torri + 1)
  dopo.totals.torri = era.totals.torri
  uguale('castello: ripasso, monete e contatori intatti', JSON.stringify(dopo), JSON.stringify(era))
}

/* ---------- 3. bancarella ---------- */
await nuovo()
await scegli(page, 'bancarella')
await page.waitForSelector('[data-mondo]', { timeout: 5000 })
await giocaGiornata(page, 'banchetto')
await page.waitForFunction(() => !window.__shop.cambio.value, null, { timeout: 5000 })
await page.evaluate(() => {
  const S = window.__shop
  for (let i = 0; i < 40 && S.daPrendere.value.length; i++) S.prendi(S.daPrendere.value[0])
})
await page.waitForFunction(() => window.__shop.momento.value === 'cassa', null, { timeout: 3000 })
{
  const inFila = () => page.evaluate(() => window.__shop.coda.value.length)
  const prima = await foto()
  const quanti = await inFila()
  controlla('bancarella: la cassa ha il suo tasto', await salta.isVisible())
  await salta.click()
  await page.waitForFunction(n => window.__shop.coda.value.length < n || !!window.__shop.cambio.value, quanti,
                             { timeout: 4000 })
  uguale('bancarella: nessun cliente servito', await page.evaluate(() => window.__shop.hud.serviti), 0)
  uguale('bancarella: ripasso, monete e contatori intatti', await foto(), prima)
}

/* ---------- 4. pozioni ---------- */
await nuovo()
await scegli(page, 'pozioni')
await page.locator('.pz-tappa[data-tappa="0"]').click()
await page.waitForSelector('[data-vista="banco"]', { timeout: 5000 })
await attendi(page, 700)
{
  const prima = await foto()
  controlla('pozioni: il banco ha il suo tasto', await salta.isVisible())
  await salta.click()
  await attendi(page, 300)
  uguale('pozioni: la dose è fatta', await page.evaluate(() => window.__poz.partita.value.dosi.length), 1)
  uguale('pozioni: senza monete', await page.evaluate(() => window.__poz.partita.value.monete), 0)
  uguale('pozioni: ripasso, monete e contatori intatti', await foto(), prima)
  // saltando tutto la tappa si chiude
  for (let i = 0; i < 60 && !(await page.locator('[data-fine="tappa"]').count()); i++) {
    await attendi(page, 500)
    if (await salta.count()) await salta.click().catch(() => {})
  }
  controlla('pozioni: saltando tutte le dosi la tappa finisce', await page.locator('[data-fine="tappa"]').count() === 1)
}

/* ---------- 5. conta gli animali ---------- */
await nuovo({ settings: { eta: 5 } })
await scegli(page, 'conta')
await page.locator('.ct-tappa[data-tappa="0"]').click()
await page.waitForSelector('.ct-scena', { timeout: 5000 })
await attendi(page, 500)
{
  const prima = await foto()
  controlla('conta: la domanda ha il suo tasto', await salta.isVisible())
  await salta.click()
  await attendi(page, 300)
  const dopo = (await leggiProfilo(page))?.campagne?.conta?.sosta
  controlla('conta: la tappa è andata avanti', dopo ? dopo.fatte === 1 : true, JSON.stringify(dopo))
  uguale('conta: ripasso, monete e contatori intatti', await foto(), prima)
  for (let i = 0; i < 20 && !(await page.locator('.ct-velo').count()); i++) {
    if (await salta.count()) await salta.click().catch(() => {})
    await attendi(page, 300)
  }
  controlla('conta: saltando tutto la tappa finisce', await page.locator('.ct-velo').count() === 1)
}

/* ---------- 6. prima e dopo ---------- */
await nuovo({ settings: { eta: 5 } })
await scegli(page, 'prima')
await page.locator('.pd-tappa[data-tappa="0"]').click()
await page.waitForSelector('.pd-storia', { timeout: 5000 })
await attendi(page, 500)
{
  const prima = await foto()
  controlla('prima e dopo: la storia ha il suo tasto', await salta.isVisible())
  await salta.click()
  await attendi(page, 300)
  uguale('prima e dopo: ripasso, monete e contatori intatti', await foto(), prima)
  for (let i = 0; i < 30 && !(await page.locator('.pd-velo[data-fine="tappa"]').count()); i++) {
    if (await salta.count()) await salta.click().catch(() => {})
    await attendi(page, 500)
  }
  controlla('prima e dopo: saltando tutto la tappa finisce',
            await page.locator('.pd-velo[data-fine="tappa"]').count() === 1)
}

/* ---------- 7. codice segreto ---------- */
await nuovo({ settings: { eta: 8 } })
await scegli(page, 'codice')
await page.locator('.cs-tappa[data-tappa="0"]').click()
await page.waitForSelector('[data-velo="spiegazione"]', { timeout: 5000 })
await page.locator('[data-velo="spiegazione"] .cs-grosso').click()
await page.waitForSelector('.cs-tasto', { timeout: 5000 })
{
  const prima = await foto()
  controlla('codice segreto: il tavolo ha il suo tasto', await salta.isVisible())
  await salta.click()
  await page.waitForSelector('.cs-velo', { timeout: 5000 })
  uguale('codice segreto: ripasso, monete e contatori intatti', await foto(), prima)
}

/* ---------- 8. inglese ---------- */
await nuovo({ settings: { eta: 6.5 } })
await scegli(page, 'inglese')
await page.waitForSelector('[data-mappa-inglese] [data-tappa]', { timeout: 5000 })
await page.locator('[data-tappa="prima-colori"]').click()
await page.waitForSelector('[data-domanda]', { timeout: 5000 })
await attendi(page, 500)
{
  const prima = await foto()
  controlla('inglese: la domanda ha il suo tasto', await salta.isVisible())
  await salta.click()
  await page.waitForSelector('[data-esito="giusta"]', { timeout: 2000 })
  controlla('inglese: l\'esito dice «saltata»', (await page.locator('[data-esito="giusta"]').innerText()).includes('Saltata'))
  controlla('inglese: la barra della tappa è avanzata',
            /^✅ 1 \//.test((await page.locator('[data-conto]').innerText()).trim()))
  uguale('inglese: ripasso, monete e contatori intatti', await foto(), prima)
}

await tornaInHome()
uguale('nessun errore in console', errori.join(' · '), '')
await browser.close()
nota('asteroidi, castello, bancarella, pozioni, conta, prima e dopo, codice segreto, inglese')
riassunto('il tasto salta dentro i giochi — non sporca niente')
