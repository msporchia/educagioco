[← torna al README](../README.md)

# 🎖️ Il Generale *(in prova)*

*Programmazione senza scrivere codice.* Si dà una fila di ordini a una
squadretta, si preme play, e si guarda cosa succede.

<img src="img/generale-gioco.png" width="230"> <img src="img/generale-mappa.png" width="230">

> [!NOTE]
> Il gioco è in home come gli altri, ma **non tutti i livelli sono
> approvati**: se ne giocano sei, quelli guardati giocare da vicino. Gli
> altri sono scritti e stanno dietro l'interruttore *giochi in prova* nei
> settaggi — chi lo accende li vede tutti, segnati con 🧪. Promuoverne uno
> è una riga in `data/generale.js` (`APPROVATI`) e **non sposta le stelle
> già prese**: la fila è sempre quella, cambia solo quanto se ne vede.

## Come è fatto

Una mappa vista dall'alto, qualche unità da comandare — il cavaliere, la
ladra — e un obiettivo. Gli ordini si compongono da un menù, non si scrivono:
*vai laggiù*, *prendi la chiave*, *apri il portone*, *attacca gli orchi*.

Poi si preme play e **non si può più intervenire**. O funziona o no, e se non
funziona si guarda dove si è rotto e si corregge la fila.

## Prima il tutorial, poi il resto

Entrando si cade dritti nelle **prove**, che sono una fila di livelli sciolti,
uno per idea, e vanno fatte in fila perché ognuna dà per scontata quella
prima. Quelle approvate oggi sono sei — *il primo ordine, la chiave e il
portone, lo sgombero del castello, due strade, mettetevi d'accordo, il
richiamo* — e coprono **un ordine, una fila, una decisione, un segnale, il
rumore**.

Le altre venti sono scritte e si vedono col cancello aperto (la nota qui
sopra): i drill di consolidamento per ogni costrutto, e il cortile di Rosa,
che è la prima campagna con una storia sola dentro.

Più avanti le idee **si mescolano**: non è allenamento su cose già viste, è la
somma di due o tre di quelle in una situazione che nessuna di loro copriva da
sola. *Da una parte e dall'altra*, per dire, chiede di **origliare il nemico**
— l'evento e la decisione insieme, su un'informazione che arriva da chi ti sta
dando la caccia. Quella parte lì è ancora dietro il cancello.

> [!NOTE]
> Le cinque **avventure a capitoli** (`data/storie-generale.js`) sono scritte
> ma **spente**: nessuno le ha ancora provate, e il linguaggio del gioco sta
> ancora cambiando sotto. Non compaiono da nessuna parte finché
> `AVVENTURE_APERTE` non torna `true` — niente lucchetto, che sarebbe una
> promessa. Restano le prove.

Nel tutorial **si comanda sempre dalla parte dei buoni**: il cavaliere che
difende, non l'orco che assale. Il ribaltamento delle parti è un'idea buona,
ma non mentre si sta ancora imparando chi si è.

## Che cosa impara, davvero

Detto in breve: **è programmazione asincrona travestita da gioco**. Non è una
metafora vaga — sono gli stessi concetti, nello stesso ordine in cui li
incontra chi impara a programmare sul serio, solo senza sintassi da scrivere.

Le tappe li introducono uno per volta.

### 1. La sequenza

Gli ordini si eseguono uno dopo l'altro, dal primo all'ultimo, e **quello che
non hai scritto non succede**. Sembra ovvio e non lo è: è la prima cosa che
un bambino scopre quando il personaggio si ferma davanti alla porta chiusa
perché nessuno gli ha detto di aprirla.

Insieme arrivano i **prerequisiti** — la chiave prima del portone — e quindi
l'idea che *l'ordine delle istruzioni è la differenza fra vincere e perdere*.

E fin dal primo livello c'è una distinzione che si paga cara a ignorarla:
**`vai` sposta, non ottiene**. Camminare sopra il tesoro non lo mette in
tasca a nessuno — per averlo c'è `prendi`. Ci si arriva sopra, non succede
niente, e si capisce che il verbo dice *cosa vuoi*, non *dove metti i piedi*.

### 2. L'astrazione

Dire **dove si va** invece di elencare ogni singolo passo. Costa meno ordini
e, soprattutto, **regge quando la stanza cambia**.

Questo è il salto vero, ed è il motivo per cui il gioco è fatto così: ogni
capitolo **si gioca su più scene diverse** (tre di solito, quattro dove le
scene *sono* la domanda), e la fila di passi buona per la prima fallisce
sulle altre. Solo l'ordine che descrive l'intenzione le supera tutte. È la
differenza fra scrivere `vai_a(3,4)` e scrivere `destinazione`.

Vale anche per **chi** si nomina: `attacca` non si punta col dito su un
nemico della mappa, si sceglie da un elenco — e nell'elenco c'è *«gli
orchi»*, la classe. Indicare col dito vorrebbe dire «quell'orco lì, quello in
quel punto», e un piano si firma prima della battaglia, quando l'orco è
ancora dove gli pare.

