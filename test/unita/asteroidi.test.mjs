/* ═══════════════════════════════════════════════════════════════════
   LE DOMANDE DEGLI ASTEROIDI, SENZA BROWSER
   tempo: 120

   Quale calcolo scende dal cielo è la cosa che decide se una tappa
   insegna o fa perdere tempo, ed è anche l'unica parte del gioco che
   gira benissimo senza schermo: da quando sta in `store/tabelline.js`
   qui si gioca una tappa intera con un finto giocatore e si CONTA cosa
   è uscito, invece di guardarla giocare e fidarsi.

   Sono i tre guasti che questo test è nato per prendere, tutti visti
   giocando e nessuno visibile leggendo il codice:

     1. sul pianeta del 10 uscivano sei domande di fila che non erano la
        tabellina del 10;
     2. la stessa identica domanda usciva due volte di fila;
     3. un boss chiedeva 1×1.

   E poi il volo libero, che non chiede più quali tabelline allenare e
   quindi deve saper scegliere da sé.
   ═══════════════════════════════════════════════════════════════════ */
import { CAMPAGNA, VOLO_LIBERO, calcoliTabellina, fattoriDi } from '../../src/data/tabelline.js'
import { STAZIONI, CONCETTI_PER_ID } from '../../src/data/calcolo.js'
import { SCALETTA, CAPITOLI, CHIAVE_MENTE, scaletta, superata, raggiunta,
         dopoDi, posizioneOra, progressiDa } from '../../src/data/asteroidi.js'
import { poolTappa, poolLibero, chiaveDelBoss, dellaTabellina, insiemeDi,
         chiaviDelle, ultimeTabelline, eNulla, CUORE, TUTTE_LE_TABELLE }
  from '../../src/store/tabelline.js'
import { creaMiscela, QUOTA_TAPPA, poolDi, eNuovo, tabellineSalde, saldo }
  from '../../src/store/calcolo.js'
import { createPicker, record, newItem, strength } from '../../src/store/srs.js'
import { state, init, selectPlayer, mateProgresso, calcProgresso,
         varianteAccesa, accendiVariante } from '../../src/store/profile.js'
import { save, remove, chiavi, flush } from '../../src/store/storage.js'
import { premioDaSerie, gettoneDopo, POTENZIAMENTI, TASCA_MAX }
  from '../../src/data/potenziamenti.js'
import { controlla, uguale, dentro, nota, riassunto } from '../aiuto/verifica.mjs'

const ORA = Date.now()
const GIORNO = 86400000
const BOSS_OGNI = 8               // com'è in `views/MathGame.vue`

/* ═══════════ IL FINTO GIOCATORE ═══════════
   Fa quello che fa il gioco, nello stesso ordine: chiede il pool, sceglie
   la parte, lascia scegliere al motore, risponde, segna. Il boss ogni
   otto domande arriva dalla tappa dopo e non si segna, come nel gioco. */
function partita(tappa, { items = {}, turni = 40, bravura = 0.8, prossima = null } = {}) {
  const picker = createPicker({ getItem: k => items[k] || newItem(), useTime: true, pausaDopo: 3 })
  const miscela = creaMiscela()
  const eSua = k => dellaTabellina(tappa.nuova, k)
  const uscite = [], pool = []
  let chieste = 0, precedente = null

  for (let g = 0; g < turni; g++) {
    const p = poolTappa(tappa, items, ORA, insiemeDi(tappa.tabelle) + picker.riposati)
    pool.push(p)
    const boss = chieste > 0 && chieste % BOSS_OGNI === 0
    chieste++
    const k = boss ? chiaveDelBoss(tappa, prossima, items, ORA, Math.random, precedente)
                   : picker.pick(miscela.parte(p, eSua, precedente))
    // il boss non passa dal picker: la memoria corta va avvisata a mano
    if (boss) picker.annota(k)
    miscela.segna(eSua(k))
    const giusta = Math.random() < bravura
    // l'assaggio del boss non si segna sul motore, come nel gioco
    if (!boss) {
      items[k] = record(items[k] || newItem(), { correct: giusta, ms: 2200, now: ORA })
      picker.afterAnswer(k, giusta)
    }
    uscite.push({ k, boss, sua: eSua(k) })
    precedente = k
  }
  return { uscite, pool }
}

