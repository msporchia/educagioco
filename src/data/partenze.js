/* ═══════════════════════════════════════════════════════════════════
   DA DOVE PARTE UN BAMBINO — le quattro partenze che si scelgono
   quando se ne aggiunge uno, e la prima volta che l'app si apre.

   IL PROBLEMA. Un profilo nuovo nasce con tutto acceso: dodici giochi e
   trenta macrogruppi di sapere. Per un bambino di quattro anni vuol dire
   una home con dentro le divisioni in colonna e le conversioni fra
   litri, cioè undici carte su tredici che non sa aprire; per uno di
   terza vuol dire domande che presuppongono cose che a scuola non ha
   ancora fatto. La strada c'era già — i genitori spengono a mano, gioco
   per gioco e sapere per sapere — ma è lunga trenta tocchi, e va fatta
   *prima* che il bambino apra il gioco la prima volta, che è esattamente
   il momento in cui uno ha meno voglia di sedersi a configurare.

   COSA SONO. Un pugno di eccezioni scritte una volta sola, al momento
   della creazione. Non un campo nuovo nel profilo, non una modalità che
   resta: **dopo, si tocca tutto a mano come prima**. Un bambino «terza
   elementare» che a marzo impara le divisioni non va promosso a
   «quarta»: gli si riaccendono le divisioni, che è la stessa cosa che si
   sarebbe fatta senza le partenze.

   Questo ha una conseguenza che va detta, perché è il rovescio della
   stessa medaglia: un gioco aggiunto dopo, nel profilo, non c'è.
   **Vale quello che la partenza di quest'età scriverebbe oggi**, e non
   perché lo si scriva: si legge ogni volta (`spentoDallEta` in
   `data/portata-giochi.js`, e il quadro dei grandi fa la stessa
   lettura). Congelare la partenza nel profilo la farebbe diventare una
   modalità invece di un punto di partenza; leggerla al momento no.

   Il patto era il contrario — acceso è l'assenza, e un gioco nuovo
   nasceva acceso per tutti — e voleva dire due home diverse per due
   bambini della stessa età: la carta compariva a quello nato prima del
   gioco e non a quello nato dopo, e nel quadro la riga diceva «c'è»
   con la tacca su «come dice l'età: arriva più avanti». Un gioco che
   il bambino ha già aperto però non sparisce: è la regola della
   portata, e vale anche qui.

   PERCHÉ I GIOCHI SI CALCOLANO E I SAPERI SI ELENCANO. I giochi escono
   da due dichiarazioni nel manifesto — `piccoli: true` e `grandi: true`,
   le due estremità — quindi un gioco nuovo entra nella partenza giusta
   da solo. `grandi` vuol dire «dà per scontato che legga da solo, o la
   matematica delle classi alte»: è quello che spegne la partenza di chi
   entra in prima. Chi non dichiara niente sta in mezzo e resta acceso
   per tutti tranne che per i piccolissimi — acceso è l'assenza anche
   qui.

   I saperi invece stanno scritti qui uno per uno: dire «tutto quello
   che è matematica» sembra più furbo, ma le materie in `saperi.js`
   servono a raggruppare la schermata, non a dire in che anno si
   imparano — e un elenco che si legge è meglio di una regola che
   indovina. `test/unita/partenze.test.mjs`
   controlla che ogni chiave citata qui esista davvero.

   ── COSA SI SPEGNE, E COSA INVECE SI INSEGNA ─────────────────────
   La regola con cui si decide, e va letta prima di aggiungere una
   riga a un elenco qui sotto: **si spegne quello che non si può
   insegnare in una carta; quello che si può insegnare resta, e si
   insegna.**

   Spegnere non è la risposta a «è difficile», e non è nemmeno la
   risposta a «a scuola non l'ha ancora fatto». Una domanda su un
   concetto mai visto, ma che sta in una riga di spiegazione — «47 sta
   fra 40 e 50: l'ultima cifra è 7, quindi si va su» — non è muta: è
   una cosa nuova che il gioco insegna, ed è il mestiere per cui i
   moduli hanno un `aiuto`. Toglierla vuol dire togliere una lezione,
   non una presa in giro. Va spento quello che in una frase non si
   spiega: ruotare una figura a mente, contare i cubetti che stanno
   dietro a quelli che si vedono, capire cosa si vede guardando un
   cilindro dall'alto — lì non c'è una riga che colmi il buco, c'è un
   pezzo di scuola che manca.

   Il metro resta il programma della primaria italiana, con le due
   eccezioni di sempre: i gruppi di **ragionamento** non hanno una
   lezione da aver fatto (`materia: 'ragionamento'` in `saperi.js`, che
   lo dice già), e quello che **la scuola non dà affatto** — dove vive
   il pinguino arriva dai libri illustrati — non si giudica col
   programma.

   E quando un gruppo è troppo grosso, si spegne **a sottovoci**: i
   nomi dei solidi sono di prima e le viste dall'alto sono di quinta,
   e spegnere «I solidi» per prendere le seconde porterebbe via i
   primi. `settings.sa` accetta sia la chiave di un gruppo sia quella
   di una tipologia (`store/profile.js`, `saperiSpenti`), e per chi fa
   le domande sono la stessa cosa (`Modulo.tipoSpento`).

   ── E OGNI FASCIA DEVE PRONUNCIARSI SU TUTTO ─────────────────────
   `tiene` è l'altra metà di `saperi`: uno dice cosa si spegne,
   l'altro **perché il resto resta acceso**. Non è documentazione — è
   quello che rende visibile l'errore per omissione, che è l'unico che
   qui si fa davvero: `stima` è rimasta accesa in terza per anni
   perché l'elenco era stato scritto pensando ai conti in colonna e
   nessuno era più tornato a guardare il resto del catalogo, ed è lo
   stesso identico difetto della fascia dei quattro anni raccontato
   più sotto. Un test che controlla quello che c'è non può vedere
   quello che manca: bisogna pretendere un verdetto per ogni pezzo di
   scuola. `test/unita/partenze.test.mjs` diventa rosso se un sapere
   nuovo non ne ha uno, e la catena si propaga dai piccoli in su.
   ═══════════════════════════════════════════════════════════════════ */
