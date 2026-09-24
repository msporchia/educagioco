[← torna al README](../README.md)

# 🏗️ Il costruttore

*Programmare davvero, senza scrivere codice.* Qualcuno ordina una cosa —
un muro, una scala, un castello — e il bambino scrive il programma con cui
un robot la costruisce. Poi preme ▶ e guarda il cantiere venir su.

È il gioco che [il Generale](generale.md) lasciava a un domani: là si
insegnano sequenze, cicli ed eventi fra più personaggi; qui l'altra metà del
mestiere, quella che il Generale per scelta non tocca — **le funzioni coi
loro parametri, e le variabili create dal bambino**.

## Come è fatto

In cima c'è **chi ordina** e cosa vuole, e sotto i suoi **ordini**: la stessa
scala con tre gradini e con cinque, lo stesso fiume largo tre e largo sei.
Poi il cantiere, visto di lato, con il disegno da costruire in trasparenza.
In basso il programma, a righe che si leggono come frasi:

    🔁 ripeti [gradini] volte
         🏛️ colonna  alta [h]
         🚶 vai [→ a destra] [1] passo
         📝 [h] diventa [h + 1]

Non si scrive niente a tastiera: si tocca «＋», si sceglie un blocco dalla
cassetta, e si riempiono le caselle toccandole. **Una scelta non nasce mai
fatta**: «vai» sono due tasti, uno per verso, e i numeri nascono **N**, da
scegliere — un valore di comodo si leggeva come l'unico possibile.

## Il mondo, e le sue regole

Poche, e valgono in tutti i livelli:

- **il robot cammina e cade**: un passo nel vuoto e scende finché trova
  qualcosa; sale un gradino alto uno, e davanti a un muro più alto si ferma;
- **per salire si mette un mattone sotto i piedi** e ci sale sopra: una
  torre è «metti, metti, metti»;
- un mattone si posa anche **in basso a destra o a sinistra**, dove andrà il
  piede: è così che si fa un ponte, o la chioma di un albero;
- dove c'è già un mattone il robot non ne mette un altro, e si ferma
  dicendolo — se no «metti un mattone dappertutto» vincerebbe senza guardare;
- l'omino che prova la costruzione sale un gradino alla volta, cade per tre
  al massimo e nell'acqua non ci entra.

## La sfida sono gli ordini

Il programma si scrive una volta, e deve reggere **su tutti gli ordini del
livello**. Chi scrive «3» dove l'ordine dice «gradini» vince il primo e perde
il secondo — e lo vede: la scala si ferma a metà e l'omino resta sotto. È
l'idea migliore del Generale (il piano si firma prima, e regge su situazioni
che non hai davanti) usata dove rende di più: è quella che rende
**necessari** i parametri e le variabili, invece di un modo più elegante di
fare la stessa cosa.

Il primo ordine si gioca alla velocità scelta; se regge, gli altri si giocano
a schermo, accelerati. Niente par e niente tetto alle righe: vale il
programma che funziona.

## Gli attrezzi, e le righe contate

Un progetto non serve perché il racconto lo chiede: serve quando senza
non ci si sta. Due pezzi del gioco lo rendono vero.

- **Gli attrezzi del capomastro** 🔒: progetti già scritti, quasi sempre
  cose che il bambino ha costruito in un livello prima — la torre della
  torretta, il muro del muro lungo, l'albero del bosco. Si chiamano dalla
  cassetta con le loro misure, si aprono per leggerli e non si cambiano, e
  sotto il nome dicono **dove lasciano il robot** («finisce in cima alla
  torre»): la riga dopo comincia da lì. Il capitolo dei progetti comincia
  così, usando una funzione prima di scriverne una.
- **Le righe contate** 📝: in certi livelli il programma sta in un numero
  di righe (gli attrezzi non si contano). Tre alberi scritti a mano non ci
  stanno; scritti una volta in un progetto e chiamati tre volte sì. Non è un
  punteggio — meno righe non vale di più — è il vincolo che fa scoprire a
  cosa serve un progetto. Le prove automatiche pretendono che in ogni
  livello dei progetti la soluzione **srotolata**, con le chiamate
  sostituite dal loro corpo, non ci stia.

