/* ═══════════════════════════════════════════════════════════════════
   LE SCHERMATE DEI GIOCHI NUOVI

   Chiave → componente, nella forma che si aspetta `App.vue`. È l'unico
   file che importa davvero i `.vue` dei giochi nuovi, e lo legge solo
   `App.vue`: i manifesti (`indice.js`) restano dato puro e li può
   leggere chiunque, anche chi sta a monte dello store.

   Un gioco nuovo aggiunge una riga qui e una in `indice.js`. Niente
   altro dell'applicazione va toccato.
   ═══════════════════════════════════════════════════════════════════ */
import CodiceSegreto from './codice-segreto/Gioco.vue'
import Dungeon from './dungeon/Gioco.vue'
import Survivors from './survivors/Gioco.vue'
import Conta from './conta/Gioco.vue'
import PrimaDopo from './prima-dopo/Gioco.vue'
import Corsa from './corsa/Gioco.vue'
import Fattoria from './fattoria/Gioco.vue'
import Sotterraneo from './sotterraneo/Gioco.vue'
import Castello from './castello/Gioco.vue'

export const SCHERMATE = {
  codice: CodiceSegreto,
  dungeon: Dungeon,
  survivors: Survivors,
  conta: Conta,
  prima: PrimaDopo,
  corsa: Corsa,
  fattoria: Fattoria,
  sotterraneo: Sotterraneo,
  castello: Castello,
}
