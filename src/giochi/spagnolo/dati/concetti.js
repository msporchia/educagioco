// I concetti di ogni struttura (dati/forme.js): la pagina che li presenta la
// prima volta e torna dopo cinque sbagli sullo stesso concetto. Da riempire:
// una forma → [{ id: '<forma>:<nome>', titolo, spiega, esempi: [[es, it], …],
// prende?: ({ es, domanda }) => bool }], con l'id che comincia con la forma,
// due esempi almeno e almeno uno con [quadre] attorno a quello che cambia
// («[una] vaca»). Il formato e i controlli: docs/lingue/concetti.md e
// motore/concetti.js (`guastiDeiConcetti`).
import PRIMA from './concetti/prima.js'
import SECONDA from './concetti/seconda.js'
import TERZA from './concetti/terza.js'
import QUARTA from './concetti/quarta.js'
import QUINTA from './concetti/quinta.js'
import SESTA from './concetti/sesta.js'

// un file per mondo in concetti/: ogni agente e ogni mano tocca il suo
export const CONCETTI = Object.assign({}, PRIMA, SECONDA, TERZA, QUARTA, QUINTA, SESTA)
