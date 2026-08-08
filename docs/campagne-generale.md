# Le campagne del Generale

Nel Generale non si pilota nessuno. Si guarda la mappa, si **firmano ordini
permanenti** alle unità, e poi si preme play e si guarda la scena svolgersi
senza poter più dire niente. È un gioco di programmazione travestito da
assedio, e travestito bene: il bambino non sta scrivendo codice, sta dando
ordini a gente che poi va a farsi ammazzare se glieli hai dati male.

Questo documento è il progetto del **contenuto**: come è fatta una campagna,
come si incatenano le tappe, dove sta il racconto, e la tabella tappa per
tappa. I dati stanno in `src/data/campagne-generale.js`. Le mappe **non ci
sono ancora**: ogni tappa ha un `mappa: null` che le aspetta, e
`senzaMappa()` le elenca.

## Il principio, che è uno solo

**La storia e la progressione didattica sono la stessa cosa.** Non «una
storia che fa da cornice a degli esercizi»: una tappa racconta un pezzo di
avventura *e* introduce un concetto, e le due cose devono essere la stessa
frase. «Si apre la botola» sta dove si impara che due unità dipendono l'una
dall'altra perché la botola resta aperta solo se qualcuno tiene la piastra —
non perché ci serviva una botola da qualche parte.

La prova è semplice: se una tappa esiste solo perché mancava un concetto, o
solo perché mancava un pezzo di trama, è sbagliata. Ne abbiamo riscritte tre
per questo motivo, ed è raccontato più sotto.

**L'ordine dei concetti però non lo decide la trama.** Lo decide come si
impara, e la trama gli va dietro. La fila è questa, ed è la spina dorsale di
tutto il file dei dati (`CONCETTI`):

```
sequenza → da vicino → prima quello → un ordine per sei → se →
aspetta che → il segnale → in due → ancora e ancora → finché →
il piano dell'altro → il suo errore → dall'altra parte → la tua crepa →
tutto insieme
```

Due cose di quella fila meritano di essere dette a voce alta.

**«Finché» arriva dopo «ancora e ancora».** Il ciclo non si regala: si fa
guadagnare. C'è una tappa intera — la nona del dungeon — in cui la stessa
riga va scritta dieci volte a mano, e il livello dopo apre con *quella
stessa scena* risolta in un ordine. Un ordine che arriva prima è una
comodità; un ordine che arriva dopo dieci righe uguali è un sollievo, e un
sollievo si ricorda.

**Lo stesso trucco è usato una seconda volta, prima.** «Un ordine per sei»
arriva dopo tre tappe passate a nominare una per una tutte le mete della
strada. E accanto ad `aspetta che [la saracinesca è alzata]` la cassetta
offre `aspetta [un momento]`, che è la scelta *sbagliata*: è la stessa idea
dello scaffale delle pozioni, dove un attrezzo che non va bene c'è sempre.
Se l'unica cosa che si può fare è quella giusta, scegliere non è più una
domanda.

## Il vocabolario, e perché i passi non ci sono più

Le campagne erano state progettate con `fai un passo a [direzione]` e
`girati a [lato]` in fondo alla scala. Sono stati tolti, e la ragione è di
principio: **un ordine punta a un obiettivo, mai a una direzione.** «Prendi
a nord» non vuol dire niente, e un gioco fatto di passi contati insegna a
contare i passi.

Il gradino basso però non è sparito con loro. Adesso è un **modo di usare
`vai`**: una fila di «vai» a mete nominate una per una — il pianerottolo,
la svolta, il fondo, la porta — che dice tutta la strada senza nascondere
niente, esattamente come facevano i passi. Si legge molto meglio, e su una
mappa una meta si punta anche col dito, senza bisogno che abbia un nome.

Da qui la cosa che tiene in piedi tutta la scala: **`vai` scende di grado da
solo.** Puntato a una casella è il gradino basso; puntato a una cosa da fare
— la torcia, la chiave, l'ogre — è quello di mezzo. Per questo la quarta
tappa del dungeon e la quinta di Nina, che sono le tappe dell'astrazione,
**non portano una parola nuova**: portano la stessa parola puntata a
un'altra specie di cosa, e il par crolla lo stesso (da 8 a 3, da 5 a 3).

