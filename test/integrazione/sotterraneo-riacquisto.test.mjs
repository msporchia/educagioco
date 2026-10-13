/* ═══════════════════════════════════════════════════════════════════
   IL RIGATTIERE TIENE DA PARTE QUELLO CHE HAI VENDUTO, COL DITO VERO

   Gli ultimi cinque pezzi venduti stanno nella linguetta «Riacquista» e si
   riprendono allo stesso prezzo a cui li ha pagati il rigattiere, non a
   quello del banco; il sesto fa uscire il più vecchio; l'elenco sta
   nell'avventura e sopravvive a una pagina riaperta (docs/sotterraneo/
   bottega.md, «Riacquista»). In più il banco di chi veste ha le sue dieci
   caselle per linguetta e a 390 px la griglia regge: scorre solo lei.
   `node test/esegui.mjs sotterraneo-riacquisto`
   tempo: 60
   ═══════════════════════════════════════════════════════════════════ */
import { MONDO } from '../../src/giochi/sotterraneo/motore/avventure.js'
import { apriBrowser, apriGioco, azzera, semina, attendi, scegli, leggiProfilo, nelDialogo, scatto,
         vendiNellaBottega, riacquistaNellaBottega , finestraFerma } from '../aiuto/browser.mjs'
import { controlla, uguale, riassunto } from '../aiuto/verifica.mjs'
import { COSE } from '../../src/giochi/sotterraneo/dati/cose.js'
import { MERCANTI } from '../../src/giochi/sotterraneo/dati/terra-mappa.js'

