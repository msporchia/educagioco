/* Le domande di ogni gioco (`data/domande-dei-giochi.js`): chi ha `quiz: true` nel manifesto deve essere nominato, e le righe
   devono dire una delle forme ammesse. Docs: docs/genitori/giochi.md. */
import { DOMANDE, pescaDaTutte, moduliDi } from '../../src/data/domande-dei-giochi.js'
import { GIOCHI } from '../../src/data/giochi.js'
import { controlla, uguale, riassunto } from '../aiuto/verifica.mjs'

const chiavi = new Set(GIOCHI.map(g => g.chiave))
const senzaRiga = GIOCHI.filter(g => g.quiz && !DOMANDE[g.chiave]).map(g => g.chiave)
controlla('ogni gioco con `quiz: true` dice da dove pesca le domande', senzaRiga.length === 0, senzaRiga.join(', '))
const sconosciuti = Object.keys(DOMANDE).filter(k => !chiavi.has(k))
controlla('e nessuna riga è di un gioco che non c\'è', sconosciuti.length === 0, sconosciuti.join(', '))
for (const [k, v] of Object.entries(DOMANDE)) {
  controlla(`${k}: o pesca da tutte, o da moduli nominati`, v === 'tutte' || (Array.isArray(v.moduli) && v.moduli.length > 0 && v.moduli.every(m => typeof m === 'string')))
}
controlla('chi pesca dal mazzo intero lo dice', pescaDaTutte('sotterraneo') && pescaDaTutte('survivors') && !pescaDaTutte('arena'))
uguale('i moduli di Castle Battle', moduliDi('arena').join(), 'conti')
uguale('un gioco senza riga non ha moduli', moduliDi('fattoria').length, 0)
riassunto('le domande dei giochi')
