/* ═══════════════════════════════════════════════════════════════════
   IL TINTORE, COL DITO — docs/sotterraneo/tintore.md

   Il tintore sta nel villaggio: toccato, si parla e «Vorrei cambiare colore
   a un pezzo» apre il suo foglio. Si sceglie la spada, un colore, si tinge:
   le gemme scendono di COSTO, il colore sta nell'avventura e il ritratto
   dell'eroe cambia chiave. Senza gemme il tasto è spento e non si paga.
   `node test/esegui.mjs sotterraneo-tintore`
   tempo: 240
   ═══════════════════════════════════════════════════════════════════ */
import { apriBrowser, apriGioco, azzera, semina, scegli, leggiProfilo, mondoPronto, attendi, scatto, sopraVaDa, nelDialogo, senzaPensieri } from '../aiuto/browser.mjs'
import { controlla, uguale, riassunto } from '../aiuto/verifica.mjs'
import { COSTO } from '../../src/giochi/sotterraneo/dati/tinte.js'
import { MONDO } from '../../src/giochi/sotterraneo/motore/avventure.js'

const roba = { v: 1, gemme: 60, zaino: ['panciotto'], mano: 'spada', mancina: null, corpo: null, dito: null, torcia: 0, torce: 0 }
const browser = await apriBrowser()
const { page, errori } = await apriGioco(browser)
await azzera(page)
await semina(page, {
  coins: 300, settings: { sperimentali: true },
  campagne: { sotterraneo: { tappa: 0, libera: false, stelle: {},
    cfg: { mondo: MONDO, eroe: 'cavaliere', avventure: { cavaliere: { tappa: 0, libera: false, stelle: {}, missioni: {}, roba, mondo: { dove: {}, parlato: true } } } } } },
})
await senzaPensieri(page)
await scegli(page, 'sotterraneo')
await mondoPronto(page)
await attendi(page, 600)

// 1. si parla col tintore e si apre il foglio
await sopraVaDa(page, '[data-personaggio="tintore"]', 'personaggio:villaggio:tintore')
await page.waitForSelector('[data-dialogo="tintore"]', { timeout: 90000 })
await nelDialogo(page, '[data-scelta="bottega"]')
await page.waitForSelector('[data-tintore]', { timeout: 10000 })
await attendi(page, 1500)
await scatto(page, 'tintore-1-foglio')
uguale('le gemme sono quelle della roba', await page.locator('[data-tintore]').getAttribute('data-gemme'), '60')
// l'interfaccia unica (docs/core/personalizza.md): schede per posto, i pezzi nella griglia, i colori nel pannello, il prezzo in fondo
uguale('fra le armi la spada', await page.locator('[data-tintore] [data-pezzo]').evaluateAll(l => l.map(e => e.dataset.pezzo).join()), 'spada')
await page.locator('[data-tintore] [data-prs-scheda="difese"]').click()
uguale('fra le difese il giubbotto', await page.locator('[data-tintore] [data-pezzo]').evaluateAll(l => l.map(e => e.dataset.pezzo).join()), 'panciotto')
await page.locator('[data-tintore] [data-prs-scheda="armi"]').click()
const tingi = '[data-tintore] [data-prs="paga"]'
controlla('senza un colore in prova non c\'è il tasto', (await page.locator(tingi).count()) === 0)

// 2. la spada, un colore, tingi
await page.locator('[data-pezzo="spada"]').click()
await page.locator('[data-tinta="rosso"]').click()
await attendi(page, 1500)
await scatto(page, 'tintore-2-spada-rossa')
controlla('il colore in prova non si paga da solo', (await leggiProfilo(page)).campagne.sotterraneo.cfg.avventure.cavaliere.roba.gemme === 60)
await page.locator(tingi).click()
await attendi(page, 500)
let p = await leggiProfilo(page)
const av = () => p.campagne.sotterraneo.cfg.avventure.cavaliere.roba
uguale('la tinta sta nella roba', av().tinte && av().tinte.spada, 'rosso')
uguale('le gemme sono scese di COSTO', av().gemme, 60 - COSTO)
uguale('il foglio le mostra', await page.locator('[data-tintore]').getAttribute('data-gemme'), String(60 - COSTO))
uguale('il pezzo dice il suo colore', await page.locator('[data-pezzo="spada"]').getAttribute('data-tinto'), 'rosso')
uguale('e il rosso è acceso', await page.locator('[data-tinta="rosso"][aria-pressed="true"]').count(), 1)

// 3. un secondo pezzo ancora si può, un terzo no: restano 10 gemme
await page.locator('[data-tintore] [data-prs-scheda="difese"]').click()
await page.locator('[data-pezzo="panciotto"]').click()
await page.locator('[data-tinta="blu"]').click()
await page.locator(tingi).click()
await attendi(page, 500)
p = await leggiProfilo(page)
uguale('anche il giubbotto in tasca', av().tinte.panciotto, 'blu')
await page.locator('[data-tintore] [data-prs-scheda="armi"]').click()
await page.locator('[data-pezzo="spada"]').click()
await page.locator('[data-tinta="verde"]').click()
controlla('con meno gemme il tasto è spento', await page.locator(tingi).isDisabled())
uguale('e non paga', av().gemme, 60 - 2 * COSTO)
await scatto(page, 'tintore-3-senza-gemme')

// 4. si chiude con la ✕ e la tinta resta
await page.locator('[data-tintore] [data-chiudi]').click()
await attendi(page, 300)
uguale('il foglio è chiuso', await page.locator('[data-tintore]').count(), 0)
p = await leggiProfilo(page)
uguale('la tinta resta', av().tinte.spada, 'rosso')
await page.locator('[data-azione="eroe-pagina"]').click()
await page.waitForSelector('[data-pagina-eroe]', { timeout: 3000 })
await attendi(page, 1500)
await scatto(page, 'tintore-4-pagina-eroe')

controlla('nessun errore in console', errori.length === 0, errori.join(' | '))
await browser.close()
riassunto('il tintore col dito')
