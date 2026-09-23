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

   E poi il volo infinito, uno per tabelline e calcolo a mente insieme,
   che si complica col livello della partita (`store/volo.js`).
   ═══════════════════════════════════════════════════════════════════ */
import { CAMPAGNA, calcoliTabellina, fattoriDi, chiaveCalcolo, GRANDI, eGrande, eCasella }
  from '../../src/data/tabelline.js'
import { STAZIONI, CONCETTI_PER_ID } from '../../src/data/calcolo.js'
import { SCALETTA, CAPITOLI, VOLO, superata, raggiunta,
         dopoDi, posizioneOra, filaDi, filaDopo, campagneDaFila,
         filaDaCampagne, daAssaggiare } from '../../src/data/asteroidi.js'
/* serve a una cosa sola: controllare che una funzione NON ci sia più
   (`scaletta`, la fila filtrata dell'interruttore di una volta) */
import * as ASTEROIDI from '../../src/data/asteroidi.js'
import { poolTappa, chiaveDelBoss, dellaTabellina, insiemeDi,
         chiaviDelle, eNulla, CUORE, TUTTE_LE_TABELLE, banale, stima, distrattoriTabellina }
  from '../../src/store/tabelline.js'
import { miraDelLivello, LIVELLO_TETTO, LIVELLO_CATALOGO, MIRA_MIN, MIRA_OLTRE,
         altezzaTabellina, altezzaMente, altezzaGrande, tagliaDelVolo,
         poolVoloTabelline, poolVoloMente, creaAlternanza, MAX_DI_FILA, MAGAZZINI,
         chiaviDelVolo, pescaPesati, caselleDelBoss, giraLaGrande, partenzaDalRecord,
         CASELLE_DEL_VOLO }
  from '../../src/store/volo.js'
import { creaMiscela, QUOTA_TAPPA, poolDi, eNuovo, tabellineSalde, saldo,
         esercizioDaChiave }
  from '../../src/store/calcolo.js'
import { tabellineIntereDi, abilita, misure } from '../../src/store/progressi.js'
import { createPicker, record, newItem, strength, IVL, SRS } from '../../src/store/srs.js'
import { frontieraTabelline, mareaTabelline, frontieraCalcolo, mareaCalcolo,
         lentezzaDa, MAREA_MAX, RIENTRO } from '../../src/store/marea.js'
import { chiaviDi, concettoDiChiave } from '../../src/data/calcolo.js'
import { state, init, selectPlayer, mateProgresso, calcProgresso,
         asteroidiCompleta, sincronizzaAsteroidi } from '../../src/store/profile.js'
/* come sopra: serve a controllare che due funzioni NON ci siano più */
import * as PROFILO from '../../src/store/profile.js'
import { save, remove, chiavi, flush } from '../../src/store/storage.js'
import { premioDaSerie, gettoneDopo, POTENZIAMENTI, TASCA_MAX }
  from '../../src/data/potenziamenti.js'
import { controlla, uguale, dentro, nota, riassunto } from '../aiuto/verifica.mjs'

const ORA = Date.now()
const GIORNO = 86400000
const BOSS_OGNI = 8               // com'è in `views/MathGame.vue`

/* la voce della fila che porta questa tappa: serve a chiedere a
   `daAssaggiare` cosa può portare il boss, invece di rifare il conto a
   mano con un `CAMPAGNA[i + 1]` — che è esattamente il conto sbagliato
   da cui è venuto il guasto del Sole */
const voceDi = (tipo, i) => SCALETTA.find(v => v.tipo === tipo && v.i === i)

/* ═══════════ IL FINTO GIOCATORE ═══════════
   Fa quello che fa il gioco, nello stesso ordine: chiede il pool, sceglie
   la parte, lascia scegliere al motore, risponde, segna. Il boss ogni
   otto domande sceglie la sua chiave a parte, e si segna o no a seconda
   che sia un assaggio della tappa dopo — `prossima` è quella tappa lì,
   cioè quello che risponde `daAssaggiare`, e al Sole è `null`. */
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
    /* l'assaggio non si segna sul motore, come nel gioco — ma è un
       assaggio solo se una tappa da assaggiare c'è davvero: dove non c'è
       il boss chiede la casella più tosta di casa, ed è roba già
       insegnata, quindi si segna come tutte le altre */
    const assaggio = boss && !!prossima
    if (!assaggio) {
      items[k] = record(items[k] || newItem(), { correct: giusta, ms: 2200, now: ORA })
      picker.afterAnswer(k, giusta)
    }
    uscite.push({ k, boss, assaggio, sua: eSua(k) })
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
    const dopo = daAssaggiare(voceDi('pianeta', idx))
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
                                        bravura: 0.95,
                                        prossima: daAssaggiare(voceDi('pianeta', idx)) })
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
                                    prossima: daAssaggiare(voceDi('pianeta', idx)) })
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
    const T = CAMPAGNA[i], dopo = daAssaggiare(voceDi('pianeta', i))
    const items = saputo(chiaviDelle(T.tabelle))
    const scelte = Array.from({ length: 200 }, () => chiaveDelBoss(T, dopo, items, ORA))
    controlla(`${T.emoji} ${T.nome}: il boss esce sempre`, scelte.every(Boolean))
    controlla(`${T.emoji} ${T.nome}: e non chiede mai un calcolo-nulla`,
              scelte.every(k => k && !eNulla(k)),
              [...new Set(scelte.filter(k => k && eNulla(k)))].join(', '))
    if (dopo)
      controlla(`${T.emoji} ${T.nome}: il boss arriva dal pianeta dopo (il ${dopo.nuova})`,
                scelte.every(k => dellaTabellina(dopo.nuova, k)),
                [...new Set(scelte)].join(', '))
    conti.push(...scelte)
  }
  // il volo libero non ha nessun «dopo»: prima `-1 + 1` faceva zero e il
  // boss anticipava il primo pianeta, cioè il più facile di tutti
  const libero = Array.from({ length: 200 },
    () => chiaveDelBoss(VOLO, null, saputo(chiaviDelle(TUTTE_LE_TABELLE)), ORA))
  controlla('anche nel volo libero il boss non chiede calcoli-nulla',
            libero.every(k => k && !eNulla(k)), [...new Set(libero)].join(', '))
  controlla('e non ripiega sul primo pianeta',
            !libero.every(k => dellaTabellina(2, k)))
  nota(`${new Set(conti).size} calcoli diversi hanno fatto il boss nella campagna`)

  uguale('1×1 è un calcolo-nulla', eNulla('math:1x1'), true)
  uguale('e anche 2×3', eNulla('math:2x3'), true)
  uguale('mentre 7×8 no', eNulla('math:7x8'), false)
}

