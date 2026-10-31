/* ═══════════════════════════════════════════════════════════════════
   LE POZIONI DI CURA, COL DITO VERO

   Cinque stadi (docs/sotterraneo/roba.md, «Le pozioni»): la guaritrice ha sul banco le quattro che si comprano (dopo cinque discese
   ci sono tutte), con la cura vera sul pannello; al più otto in tasca, e la nona non si compra: il banco lo dice e il tasto resta
   spento; lo zaino dice quante se ne portano (`[data-cure-zaino]`); l'ampolla della vita non si compra e dice «tutta la vita».
   Con più stadi in tasca, bere apre la scelta (`[data-scegli-pozione]`): una riga per stadio, la ✕ in alto a destra, e nello
   scontro dice che poi tocca ancora a te (bere non costa il turno); con un solo stadio si beve e basta (lo prova `integrazione/sotterraneo-barra`).
   `node test/esegui.mjs sotterraneo-pozioni`
   tempo: 150
   ═══════════════════════════════════════════════════════════════════ */
import { apriBrowser, apriGioco, azzera, semina, scatto, attendi, scegli, finestraFerma, scegliAttacco }
  from '../aiuto/browser.mjs'
import { controlla, uguale, nota, riassunto } from '../aiuto/verifica.mjs'
import { COSE, CURE_IN_VENDITA } from '../../src/giochi/sotterraneo/dati/cose.js'
import { POZIONI_MASSIME } from '../../src/giochi/sotterraneo/dati/mondo.js'
import { MONDO } from '../../src/giochi/sotterraneo/motore/avventure.js'
import { crescitaAttesa, robaAttesa } from '../../src/giochi/sotterraneo/motore/storia.js'

const FINITE = 5   // dopo cinque discese la guaritrice ha tutte e quattro le cure
const STELLE = Object.fromEntries(Array.from({ length: FINITE }, (_, i) => [i, 3]))
// sei cure di quattro stadi (l'ampolla della vita, una piccola, una grande, tre pozioni) e niente altro: due tasche in meno al mondo
const ZAINO = ['pozione-piccola', 'pozione', 'pozione', 'pozione', 'pozione-grande', 'ampolla-vita']
const roba = { v: 1, gemme: 2000, zaino: ZAINO, mano: null, mancina: null, corpo: null, dito: null, torcia: 0, torce: 0 }
const crescita = crescitaAttesa('cavaliere', FINITE)

const browser = await apriBrowser()
const { page, errori } = await apriGioco(browser)
await azzera(page)
await semina(page, {
  coins: 300, settings: { sperimentali: true },
  campagne: { sotterraneo: { tappa: FINITE, libera: false, stelle: STELLE,
    cfg: { mondo: MONDO, eroe: 'cavaliere', avventure: { cavaliere: { tappa: FINITE, libera: false, stelle: STELLE, missioni: {}, roba, crescita,
      mondo: { parlato: true } } } } } },
})
// la guaritrice si apre dall'indirizzo (docs/core/comandi.md: `#bottega=`), con le sole cose in tasca scritte lì
await page.evaluate(z => { location.hash = `bottega=erborista&gemme=2000&zaino=${z}`; location.reload() }, ZAINO.join(','))
await page.waitForSelector('.carte', { timeout: 10000 })
await scegli(page, 'sotterraneo')
await page.waitForSelector('[data-bottega]', { timeout: 8000 })
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
const gemmeBottega = async () => Number((await page.locator('[data-gemme-bottega]').innerText()).match(/\d+/)[0])
const tasto = async () => (await page.locator('[data-azione="compra"]').innerText()).replace(/\s+/g, ' ').trim()

/* ---------- 1. il banco della guaritrice ---------- */
uguale('sul banco le quattro cure che si comprano, nell\'ordine degli stadi',
       (await page.locator('[data-scheda="pozioni"][aria-selected="true"]').count() === 1) &&
       (await page.locator('[data-casella-pezzo]').evaluateAll(es => es.map(e => e.dataset.casellaPezzo).join())), CURE_IN_VENDITA.join())
uguale('l\'ampolla della vita non c\'è', await page.locator('[data-casella-pezzo="ampolla-vita"]').count(), 0)
uguale('le gemme dell\'eroe in vista', await gemmeBottega(), 2000)
await toccaIl('[data-casella-pezzo="ampolla-maggiore"]')
await attendi(page, 200)
controlla('un tocco sceglie, e il pannello dice quanto cura (un numero fisso, uguale a ogni livello)',
          (await page.locator('[data-pannello]').innerText()).includes(`+${COSE['ampolla-maggiore'].cura} vita, subito`),
          await page.locator('[data-pannello]').innerText())
