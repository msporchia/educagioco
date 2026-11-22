/* Le frasi di English ed Español col giro pieno di guastiDelleFrasi: ogni
   frase in ogni formato su sei semi. Nelle unità (inglese-mondi,
   spagnolo-mondi) la stessa prova gira su due semi. Vedi docs/lingue/.
   perché: ogni frase componibile di English ed Español in ogni formato su sei semi, con `guastiDelleFrasi` e nessun guasto
   a parte perché: le unità inglese-mondi e spagnolo-mondi fanno la stessa prova su due semi soli, a ogni commit; qui il giro pieno costa troppo per stare in CI. POTREBBE essere un'opzione delle unità
   `node test/esegui.mjs misure/lingue-frasi --niente-build` */
import { controlla, riassunto } from '../aiuto/verifica.mjs'
import { guastiDelleFrasi as inglese } from '../../src/giochi/inglese/motore/guasti.js'
import { guastiDelleFrasi as spagnolo } from '../../src/giochi/spagnolo/motore/guasti.js'

const nessuno = (cosa, guasti) => controlla(cosa, guasti.length === 0, guasti.slice(0, 12).join(' · '))
nessuno('inglese: tutte le frasi componibili', inglese())
nessuno('spagnolo: tutte le frasi componibili', spagnolo())

riassunto('le frasi delle lingue, sei semi')
