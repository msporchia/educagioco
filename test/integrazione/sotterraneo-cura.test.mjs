/* ═══════════════════════════════════════════════════════════════════
   CHI CURA GRATIS, COL DITO VERO

   Salendo dal portale la vita e l'energia restano quelle di giù
   (docs/sotterraneo/terra-di-sopra.md, «Chi cura»): la barra lo dice, la
   guaritrice e l'incantatrice chiamano con un fumetto sulla testa finché
   serve, e nel dialogo «Curami» / «Ricaricami» rimettono a posto, gratis e
   senza limiti. Qui: la sosta di un portale con l'eroe ferito e scarico, i
   due fumetti, il dialogo che cura (il numero che sale, la barra, la sosta
   scritta), la domanda che dice «sei già in forze», e il gemello che riporta
   giù a vita e energia piene.
   `node test/esegui.mjs sotterraneo-cura`
   tempo: 90
   ═══════════════════════════════════════════════════════════════════ */
import { apriBrowser, apriGioco, azzera, semina, scatto, attendi, scegli, leggiProfilo, camminaVerso, nelDialogo, finestraFerma }
  from '../aiuto/browser.mjs'
import { controlla, uguale, riassunto } from '../aiuto/verifica.mjs'
import { CAMPAGNA } from '../../src/giochi/sotterraneo/dati/campagna.js'
import { MERCANTI, PORTALE } from '../../src/giochi/sotterraneo/dati/terra-mappa.js'
import { MONDO } from '../../src/giochi/sotterraneo/motore/avventure.js'
import { Corsa } from '../../src/giochi/sotterraneo/motore/corsa.js'
import { seminato } from '../../src/giochi/sotterraneo/motore/livello.js'
import { scrivi, PORTALE as VIA_PORTALE } from '../../src/giochi/sotterraneo/motore/sosta.js'

const roba = { v: 1, gemme: 60, zaino: [], mano: null, mancina: null, corpo: 'corazza', dito: null, torcia: 0, torce: 0 }
// una discesa lasciata dal portale, ferito e senza energia
const c = new Corsa(CAMPAGNA[0], { seme: 21, eroe: 'cavaliere', roba, rnd: seminato(21) })
c.vita = Math.max(1, Math.floor(c.vitaMax / 3))
c.energia = 0
const VITA_MAX = c.vitaMax, ENERGIA_MAX = c.energiaMax
const sosta = scrivi(c, 0, { via: VIA_PORTALE })
controlla('l\'eroe di prova ha energia da perdere', ENERGIA_MAX > 0)