const browser = await apriBrowser()
const { page, errori } = await apriGioco(browser)
await azzera(page)
const vendibili = ['ascia', 'medaglione', 'amuleto-rosso', 'scudo-legno', 'pozione-piccola', 'spada']
const roba = { v: 1, gemme: 20, zaino: [...vendibili], mano: null, mancina: null, corpo: null, dito: null, torcia: 0, torce: 0 }
const stelle = { 0: 3, 1: 3 }
await semina(page, {
  coins: 300, settings: { sperimentali: true },
  campagne: { sotterraneo: { tappa: 2, libera: false, stelle,
    cfg: { mondo: MONDO, eroe: 'cavaliere', avventure: { cavaliere: { tappa: 2, libera: false, stelle, missioni: {},
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
  await finestraFerma(page)   // la finestra nuova cresce per 160 ms: misurata prima, il tocco cade a lato
  const b = await page.locator(sel).first().boundingBox()
  await tocca(b.x + b.width / 2, b.y + b.height / 2)
}
const gemmeBottega = async () => Number((await page.locator('[data-gemme-bottega]').innerText()).match(/\d+/)[0])
const daRiprendere = () => page.locator('[data-riacquisto]').evaluateAll(els => els.map(e => e.dataset.riacquisto))
async function apriDalRigattiere() {
  await toccaIl('[data-mercante="rigattiere"]')
  await nelDialogo(page, '[data-scelta="bottega"]', { tocca: toccaIl })
  await page.waitForSelector('[data-bottega]', { timeout: 5000 })
  await attendi(page, 500)    // la bottega è cieca per un attimo (Bottega.vue, CIECO)
}
async function chiudiBanco() {
  await toccaIl('[data-chiudi]')
  await page.waitForSelector('[data-chiudi]', { state: 'detached', timeout: 3000 })
}

await apriDalRigattiere()
uguale('il rigattiere ha tre linguette: gioielli, vendi, riacquista', await page.locator('[data-bottega] [data-scheda]').count(), 3)
await toccaIl('[data-scheda="riacquista"]')
await attendi(page, 200)
uguale('all\'inizio non ha tenuto niente da parte', await page.locator('[data-riacquisto-vuoto]').count(), 1)

/* ---------- si vende sei volte: ne restano cinque, i più recenti ---------- */
const pagati = {}
for (const k of vendibili) {
  pagati[k] = Math.max(1, Math.floor(COSE[k].prezzo / 2))
  await vendiNellaBottega(page, k, { tocca })
}
const tutteVendute = 20 + vendibili.reduce((n, k) => n + pagati[k], 0)
uguale('vendute le sei cose, le gemme salgono', await gemmeBottega(), tutteVendute)
await toccaIl('[data-scheda="riacquista"]')
await attendi(page, 200)
uguale('da parte ci sono le ultime cinque, la più recente per prima', (await daRiprendere()).join(),
       [...vendibili].slice(1).reverse().join())
uguale('la più vecchia, l\'ascia, è uscita', await page.locator('[data-riacquisto="ascia"]').count(), 0)
controlla('ognuna col prezzo a cui l\'ha pagata il mercante, non quello del banco',
          (await page.locator('[data-riacquisto="spada"]').innerText()).includes(String(pagati.spada)),
          await page.locator('[data-riacquisto="spada"]').innerText())
await scatto(page, 'riacquisto-linguetta')

/* ---------- si riprende: un tocco sceglie, il secondo compra, allo stesso prezzo ---------- */
await riacquistaNellaBottega(page, 'spada', { tocca })
uguale('le gemme scendono del prezzo pagato, non di quello del banco', await gemmeBottega(), tutteVendute - pagati.spada)
uguale('la spada ripresa va in mano da sé, come ogni cosa comprata', await page.locator('[data-casella="mano"][data-cosa="spada"]').count(), 1)
uguale('e non è più da riprendere', (await daRiprendere()).join(), ['pozione-piccola', 'scudo-legno', 'amuleto-rosso', 'medaglione'].join())

/* ---------- l'elenco sta nell'avventura: riaprendo la bottega, e rileggendo il profilo ---------- */
await chiudiBanco()
await apriDalRigattiere()
await toccaIl('[data-scheda="riacquista"]')
await attendi(page, 200)
uguale('riaperta la bottega, l\'elenco è lo stesso', (await daRiprendere()).join(), 'pozione-piccola,scudo-legno,amuleto-rosso,medaglione')
const profilo = await leggiProfilo(page)
const venduti = profilo?.campagne?.sotterraneo?.cfg?.avventure?.cavaliere?.venduti
uguale('nell\'avventura del cavaliere, con i prezzi', JSON.stringify((venduti || []).map(x => [x.k, x.prezzo])),
       JSON.stringify(['medaglione', 'amuleto-rosso', 'scudo-legno', 'pozione-piccola'].map(k => [k, pagati[k]])))

/* ---------- anche un gioiello si riprende, e va al dito ---------- */
{
  const prima = await gemmeBottega()
  await riacquistaNellaBottega(page, 'amuleto-rosso', { tocca })
  uguale('(l\'amuleto rosso si riprende e va al dito)', await page.locator('[data-casella="dito"][data-cosa="amuleto-rosso"]').count(), 1)
  uguale('(allo stesso prezzo)', await gemmeBottega(), prima - pagati['amuleto-rosso'])
}

/* ---------- il banco di chi veste, a 390 px ---------- */
await toccaIl('[data-scheda="gioielli"]')
await attendi(page, 200)
const caselle = await page.locator('[data-casella-pezzo]').count()
controlla('i gioielli hanno una decina di caselle', caselle >= 8, String(caselle))
const larghezza = await page.evaluate(() => [document.documentElement.scrollWidth, document.documentElement.clientWidth])
controlla('e la pagina non scorre di lato', larghezza[0] <= larghezza[1] + 1, larghezza.join(' / '))
{
  const griglia = await page.locator('.sot-banco-griglia').first().evaluate(e => ({ alto: e.clientHeight, pieno: e.scrollHeight }))
  controlla('scorre solo la griglia: dieci caselle non stanno tutte insieme', griglia.pieno > griglia.alto, JSON.stringify(griglia))
  const ultima = page.locator('[data-casella-pezzo]').last()
  await ultima.scrollIntoViewIfNeeded()
  const b = await ultima.boundingBox()
  const vista = await page.evaluate(() => window.innerHeight)
  controlla('l\'ultima casella si raggiunge scorrendo', b && b.y >= 0 && b.y + b.height <= vista, JSON.stringify(b))
  const linguette = await page.locator('.sot-linguette').boundingBox()
  controlla('le tre linguette stanno nella larghezza', linguette.x >= 0 && linguette.x + linguette.width <= larghezza[1] + 1,
            JSON.stringify(linguette))
  const bottoni = await page.locator('.sot-linguette .sot-linguetta').evaluateAll(els => els.map(e => e.getBoundingClientRect().right))
  controlla('e nessuna esce', bottoni.every(r => r <= larghezza[1] + 1), bottoni.join())
}
await scatto(page, 'riacquisto-gioielli-390')

controlla('nessun errore nella pagina', errori.length === 0, errori.join(' | '))
await browser.close()
riassunto('il rigattiere e quello che hai venduto')