Nell'editor c'è anche **↶ annulla**, dieci passi indietro: una riga tolta
per sbaglio, col blocco e tutto quello che aveva dentro, torna com'era.

## I capitoli

| capitolo | cosa si impara |
|---|---|
| 🧱 Il cantiere | mettere e camminare, salire sui propri mattoni, **ripeti N volte**, la misura dell'ordine, ripeti dentro ripeti, tanti colori in una colonna (la torta) |
| 👀 Guardare e decidere | **se** c'è un mattone rosso (i nidi), **se… altrimenti** (il mosaico), i buchi nel muro, il mattone di prima (le strisce), **ripeti finché** (il ponte) |
| 📐 I progetti | **chiamare gli attrezzi** e sapere dove lasciano il robot (la cinta), il **primo progetto** tuo quando a mano non ci sta (il bosco), con **una misura**, con **due**, con una misura che è **un colore** (le bandiere), e **progetti fatti di progetti** (il villaggio) |
| 📝 Le lavagnette | una **variabile** che cresce (la scala), una che cala (la piramide), una che conta alla rovescia (le candeline) |
| ⚓ Il porto | la seconda parte, vista dall'alto: **leggere**, **aspettare**, **ripetere per sempre**, cercare — mentre il mondo lavora da solo (vedi sotto) |
| 🏆 Le sfide | **contare** camminando (il muro gemello), contare quello che si vede (conta i rossi), e **un se dentro un se** (la scacchiera) |
| 🗺️ I posti del porto | **un lavoro per ogni colore**, con le strade già scritte come attrezzi (le strade del porto), poi **le strade scritte una volta sola** e chiamate da più colori, in un porto più largo dello schermo (il porto grande) |
| 🌅 Le giornate del porto | il porto che lavora tutto insieme: camion, lettere, frighi e clienti, dalla giornata piccola a quella più larga dello schermo |
| 🔢 Mettere in ordine | **confrontare due numeri** e scambiarli passando dal banco (due lettere), **una passata** che porta la lettera più grande in fondo (la passata), **ripetere la passata** finché la fila è in ordine: il bubble sort (in ordine); poi l'ordine lo decidi tu (il tricolore), **ordinare senza confrontare** (il casellario), **infilare al suo posto** quello che arriva (fare posto) e **unire due file già in ordine** (la cerniera) |
| 🔎 Cercare | il **record** che cambia solo quando serve (il campione), **un conto che trova** quello che manca (la lettera che manca), e **cercare dimezzando**: la ricerca binaria (indovina la lettera) |
| 🧀 Le pile | la **pila che capovolge** (il carico al contrario), e la **torre del casaro** — la torre di Hanoi, in quattro gradini fino al **progetto che chiama sé stesso** |

Il «se» arriva subito dopo il cantiere, prima delle funzioni: una decisione
è più semplice di un progetto, e coi colori ha qualcosa da decidere fin da
subito — il robot non guarda solo *se* c'è un mattone, ma di che colore è.
I colori poi diventano anche dei **valori**: una misura di un progetto può
essere un colore, e nelle bandiere i colori li porta l'ordine («sinistra»,
«centro», «destra»), come «lungo» porta un numero.

Ogni livello porta le sue **mosse ingenue** — il numero del primo ordine
scritto a mano, la colonna costruita a righe — e le prove automatiche
pretendono che ognuna perda almeno un ordine: se una vincesse, il livello non
insegnerebbe quello che dichiara.

Finito il primo capitolo si apre **il cantiere libero**: un cantiere grande,
tutti i blocchi e tutti i colori, e i progetti scritti nei livelli da
riprendere dalla cassetta. Non si vince e non paga: si costruisce.

## La seconda parte: il porto

