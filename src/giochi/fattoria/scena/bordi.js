/* L'auto-bordo: un confine fra due materie (non un contorno attorno a una sola), guardando i quattro
   vicini — dati/terreni.js tiene la tabella (bordiFra). Quando i vicini diversi sono due (un angolo
   fra tre materie) vince il lato con la priorità più alta nell'ordine fisso N,S,E,O: non è la scelta
   "giusta" (non esiste), è quella sempre uguale — stessa cella, stesso disegno, mai a sfarfallio. */
import { bordiFra, BASE } from '../dati/terreni.js'
export { guastiDeiTerreni } from '../dati/terreni.js'

// Le tessere del bordo fra materia e vicino, per lato; passa sempre da bordiFra() (dove vive il ripiego '*').
function tessera(materia, vicino, lato) {
  const b = bordiFra(materia, vicino)
  return b ? b[lato] : null
}

// Il pittore per materia: materiaDi(x,y) risponde con la materia, non un booleano, così si distingue
// "vicino diverso" (decide la forma) da "...ed è roccia" (decide quale tabella). null se non c'è niente da disegnare.
export function tesseraDi(materiaDi, x, y) {
  const materia = materiaDi(x, y)
  if (materia === BASE) return null            // il prato è il fondo, non un bordo

  const nN = materiaDi(x, y - 1), nS = materiaDi(x, y + 1)
  const nE = materiaDi(x + 1, y), nO = materiaDi(x - 1, y)
  const mN = nN !== materia, mS = nS !== materia
  const mE = nE !== materia, mO = nO !== materia

  // Circondata da sé stessa: si usa BASE come vicino convenzionale (la materia che sta ovunque non si sia dipinto altro).
  if (!mN && !mS && !mE && !mO) return tessera(materia, BASE, 'centro')

  if (mN && mO && !mS && !mE) return tessera(materia, nN, 'no')
  if (mN && mE && !mS && !mO) return tessera(materia, nN, 'ne')
  if (mS && mO && !mN && !mE) return tessera(materia, nS, 'so')
  if (mS && mE && !mN && !mO) return tessera(materia, nS, 'se')

  if (mN) return tessera(materia, nN, 'n')
  if (mS) return tessera(materia, nS, 's')
  if (mE) return tessera(materia, nE, 'e')
  return tessera(materia, nO, 'o')             // arrivare qui vuol dire che mO è vero
}
