/* ═══════════════════════════════════════════════════════════════════
   IL PORTALE E LA RIPRESA ESATTA, COL DITO VERO

   La stanza che era del mercante ha un portale (docs/sotterraneo/
   portale-e-sosta.md): toccandolo si sale al villaggio, e nel villaggio compare il
   gemello che riporta giù esattamente dov'eri, col piano com'era. Qui il
   giro intero: si scende nella prima discesa (la cripta dell'altare), si apre una porta, si ferisce
   un mostro e si scappa, si entra nel portale, si compra dall'erborista,
   si torna giù dal gemello e si ritrova tutto; poi si esce con la ✕ e si
   riprende da «riprendi da qui» in home, nello stesso punto. Uscire con la
   ✕ non è un portale: lì la sosta è un'«uscita», sopra non c'è il gemello e
   rientrando si è già giù, dietro il velo della pausa.

   Il piano si sceglie dal seme (`#seme=` nell'indirizzo, come
   `domanda.test.mjs`): lo stesso generatore gira qui in Node, e dice dove
   stanno porta, mostro e portale. Si cammina toccando la tela come un
   bambino, una cella lontana alla volta (`Input.dispatchTouchEvent` via
   CDP), e si risponde col tasto giusto della domanda (`data-giusta`).
   `node test/esegui.mjs sotterraneo-portale`
   tempo: 120
   ═══════════════════════════════════════════════════════════════════ */
import { apriBrowser, apriGioco, azzera, semina, scatto, attendi, scegli, leggiProfilo, scendiNelSotterraneo,
         compraNellaBottega, nelDialogo }
  from '../aiuto/browser.mjs'
import { controlla, uguale, nota, riassunto } from '../aiuto/verifica.mjs'
import { CAMPAGNA } from '../../src/giochi/sotterraneo/dati/campagna.js'
import { T } from '../../src/giochi/sotterraneo/dati/mondo.js'
import { PORTALE } from '../../src/giochi/sotterraneo/dati/terra-mappa.js'
import { MONDO } from '../../src/giochi/sotterraneo/motore/avventure.js'
import { Corsa } from '../../src/giochi/sotterraneo/motore/corsa.js'
import { percorso } from '../../src/motore/passi.js'

const roba = { v: 1, gemme: 60, zaino: [], mano: 'spada', mancina: null, corpo: 'corazza', dito: null,
               torcia: 0, torce: 0 }

/* ── il piano: la prima discesa con un portale vicino, una porta e un mostro da ferire, senza mostri sulla strada ── */
function scegliIlPiano() {
  let meglio = null
  for (let seme = 1; seme < 400; seme++) {
    const c = new Corsa(CAMPAGNA[0], { seme, eroe: 'cavaliere', roba })
    const L = c.livello
    const da = { x: Math.floor(c.eroe.x), y: Math.floor(c.eroe.y) }
    const portale = L.robe.find(r => r.che === 'portale')
    if (!portale) continue
    const lungo = q => (percorso((x, y) => L.calpestabile(x, y), da, q) || { length: 999 }).length
    const strada = percorso((x, y) => L.calpestabile(x, y), da, portale)
    if (!strada) continue
    const stanze = new Set(strada.map(q => L.stanzaDi(q.x, q.y)?.id))
    if (L.robe.some(r => r.che === 'mostro' && stanze.has(L.stanzaDi(r.x, r.y)?.id))) continue
    const porta = L.robe.filter(r => r.che === 'porta').sort((a, b) => lungo(a) - lungo(b))[0]
    const mostro = L.robe.filter(r => r.che === 'mostro' && !r.chiave && r.ossa > c.colpo(r))
      .sort((a, b) => lungo(a) - lungo(b))[0]
    if (!porta || !mostro) continue
    const costo = strada.length + lungo(porta) + lungo(mostro)
    if (!meglio || costo < meglio.costo) meglio = { seme, costo, c, porta, mostro, portale }
  }
  return meglio
}
const piano = scegliIlPiano()
controlla('c\'è un piano della prima discesa col portale, una porta e un mostro', !!piano)
const L = piano.c.livello
const indice = r => L.robe.indexOf(r)
const aperte = new Set()   // i gruppi di porte aperti, per camminare nel modello come nel gioco

