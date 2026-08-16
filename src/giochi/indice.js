/* ═══════════════════════════════════════════════════════════════════
   IL REGISTRO DEI GIOCHI NUOVI

   Una riga per gioco. Di qui leggono la home (per fare la carta) e la
   schermata dei genitori (per l'interruttore): con i giochi vecchi
   aggiungerne uno voleva dire toccare `App.vue`, `HomeView.vue`,
   `data/giochi.js` e `store/profile.js`, e dimenticarne uno dava un
   gioco raggiungibile ma invisibile — o il contrario.

   Qui dentro ci sono solo **manifesti puri**: niente `.vue`, niente
   store. Le schermate stanno in `schermate.js`, che le importa davvero
   ed è letto solo da `App.vue`. Sono due file perché sono due catene di
   `import` diverse: `data/giochi.js` ha bisogno dei nomi e finirebbe per
   tirarsi dietro mezza applicazione — e un anello di import è un guasto
   che si presenta mesi dopo, senza un motivo visibile.

   L'ordine è quello in cui le carte compaiono in home.
   ═══════════════════════════════════════════════════════════════════ */
import codiceSegreto from './codice-segreto/gioco.js'
import survivors from './survivors/gioco.js'
import dungeon from './dungeon/gioco.js'
import conta from './conta/gioco.js'
import primaDopo from './prima-dopo/gioco.js'
import corsa from './corsa/gioco.js'
import fattoria from './fattoria/gioco.js'
import sotterraneo from './sotterraneo/gioco.js'
import castello from './castello/gioco.js'

export const GIOCHI_NUOVI = [codiceSegreto, survivors, dungeon, conta, primaDopo, corsa, fattoria,
                             sotterraneo, castello]

export const gioco = chiave => GIOCHI_NUOVI.find(g => g.chiave === chiave) || null

export const CHIAVI_NUOVE = GIOCHI_NUOVI.map(g => g.chiave)