Il vocabolario di oggi è dunque: `vai`, `prendi`, `apri`, `attacca`,
`aspetta`, `chiama`, `pattuglia … finché`, `segui`, `difendi`, più la
guardia `se ⟨condizione⟩` che si appende a qualunque ordine e le liste che
cominciano con `quando arriva ⟨segnale⟩`. I due che non sono verbi restano
fuori dalla scala dei gradi apposta, perché non li «sa fare» nessuno in
particolare: li usano tutti.

**I segnali hanno un nome vero**, non un colore: `👁️ nemico in vista`,
`✅ tutto libero`, `🚪 porta aperta`. È il salto da una variabile che si
chiama x a una che si chiama nemicoInVista, ed è l'unico posto del gioco in
cui il bambino esercita il dare il nome giusto a un fatto — scegliendolo da
un elenco, non scrivendolo.

## Chi sa fare cosa

Ogni unità dichiara i verbi che sa eseguire (`sa`). Non è un bilanciamento:
è **la ragione per cui una tappa ha più di un'unità.** Se il compito lo sa
fare uno solo, dare il compito giusto alla persona giusta diventa parte del
pensiero, e il coordinamento smette di essere un consiglio.

Nel dungeon la regola sta in due frasi — **le serrature e gli ingranaggi li
apre solo Gedeo, la spada la tiene solo Berto** — e da lì discendono quattro
tappe: il chiavistello (è di Gedeo, e per questo la seconda tappa è sua),
l'ingranaggio (la manovella la gira lui), la botola (la apre lui, *quindi*
sulla piastra ci sta Lilla: non è una scelta, è l'unica distribuzione che
funziona) e il drago. Nella fortezza vale lo stesso: Zanna non fa la ronda,
Mola non mena, e metà delle domande si risolvono leggendo le unità invece
che provando. E Pippo non ha le mani: alla festa la torta la porta Nina.

## Com'è fatta una campagna

Una campagna è una **fila di tappe**. La prima è aperta, la tappa *n* si apre
quando la *n−1* è superata. Nient'altro: niente stelle da accumulare per
proseguire, niente monete da spendere per sbloccare.

Una tappa è:

| | |
|---|---|
| **una riga di storia** | il pezzo di avventura. Una o due frasi, mai di più |
| **un concetto** | uno, e nuovo. Il gradino della scala qui sopra |
| **una cassetta** | gli ordini disponibili. È **cumulativa**: quello che entra non esce più |
| **tre scene** (varianti) | la stessa situazione con qualcosa di diverso |
| **un par** | il numero di ordini del piano più corto che le vince tutte e tre |
| **una mappa** | ← non c'è ancora |

### Le tre scene, e perché sono il motore di tutto

La regola «un livello si vince superando tre varianti» sembra una regola di
quantità. Non lo è: **è la ragione per cui esistono le condizioni.**

Un piano che vince una scena sola può essere una fila di mete contate a
mano. Un piano che deve vincere tre scene in cui la porta aperta è ogni
volta un'altra *non può* essere una fila di mete contate a mano: gli serve
un `se`. È lo stesso motivo per cui `vai a [la torcia]` batte sei mete
nominate — non perché è più corto, ma perché regge quando la torcia si
sposta. Le varianti sono il posto in cui l'astrazione smette di essere
elegante e diventa necessaria.

Da qui la regola delle stelle, che è dove sta il vero esercizio:

- **superata** — si vincono tutte e tre le scene. Fra una scena e l'altra il
  piano si può riaprire e correggere. Senza questo una bambina di sei anni
  non finisce nemmeno la prima tappa.
- **due stelle ⭐⭐** — le tre scene si vincono con **un piano solo**,
  firmato una volta, entro il par.

Il par si misura quindi su un piano solo. Non c'era altro modo di definirlo
senza ambiguità, e per fortuna la definizione che toglie l'ambiguità è anche
quella che insegna la cosa giusta.

**Nelle prime tappe le tre scene sono quasi la stessa scena** — cambia
l'arredo, gocciola l'acqua, passa un ratto. È voluto: lì servono a far
vedere che un piano firmato una volta gira uguale tre volte, non ancora a
metterlo alla prova. Cominciano a mordere dalla quarta tappa del dungeon
(dalla quarta di Nina), che è esattamente dove entra `vai a`.

### Le fazioni e l'autore

Ogni fazione di una scena ha un **autore**: `giocatore` o `livello`. Da qui
esce mezzo gioco.

