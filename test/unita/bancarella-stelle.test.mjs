/* ═══════════════════════════════════════════════════════════════════
   LE STELLE DELLA BANCARELLA, SENZA BROWSER

   Una giornata vinta vale da 1 a 3 stelle, dagli intoppi nei conti (un
   cliente con un conto sbagliato, o che se n'è andato); si tiene la
   migliore e rigiocare peggio non toglie niente. Stanno in
   `profile.mercato.stelle`, per id di giornata, accanto a `tappa`. Le
   giornate già fatte da chi giocava prima partono con 1 stella.
   Vedi docs/bancarella/regole.md, «Le stelle».
   `node test/esegui.mjs bancarella-stelle --niente-build` */
import { CAMPAGNE, LIBERA, stelleDiGiornata, perLaProssima, INTOPPI_PER_DUE }
  from '../../src/data/bancarella.js'
import { CITTA, stelleGiornata, stelleCitta, stelleMassime }
  from '../../src/data/bancarella-mondo.js'
import { state, init, selectPlayer, migraMercato, mercatoCompleta, mercatoProgresso, persist }
  from '../../src/store/profile.js'
import { save, load, remove, chiavi, flush } from '../../src/store/storage.js'
import { scrivi, leggi } from '../../src/motore/bancarella/sosta.js'
import { tappaDi, campagnaDi, esposizione, generaCliente, CLIENTI_PER_TAPPA }
  from '../../src/data/bancarella.js'
import { controlla, uguale, stessaLista, nota, riassunto } from '../aiuto/verifica.mjs'

/* ══════════ 1. la regola ══════════ */
uguale('nessun intoppo: tre stelle', stelleDiGiornata(0), 3)
uguale('un intoppo: due', stelleDiGiornata(1), 2)
uguale('due intoppi: ancora due', stelleDiGiornata(INTOPPI_PER_DUE), 2)
uguale('tre intoppi: una', stelleDiGiornata(INTOPPI_PER_DUE + 1), 1)
uguale('e anche dieci: una vinta ne vale sempre almeno una', stelleDiGiornata(10), 1)
controlla('più intoppi non danno mai più stelle',
          [0, 1, 2, 3, 4, 5, 9].every((n, i, v) => i === 0 || stelleDiGiornata(n) <= stelleDiGiornata(v[i - 1])))
uguale('a tre stelle non manca niente', perLaProssima(3), '')
controlla('a due stelle il cartello dice cosa serve', /nessun conto sbagliato/.test(perLaProssima(2)))
controlla('a una stella dice quanti intoppi bastano', perLaProssima(1).includes(String(INTOPPI_PER_DUE)))

/* la stessa soglia degli altri giochi con le stelle (conta: 0 → 3, fino a 2 → 2, poi 1) */
const giornata = CAMPAGNE.find(c => c.tappe.length >= 3)
controlla('una giornata ha abbastanza clienti perché le soglie abbiano senso',
          giornata.tappe.length * CLIENTI_PER_TAPPA > INTOPPI_PER_DUE + 3)

/* ══════════ 2. la mappa le legge (puro) ══════════ */
const bologna = CITTA[0]
uguale('una giornata non fatta non ha stelle, anche se il campo ne ha',
       stelleGiornata(bologna.giornate[0], 0, { [bologna.giornate[0]]: 3 }), 0)
uguale('una fatta senza voto scritto ne ha una', stelleGiornata(bologna.giornate[0], 1, {}), 1)
uguale('una fatta col suo voto, quello', stelleGiornata(bologna.giornate[0], 1, { [bologna.giornate[0]]: 3 }), 3)
uguale('un voto fuori scala si riporta a tre', stelleGiornata(bologna.giornate[0], 1, { [bologna.giornate[0]]: 9 }), 3)
uguale('la libera non ha stelle', stelleGiornata(LIBERA.id, CAMPAGNE.length, { libera: 3 }), 0)
uguale('la somma di una città', stelleCitta(bologna, 2, { [bologna.giornate[0]]: 3, [bologna.giornate[1]]: 2 }), 5)
uguale('il massimo è tre a giornata', stelleMassime(bologna), bologna.giornate.length * 3)
uguale('la libera non ha un massimo', stelleMassime(CITTA.find(c => c.libera)), 0)

/* ══════════ 3. il profilo di oggi ══════════
   Un salvataggio vero, scritto prima delle stelle: tre giornate fatte e
   niente `stelle`. Si apre, e ognuna parte con 1 stella; il resto non si
   tocca (tappa, libera, versione). */
async function pulisci() {
  for (const k of await chiavi('')) await remove(k)
  state.giocatori = []
  state.player = ''
}
await pulisci()
save('profilo:g1', { v: 6, coins: 40, items: {}, totals: { math: 0, clienti: 7 },
                     mercato: { tappa: 3, libera: false, v: 2 } })
save('giocatori', [{ id: 'g1', nome: 'Nina' }])
await flush()
await init()
let m = mercatoProgresso()
stessaLista('le tre giornate fatte hanno una stella',
            Object.keys(m.stelle).sort(), CAMPAGNE.slice(0, 3).map(g => g.id).sort())
controlla('e ognuna una sola', Object.values(m.stelle).every(n => n === 1))
uguale('la tappa è quella di prima', m.tappa, 3)
uguale('la libera pure', m.libera, false)
uguale('la versione pure', m.v, 2)
uguale('le monete e i clienti non si sono mossi', state.profile.coins + ':' + state.profile.totals.clienti, '40:7')

