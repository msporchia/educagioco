/* ═══════════════════════════════════════════════════════════════════
   LA DATA DI NASCITA — L'ETÀ SI TIENE AGGIORNATA, MA SENZA CAMBIARE I GIOCHI DA SOLA

   Nel modulo del bambino nuovo c'è mese e anno (facoltativi); nelle impostazioni c'è «Quando è nato». Se la data dice un'età diversa da
   quella su cui il gioco è tarato: nella stessa fascia si aggiorna in silenzio, se cambia la fascia c'è un avviso nella posta dei grandi
   e la scelta (passare o tenerla) si fa dalle impostazioni, con l'anteprima. Docs: docs/genitori/riordino.md.
   `node test/esegui.mjs nascita --niente-build`
   tempo: 40
   ═══════════════════════════════════════════════════════════════════ */
import { apriBrowser, apriGioco, semina, attendi, leggiProfilo } from '../aiuto/browser.mjs'
import { controlla, uguale, riassunto } from '../aiuto/verifica.mjs'

const browser = await apriBrowser()
const oggi = new Date()
/* nato questo mese, `n` anni fa: oggi ha esattamente n anni */
const nato = n => ({ m: oggi.getMonth(), a: oggi.getFullYear() - n })

const digita = async (page, pin) => { for (const c of pin) await page.click(`.tasto >> text="${c}"`) }
async function daiGrandi(page, scheda = 'giochi') {
  await page.click('[data-azione="grandi"]')
  await page.waitForSelector('.tastierino', { timeout: 5000 })
  await digita(page, '0000')
  await page.waitForSelector('.carte', { timeout: 8000 })
  await page.click(`[data-scheda="${scheda}"]`)
}

/* ── il bambino nuovo con la data ── */
{
  const { page, errori } = await apriGioco(browser, { giocatori: null, attesa: '.benvenuto' })
  await page.fill('.benvenuto .nome', 'Prova')
  await page.click('.benvenuto .via')
  await page.waitForSelector('[data-nascita-domanda]', { timeout: 5000 })
  controlla('la data è facoltativa: senza, la frase lo dice', /Senza/.test(await page.locator('[data-nascita-domanda]').innerText()))
  await page.selectOption('[data-nascita-mese]', String(nato(7).m))
  await page.selectOption('[data-nascita-anno]', String(nato(7).a))
  await page.waitForSelector('[data-nascita-eta]', { timeout: 3000 })
  controlla('con la data dice quanti anni ha', /7 anni/.test(await page.locator('[data-nascita-eta]').innerText()))
  uguale('e la manopola si mette lì', (await page.locator('[data-eta-ora]').innerText()).trim(), '7 anni')
  await page.click('[data-azione="si-gioca"]')
  await page.waitForSelector('.carte', { timeout: 8000 })
  await attendi(page, 700)
  // il bambino nuovo ha un id che non conosciamo: è l'unico profilo in archivio
  const id = await page.evaluate(() => new Promise(ok => {
    const r = indexedDB.open('giochi-bambini', 1)
    r.onsuccess = () => { const k = r.result.transaction('kv', 'readonly').objectStore('kv').getAllKeys(); k.onsuccess = () => ok(k.result.find(x => String(x).startsWith('profilo:')).slice(8)) }
  }))
  const p = await leggiProfilo(page, id)
  controlla('il profilo ha la data e l\'età', p?.settings?.nascita?.a === nato(7).a && p.settings.nascita.m === nato(7).m && p.settings.eta === 7, JSON.stringify(p?.settings))
  uguale('e nessuno scarto: i giochi sono tarati sui suoi anni', p.settings.scarto, 0)
  controlla('nessun errore in console', errori.length === 0, errori.join(' | '))
  await page.close()
}

/* ── un compleanno nella stessa fascia: si aggiorna in silenzio ── */
{
  const { page } = await apriGioco(browser)
  await semina(page, { settings: { eta: 9, nascita: nato(10), scarto: 0 } })
  await attendi(page, 1500)
  await attendi(page, 700)
  uguale('9 e 10 anni sono la stessa fascia: l\'età va a 10 da sola', (await leggiProfilo(page)).settings.eta, 10)
  controlla('e nessun avviso per i grandi', await page.locator('[data-nastro="posta"]').count() === 0)
  await page.close()
}

