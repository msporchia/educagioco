/* Verifica della stanza degli animali, senza browser: la fame è solo
   aritmetica sul tempo, e il negozio è una serie di guardie sulle monete.
   Il profilo vero vive dentro Vue, quindi qui se ne rifà un gemello
   minimo con le stesse regole di data/pets.js.  `node pets-test.mjs` */
import { PETS, CIBI, FAME, petDi, ciboDi, sazietaDi, umore } from './src/data/pets.js'

const ORA = 3600000
const guasti = []
const controlla = (cosa, ok) => { if (!ok) guasti.push(cosa) }

/* ══════════ 1. i dati stanno in piedi ══════════ */
controlla('tre animali', PETS.length === 3)
controlla('nomi giusti', PETS.map(p => p.nome).join() === 'Watson,Sherlock,Irene')
controlla('id unici', new Set(PETS.map(p => p.id)).size === 3)
controlla('manti diversi', new Set(PETS.map(p => p.manto)).size === 3)
controlla('ogni gatto ha un piatto preferito che esiste',
          PETS.every(p => ciboDi(p.preferito)))
controlla('cibi con emoji unica', new Set(CIBI.map(c => c.e)).size === CIBI.length)
controlla('c\'è carne e pollo', ciboDi('🥩') && ciboDi('🍗'))
controlla('c\'è varietà di sushi', CIBI.filter(c => c.tipo === 'sushi').length >= 3)
controlla('nessun cibo gratis o inutile', CIBI.every(c => c.costo > 0 && c.sazia > 0))

/* ══════════ 2. la fame passa col tempo ══════════ */
const t0 = Date.UTC(2026, 7, 2, 9)
const gatto = { pasto: t0, sat: 100, pasti: 1 }
const curva = [0, 1, 3, 5, 7, 24].map(h => ({
  dopoOre: h,
  sazieta: Math.round(sazietaDi(gatto, t0 + h * ORA)),
  umore: umore(sazietaDi(gatto, t0 + h * ORA)),
}))
controlla('appena mangiato è pieno', curva[0].sazieta === 100)
controlla('dopo un\'ora è ancora sazio', curva[1].umore === 'sazio')
controlla(`a ${FAME.oreVuoto} ore la ciotola è finita`, curva[4].sazieta === 0)
controlla('la fame non va sotto zero', curva[5].sazieta === 0)
controlla('prima o poi chiede da mangiare',
          curva.some(c => c.umore === 'affamato'))
controlla('la sazietà non risale da sola',
          curva.every((c, i) => i === 0 || c.sazieta <= curva[i - 1].sazieta))

/* ══════════ 3. adozione, spesa e pasti ══════════ */
const prof = { coins: 0, pets: {}, dispensa: {} }
const adotta = (id, ora) => {
  if (prof.pets[id] || prof.coins < FAME.costo) return false
  prof.coins -= FAME.costo
  prof.pets[id] = { adottato: ora, pasto: ora, sat: FAME.inizio, pasti: 0 }
  return true
}
const compra = e => {
  const c = ciboDi(e)
  if (!c || prof.coins < c.costo) return false
  prof.coins -= c.costo
  prof.dispensa[e] = (prof.dispensa[e] || 0) + 1
  return true
}
const dai = (id, e, ora) => {
  const p = prof.pets[id], c = ciboDi(e)
  if (!p || !c || !(prof.dispensa[e] > 0)) return false
  const adesso = sazietaDi(p, ora)
  if (adesso >= 98) return 'sazio'
  const pref = petDi(id).preferito === e
  prof.dispensa[e]--
  if (!prof.dispensa[e]) delete prof.dispensa[e]
  p.sat = Math.min(100, adesso + c.sazia * (pref ? FAME.preferito : 1))
  p.pasto = ora
  p.pasti++
  return pref ? 'preferito' : 'ok'
}

controlla('senza monete non si adotta', adotta('watson', t0) === false)
prof.coins = 100
controlla('con le monete si adotta', adotta('watson', t0) === true)
controlla(`costa ${FAME.costo} monete`, prof.coins === 70)
controlla('non si adotta due volte', adotta('watson', t0) === false)
controlla('arriva con un po\' di fame', sazietaDi(prof.pets.watson, t0) === FAME.inizio)

controlla('senza cibo in dispensa non si dà da mangiare', dai('watson', '🍗', t0) === false)
controlla('il cibo si compra', compra('🍗') === true)
controlla('il cibo costa', prof.coins === 68)
controlla('il piatto preferito lo dice', dai('watson', '🍗', t0) === 'preferito')
controlla('la porzione si consuma', !prof.dispensa['🍗'])
controlla('mangiare sazia', sazietaDi(prof.pets.watson, t0) > FAME.inizio)

// una porzione qualsiasi a chi è già pieno non deve sparire dalla dispensa
prof.pets.watson.sat = 100; prof.pets.watson.pasto = t0
compra('🍥')
controlla('a pancia piena rifiuta', dai('watson', '🍥', t0) === 'sazio')
controlla('e non spreca la porzione', prof.dispensa['🍥'] === 1)

// dopo qualche ora la accetta, e la sazietà non sfonda il tetto
controlla('più tardi mangia', dai('watson', '🍥', t0 + 4 * ORA) === 'ok')
controlla('non si supera il 100', sazietaDi(prof.pets.watson, t0 + 4 * ORA) <= 100)

// gli altri due, e un conto della spesa
controlla('si adotta Sherlock', adotta('sherlock', t0))
controlla('si adotta Irene', adotta('irene', t0))
controlla('tre gatti in casa', Object.keys(prof.pets).length === 3)
controlla('monete coerenti', prof.coins === 100 - 3 * FAME.costo - 2 - 2)

/* ══════════ 4. quanto si gioca per un gatto ══════════ */
// una moneta ogni 10 risposte giuste al livello 1: serve saperlo
const costoInRisposte = FAME.costo * 10
const giornoDiCibo = Math.ceil(100 / 34) * 2      // ~due pasti di pollo al dì

console.log('\n🐾  STANZA DEGLI ANIMALI\n')
console.log('gatti:', PETS.map(p => `${p.nome} (${p.razza}, ama ${p.preferito})`).join(' · '))
console.log('cibo :', CIBI.map(c => `${c.e}${c.nome} ${c.costo}🪙/${c.sazia}`).join('  '))
console.log('\nfame nel tempo (da 100):')
console.table(curva)
console.log(`adottare = ${FAME.costo} 🪙 ≈ ${costoInRisposte} risposte giuste al livello 1`)
console.log(`mantenere un gatto ≈ ${giornoDiCibo} 🪙 al giorno di pollo\n`)

if (guasti.length) { console.log('❌ GUASTI:'); guasti.forEach(g => console.log('  -', g)); process.exit(1) }
console.log('✅ tutto a posto\n')
