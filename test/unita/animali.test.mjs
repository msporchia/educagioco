/* ═══════════════════════════════════════════════════════════════════
   LA CAMERETTA SENZA BROWSER

   Le barre dei bisogni sono aritmetica sul tempo, e il resto — adottare,
   sostituire, dare da mangiare — è `store/profile.js`, che fuori dal
   browser gira lo stesso: `storage.js` degrada da solo all'archivio in
   memoria. Quindi qui **non si rifà un gemello del profilo**: si chiamano
   le funzioni vere, che è l'unico modo perché questo test possa
   accorgersi di una regola che cambia.

   In coda stampa QUANTO COSTA AL GIORNO tenere contento un animale: è la
   misura da guardare ogni volta che si toccano i prezzi.
   ═══════════════════════════════════════════════════════════════════ */
import { PETS, PRODOTTI, BISOGNI, CHIAVI, SOGLIE, PREFERITO, REPARTI, POSTI_CASA,
         FAMIGLIE, DIETE, ANCORE,
         petDi, prodottoDi, perBisogno, delReparto, preferisce, gradimento,
         dietaDi, menuDi, quotaRientro, puoMangiare,
         livelloDi, sazietaDi, grado, urgenza, contento,
         nuovoAnimale, migraAnimale, curato,
         costoAlGiorno, costoGiornaliero } from '../../src/data/pets.js'
import { state, init, creaGiocatore, selectPlayer, adotta, riprendi, sostituisci,
         mandaAlRifugio, rinominaAnimale, compraProdotto, usa,
         miei, alRifugio, inCasa, haAnimale, animale, postiLiberi,
         bisogno, inDispensa } from '../../src/store/profile.js'
import { save, remove, chiavi, flush } from '../../src/store/storage.js'

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

controlla('in casa ce ne stanno quattro', POSTI_CASA === 4)
controlla('c\'è da scegliere: più animali che posti', PETS.length > POSTI_CASA * 2)
controlla('id unici', new Set(PETS.map(p => p.id)).size === PETS.length)
controlla('nomi di catalogo unici', new Set(PETS.map(p => p.nome)).size === PETS.length)
controlla('ognuno sta in una famiglia che esiste',
          PETS.every(p => FAMIGLIE.some(f => f.k === p.famiglia)))
controlla('nessuna famiglia vuota',
          FAMIGLIE.every(f => PETS.some(p => p.famiglia === f.k)))
controlla('almeno cinque specie diverse', new Set(PETS.map(p => p.specie)).size >= 5)
controlla('cani, gatti, pappagalli, pesci e bestie strane',
          ['cane', 'gatto', 'pappagallo', 'pesce', 'drago']
            .every(s => PETS.some(p => p.specie === s)))
controlla('ogni specie sa dove si appoggiano gli accessori',
          PETS.every(p => ANCORE[p.specie] &&
            ['testa', 'occhi', 'collo', 'schiena'].every(k => ANCORE[p.specie][k])))
controlla('ognuno ha il suo verso',
          PETS.every(p => ['bau', 'miao', 'cip', 'blub', 'ruggito'].includes(p.verso)))
controlla('ognuno costa il suo', PETS.every(p => p.costo > 0))
controlla('si comincia con pochi spiccioli', Math.min(...PETS.map(p => p.costo)) <= 40)
controlla('e c\'è qualcosa da desiderare a lungo',
          Math.max(...PETS.map(p => p.costo)) >= 120)
controlla('riprenderlo dal rifugio costa molto meno che comprarlo',
          PETS.every(p => quotaRientro(p.id) >= 5 && quotaRientro(p.id) < p.costo / 3))
controlla('ognuno ha dei preferiti, e sono roba che esiste',
          PETS.every(p => p.preferiti.length && p.preferiti.every(e => prodottoDi(e))))
controlla('nessuno preferisce due volte lo stesso bisogno',
          PETS.every(p => new Set(p.preferiti.map(e => prodottoDi(e).bisogno)).size
                          === p.preferiti.length))
