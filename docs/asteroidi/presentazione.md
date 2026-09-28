[← torna al README](../README.md)

# ☄️ Asteroidi

*Tabelline e calcolo a mente.* Gli asteroidi scendono con dei numeri sopra:
si colpisce quello giusto prima che arrivi in fondo.

<img src="img/asteroidi-gioco.png" width="230"> <img src="img/asteroidi-mappa.png" width="230"> <img src="img/asteroidi-stazioni.png" width="230">

## Come è fatto

C'è **una scaletta sola**, spezzata in capitoli, con due specie di tappe
mescolate:

- **I pianeti** sono le tabelline, dalla ×2 in su.
- **Le stazioni** sono il calcolo a mente: somme con il riporto,
  sottrazioni con il prestito, i doppi, il complemento a 10, le
  moltiplicazioni per 10…

L'ordine **non è alternato a turno**: le due liste sono state fuse una volta
guardando cosa chiede davvero ogni tappa, e il perché di ogni giunzione è
scritto in testa a [`src/data/asteroidi.js`](../src/data/asteroidi.js). In
due parole: si comincia dai conti entro il dieci (la tabellina del 2 sono i
doppi, e senza 7+7 non c'è nessun 2×7), le decine tonde arrivano dopo la
tabellina del 10, **da «Passa la decina» in poi le tabelline stanno un passo
avanti** — due pianeti e una stazione — e **moltiplicare e dividere a mente
vengono dopo il Sole**, cioè dopo tutte le tabelline insieme: 56:8 è la
tabellina dell'8 girata.

Per un po' la fila alternava a turno, una tabellina e una stazione, e
giocandola si sentiva che era squilibrata: la tabellina scorreva, la
stazione dopo si incagliava. È il peso: 7×8 è un fatto solo, o lo sai o
no, mentre 27+38 sono tre passaggi da tenere in testa mentre il sasso
cade. Adesso i conti col riporto arrivano con tutte e nove le tabelline in
mano. Chi era già a metà fila non ha perso niente: qualche tappa che il
riordino ha anticipato risulta passata senza essere stata giocata.

La fila è una anche **sotto**: un solo avanzamento, una sola tappa aperta —
quella dopo l'ultima superata, che sia un pianeta o una stazione — e **un
solo segno**, la ⭐ di «superata». Per un po'
i progressi sono stati due, uno per specie, e allora in mezzo alla scaletta
capitava di vedere la tappa 6 aperta, la 7 chiusa e la 8 aperta: da fuori
non si legge come «due progressi rispettati», si legge come una fila che non
si capisce dove continui. Chi giocava da prima non ha perso niente — i due
contatori si sono travasati in uno prendendo la posizione più avanzata, cioè
sbagliando semmai in favore del bambino.

I segni erano due: una ✔ verde per «bersaglio preso» e una ⭐ per «questa
tabellina il motore te la dà per imparata». Sono due domande diverse
schiacciate nella stessa colonna, e per leggere la fila bisognava sapere
quale delle due si stava guardando. Adesso la fila risponde a una domanda
sola — *dove sono arrivato* — e quello che il motore sa sta dove quella
domanda è la domanda: i due conti in cima alla mappa (✖️ le tabelline, 🧠 i
trucchi), «Cosa so», l'albo e i traguardi. Sono numeri che **scendono** se
non si ripassa, ed è giusto che si vedano; una tappa superata invece resta
superata, e le due cose non possono stare nello stesso simbolo.

Anche fuori dalla fila non resta niente di diviso: un cartello solo a fine
tappa («Tappa superata!», non «Pianeta» o «Stazione»), un solo trionfo
quando la scaletta finisce, e **un volo infinito solo** a fila finita —
tabelline e conti a mente insieme, non due modi di volare uno per mestiere.

(La scaletta apre in anticipo anche tutto quello che a quell'età è **roba
già saputa** — a nove anni non si ricomincia dalla tabellina del 2 per
arrivare al 7 — ma quello lo decide l'età, non l'avanzamento: la tappa
cerchiata, cioè «sei qui», resta una sola.)

## L'astronave

In fondo allo schermo c'è una nave che difende il pianeta, e **dice come sta
andando senza numeri**. Alla prima botta l'ala sinistra si **strappa**: bordo
frastagliato e bruciato, i pezzi che le galleggiano accanto, le scintille e
il fumo che escono da lì, e una spia ambra che lampeggia sullo scafo. Se
resta una vita sola lo strappo si mangia quasi tutta l'ala, la spia diventa
rossa e batte il doppio, il vetro si crepa e un motore va a singhiozzo.

Prima il primo gradino era «l'ala si accorcia», e non lo capiva nessuno: non
c'è niente a schermo con cui confrontarla, e un'ala più piccola non dice
*rotta*, dice che la nave è fatta così. Quello che si legge di sfuggita su un
telefono è **qualcosa che si muove** (la spia, le scintille), **un buco nel
contorno** e **dei pezzi staccati** — tre segnali sullo stesso punto, e
ognuno regge da solo.

Se resta una vita sola gli asteroidi rallentano un po' — chi è arrivato lì il
conto di solito lo sa, e non fa in tempo a farlo. Man mano che si sale di
livello la nave cresce: navetta, caccia, incrociatore.

Le vite non stanno in una barra: si leggono sulla nave, e basta. In cima
restano solo le due cose che la nave non può dire — quanto manca al
bersaglio della tappa e quanti centri sulla tabellina nuova.

Due **gettoni** si guadagnano giocando, restano in tasca (in basso a
destra, mai più di tre) finché non li si preme, e finiscono con la partita.
Arrivano a turno, uno ogni cinque risposte giuste di fila e uno per ogni boss
abbattuto; a dieci di fila arriva una vita al posto del gettone. **Non si
perdono sbagliando**: si spendono quando si decide, o restano lì.

- ❄️ **gelo** — congela la domanda che si ha davanti: i sassi rallentano e
  c'è tutto il tempo di fare il conto. Vale per quella domanda sola, dalla
  dopo il cielo riparte.
- 🎯 **mirino** — fa sparire una risposta sbagliata, scelta a caso. Non dice
  qual è quella giusta: il conto lo si fa lo stesso, con un sasso in meno.

Nessuno dei due risponde al posto del bambino: non accorciano una domanda,
non ne saltano una e non indicano l'asteroide giusto. Non si comprano con le
monete — si pagano con le risposte giuste.

## Quali domande escono, e perché proprio quelle

Le domande non escono a caso: **il motore tiene il conto di cosa il bambino
sa**, tabellina per tabellina.

Ogni singolo fatto (`7×8`, `6×4`…) ha uno stato suo: quante volte è stato
giusto, quante sbagliato, quando è stato visto l'ultima volta, e **quanto in
fretta** si è risposto. Da lì esce un peso, e il peso decide con che
frequenza quel fatto ricompare. In pratica:

| situazione | cosa succede |
|---|---|
| l'ha appena sbagliato | torna quasi subito, e più spesso |
| ci mette tanto a rispondere | conta quasi come mezzo errore: la velocità qui è parte del saperlo |
| l'ha detto giusto tre volte di fila | esce dal giro **per il resto della partita** — sa già farlo, è tempo tolto ad altro |
| lo sa da tre settimane | sparisce a lungo, poi rispunta da solo per un controllo |

L'ultima riga è la più importante e la meno ovvia: **la forza cala da sola
col tempo**. Una tabellina imparata dieci giorni fa non vale quanto una
imparata ieri, quindi torna a farsi vedere senza che il bambino l'abbia
sbagliata. È il modo di non far dimenticare quello che era già stato preso.

Il gioco tiene aperto solo un **gruppetto di fatti per volta**, non tutte le
tabelline insieme: finché quelli non si consolidano non ne entrano altri.
Per questo all'inizio le domande sembrano poche e ripetitive — è voluto.

Dentro un pianeta, però, comanda la tappa: **otto domande su dieci sono la
tabellina di quel pianeta**, e non è una media — non capita mai di trovarsi
due domande di fila che parlano d'altro. Le altre sono il ripasso di quelle
di prima, che serve e non deve sparire. E la stessa identica domanda non
esce mai due volte di seguito.

Il **boss**, ogni otto domande, è l'unico che sta fuori: arriva dal pianeta
*successivo*. È un assaggio di quello che non si è ancora fatto — perderlo
non toglie niente al motore, perché una cosa mai insegnata non si misura.

Salendo di livello — uno ogni cinque risposte giuste della partita — **il
cielo si infittisce, e accelera fino a un pavimento**: arrivano più sassi
sbagliati da scartare, e la caduta si accorcia del 5% a livello. Nelle tappe
si ferma al 70% del tempo di partenza (sette secondi invece di dieci), nel
volo infinito al 50%: lì l'unica cosa da fare è durare, e un cielo che non
accelera mai sarebbe una partita che finisce solo per noia. Il pavimento è
quello che tiene la domanda una domanda di conto e non di mano: anche al
minimo il sasso con la risposta giusta entra entro tre secondi dalla domanda
e resta da toccare per almeno due. Aspettare non è saper rispondere piano.

### Il volo infinito

Si apre a fila finita, ed è **uno**: tabelline e conti a mente, a turno,
mai più di tre di fila dello stesso. Non si sceglie niente a mano. **Si
complica col livello**: a livello 1 escono le tabelline del 2 e del 3 e
le somme entro il dieci, a livello 5 il 4 e il 6 e le somme col riporto,
a livello 9 il 7×8, il 9×7 e le centinaia. Quello che si sa da un pezzo
esce comunque di rado: la marea vale anche qui.

**E dal nove continua oltre il catalogo.** Chi è arrivato lì le
tabelline le sa tutte, e chiedergliele ancora, solo più in fretta, è
logoramento: entrano le **tabelline grandi** — 11×8, 12×5, 13×4, e le
stesse girate: 132 : 11 — poche a livello 8, la metà a 9, quasi tutte da
11; e i conti a mente crescono di taglia col livello, non con quanto si
sa: a livello 10 «spezza e moltiplica» chiede 7×86, «tre cifre» 640+380,
«quante volte ci sta» divide anche per 12 col resto. Le grandi non
contano da nessun'altra parte: non stanno nella fila, nella mappa delle
tabelline né nel conto delle stelle. Sopra il dodici il livello alza
solo la velocità. **Chi ha un record non riparte da 2×3**: la partita
comincia due livelli sotto quello del record, e in dieci calcoli si è
di nuovo dove si era arrivati.

Il volo ha un **record** in punti, e lo dice prima di entrare: sul tasto
della mappa c'è «record 1240 punti · livello 7 · 43 centri · serie 12».
A fine partita si legge di quanto è stato battuto, o quanto è mancato —
i coriandoli solo a record battuto, non alla prima partita e non a un
pareggio. Il record sta anche nell'albo, nella tabella dei primati.

### Il calcolo a mente ha una regola in più

Le stazioni hanno un **grafo di prerequisiti**: il complemento a 10 viene
prima delle somme con riporto, e così via. Ma il grafo **dosa, non sbarra**:
una stazione aperta è sempre superabile, e i prerequisiti ancora deboli
rientrano come ripasso *accanto* alle domande nuove, non al loro posto.

E ci sono tre assi di difficoltà, non uno: quale concetto è aperto, quanto è
consolidato, e **quanto sono grandi i numeri** — la stessa strategia si
esercita prima su 8+5 e poi su 47+38.

Le risposte sbagliate fra cui scegliere non sono a caso: sono **gli errori
tipici** di quel concetto. Se fossero numeri qualunque, il bambino
arriverebbe alla risposta per esclusione invece che calcolando.

## Cosa allena

Il recupero rapido dei fatti moltiplicativi — cioè saperli **senza
ricalcolarli** — e le strategie di calcolo mentale. Qui la velocità è parte
del saperlo: rispondere piano conta, non solo rispondere giusto.

## Note per i genitori

- Se le tabelline sono ancora troppo, la fila comincia proprio dai conti
  a mente: 3+4 non aspetta nessuna tabellina.
- **Non c'è nessun interruttore per togliere il calcolo a mente**, e non
  si rimette. C'era, e faceva esattamente la cosa che questo gioco è
  stato rimesso a posto per non fare: due metà, due file, due
  numerazioni. Chi ha bisogno di una scaletta più bassa muove **l'età**
  (*Genitori → Giochi e domande*), che apre in anticipo quello che il
  bambino sa già e tiene chiuso quello che gli sta avanti — tabelline e
  conti a mente insieme, perché sono la stessa aritmetica.
- Le divisioni si possono spegnere dai settaggi (*Genitori → cosa sa*).
- A che punto della fila si è arrivati si vede nella carta in home.
