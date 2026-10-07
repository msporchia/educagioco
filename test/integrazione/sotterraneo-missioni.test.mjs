/* ═══════════════════════════════════════════════════════════════════
   UNA MISSIONE, COL DITO VERO

   Chi sta sulla terra di sopra dà missioni legate a una discesa
   (docs/sotterraneo/missioni.md). Qui il giro intero: la ragazza del
   pozzo ha il «!» sopra la testa (e nessun altro: una missione per volta), le si parla, si prende la missione (la
   collana della nonna, al primo piano della scalinata antica), si scende,
   si trova il forziere d'oro con la collana sopra, si risponde e la si
   prende, si risale dal portale, si torna da lei (adesso ha il «?») e si
   consegna: il premio in gemme finisce nella roba, le monete no.

   Il piano si sceglie dal seme (`#seme=`), come in `sotterraneo-portale`:
   lo stesso generatore gira qui in Node e dice dove stanno il forziere
   della missione e il portale. I tocchi sono tocchi
   (`Input.dispatchTouchEvent` via CDP).
   `node test/esegui.mjs sotterraneo-missioni`
   tempo: 150
   ═══════════════════════════════════════════════════════════════════ */
import { apriBrowser, apriGioco, azzera, semina, scatto, attendi, scegli, leggiProfilo, scendiNelSotterraneo,
         camminaVerso } from '../aiuto/browser.mjs'
import { controlla, uguale, nota, riassunto } from '../aiuto/verifica.mjs'
import { CAMPAGNA } from '../../src/giochi/sotterraneo/dati/campagna.js'
import { T } from '../../src/giochi/sotterraneo/dati/mondo.js'
import { PERSONAGGI, PORTALE } from '../../src/giochi/sotterraneo/dati/terra-mappa.js'
import { missioneDi } from '../../src/giochi/sotterraneo/dati/missioni.js'
import { MONDO } from '../../src/giochi/sotterraneo/motore/avventure.js'
import { Corsa } from '../../src/giochi/sotterraneo/motore/corsa.js'
import { robaAttesa } from '../../src/giochi/sotterraneo/motore/storia.js'
import { percorso } from '../../src/motore/passi.js'

const MISSIONE = missioneDi('collana')
const DISCESA = CAMPAGNA.findIndex(t => t.chiave === MISSIONE.discesa)
const roba = robaAttesa('cavaliere', DISCESA, { gemme: 5 })

/* ── il piano: il forziere della collana e il portale raggiungibili senza porte e senza stanze coi mostri ── */
function scegliIlPiano() {
  let meglio = null
  for (let seme = 1; seme < 600; seme++) {
    const c = new Corsa(CAMPAGNA[DISCESA], { seme, eroe: 'cavaliere', roba, missioni: [MISSIONE] })
    const L = c.livello
    const forziere = L.robe.find(r => r.missione === MISSIONE.id)
    const portale = L.robe.find(r => r.che === 'portale')
    if (!forziere || !portale) continue
    const chiuse = new Set(L.robe.filter(r => r.che === 'porta').map(r => r.x + ',' + r.y))
    const libera = (x, y) => L.calpestabile(x, y) && !chiuse.has(x + ',' + y)
    const da = { x: Math.floor(c.eroe.x), y: Math.floor(c.eroe.y) }
    const andata = percorso(libera, da, forziere, { arrivoLibero: false })
    const ritorno = andata && percorso(libera, forziere, portale, { arrivoLibero: false })
    if (!andata || !ritorno) continue
    const stanze = new Set([...andata, ...ritorno].map(q => L.stanzaDi(q.x, q.y)?.id))
    if (L.robe.some(r => r.che === 'mostro' && stanze.has(L.stanzaDi(r.x, r.y)?.id))) continue
    const costo = andata.length + ritorno.length
    if (!meglio || costo < meglio.costo) meglio = { seme, costo, c, forziere, portale }
  }
  return meglio
}
const piano = scegliIlPiano()
controlla('c\'è un piano della scalinata col forziere della collana a portata di mano', !!piano)
const L = piano.c.livello