const browser = await apriBrowser()
const { page, errori } = await apriGioco(browser)
await azzera(page)
await semina(page, {
  coins: 300, settings: { sperimentali: true },
  campagne: { sotterraneo: { tappa: 0, libera: false, stelle: {},
    cfg: { mondo: MONDO, eroe: 'cavaliere', avventure: { cavaliere: { tappa: 0, libera: false, stelle: {}, missioni: {},
      roba, terra: { nebbia: 'f'.repeat(768), dove: [55, 11], parlato: true } } } } } },
})
await scegli(page, 'sotterraneo')
await page.waitForSelector('[data-terra]', { timeout: 5000 })
await page.evaluate(s => { location.hash = 'seme=' + s }, piano.seme)
await scendiNelSotterraneo(page, 0)
await page.waitForSelector('.sot-tela', { timeout: 5000 })
await attendi(page, 700)

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

/* ── giù: dov'è l'eroe lo dice la tela, e una cella si trova sullo schermo da lì ── */
const tela = page.locator('.sot-tela')
const cellaGiu = () => tela.getAttribute('data-eroe')
async function schermoDi(c) {
  const [ex, ey] = (await cellaGiu()).split(',').map(Number)
  const [sx, sy] = (await tela.getAttribute('data-eroe-schermo')).split(',').map(Number)
  const s = Number(await tela.getAttribute('data-scala')) * T
  const b = await tela.boundingBox()
  return { x: b.x + sx + (c.x - ex) * s, y: b.y + sy + (c.y - ey) * s, b }
}
// sullo schermo e lontano dalla mappina (in alto a destra), dallo zaino e dalla riga in fondo
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
const apertoGiu = async () => (await page.locator('.sot-domanda, [data-azione="portale"], [data-azione="scappa"]').count()) > 0
// cammina verso la cosa in `a` toccando la cella più lontana della strada che sta sullo schermo, finché si è
// accanto; poi tocca la cosa, che da accanto è in luce (una cosa al buio non si tocca: si cammina lì)
async function vaiGiu(a, { toccala = true } = {}) {
  // per strada si toccano solo celle vuote: una cella con sopra una fonte o un forziere aprirebbe il suo foglio
  const buona = (x, y) => L.calpestabile(x, y) &&
    !L.robe.some(r => r.x === x && r.y === y && r.che !== 'arredo' && r.che !== 'gemme' &&
                      !(r.che === 'porta' && aperte.has(r.gruppo)))
  for (let giro = 0; giro < 30; giro++) {
    // un mostro che ci raggiunge per strada: si scappa (costa un graffio), e si va avanti
    if (a.che !== 'mostro' && await page.locator('[data-azione="scappa"]').count()) {
      await page.locator('[data-azione="scappa"]').click()
      await attendi(page, 300)
      continue
    }
    // un foglio aperto per sbaglio (una cosa toccata passando) si chiude con «dopo»
    if (await page.locator('[data-azione="dopo"]').count() && !(await page.locator('[data-azione="portale"]').count())) {
      await page.locator('[data-azione="dopo"]').first().click()
      await attendi(page, 300)
      continue
    }
    if (await apertoGiu()) break
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

/* ---------- 1. una porta si apre ---------- */
await vaiGiu(piano.porta)
await page.waitForSelector('.sot-domanda', { timeout: 8000 })
await rispondi(true)
uguale('la porta chiede e si apre', await page.locator('.sot-domanda').count(), 0)
aperte.add(piano.porta.gruppo)

/* ---------- 2. un mostro si ferisce, e si scappa ---------- */
await vaiGiu(piano.mostro)
await page.waitForSelector('[data-azione="scappa"]', { timeout: 10000 })
await rispondi(true)
controlla('un colpo e il mostro è ancora in piedi', await page.locator('[data-azione="scappa"]').count() === 1)
await page.locator('[data-azione="scappa"]').click()
await attendi(page, 500)
await fermoGiu()

/* ---------- 3. il portale ---------- */
await vaiGiu(piano.portale, { toccala: false })
const vicino = await schermoDi(piano.portale)
controlla('il portale si vede sullo schermo', dentro(vicino))
await attendi(page, 400)
await scatto(page, 'portale-discesa')
await tocca(vicino.x, vicino.y)
await page.waitForSelector('[data-azione="portale"]', { timeout: 8000 })
uguale('il portale non chiede niente', await page.locator('.sot-domanda').count(), 0)
await scatto(page, 'portale-foglio')
const dovEro = await cellaGiu()
await page.locator('[data-azione="portale"]').click()

/* ---------- 4. su nel villaggio: il gemello ---------- */
await page.waitForSelector('[data-terra]', { timeout: 5000 })
await attendi(page, 700)
uguale('si sbuca accanto al portale gemello', await page.locator('[data-eroe-terra]').getAttribute('data-cella'),
       PORTALE.accanto.join(','))
uguale('che sta nel villaggio', await page.locator('[data-portale]').count(), 1)
uguale('e la carta in cima dice la discesa a metà', await page.locator('[data-ripresa] [data-ritaglio]').count(), 1)
await scatto(page, 'portale-villaggio')
let p = await leggiProfilo(page)
const sosta = p?.campagne?.sotterraneo?.cfg?.avventure?.cavaliere?.sosta
uguale('la sosta ricorda che si è salita dal portale', sosta?.via, 'portale')
controlla('la discesa è nella sosta, coi cambiamenti e non il piano', !!sosta?.robe?.cambi && !Array.isArray(sosta?.robe),
          JSON.stringify(sosta?.robe)?.slice(0, 120))
const cambio = i => (sosta?.robe?.cambi || {})[i] || {}
uguale('con la porta aperta', cambio(indice(piano.porta)).aperta, true)
controlla('e il mostro ferito', cambio(indice(piano.mostro)).ossa < piano.mostro.ossaMax,
          JSON.stringify(cambio(indice(piano.mostro))))
uguale('e l\'eroe dov\'era', `${Math.floor(sosta?.dove?.x)},${Math.floor(sosta?.dove?.y)}`, dovEro)
nota(`la sosta pesa ${JSON.stringify(sosta).length} byte`)

/* ---------- 5. dall'erborista ---------- */
await toccaIl('[data-mercante="erborista"]')
await nelDialogo(page, '[data-scelta="bottega"]', { tocca: toccaIl })
await page.waitForSelector('[data-chiudi]', { timeout: 10000 })
await attendi(page, 500)
await compraNellaBottega(page, 'pozione', { tocca })
await attendi(page, 300)
await toccaIl('[data-chiudi]')
await page.waitForSelector('[data-chiudi]', { state: 'detached', timeout: 3000 })

/* ---------- 6. giù dal gemello: tutto com'era ---------- */
await toccaIl('[data-portale]')
await page.waitForSelector('[data-fumetto-di="portale"] [data-azione="portale-giu"]', { timeout: 10000 })
await attendi(page, 300)
uguale('il fumetto del gemello mostra la discesa ritagliata dalla mappa',
       await page.locator('[data-fumetto-di="portale"] [data-ritaglio]').count(), 1)
await scatto(page, 'portale-gemello-fumetto')
await toccaIl('[data-azione="portale-giu"]')
await page.waitForSelector('.sot-tela', { timeout: 5000 })
await attendi(page, 700)
uguale('si torna giù nel punto esatto', await cellaGiu(), dovEro)
await scatto(page, 'portale-ritorno')
await page.locator('[data-azione="zaino"]').click()
await page.waitForSelector('[data-zaino]', { timeout: 3000 })
uguale('con la pozione comprata sopra', await page.locator('[data-tasca][data-cosa="pozione"]').count(), 1)
await page.locator('[data-azione="chiudi"]').click()
await attendi(page, 300)

/* ---------- 7. si esce con la ✕: non è un portale ----------
   Dalla discesa la ✕ porta in home, non sulla terra di sopra: la sosta è
   un'uscita, senza gemello, e lo stesso piano si ritrova com'era. */
await toccaIl('button[aria-label="indietro"]')
await page.waitForSelector('.carte', { timeout: 5000 })
uguale('la ✕ dalla discesa porta in home', await page.locator('[data-terra]').count(), 0)
await attendi(page, 400)
p = await leggiProfilo(page)
const dopo = p?.campagne?.sotterraneo?.cfg?.avventure?.cavaliere?.sosta
uguale('la sosta ora è un\'uscita, non un portale', dopo?.via, 'uscita')
uguale('la porta è ancora aperta', ((dopo?.robe?.cambi || {})[indice(piano.porta)] || {}).aperta, true)
uguale('e il mostro ha le ossa di prima', ((dopo?.robe?.cambi || {})[indice(piano.mostro)] || {}).ossa,
       cambio(indice(piano.mostro)).ossa)
uguale('e l\'eroe è dove era', `${Math.floor(dopo?.dove?.x)},${Math.floor(dopo?.dove?.y)}`, dovEro)

/* ---------- 8. «riprendi da qui» in home, nello stesso punto, senza passare di sopra ---------- */
uguale('in home si riprende il sotterraneo', await page.locator('[data-riprendi]').getAttribute('data-riprendi'), 'sotterraneo')
controlla('e dice dove', (await page.locator('[data-riprendi]').innerText()).includes(`${CAMPAGNA[0].nome} · piano 1 di`),
          await page.locator('[data-riprendi]').innerText())
uguale('con la scalinata ritagliata dalla mappa', await page.locator('[data-riprendi] [data-ritaglio]').count(), 1)
await scatto(page, 'portale-riprendi-home')
await toccaIl('[data-riprendi]')
await page.waitForSelector('.sot-tela', { timeout: 5000 })
await attendi(page, 700)
uguale('si è già giù, senza la terra di sopra', await page.locator('[data-terra]').count(), 0)
uguale('senza carta in cima e senza gemello', await page.locator('[data-ripresa], [data-portale]').count(), 0)
uguale('e si riprende nel punto esatto', await cellaGiu(), dovEro)
await page.waitForSelector('[data-pausa]', { timeout: 3000 })
await scatto(page, 'portale-riprende-fermo')
await attendi(page, 400)
await toccaIl('[data-pausa] [data-azione="riprendi"]')
await attendi(page, 300)
uguale('toccato il velo, la discesa riparte', await page.locator('[data-pausa]').count(), 0)

/* ---------- 9. col portale vero, invece, il gemello c'è anche se si esce dal villaggio ---------- */
await vaiGiu(piano.portale, { toccala: false })
{
  const q = await schermoDi(piano.portale)
  await tocca(q.x, q.y)
}
await page.waitForSelector('[data-azione="portale"]', { timeout: 8000 })
await page.locator('[data-azione="portale"]').click()
await page.waitForSelector('[data-terra]', { timeout: 5000 })
await attendi(page, 500)
await toccaIl('button[aria-label="indietro"]')
await page.waitForSelector('.carte', { timeout: 5000 })
await scegli(page, 'sotterraneo')
await page.waitForSelector('[data-terra]', { timeout: 5000 })
uguale('uscendo dal villaggio e rientrando, il gemello c\'è ancora', await page.locator('[data-portale]').count(), 1)
uguale('con la carta della discesa a metà', await page.locator('[data-ripresa]').count(), 1)

uguale('nessun errore in console', errori.join(' · '), '')
nota(`seme ${piano.seme}: porta ${indice(piano.porta)}, mostro ${indice(piano.mostro)} (${piano.mostro.tipo}), ` +
     `portale in ${piano.portale.x},${piano.portale.y}`)
await browser.close()
riassunto('il portale e la ripresa esatta col dito')