const browser = await apriBrowser()
const { page, errori } = await apriGioco(browser)
await azzera(page)
await semina(page, {
  coins: 300, settings: { sperimentali: true },
  campagne: { sotterraneo: { tappa: 0, libera: false, stelle: {},
    cfg: { mondo: MONDO, eroe: 'cavaliere', avventure: { cavaliere: { tappa: 0, libera: false, stelle: {}, missioni: {},
      roba, sosta, terra: { nebbia: 'f'.repeat(768), dove: [...PORTALE.accanto], parlato: true } } } } } },
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
  await finestraFerma(page)
  // chiuso il dialogo la mappa torna a posto scorrendo per un secondo: si tocca quando la cosa sta ferma
  let b = await page.locator(sel).first().boundingBox()
  for (let i = 0; i < 20; i++) {
    await attendi(page, 150)
    const n = await page.locator(sel).first().boundingBox()
    const fermo = Math.abs(n.x - b.x) < 1 && Math.abs(n.y - b.y) < 1
    b = n
    if (fermo) break
  }
  await tocca(b.x + b.width / 2, b.y + b.height / 2)
}
const sostaOra = async () => (await leggiProfilo(page))?.campagne?.sotterraneo?.cfg?.avventure?.cavaliere?.sosta || {}
const vitaInBarra = async () => (await page.locator('[data-barra="sopra"] [data-azione="vita"]').getAttribute('aria-label')).match(/vita (\d+) su (\d+)/).slice(1).map(Number)

/* ---------- 1. salendo non si guarisce, e chi cura chiama ---------- */
uguale('salito dal portale, la barra dice la vita di giù', (await vitaInBarra()).join('/'), `${c.vita}/${VITA_MAX}`)
uguale('la guaritrice chiama', await page.locator('[data-mercante="erborista"] [data-richiamo]').innerText(), 'Sei ferito. Vieni, ti curo.')
controlla('l\'incantatrice chiama per l\'energia', /ricarico/.test(await page.locator('[data-mercante="incantatrice"] [data-richiamo]').innerText()))
uguale('il fabbro e il mercante no', await page.locator('[data-mercante="armaiolo"] [data-richiamo], [data-mercante="rigattiere"] [data-richiamo]').count(), 0)
await scatto(page, 'cura-richiamo')

/* ---------- 2. la guaritrice: «Curami» ---------- */
await camminaVerso(page, MERCANTI.erborista.accanto, { tocca })
await toccaIl('[data-mercante="erborista"]')
await page.waitForSelector('[data-dialogo="erborista"]', { timeout: 15000 })
uguale('mentre si parla il suo fumetto tace', await page.locator('[data-mercante="erborista"] [data-richiamo]').count(), 0)
await nelDialogo(page)
uguale('ferito, «Curami» è la prima domanda', await page.locator('[data-scelte] [data-scelta]').first().getAttribute('data-scelta'), 'cura')
await scatto(page, 'cura-dialogo')
await toccaIl('[data-dialogo] [data-scelta="cura"]')
await page.waitForSelector('[data-cura-fiocco][data-risorsa="vita"]', { timeout: 3000 })
await attendi(page, 150)
await scatto(page, 'cura-vita')
controlla('il numero che sale dice quanti punti', (await page.locator('[data-cura-fiocco]').innerText()).includes(`+${VITA_MAX - c.vita}`))
controlla('la guaritrice risponde a voce sua', (await page.locator('[data-riga][data-cura]').count()) === 1)
await attendi(page, 300)
uguale('la barra è piena', (await vitaInBarra()).join('/'), `${VITA_MAX}/${VITA_MAX}`)
uguale('la sosta è scritta a vita piena', (await sostaOra()).vita, VITA_MAX)
uguale('l\'energia non è sua: resta com\'era', (await sostaOra()).energia, 0)
await nelDialogo(page)
uguale('la domanda non torna nello stesso dialogo', await page.locator('[data-scelta="cura"]').count(), 0)
await toccaIl('[data-dialogo] [data-scelta="ciao"]')
await attendi(page, 300)
uguale('curato, il fumetto se ne va', await page.locator('[data-mercante="erborista"] [data-richiamo]').count(), 0)
controlla('quello dell\'incantatrice resta, non blocca niente', (await page.locator('[data-mercante="incantatrice"] [data-richiamo]').count()) === 1)

/* ---------- 3. di nuovo: «sei già in forze» ---------- */
await toccaIl('[data-mercante="erborista"]')
await page.waitForSelector('[data-dialogo="erborista"]', { timeout: 15000 })
await nelDialogo(page, '[data-scelta="cura"]', { tocca: toccaIl })
await attendi(page, 300)
controlla('in forze lo dice, senza far finta', (await page.locator('[data-riga][data-in-forze]').innerText()).includes('in forze'))
uguale('e non ci sono numeri che salgono', await page.locator('[data-cura-fiocco]').count(), 0)
await toccaIl('[data-dialogo] [data-scelta="ciao"]')
await attendi(page, 300)

/* ---------- 4. l'incantatrice: «Ricaricami» ---------- */
await camminaVerso(page, MERCANTI.incantatrice.accanto, { tocca })
await toccaIl('[data-mercante="incantatrice"]')
await page.waitForSelector('[data-dialogo="incantatrice"]', { timeout: 15000 })
await nelDialogo(page, '[data-scelta="cura"]', { tocca: toccaIl })
await page.waitForSelector('[data-cura-fiocco][data-risorsa="energia"]', { timeout: 3000 })
await attendi(page, 300)
uguale('la sosta è scritta a energia piena', (await sostaOra()).energia, ENERGIA_MAX)
uguale('e la vita è rimasta piena', (await sostaOra()).vita, VITA_MAX)
await nelDialogo(page, '[data-scelta="ciao"]', { tocca: toccaIl })
await attendi(page, 300)
uguale('non chiama più nessuno', await page.locator('[data-richiamo]').count(), 0)

/* ---------- 5. il gemello riporta giù in forze ---------- */
await toccaIl('[data-portale]')
await page.waitForSelector('[data-azione="portale-giu"]', { timeout: 15000 })
await toccaIl('[data-azione="portale-giu"]')
await page.waitForSelector('.sot-tela', { timeout: 5000 })
await attendi(page, 500)
const giu = await page.locator('[data-barra="giu"] [data-azione="vita"]').getAttribute('aria-label')
uguale('giù si riprende a vita piena', giu.match(/vita (\d+) su (\d+)/).slice(1).join('/'), `${VITA_MAX}/${VITA_MAX}`)

uguale('nessun errore in console', errori.join(' | '), '')
await browser.close()
riassunto('chi cura gratis, col dito')