import { GIOCHI } from './giochi.js'
/* ── L'ETÀ ──
   Il terzo pezzo di una partenza, arrivato con le domande per i più
   piccoli. Giochi e saperi dicono *cosa* si vede e *cosa* si dà per
   scontato; l'età dice **quali domande arrivano**, perché ogni classe
   di domande dichiara a che età serve (`quiz/nucleo/classi.js`).

   Serve perché le due cose non si sostituiscono: si può sapere contare
   fino a venti e non saper leggere una consegna di dodici parole, e
   nessun macrogruppo di `saperi.js` esprime «leggo a fatica». L'età sì,
   e taglia da tutte e due le parti — a chi comincia non arrivano le
   domande di quarta, e a chi è in quinta non arrivano i pallini da
   contare, che sarebbero un premio preso in giro.

   È un numero solo (`anni`, da non confondere con `eta`, che è
   l'etichetta che si legge sulla carta) e sta in mezzo alla fascia:
   «prima o seconda» è 6,5.

   LE QUATTRO CARTE SONO UNA SCORCIATOIA, NON UNA GABBIA. Da quando
   l'età è un numero che si sposta di mezzo anno per volta, scegliere
   fra quattro gruppi serve solo a non far cominciare nessuno da un
   modulo vuoto: dal giorno dopo si tocca il numero e basta, dalla carta
   del bambino nella schermata dei grandi. Le carte lo dicono, perché un
   genitore che crede di aver scelto una categoria non va più a
   cercarla. Non è un dato anagrafico — nessuno chiede la data di nascita —
   è la taratura delle domande, e da lì in poi si sposta a mano. */

/* Quattro e non sei: le partenze servono a far partire, non a
   fotografare il programma ministeriale. Chi sta in quinta parte da
   «quarta», che ha già tutto acceso. La quarta voce è arrivata dopo, e
   per un motivo che si vede solo regalando il gioco: fra «non va ancora
   a scuola» (due carte, niente da leggere) e «terza elementare»
   (tabelline, problemi scritti, domande a tempo) c'era un salto di due
   anni e mezzo, e chi entra in prima ci cascava dentro — troppo grande
   per il primo, troppo piccolo per il secondo. */
