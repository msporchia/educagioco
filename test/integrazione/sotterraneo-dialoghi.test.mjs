/* ═══════════════════════════════════════════════════════════════════
   I DIALOGHI, COL DITO VERO

   Sulla terra di sopra chi sta fermo si parla (docs/sotterraneo/dialoghi.md):
   toccandolo l'eroe ci va e si apre il dialogo in fondo, col ritratto, il
   testo a pagine e alla fine le domande. Qui: la ragazza chiede il seguito
   della collana (due pagine, un tocco va avanti, le domande solo
   all'ultima), le si chiede cosa si dice al pozzo (la domanda poi sparisce),
   si accetta («ci penso io» porta a prendere la missione, e lei ringrazia),
   un tocco sul prato chiude e fa camminare; il mugnaio riceve Rosicchione e
   dice il premio, monete comprese; il minatore la prima volta si presenta e
   poi dice la strada; la guaritrice porta alla bottega, il mercante alla
   linguetta delle tasche.

   I tocchi sono tocchi (`Input.dispatchTouchEvent` via CDP).
   `node test/esegui.mjs sotterraneo-dialoghi`
   tempo: 200
   ═══════════════════════════════════════════════════════════════════ */
import { apriBrowser, apriGioco, azzera, semina, scatto, attendi, scegli, leggiProfilo, camminaVerso, nelDialogo }
  from '../aiuto/browser.mjs'
import { controlla, uguale, riassunto } from '../aiuto/verifica.mjs'
import { CAMPAGNA } from '../../src/giochi/sotterraneo/dati/campagna.js'
import { PERSONAGGI, MINATORE, MERCANTI } from '../../src/giochi/sotterraneo/dati/terra-mappa.js'
import { missioneDi } from '../../src/giochi/sotterraneo/dati/missioni.js'
import { DIALOGHI } from '../../src/giochi/sotterraneo/dati/dialoghi.js'
import { MONDO } from '../../src/giochi/sotterraneo/motore/avventure.js'
import { robaAttesa } from '../../src/giochi/sotterraneo/motore/storia.js'

const DISCESA = CAMPAGNA.findIndex(t => t.chiave === 'torre')
const roba = robaAttesa('cavaliere', DISCESA, { gemme: 5 })
const ROSICCHIONE = missioneDi('rosicchione')

const browser = await apriBrowser()
const { page, errori } = await apriGioco(browser)
await azzera(page)
await semina(page, {
  coins: 300, settings: { sperimentali: true },
  campagne: { sotterraneo: { tappa: DISCESA, libera: false, stelle: { 0: 3, 1: 3 },
    cfg: { mondo: MONDO, eroe: 'cavaliere', avventure: { cavaliere: { tappa: DISCESA, libera: false, stelle: { 0: 3, 1: 3 },
      missioni: { collana: 'consegnata', rosicchione: 'fatta' }, roba,
      terra: { nebbia: 'f'.repeat(768), dove: PERSONAGGI.ragazza.accanto, parlato: false } } } } },
  },
})
await scegli(page, 'sotterraneo')
await page.waitForSelector('[data-terra]', { timeout: 5000 })
await attendi(page, 600)

const cdp = await page.context().newCDPSession(page)
async function tocca(x, y) {
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x, y }] })
  await attendi(page, 60)
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] })
}
async function toccaIl(sel) {
  const b = await page.locator(sel).first().boundingBox()
  await tocca(b.x + b.width / 2, b.y + b.height / 2)
}
const avventura = async () => (await leggiProfilo(page))?.campagne?.sotterraneo?.cfg?.avventure?.cavaliere || {}
const pagina = async () => Number(await page.locator('[data-dialogo]').getAttribute('data-pagina'))

/* ---------- 1. la ragazza: si apre toccandola, e le pagine vanno avanti col dito ---------- */
await toccaIl('[data-personaggio="ragazza"]')
await page.waitForSelector('[data-dialogo="ragazza"]', { timeout: 8000 })
uguale('toccandola si apre il dialogo, sulla prima pagina', await pagina(), 1)
uguale('col ritratto', await page.locator('[data-dialogo] [data-ritratto-dialogo]').count(), 1)
controlla('il nome è il suo', (await page.locator('.sot-dialogo-nome').innerText()).includes('ragazza del pozzo'))
controlla('chiede il seguito della collana', (await page.locator('[data-riga]').getAttribute('data-missione')) === 'goblin')
const quante = Number(await page.locator('[data-dialogo]').getAttribute('data-pagine'))
controlla('la richiesta sta in più pagine', quante >= 2, String(quante))
uguale('e le domande non ci sono finché non si è all\'ultima', await page.locator('[data-scelte]').count(), 0)
await attendi(page, 300)
await scatto(page, 'dialogo-pagina')
await attendi(page, 380)
await toccaIl('[data-dialogo-testo]')
await attendi(page, 250)
uguale('un tocco sul testo va alla pagina dopo', await pagina(), 2)
for (let n = 2; n < quante; n++) { await attendi(page, 250); await toccaIl('[data-dialogo-testo]') }
await page.waitForSelector('[data-dialogo][data-ultima] [data-scelte]', { timeout: 3000 })
const scelte = await page.locator('[data-scelta]').evaluateAll(els => els.map(e => e.dataset.scelta).join(','))
uguale('all\'ultima le domande: ci penso io, cosa si dice al pozzo, arrivederci', scelte, 'prendi,racconta,ciao')
await attendi(page, 400)
await scatto(page, 'dialogo-scelte')

/* ---------- 2. la storia: la risposta, e la domanda non torna ---------- */
await toccaIl('[data-scelta="racconta"]')
await page.waitForSelector('[data-riga][data-racconto]', { timeout: 3000 })
uguale('la risposta riparte dalla prima pagina', await pagina(), 1)
await nelDialogo(page, null, { tocca: toccaIl })
uguale('chiesta, la storia non si richiede', await page.locator('[data-scelta="racconta"]').count(), 0)

