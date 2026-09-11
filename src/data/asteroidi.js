/* ═══════════════════════════════════════════════════════════════════
   LA SCALETTA DEGLI ASTEROIDI — una fila sola, i pianeti e le stazioni
   mescolati per difficoltà vera.

   Prima erano due campagne dietro due linguette: 🪐 i pianeti (una
   tabellina a testa, `data/tabelline.js`) e 🛰️ le stazioni del calcolo a
   mente (`data/calcolo.js`). Sono due facce della stessa moneta — la
   stessa aritmetica, gli stessi asteroidi, lo stesso motore — e tenerle
   separate obbligava a scegliere una scheda prima di scegliere una
   tappa, cioè a rispondere alla domanda «preferisci le tabelline o i
   conti a mente?», che è un'altra di quelle a cui un bambino non sa
   rispondere. Qui la fila è una, e l'ordine è già deciso.

   ═══════════ COME È STATO DECISO L'ORDINE ═══════════

   Non è un'alternanza a turno («uno di qua, uno di là»): quella si
   scrive in tre righe e non vuol dire niente. Le due liste si fondono
   **una volta**, guardando cosa chiede davvero ogni tappa, e da lì in
   poi la fila è dato puro. Tre criteri, in quest'ordine di autorità:

   1. **I VINCOLI MISURATI.** Il grafo dei prerequisiti di
      `store/calcolo.js` è già scritto: un concetto non si apre finché i
      suoi `prereq` non reggono, e i concetti moltiplicativi dichiarano
      anche `tabelline: N` — quante tabelline devono stare in piedi. Sono
      i punti dove le due campagne si toccano per davvero, e sono numeri,
      non opinioni: `spezza-prodotto` (4×23) vuole quattro tabelline
      salde, `divide-tabellina` (56:8) pure. Nessuna tappa può stare
      prima di quello che le serve, e `unita/asteroidi` lo verifica
      camminando la fila con un finto bambino: a ogni tappa controlla che
      quello che sta per essere chiesto sia già **aperto**.
   2. **QUANTI PEZZI SI TENGONO A MENTE.** È l'unica moneta che le due
      liste hanno in comune, ed è già dichiarata: un concetto porta il
      suo `peso` (1..3, «quanto costa in testa»), una tabellina è un
      fatto solo da ricordare — il gioco infatti le dà `peso` 1 — la cui
      fatica sta in quanti dei due fattori vanno saputi a memoria
      (`durezza` in `store/tabelline.js`).
   3. **IL RITMO.** A pari difficoltà si alterna, perché dieci pianeti di
      fila prima di un conto a mente sono di nuovo due campagne
      appiccicate, e perché passare dalla memoria (una tabellina) al
      ragionamento (una strategia) e ritorno è il modo in cui le due cose
      si sostengono a vicenda invece di farsi concorrenza.

   Voce per voce, il perché delle giunzioni — che è la parte che non si
   ricava rileggendo la fila:

   · **«Fino al dieci» e «Oltre la decina» prima di ogni tabellina.**
     3+4 e 8+5 sono il pavimento di tutto il resto, e la tabellina del 2
     è i *doppi*, che stanno dentro «Fino al dieci»: chi non sa che 7+7
     fa 14 non ha modo di sapere che 2×7 fa 14, ce l'ha solo di
     impararlo a memoria.
   · **Il pianeta del 10 prima di «Amici e decine».** 30+40 è «3 decine
     più 4 decine»: è la regola dello zero applicata alla somma. Impararla
     con la tabellina del 10 già in mano costa una frase; il contrario
     costa una tappa.
   · **«Due cifre e una» (12+6, 34+20) prima del pianeta del 3.** Chiede
     solo le decine tonde, che sono appena arrivate, e non chiede niente
     di moltiplicativo: è il gradino additivo più basso rimasto.
   · **Il pianeta del 3 chiude il quartetto delle regole.** Con 2, 10, 5 e
     3 saldi si arriva a quattro tabelline, che è la soglia dichiarata da
     `spezza-prodotto` e `divide-tabellina`: da qui in poi il grafo non
     sbarra più niente, e l'ordine lo decidono i pezzi da tenere a mente.
   · **«Passa la decina» (26+7) prima di «Due cifre» (23+45).** È la
     scelta già presa dentro le stazioni e regge anche qui: 26+7 è 6+7
     con davanti una decina che si muove di uno, 23+45 sono due colonne
     che non si parlano. Fra i due si infilano i pianeti del 4 e del 6,
     che sono raddoppi di roba già saputa (4 è il 2 due volte, 6 è il 3
     raddoppiato) e non chiedono niente di nuovo alla testa.
   · **«Riporti e prestiti» (27+38) e i pianeti del 7 e dell'8 nello
     stesso capitolo.** Sono i quattro gradini più alti dei rispettivi
     mestieri: il riporto è la prima volta che due colonne si parlano, il
     7 e l'8 sono le uniche tabelline che non hanno una regola da dire a
     voce. Vanno insieme perché costano uguale, alternati perché
     costano tanto.
   · **«I quasi tondi» (47+29) dopo il riporto e prima di moltiplicare.**
     Non porta numeri più grandi, porta una furbizia: si arrotonda e si
     aggiusta. Ha senso solo dopo aver fatto 27+38 alla maniera lunga, se
     no non c'è nessuna scorciatoia da riconoscere.
   · **Moltiplicare e dividere a mente dopo TUTTE le tabelline.** Il grafo
     ne chiederebbe quattro; quattro bastano a non sbagliare, non a
     imparare. 4×23 e 56:8 pescano il fattore fra le tabelline che
     reggono (`tabVera` in `data/calcolo.js`): con quattro esce sempre lo
     stesso pugno di numeri, con nove escono tutte. E 56:8 è
     letteralmente la tabellina dell'8 girata: chiederla prima del
     pianeta dell'8 vorrebbe dire insegnare il contrario di una cosa che
     non si sa ancora.
   · **«Fino a mille» in fondo, con i due esami.** 497+298 è il riporto
     con una cifra in più, e il Sole e «La prova» non portano niente di
     nuovo: sono le due verifiche, una per mestiere.

   ═══════════ UN CONTATORE SOLO, SU UNA FILA SOLA ═══════════

   La fila è una, e adesso lo è anche il progresso: `mate.fila` dice
   quante voci della scaletta sono state passate, ed è l'unico numero che
   decide cosa è aperto. Prima erano due — `mate.tappa` per i pianeti,
   `calc.tappa` per le stazioni — e la fila era una sola solo a vedersi:
   sotto restavano due binari, con **due tappe aperte insieme** in mezzo
   alla scaletta, una per mestiere. Da fuori quello non si legge come
   «due progressi rispettati», si legge come una fila che non si capisce
   dove continui: la tappa 6 è aperta, la 7 è chiusa, la 8 è aperta.

   I due contatori restano scritti nel profilo, ma **come specchio e non
   come cancello**: li tiene allineati `sincronizzaAsteroidi` in
   `store/profile.js`, e servono a chi parla di una campagna sola — i
   traguardi che contano le tabelline fatte, la mappa dei concetti, i due
   voli infiniti. Il gioco non li interroga più per sapere cosa è aperto.

   ── LA MIGRAZIONE, E PERCHÉ È GENEROSA ──
   Chi ha già giocato ha due numeri e ne serve uno, e con un'unica fila
   l'informazione che si perde è inevitabile: qualcuno era al quinto
   pianeta e alla seconda stazione, cioè avanti su un binario e indietro
   sull'altro. Fra le due strade — tirarlo indietro alla prima voce non
   passata, o portarlo avanti all'ultima passata — si prende la seconda
   (`filaDaCampagne`): **chi ha superato una tappa non se la ritrova
   chiusa**. Il prezzo è che un pugno di stazioni in mezzo risulti
   passato senza essere stato giocato, e va bene così: regalare due
   tappe a chi c'era è un attimo di stupore, richiuderne tre che aveva
   vinto è la sera in cui il gioco gli ha mangiato i progressi.

   La migrazione si riconosce da sé — un profilo senza `mate.fila` viene
   da prima — e scatta anche su una copia rimessa dal cestino, che è
   l'altra strada da cui un salvataggio vecchio torna in circolo.

   ── E DA QUI IN POI NON SI PERDE PIÙ NIENTE ──
   A fila unica il contatore cammina di una voce per volta e non scavalca
   niente: `filaDopo` è la posizione della tappa appena superata più uno.
   Non c'è nessun caso in cui una voce venga saltata — ce n'era uno, il
   calcolo a mente spento, ed è andato via con l'interruttore (qui
   sotto).

   ── UN SEGNO SOLO SULLA FILA: ⭐ = SUPERATA ──
   Il conto è uno, quindi anche il segno accanto a una tappa è uno.
   Erano due — la ✔ del bersaglio preso e la ⭐ della tabellina che il
   motore dà per imparata — e leggere una lista di tappe voleva dire
   sapere quali due domande diverse stessero rispondendo due simboli
   vicini. Quello che il motore sa non sparisce: sta in «Cosa so», nei
   due conti in cima alla mappa (✖️ n/10, 🧠 n/12), nell'albo e nei
   traguardi, che sono i posti dove quella domanda è **la** domanda. Qui
   la domanda è un'altra, ed è una sola: dove sono arrivato.

   ═══════════ E NON C'È NESSUN INTERRUTTORE ═══════════

   C'era: `settings.varianti['asteroidi:mente']` toglieva le voci a mente
   dalla fila e richiudeva i pianeti senza buchi. Non si rifà, ed è la
   cosa da non rimettere. Era la spaccatura in due metà scritta a mano —
   la stessa domanda «preferisci le tabelline o i conti a mente?», solo
   spostata dal bambino al genitore — e per reggerla servivano una fila
   filtrata, una numerazione che si ricalcolava, un `menteAccesa` in giro
   per quattro file e, sotto, un contatore che scavalcava le stazioni
   saltate: un grande lo spegneva per un mese e si ritrovava mezza
   scaletta passata senza che nessuno l'avesse giocata.

   Quello che quell'interruttore voleva davvero — «questo bambino le
   tabelline le fa, i conti a mente ancora no» — lo dicono già le due
   manopole che esistono: l'età, che apre in anticipo quello che sa già e
   tiene chiuso quello che gli sta avanti (`data/portata-giochi.js`), e i
   pezzi di scuola spenti (`settings.sa`), che tolgono le domande che
   danno per scontata una cosa mai fatta. Nessuna delle due spacca il
   gioco in due metà.
   ═══════════════════════════════════════════════════════════════════ */
