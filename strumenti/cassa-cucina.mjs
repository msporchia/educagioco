/* La cassa della cucina, senza browser: per ogni livello chi fa i conti, il listino e i modi di
   pagare più visti, con le ordinazioni vere. Vedi docs/bancarella/cucina.md.
   node strumenti/cassa-cucina.mjs [--volte 2000] [--livello 20] */
import { CUCINE, ricetteDi, listinoDi } from '../src/data/bancarella-cucine.js'
import { nuovoOrdine, tappaDi, serveTutto } from '../src/data/bancarella.js'

const opzione = nome => { const i = process.argv.indexOf('--' + nome); return i < 0 ? null : Number(process.argv[i + 1]) }
const volte = opzione('volte') ?? 2000, solo = opzione('livello')
const soldi = c => (c % 100 ? (c / 100).toFixed(2).replace('.', ',') : c / 100)

let storti = 0
CUCINE.forEach((camp, k) => {
  if (solo && solo !== k + 1) return
  const ricette = ricetteDi(camp.ricette), visti = new Map()
  for (let i = 0; i < volte; i++) {
    const o = nuovoOrdine(tappaDi(camp, 0), ricette)
    if (!serveTutto(o.pagaCon, o.totale)) storti++
    const riga = `${soldi(o.totale)} ← ${o.pagaCon.map(soldi).join('+')}`
    visti.set(riga, (visti.get(riga) ?? 0) + 1)
  }
  const listino = Object.values(listinoDi(camp)).map(soldi).join(' · ')
  const primi = [...visti].sort((a, b) => b[1] - a[1]).slice(0, 6)
    .map(([riga, n]) => `${riga} (${Math.round(n / volte * 100)}%)`).join('   ')
  console.log(`${String(k + 1).padStart(2)} ${camp.nome} [${camp.conto}, passo ${camp.passo}] listino ${listino}\n   ${visti.size} modi: ${primi}`)
})
console.log(storti ? `ATTENZIONE: ${storti} pagamenti con un pezzo di troppo` : 'Nessun pezzo di troppo.')
process.exitCode = storti ? 1 : 0
