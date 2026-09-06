/* ═══════════════════════════════════════════════════════════════════
   LA BANCARELLA, SENZA BROWSER

   Le spese sono generate, e la promessa da non rompere è una sola ma
   grossa: **il resto deve essere componibile esattamente** con le
   monete che ci sono nel cassetto in quella giornata. Se non lo fosse,
   il bambino resterebbe lì a provare monete finché il cliente se ne
   va, senza aver sbagliato niente.

   Poi ci sono le promesse del mercato a tappe: il cliente chiede solo
   roba che è sul banco davanti a lui (non c'è più nessun reparto da
   aprire, quindi non può esistere merce invisibile), su un banco ci
   stanno al massimo otto ceste, e ogni banco ne ha abbastanza da
   riempirsi in tutte le giornate.

   E poi **la scaletta**, che è la ragione per cui questo file è stato
   riscritto. Il difetto era il verdetto di un genitore — «passa da
   super semplice a super complessa nell'ultimo livello» — e la cura è
   una fila di sedici giornate in cui ognuna aggiunge **una cosa
   sola**. Una regola così non si controlla a occhio: la tabella sta in
   testa a `data/bancarella.js` e qui si conta leva per leva.

   `node test/esegui.mjs bancarella --niente-build` */
import { generaCliente, esposizione, tappaDi, campagnaDi,
         merceDi, scaffale, scomponi, euro, chiaveResto, fasciaDi,
         fatica, leve, premioCliente, pagaMassima, centesimiScritti, scriviCifra,
         LISTINO, BANCHI, CAMPAGNE, LIBERA, FASCE, TAGLI, CONTI, SALTO,
         PORTATA_DA, PORTATA_A, MAX_CESTE, CLIENTI_PER_TAPPA } from '../../src/data/bancarella.js'
import { migraMercato, MERCATO_VERSIONE } from '../../src/store/profile.js'
import { controlla, uguale, dentro, nota, riassunto } from '../aiuto/verifica.mjs'

const GIRI = 200            // clienti per tappa

const guasti = new Set()
const spese = new Set()
const fasceViste = {}
const pezziResto = {}       // giornata -> quante monete ci sono volute, per cliente
let clienti = 0, monetePerResto = 0, conCopie = 0

