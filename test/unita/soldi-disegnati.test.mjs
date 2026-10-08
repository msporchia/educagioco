/* ═══════════════════════════════════════════════════════════════════
   I SOLDI IN MANO, COME ALLA BANCARELLA

   «Hai in mano questi soldi: quanto fanno in tutto?» disegnava cerchi e
   rettangoli piatti, ammassati in una griglia da tre; i soldi della
   bancarella (colori veri, 1 € e 2 € bimetallici, banconote con la
   finestra) erano un altro disegno. Adesso è uno solo (`grafica/soldi.js`,
   `components/Soldo.vue`) e il mazzo si posa in file: prima le banconote,
   poi le monete da euro, poi i centesimi, dal valore più alto, i pezzi
   uguali attaccati. Qui si prova che l'ordine è quello e che non si perde
   né si inventa un pezzo; che non si sovrappongano a 320 e 390 px lo
   vede solo il browser (`integrazione/soldi`).
   ═══════════════════════════════════════════════════════════════════ */
import { controlla, uguale, stessaLista, riassunto } from '../aiuto/verifica.mjs'
import { soldoDi, fileDeiSoldi, pezziDelMazzo, descrizioneDeiSoldi } from '../../src/grafica/soldi.js'
import { guastiDi } from '../../src/quiz/nucleo/domanda.js'
import { Sorte } from '../../src/quiz/nucleo/sorte.js'
import soldi from '../../src/quiz/moduli/soldi.js'

/* ══════════ 1. LA FACCIA DI OGNI TAGLIO ══════════ */

const facce = [[1, 'rame', 1, 'c'], [5, 'rame', 5, 'c'], [10, 'oro', 10, 'c'], [50, 'oro', 50, 'c'],
               [100, 'uno', 1, '€'], [200, 'due', 2, '€'],
               [500, 'carta b5', 5, '€'], [1000, 'carta b10', 10, '€'], [2000, 'carta b20', 20, '€'],
               [5000, 'carta b50', 50, '€']]
for (const [c, classe, faccia, unita] of facce) {
  const s = soldoDi(c)
  controlla(`${c} centesimi: ${classe}, «${faccia}${unita}»`,
            s.classe === classe && s.faccia === faccia && s.unita === unita, JSON.stringify(s))
}
controlla('solo dalle cinque in su è una banconota', !soldoDi(200).carta && soldoDi(500).carta)

/* ══════════ 2. LE FILE ══════════ */

const mazzo = [50, 500, 1, 200, 50, 1000, 100, 5, 500, 200].map(cents => ({ cents }))
const file = fileDeiSoldi(mazzo)
stessaLista('tre file, nell\'ordine banconote, monete, centesimi', file.map(f => f.nome), ['carte', 'monete', 'centesimi'])
stessaLista('le banconote, dalla più alta', file[0].soldi.map(s => s.cents), [1000, 500, 500])
stessaLista('le monete da euro, dalla più alta', file[1].soldi.map(s => s.cents), [200, 200, 100])
stessaLista('i centesimi, dal più alto', file[2].soldi.map(s => s.cents), [50, 50, 5, 1])
stessaLista('«nuovo» segna il primo di ogni valore, non il primo della fila',
       file[0].soldi.map(s => s.nuovo), [false, true, false])
stessaLista('una fila vuota non c\'è', fileDeiSoldi([{ cents: 500 }, { cents: 20 }]).map(f => f.nome), ['carte', 'centesimi'])
stessaLista('niente soldi, niente file', fileDeiSoldi([]), [])
stessaLista('l\'ordine in cui arrivano non conta', fileDeiSoldi([...mazzo].reverse()).map(f => f.soldi.map(s => s.cents)),
       file.map(f => f.soldi.map(s => s.cents)))
uguale('a voce', descrizioneDeiSoldi([{ cents: 500 }, { cents: 200 }, { cents: 20 }]),
       'banconota da 5 €, moneta da 2 €, moneta da 20 centesimi')

controlla('le scene che non sono soldi non sono un mazzo', pezziDelMazzo({ che: 'linea-numeri' }) === null && pezziDelMazzo(undefined) === null)

/* ══════════ 3. LA DOMANDA VERA ══════════ */

let conScena = 0
for (let seme = 1; seme <= 400; seme++) {
  for (const grado of [1, 2, 3]) {
    const d = soldi.chiedi(grado, new Sorte(seme), [], null, null)
    if (d.chiave !== 'sol:conta') continue
    const pezzi = pezziDelMazzo(d.soggetto?.scena)
    if (!pezzi) continue
    conScena++
    const fatte = fileDeiSoldi(pezzi)
    const tutti = fatte.flatMap(f => f.soldi.map(s => s.cents))
    const ordine = fatte.map(f => f.nome)
    const giusto = JSON.stringify(ordine) === JSON.stringify(['carte', 'monete', 'centesimi'].filter(n => ordine.includes(n)))
    const discesa = fatte.every(f => f.soldi.every((s, i) => i === 0 || f.soldi[i - 1].cents >= s.cents))
    const stessi = JSON.stringify([...tutti].sort((a, b) => a - b)) === JSON.stringify(pezzi.map(p => p.cents).sort((a, b) => a - b))
    if (!(giusto && discesa && stessi))
      controlla(`il mazzo del seme ${seme}, grado ${grado}, si posa in ordine e senza perdere pezzi`, false,
                JSON.stringify(pezzi.map(p => p.cents)))
    // il totale scritto è la somma di quello che si vede
    const somma = pezzi.reduce((t, p) => t + p.cents, 0)
    const scritto = Math.floor(somma / 100) + (somma % 100 ? ',' + String(somma % 100).padStart(2, '0') : '') + ' €'
    if (d.risposte[d.giusta].testo !== scritto)
      controlla(`la risposta giusta è la somma dei pezzi (seme ${seme})`, false, `${d.risposte[d.giusta].testo} contro ${scritto}`)
    if (guastiDi(d, { pittori: soldi.pittori }).length)
      controlla(`la domanda del seme ${seme} è senza guasti`, false, guastiDi(d, { pittori: soldi.pittori }).join(' · '))
  }
}
controlla('fra quattrocento semi la scena dei soldi esce', conScena > 50, `${conScena} volte`)

riassunto('i soldi in mano, come alla bancarella')
