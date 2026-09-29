// Gli ambienti — l'indice. Undici stanze, undici file. Vedi docs/core/grafica.md
// per lo schema (mura/suolo, campi, tinte, varianti, dettagli).
import { CORTILE } from './cortile.js'
import { CAMMINAMENTO } from './camminamento.js'
import { CORRIDOIO } from './corridoio.js'
import { CRIPTA } from './cripta.js'
import { INGRANAGGI } from './ingranaggi.js'
import { TESORO } from './tesoro.js'
import { GROTTA } from './grotta.js'
import { BOSCO } from './bosco.js'
import { MINIERA } from './miniera.js'
import { TRONO } from './trono.js'
import { FOGNE } from './fogne.js'

// i nomi vecchi si derivano, non si ripetono: chi non passa dalle liste
// (PITTORI_TERRENO, la vetrina) chiede ancora muratura/posa/muro/lastra
const completa = A => {
  const capo = (lista, tinte) => (Array.isArray(lista) && lista[0]) || null
  const m = capo(A.mura), s = capo(A.suolo)
  return {
    ...A,
    muratura: A.muratura || (m && m.che) || 'pietra',
    posa: A.posa || (s && s.che) || 'lastre',
    muro: A.muro || (m && m.tinte) || ['#7a7168', '#4a443e'],
    lastra: A.lastra || (s && s.tinte) || ['#5c5c6b', '#43434f'],
  }
}

export const AMBIENTI = Object.fromEntries(Object.entries({
  cortile: CORTILE, camminamento: CAMMINAMENTO, corridoio: CORRIDOIO,
  cripta: CRIPTA, ingranaggi: INGRANAGGI, tesoro: TESORO,
  grotta: GROTTA, bosco: BOSCO, miniera: MINIERA, trono: TRONO, fogne: FOGNE,
}).map(([k, A]) => [k, completa(A)]))

export const NOMI_AMBIENTI = Object.keys(AMBIENTI)