/* ═══════════ 4b. IL BOSS DOVE NON C'È PIÙ UN DOPO ═══════════
   Il guasto è arrivato da un telefono, ed è l'unico di questa lista che
   si presentava a un bambino come un cartello in mezzo alla partita:
   «`x.value.nuova is null` mentre fa livello il Sole».

   Sotto c'erano DUE cose confuse in una, ed è la ragione per cui
   `daAssaggiare` esiste: «il boss ha scelto una chiave» e «quella chiave
   viene dalla tappa dopo» non sono la stessa domanda. `chiaveDelBoss`
   una chiave la restituisce sempre — dove un dopo non c'è ripiega sulla
   più tosta fra quelle che ancora non reggono, ed è quello che deve fare
   — mentre `views/MathGame.vue` trattava qualunque chiave del boss come
   un assaggio e andava a chiedere la tabellina nuova alla tappa dopo.
   Al Sole quella tappa non c'è: `null.nuova`, e la partita finisce lì.

   Il caso che non scoppiava era peggio, perché nessuno l'ha mai visto:
   al pianeta del 9 il dopo **c'è** (è il Sole) ma non porta niente di
   nuovo. Lì il grido diceva «BOSS DAL PIANETA DEL null», e soprattutto
   una domanda su otto — roba di casa, già insegnata — non finiva in
   archivio, perché risultava un assaggio da non segnare. */
{
  const sole = voceDi('pianeta', CAMPAGNA.length - 1)
  const nono = voceDi('pianeta', CAMPAGNA.length - 2)
  const prova = voceDi('mente', STAZIONI.length - 1)
  const mille = voceDi('mente', STAZIONI.length - 2)

  uguale('l\'ultimo pianeta è il Sole, e non porta nessuna tabellina nuova',
         `${sole.T.nome} · ${sole.T.nuova}`, 'Il sole · null')
  uguale('e l\'ultima stazione è un esame che non insegna niente',
         [prova.T.nome, prova.T.nuovi.length].join(' · '), 'La prova · 0')

  uguale('al Sole non c\'è niente da assaggiare', daAssaggiare(sole), null)
  uguale('e nemmeno al pianeta prima, che il dopo ce l\'ha ma è il Sole',
         daAssaggiare(nono), null)
  uguale('lo stesso vale per l\'ultima stazione', daAssaggiare(prova), null)
  uguale('e per quella prima della prova', daAssaggiare(mille), null)
  uguale('un volo infinito non ha nessuna voce e quindi nessun dopo',
         daAssaggiare(null), null)

  /* e dappertutto altrove c'è, e porta davvero qualcosa di nuovo: senza
     questo il controllo qui sopra sarebbe contento anche di una funzione
     che risponde sempre `null`, cioè di un gioco senza più boss */
  const conDopo = SCALETTA.filter(v => daAssaggiare(v))
  uguale('in tutta la fila le tappe senza un assaggio sono quattro',
         SCALETTA.length - conDopo.length, 4)
  controlla('e quelle che ce l\'hanno portano roba nuova per davvero',
            conDopo.every(v => v.tipo === 'mente'
              ? daAssaggiare(v).nuovi.length : daAssaggiare(v).nuova),
            conDopo.filter(v => !(v.tipo === 'mente' ? daAssaggiare(v).nuovi.length
                                                     : daAssaggiare(v).nuova))
              .map(v => v.T.nome).join(', '))
  controlla('l\'assaggio è sempre la tappa successiva dello stesso mestiere',
            conDopo.every(v => daAssaggiare(v).i === v.i + 1))

  /* ── LA RIPRODUZIONE ──
     I due passi che il gioco fa quando tocca al boss, nello stesso
     ordine: si sceglie la chiave, e da lì si decide se è un assaggio.
     È la combinazione «una chiave c'è, una tappa da assaggiare no» che
     mandava a leggere dentro un `null`. */
  for (const v of [nono, sole]) {
    const t = daAssaggiare(v)
    const items = saputo(chiaviDelle(v.T.tabelle))
    const scelte = Array.from({ length: 50 },
      () => chiaveDelBoss({ tabelle: v.T.tabelle, nuova: v.T.nuova }, t, items, ORA))
    controlla(`${v.T.emoji} ${v.T.nome}: il boss chiede qualcosa lo stesso`,
              scelte.every(k => k && !eNulla(k)))
    // com'è scritto in `nuovaDomanda`: l'anticipo vuole tutte e due
    const anticipo = scelte.map(k => !!k && !!t)
    controlla(`${v.T.emoji} ${v.T.nome}: ma non è un assaggio`, !anticipo.some(Boolean))
    uguale(`${v.T.emoji} ${v.T.nome}: e non c'è nessuna tabellina da mettere davanti`,
           anticipo[0] ? t.nuova : null, null)
  }

  /* ── E QUINDI SI SEGNA ──
     La metà del guasto che non si vedeva: al Sole il boss arriva quattro
     o cinque volte in una tappa da 35 centri, e quelle risposte devono
     finire nell'SRS come tutte le altre. L'assaggio si tiene fuori
     perché misurare una cosa mai insegnata non dice niente di vero, e al
     Sole di non insegnato non c'è più niente. */
  const { uscite } = partita(sole.T, { items: saputo(chiaviDelle(sole.T.tabelle)),
                                       turni: 40, prossima: daAssaggiare(sole) })
  const bossate = uscite.filter(u => u.boss)
  controlla('al Sole il boss arriva più di una volta', bossate.length >= 3,
            `${bossate.length} volte in ${uscite.length} domande`)
  uguale('e nessuna delle sue domande è un assaggio da non segnare',
         bossate.filter(u => u.assaggio).length, 0)

  // mentre dove un dopo c'è, l'assaggio resta quello di sempre
  const quinto = voceDi('pianeta', 4)
  const altra = partita(quinto.T, { items: saputo(chiaviDelle(quinto.T.tabelle)),
                                    turni: 40, prossima: daAssaggiare(quinto) })
  const suoi = altra.uscite.filter(u => u.boss)
  controlla(`${quinto.T.emoji} ${quinto.T.nome}: lì il boss è ancora un assaggio`,
            suoi.length > 0 && suoi.every(u => u.assaggio))
  nota(`il boss del ${quinto.T.nome} porta la tabellina del ` +
       `${daAssaggiare(quinto).nuova}, quello del Sole la casella più tosta di casa`)
}

