/* ═══════════════════════════════════════════════════════════════════
   L'AVVISO QUANDO UNA DOMANDA VA MALE — dalla home al «Non avvertirmi più»

   Il gioco alleggerisce il muro da sé; se non basta (una domanda che va ancora male dopo la settimana di aiuto, o parecchie insieme) c'è un
   messaggio per i grandi, e al bambino la home dice solo «ho qualcosa da dire al papà e alla mamma». Docs: docs/apprendimento/la-domanda.md,
   docs/genitori/cestino-e-posta.md. `node test/esegui.mjs avviso-difficolta`
   ═══════════════════════════════════════════════════════════════════ */
import { apriBrowser, apriGioco, semina, attendi, GIOCATORE, apriTendine } from '../aiuto/browser.mjs'
import { controlla, uguale, riassunto } from '../aiuto/verifica.mjs'

const browser = await apriBrowser()
const ORA = Date.now(), GIORNO = 86400000
const voce = (ok, err) => ({ s: 1, ok, err, seen: ok + err, t: 6000, last: ORA })
const bene = ['num:confronto', 'num:linea', 'num:ordine', 'ora:intere', 'gri:area', 'sil:rima', 'conn:capisci', 'indizi:forme']
const male = ['num:posiziona', 'ora:quarti', 'capire:indizio']
const items = Object.fromEntries([...bene.map(k => [k, voce(10, 1)]), ...male.map(k => [k, voce(3, 11)])])
/* la settimana di aiuto del gioco è passata da un pezzo e da allora (almeno otto risposte) va ancora male */
const alleggerite = Object.fromEntries(male.map(k => [k, { quando: ORA - 9 * GIORNO, ok: 1, err: 2 }]))

const entra = async page => {
  await page.click('[data-azione="grandi"]')
  await page.waitForSelector('.tastierino', { timeout: 5000 })
  for (const c of '0000') await page.click(`.tasto >> text="${c}"`)
  await page.waitForSelector('nav.barra-giu', { timeout: 5000 })
}

{
  const { page, errori } = await apriGioco(browser)
  await semina(page, { settings: { eta: 8, alleggerite }, items })
  await attendi(page, 6000)          // il controllo parte a quattro secondi dall'avvio
  await page.waitForSelector('[data-posta-pallino]', { timeout: 8000 })
  controlla('al bambino la home dice solo che c\'è qualcosa per mamma e papà', /ho qualcosa da dire al papà e alla mamma/.test(await page.locator('[data-posta-difficolta]').innerText()))
  controlla('senza dire cosa', !/sbagli|difficolt|domande/i.test(await page.locator('[data-azione="grandi"]').innerText()))

  await entra(page)
  await page.waitForSelector('[data-posta]', { timeout: 5000 })
  const testo = await page.locator('[data-posta]').innerText()
  controlla('ai grandi il messaggio dice quale domanda, e cosa fare', /ancora difficoltà con/.test(testo) && /Come va/.test(testo), testo.replace(/\n/g, ' '))
  uguale('è uno solo, non uno per domanda', await page.locator('[data-posta] .nota.avviso').count(), 1)
  controlla('con «Vai a Come va» e «Non avvertirmi più»', await page.locator('[data-posta] [data-azione="posta-vai"]').isVisible() && await page.locator('[data-posta] [data-azione="non-avvertire"]').isVisible())

  /* non torna a ogni avvio: una volta ogni due settimane */
  await page.click('[data-azione="ho-letto"]')
  await page.reload(); await page.waitForSelector('.carte', { timeout: 8000 })
  await attendi(page, 6000)
  uguale('letto, e riaperto il gioco, non ne arriva un altro', await page.locator('[data-posta-pallino]').count(), 0)

  uguale('nessun errore in console', errori.length, 0, errori.join('\n'))
  await page.close()
}
/* «Non avvertirmi più» spegne, e l'interruttore in Avanzate lo dice (e lo riaccende) */
{
  const { page, errori } = await apriGioco(browser)
  await semina(page, { settings: { eta: 8, alleggerite }, items })
  await attendi(page, 6000)
  await entra(page)
  await page.click('[data-posta] [data-azione="non-avvertire"]')
  await attendi(page, 400)
  uguale('«Non avvertirmi più» toglie il messaggio', await page.locator('[data-posta] .nota.avviso').count(), 0)
  await page.click('[data-scheda="impostazioni"]')
  await apriTendine(page)
  controlla('e in Avanzate l\'interruttore è spento', await page.evaluate(() => document.querySelector('.carta[data-flag="avvisi-difficolta"]').className.includes('spento')))
  await page.click('.carta[data-flag="avvisi-difficolta"]')
  await attendi(page, 300)
  controlla('e si può riaccendere', !(await page.evaluate(() => document.querySelector('.carta[data-flag="avvisi-difficolta"]').className.includes('spento'))))
  uguale('nessun errore in console', errori.length, 0, errori.join('\n'))
  await page.close()
}
await browser.close()
riassunto('l\'avviso sulle domande che vanno male')