for (const camp of [...CAMPAGNE, LIBERA]) {
  fasceViste[camp.id] = new Set()
  pezziResto[camp.id] = []
  const quante = camp.libera ? camp.tappe.length * 2 : camp.tappe.length
  for (let n = 0; n < quante; n++) {
    const t = tappaDi(camp, n)
    const esposti = esposizione(t)

    /* --- il banco --- */
    if (esposti.length > MAX_CESTE) guasti.add(`${camp.id}: ${esposti.length} ceste sul banco`)
    if (esposti.length < camp.articoli[1])
      guasti.add(`${camp.id}/${t.banco}: solo ${esposti.length} prodotti per spese da ${camp.articoli[1]}`)
    if (esposti.some(p => p.banco !== t.banco)) guasti.add(`${camp.id}: merce di un altro banco`)
    if (new Set(esposti.map(p => p.emoji)).size !== esposti.length)
      guasti.add(`${camp.id}: cesta doppia sul banco`)

    for (let g = 0; g < GIRI; g++) {
      const c = generaCliente(t, esposti)
      clienti++
      spese.add(c.articoli.map(a => a.emoji).sort().join(''))
      fasceViste[camp.id].add(fasciaDi(c.resto).id)

      /* --- la spesa --- */
      if (c.articoli.reduce((s, a) => s + a.prezzo * a.quanti, 0) !== c.totale)
        guasti.add('totale incoerente')
      if (c.totale <= 0) guasti.add('totale nullo')
      if (new Set(c.articoli.map(a => a.emoji)).size !== c.articoli.length)
        guasti.add('merce doppia nella stessa spesa')
      if (c.articoli.length < camp.articoli[0] || c.articoli.length > camp.articoli[1])
        guasti.add(`${camp.id}: spesa da ${c.articoli.length} articoli`)
      /* IL TETTO: è la leva che tiene «le somme entro il dieci», e se non
         reggesse la prima giornata del totale chiederebbe 17 + 4 a un
         bambino di sei anni e mezzo */
      if (camp.tetto && c.totale > camp.tetto)
        guasti.add(`${camp.id}: spesa da ${euro(c.totale)} sopra il tetto di ${euro(camp.tetto)}`)

      /* --- «due angurie»: le copie dello stesso prodotto --- */
      const pezzi = c.articoli.reduce((s, a) => s + a.quanti, 0)
      if (pezzi !== c.pezzi) guasti.add('conto dei pezzi incoerente')
      if (c.articoli.some(a => a.quanti < 1 || a.quanti > 3))
        guasti.add(`${camp.id}: ${c.articoli.map(a => a.quanti).join('+')} pezzi dello stesso prodotto`)
      if (pezzi > c.articoli.length + (camp.copie || 0))
        guasti.add(`${camp.id}: ${pezzi} pezzi per ${c.articoli.length} articoli`)
      if (pezzi > c.articoli.length) conCopie++
      if (!camp.copie && pezzi !== c.articoli.length)
        guasti.add(`${camp.id}: copie dove non dovrebbero essercene`)

      /* --- IL PUNTO DELLE TAPPE: si chiede solo quello che si vede --- */
      for (const a of c.articoli) {
        if (!esposti.some(p => p.emoji === a.emoji))
          guasti.add(`${camp.id}/${t.banco}: chiede ${a.nome}, che non è sul banco`)
        const voce = LISTINO.find(([e]) => e === a.emoji)
        if (!voce) guasti.add('articolo fuori listino: ' + a.emoji)
        else if (voce[2] !== a.prezzo) guasti.add(`${a.nome} a ${a.prezzo} invece di ${voce[2]}`)
        if (a.prezzo % camp.passo) guasti.add(`${camp.id}: ${a.nome} non è multiplo di ${camp.passo}`)
      }

      /* --- il resto --- */
      if (c.resto !== c.paga - c.totale) guasti.add('resto incoerente')
      if (c.resto <= 0) guasti.add('resto nullo: il cliente pagherebbe esatto')
      if (c.chiave !== chiaveResto(c.resto)) guasti.add('chiave del resto sbagliata')
      /* CON COSA PAGA: dove la giornata dichiara la banconota, quella deve
         essere — è tutta la promessa di «il resto da venti euro» */
      if (camp.paga && !camp.paga.includes(c.paga))
        guasti.add(`${camp.id}: paga con ${euro(c.paga)}, che non è fra [${camp.paga}]`)

      /* deve venir fuori esatto con le monete del cassetto, e `minimo` deve
         essere davvero il minimo, non una stima */
      const dp = new Array(c.resto + 1).fill(Infinity); dp[0] = 0
      for (let v = 1; v <= c.resto; v++)
        for (const m of c.monete) if (m <= v) dp[v] = Math.min(dp[v], dp[v - m] + 1)
      if (!Number.isFinite(dp[c.resto]))
        guasti.add(`resto ${euro(c.resto)} non componibile con [${c.monete}]`)
      else if (dp[c.resto] !== c.minimo)
        guasti.add(`${euro(c.resto)}: minimo ${c.minimo} invece di ${dp[c.resto]}`)
      else monetePerResto += c.minimo
      pezziResto[camp.id].push(c.minimo)

      /* --- con cosa paga: roba che si tira fuori dal portafoglio --- */
      if (c.pagaCon.reduce((a, b) => a + b, 0) !== c.paga) guasti.add('pagamento incoerente')
      if (c.pagaCon.length > 3) guasti.add(`paga con ${c.pagaCon.length} pezzi`)

      /* --- chi fa i conti: quello che dice la giornata, non altro --- */
      if (c.chiediTotale !== (camp.conto === 'totale' || camp.conto === 'tutto'))
        guasti.add(`${camp.id}: il totale lo chiede a chi non deve`)
      if (c.chiediResto !== (camp.conto === 'resto' || camp.conto === 'tutto'))
        guasti.add(`${camp.id}: il resto lo chiede a chi non deve`)

      /* --- il tempo dato a QUESTO cliente --- */
      if (c.pazienza < 40) guasti.add(`${camp.id}: solo ${c.pazienza}s per ${pezzi} pezzi`)
      if (c.pazienza !== t.tempo + 8 * (pezzi - 3))
        guasti.add(`${camp.id}: pazienza scollegata dalla spesa`)
    }
  }
}

controlla('nessuna spesa impossibile', guasti.size === 0, [...guasti].slice(0, 6).join(' · '))
nota(`${clienti} clienti generati · ${spese.size} spese diverse · ` +
     `${(monetePerResto / clienti).toFixed(1)} monete a resto in media`)