/* ---------- 3. una scelta porta alla sua azione: prendere la missione ---------- */
await toccaIl('[data-scelta="prendi"][data-missione="goblin"]')
await page.waitForSelector('[data-riga][data-fase="presa"]', { timeout: 3000 })
uguale('lei ringrazia con la sua frase', await page.locator('[data-riga]').innerText(), DIALOGHI.ragazza.presa)
uguale('e nell\'avventura il goblin è preso', (await avventura()).missioni?.goblin, 'presa')
uguale('sopra la testa il «?» grigio', await page.locator('[data-personaggio="ragazza"]').getAttribute('data-segno'), 'attesa')

/* ---------- 4. un tocco altrove chiude, e cammina ---------- */
{
  const v = await page.locator('[data-terra]').boundingBox()
  const prima = await page.locator('[data-eroe-terra]').getAttribute('data-cella')
  await tocca(v.x + 30, v.y + v.height * 0.3)
  await attendi(page, 300)
  uguale('un tocco sul prato chiude il dialogo', await page.locator('[data-dialogo]').count(), 0)
  await page.waitForFunction(c => document.querySelector('[data-eroe-terra]').dataset.cella !== c, prima, { timeout: 5000 })
  controlla('e l\'eroe va dove si è toccato', true)
  uguale('e torna la carta di chi scende', await page.locator('[data-chi-sopra]').count(), 1)
}

/* ---------- 5. il mugnaio: la consegna, e il premio detto ---------- */
await camminaVerso(page, PERSONAGGI.mugnaio.accanto, { tocca })
await toccaIl('[data-personaggio="mugnaio"]')
await page.waitForSelector('[data-dialogo="mugnaio"]', { timeout: 15000 })
uguale('se ne accorge: la frase del ritorno', await page.locator('[data-riga]').innerText(), ROSICCHIONE.ritorno)
await nelDialogo(page, '[data-scelta="consegna"][data-missione="rosicchione"]', { tocca: toccaIl })
await page.waitForSelector('[data-riga][data-fase="grazie"]', { timeout: 3000 })
uguale('consegnata nell\'avventura', (await avventura()).missioni?.rosicchione, 'consegnata')
for (let n = 0; n < 6 && !(await page.locator('[data-riga][data-premio]').count()); n++) {
  await attendi(page, 300); await toccaIl('[data-dialogo-testo]')
}
const premio = await page.locator('[data-riga][data-premio]').innerText()
controlla('il premio in una pagina sua, monete comprese', premio.includes('🪙') && premio.includes('Amuleto'), premio)
await attendi(page, 400)
await scatto(page, 'dialogo-premio')
await nelDialogo(page, '[data-scelta="ciao"]', { tocca: toccaIl })
await attendi(page, 200)
uguale('arrivederci chiude', await page.locator('[data-dialogo]').count(), 0)

/* ---------- 6. il minatore: la prima volta si presenta, poi la strada ---------- */
await camminaVerso(page, MINATORE.accanto, { tocca })
await toccaIl('[data-minatore]')
await page.waitForSelector('[data-dialogo="minatore"]', { timeout: 15000 })
controlla('la prima volta si presenta', !(await page.locator('[data-riga]').getAttribute('data-detto') != null))
await attendi(page, 400)
await scatto(page, 'dialogo-minatore')
for (let n = 0; n < 4 && !(await page.locator('[data-riga][data-detto]').count()); n++) {
  await attendi(page, 360); await toccaIl('[data-dialogo-testo]')
}
controlla('poi dice la strada della prossima discesa', (await page.locator('[data-riga][data-detto]').innerText()).startsWith(CAMPAGNA[DISCESA].nome))
await nelDialogo(page, '[data-scelta="racconta"]', { tocca: toccaIl })
await page.waitForSelector('[data-riga][data-racconto]', { timeout: 3000 })
controlla('cosa c\'è laggiù: il mostro grosso della torre', (await page.locator('[data-riga]').innerText()).includes('Fiammetta'))
await nelDialogo(page, null, { tocca: toccaIl })
uguale('dopo un\'altra domanda, «dove vado adesso?» torna', await page.locator('[data-scelta="strada"]').count(), 1)

/* ---------- 7. i mercanti: il dialogo porta alla bottega ---------- */
await camminaVerso(page, MERCANTI.erborista.accanto, { tocca })
await toccaIl('[data-mercante="erborista"]')
await page.waitForSelector('[data-dialogo="erborista"]', { timeout: 15000 })
await nelDialogo(page, '[data-scelta="bottega"]', { tocca: toccaIl })
await page.waitForSelector('[data-bottega][data-mercante-aperto="erborista"]', { timeout: 3000 })
uguale('«mi servono pozioni» apre la bottega della guaritrice', await page.locator('[data-dialogo]').count(), 0)
await attendi(page, 400)
await toccaIl('[data-bottega] [data-chiudi]')
await attendi(page, 300)
await camminaVerso(page, MERCANTI.rigattiere.accanto, { tocca })
await toccaIl('[data-mercante="rigattiere"]')
await nelDialogo(page, '[data-scelta="vendi"]', { tocca: toccaIl })
await page.waitForSelector('[data-bottega][data-mercante-aperto="rigattiere"]', { timeout: 15000 })
uguale('«ho roba da vendere» apre il mercante sulla linguetta delle tasche',
       await page.locator('[data-scheda="vendi"]').getAttribute('aria-selected'), 'true')

uguale('nessun errore in console', errori.join(' | '), '')
await browser.close()
riassunto('i dialoghi della terra di sopra, col dito')
