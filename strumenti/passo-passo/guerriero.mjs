/* Le tappe del guerriero misurate: la strada più corta con la corona e senza,
   che cosa usa, se la regola del gradino serve e dove finiscono le trappole.
   Serve a scrivere un livello (vedi docs/passo-passo/guerriero.md).

     node strumenti/passo-passo/guerriero.mjs            tutte
     node strumenti/passo-passo/guerriero.mjs grata      quelle col nome che contiene… */
import { CAMPAGNA, SCALINI, delGuerriero } from '../../src/giochi/passo-passo/dati/campagna.js'
import { Livello } from '../../src/giochi/passo-passo/motore/livello.js'
import { esegui } from '../../src/giochi/passo-passo/motore/mondo.js'
import { misura, serveLaRegola } from '../../src/giochi/passo-passo/motore/risolutore.js'

const FRECCE = { su: '↑', giu: '↓', sinistra: '←', destra: '→',
                 'salto-su': '⇑', 'salto-giu': '⇓', 'salto-sinistra': '⇐', 'salto-destra': '⇒' }
const filtri = process.argv.slice(2)
for (const t of CAMPAGNA.filter(delGuerriero)) {
  if (filtri.length && !filtri.some(f => t.chiave.includes(f))) continue
  const liv = Livello.da(t)
  const m = misura(liv)
  const s = SCALINI.find(x => x.chiave === t.scalino)
  const usa = Object.entries(m.usa).filter(([k, n]) => n && k !== 'passo').map(([k, n]) => `${k} ${n}`).join(', ')
  const regole = [s.regola, ...(t.regole || [])].filter(Boolean).map(r => `${r} ${serveLaRegola(liv, r) ? 'serve' : 'NON SERVE'}`).join(', ')
  console.log(`${t.chiave}: ${m.lunga ?? 'NON SI VINCE'} frecce (senza corona ${m.corta}), ${usa || 'niente'}; ${regole}`)
  if (m.conCarota) console.log('   ' + m.conCarota.map(x => FRECCE[x]).join(' '))
  for (const f of t.trappole || []) {
    const r = esegui(liv, f, { eventi: false })
    console.log(`   trappola ${f.map(x => FRECCE[x]).join(' ')}: ${r.esito} al passo ${r.passi.length}`)
  }
}
