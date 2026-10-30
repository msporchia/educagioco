/* La bacheca sul telefono (docs/core/amici-bacheca.md): cosa c'è nell'istantanea (il giorno, non l'ora), cosa si accetta da
   quella dell'amico, il confronto coi suoi record, e quando si scrive e si rilegge. Il servizio è finto; quello vero lo prova
   servizio/inoltro/prova.mjs. */
import { reactive } from 'vue'
import { istantanea, leggiIstantanea, firma, giornoDi, giorniFa, quandoInParole, controAmici, VERSIONE,
         davantiInParole, controAmiciInParole, recordDegliAmici, quiInParole, dichiarazione, leggiGioco, giochiConAmici, percorsoDi,
         sorpassi, davantiIn, sorpassoInParole }
  from '../../src/amici/istantanea.js'
import { QUANTE_TAPPE as TAPPE_SURVIVORS } from '../../src/giochi/survivors/dati/campagna.js'
import { QUANTE_TAPPE as TAPPE_ROBOT } from '../../src/giochi/costruttore/dati/campagna.js'
import { QUANTE_TAPPE as TAPPE_CONTA } from '../../src/giochi/conta/dati/campagna.js'
import { QUANTE_TAPPE as TAPPE_SOTTERRANEO } from '../../src/giochi/sotterraneo/dati/campagna.js'
import { TAPPE as TAPPE_INGLESE } from '../../src/giochi/inglese/dati/mondi.js'
import { TAPPE as TAPPE_SPAGNOLO } from '../../src/giochi/spagnolo/dati/mondi.js'
import { RACCONTO as TAPPE_CASTELLO } from '../../src/data/campagne-castello.js'
import { CAMPAGNE as GIORNATE_BANCARELLA } from '../../src/data/bancarella.js'
import { STRADE } from '../../src/giochi/passo-passo/motore/strade.js'
import { sincronizza, amiciNelGioco, avviaBacheca, fermaBacheca, COLORI, sorpassiDaDire } from '../../src/amici/bacheca.js'
import { dati, carica, accendi, mettiOnline, aggiungi, impara, ricorda, togli, levaSorpassi } from '../../src/store/amici.js'
import { SCALETTA } from '../../src/data/asteroidi.js'
import { controlla, uguale, riassunto } from '../aiuto/verifica.mjs'

const ugualeJ = (cosa, a, b) => uguale(cosa, JSON.stringify(a), JSON.stringify(b))
const K1 = 'a'.repeat(32), K2 = 'b'.repeat(32)
const ORA = new Date(2026, 9, 29, 17, 42).getTime()

/* ── l'istantanea ── */
{
  const p = { mate: { fila: 7 }, campagne: { mate: { primato: { best: 3400, quando: 5, partite: 2, ultime: [] } } }, best: { math: 900 } }
  const ist = istantanea(p, ORA)
  ugualeJ('dice dove si è arrivati e i record, per gioco', ist.giochi, { mate: { posti: { '': 7 }, primati: { '': 3400 } } })
  uguale('e il giorno, non l\'ora', ist.giorno, '2026-10-29')
  controlla('niente ore, minuti o nomi', !/17|42|nome/.test(JSON.stringify(ist).replace(ist.giorno, '')))
  ugualeJ('un record di prima del quaderno vale lo stesso, anche a tappa zero', istantanea({ best: { math: 900 } }, ORA).giochi.mate, { posti: {}, primati: { '': 900 } })
  uguale('la fila oltre la fine è il volo infinito', istantanea({ mate: { fila: 999 } }, ORA).giochi.mate.posti[''], SCALETTA.length)
  ugualeJ('chi non ha mai giocato non dice niente di quel gioco', istantanea({ mate: { fila: 0 } }, ORA).giochi, {})
  controlla('la firma non guarda il giorno', firma(istantanea(p, ORA)) === firma(istantanea(p, ORA + 3 * 86_400_000)))
  const sur = c => istantanea({ campagne: { survivors: c } }, ORA).giochi.survivors
  ugualeJ('Survivors, di serie: il cursore della campagna e il record della sopravvivenza', sur({ tappa: 4, primato: { best: 190, quando: 1, partite: 1, ultime: [] } }), { posti: { '': 4 }, primati: { '': 190 } })
  uguale('a campagna finita si è alla sopravvivenza', sur({ tappa: 2, libera: true }).posti[''], TAPPE_SURVIVORS)
  uguale('il cursore non va oltre', sur({ tappa: 99 }).posti[''], TAPPE_SURVIVORS)
  uguale('il record di prima (cfg.primato) vale lo stesso', sur({ tappa: 0, cfg: { primato: 75 } }).primati[''], 75)
  uguale('il giorno è quello del telefono', giornoDi(new Date(2026, 0, 5, 23, 59).getTime()), '2026-01-05')
}

