// Vedi docs/costruttore/progetti.md. Un progetto del bambino con lo stesso id di un attrezzo lascia il posto all'attrezzo.
import { copia, numera } from '../dati/scrivi.js'

export function conAttrezzi(prog, livello) {
  const dati = (livello && livello.attrezzi) || []
  const ids = new Set(dati.map(a => a.id))
  const suoi = ((prog && prog.progetti) || []).filter(p => !p.attrezzo && !ids.has(p.id))
  const attrezzi = copia(dati).map(a => ({ ...a, attrezzo: true, corpo: senzaId(a.corpo) }))
  return numera({ ...copia(prog || {}), principale: copia((prog && prog.principale) || []),
                  progetti: [...attrezzi, ...copia(suoi)], lavagnette: [...((prog && prog.lavagnette) || [])] })
}

// Le righe di un attrezzo prendono id nuovi a ogni giro: non devono mai coincidere con quelle del bambino.
const senzaId = fila => (fila || []).map(i => {
  const q = { ...i }
  delete q.id
  for (const r of ['corpo', 'allora', 'altrimenti']) if (Array.isArray(q[r])) q[r] = senzaId(q[r])
  return q
})

export const attrezziDi = prog => ((prog && prog.progetti) || []).filter(p => p.attrezzo)
export const progettiSuoi = prog => ((prog && prog.progetti) || []).filter(p => !p.attrezzo)
