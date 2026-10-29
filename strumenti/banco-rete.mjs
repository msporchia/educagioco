// Il banco della rete: quanto regge la sfida in due (docs/core/insieme.md, «Tarare la tolleranza»). Gioca partite intere di un
// gioco in due (di difetto Castle Battle) fra due telefoni finti su una rete finta e cattiva, col seme (test/aiuto/sfida-finta.mjs):
// stessi argomenti, stessa tabella. Una riga per scenario: quante partite arrivano in fondo, quante si rompono e perché, quanto
// si resta fermi. I giochi che sanno giocare da soli stanno in test/aiuto/sfide/.
//   node strumenti/banco-rete.mjs                        tutti gli scenari, 12 partite ciascuno
//   node strumenti/banco-rete.mjs --gioco arena --scenario melody --partite 40 --seme 7
//   node strumenti/banco-rete.mjs --tempi grazia=60000,sordo=4000     i tempi del canale da provare (src/insieme/rete.js TEMPI)
import { partitaInDue, SCENARI } from '../test/aiuto/sfida-finta.mjs'
import { GIOCHI_IN_DUE } from '../test/aiuto/sfide/index.mjs'

const arg = (nome, base) => { const i = process.argv.indexOf(`--${nome}`); return i > 0 ? process.argv[i + 1] : base }
const partite = Number(arg('partite', 12)), seme = Number(arg('seme', 1)), minuti = Number(arg('minuti', 30))
const scenari = arg('scenario', Object.keys(SCENARI).join(',')).split(',')
const tempi = Object.fromEntries((arg('tempi', '') || '').split(',').filter(Boolean).map(x => { const [k, v] = x.split('='); return [k, Number(v)] }))
const gioco = GIOCHI_IN_DUE[arg('gioco', 'arena')]
if (!gioco) { console.error(`gioco che non c'è: ${arg('gioco')} (ci sono: ${Object.keys(GIOCHI_IN_DUE).join(', ')})`); process.exit(1) }
const morti = scenari.filter(s => !SCENARI[s])
if (morti.length) { console.error(`scenari che non ci sono: ${morti.join(', ')} (ci sono: ${Object.keys(SCENARI).join(', ')})`); process.exit(1) }

const pct = (a, b) => `${b ? Math.round(100 * a / b) : 0}%`.padStart(4)
const sec = ms => `${(ms / 1000).toFixed(1)} s`
console.log(`${partite} partite per scenario, seme da ${seme}, al massimo ${minuti} minuti ciascuna${Object.keys(tempi).length ? `, tempi ${JSON.stringify(tempi)}` : ''}\n`)
console.log('scenario   in fondo  in gioco  rotte  perché            guasti/partita  cartello linea (media, max)  fermi ad aspettare  cadute  rimandati  riallineamenti  chiusi dal servizio')
for (const nome of scenari) {
  let fondo = 0, inGioco = 0, rotte = 0, guasti = 0, linea = 0, lineaMax = 0, fermi = 0, cadute = 0, rimandati = 0, riall = 0, rifiutati = 0, giocati = 0
  const perche = {}
  for (let i = 0; i < partite; i++) {
    const p = partitaInDue({ gioco, seme: seme + i, scenario: SCENARI[nome], minuti, tempi })
    const rotta = [p.host, p.ospite].find(x => x.stato === 'rotta')
    if (rotta) { rotte++; perche[rotta.perche] = (perche[rotta.perche] || 0) + 1 }
    else if (p.host.motore?.fine() && p.host.motore.fine() === p.ospite.motore?.fine()) fondo++
    else inGioco++
    guasti += Object.values(p.guasti).reduce((s, x) => s + x, 0)
    const l = Math.max(p.conLinea.host, p.conLinea.ospite)
    linea += l; lineaMax = Math.max(lineaMax, l)
    fermi += (p.host.lockstep?.aspettati || 0) * 1000
    giocati += (p.host.lockstep ? p.host.lockstep.k * p.host.motore.passo : 0) * 1000
    cadute += p.host.canale.diario.cadute + p.ospite.canale.diario.cadute
    rimandati += p.host.canale.diario.rimandati + p.ospite.canale.diario.rimandati
    riall += p.host.lockstep?.riallineamenti || 0
    rifiutati += p.rete.conta.rifiutati
  }
  const n = partite
  console.log(`${nome.padEnd(10)} ${pct(fondo, n).padStart(8)}  ${pct(inGioco, n).padStart(8)}  ${pct(rotte, n).padStart(5)}  ${(Object.entries(perche).map(([k, v]) => `${k} ${v}`).join(', ') || '—').padEnd(17)} ` +
              `${(guasti / n).toFixed(1).padStart(14)}  ${(sec(linea / n) + ', ' + sec(lineaMax)).padStart(27)}  ${(sec(fermi / n) + ' (' + pct(fermi, giocati + fermi).trim() + ')').padStart(18)}  ` +
              `${(cadute / n).toFixed(1).padStart(6)}  ${(rimandati / n).toFixed(0).padStart(9)}  ${String(riall).padStart(14)}  ${String(rifiutati).padStart(19)}`)
}
console.log('\n«in fondo»: un castello è caduto e le due copie dicono la stessa cosa; «in gioco»: allo scadere dei minuti si giocava ancora. «cartello linea»: quanto un bambino ha visto «ha perso la linea».')
