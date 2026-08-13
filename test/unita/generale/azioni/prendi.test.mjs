/* ═══════════════════════════════════════════════════════════════════
   PRENDI
   ═══════════════════════════════════════════════════════════════════ */
import { controlla, uguale, nota, riassunto } from '../../../aiuto/verifica.mjs'
import { banco, cosaFinta, cartellino, chiFinto, campoFinto } from '../../../aiuto/finto.js'
import { Esito } from '../../../../src/motore/generale/azioni/esiti.js'
import { Prendi } from '../../../../src/motore/generale/azioni/prendi.js'

{
  const chiave = cosaFinta({ id: 'chiave', nome: 'la chiave', x: 0, y: 0,
                             risposte: { prendi: { esito: Esito.finito(), penso: 'presa la chiave' } } })
  const q = banco({ cose: [chiave], chi: chiFinto({ x: 0, y: 0 }) })
  const esito = new Prendi([0], 'chiave').esegui(q.contesto)
  uguale('prendi: consegna il comando alla cosa', chiave.sentite[0].comando, 'prendi')
  controlla('prendi: e riporta quello che la cosa ha risposto', esito.finito && esito.speso)
}
{
  /* da lontano cammina, e NON consegna niente finché non è arrivato */
  const chiave = cosaFinta({ id: 'chiave', nome: 'la chiave', x: 4, y: 0,
                             risposte: { prendi: { esito: Esito.finito(), penso: 'presa' } } })
  const q = banco({ cose: [chiave], chi: chiFinto({ x: 0, y: 0 }) })
  new Prendi([0], 'chiave').esegui(q.contesto)
  uguale('prendi: da lontano cammina', q.chi.x, 1)
  uguale('prendi: e non tocca la cosa finché non ci arriva', chiave.sentite.length, 0)
}

riassunto('prendi')