import { CAMPAGNA } from './tabelline.js'
import { STAZIONI } from './calcolo.js'

/* I capitoli. Servono a due cose insieme: raccontare la salita («adesso
   si fanno le decine») e spezzare ventidue righe in blocchi da tre o
   quattro, che su un telefono stretto è la differenza fra una lista che
   si scorre e un muro. Le voci sono codici: `p` + indice del pianeta in
   `CAMPAGNA`, `m` + indice della stazione in `STAZIONI`. */
const CAPITOLI_ORDINE = [
  { emoji: '🚀', titolo: 'Si comincia',
    che: 'I primi conti e le prime due tabelline, quelle che sono una regola.',
    voci: ['m0', 'm1', 'p0', 'p1'] },
  { emoji: '🌑', titolo: 'Le decine',
    che: 'Le decine tonde, gli amici del dieci, e le tabelline che si contano.',
    voci: ['m2', 'p2', 'm3', 'p3'] },
  { emoji: '🌓', titolo: 'Due cifre',
    che: 'I numeri diventano grandi, ma le colonne non si parlano ancora.',
    voci: ['m4', 'p4', 'm5', 'p5'] },
  { emoji: '☄️', titolo: 'I conti che si portano',
    che: 'Il riporto e il prestito, e le due tabelline senza scorciatoie.',
    voci: ['m6', 'p6', 'm7', 'p7'] },
  { emoji: '🌠', titolo: 'Moltiplicare e dividere a mente',
    che: 'Adesso che le tabelline ci sono tutte, si può moltiplicare in grande.',
    voci: ['p8', 'm8', 'm9'] },
  { emoji: '⭐', titolo: 'Fino a mille, e la prova',
    che: 'I numeri grandi, e poi le due verifiche: niente di nuovo, nessuno sconto.',
    voci: ['m10', 'p9', 'm11'] },
]

