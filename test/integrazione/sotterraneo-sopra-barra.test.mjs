/* ═══════════════════════════════════════════════════════════════════
   NIENTE PANNELLO SUI GLOBI — docs/sotterraneo/barra.md, «Sopra la barra»

   I globi della vita e dell'energia sporgono sopra la barra in basso: un
   pannello che ci poggia (lo scontro nel 3D, il duello 2D, la scelta della
   pozione, il dialogo della terra, col pericolo dentro lo scontro) deve
   finire sopra la loro punta, mai coprirne la calotta. È successo due
   volte: la prima (16 ottobre) su un telefono, la seconda su un monitor,
   dove una stima in CSS reggeva ai 390 px e non ai 960. Da allora
   l'altezza la misura BarraDiSotto.vue, e qui si misura il risultato, col
   tema legno, a più larghezze e più pixel ratio: il rettangolo del
   pannello non tocca quello dei globi, e sopra il pannello resta scena.
   `node test/esegui.mjs sotterraneo-sopra-barra`
   tempo: 300
   ═══════════════════════════════════════════════════════════════════ */
import { apriBrowser, apriGioco, azzera, semina, attendi, scatto } from '../aiuto/browser.mjs'
import { controlla, nota, riassunto } from '../aiuto/verifica.mjs'
import { seminaIlSotterraneo } from '../aiuto/sotterraneo-semina.mjs'
import { MONDO } from '../../src/giochi/sotterraneo/motore/avventure.js'
import { robaAttesa, crescitaAttesa } from '../../src/giochi/sotterraneo/motore/storia.js'

const MISURE = [[390, 844, 2], [360, 640, 2], [700, 900, 1], [960, 900, 1.25], [1100, 900, 1], [1861, 1990, 1.5]]
const browser = await apriBrowser()

// il pannello (il primo che c'è del selettore) contro i globi: quanti pixel di sovrapposizione, e quanta scena resta sopra
async function misura(page, sel) {
  return page.evaluate(s => {
    const p = document.querySelector(s)
    if (!p) return null
    const r = p.getBoundingClientRect()
    // i globi e la barra stessa: il pannello non deve toccare nessuno dei due
    const globi = [...document.querySelectorAll('[data-globo], [data-barra-giu]')].map(g => g.getBoundingClientRect())
    const sopra = Math.max(...globi.map(g => Math.min(r.bottom, g.bottom) - Math.max(r.top, g.top) > 0 &&
                                              Math.min(r.right, g.right) - Math.max(r.left, g.left) > 0 ? r.bottom - g.top : 0))
    const tela = document.querySelector('.sot-tela')
    const scena = tela ? r.top - tela.getBoundingClientRect().top : 0
    return { sopra: Math.round(sopra * 10) / 10, scena: Math.round(scena), basso: Math.round(r.bottom), cima: Math.round(Math.min(...globi.map(g => g.top))) }
  }, sel)
}
function giudica(cosa, m, { scena = true } = {}) {
  if (!m) { nota(`${cosa}: il pannello non c'è`); return }
  controlla(`${cosa}: non copre i globi (bordo basso ${m.basso}, cima dei globi ${m.cima})`, m.sopra <= 0, String(m.sopra))
  if (scena) controlla(`${cosa}: sopra resta scena (${m.scena} px)`, m.scena >= 80, String(m.scena))
}

const roba = { ...robaAttesa('mago', 1, { gemme: 20 }), zaino: ['pozione', 'pozione', 'pozione-grande'] }
async function scontro(page, hash, tre) {
  await page.evaluate(() => history.replaceState(null, '', location.pathname + location.search))
  await azzera(page)
  const a = { tappa: 1, libera: false, stelle: { 0: 3 }, missioni: {}, roba, crescita: crescitaAttesa('mago', 1), terra: { nebbia: 'f'.repeat(768), dove: [55, 11], parlato: true } }
  await semina(page, { coins: 300, settings: { sperimentali: true },
    campagne: { sotterraneo: { tappa: 1, libera: false, stelle: { 0: 3 }, cfg: { mondo: MONDO, eroe: 'mago', avventure: { mago: a } } } } })
  await page.evaluate(h => { location.hash = h }, hash)
  await page.waitForSelector('[data-caselle-abilita][data-pronto]', { timeout: 25000 })
  await attendi(page, tre ? 2500 : 800)
}

for (const [w, h, px] of MISURE) {
  const { page, errori } = await apriGioco(browser, { viewport: { width: w, height: h }, pixel: px })
  const qui = `${w}×${h} a ${px}`
  for (const tre of [true, false]) {
    const dove = tre ? '3D' : '2D'
    const sel = tre ? '[data-pannello3d]' : '.sot-velo-scontro .sot-cornice'
    await scontro(page, tre ? 'sotterraneo=1&eroe=mago&seme=5&sotterraneo=branco&mostri=3&tema=legno&dpr=1'
                            : 'sotterraneo=branco&mostri=3&eroe=mago&giu=1&seme=5&tema=legno', tre)
    const pericolo = await page.locator('[data-ringhio]').count()
    giudica(`${qui}, scontro ${dove}, cosa fare${pericolo ? ' (col pericolo)' : ''}`, await misura(page, sel), { scena: tre })
    // la pozione: con due stadi in tasca si sceglie quale, in una cornice sopra a tutto
    const bevi = page.locator('[data-azione="bevi-scontro"]:not([disabled])')
    if (await bevi.count()) {
      await bevi.first().click()
      if (await page.waitForSelector('[data-scegli-pozione]', { timeout: 2500 }).catch(() => null)) {
        await attendi(page, 300)
        giudica(`${qui}, scontro ${dove}, quale pozione`, await misura(page, '[data-scegli-pozione] .sot-cornice'), { scena: false })
        await page.locator('[data-scegli-pozione] [data-chiudi]').first().click()
        await attendi(page, 400)
      }
    }
    await page.locator('[data-azione="attacco"]').first().click()
    if (await page.waitForSelector('.sot-domanda .qz-tasto', { timeout: 8000 }).catch(() => null)) {
      await attendi(page, tre ? 1500 : 500)
      giudica(`${qui}, scontro ${dove}, la domanda`, await misura(page, sel), { scena: tre })
      if (w === 960 || w === 1861) await scatto(page, `sopra-barra-${dove}-${w}`)
      /* una barra più alta del solito (un monitor con le scritte più grandi, il minimo dei caratteri di Chrome): la stima in
         CSS (70 px) non la vedeva e il pannello ci finiva sopra; la misura sì */
      if (w === 960 && tre) {
        await page.addStyleTag({ content: '.sot-esp-riga { height: 34px !important }' })
        await attendi(page, 800)
        giudica(`${qui}, scontro ${dove}, la domanda con la barra più alta`, await misura(page, sel), { scena: tre })
      }
    }
  }
  // il dialogo della terra di sopra, in fondo sopra la barra
  await page.evaluate(() => history.replaceState(null, '', location.pathname + location.search + '#tema=legno'))
  await azzera(page)
  await seminaIlSotterraneo(page, { finite: 2 })
  await page.locator('[data-personaggio="ragazza"]').first().evaluate(e => e.click()).catch(() => {})
  if (await page.waitForSelector('[data-dialogo]', { timeout: 8000 }).catch(() => null)) {
    await attendi(page, 600)
    giudica(`${qui}, il dialogo`, await misura(page, '[data-dialogo]'), { scena: false })
  } else nota(`${qui}: il dialogo non si è aperto`)
  controlla(`${qui}: nessun errore in console`, !errori.length, errori.join(' | '))
  await page.close()
}

await browser.close()
riassunto('niente pannello sui globi')
