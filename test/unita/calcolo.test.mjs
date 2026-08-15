/* ═══════════════════════════════════════════════════════════════════
   IL CALCOLO A MENTE, SENZA BROWSER

   Qui si controlla la parte che nessuno vede giocando, ed è quella che
   decide se il gioco insegna o fa perdere tempo:

     1. il grafo dei prerequisiti sta in piedi (niente cicli, niente
        concetti irraggiungibili, ognuno in una stazione sola)
     2. ogni generatore rispetta il PROPRIO vincolo — il «con riporto»
        riporta davvero, il «senza prestito» non chiede mai in prestito —
        su tante istanze, non su una fortunata
     3. i numeri restano nel mondo del calcolo a mente: interi, positivi,
        entro il mille
     4. la taglia funziona: a forza zero i numeri sono piccoli, a forza
        piena sono grandi
     5. i distrattori non si possono escludere a occhio. È il controllo
        più importante di tutti: con la scelta multipla, un falso troppo
        lontano trasforma il calcolo in un indovinello
     6. il gestore apre e chiude i concetti come deve, tabelline comprese,
        e il decadimento riporta indietro quello che non si ripassa
   ═══════════════════════════════════════════════════════════════════ */
import { CONCETTI, CONCETTI_PER_ID, STAZIONI, VOLO_A_MENTE, TUTTI_I_FATTI,
         TOTALE_ELEMENTI, chiaviDi, eConcettoDiFatti, eFatto, concettoDiChiave,
         chiaveConcetto, fattoDaChiave, esercizioDi, distrattoriDi }
  from '../../src/data/calcolo.js'
import { SALDO, forzaDi, saldo, aperto, frontiera, tagliaDi, poolDi, eNuovo,
         tabellineSalde, prereqDeboli, concettiSaldi, stellaDi, allineaCalcolo,
         sottoPool, QUOTA_TAPPA }
  from '../../src/store/calcolo.js'
import { calcoliTabellina } from '../../src/data/tabelline.js'
import { controlla, uguale, dentro, nota, riassunto } from '../aiuto/verifica.mjs'

const ORA = Date.now()
const CAMPIONI = 200

const unita = n => n % 10
const decine = n => Math.floor(n / 10) % 10
const procedure = CONCETTI.filter(c => !eConcettoDiFatti(c))

/* ═══════════ 1. il grafo ═══════════ */
{
  const ids = CONCETTI.map(c => c.id)
  uguale('gli id dei concetti sono unici', new Set(ids).size, ids.length)

  const orfani = CONCETTI.flatMap(c => (c.prereq || []).filter(p => !CONCETTI_PER_ID[p]))
  uguale('nessun prerequisito punta nel vuoto', orfani.length, 0)

  // un ciclo qui vorrebbe dire un concetto che non si apre mai
  let ciclo = null
  const visita = (id, strada = []) => {
    if (strada.includes(id)) { ciclo = [...strada, id].join(' → '); return }
    for (const p of CONCETTI_PER_ID[id].prereq || []) visita(p, [...strada, id])
  }
  CONCETTI.forEach(c => visita(c.id))
  controlla('il grafo dei prerequisiti è aciclico', !ciclo, ciclo)

  const inStazione = STAZIONI.flatMap(s => s.nuovi)
  uguale('ogni concetto sta in una stazione, una sola volta',
         new Set(inStazione).size, inStazione.length)
  const fuori = ids.filter(id => !inStazione.includes(id))
  uguale('nessun concetto resta fuori dalla campagna', fuori.length, 0, )
  controlla('nessun concetto resta fuori dalla campagna', !fuori.length, fuori.join(', '))

  // un prerequisito non può stare in una stazione successiva: si aprirebbe
  // una tappa che chiede cose che il gioco non ha ancora presentato
  const dove = {}
  STAZIONI.forEach(s => s.nuovi.forEach(id => { dove[id] = s.i }))
  const fuoriOrdine = CONCETTI.flatMap(c =>
    (c.prereq || []).filter(p => dove[p] > dove[c.id]).map(p => `${c.id} ← ${p}`))
  controlla('i prerequisiti stanno sempre in stazioni precedenti o nella stessa',
            !fuoriOrdine.length, fuoriOrdine.join(', '))

  /* LA SCALA. Il cuore della campagna: da 12+6 a 47+29 si aggiunge un pezzo
     da tenere a mente per volta, e ogni gradino sta in una tappa PIÙ AVANTI
     del precedente. Impacchettarne due nella stessa tappa è come non averli
     separati: è così che una partita mescolava 12+6 e 52−27. */
  const SCALE = [
    ['unita-in-piu', 'unita-riporto', 'due-somma', 'somma-riporto', 'arrotonda-somma'],
    ['unita-in-piu', 'unita-prestito', 'due-meno', 'meno-prestito', 'arrotonda-meno'],
  ]
  for (const fila of SCALE) {
    const passi = fila.map(id => STAZIONI.findIndex(s => s.nuovi.includes(id)))
    controlla(`la scala sale un gradino per tappa: ${fila.join(' → ')}`,
              passi.every((v, i) => v >= 0 && (i === 0 || v > passi[i - 1])),
              `tappe ${passi.join(', ')}`)
  }

  nota(`${CONCETTI.length} concetti (${procedure.length} a istanze infinite), ` +
       `${TUTTI_I_FATTI.length} fatti, ${TOTALE_ELEMENTI} elementi in tutto`)
}

