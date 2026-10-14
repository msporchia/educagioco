/* ═══════════════════════════════════════════════════════════════════
   GLI INCANTI PREPARATI DAL CAMPO, COL DITO

   (docs/sotterraneo/orologio.md)
   Giù, la casella degli incanti nella barra apre la scelta degli incantesimi che si preparano (il globo blu apre l'albero); un tocco lancia lo Scudo arcano, paga l'energia, e
   sopra il globo compare la pastiglia coi passi; un secondo tocco dice «ce l'hai già»; in fondo il tasto dell'albero lo apre, e il
   riquadro del nodo dice che si può preparare. Poi uno scontro aperto con l'incanto già addosso: la pastiglia sotto il palco coi
   passi, la barriera disegnata sull'eroe, il badge sul primo turno della fila.
   Si tocca come un bambino (`Input.dispatchTouchEvent` via CDP).
   `node test/esegui.mjs sotterraneo-incanti --scatti`
   tempo: 120
   ═══════════════════════════════════════════════════════════════════ */
import { apriBrowser, apriGioco, azzera, semina, scatto, attendi, scegli, scendiNelSotterraneo } from '../aiuto/browser.mjs'
import { controlla, uguale, riassunto } from '../aiuto/verifica.mjs'
import { sogliaDi } from '../../src/giochi/sotterraneo/dati/livelli.js'
import { MONDO } from '../../src/giochi/sotterraneo/motore/avventure.js'
import { NODI } from '../../src/giochi/sotterraneo/dati/abilita.js'

const TAPPA = 1
const roba = { v: 1, gemme: 0, zaino: ['pozione-piccola'], mano: null, mancina: null, corpo: null, dito: null, torcia: 0, torce: 0 }
// un mago del livello 12 con lo Scudo arcano e la Fonte arcana (due nodi, uno da preparare e uno no)
const crescita = { v: 2, esp: sogliaDi(12), forza: 1, destrezza: 0, intelligenza: 4, tempra: 0,
  albero: { 'scudo-arcano': 1, 'fonte-arcana': 1, 'dardo-di-fuoco': 1 }, caselle: ['dardo-di-fuoco', 'scudo-arcano', null] }

const browser = await apriBrowser()
const { page, errori } = await apriGioco(browser)
const cdp = await page.context().newCDPSession(page)
async function tocca(x, y) {
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x, y }] })
  await attendi(page, 60)
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] })
}
async function toccaIl(sel) {
  await page.locator(sel).first().scrollIntoViewIfNeeded()
  const b = await page.locator(sel).first().boundingBox()
  await tocca(b.x + b.width / 2, b.y + b.height / 2)
  await attendi(page, 300)
}

// scende nella cripta: `hash` dice cosa si trova (un cheat, docs/core/comandi.md)
async function entra(hash) {
  await page.evaluate(() => history.replaceState(null, '', location.pathname + location.search))
  await azzera(page)
  await page.setViewportSize({ width: 390, height: 844 })
  const avventura = { tappa: TAPPA, libera: false, stelle: { 0: 3 }, missioni: {}, roba, crescita,
    terra: { nebbia: 'f'.repeat(768), dove: [55, 11], parlato: true } }
  await semina(page, {
    coins: 300, settings: { sperimentali: true },
    campagne: { sotterraneo: { tappa: TAPPA, libera: false, stelle: { 0: 3 }, cfg: { mondo: MONDO, eroe: 'mago', avventure: { mago: avventura } } } },
  })
  await scegli(page, 'sotterraneo')
  await page.waitForSelector('[data-terra]', { timeout: 5000 })
  await page.evaluate(h => { location.hash = h }, hash)
  await scendiNelSotterraneo(page, TAPPA)
}
const energia = () => page.locator('[data-globo="energia"] .sot-globo-numero').first().textContent().then(Number)