/* ── le dichiarazioni dei giochi ── */
{
  const gioco = (amici, senzaFine = null) => ({ chiave: 'prova', amici, senzaFine })
  const d = dichiarazione(gioco(true))
  controlla('«amici: true»: solo record, nessun percorso', d.percorsi.length === 0)
  const due = { misura: 'tempo', nome: 'x', icona: 'x', che: 'x', sfide: [{ chiave: 'bosco' }, { chiave: 'neve' }] }
  ugualeJ('più sfide: un record per sfida, sotto la sua chiave',
    leggiGioco({ campagne: { prova: { tappa: 3, primati: { bosco: { best: 40 }, neve: { best: 0 } } } } }, gioco({ tappe: 5 }, due)), { posti: { '': 3 }, primati: { bosco: 40 } })
  ugualeJ('una tappa letta dal gioco, tenuta dentro le sue tappe',
    leggiGioco({ x: 12 }, gioco({ tappe: 8, tappa: p => p.x })), { posti: { '': 8 }, primati: {} })
  const dueStrade = gioco({ percorsi: { coniglio: { tappe: 10, dove: 'al sentiero', tappa: p => p.c }, cane: { tappe: 6, tappa: p => p.k } } })
  ugualeJ('più percorsi: un posto per percorso, e chi in uno non ha fatto niente lì non c\'è',
    leggiGioco({ c: 4, k: 0 }, dueStrade), { posti: { coniglio: 4 }, primati: {} })
  controlla('un percorso di più d\'uno non ha il cursore di serie', percorsoDi(gioco({ percorsi: { a: { tappe: 3 } } }), 'a').tappa({ campagne: { prova: { tappa: 2 } } }) === 0)
  controlla('e si trova per chiave', percorsoDi(dueStrade, 'cane').tappe === 6 && percorsoDi(dueStrade, 'boh') === null)
  ugualeJ('i giochi che mostrano gli amici sono quelli che lo dichiarano', giochiConAmici().map(g => g.chiave).sort(), ['arena', 'bancarella', 'codice', 'conta', 'costruttore', 'giardino', 'inglese', 'mate', 'passo', 'pozioni', 'prima', 'sotterraneo', 'spagnolo', 'survivors', 'torri'])
  // Il Robot: di serie il cursore della campagna (il livello da fare, che è dove sta il suo robot), a campagna finita il cantiere libero
  const robot = c => istantanea({ campagne: { costruttore: c } }, ORA).giochi.costruttore
  ugualeJ('Il Robot: il livello da fare, e nessun record', robot({ tappa: 5, stelle: { 0: 2 } }), { posti: { '': 5 }, primati: {} })
  uguale('Il Robot: finiti tutti i livelli si è al cantiere libero', robot({ tappa: TAPPE_ROBOT, libera: true }).posti[''], TAPPE_ROBOT)
  // Conta gli animali: il cursore della campagna (la tappa con `adesso` nella mappa), niente record; finita, il nodo dopo l'ultima
  const conta = c => istantanea({ campagne: { conta: c } }, ORA).giochi.conta
  ugualeJ('Conta: la tappa da fare, e nessun record', conta({ tappa: 4, stelle: { 0: 3 } }), { posti: { '': 4 }, primati: {} })
  uguale('Conta: finite le tappe si è dopo l\'ultima', conta({ tappa: TAPPE_CONTA }).posti[''], TAPPE_CONTA)
  // Il sotterraneo: il cursore di serie è il massimo fra gli eroi (docs/sotterraneo/avventure.md); finite le sette discese, l'abisso (il nodo dopo l'ultima)
  const sotterraneo = c => istantanea({ campagne: { sotterraneo: c } }, ORA).giochi.sotterraneo
  ugualeJ('Il sotterraneo: la discesa da fare, e nessun record', sotterraneo({ tappa: 3, stelle: { 0: 2 } }), { posti: { '': 3 }, primati: {} })
  uguale('Il sotterraneo: il massimo fra gli eroi, non l\'avventura aperta', sotterraneo({ tappa: 5, cfg: { eroe: 'mago', avventure: { mago: { tappa: 1 }, nano: { tappa: 5 } } } }).posti[''], 5)
  uguale('Il sotterraneo: finite le sette discese si è all\'abisso', sotterraneo({ tappa: TAPPE_SOTTERRANEO, libera: true }).posti[''], TAPPE_SOTTERRANEO)
  controlla('Il sotterraneo: chi non è sceso non c\'è', sotterraneo({ tappa: 0 }) === undefined)
  // English: le tappe vinte stanno sotto l'id (non nel cursore), la mappa mette il segno sulla prima non vinta nella fila dei mondi
  const inglese = c => istantanea({ campagne: { inglese: c } }, ORA).giochi.inglese
  const vinteFino = n => ({ vinte: Object.fromEntries(TAPPE_INGLESE.slice(0, n).map(t => [t.id, 1])) })
  ugualeJ('English: la tappa da fare, e nessun record', inglese(vinteFino(5)), { posti: { '': 5 }, primati: {} })
  uguale('English: non conta il cursore ma le vinte (anche a salti: la prima non vinta)', inglese({ tappa: 9, vinte: { [TAPPE_INGLESE[0].id]: 1, [TAPPE_INGLESE[2].id]: 1 } }).posti[''], 1)
  uguale('English: un mondo dopo l\'altro, il segno passa alla prima tappa del successivo', inglese(vinteFino(12)).posti[''], 12)
  uguale('English: vinte tutte, si è in fondo alla mappa', inglese(vinteFino(TAPPE_INGLESE.length)).posti[''], TAPPE_INGLESE.length)
  controlla('English: chi non ha vinto niente non c\'è, e una chiave vecchia non lo sposta', inglese({ vinte: {} }) === undefined && inglese({ vinte: { 'en:vecchia': 1 } }) === undefined)
  // Español: come English, la prima tappa non vinta nella fila dei mondi
  const spagnolo = c => istantanea({ campagne: { spagnolo: c } }, ORA).giochi.spagnolo
  const vinteSp = n => ({ vinte: Object.fromEntries(TAPPE_SPAGNOLO.slice(0, n).map(t => [t.id, 1])) })
  ugualeJ('Español: la tappa da fare, e nessun record', spagnolo(vinteSp(5)), { posti: { '': 5 }, primati: {} })
  uguale('Español: non conta il cursore ma le vinte (anche a salti: la prima non vinta)', spagnolo({ tappa: 9, vinte: { [TAPPE_SPAGNOLO[0].id]: 1, [TAPPE_SPAGNOLO[2].id]: 1 } }).posti[''], 1)
  uguale('Español: vinte tutte, si è in fondo alla mappa', spagnolo(vinteSp(TAPPE_SPAGNOLO.length)).posti[''], TAPPE_SPAGNOLO.length)
  controlla('Español: chi non ha vinto niente non c\'è', spagnolo({ vinte: {} }) === undefined)
  // Il castello: la tappa da fare sta in `profile.td`, non nelle campagne; finita la campagna, le partite libere al centro; i record per sfida
  const castello = (td, torri = {}) => istantanea({ td, campagne: { torri } }, ORA).giochi.torri
  uguale('Il castello: la tappa da fare è quella del regno (profile.td)', castello({ tappa: 7, libera: false }).posti[''], 7)
  uguale('Il castello: finita la campagna si è alle partite libere', castello({ tappa: TAPPE_CASTELLO.length, libera: true }).posti[''], TAPPE_CASTELLO.length)
  uguale('Il castello: libera accesa anche con la tappa indietro (un salvataggio vecchio)', castello({ tappa: 3, libera: true }).posti[''], TAPPE_CASTELLO.length)
  uguale('Il castello: la tappa non va oltre il regno', castello({ tappa: 99, libera: false }).posti[''], TAPPE_CASTELLO.length)
  controlla('Il castello: chi non ha vinto niente non ha un posto', castello({ tappa: 0, libera: false }) === undefined)
  uguale('Il castello: i campagne.torri non contano per la tappa', castello({ tappa: 2 }, { tappa: 15, libera: true }).posti[''], 2)
  ugualeJ('Il castello: un record per partita libera, sotto la chiave della sfida',
    castello({ tappa: TAPPE_CASTELLO.length, libera: true }, { primati: { 'libera-bosco': { best: 30 }, 'libera-mura': { best: 12 } } }),
    { posti: { '': TAPPE_CASTELLO.length }, primati: { 'libera-bosco': 30, 'libera-mura': 12 } })
  // La bancarella: la giornata da fare sta in `profile.mercato` (non nelle campagne); finite le sedici, la libera del Cairo; niente record
  const bancarella = (mercato, campagne = {}) => istantanea({ mercato, campagne: { bancarella: campagne } }, ORA).giochi.bancarella
  ugualeJ('La bancarella: la giornata da fare, e nessun record', bancarella({ tappa: 7, libera: false, stelle: { banchetto: 3 } }), { posti: { '': 7 }, primati: {} })
  uguale('La bancarella: a campagna finita si è alla libera, dopo l\'ultima giornata', bancarella({ tappa: GIORNATE_BANCARELLA.length, libera: true }).posti[''], GIORNATE_BANCARELLA.length)
  uguale('La bancarella: la tappa non va oltre la libera', bancarella({ tappa: 99, libera: true }).posti[''], GIORNATE_BANCARELLA.length)
  uguale('La bancarella: i campagne.bancarella non contano per la tappa', bancarella({ tappa: 2 }, { tappa: 9, libera: true }).posti[''], 2)
  controlla('La bancarella: chi non ha finito niente non ha un posto', bancarella({ tappa: 0, libera: false }) === undefined)
  // Passo passo: un posto per strada, la tappa di adesso di quel protagonista (come la mappa), in fondo il sentiero
  const passo = c => istantanea({ campagne: { passo: c } }, ORA).giochi.passo
  const { coniglio, cane } = STRADE
  ugualeJ('Passo passo: chi non ha fatto niente non c\'è', passo({ tappa: 0, cfg: {} }), undefined)
  ugualeJ('Passo passo: la tappa di adesso del coniglio è il suo posto sulla strada', passo({ tappa: 3, stelle: { 0: 1, 1: 1, 2: 1 }, cfg: { ultima: 2 } }).posti, { coniglio: 3 })
  ugualeJ('e il cane, che ha la sua strada, non c\'è finché non ha cominciato', passo({ tappa: 0, stelle: { 0: 1 }, cfg: {} }).posti, { coniglio: 1 })
  const fattaTutta = Object.fromEntries(coniglio.map(i => [i, 1]))
  ugualeJ('fatta la strada del coniglio, è al suo sentiero e il cane comincia', passo({ tappa: 0, stelle: fattaTutta, cfg: { ultima: coniglio.at(-1) } }).posti, { coniglio: coniglio.length })
  const caneFatta = { ...fattaTutta, ...Object.fromEntries(cane.slice(0, 2).map(i => [i, 1])) }
  ugualeJ('il cane a metà ha il suo posto, indipendente', passo({ tappa: 0, stelle: caneFatta, cfg: { ultima: cane[1] } }).posti, { coniglio: coniglio.length, cane: 2 })
  ugualeJ('ognuno ha il suo record', passo({ tappa: 0, stelle: { 0: 1 }, cfg: {}, primati: { cane: { best: 4, quando: 1, partite: 1, ultime: [] } } }).primati, { cane: 4 })
  controlla('ogni percorso dichiarato ha tappe intere e un «dove»', giochiConAmici().every(g =>
    dichiarazione(g).percorsi.every(x => Number.isInteger(x.tappe) && x.tappe > 0 && x.dove)))
}

