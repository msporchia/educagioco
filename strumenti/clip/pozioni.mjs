/* Il laboratorio delle pozioni: il gesto che il gioco esiste per
   insegnare — aprire il rotolo del mercante, scegliere le ampolle che
   fanno la dose e vedere che le versa — ripetuto su un paio di ordini. La
   tappa scelta (`massa-virgola`) è la prima che chiede davvero di
   convertire *e* scrive il conto sotto le targhette.

   Le ampolle non si scrivono a mano: si leggono dallo stato vero
   (`window.__poz.bottega.value`, la stessa porta che usa
   `test/integrazione/pozioni.test.mjs`), e si prende la più grande che ci
   sta: se la scaletta di `dati/campagna.js` cambia, la clip cambia con lei,
   e ogni ordine riesce per costruzione.

   I gesti passano dai bottoni veri, come col dito: `[data-azione="mercante"]`
   apre il rotolo, `[data-targhetta]` mette nell'ordine, `[data-azione="ordina"]`
   ordina. `profilo` porta la campagna già a questa tappa per **chiave
   stabile** (`massa-virgola`, non un indice cablato: la fila di `CAMPAGNA`
   è tre famiglie ripetute, e un indice si sposta al primo gradino
   aggiunto). Si fanno al più due ordini: la tappa non finisce dentro la
   clip, e il cartello di fine (`Fine.vue`) non la copre. */
import { CAMPAGNA } from '../../src/giochi/pozioni/dati/campagna.js'

const CHIAVE_TAPPA = 'massa-virgola'
const INDICE = CAMPAGNA.findIndex(t => t.chiave === CHIAVE_TAPPA)

export default {
  file: 'clip-pozioni', dove: 'pozioni', attesa: '.pz-mappa',
  profilo: p => {
    p.campagne = { ...p.campagne,
      pozioni: { tappa: Math.max(INDICE, 0), libera: false, stelle: {}, cfg: {} } }
    return p
  },
  passi: [[`.pz-tappa[data-tappa="${INDICE}"]`, 500]],
  clip: {
    dallaMappa: true,                // dalla mappa delle tappe: il tocco, poi il laboratorio
    secondi: 12,
    async durante (page) {
      if (INDICE < 0) return           // la tappa è sparita: niente da giocare
      const attesa = ms => page.waitForTimeout(ms)

      /* un ordine intero: una targhetta per ingrediente, la più grande che ci sta */
      async function unOrdine () {
        const scelte = await page.evaluate(() => {
          const b = window.__poz?.bottega?.value
          if (!b) return []
          return b.ingredienti.map((g, i) => {
            const k = g.offerte.map((o, n) => n).filter(n => g.messo + g.offerte[n].base <= g.dose)
              .sort((x, y) => g.offerte[y].base - g.offerte[x].base || g.offerte[x].prezzo - g.offerte[y].prezzo)[0]
            return k == null ? null : `${i}:${k}`
          }).filter(Boolean)
        })
        if (!scelte.length) return false
        await page.locator('[data-azione="mercante"]').click({ timeout: 2000 }).catch(() => {})
        await attesa(500)                            // ritmo umano: si guarda il rotolo
        for (const t of scelte) {
          await page.locator(`[data-targhetta="${t}"]`).click({ timeout: 2000 }).catch(() => {})
          await attesa(350)
        }
        await page.locator('[data-azione="ordina"]').click({ timeout: 2000 }).catch(() => {})
        await attesa(5000)                           // la consegna: le ampolle si versano una alla volta
        return true
      }

      for (let n = 0; n < 2; n++)
        if (!(await unOrdine())) break
    },
  },
}