/* ═══════════ 2. i fatti ═══════════ */
{
  const doppie = TUTTI_I_FATTI.filter(k => !fattoDaChiave(k))
  uguale('ogni chiave di fatto si rilegge in un esercizio', doppie.length, 0)

  const guasti = TUTTI_I_FATTI.filter(k => {
    const e = fattoDaChiave(k)
    return !Number.isInteger(e.ris) || e.ris < 0 || e.ris > 20
  })
  uguale('nessun fatto esce dal mondo del venti', guasti.length, 0)

  controlla('i fatti si riconoscono dalla chiave', TUTTI_I_FATTI.every(eFatto))
  controlla('e i concetti no', procedure.every(c => !eFatto(chiaveConcetto(c.id))))

  // 5+7 e 7+5 sono lo stesso fatto: la chiave deve essere una sola
  uguale('le somme hanno chiave ordinata',
         chiaviDi('somma-10').filter(k => k === 'calc:7+2').length, 0)
}

/* ═══════════ 3. i generatori rispettano il loro vincolo ═══════════
   Un concetto che si chiama «col riporto» e ogni tanto non ne ha uno non
   allena niente: il bambino impara una regola che a volte non serve. */
const VINCOLI = {
  'decine-somma': e => unita(e.a) === 0 && unita(e.b) === 0 && e.segno === '+',
  'decine-meno': e => unita(e.a) === 0 && unita(e.b) === 0 && e.ris > 0,
  'amici-100': e => e.complemento && e.a + e.ris === 100 && e.ris > 0,
  'unita-in-piu': e => e.b < 10 && decine(e.a) === decine(e.ris),
  'decine-in-piu': e => unita(e.b) === 0 && unita(e.a) === unita(e.ris),
  'due-somma': e => e.a >= 10 && e.b >= 10 && unita(e.a) + unita(e.b) <= 9,
  'due-meno': e => e.a >= 10 && e.b >= 10 && unita(e.a) >= unita(e.b) && e.ris >= 10,
  /* il gradino di mezzo: una cifra sola, ma che scavalca la decina. Se non
     scavalcasse sarebbe `unita-in-piu`, e il concetto non allenerebbe niente */
  'unita-riporto': e => e.a >= 10 && e.b < 10 && unita(e.a) + e.b > 9,
  'unita-prestito': e => e.a >= 10 && e.b < 10 && unita(e.a) < e.b && e.ris > 0,
  /* e questi due vengono dopo: due cifre contro due cifre, sempre, se no
     si sovrappongono al gradino di mezzo */
  'somma-riporto': e => unita(e.a) + unita(e.b) > 9 && e.b >= 10,
  'meno-prestito': e => unita(e.a) < unita(e.b) && e.ris > 0 && e.b >= 10,
  'arrotonda-somma': e => unita(e.b) >= 7 && e.segno === '+',
  'arrotonda-meno': e => unita(e.b) >= 7 && e.ris > 0,
  'per-10': e => e.b === 10 || e.b === 100,
  'per-decine': e => unita(e.b) === 0 && e.b >= 20,
  'spezza-prodotto': e => e.b > 10 && unita(e.b) !== 0 && e.a >= 2 && e.a <= 9,
  'per-9': e => e.a === 9 && e.b > 2,
  'per-11': e => e.a === 11 && e.b > 2,
  'raddoppia-dimezza': e => e.a % 2 === 0 && (e.b === 5 || e.b === 50),
  'divide-tabellina': e => e.b >= 2 && e.b <= 9 && e.a % e.b === 0 && e.ris >= 2,
  'meta': e => e.a % 2 === 0 && e.ris === e.a / 2,
  'decine-divise': e => unita(e.a) === 0 && e.ris % 10 === 0 && e.ris >= 20,
  'quante-volte': e => e.a % e.b !== 0 && e.ris === Math.floor(e.a / e.b),
  'centinaia-somma': e => e.a >= 100 && e.b >= 100 && unita(e.a) === 0 && unita(e.b) === 0,
  'centinaia-meno': e => e.a >= 100 && e.b >= 100 && e.ris > 0 && unita(e.ris) === 0,
  'amici-1000': e => e.complemento && e.a + e.ris === 1000 && e.ris > 0,
  'tre-cifre-somma': e => e.a >= 100 && e.b >= 100,
  'arrotonda-centinaia': e => e.b % 100 >= 95 && e.segno === '+',
}

