/* ═══════════════════════════════════════════════════════════════════
   ASPETTA
   ═══════════════════════════════════════════════════════════════════ */
import { controlla, uguale, nota, riassunto } from '../../../aiuto/verifica.mjs'
import { banco, cosaFinta, cartellino, chiFinto, campoFinto } from '../../../aiuto/finto.js'
import { Esito } from '../../../../src/motore/generale/azioni/esiti.js'
import { Aspetta } from '../../../../src/motore/generale/azioni/aspetta.js'
import { Sempre } from '../../../../src/motore/generale/domande/sempre.js'
import { Passati } from '../../../../src/motore/generale/domande/passati.js'

{
  const q = banco({ chi: chiFinto() })
  const aspetta = new Aspetta([0], new Passati(3))
  controlla('aspetta: al primo battito non è ancora ora', !aspetta.esegui(q.contesto).finito)
  controlla('aspetta: nemmeno al secondo', !aspetta.esegui(q.contesto).finito)
  controlla('aspetta: al terzo riparte', aspetta.esegui(q.contesto).finito)
}
{
  const q = banco({ chi: chiFinto() })
  const esito = new Aspetta([0], new Sempre()).esegui(q.contesto)
  controlla('aspetta: se la domanda è già vera non aspetta niente', esito.finito)
}

riassunto('aspetta')