/* un profilo senza il campo e senza giornate fatte: niente stelle inventate */
const nuovo = migraMercato({ tappa: 0, libera: false, stelle: {}, v: 2 }, { tappa: 0, libera: false, v: 2 })
stessaLista('chi non ha finito niente non ha stelle', Object.keys(nuovo.stelle), [])
/* il salvataggio di prima della fila nuova passa dalla migrazione di sempre, poi dalle stelle */
const vecchio = migraMercato({ tappa: 0, libera: false, stelle: {}, v: 2 }, { tappa: 2, libera: false })
uguale('un salvataggio sulla fila vecchia ritrova le sue giornate', vecchio.tappa, CAMPAGNE.findIndex(g => g.id === 'conto-dieci'))
uguale('e ogni giornata che gli tocca ha la sua stella', Object.keys(vecchio.stelle).length, vecchio.tappa)
/* voti già scritti: restano, e quelli fuori scala si sistemano; gli id che non conosciamo non si perdono */
const scritto = migraMercato({ tappa: 0, libera: false, stelle: {}, v: 2 },
  { tappa: 2, libera: false, v: 2, stelle: { [CAMPAGNE[0].id]: 3, [CAMPAGNE[1].id]: 7, strana: 2, rotta: 'x' } })
uguale('il voto scritto resta', scritto.stelle[CAMPAGNE[0].id], 3)
uguale('uno fuori scala va a tre', scritto.stelle[CAMPAGNE[1].id], 3)
uguale('un id che non conosciamo non si butta', scritto.stelle.strana, 2)
uguale('un voto che non è un numero sparisce', scritto.stelle.rotta, undefined)
uguale('rimigrare non cambia niente', JSON.stringify(migraMercato({ tappa: 0, libera: false, stelle: {}, v: 2 }, scritto)),
       JSON.stringify(scritto))
for (const sporco of [null, 'x', [], 42, { stelle: [1, 2] }, { stelle: 'tre' }])
  controlla(`un campo sporco (${JSON.stringify(sporco)}) non rompe`,
            typeof migraMercato({ tappa: 0, libera: false, stelle: {}, v: 2 }, sporco).stelle === 'object')

/* ══════════ 4. la migliore resta ══════════ */
const id = CAMPAGNE[0].id
mercatoCompleta(0, CAMPAGNE.length, 3)
uguale('rigiocando bene, tre', mercatoProgresso().stelle[id], 3)
mercatoCompleta(0, CAMPAGNE.length, 1)
uguale('rigiocando peggio non scende', mercatoProgresso().stelle[id], 3)
mercatoCompleta(1, CAMPAGNE.length, 2)
mercatoCompleta(1, CAMPAGNE.length, 1)
uguale('una giornata da due stelle resta a due', mercatoProgresso().stelle[CAMPAGNE[1].id], 2)
mercatoCompleta(2, CAMPAGNE.length, 1)
uguale('e una giornata fatta con una sola stella la tiene, e migliora', mercatoProgresso().stelle[CAMPAGNE[2].id], 1)
mercatoCompleta(2, CAMPAGNE.length, 2)
uguale('migliorando sale', mercatoProgresso().stelle[CAMPAGNE[2].id], 2)
uguale('la tappa non scende rigiocando una giornata vecchia', mercatoProgresso().tappa, 3)
mercatoCompleta(3, CAMPAGNE.length)
uguale('senza dire le stelle ne vale una', mercatoProgresso().stelle[CAMPAGNE[3].id], 1)
mercatoCompleta(3, CAMPAGNE.length, 99)
uguale('e più di tre non si danno', mercatoProgresso().stelle[CAMPAGNE[3].id], 3)

/* si salta una giornata (aperta da fuori): quelle sotto la tappa nuova hanno almeno una stella */
mercatoCompleta(6, CAMPAGNE.length, 2)
persist(); await flush()
await selectPlayer('g1')
m = mercatoProgresso()
uguale('dopo il salvataggio le stelle si rileggono uguali', m.stelle[id] + ':' + m.stelle[CAMPAGNE[6].id], '3:2')
for (let i = 0; i < 7; i++)
  controlla(`la giornata ${i + 1}, sotto la tappa, ha almeno una stella`, m.stelle[CAMPAGNE[i].id] >= 1)
const dalDisco = await load('profilo:g1')
uguale('sul disco stanno accanto alla tappa', typeof dalDisco.mercato.stelle + ':' + dalDisco.mercato.tappa, 'object:7')
uguale('il resto del profilo è rimasto com\'era', dalDisco.totals.clienti, 7)

/* ══════════ 5. la giornata lasciata a metà si ricorda gli intoppi ══════════ */
{
  const t = tappaDi(campagnaDi(1), 1)
  const esposti = esposizione(t)
  const coda = Array.from({ length: CLIENTI_PER_TAPPA }, () => {
    const c = generaCliente(t, esposti)
    return { ...c, restaPazienza: c.pazienza - 2 }
  })
  const g = { idx: 1, nTappa: 1, hud: { cuori: 2, serviti: 4, perfetti: 1, incasso: 2350, intoppi: 2 },
              esposti, coda, momento: 'raccolta', presi: [], piatto: [], digitato: '',
              contoFatto: false, rifiuti: 0, cartello: false, trascorso: 1000,
              monete: { chiesto: 9, dato: 9 } }
  const dato = JSON.parse(JSON.stringify(scrivi(g)))
  uguale('gli intoppi si scrivono', dato.intoppi, 2)
  uguale('e si rileggono: rientrando non si ripartono da zero', leggi(dato).hud.intoppi, 2)
  delete dato.intoppi
  uguale('una sosta scritta prima delle stelle si legge, con zero', leggi(dato).hud.intoppi, 0)
  dato.intoppi = -3
  uguale('e un numero senza senso vale zero', leggi(dato).hud.intoppi, 0)
}

await pulisci()
riassunto('le stelle della bancarella')