Fin quando l'autore dell'altra parte è il livello e il suo piano è nascosto,
la scena è un ambiente. Dalla **undicesima tappa** il piano avversario è
**scritto e leggibile prima di firmare il proprio** (`pianoVisibile`), e
l'ogre davanti al tesoro smette di essere un ostacolo e diventa un testo.
Alla dodicesima quel testo ha dentro **un errore fatto apposta** (`bug`), che
non va corretto: va usato. E nella terza campagna gli autori si scambiano di
posto, e gli avventurieri diventano il programma.

C'è un solo livello in tutte e tre le campagne che arriva **col piano già
scritto** (`pianoDato`): *La crepa*, nella fortezza. È l'unico modo di
insegnare a trovare un errore nel piano proprio — serve che il piano ci fosse
già e che la scena si possa rivedere quante volte si vuole.

### Le monete

Con lo stesso metro degli altri giochi, che è l'unica cosa che tiene in piedi
l'economia comune: si conta il lavoro vero — il par per le tre scene — e si
paga **una moneta ogni quindici ordini**. Firmare un ordine costa meno di
un'operazione in colonna, quindi non è uno ogni dieci come nelle lingue. Ne
escono 23 monete per il dungeon intero, 6 per la campagna di Nina, 10 per la
fortezza.

Erano 28, 7 e 12 con i passi contati, e sono scese perché i piani si dicono
in meno righe: è il prezzo di un vocabolario più corto, non un taglio. Se
all'atto pratico il Generale risultasse pagato poco, la leva è **il metro**
— uno ogni quindici — non i par: i par si misurano, non si gonfiano.

---

## Campagna 1 — Il dungeon 🏚️

*Quattro avventurieri, una scala che scende e nessuno che li richiama.*

Tredici tappe, l'arco intero. I quattro hanno un nome perché un'unità con un
nome si comanda volentieri: **Mira** 🔦 va avanti e porta la torcia, **Berto**
🗡️ è quello grosso ed è l'unico che tiene una spada, **Gedeo** 🧰 è l'unico
che apre serrature e capisce gli ingranaggi, **Lilla** 🎒 è la più piccola e
passa dove non passa nessuno. Si comincia comandandone uno e si finisce
comandandone quattro: il gruppo cresce con il numero di unità che il bambino
sa tenere in testa.

