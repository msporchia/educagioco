/* ═══════════════════════════════════════════════════════════════════
   I DIALOGHI, COL DITO VERO

   Sul mondo di sopra chi sta fermo si parla (docs/sotterraneo/dialoghi.md):
   toccandolo l'eroe ci va e si apre il dialogo in fondo, col ritratto, il
   testo a pagine e alla fine le domande. Qui: la ragazza chiede il seguito
   della collana (due pagine, un tocco va avanti, le domande solo
   all'ultima), le si chiede cosa si dice al pozzo (la domanda poi sparisce),
   si accetta («ci penso io» porta a prendere la missione, e lei ringrazia),
   un tocco sul prato chiude e fa camminare; il mugnaio riceve Rosicchione e
   dice il premio, monete comprese; il minatore la prima volta si presenta e
   poi dice la strada; la guaritrice e l'incantatrice portano alla bottega, il mercante alla
   linguetta delle tasche.

   L'eroe va da chi parla col salto delle prove (`__mondo3d.vai`, in `vaDa`): la strada a
   piedi la prova `integrazione/sotterraneo-mondo`. I tocchi sono tocchi
   (`Input.dispatchTouchEvent` via CDP).
   `node test/esegui.mjs sotterraneo-dialoghi`
   tempo: 480
   ═══════════════════════════════════════════════════════════════════ */
import { apriBrowser, apriGioco, azzera, semina, scatto, attendi, scegli, leggiProfilo, nelDialogo, finestraFerma, mondoPronto,
         toccaNelMondo, fermoNelMondo } from '../aiuto/browser.mjs'
import { controlla, uguale, riassunto } from '../aiuto/verifica.mjs'
import { CAMPAGNA } from '../../src/giochi/sotterraneo/dati/campagna.js'
import { ilMondo, terraDelMondo } from '../../src/giochi/sotterraneo/motore/mondo-sopra.js'
import { missioneDi } from '../../src/giochi/sotterraneo/dati/missioni.js'
import { DIALOGHI } from '../../src/giochi/sotterraneo/dati/dialoghi.js'
import { MONDO } from '../../src/giochi/sotterraneo/motore/avventure.js'
import { robaAttesa } from '../../src/giochi/sotterraneo/motore/storia.js'

const DISCESA = CAMPAGNA.findIndex(t => t.chiave === 'torre')
const roba = robaAttesa('cavaliere', DISCESA, { gemme: 5 })
roba.torce = 3   // con una torcia in tasca l'eroe fermo non pensa alla guaritrice: il suo fumetto copre chi gli sta davanti e prende il tocco
const ROSICCHIONE = missioneDi('rosicchione')

const browser = await apriBrowser()
const { page, errori } = await apriGioco(browser)
await azzera(page)
await semina(page, {
  coins: 300, settings: { sperimentali: true },
  campagne: { sotterraneo: { tappa: DISCESA, libera: false, stelle: { 0: 3, 1: 3 },
    cfg: { mondo: MONDO, eroe: 'cavaliere', avventure: { cavaliere: { tappa: DISCESA, libera: false, stelle: { 0: 3, 1: 3 },
      missioni: { collana: 'consegnata', rosicchione: 'fatta' }, roba,
      mondo: { parlato: false } } } } },
  },
})
await scegli(page, 'sotterraneo')
await mondoPronto(page)
await attendi(page, 600)

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
// l'eroe va (salto delle prove) accanto a `k` e lo si tocca: `sel` è il suo bersaglio nel mondo
async function vaDa(sel, k, atteso = '[data-dialogo]') {
  // il fumetto del pensiero dell'eroe fermo (docs/sotterraneo/pensieri.md) può coprire chi gli sta accanto e prende il tocco: se il tocco
  // non ha aperto quello che si aspettava, si riporta l'eroe lì e si riprova
  for (let giro = 0; giro < 5; giro++) {
    await page.evaluate(k => { window.__mondo3d.senzaMostri(); window.__mondo3d.vai(k) }, k)
    // dopo il salto la telecamera arriva morbida, e a pochi fotogrammi al secondo due letture uguali non bastano: tre di fila, a mezzo secondo
    let uguali = 0, ultimo = ''
    for (let i = 0; i < 60 && uguali < 3; i++) {
      await attendi(page, 500)
      const b = await page.locator(sel).first().boundingBox().catch(() => null)
      const ora = b ? `${Math.round(b.x)},${Math.round(b.y)}` : ''
      uguali = ora && ora === ultimo ? uguali + 1 : 0
      ultimo = ora
    }
    await page.waitForSelector('[data-pensiero]', { state: 'detached', timeout: 20000 }).catch(() => {})
    await toccaNelMondo(page, sel, { tocca })
    if (await page.waitForSelector(atteso, { timeout: 12000 }).then(() => true).catch(() => false)) return
  }
}
const avventura = async () => (await leggiProfilo(page))?.campagne?.sotterraneo?.cfg?.avventure?.cavaliere || {}
const pagina = async () => Number(await page.locator('[data-dialogo]').getAttribute('data-pagina'))

