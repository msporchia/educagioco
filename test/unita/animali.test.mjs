/* Verifica della stanza degli animali, senza browser: le barre dei bisogni
   sono solo aritmetica sul tempo, e il negozio è una serie di guardie sulle
   monete. Il profilo vero vive dentro Vue, quindi qui se ne rifà un gemello
   minimo con le stesse regole di data/pets.js.

   In coda stampa QUANTO COSTA AL GIORNO tenere contento un animale: è la
   misura da guardare ogni volta che si toccano i prezzi.  `node pets-test.mjs` */
import { PETS, PRODOTTI, BISOGNI, CHIAVI, SOGLIE, PREFERITO, REPARTI,
         petDi, prodottoDi, perBisogno, preferisce,
         livelloDi, sazietaDi, grado, urgenza, contento,
         nuovoAnimale, migraAnimale,
         costoAlGiorno, costoGiornaliero } from '../../src/data/pets.js'

const ORA = 3600000
const guasti = []
const controlla = (cosa, ok) => { if (!ok) guasti.push(cosa) }

/* ══════════ 1. i dati stanno in piedi ══════════ */
controlla('quattro bisogni', BISOGNI.length === 4)
controlla('chiavi dei bisogni uniche', new Set(CHIAVI).size === 4)
controlla('c\'è la fame, il gioco, la pulizia e la forma',
          CHIAVI.join() === 'fame,gioco,pulizia,forma')
controlla('ogni bisogno si svuota in un tempo suo',
          new Set(BISOGNI.map(b => b.oreVuoto)).size === 4)
controlla('ogni bisogno sa cosa dire quando è basso',
          BISOGNI.every(b => b.chiede && b.sazio))
controlla('ogni bisogno parte da un valore sensato',
          BISOGNI.every(b => b.inizio > SOGLIE.basso && b.inizio <= 100))

controlla('tre animali', PETS.length === 3)
controlla('nomi giusti', PETS.map(p => p.nome).join() === 'Watson,Sherlock,Irene')
controlla('id unici', new Set(PETS.map(p => p.id)).size === 3)
controlla('manti diversi', new Set(PETS.map(p => p.manto)).size === 3)
controlla('Watson è un cane, gli altri due gatti',
          PETS.map(p => p.specie).join() === 'cane,gatto,gatto')
controlla('ognuno ha il suo verso', PETS.every(p => ['bau', 'miao'].includes(p.verso)))
controlla('ognuno costa il suo', PETS.every(p => p.costo > 0))
controlla('il primo animale costa meno degli altri',
          PETS[0].costo < PETS[1].costo && PETS[0].costo < PETS[2].costo)
controlla('ognuno ha dei preferiti, e sono roba che esiste',
          PETS.every(p => p.preferiti.length && p.preferiti.every(e => prodottoDi(e))))
controlla('nessuno preferisce due volte lo stesso bisogno',
          PETS.every(p => new Set(p.preferiti.map(e => prodottoDi(e).bisogno)).size
                          === p.preferiti.length))

controlla('prodotti con emoji unica', new Set(PRODOTTI.map(c => c.e)).size === PRODOTTI.length)
controlla('c\'è carne e pollo', prodottoDi('🥩') && prodottoDi('🍗'))
controlla('c\'è varietà di sushi', PRODOTTI.filter(c => c.tipo === 'sushi').length >= 3)
controlla('niente di gratis o inutile', PRODOTTI.every(c => c.costo > 0 && c.dona > 0))
controlla('ogni bisogno ha almeno tre modi di rimetterlo a posto',
          CHIAVI.every(k => perBisogno(k).length >= 3))
controlla('ogni prodotto sta in un reparto vero',
          PRODOTTI.every(c => REPARTI.some(r => r.tipo === c.tipo)))
controlla('nessun reparto vuoto',
          REPARTI.every(r => PRODOTTI.some(c => c.tipo === r.tipo)))