| # | tappa | la riga di storia | concetto | in cassetta entra | par | perché sta lì |
|---|---|---|---|---|---|---|
| 1 | 🕯️ La scalinata | Il dungeon è là sotto e la scalinata è l'unica strada. Gli ordini si firmano qui in cima: più giù non si parla più. | la fila | `vai` | 4 | La regola del gioco *è* il concetto: quello che non hai scritto non succede. Una meta alla volta — il pianerottolo, la svolta, la porta — ed è il gradino basso della scala |
| 2 | 🔩 Il chiavistello | In fondo alla scalinata c'è una porta di ferro, e il chiavistello sta dalla nostra parte. Basta tirarlo: ma da lontano non si tira niente, e di serrature ci capisce solo Gedeo. | da vicino | `apri` | 5 | Un chiavistello è la cosa più ovvia del mondo da tirare, e la più impossibile da tirare a distanza: la prossimità non ha bisogno di essere spiegata, si vede. Ed è la tappa di Gedeo perché `apri` è suo e basta |
| 3 | 🐀 I primi mostri | Dietro la porta qualcosa si muove nel buio. Le spade sono nella rastrelliera all'ingresso, e nessuno attacca un ratto gigante a mani vuote. | prima quello | `prendi` `attacca` | 8 | I mostri che il papà voleva. E il prerequisito non spaziale — la spada — è la cosa che un bambino capisce senza una parola: gli stessi ordini in un altro ordine sono un altro piano. La spada la prende Berto, che è l'unico che sa menare |
| 4 | 🏛️ La sala delle colonne | La sala è così grande che il fondo non si vede, e la torcia da accendere è appesa a una colonna. Nominare una per una le mete fin là dentro non finisce più — e il brutto è che ogni volta la colonna è un'altra. | un ordine per sei | — *(niente: è `vai` puntato a una cosa)* | **3** | Prima tappa in cui le tre scene divergono davvero. Il par **crolla da 8 a 3**: non arriva una parola nuova, arriva un modo nuovo di usare quella che c'è già |
| 5 | 🔀 I due corridoi | Due corridoi, e uno solo è aperto. Quale, lo si scopre arrivandoci. Gli ordini però si firmano prima di arrivarci. | se | `se` | 7 | «Si firma prima di sapere» è la definizione della condizione e la regola del gioco, dette con la stessa frase |
| 6 | ⛓️ La saracinesca | La saracinesca si alza da sola con un rumore di catene, resta su un po' e poi ricade. Aspettare il momento giusto va bene. Contare fino a tre no, perché non è sempre tre. | aspetta che | `aspetta` | 6 | `aspetta [un momento]` è l'**attrezzo sbagliato** sullo scaffale: contare i momenti funziona su una scena su tre. E c'è la seconda trappola, il `se`: una guardia guarda una volta sola, e se la saracinesca è giù salta l'ordine |
| 7 | ⚙️ L'ingranaggio | L'ingranaggio sta in una stanza e il ponte che alza sta in un'altra. Chi gira la manovella non vede il ponte; chi è sul ponte non vede la manovella. Bisogna dirselo. | il segnale | `chiama` `quando arriva` | 8 | L'ingranaggio che il papà voleva. Due stanze che non si vedono sono l'evento asincrono: la manovella non dice *quando*, e nessuno dei due può indovinarlo. Il segnale si chiama «🚪 porta aperta», e il nome è metà della lezione |
| 8 | 🕳️ La botola | Sotto il tappeto c'è una botola, e resta aperta solo finché qualcuno sta sulla piastra dall'altra parte della sala. Aprirla sa farlo solo Gedeo, e sotto è buio: la torcia ce l'ha Mira. | in due | `segui` | 10 | La botola del papà, ma dove serve davvero: non è un prerequisito, è una dipendenza che dura tutta la scena. E chi sta sulla piastra non lo sceglie il bambino, lo decide chi sa aprire: Gedeo apre, *quindi* la piastra è di Lilla |
| 9 | 🗿 Il corridoio delle statue | Le statue si girano quando nessuno le guarda, e restano ferme finché qualcuno cammina avanti e indietro davanti a loro. Gli altri intanto lavorano in fondo. | ancora e ancora | — | **14** *(da tarare)* | Il livello più lungo di tutti e senza un ordine nuovo. Sta qui apposta: è la fatica che rende il ciclo un regalo invece di una comodità. Quanto lunga sia la fatica è l'unico numero del progetto da misurare dal vivo |
| 10 | 🔁 La sala buia | Dieci righe uguali, ieri, per tenere ferme le statue. Oggi nella cassetta c'è «pattuglia … finché», che è la stessa cosa detta in una riga sola — e serve subito, perché la chiave del tesoro è in un angolo della sala buia e non è sempre lo stesso angolo. | finché | `pattuglia` | **6** | La prima scena è *il corridoio di ieri*: dieci ordini diventano uno, e si vede. Le altre due sono la sala buia, dove una fila scritta a mano non basterebbe comunque |
| 11 | 📜 La guardia del tesoro | Davanti alla porta del tesoro c'è un ogre che non dorme mai. I suoi ordini però sono scritti su una tavola appesa al muro, e si leggono prima di firmare i nostri. | il piano dell'altro | — | 10 | La tavola appesa al muro è il piano avversario reso visibile senza inventare una interfaccia: nel dungeon gli ordini si scrivono su tavole, e l'ogre ne ha una |
| 12 | 🐞 Il portone | Anche il capitano degli orchi ha firmato i suoi ordini, e uno è sbagliato: apre il portone e solo dopo guarda chi c'è fuori. Nessuno gliel'ha detto. Non va corretto: va usato. | il suo errore | — | 11 | Il bug deliberato, ed è un bug che si può *spiegare a voce a un bambino di sei anni*: due righe nell'ordine sbagliato |
| 13 | 🐲 Il cuore del dungeon | L'ultima sala ha quattro porte, due leve, un drago che dorme e nessun ordine nuovo. Tutto quello che serve è già stato imparato: qui si tratta di metterlo in fila. | tutto insieme | — | 18 | L'esame. Come il ☀️ dei pianeti e la ⭐ delle stazioni: niente di nuovo, tutto insieme, su mappa grande e con quattro unità — e con le porte che sa aprire uno solo |