/* ---------- 1. la ragazza: si apre toccandola, e le pagine vanno avanti col dito ---------- */
await vaDa('[data-personaggio="ragazza"]', 'ragazza')
await page.waitForSelector('[data-dialogo="ragazza"]', { timeout: 60000 })
uguale('toccandola si apre il dialogo, sulla prima pagina', await pagina(), 1)
uguale('col ritratto', await page.locator('[data-dialogo] [data-ritratto-dialogo]').count(), 1)
// chi sta fermo saluta per un attimo (`<nome>-saluta-0`) quando gli si parla, e torna ferma
uguale('lei alza la mano', await page.locator('[data-personaggio="ragazza"]').getAttribute('data-saluta'), '1')
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
uguale('all\'ultima le domande: ci penso io, novità, cosa si dice al pozzo, arrivederci', scelte, 'prendi,novita,racconta,ciao')
await attendi(page, 1800)
uguale('e dopo un attimo torna ferma', await page.locator('[data-personaggio="ragazza"]').getAttribute('data-saluta'), '0')
await scatto(page, 'dialogo-scelte')

/* ---------- 2. la storia: la risposta, e la domanda non torna ---------- */
await toccaIl('[data-scelta="racconta"]')
await page.waitForSelector('[data-riga][data-racconto]', { timeout: 3000 })
uguale('la risposta riparte dalla prima pagina', await pagina(), 1)
await nelDialogo(page, null, { tocca: toccaIl })
uguale('chiesta, la storia non si richiede', await page.locator('[data-scelta="racconta"]').count(), 0)

/* ---------- 2b. «Novità?»: una frase sua, che gira ed è ricordata nell'avventura ---------- */
await toccaIl('[data-scelta="novita"]')
await page.waitForSelector('[data-riga][data-novita]', { timeout: 3000 })
const novita1 = await page.locator('[data-riga]').innerText()
controlla('«Novità?» risponde con una frase, senza segnaposti', novita1.length > 10 && !/[{}]/.test(novita1), novita1)
await nelDialogo(page, null, { tocca: toccaIl })
uguale('chiesta, la novità non si richiede', await page.locator('[data-scelta="novita"]').count(), 0)
await attendi(page, 800)   // l'archivio rimanda le scritture
uguale('e l\'avventura ricorda che gliel\'hai chiesto',
       (await avventura()).mondo?.novita?.ragazza?.n, 1)

/* ---------- 3. una scelta porta alla sua azione: prendere la missione ---------- */
await toccaIl('[data-scelta="prendi"][data-missione="goblin"]')
await page.waitForSelector('[data-riga][data-fase="presa"]', { timeout: 3000 })
uguale('lei ringrazia con la sua frase', await page.locator('[data-riga]').innerText(), DIALOGHI.ragazza.presa)
uguale('e nell\'avventura il goblin è preso', (await avventura()).missioni?.goblin, 'presa')
uguale('sopra la testa il «?» grigio', await page.locator('[data-personaggio="ragazza"]').getAttribute('data-segno'), 'attesa')