/* Nessun prodotto-trappola DENTRO UNO SCAFFALE: fra due cose messe una
   accanto all'altra, costare di più e rendere meno sarebbe una tagliola
   per chi non fa i conti. Fra scaffali diversi invece il divario è voluto:
   il sushi costa più della ciotola perché è una leccornia, e a rifarcelo
   è il bonus di chi lo preferisce (controllato qui sotto). */
for (const r of REPARTI) {
  const scaffale = PRODOTTI.filter(c => c.tipo === r.tipo)
  for (const a of scaffale)
    for (const b of scaffale)
      controlla(`${a.e} non deve essere peggio di ${b.e} sullo stesso scaffale`,
                !(a.costo >= b.costo && a.dona < b.dona && a.costo / a.dona > b.costo / b.dona))
}

/* Il preferito dev'essere davvero il migliore affare per il suo padrone:
   è quello che rende sensato comprare il sushi invece del pollo. */
for (const p of PETS)
  for (const e of p.preferiti) {
    const c = prodottoDi(e)
    const suo = c.costo / (c.dona * PREFERITO)
    controlla(`per ${p.nome} ${e} dev'essere l'affare migliore del suo bisogno`,
              perBisogno(c.bisogno).every(x =>
                suo <= x.costo / (x.dona * (preferisce(p.id, x.e) ? PREFERITO : 1))))
  }

/* ══════════ 2. le barre calano col tempo ══════════ */
const t0 = Date.UTC(2026, 7, 2, 9)
const pieno = { val: {}, t: {} }
for (const k of CHIAVI) { pieno.val[k] = 100; pieno.t[k] = t0 }

const curva = [0, 1, 3, 7, 16, 40, 90, 200].map(h => {
  const r = { dopoOre: h }
  for (const k of CHIAVI) r[k] = Math.round(livelloDi(pieno, k, t0 + h * ORA))
  r.chiede = urgenza(pieno, t0 + h * ORA).def.nome
  return r
})

controlla('appena servito è tutto pieno', CHIAVI.every(k => curva[0][k] === 100))
for (const b of BISOGNI) {
  const i = curva.findIndex(c => c.dopoOre >= b.oreVuoto)
  controlla(`a ${b.oreVuoto} ore la barra "${b.nome}" è finita`, curva[i][b.k] === 0)
}
controlla('niente va sotto zero', curva.every(c => CHIAVI.every(k => c[k] >= 0)))
controlla('nessuna barra risale da sola',
          curva.every((c, i) => i === 0 || CHIAVI.every(k => c[k] <= curva[i - 1][k])))
controlla('la fame è sempre il primo pensiero',
          curva.slice(1, 5).every(c => c.chiede === 'pancia'))
controlla('sazietaDi resta un altro nome per la pancia',
          sazietaDi(pieno, t0 + 3 * ORA) === livelloDi(pieno, 'fame', t0 + 3 * ORA))
controlla('i gradi delle barre', grado(100) === 'alto' && grado(50) === 'medio' && grado(5) === 'basso')
controlla('a barre piene è contento', contento(pieno, t0))
controlla('dopo una notte non lo è più', !contento(pieno, t0 + 10 * ORA))

/* ══════════ 3. adozione, spesa e cure ══════════ */
const prof = { coins: 0, pets: {}, dispensa: {}, cure: 0, pasti: 0 }

const adotta = (id, ora) => {
  const def = petDi(id)
  if (!def || prof.pets[id] || prof.coins < def.costo) return false
  prof.coins -= def.costo
  const a = { adottato: ora, val: {}, t: {}, pasti: 0, addosso: {} }
  for (const b of BISOGNI) { a.val[b.k] = b.inizio; a.t[b.k] = ora }
  prof.pets[id] = a
  return true
}

const compra = e => {
  const c = prodottoDi(e)
  if (!c || prof.coins < c.costo) return false
  prof.coins -= c.costo
  prof.dispensa[e] = (prof.dispensa[e] || 0) + 1
  return true
}

