/* ═══════════════════════════════════════════════════════════════════
   SUONA e PARLA
   ═══════════════════════════════════════════════════════════════════ */
import { controlla, uguale, nota, riassunto } from '../../../aiuto/verifica.mjs'
import { banco, cosaFinta, cartellino, chiFinto, campoFinto } from '../../../aiuto/finto.js'
import { Esito } from '../../../../src/motore/generale/azioni/esiti.js'
import { Suona } from '../../../../src/motore/generale/azioni/suona.js'
import { Parla } from '../../../../src/motore/generale/azioni/parla.js'

{
  const seg = cartellino('via', 'segnale', 'via libera')
  const q = banco({ cose: [seg], chi: chiFinto({ x: 4, y: 2 }) })
  const esito = new Suona([0], 'via').esegui(q.contesto)
  controlla('suona: si grida da dove si è, senza andare da nessuna parte', esito.finito)
  uguale('suona: il mondo riceve un rumore', q.mondo.pendenti[0].tipo, 'rumore')
}
{
  const seg = cartellino('via', 'segnale', 'via libera')
  const q = banco({ cose: [seg], chi: chiFinto() })
  new Parla([0], 'via').esegui(q.contesto)
  uguale('parla: il mondo riceve una voce, non un rumore', q.mondo.pendenti[0].tipo, 'voce')
  controlla('parla: e da fuori si vede che bisbiglia', q.registro.ultima.siVede === 'parla sottovoce')
}

riassunto('suona e parla')