/* ---------- 4. un tocco altrove chiude, e cammina ---------- */
{
  // una cella dove si cammina, a qualche passo dall'eroe, e dove cade a schermo (sopra il dialogo, che sta in fondo)
  const m = ilMondo(), terra = terraDelMondo(m)
  const [x0, y0] = (await page.locator('[data-eroe-mondo]').getAttribute('data-cella')).split(',').map(Number)
  let meta = null
  // in linea retta (nord, ovest o est: sotto c'è il dialogo), tutta strada libera
  for (const [dx, dy] of [[0, -1], [-1, 0], [1, 0]]) for (let k = 5; k >= 3 && !meta; k--)
    if (Array.from({ length: k }, (_, i) => i + 1).every(i => terra.passa(x0 + dx * i, y0 + dy * i))) meta = { x: x0 + dx * k, y: y0 + dy * k }
  const p = await page.evaluate(([a, b]) => { const s = window.__sotterraneo3d; const q = s.aSchermo(a, s.quota(a, b), b); return [q.x, q.y] }, [meta.x + 0.5, meta.y + 0.5])
  const v = await page.locator('[data-mondo3d]').boundingBox()
  const prima = await page.locator('[data-eroe-mondo]').getAttribute('data-cella')
  await tocca(v.x + p[0], v.y + p[1])
  await attendi(page, 300)
  uguale('un tocco sul prato chiude il dialogo', await page.locator('[data-dialogo]').count(), 0)
  await page.waitForFunction(c => document.querySelector('[data-eroe-mondo]').dataset.cella !== c, prima, { timeout: 60000 })
  await fermoNelMondo(page)
  controlla('e l\'eroe va dove si è toccato', true)
  uguale('e la barra in basso è al suo posto', await page.locator('[data-barra-giu]').count(), 1)
}

/* ---------- 5. il mugnaio: la consegna, e il premio detto ---------- */
await vaDa('[data-personaggio="mugnaio"]', 'mugnaio')
await page.waitForSelector('[data-dialogo="mugnaio"]', { timeout: 60000 })
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
await vaDa('[data-minatore]', 'minatore')
await page.waitForSelector('[data-dialogo="minatore"]', { timeout: 60000 })
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
await vaDa('[data-mercante="erborista"][data-citta="villaggio"]', 'mercante:villaggio:erborista')
await page.waitForSelector('[data-dialogo="erborista"]', { timeout: 60000 })
await nelDialogo(page, '[data-scelta="bottega"]', { tocca: toccaIl })
await page.waitForSelector('[data-bottega][data-mercante-aperto="erborista"]', { timeout: 3000 })
uguale('«mi servono pozioni» apre la bottega della guaritrice', await page.locator('[data-dialogo]').count(), 0)
await attendi(page, 400)
await toccaIl('[data-bottega] [data-chiudi]')
await attendi(page, 300)
await vaDa('[data-mercante="incantatrice"][data-citta="villaggio"]', 'mercante:villaggio:incantatrice')
await page.waitForSelector('[data-dialogo="incantatrice"]', { timeout: 60000 })
await nelDialogo(page, '[data-scelta="bottega"]', { tocca: toccaIl })
await page.waitForSelector('[data-bottega][data-mercante-aperto="incantatrice"]', { timeout: 3000 })
uguale('«fammi vedere la magia» apre la bottega dell\'incantatrice', await page.locator('[data-dialogo]').count(), 0)
await attendi(page, 400)
await scatto(page, 'dialogo-incantatrice-bottega')
await toccaIl('[data-bottega] [data-chiudi]')
await attendi(page, 300)
await vaDa('[data-mercante="rigattiere"][data-citta="villaggio"]', 'mercante:villaggio:rigattiere')
await nelDialogo(page, '[data-scelta="vendi"]', { tocca: toccaIl })
await page.waitForSelector('[data-bottega][data-mercante-aperto="rigattiere"]', { timeout: 15000 })
uguale('«ho roba da vendere» apre il mercante sulla linguetta delle tasche',
       await page.locator('[data-scheda="vendi"]').getAttribute('aria-selected'), 'true')

uguale('nessun errore in console', errori.join(' | '), '')
await browser.close()
riassunto('i dialoghi della terra di sopra, col dito')
