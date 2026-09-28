/* Quello che c'è nel bosco, e quanto costa toglierlo: sgombrare costa e basta, non rende — vedi
   docs/fattoria/regole.md e catena.md. costo è l'unico numero che serve. */
import { PEZZI } from './atlante.js'

// Costi piccoli, con la fatica; solo roba da buttare (non l'albero o la siepe, che si comprano).
export const OSTACOLI = {
  ceppo:  { pezzo: 'ceppo',  nome: 'Ceppo',  piede: [1, 1], costo: 4 },
  sasso:  { pezzo: 'sasso',  nome: 'Masso',  piede: [1, 1], costo: 6 },
  sassi:  { pezzo: 'sassi',  nome: 'Sassi',  piede: [1, 1], costo: 3 },
  tronco: { pezzo: 'tronco', nome: 'Tronco', piede: [3, 1], costo: 8 },
}

export const TIPI = Object.keys(OSTACOLI)

export function guastiDegliOstacoli() {
  const g = []
  for (const [id, o] of Object.entries(OSTACOLI)) {
    if (!PEZZI[o.pezzo]) g.push(`${id}: la tessera «${o.pezzo}» non è nell'atlante`)
    if (!(o.costo > 0)) g.push(`${id}: costo impossibile`)
    // Un ostacolo che paga rimetterebbe in piedi la seconda fonte di monete tolta apposta.
    if (o.resa !== undefined) g.push(`${id}: ha una «resa» — nel bosco non si guadagna`)
    if (!Array.isArray(o.piede) || o.piede.length !== 2 || o.piede.some(n => n < 1))
      g.push(`${id}: piede impossibile`)
  }
  if (!TIPI.length) g.push('un bosco senza niente da sgombrare non è un bosco')
  return g
}