La quinta e la sesta tappa portano in cassetta due cose che verbi non sono
(`se` è una guardia, `quando arriva` è la testa di una lista): la colonna
dice lo stesso «in cassetta entra», perché per il bambino sono roba nuova da
usare come le altre.

**Il par non sale in modo monotono**, ed è la cosa più importante del
disegno. 8 → **3** alla quarta, 14 → **6** alla decima. Sono i due punti in
cui il piano si accorcia invece di allungarsi, e il bambino lo vede sul
contatore. È lo stesso disegno a coppie del laboratorio delle pozioni, dove
la tappa che porta un gesto nuovo riparte coi numeri facili.

**La nona tappa è parametrica.** Quante volte la stessa riga va riscritta
sta in una costante sola, `VOLTE_STATUE`, in cima alla campagna nel file dei
dati; il par della nona (`VOLTE_STATUE + 4`) e le due frasi che citano il
numero — nella nona e nella decima — vengono dietro da sole. Oggi vale 10 ed
è un'ipotesi, non una misura: la si prova a 8, a 12, a 22 cambiando un
numero solo.

---

## Campagna 2 — Nina e il draghetto 🐉

*Una bambina, un cane e una festa da preparare.*

Sei tappe per chi ha sei anni e legge male. Non è il dungeon in piccolo: è
un'altra cosa, con altre regole.

- **Dieci parole al massimo per riga di storia**, e parole di tutti i giorni.
  Chi non le legge se le fa leggere e non perde niente, perché la storia sta
  anche nel disegno.
- **Si arriva alla quarta riga della scala e ci si ferma**: fila di ordini,
  da vicino, prima quello, un ordine per sei. Niente condizioni, niente
  segnali, niente cicli.
- **Il premio si vede.** Non c'è una tappa che finisca con «superato»:
  finisce con la mela, la chiave, l'orto aperto, Pippo fuori dal recinto, la
  torta sul tavolo.
- **Non si perde.** Una scena può non riuscire, e allora si riguarda.

**Nina** 🧒 ha sempre fame, **Pippo** 🐕 è il suo cane, il **draghetto** 🐉
compie gli anni. Tutta la campagna è la strada per arrivare alla sua festa,
e ogni tappa porta a casa un pezzo della festa.

| # | tappa | la riga di storia | concetto | entra | par | perché sta lì |
|---|---|---|---|---|---|---|
| 1 | 🍎 La mela | Nina ha fame. La mela è in fondo al prato. | la fila | `vai` | 3 | Tre mete in fila: il sasso, la panchina, la mela. È la tappa più corta di tutto il gioco, e serve solo a far capire che gli ordini si eseguono in fila e poi succede qualcosa |
| 2 | 🔑 La chiave | La chiave è nell'erba. Nina la vuole. | da vicino | `prendi` | 4 | Una chiave nell'erba non si prende da lontano. Ed è la prima cosa che si tiene in mano: da qui in poi Nina *ha* qualcosa |
| 3 | 🚪 La porta | La porta dell'orto è chiusa. Nina va e apre. | da vicino | `apri` | 4 | Lo stesso concetto con un secondo gesto, ed è voluto: a sei anni una cosa si impara due volte. La porta si apre, e dietro c'è l'orto |
| 4 | 🐾 Pippo | Pippo è nel recinto. Prima la chiave, poi il cancello. | prima quello | — | 5 | La chiave della seconda tappa serve adesso. È il primo piano in cui l'ordine delle righe conta, e la ricompensa è un cane che esce di corsa |
| 5 | 🌾 Il prato grande | Il prato è grande. Nina dice dove va. | un ordine per sei | — *(niente: è `vai` puntato a una cosa)* | **3** | Il prato è grande apposta: nominare sei posti in fila diventa noioso proprio quando si scopre che si può dire soltanto dove si vuole arrivare. Anche qui il par scende |
| 6 | 🎂 La festa | Il draghetto fa gli anni. Torta e candele! | tutto insieme | — | 7 | Due liste di ordini invece di una: Nina porta la torta e le candele, Pippo — che non ha le mani — corre dal draghetto. Ed è la festa a cui tutta la campagna stava andando |

Le prime tre tappe hanno tre scene quasi identiche — la stessa mela, di
sera, con una farfalla. È la stessa scelta del dungeon, e a sei anni conta il
doppio: vedere il proprio piano funzionare tre volte è metà del premio.

---

## Campagna 3 — La fortezza degli orchi 🏰

