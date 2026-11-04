/* Il catalogo 3D — le voci delle pozioni: gli ingredienti e i personaggi modellati nella creta. Formato e come si aggiunge una voce: docs/core/catalogo-3d.md. */
import { MODELLI } from '../../../src/giochi/pozioni/scena3d/ingredienti3d.js'
import { MODELLI as PERSONAGGI } from '../../../src/giochi/pozioni/scena3d/personaggi3d.js'

export const VOCI = Object.entries(MODELLI).map(([nome, crea]) => ({
  id: `poz:${nome.replace(/ /g, '-')}`, nome, gioco: 'pozioni', categoria: 'prop',
  dove: 'il laboratorio delle pozioni: fotografato, sul rotolo e sul banco', file: `src/giochi/pozioni/scena3d/ingredienti3d.js:${crea.name}`, crea,
})).concat(Object.entries(PERSONAGGI).map(([nome, crea]) => ({
  id: `poz:${nome}`, nome, gioco: 'pozioni', categoria: 'personaggio',
  dove: 'il laboratorio delle pozioni: fotografato, sul banco', file: `src/giochi/pozioni/scena3d/personaggi3d.js:${nome}`, crea,
})))
