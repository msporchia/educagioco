/* ═══════════════════════════════════════════════════════════════════
   IN LINEA D'ARIA — la misura delle orecchie

   Il muro ferma gli occhi, non le orecchie: è tutta qui la differenza
   col cammino, ed è quello che tiene in piedi «chiuso là dentro non
   vedi niente, ma senti».
   ═══════════════════════════════════════════════════════════════════ */
import { controlla, uguale, nota, riassunto } from '../../../aiuto/verifica.mjs'
import { mondoFinto, campoFinto, chiFinto } from '../../../aiuto/finto.js'
import { InAria } from '../../../../src/motore/generale/distanze/in-aria.js'

{
  const mondo = mondoFinto({ campo: campoFinto({ larghezza: 9, altezza: 5 }) })
  const chi = chiFinto({ x: 0, y: 0 })
  uguale('si misura in tondo, non a caselle',
         new InAria(9).distanza(mondo, chi, { x: 3, y: 4 }), 5)
  controlla('un fracasso da lontano arriva', new InAria(40).arriva(mondo, chi, { x: 8, y: 4 }))
  controlla('un cigolio no', !new InAria(2).arriva(mondo, chi, { x: 8, y: 4 }))
}
{
  /* LA PROVA CHE CONTA: con i muri in mezzo la distanza non cambia di
     niente. Se cambiasse, chi si chiude dietro una porta non sentirebbe
     più nessuno e metà del gioco cadrebbe. */
  const muri = [{ x: 1, y: 0 }, { x: 1, y: 1 }, { x: 1, y: 2 }, { x: 1, y: 3 }, { x: 1, y: 4 }]
  const aperto = mondoFinto({ campo: campoFinto({ larghezza: 9, altezza: 5 }) })
  const murato = mondoFinto({ campo: campoFinto({ larghezza: 9, altezza: 5, muri }) })
  const chi = chiFinto({ x: 0, y: 0 })
  uguale('i muri non fermano il suono',
         new InAria(9).distanza(murato, chi, { x: 4, y: 0 }),
         new InAria(9).distanza(aperto, chi, { x: 4, y: 0 }))
}

nota("il suono si misura in linea d'aria: i muri non lo fermano")
riassunto("in linea d'aria")
