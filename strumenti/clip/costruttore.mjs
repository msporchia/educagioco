/* Il costruttore: «Il tempio» — un progetto con una misura («alta»),
   chiamato tre volte con lavagnette diverse, e dentro un `ripeti`: si
   vede il progetto girare tre volte con un'altezza diversa ogni volta.
   Il programma non si scrive col dito (l'editor a blocchi vorrebbe
   decine di tocchi fragili): si semina nell'ARCHIVIO sotto
   `costruttore:<id>` prima che l'app riparta (come `scatti.mjs` fa col
   roster, ma qui dentro la ricetta, con un secondo `addInitScript`), ed
   è la SOLUZIONE dichiarata del livello (`LIVELLI[…].soluzione`).

   La tappa si sceglie per **chiave stabile** (`chiave: 'tempio'`), non
   per posizione: la scheda mette l'indice vero sul led in `[data-livello]`,
   quindi il tocco resta valido anche se la fila si allunga; se la
   chiave sparisse, `INDICE` diventa -1 e la clip si ferma sulla scheda.

   Dipende da: `[data-scheda-robot] [data-livello]` (scheda pronta, e il
   led che apre il fumetto), `[data-fumetto-per] [data-azione="costruisci"]`
   (aprire il livello), `.cst-cantiere` (livello montato), `[data-azione="via"]`
   e `[data-fine="livello"]` (velo di vittoria). Se uno di questi cambia
   forma, è qui che va aggiornata la ricetta. */
import { LIVELLI } from '../../src/giochi/costruttore/dati/livelli.js'

const CHIAVE_LIV = 'tempio'
const INDICE = LIVELLI.findIndex(l => l.chiave === CHIAVE_LIV)
const LIV = INDICE >= 0 ? LIVELLI[INDICE] : null
/* la stessa forma che scrive `Gioco.vue` in archivio: `{ v, programmi }` */
const ARCHIVIO = LIV ? { v: 2, programmi: { [LIV.chiave]: LIV.soluzione } } : null

/* semina il programma nell'archivio e ricarica, prima di toccare niente */
async function seminaProgramma (page) {
  if (!ARCHIVIO) return
  await page.addInitScript(a => {
    try { localStorage.setItem('costruttore:g1', JSON.stringify(a)) } catch (e) { /* lo dirà lo scatto */ }
  }, ARCHIVIO)
  await page.reload()
  await page.waitForSelector('[data-scheda-robot] [data-livello]', { timeout: 12000 })
}

/* apre il cantiere per indice, e aspetta che l'editor sia montato col
   programma già scritto dentro */
async function apriIlCantiere (page) {
  if (INDICE < 0) return
  await page.click(`[data-livello="${INDICE}"]`, { timeout: 6000 })
  await page.click(`[data-fumetto-per="${INDICE}"] [data-azione="costruisci"]`, { timeout: 6000 })
  await page.waitForSelector('.cst-cantiere', { timeout: 8000 })
  await page.waitForTimeout(400)
}

/* quanto dura la prima colonna a passo normale, a occhio sui fotogrammi:
   se è poco, il 🚀 arriva prima che il progetto si sia letto; se è
   tanto, la clip sfora i `secondi` */
const PRIMA_COLONNA = 3800

export default {
  file: 'clip-costruttore', dove: 'costruttore', attesa: '[data-scheda-robot] [data-livello]',
  passi: [seminaProgramma, apriIlCantiere],
  clip: {
    dallaMappa: 1,       // la semina ricarica la pagina, fuori campo; la scheda e il tocco sul livello sono filmati
    // prima colonna a passo normale (si legge il progetto), poi 🚀 fino al velo
    secondi: 17,
    coda: 1500,
    async durante (page) {
      if (!LIV) throw new Error('il livello della clip non c\'è più')
      await page.waitForTimeout(300)               // si legge un istante il programma già scritto, fermo
      await page.locator('[data-azione="via"]').click({ timeout: 2000 })
      await page.waitForTimeout(PRIMA_COLONNA)
      await page.locator('[data-velocita="veloce"]').click({ timeout: 2000 })
      await page.waitForSelector('[data-fine="livello"]', { timeout: 12000 })
    },
  },
}