const filaMassima = (uscite, dentro) => {
  let n = 0, max = 0
  for (const u of uscite) { n = dentro(u) ? n + 1 : 0; max = Math.max(max, n) }
  return max
}

const ripetute = uscite =>
  uscite.filter((u, i) => i > 0 && u.k === uscite[i - 1].k).length

/* profili di partenza: un bambino non arriva mai a una tappa con la
   testa vuota, e i guasti si vedevano proprio con la testa piena */
function saputo(chiavi, quando = ORA - GIORNO) {
  const items = {}
  for (const k of chiavi)
    for (let i = 0; i < 5; i++)
      items[k] = record(items[k] || newItem(), { correct: true, ms: 1800, now: quando })
  return items
}
const primeDi = T => chiaviDelle(T.tabelle.filter(n => n !== T.nuova))

const PROFILI = T => ({
  'chi non sa niente': {},
  'chi ha appena finito il pianeta prima': saputo(primeDi(T)),
  'chi non gioca da un mese': saputo(primeDi(T), ORA - 30 * GIORNO),
  // il caso che faceva collassare tutto: la tabellina nuova è facile e la
  // sa già (×10 lo sanno tutti), quindi `activeSet` non ha più niente «in
  // lavorazione» da restituire
  'chi sa già anche la tabellina nuova': saputo(chiaviDelle(T.tabelle)),
})

/* ═══════════ 1. LA TAPPA PARLA DELLA SUA TABELLINA ═══════════
   Il guasto: la quota era una monetina lanciata a ogni domanda, e una
   monetina non promette niente su un tratto di partita. Con otto su
   dieci «in media», una partita su trenta conteneva sei domande di fila
   fuori tabellina — che è esattamente quello che si è visto sul pianeta
   del 10. Adesso la miscela ha memoria e il tetto vale su ogni tratto. */
{
  let peggioFila = 0, peggioQuota = 1, quale = ''
  for (const idx of [0, 1, 4, 5, 8]) {
    const T = CAMPAGNA[idx]
    const dopo = CAMPAGNA[idx + 1] || null
    for (const [chi, base] of Object.entries(PROFILI(T))) {
      let sue = 0, tot = 0, fila = 0
      for (let g = 0; g < 30; g++) {
        const { uscite } = partita(T, { items: structuredClone(base), prossima: dopo })
        sue += uscite.filter(u => u.sua).length
        tot += uscite.length
        fila = Math.max(fila, filaMassima(uscite, u => !u.sua))
      }
      const quota = sue / tot
      if (quota < peggioQuota) { peggioQuota = quota; quale = `${T.nome} · ${chi}` }
      if (fila > peggioFila) peggioFila = fila
      controlla(`${T.emoji} ${T.nome} · ${chi}: mai sei domande di fila fuori tabellina`,
                fila <= 2, `${fila} di fila`)
    }
  }
  dentro('la tabellina della tappa è tre domande su quattro',
         Math.round(peggioQuota * 100), 70, 100)
  nota(`la quota più bassa è ${(peggioQuota * 100).toFixed(0)}% (${quale}),`,
       `la fila più lunga fuori tabellina è ${peggioFila}`)
  nota(`la quota dichiarata è ${QUOTA_TAPPA * 100}%, il boss ogni ${BOSS_OGNI} sta fuori per mestiere`)
}

