/* Le tappe del guerriero misurate: la strada più corta con la corona e senza,
   che cosa usa, se la regola del gradino serve e dove finiscono le trappole.
   Serve a scrivere un livello (vedi docs/passo-passo/guerriero.md).

     node strumenti/passo-passo/guerriero.mjs            tutte
     node strumenti/passo-passo/guerriero.mjs grata      quelle col nome che contiene… */
import { CAMPAGNA, SCALINI, delGuerriero } from '../../src/giochi/passo-passo/dati/campagna.js'
import { Livello } from '../../src/giochi/passo-passo/motore/livello.js'
import { esegui } from '../../src/giochi/passo-passo/motore/mondo.js'
import { misura, serveLaRegola } from '../../src/giochi/passo-passo/motore/risolutore.js'
import { carteDi } from '../../src/giochi/passo-passo/dati/carte.js'

const FRECCE = { su: '↑', giu: '↓', sinistra: '←', destra: '→',
                 'salto-su': '⇑', 'salto-giu': '⇓', 'salto-sinistra': '⇐', 'salto-destra': '⇒' }
/* quello che fa di una tappa una tappa del guerriero: se la soluzione non ne tocca nessuno, è un'altra strada travestita */
const CONTANO = ['spada', 'duello', 'colpito', 'pulsante']
const filtri = process.argv.slice(2)
for (const t of CAMPAGNA.filter(delGuerriero)) {
  if (filtri.length && !filtri.some(f => t.chiave.includes(f))) continue
  const liv = Livello.da(t)
  const m = misura(liv)
  const s = SCALINI.find(x => x.chiave === t.scalino)
  const usa = Object.entries(m.usa).filter(([k, n]) => n && k !== 'passo').map(([k, n]) => `${k} ${n}`).join(', ')
  const regole = t.zaino ? [] : t.regole || [s.regola].map(r => `${r} ${serveLaRegola(liv, r) ? 'serve' : 'NON SERVE'}`).join(', ')
  console.log(`${t.chiave}: ${m.lunga ?? 'NON SI VINCE'} frecce (senza corona ${m.corta}), ${usa || 'niente'}; ${regole}`)
  if (m.conCarota) console.log('   ' + m.conCarota.map(x => FRECCE[x]).join(' '))
  for (const [nome, l] of [['soluzione', t.soluzioni || []], ['fragile', t.fragili || []]]) for (const f of l) {
    const r = esegui(liv, f)
    const conta = {}
    for (const e of r.passi.flatMap(p => p.eventi || [])) if (CONTANO.includes(e.che)) conta[e.che] = (conta[e.che] || 0) + 1
    const fatti = Object.entries(conta).map(([k, n]) => `${k} ${n}`).join(', ') || 'NIENTE del guerriero'
    console.log(`   ${nome} (${carteDi(f)} carte, zaino ${t.zaino}): ${r.esito}${r.carota ? ' con la corona' : ''} dopo ${r.passi.length} passi; ${fatti}`)
  }
  for (const f of t.trappole || []) {
    const r = esegui(liv, f, { eventi: false })
    console.log(`   trappola ${f.map(x => FRECCE[x]).join(' ')}: ${r.esito} al passo ${r.passi.length}`)
  }
}