/* ═══════════ 5. IL VOLO INFINITO SI COMPLICA COL LIVELLO ═══════════
   Un volo solo, tabelline e calcolo a mente insieme: il livello della
   partita sposta la mira sulla scala della difficoltà, i due magazzini
   si alternano, e la marea resta sotto. */
{
  uguale('a livello 1 la mira sta in fondo', miraDelLivello(1), MIRA_MIN)
  uguale('in cima al catalogo sta a uno', miraDelLivello(LIVELLO_CATALOGO), 1)
  uguale('al tetto sta oltre', miraDelLivello(LIVELLO_TETTO), MIRA_OLTRE)
  uguale('e sopra il tetto non sale più: da lì cresce solo la velocità',
         miraDelLivello(LIVELLO_TETTO + 5), MIRA_OLTRE)
  controlla('in mezzo cresce', miraDelLivello(5) > miraDelLivello(2) && miraDelLivello(5) < miraDelLivello(8))

  /* le due scale, riportate a 0..1: 2×2 in fondo, 9×9 in cima; le somme
     entro il dieci in fondo, le centinaia in cima */
  controlla('2×2 sta più in basso di 3×7, che sta più in basso di 9×9',
            altezzaTabellina('math:2x2') < altezzaTabellina('math:3x7') &&
            altezzaTabellina('math:3x7') < altezzaTabellina('math:9x9'))
  uguale('×1 e ×10 stanno a zero: sono regole', altezzaTabellina('math:1x7'), 0)
  const bassa = STAZIONI[0].nuovi.flatMap(id => chiaviDi(id))[0]
  const alta = STAZIONI.filter(S => S.nuovi.length).at(-1).nuovi.flatMap(id => chiaviDi(id))[0]
  uguale('la prima stazione sta a zero', altezzaMente(bassa), 0)
  uguale('l\'ultima che insegna qualcosa sta a uno', altezzaMente(alta), 1)

  /* la campana, contata su molte partite: cosa prevale a ogni livello */
  const contaTab = lv => {
    const n = { basse: 0, alte: 0, grandi: 0, tot: 0 }
    for (let g = 0; g < 200; g++)
      for (const k of poolVoloTabelline(lv)) {
        const [lo, hi] = fattoriDi(k)
        n.tot++
        if (hi <= 5 && !banale(k)) n.basse++
        // in cima al catalogo, e le grandi che dal nove cominciano a entrare
        if ((lo >= 6 && hi >= 6) || eGrande(k)) n.alte++
        if (eGrande(k)) n.grandi++
      }
    return n
  }
  const t1 = contaTab(1), t9 = contaTab(9)
  controlla('a livello 1 prevalgono le tabelline basse',
            t1.basse * 2 > t1.tot && t1.alte * 10 < t1.tot,
            `basse ${t1.basse}, alte ${t1.alte} su ${t1.tot}`)
  controlla('a livello 9 prevalgono 6-7-8-9 per 6-7-8-9, e le grandi',
            t9.alte * 2 > t9.tot && t9.basse * 10 < t9.tot,
            `basse ${t9.basse}, alte ${t9.alte} su ${t9.tot}`)
  controlla('e ×1 e ×10 non si prendono il volo a livello 1',
            Array.from({ length: 50 }, () => poolVoloTabelline(1)).flat()
              .filter(banale).length < 50 * 8 * 0.3)

  const contaMente = lv => {
    const n = { basse: 0, alte: 0, tot: 0 }
    for (let g = 0; g < 200; g++)
      for (const k of poolVoloMente(lv)) {
        const h = altezzaMente(k)
        n.tot++
        if (h <= 0.3) n.basse++
        if (h >= 0.7) n.alte++
      }
    return n
  }
  const m1 = contaMente(1), m9 = contaMente(9)
  controlla('a livello 1 prevalgono le stazioni basse',
            m1.basse * 2 > m1.tot && m1.alte * 10 < m1.tot,
            `basse ${m1.basse}, alte ${m1.alte} su ${m1.tot}`)
  controlla('a livello 9 le stazioni alte',
            m9.alte * 2 > m9.tot && m9.basse * 10 < m9.tot,
            `basse ${m9.basse}, alte ${m9.alte} su ${m9.tot}`)
  const c5 = new Set(Array.from({ length: 100 }, () => poolVoloMente(5)).flat()
                       .map(k => concettoDiChiave(k)))
  controlla('a metà scala i concetti non sono uno solo', c5.size >= 4, [...c5].join(', '))
  nota(`a livello 5 escono ${c5.size} concetti diversi`)

  /* la pesca pesata: senza rimessa, e il peso conta */
  const pesca = pescaPesati(['a', 'b', 'c'], k => (k === 'a' ? 100 : 1), 3, () => 0.5)
  uguale('la pesca dà tante chiavi quante chieste, senza doppioni', new Set(pesca).size, 3)
  controlla('e quella che pesa di più esce per prima', pesca[0] === 'a')

  /* i due magazzini si alternano, mai più di tre di fila */
  const alt = creaAlternanza()
  const fila = []
  for (let g = 0; g < 300; g++) { const m = alt.prossimo(); alt.segna(m); fila.push(m) }
  const tab = fila.filter(m => m === 'tabelline').length
  controlla('i due magazzini si alternano, metà e metà',
            tab > 100 && tab < 200, `${tab} tabelline su 300`)
  let max = 0, n = 0
  for (let i = 0; i < fila.length; i++) { n = i && fila[i] === fila[i - 1] ? n + 1 : 1; max = Math.max(max, n) }
  controlla(`mai più di ${MAX_DI_FILA} di fila dello stesso`, max <= MAX_DI_FILA, `${max} di fila`)
  const sempre = creaAlternanza()
  for (let g = 0; g < 3; g++) sempre.segna('mente')
  uguale('dopo tre a mente tocca per forza alle tabelline', sempre.prossimo(() => 0.9), 'tabelline')
  controlla('e i magazzini sono due', MAGAZZINI.length === 2)

  /* tutto quello che il volo può chiedere: tutte le tabelline e tutti i
     concetti, cioè quello che la fila finita ha insegnato */
  const tutte = chiaviDelVolo()
  controlla('il volo pesca da tutte e dieci le tabelline',
            chiaviDelle(TUTTE_LE_TABELLE).every(k => tutte.includes(k)))
  controlla('e da tutti i concetti a mente', VOLO.concetti.every(id => chiaviDi(id).some(k => tutte.includes(k))))
  controlla('il volo è uno e non ha portata: non è una tappa della fila',
            VOLO.i === -1 && VOLO.portata === undefined && VOLO.bersaglio === Infinity)
}