/* ═══════════ 2. LA STESSA DOMANDA MAI DUE VOLTE DI FILA ═══════════
   Il picker sa già rifiutare quello appena chiesto: l'unico modo di
   ripeterlo è che il pool si riduca a UNA chiave, e quello succedeva
   perché `activeSet` restituisce solo il non-ancora-imparato. Su una
   tabellina facile le caselle passavano tutte a «imparata» in mezza
   partita, il cuore della tappa si assottigliava a una sola, e quella
   usciva due, tre, quattro volte di seguito. */
{
  let doppie = 0, domande = 0
  for (const idx of [0, 1, 4, 8]) {
    const T = CAMPAGNA[idx]
    for (const base of Object.values(PROFILI(T)))
      for (let g = 0; g < 30; g++) {
        const { uscite } = partita(T, { items: structuredClone(base), turni: 40,
                                        bravura: 0.95, prossima: CAMPAGNA[idx + 1] || null })
        doppie += ripetute(uscite)
        domande += uscite.length
      }
  }
  uguale('nessuna domanda esce due volte di fila', doppie, 0)
  nota(`su ${domande} domande giocate`)
}

/* ═══════════ 3. IL POOL DELLA TAPPA NON SI ASSOTTIGLIA ═══════════ */
{
  for (const idx of [0, 1, 5, 8]) {
    const T = CAMPAGNA[idx]
    let minimo = 99
    for (const base of Object.values(PROFILI(T))) {
      const { pool } = partita(T, { items: structuredClone(base), bravura: 1,
                                    prossima: CAMPAGNA[idx + 1] || null })
      for (const p of pool) minimo = Math.min(minimo, p.filter(k => dellaTabellina(T.nuova, k)).length)
    }
    controlla(`${T.emoji} ${T.nome}: il cuore della tappa resta largo`,
              minimo >= CUORE, `è sceso a ${minimo} chiavi`)
  }

  // e il ripasso non si prende il pool: la ricetta dice «più di metà la
  // tabellina nuova», e prima gli scaduti si sommavano oltre la quota
  const T = CAMPAGNA[5]
  const items = saputo(chiaviDelle(T.tabelle), ORA - 30 * GIORNO)
  const p = poolTappa(T, items, ORA, insiemeDi(T.tabelle))
  const sue = p.filter(k => dellaTabellina(T.nuova, k)).length
  controlla('più di metà del pool è la tabellina del pianeta',
            sue * 2 > p.length, `${sue} chiavi su ${p.length}`)
}

/* ═══════════ 4. IL BOSS ═══════════
   Un boss chiede qualcosa che il bambino non ha ancora incontrato. Se
   chiede 1×1 non è un boss: è la casella che nessuna tappa si degna di
   chiedere, ed è per questo che il vecchio ripiego («la domanda più in
   bilico», cioè quella col peso più alto) la pescava con precisione. */
{
  const conti = []
  for (let i = 0; i < CAMPAGNA.length; i++) {
    const T = CAMPAGNA[i], dopo = CAMPAGNA[i + 1] || null
    const items = saputo(chiaviDelle(T.tabelle))
    const scelte = Array.from({ length: 200 }, () => chiaveDelBoss(T, dopo, items, ORA))
    controlla(`${T.emoji} ${T.nome}: il boss esce sempre`, scelte.every(Boolean))
    controlla(`${T.emoji} ${T.nome}: e non chiede mai un calcolo-nulla`,
              scelte.every(k => k && !eNulla(k)),
              [...new Set(scelte.filter(k => k && eNulla(k)))].join(', '))
    if (dopo && dopo.nuova)
      controlla(`${T.emoji} ${T.nome}: il boss arriva dal pianeta dopo (il ${dopo.nuova})`,
                scelte.every(k => dellaTabellina(dopo.nuova, k)),
                [...new Set(scelte)].join(', '))
    conti.push(...scelte)
  }
  // il volo libero non ha nessun «dopo»: prima `-1 + 1` faceva zero e il
  // boss anticipava il primo pianeta, cioè il più facile di tutti
  const libero = Array.from({ length: 200 },
    () => chiaveDelBoss(VOLO_LIBERO, null, saputo(chiaviDelle(TUTTE_LE_TABELLE)), ORA))
  controlla('anche nel volo libero il boss non chiede calcoli-nulla',
            libero.every(k => k && !eNulla(k)), [...new Set(libero)].join(', '))
  controlla('e non ripiega sul primo pianeta',
            !libero.every(k => dellaTabellina(2, k)))
  nota(`${new Set(conti).size} calcoli diversi hanno fatto il boss nella campagna`)

  uguale('1×1 è un calcolo-nulla', eNulla('math:1x1'), true)
  uguale('e anche 2×3', eNulla('math:2x3'), true)
  uguale('mentre 7×8 no', eNulla('math:7x8'), false)
}