controlla('e nessuno preferisce qualcosa che poi non mangia',
          PETS.every(p => p.preferiti.every(e => puoMangiare(p.id, e))))

controlla('prodotti con emoji unica', new Set(PRODOTTI.map(c => c.e)).size === PRODOTTI.length)
controlla('c\'è carne e pollo', prodottoDi('🥩') && prodottoDi('🍗'))
controlla('c\'è varietà di sushi', delReparto('sushi').length >= 3)
controlla('niente di gratis o inutile', PRODOTTI.every(c => c.costo > 0 && c.dona > 0))
controlla('ogni bisogno ha almeno tre modi di rimetterlo a posto',
          CHIAVI.every(k => perBisogno(k).length >= 3))
controlla('ogni prodotto sta in un reparto vero',
          PRODOTTI.every(c => REPARTI.some(r => r.tipo === c.tipo)))
controlla('nessun reparto vuoto',
          REPARTI.every(r => delReparto(r.tipo).length))
controlla('solo la roba da mangiare ha una categoria di cibo',
          PRODOTTI.every(c => (c.bisogno === 'fame') === !!c.cibo))
controlla('e ogni reparto di cibo dichiara cosa ci si trova',
          REPARTI.every(r => (r.bisogno === 'fame') === Array.isArray(r.cibi)))
controlla('i cibi di un reparto sono quelli che ci stanno dentro',
          REPARTI.filter(r => r.cibi).every(r =>
            delReparto(r.tipo).every(c => r.cibi.includes(c.cibo))))

/* ── le diete ──
   Una specie che non può mangiare niente sarebbe un animale che non si
   può accudire, e una dieta che comprende tutto non insegnerebbe niente. */
for (const [specie, dieta] of Object.entries(DIETE)) {
  controlla(`la dieta di ${specie} nomina categorie che esistono`,
            dieta.every(c => PRODOTTI.some(x => x.cibo === c)))
  const suoi = PRODOTTI.filter(c => c.bisogno === 'fame' && dieta.includes(c.cibo))
  controlla(`${specie} ha almeno tre cose da mangiare`, suoi.length >= 3)
  controlla(`${specie} non mangia proprio tutto`,
            suoi.length < perBisogno('fame').length)
}
controlla('ogni specie del catalogo ha una dieta',
          PETS.every(p => dietaDi(p.id).length >= 2))
controlla('il menu si legge in emoji', PETS.every(p => menuDi(p.id).length >= 2))
controlla('il cane e il gatto non mangiano le stesse cose',
          DIETE.cane.join() !== DIETE.gatto.join())
controlla('al cane il sushi non si dà', gradimento('watson', '🍣') === 'no')
controlla('al gatto sì', gradimento('sherlock', '🍣') === 'ama')
controlla('al pesciolino la carne no', gradimento('bolla', '🥩') === 'no')
controlla('al pappagallo i semi sì', gradimento('kiwi', '🥜') === 'ok')
controlla('i giochi vanno bene per tutti',
          PETS.every(p => gradimento(p.id, '🧶') !== 'no'))
controlla('e anche la spazzola', PETS.every(p => gradimento(p.id, '🪥') !== 'no'))

/* Nessun prodotto-trappola DENTRO UNO SCAFFALE: fra due cose messe una
   accanto all'altra, costare di più e rendere meno sarebbe una tagliola
   per chi non fa i conti. Fra scaffali diversi invece il divario è voluto:
   il sushi costa più della ciotola perché è una leccornia, e a rifarcelo
   è il bonus di chi lo preferisce (controllato qui sotto). */
for (const r of REPARTI) {
  const scaffale = delReparto(r.tipo)
  for (const a of scaffale)
    for (const b of scaffale)
      controlla(`${a.e} non deve essere peggio di ${b.e} sullo stesso scaffale`,
                !(a.costo >= b.costo && a.dona < b.dona && a.costo / a.dona > b.costo / b.dona))
}

