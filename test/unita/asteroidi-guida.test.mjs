/* La guida degli Asteroidi (docs/core/come-si-gioca.md): il passo dal quadro, puro. Un sasso giusto colpito davvero; il segno
   va su tutti i sassi, mai solo sul giusto (la guida non dice la risposta); a scuola parla di frecce e Invio.
   `node test/esegui.mjs asteroidi-guida`
   tempo: 1 */
import { guidaDegliAsteroidi, BERSAGLI } from '../../src/motore/asteroidi/guida.js'
import { controlla, uguale, riassunto } from '../aiuto/verifica.mjs'

const primo = guidaDegliAsteroidi({})
uguale('all\'inizio l\'anello è sulla domanda', primo.dove, BERSAGLI.domanda)
controlla('e i sassi hanno il segno, tutti (il quadro non sa nemmeno qual è il giusto)', primo.sassi === true)
controlla('col dito dice di toccare', /tocca/.test(primo.testo) && !/Invio/.test(primo.testo))
controlla('con la tastiera dice le frecce e Invio', /← →/.test(guidaDegliAsteroidi({ tastiera: true }).testo) && /Invio/.test(guidaDegliAsteroidi({ tastiera: true }).testo))
controlla('dopo uno sbagliato dice che il numero era un altro', /altro numero/.test(guidaDegliAsteroidi({ sbagliata: true }).testo))
const fine = guidaDegliAsteroidi({ giusta: true, sbagliata: true })
controlla('un giusto colpito: la riga finale, senza anello né segno', fine.fine === true && fine.dove === null && !fine.sassi)
controlla('ogni riga è corta', [{}, { tastiera: true }, { sbagliata: true, tastiera: true }, { giusta: true }].every(q => guidaDegliAsteroidi(q).testo.length <= 90))

riassunto('la guida degli Asteroidi')
