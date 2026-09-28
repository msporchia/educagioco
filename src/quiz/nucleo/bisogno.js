/* Quanto serve rivedere una tipologia: NON è l'SRS degli asteroidi (qui
   l'elemento è un concetto che non finisce mai, mai isMastered, mai
   materia nuova in progressi.js). Banda stretta apposta (0.5-1.5, non i
   fattori larghi di weight()): la domanda è il pedaggio di un gioco
   d'avventura, non lo studio. Gira in Node (unita/quiz-ripasso). Vedi
   docs/apprendimento/quiz-ripasso.md. */
import { SRS, strength } from '../../store/srs.js'

export const BISOGNO = { min: 0.5, max: 1.5 } // chi lo sa esce la metà, chi non lo sa una volta e mezzo

// da 0 a 1; il tetto è masterS, non la forza massima: sopra farebbe sparire per mesi una cosa azzeccata 5 volte di fila
export function saputo(it, now = Date.now()) {
  if (!it || !it.last) return null            // mai visto: non si sa niente
  return Math.min(strength(it, now), SRS.masterS) / SRS.masterS
}

export function bisognoDa(it, now = Date.now()) {
  const s = saputo(it, now)
  if (s === null) return 1
  return BISOGNO.max - s * (BISOGNO.max - BISOGNO.min)
}