*Stavolta i tuoi sono quelli dentro, e gli altri hanno un piano.*

Si apre a dungeon finito. Cinque tappe, e la cassetta parte **piena**: chi
arriva qui ha già tutto in mano tranne `difendi`.

Ed è il problema di questa campagna, ed è anche la sua ragione di esistere.
Non può vivere di ordini nuovi, perché non ce ne sono più. Vive di **tre
mestieri che dal lato dell'attacco non esistono**:

1. mettersi dove l'altro passerà, invece di inseguirlo;
2. coprire un buco che sta **nel tempo** e non nello spazio — una pattuglia
   lunga copre tanto muro e lo copre di rado;
3. trovare l'errore nel piano **proprio**, che è tutt'altro mestiere che
   trovarlo in quello altrui.

**Grum** 🪓 è il capitano e non è il più sveglio, **Zanna** 🛡️ sta al portone
e non si sposta — e infatti non sa fare la ronda —, **Mola** 🔨 è l'unica che
gira le manovelle e apre i portoni ma non mena, **Occhio** 🔔 sta in torre,
vede tutto e chiama.

| # | tappa | la riga di storia | concetto | entra | par | perché sta lì |
|---|---|---|---|---|---|---|
| 1 | 🛡️ Il turno di guardia | Stavolta la fortezza è nostra. Gli avventurieri sono là fuori, i loro ordini sono già scritti e si leggono: quello che manca è qualcuno che stia dove passeranno. | dall'altra parte | `difendi` | 8 | L'inversione detta in una frase, e `difendi` è l'unico ordine di tutto il gioco che dice «resta lì anche quando sembra che non serva»: è il verbo di chi difende |
| 2 | 🧱 La ronda sulle mura | Le mura sono lunghe e gli orchi sono due. Chi cammina non può essere in due posti, quindi la domanda non è dove mettersi: è per quanto tempo un pezzo di muro resta scoperto. | finché *(ripreso)* | — | 7 | `pattuglia` si conosce già dal dungeon; qui la si guarda dal lato di chi la subisce. La ronda sulle mura è il posto naturale del ciclo, e nella fortezza ce n'è una vera — ed è per forza di Mola, perché Zanna dal portone non si muove |
| 3 | 🔔 La vedetta | Dalla torre si vede tutto e non si difende niente. Occhio lassù vale gli altri tre, ma solo se dice quello che vede, e solo se gli altri hanno una lista che comincia con «quando arriva». | il segnale *(ripreso)* | — | 10 | Nel dungeon il segnale si ascoltava. Qui si decide **chi lo chiama e quale**: un segnale che dice solo «sono arrivati» non basta a nessuno, e il `se` appeso alla chiamata serve a scegliere il nome giusto |
| 4 | 🩹 La crepa | Il piano di ieri notte è ancora appeso al muro, e la fortezza è caduta lo stesso. Non è colpa degli avventurieri: nel piano c'è una crepa, e la scena si riguarda finché non si trova dov'è. | la tua crepa | — | 10 | L'unico livello che arriva **col piano già scritto**. Il bug: due orchi hanno lo stesso ordine e lasciano lo stesso cancello nello stesso momento — l'altro non lo guarda nessuno |
| 5 | 🌑 La notte lunga | Quattro orchi, sei avventurieri, due portoni e nessun ordine nuovo. Se la fortezza regge fino all'alba, il dungeon resta nostro. | tutto insieme | — | 16 | L'esame della campagna invertita, e la chiusura del cerchio: il dungeon che si era espugnato adesso lo si tiene |

---

## Dove l'incastro non veniva, e come si è risolto

Tre punti hanno chiesto di riscrivere, e tutti e tre nella stessa direzione:
è stata la storia a cedere, mai l'ordine dei concetti.

**Il ciclo non aveva una storia.** «Si fa la ronda» è una bella scena ma è
*una* scena, e il ciclo ha bisogno di due tappe: la fatica e il sollievo. La
soluzione è venuta da una regola di finzione — le statue si girano quando
nessuno le guarda — che rende la ripetizione *necessaria alla trama* e non
solo all'esercizio: qualcuno deve camminare avanti e indietro davanti a loro
mentre gli altri lavorano. Poi la tappa dopo apre con la stessa scena e la
cassetta con dentro `pattuglia`. Dieci ordini diventano uno e il bambino lo
legge sul contatore.