/* ── quella dell'amico ── */
{
  const buona = { v: VERSIONE, giorno: '2026-10-27', giochi: { mate: { posti: { '': 12 }, primati: { '': 3100 } } } }
  ugualeJ('una buona si tiene', leggiIstantanea(buona), buona)
  controlla('un\'altra versione o un giorno storto no', leggiIstantanea({ ...buona, v: 99 }) === null && leggiIstantanea({ ...buona, giorno: '27/10' }) === null)
  ugualeJ('i giochi che non conosciamo si lasciano', leggiIstantanea({ ...buona, giochi: { ...buona.giochi, boh: { posti: { '': 1 } } } }).giochi, buona.giochi)
  ugualeJ('le sfide che il gioco non ha si lasciano', leggiIstantanea({ ...buona, giochi: { mate: { posti: { '': 2, neve: 3 }, primati: { '': 5, neve: 9 } } } }).giochi, { mate: { posti: { '': 2 }, primati: { '': 5 } } })
  ugualeJ('solo numeri storti: quel gioco non c\'è, e i campi in più non passano',
    leggiIstantanea({ ...buona, giochi: { mate: { posti: { '': -3 }, primati: { '': 12.5 }, nome: 'x' } } }), { ...buona, giochi: {} })
  ugualeJ('un numero solo buono basta', leggiIstantanea({ ...buona, giochi: { mate: { posti: { '': 4 }, primati: { '': 'tanti' } } } }).giochi, { mate: { posti: { '': 4 }, primati: {} } })
  uguale('una tappa oltre la mappa si tiene alla fine', leggiIstantanea({ ...buona, giochi: { mate: { posti: { '': 999 } } } }).giochi.mate.posti[''], SCALETTA.length)
  controlla('roba che non è un\'istantanea: null', leggiIstantanea(null) === null && leggiIstantanea('ciao') === null && leggiIstantanea([]) === null)
}

