/* ═══════════════════════════════════════════════════════════════════
   ATTACCA
   ═══════════════════════════════════════════════════════════════════ */
import { controlla, uguale, nota, riassunto } from '../../../aiuto/verifica.mjs'
import { banco, cosaFinta, cartellino, chiFinto, campoFinto } from '../../../aiuto/finto.js'
import { Esito } from '../../../../src/motore/generale/azioni/esiti.js'
import { Attacca } from '../../../../src/motore/generale/azioni/attacca.js'

{
  const orco = chiFinto({ id: 'orco', nome: "l'orco", fazione: 'orchi', x: 1, y: 0 })
  orco.vita = 2
  const bersaglio = cartellino('orco', 'unita', "l'orco")
  const q = banco({ cose: [bersaglio], unita: [orco], chi: chiFinto({ x: 0, y: 0 }) })
  const attacca = new Attacca([0], 'orco')

  const primo = attacca.esegui(q.contesto)
  uguale('attacca: toglie vita', orco.vita, 1)
  controlla('attacca: e finché è in piedi non ha finito', !primo.finito)
  const secondo = attacca.esegui(q.contesto)
  controlla('attacca: quando cade, ha finito', secondo.finito)
  controlla('attacca: e lo racconta', q.registro.ha('è caduto'))
}
{
  /* non si attacca chi non si è mai visto: fallisce subito e lo dice,
     invece di restare fermo sessanta battiti */
  const orco = chiFinto({ id: 'orco', nome: "l'orco", fazione: 'orchi', x: 6, y: 0 })
  const bersaglio = cartellino('orco', 'unita', "l'orco")
  const q = banco({ cose: [bersaglio], unita: [orco],
                    chi: chiFinto({ x: 0, y: 0, vede: () => false }) })
  const esito = new Attacca([0], 'orco').esegui(q.contesto)
  controlla('attacca: chi non hai mai visto non si insegue', esito.finito)
  uguale('attacca: e lo dice invece di restare fermo', q.registro.ultima.esito, 'no')
}

riassunto('attacca')