/* ═══════════ 5. IL VOLO LIBERO SCEGLIE DA SÉ ═══════════
   Non chiede più quali tabelline allenare — è una domanda a cui un
   bambino non sa rispondere anche dopo aver finito la campagna. */
{
  // chi zoppica sul 7 e sull'8 deve ritrovarsi il 7 e l'8
  const items = saputo(chiaviDelle(TUTTE_LE_TABELLE))
  for (const k of [...calcoliTabellina(7), ...calcoliTabellina(8)])
    items[k] = record(items[k], { correct: false, ms: 5200, now: ORA })
  const p = poolLibero(items, ORA, 16, CAMPAGNA.length)
  const deboli = p.filter(k => fattoriDi(k).some(n => n === 7 || n === 8)).length
  controlla('il volo libero pesca quello che si ricorda meno',
            deboli * 2 > p.length, `solo ${deboli} chiavi su ${p.length} toccano il 7 o l'8`)

  // e chi ricorda tutto bene torna sugli ultimi pianeti giocati
  const bravo = saputo(chiaviDelle(TUTTE_LE_TABELLE), ORA)
  const q = poolLibero(bravo, ORA, 16, CAMPAGNA.length)
  controlla('chi ricorda tutto vola lo stesso', q.length > 0)
  const ultime = ultimeTabelline(CAMPAGNA.length)
  controlla('e le domande vengono dagli ultimi pianeti giocati',
            q.every(k => fattoriDi(k).some(n => ultime.includes(n))),
            `ultime tabelline: ${ultime.join(', ')}`)
  nota(`gli ultimi pianeti giocati sono le tabelline ${ultime.join(', ')}`)
}

/* ═══════════════════════════════════════════════════════════════════
   LA SCALETTA UNICA — pianeti e stazioni in una fila sola
   ═══════════════════════════════════════════════════════════════════ */

/* ═══════════ 6. LA FILA NON PERDE E NON DUPLICA NIENTE ═══════════ */
{
  const pianeti = SCALETTA.filter(v => v.tipo === 'pianeta')
  const stazioni = SCALETTA.filter(v => v.tipo === 'mente')
  uguale('nella fila ci sono tutti i pianeti', pianeti.length, CAMPAGNA.length)
  uguale('e tutte le stazioni', stazioni.length, STAZIONI.length)
  uguale('nessuna tappa compare due volte',
         new Set(SCALETTA.map(v => v.tipo + v.i)).size, SCALETTA.length)
  controlla('ogni voce sta in un capitolo che esiste',
            SCALETTA.every(v => CAPITOLI[v.cap]))
  controlla('e ogni capitolo ha delle voci',
            CAPITOLI.every((_, i) => SCALETTA.some(v => v.cap === i)))

  /* Spento il calcolo a mente i pianeti si richiudono in fila: stesso
     ordine di prima, senza buchi e rinumerati da uno. È la promessa
     fatta a chi vuole solo le tabelline. */
  const soloPianeti = scaletta(false)
  uguale('spento il calcolo a mente restano i soli pianeti',
         soloPianeti.length, CAMPAGNA.length)
  controlla('nell\'ordine della campagna di sempre',
            soloPianeti.every((v, i) => v.i === i))
  controlla('e numerati da uno senza buchi',
            soloPianeti.every((v, i) => v.n === i + 1))
  controlla('anche nella fila intera i pianeti si susseguono in ordine',
            pianeti.every((v, i) => v.i === i))
  controlla('e le stazioni pure', stazioni.every((v, i) => v.i === i))
}

