/* IL CODICE DELLA MAESTRA — quattro cifre a tempo, calcolate dall'ora dalle due pagine (src/scuola/comune/codice-maestra.js).
   Vedi docs/scuola/ripieghi.md. `node test/esegui.mjs scuola-codice-maestra --niente-build` */
import { codiceAl, valeFinoAl, codiceGiusto, FINESTRA, attesaDopo, ATTESA_SBAGLI } from '../../src/scuola/comune/codice-maestra.js'
import { controlla, uguale, riassunto } from '../aiuto/verifica.mjs'

const ORA = Date.UTC(2026, 10, 20, 8, 12)
const c = codiceAl(ORA)
controlla('quattro cifre', /^\d{4}$/.test(c), c)
uguale('lo stesso istante dà lo stesso codice (le due pagine lo calcolano da sole)', codiceAl(ORA), c)
uguale('la finestra è di un\'ora', FINESTRA, 3600000)
controlla('nella pagina della maestra cambia ogni ora', codiceAl(ORA + FINESTRA) !== c)
const fine = valeFinoAl(ORA)
controlla('vale almeno tre ore da quando lo si legge (la maestra se lo segna a inizio mattina)', fine - ORA >= 3 * FINESTRA && fine - ORA <= 4 * FINESTRA)
controlla('il PC lo accetta fino all\'ora detta', codiceGiusto(c, fine - 1))
controlla('e non dopo', !codiceGiusto(c, fine) || [1, 2, 3, 4, 5].some(d => codiceAl(ORA + d * FINESTRA) === c))
const tanti = new Set(Array.from({ length: 200 }, (_, i) => codiceAl(ORA + i * FINESTRA)))
controlla('in 200 finestre di fila quasi mai lo stesso: non si impara a memoria', tanti.size > 190, tanti.size)
controlla('il PC del bambino accetta quello di adesso', codiceGiusto(c, ORA))
controlla('e quello di tre ore prima', codiceGiusto(codiceAl(ORA - 3 * FINESTRA), ORA))
controlla('e quello dell\'ora dopo (un orologio un po\' indietro)', codiceGiusto(codiceAl(ORA + FINESTRA), ORA))
const vicini = d => [-3, -2, -1, 0, 1].filter(x => x !== d).some(x => codiceAl(ORA + x * FINESTRA) === codiceAl(ORA + d * FINESTRA))
controlla('non quello di quattro ore fa', !codiceGiusto(codiceAl(ORA - 4 * FINESTRA), ORA) || vicini(-4))
const unAltro = String((Number(c) + 1) % 10000).padStart(4, '0')
controlla('né uno a caso', !codiceGiusto(unAltro, ORA) || [-3, -2, -1, 1].some(d => codiceAl(ORA + d * FINESTRA) === unAltro))
controlla('spazi e trattini non contano', codiceGiusto(`${c.slice(0, 2)} ${c.slice(2)}`, ORA))
controlla('tre cifre o niente: no', !codiceGiusto(c.slice(0, 3), ORA) && !codiceGiusto('', ORA) && !codiceGiusto(null, ORA))

uguale('tre sbagli: un minuto', attesaDopo(1), ATTESA_SBAGLI)
uguale('altri tre: due minuti', attesaDopo(2), 2 * ATTESA_SBAGLI)
uguale('poi quattro', attesaDopo(3), 4 * ATTESA_SBAGLI)
uguale('fino a mezz\'ora, non di più', attesaDopo(20), 30 * 60000)

riassunto('il codice della maestra')
