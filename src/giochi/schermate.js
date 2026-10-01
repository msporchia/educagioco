// Chiave -> componente per App.vue: l'unico file che importa i .vue dei
// giochi nuovi (indice.js resta dato puro). Un gioco nuovo aggiunge una
// riga qui e una in indice.js.
import CodiceSegreto from './codice-segreto/Gioco.vue'
import Dungeon from './dungeon/Gioco.vue'
import Survivors from './survivors/Gioco.vue'
import Conta from './conta/Gioco.vue'
import PrimaDopo from './prima-dopo/Gioco.vue'
import Corsa from './corsa/Gioco.vue'
import Fattoria from './fattoria/Gioco.vue'
import Sotterraneo from './sotterraneo/Gioco.vue'
import Pozioni from './pozioni/Gioco.vue'
import PassoPasso from './passo-passo/Gioco.vue'
import Costruttore from './costruttore/Gioco.vue'
import Inglese from './inglese/Gioco.vue'
import Spagnolo from './spagnolo/Gioco.vue'

export const SCHERMATE = {
  codice: CodiceSegreto,
  dungeon: Dungeon,
  survivors: Survivors,
  conta: Conta,
  prima: PrimaDopo,
  corsa: Corsa,
  fattoria: Fattoria,
  sotterraneo: Sotterraneo,
  pozioni: Pozioni,
  passo: PassoPasso,
  costruttore: Costruttore,
  inglese: Inglese,      // prende il posto di LinguaGame per l'inglese: vince su `viste` di App.vue
  spagnolo: Spagnolo,    // idem per lo spagnolo
}