/* ══════════════════════════════════════════════════════════════════
   LA SCALETTA: una cosa nuova per giornata, e mai due insieme
   ══════════════════════════════════════════════════════════════════ */
const salite = CAMPAGNE.slice(1).map((c, i) => {
  const qui = leve(c), prima = leve(CAMPAGNE[i])
  return Object.keys(qui).filter(k => qui[k] > prima[k])
})
const troppe = salite.map((s, i) => [CAMPAGNE[i + 1].id, s])
                     .filter(([, s]) => s.length !== 1)
controlla('ogni giornata aggiunge una cosa sola, e ne aggiunge una',
          troppe.length === 0,
          troppe.map(([id, s]) => `${id}: ${s.length ? s.join('+') : 'niente di nuovo'}`).join(' · '))
nota('la cosa nuova, giornata per giornata: ' +
     salite.map((s, i) => `${CAMPAGNE[i + 1].emoji}${s.join('+')}`).join(' · '))

controlla('ogni giornata dice a parole cosa aggiunge',
          CAMPAGNE.slice(1).every(c => c.nuovo && c.nuovo.length > 3),
          CAMPAGNE.slice(1).filter(c => !c.nuovo).map(c => c.id).join(', '))
uguale('la prima non aggiunge niente, perché non c\'è niente prima',
       CAMPAGNE[0].nuovo, undefined)

/* ── e la fatica non fa salti ──
   Il difetto vecchio, misurato: fra la fiera e la cassa rotta ci si
   passava da «componi quello che ti dico» a «fai due conti tu». */
const fatiche = CAMPAGNE.map(fatica)
const salti = fatiche.slice(1).map((f, i) => f - fatiche[i])
const scalini = salti.map((d, i) => [CAMPAGNE[i + 1].id, d]).filter(([, d]) => d > SALTO)
controlla(`nessuno scalino più alto di ${SALTO}`, scalini.length === 0,
          scalini.map(([id, d]) => `${id} +${d}`).join(' · '))
nota('fatica: ' + fatiche.join(' → '))

/* ── il conto non torna mai indietro ──
   Alleggerire le altre leve quando entra un conto nuovo è la regola;
   togliere un conto già imparato sarebbe un'altra cosa. */
const conti = CAMPAGNE.map(c => CONTI.indexOf(c.conto))
uguale('tutte le giornate dichiarano un conto che esiste',
       conti.filter(i => i < 0).length, 0)
controlla('e il conto chiesto non scende mai',
          conti.every((n, i) => i === 0 || n >= conti[i - 1]),
          CAMPAGNE.map(c => c.conto).join(' → '))
controlla('si comincia senza conti e si finisce con tutti e due',
          CAMPAGNE[0].conto === 'niente' && CAMPAGNE[CAMPAGNE.length - 1].conto === 'tutto',
          `${CAMPAGNE[0].conto} … ${CAMPAGNE[CAMPAGNE.length - 1].conto}`)
for (const conto of CONTI)
  controlla(`c'è almeno una giornata che chiede «${conto}»`,
            CAMPAGNE.some(c => c.conto === conto))
/* la cassa rotta resta l'ultima: è il traguardo, non il gradino */
uguale('la cassa rotta è l\'ultima giornata',
       CAMPAGNE.findIndex(c => c.id === 'mente'), CAMPAGNE.length - 1)
/* e le sei giornate di ieri sono tutte ancora qui, con lo stesso id:
   rinominarne una vorrebbe dire perdere il salvataggio di chi c'era */
for (const id of ['banchetto', 'paese', 'grande', 'coperto', 'fiera', 'mente'])
  controlla(`la giornata «${id}» c'è ancora`, CAMPAGNE.some(c => c.id === id))

/* ── LE OPERAZIONI AMMESSE, GIORNATA PER GIORNATA ──
   Non basta che le leve siano ordinate: quello che conta è il conto che
   arriva davvero. Qui si guardano i clienti veri delle giornate del
   totale e del resto, e si chiede che i numeri siano quelli promessi. */
