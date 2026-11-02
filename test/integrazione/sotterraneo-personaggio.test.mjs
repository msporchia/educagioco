/* ═══════════════════════════════════════════════════════════════════
   IL PERSONAGGIO, MASCHIO O FEMMINA, COL DITO — docs/sotterraneo/personaggio.md

   Scegliere un eroe non passa da nessun passo in più: il sesso di partenza
   è quello della persona del profilo. L'editor si apre dalla ✎ della
   scelta delle avventure o dalla pagina dell'eroe, e toccare un modello
   scrive subito il sesso nell'avventura di quell'eroe (gratis): il nome
   nella pagina dell'eroe cambia, i numeri no.
   `node test/esegui.mjs sotterraneo-personaggio`
   tempo: 120
   ═══════════════════════════════════════════════════════════════════ */
import { apriBrowser, apriGioco, azzera, semina, scegli, leggiProfilo, mondoPronto, attendi, scatto } from '../aiuto/browser.mjs'
import { controlla, uguale, riassunto } from '../aiuto/verifica.mjs'

const browser = await apriBrowser()
const { page, errori } = await apriGioco(browser)
await azzera(page)
await semina(page, { coins: 300, settings: { sperimentali: true }, campagne: { sotterraneo: { tappa: 0, libera: false, stelle: {} } } })
await scegli(page, 'sotterraneo')
await page.waitForSelector('.sot-eroe[data-eroe]', { timeout: 30000 })

await attendi(page, 1500)
await scatto(page, 'personaggio-1-scelta')
// 1. la ✎ apre l'editor senza scegliere l'eroe, e senza scrivere niente finché non si tocca
await page.locator('[data-personaggio-di="mago"]').click()
await page.waitForSelector('[data-editor-personaggio]', { timeout: 3000 })
uguale('l\'editor è quello del mago', await page.locator('[data-editor-personaggio]').getAttribute('data-eroe-editor'), 'mago')
// il profilo di prova ha la persona di serie (la bambina): l'editor parte dalla femmina
uguale('parte da come è la persona del profilo', await page.locator('[data-editor-personaggio]').getAttribute('data-sesso-scelto'), 'f')
await attendi(page, 1500)
await scatto(page, 'personaggio-2-editor-mago')
uguale('i due modelli ci sono', await page.locator('[data-sesso]').count(), 2)
let prima = await leggiProfilo(page)
controlla('aprirlo non scrive niente', !(((prima.campagne || {}).sotterraneo || {}).cfg || {}).avventure)

// 2. toccare la maga la sceglie e la scrive
await page.locator('[data-sesso="m"]').click()
await attendi(page, 300)
await page.locator('[data-sesso="f"]').click()
await attendi(page, 1500)
await scatto(page, 'editor-personaggio')
uguale('il sesso scelto è femmina', await page.locator('[data-editor-personaggio]').getAttribute('data-sesso-scelto'), 'f')
let p = await leggiProfilo(page)
uguale('e sta nel salvataggio, nell\'avventura del mago', p.campagne.sotterraneo.cfg.avventure.mago.sesso, 'f')
controlla('il nome è cambiato nella scheda', (await page.locator('[data-sesso="f"]').innerText()).includes('Maga'))
// pelle e capelli: si toccano le tinte, si scrivono; toccare di nuovo la stessa la toglie
await page.locator('[data-pz-scheda="pelle"]').click()
await page.locator('[data-pelle="ambra"]').click()
await page.locator('[data-pz-scheda="capelli"]').click()
await page.locator('[data-capelli="blu"]').click()
await attendi(page, 1500)
await scatto(page, 'personaggio-3-colori')
p = await leggiProfilo(page)
uguale('la pelle scelta sta nell\'avventura', p.campagne.sotterraneo.cfg.avventure.mago.aspetto.pelle, 'ambra')
uguale('e i capelli', p.campagne.sotterraneo.cfg.avventure.mago.aspetto.capelli, 'blu')
await page.locator('[data-pz-scheda="pelle"]').click()
uguale('la tinta scelta è segnata', await page.locator('[data-pelle="ambra"].sel').count(), 1)
// il taglio e la barba
await page.locator('[data-pz-scheda="taglio"]').click()
await page.locator('[data-taglio="coda"]').click()
await page.locator('[data-pz-scheda="barba"]').click()
await page.locator('[data-barba="pizzetto"]').click()
await attendi(page, 1500)
await scatto(page, 'personaggio-3b-taglio-barba')
p = await leggiProfilo(page)
uguale('il taglio sta nell\'avventura', p.campagne.sotterraneo.cfg.avventure.mago.aspetto.taglio, 'coda')
uguale('e la barba', p.campagne.sotterraneo.cfg.avventure.mago.aspetto.barba, 'pizzetto')
await page.locator('[data-pz-scheda="taglio"]').click()
await page.locator('[data-taglio="calvo"]').click()
await page.locator('[data-pz-scheda="barba"]').click()
await page.locator('[data-barba="lunga"]').click()
await attendi(page, 1500)
await scatto(page, 'personaggio-3c-calvo-barba-lunga')
await page.locator('[data-pz-scheda="capelli"]').click()
await page.locator('[data-capelli="blu"]').click()
await attendi(page, 300)
p = await leggiProfilo(page)
uguale('toccare ancora i capelli li toglie', p.campagne.sotterraneo.cfg.avventure.mago.aspetto.capelli, null)
await page.locator('[data-azione="chiudi-personaggio"]').click()
// scelto l'eroe, si parte subito (niente passi in più) e la maga resta maga
await page.locator('.sot-eroe[data-eroe="mago"]').click()
await mondoPronto(page)

// 3. la pagina dell'eroe dice «Maga» e offre l'editor
await page.locator('[data-azione="eroe-pagina"]').click()
await page.waitForSelector('[data-pagina-eroe] [data-azione="personaggio"]', { timeout: 3000 })
await attendi(page, 800)
await scatto(page, 'personaggio-4-pagina-eroe')
controlla('la pagina parla della maga', (await page.locator('[data-pagina-eroe] [data-azione="personaggio"]').getAttribute('aria-label')).includes('la maga'))
await page.locator('[data-pagina-eroe] [data-azione="personaggio"]').click()
await page.waitForSelector('[data-editor-personaggio]', { timeout: 3000 })
uguale('lo stesso editor, già femmina', await page.locator('[data-editor-personaggio]').getAttribute('data-sesso-scelto'), 'f')
await page.locator('[data-sesso="m"]').click()
await attendi(page, 300)
p = await leggiProfilo(page)
uguale('si può ripensarci, gratis', p.campagne.sotterraneo.cfg.avventure.mago.sesso, 'm')
uguale('e le monete non si sono mosse', p.coins, 300)
await page.locator('[data-azione="chiudi-personaggio"]').click()

controlla('nessun errore in pagina', errori.length === 0, errori.join(' | '))
await browser.close()
riassunto('il personaggio, maschio o femmina, col dito')
