// Il grado di «imparato» di una tappa, da 0 a 10: la media della forza
// efficace delle sue voci (parole, frasi, forma), ognuna contata fino alla
// soglia di «imparato». Non si tiene a mano: cala da solo come cala la
// forza (store/srs.js, `strength`). Vedi docs/lingue/mondi.md.
import { SRS } from '../../../store/srs.js'
import { vociDi, PREFISSO_FRASE } from './grafo.js'
import { PREFISSO_FORMA } from '../dati/forme.js'
import { formatoPerForza } from './formati.js'
import { livelloDaForza } from '../../../data/domande.js'

export const GRADO_MAX = 10

export function grado(chiavi, forzaDi) {
  if (!chiavi.length) return 0
  const somma = chiavi.reduce((n, k) => n + Math.min(SRS.masterS, Math.max(0, forzaDi(k))) / SRS.masterS, 0)
  return Math.floor(GRADO_MAX * somma / chiavi.length + 1e-9)
}

export const gradoTappa = (tappa, forzaDi) => grado(vociDi(tappa), forzaDi)

const genere = k => (k.startsWith(PREFISSO_FRASE) ? 'frase' : k.startsWith(PREFISSO_FORMA) ? 'forma' : 'parola')

// Da dove si riprende: le voci che si chiedono (la forma no, si segna con
// le frasi), dalla più debole; a pari forza le parole prima delle frasi
// che le usano. Ognuna col formato che la sua forza le dà.
export function ripresa(tappa, forzaDi) {
  const voci = vociDi(tappa).filter(k => genere(k) !== 'forma').map(chiave => {
    const forza = forzaDi(chiave)
    const g = genere(chiave)
    return { chiave, genere: g, forza,
             formato: g === 'frase' ? formatoPerForza(forza) : ['vedi', 'capisci', 'produci'][livelloDaForza(forza)] }
  })
  voci.sort((a, b) => (a.forza - b.forza) || ((a.genere === 'frase') - (b.genere === 'frase')))
  return { grado: gradoTappa(tappa, forzaDi), voci }
}