const conti_ammessi = [
  ['conto-dieci', c => c.totale % 100 === 0 && c.totale <= 1000,
   'somme in euro tondi entro il 10'],
  ['conto-tre', c => c.totale % 100 === 0 && c.totale <= 1000 && c.articoli.length === 3,
   'tre addendi in euro tondi entro il 10'],
  ['conto-venti', c => c.totale % 100 === 0 && c.totale <= 2000,
   'somme in euro tondi entro il 20'],
  ['resto-dieci', c => c.totale % 100 === 0 && c.paga === 1000,
   'euro tondi, e paga sempre con 10 €'],
  ['resto-venti', c => c.totale % 100 === 0 && c.paga === 2000,
   'euro tondi, e paga sempre con 20 €'],
  ['resto-cinquanta', c => c.totale % 100 === 0 && c.paga === 5000,
   'euro tondi, e paga sempre con 50 €'],
]
for (const [id, ammessa, che] of conti_ammessi) {
  const camp = CAMPAGNE.find(c => c.id === id)
  const brutti = []
  for (let n = 0; n < camp.tappe.length; n++) {
    const t = tappaDi(camp, n), e = esposizione(t)
    for (let g = 0; g < 120; g++) {
      const c = generaCliente(t, e)
      if (!ammessa(c)) brutti.push(`${c.articoli.map(a => euro(a.prezzo)).join('+')} = ${euro(c.totale)}, paga ${euro(c.paga)}`)
    }
  }
  controlla(`${id}: ${che}`, brutti.length === 0, brutti.slice(0, 3).join(' · '))
}

/* ── la portata: ricavata, non scelta ── */
const portate = CAMPAGNE.map(c => c.portata)
controlla('la portata non torna mai indietro',
          portate.every((p, i) => i === 0 || p >= portate[i - 1]), portate.join(' → '))
uguale('parte dove dice il gioco', portate[0], PORTATA_DA)
uguale('e arriva dove dice il gioco', portate[portate.length - 1], PORTATA_A)
const salitePortata = portate.slice(1).map((p, i) => p - portate[i])
dentro('e nessun passo è più di mezzo anno di scuola',
       Math.max(...salitePortata), 0, 7)
controlla('sotto i sei anni la bancarella non si offre', portate[0] >= 32,
          `la prima giornata sta a ${portate[0]}`)
nota('portata: ' + portate.join(' → '))

/* ── i premi: una giornata facile rende meno di una tosta ──
   `CALIBRAZIONE.md`: 🪙1 sono dieci secondi di esercizio. */
const premi = CAMPAGNE.map(premioCliente)
controlla('il premio per cliente non scende mai',
          premi.every((p, i) => i === 0 || p >= premi[i - 1]), premi.join(' → '))
dentro('una giornata intera sta fra i quattro e i dieci minuti di esercizio',
       Math.max(...CAMPAGNE.map(c => premioCliente(c) * c.tappe.length * CLIENTI_PER_TAPPA)),
       24, 60)
uguale('la giornata più facile rende meno della più tosta',
       premi[0] < premi[premi.length - 1], true)
nota('monete per giornata: ' + CAMPAGNE.map(c =>
  `${c.emoji}${premioCliente(c) * c.tappe.length * CLIENTI_PER_TAPPA}`).join(' · '))

/* ── la migrazione: chi giocava alle sei giornate non perde niente ──
   `mercato.tappa` è un indice, e la fila si è allungata in mezzo. */
const dopoMigra = k => migraMercato({ tappa: 0, libera: false, v: MERCATO_VERSIONE },
                                    { tappa: k, libera: k >= 6 }).tappa
const dove = id => CAMPAGNE.findIndex(c => c.id === id)
uguale('chi non aveva ancora giocato resta all\'inizio', dopoMigra(0), 0)
uguale('chi aveva finito il banchetto trova aperto il mercato del paese',
       dopoMigra(1), dove('paese'))
uguale('chi era arrivato al mercato grande lo ritrova superato',
       dopoMigra(3) > dove('grande'), true)
uguale('chi aveva finito il mercato coperto ce l\'ha ancora dietro le spalle',
       dopoMigra(4) > dove('coperto'), true)
uguale('chi aveva finito la fiera pure', dopoMigra(5) > dove('fiera'), true)
uguale('e chi aveva finito tutto trova tutto aperto', dopoMigra(6), CAMPAGNE.length)
controlla('nessuno torna indietro',
          [0, 1, 2, 3, 4, 5, 6].every((k, i, v) => i === 0 || dopoMigra(k) >= dopoMigra(v[i - 1])),
          [0, 1, 2, 3, 4, 5, 6].map(dopoMigra).join(' · '))
