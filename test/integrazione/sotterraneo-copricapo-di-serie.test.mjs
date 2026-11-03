/* ═══════════════════════════════════════════════════════════════════
   IL COPRICAPO DI SERIE COL DITO — docs/sotterraneo/elmo.md, «Quello di serie»

   Un eroe che non ha mai avuto niente in testa ha addosso il suo copricapo
   (il cappello del mago): sta nello zaino come un pezzo suo, si toglie
   (testa nuda, il pezzo in tasca) e si rimette, e il tintore lo mostra fra
   i copricapi.
   `node test/esegui.mjs sotterraneo-copricapo-di-serie`
   tempo: 150
   ═══════════════════════════════════════════════════════════════════ */
import { apriBrowser, apriGioco, azzera, semina, scegli, leggiProfilo, mondoPronto, attendi, scatto, senzaPensieri } from '../aiuto/browser.mjs'
import { controlla, uguale, riassunto } from '../aiuto/verifica.mjs'
import { MONDO } from '../../src/giochi/sotterraneo/motore/avventure.js'

const roba = { v: 1, gemme: 60, zaino: [], mano: null, mancina: null, corpo: null, dito: null, torcia: 0, torce: 0 }   // senza `testa`: un salvataggio di prima
const browser = await apriBrowser()
const { page, errori } = await apriGioco(browser)
await azzera(page)
await semina(page, {
  coins: 300, settings: { sperimentali: true },
  campagne: { sotterraneo: { tappa: 0, libera: false, stelle: {},
    cfg: { mondo: MONDO, eroe: 'mago', avventure: { mago: { tappa: 0, libera: false, stelle: {}, missioni: {}, roba, mondo: { dove: {}, parlato: true } } } } } },
})
await senzaPensieri(page)
await scegli(page, 'sotterraneo')
await mondoPronto(page)
await attendi(page, 600)

// 1. lo zaino: il cappello è addosso, nella casella della testa
await page.locator('[data-azione="zaino"]').click()
await page.waitForSelector('[data-zaino]', { timeout: 5000 })
await attendi(page, 1200)
await scatto(page, 'copricapo-serie-1-addosso')
uguale('in testa il suo copricapo', await page.locator('[data-zaino] [data-casella="testa"]').getAttribute('data-cosa'), 'serie-mago')

// 2. toccato e riposto: testa nuda, il pezzo in tasca
await page.locator('[data-zaino] [data-casella="testa"]').click()
await page.locator('[data-zaino] [data-azione="riponi"]').click()
await attendi(page, 1200)
await scatto(page, 'copricapo-serie-2-testa-nuda')
let p = await leggiProfilo(page)
const av = () => p.campagne.sotterraneo.cfg.avventure.mago.roba
uguale('la testa è nuda', av().testa || null, null)
controlla('il pezzo è in tasca', av().zaino.includes('serie-mago'))

// 3. rimesso: torna in testa
await page.locator('[data-zaino] [data-cosa="serie-mago"][data-tasca]').click()
await page.locator('[data-zaino] [data-azione="usa"]').click()
await attendi(page, 800)
p = await leggiProfilo(page)
uguale('rimesso in testa', av().testa, 'serie-mago')
controlla('e non è più in tasca', !av().zaino.includes('serie-mago'))

controlla('nessun errore in pagina', errori.length === 0, errori.join(' | '))
await browser.close()
riassunto('il copricapo di serie col dito')