const usa = (id, e, ora) => {
  const a = prof.pets[id], c = prodottoDi(e)
  if (!a || !c || !(prof.dispensa[e] > 0)) return false
  const adesso = livelloDi(a, c.bisogno, ora)
  if (adesso >= SOGLIE.pieno) return 'pieno'
  const pref = preferisce(id, e)
  prof.dispensa[e]--
  if (!prof.dispensa[e]) delete prof.dispensa[e]
  a.val[c.bisogno] = Math.min(100, adesso + c.dona * (pref ? PREFERITO : 1))
  a.t[c.bisogno] = ora
  if (c.bisogno === 'fame') { a.pasti++; prof.pasti++ } else prof.cure++
  return pref ? 'preferito' : 'ok'
}

const BORSA = 300
controlla('senza monete non si adotta', adotta('watson', t0) === false)
prof.coins = BORSA
controlla('con le monete si adotta', adotta('watson', t0) === true)
controlla(`Watson costa ${petDi('watson').costo} monete`, prof.coins === BORSA - 40)
controlla('non si adotta due volte', adotta('watson', t0) === false)
controlla('arriva con un po\' di fame',
          livelloDi(prof.pets.watson, 'fame', t0) === BISOGNI[0].inizio)
controlla('ma arriva pulito e in forma',
          grado(livelloDi(prof.pets.watson, 'pulizia', t0)) !== 'basso' &&
          grado(livelloDi(prof.pets.watson, 'forma', t0)) !== 'basso')

controlla('senza niente in dispensa non si dà niente', usa('watson', '🍗', t0) === false)
controlla('il pollo si compra', compra('🍗') === true)
controlla('e costa', prof.coins === BORSA - 40 - 4)
controlla('il piatto preferito lo dice', usa('watson', '🍗', t0) === 'preferito')
controlla('la porzione si consuma', !prof.dispensa['🍗'])
controlla('mangiare sazia', livelloDi(prof.pets.watson, 'fame', t0) > BISOGNI[0].inizio)
controlla('e conta come pasto, non come cura', prof.pasti === 1 && prof.cure === 0)

/* le cure non sono pasti, e contano su un altro contatore */
compra('🪥')
controlla('la spazzola si usa', usa('watson', '🪥', t0 + 50 * ORA) === 'ok')
controlla('spazzolare non è dar da mangiare', prof.pasti === 1 && prof.cure === 1)
controlla('la spazzola tocca solo il pulito',
          livelloDi(prof.pets.watson, 'pulizia', t0 + 50 * ORA) > SOGLIE.basso)

/* un preferito che non è cibo rende comunque di più */
compra('🎾'); compra('🧶')
const primaGioco = livelloDi(prof.pets.watson, 'gioco', t0 + 50 * ORA)
controlla('la palla è il preferito di Watson', usa('watson', '🎾', t0 + 50 * ORA) === 'preferito')
controlla('il gomitolo no', usa('watson', '🧶', t0 + 51 * ORA) === 'ok')
controlla('giocare riempie l\'allegria',
          livelloDi(prof.pets.watson, 'gioco', t0 + 51 * ORA) > primaGioco)

/* a barra piena il prodotto non deve sparire dalla dispensa */
prof.pets.watson.val.fame = 100; prof.pets.watson.t.fame = t0
compra('🍥')
controlla('a pancia piena rifiuta', usa('watson', '🍥', t0) === 'pieno')
controlla('e non spreca la porzione', prof.dispensa['🍥'] === 1)
controlla('più tardi mangia', usa('watson', '🍥', t0 + 4 * ORA) === 'ok')
controlla('non si supera il 100', livelloDi(prof.pets.watson, 'fame', t0 + 4 * ORA) <= 100)

/* la stessa protezione vale per tutte e quattro le barre */
for (const k of CHIAVI) {
  const c = perBisogno(k)[0]
  prof.pets.watson.val[k] = 100; prof.pets.watson.t[k] = t0
  compra(c.e)
  controlla(`a "${k}" pieno rifiuta ${c.e}`, usa('watson', c.e, t0) === 'pieno')
  controlla(`e non spreca ${c.e}`, prof.dispensa[c.e] === 1)
  delete prof.dispensa[c.e]
}