**I segnali cadevano nel vuoto.** Un segnale è utile solo se due unità non
si vedono, e in un dungeon fatto di stanze aperte non succede mai. È servito
inventare la geometria giusta prima della storia: l'ingranaggio in una stanza
e il ponte in un'altra, senza una linea di vista fra le due. Da lì la frase è
venuta da sola — *chi gira la manovella non vede il ponte* — ed è quella che
il papà aveva già in testa quando ha detto «si attiva l'ingranaggio».

**La botola del papà stava nel posto sbagliato.** Doveva essere la tappa dei
prerequisiti, ma i prerequisiti si spiegano meglio con un chiavistello (è
alla portata della seconda tappa, e la botola è troppo bella per bruciarla
lì). Spostandola all'ottava è diventata la tappa del coordinamento: una
botola che resta aperta solo finché qualcuno preme una piastra dall'altra
parte della sala è **esattamente** l'immagine di due unità che dipendono
l'una dall'altra per tutta la scena, e non per un istante.

## Le tappe più deboli

Vanno dette adesso, perché sono le prime da rifare quando si proverà davvero.

- **La nona (Il corridoio delle statue).** È l'unica tappa che non porta un
  ordine nuovo *e* non porta un modo nuovo di leggere: porta soltanto fatica.
  La difesa è che quella fatica è il contenuto, ma se giocandola risultasse
  noiosa invece che frustrante ha fallito. È il numero più fragile del
  progetto, ed è per questo che è **l'unico che si cambia in un posto solo**:
  `VOLTE_STATUE`. Va tarato guardando giocare un bambino, non contando su una
  mappa, e la domanda è una: dopo quante righe uguali smette di dire «così è
  lungo» e comincia a dire «così è noioso»? La fatica satura presto — otto,
  forse dieci — e quello che si aggiunge dopo non insegna più niente.
- **La seconda della fortezza (La ronda sulle mura).** Il mestiere che
  insegna — il buco è nel tempo — è vero e importante, ma è anche il più
  vicino a essere una variante della prima. Se alla prova risultasse la stessa
  tappa due volte, va fusa con la prima e la fortezza scende a quattro.
- **La terza di Nina (La porta).** Ripete il concetto della seconda con un
  gesto diverso. A sei anni è probabilmente giusto così, ma è l'unica tappa
  di tutto il progetto che non passerebbe la regola «un concetto nuovo per
  tappa» se la si applicasse alla lettera.
- **Le varianti delle prime tre tappe di ogni campagna**, che sono quasi
  identiche fra loro. È una scelta, non una svista, ma è la scelta che regge
  di meno: se giocandole le tre scene sembrassero un compito ripetuto invece
  di una prova superata tre volte, allora le prime tappe devono cambiare
  geometria e la meta che si sposta deve arrivare prima.
- **La seconda del dungeon (Il chiavistello).** È diventata la tappa di
  Gedeo perché `apri` lo sa fare solo lui, e la cosa è giusta ma si paga:
  Mira apre la campagna e alla seconda scena non c'è. Se all'atto pratico
  quel cambio di faccia stonasse, la via d'uscita è mettercele tutte e due —
  Mira che arriva, Gedeo che apre — e accettare due unità alla seconda tappa
  invece che alla terza.

## Cosa manca

- **Le mappe.** Tutte e ventiquattro. Il formato lo sta definendo un altro
  pezzo di lavoro; ogni tappa ha il suo `mappa: null` che aspetta, e la
  descrizione delle tre scene che ne devono uscire sta in `varianti`.
- **I par veri.** Quelli scritti sono contati sulla mappa che avevamo in
  testa. Quando la mappa esiste vanno rimisurati giocandola — e vale la stessa
  regola del castello: non si aggiusta il numero a occhio, si rimisura.
- **Un test di unità.** `verificaScala()` in fondo al file dei dati controlla
  già da sola le cose che a occhio si sbagliano: che nessuna tappa porti un
  ordine che non esiste (i passi, per dire), che dentro una campagna i
  concetti non tornino indietro nella scala, che i par siano interi positivi
  e le scene tre, e che in una tappa che porta un ordine nuovo ci sia **in
  scena qualcuno capace di eseguirlo** — se no la cassetta cresce di una
  parola che a quella tappa non serve a nessuno. Basta chiamarla da un
  `test/unita/`. Deve tornare una lista vuota.