/* Il preferito dev'essere davvero il migliore affare per il suo padrone,
   fra quello che quel padrone può usare: è quello che rende sensato
   comprare il sushi invece dei croccantini. Il confronto si fa sulla
   dieta, non su tutto il negozio — un cane non sceglie fra pollo e
   vermetti. */
for (const p of PETS)
  for (const e of p.preferiti) {
    const c = prodottoDi(e)
    const suo = c.costo / (c.dona * PREFERITO)
    controlla(`per ${p.nome} ${e} dev'essere l'affare migliore del suo bisogno`,
              perBisogno(c.bisogno).filter(x => puoMangiare(p.id, x.e)).every(x =>
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

/* ══════════ 3. adottare, sostituire, riprendere ══════════
   Da qui in giù si gioca con il profilo VERO. I traguardi regalano
   monete, e un premio in mezzo a un conto lo rende illeggibile: `senza
   premi` sfrutta il fatto che alla PRIMA riscossione i traguardi già
   meritati si registrano in silenzio, quindi rimettendo il flag a zero
   prima di ogni gesto nessuno viene mai pagato. */
for (const k of await chiavi('')) await remove(k)
state.giocatori = []; state.player = ''
await init()
await creaGiocatore('Prova')
await flush()

const senzaPremi = fn => { state.profile.badgeInit = 0; return fn() }
const monete = n => { state.profile.coins = n }

monete(0)
controlla('senza monete non si adotta', senzaPremi(() => adotta('watson', 'Watson')) === false)
monete(1000)
controlla('con le monete si adotta', senzaPremi(() => adotta('watson', 'Watson')) === true)
controlla('e il prezzo è quello scritto', state.profile.coins === 1000 - 40)
controlla('non si adotta due volte', senzaPremi(() => adotta('watson', 'Ancora')) === false)
controlla('un animale che non esiste non si adotta',
          senzaPremi(() => adotta('unicorno', 'Boh')) === false)
controlla('adesso è in casa', inCasa('watson') && haAnimale('watson'))
controlla('e i posti liberi sono tre', postiLiberi() === 3)
controlla('arriva con un po\' di fame',
          Math.round(bisogno('watson', 'fame')) === BISOGNI[0].inizio)
controlla('ma arriva pulito e in forma',
          grado(bisogno('watson', 'pulizia')) !== 'basso' &&
          grado(bisogno('watson', 'forma')) !== 'basso')

/* il nome è del bambino, non del catalogo */
senzaPremi(() => adotta('bolla', 'Pinna'))
controlla('il nome scelto è quello che si legge', animale('bolla').nome === 'Pinna')
controlla('e il catalogo resta com\'è', petDi('bolla').nome === 'Bolla')
controlla('senza nome si tiene quello proposto',
          senzaPremi(() => adotta('kiwi', '   ')) && animale('kiwi').nome === 'Kiwi')
controlla('rinominare cambia solo l\'etichetta',
          rinominaAnimale('bolla', 'Bollicina') && animale('bolla').nome === 'Bollicina')
controlla('e i suoi progressi restano suoi',
          Math.round(bisogno('bolla', 'fame')) === BISOGNI[0].inizio)
controlla('un nome vuoto non si accetta', rinominaAnimale('bolla', '  ') === false)
controlla('i nomi lunghi si tagliano',
          rinominaAnimale('bolla', 'Bollicinabellissimadelmare') &&
          animale('bolla').nome.length === 14)
rinominaAnimale('bolla', 'Bolla')

/* la casa piena, e la sostituzione */
senzaPremi(() => adotta('brace', 'Brace'))
controlla('quattro in casa', miei().length === 4 && postiLiberi() === 0)
controlla('il quinto non entra: la casa è piena',
          senzaPremi(() => adotta('irene', 'Irene')) === false)
controlla('e non è stato pagato niente', !haAnimale('irene'))

const primaDiScambiare = state.profile.coins
controlla('sostituire fa entrare il nuovo',
          senzaPremi(() => sostituisci('kiwi', 'irene', 'Micia')))
controlla('il nuovo è in casa', inCasa('irene') && animale('irene').nome === 'Micia')
controlla('e chi è uscito non è sparito: è al rifugio',
          haAnimale('kiwi') && !inCasa('kiwi') &&
          alRifugio().some(p => p.id === 'kiwi'))
controlla('si è pagato solo il nuovo',
          state.profile.coins === primaDiScambiare - petDi('irene').costo)
controlla('e i posti restano quattro', miei().length === 4)

/* riprendere costa la quota, non il prezzo pieno */
controlla('senza posto non si riprende', riprendi('kiwi') === false)
controlla('si può salutare qualcuno', mandaAlRifugio('brace'))
controlla('e adesso al rifugio ce ne sono due', alRifugio().length === 2)
const primaDiRiprendere = state.profile.coins
controlla('riprenderlo funziona', senzaPremi(() => riprendi('kiwi')))
controlla('e costa la quota', state.profile.coins === primaDiRiprendere - quotaRientro('kiwi'))
controlla('torna col suo nome', animale('kiwi').nome === 'Kiwi')
controlla('e torna riposato', grado(bisogno('kiwi', 'fame')) !== 'basso')
controlla('chi non è mai stato adottato non si riprende', riprendi('luna') === false)
controlla('mandare al rifugio uno che non è in casa non fa niente',
          mandaAlRifugio('luna') === false)

/* la sostituzione non deve poter lasciare un buco */
monete(1)
const casaPrima = miei().map(p => p.id).join()
controlla('senza monete la sostituzione non parte',
          senzaPremi(() => sostituisci(casaPrima.split(',')[0], 'luna', 'Luna')) === false)
controlla('e la casa è rimasta com\'era', miei().map(p => p.id).join() === casaPrima)
monete(1000)

/* ══════════ 4. dare da mangiare, e i gusti ══════════ */
controlla('senza niente in dispensa non si dà niente', usa('watson', '🍗') === false)
controlla('il pollo si compra', compraProdotto('🍗') === true)
const primaDelPasto = state.profile.coins
controlla('il piatto preferito lo dice', senzaPremi(() => usa('watson', '🍗')) === 'preferito')
controlla('la porzione si consuma', inDispensa('🍗') === 0)
controlla('mangiare sazia', bisogno('watson', 'fame') > BISOGNI[0].inizio)
controlla('e dare da mangiare non costa monete', state.profile.coins === primaDelPasto)
controlla('e conta come pasto, non come cura',
          state.profile.totals.pasti === 1 && state.profile.totals.cure === 0)

/* il punto di tutto: quello che a lui non piace lo rifiuta, e la
   porzione resta in dispensa */
compraProdotto('🍣')
controlla('al cane il sushi non si dà', usa('watson', '🍣') === 'no')
controlla('e la porzione non si spreca', inDispensa('🍣') === 1)
controlla('la sua barra non si muove per un rifiuto',
          bisogno('watson', 'fame') > BISOGNI[0].inizio)
controlla('a chi piace invece va giù',
          senzaPremi(() => usa('irene', '🍣')) === 'ok' && inDispensa('🍣') === 0)
compraProdotto('🥩')
controlla('a Micia la carne piace tanto', senzaPremi(() => usa('irene', '🥩')) === 'preferito')
compraProdotto('🥩')
controlla('al pesciolino no', usa('bolla', '🥩') === 'no')
controlla('e la carne resta lì', inDispensa('🥩') === 1)

/* le cure non sono pasti, e contano su un altro contatore */
compraProdotto('🪥')
controlla('la spazzola si usa su chiunque', senzaPremi(() => usa('bolla', '🪥')) === 'ok')
controlla('spazzolare non è dar da mangiare',
          state.profile.totals.pasti === 3 && state.profile.totals.cure === 1)

/* a barra piena il prodotto non deve sparire dalla dispensa */
state.profile.pets.watson.val.fame = 100
state.profile.pets.watson.t.fame = Date.now()
compraProdotto('🥣')
controlla('a pancia piena rifiuta', usa('watson', '🥣') === 'pieno')
controlla('e non spreca la porzione', inDispensa('🥣') === 1)

/* ══════════ 5. i profili di prima ══════════
   Chi giocava quando esisteva solo la fame ha `sat` e `pasto` salvati nel
   browser, e chi giocava ieri non ha il nome: quella partita non deve
   andare persa, e soprattutto non deve ritrovarsi tre barre rosse per
   colpa di un aggiornamento. */
{
  const vecchio = { adottato: t0 - 100 * ORA, pasto: t0 - 2 * ORA, sat: 80, pasti: 42 }
  const a = migraAnimale(vecchio, t0, 'watson')
  controlla('la vecchia pancia diventa la barra della fame',
            Math.round(livelloDi(a, 'fame', t0)) === Math.round(80 - 2 * (100 / 7)))
  controlla('e i pasti serviti restano', a.pasti === 42)
  controlla('chi non aveva un nome prende quello del catalogo', a.nome === 'Watson')
  controlla('i campi di prima spariscono', a.sat === undefined && a.pasto === undefined)
  for (const b of BISOGNI.slice(1))
    controlla(`la barra "${b.nome}" arriva al suo valore di partenza`,
              livelloDi(a, b.k, t0) === b.inizio)
  controlla('e nessuna barra nuova nasce già rossa',
            BISOGNI.slice(1).every(b => grado(livelloDi(a, b.k, t0)) !== 'basso'))
  controlla('ci si può vestire subito', typeof a.addosso === 'object')

  // rifarla due volte non deve rovinare niente
  const b1 = livelloDi(a, 'fame', t0)
  migraAnimale(a, t0 + ORA, 'watson')
  controlla('migrare due volte non cambia niente', livelloDi(a, 'fame', t0) === b1)

  // un animale nato adesso non ha bisogno di nessuna migrazione
  const nato = nuovoAnimale(t0, 'Pippo')
  controlla('un animale nuovo è già a posto',
            JSON.stringify(migraAnimale({ ...nato }, t0, 'watson')) === JSON.stringify(nato))
  controlla('e su roba che non è un animale non esplode',
            migraAnimale(null, t0) === null && migraAnimale(7, t0) === 7)

  // il rifugio rimette in sesto le barre e non tocca il resto
  // (il caso dei salvataggi senza `casa` sta più sotto, con lo store vero)
  const stanco = nuovoAnimale(t0 - 300 * ORA, 'Stanco')
  stanco.pasti = 12
  stanco.addosso = { testa: '🎩' }
  curato(stanco, t0)
  controlla('dal rifugio torna riposato',
            BISOGNI.every(b => livelloDi(stanco, b.k, t0) === b.inizio))
  controlla('col cappello ancora in testa e i suoi pasti',
            stanco.addosso.testa === '🎩' && stanco.pasti === 12 && stanco.nome === 'Stanco')
}

/* ── il salvataggio di chi giocava quando erano tre ──
   `casa` non c'era: i suoi animali stavano tutti in cameretta, e devono
   restarci. Se questa migrazione sbaglia, chi apre l'aggiornamento trova
   la stanza vuota e i suoi amici al rifugio da ricomprare — il modo più
   sicuro di rovinare la giornata a qualcuno. */
{
  const ieri = {
    v: 6, coins: 200,
    pets: {
      watson: { adottato: 1, pasti: 24, val: { fame: 60 }, t: { fame: Date.now() } },
      sherlock: { adottato: 1, pasti: 3, val: { fame: 60 }, t: { fame: Date.now() } },
      irene: { adottato: 1, pasti: 7, val: { fame: 60 }, t: { fame: Date.now() } },
    },
  }
  await save('profilo:vecchio', ieri)
  await flush()
  await selectPlayer('vecchio')
  controlla('chi aveva tre animali se li ritrova in casa',
            miei().length === 3 && ['watson', 'sherlock', 'irene'].every(inCasa))
  controlla('e nessuno è finito al rifugio', alRifugio().length === 0)
  controlla('con il nome che avevano nel catalogo', animale('watson').nome === 'Watson')
  controlla('e i pasti serviti sono ancora i loro', state.profile.pets.watson.pasti === 24)

  // ma una casa svuotata a mano resta svuotata: `casa: []` è una scelta
  await save('profilo:svuotato', { ...ieri, casa: [] })
  await flush()
  await selectPlayer('svuotato')
  controlla('una cameretta svuotata apposta non si ripopola da sé',
            miei().length === 0 && alRifugio().length === 3)

  // e chi aveva più animali di quanti sono i posti non li perde
  await save('profilo:tanti', {
    ...ieri,
    pets: Object.fromEntries(PETS.slice(0, 6).map(p => [p.id, { adottato: 1, val: {}, t: {} }])),
  })
  await flush()
  await selectPlayer('tanti')
  controlla('più di quattro: quattro in casa e gli altri al rifugio',
            miei().length === POSTI_CASA && alRifugio().length === 2)
}

/* ══════════ 6. quanto costa tenerli contenti ══════════ */
const costi = PETS.map(p => ({ chi: p.nome, alGiorno: +costoGiornaliero(1, p.id).toFixed(1) }))
const caro = Math.max(...costi.map(c => c.alGiorno))
const economico = Math.min(...costi.map(c => c.alGiorno))
controlla('mantenere un animale costa qualcosa di serio', economico > 20)
controlla('ma non quanto una giornata intera di gioco', caro < 45)
controlla('e nessuna specie costa il doppio di un\'altra', caro < economico * 1.5)

console.log('\n🐾  LA CAMERETTA\n')
for (const f of FAMIGLIE)
  console.log((f.emoji + ' ' + f.titolo + ' ').padEnd(24, '·'),
    PETS.filter(p => p.famiglia === f.k)
      .map(p => `${p.nome} ${p.costo}🪙 (ama ${p.preferiti.join(' ')})`).join('  ·  '))

console.log('\nchi mangia cosa:')
console.table(Object.entries(DIETE).map(([specie, dieta]) => ({
  specie,
  mangia: dieta.join(', '),
  'in negozio': PRODOTTI.filter(c => c.bisogno === 'fame' && dieta.includes(c.cibo))
    .map(c => c.e).join(' '),
})))

for (const r of REPARTI)
  console.log((r.titolo + ' ').padEnd(24, '·'),
    delReparto(r.tipo).map(c => `${c.e}${c.nome} ${c.costo}🪙/${c.dona}`).join('  '))

console.log('\nle barre nel tempo (da 100):')
console.table(curva)

console.log('costo al giorno, comprando al meglio:')
console.table(BISOGNI.map(b => ({
  bisogno: b.nome,
  oreVuoto: b.oreVuoto,
  'una visita al dì': +costoAlGiorno(b.k, 1).toFixed(1),
  'due visite al dì': +costoAlGiorno(b.k, 2).toFixed(1),
})))
console.log(`tenerne uno contento ≈ da ${economico.toFixed(0)} a ${caro.toFixed(0)} 🪙 al giorno`)
console.log(`la cameretta piena   ≈ ${(costi.slice(0, POSTI_CASA)
  .reduce((s, c) => s + c.alGiorno, 0)).toFixed(0)} 🪙 al giorno`)
console.log(`adottarli tutti      = ${PETS.reduce((s, p) => s + p.costo, 0)} 🪙 una volta sola\n`)

if (guasti.length) { console.log('❌ GUASTI:'); guasti.forEach(g => console.log('  -', g)); process.exit(1) }
console.log('✅ tutto a posto\n')
