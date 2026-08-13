/* ═══════════════════════════════════════════════════════════════════
   APRI
   ═══════════════════════════════════════════════════════════════════ */
import { controlla, uguale, nota, riassunto } from '../../../aiuto/verifica.mjs'
import { banco, cosaFinta, cartellino, chiFinto, campoFinto } from '../../../aiuto/finto.js'
import { Esito } from '../../../../src/motore/generale/azioni/esiti.js'
import { Apri } from '../../../../src/motore/generale/azioni/apri.js'

{
  /* il verbo non decide se è istantaneo: lo dice la cosa. Qui la porta
     risponde «ero già aperta» e il battito non va speso. */
  const porta = cosaFinta({ id: 'porta', nome: 'il portone', tipo: 'porta', x: 0, y: 0,
                            stato: { aperta: true },
                            risposte: { apri: { esito: Esito.finitoSubito() } } })
  const q = banco({ cose: [porta], chi: chiFinto({ x: 0, y: 0 }) })
  const esito = new Apri([0], 'porta').esegui(q.contesto)
  controlla('apri: «era già aperta» non costa un battito', esito.finito && !esito.speso)
}
{
  const porta = cosaFinta({ id: 'porta', nome: 'il portone', tipo: 'porta', x: 0, y: 0,
                            stato: { aperta: false },
                            risposte: { apri: { esito: Esito.inCorso(), penso: 'spingo' } } })
  const q = banco({ cose: [porta], chi: chiFinto({ x: 0, y: 0 }) })
  const esito = new Apri([0], 'porta').esegui(q.contesto)
  controlla('apri: se la cosa dice «ci sto lavorando», l\'ordine non è finito', !esito.finito)
  controlla('apri: e la frase è quella della cosa', q.registro.ha('spingo'))
}

riassunto('apri')
