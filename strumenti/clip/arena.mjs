/* Castle Battle: una battaglia già avviata, e una caserma in più costruita col dito.

   LA BATTAGLIA È GIÀ AVANTI PRIMA CHE IL BROWSER SI APRA, come per Survivors: il motore
   (`motore/partita.js`) gira uguale in Node, e un `Pilota` di `motore/banco.js` che non
   sbaglia gioca la prima minuto e mezzo di «Il guado» (la palude: arcieri, opliti, mummie,
   pipistrelli, negromanti, golem) con un seme fisso, così la clip esce uguale a ogni giro.
   Poi si ferma qualche secondo perché le monete bastino a una caserma, e la partita si
   congela con `scrivi()` — lo stesso formato della partita lasciata a metà — dentro il
   profilo finto, in `campagne.arena.sosta`. Il browser deve solo riprendere dalla mappa.

   DURANTE LA REGISTRAZIONE si gioca come un bambino: si tocca una piazzola libera, nella
   nuvoletta si sceglie la prima truppa che si può pagare, e al conto si tocca la risposta
   giusta (`[data-giusta]` della domanda, mai un numero scritto qui), poi si guarda lo
   scontro e si tocca la caserma nuova per far vedere l'anello. Se la pilota tiene tutte le
   piazzole se ne vende una prima di congelare: la clip ha bisogno di un posto libero.

     npm run scatti clip-arena */
import { Partita } from '../../src/giochi/arena/motore/partita.js'
import { Pilota, caso } from '../../src/giochi/arena/motore/banco.js'
import { scrivi } from '../../src/giochi/arena/motore/sosta.js'
import { CAMPAGNA, sfidaDi } from '../../src/giochi/arena/dati/campagna.js'

const attesa = ms => new Promise(r => setTimeout(r, ms))
const TAPPA = 'guado'
const SEME = 7

function preparaLaBattaglia() {
  const indice = CAMPAGNA.findIndex(t => t.chiave === TAPPA)
  const rnd = caso(SEME)
  const p = new Partita({ rnd, sfida: sfidaDi(CAMPAGNA[indice]) })
  const pilota = new Pilota({ rnd, precisione: 1, ritmo: 2.5 })
  while (p.t < 80 && !p.fine) { p.avanza(0.25); pilota.gioca(p, 0.25) }
  if (!p.postiLiberi('io').length) {
    const piuBassa = p.casermeDi('io').sort((a, b) => a.liv - b.liv)[0]
    if (piuBassa) p.fai('io', 'vendi', piuBassa.posto)
  }
  while (p.t < 92 && !p.fine) p.avanza(0.25)        // le monete per la caserma della clip
  return { indice, sosta: scrivi(p, indice) }
}

const { indice: INDICE, sosta: SOSTA } = preparaLaBattaglia()

async function tocca(page, selettore) {
  const b = await page.locator(selettore).first().boundingBox({ timeout: 2000 }).catch(() => null)
  if (!b) return false
  await page.mouse.click(b.x + b.width / 2, b.y + b.height / 2)
  return true
}

export default {
  file: 'clip-arena', dove: 'arena', attesa: '[data-tappa]',
  profilo: p => {
    p.settings.eta = 9
    p.campagne.arena = { tappa: INDICE, libera: false, stelle: {}, cfg: {}, sosta: SOSTA }
    return p
  },
  passi: [
    ['button[data-azione="riprendi"]', 900],   // la mappa: si rientra nella battaglia lasciata a metà
    ['button[data-azione="riprendi"]', 500],   // il velo della pausa, che ogni ripresa apre da sé
  ],
  clip: {
    secondi: 11,
    accelera: 1.2,
    coda: 600,
    async durante(page) {
      await attesa(600)
      if (!SOSTA) throw new Error('la battaglia preparata è finita prima di congelarla')
      if (!(await tocca(page, '[data-piazzola]:not([data-variante])'))) throw new Error('nessuna piazzola libera')
      await attesa(700)
      if (!(await tocca(page, '[data-costruisci]:not([disabled]):not([data-costruisci="miniera"])'))) throw new Error('nessuna truppa da pagare')
      await page.waitForSelector('.qz-tasto', { timeout: 4000 })
      await attesa(1300)                            // il conto si legge
      await tocca(page, '.qz-tasto[data-giusta]')
      await attesa(3800)                            // la caserma nasce, le truppe vanno al ponte
      await tocca(page, '[data-piazzola][data-variante]')
      await attesa(1600)                            // l'anello: potenzia, vendi, i numeri
    },
  },
}
