/* ═══════════════════════════════════════════════════════════════════
   L'OROLOGIO DELLE LINGUE A MONDI, NEI TEST DEL BROWSER

   English ed Español contano il tempo con `viste/orologio.js`: la finestra
   cieca di una domanda appena comparsa (320 ms) e l'esito che resta quanto
   dice la sua barra (`[data-attesa]`, 900 ms per una giusta, secondi per uno
   sbaglio). Sono tempi del gioco: il test non li accorcia, porta avanti
   l'orologio della pagina (`page.clock`, installato prima della semina; il
   tempo scorre lo stesso) invece di aspettarli, e poi aspetta la condizione.
   Così un esito lungo non scade un'attesa fissa: dura zero comunque.
   ═══════════════════════════════════════════════════════════════════ */
import { pronto } from './browser.mjs'
import { CIECA } from '../../src/giochi/inglese/viste/orologio.js'

/* `page.clock.install()` va chiamato prima della prima ricarica (`semina`): l'orologio finto entra con la pagina */
export function orologioDelleLingue(page) {
  return {
    installa: () => page.clock.install(),
    // la domanda (o la pagina, o il libro) appena comparsa: passata la finestra cieca, la radice ha `data-pronto`
    async cieca() {
      await page.clock.fastForward(CIECA + 10)
      await pronto(page, '.schermo.ing')
    },
    // la bolla che chiede prima di un tocco che costa ha la sua finestra cieca (`viste/Bolla.vue`): poi `data-pronta="1"`
    async bollaPronta() {
      await page.waitForSelector('[data-svela]')
      await page.clock.fastForward(CIECA + 10)
      await page.waitForSelector('[data-svela][data-pronta="1"]', { timeout: 5000 })
    },
    /* l'esito appena comparso dentro `sel`: si porta avanti l'orologio di quanto dice la sua barra, e si aspetta che se ne
       vada (o che arrivi il cartello di fine) */
    async dopoLEsito(sel = '') {
      const ms = await page.evaluate(s => {
        const i = document.querySelector(`${s} [data-esito] [data-attesa] i`)
        return i ? parseFloat(i.style.animationDuration) || 0 : 0
      }, sel)
      await page.clock.fastForward(Math.ceil(ms) + 20)
      await page.waitForFunction(s => !document.querySelector(`${s} [data-esito]`) || document.querySelector('[data-fine]'),
                                 sel, { timeout: 5000 })
    },
  }
}