/* ═══════════ 7. L'ORDINE RISPETTA QUELLO CHE SERVE ═══════════
   È la parte misurata dell'ordine, e non è un'opinione: il grafo di
   `store/calcolo.js` dice quali concetti vengono prima di quali, e i
   concetti moltiplicativi dichiarano **quante tabelline devono
   reggere**. Sono i punti in cui le due campagne si toccano davvero, ed
   è lì che la fusione poteva rompersi: una stazione che chiede quattro
   tabelline messa prima del quarto pianeta è una tappa che non si può
   giocare. */
{
  const posDi = (tipo, i) => SCALETTA.findIndex(v => v.tipo === tipo && v.i === i)
  const stazioneDelConcetto = id => STAZIONI.findIndex(S => S.nuovi.includes(id))

  let peggio = '', margine = 99
  for (const S of STAZIONI) {
    const qui = posDi('mente', S.i)
    for (const id of S.nuovi) {
      const c = CONCETTI_PER_ID[id]
      // i prerequisiti: in una voce precedente, o in questa stessa
      for (const p of c.prereq || []) {
        const dove = stazioneDelConcetto(p)
        controlla(`${S.emoji} ${S.nome}: «${p}» arriva prima di «${id}»`,
                  dove >= 0 && posDi('mente', dove) <= qui,
                  `«${p}» sta alla posizione ${posDi('mente', dove) + 1}, «${id}» alla ${qui + 1}`)
      }
      // le tabelline: quante ne devono reggere, e quante ne sono passate
      const servono = c.tabelline || 0
      if (!servono) continue
      const prima = SCALETTA.slice(0, qui).filter(v => v.tipo === 'pianeta' && v.T.nuova).length
      controlla(`${S.emoji} ${S.nome}: «${id}» vuole ${servono} tabelline e ne trova ${prima}`,
                prima >= servono)
      if (prima - servono < margine) {
        margine = prima - servono
        peggio = `«${id}» chiede ${servono} tabelline e ne trova ${prima}`
      }
    }
  }
  nota('il vincolo più stretto è quello di ' + peggio)

  /* E la misura che dice perché non si poteva alternare a turno: la
     prima posizione in cui QUATTRO tabelline sono passate. Prima di lì
     nessuna tappa moltiplicativa a mente può stare, comunque la si
     giri. */
  let quante = 0, soglia = -1
  SCALETTA.forEach((v, i) => {
    if (v.tipo === 'pianeta' && v.T.nuova) quante++
    if (quante === 4 && soglia < 0) soglia = i
  })
  nota(`la quarta tabellina passa alla posizione ${soglia + 1} di ${SCALETTA.length}:`,
       'prima di lì «4×23» e «56:8» non hanno di che campare')
}

