[← torna al README](../README.md)

# 🏗️ Il costruttore *(in prova)*

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

## I capitoli

| capitolo | cosa si impara |
|---|---|
| 🧱 Il cantiere | mettere e camminare, salire sui propri mattoni, **ripeti N volte**, la misura dell'ordine, ripeti dentro ripeti, tanti colori in una colonna (la torta) |
| 👀 Guardare e decidere | **se** c'è un mattone rosso (i nidi), **se… altrimenti** (il mosaico), i buchi nel muro, il mattone di prima (le strisce), **ripeti finché** (il ponte) |
| 📐 I progetti | un **progetto** (una funzione), con **una misura**, con **due**, con una misura che è **un colore** (le bandiere), e **progetti fatti di progetti** (il villaggio) |
| 📝 Le lavagnette | una **variabile** che cresce (la scala), una che cala (la piramide), una che conta alla rovescia (le candeline) |
| ⚓ Il porto | la seconda parte, vista dall'alto: **leggere**, **aspettare**, **ripetere per sempre**, cercare — mentre il mondo lavora da solo (vedi sotto) |
| 🏆 Le sfide | **contare** camminando (il muro gemello), contare quello che si vede (conta i rossi), e **un se dentro un se** (la scacchiera) |
| 🌅 Le giornate del porto | il porto che lavora tutto insieme: camion, lettere, frighi e clienti, dalla giornata piccola a quella più larga dello schermo |

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

## Vedere la macchina che lavora

Mentre il programma gira, la riga che sta eseguendo si accende e le
lavagnette cambiano valore sotto gli occhi. Quando il robot entra in un
progetto si apre la sua scheda, con le misure di **quella** chiamata scritte
sopra («rettangolo · largo 2 · alto 5»), e un ripeti dice a che giro è. È la
pila delle chiamate fatta vedere invece che spiegata.

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
- Il gioco dà per scontato che il bambino legga da solo: è pensato dai nove
  anni in su.