uguale('la giornata libera già presa resta presa',
       migraMercato({ tappa: 0, libera: false, v: MERCATO_VERSIONE },
                    { tappa: 6, libera: true }).libera, true)
uguale('e un salvataggio già migrato non si tocca due volte',
       migraMercato({ tappa: 0, libera: false, v: MERCATO_VERSIONE },
                    { tappa: 3, libera: false, v: MERCATO_VERSIONE }).tappa, 3)
uguale('un profilo nuovo nasce già alla versione di adesso',
       migraMercato({ tappa: 0, libera: false, v: MERCATO_VERSIONE }, null).v, MERCATO_VERSIONE)
nota('vecchia tappa → nuova: ' + [0, 1, 2, 3, 4, 5, 6].map(k => `${k}→${dopoMigra(k)}`).join(' · '))

/* ── la tastiera della cassa: si scrive un prezzo, non dei centesimi ── */
uguale('quattro euro tondi', centesimiScritti('4'), 400)
uguale('quattro e trenta', centesimiScritti('4,30'), 430)
uguale('quattro e tre vuol dire quattro e trenta', centesimiScritti('4,3'), 430)
uguale('cinquanta centesimi', centesimiScritti('0,50'), 50)
uguale('niente scritto non è zero', centesimiScritti(''), null)
uguale('e nemmeno una virgola da sola', centesimiScritti(','), null)
uguale('una virgola sola per cifra', scriviCifra('4,3', ','), '4,3')
uguale('dopo due decimali non si scrive più', scriviCifra('4,30', '5'), '4,30')
uguale('il cancelletto toglie l\'ultima', scriviCifra('4,30', '⌫'), '4,3')
uguale('non si comincia da zero', scriviCifra('0', '7'), '7')
uguale('ma zero virgola sì', scriviCifra('', ','), '0,')

/* ── le fasce di apprendimento crescono di giornata in giornata ──
   Nelle prime giornate i prezzi sono in euro tondi e i centesimi non
   compaiono: è giusto così, ed è la ragione per cui il motore le tiene
   separate invece di avere un solo «resto». */
uguale('nella prima giornata si sta agli euro tondi',
       [...fasceViste[CAMPAGNE[0].id]].every(f => f === 'euro'), true)
const finale = CAMPAGNE.find(c => c.passo === 1)
controlla('nelle giornate a prezzi pieni si arriva ai centesimi',
          fasceViste[finale.id].has('centesimi'), [...fasceViste[finale.id]].join(' · '))
const tutte = new Set(Object.values(fasceViste).flatMap(s => [...s]))
uguale('prima o poi si incontrano tutte le fasce', tutte.size, FASCE.length)
nota('fasce per giornata: ' + CAMPAGNE.map(c => `${c.emoji}→${fasceViste[c.id].size}`).join(' · '))

/* ── i banchi: arrivare a una tappa non deve mai deludere ── */
for (const camp of [...CAMPAGNE, LIBERA])
  for (const b of camp.tappe) {
    const quanti = merceDi(camp.passo, b).length
    controlla(`${camp.id}: il banco ${b} è pieno`, quanti >= 6, `solo ${quanti} prodotti`)
  }
const emoji = LISTINO.map(x => x[0])
uguale('nessun prodotto ripetuto nel listino', new Set(emoji).size, emoji.length)
controlla('ogni prodotto sta su un banco che esiste',
          LISTINO.every(([, , , b]) => BANCHI[b]),
          LISTINO.filter(([, , , b]) => !BANCHI[b]).map(x => x[1]).join(', '))
controlla('ogni banco è una tappa di qualche giornata',
          Object.keys(BANCHI).every(b => CAMPAGNE.some(c => c.tappe.includes(b))),
          Object.keys(BANCHI).filter(b => !CAMPAGNE.some(c => c.tappe.includes(b))).join(', '))
/* la riserva di euro tondi: senza, la prima somma comincerebbe da 0,89 + 1,39 */
for (const b of Object.keys(BANCHI))
  controlla(`il banco ${b} ha sei cose in euro tondi`, merceDi(100, b).length >= 6,
            `solo ${merceDi(100, b).length}`)
nota('prodotti in vendita per passo: ' +
     [100, 50, 10, 5, 1].map(p => `${p}c→${scaffale(p).length}`).join(' · ') + ` su ${LISTINO.length}`)