/* dove la difficoltà non sta nella taglia del risultato ma nella forma:
   quanto spesso il numero da tenere a mente NON è tondo */
const nonTondo = quanto => e => (e.a % quanto === 0 ? 0 : 1)
const MISURA = {
  'amici-100': nonTondo(10),
  'amici-1000': nonTondo(100),
  'centinaia-somma': nonTondo(100),
  'centinaia-meno': nonTondo(100),
  /* qui il risultato cala mentre il minuendo sale: si guarda da dove si parte */
  'arrotonda-meno': e => e.a,
}

for (const c of procedure) {
  const istanze = Array.from({ length: CAMPIONI }, (_, i) =>
    esercizioDi(chiaveConcetto(c.id), { taglia: i / CAMPIONI, tabelline: [2, 3, 4, 5, 6, 7, 8, 9, 10] }))

  const rotti = istanze.filter(e => !e || !Number.isInteger(e.ris) || e.ris < 0)
  uguale(`${c.id}: ogni istanza è un conto vero`, rotti.length, 0)

  const fuori = istanze.filter(e => e.ris > 1000 || e.a > 1000 || e.b > 1000)
  controlla(`${c.id}: si resta entro il mille`, !fuori.length,
            fuori.length ? `es. ${fuori[0].testo} = ${fuori[0].ris}` : '')

  const vincolo = VINCOLI[c.id]
  controlla(`${c.id}: ha un vincolo scritto nel test`, !!vincolo)
  if (vincolo) {
    const sgarri = istanze.filter(e => !vincolo(e))
    controlla(`${c.id}: ${istanze.length} istanze rispettano il vincolo`, !sgarri.length,
              sgarri.length ? `${sgarri.length} sgarri, es. ${sgarri[0].testo}` : '')
  }

  controlla(`${c.id}: la domanda si può leggere`, istanze.every(e => /\?/.test(e.testo)))

  /* la taglia deve contare: facile in fondo alla scala, difficile in cima.
     Quasi sempre «difficile» vuol dire numeri più grandi, ma non per i
     complementi e per le centinaia, dove il risultato sta sotto un tetto e
     a crescere è la FORMA del numero: 60+?=100 è più facile di 65+?=100. */
  const misura = MISURA[c.id] || (e => e.ris)
  const media = t => {
    const v = Array.from({ length: 150 }, () =>
      misura(esercizioDi(chiaveConcetto(c.id),
                         { taglia: t, tabelline: [2, 3, 4, 5, 6, 7, 8, 9] })))
    return v.reduce((s, x) => s + x, 0) / v.length
  }
  const basso = media(0), alto = media(1)
  controlla(`${c.id}: la taglia fa crescere la difficoltà`,
            alto > basso * 1.15 || alto - basso > 0.4,
            `da ${basso.toFixed(2)} a ${alto.toFixed(2)}`)
}

