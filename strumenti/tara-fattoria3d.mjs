// Misura la fattoria 3D sul metro di docs/apprendimento/calibrazione.md (🪙1 = 10 s di esercizio, 🪙6 al minuto): per
// ogni livello le monete spese in tutto, i minuti di esercizio equivalenti, cosa si apre e l'attesa più lunga in catena
// (maturazione + cottura veri, campi e bestie in parallelo, una macchina alla volta); poi i controlli di scala.
// Non scrive niente: legge i dati veri. La logica sta in motore/taratura.js. Vedi docs/fattoria3d/livelli.md.
//   npm run tara:fattoria3d
import { PEZZI, EDIFICI } from '../src/giochi/fattoria3d/dati/catalogo.js'
import { COLTURE } from '../src/giochi/fattoria3d/dati/colture.js'
import { RICETTE } from '../src/giochi/fattoria3d/dati/ricette.js'
import { PRODOTTI_ANIMALI } from '../src/giochi/fattoria3d/dati/animali.js'
import { sogliaDi } from '../src/giochi/fattoria3d/dati/livelli.js'
import { MONETE_AL_MINUTO, premioDi, tettoDi } from '../src/giochi/fattoria3d/dati/ordini.js'
import { catenaMs, tabellaLivelli, guastiDellaScala } from '../src/giochi/fattoria3d/motore/taratura.js'

const f1 = n => (Math.round(n * 10) / 10).toString()
const sec = ms => `${Math.round(ms / 1000)}s`

console.log('livello | monete spese in tutto | minuti di esercizio | salto | attesa più lunga | cosa si apre')
for (const x of tabellaLivelli()) {
  const apre = [...x.pezzi.map(p => `${p.nome} 🪙${p.prezzo}`), ...x.colture.map(c => `${c.nome} ${sec(c.ms)}`), ...x.ricette.map(c => `${c.nome} ${sec(c.ms)}`)]
  console.log(`${String(x.l).padStart(2)} | ${String(x.soglia).padStart(5)} | ${f1(x.minuti).padStart(6)} min | +${f1(x.salto / MONETE_AL_MINUTO)} min | ${sec(x.lenta).padStart(5)} | ${apre.join(', ')}`)
}

console.log('\nprezzi, minuti di esercizio e quota del salto del livello di arrivo:')
for (const [t, c] of [...Object.entries(PEZZI), ...Object.entries(EDIFICI)].sort((a, b) => a[1].liv - b[1].liv))
  console.log(`  liv ${String(c.liv).padStart(2)}  ${t.padEnd(16)} 🪙${String(c.prezzo).padStart(3)}  ${f1(c.prezzo / MONETE_AL_MINUTO)} min  (${Math.round(100 * c.prezzo / (sogliaDi(c.liv + 1) - sogliaDi(c.liv)))}% del salto)`)

console.log('\nattese in catena per cosa chiesta, e il premio di un ordine con una sola:')
for (const k of [...Object.keys(COLTURE), ...Object.keys(PRODOTTI_ANIMALI), ...Object.keys(RICETTE)]) {
  const o = { [k]: 1 }
  const premio = RICETTE[k] ? `  premio ${premioDi(o)} ⭐ (tetto ${f1(tettoDi(o))})` : ''
  console.log(`  ${k.padEnd(16)} ${sec(catenaMs(k)).padStart(5)}${premio}`)
}

const g = guastiDellaScala()
console.log(g.length ? '\nDA VEDERE:\n  ' + g.join('\n  ') : '\nNessun controllo di scala rosso.')
process.exitCode = g.length ? 1 : 0