/* ---------- 1. dalla casella degli incanti si sceglie e si lancia ---------- */
{
  await entra('seme=11&sotterraneo=1')
  await page.waitForSelector('[data-barra-giu]', { timeout: 10000 })
  await attendi(page, 600)
  uguale('prima di lanciare niente è addosso', await page.locator('[data-incanti]').count(), 0)
  const piena = await energia()
  uguale('la casella sa quanti ne puoi preparare, e nessuno è addosso', await page.locator('[data-casella-barra="incanti"]').evaluate(e => `${e.dataset.n}/${e.dataset.preparabili}`), '0/1')
  await toccaIl('[data-barra-giu] [data-azione="incanti"]')
  await page.waitForSelector('[data-preparati]', { timeout: 3000 })
  uguale('la casella apre la scelta degli incantesimi, non l\'albero', await page.locator('[data-pagina-abilita]').count(), 0)
  uguale('una riga per quello che si prepara (lo Scudo arcano, non la Fonte né il Dardo)', await page.locator('[data-azione="prepara-campo"]').evaluateAll(es => es.map(e => e.dataset.abilita).join()), 'scudo-arcano')
  await attendi(page, 500)   // i 320 ms ciechi
  await scatto(page, 'incanti-scelta')
  await toccaIl('[data-azione="prepara-campo"][data-abilita="scudo-arcano"]')
  const costo = NODI['scudo-arcano'].costo
  uguale('lanciarlo paga l\'energia di sempre', await energia(), piena - costo)
  controlla('e lo Scudo arcano è addosso con i suoi passi', (await page.locator('[data-azione="prepara-campo"]').first().getAttribute('data-addosso')) >= 30)
  await toccaIl('[data-preparati] [data-chiudi]')
  uguale('la ✕ chiude la scelta', await page.locator('[data-preparati]').count(), 0)
  uguale('sopra il globo c\'è la pastiglia dell\'incanto', await page.locator('[data-incanti] [data-incanto="scudo-arcano"]').count(), 1)
  uguale('e la casella dice 1 addosso su 1', await page.locator('[data-casella-barra="incanti"]').evaluate(e => `${e.dataset.n}/${e.dataset.preparabili}`), '1/1')
  controlla('coi passi che restano', Number(await page.locator('[data-incanto="scudo-arcano"]').getAttribute('data-passi')) >= 30)
  await scatto(page, 'incanti-campo')
  // un secondo tocco: ce l'ha già, e l'energia non si muove
  const dopo = await energia()
  await toccaIl('[data-barra-giu] [data-incanti]')   // la pastiglia si tocca come la casella
  await page.waitForSelector('[data-preparati]', { timeout: 3000 })
  await attendi(page, 500)
  await toccaIl('[data-azione="prepara-campo"][data-abilita="scudo-arcano"]')
  uguale('rilanciarlo mentre è in forze non costa niente', await energia(), dopo)
  // l'albero è a un tocco, e il riquadro del nodo dice che si prepara
  await toccaIl('[data-azione="apri-albero"]')
  await page.waitForSelector('[data-pagina-abilita]', { timeout: 3000 })
  uguale('l\'albero è la scheda Abilità della finestra dell\'eroe', await page.locator('[data-scheda][aria-selected="true"]').getAttribute('data-scheda'), 'abilita')
  await toccaIl('[data-azione="ramo"][data-ramo-scheda="arcano"]')   // un ramo alla volta
  await toccaIl('[data-azione="nodo"][data-nodo="scudo-arcano"]')
  uguale('nell\'albero lo Scudo arcano dice che si può preparare', await page.locator('[data-nodo-dettaglio] [data-preparabile]').count(), 1)
  await toccaIl('[data-azione="nodo"][data-nodo="fonte-arcana"]')
  uguale('la Fonte arcana no', await page.locator('[data-nodo-dettaglio] [data-preparabile]').count(), 0)
}

/* ---------- 2. lo scontro comincia con l'incanto addosso ---------- */
{
  await entra('seme=11&sotterraneo=branco&mostri=1&tipo=scheletro&preparati=scudo-arcano')
  await page.waitForSelector('[data-duello]', { timeout: 10000 })
  await attendi(page, 800)
  uguale('la pastiglia sotto il palco, coi passi', await page.locator('[data-stati-eroe] [data-preparato="scudo-arcano"]').count(), 1)
  controlla('i passi sono quelli che restano', Number(await page.locator('[data-stati-eroe] [data-preparato]').first().getAttribute('data-passi')) >= 30)
  controlla('la barriera è disegnata sull\'eroe', (await page.locator('[data-eroe-scontro] [data-segno="scudo"]').count()) >= 1)
  uguale('sul primo turno dell\'eroe, nella fila, il badge coi passi', await page.locator('[data-fila] [data-incanto-fila]').count(), 1)
  await scatto(page, 'incanti-scontro')
}

await browser.close()
if (errori.length) console.log('   errori in console:', errori.slice(0, 5).join(' | '))
controlla('nessun errore in console', !errori.length, errori.slice(0, 3).join(' | '))
riassunto('gli incanti preparati dal campo, col dito')
