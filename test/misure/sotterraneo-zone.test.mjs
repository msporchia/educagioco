/* Le zone giocate: una zona verde vinta, dal fondo della fascia, vale più o meno un livello (docs/sotterraneo/zone.md). Le regole
   delle zone: `unita/sotterraneo-zone`.
   perché: le zone giocate: una zona verde vinta dal fondo della fascia vale più o meno un livello (14, 24, 34), con la roba e la crescita attese
   a parte perché: le regole delle zone sono in unita/sotterraneo-zone; qui il costo in livelli, giocando. POTREBBE stare dentro sotterraneo-strade o sotterraneo, che usano lo stesso banco
   `node test/esegui.mjs misure/sotterraneo-zone --niente-build` */
import { CAMPAGNA } from '../../src/giochi/sotterraneo/dati/campagna.js'
import { zonaPotenziata } from '../../src/giochi/sotterraneo/dati/zone.js'
import { robaAttesaA, crescitaAttesaA } from '../../src/giochi/sotterraneo/motore/zone.js'
import { sogliaDi } from '../../src/giochi/sotterraneo/dati/livelli.js'
import { gioca } from '../../src/giochi/sotterraneo/motore/banco.js'
import { stileDi } from '../../src/giochi/sotterraneo/dati/giocatori-tipo.js'
import { controlla, riassunto } from '../aiuto/verifica.mjs'

const indiceDi = k => CAMPAGNA.findIndex(t => t.chiave === k)
const salto = n => sogliaDi(n + 1) - sogliaDi(n)

{
  // il passo: una zona verde vinta, dal fondo della fascia, vale più o meno un livello (le misure su tutte le zone)
  for (const L of [14, 24, 34]) {
    const k = indiceDi('torre')
    const cr = crescitaAttesaA('cavaliere', L)
    // fra otto semi quelli vinti (coi branchi nuovi un seme solo può perdere: il passo si legge dove si vince)
    const vinte = []
    for (let seme = 41; seme < 49; seme++) {
      const g = gioca(zonaPotenziata(k, L), { seme, bravura: 1, eroe: 'cavaliere', crescita: cr, roba: robaAttesaA('cavaliere', L), stile: stileDi('curioso') })   // beve nello scontro come il curioso: il banco nudo non passa più i comuni da due risposte
      if (g.esito.vinta) vinte.push((g.corsa.crescita.esp - cr.esp) / salto(L))
    }
    const livelli = vinte.reduce((n, x) => n + x, 0) / Math.max(1, vinte.length)
    controlla(`una torre verde vinta al ${L} vale più o meno un livello`, vinte.length >= 2 && livelli >= 0.7 && livelli <= 2,
              `${vinte.length} vinte su 8, ${livelli.toFixed(2)} livelli`)
  }
}

riassunto('le zone giocate')
