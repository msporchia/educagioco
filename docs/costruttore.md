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
| 🏆 Le sfide | **contare** camminando (il muro gemello), contare quello che si vede (conta i rossi), e **un se dentro un se** (la scacchiera) |

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

## Vedere la macchina che lavora

Mentre il programma gira, la riga che sta eseguendo si accende e le
lavagnette cambiano valore sotto gli occhi. Quando il robot entra in un
progetto si apre la sua scheda, con le misure di **quella** chiamata scritte
sopra («rettangolo · largo 2 · alto 5»), e un ripeti dice a che giro è. È la
pila delle chiamate fatta vedere invece che spiegata.

Il tasto **🐍 com'è in Python** mostra lo stesso programma scritto come lo
scrive chi programma di mestiere: i progetti diventano `def`, le lavagnette
variabili, «ripeti» un `for`. Solo da leggere.

## Note per i genitori

- **Le monete arrivano una volta sola** per livello, alla prima vittoria:
  rifarlo è ricordarsi il programma, non scriverlo.
- **Le stelle sono due**: fatto, e fatto senza farsi mostrare la soluzione.
  Gli aiuti a parole del 💡 sono gratis.
- **Il programma di ogni livello si tiene**, anche uscendo a metà: sta in
  archivio fuori dal profilo, sotto `costruttore:<id>`.
- Il gioco dà per scontato che il bambino legga da solo: è pensato dai nove
  anni in su.