/* ── quanto è vecchia ── */
{
  uguale('oggi', quandoInParole('2026-10-29', ORA), 'oggi')
  uguale('ieri', quandoInParole('2026-10-28', ORA), 'ieri')
  uguale('tre giorni fa', quandoInParole('2026-10-26', ORA), '3 giorni fa')
  uguale('a cavallo del mese', giorniFa('2026-09-30', ORA), 29)
  uguale('l\'orologio dell\'amico avanti non dà giorni negativi', giorniFa('2026-10-31', ORA), 0)
  uguale('un giorno storto non dice niente', quandoInParole('ieri', ORA), '')
}

/* ── contro i record degli amici ── */
{
  const amici = [{ nome: 'Leo', record: 3000 }, { nome: 'Mel', record: 3500 }, { nome: 'Ugo', record: 0 }]
  let r = controAmici(3200, 2800, amici)
  ugualeJ('superato chi stava sopra il record di prima', r.superati.map(a => a.nome), ['Leo'])
  controlla('e il prossimo è il più basso ancora sopra, con quanto è mancato', r.prossimo.nome === 'Mel' && r.prossimo.mancano === 300)
  r = controAmici(3200, 3100, amici)
  controlla('chi era già sotto il record di prima non è una notizia', r.superati.length === 0)
  r = controAmici(3000, 2000, amici)
  controlla('un pareggio non supera', r.superati.length === 0 && r.prossimo.nome === 'Mel')
  r = controAmici(3001, 3000, amici)
  controlla('chi era pari e adesso è sotto, sì', r.superati.map(a => a.nome).join() === 'Leo')
  r = controAmici(4000, 0, amici)
  controlla('due superati in una volta, dal più alto; nessuno sopra', r.superati.map(a => a.nome).join() === 'Mel,Leo' && r.prossimo === null)
  controlla('chi non ha record non conta', !controAmici(10, 0, amici).superati.length && controAmici(10, 0, amici).prossimo.nome === 'Leo')
}