uguale('e quanto costa', await tasto(), `Compra 💎 ${COSE['ampolla-maggiore'].prezzo}`)
await scatto(page, 'pozioni-guaritrice')

/* ---------- 2. al più otto: la settima e l'ottava si comprano, la nona no ---------- */
await toccaIl('[data-azione="compra"]')
await attendi(page, 300)
uguale('comprata, le gemme scendono del suo prezzo', await gemmeBottega(), 2000 - COSE['ampolla-maggiore'].prezzo)
uguale('con sette cure il tetto non si è ancora visto', await page.locator('[data-al-tetto]').count(), 0)
await toccaIl('[data-azione="compra"]')
await attendi(page, 300)
uguale('l\'ottava', await gemmeBottega(), 2000 - 2 * COSE['ampolla-maggiore'].prezzo)
await toccaIl('[data-casella-pezzo="pozione"]')
await attendi(page, 300)
uguale('con otto cure il banco dice «al massimo 8 pozioni»', await page.locator('[data-al-tetto]').count(), 1)
controlla('con le parole giuste', /al massimo 8 pozioni/i.test(await page.locator('[data-al-tetto]').innerText()), await page.locator('[data-al-tetto]').innerText())
uguale('il tasto dice perché non si compra', await tasto(), `hai già ${POZIONI_MASSIME} pozioni`)
uguale('ed è spento', await page.locator('[data-azione="compra"]').isDisabled(), true)
await page.locator('[data-azione="compra"]').click({ force: true }).catch(() => {})
await attendi(page, 300)
uguale('un tocco non compra la nona', await gemmeBottega(), 2000 - 2 * COSE['ampolla-maggiore'].prezzo)
await scatto(page, 'pozioni-tetto')
// la torcia non è una pozione: passa
await toccaIl('[data-scheda="torce"]')
await attendi(page, 200)
await toccaIl('[data-casella-pezzo="torcia"]')
await attendi(page, 200)
uguale('e la torcia si compra anche col tetto', await page.locator('[data-azione="compra"]').isDisabled(), false)

/* ---------- 3. lo zaino: quante, e l'ampolla della vita ---------- */
await toccaIl('[data-bottega] [data-chiudi]')
await page.waitForSelector('[data-bottega]', { state: 'detached', timeout: 3000 })
await toccaIl('[data-azione="zaino"]')
await page.waitForSelector('[data-zaino]', { timeout: 3000 })
await attendi(page, 300)
uguale('lo zaino dice quante ne porta', await page.locator('[data-cure-zaino]').getAttribute('data-n'), String(POZIONI_MASSIME))
controlla('«8/8»', (await page.locator('[data-cure-zaino]').innerText()).includes('8/8'), await page.locator('[data-cure-zaino]').innerText())
await toccaIl('[data-tasca][data-cosa="ampolla-vita"]')
await attendi(page, 300)
controlla('l\'ampolla della vita dice «tutta la vita»', (await page.locator('[data-pannello]').innerText()).includes('tutta la vita'), await page.locator('[data-pannello]').innerText())
uguale('e il tetto per esteso', await page.locator('[data-cure-nota]').count(), 1)
await scatto(page, 'pozioni-elisir')
await toccaIl('[data-zaino] [data-chiudi]')
await page.waitForSelector('[data-zaino]', { state: 'detached', timeout: 3000 })

