// Le matrici delle figure (docs/sotterraneo/prestazioni-3d.md, «Le matrici»): eroe, mostri e persone se le rifanno da sé dopo averle
// animate (`rifai`), e solo quando si vedono; la scena, che a ogni disegno le ripassa tutte, le salta (`daSola`). Prima le figure si
// rifacevano due volte, e quelle di scorta, nascoste, una volta a fotogramma per niente.
// Provato `matrixWorldAutoUpdate = false`: in three ferma anche la matrice della figura stessa, e finiscono tutte nell'origine.
import { Object3D } from 'three'

const aggiorna = Object3D.prototype.updateMatrixWorld
const niente = () => {}

/** La radice di una figura: la scena non la ripassa più. */
export function daSola(radice) { radice.updateMatrixWorld = niente; return radice }

/** Le matrici della figura e dei suoi figli, adesso. */
export const rifai = radice => aggiorna.call(radice, true)