Il cantiere è fatto di materia: mattoni e forme. Il porto è fatto di
**lavoro che arriva**. Si vede dall'alto, e il mondo lavora da solo: la gru
cala una cassa, il nastro la porta verso il mare, un cliente al bancone
chiede una cassa di un colore. Il bambino programma sempre un robot solo, ma
il programma non sa cosa arriverà né quando: deve guardare, aspettare e
decidere. Nel cantiere gli ordini cambiavano fra una prova e l'altra; qui
arrivano **mentre il programma gira**.

Le regole, che valgono in tutti i livelli del porto:

- **il mondo va a turni.** Ogni gesto del robot — un passo, prendere,
  posare, un turno d'attesa — costa un turno, e a ogni turno la gru, i nastri
  e i clienti fanno la loro mossa. Pensare invece è gratis: guardare,
  leggere, decidere e fare i conti non fanno passare il tempo;
- il robot va ↑ ↓ ← → e **non passa sopra le cose**: una cassa per terra si
  prende o si gira intorno;
- **porta una cosa alla volta**, e prende e posa **di fianco a sé**, verso
  una delle quattro frecce;
- per terra, su uno scaffale, sul bancone e su un nastro ci sta una cosa
  sola; un cassone ne tiene tante, e se ha un colore prende solo quelle;
- **legge** quello che ha di fianco o in mano: il colore di una cassa, il
  numero di un biglietto, cosa chiede il cliente, quante casse ci sono in
  un cassone;
- una cassa che arriva in fondo al nastro cade in mare; un cliente che
  aspetta troppo, o che riceve un'altra cosa, se ne va arrabbiato. Tutte e
  due fanno perdere la giornata, nel momento in cui succede.

Il linguaggio è quello del cantiere, più tre blocchi: **prendi** e
**posa** (una freccia ciascuno), **aspetta che …** e **ripeti per sempre**.
La giornata finisce da sola quando non può più succedere niente, ed è così
che un «per sempre» si ferma. E c'è un valore nuovo, **📖 leggi**: «voglio
diventa 📖 ←» mette in una lavagnetta il colore che il cliente ha chiesto.

Ogni ordine è **una giornata**: un'altra nave con più casse, i cesti messi
in un altro ordine, altri clienti. Il programma che ha ricordato la prima
giornata invece di guardarla perde la seconda.

| sfida | cosa si impara |
|---|---|
| 📦 Il primo carico | prendere e posare, di fianco, nelle quattro direzioni |
| 🚢 La stiva | ripeti, dall'alto: dalla nave al camion |
| 🍅 Rosse e blu | se in mano c'è una cassa rossa… altrimenti… |
| 📋 La bolla | leggere un numero: quante casse caricare |
| 🏗️ La gru | aspetta che…, ripeti per sempre: le casse arrivano quando vogliono |
| 🐟 Il nastro | il mondo non aspetta: prenderle prima che cadano in mare |
| 🧺 Lo smistamento | un colore letto, e il cesto di quel colore da cercare |
| 🛍️ La bottega dei colori | un progetto che cerca: i clienti chiedono, il robot trova e porta |

### Le giornate del porto

In fondo alla fila, dopo le sfide del cantiere, i pezzi del porto lavorano
tutti insieme, in scene piene: la gru scarica sul nastro, il nastro riempie
il magazzino da solo, i camion arrivano alla loro ora e **ripartono appena
sono pieni**, le lettere vanno ognuna alla buca del suo numero, i clienti
entrano in bottega. Il robot ha un blocco in più, **aspetta un turno**,
per quando ha due lavori e in quel momento non ce n'è nessuno.

| giornata | quanto è grande | cosa si impara |
|---|---|---|
| 🚚 Il primo camion | piccola | si carica finché il camion c'è: quando è pieno riparte da solo |
| ✉️ Il postino | media | il numero letto su una lettera diventa i passi fino alla sua buca, all'andata e al ritorno |
| 🧊 Il frigo | media | aspettare dentro un ripeti: il camion è lì, ma il pesce arriva un po' per volta |
| 🦐 Pesce fresco | difficile | cercare il frigo del colore giusto, e tornare in fondo al nastro prima che la cassa dopo cada in mare |
| 🔀 Due lavori | difficile | camion sotto e clienti a sinistra, dallo stesso posto: chi c'è si serve, e se non c'è nessuno si aspetta un turno |
| ⚓ La giornata del porto | grande, oltre lo schermo | tutto insieme: il magazzino lo riempie il nastro, e lo scaffale corre fin dove la telecamera deve seguire il robot |

