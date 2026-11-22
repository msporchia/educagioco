/* ═══════════════════════════════════════════════════════════════════
   DUE BAMBINI SULLO STESSO TELEFONO: I PROFILI NON SI MESCOLANO

   perché: due bambini sullo stesso telefono: ognuno ritrova le sue monete cambiando dal profilo e dopo una ricarica, che riapre l'ultimo scelto
   a parte perché: `avvio` guarda un solo bambino e la porta d'ingresso; qui servono due profili seminati e il cambio dalla home, che nessun altro file fa
   Due profili con monete diverse; si cambia bambino dal profilo (la
   riga in cima alla home) e ognuno ritrova le sue, anche dopo una
   ricarica, che riapre l'ultimo scelto. Se i numeri si somigliano, i
   profili si stanno mescolando. L'avvio, l'inglese e la mappa delle
   tabelline hanno i loro file (`avvio`, `inglese`, `campagna-mate`).
   `node test/esegui.mjs integrazione/app --niente-build`
   ═══════════════════════════════════════════════════════════════════ */
import { apriBrowser, apriGioco, azzera, semina, leggiProfilo, moneteInHome, GIOCATORE, ALTRO } from '../aiuto/browser.mjs'
import { controlla, uguale, riassunto } from '../aiuto/verifica.mjs'

const browser = await apriBrowser()
const { page, errori } = await apriGioco(browser, { giocatori: [GIOCATORE, ALTRO] })
await azzera(page)
await semina(page, { coins: 120, settings: { eta: 8 } }, GIOCATORE)
await semina(page, { coins: 7, settings: { eta: 8 } }, ALTRO)       // l'ultimo seminato è quello acceso

const ultimoInArchivio = () => page.evaluate(() => new Promise(ok => {
  const r = indexedDB.open('giochi-bambini', 1)
  r.onsuccess = () => { const g = r.result.transaction('kv').objectStore('kv').get('ultimo-giocatore'); g.onsuccess = () => ok(g.result) }
  r.onerror = () => ok(null)
}))
// le monete del bambino acceso: il nome cambia subito, il profilo arriva un attimo dopo; si aspetta il numero atteso
// fino a tre secondi, e si dice quello che c'è
async function moneteSono(n) {
  let v = await moneteInHome(page)
  for (let k = 0; k < 30 && v !== n; k++) { await page.waitForTimeout(100); v = await moneteInHome(page) }
  return v
}
const chiEAcceso = () => page.locator('.fascia [data-nome]').textContent()
// si cambia bambino dal profilo, che si apre dalla riga in cima alla home
async function cambia(chi) {
  await page.click('[data-azione="profilo"]')
  await page.click(`[data-giocatore="${chi}"]`)
  await page.waitForSelector('.carte')
  await page.waitForFunction(c => document.querySelector('.fascia [data-nome]')?.textContent === c, chi, { timeout: 5000 })
    .catch(() => {})              // il controllo sotto dice chi c'è
}

uguale('acceso il secondo bambino', await chiEAcceso(), ALTRO)
uguale('la home dice le sue monete', await moneteSono(7), 7)

await cambia(GIOCATORE)
uguale('cambiato bambino dal profilo, è acceso il primo', await chiEAcceso(), GIOCATORE)
uguale('con le sue monete', await moneteSono(120), 120)

// l'archivio rimanda le scritture: si ricarica quando la scelta è scritta
for (let k = 0; k < 20 && await ultimoInArchivio() !== GIOCATORE; k++) await page.waitForTimeout(100)
uguale('la scelta si scrive in archivio', await ultimoInArchivio(), GIOCATORE)
await page.reload()
await page.waitForSelector('.carte')
uguale('dopo una ricarica si riapre l\'ultimo scelto', await chiEAcceso(), GIOCATORE)
uguale('con le sue monete', await moneteSono(120), 120)

await cambia(ALTRO)
uguale('e tornando al secondo', await chiEAcceso(), ALTRO)
uguale('le sue sono rimaste quelle', await moneteSono(7), 7)

uguale('su disco il primo ha le sue', (await leggiProfilo(page, GIOCATORE)).coins, 120)
uguale('e il secondo le sue', (await leggiProfilo(page, ALTRO)).coins, 7)

controlla('nessun errore in console', errori.length === 0, errori.join(' · '))
await browser.close()
riassunto('due bambini, due profili')