/* ═══════════ 4. i distrattori ═══════════ */
{
  const bersagli = [
    ...procedure.map(c => () => esercizioDi(chiaveConcetto(c.id),
      { taglia: Math.random(), tabelline: [2, 3, 4, 5, 6, 7, 8, 9] })),
    ...TUTTI_I_FATTI.map(k => () => esercizioDi(k)),
  ]

  let massimi = 0, minimi = 0, totali = 0, senzaVicini = null, malfatti = null
  let stessaTaglia = 0
  for (const fai of bersagli) {
    for (let i = 0; i < 12; i++) {
      const e = fai()
      const falsi = distrattoriDi(e, 5)
      totali++
      if (falsi.length < 5) { malfatti = malfatti || `${e.testo}: solo ${falsi.length} falsi` }
      if (new Set(falsi).size !== falsi.length) malfatti = malfatti || `${e.testo}: doppioni`
      if (falsi.some(v => v === e.ris || v < 0 || !Number.isInteger(v)))
        malfatti = malfatti || `${e.testo}: falso non valido [${falsi}]`

      // «vicino» vuol dire che non si distingue a occhio: lì accanto, oppure
      // a una decina di distanza — che è poi l'errore vero, quello di chi
      // sbaglia il riporto o la decina, non un numero preso a caso
      const soglia = Math.max(10, Math.min(e.ris * 0.2, 25))
      const vicini = falsi.filter(v => Math.abs(v - e.ris) <= soglia).length
      if (vicini < 2) senzaVicini = senzaVicini || `${e.testo} = ${e.ris} fra [${falsi}]`
      // e nessuno deve tradirsi dalla scala: un 7 accanto a un 65, o un 1010
      // accanto a un 110, lo scarterebbe anche chi non sa contare
      if (falsi.every(v => v >= e.ris / 2 - 12 && v <= e.ris * 2 + 12)) stessaTaglia++

      const tutti = [...falsi, e.ris]
      if (e.ris === Math.max(...tutti)) massimi++
      if (e.ris === Math.min(...tutti)) minimi++
    }
  }
  controlla('i falsi sono sempre cinque, distinti e validi', !malfatti, malfatti)
  controlla('ogni domanda ha almeno due falsi indistinguibili a occhio',
            !senzaVicini, senzaVicini)
  /* Il giusto non deve essere quasi sempre l'estremo — sarebbe una regola
     da imparare invece di un calcolo — ma nemmeno mai: se non lo è mai,
     scartare il più grande e il più piccolo è una scorciatoia che funziona
     sempre, e sei asteroidi ne valgono quattro. */
  const quotaMax = massimi / totali, quotaMin = minimi / totali
  dentro('a volte il giusto è il bersaglio più grande', quotaMax, 0.05, 0.4)
  dentro('e a volte il più piccolo', quotaMin, 0.05, 0.4)
  const quotaTaglia = stessaTaglia / totali
  uguale('nessun falso è fuori scala rispetto al risultato', quotaTaglia, 1)
  nota(`giusto = più grande nel ${(quotaMax * 100).toFixed(0)}%, ` +
       `più piccolo nel ${(quotaMin * 100).toFixed(0)}% di ${totali} domande`)
}

/* ═══════════ 5. il gestore ═══════════ */

/* un profilo finto: `sa(...)` mette gli elementi a forza piena, e
   `vecchio` li mette lì da un mese senza più toccarli */
const forte = (last = ORA) => ({ s: 4, ok: 6, err: 0, last, seen: 6, t: 1200 })
const MESE = 86400000 * 45
function profiloCon(ids, quando = ORA) {
  const items = {}
  for (const id of ids) {
    if (id.startsWith('tab:')) {
      for (const k of calcoliTabellina(+id.slice(4))) items[k] = forte(quando)
    } else for (const k of chiaviDi(id)) items[k] = forte(quando)
  }
  return items
}

{
  const vuoto = {}
  const f0 = frontiera(vuoto, ORA)
  const senzaPrereq = CONCETTI.filter(c => !(c.prereq || []).length && !c.tabelline).map(c => c.id)
  controlla('a profilo nuovo si lavora solo sui concetti senza prerequisiti',
            f0.every(id => senzaPrereq.includes(id)) && f0.length === senzaPrereq.length,
            `frontiera: ${f0.join(', ')}`)

  const dopo = profiloCon(['somma-10'])
  controlla('imparata una cosa, si aprono quelle che ci stavano sopra',
            aperto('doppi', dopo, ORA) && aperto('meno-10', dopo, ORA))
  /* il `?` in mezzo al conto è un'altra domanda, non un'altra somma: non si
     apre finché non stanno in piedi anche le sottrazioni */
  controlla('ma il «quanto manca» aspetta', !aperto('amici-10', dopo, ORA))
  controlla('e nemmeno quelle più in alto', !aperto('somma-riporto', dopo, ORA))
  uguale('e il concetto imparato regge', saldo('somma-10', dopo, ORA), true)

  /* il decadimento: gli stessi elementi, lasciati lì un mese e mezzo */
  const spento = profiloCon(['somma-10'], ORA - MESE)
  uguale('quello che non si ripassa smette di reggere', saldo('somma-10', spento, ORA), false)
  controlla('e i concetti che ci stavano sopra si richiudono',
            !aperto('doppi', spento, ORA))
  controlla('il concetto decaduto torna in frontiera',
            frontiera(spento, ORA).includes('somma-10'))
}

