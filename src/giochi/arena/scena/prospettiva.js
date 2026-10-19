// Lo specchio dell'ospite. Nella sfida in due il mondo del motore è uno solo (chi ospita è `io`, in basso; l'ospite è `nem`, in
// alto), e due mondi specchiati non restano uguali (docs/arena/multigiocatore.md). Ma l'ospite deve vedersi in basso, in blu:
// per lui la scena riceve una copia del mondo con i lati scambiati e le y rovesciate. Il motore, le regole e i comandi
// restano quelli di sempre; cambia solo quello che si disegna.
import { CAMPO } from '../dati/regole.js'

const altro = lato => (lato === 'io' ? 'nem' : 'io')
const specchi = new WeakMap()          // ogni cosa del mondo ha la sua copia, sempre la stessa: la scena la riconosce (la caserma che spunta)

function specchia(e) {
  let m = specchi.get(e)
  if (!m) specchi.set(e, m = {})
  Object.assign(m, e)
  m.lato = altro(e.lato)
  m.y = CAMPO.H - e.y
  return m
}

/* quello che la scena legge di una partita, visto da `mio`: per chi è `io` è la partita stessa */
export function vistaDa(p, mio) {
  if (mio === 'io') return p
  const v = {
    t: p.t, resto: p.resto, fine: p.fine,
    castelli: p.castelli.map(specchia), caserme: p.caserme.map(specchia), miniere: p.miniere.map(specchia),
    muri: p.muri.map(specchia), unita: p.unita.map(specchia),
  }
  v.castello = lato => v.castelli.find(c => c.lato === lato)
  return v
}

/* gli eventi del motore (colpi, crolli, bombe…) con lo stesso specchio */
export function eventiDa(eventi, mio) {
  if (mio === 'io') return eventi
  return eventi.map(e => {
    const m = { ...e }
    if (e.lato) m.lato = altro(e.lato)
    for (const k of ['y', 'y1', 'y2']) if (typeof e[k] === 'number') m[k] = CAMPO.H - e[k]
    return m
  })
}