/* ══ IL TEMPO: la campagna deve stringere, non strozzare ══
   È la ragione per cui la bancarella è diventata una campagna: prima
   c'erano 45 secondi secchi e bastava un cliente sfortunato per perdere.
   Adesso il tempo si stringe **dentro una fase** e torna largo quando
   entra un conto nuovo: la fatica si è spostata sulla testa. */
const primi = CAMPAGNE.map(c => tappaDi(c, 0).tempo)
const ultimi = CAMPAGNE.map(c => tappaDi(c, c.tappe.length - 1).tempo)
controlla('dentro la giornata il tempo si stringe',
          CAMPAGNE.every((c, i) => ultimi[i] <= primi[i]),
          CAMPAGNE.map((c, i) => `${c.id} ${primi[i]}→${ultimi[i]}s`).join(' · '))
for (const conto of CONTI) {
  const fase = CAMPAGNE.map((c, i) => [c, i]).filter(([c]) => c.conto === conto)
  controlla(`dentro «${conto}» il tempo si stringe di giornata in giornata`,
            fase.every(([, i], k) => k === 0 || primi[i] <= primi[fase[k - 1][1]]),
            fase.map(([, i]) => primi[i] + 's').join(' → '))
}
controlla('quando entra un conto nuovo il tempo torna largo',
          CAMPAGNE.every((c, i) => i === 0 || c.conto === CAMPAGNE[i - 1].conto ||
                                   primi[i] >= primi[i - 1]),
          CAMPAGNE.map((c, i) => `${c.conto}:${primi[i]}`).join(' '))
controlla('la prima giornata è larga: un minuto e mezzo buono', primi[0] >= 90, `${primi[0]}s`)
controlla('e nemmeno l\'ultima scende sotto i settanta secondi',
          Math.min(...ultimi) >= 70, `${Math.min(...ultimi)}s`)
controlla('la giornata libera si ferma prima di diventare impossibile',
          tappaDi(LIBERA, 200).tempo >= 45, `${tappaDi(LIBERA, 200).tempo}s`)

/* ══ QUANTE MONETE VUOLE IL RESTO ══
   Dove la giornata lo promette (`pezzi`), il cliente sceglie con cosa
   pagare apposta perché il resto venga di quella misura. Dove la
   banconota è fissa la promessa non si può fare, e infatti non c'è. */
const media = a => a.reduce((s, n) => s + n, 0) / a.length
for (const camp of CAMPAGNE.filter(c => c.pezzi)) {
  const [min, max] = camp.pezzi
  const fuori = pezziResto[camp.id].filter(n => n < min || n > max)
  controlla(`${camp.id}: il resto è della misura promessa (${min}-${max} monete)`,
            fuori.length / pezziResto[camp.id].length < 0.02,
            `${fuori.length} resti fuori misura su ${pezziResto[camp.id].length}` +
            (fuori.length ? ` (fino a ${Math.max(...fuori)} monete)` : ''))
}
controlla('nella prima giornata bastano una o due monete',
          media(pezziResto[CAMPAGNE[0].id]) <= 2,
          `${media(pezziResto[CAMPAGNE[0].id]).toFixed(2)} monete di media`)
nota('monete per resto: ' +
     CAMPAGNE.map(c => `${c.emoji} ${media(pezziResto[c.id]).toFixed(1)}`).join(' · '))

/* ══ «due angurie, per favore» ══ */
controlla('nella prima giornata si chiede una cosa per volta',
          pezziResto[CAMPAGNE[0].id].length > 0 && CAMPAGNE[0].copie === 0)
controlla('più avanti si chiedono anche due o tre pezzi uguali', conCopie > 0,
          `${conCopie} spese con copie su ${clienti}`)
const copie = CAMPAGNE.map(c => c.copie || 0)
controlla('le copie crescono con le giornate',
          copie.every((c, i) => i === 0 || c >= copie[i - 1]), copie.join(' → '))
nota('tempo per giornata: ' + CAMPAGNE.map((c, i) => `${c.emoji} ${primi[i]}→${ultimi[i]}s`).join(' · '))

/* ══ L'ULTIMA GIORNATA: la cassa rotta ══
   Il resto lo conta il bambino E il totale pure, quindi il gioco deve
   dargli aria: tempo largo, prezzi meno fini, resto corto. */
