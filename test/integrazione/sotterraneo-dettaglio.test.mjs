/* ═══════════════════════════════════════════════════════════════════
   IL DETTAGLIO DI UNA MISSIONE NEL DIARIO, COL DITO VERO

   Nel diario 📖 si tocca una voce e se ne apre il dettaglio (docs/sotterraneo/missioni.md): chi te l'ha
   data, cosa ha detto, dove, cosa, il premio, a che punto sei. «Segui questa» sceglie quale missione
   indicano le freccine (docs/sotterraneo/missioni-freccina.md) e la scelta resta nell'avventura; «vai da …»
   manda l'eroe da chi aspetta.

   1. Sopra, con due missioni prese: la freccia azzurra va a quella più vicina; si apre il dettaglio dell'altra,
      si tocca «segui questa», la freccia cambia discesa e la scelta sta nell'avventura; «‹ indietro» torna
      all'elenco, «smetti» ridà la regola di prima, il tocco fuori chiude il diario.
   2. Giù, la stessa scelta guida la freccina in discesa (stesso piano, per seme).
   3. Una consegna pronta e un favore che aspetta: il dettaglio dice «torna dal mugnaio», «vai dal mugnaio» ci
      porta, la consegnata ha anche il suo grazie.

   I tocchi sono tocchi (`Input.dispatchTouchEvent` via CDP).
   `node test/esegui.mjs sotterraneo-dettaglio`
   tempo: 200
   ═══════════════════════════════════════════════════════════════════ */
import { apriBrowser, apriGioco, azzera, semina, scatto, attendi, scegli, leggiProfilo, scendiNelSotterraneo,
         lasciaLaDiscesa, nelDialogo } from '../aiuto/browser.mjs'
import { controlla, uguale, nota, riassunto } from '../aiuto/verifica.mjs'
import { CAMPAGNA } from '../../src/giochi/sotterraneo/dati/campagna.js'
import { PARTENZA } from '../../src/giochi/sotterraneo/dati/terra-mappa.js'
import { missioneDi, personaDi } from '../../src/giochi/sotterraneo/dati/missioni.js'
import { MONDO } from '../../src/giochi/sotterraneo/motore/avventure.js'
import { daLui, titoloDi } from '../../src/giochi/sotterraneo/motore/missioni.js'
import { robaAttesa } from '../../src/giochi/sotterraneo/motore/storia.js'
import { sogliaDi } from '../../src/giochi/sotterraneo/dati/livelli.js'
// al livello atteso della torre: due gradini sotto la guardia non fa scendere (docs/sotterraneo/zone.md)
const crescita = { esp: sogliaDi(3) }

const TORRE = CAMPAGNA.findIndex(t => t.chiave === 'torre')
const DISCESE = TORRE + 1
const roba = robaAttesa('cavaliere', TORRE, { gemme: 5 })
const nomeDiscesa = chiave => CAMPAGNA.find(t => t.chiave === chiave).nome

const browser = await apriBrowser()
const { page, errori } = await apriGioco(browser)
await azzera(page)

const profilo = (missioni, extra = {}, dove = PARTENZA.piede) => ({
  coins: 300, settings: { sperimentali: true },
  campagne: { sotterraneo: { tappa: DISCESE, libera: false, stelle: { 0: 3, 1: 3, 2: 3 },
    cfg: { mondo: MONDO, eroe: 'cavaliere', avventure: { cavaliere: { tappa: DISCESE, libera: false,
      stelle: { 0: 3, 1: 3, 2: 3 }, missioni, roba, crescita, ...extra,
      terra: { nebbia: 'f'.repeat(768), dove, parlato: true } } } } } },
})
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
const apriIlDiario = async () => {
  await toccaIl('[data-azione="diario"]')
  await page.waitForSelector('[data-diario]', { timeout: 5000 })
  await attendi(page, 250)
}
async function entra(missioni, extra) {
  await semina(page, profilo(missioni, extra))
  await scegli(page, 'sotterraneo')
  await page.waitForSelector('[data-terra]', { timeout: 5000 })
  await attendi(page, 600)
}

/* ---------- 1. sopra: scegliere quale missione seguire ---------- */
await entra({ badessa: 'presa', rosicchione: 'presa' })
const prima = await page.locator('[data-meta-fuori]').getAttribute('data-meta-fuori')
controlla('la freccia azzurra c\'è e va a una delle due discese', ['altare', 'torre'].includes(prima), prima)
const altra = prima === 'torre' ? 'badessa' : 'rosicchione'   // la missione che non è la più vicina
const M = missioneDi(altra), P = personaDi(M.da)