const daCodice = c => {
  const i = +c.slice(1)
  return c[0] === 'p'
    ? { tipo: 'pianeta', i, T: CAMPAGNA[i] }
    : { tipo: 'mente', i, T: STAZIONI[i] }
}

/* La scaletta intera, com'è scritta qui sopra, ed è **l'unica**: non
   c'è nessuna versione filtrata, perché non c'è più niente da filtrare.
   `cap` è l'indice del capitolo, e serve alla mappa per stampare il
   titolino una volta sola; `pos` è la posizione nella fila, ed è l'unica
   coordinata che conta da quando il progresso è un numero solo; `n` è
   lo stesso numero scritto per un bambino, cioè da uno — sta qui e non
   nella schermata perché una fila sola ha una numerazione sola, e
   ricalcolarla altrove era il pezzo che serviva all'interruttore.
   `i` resta l'indice dentro la campagna di provenienza, e serve ancora a
   chi parla di una campagna sola: il premio della tappa, la tavola
   pitagorica, la mappa dei concetti. */
export const SCALETTA = CAPITOLI_ORDINE
  .flatMap((c, cap) => c.voci.map(codice => ({ ...daCodice(codice), cap })))
  .map((v, pos) => ({ ...v, pos, n: pos + 1 }))

export const CAPITOLI = CAPITOLI_ORDINE.map(({ emoji, titolo, che }) => ({ emoji, titolo, che }))

