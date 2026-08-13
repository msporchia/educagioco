/* ═══════════════════════════════════════════════════════════════════
   IL CICLO
   ═══════════════════════════════════════════════════════════════════ */
import { controlla, uguale, nota, riassunto } from '../../../aiuto/verifica.mjs'
import { banco, cosaFinta, cartellino, chiFinto, campoFinto } from '../../../aiuto/finto.js'
import { Esito } from '../../../../src/motore/generale/azioni/esiti.js'
import { Ripeti } from '../../../../src/motore/generale/azioni/ripeti.js'
import { Fila } from '../../../../src/motore/generale/azioni/fila.js'
import { Definizione } from '../../../../src/motore/generale/azioni/definizione.js'
import { compilaFila } from '../../../../src/motore/generale/azioni/indice.js'
import { Sempre } from '../../../../src/motore/generale/domande/sempre.js'

{
  const q = banco({ chi: chiFinto() })
  const ripeti = new Ripeti([0], new Fila([new Definizione([0, 'corpo', 0], 'x')]), new Sempre())
  const esito = ripeti.esegui(q.contesto)
  controlla('ripeti: l\'uscita si guarda PRIMA del corpo, a ogni battito', esito.finito)
  controlla('ripeti: e dice che smette', q.registro.ha('smetto di girare'))
}
{
  /* senza uscita gira: il corpo finisce e si ricomincia, un battito
     per giro — non tutto dentro lo stesso */
  const meta = cosaFinta({ id: 'meta', nome: 'la meta', tipo: 'posto', x: 8, y: 0 })
  const q = banco({ cose: [meta], chi: chiFinto({ x: 0, y: 0 }) })
  const ripeti = new Ripeti([0], compilaFila([{ verbo: 'vai', complemento: 'meta' }], [0, 'corpo']), null)
  const esito = ripeti.esegui(q.contesto)
  controlla('ripeti: senza uscita non finisce mai', !esito.finito)
  controlla('ripeti: e spende un battito per giro', esito.speso)
}

riassunto('il ciclo')
