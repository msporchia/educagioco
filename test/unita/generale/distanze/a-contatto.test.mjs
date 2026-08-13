/* ═══════════════════════════════════════════════════════════════════
   A CONTATTO — la misura delle mani
   ═══════════════════════════════════════════════════════════════════ */
import { controlla, uguale, nota, riassunto } from '../../../aiuto/verifica.mjs'
import { mondoFinto, chiFinto } from '../../../aiuto/finto.js'
import { AContatto } from '../../../../src/motore/generale/distanze/a-contatto.js'

{
  const mondo = mondoFinto({})
  const chi = chiFinto({ x: 2, y: 2 })
  uguale('conta a caselle, senza diagonali',
         new AContatto(1).distanza(mondo, chi, { x: 3, y: 3 }), 2)
  controlla('accanto si tocca', new AContatto(1).arriva(mondo, chi, { x: 3, y: 2 }))
  controlla('in diagonale no', !new AContatto(1).arriva(mondo, chi, { x: 3, y: 3 }))
  controlla('sulla stessa cella pure', new AContatto(0).arriva(mondo, chi, { x: 2, y: 2 }))
  controlla('e con raggio zero, accanto non basta',
            !new AContatto(0).arriva(mondo, chi, { x: 3, y: 2 }))
}
{
  /* la portata la dichiara l'arma: un arciere non chiede di riaprire
     «attacca» */
  const mondo = mondoFinto({})
  const chi = chiFinto({ x: 0, y: 0 })
  controlla('un raggio più lungo arriva più lontano',
            new AContatto(5).arriva(mondo, chi, { x: 4, y: 0 }))
}

nota('il contatto è la misura delle mani, e la portata la dichiara chi colpisce')
riassunto('a contatto')