/* `nome` è come si legge su una carta, `come` è come si legge **dentro
   una frase**: «come in prima o seconda». Sembrano la stessa cosa e non
   lo sono — «Non va ancora a scuola» è una frase compiuta, e infilata
   in un'altra viene fuori «come in non va ancora a scuola». */
export const PARTENZE = [
  {
    chiave: 'piccoli',
    come: 'prima della scuola',
    nome: 'Non va ancora a scuola',
    eta: '4-6 anni',
    che: 'Solo i giochi che non chiedono di saper leggere, e in cui non si può perdere.',
    /* tutti i giochi spenti tranne quelli che si dichiarano per i piccoli */
    soloPiccoli: true,
    /* i giochi accesi qui non fanno domande, ma la fascia vale lo stesso
       per il giorno che se ne accende un altro: sotto sta solo quello
       che si guarda e si tocca */
    anni: 5,
    /* Non cambia niente per i giochi che restano accesi — non fanno
       domande di quiz — ma vale per il giorno che se ne accende un
       altro: quello che qui è spento è quello che a scuola non ha
       ancora incontrato, non quello che «è difficile». */
    /* Deve contenere **tutto** quello che spegne «prima o seconda», e
       non è pignoleria: un elenco più corto vorrebbe dire che a quattro
       anni il gioco dà per scontate delle cose che a sei non dà — i
       problemi scritti, i suoni difficili, i verbi al presente. Il
       difetto c'era, e non si vedeva finché la schermata diceva «a
       scuola non l'ha ancora fatto»: girata al positivo («dà per
       scontato che sappia») si legge alla prima occhiata. Il test
       `unita/partenze` adesso lo tiene fermo. */
    saperi: ['moltiplicazioni', 'divisioni', 'misure', 'conversioni', 'decine',
             'stima', 'problemi', 'orologio', 'date', 'area-perimetro', 'solidi',
             'spazio-mente', 'analisi', 'flessione', 'presente', 'tempi-verbali',
             'accenti', 'suoni-difficili',
             /* le frazioni sono di terza, e prima della scuola non c'è
                nemmeno la barra da leggere */
             'frazioni',
             /* ── E QUESTI DIECI SONO ARRIVATI GUARDANDO L'ELENCO ──
                Da quando la schermata dei grandi dice **al positivo**
                cosa il gioco dà per scontato, la riga a quattro anni si
                leggeva così: «legge le parole, sillabe e rime, la
                simmetria, cosa segue di sicuro, le analogie». Nessuna
                di quelle cose la sa un bambino di quattro anni, e la
                fascia si chiama «non va ancora a scuola».

                Non era un errore di battitura: l'elenco era stato
                scritto pensando alla *matematica di scuola* — quello
                che in prima non si è ancora fatto — e tutto il resto
                era rimasto acceso per omissione. Al negativo («a
                scuola non l'ha ancora fatto: le divisioni») non si
                vedeva, perché quello che manca da un elenco non si
                legge. Al positivo salta all'occhio alla prima
                riga, ed è esattamente il mestiere per cui la
                schermata è stata girata.

                Restano accesi i sei che un bambino di quattro anni ha
                davvero: contare, i nomi delle figure, i contrari, i
                ritmi, e gli animali coi loro posti — roba che arriva
                dai libri illustrati, non dalla scuola. */
             'lettura', 'sillabe', 'griglia', 'calendario', 'simmetria',
             'deduzione', 'incertezza', 'insiemi', 'confronti', 'analogie',
             /* «il corpo dice il posto» — il pelo bianco vuol dire gelo,
                le zampe palmate l'acqua — è un obiettivo di **fine
                terza** (Indicazioni 2012: «Riconoscere in altri
                organismi viventi, in relazione con i loro ambienti,
                bisogni analoghi ai propri»). Restano accesi «gli
                ambienti del mondo», che è il gradino sotto e non arriva
                da scuola. */
             'adattamento',
             /* le classi degli animali (mammifero, uccello, pesce…) sono
                lo stesso obiettivo di fine terza dell'adattamento, un
                gradino più su: qui restano gli animali coi loro posti,
                non ancora le loro famiglie. */
             'classi-animali',
             /* il numero nascosto, anche il più facile (□ + 3 = 5), è
                già un conto scritto da leggere al contrario: prima
                della scuola non c'è un conto scritto nemmeno per dritto */
             'bilance',
             /* un pittogramma è contare, ma leggerlo come un grafico —
                la fila di chi, la legenda sotto — è una cosa di scuola */
             'dati',
             /* un testo di due o tre frasi da leggere da solo: chi non
                legge ancora non ha niente da ragionare, e in una carta
                non gli si insegna a leggere */
             'comprensione'],
    tiene: {
      numeri: 'contare fino a dieci e dire chi è di più si fa prima della scuola',
      figure: 'il cerchio e il quadrato si riconoscono dai libri illustrati',
      lessico: 'i contrari — grande e piccolo, caldo e freddo — si imparano parlando',
      sequenze: 'rosso, blu, rosso, blu è un gioco da tavolino, non una lezione',
      ambienti: 'dove vive il pinguino arriva dai cartoni, non da un\'ora di geografia',
    },
  },
  {
    chiave: 'prima',
    come: 'prima o seconda',
    nome: 'Prima o seconda',
    eta: '6-7 anni',
    che: 'Legge ancora a fatica: niente tabelline, niente misure, niente domande scritte lunghe.',
    /* I giochi per i piccoli restano accesi — a sei anni si contano
       ancora le pecore — e si spengono quelli che danno per scontata la
       lettura o i conti delle classi alte. È l'unica partenza che tiene
       tutte e due le estremità in casa: le altre tre stanno da una parte
       o dall'altra. */
    nienteGrandi: true,
    /* Fin dove pescano le domande: tutto il mazzo dei piccoli e il primo
       gradino di quello di scuola, che sta a 0.25 — le figure, i
       contrari, i giorni della settimana. Più su ci sono consegne da
       leggere in fretta, che è esattamente quello che a sei anni non si
       riesce a fare. */
    anni: 6.5,
    /* Quello che a scuola non ha ancora incontrato. È l'elenco dei
       piccoli meno le poche cose che in prima si toccano davvero (i
       numeri fino a venti, le figure, i giorni della settimana), più
       quelle che senza lettura fluente non si possono nemmeno provare:
       i problemi scritti sono il caso limite, il conto lo saprebbe fare
       ma la storia non riesce a leggerla. */
    saperi: ['moltiplicazioni', 'divisioni', 'misure', 'conversioni', 'decine',
             'stima', 'problemi', 'orologio', 'date', 'area-perimetro', 'solidi',
             'spazio-mente', 'analisi', 'flessione', 'presente', 'tempi-verbali',
             'accenti', 'suoni-difficili',
             /* Le frazioni arrivano in terza. Il disegno le spiegherebbe
                anche qui — ed è per questo che da terza in su restano
                accese — ma a sei anni la metà di una torta si dice a
                voce, e «1/2» scritto con la barra è ancora una scrittura
                che non si sa leggere: è la stessa ragione che tiene
                spente le decine e la stima. */
             'frazioni',
             /* stesso motivo dei piccoli: è di fine terza, e a sei anni
                e mezzo mancano due anni buoni. Restano gli ambienti. */
             'adattamento', 'classi-animali'],
    tiene: {
      lettura: 'in prima si impara a leggere: è esattamente quello che si sta facendo',
      comprensione: 'due frasi con chi e dove si leggono a fine prima; i testi più lunghi li tiene lontani l\'età',
      sillabe: 'le sillabe e le rime sono il primo mese di prima',
      griglia: 'la casella B3 e le frecce si fanno sul quaderno a quadretti, in prima',
      calendario: 'i giorni e i mesi si appendono al muro il primo giorno di scuola',
      simmetria: 'la farfalla piegata a metà è di prima',
      deduzione: 'a sei anni si tira la conclusione da una regola detta a voce',
      incertezza: '«non si può sapere» è la risposta che si impara a dare a questa età',
      insiemi: '«tutti» e «nessuno» si usano parlando, prima che a scuola',
      confronti: 'mettere in fila tre bambini per altezza si fa in cortile',
      analogie: 'il cane sta all\'osso: si capisce a voce, senza saper leggere',
      bilance: 'il numero che manca (5 + □ = 8) si fa sul quaderno di prima; le bilance vere arrivano dopo, e senza divisioni restano spente da sole',
      dati: 'il pittogramma della classe si fa in prima; le barre e la legenda si spiegano in una riga',
    },
  },
  {
    chiave: 'terza',
    come: 'terza elementare',
    nome: 'Terza elementare',
    eta: '8 anni',
    che: 'Moltiplicazioni sì, divisioni no. Niente metri, litri e chili: quelli arrivano dopo.',
    nientePiccoli: true,
    anni: 8,
    /* ── E QUESTE QUATTRO SONO ARRIVATE RIFACENDO IL GIRO ──
       L'elenco diceva tre nomi — le divisioni, le misure, le
       conversioni — ed erano stati scritti pensando ai conti in
       colonna. Tutto il resto era rimasto acceso per omissione,
       esattamente com'era successo a quattro anni con la lettura e le
       analogie: a otto anni il gioco chiedeva di dire quanti cubetti
       stanno dietro a quelli che si vedono e cosa si vede guardando un
       cilindro dall'alto. Sono cose che a scuola arrivano in quarta e
       in quinta, e a un bambino di terza non arrivano difficili:
       arrivano mute — non c'è una riga che possa colmare il buco.

       Si spengono **a sottovoci** e non a gruppi, perché i due gruppi
       che le tengono sono troppo grossi: «I solidi» si porterebbe via
       i nomi (cubo, piramide, cilindro) e il contare le facce, che
       sono di prima e di terza, e «Girare le figure con la mente» si
       porterebbe via la figura allo specchio, che è di seconda.
       Quelle restano, e sono anche il motivo per cui i due gruppi
       hanno lo stesso una riga in `tiene`: sono accesi per metà.

       Quello che NON si spegne è altrettanto deciso, ed è la regola
       nuova in testa al file: l'arrotondamento a scuola arriva dopo,
       ma «47 sta fra 40 e 50, l'ultima cifra è 7, quindi si va su» è
       una riga — quindi «Stima e arrotondamento» resta acceso e si
       insegna. Il perimetro e l'area contati sui quadretti sono di
       terza, i tempi dell'indicativo sono di terza, le parti del
       discorso sono di terza. La riga sopra dice «Moltiplicazioni sì,
       divisioni no» e resta vera. */
    saperi: ['divisioni', 'misure', 'conversioni',
             'geo:rotazione', 'geo:cubetti', 'geo:sviluppo', 'geo:viste'],
    tiene: {
      moltiplicazioni: 'le tabelline sono di terza: è la riga che dà il nome a questa fascia',
      decine: 'il valore posizionale fino alle migliaia è di terza',
      stima: 'arrotondare arriva dopo, ma si spiega in una riga — e la spiegazione c\'è',
      problemi: 'due operazioni di fila e i dati che non servono sono di terza',
      orologio: 'ore, mezze, quarti e minuti sono di seconda',
      date: 'quanti giorni passano fra due date è di seconda',
      'area-perimetro': 'contare i quadretti e i passi del bordo è di terza; le formule sono di quinta e non si chiedono',
      solidi: 'i nomi e il contare le facce restano; le viste dall\'alto sono spente qui sopra, per sottovoce',
      'spazio-mente': 'la figura allo specchio è di seconda e resta; le rotazioni e i cubetti sono spenti qui sopra',
      analisi: 'i nomi delle parti del discorso sono di terza',
      flessione: 'plurali, generi e articoli sono di prima',
      presente: 'il presente indicativo è di seconda',
      'tempi-verbali': 'passato prossimo e imperfetto si cominciano in terza',
      accenti: 'accenti, apostrofi e la lettera h sono di seconda',
      'suoni-difficili': 'gn, gl, sc e le doppie sono di prima',
      adattamento: 'è l\'obiettivo di fine terza, e a otto anni ci siamo',
      frazioni: 'la frazione come parte colorata di una figura è di terza, e il resto si spiega nella carta: sotto i pezzi, sopra i colorati',
      'classi-animali': 'vertebrati, invertebrati e le classi degli animali sono di terza e quarta, e a otto anni la regola si può già applicare',
    },
  },
  {
    chiave: 'quarta',
    come: 'quarta o quinta',
    nome: 'Quarta o quinta',
    eta: '9-10 anni',
    che: 'Tutto acceso, tranne i giochi per i più piccoli.',
    nientePiccoli: true,
    anni: 9.5,
    /* Vuota, e verificato: a 9,5 anni la finestra arriva a 94, e tutto
       quello che sta a 95 — i tempi composti, il passato remoto, il
       condizionale, il congiuntivo, l'imperativo — o nasce già spento
       (`difetto: false` in `data/saperi.js`) o resta fuori. Le due
       classi più alte ammesse stanno a 81: i problemi con le misure
       dentro e i dati che non servono, tutti e due in mano a una
       quarta. E una cosa da tenere a mente prima di toccarla: questa
       fascia copre **da 8,75 anni in su**, quindi quello che si
       spegnesse qui si spegnerebbe anche agli undicenni. */
    saperi: [],
    tiene: {
      divisioni: 'le divisioni in colonna sono di quarta',
      misure: 'metri, litri e chili si cominciano in terza e si consolidano qui',
      conversioni: 'le equivalenze sono di quarta',
      solidi: 'viste dall\'alto e facce sono di quinta, e da 8,75 anni in su ci siamo',
      'spazio-mente': 'le rotazioni sono di quarta, lo sviluppo del cubo di quinta',
    },
  },
]

