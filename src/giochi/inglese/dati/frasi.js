// Tutte le frasi componibili, un file per mondo in dati/frasi/. Un mondo
// nuovo è un file lì più una riga qui: test/unita/inglese-mondi è rosso se
// un file della cartella manca da questo elenco.
import CHE_COSE from './frasi/che-cose.js'
import MIE_COSE from './frasi/mie-cose.js'

export const FILE_DELLE_FRASI = [CHE_COSE, MIE_COSE]

export const FRASI = FILE_DELLE_FRASI.flatMap(f => f.frasi.map(x => ({ ...x, mondo: f.mondo })))

export const fraseDi = id => FRASI.find(f => f.id === id) || null
