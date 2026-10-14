/* ═══════════════════════════════════════════════════════════════════
   DUE ANELLI E UNA COLLANA, NELLO ZAINO E ALLA BOTTEGA

   L'eroe ha sei caselle intorno (a sinistra scudo, corpo, collana; a destra arma
   e due anelli: docs/sotterraneo/roba.md, «Due anelli e una collana»). Qui il giro
   col dito: un salvataggio di prima con un amuleto «al dito» lo ritrova al collo,
   le sei caselle ci sono e si toccano senza far ballare la pagina (390 px), un
   anello nuovo con i due anelli pieni dice quale sostituirebbe e il tasto
   «l'altro anello» ribalta la scelta, «Indossa» mette dove si guarda e quello che
   c'era torna in tasca; e il rigattiere ha anelli e collane sotto la stessa linguetta.
   I tocchi sono tocchi, via CDP (docs/core/il-dito.md).
   `node test/esegui.mjs sotterraneo-gioielli`
   tempo: 60
   ═══════════════════════════════════════════════════════════════════ */
import { MONDO } from '../../src/giochi/sotterraneo/motore/avventure.js'
import { chiaveDelPezzo } from '../../src/giochi/sotterraneo/dati/cose.js'
import { MERCANTI } from '../../src/giochi/sotterraneo/dati/terra-mappa.js'
import { apriBrowser, apriGioco, azzera, semina, scatto, attendi, scegli, leggiProfilo, nelDialogo, finestraFerma } from '../aiuto/browser.mjs'
import { controlla, uguale, riassunto } from '../aiuto/verifica.mjs'

const browser = await apriBrowser()
const { page, errori } = await apriGioco(browser)
await azzera(page)

/* un salvataggio di prima: un solo `dito` che tiene un amuleto, e tre anelli nello zaino: l'ambra magico di vita, il verde, e uno
   verde magico di difesa e vita, che arriva quando i due anelli sono già pieni */
const nuovo = chiaveDelPezzo('anello-verde', 1, 'magico', ['dif', 'vita'])
const buono = chiaveDelPezzo('anello-ambra', 1, 'magico', ['vita'])
const roba = { v: 1, gemme: 400, zaino: [nuovo, 'anello-verde', buono], mano: 'spada', mancina: 'scudo-legno', corpo: 'panciotto', dito: 'amuleto-rosso',
               torcia: 0, torce: 0 }
const stelle = { 0: 3, 1: 3, 2: 3, 3: 3, 4: 3, 5: 3 }
await semina(page, {
  coins: 300, settings: { sperimentali: true },
  campagne: { sotterraneo: { tappa: 6, libera: false, stelle,
    cfg: { mondo: MONDO, eroe: 'cavaliere', avventure: { cavaliere: { tappa: 6, libera: false, stelle, missioni: {},
      roba, terra: { nebbia: 'f'.repeat(768), dove: MERCANTI.rigattiere.accanto, parlato: true } } } } } },
})
await scegli(page, 'sotterraneo')
await page.waitForSelector('[data-terra]', { timeout: 5000 })
await attendi(page, 500)

const cdp = await page.context().newCDPSession(page)
async function tocca(x, y) {
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x, y }] })
  await attendi(page, 60)
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] })
}
async function toccaIl(sel) {
  await finestraFerma(page)
  const b = await page.locator(sel).first().boundingBox()
  await tocca(b.x + b.width / 2, b.y + b.height / 2)
}
const addosso = dove => page.locator(`[data-zaino] [data-casella="${dove}"]`).getAttribute('data-cosa')

/* ---------- 1. lo zaino: sei caselle, e l'amuleto di prima è al collo ---------- */
await page.locator('[data-azione="zaino"]').click()
await page.waitForSelector('[data-zaino]', { timeout: 3000 })
await attendi(page, 600)
for (const dove of ['mano', 'mancina', 'corpo', 'collo', 'dito', 'dito2'])
  uguale(`la casella ${dove} c'è`, await page.locator(`[data-zaino] [data-casella="${dove}"]`).count(), 1)