export const partenza = chiave => PARTENZE.find(p => p.chiave === chiave) || null

/* ── LA FASCIA DIVENTA UNA CONSEGUENZA DELL'ETÀ ──
   Le quattro carte erano una scelta *accanto* all'età: si sceglieva una
   fascia, e l'età usciva da lì. Erano due manopole per una cosa sola, e
   in due schermate diverse — la carta del bambino ne aveva una per
   parte, una che spostava solo `eta` e una che riscriveva tutto — senza
   niente che le distinguesse a guardarle.

   Adesso la manopola è una: **gli anni**, che sono l'unità vera di
   tutto il sistema (12,5 punti per anno, la stessa scala di domande e
   campagne). La fascia è la più vicina, e serve ancora a una cosa che
   l'età da sola non sa fare: dire **quali giochi** mettere in casa e
   **cosa dare per scontato** che a scuola non abbia ancora fatto.

   Il pari va alla più piccola (`<` e non `<=`): fra due fasce
   equidistanti si sbaglia per difetto, che è l'errore che si corregge
   giocando invece che quello che sbarra. */
export function partenzaPerEta (anni) {
  const e = Number(anni)
  if (!Number.isFinite(e)) return null
  return PARTENZE.reduce((meglio, p) =>
    Math.abs(p.anni - e) < Math.abs(meglio.anni - e) ? p : meglio, PARTENZE[0])
}

