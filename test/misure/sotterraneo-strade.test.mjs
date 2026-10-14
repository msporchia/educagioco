/* Le tre strade di ogni classe sotto il banco (docs/sotterraneo/strade.md).
   tempo: 400
   Ogni strada (dati/strade.js) si gioca discesa per discesa con la sua roba, i suoi punti e il suo albero (motore/strade.js), con
   l'eroe cinque livelli sopra quello atteso, dove le strade si distinguono per la roba e per i punti e non per quanto è dura la
   discesa (a livello atteso l'elfa, la più veloce, si stacca di più: docs/sotterraneo/taratura-branchi.md). Il bersaglio: le tre strade di una
   classe stanno vicine (nessuna domina, nessuna crolla); i numeri assoluti li dà la taratura dei mostri.
   `node test/esegui.mjs misure/sotterraneo-strade --niente-build` */
import { CAMPAGNA } from '../../src/giochi/sotterraneo/dati/campagna.js'
import { EROI } from '../../src/giochi/sotterraneo/dati/eroi.js'
import { stradeDi } from '../../src/giochi/sotterraneo/motore/strade.js'
import { misuraLaStrada } from '../../src/giochi/sotterraneo/motore/banco.js'
import { controlla, nota, riassunto } from '../aiuto/verifica.mjs'

const SEMI = 16, PIU = 5, PROVE = [0.8, 0.6]
const SCARTO_AMMESSO = 0.22     // fra la migliore e la peggiore di una classe, in media sulle sette discese
const ALMENO_LA_META = 0.6      // e la peggiore vale almeno questa quota della migliore

for (const e of EROI) {
  const medie = stradeDi(e.chiave).map(s => {
    const per = CAMPAGNA.map((_, k) => misuraLaStrada({ classe: e.chiave, nome: s.chiave, k, prove: PROVE, semi: SEMI, piu: PIU }))
    const quota = j => per.reduce((n, p) => n + p.vinte[j], 0) / (per.length * SEMI)
    const m = { nome: s.chiave, otto: quota(0), sei: quota(1), domande: Math.round(per.reduce((n, p) => n + p.domande, 0) / (per.length * SEMI)) }
    nota(`${e.chiave}:${s.chiave.padEnd(10)} a 8/10 ${Math.round(m.otto * 100)}%, a 6/10 ${Math.round(m.sei * 100)}%, ${m.domande} domande per discesa`)
    return m
  })
  for (const [j, che] of [['otto', '8/10'], ['sei', '6/10']]) {
    const v = medie.map(m => m[j])
    controlla(`${e.chiave}: le tre strade stanno vicine a ${che}`, Math.max(...v) - Math.min(...v) <= SCARTO_AMMESSO,
              medie.map(m => `${m.nome} ${Math.round(m[j] * 100)}%`).join(' · '))
    controlla(`${e.chiave}: nessuna crolla a ${che}`, Math.min(...v) >= ALMENO_LA_META * Math.max(...v),
              medie.map(m => `${m.nome} ${Math.round(m[j] * 100)}%`).join(' · '))
  }
}

riassunto('le strade, a confronto')