uguale('l\'amuleto che era «al dito» sta al collo', await addosso('collo'), 'amuleto-rosso')
uguale('i due anelli sono liberi', `${await addosso('dito')}|${await addosso('dito2')}`, 'null|null')
{
  const caselle = await page.locator('[data-zaino] [data-casella]').evaluateAll(els => els.map(e => {
    const r = e.getBoundingClientRect()
    return { dove: e.dataset.casella, x: r.x, y: r.y, w: r.width, h: r.height }
  }))
  const grandi = caselle.filter(c => c.w < 44 || c.h < 44)
  uguale('ogni casella si tocca bene col dito (almeno 44 px)', grandi.map(c => c.dove).join(), '')
  const larghezza = await page.evaluate(() => document.documentElement.clientWidth)
  controlla('a 390 px niente esce dallo schermo', larghezza <= 390 && caselle.every(c => c.x >= 0 && c.x + c.w <= larghezza), JSON.stringify({ larghezza, caselle }))
  const dito = caselle.find(c => c.dove === 'dito'), dito2 = caselle.find(c => c.dove === 'dito2'), collo = caselle.find(c => c.dove === 'collo')
  controlla('i due anelli stanno uno sopra l\'altro a destra, la collana sotto lo scudo e il corpo a sinistra', dito.x === dito2.x && dito2.y > dito.y &&
            collo.x < dito.x && collo.y > caselle.find(c => c.dove === 'corpo').y)
}
await scatto(page, 'gioielli-zaino-vuoti')

/* ---------- 2. il primo anello va al primo dito, il secondo all'altro ---------- */
await page.locator(`[data-tasca][data-cosa="${buono}"]`).click()
await attendi(page, 500)
uguale('l\'anello d\'ambra magico: il confronto è con un dito libero', await page.locator('[data-colonna="addosso"] [data-niente]').count(), 1)
uguale('e non c\'è il tasto dell\'altro anello', await page.locator('[data-azione="altro-anello"]').count(), 0)
uguale('si accende il primo dito', await page.locator('[data-zaino] [data-casella="dito"]').evaluate(e => e.classList.contains('sot-accesa')), true)
await page.locator('[data-azione="usa"]').click()
await attendi(page, 250)
uguale('indossato sul primo dito', await addosso('dito'), buono)
await page.locator('[data-tasca][data-cosa="anello-verde"]').click()
await attendi(page, 400)
await page.locator('[data-azione="usa"]').click()
await attendi(page, 250)
uguale('il secondo sull\'altro dito', await addosso('dito2'), 'anello-verde')
uguale('la collana non si è mossa', await addosso('collo'), 'amuleto-rosso')

