/* ═══════════════════════════════════════════════════════════════════
   I DUNGEON CHE SI RIGENERANO, COL DITO
   (docs/sotterraneo/dungeon-che-si-rigenerano.md)

   Nel Sotterraneo 3D il cerchio di pietre (un dungeon nuovo, per chiave: `#sotterraneo3d=cerchio`) ha il seme della sua volta;
   lasciato perdere dalla scala che sale si ritrova uguale; ripulito (il grosso battuto, «esco dal sotterraneo» toccato col dito)
   il mondo scrive un rifatti in più e rientrando è un altro: un altro seme, altri abitanti, il volto nuovo. La storia non si muove.
   `node test/esegui.mjs sotterraneo-rigenera`
   tempo: 120
   ═══════════════════════════════════════════════════════════════════ */
import { apriBrowser, apriGioco, azzera, semina, scatto, attendi, finestraFerma, leggiProfilo } from '../aiuto/browser.mjs'
import { uguale, controlla, riassunto } from '../aiuto/verifica.mjs'
import { MONDO } from '../../src/giochi/sotterraneo/motore/avventure.js'
import { semeDelDungeon, tappaDelMondo } from '../../src/giochi/sotterraneo/motore/rigenera.js'

const EROE = 'cavaliere'
const roba = { v: 1, gemme: 0, zaino: [], mano: 'spada', mancina: 'scudo-ferro', corpo: 'corazza', dito: null, torcia: 0, torce: 0 }

const browser = await apriBrowser()
const { page, errori } = await apriGioco(browser)
const cdp = await page.context().newCDPSession(page)
async function tocca(x, y) {
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x, y }] })
  await attendi(page, 60)
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] })
}
async function toccaIl(sel) {
  await page.waitForSelector(sel, { timeout: 15000 })
  await finestraFerma(page)
  const b = await page.locator(sel).first().boundingBox()
  await tocca(b.x + b.width / 2, b.y + b.height / 2)
}
// si scende nel cerchio col cheat (l'ingresso sul mondo nuovo lo mette il compito D), senza `&seme=`: il seme è quello della volta
async function entra(resto = '') {
  await page.evaluate(() => history.replaceState(null, '', location.pathname + location.search))
  await attendi(page, 500)   // le scritture in coda dell'archivio
  await page.reload()
  await page.waitForSelector('.carte', { timeout: 15000 })
  await page.evaluate(h => { location.hash = h }, `sotterraneo3d=cerchio&eroe=${EROE}${resto}`)
  await page.waitForFunction(() => window.__sotterraneo3d && window.__sotterraneo3d.corsa && window.__sotterraneo3d.grafica().figure > 0, null, { timeout: 30000 })
  await attendi(page, 1500)
  return page.evaluate(() => { const c = window.__sotterraneo3d.corsa; return { seme: c.seme, mostri: [...c.tappa.mostri], nome: c.tappa.nome, piani: c.quantiPiani } })
}
const avventura = async () => ((await leggiProfilo(page)).campagne.sotterraneo.cfg.avventure[EROE])

await azzera(page)
await page.setViewportSize({ width: 390, height: 844 })
const a = { tappa: 1, libera: false, stelle: { 0: 3 }, missioni: {}, roba }
await semina(page, { coins: 300, settings: { sperimentali: true },
  campagne: { sotterraneo: { tappa: 1, libera: false, stelle: { 0: 3 }, cfg: { mondo: MONDO, eroe: EROE, avventure: { [EROE]: a } } } } })

/* ── la prima volta: il seme della volta 0, e lasciato perdere si ritrova uguale ── */
const zero = tappaDelMondo('cerchio', { eroe: EROE, rifatti: 0 })
{
  const giu = await entra('&stanza=al-scala-su')
  uguale('la prima volta, il seme della volta 0', giu.seme, semeDelDungeon(EROE, 'cerchio', 0, 1))
  uguale('e gli abitanti della prima forma', giu.mostri.join(), zero.mostri.join())
  uguale('tre piani', giu.piani, 3)
  await page.evaluate(() => { const c = window.__sotterraneo3d.corsa; c.interagisci(c.livello.robe.find(q => q.che === 'scala-su')) })
  await toccaIl('[data-azione="scorda-si"]')
  await page.waitForSelector('[data-mondo3d], [data-terra]', { timeout: 15000 })
  const av = await avventura()
  uguale('lasciato perdere: nessun rifatti', av.mondo && av.mondo.dungeon ? av.mondo.dungeon.cerchio : undefined, undefined)
  const ancora = await entra()
  uguale('rientrando, la stessa forma', ancora.seme, giu.seme)
}

/* ── ripulito: il grosso battuto, «esco dal sotterraneo» col dito ── */
{
  await entra('&piano=3')
  const g = await page.evaluate(() => {
    const c = window.__sotterraneo3d.corsa
    const grosso = c.livello.robe.find(r => r.che === 'mostro' && r.grosso)
    grosso.morto = true
    c.chiaveDelPiano = true
    c.allaScala()
    return { piano: c.piano, grosso: grosso.grosso }
  })
  uguale('sull\'ultimo piano', g.piano, 2)
  uguale('il grosso è Barbamuschio', g.grosso, 'barbamuschio')
  await scatto(page, 'sotterraneo-rigenera-scala')
  await toccaIl('[data-azione="scendi"]')
  await page.waitForSelector('[data-fine="ancora"]', { timeout: 15000 })
  // la prima discesa vinta senza svenire è un traguardo (components/Traguardo.vue): il suo velo si chiude toccandolo
  await attendi(page, 1500)
  if (await page.locator('.velo').count()) await toccaIl('.velo')
  await page.waitForFunction(() => !document.querySelector('.velo'), null, { timeout: 10000 })
  await toccaIl('[data-fine="ancora"]')
  await page.waitForSelector('[data-mondo3d], [data-terra]', { timeout: 15000 })
  await attendi(page, 600)
  const av = await avventura()
  uguale('ripulito: il mondo scrive un rifatti in più', av.mondo && av.mondo.dungeon && av.mondo.dungeon.cerchio && av.mondo.dungeon.cerchio.rifatti, 1)
  uguale('la storia non si muove', av.tappa, 1)
  uguale('né le stelle', JSON.stringify(av.stelle), JSON.stringify({ 0: 3 }))
}

/* ── rientrando è un altro ── */
{
  const uno = tappaDelMondo('cerchio', { eroe: EROE, rifatti: 1 })
  const giu = await entra()
  uguale('un altro seme: quello della volta 1', giu.seme, semeDelDungeon(EROE, 'cerchio', 1, 1))
  controlla('non quello di prima', giu.seme !== zero.seme)
  uguale('altri abitanti', giu.mostri.join(), uno.mostri.join())
  controlla('diversi dalla prima forma', giu.mostri.join() !== zero.mostri.join())
  uguale('il volto nuovo', giu.nome, uno.nome)
  await scatto(page, 'sotterraneo-rigenera-altra')
}

uguale('nessun errore in console', errori.join(' | '), '')
await browser.close()
riassunto('I dungeon che si rigenerano, col dito')
