/* ═══════════════════════════════════════════════════════════════════
   VAI
   ═══════════════════════════════════════════════════════════════════ */
import { controlla, uguale, nota, riassunto } from '../../../aiuto/verifica.mjs'
import { banco, cosaFinta, cartellino, chiFinto, campoFinto } from '../../../aiuto/finto.js'
import { Esito } from '../../../../src/motore/generale/azioni/esiti.js'
import { Vai } from '../../../../src/motore/generale/azioni/vai.js'

{
  const meta = cosaFinta({ id: 'meta', nome: 'la meta', tipo: 'posto', x: 3, y: 0 })
  const q = banco({ cose: [meta], chi: chiFinto({ x: 0, y: 0 }) })
  const vai = new Vai([0], 'meta')

  const primo = vai.esegui(q.contesto)
  controlla('vai: un passo per battito, non ci arriva subito', !primo.finito)
  uguale('vai: dopo un battito è avanzato di una cella', q.chi.x, 1)
  controlla('vai: e lo racconta', q.registro.ha('vado a la meta'))

  vai.esegui(q.contesto); const ultimo = vai.esegui(q.contesto)
  controlla('vai: arrivato, ha finito', ultimo.finito)
  uguale('vai: ed è sulla cella della meta', q.chi.x, 3)
}
{
  /* la strada chiusa non è un errore subito: si aspetta, perché quel
     portone potrebbe aprirlo qualcun altro fra due battiti */
  const muri = [{ x: 1, y: 0 }, { x: 1, y: 1 }, { x: 1, y: 2 }, { x: 1, y: 3 }, { x: 1, y: 4 }]
  const meta = cosaFinta({ id: 'meta', nome: 'la meta', tipo: 'posto', x: 3, y: 0 })
  const q = banco({ cose: [meta], campo: campoFinto({ muri }), chi: chiFinto({ x: 0, y: 0 }) })
  const esito = new Vai([0], 'meta').esegui(q.contesto)
  controlla('vai: se la strada è chiusa aspetta, non fallisce', !esito.finito && !esito.speso)
  controlla('vai: e dice perché', q.registro.ha('la strada è chiusa'))
}
{
  const q = banco({ chi: chiFinto() })
  const esito = new Vai([0], 'fantasma').esegui(q.contesto)
  controlla('vai: un bersaglio che non esiste fallisce parlando', esito.finito)
  uguale('vai: con una riga rossa', q.registro.ultima.esito, 'no')
}

riassunto('vai')
