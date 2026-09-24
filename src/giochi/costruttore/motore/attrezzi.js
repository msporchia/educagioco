/* ═══════════════════════════════════════════════════════════════════
   GLI ATTREZZI NEL PROGRAMMA — messi da chi gioca, non dal bambino

   Gli attrezzi di un livello (`attrezzi`, scritti con le fabbriche di
   `dati/attrezzi.js`) entrano nel programma come progetti chiusi: il
   bambino li chiama e li legge, l'esecutore li esegue come tutti gli
   altri, e nessuno li salva come roba sua. Li rimette qui chi apre un
   livello, chi prova un ordine e chi scrive un aiuto — sempre dalla
   fabbrica, così un attrezzo corretto domani è corretto anche nei
   programmi salvati ieri, e uno rimasto da una versione vecchia del
   livello se ne va da solo.

   Un progetto del bambino con lo stesso id di un attrezzo lascia il
   posto all'attrezzo: è il caso dei progetti che una volta i livelli
   regalavano aperti (`regalo`), e che adesso sono attrezzi.
   ═══════════════════════════════════════════════════════════════════ */
import { copia, numera } from '../dati/scrivi.js'

export function conAttrezzi(prog, livello) {
  const dati = (livello && livello.attrezzi) || []
  const ids = new Set(dati.map(a => a.id))
  const suoi = ((prog && prog.progetti) || []).filter(p => !p.attrezzo && !ids.has(p.id))
  const attrezzi = copia(dati).map(a => ({ ...a, attrezzo: true, corpo: senzaId(a.corpo) }))
  return numera({ ...copia(prog || {}), principale: copia((prog && prog.principale) || []),
                  progetti: [...attrezzi, ...copia(suoi)], lavagnette: [...((prog && prog.lavagnette) || [])] })
}

/* le righe di un attrezzo prendono id nuovi a ogni giro: sono sue, e
   non devono mai coincidere con quelle del bambino */
const senzaId = fila => (fila || []).map(i => {
  const q = { ...i }
  delete q.id
  for (const r of ['corpo', 'allora', 'altrimenti']) if (Array.isArray(q[r])) q[r] = senzaId(q[r])
  return q
})

export const attrezziDi = prog => ((prog && prog.progetti) || []).filter(p => p.attrezzo)
export const progettiSuoi = prog => ((prog && prog.progetti) || []).filter(p => !p.attrezzo)