await apriIlDiario()
uguale('toccando una voce non succede niente finché non si tocca: l\'elenco è aperto', await page.locator('[data-dettaglio]').count(), 0)
await toccaIl(`[data-diario] li[data-missione="${altra}"]`)
await page.waitForSelector('[data-dettaglio]', { timeout: 3000 })
await attendi(page, 200)
const dett = page.locator('[data-dettaglio]')
uguale('si apre il dettaglio giusto', await dett.getAttribute('data-missione'), altra)
uguale('è una missione presa', await dett.getAttribute('data-stato'), 'presa')
uguale('l\'elenco non c\'è più, nella stessa finestra', await page.locator('[data-sezione]').count(), 0)
uguale('chi te l\'ha data: il suo nome', (await dett.locator('[data-dettaglio-chi] b').innerText()).trim(), P.nome)
uguale('e la sua faccia', await dett.locator('[data-dettaglio-chi] .sot-ritratto, [data-dettaglio-chi] svg').count(), 1)
uguale('il racconto è la sua battuta', (await dett.locator('[data-racconto]').innerText()).trim(), `«${M.dice}»`)
{
  const dove = await dett.locator('[data-dettaglio-dove]').innerText()
  controlla('dove: il nome della discesa e il piano, col ritaglio della mappa',
            dove.includes(nomeDiscesa(M.discesa)) && dove.includes(`piano ${M.piano + 1}`)
            && await dett.locator('[data-dettaglio-dove] [data-ritaglio]').count() === 1, dove)
  const cosa = await dett.locator('[data-dettaglio-cosa]').innerText()
  controlla('cosa: il mostro col nome', cosa.includes(titoloDi(M)) && (await dett.locator('[data-dettaglio-cosa]').getAttribute('data-tipo')) === M.tipo, cosa)
  const premio = await dett.locator('[data-dettaglio-premio]').innerText()
  controlla('il premio: gemme, monete, roba col suo nome',
            (!M.premio.gemme || premio.includes(`💎 ${M.premio.gemme}`)) && (!M.premio.monete || premio.includes(`🪙 ${M.premio.monete}`)), premio)
}
uguale('lo stato', (await dett.locator('[data-esito]').innerText()).trim(), 'Da fare')
controlla('il tasto «segui questa» c\'è, e non si sta ancora seguendo',
          (await page.locator('[data-azione="segui"]').innerText()).includes('segui questa') && !(await page.locator('[data-azione="segui"]').getAttribute('data-segui-attivo')))
uguale('non c\'è «vai da»: la missione è già presa', await page.locator('[data-azione="vai-da"]').count(), 0)
await scatto(page, 'missioni-dettaglio')

await toccaIl('[data-azione="segui"]')
await attendi(page, 400)
uguale('adesso si segue', await page.locator('[data-azione="segui"]').getAttribute('data-segui-attivo'), '1')
uguale('la scelta sta nell\'avventura', (await avventura()).segui, altra)

// indietro: l'elenco, con la voce segnata
await toccaIl('[data-azione="indietro-diario"]')
await attendi(page, 250)
uguale('«‹ indietro» riporta all\'elenco', await page.locator('[data-dettaglio]').count(), 0)
uguale('e la missione seguita è segnata', await page.locator(`[data-diario] li[data-segui]`).getAttribute('data-missione'), altra)
// il tocco fuori chiude tutto il diario
{
  const v = await page.locator('[data-diario]').boundingBox()
  await tocca(v.x + 6, v.y + v.height - 6)
}
await attendi(page, 300)
uguale('il tocco fuori chiude il diario', await page.locator('[data-diario]').count(), 0)
await attendi(page, 300)
uguale('la freccia azzurra va alla discesa della missione scelta', await page.locator('[data-meta-fuori]').getAttribute('data-meta-fuori'), M.discesa)
controlla('e non è più quella di prima', M.discesa !== prima)

// smettere ridà la regola di prima
await apriIlDiario()
await toccaIl(`[data-diario] li[data-missione="${altra}"]`)
await page.waitForSelector('[data-dettaglio]', { timeout: 3000 })
uguale('riaprendo, la missione si segue ancora', await page.locator('[data-azione="segui"]').getAttribute('data-segui-attivo'), '1')
await toccaIl('[data-azione="segui"]')
await attendi(page, 400)
uguale('smesso: la scelta non c\'è più nell\'avventura', (await avventura()).segui, undefined)
await toccaIl('[data-diario] [data-chiudi]')
await attendi(page, 300)
uguale('e la freccia torna alla più vicina', await page.locator('[data-meta-fuori]').getAttribute('data-meta-fuori'), prima)

