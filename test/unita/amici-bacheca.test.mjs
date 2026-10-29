/* La bacheca sul telefono (docs/core/amici-bacheca.md): cosa c'è nell'istantanea (il giorno, non l'ora), cosa si accetta da
   quella dell'amico, il confronto coi suoi record, e quando si scrive e si rilegge. Il servizio è finto; quello vero lo prova
   servizio/inoltro/prova.mjs. */
import { reactive } from 'vue'
import { istantanea, leggiIstantanea, firma, giornoDi, giorniFa, quandoInParole, controAmici, VERSIONE,
         davantiInParole, controAmiciInParole, recordDegliAmici, quiInParole, dichiarazione, leggiGioco, giochiConAmici }
  from '../../src/amici/istantanea.js'
import { QUANTE_TAPPE as TAPPE_SURVIVORS } from '../../src/giochi/survivors/dati/campagna.js'
import { sincronizza, amiciNelGioco, avviaBacheca, fermaBacheca, COLORI } from '../../src/amici/bacheca.js'
import { dati, carica, accendi, mettiOnline, aggiungi, impara, ricorda } from '../../src/store/amici.js'
import { SCALETTA } from '../../src/data/asteroidi.js'
import { controlla, uguale, riassunto } from '../aiuto/verifica.mjs'

const ugualeJ = (cosa, a, b) => uguale(cosa, JSON.stringify(a), JSON.stringify(b))
const K1 = 'a'.repeat(32), K2 = 'b'.repeat(32)
const ORA = new Date(2026, 9, 29, 17, 42).getTime()

/* ── l'istantanea ── */
{
  const p = { mate: { fila: 7 }, campagne: { mate: { primato: { best: 3400, quando: 5, partite: 2, ultime: [] } } }, best: { math: 900 } }
  const ist = istantanea(p, ORA)
  ugualeJ('dice dove si è arrivati e i record, per gioco', ist.giochi, { mate: { tappa: 7, primati: { '': 3400 } } })
  uguale('e il giorno, non l\'ora', ist.giorno, '2026-10-29')
  controlla('niente ore, minuti o nomi', !/17|42|nome/.test(JSON.stringify(ist).replace(ist.giorno, '')))
  ugualeJ('un record di prima del quaderno vale lo stesso, anche a tappa zero', istantanea({ best: { math: 900 } }, ORA).giochi.mate, { tappa: 0, primati: { '': 900 } })
  uguale('la fila oltre la fine è il volo infinito', istantanea({ mate: { fila: 999 } }, ORA).giochi.mate.tappa, SCALETTA.length)
  ugualeJ('chi non ha mai giocato non dice niente di quel gioco', istantanea({ mate: { fila: 0 } }, ORA).giochi, {})
  controlla('la firma non guarda il giorno', firma(istantanea(p, ORA)) === firma(istantanea(p, ORA + 3 * 86_400_000)))
  const sur = c => istantanea({ campagne: { survivors: c } }, ORA).giochi.survivors
  ugualeJ('Survivors, di serie: il cursore della campagna e il record della sopravvivenza', sur({ tappa: 4, primato: { best: 190, quando: 1, partite: 1, ultime: [] } }), { tappa: 4, primati: { '': 190 } })
  uguale('a campagna finita si è alla sopravvivenza', sur({ tappa: 2, libera: true }).tappa, TAPPE_SURVIVORS)
  uguale('il cursore non va oltre', sur({ tappa: 99 }).tappa, TAPPE_SURVIVORS)
  uguale('il record di prima (cfg.primato) vale lo stesso', sur({ tappa: 0, cfg: { primato: 75 } }).primati[''], 75)
  uguale('il giorno è quello del telefono', giornoDi(new Date(2026, 0, 5, 23, 59).getTime()), '2026-01-05')
}

/* ── le dichiarazioni dei giochi ── */
{
  const gioco = (amici, senzaFine = null) => ({ chiave: 'prova', amici, senzaFine })
  const d = dichiarazione(gioco(true))
  controlla('«amici: true»: solo record, nessuna tappa', d.tappe === 0 && d.tappa({}) === 0 && d.dove === '')
  const due = { misura: 'tempo', nome: 'x', icona: 'x', che: 'x', sfide: [{ chiave: 'bosco' }, { chiave: 'neve' }] }
  ugualeJ('più sfide: un record per sfida, sotto la sua chiave',
    leggiGioco({ campagne: { prova: { tappa: 3, primati: { bosco: { best: 40 }, neve: { best: 0 } } } } }, gioco({ tappe: 5 }, due)), { tappa: 3, primati: { bosco: 40 } })
  ugualeJ('una tappa letta dal gioco, tenuta dentro le sue tappe',
    leggiGioco({ x: 12 }, gioco({ tappe: 8, tappa: p => p.x })), { tappa: 8, primati: {} })
  ugualeJ('i giochi che mostrano gli amici sono quelli che lo dichiarano', giochiConAmici().map(g => g.chiave).sort(), ['mate', 'survivors'])
  controlla('ogni dichiarazione ha tappe intere, e un «dove» se ha tappe', giochiConAmici().every(g => {
    const x = dichiarazione(g)
    return Number.isInteger(x.tappe) && (!x.tappe || x.dove)
  }))
}