/* ── le frasi, uguali in ogni gioco ── */
{
  const amici = [{ nome: 'Leo', tappa: 6, record: 190 }, { nome: 'Mel', tappa: 4, record: 0 }, { nome: 'Ugo', tappa: 9, record: 250 }]
  uguale('chi è da raggiungere: il più vicino fra quelli avanti', davantiInParole(amici, 3), 'Mel è una tappa più avanti di te.')
  uguale('con più tappe', davantiInParole(amici, 4, { ultimo: 9, dove: 'alla sopravvivenza' }), 'Leo è 2 tappe più avanti di te.')
  uguale('e chi è già alla sfida senza fine', davantiInParole(amici, 7, { ultimo: 9, dove: 'alla sopravvivenza' }), 'Ugo è già alla sopravvivenza.')
  uguale('chi è dietro non si dice', davantiInParole(amici, 9), '')
  uguale('i record degli amici, dal più alto, in parole', recordDegliAmici(amici, 'tempo').map(a => `${a.nome} ${a.record}`).join(', '), 'Ugo 4:10, Leo 3:10')
  uguale('superato uno, con la misura', controAmiciInParole(controAmici(200, 100, amici), 'tempo'), 'Hai superato Leo (3:10)!')
  uguale('superati due', controAmiciInParole(controAmici(300, 100, amici), 'tempo'), 'Hai superato Ugo e Leo!')
  uguale('e quanto è mancato al prossimo', controAmiciInParole(controAmici(120, 200, amici), 'tempo'), 'Per Leo (3:10) ti sono mancati 70s')
  uguale('nessuno con un record: niente', controAmiciInParole(controAmici(10, 0, []), 'tempo'), '')
  uguale('chi è qui, uno', quiInParole([{ nome: 'Leo' }]), 'Leo è qui')
  uguale('chi è qui, tre', quiInParole([{ nome: 'Leo' }, { nome: 'Mel' }, { nome: 'Ugo' }]), 'Leo, Mel e Ugo sono qui')
}