const rotta = CAMPAGNE[CAMPAGNE.length - 1]
uguale('l\'ultima giornata non calcola più niente', rotta.conto, 'tutto')
controlla('lì il cliente lo sa di dover fare tutti e due i conti', (() => {
  const c = generaCliente(tappaDi(rotta, 0))
  return c.chiediTotale === true && c.chiediResto === true
})())
controlla('il tempo torna largo', tappaDi(rotta, 0).tempo >= 90,
          `${tappaDi(rotta, 0).tempo}s`)
/* corto rispetto a dov'era arrivato: al mercato coperto i prezzi sono al
   centesimo, qui tornano a cinque — perché la fatica adesso è il conto */
const coperto = CAMPAGNE.find(c => c.id === 'coperto')
controlla('e i prezzi tornano meno fini', rotta.passo > coperto.passo,
          `${rotta.passo}c contro ${coperto.passo}c`)
/* «il resto torna corto» detto in modo che non dipenda dal caso: al mercato
   coperto il resto può finire con qualunque centesimo — 0,37 € — e qui no,
   è sempre un multiplo di cinque. Confrontare le medie sarebbe stato più
   diretto e più fragile: la merce esposta cambia a ogni giro, e due misure
   a un decimo di distanza si scambiano di posto da sole. */
const restiRotti = []
for (let n = 0; n < rotta.tappe.length; n++) {
  const t = tappaDi(rotta, n), e = esposizione(t)
  for (let g = 0; g < 150; g++) restiRotti.push(generaCliente(t, e).resto)
}
controlla('e con loro il resto torna corto: sempre multipli di cinque centesimi',
          restiRotti.every(r => r % 5 === 0),
          restiRotti.filter(r => r % 5).slice(0, 3).map(euro).join(' · '))
controlla('le giornate prima della fase «tutto» il totale lo fa la cassa',
          CAMPAGNE.filter(c => c.conto === 'resto')
                  .every(c => !generaCliente(tappaDi(c, 0)).chiediTotale))
controlla('e nelle prime la cassa fa tutto lei',
          CAMPAGNE.filter(c => c.conto === 'niente').every(c => {
            const x = generaCliente(tappaDi(c, 0))
            return !x.chiediTotale && !x.chiediResto
          }))
controlla('nella giornata libera la cassa resta rotta',
          generaCliente(tappaDi(LIBERA, 0)).chiediResto === true)

/* ── la forma della campagna ── */
controlla('le giornate sono una fila lunga', CAMPAGNE.length >= 12, `${CAMPAGNE.length} giornate`)
uguale('fuori dall\'elenco si finisce nella giornata libera', campagnaDi(-1).id, 'libera')
uguale('la giornata libera gira su tutti i banchi',
       LIBERA.tappe.length, Object.keys(BANCHI).length)
uguale('e il suo giro ricomincia da capo', tappaDi(LIBERA, LIBERA.tappe.length).banco, LIBERA.tappe[0])
dentro('tre clienti a banco: una fila che si vede tutta', CLIENTI_PER_TAPPA, 2, 4)
uguale('nessuna giornata senza id', new Set(CAMPAGNE.map(c => c.id)).size, CAMPAGNE.length)
nota('giornate: ' + CAMPAGNE.map(c => `${c.nome} (${c.tappe.length}×${CLIENTI_PER_TAPPA})`).join(' · '))

/* ── i conti di contorno ── */
uguale('un euro si scrive come lo scrive un italiano', euro(150), '1,50 €')
uguale('anche zero virgola cinque', euro(50), '0,50 €')
uguale('col taglio più grande si compone il minimo', scomponi(385, TAGLI).length, 6)
uguale('la scomposizione fa la cifra giusta',
       scomponi(385, TAGLI).reduce((a, b) => a + b, 0), 385)
uguale('cinquanta euro sono una banconota sola', scomponi(5000, TAGLI).length, 1)
uguale('gli euro tondi finiscono nella fascia degli euro', chiaveResto(300), 'bancarella:euro')
uguale('due e trentasette finisce nei centesimi', chiaveResto(237), 'bancarella:centesimi')
uguale('due e quaranta finisce nelle decine', chiaveResto(240), 'bancarella:decine')
dentro('le fasce sono cinque, quanto i gradini dei tagli', FASCE.length, 5, 5)
uguale('la banconota più grossa la dice la giornata',
       pagaMassima(CAMPAGNE.find(c => c.id === 'resto-cinquanta')), 5000)

riassunto('la bancarella')
