/* Il costruttore: «Il tempio» — un progetto con una misura («colonna»,
   alta «alta»), chiamato TRE VOLTE dal principale con tre lavagnette
   diverse («prima», «seconda», «terza»), e dentro il progetto c'è un
   `ripeti`: il codice vero, non un solo blocco che gira («Il muro
   lungo», un `ripeti` da solo, usato prima). Il programma sta in dieci
   righe, e TUTTE restano a schermo mentre girano (`Editor.vue`, la
   lista non scorre per un programma così corto): si vede la riga del
   principale accendersi («colonna, prima»), poi la fila accendersi
   dentro il progetto mentre il robot posa base, fusto (tante volte
   quant'è «alta») e capitello — tre volte, con un'altezza diversa ogni
   volta (`.cst-accesa`, `Righe.vue`).

   PROVATO PRIMA «IL CASTELLO» (un progetto con DUE misure, e un
   `ripeti` dentro un altro `ripeti`), E SCARTATO: due torri larghe 2 e
   alte 5 più un muro largo 4 e alto 3 sono 32 mattoni, e a velocità
   normale (230 ms a passo) in dieci secondi il piano arrivava a metà
   della seconda torre — troppo poco per capire cosa si sta guardando.
   Il tempio ne mette 15 in tre colonne, ed è leggero abbastanza da
   mostrarne **due intere e la terza quasi finita**: si vede il
   progetto chiamato tre volte con un'altezza diversa ogni volta, che è
   il punto di questo livello. Non basta comunque a chiudere il primo
   ordine e vedere il secondo (accelerato) né il velo di vittoria — la
   clip chiude sulla terza colonna che sale, non su una riga a metà.

   IL PROGRAMMA NON SI SCRIVE COL DITO. Comporlo tramite l'editor a
   blocchi (cassetta → riga → misura…) vorrebbe dire decine di tocchi
   fragili su un'interfaccia che qui non ci serve mettere alla prova;
   e il gioco, a differenza del Generale, non apre nessun gancio da
   console (niente `window.__cst`). Si usa invece la strada che il
   gioco stesso offre a un bambino che riprende un livello di ieri:
   il programma sta nell'ARCHIVIO, sotto `costruttore:<id>` (vedi
   `Gioco.vue`, `chiaveArchivio`/`pronto`/`VERSIONE`), e lo si semina
   PRIMA che l'app riparta — esattamente come fa `scatti.mjs` col
   roster, ma qui dentro questa ricetta: non si può toccare
   `scatti.mjs`, quindi si aggiunge un secondo `addInitScript` sulla
   stessa pagina e si ricarica (un `addInitScript` aggiunto a
   partita già montata vale solo dal prossimo caricamento in poi).
   Il programma stesso è la SOLUZIONE dichiarata del livello
   (`LIVELLI[…].soluzione`, la stessa che gioca `test/unita/costruttore`
   in Node col motore vero): non un piano scritto qui a mano.

   La tappa si sceglie per **chiave stabile** (`chiave: 'tempio'`),
   non per posizione: `dati/livelli.js` ha già più di venti livelli e
   una fila che si allunga. `Mappa.vue` mette l'indice vero in
   `[data-livello]` su ogni bottone, quindi il click resta valido anche
   se `tempio` si sposta in fila. Se un giorno la chiave sparisse,
   `INDICE` diventa -1 e la clip registra la mappa ferma invece di
   esplodere.

   Il livello è già sbloccato dal profilo finto di `scatti.mjs`
   (`settings.tuttoAperto: true` toglie il lucchetto a ogni tappa e
   all'età, vedi `giochi/campagne.js` → `tappaAperta`), quindi non
   serve nessun `profilo` qui.

   NIENTE CARTELLO CHE COPRE, SE UN GIORNO LA CLIP ARRIVASSE FIN LÌ.
   Il livello ha due ordini (2 · 4 · 3, poi 5 · 1 · 3): a differenza del
   Generale, qui il secondo si gioca **a schermo, accelerato**, con
   solo una striscia (`.cst-montaggio`, «e adesso con «5 · 1 · 3»…»)
   che si affianca al campo senza coprirlo (`regia.js`, velocità
   `veloce` = 45 ms a passo contro i 230 normali) — non serve nessun
   salto manuale come nel Generale. Oggi la clip non ci arriva (vedi
   sopra): resta comunque vero, e conta se il tempio si tara e i tempi
   cambiano.

   Dipende da: il selettore `.cst-livello` (la mappa è pronta),
   `[data-livello]` (per aprire per indice), `.cst-cantiere` (il
   livello è montato), `[data-azione="via"]` (▶ Via, lo stesso bottone
   che tocca un bambino) e `[data-fine="livello"]` (il velo di
   vittoria, `viste/Finale.vue`). Se uno di questi cambia forma, è qui
   che va aggiornata la ricetta. */
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
  await page.waitForSelector('.cst-livello', { timeout: 12000 })
}

/* apre il cantiere per indice, e aspetta che l'editor sia montato col
   programma già scritto dentro */
async function apriIlCantiere (page) {
  if (INDICE < 0) return
  await page.click(`[data-livello="${INDICE}"]`, { timeout: 6000 })
  await page.waitForSelector('.cst-cantiere', { timeout: 8000 })
  await page.waitForTimeout(400)
}

/* quanto dura la prima colonna a passo normale, a occhio sui fotogrammi:
   se è poco, il 🚀 arriva prima che il progetto si sia letto; se è
   tanto, la clip sfora i `secondi` */
const PRIMA_COLONNA = 3800

export default {
  file: 'clip-costruttore', dove: 'costruttore', attesa: '.cst-livello',
  passi: [seminaProgramma, apriIlCantiere],
  clip: {
    /* Le tre colonne, e poi il secondo ordine, a velocità normale (230
       ms a passo, `regia.js` → `VELOCITA`) sono più di venti secondi. Si
       fa come farebbe un bambino: la prima colonna a passo normale —
       è lì che si legge il programma che entra nel progetto con la sua
       misura — poi un tocco sul 🚀 (`[data-velocita="veloce"]`) e si
       arriva in fondo a tutti e due gli ordini, fino al velo. */
    secondi: 14,
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