### 3. I cicli, e cosa c'è dentro

*Rifai queste cose finché non succede quest'altra.* Il concetto che sta
dietro a `while`, incontrato per il bisogno di non scrivere venti volte lo
stesso ordine.

Nel gioco è un **blocco**, non un verbo:

```
🔁 ripeti
     🚶 vai a  [la porta di ponente]
     🚶 vai a  [la porta di levante]
     ＋
   smetti quando [👁 vedi gli orchi]
```

Per un pezzo era il verbo `pattuglia`, che prendeva una lista di *punti*: un
`for` travestito, e dentro non ci si poteva mettere nient'altro. Adesso il
ciclo contiene **ordini qualsiasi** — camminare, suonare, aprire — esattamente
come i rami di una decisione contengono ordini qualsiasi. Una ronda che a
metà giro grida «tutto libero» è scrivibile; una che apre una porta a ogni
passaggio pure. Una struttura in meno da spiegare, e molte più cose da
comporre.

L'uscita si chiama **«smetti quando»** e sta in fondo agli ordini, dove si
legge. Non è una parola più carina di «finché»: è l'unica giusta. Il motore
esce *quando la domanda diventa vera* — cioè è un `until` — e «finché vedi un
orco» in italiano si legge all'incontrario, come se dicesse «continua mentre
lo vedi». La condizione si guarda **a ogni battito**, non a fine giro: se no
si finisce il giro con il nemico alle spalle.

### 4. Le decisioni

**«Se vedi l'orco vai di sotto, se non lo vedi vai di sopra.»** Il piano
smette di essere una lista e diventa una cosa che *reagisce a quello che
trova*.

Le scene servono esattamente a forzare questo: cambia dove sta l'orco, e
nessuna fila fissa può andare bene per tutte. L'unico modo di vincerle tutte
è guardare prima di scegliere — ed è anche il primo ragionamento del gioco
che non è un'osservazione ma una **deduzione**: da qui vedo una sola delle
due porte, e sapere che l'orco *non* è qui dice dov'è.

### 5. Gli eventi: segnali fra più personaggi

Qui il gioco arriva dove i giochi di programmazione per bambini di solito non
arrivano. Le unità sono più di una, e **hanno file di ordini separate che non
partono insieme**:

> il cavaliere: *attacca gli orchi, **suona [via libera]***
> l'eroe: *****quando senti [via libera]**, prendi il tesoro*

Uno **emette** un segnale, l'altro **è in ascolto** e reagisce. È esattamente
il modello emitter/subscriber, ed è il modo in cui si coordinano processi che
girano in parallelo: nessuno dei due sa quando l'altro sarà pronto, quindi
non si aspetta un orario — si aspetta *un fatto*.

Un bambino che ha capito questo ha già in testa il modello mentale che serve
per le callback, gli eventi e le promise.

