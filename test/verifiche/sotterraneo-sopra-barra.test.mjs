/* ═══════════════════════════════════════════════════════════════════
   NIENTE PANNELLO SUI GLOBI, A SEI LARGHEZZE — docs/sotterraneo/barra.md, «Sopra la barra»
   tempo: 300
   perché: i pannelli (scelta dello scontro, pozione, domanda, dialogo della terra) devono finire sopra la punta dei globi di vita ed energia, a sei larghezze e pixel ratio col tema legno
   a parte perché: a 390 px la stessa misura sta nel giro, in integrazione/sotterraneo-scontro-eroe; qui le altre cinque larghezze, che costano troppo per il giro: POTREBBE essere un'opzione di quel file

   Una misura da guardare, non un test del giro: i globi della vita e dell'energia sporgono sopra la barra in basso, e un
   pannello che ci poggia (la scelta dello scontro col pericolo, la scelta della pozione, la domanda, il dialogo della terra)
   deve finire sopra la loro punta. È successo due volte (16 ottobre su un telefono, poi su un monitor, dove una stima in CSS
   reggeva ai 390 px e non ai 960): da allora l'altezza la misura BarraDiSotto.vue, e qui si misura il risultato col tema legno a
   sei larghezze e pixel ratio. A 390 px la stessa misura sta nel giro, in integrazione/sotterraneo-scontro-eroe.
   `node test/esegui.mjs verifiche/sotterraneo-sopra-barra`
   ═══════════════════════════════════════════════════════════════════ */
import { apriBrowser, apriGioco, azzera, attendi, scatto } from '../aiuto/browser.mjs'
import { controlla, riassunto, blocco } from '../aiuto/verifica.mjs'
import { seminaIlSotterraneo } from '../aiuto/sotterraneo-semina.mjs'
import { scendiCon, sopraLaBarra } from '../aiuto/sotterraneo-scontro.mjs'
import { sogliaDi } from '../../src/giochi/sotterraneo/dati/livelli.js'

const MISURE = [[390, 844, 2], [360, 640, 2], [700, 900, 1], [960, 900, 1.25], [1100, 900, 1], [1861, 1990, 1.5]]
// il mago della prova del pericolo: sei leggendari al primo turno lo fermano, e il pannello è il più alto (la riga rossa sopra la scelta)
const roba = { v: 1, gemme: 0, zaino: ['pozione-piccola', 'pozione-grande'], mano: null, mancina: null, corpo: null, dito: null, torcia: 0, torce: 0 }
const crescita = { esp: sogliaDi(9), tempra: 0 }
const browser = await apriBrowser()

function nonCopre(cosa, m, { scena = true } = {}) {
  if (!controlla(`${cosa}: il pannello c'è`, !!m)) return
  controlla(`${cosa}: non copre i globi (bordo basso ${m.basso}, cima dei globi ${m.cima})`, m.sopra <= 0, String(m.sopra))
  if (scena) controlla(`${cosa}: sopra resta scena (${m.scena} px)`, m.scena >= 80, String(m.scena))
}

for (const [w, h, px] of MISURE) {
  const { page, errori } = await apriGioco(browser, { viewport: { width: w, height: h }, pixel: px })
  const qui = `${w}×${h} a ${px}`
  await blocco(`${qui}, lo scontro`, async () => {
    await scendiCon(page, 'sotterraneo=1&seme=11&sotterraneo=branco&mostri=6&grado=leggendario&tema=legno&dpr=1',
                    { eroe: 'mago', roba, extra: { crescita }, larghezza: w, alto: h, aspetta: '[data-caselle-abilita][data-pronto]' })
    controlla(`${qui}: c'è lo stop del pericolo`, await page.locator('[data-ringhio]').count() === 1)
    nonCopre(`${qui}, cosa fare (col pericolo)`, await sopraLaBarra(page, '[data-pannello3d]'))
    await page.locator('[data-azione="bevi-scontro"]').click()
    await page.waitForSelector('[data-scegli-pozione][data-pronto]', { timeout: 3000 })
    nonCopre(`${qui}, quale pozione`, await sopraLaBarra(page, '[data-scegli-pozione] .sot-cornice'), { scena: false })
    await page.locator('[data-scegli-pozione] [data-chiudi]').click()
    await page.waitForSelector('[data-caselle-abilita][data-pronto]', { timeout: 5000 })
    await page.locator('[data-azione="attacco"]').click()
    await page.waitForSelector('.sot-domanda .qz-tasto', { timeout: 8000 })
    await attendi(page, 400)
    nonCopre(`${qui}, la domanda`, await sopraLaBarra(page, '[data-pannello3d]'))
    if (w === 960 || w === 1861) await scatto(page, `sopra-barra-${w}`)
    /* una barra più alta del solito (un monitor con le scritte più grandi, il minimo dei caratteri di Chrome): la stima in CSS
       (70 px) non la vedeva e il pannello ci finiva sopra; la misura sì */
    if (w === 960) {
      await page.addStyleTag({ content: '.sot-esp-riga { height: 34px !important }' })
      await attendi(page, 400)
      nonCopre(`${qui}, la domanda con la barra più alta`, await sopraLaBarra(page, '[data-pannello3d]'))
    }
  })
  await blocco(`${qui}, il dialogo della terra`, async () => {
    await page.evaluate(() => history.replaceState(null, '', location.pathname + location.search + '#tema=legno'))
    await azzera(page)
    await seminaIlSotterraneo(page, { finite: 2 })
    await page.locator('[data-personaggio="ragazza"]').first().evaluate(e => e.click())
    await page.waitForSelector('[data-dialogo]', { timeout: 8000 })
    await attendi(page, 400)
    nonCopre(`${qui}, il dialogo`, await sopraLaBarra(page, '[data-dialogo]'), { scena: false })
  })
  controlla(`${qui}: nessun errore in console`, !errori.length, errori.join(' | '))
  await page.close()
}

await browser.close()
riassunto('niente pannello sui globi, a sei larghezze')