/* le tabelline nel grafo: moltiplicare a mente non si apre a vuoto */
{
  const base = ['somma-10', 'amici-10', 'doppi', 'meno-10', 'somma-20', 'meno-20',
                'decine-somma', 'decine-meno', 'amici-100', 'unita-in-piu',
                'decine-in-piu', 'due-somma', 'due-meno', 'per-10', 'per-decine']
  const senzaTabelline = profiloCon(base)
  uguale('senza tabelline non ne regge nessuna', tabellineSalde(senzaTabelline, ORA).length, 0)
  controlla('e spezza-prodotto resta chiuso', !aperto('spezza-prodotto', senzaTabelline, ORA))
  controlla('mentre per-10, che è una regola e non una memoria, è aperto',
            aperto('per-10', senzaTabelline, ORA))

  const conTabelline = profiloCon([...base, 'tab:2', 'tab:3', 'tab:4', 'tab:5'])
  uguale('quattro tabelline imparate contano', tabellineSalde(conTabelline, ORA).length, 4)
  controlla('e adesso si può spezzare il prodotto',
            aperto('spezza-prodotto', conTabelline, ORA))

  // il generatore deve pescare fra quelle che reggono, non a caso
  const soloDue = profiloCon([...base, 'tab:2', 'tab:3', 'tab:4', 'tab:5'])
  const fattori = new Set(Array.from({ length: 80 }, () =>
    esercizioDi(chiaveConcetto('spezza-prodotto'),
                { taglia: 0.5, tabelline: tabellineSalde(soloDue, ORA) }).a))
  controlla('e moltiplica per le tabelline che il bambino sa davvero',
            [...fattori].every(n => [2, 3, 4, 5].includes(n)), `ha usato ${[...fattori]}`)
}

/* il pool: cosa finisce davvero in cielo */
{
  const vuoto = {}
  const prima = poolDi(STAZIONI[0], vuoto, ORA, 12)
  controlla('la prima stazione ha di che giocare subito', prima.length >= 5)
  controlla('e chiede solo cose della prima stazione',
            prima.every(k => STAZIONI[0].concetti.includes(concettoDiChiave(k))),
            [...new Set(prima.map(concettoDiChiave))].join(', '))

  /* il pezzo forte: se un prerequisito è venuto giù, si ripassa quello
     invece di sbattere la testa sul concetto nuovo */
  const zoppo = { ...profiloCon(['somma-10', 'amici-10'], ORA - MESE) }
  const pool = poolDi(STAZIONI[1], zoppo, ORA, 12)
  const chiesti = new Set(pool.map(concettoDiChiave))
  controlla('con le basi decadute la stazione ripassa i prerequisiti',
            chiesti.has('somma-10') || chiesti.has('amici-10'),
            `chiede ${[...chiesti].join(', ')}`)

  /* Il muro che ci siamo trovati addosso: una stazione aperta ma con le
     basi non ancora salde chiedeva SOLO i prerequisiti, e le risposte
     «mirate» del bersaglio non salivano mai. Una tappa che il gioco ha
     aperto deve essere superabile: il grafo dosa, non sbarra. */
  for (const s of STAZIONI) {
    for (const stato of [{}, zoppo]) {
      const p = poolDi(s, stato, ORA, 12)
      const mirabili = p.filter(k => eNuovo(s, k)).length
      controlla(`${s.emoji} ${s.nome}: si può centrare il bersaglio anche con le basi zoppe`,
                !s.nuovi.length || mirabili > 0,
                `nessuna domanda dei suoi concetti fra ${p.length} del pool`)
    }
  }

  /* E il ripasso non deve coprire la tappa. Con la sua quota lasciata a
     «tutto quello che avanza», un pool da dodici veniva su con undici fatti
     vecchi e una sola chiave del concetto nuovo — perché un concetto a
     istanze infinite è UNA chiave e i fatti già visti sono centinaia. Il
     risultato: una tappa passata a rifare 3−2 e 6−5, con le risposte mirate
     che salivano una volta su dodici. */
  for (const s of STAZIONI.filter(x => x.nuovi.length)) {
    const prima = STAZIONI.slice(0, s.i).flatMap(x => x.nuovi)
    const arrivato = profiloCon([...prima, 'tab:2', 'tab:3', 'tab:4', 'tab:5'])
    const p = poolDi(s, arrivato, ORA, 12)
    const quota = p.filter(k => eNuovo(s, k)).length / p.length
    controlla(`${s.emoji} ${s.nome}: il pool parla soprattutto della tappa`,
              quota >= 1 / 3, `solo ${(quota * 100).toFixed(0)}% di ${p.length} chiavi`)
  }

  const esperto = profiloCon(CONCETTI.map(c => c.id))
  for (const s of [...STAZIONI, VOLO_A_MENTE]) {
    const p = poolDi(s, esperto, ORA, 12)
    controlla(`${s.emoji} ${s.nome}: c'è sempre qualcosa da chiedere`, p.length > 0)
    const e = esercizioDi(p[0], { taglia: 1, tabelline: [2, 3, 4, 5, 6, 7, 8, 9] })
    controlla(`${s.emoji} ${s.nome}: e la domanda si costruisce`, !!e && e.ris >= 0)
  }
  const riporti = STAZIONI.find(s => s.nuovi.includes('somma-riporto'))
  controlla('le risposte mirate sono quelle dei concetti nuovi',
            eNuovo(riporti, chiaveConcetto('somma-riporto')) &&
            !eNuovo(riporti, chiaveConcetto('somma-10')))

  uguale('a profilo pieno tutti i concetti reggono', concettiSaldi(esperto, ORA), CONCETTI.length)
  controlla('e le stazioni hanno la loro stella',
            STAZIONI.every(s => stellaDi(s, esperto, ORA)))
  controlla('mentre a profilo nuovo nessuna ce l\'ha',
            STAZIONI.every(s => !stellaDi(s, {}, ORA)))
}