/* ---------- 2. giù: la stessa scelta guida la freccina ---------- */
// due missioni nella torre: quella più vicina cambia a seconda del piano, quindi si guarda quale vince di
// difetto e poi si sceglie l'altra, sullo stesso piano (stesso seme)
const SEME = 11
async function scendiENota(missioni, extra) {
  await entra(missioni, extra)
  await page.evaluate(s => { location.hash = 'seme=' + s }, SEME)
  await scendiNelSotterraneo(page, TORRE)
  await page.waitForSelector('.sot-tela', { timeout: 5000 })
  await page.waitForSelector('[data-rotta]', { state: 'attached', timeout: 5000 })
  await attendi(page, 500)
  return page.locator('[data-rotta]').getAttribute('data-missione-rotta')
}
const dDifetto = await scendiENota({ goblin: 'presa', chiavi: 'presa' })
controlla('di difetto la freccina segue una delle due', ['goblin', 'chiavi'].includes(dDifetto), dDifetto)
const scelta = dDifetto === 'goblin' ? 'chiavi' : 'goblin'
await lasciaLaDiscesa(page)
const dScelta = await scendiENota({ goblin: 'presa', chiavi: 'presa' }, { segui: scelta })
uguale('con «segui questa» la freccina cambia obiettivo', dScelta, scelta)
uguale('e la riga che segue ha il suo segno', await page.locator('[data-promemoria] li[data-segui]').getAttribute('data-missione'), scelta)
await lasciaLaDiscesa(page)

/* ---------- 3. la consegna pronta, il favore che aspetta, la consegnata ---------- */
await entra({ rosicchione: 'fatta', collana: 'consegnata', badessa: 'consegnata' })
await apriIlDiario()
await toccaIl('[data-diario] li[data-missione="rosicchione"]')
await page.waitForSelector('[data-dettaglio]', { timeout: 3000 })
await attendi(page, 200)
uguale('la fatta dice a chi tornare', (await page.locator('[data-dettaglio] [data-esito]').innerText()).trim(), 'Fatta: torna dal mugnaio')
uguale('non si segue: si porta', await page.locator('[data-azione="segui"]').count(), 0)
uguale('«vai dal mugnaio»', (await page.locator('[data-azione="vai-da"]').innerText()).replace(/\s+/g, ' ').trim().replace(/^\S+ /, ''), 'vai dal mugnaio')
{
  const premio = await page.locator('[data-dettaglio-premio]').innerText()
  controlla('il premio ha il gioiello col suo nome e le monete', premio.includes('Amuleto azzurro') && premio.includes('🪙 2'), premio)
}
await scatto(page, 'missioni-dettaglio-fatta')
await toccaIl('[data-azione="vai-da"]')
await attendi(page, 300)
uguale('«vai da» chiude il diario', await page.locator('[data-diario]').count(), 0)
await page.waitForSelector('[data-dialogo="mugnaio"] [data-missione="rosicchione"][data-fase="consegna"]', { timeout: 30000 })
uguale('e l\'eroe va dal mugnaio: il dialogo è aperto', await page.locator('[data-dialogo="mugnaio"]').count(), 1)
await nelDialogo(page, '[data-scelta="consegna"][data-missione="rosicchione"]', { tocca: toccaIl })
await attendi(page, 700)
await nelDialogo(page, '[data-scelta="ciao"]', { tocca: toccaIl })
await attendi(page, 300)

await apriIlDiario()
const offerta = await page.locator('[data-sezione="ti-aspettano"] li').first().getAttribute('data-missione')
if (offerta) {
  const O = missioneDi(offerta)
  await toccaIl(`[data-diario] li[data-missione="${offerta}"]`)
  await page.waitForSelector('[data-dettaglio]', { timeout: 3000 })
  uguale('il favore che aspetta ha il suo dettaglio', await page.locator('[data-dettaglio]').getAttribute('data-stato'), 'offerta')
  uguale('con il racconto di chi lo chiede', (await page.locator('[data-racconto]').innerText()).trim(), `«${O.dice}»`)
  uguale('«vai da …» per andare a prenderlo', (await page.locator('[data-azione="vai-da"]').innerText()).replace(/\s+/g, ' ').trim().replace(/^\S+ /, ''),
         'vai ' + daLui(personaDi(O.da).chi))
  uguale('e non si segue ancora', await page.locator('[data-azione="segui"]').count(), 0)
  await toccaIl('[data-azione="indietro-diario"]')
  await attendi(page, 250)
} else nota('nessun favore offerto in questo profilo')

await toccaIl('[data-diario] li[data-missione="rosicchione"]')
await page.waitForSelector('[data-dettaglio]', { timeout: 3000 })
await attendi(page, 200)
uguale('la consegnata ha il suo stato', await page.locator('[data-dettaglio]').getAttribute('data-stato'), 'consegnata')
uguale('e il grazie che ti ha detto', (await page.locator('[data-grazie]').innerText()).trim(), `«${missioneDi('rosicchione').grazie}»`)
uguale('non c\'è niente da seguire né da portare', await page.locator('[data-azione="segui"], [data-azione="vai-da"]').count(), 0)
await scatto(page, 'missioni-dettaglio-consegnata')

uguale('nessun errore in console', errori.join(' · '), '')
await browser.close()
riassunto('il dettaglio di una missione nel diario')