/* ---------- 3. i due anelli pieni: il nuovo dice quale sostituirebbe, e si può scegliere l'altro ---------- */
await page.locator(`[data-tasca][data-cosa="${nuovo}"]`).click()
await attendi(page, 500)
uguale('a sinistra l\'anello che rende meno: il verde', await page.locator('[data-colonna="addosso"] [data-pezzo]').getAttribute('data-pezzo'), 'anello-verde')
uguale('e si accende il secondo dito', await page.locator('[data-zaino] [data-casella="dito2"]').evaluate(e => e.classList.contains('sot-accesa')), true)
uguale('il tasto per l\'altro anello c\'è', await page.locator('[data-azione="altro-anello"]').count(), 1)
await scatto(page, 'gioielli-confronto-anello-verde')
await page.locator('[data-azione="altro-anello"]').click()
await attendi(page, 250)
uguale('adesso a sinistra c\'è l\'altro anello', await page.locator('[data-colonna="addosso"] [data-pezzo]').getAttribute('data-pezzo'), buono)
uguale('e si accende il primo dito', await page.locator('[data-zaino] [data-casella="dito"]').evaluate(e => e.classList.contains('sot-accesa')), true)
uguale('il secondo non più', await page.locator('[data-zaino] [data-casella="dito2"]').evaluate(e => e.classList.contains('sot-accesa')), false)
{
  const larghezza = await page.evaluate(() => document.documentElement.clientWidth)
  const pannello = await page.locator('[data-pannello]').boundingBox()
  controlla('a 390 px il pannello con il tasto sta', pannello.x >= 0 && pannello.x + pannello.width <= larghezza + 1, JSON.stringify(pannello))
}
await scatto(page, 'gioielli-confronto-altro-anello')
// un secondo tocco sul tasto torna al primo
await page.locator('[data-azione="altro-anello"]').click()
await attendi(page, 200)
uguale('un altro tocco torna al primo', await page.locator('[data-colonna="addosso"] [data-pezzo]').getAttribute('data-pezzo'), 'anello-verde')
// ... e di nuovo sull'altro, poi «Indossa»: prende il posto dell'ambra, e l'ambra torna in tasca
await page.locator('[data-azione="altro-anello"]').click()
await attendi(page, 200)
await page.locator('[data-azione="usa"]').click()
await attendi(page, 300)
uguale('il nuovo anello è sul primo dito', await addosso('dito'), nuovo)
uguale('il verde è rimasto al secondo', await addosso('dito2'), 'anello-verde')
uguale('l\'ambra magico è tornato in tasca', await page.locator(`[data-tasca][data-cosa="${buono}"]`).count(), 1)
uguale('la collana è sempre al collo', await addosso('collo'), 'amuleto-rosso')
await scatto(page, 'gioielli-zaino-pieno')

/* ---------- 4. «Indossa» senza toccare il tasto dell'altro: toglie quello che rende meno ---------- */
await page.locator(`[data-tasca][data-cosa="${buono}"]`).click()
await attendi(page, 500)
uguale('l\'ambra rimesso: a sinistra il pezzo che rende meno dei due', await page.locator('[data-colonna="addosso"] [data-pezzo]').count(), 1)
await page.locator('[data-azione="usa"]').click()
await attendi(page, 300)
uguale('gli anelli adesso sono due: il nuovo e l\'ambra o il verde', [await addosso('dito'), await addosso('dito2')].filter(k => k !== 'null').length, 2)
await page.locator('[data-azione="chiudi"]').click()
await attendi(page, 200)

/* ---------- 5. il profilo: salvato con i tre posti ---------- */
await attendi(page, 600)
const p = await leggiProfilo(page)
const salvata = p?.campagne?.sotterraneo?.cfg?.avventure?.cavaliere?.roba
controlla('la roba salvata ha il collo, il dito e il secondo dito', !!salvata && salvata.collo === 'amuleto-rosso' && !!salvata.dito && !!salvata.dito2, JSON.stringify(salvata))

/* ---------- 6. il rigattiere: anelli e collane sotto la stessa linguetta ---------- */
await toccaIl('[data-mercante="rigattiere"]')
await nelDialogo(page, '[data-scelta="bottega"]', { tocca: toccaIl })
await page.waitForSelector('[data-bottega]', { timeout: 5000 })
await attendi(page, 500)
uguale('la linguetta dei gioielli', await page.locator('[data-bottega] [data-scheda="gioielli"]').count(), 1)
const tipi = await page.locator('[data-bottega] [data-casella-pezzo]').evaluateAll(els => els.map(e => e.dataset.casellaPezzo))
controlla('il banco ha dei gioielli', tipi.length > 0, tipi.join())
uguale('e le sei caselle dell\'eroe sono anche qui', await page.locator('[data-bottega] [data-casella]').count(), 6)
uguale('con la collana al collo', await page.locator('[data-bottega] [data-casella="collo"]').getAttribute('data-cosa'), 'amuleto-rosso')
await scatto(page, 'gioielli-bottega')

controlla('nessun errore nella pagina', errori.length === 0, errori.join(' | '))
await browser.close()
riassunto('due anelli e una collana, col dito')
