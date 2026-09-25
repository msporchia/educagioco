/* Il laboratorio delle pozioni: il gesto che il gioco esiste per
   insegnare — prendere l'ingrediente giusto, portarlo sull'attrezzo,
   mettere i pesi finché il numero fa la dose, «nel calderone» — ripetuto
   su un paio di clienti di fila. La tappa scelta (`massa-virgola`) è la
   prima che chiede davvero di convertire *e* mostra il conto scritto
   sopra il banco (l'aiuto «svolto»): «1,5 kg» diventa «1500 g» sotto gli
   occhi, non solo dentro al motore — le altre tappe o non convertono
   ancora (`massa-banco`) o non spiegano più niente (`virgole`).

   La dose non si scrive a mano: si legge dallo stato vero della partita
   (`window.__poz.partita.value`, la stessa porta che usa
   `test/integrazione/pozioni.test.mjs`) e i pesi da posare li calcola
   `scomponi()` del motore vero (`motore/misura.js`) sull'attrezzo che la
   partita stessa consiglia (`consigliato()`) — se la scaletta di
   `dati/campagna.js` cambia dose, unità o attrezzo, la clip cambia con
   lei invece di restare silenziosamente sbagliata, e ogni dosaggio
   riesce per costruzione (mai uno sbaglio finto messo in scena).

   I gesti passano dai bottoni veri, come col dito: `.pz-ingrediente
   [data-ingrediente]` per prendere, `[data-strumento]` per posare,
   `[data-pezzo]` per ogni peso, `[data-azione="conferma"]` per il tuffo.
   `profilo` porta la campagna già a questa tappa per **chiave stabile**
   (`massa-virgola`, non un indice cablato: la fila di `CAMPAGNA` è tre
   famiglie ripetute, e un indice si sposta al primo gradino aggiunto).

   Si giocano al più tre clienti su quattro: la tappa non finisce mai
   dentro la clip, quindi non c'è rischio del cartello di fine tappa
   (`Fine.vue`) che la coprirebbe — la stessa cautela di `passo.mjs`. */
import { CAMPAGNA } from '../../src/giochi/pozioni/dati/campagna.js'
import { scomponi } from '../../src/giochi/pozioni/motore/misura.js'

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
    secondi: 8,
    async durante (page) {
      if (INDICE < 0) return           // la tappa è sparita: niente da giocare
      const attesa = ms => page.waitForTimeout(ms)

      /* una dose intera, letta dallo stato e posata coi bottoni veri */
      async function dosaUnIngrediente () {
        const nome = await page.evaluate(() => {
          const p = window.__poz?.partita?.value
          return p && p.daFare[0] ? p.daFare[0].nome : null
        })
        if (!nome) return false
        await page.locator(`.pz-ingrediente[data-ingrediente="${nome}"]`)
          .click({ timeout: 2000 }).catch(() => {})
        await attesa(220)                          // ritmo umano: si guarda la pergamena

        const info = await page.evaluate(() => {
          const p = window.__poz?.partita?.value
          if (!p || !p.dose) return null
          const str = p.strumento || p.consigliato(p.dose)
          return str ? { base: p.dose.base, chiave: str.chiave, pezzi: str.pezzi } : null
        })
        if (!info) return false
        await page.locator(`[data-strumento="${info.chiave}"]`)
          .click({ timeout: 2000 }).catch(() => {})
        await attesa(250)                          // il cartello «svolto» compare qui

        const pezzi = scomponi(info.base, info.pezzi)
        if (!pezzi) return false
        for (const pz of pezzi) {
          await page.locator(`[data-pezzo="${pz}"]`).click({ timeout: 2000 }).catch(() => {})
          await attesa(200)                         // un peso alla volta, non un tocco solo
        }
        await page.locator('[data-azione="conferma"]').click({ timeout: 2000 }).catch(() => {})
        await attesa(900)                           // il tuffo nel calderone, poi il cliente dopo
        return true
      }

      for (let n = 0; n < 3; n++)
        if (!(await dosaUnIngrediente())) break
    },
  },
}