/* ── quella dell'amico ── */
{
  const buona = { v: VERSIONE, giorno: '2026-10-27', giochi: { mate: { tappa: 12, primati: { '': 3100 } } } }
  ugualeJ('una buona si tiene', leggiIstantanea(buona), buona)
  controlla('un\'altra versione o un giorno storto no', leggiIstantanea({ ...buona, v: 99 }) === null && leggiIstantanea({ ...buona, giorno: '27/10' }) === null)
  ugualeJ('i giochi che non conosciamo si lasciano', leggiIstantanea({ ...buona, giochi: { ...buona.giochi, boh: { tappa: 1 } } }).giochi, buona.giochi)
  ugualeJ('le sfide che il gioco non ha si lasciano', leggiIstantanea({ ...buona, giochi: { mate: { tappa: 2, primati: { '': 5, neve: 9 } } } }).giochi, { mate: { tappa: 2, primati: { '': 5 } } })
  ugualeJ('solo numeri storti: quel gioco non c\'è, e i campi in più non passano',
    leggiIstantanea({ ...buona, giochi: { mate: { tappa: -3, primati: { '': 12.5 }, nome: 'x' } } }), { ...buona, giochi: {} })
  ugualeJ('un numero solo buono basta', leggiIstantanea({ ...buona, giochi: { mate: { tappa: 4, primati: { '': 'tanti' } } } }).giochi, { mate: { tappa: 4, primati: {} } })
  uguale('una tappa oltre la mappa si tiene alla fine', leggiIstantanea({ ...buona, giochi: { mate: { tappa: 999 } } }).giochi.mate.tappa, SCALETTA.length)
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
  let risposta = { altro: { v: VERSIONE, giorno: giornoDi(Date.now()), giochi: { mate: { tappa: 9, primati: { '': 2500 } } } } }
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
  uguale('e l\'istantanea di adesso', c.corpo.dati.giochi.mate.tappa, 3)
  controlla('quella dell\'amico si tiene', dati.amici[0].bacheca?.giochi.mate.tappa === 9)
  ugualeJ('ma senza il nome non si mostra (non si sono ancora incontrati)', amiciNelGioco('mate'), [])
  impara(K1, 'leonardo1', 'leonardo')
  const [leo] = amiciNelGioco('mate')
  controlla('col nome sì: iniziale, colore, tappa, record, quando',
    leo && leo.nome === 'leonardo' && leo.iniziale === 'L' && leo.colore === COLORI[0] && leo.tappa === 9 && leo.primati[''] === 2500 && leo.quando === 'oggi')

  chieste.length = 0
  await sincronizza()
  controlla('senza cambi non si riscrive: si legge soltanto', chieste.length === 1 && chieste[0].corpo.dati === null)
  p.mate.fila = 4
  chieste.length = 0
  await sincronizza()
  uguale('un cambio si scrive', chieste[0].corpo.dati?.giochi.mate.tappa, 4)

  await mettiOnline(false)
  chieste.length = 0
  await sincronizza({ forza: true })
  controlla('«mi vedono online» spento: si legge e non si scrive', chieste.length === 1 && chieste[0].corpo.dati === null)
  await mettiOnline(true)

  rete = false
  p.mate.fila = 5
  await sincronizza()
  controlla('senza rete: nessun errore, e l\'amico resta com\'era', dati.amici[0].bacheca.giochi.mate.tappa === 9)
  rete = true
  chieste.length = 0
  await sincronizza()
  uguale('la scrittura mancata si rifà alla prima occasione', chieste[0].corpo.dati?.giochi.mate.tappa, 5)

  risposta = { altro: null }
  await sincronizza({ forza: true })
  controlla('una bacheca scaduta sul servizio non butta quella tenuta qui', dati.amici[0].bacheca.giochi.mate.tappa === 9)
  risposta = { altro: { v: VERSIONE + 1, giorno: '2026-10-20', giochi: { mate: { tappa: 1 } } } }
  await sincronizza({ forza: true })
  controlla('una che non sappiamo leggere nemmeno', dati.amici[0].bacheca.giochi.mate.tappa === 9)

  aggiungi(K2); impara(K2, 'melody001', 'Melody')
  ricorda(K2, { v: VERSIONE, giorno: '2026-10-20', giochi: { mate: { tappa: 1, primati: {} } } })
  const due = amiciNelGioco('mate', ORA)
  controlla('due amici, due colori', due.length === 2 && due[0].colore !== due[1].colore)
  uguale('e ognuno dice quando', due[1].quando, '9 giorni fa')
  await carica('provabacheca')
  controlla('quello che si è letto resta anche dopo, offline', dati.amici[0].bacheca?.giochi.mate.tappa === 9 && dati.amici[1].bacheca?.giochi.mate.tappa === 1)
  fermaBacheca()
  await accendi(false)
}
riassunto('amici: la bacheca sul telefono')