/* gli altri due, e un conto della spesa */
const speso = BORSA - prof.coins
controlla('si adotta Sherlock', adotta('sherlock', t0))
controlla('si adotta Irene', adotta('irene', t0))
controlla('tre animali in casa', Object.keys(prof.pets).length === 3)
controlla('monete coerenti', prof.coins === BORSA - speso - 70 - 70)
controlla('tutti e tre costano insieme',
          PETS.reduce((s, p) => s + p.costo, 0) === 180)

/* ══════════ 4. i profili di prima ══════════
   Chi giocava quando esisteva solo la fame ha `sat` e `pasto` salvati nel
   browser: quella partita non deve andare persa, e soprattutto non deve
   ritrovarsi tre barre rosse per colpa di un aggiornamento. */
{
  const vecchio = { adottato: t0 - 100 * ORA, pasto: t0 - 2 * ORA, sat: 80, pasti: 42 }
  const a = migraAnimale(vecchio, t0)
  controlla('la vecchia pancia diventa la barra della fame',
            Math.round(livelloDi(a, 'fame', t0)) === Math.round(80 - 2 * (100 / 7)))
  controlla('e i pasti serviti restano', a.pasti === 42)
  controlla('i campi di prima spariscono', a.sat === undefined && a.pasto === undefined)
  for (const b of BISOGNI.slice(1))
    controlla(`la barra "${b.nome}" arriva al suo valore di partenza`,
              livelloDi(a, b.k, t0) === b.inizio)
  controlla('e nessuna barra nuova nasce già rossa',
            BISOGNI.slice(1).every(b => grado(livelloDi(a, b.k, t0)) !== 'basso'))
  controlla('ci si può vestire subito', typeof a.addosso === 'object')

  // rifarla due volte non deve rovinare niente
  const b1 = livelloDi(a, 'fame', t0)
  migraAnimale(a, t0 + ORA)
  controlla('migrare due volte non cambia niente', livelloDi(a, 'fame', t0) === b1)

  // un animale nato adesso non ha bisogno di nessuna migrazione
  const nato = nuovoAnimale(t0)
  controlla('un animale nuovo è già a posto',
            JSON.stringify(migraAnimale({ ...nato }, t0)) === JSON.stringify(nato))
  controlla('e su roba che non è un animale non esplode',
            migraAnimale(null, t0) === null && migraAnimale(7, t0) === 7)
}

/* ══════════ 5. quanto costa tenerli contenti ══════════ */
const perAnimale = costoGiornaliero(1)
const perTutti = perAnimale * PETS.length
controlla('mantenere un animale costa qualcosa di serio', perAnimale > 20)
controlla('ma non quanto una giornata intera di gioco', perAnimale < 45)

console.log('\n🐾  STANZA DEGLI ANIMALI\n')
console.log('casa :', PETS.map(p => `${p.nome} ${p.costo}🪙 (ama ${p.preferiti.join(' ')})`).join(' · '))
for (const r of REPARTI)
  console.log((r.titolo + ' ').padEnd(22, '·'),
    PRODOTTI.filter(c => c.tipo === r.tipo).map(c => `${c.e}${c.nome} ${c.costo}🪙/${c.dona}`).join('  '))

console.log('\nle barre nel tempo (da 100):')
console.table(curva)

console.log('costo al giorno, comprando al meglio:')
console.table(BISOGNI.map(b => ({
  bisogno: b.nome,
  oreVuoto: b.oreVuoto,
  'una visita al dì': +costoAlGiorno(b.k, 1).toFixed(1),
  'due visite al dì': +costoAlGiorno(b.k, 2).toFixed(1),
})))
console.log(`un animale contento ≈ ${perAnimale.toFixed(0)} 🪙 al giorno`)
console.log(`tutti e tre        ≈ ${perTutti.toFixed(0)} 🪙 al giorno`)
console.log(`adottarli tutti    = ${PETS.reduce((s, p) => s + p.costo, 0)} 🪙 una volta sola\n`)

if (guasti.length) { console.log('❌ GUASTI:'); guasti.forEach(g => console.log('  -', g)); process.exit(1) }
console.log('✅ tutto a posto\n')