Il porto è costruito come **un motore con tante sfide sopra**, non come
otto livelli fatti a mano uno per uno: gli attori sono pochi comportamenti
(una sorgente come la gru, il nastro, il cliente) con tanti costumi, e un
livello è una mappa, qualche attore e un obiettivo dichiarato («nel camion
cinque casse», «tutti i clienti serviti»). Le sfide nuove si scrivono come
dati, e il banco le gioca tutte.

## Gli algoritmi

In fondo alla fila, dopo le giornate, tre capitoli dove il porto diventa il
posto per i primi algoritmi. Funziona per una ragione precisa: **lo
scaffale è la memoria**. La casella sotto cui sta il robot è l'indice, la
mano è un registro, il banco di sotto è la variabile d'appoggio dello
scambio — e una regola piccola fra due lettere vicine fa venire fuori,
davanti agli occhi, l'ordine di tutta la fila.

C'è una differenza col libro di testo che decide quali algoritmi stanno
bene qui: **nel porto confrontare non costa, muoversi sì** (pensare non fa
passare turni). Misurato col motore, su nove lettere al contrario il bubble
sort di «In ordine» impiega 488 turni, e un ordinamento per selezione —
cerca la più piccola guardando, poi portala davanti con uno scambio solo —
144. È la ragione vera per cui chi sposta casse pesanti non fa il bubble
sort. Il banco guarda il risultato e non la strada, quindi nessuno dei due
è vietato: il posto dove la differenza si farebbe sentire è un turno di
notte col record, non un livello.

Il mondo ha tre pezzi nuovi, e nessuna meccanica scritta per un livello
solo:

- il **cliente che chiede una qualità** invece di una cosa — «la lettera
  più grande che c'è»: non si legge al bancone, si capisce guardando;
- il **cliente che fa indovinare**: gli porti una lettera, e lui la
  rimette sul bancone dicendo solo «di più!» o «di meno!». Guarda al
  massimo quattro lettere;
- la **pila delle forme di formaggio**: una forma grande sopra una più
  piccola la schiaccia.

E un segno nuovo nei conti, **÷**, quello della scuola senza la virgola: la
metà che serve a chi cerca dimezzando.