const browser = await apriBrowser()
const { page, errori } = await apriGioco(browser)
await azzera(page)
const ragazza = PERSONAGGI.ragazza
await semina(page, {
  coins: 300, settings: { sperimentali: true },
  campagne: { sotterraneo: { tappa: DISCESA, libera: false, stelle: { 0: 3 },
    cfg: { mondo: MONDO, eroe: 'cavaliere', avventure: { cavaliere: { tappa: DISCESA, libera: false, stelle: { 0: 3 },
      missioni: {}, roba, terra: { nebbia: 'f'.repeat(768), dove: ragazza.accanto, parlato: true } } } } } },
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
const missioneNelProfilo = async () =>
  (await leggiProfilo(page))?.campagne?.sotterraneo?.cfg?.avventure?.cavaliere || {}

/* ---------- 1. la ragazza del pozzo ha qualcosa da chiedere ---------- */
uguale('sopra la ragazza c\'è il punto esclamativo', await page.locator('[data-personaggio="ragazza"]').getAttribute('data-segno'), '!')
uguale('e nessun altro: in tutto sulla mappa c\'è un solo segno, il minatore compreso (una missione per volta)',
       await page.locator('[data-personaggio][data-segno], [data-minatore] [data-segno]').count(), 1)
await scatto(page, 'missioni-villaggio')
await toccaIl('[data-personaggio="ragazza"]')
await page.waitForSelector('[data-fumetto-di="ragazza"] [data-fase="offre"]', { timeout: 8000 })
const chiede = await page.locator('[data-fumetto]').innerText()
controlla('il fumetto dice cosa, dove e il premio', chiede.includes('collana') && chiede.includes(CAMPAGNA[DISCESA].nome) &&
          chiede.includes('piano 1') && chiede.includes(String(MISSIONE.premio.gemme)), chiede)
await attendi(page, 300)
await scatto(page, 'missioni-fumetto')
await toccaIl('[data-azione="prendi-missione"]')
await attendi(page, 500)
uguale('presa, il fumetto la ricorda', await page.locator('[data-fumetto-di="ragazza"] [data-fase="aspetta"]').count(), 1)
uguale('e da presa il segno è il punto di domanda, ancora uno solo', await page.locator('[data-personaggio][data-segno]').evaluateAll(
  els => els.map(e => e.dataset.personaggio + e.dataset.segno).join(',')), 'ragazza?')
uguale('la missione è nell\'avventura', (await missioneNelProfilo()).missioni?.collana, 'presa')

/* ---------- 2. giù, al piano giusto, il forziere d'oro della collana ---------- */
await page.evaluate(s => { location.hash = 'seme=' + s }, piano.seme)
await scendiNelSotterraneo(page, DISCESA)
await page.waitForSelector('.sot-tela', { timeout: 5000 })
await attendi(page, 700)

const tela = page.locator('.sot-tela')
const cellaGiu = () => tela.getAttribute('data-eroe')
async function schermoDi(c) {
  const [ex, ey] = (await cellaGiu()).split(',').map(Number)
  const [sx, sy] = (await tela.getAttribute('data-eroe-schermo')).split(',').map(Number)
  const s = Number(await tela.getAttribute('data-scala')) * T
  const b = await tela.boundingBox()
  return { x: b.x + sx + (c.x - ex) * s, y: b.y + sy + (c.y - ey) * s, b }
}
const dentro = ({ x, y, b }) => x > b.x + 30 && x < b.x + b.width - 30 && y > b.y + 140 && y < b.y + b.height - 110
async function fermoGiu() {
  let prima = null
  for (let i = 0; i < 40; i++) {
    const ora = await cellaGiu()
    if (ora === prima) return
    prima = ora
    await attendi(page, 300)
  }
}
// cammina verso `a` toccando la cella più lontana della strada che sta sullo schermo, e da accanto la tocca
async function vaiGiu(a, { toccala = true } = {}) {
  const buona = (x, y) => L.calpestabile(x, y) &&
    !L.robe.some(r => r.x === x && r.y === y && !['arredo', 'gemme'].includes(r.che))
  for (let giro = 0; giro < 30; giro++) {
    if (await page.locator('[data-azione="dopo"]').count() && !(await page.locator('[data-azione="portale"]').count())) {
      await page.locator('[data-azione="dopo"]').first().click()
      await attendi(page, 300)
      continue
    }
    if (await page.locator('.sot-domanda, [data-azione="portale"]').count()) break
    const [ex, ey] = (await cellaGiu()).split(',').map(Number)
    const via = percorso(buona, { x: ex, y: ey }, a, { arrivoLibero: false }) || []
    if (via.length <= 1) {
      const qui = await schermoDi(a)
      if (toccala && dentro(qui)) await tocca(qui.x, qui.y)
      await attendi(page, 300)
      await fermoGiu()
      return
    }
    let tappa = null
    for (const q of via.slice(0, -1)) { const s = await schermoDi(q); if (dentro(s)) tappa = s }
    if (!tappa) break
    await tocca(tappa.x, tappa.y)
    await attendi(page, 300)
    await fermoGiu()
  }
}
async function rispondi(giusto = true) {
  await page.waitForSelector('.sot-domanda .qz-tasto', { timeout: 5000 })
  await attendi(page, 300)
  const tasto = page.locator(giusto ? '.sot-domanda .qz-tasto[data-giusta]' : '.sot-domanda .qz-tasto:not([data-giusta])')
  await ((await tasto.count()) ? tasto.first() : page.locator('.sot-domanda .qz-tasto').first()).click()
  await attendi(page, 1300)
}

controlla('la discesa è al primo piano', (await page.locator('.sot-piede').textContent()).includes('piano 1'))
await vaiGiu(piano.forziere, { toccala: false })
controlla('il forziere della collana si vede sullo schermo', dentro(await schermoDi(piano.forziere)))
await attendi(page, 500)
await scatto(page, 'missioni-forziere')
const qui = await schermoDi(piano.forziere)
await tocca(qui.x, qui.y)
await page.waitForSelector('.sot-domanda', { timeout: 8000 })
const foglio = await page.locator('.sot-foglio').innerText()
controlla('il foglio dice che è la collana, e che sbagliando si riprova', foglio.includes(MISSIONE.cosa.nome) && foglio.includes('riprovi'),
          foglio)
await scatto(page, 'missioni-foglio-forziere')
await rispondi(true)
await attendi(page, 600)
uguale('trovata: nell\'avventura la missione è fatta', (await missioneNelProfilo()).missioni?.collana, 'fatta')

/* ---------- 3. su dal portale, e dalla ragazza ---------- */
await vaiGiu(piano.portale, { toccala: false })
const varco = await schermoDi(piano.portale)
await tocca(varco.x, varco.y)
await page.waitForSelector('[data-azione="portale"]', { timeout: 8000 })
await page.locator('[data-azione="portale"]').click()
await page.waitForSelector('[data-terra]', { timeout: 5000 })
await attendi(page, 700)
uguale('si sbuca accanto al portale gemello', await page.locator('[data-eroe-terra]').getAttribute('data-cella'),
       PORTALE.accanto.join(','))
uguale('la ragazza adesso aspetta la collana: il punto di domanda, e solo lei', await page.locator('[data-personaggio][data-segno]').evaluateAll(
  els => els.map(e => e.dataset.personaggio + e.dataset.segno).join(',')), 'ragazza?')
await camminaVerso(page, ragazza.accanto, { tocca })
await toccaIl('[data-personaggio="ragazza"]')
await page.waitForSelector('[data-fumetto-di="ragazza"] [data-fase="consegna"]', { timeout: 8000 })
await attendi(page, 300)
await scatto(page, 'missioni-consegna')
const monete = (await leggiProfilo(page)).coins
const gemmePrima = (await missioneNelProfilo()).roba?.gemme
await toccaIl('[data-azione="consegna"]')
await attendi(page, 600)
const a = await missioneNelProfilo()
uguale('consegnata', a.missioni?.collana, 'consegnata')
uguale('il premio sono gemme, nella roba', a.roba?.gemme, gemmePrima + MISSIONE.premio.gemme)
uguale('e le monete non cambiano', (await leggiProfilo(page)).coins, monete)
uguale('la ragazza non ha più segni', await page.locator('[data-personaggio="ragazza"]').getAttribute('data-segno'), null)
uguale('consegnata, arriva la successiva (la cripta saltata): un solo punto esclamativo, sull\'eremita',
       await page.locator('[data-personaggio][data-segno]').evaluateAll(els => els.map(e => e.dataset.personaggio + e.dataset.segno).join(',')),
       'eremita!')
controlla('e il fumetto la saluta', (await page.locator('[data-fumetto]').innerText()).includes('pozzo'))
await scatto(page, 'missioni-fatta')

uguale('nessun errore in console', errori.join(' · '), '')
nota(`seme ${piano.seme}: la collana a ${piano.costo} passi fra andata e ritorno al portale`)
await browser.close()
riassunto('una missione col dito')