Con una regola che vale la pena dire ad alta voce: **un personaggio fa una
cosa alla volta**. Un segnale sveglia solo chi è libero — se sta già
eseguendo qualcosa, quel segnale gli scivola addosso e il registro lo scrive
(*«arriva «tutto libero», ma l'eroe sta ancora facendo quello di prima»*).
Niente code, niente ordini troncati a metà, e soprattutto mai due file che
comandano lo stesso personaggio nello stesso istante: una scena così non si
spiegherebbe più con nessuno dei due piani.

### 6. Il rumore, cioè un mondo che risponde

L'ultima tappa del tutorial non aggiunge una struttura: aggiunge una **regola
del mondo**, e senza quella dal settimo livello in poi metà di quello che si
vede sullo schermo non si spiega. `suona` fa rumore *da dove sei*, chi è fatto
per accorrere ci corre, e quindi **dove fai rumore decide dove lui non è**. Il
seguito è in [Il rumore è una cosa vera](#il-rumore-è-una-cosa-vera).

E siccome un segnale non ha destinatari, vale anche al contrario: quello che
dicono **loro** lo senti anche tu. Una ronda che a ogni giro si dice «tutto
libero» sta dando a te il suo orologio — e sapere che chi parla è lontano non
dice niente sull'altra sentinella. Da lì nasce il primo livello dopo il
tutorial: *ascolta, poi guarda, e solo dopo muoviti*.

## Nessuno è onnisciente

È la regola che tiene in piedi tutto il resto, e vale per i tuoi come per i
nemici: **non si va da qualcuno che non hai mai visto**. `attacca gli orchi`
insegue chi vede — o chi ricorda di aver visto — e su qualcuno di cui non sa
niente risponde *«non so dove sono: prima devo trovarli»*, e si ferma lì.

Da questa regola nasce metà del gioco. Se non puoi sapere dove sono, devi
**cercarli** (ecco il ciclo) oppure **fartelo dire** (ecco i segnali).

«Vedere», qui, vuol dire una cosa precisa: **essere a pochi passi di
cammino**. Non c'è nessun cono visivo — i muri contano perché allungano la
strada, e chi sta dall'altra parte di una cinta è a due celle in linea d'aria
ma a dodici passi di cammino, quindi non lo vedi. Ne segue che i punti ciechi
sono un fatto della mappa, non una regola in più da imparare.

## Il rumore è una cosa vera

Chi le prende **grida**, e quel grido è un segnale come tutti gli altri:
parte dal punto in cui si trova, si vede sulla mappa, e un'unità tua può
metterlo in ascolto con `quando senti`. Il grido di un orco è un segnale
esattamente come quello di un compagno.

Da qui viene anche il contrario: **fare rumore apposta**. `suona` fa rumore
*da dove sei*, e un nemico fatto per accorrere ci corre — quindi lascia il
posto che stava sorvegliando. Chiamarlo lontano da dove devi passare è una
mossa; chiamarlo dove devi passare tu è il modo di ritrovarselo addosso.

E una porta può dichiarare di essere **sfondabile**: chi non ha la chiave la
apre lo stesso, ma ci mette venti spallate e **fa fracasso**. Quel tempo è la
finestra in cui si fa a tempo ad accorrere — senza, un nemico che entra in un
istante non lo fermeresti da nessun posto che non sia la porta stessa.

## Ogni unità sa fare cose diverse, e lo dice

Se tutti sapessero fare tutto, «mandaci quello lì» sarebbe sempre la risposta
giusta e non ci sarebbe niente da pensare. Ma un divieto muto sembra un
capriccio del gioco, quindi ce ne sono di due tipi:

- **quello che uno non c'entra proprio a fare** non compare nel menù — e se
  il livello lo spiega, la ragione si legge nella scheda;
- **quello che non gli riesce** compare eccome: l'ordine si scrive, la scena
  parte, il cavaliere cammina fino al forziere e lì allarga le braccia —
  *«ho le mani occupate: scudo e spada»*. Lo scopri premendo ▶, che è dove si
  scoprono le cose qui dentro.

La differenza è tutta nel momento in cui si capisce. Un verbo tolto dal menù
lascia la domanda «dov'è finito *prendi*?»; un ordine che fallisce parlando
lascia «ah, allora ci deve andare l'altro» — che è la lezione.

## Ti si dice l'obiettivo, non la soluzione

La riga sotto la scena dice **solo cosa deve succedere**: *«il tesoro deve
finire in mano all'eroe»*, *«l'orco non deve arrivare alla principessa»*. Il
💡 racconta la situazione — chi c'è, com'è fatto, cosa non si può fare — e
non nomina mai la mossa.

Se serve, ci sono **tre aiuti a scalare**: il primo è gratis, gli altri
costano una stella. Sono suggerimenti, non istruzioni — si passa da «un
ordine è un verbo e una cosa» a «stare accanto a una cosa non vuol dire
averla» senza mai scrivere *prendi il tesoro*.

## Un vincolo che i giochi a blocchi non hanno

Premuto play **non si può più intervenire**. Niente correzioni al volo,
niente aggiustamenti mentre il personaggio cammina: si guarda il proprio
piano fallire, si capisce *dove*, si torna indietro e si cambia. C'è un tasto
solo, e dice sempre cosa succede se lo premi: **Via** quando è fermo,
**Stop** mentre gira — e Stop rimette tutto com'era.

È scomodo apposta. Aggiustare mentre gira è il modo di risolvere un livello
senza aver capito niente; guardare il proprio ragionamento sbagliare fino in
fondo è il modo di accorgersi di cosa non si era previsto.

## Note per i genitori

- È il gioco più difficile della raccolta e il meno finito.
- **Non conta quanto è corto il piano.** Un livello si chiude in tutti i modi
  che funzionano: quello che vale la seconda stella è **esserci arrivati da
  soli** — senza farsi svelare la struttura o la soluzione, e senza lasciare
  compagni sul campo. (Per un pezzo c'è stato un «par», un numero di ordini da
  rispettare; diceva a chi aveva appena vinto che il suo piano non era quello
  giusto, ed è stato tolto.)
- **Gli aiuti sono una scala, e il primo gradino è gratis.** Dal 💡 si chiede
  un aiuto per volta: prima suggerimenti a parole — che non costano niente e
  non tolgono niente, sono la frase che direbbe chi gli sta accanto — e poi,
  per chi resta bloccato, il gioco gli scrive nel piano un pezzo, la struttura
  (gli ordini al loro posto, con le caselle da riempire) e infine la soluzione
  intera, da guardare girare. Questi ultimi costano la seconda stella, e il
  tasto lo dice prima di essere premuto. Nessuno resta chiuso dentro un
  livello.
- Le prove automatiche giocano davvero tutti i livelli, e verificano anche
  che le soluzioni *sbagliate ma plausibili* perdano almeno una delle scene:
  un livello che si lascia vincere dalla fila di passi non insegna quello che
  dovrebbe.