/* ---------- 4. con più stadi in tasca, bere apre la scelta ---------- */
// un cavaliere ferito nella discesa della storia: sbagliando una risposta i mostri colpiscono, e il menu offre di bere. L'indirizzo
// della guaritrice riporta l'eroe al livello 1 (è fatto per guardare un banco): si riparte dal suo livello, con le cure di adesso. Si scende
// nella scalinata, rifatta: la sentinella della botola non farebbe passare un eroe senza i punti dati. Si scende dall'indirizzo
// (`#sotterraneo=1`, con la prima discesa dei mostri vicina): l'eroe che cammina fino all'ingresso lo prova `integrazione/sotterraneo-mondo`
const finale = { ...robaAttesa('cavaliere', FINITE), gemme: 1000, zaino: [...ZAINO, 'ampolla-maggiore', 'ampolla-maggiore'] }
await page.evaluate(() => { location.hash = '' })
await semina(page, {
  campagne: { sotterraneo: { tappa: FINITE, libera: false, stelle: STELLE,
    cfg: { mondo: MONDO, eroe: 'cavaliere', avventure: { cavaliere: { tappa: FINITE, libera: false, stelle: STELLE, missioni: {}, roba: finale, crescita,
      mondo: { parlato: true } } } } } },
})
await page.evaluate(() => { location.hash = 'sotterraneo=1&seme=11&sotterraneo=branco&mostri=2&tipo=ratto,goblin&stanza=sala' })
await page.waitForSelector('[data-scontro-3d]', { timeout: 30000 }).catch(async e => { await scatto(page, 'pozioni-errore'); throw e })
await page.waitForSelector('[data-caselle-abilita][data-pronto]', { timeout: 20000 })
const pozioni = async () => Number(await page.locator('[data-casella-barra="pozione"]').getAttribute('data-n'))
const vita = async () => Number((await page.locator('[data-globo="vita"] .sot-globo-numero').textContent()) || 0)
uguale('in discesa le cure sono quelle di prima: otto di quattro stadi', await pozioni(), POZIONI_MASSIME + 0)
uguale('in piena forma non c\'è «bevi»', await page.locator('[data-azione="bevi-scontro"]').count(), 0)
const piena = await vita()
await scegliAttacco(page)
await page.waitForSelector('.sot-domanda .qz-tasto', { timeout: 8000 })
await attendi(page, 500)
await page.locator('.sot-domanda .qz-tasto:not([data-giusta])').first().click()
// dopo uno sbaglio la domanda si ferma a spiegare: i mostri colpiscono quando l'esito scade
await attendi(page, 1300)
await page.waitForFunction(v => Number(document.querySelector('[data-globo="vita"] .sot-globo-numero')?.textContent) < v, piena, { timeout: 20000 })
await page.waitForSelector('[data-caselle-abilita][data-pronto]', { timeout: 15000 })
const v0 = await vita()
controlla('feriti dai mostri', v0 > 0 && v0 < piena, `${piena} → ${v0}`)
uguale('adesso il menu offre di bere', await page.locator('[data-azione="bevi-scontro"]').count(), 1)
controlla('e dice che si sceglie quale', /scegli quale/.test(await page.locator('[data-azione="bevi-scontro"]').innerText()), await page.locator('[data-azione="bevi-scontro"]').innerText())
const n0 = await pozioni()
await toccaIl('[data-azione="bevi-scontro"]')
await page.waitForSelector('[data-scegli-pozione][data-pronto]', { timeout: 3000 })
uguale('apre la scelta, una riga per stadio', await page.locator('[data-azione="bevi-questa"]').count(), 5)
uguale('dalla più piccola alla più grande (la vita in fondo), con quanto cura e quante ne ha', await page.locator('[data-azione="bevi-questa"]')
  .evaluateAll(b => b.map(x => `${x.dataset.cosa}:${x.dataset.cura}:${x.dataset.n}`).join()),
  ['pozione-piccola:' + COSE['pozione-piccola'].cura + ':1', 'pozione:' + COSE.pozione.cura + ':3', 'pozione-grande:' + COSE['pozione-grande'].cura + ':1',
   'ampolla-maggiore:' + COSE['ampolla-maggiore'].cura + ':2', 'ampolla-vita:' + (await page.locator('[data-cosa="ampolla-vita"]').getAttribute('data-cura')) + ':1'].join())
controlla('nello scontro dice che poi tocca ancora a te', /tocca ancora a te/.test(await page.locator('[data-scegli-pozione]').innerText()))
controlla('la ✕ in alto a destra', await page.locator('[data-scegli-pozione] [data-chiudi]').count() === 1)
await scatto(page, 'pozioni-scelta-scontro')
await toccaIl('[data-scegli-pozione] [data-chiudi]')
await page.waitForSelector('[data-scegli-pozione]', { state: 'detached', timeout: 3000 })
uguale('chiusa la scelta non si è bevuto niente', await pozioni(), n0)
uguale('e lo scontro è ancora lì, col suo menu', await page.locator('[data-caselle-abilita]').count(), 1)
await toccaIl('[data-azione="bevi-scontro"]')
await page.waitForSelector('[data-scegli-pozione][data-pronto]', { timeout: 3000 })
await toccaIl('[data-azione="bevi-questa"][data-cosa="pozione-grande"]')
await page.waitForSelector('[data-scontro-3d][data-racconto]', { timeout: 8000 })
await page.waitForSelector('[data-scontro-3d]:not([data-racconto])', { timeout: 20000 })
await attendi(page, 300)
uguale('toccata una riga beve quella: una pozione in meno', await pozioni(), n0 - 1)
uguale('e la scelta si è chiusa', await page.locator('[data-scegli-pozione]').count(), 0)
const v1 = await vita(), quota = await page.locator('[data-globo="vita"]').getAttribute('data-quota')
controlla('la vita sale della cura e basta (o fino in cima): i mostri non colpiscono', v1 === v0 + COSE['pozione-grande'].cura || quota === '1.00', `${v0} → ${v1}, globo ${quota}`)

uguale('nessun errore in pagina', errori.length, 0)
if (errori.length) console.log(errori)
await browser.close()
riassunto('le pozioni di cura, col dito vero')