/* ═══════════ la miscela: ogni quanto parla la tappa ═══════════
   Il pool dice cosa può uscire, `sottoPool` dice ogni quanto. È la
   differenza fra «nel pool c'è anche il 6» e «la partita parla del 6»:
   dentro un pool misto il picker pesca pesato, e il ripasso — che si sa
   peggio, quindi pesa di più — si prendeva la partita. */
{
  const suo = k => k.startsWith('nuovo:')
  const pool = ['nuovo:a', 'nuovo:b', 'vecchio:a', 'vecchio:b', 'vecchio:c', 'vecchio:d']
  let dalla = 0
  const N = 4000
  for (let i = 0; i < N; i++) if (sottoPool(pool, suo, Math.random).every(suo)) dalla++
  dentro('sette domande su dieci parlano della tappa', dalla / N, QUOTA_TAPPA - 0.03, QUOTA_TAPPA + 0.03)

  // e chi sceglie il ripasso non pesca mai fra i nuovi, e viceversa
  const parti = new Set(Array.from({ length: 200 }, () => sottoPool(pool, suo).map(String).join('|')))
  controlla('le due parti non si mescolano', parti.size === 2, [...parti].join(' / '))

  // una tappa senza ripasso (la prima) resta giocabile: si pesca da tutto
  uguale('senza ripasso non c\'è niente da dosare',
         sottoPool(['nuovo:a'], suo, () => 0.99).length, 1)
  uguale('e senza niente di nuovo nemmeno',
         sottoPool(['vecchio:a', 'vecchio:b'], suo, () => 0.01).length, 2)
}

/* la taglia sale con la forza, non con la tappa */
{
  const vuoto = {}
  const pieno = profiloCon(['somma-riporto'])
  uguale('concetto nuovo: numeri piccoli', tagliaDi('somma-riporto', vuoto, ORA), 0)
  uguale('concetto consolidato: numeri grandi', tagliaDi('somma-riporto', pieno, ORA), 1)
}

/* chi arriva dopo mesi di tabelline non rifà 3+4 per venti partite */
{
  const p = { items: profiloCon(['somma-10', 'doppi', 'meno-10']) }
  allineaCalcolo(p, ORA)
  uguale('la prima stazione si apre da sola a chi già la sa', p.calc.tappa, 1)
  const nuovo = { items: {} }
  allineaCalcolo(nuovo, ORA)
  uguale('e chi comincia adesso parte dalla prima', nuovo.calc.tappa, 0)
}

riassunto('calcolo a mente')