/* ═══════════ 8. LA CAMMINATA ═══════════
   Si percorre la fila con un finto bambino che gioca ogni tappa finché
   la sa, e a ogni passo si guarda cosa trova in mano. Due cose, e sono
   le due facce dell'ordine sbagliato:

     · TROPPO PRESTO — arriva una tappa moltiplicativa e le tabelline
       che le servono non reggono;
     · TROPPO TARDI — arriva una tappa e quello che è venuta a insegnare
       è già consolidato, cioè è una serata buttata.

   Gli esami (il Sole, «La prova») stanno fuori dal secondo controllo:
   non portano niente di nuovo per mestiere. */
{
  const ORA2 = Date.now()

  function gioca(v, items, bravura = 0.85) {
    const T = v.T
    const picker = createPicker({ getItem: k => items[k] || newItem(), useTime: true, pausaDopo: 3 })
    const miscela = creaMiscela()
    const mente = v.tipo === 'mente'
    const eSua = k => (mente ? eNuovo(T, k) : dellaTabellina(T.nuova, k))
    let giuste = 0, mirate = 0, precedente = null
    for (let g = 0; g < 200; g++) {
      const p = mente ? poolDi(T, items, ORA2, 12 + picker.riposati)
                      : poolTappa(T, items, ORA2, insiemeDi(T.tabelle) + picker.riposati)
      if (!p.length) return { vuoto: true, giuste, mirate }
      const k = picker.pick(miscela.parte(p, eSua, precedente))
      miscela.segna(eSua(k))
      const giusta = Math.random() < bravura
      items[k] = record(items[k] || newItem(), { correct: giusta, ms: 2200, now: ORA2 })
      picker.afterAnswer(k, giusta)
      if (giusta) { giuste++; if (eSua(k)) mirate++ }
      precedente = k
      if (giuste >= T.bersaglio && mirate >= T.mirate) break
    }
    return { vuoto: false, giuste, mirate }
  }

  /* «la sa»: per una stazione i suoi concetti nuovi reggono, per un
     pianeta la sua tabellina regge in media. È la stessa soglia che usa
     il grafo (`SALDO`), quindi è la stessa domanda che si fa il gioco. */
  const consolidata = (v, items) => {
    if (v.tipo === 'mente')
      return !v.T.nuovi.length || v.T.nuovi.every(id => saldo(id, items, ORA2))
    if (!v.T.nuova) return true
    const ks = calcoliTabellina(v.T.nuova)
    return ks.reduce((s, k) => s + strength(items[k] || newItem(), ORA2), 0) / ks.length >= 3
  }

  const items = {}
  let presto = [], tardi = [], vuoti = [], salde = 0
  for (const v of SCALETTA) {
    const tab = tabellineSalde(items, ORA2)
    if (v.tipo === 'mente') {
      const servono = Math.max(0, ...v.T.nuovi.map(id => CONCETTI_PER_ID[id].tabelline || 0))
      if (servono && tab.length < servono)
        presto.push(`${v.T.nome} (ne servono ${servono}, ne reggono ${tab.length})`)
    }
    /* «troppo tardi» si chiede alle sole stazioni, e non è pigrizia: i
       concetti a mente sono roba di quella tappa e di nessun'altra,
       mentre le tabelline si sovrappongono per costruzione — 8×7 è del
       pianeta del 7 ed è anche del pianeta dell'8. Arrivare all'8 con
       metà tabellina già in mano è quello che deve succedere, non una
       tappa buttata. */
    if (v.tipo === 'mente' && v.T.nuovi.length && consolidata(v, items))
      tardi.push(v.T.nome)
    // una partita si gioca sempre, anche se la tappa si sapeva già: gli
    // esami sono fatti apposta, e così anche loro passano dal pool
    let giri = 0
    while (giri < 8 && (!giri || !consolidata(v, items))) {
      const esito = gioca(v, items)
      if (esito.vuoto) { vuoti.push(v.T.nome); break }
      giri++
    }
    salde = tabellineSalde(items, ORA2).length
  }

  controlla('nessuna tappa arriva prima di quello che le serve', !presto.length,
            presto.join(' · '))
  controlla('e nessuna arriva quando è già saputa', !tardi.length, tardi.join(' · '))
  controlla('ogni tappa della fila ha sempre di che giocare', !vuoti.length,
            vuoti.join(' · '))
  nota(`camminando la fila si arriva in fondo con ${salde} tabelline salde su 9`)
}