/* ═══════════ le domande che si fanno sulla fila ═══════════
   Tutto quello che segue lavora su UN numero: quante voci della fila
   sono state passate. Sono funzioni pure — girano in Node e non
   importano il profilo. */

/* il contatore, letto dal campo degli asteroidi del profilo */
export const filaDi = mate => Math.max(0, Math.round((mate && mate.fila) || 0))

/* ── i due travasi fra il contatore solo e i due specchi ──
   `campagneDaFila` dice quanti pianeti e quante stazioni stanno dietro
   una posizione: siccome dentro la fila i pianeti si susseguono in
   ordine (e le stazioni pure), quel conteggio è anche l'indice della
   prossima di quella campagna, che è esattamente quello che vogliono
   dire `mate.tappa` e `calc.tappa`.

   `filaDaCampagne` fa il contrario, ed è la migrazione: la posizione
   **più avanzata** compatibile con i due contatori di ieri, cioè uno
   dopo l'ultima voce che risultava superata. Generosa di proposito — il
   perché sta in testa al file. */
export function campagneDaFila(fila) {
  const fatte = SCALETTA.slice(0, Math.max(0, Math.min(SCALETTA.length, fila)))
  return { pianeta: fatte.filter(v => v.tipo === 'pianeta').length,
           mente: fatte.filter(v => v.tipo === 'mente').length }
}

export function filaDaCampagne(pianeti = 0, mente = 0) {
  let ultima = -1
  for (const v of SCALETTA) if (v.i < (v.tipo === 'pianeta' ? pianeti : mente)) ultima = v.pos
  return ultima + 1
}

/* dove si porta il contatore chi ha appena superato questa voce */
export const filaDopo = v => v.pos + 1

/* superata: la fila l'ha già lasciata dietro. Una domanda sola, uguale
   per un pianeta e per una stazione — che è tutto il punto. */
export const superata = (v, fila) => v.pos < fila

/* dove si è arrivati: quante voci della fila sono superate, che è anche
   l'indice della prossima da giocare. È il numero che la home mostra
   («7 tappe su 22») e il posto su cui si apre la mappa. Con una fila
   sola è il contatore stesso, tenuto dentro i bordi — il conto esiste
   ancora come funzione perché chi chiama non deve sapere quanto è lunga
   la scaletta per non sforarla. */
export const posizioneOra = fila => Math.max(0, Math.min(SCALETTA.length, fila))

/* raggiunta: superata, oppure **la** prossima della fila. Una sola, e
   non più una per mestiere: è qui che si legge il contatore unico. Chi
   chiama ci mette davanti `tuttoAperto()` (vedi `tappaAperta` in
   `store/profile.js`). */
export const raggiunta = (v, fila) => v.pos <= fila

/* la voce dopo, seguendo la fila: è quella che il cartello di fine tappa
   annuncia e che il tasto «avanti» gioca. Salta quelle già superate —
   chi rigioca una vecchia tappa vuole tornare dov'era — e quelle ancora
   chiuse, che con l'età di mezzo possono capitare anche adesso che il
   contatore è uno. */
export function dopoDi(voce, fila, aperta = v => raggiunta(v, fila)) {
  const da = SCALETTA.findIndex(v => v.pos === voce.pos)
  if (da < 0) return null
  const resto = SCALETTA.slice(da + 1)
  return resto.find(v => aperta(v) && !superata(v, fila)) ||
         resto.find(v => aperta(v)) || null
}
