// Chiave -> componente per App.vue: l'unico file che importa i .vue dei
// giochi nuovi (indice.js resta dato puro). Un gioco nuovo aggiunge una
// riga qui e una in indice.js. Ogni gioco è caricato quando serve (carica.js): un file suo nel sito spezzato.
import { caricaQuando } from './carica.js'
const CodiceSegreto = caricaQuando(() => import('./codice-segreto/Gioco.vue'))
const Survivors = caricaQuando(() => import('./survivors/Gioco.vue'))
const Conta = caricaQuando(() => import('./conta/Gioco.vue'))
const PrimaDopo = caricaQuando(() => import('./prima-dopo/Gioco.vue'))
const Fattoria = caricaQuando(() => import('./fattoria/Gioco.vue'))
const Sotterraneo = caricaQuando(() => import('./sotterraneo/Gioco.vue'))
const Pozioni = caricaQuando(() => import('./pozioni/Gioco.vue'))
const PassoPasso = caricaQuando(() => import('./passo-passo/Gioco.vue'))
const Costruttore = caricaQuando(() => import('./costruttore/Gioco.vue'))
const Inglese = caricaQuando(() => import('./inglese/Gioco.vue'))
const Spagnolo = caricaQuando(() => import('./spagnolo/Gioco.vue'))
const Arena = caricaQuando(() => import('./arena/Gioco.vue'))

export const SCHERMATE = {
  codice: CodiceSegreto,
  survivors: Survivors,
  conta: Conta,
  prima: PrimaDopo,
  fattoria: Fattoria,
  sotterraneo: Sotterraneo,
  pozioni: Pozioni,
  passo: PassoPasso,
  costruttore: Costruttore,
  inglese: Inglese,      // prende il posto di LinguaGame per l'inglese: vince su `viste` di App.vue
  spagnolo: Spagnolo,    // idem per lo spagnolo
  arena: Arena,
}