/* ═══════════ 9. I PROGRESSI DI IERI ═══════════
   La cosa che, se sbagliata, non la vede nessun test ma la vede il
   bambino che riapre il gioco e non trova più i suoi pianeti. Si semina
   un profilo vero — quello di chi era **al quinto pianeta e alla
   seconda stazione** — e si guarda cosa gli mostra la fila nuova.

   Il patto è che i contatori restano due: una voce è superata se il
   progresso della SUA campagna la copriva. Un contatore solo o
   regalerebbe le stazioni o richiuderebbe i pianeti. */
{
  for (const k of await chiavi('')) await remove(k)
  state.giocatori = []
  state.player = ''
  // un profilo come quelli di ieri: due contatori, e nessun `varianti`
  save('profilo:Ieri', { v: 6, coins: 0, items: {}, totals: { math: 0 },
                         mate: { tappa: 5, libera: false },
                         calc: { tappa: 2, libera: false } })
  await flush()
  await init()
  await selectPlayer('Ieri')

  const prog = progressiDa(mateProgresso(), calcProgresso())
  uguale('il quinto pianeta è ancora dov\'era', prog.pianeta, 5)
  uguale('e la seconda stazione pure', prog.mente, 2)

  const fila = scaletta(true)
  const fatte = fila.filter(v => superata(v, prog))
  uguale('nella fila risultano superate cinque tappe di tabelline',
         fatte.filter(v => v.tipo === 'pianeta').length, 5)
  uguale('e due di calcolo a mente', fatte.filter(v => v.tipo === 'mente').length, 2)
  controlla('e sono proprio le prime di ognuna, non altre',
            fatte.every(v => v.i < (v.tipo === 'pianeta' ? 5 : 2)))

  /* le due frontiere restano aperte tutte e due: è il senso di non aver
     fuso i contatori, e si vede qui — due tappe aperte in mezzo alla
     fila, una per mestiere */
  const aperte = fila.filter(v => raggiunta(v, prog) && !superata(v, prog))
  uguale('restano aperte due tappe, una per mestiere', aperte.length, 2)
  uguale('il sesto pianeta', aperte.find(v => v.tipo === 'pianeta').i, 5)
  uguale('e la terza stazione', aperte.find(v => v.tipo === 'mente').i, 2)
  controlla('niente si è aperto da solo più avanti',
            fila.filter(v => raggiunta(v, prog)).length === 7 + 2,
            `${fila.filter(v => raggiunta(v, prog)).length} voci raggiungibili`)

  /* dove si è arrivati, che è quello che dice la home */
  const dove = posizioneOra(prog, true)
  uguale('la home apre sulla prima tappa non ancora fatta',
         fila[dove].tipo + fila[dove].i, fila.find(v => !superata(v, prog)).tipo +
         fila.find(v => !superata(v, prog)).i)

  /* ── l'interruttore dei grandi ── */
  uguale('il calcolo a mente nasce acceso anche per un profilo di ieri',
         varianteAccesa(CHIAVE_MENTE), true)
  accendiVariante(CHIAVE_MENTE, false)
  uguale('spento, resta spento', varianteAccesa(CHIAVE_MENTE), false)

  const corta = scaletta(varianteAccesa(CHIAVE_MENTE))
  uguale('la fila si accorcia ai soli pianeti', corta.length, CAMPAGNA.length)
  uguale('e i cinque superati restano cinque',
         corta.filter(v => superata(v, prog)).length, 5)
  uguale('con una sola tappa aperta, la sesta',
         corta.filter(v => raggiunta(v, prog) && !superata(v, prog)).length, 1)
  uguale('i progressi a mente non sono stati toccati', calcProgresso().tappa, 2)
  accendiVariante(CHIAVE_MENTE, true)
  uguale('riacceso, la fila torna intera', scaletta(varianteAccesa(CHIAVE_MENTE)).length,
         SCALETTA.length)

  /* ── «adesso tocca a» segue la fila, non la campagna ── */
  const seguito = []
  let v = scaletta(true)[0]
  for (let i = 0; i < 3 && v; i++) {
    seguito.push(v.tipo)
    v = dopoDi(v, { pianeta: 99, mente: 99 }, true)   // tutto aperto, niente superato
  }
  controlla('dopo una tappa può toccare all\'altro mestiere',
            new Set(seguito).size > 1, seguito.join(' → '))

  const dopoQuinto = dopoDi({ tipo: 'pianeta', i: 4 }, prog, true)
  controlla('e dopo il pianeta appena finito si va alla prima non fatta e aperta',
            dopoQuinto && !superata(dopoQuinto, prog) && raggiunta(dopoQuinto, prog),
            dopoQuinto ? dopoQuinto.T.nome : 'nessuna')

  for (const k of await chiavi('')) await remove(k)
}

