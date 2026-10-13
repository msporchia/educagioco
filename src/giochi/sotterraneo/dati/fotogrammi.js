// Quanti fotogrammi ha una posa di uno sprite nell'atlante, e quale posare a un dato istante: le creature del catalogo hanno due,
// tre o quattro fotogrammi di respiro e sei di passi (docs/core/creature.md), e `fr % 4` darebbe un pezzo che non c'è. Sta qui,
// e non in dati/tessere.js, perché legge l'atlante (il motore deve poter girare in Node senza)
import { PEZZI } from './atlante.js'

const conti = new Map()
// da 0 a 6
export function quantiFotogrammi(sprite, posa) {
  const k = `${sprite}-${posa}`
  if (!conti.has(k)) { let n = 0; while (n < 6 && PEZZI[`${k}-${n}`]) n++; conti.set(k, n) }
  return conti.get(k)
}

// il nome del fotogramma `fr` (che gira sui fotogrammi che ci sono); se la posa non c'è, quello della posa `ripiego`
export function fotogrammaDi(sprite, posa, fr, ripiego = 'fermo') {
  let p = posa
  let n = quantiFotogrammi(sprite, p)
  if (!n && ripiego) { p = ripiego; n = quantiFotogrammi(sprite, p) }
  return `${sprite}-${p}-${n ? Math.abs(fr | 0) % n : 0}`
}