/* Le eccezioni che spetterebbero a un bambino di quell'età, senza
   passare dal nome di una fascia: è quello che la manopola scrive
   quando si sposta. */
export const eccezioniPerEta = anni => {
  const p = partenzaPerEta(anni)
  return p ? { ...eccezioniDi(p.chiave), eta: Number(anni) } : { giochi: {}, sa: {}, eta: null }
}

/* ── LE ECCEZIONI SONO TRE STATI, NON DUE ──
   `false` è spento e l'assenza è acceso — è il patto di `settings` — ma
   `true` scritto per esteso vuol dire una terza cosa: **tienilo
   comunque**, anche se l'età dice di no (`store/profile.js`,
   `fissaGioco`). Fin qui si contavano solo gli spenti, e una forzatura
   se ne andava in silenzio cambiando fascia: il grande l'aveva messa a
   mano, e la conferma gli diceva che non c'era niente da perdere. */
const segno = v => v === false ? 'no' : v === true ? 'si' : '—'

/* Quante voci il grande ha messo diversamente dal difetto della sua
   fascia: è il numero che rende la conferma una domanda vera invece di
   un «sei sicuro?». Per i pezzi di scuola si contano le differenze nei
   due versi — uno spento a mano e uno riacceso a mano se ne vanno
   tutti e due. */
