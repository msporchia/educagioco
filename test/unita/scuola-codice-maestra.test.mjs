/* IL CODICE DELLA MAESTRA — quattro cifre a tempo, calcolate dall'ora dalle due pagine (src/scuola/comune/codice-maestra.js).
   Vedi docs/scuola/ripieghi.md. `node test/esegui.mjs scuola-codice-maestra --niente-build` */
import { codiceAl, cambiaAl, codiceGiusto, FINESTRA } from '../../src/scuola/comune/codice-maestra.js'
import { controlla, uguale, riassunto } from '../aiuto/verifica.mjs'

const ORA = Date.UTC(2026, 10, 20, 8, 12)
const c = codiceAl(ORA)
controlla('quattro cifre', /^\d{4}$/.test(c), c)
uguale('lo stesso istante dà lo stesso codice (le due pagine lo calcolano da sole)', codiceAl(ORA), c)
uguale('vale fino alla fine della sua finestra di cinque minuti', codiceAl(cambiaAl(ORA) - 1), c)
controlla('poi cambia', codiceAl(cambiaAl(ORA)) !== c)
const tanti = new Set(Array.from({ length: 200 }, (_, i) => codiceAl(ORA + i * FINESTRA)))
controlla('in 200 finestre di fila quasi mai lo stesso: non si impara a memoria', tanti.size > 190, tanti.size)
controlla('il PC del bambino accetta quello di adesso', codiceGiusto(c, ORA))
controlla('e quello di fino a dieci minuti prima (la maestra lo legge e cammina)', codiceGiusto(codiceAl(ORA - 2 * FINESTRA), ORA))
controlla('e quello dei cinque minuti dopo (un orologio un po\' indietro)', codiceGiusto(codiceAl(ORA + FINESTRA), ORA))
controlla('non quello di un quarto d\'ora fa', !codiceGiusto(codiceAl(ORA - 3 * FINESTRA), ORA) || [-2, -1, 0, 1].some(d => codiceAl(ORA + d * FINESTRA) === codiceAl(ORA - 3 * FINESTRA)))
controlla('né uno a caso', !codiceGiusto(String((Number(c) + 1) % 10000).padStart(4, '0'), ORA) || [-2, -1, 1].some(d => codiceAl(ORA + d * FINESTRA) === String((Number(c) + 1) % 10000).padStart(4, '0')))
controlla('spazi e trattini non contano', codiceGiusto(`${c.slice(0, 2)} ${c.slice(2)}`, ORA))
controlla('tre cifre o niente: no', !codiceGiusto(c.slice(0, 3), ORA) && !codiceGiusto('', ORA) && !codiceGiusto(null, ORA))

riassunto('il codice della maestra')
