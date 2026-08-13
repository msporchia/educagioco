/* ═══════════════════════════════════════════════════════════════════
   A CAMMINO — la misura degli occhi

   Si conta in passi veri: un muro allontana, e quello che non si
   raggiunge camminando non si vede affatto.
   ═══════════════════════════════════════════════════════════════════ */
import { controlla, uguale, nota, riassunto } from '../../../aiuto/verifica.mjs'
import { mondoFinto, campoFinto, cosaFinta, chiFinto } from '../../../aiuto/finto.js'
import { ACammino } from '../../../../src/motore/generale/distanze/a-cammino.js'

{
  const mondo = mondoFinto({ campo: campoFinto({ larghezza: 9, altezza: 3 }) })
  const chi = chiFinto({ x: 0, y: 0 })
  const la = { x: 3, y: 0 }
  uguale('in campo aperto conta i passi', new ACammino(9).distanza(mondo, chi, la), 3)
  controlla('e con vista 3 ci arriva', new ACammino(3).arriva(mondo, chi, la))
  controlla('con vista 2 no', !new ACammino(2).arriva(mondo, chi, la))
}
{
  /* IL MURO ALLONTANA: non taglia in linea retta, fa girare intorno */
  const muri = [{ x: 1, y: 0 }, { x: 1, y: 1 }]
  const mondo = mondoFinto({ campo: campoFinto({ larghezza: 9, altezza: 3, muri }) })
  const chi = chiFinto({ x: 0, y: 0 })
  /* due celle in linea d'aria, sei a piedi: si scende, si gira sotto il
     muro e si risale. È tutta la differenza fra questa misura e quella
     del suono */
  uguale('un muro in mezzo allunga la strada',
         new ACammino(20).distanza(mondo, chi, { x: 2, y: 0 }), 6)
}
{
  /* UN MURO CHIUSO INTORNO è distanza infinita: non è «lontano», è
     «non ci si arriva», ed è così che una porta chiusa acceca */
  const muri = [{ x: 7, y: 0 }, { x: 7, y: 1 }, { x: 7, y: 2 }]
  const mondo = mondoFinto({ campo: campoFinto({ larghezza: 9, altezza: 3, muri }) })
  const chi = chiFinto({ x: 0, y: 0 })
  uguale('quello che non si raggiunge camminando è a distanza infinita',
         new ACammino(99).distanza(mondo, chi, { x: 8, y: 0 }), Infinity)
}
{
  /* LA COSA CHE SI TOCCA SOLO DA ACCANTO: su una porta chiusa non ci si
     cammina sopra, quindi la sua cella è irraggiungibile — e chi le è
     appoggiato «non la vedeva». Lo risolve la cosa, dicendo da dove la
     si tocca. */
  const muri = [{ x: 3, y: 0 }]
  const mondo = mondoFinto({ campo: campoFinto({ larghezza: 9, altezza: 3, muri }) })
  const chi = chiFinto({ x: 2, y: 0 })
  const porta = cosaFinta({ id: 'porta', tipo: 'porta', x: 3, y: 0 })
  uguale('una cosa su cui non si cammina si misura dai suoi bordi',
         new ACammino(9).distanza(mondo, chi, porta), 0)
}

nota('la vista si misura a passi: i muri la fermano')
riassunto('a cammino')