const quanteDiverse = (mia, difetto) => {
  const chiavi = new Set([...Object.keys(mia || {}), ...Object.keys(difetto || {})])
  let n = 0
  for (const k of chiavi) if (segno(mia?.[k]) !== segno(difetto?.[k])) n++
  return n
}

/* ── UN GIOCO SI CONTA COME SI COLORA ──
   Questo numero finisce sul tasto che rimette tutto («1 gioco messo a
   mano») e le righe ambra stanno nel quadro (`aMano` in
   `data/quadro.js`): il contatore dice quante, il colore dice quali, e
   devono essere la stessa cosa. Il quadro chiama «a mano» un gioco in
   due casi soli — un `true` scritto per esteso, o un `false` dove l'età
   non spegneva — e il conto di sopra ne vedeva un terzo: **l'assenza
   dove la partenza di oggi scrive `false`**.

   Quella non è una scelta di nessuno. La partenza enumera i giochi del
   giorno in cui il bambino nasce, e un gioco arrivato dopo nel suo
   profilo non c'è: un bambino di quattro anni nato prima del
   costruttore (arrivato il 23 settembre 2026) non ha nessuna voce per
   lui, mentre la partenza di oggi gli scrive `costruttore: false`. Il
   tasto diceva «1 gioco messo a mano» e nessuna riga era colorata.
   Oggi la mano scrive sempre per esteso (`fissaGioco`), quindi quel
   buco non l'ha lasciato un grande — e siccome un gioco che il profilo
   non nomina vale quello che l'età scriverebbe (vedi in testa al
   file), rimettendo non cambia nemmeno niente a schermo.

   ── I PEZZI DI SCUOLA NO, E NON È UNA SVISTA ──
   Per loro l'assenza contro un `false` atteso è proprio **la mano**:
   riaccendere un pezzo di scuola che l'età spegne cancella la voce
   (`accendiSapere` non scrive il difetto del catalogo), cioè «L'ha già
   fatto» lascia nel profilo esattamente quel buco — e il quadro lo
   colora (`scelto: 'si'`). Smettere di contarlo qui vorrebbe dire
   buttarlo in silenzio al primo «rimetti tutto», che è il guasto per
   cui questo conto esiste. */