/* ── la sincronia ── */
{
  const chieste = []
  let risposta = { altro: { v: VERSIONE, giorno: giornoDi(Date.now()), giochi: { mate: { posti: { '': 9 }, primati: { '': 2500 } } } } }
  let rete = true
  const fetchImpl = async (url, o) => {
    if (!rete) throw new Error('niente rete')
    chieste.push({ url, corpo: JSON.parse(o.body) })
    return { status: 200, ok: true, json: async () => risposta }
  }
  const p = reactive({ mate: { fila: 3 } })
  await carica('provabacheca')
  aggiungi(K1)
  avviaBacheca({ profilo: () => p, servizio: 'https://s.example', fetchImpl })
  await sincronizza({ forza: true })
  controlla('spenti dai grandi: nessuna richiesta', chieste.length === 0)
  ugualeJ('e nessun amico da mostrare', amiciNelGioco('mate'), [])
  fermaBacheca()

  await accendi(true)
  avviaBacheca({ profilo: () => p, servizio: 'https://s.example', fetchImpl })
  await sincronizza({ forza: true })
  uguale('una richiesta per amicizia', chieste.length, 1)
  const c = chieste[0]
  controlla('alla bacheca, con la chiave e l\'id del bambino', c.url === 'https://s.example/amici/bacheca' && c.corpo.chiave === K1 && c.corpo.id === dati.id)
  uguale('e l\'istantanea di adesso', c.corpo.dati.giochi.mate.posti[''], 3)
  controlla('quella dell\'amico si tiene', dati.amici[0].bacheca?.giochi.mate.posti[''] === 9)
  ugualeJ('ma senza il nome non si mostra (non si sono ancora incontrati)', amiciNelGioco('mate'), [])
  impara(K1, 'leonardo1', 'leonardo')
  const [leo] = amiciNelGioco('mate')
  controlla('col nome sì: iniziale, colore, tappa, record, quando',
    leo && leo.nome === 'leonardo' && leo.iniziale === 'L' && leo.colore === COLORI[0] && leo.posti[''] === 9 && leo.primati[''] === 2500 && leo.quando === 'oggi')

  chieste.length = 0
  await sincronizza()
  controlla('senza cambi non si riscrive: si legge soltanto', chieste.length === 1 && chieste[0].corpo.dati === null)
  p.mate.fila = 4
  chieste.length = 0
  await sincronizza()
  uguale('un cambio si scrive', chieste[0].corpo.dati?.giochi.mate.posti[''], 4)

  await mettiOnline(false)
  chieste.length = 0
  await sincronizza({ forza: true })
  controlla('«mi vedono online» spento: si legge e non si scrive', chieste.length === 1 && chieste[0].corpo.dati === null)
  await mettiOnline(true)

  rete = false
  p.mate.fila = 5
  await sincronizza()
  controlla('senza rete: nessun errore, e l\'amico resta com\'era', dati.amici[0].bacheca.giochi.mate.posti[''] === 9)
  rete = true
  chieste.length = 0
  await sincronizza()
  uguale('la scrittura mancata si rifà alla prima occasione', chieste[0].corpo.dati?.giochi.mate.posti[''], 5)

  risposta = { altro: null }
  await sincronizza({ forza: true })
  controlla('una bacheca scaduta sul servizio non butta quella tenuta qui', dati.amici[0].bacheca.giochi.mate.posti[''] === 9)
  risposta = { altro: { v: VERSIONE + 1, giorno: '2026-10-20', giochi: { mate: { posti: { '': 1 } } } } }
  await sincronizza({ forza: true })
  controlla('una che non sappiamo leggere nemmeno', dati.amici[0].bacheca.giochi.mate.posti[''] === 9)

  aggiungi(K2); impara(K2, 'melody001', 'Melody')
  ricorda(K2, { v: VERSIONE, giorno: '2026-10-20', giochi: { mate: { posti: { '': 1 }, primati: {} } } })
  const due = amiciNelGioco('mate', ORA)
  controlla('due amici, due colori', due.length === 2 && due[0].colore !== due[1].colore)
  uguale('e ognuno dice quando', due[1].quando, '9 giorni fa')
  await carica('provabacheca')
  controlla('quello che si è letto resta anche dopo, offline', dati.amici[0].bacheca?.giochi.mate.posti[''] === 9 && dati.amici[1].bacheca?.giochi.mate.posti[''] === 1)
  fermaBacheca()
  await accendi(false)
}
/* ── «ti ha superato» ── */
{
  const ist = (posto, record) => ({ v: VERSIONE, giorno: '2026-10-29', giochi: { mate: { posti: posto ? { '': posto } : {}, primati: record ? { '': record } : {} } } })
  const io = ist(5, 3000)
  ugualeJ('passato davanti sulla mappa', sorpassi(ist(4, 0), ist(7, 0), io), [{ gioco: 'mate', tipo: 'tappa' }])
  ugualeJ('ha battuto il mio record', sorpassi(ist(2, 2900), ist(2, 3100), io), [{ gioco: 'mate', tipo: 'record' }])
  ugualeJ('tutti e due: uno per gioco, la tappa', sorpassi(ist(4, 2900), ist(7, 3100), io), [{ gioco: 'mate', tipo: 'tappa' }])
  ugualeJ('era già davanti: niente di nuovo', sorpassi(ist(6, 0), ist(8, 0), io), [])
  ugualeJ('pari non è superare', sorpassi(ist(4, 0), ist(5, 0), io), [])
  ugualeJ('la prima istantanea di un amico non supera nessuno', sorpassi(null, ist(9, 9000), io), [])
  ugualeJ('dove io non ho mai giocato non mi supera nessuno', sorpassi(ist(1, 0), ist(9, 0), ist(0, 3000)), [])
  ugualeJ('un gioco che prima non c\'era conta da zero', sorpassi({ v: VERSIONE, giorno: '2026-10-28', giochi: {} }, ist(7, 0), io), [{ gioco: 'mate', tipo: 'tappa' }])
  controlla('davanti adesso, per la home', davantiIn(ist(7, 0), io, 'mate', 'tappa') && !davantiIn(ist(7, 0), ist(9, 0), 'mate', 'tappa'))
  uguale('le parole: la tappa', sorpassoInParole('Leo', 'tappa'), 'Leo ti ha superato')
  uguale('le parole: il record', sorpassoInParole('Leo', 'record'), 'Leo ha battuto il tuo record')

  let risposta = null
  const fetchImpl = async () => ({ status: 200, ok: true, json: async () => ({ altro: risposta }) })
  const p = reactive({ mate: { fila: 5 } })
  await carica('provasorpassi')
  await accendi(true)
  aggiungi(K1); impara(K1, 'leonardo1', 'Leonardo')
  avviaBacheca({ profilo: () => p, servizio: 'https://s.example', fetchImpl })
  risposta = ist(4, 0); await sincronizza({ forza: true })
  ugualeJ('la prima lettura non dice niente', sorpassiDaDire(['mate']), [])
  risposta = ist(7, 0); await sincronizza({ forza: true })
  const [x] = sorpassiDaDire(['mate'])
  controlla('poi Leonardo passa davanti: una riga, col suo pallino', x && x.nome === 'Leonardo' && x.tipo === 'tappa' && x.iniziale === 'L' && x.colore === COLORI[0])
  ugualeJ('solo nei giochi che il bambino vede', sorpassiDaDire(['torri']), [])
  await carica('provasorpassi')
  uguale('resta anche dopo, finché non si dice', sorpassiDaDire(['mate']).length, 1)
  p.mate.fila = 8
  ugualeJ('ripreso: non c\'è più niente da dire', sorpassiDaDire(['mate']), [])
  p.mate.fila = 5
  levaSorpassi('mate')
  ugualeJ('aperto il gioco, è detto', sorpassiDaDire(['mate']), [])
  risposta = ist(7, 3100); await sincronizza({ forza: true })
  ugualeJ('un suo record dove io non ne ho: niente da dire', sorpassiDaDire(['mate']), [])
  p.mate.fila = 8
  risposta = ist(9, 3100); await sincronizza({ forza: true })
  uguale('ripassa davanti: di nuovo', sorpassiDaDire(['mate'])[0]?.tipo, 'tappa')
  togli(K1)
  ugualeJ('tolto l\'amico, tolti i suoi', dati.sorpassi, [])
  fermaBacheca()
  await accendi(false)
}
riassunto('amici: la bacheca sul telefono')
