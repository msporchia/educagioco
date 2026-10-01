// Tutte le frasi componibili, un file per mondo in dati/frasi/. Un mondo
// nuovo è un file lì più una riga qui: il test dei contenuti è rosso se
// un file della cartella manca da questo elenco.
import PRIMA from './frasi/prima.js'
import SECONDA from './frasi/seconda.js'
import TERZA from './frasi/terza.js'
import QUARTA from './frasi/quarta.js'
import QUINTA from './frasi/quinta.js'
import SESTA from './frasi/sesta.js'

export const FILE_DELLE_FRASI = [PRIMA, SECONDA, TERZA, QUARTA, QUINTA, SESTA]

export const FRASI = FILE_DELLE_FRASI.flatMap(f => f.frasi.map(x => ({ ...x, mondo: f.mondo })))

export const fraseDi = id => FRASI.find(f => f.id === id) || null