const giochiAMano = (mia, difetto) => Object.keys(mia || {})
  .filter(k => mia[k] === true || (mia[k] === false && difetto?.[k] !== false)).length

/* Le tre voci insieme. Un conto solo decide se la conferma dell'età
   chiede e cosa dice chiedendo: erano due funzioni, e due funzioni
   possono dare due risposte — una conferma che chiede per zero voci, o
   che ne annuncia una e non chiede. */
const messeAMano = ({ giochi, sa, ritocchi }, difetti) => ({
  giochi: giochiAMano(giochi, difetti.giochi),
  sa: quanteDiverse(sa, difetti.sa),
  ritocchi: Object.keys(ritocchi || {}).length,
})

/* ── COSA SUCCEDE SPOSTANDO LA MANOPOLA ──
   Una manopola che riscrive le scelte fatte a mano senza dirlo è una
   trappola; una che chiede conferma a ogni tacca è un questionario.
   Qui si decide quale dei due casi è, e sono tre:

     · **stessa fascia** — da 8 a 8,5 non cambia niente di quello che
       una fascia decide (quali giochi, cosa si dà per scontato). Si
       sposta l'età e basta: quello che il grande aveva toccato resta
       esattamente dov'era. È il caso normale, ed è muto.
     · **fascia diversa, ma il bambino stava sui difetti** — non c'è
       niente di suo da perdere. Si riscrive e si va dritti.
     · **fascia diversa, e il bambino era su misura** — qui e solo qui
       si chiede, perché la risposta costa: sono trenta interruttori
       che tornano al difetto.

   Il confronto è con i difetti dell'età **da cui si parte**, non con
   quelli dell'età dove si arriva: la domanda è «questo grande aveva
   messo le mani?», non «le sue impostazioni somigliano a quelle
   nuove?». */