| livello | cosa si impara |
|---|---|
| 🇮🇹 Il tricolore | la passata di prima con un'altra domanda dentro: verdi, bianche, rosse. L'algoritmo non cambia, cambia cosa vuol dire «fuori posto» (è la bandiera olandese di Dijkstra, all'italiana) |
| 📬 Il casellario | ogni lettera nella buca del suo numero, poi le buche svuotate in fila: il sacco torna in ordine senza aver confrontato niente |
| ↔️ Fare posto | le lettere arrivano dalla gru, e ognuna scivola a sinistra finché trova il suo posto: come si ordinano le carte in mano |
| 🤐 La cerniera | due nastri di lettere già in ordine diventano una fila sola: delle due in testa, la più piccola. È il cuore del merge sort |
| 🏆 Il campione | la lettera più grande, con una lavagnetta che cambia solo quando arriva un record |
| 🕳️ La lettera che manca | tutte meno quelle che ci sono: la somma trova la lettera mancante senza cercarla |
| 🎯 Indovina la lettera | quattro tentativi per nove lettere: si prova sempre quella a metà, e ogni risposta butta via metà scaffale. È la risposta a «a cosa serve mettere in ordine?» |
| 🔄 Il carico al contrario | la fila dentro il cassone e poi fuori: esce rovesciata, perché si prende sempre quella in cima |
| 🧀 Le due forme · Tre forme · Quattro forme | la torre di Hanoi, un gradino alla volta (vedi sotto) |
| 🗼 La torre del casaro | quante forme vuoi: il progetto che chiama sé stesso |

### La torre del casaro

Il casaro tiene le forme di formaggio in pila su tre assi — la rossa, la
verde e la blu — e la regola del magazzino è una sola: una forma grande
sopra una più piccola la schiaccia. Ogni giorno la torre va portata
dall'asse di «partenza» a quella di «arrivo», e quella libera è
l'«appoggio». Le assi si chiamano col loro colore, quindi un programma
scritto coi colori di lunedì perde martedì. Il robot sta fermo in mezzo, e «sposta» porta una forma da
un'asse all'altra: la lezione è la torre, non la strada.

La ricorsione non si spiega: si arriva a vederla. Per questo la torre è
una scala, e ogni gradino dà già fatto quello che il bambino ha scritto
nel gradino prima:

1. **due forme**, a mano: la piccola sull'asse libera, la grande al suo
   posto, la piccola sopra;
2. **tre forme**, con la «torre di due» già pronta: la torre di due via,
   la grande, la torre di due sopra — e nello zaino i sette spostamenti
   scritti a mano non ci stanno;
3. **quattro forme**: la «torre di tre» la scrive il bambino, come
   progetto, con dentro la torre di due. Il principale è lo stesso disegno
   una volta più in alto;
4. **la torre del casaro**: torri di tre, quattro, cinque e sei forme, e
   solo «sposta». Una torre alta N è due torri alte N − 1 e la grande in
   mezzo, e il progetto «torre» chiama sé stesso. Una torre alta zero non
   si sposta: senza quel fermo il robot non smetterebbe mai.

Mentre gira, la fila delle carte aperte fa vedere quello che succede:
«torre alta 5 › torre alta 4 › torre alta 3 › … › sposta da verde a
rosso». Se il bambino dimentica il fermo, il robot si ferma alla
quarantesima carta e lo dice. È il livello più difficile del gioco: il
💡 da 50 monete scrive il progetto con le sue misure, il fermo e lo
spostamento, ma le due chiamate a sé stesso restano da scrivere.

## Vedere la macchina che lavora

Mentre il programma gira, la riga che sta eseguendo si accende e le
lavagnette cambiano valore sotto gli occhi. Quando il robot entra in un
progetto si apre la sua scheda, con le misure di **quella** chiamata scritte
sopra («rettangolo · largo 2 · alto 5»), e un ripeti dice a che giro è. È la
pila delle chiamate fatta vedere invece che spiegata, e con la torre del
casaro diventa la ricorsione fatta vedere: le carte della stessa torre,
una dentro l'altra, ognuna con la sua altezza e le sue assi.

## Note per i genitori

- **Le monete arrivano una volta sola** per livello, alla prima vittoria:
  rifarlo è ricordarsi il programma, non scriverlo.
- **Le stelle sono due**: fatto, e fatto senza farsi scrivere la soluzione
  intera.
- **Gli aiuti del 💡 sono una scala, e si pagano in monete.** I primi due
  gradini sono gratis e fanno ragionare: cosa chiede il livello e cosa lo
  rende difficile, poi la domanda giusta da farsi. Poi gli indizi, a 10
  monete; poi il gioco scrive nel programma un pezzo (50: i progetti, o il
  lavoro di un giro fuori dal suo blocco), la forma — tutti i blocchi al
  loro posto, coi numeri, i colori e le domande da scegliere (100) — e la
  soluzione (200, e la seconda stella resta spenta). Il prezzo sta sul tasto
  prima di premerlo, e senza monete non si compra niente. Quello che si è
  pagato resta, e un pezzo di programma si rimette gratis. I gradini che
  scrivono escono dalla soluzione del livello (`motore/aiuti.js`), e un
  test pretende che quella svelata vinca davvero.
- **Il programma di ogni livello si tiene**, anche uscendo a metà: sta in
  archivio fuori dal profilo, sotto `costruttore:<id>`.
- **Un livello vinto apre il successivo**, anche oltre l'età per cui il
  gioco è pensato: averlo vinto è la prova che il bambino ci arriva. L'età
  decide solo se il gioco compare fra quelli di casa.
- Il gioco dà per scontato che il bambino legga da solo: è pensato dai nove
  anni in su.
