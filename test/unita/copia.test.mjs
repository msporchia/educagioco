/* L'avviso sul salvataggio (`store/copia.js`): mai salvato, vecchio, a posto. Docs: docs/genitori/riordino.md */
import { giorniDaUltima, statoCopia, GIORNI_VECCHIA } from '../../src/store/copia.js'
import { controlla, uguale, riassunto } from '../aiuto/verifica.mjs'

const GIORNO = 86400000, OGGI = new Date(2026, 9, 21, 12).getTime()
uguale('mai salvato: nessun giorno', giorniDaUltima(null, OGGI), null)
uguale('oggi: zero giorni', giorniDaUltima(OGGI - 3600000, OGGI), 0)
uguale('dodici giorni fa', giorniDaUltima(OGGI - 12 * GIORNO - 1000, OGGI), 12)
uguale('un orologio indietro non dà giorni negativi', giorniDaUltima(OGGI + GIORNO, OGGI), 0)
uguale('mai salvato: «mai»', statoCopia(null, OGGI), 'mai')
uguale('a posto: niente', statoCopia(OGGI - (GIORNI_VECCHIA - 1) * GIORNO, OGGI), null)
uguale('oltre i quattordici giorni: «vecchia»', statoCopia(OGGI - GIORNI_VECCHIA * GIORNO, OGGI), 'vecchia')
controlla('un valore che non è un numero vale «mai»', statoCopia('ieri', OGGI) === 'mai' && statoCopia(NaN, OGGI) === 'mai')
riassunto('l\'avviso sul salvataggio')