/* ── un compleanno che cambia fascia: un avviso, e la scelta nelle impostazioni ── */
{
  const { page } = await apriGioco(browser)
  await semina(page, { settings: { eta: 7, nascita: nato(9), scarto: 0 } })
  await page.waitForSelector('[data-nastro="posta"]', { timeout: 6000 })
  controlla('in home il nastro per i grandi, senza dire cosa', await page.locator('[data-nastro="posta"]').isVisible())
  uguale('l\'età non si è mossa da sola', (await leggiProfilo(page)).settings.eta, 7)
  await daiGrandi(page, 'bambini')
  await page.waitForSelector('[data-posta]', { timeout: 5000 })
  controlla('nella posta: dice 9 anni e non cambia niente da solo', /9 anni/.test(await page.locator('[data-posta]').innerText()) && /Non cambio niente/.test(await page.locator('[data-posta]').innerText()))
  await page.click('[data-scheda="bambini"]')
  await page.waitForSelector('[data-nascita-avviso]', { timeout: 5000 })
  const avviso = await page.locator('[data-nascita-avviso]').innerText()
  controlla('nelle impostazioni dice cosa succede passando ai 9 anni', /9 anni/.test(avviso) && /7/.test(avviso), avviso)
  await page.click('[data-azione="nascita-tieni"]')
  await attendi(page, 800)
  controlla('«tienilo a 7»: l\'avviso sparisce e resta lo scarto di due anni', await page.locator('[data-nascita-avviso]').count() === 0 && /due anni più indietro|2 anni più indietro/.test(await page.locator('[data-nascita-scarto]').innerText()), await page.locator('[data-nascita]').innerText())
  uguale('e nel profilo lo scarto è −2', (await leggiProfilo(page)).settings.scarto, -2)
  await page.close()
}
{
  const { page } = await apriGioco(browser)
  await semina(page, { settings: { eta: 7, nascita: nato(9), scarto: 0 } })
  await daiGrandi(page, 'bambini')
  await page.waitForSelector('[data-nascita-avviso]', { timeout: 5000 })
  await page.click('[data-azione="nascita-passa"]')
  await page.waitForSelector('[data-conferma]', { timeout: 3000 }).catch(() => {})
  await attendi(page, 900)
  const e = (await leggiProfilo(page)).settings.eta
  controlla('«passa ai 9 anni»: l\'età va a 9 (con la conferma della manopola, se serve)', e === 9 || await page.locator('[data-conferma]').count() > 0, String(e))
  await page.close()
}

/* ── una data messa dopo, su un profilo che c'era già ── */
{
  const { page, errori } = await apriGioco(browser)
  await semina(page, { settings: { eta: 8 } })
  await daiGrandi(page, 'bambini')
  await page.waitForSelector('[data-nascita]', { timeout: 5000 })
  controlla('senza data la carta la chiede', await page.locator('[data-nascita-mese]').count() === 1)
  await page.selectOption('[data-nascita-mese]', String(nato(8).m))
  await page.selectOption('[data-nascita-anno]', String(nato(8).a))
  await page.click('[data-azione="nascita-salva"]')
  await page.waitForSelector('[data-nascita-eta]', { timeout: 3000 })
  controlla('la data si ricorda e dice 8 anni', /8 anni/.test(await page.locator('[data-nascita-eta]').innerText()))
  controlla('l\'età combacia: nessun avviso', await page.locator('[data-nascita-avviso]').count() === 0)
  await attendi(page, 700)
  uguale('nel profilo lo scarto è zero', (await leggiProfilo(page)).settings.scarto, 0)
  await page.click('[data-azione="nascita-togli"]')
  await page.waitForSelector('[data-nascita-mese]', { timeout: 3000 })
  controlla('si può togliere', await page.locator('[data-nascita-mese]').count() === 1)
  controlla('nessun errore in console', errori.length === 0, errori.join(' | '))
  await page.close()
}

await browser.close()
riassunto('la data di nascita')