/* ═══════════ 5b. LO STRATO OLTRE: IL VOLO CONTINUA SOPRA IL CATALOGO ═══════════
   A livello nove il catalogo è finito — 9×9, «fino a mille» — e chi va
   avanti non deve rifare 20+80: entrano le tabelline grandi (11×8,
   12×5) e i concetti a mente alla taglia del livello. E le chiavi nuove
   non entrano da nessun'altra parte: né nella fila, né nella mappa, né
   nei conti, né nella marea. */
{
  /* ── le grandi, da dove e quanto ── */
  controlla('le grandi sono l\'11 e il 12 interi, e le prime del 13-14-15',
            GRANDI.includes('math:8x11') && GRANDI.includes('math:5x12') &&
            GRANDI.includes('math:12x12') && GRANDI.includes('math:4x13') &&
            !GRANDI.includes('math:7x13') && GRANDI.every(eGrande))
  controlla('nessuna grande è ×1 o ×10: quelle sono regole',
            GRANDI.every(k => !banale(k)) && GRANDI.every(k => !eNulla(k)))
  controlla('e ogni grande sta sopra l\'uno, sotto la mira del tetto',
            GRANDI.every(k => altezzaGrande(k) > 1 && altezzaGrande(k) <= MIRA_OLTRE))
  controlla('11×2 sta sotto 12×5, che sta sotto 12×12',
            altezzaGrande('math:2x11') < altezzaGrande('math:5x12') &&
            altezzaGrande('math:5x12') < altezzaGrande('math:12x12'))
  controlla('e per stima sono più toste di 9×9: sono il boss del volo alto',
            stima('math:8x11') > stima('math:9x9'))

  const quota = (lv, giri = 200) => {
    let g = 0, t = 0
    for (let i = 0; i < giri; i++)
      for (const k of poolVoloTabelline(lv)) { t++; if (eGrande(k)) g++ }
    return g / t
  }
  const q3 = quota(3), q7 = quota(7), q10 = quota(10)
  uguale('a livello 3 non esce mai una grande', q3, 0)
  controlla('a livello 7 cominciano, poche', q7 > 0 && q7 < 0.2, `${(q7 * 100).toFixed(0)}%`)
  controlla('a livello 10 escono più della metà delle volte', q10 > 0.5, `${(q10 * 100).toFixed(0)}%`)
  nota(`grandi nel volo: ${(q7 * 100).toFixed(0)}% a livello 7, ${(quota(9) * 100).toFixed(0)}% a 9, ${(q10 * 100).toFixed(0)}% a 10`)
  const varie = new Set(Array.from({ length: 100 }, () => poolVoloTabelline(11)).flat())
  controlla('a livello 11 le grandi che escono sono tante, non una', varie.size >= 15, `${varie.size} diverse`)

  /* ── la taglia dal livello ── */
  uguale('a livello 1 la taglia è zero', tagliaDelVolo(1), 0)
  uguale('al tetto è piena', tagliaDelVolo(LIVELLO_TETTO), 1)
  controlla('e in mezzo cresce', tagliaDelVolo(3) < tagliaDelVolo(8) && tagliaDelVolo(8) < tagliaDelVolo(11))
  const somme = lv => Array.from({ length: 100 }, () =>
    esercizioDaChiave('calc:tre-cifre-somma', {}, ORA, { taglia: tagliaDelVolo(lv) }))
  uguale('a livello 3 una somma a tre cifre non arriva mai a 800',
         somme(3).filter(e => e.a + e.b >= 800).length, 0)
  const grosse = somme(10).filter(e => e.a + e.b >= 600).length
  controlla('a livello 10 passa i 600 più della metà delle volte', grosse > 50, `${grosse} su 100`)
  const spezza = lv => Array.from({ length: 100 }, () =>
    esercizioDaChiave('calc:spezza-prodotto', {}, ORA,
                      { taglia: tagliaDelVolo(lv), tabelline: [2, 3, 4, 5, 6, 7, 8, 9] }))
  controlla('a livello 3 «spezza» resta sotto il 50', spezza(3).every(e => e.b < 50))
  controlla('a livello 10 arriva oltre il 60', spezza(10).some(e => e.b > 60))
  nota(`tre cifre a livello 10: ${somme(10).slice(0, 3).map(e => e.testo.replace(' = ?', '')).join(' · ')}`)
  nota(`«spezza» a livello 10: ${spezza(10).slice(0, 3).map(e => e.testo.replace(' = ?', '')).join(' · ')}`)
  /* e senza l'opzione la taglia resta quella della forza: nelle tappe
     non cambia niente, e con la testa vuota è zero */
  controlla('senza opzione la taglia viene dallo SRS, come nelle tappe',
            Array.from({ length: 50 }, () => esercizioDaChiave('calc:tre-cifre-somma', {}, ORA))
              .every(e => e.a <= 480 && e.b <= 210))
  /* le divisioni grandi: la casella girata, e «quante volte» a due cifre */
  const girate = Array.from({ length: 300 }, () => giraLaGrande('math:8x12')).filter(Boolean).length
  controlla('una grande su tre esce girata (96 : 12)', girate > 50 && girate < 150, `${girate} su 300`)
  controlla('una casella del catalogo non si gira mai', !Array.from({ length: 50 }, () => giraLaGrande('math:7x8')).some(Boolean))
  const volte = t => Array.from({ length: 200 }, () =>
    esercizioDaChiave('calc:quante-volte', {}, ORA, { taglia: t }))
  controlla('«quante volte» a taglia bassa ha divisori a una cifra', volte(0.3).every(e => e.b <= 9))
  controlla('e a taglia piena anche a due cifre, col resto',
            volte(1).some(e => e.b >= 11 && e.a % e.b !== 0 && e.ris === Math.floor(e.a / e.b)))

  /* ── i distrattori di una grande restano credibili ── */
  const vicini = (a, b) => distrattoriTabellina(a, b, 5).every(v =>
    v > 0 && v !== a * b && Math.abs(v - a * b) <= Math.max(a, b) + 1)
  controlla('i falsi di 12×7 stanno attorno a 84, a un fattore di distanza', vicini(12, 7))
  controlla('e quelli di 11×8 e 12×5 pure', vicini(11, 8) && vicini(12, 5))
  uguale('e sono cinque, distinti', new Set(distrattoriTabellina(12, 7, 5)).size, 5)

  /* ── il boss del volo alto chiede una grande, quello basso no ── */
  const nessuno = {}
  const bossA = Array.from({ length: 30 }, () =>
    chiaveDelBoss(VOLO, null, nessuno, ORA, Math.random, null, caselleDelBoss(3)))
  const bossB = Array.from({ length: 30 }, () =>
    chiaveDelBoss(VOLO, null, nessuno, ORA, Math.random, null, caselleDelBoss(11)))
  controlla('a livello 3 il boss del volo non chiede una grande', !bossA.some(eGrande))
  controlla('a livello 11 sì', bossB.every(eGrande), bossB.slice(0, 3).join(', '))
  controlla('e le caselle del boss sono sempre almeno le 55', caselleDelBoss(1).length === 55)

  /* ── le chiavi nuove non entrano da nessun'altra parte ── */
  const tutteLeGrandi = saputo(GRANDI)
  controlla('nessuna grande è in una tappa della fila',
            SCALETTA.every(v => v.tipo !== 'tab' || chiaviDelle(v.T.tabelle).every(eCasella)))
  controlla('e nessuna nel pool di una tappa',
            CAMPAGNA.every(T => poolTappa(T, tutteLeGrandi, ORA).every(eCasella)))
  uguale('sapere tutte le grandi non fa nessuna tabellina intera',
         tabellineIntereDi({ items: tutteLeGrandi }, ORA).length, 0)
  uguale('né sposta la frontiera della marea', frontieraTabelline(tutteLeGrandi), 0)
  uguale('né conta fra le 55 caselle sicure', abilita({ items: tutteLeGrandi }, 'mate', ORA).imparati, 0)
  uguale('né fra gli «imparati» dei traguardi', misure({ items: tutteLeGrandi }, ORA).imparati('math:'), 0)
  const conLe55 = saputo([...chiaviDelle(TUTTE_LE_TABELLE), ...GRANDI])
  uguale('chi sa tutto ha 55 su 55, non di più', abilita({ items: conLe55 }, 'mate', ORA).imparati, 55)
  controlla('ma la marea le lascia alla curva normale: stanno sopra la frontiera',
            GRANDI.every(k => mareaTabelline(conLe55, ORA)(k) === 1))
  controlla('e il volo le ha tutte fra le sue chiavi',
            GRANDI.every(k => chiaviDelVolo().includes(k)) && CASELLE_DEL_VOLO.length === 55 + GRANDI.length)

  /* ── da dove si parte ── */
  uguale('senza record si parte da 1', partenzaDalRecord(undefined), 1)
  uguale('con un record a livello 3 pure', partenzaDalRecord(3), 1)
  uguale('con un record a livello 11 si parte da 9', partenzaDalRecord(11), 9)
  const prime = Array.from({ length: 10 }, () => poolVoloTabelline(partenzaDalRecord(11))).flat()
  controlla('e chi ha un record a 11 riceve le grandi già nel primo pool',
            prime.filter(eGrande).length > prime.length / 4, `${prime.filter(eGrande).length} su ${prime.length}`)
  controlla('con la taglia alta', tagliaDelVolo(partenzaDalRecord(11)) >= 0.6)
  controlla('chi non ha record parte da livello 1 come oggi: niente grandi nel primo pool',
            !Array.from({ length: 10 }, () => poolVoloTabelline(partenzaDalRecord(null))).flat().some(eGrande))
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

  controlla('i pianeti si susseguono in ordine dentro la fila',
            pianeti.every((v, i) => v.i === i))
  controlla('e le stazioni pure', stazioni.every((v, i) => v.i === i))

  /* LA FILA È UNA SOLA, e non c'è nessuna versione filtrata: c'era
     `scaletta(menteAccesa)`, che toglieva le stazioni e rinumerava i
     pianeti da uno — cioè una seconda numerazione della stessa fila, il
     pezzo su cui poggiava l'interruttore dei grandi. Adesso `pos` e `n`
     stanno sulla voce e dicono la stessa cosa a chiunque guardi. */
  uguale('la scaletta non ha una seconda versione da filtrare',
         typeof ASTEROIDI.scaletta, 'undefined')
  controlla('ogni voce porta la sua posizione in fila',
            SCALETTA.every((v, i) => v.pos === i))
  controlla('e il suo numero, che è la stessa cosa scritta da uno',
            SCALETTA.every(v => v.n === v.pos + 1))
  controlla('superata una voce il contatore si porta subito dopo di lei',
            SCALETTA.every(v => filaDopo(v) === v.pos + 1))
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

  /* ── LE TABELLINE STANNO UN PASSO AVANTI ──
     Il secondo criterio di `data/asteroidi.js`, che la prima fusione
     dichiarava e non applicava: dalla tappa 5 alla 16 alternava a turno,
     e la stazione — due pezzi in testa contro uno — era sempre la più
     dura delle due vicine. Giocando si sentiva (settembre 2026). Adesso
     all'arrivo di ogni stazione che pesa due le tabelline già fatte sono
     più delle stazioni già fatte, oppure sono finite. Le stazioni leggere
     (3+4, 30+40, 12+6) restano dove il ritmo le vuole. */
  const pesoDi = S => Math.max(1, ...S.nuovi.map(id => CONCETTI_PER_ID[id].peso || 1))
  const tutte = CAMPAGNA.filter(T => T.nuova).length
  for (const v of SCALETTA.filter(v => v.tipo === 'mente' && pesoDi(v.T) >= 2)) {
    const prima = SCALETTA.slice(0, v.pos)
    const tab = prima.filter(x => x.tipo === 'pianeta' && x.T.nuova).length
    const sta = prima.filter(x => x.tipo === 'mente').length
    controlla(`${v.T.emoji} ${v.T.nome}: arriva con le tabelline avanti`,
              tab > sta || tab === tutte, `${tab} tabelline fatte e ${sta} stazioni`)
  }

  /* ── LA FILA E L'ETÀ DICONO LA STESSA COSA ──
     Il cancello per età (`data/portata-giochi.js`) legge la portata voce
     per voce, e la prima voce troppo avanti chiude la fila anche se
     dietro c'è una stazione che l'età darebbe. `unita/portata` tollera
     scalini in giù fino a dodici punti in tutte le campagne; dentro
     questa fila si sta più stretti, a cinque — lo scarto delle stazioni
     leggere messe lì per ritmo («Amici e decine» dopo il 10). È il
     controllo che ha fatto salire «Due cifre» e «Riporti e prestiti»
     quando le tabelline sono passate avanti. */
  const scesi = SCALETTA.slice(1)
    .filter((v, i) => v.T.portata < SCALETTA[i].T.portata - 5)
    .map(v => `${SCALETTA[v.pos - 1].T.nome} (${SCALETTA[v.pos - 1].T.portata}) → ${v.T.nome} (${v.T.portata})`)
  controlla('lungo la fila la portata non scende mai più di cinque punti', !scesi.length,
            scesi.join(' · '))
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

/* ═══════════ 9a. UN CONTATORE SOLO, SENZA PROFILO ═══════════
   I due travasi fra la fila e i due specchi sono funzioni pure, e sono
   il pezzo su cui poggia tutto il resto: se `campagneDaFila` e
   `filaDaCampagne` non si rispondono, un profilo migrato risulta
   indietro di una tappa e nessuno se ne accorge finché non lo apre un
   bambino. Si provano qui, sulla fila e basta. */
{
  uguale('a fila zero non è passato niente',
         JSON.stringify(campagneDaFila(0)), JSON.stringify({ pianeta: 0, mente: 0 }))
  const tutto = campagneDaFila(SCALETTA.length)
  uguale('a fila piena sono passati tutti i pianeti', tutto.pianeta, CAMPAGNA.length)
  uguale('e tutte le stazioni', tutto.mente, STAZIONI.length)

  /* dentro la fila i pianeti si susseguono in ordine, quindi «quanti ne
     sono passati» è anche «qual è il prossimo»: è la sola ragione per
     cui gli specchi possono essere dei conteggi */
  let ok = true
  for (let f = 0; f <= SCALETTA.length; f++) {
    const c = campagneDaFila(f)
    const fatte = SCALETTA.slice(0, f)
    if (fatte.some(v => v.i >= (v.tipo === 'pianeta' ? c.pianeta : c.mente))) ok = false
  }
  controlla('lo specchio di una posizione è sempre l\'indice della prossima', ok)

  /* e il travaso all'indietro non toglie mai niente: quello che i due
     contatori di ieri davano per superato resta superato */
  const persi = []
  for (let p = 0; p <= CAMPAGNA.length; p++)
    for (let m = 0; m <= STAZIONI.length; m++) {
      const f = filaDaCampagne(p, m)
      const c = campagneDaFila(f)
      if (c.pianeta < p || c.mente < m) persi.push(`${p}/${m} → ${f}`)
    }
  controlla('migrando non si perde mai una tappa già superata', !persi.length,
            persi.slice(0, 4).join(' · '))
  uguale('e chi non aveva giocato resta a zero', filaDaCampagne(0, 0), 0)
  nota(`chi era al quinto pianeta e alla seconda stazione finisce alla posizione ` +
       `${filaDaCampagne(5, 2)} di ${SCALETTA.length}`)

  /* ── E UN RIORDINO NON RICHIUDE NIENTE ──
     Nel settembre 2026 la fila è stata riordinata (le tabelline un passo
     avanti, vedi `data/asteroidi.js`), e il contatore è una posizione:
     chi l'aveva scritto con l'ordine di prima si ritrova dietro altre
     tappe. Nessun numero di versione: lo assorbe `sincronizzaAsteroidi`,
     che a ogni avvio rilegge la posizione dai due specchi — quanti
     pianeti, quante stazioni — e tiene la più avanzata. Qui si prende
     ogni posizione della fila di prima e si guarda che niente di quello
     che era superato si richiuda. Il prezzo è qualche tappa regalata, e
     va bene così. */
  const FILA_DI_PRIMA = 'm0 m1 p0 p1 m2 p2 m3 p3 m4 p4 m5 p5 m6 p6 m7 p7 p8 m8 m9 m10 p9 m11'.split(' ')
  const richiuse = [], regalate = []
  for (let f = 0; f <= FILA_DI_PRIMA.length; f++) {
    const pianeti = FILA_DI_PRIMA.slice(0, f).filter(c => c[0] === 'p').length
    const p = { mate: { tappa: pianeti, fila: f, libera: false },
                calc: { tappa: f - pianeti, libera: false } }
    sincronizzaAsteroidi(p)
    const ora = campagneDaFila(p.mate.fila)
    if (ora.pianeta < pianeti || ora.mente < f - pianeti) richiuse.push(f)
    if (p.mate.fila > f) regalate.push(`${f}→${p.mate.fila}`)
  }
  uguale('la fila di prima era lunga quanto questa', FILA_DI_PRIMA.length, SCALETTA.length)
  controlla('un salvataggio scritto con la fila di prima non ritrova chiuso niente',
            !richiuse.length, `richiuse alle posizioni ${richiuse.join(', ')}`)
  nota('col riordino si avanzano di qualche tappa:', regalate.join(' · ') || 'nessuno')

  /* ── I DUE VOLI INFINITI SI APRONO INSIEME ──
     Aspettavano ognuno la sua campagna, e siccome i pianeti finiscono
     prima delle stazioni c'erano due sere in cui la mappa offriva il
     volo libero e non quello a mente: una metà del gioco che finisce
     prima dell'altra, dentro una fila che è una. Adesso il cancello è
     la fila, e il conto si fa sul posto esatto in cui l'ultimo pianeta
     va dietro — se fosse rimasto il vecchio, lì uno dei due sarebbe già
     aperto. */
  const ultimoPianeta = Math.max(...SCALETTA.filter(v => v.tipo === 'pianeta').map(v => v.pos))
  const voli = f => {
    const p = { mate: { tappa: 0, fila: f, libera: false },
                calc: { tappa: 0, libera: false } }
    sincronizzaAsteroidi(p)
    return [p.mate.libera, p.calc.libera]
  }
  uguale('coi pianeti finiti ma la fila no, nessuno dei due voli è aperto',
         voli(ultimoPianeta + 1).join(' '), 'false false')
  uguale('e a fila finita si aprono tutti e due',
         voli(SCALETTA.length).join(' '), 'true true')
  controlla('l\'ultimo pianeta non è l\'ultima voce della fila',
            ultimoPianeta < SCALETTA.length - 1,
            'senza questo il controllo qui sopra non prova niente')
}

/* ═══════════ 9. I PROGRESSI DI IERI ═══════════
   La cosa che, se sbagliata, non la vede nessun test ma la vede il
   bambino che riapre il gioco e non trova più i suoi pianeti. Si semina
   un profilo vero — quello di chi era **al quinto pianeta e alla
   seconda stazione**, coi due contatori di prima della fila unica — e si
   guarda cosa gli mostra la fila di adesso.

   Il patto è quello scritto in testa a `data/asteroidi.js`: il contatore
   diventa uno solo, e la migrazione è **generosa** — chi aveva superato
   una tappa non se la ritrova chiusa, e in cambio un pugno di stazioni
   in mezzo passa senza essere stato giocato. */
{
  for (const k of await chiavi('')) await remove(k)
  state.giocatori = []
  state.player = ''
  // un profilo come quelli di ieri: due contatori, nessun `fila`, nessun `varianti`
  save('profilo:Ieri', { v: 6, coins: 0, items: {}, totals: { math: 0 },
                         mate: { tappa: 5, libera: false },
                         calc: { tappa: 2, libera: false } })
  await flush()
  await init()
  await selectPlayer('Ieri')

  const contatore = filaDi(mateProgresso())
  uguale('i due contatori di ieri diventano una posizione sola',
         contatore, filaDaCampagne(5, 2))
  uguale('e i due specchi si riscrivono da lì',
         mateProgresso().tappa, campagneDaFila(contatore).pianeta)
  uguale('anche quello delle stazioni',
         calcProgresso().tappa, campagneDaFila(contatore).mente)

  const fila = SCALETTA
  const fatte = fila.filter(v => superata(v, contatore))
  uguale('i cinque pianeti superati sono ancora superati',
         fatte.filter(v => v.tipo === 'pianeta').length, 5)
  controlla('e sono proprio i primi cinque, non altri',
            fatte.filter(v => v.tipo === 'pianeta').every((v, i) => v.i === i))
  controlla('nessuna delle due stazioni giocate è tornata chiusa',
            fatte.filter(v => v.tipo === 'mente').length >= 2)

  /* IL PUNTO DI TUTTO: una tappa aperta, non due. Prima ce n'erano due
     in mezzo alla fila — la 6 aperta, la 7 chiusa, la 8 aperta — ed è
     il difetto che la fila unica è venuta a togliere. */
  const aperte = fila.filter(v => raggiunta(v, contatore) && !superata(v, contatore))
  uguale('in tutta la fila c\'è una tappa aperta e una sola', aperte.length, 1)
  uguale('ed è la prima non superata', aperte[0].pos, contatore)
  controlla('niente si è aperto da solo più avanti',
            fila.filter(v => raggiunta(v, contatore)).length === contatore + 1)
  controlla('e le superate sono un blocco senza buchi in testa alla fila',
            fatte.every((v, i) => v.pos === i))

  /* dove si è arrivati, che è quello che dice la home */
  const dove = posizioneOra(contatore)
  uguale('la home apre sulla prima tappa non ancora fatta', fila[dove].pos, contatore)
  uguale('e «quante ne ha fatte» è lo stesso numero', dove, fatte.length)

  /* ── E NON C'È NESSUN INTERRUTTORE CHE LA ACCORCI ──
     `settings.varianti['asteroidi:mente']` toglieva le stazioni dalla
     fila, e per farlo si portava dietro una seconda numerazione dei
     pianeti e un contatore che scavalcava le tappe saltate. Se n'è
     andato insieme al meccanismo che lo reggeva, che non aveva altri
     inquilini: qui si controlla che non torni di soppiatto — cioè che
     non esista più nessun modo di spegnere «metà di un gioco». */
  uguale('il meccanismo delle varianti non esiste più',
         [typeof PROFILO.varianteAccesa, typeof PROFILO.accendiVariante].join(' '),
         'undefined undefined')
  uguale('e un profilo non porta nessun elenco di varianti',
         state.profile.settings.varianti, undefined)
  uguale('la fila è intera per tutti', SCALETTA.length,
         CAMPAGNA.length + STAZIONI.length)

  /* ── «adesso tocca a» segue la fila, non la campagna ── */
  const seguito = []
  let v = SCALETTA[0]
  for (let i = 0; i < 3 && v; i++) {
    seguito.push(v.tipo)
    v = dopoDi(v, SCALETTA.length)   // tutto aperto, niente superato
  }
  controlla('dopo una tappa può toccare all\'altro mestiere',
            new Set(seguito).size > 1, seguito.join(' → '))

  const qui = fila.find(v => v.pos === contatore - 1)
  const dopoUltima = dopoDi(qui, contatore)
  controlla('e dopo la tappa appena finita si va alla prima non fatta e aperta',
            dopoUltima && !superata(dopoUltima, contatore) &&
            raggiunta(dopoUltima, contatore),
            dopoUltima ? dopoUltima.T.nome : 'nessuna')

  /* ── e da qui in poi il contatore cammina di uno ──
     Superata la tappa aperta, quella dopo si apre e nessuna viene
     scavalcata: è la promessa che con due contatori non si poteva fare. */
  asteroidiCompleta(aperte[0])
  uguale('superata una tappa il contatore avanza di uno',
         filaDi(mateProgresso()), contatore + 1)
  const ora = SCALETTA.filter(v => raggiunta(v, filaDi(mateProgresso())) &&
                                   !superata(v, filaDi(mateProgresso())))
  uguale('e la tappa aperta resta una sola', ora.length, 1)
  uguale('cioè quella subito dopo', ora[0].pos, contatore + 1)

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

/* ═══════════ 10. LA MAREA ═══════════
   Il guasto, visto giocando: un bambino che sa tutto fino all'8 si
   vedeva chiedere 2×3 nel volo libero. Non l'aveva sbagliato — non lo
   vedeva da dieci giorni, e la curva dell'oblio del motore, uguale per
   ogni elemento, lo faceva arrugginire quanto un 7×8: forza efficace da
   4 a 3, e un elemento arrugginito pesa più di uno appena imparato. La
   curva è giusta e cieca a una cosa che un maestro vede subito: chi sa
   7×8 non ha dimenticato 2×3.

   `store/marea.js` stima la FRONTIERA — fin dove il bambino sa tutto —
   e rallenta il decadimento di quello che sta sotto, in proporzione
   alla distanza. Qui si prova con lo stesso finto bambino: la stima, la
   curva, e i tre «non» che la tengono onesta (non tocca la frontiera,
   non tocca lo sbaglio recente, non rende niente eterno). Due stime
   separate: chi sa 47+29 non ha nessun titolo su 7×8. */
{
  /* le caselle fino alla tabellina `n` compresa, più ×1 e ×10 (che
     sono regole e il gioco le dà per sapute): ogni chiave UNA volta,
     altrimenti la forza parte da sei invece che da cinque */
  const finoA = n => {
    const out = new Set()
    for (let a = 1; a <= n; a++) for (let b = a; b <= n; b++) out.add(chiaveCalcolo(a, b))
    for (let a = 1; a <= 10; a++) out.add(chiaveCalcolo(a, 10))
    return [...out]
  }
  const tabellineNel = p => new Set(p.map(k => {
    const [lo, hi] = fattoriDi(k)
    return lo === 1 || hi === 10 ? 'banale' : hi
  }))

  /* ── la curva ── */
  uguale('alla frontiera e sopra la curva è quella di sempre',
         [lentezzaDa(0), lentezzaDa(-1), lentezzaDa(-3)].join(' '), '1 1 1')
  controlla('sotto cresce con la distanza, senza gradini',
            lentezzaDa(1) > 1 && lentezzaDa(2) > lentezzaDa(1) && lentezzaDa(4) > lentezzaDa(2),
            [1, 2, 3, 4].map(lentezzaDa).join(' '))
  dentro('a un gradino sotto è quasi la curva normale', lentezzaDa(1), 1.1, 1.5)
  dentro('a quattro gradini sotto si vede a un quinto della cadenza', lentezzaDa(4), 4, 6)
  uguale('e non passa mai il tetto', lentezzaDa(20), MAREA_MAX)
  nota(`la curva: ${[0, 1, 2, 3, 4, 5, 6].map(d => lentezzaDa(d)).join(' · ')}` +
       ` — con l'intervallo più lungo (${IVL[IVL.length - 1]} giorni) il tetto fa ` +
       `${Math.round(IVL[IVL.length - 1] * MAREA_MAX / 30)} mesi`)

  /* ── la frontiera delle tabelline ── */
  uguale('chi non sa niente non ha nessuna frontiera', frontieraTabelline({}), 0)
  uguale('chi sa tutto fino all\'8 ha la frontiera all\'8',
         frontieraTabelline(saputo(finoA(8))), 8)
  uguale('chi sa tutto ce l\'ha al 9', frontieraTabelline(saputo(finoA(9))), 9)
  const buco = saputo(finoA(8).filter(k => !calcoliTabellina(5).includes(k)))
  uguale('un buco al 5 ferma la frontiera al 4, anche se il 7 regge',
         frontieraTabelline(buco), 4)
  const quasi = saputo(finoA(8).filter(k => k !== 'math:7x8'))
  uguale('una casella sola che manca non la ferma: una su cinque può mancare',
         frontieraTabelline(quasi), 8)
  uguale('e ×1 e ×10 non contano: sono regole, non fatti',
         frontieraTabelline(saputo(finoA(8).filter(k => !banale(k)))), 8)

  /* ── chi sa fino all'8 non riceve 2×3 per solo decadimento ──
     Quaranta giorni: a forza cinque l'intervallo è di otto giorni, e
     la curva di sempre porta la forza efficace sotto la padronanza
     dopo trentadue. La marea la tiene su per sette mesi. */
  {
    const items = saputo(finoA(8), ORA - 40 * GIORNO)
    const m = mareaTabelline(items, ORA)
    uguale('la tabellina del 9, che sta sopra la frontiera, ha la curva di sempre',
           m('math:8x9'), 1)
    uguale('e l\'8, che È la frontiera, pure', m('math:7x8'), 1)
    controlla('mentre 2×3, sei gradini sotto, è al tetto', m('math:2x3') >= 5,
              `lentezza ${m('math:2x3')}`)
    controlla('e ×1 sta in fondo alla scala per principio', m('math:1x7') >= m('math:2x3'))
    uguale('senza la marea 2×3 sarebbe già arrugginito',
           strength(items['math:2x3'], ORA) < SRS.masterS, true)
    uguale('con la marea è ancora saputo', strength(items['math:2x3'], ORA, m('math:2x3')),
           SRS.masterS + 1)

    for (const giorni of [12, 30]) {
      const it = saputo(finoA(8), ORA - giorni * GIORNO)
      const t = poolTappa(CAMPAGNA[8], it, ORA)
      const tt = tabellineNel(t)
      controlla(`dopo ${giorni} giorni il pianeta del 9 non ripesca il 2, il 3 o il 4`,
                ![2, 3, 4].some(n => tt.has(n)), [...tt].join(', '))
    }

    /* E NEL VOLO LA MAREA SI SOMMA ALLA MIRA. Il pool lo dà il livello
       (`store/volo.js`), il picker ci pesca dentro con la lentezza della
       marea: a livello 3 la mira offre sia 2×3 sia 2×7, e per chi sa fino
       all'8 il picker deve preferire quello vicino alla frontiera. Si
       confronta con lo stesso volo senza marea, che è la sola prova che
       la differenza la fa lei e non la mira. */
    const conta = (it, lentezza) => {
      const picker = createPicker({ getItem: k => it[k] || newItem(), useTime: true, lentezza })
      let basse = 0
      for (let g = 0; g < 1000; g++) {
        const k = picker.pick(poolVoloTabelline(3), ORA)
        if (!banale(k) && fattoriDi(k)[1] <= 3) basse++
      }
      return basse
    }
    const it = saputo(finoA(8), ORA - 30 * GIORNO)
    const conMarea = conta(it, mareaTabelline(it, ORA))
    const senza = conta(it, () => 1)
    controlla('nel volo, a livello 3, chi sa fino all\'8 rivede 2-3 meno che senza marea',
              conMarea * 4 < senza * 3, `${conMarea} con la marea, ${senza} senza, su 1000`)
    nota(`volo a livello 3, chi sa fino all'8: ${conMarea} caselle del 2-3 con la marea, ${senza} senza`)
  }

  /* ── ma lo riceve, se l'ha sbagliato ieri ── */
  {
    const items = saputo(finoA(8), ORA - 12 * GIORNO)
    items['math:2x3'] = record(items['math:2x3'], { correct: false, ms: 3000, now: ORA - GIORNO })
    const m = mareaTabelline(items, ORA)
    uguale('la frontiera non si muove per uno sbaglio solo', frontieraTabelline(items), 8)
    uguale('ma 2×3 sbagliato ieri torna alla curva di sempre', m('math:2x3'), 1)
    controlla('e nel pianeta del 9 pure', poolTappa(CAMPAGNA[8], items, ORA).includes('math:2x3'))
    uguale('mentre 2×4, mai sbagliato, resta fermo', m('math:2x4') > 1, true)
    // e dopo un mese lo sbaglio è passato: torna sotto la marea
    const dopo = mareaTabelline(items, ORA + RIENTRO)
    controlla('passato il mese dello sbaglio la marea lo riprende', dopo('math:2x3') > 1)
  }

  /* ── chi sa tutto ripassa 7-8-9 più di 2-3-4 ── */
  {
    const items = saputo(finoA(9), ORA - 60 * GIORNO)
    const m = mareaTabelline(items, ORA)
    controlla('per chi sa tutto il 9 si dimentica più in fretta del 2',
              m('math:2x3') > m('math:7x9'), `2×3: ${m('math:2x3')}, 7×9: ${m('math:7x9')}`)
    /* nel volo a livello 5 la mira sta a metà, e offre tanto 3×4 quanto
       3×7: per chi sa tutto è la marea a far uscire il 7-8-9 più del 2-3-4 */
    const picker = createPicker({ getItem: k => items[k] || newItem(), useTime: true,
                                  lentezza: mareaTabelline(items, ORA) })
    let alte = 0, basse = 0
    for (let g = 0; g < 200; g++) {
      const [lo, hi] = fattoriDi(picker.pick(poolVoloTabelline(5), ORA))
      if (lo === 1 || hi === 10) continue
      if (hi >= 7) alte++; else if (hi <= 4) basse++
    }
    controlla('e nel volo a metà scala 7-8-9 escono più di 2-3-4',
              alte > basse * 2, `${alte} contro ${basse}`)
    nota(`chi sa tutto, volo a livello 5: ${alte} caselle del 7-8-9 contro ${basse} del 2-3-4`)
  }

  /* ── e il boss non ne sa niente ── */
  {
    const items = saputo(finoA(8), ORA - 30 * GIORNO)
    const scelte = Array.from({ length: 100 },
      () => chiaveDelBoss(VOLO, null, items, ORA))
    controlla('il boss chiede ancora la casella più tosta, non una arrugginita in fondo',
              scelte.every(k => fattoriDi(k)[1] >= 7), [...new Set(scelte)].join(', '))
  }

  /* ── il calcolo a mente: una stima SUA ── */
  {
    const ks = STAZIONI.slice(0, 6).flatMap(S => S.nuovi).flatMap(id => chiaviDi(id))
    const items = saputo([...new Set(ks)], ORA - 12 * GIORNO)
    uguale('chi sa le prime sei stazioni ha la frontiera alla sesta',
           frontieraCalcolo(items), 6)
    uguale('e sulle tabelline non ha nessuna frontiera: sono due mestieri',
           frontieraTabelline(items), 0)
    uguale('chi sa fino all\'8 non ha nessuna frontiera a mente',
           frontieraCalcolo(saputo(finoA(8))), 0)

    const m = mareaCalcolo(items, ORA)
    uguale('«Due cifre», la frontiera, ha la curva di sempre', m('calc:due-somma'), 1)
    uguale('e «Riporti», che sta sopra, pure', m('calc:somma-riporto'), 1)
    controlla('mentre 3+4, cinque stazioni sotto, va piano', m('calc:3+4') >= 5,
              `lentezza ${m('calc:3+4')}`)

    const S = STAZIONI[6]
    const stazioneDi = k => STAZIONI.findIndex(x => x.nuovi.includes(concettoDiChiave(k)))
    let vecchie = 0
    for (let g = 0; g < 20; g++) {
      const p = poolDi(S, items, ORA + g * GIORNO)
      vecchie += p.filter(k => stazioneDi(k) <= 1).length
    }
    uguale('nella stazione dei riporti, per venti giorni, le prime due stazioni non tornano',
           vecchie, 0)

    // sbagliato ieri: 3+4 torna, con la forza che gli resta
    items['calc:3+4'] = record(items['calc:3+4'], { correct: false, ms: 3000, now: ORA - GIORNO })
    uguale('3+4 sbagliato ieri torna alla curva di sempre', mareaCalcolo(items, ORA)('calc:3+4'), 1)
    controlla('e sta nel pool della stazione dei riporti',
              poolDi(S, items, ORA).includes('calc:3+4'), poolDi(S, items, ORA).join(' '))
  }
}

riassunto('Asteroidi: quali domande escono, e in che ordine')