/* ═══════════ I GETTONI DEL FILOTTO ═══════════
   Quanto spesso arriva un premio, e quale, è un dato di equilibrio: se
   arriva troppo di rado non esiste, se arriva sempre uguale metà del
   gioco non si vede mai. Sono due funzioni pure, quindi si contano
   invece di giocarle a occhio — e si conta su una partita lunga, perché
   il difetto che si vuole prendere («esce sempre il gelo») si vede solo
   sulla fila. */
{
  const filotto = Array.from({ length: 40 }, (_, i) => i + 1)
  const premi = filotto.map(s => premioDaSerie(s, 10))
  uguale('una vita ogni dieci di fila', premi.filter(p => p === 'vita').length, 4)
  uguale('e un gettone alle altre cinquine', premi.filter(p => p === 'gettone').length, 4)
  uguale('il primo premio arriva a cinque, non a fine tappa',
         filotto.find(s => premi[s - 1]), 5)

  /* L'ALTERNANZA GUARDA L'ULTIMO USCITO, NON LA SERIE, e questo test è
     nato da un difetto che si vedeva solo giocando: sulla carta i
     poteri erano due, in partita usciva sempre e solo il gelo. La
     ragione era aritmetica — l'alternanza era calcolata sulla serie (5
     il gelo, 15 il mirino), ma una tappa si chiude sui quindici centri,
     quindi il secondo gettone toccava solo a chi non sbagliava mai.
     Qui si conta una partita finta e si guarda **cosa esce davvero**. */
  const uscite = []
  let ultimo = null
  for (const q of ['filotto', 'boss', 'filotto', 'boss', 'filotto', 'boss']) {
    ultimo = gettoneDopo(ultimo)
    uscite.push(ultimo)
  }
  uguale('i due gettoni si alternano, da qualunque parte arrivino',
         uscite.join(' '), 'gelo mirino gelo mirino gelo mirino')
  controlla('e sono quelli dichiarati',
            uscite.every(g => POTENZIAMENTI[g]), [...new Set(uscite)].join(', '))
  uguale('si comincia dal gelo', gettoneDopo(null), 'gelo')

  /* La tasca è piccola apposta: con un tetto alto un filotto lungo
     diventa un magazzino, e la fine della tappa si gioca a gettoni
     invece che a conti. Tre è il numero, e chi lo cambia deve saperlo. */
  dentro('la tasca resta piccola', TASCA_MAX, 2, 4)
  /* Il gelo dà tempo, non risposte: se rallentasse troppo la tappa si
     finirebbe premendo un tasto, e il numero smetterebbe di essere una
     domanda. Meno della metà, e non di più. */
  dentro('il gelo dimezza la caduta, non la annulla', POTENZIAMENTI.gelo.lento, 0.3, 0.6)
  /* E vale per **una domanda**, non per un tot di secondi: una durata a
     tempo sconfina sulle due domande dopo, che il gettone non ha
     pagato, e porta via anche la loro misura del tempo nell'SRS. Se
     qualcuno rimette un `durata` qui dentro, questo controllo lo dice. */
  controlla('e dura una domanda, non un cronometro',
            POTENZIAMENTI.gelo.durata === undefined, 'è tornata una durata a tempo')
  nota(`gelo a ${POTENZIAMENTI.gelo.lento}× per una domanda, tasca da ${TASCA_MAX}`)
}

riassunto('Asteroidi: quali domande escono, e in che ordine')
