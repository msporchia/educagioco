// Il banco del contadino: quanto sparisce il contadino dell'amico nella fattoria in comune (docs/fattoria3d/in-comune.md, «La linea
// del contadino»). Due telefoni finti (test/aiuto/contadini-finti.mjs) che giocano senza smettere, sulla rete finta e cattiva degli
// scenari di banco-rete.mjs, col seme: ogni assenza è un contadino sparito a torto. `--lento` lascia il filo al battito di quando non
// si gioca e fa sparire il contadino dopo sei secondi: com'era prima, per il confronto.
//   node strumenti/banco-contadino.mjs                       tutti gli scenari, 12 partite da 30 minuti
//   node strumenti/banco-contadino.mjs --scenario agitata --partite 40 --seme 7 --minuti 10 --lento
import { dueContadini } from '../test/aiuto/contadini-finti.mjs'
import { SCENARI } from '../test/aiuto/sfida-finta.mjs'

const arg = (nome, base) => { const i = process.argv.indexOf(`--${nome}`); return i > 0 ? process.argv[i + 1] : base }
const partite = Number(arg('partite', 12)), seme = Number(arg('seme', 1)), minuti = Number(arg('minuti', 30))
const inGioco = !process.argv.includes('--lento')
const scenari = arg('scenario', Object.keys(SCENARI).join(',')).split(',')
const morti = scenari.filter(s => !SCENARI[s])
if (morti.length) { console.error(`scenari che non ci sono: ${morti.join(', ')} (ci sono: ${Object.keys(SCENARI).join(', ')})`); process.exit(1) }

const fra = (r, [a, b]) => a + r() * (b - a)
function partita(s, seme) {
  const { orologio, rete, a, b, r } = dueContadini({ seme, min: s.min, max: s.max, inGioco, ...(inGioco ? {} : { sparisce: 6000 }) })
  const PASSO = 100, perPasso = s.alMinuto / 60000 * PASSO
  for (let t = 0; t < minuti * 60000; t += PASSO) {
    orologio.avanti(PASSO)
    if (r() >= perPasso) continue
    const chi = (r() < 0.5 ? a : b).id, x = r()
    if (x < 0.3) rete.taglia(chi)
    else if (x < 0.5) rete.buco(chi)
    else if (x < 0.75) rete.spegni(chi, fra(r, s.spenta))
    else rete.ferma(chi, fra(r, s.ferma))
  }
  return { assenze: [...a.assenze, ...b.assenze], cadute: a.cadute + b.cadute, rifiutati: rete.conta.rifiutati }
}

const sec = ms => `${(ms / 1000).toFixed(1)} s`
console.log(`${partite} partite per scenario da ${minuti} minuti, seme da ${seme}, filo ${inGioco ? 'che batte svelto' : 'al battito lento (com\'era)'}\n`)
console.log('scenario   sparito all\'ora  quante volte  media   la più lunga  cadute all\'ora  chiusi dal servizio')
for (const nome of scenari) {
  const tutte = []; let cadute = 0, rifiutati = 0
  for (let i = 0; i < partite; i++) { const p = partita(SCENARI[nome], seme + i); tutte.push(...p.assenze); cadute += p.cadute; rifiutati += p.rifiutati }
  const ore = partite * minuti / 60 * 2, somma = tutte.reduce((s, x) => s + x, 0)      // due bambini che guardano
  console.log(`${nome.padEnd(10)} ${sec(somma / ore).padStart(15)}  ${(tutte.length / ore).toFixed(1).padStart(12)}  ${sec(tutte.length ? somma / tutte.length : 0).padStart(6)}  ${sec(Math.max(0, ...tutte)).padStart(12)}  ${(cadute / ore).toFixed(1).padStart(14)}  ${String(rifiutati).padStart(19)}`)
}
console.log('\n«sparito all\'ora»: per quanto, in un\'ora di gioco, un bambino non vede il contadino dell\'altro che intanto gioca. «chiusi dal servizio»: fili chiusi perché i messaggi sono arrivati tutti insieme.')