export function spostandoLEta ({ da, a, giochi = {}, sa = {}, ritocchi = {} }) {
  const nuove = eccezioniPerEta(a)
  const prima = partenzaPerEta(da)
  const dopo = partenzaPerEta(a)
  const stessaFascia = !!prima && !!dopo && prima.chiave === dopo.chiave
  /* I ritocchi contano come «su misura», e non è un dettaglio: sono
     correzioni sopra l'età («per lui l'orologio è più facile»), quindi
     ripartire dai difetti li porta via. Se non entrassero in questo
     conto sparirebbero in silenzio nell'unico caso in cui un grande
     aveva toccato solo quelli. */
  const difetti = prima ? eccezioniDi(prima.chiave) : { giochi: {}, sa: {} }
  const aMano = messeAMano({ giochi, sa, ritocchi }, difetti)
  const suMisura = !!prima && aMano.giochi + aMano.sa + aMano.ritocchi > 0

  /* Cosa se ne va, voce per voce. Dentro la stessa fascia non se ne va
     niente, e dirlo con degli zeri invece che con un `null` risparmia a
     chi lo mostra di sapere quale dei due casi è. */
  const perde = stessaFascia ? { giochi: 0, sa: 0, ritocchi: 0 } : aMano

  return {
    eta: Number(a),
    /* dentro la stessa fascia i giochi e i saperi non si toccano: si
       restituiscono quelli che c'erano, così chi salva non deve sapere
       che esiste un caso in cui non deve scrivere */
    giochi: stessaFascia ? giochi : nuove.giochi,
    sa: stessaFascia ? sa : nuove.sa,
    fascia: dopo,
    riscrive: !stessaFascia,
    chiede: !stessaFascia && suMisura,
    perde,
  }
}

/* ── E RIMETTERE TUTTO COM'ERA A QUEST'ETÀ ──
   Lo stesso conto di `spostandoLEta`, ma senza spostare niente: l'età
   resta quella che è, e quello che si butta sono **le eccezioni**.
   Serve perché il quadro dei grandi si può correggere riga per riga —
   un gioco forzato, un pezzo di scuola tolto, tre domande spostate — e
   dopo un po' nessuno ricorda più cosa ha toccato. Senza un modo di
   tornare indietro tutto insieme, l'unica strada era spostare l'età
   avanti e indietro fino a cambiare fascia, che è un rimedio per
   iniziati e per giunta cambia anche l'età.

   Torna anche `cambia`: se non c'è niente di suo da buttare il tasto
   non si mostra affatto — un ripristino che non ripristina niente fa
   dubitare di aver capito male cosa fa. */
export function rimettendoLEta ({ eta, giochi = {}, sa = {}, ritocchi = {} }) {
  const fascia = partenzaPerEta(eta)
  const difetti = fascia ? eccezioniDi(fascia.chiave) : { giochi: {}, sa: {} }
  const perde = messeAMano({ giochi, sa, ritocchi }, difetti)
  return {
    eta: Number(eta),
    giochi: difetti.giochi,
    sa: difetti.sa,
    fascia,
    perde,
    cambia: perde.giochi + perde.sa + perde.ritocchi > 0,
  }
}

/* Le eccezioni da scrivere nel profilo appena creato, nella forma che
   `settings` usa già: solo quello che va SPENTO. Per i giochi è anche
   quello che vale al posto di una voce che manca (vedi in testa al
   file). Una partenza sconosciuta non spegne niente — un profilo con
   tutto acceso è com'era prima che questo file esistesse, ed è il
   fallimento giusto: si vede subito e non perde nessun dato. */
export function eccezioniDi (chiave) {
  const p = partenza(chiave)
  if (!p) return { giochi: {}, sa: {}, eta: null }

  const giochi = {}
  for (const g of GIOCHI) {
    /* un posto non si giudica per età, in nessuna direzione: vedi
       `posto` in `data/giochi.js` */
    /* chi comincia dai piccoli e cresce (`cresce` in `data/giochi.js`)
       non si spegne ai grandi: fin dove arriva lo dice la portata */
    const spegni = !g.posto &&
      ((p.soloPiccoli && !g.piccoli) || (p.nientePiccoli && g.piccoli && !g.cresce) ||
       (p.nienteGrandi && g.grandi))
    if (spegni) giochi[g.chiave] = false
  }

  const sa = {}
  for (const s of p.saperi) sa[s] = false

  /* `null` vuol dire «lascia com'è»: una partenza che non si pronuncia
     non deve azzerare l'età di un bambino che ce l'aveva. */
  return { giochi, sa, eta: p.anni ?? null }
}
