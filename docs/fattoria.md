# 🚜 La fattoria

**Dove finiscono le monete guadagnate negli altri giochi.** Non ci sono
domande, e non ce ne saranno: è il posto dove si spende, e per questo è il
motivo per cui si torna a fare esercizi.

Ha preso il posto della cameretta — nascosta il 16 agosto 2026, e tolta del
tutto il 23 settembre, quando i bambini avevano smesso di aprirla — per una
ragione sola: **il money pit dev'essere uno**. Un bambino che può spendere le
monete in due posti non sceglie, si dimentica dell'altro — e fra i due questo
era quello che si poteva far crescere.

## Cosa si fa

Si compra terra (rincara a ogni pezzo), si sgombera il bosco, si posa quello
che si vuole dove si vuole, si comprano animali e si accudiscono. **Spostare
costa una monetina**, così questo non diventa un tavolino dove si passa il
pomeriggio a spostare la stessa panchina — ma rimettere una cosa esattamente
dov'era è gratis, perché cambiare idea a metà gesto non è un errore da punire.

Niente si perde mai: quello che si mette via va in un baule e da lì si
ripiazza gratis quante volte si vuole. **Metterla via costa la stessa
monetina dello spostamento**, e il tasto 📦 lo dice prima che si prema.
Non è un prezzo in più: è quello di prima detto per bene. Finché togliere
era gratis, «📦 e poi rimetti giù dal baule» faceva lo stesso lavoro di uno
spostamento senza pagare niente — cioè la monetina la pagava solo chi non
aveva trovato la scorciatoia, che è il modo più rapido di insegnare che le
regole valgono per i distratti. Il conto del gesto intero resta uno:
togliere 1, riposare dal baule 0.

## I campi (dal 17 agosto 2026)

Posizionare era tutto, e i bambini lo dicevano: *«non posso fare nulla oltre a
posizionare»*. Adesso un campo si semina, cresce col tempo vero e si
raccoglie; il raccolto si trasforma — al mulino in pappa per il cane e il
gatto di casa, al fienile in mangime per le bestie del cortile.

Tredici colture — cinque dal primo giorno, otto arrivate con
[l'orto](#lorto-e-le-cinque-bocche-nuove-dal-15-settembre-2026) — e ognuna
ha **sette stati che si vedono**: i semi per terra,
il germoglio, e via fino al maturo. Sono tanti apposta — il tempo di crescita
è vero, e in dieci minuti deve succedere qualcosa a ogni occhiata, se no il
campo sembra fermo e non ci si torna più.

E **si vede che l'hai seminato**. Un campo comprato è terra nuda, non
lavorata; appena si semina diventa un'aiuola col bordo e i semi sopra, e
quello è il segnale che qualcosa è successo. Il primo stato era «niente», sul
ragionamento che la terra mossa fosse già il disegno del campo: per il primo
settimo della crescita un campo seminato era identico a uno vuoto, e non si
capiva se seminare avesse funzionato.

```
   🌿 erba medica  ── 4 min ──▶  1 fieno   ─┐
   🌾 grano        ── 5 min ──▶  1 grano   ─┤
   🥕 carote       ── 6 min ──▶  1 carota  ─┼──▶  mulino  ──▶ 🥣 🍲 🥧
   🌽 mais         ── 8 min ──▶  1 mais    ─┤
   🎃 zucche       ──10 min ──▶  1 zucca   ─┤
   🥔 patate       ── 7 min ──▶  1 patata  ─┤
   🥦 cavolfiori   ── 9 min ──▶  1 cavolo  ─┤
   🍅 pomodori     ── 8 min ──▶  1 pomodoro┤
   🍆 melanzane    ── 9 min ──▶  1 melanzana
   🫑 peperoni     ── 7 min ──▶  1 peperone┤
   🧅 cipolle      ── 6 min ──▶  1 cipolla ─┤
   🧄 aglio        ──12 min ──▶  1 aglio   ─┤
   🍓 fragole      ──11 min ──▶  1 fragola ─┴──▶  fienile ──▶ 🌰 🥬 🥘 🪣 🍃 🌼
                                                    │
                                              dieci recinti ──▶ 🥚 🥛 🍄 🧶 🍯 💩
```

### N → 1, e mai il contrario (dal 19 agosto 2026)

**Un campo dà una cosa. Due grani danno un becchime. Due becchimi danno un
uovo.** È la regola che tiene contabile tutta la catena, e non è
bilanciamento: è *quanto costa capire*. Da lì la domanda «quanti me ne
servono» ha una risposta che si conta sulle dita — se te ne chiedo tre,
riempi tre campi.

Prima un campo rendeva da 2 a 5, e una ricetta ne faceva 1 o 2. Con quei
numeri il conto si spezza: da «tre grani fanno due mangimi» a «quanti campi
semino per due uova» ci sono due divisioni con un resto, e non le fa nessuno
— si semina a caso e si torna a guardare. Peggio, il numero grande fa credere
di essere ricchi: un campo che rende cinque mais sembra tanto finché non si
scopre che al pastone ne servono quattro.

A fare la differenza fra una ricetta e l'altra restano **quanto prende,
quanto costa e quanto ci mette**: tre leve che si leggono tutte guardando il
tasto. `guastiDelleColture` rifiuta qualunque `resa` diversa da uno.

Due conseguenze che si vedono:

- **Seminare è gratis, si paga raccogliendo.** Un raccolto adesso è *una*
  cosa: farsi pagare due volte per un pezzo solo lo renderebbe più caro che
  comprarlo, e la catena si ribalterebbe. Resta viva la regola che conta —
  chi è a zero monete non perde il raccolto, il campo lo aspetta.
- **L'ovile chiede un foraggio solo**, la conigliera due. Fanno la stessa
  lana, quindi quello che costa il doppio deve chiedere la metà: con le rese
  a uno non si può più differenziare col «rende due invece di uno».

| | prodotto | comprato | riempie |
|:--|--:|--:|--:|
| 🥣 Mangime | 🪙3 e ~14 min | 🪙5 subito | 30% di pancia |
| 🥚 Uovo | 🪙5 e ~33 min | 🪙7,5 subito | 45% di pancia |
| 🥛 Latte | 🪙5 e ~36 min | 🪙9 subito | 55% di pancia |
| 🍲 Pastone | 🪙7 e ~30 min | 🪙12 subito | 70% di pancia |
| 🥧 Merenda | 🪙8 e ~84 min | — | 75% di pancia |
| 🍄 Tartufo | 🪙9 e ~60 min | 🪙15 subito | 90% di pancia |

I minuti dell'uovo e del tartufo si sono **accorciati e non gli è cambiato
il prezzo**, ed è quello che le bocche dell'orto devono fare: le anatre
fanno l'uovo in 33 minuti invece di 36 e la zuppa di pomodori porta il
tartufo da 72 a 60, ma costano ancora 🪙5 e 🪙9. La merenda non ha una
colonna «comprato» perché non si compra: è l'unica pappa che esiste solo
coltivandola.

I minuti sono quelli di **un campo solo che gira**: chi ne ha tre li divide
per tre, ed è il motivo per cui il secondo campo è la spesa che cambia di più
la giornata.

**Coltivare conviene della metà, non dell'ottanta per cento.** È il numero su
cui sta in piedi tutto: se coltivare costasse un quinto, dopo tre giorni
nessuno comprerebbe più niente e la fattoria smetterebbe di bruciare monete.
Chi vuole dar da mangiare *adesso* compra, come sempre; chi ha aspettato
risparmia. Un test lo controlla a ogni giro (`unita/coltivazioni`) e diventa
rosso se qualcuno ritocca un prezzo di troppo.

Il freno vero non è il prezzo: è **il tempo e quanti campi hai**. E
l'attrezzatura si paga prima, in monete grosse — campo 🪙22, mulino 🪙150,
fienile 🪙150, silos 🪙120 l'uno, e i recinti dai 🪙95 ai 🪙355 — cioè la catena
*dà un motivo per spendere*, non è il modo di smettere.

**E il campo rincara a ogni copia** (🪙22, 32, 46, 67, 97…), come il pezzo di
terra: è la cosa che moltiplica tutto il resto — più campi vuol dire più
raccolto per volta — e a prezzo fisso l'unica strategia sarebbe comprare
campi finché c'è terra. Il rincaro conta quelli in mappa **e** quelli nel
baule, se no metterli via e ricomprarli sarebbe il modo di non pagarlo.

### I recinti (dal 18 agosto 2026)

Conigliera, pollaio, ovile, stalla, porcile: cinque — e dal 15 settembre
2026 sono dieci, coi [cinque
dell'orto](#lorto-e-le-cinque-bocche-nuove-dal-15-settembre-2026) — e **non sono una
meccanica nuova**. Sono macchine come il mulino — dai da mangiare, aspetti,
ritiri — quindi non c'è niente di nuovo da imparare né per chi gioca né per
chi legge il codice.

Quello che hanno di loro è che **si leggono da lontano**. Ogni specie è
disegnata in cinque stati e in mappa si vede quello di adesso: ferma, mangia,
è contenta, dorme, è pronta. Non è un'icona che galleggia sopra: è la faccia
dell'animale, ed è la ragione per cui un bambino attraversa la fattoria e sa
già dove deve andare.

```
   🐰 conigliera 🪙95   2 🥬 ──14 min──▶ 1 🧶 lana
   🐔 pollaio    🪙130  2 🌰 ── 8 min──▶ 1 🥚 uovo
   🐑 ovile      🪙190  1 🥬 ── 8 min──▶ 1 🧶 lana
   🐄 stalla     🪙220  2 🥬 ──10 min──▶ 1 🥛 latte
   🐖 porcile    🪙260  2 🥘 ──20 min──▶ 1 🍄 tartufo
   🦆 anatre     🪙240  1 🪣 ── 6 min──▶ 1 🥚 uovo
   🐐 capre      🪙280  1 🍃 ──12 min──▶ 1 🥛 latte
   🐝 arnie      🪙300  2 🌼 ──12 min──▶ 1 🍯 miele
   🦙 alpaca     🪙330  1 🥬 ── 5 min──▶ 1 🧶 lana
   🫏 asini      🪙355  2 🌰 ──10 min──▶ 1 💩 concime
```

La **lana** è l'unica cosa della catena che non si mangia: paga una coccola,
la copertina, che è la prima coccola che si paga col granaio invece che con
le monete. Serve a che oltre alla ciotola ci sia qualcos'altro da desiderare
— e a dare un mestiere alle pecore.

Conigli e pecore mangiano lo stesso foraggio e fanno la stessa lana, quindi
**l'ovile dev'essere più efficiente**: gliene basta *uno* dove alla
conigliera ne servono due. Se no costerebbe il doppio per fare la stessa
cosa, che è il modo di rendere inutile la seconda metà di un catalogo. Si
paga prima e si risparmia dopo, come tutta l'attrezzatura di questo gioco.

### Il fienile, e il mangime (dal 19 agosto 2026)

**La catena era corta**: campo → animale → prodotto, tre passi, e dopo il
primo pomeriggio non c'era più niente da scoprire. Adesso in mezzo c'è il
**fienile**, che dal raccolto fa il *mangime* delle bestie:

```
   campo  →  fienile  →  recinto  →  prodotto
```

Non è una meccanica nuova: è una macchina come il mulino, stessi verbi (dài
dentro, aspetti, ritiri) e stesso pannello. Ed è **un edificio che c'era
già** — si vendeva a 🪙150 fra le case, come decorazione. Stesso id, stesso
prezzo, stesso disegno: chi se l'era comprato per bellezza se lo ritrova
utile, e non c'è niente da migrare in nessun salvataggio. È la terza volta
che succede, dopo l'orto e il carretto del vicino.

I due mestieri restano separati, ed è quello che rende leggibili due macchine
invece di una sola con sette tasti: **il mulino fa la ciotola di casa, il
fienile fa il mangime del cortile.**

```
   🌾 il mulino  →  🥣 mangime, 🍲 pastone          il cane e il gatto
   🏚 il fienile →  🌰 becchime, 🥬 foraggio, 🥘 zuppa   le bestie del cortile
```

**Tre mangimi, tre bocche.** Uno solo sarebbe stato più semplice da scrivere
e avrebbe cancellato la cosa che questo gioco insegna: *ogni coltura ha la
bocca che la mangia*. Con un mangime unico si coltiva la coltura più
conveniente e basta; con tre, il grano resta la cosa delle galline e le
zucche restano la cosa dei maiali, e il fienile è solo il passaggio in mezzo.

```
   🌾 grano  ──2──▶ 🌰 becchime ──2──▶ 🐔 galline            ──▶ 🥚 uovo
   🥕 carote ──2──▶ 🥬 foraggio ──2──▶ 🐰 conigli            ──▶ 🧶 lana
   🌿 fieno  ──2──▶ 🥬 foraggio ──1──▶ 🐑 pecore             ──▶ 🧶 lana
                                ──2──▶ 🐄 mucche             ──▶ 🥛 latte
   🎃 zucche ──2──▶ 🥘 zuppa    ──2──▶ 🐖 maiali             ──▶ 🍄 tartufo
   🌽 mais   ──3──▶ 🍲 pastone (al mulino, per la ciotola)
```

Due strade per lo stesso foraggio non sono una svista: le carote arrivano col
primo recinto, il fieno sette livelli dopo ed è **la metà del prezzo** — chi
ha aspettato risparmia, come sempre qui dentro.

I conti non cambiano: coltivare conviene sempre di circa la metà rispetto a
comprare, e il tempo si allunga (un uovo passa da ~11 a ~14 minuti di catena,
un tartufo da ~55 a ~65). Il controllo che lo tiene fermo
(`unita/coltivazioni`) adesso **risale la catena da solo**, perché il
pollaio non prende più grano ma becchime, e il becchime non lo coltiva
nessuno.

### Il fumetto dice cosa vuole (dal 19 agosto 2026)

Chi ha fame lo diceva con **un disegno**: ogni specie aveva un sesto
ritratto, uguale agli altri ma col fumetto dipinto dentro, e dentro il
fumetto quello che quella specie mangia. Non funzionava, per tre motivi, e il
primo li contiene tutti.

- **Un fumetto dipinto non può dire il vero.** Cosa mangia un recinto sta
  nelle ricette, e le ricette cambiano: mucche e pecore vogliono tutte e due
  il foraggio, e il foglio mostrava un mucchietto arancione all'una e un
  ciuffo verde alle altre. Due bestie che vogliono la stessa cosa la
  mostravano con due disegni diversi — che è il difetto da cui è nato tutto
  questo giro.
- **Era minuscolo.** A schermo un recinto è largo settanta pixel, quindi
  dentro il fumetto ce ne stanno dieci per dieci, e a dieci pixel una carota
  e una zucca sono la stessa macchia.
- **Si portava dietro un rimasuglio del generatore**, una macchia colorata
  appesa alla staccionata, che non era niente e non si poteva cancellare
  senza bucare la staccionata sotto.

Adesso il fumetto **lo disegna la scena** — in pixel di schermo, come il 🧺 e
come i prezzi dei cartelli, quindi cresce con lo zoom e resta leggibile — e
ci mette la merce che quel recinto sta aspettando davvero (`cosaVuole` nel
motore). Chi ha fame mostra il ritratto calmo: la faccia dell'animale in quei
cinque disegni era comunque la stessa, e i cinque `_fame` sono usciti dal
foglietto (`sorgenti/fattoria/generati/animali.json`), cioè dal file unico: 47 KB in meno.

Il motore consegna alla scena **una faccia già decisa** (`{ pezzo, testo }`),
non il nome di una merce: `scena/tela.js` non sa cosa sia il foraggio, e non
deve saperlo.

### Le merci hanno una faccia (dal 19 agosto 2026)

Un'emoji la disegna il telefono: in mezzo a uno schermo dipinto a mano ha lo
stile di Apple, non si tinge dell'ambiente, e dentro un fumetto piccolo non
si distingue da un'altra emoji della stessa tinta. È la stessa ragione per
cui i mostri del dungeon hanno smesso di essere emoji.

Quindi ogni merce dichiara il suo `pezzo` dell'atlante
(`dati/coltivazioni.js`) e lo disegna `viste/Merce.vue`, il fratello di
`Provino.vue`. La stessa faccia compare in quattro posti che devono dire la
stessa cosa: il fumetto sopra un recinto, lo scaffale del silo, i tasti delle
ricette, la scheda di un campo.

**Nove facce su quattordici erano già nell'atlante, e non le nominava
nessuno**: le casse del raccolto, la balla di fieno, la bottiglia del latte.
Prima di far disegnare qualcosa di nuovo per questo gioco vale la pena
guardare cosa c'è già dentro `dati/atlante.js` — sono cinquecento pezzi, e il
catalogo ne cita duecento.

Le altre cinque no, e sono un **foglio generato apposta**
(`sorgenti/fattoria/generati/merci.jpg`): il nido di uova, i gomitoli di lana, il sacco di
becchime, la pentola di zuppa, i tartufi sul panno, la ciotola di mangime.
Erano le due merci rimaste a emoji (l'uovo e la lana) più tre ripieghi che
dicevano la cosa storta — un fungo rosso al posto di un tartufo, un calderone
vuoto al posto della zuppa, la ciotola dell'acqua al posto del mangime.

**L'emoji resta il ripiego dichiarato** e oggi non la usa nessuno. Non si
toglie per questo: è quello che permette di aggiungere una merce *prima* del
suo disegno invece di aspettare un foglio per scrivere una riga di tabella.

Il foglio è su **fondo magenta**, ed è una richiesta fatta a chi l'ha
generato: una tinta che in nessuno degli oggetti compare si scontorna da
sola, e non serve nessun ritocco a mano al file sorgente. Ci è voluta una
riga in più nell'attrezzo (`"ombra": true`, vedi
[`strumenti/sprite/FORMATO.md`](../strumenti/sprite/FORMATO.md)) perché il
generatore, a cui era stato chiesto di non farlo, ha disegnato lo stesso una
macchia d'ombra sotto ogni oggetto: è il fondo *scurito*, quindi
l'allagamento normale ci si ferma davanti e resta un filo rosa lungo la base.
Ridotto di nove volte, quel filo è un pixel intero.

E il foglio delle ricette si è allargato con loro (da 360 a 400 px): una
ricetta adesso si legge come una freccia — quello che entra, quello che esce
— e a 360 andava a capo nel mezzo.

### Niente marcisce. Mai.

Un campo maturo resta maturo per sempre. Se il gioco sta chiuso una
settimana, al ritorno il grano è lì. È la stessa decisione del cane che ha
fame ma non muore: **questo posto è il premio per gli esercizi fatti altrove,
e un raccolto che scade lo trasformerebbe in un dovere.** Il dovere si smette.

Da lì viene tutto il resto:

- a **zero monete** non si raccoglie, ma il campo resta pronto e aspetta il
  primo esercizio fatto — non si perde niente;
- con lo **scomparto pieno** non si raccoglie e non si paga: il grano resta
  nel campo, e il foglio porta il tasto che risolve (vedi *Il prossimo
  passo*);
- quello che sta crescendo **non si mette via**, perché nel baule non c'è
  posto per un grano a metà.

### Il prossimo passo (dal 19 agosto 2026)

**Un «non si può» non compare mai da solo: porta con sé cosa fare adesso, e
possibilmente il tasto per farlo.** «Non hai abbastanza mangime» è un vicolo
cieco; «ti servono 3 🌾: hai un campo libero, seminaci del grano» è una
partita che continua.

Non è una regola di stile. Un bambino di sei anni davanti a un no non
ricostruisce una catena di produzione a ritroso — chiude il gioco. Ed è
doppiamente vero qui, perché la fattoria è il posto dove si *spende* quello
che si è guadagnato studiando altrove: se il premio si inceppa, si smette di
guadagnarlo.

La regola sta in `motore/consiglio.js`, gira senza schermo, e **risale la
catena da sola** finché non trova un passo che si può fare oggi:

```
   manca il becchime
     → serve il fienile: non ce l'hai     → «compra il fienile 🪙150»
     → ce l'hai ma ha roba da ritirare    → «ritira quello che ha fatto»
     → ce l'hai ma sta lavorando          → «pronto fra 4 min»
        …e se ci mette parecchio          → «fanne un altro 🪙150»
     → è libero, ma mancano 3 🌾          → *si rifà la stessa domanda al grano*
         → hai un campo libero            → «seminaci del grano»
         → i campi sono tutti occupati    → «fanne un altro 🪙22»
         → non hai campi                  → «ti serve un campo 🪙22»
         → non hai il silo                → «prima ti serve il silo 🪙120»
```

L'ordine delle risposte è l'ordine in cui sono utili: prima quello che si può
fare adesso e non costa niente, poi quello che c'è solo da aspettare, poi la
spesa. Lo stesso vale quando **non c'è posto**: usare quello che si ha viene
prima di pagare, perché chi ingrandisce il silo avendo il mulino fermo e lo
scomparto del grano colmo ha pagato per non aver capito.

Il tasto dice **dove porta** — «Portami lì», «Apri il baule», «Ingrandisci ·
🪙40» — e il baule aperto da un consiglio si apre **sulla voce giusta**, metà
e linguetta comprese, con la cornice accesa: mandare in un baule di duecento
cose aperto sulla prima linguetta rimetterebbe il compito che il consiglio
doveva togliere.

### Nessuna ricetta prima dei suoi ingredienti

Corollario, e nasce da un difetto vero: il **pastone** si vedeva nel mulino
dal livello 3, e il **mais** arrivava al livello 10. Sette livelli — 🪙2000
di esercizi, più di cinque ore — con una ricetta impossibile in mezzo a
quelle vere. Un tasto spento per cinque ore non è un obiettivo: è
indistinguibile da una cosa rotta, e chi lo prova smette di fidarsi anche di
quelli che funzionano.

Adesso una ricetta può dichiarare **quando compare** (`liv`), il ripiego è il
livello della sua macchina, e `guastiDegliSblocchi()` in `dati/livelli.js`
diventa rosso se una ricetta arriva prima di quello che le serve. Effetto
collaterale voluto: il mulino appena comprato ha **una ricetta sola**, che è
la stessa scelta del primo campo con una coltura sola.

### I due silos, e uno scomparto per merce (dal 19 agosto 2026)

**Ogni merce ha il suo scomparto.** Uno scomparto appena costruito tiene
**8 pezzi**, ogni ingrandimento ne aggiunge 2 **a tutti gli scomparti
insieme**, e costa 🪙40, poi 130, 185, 220, 250 — cioè `40 + 130·ln(1+n)`,
arrotondato a cinque.

Otto perché sono **quattro giri di ricetta**: una ne chiede due, quindi si
può accumulare quattro volte prima di dover trasformare qualcosa. Abbastanza
per non stare a contare, poco abbastanza perché chi semina sempre e non
trasforma mai si trovi lo scomparto colmo — che è il momento in cui il gioco
insegna il resto della catena. (Era «due campi ci stanno e tre no», vero
finché un campo rendeva da due a cinque: da quando ne rende **uno** quel
conto non vuol dire più niente.)

#### Perché non sono più posti in comune

I posti erano **dodici, condivisi da tutto il silo**, e come risposta al
difetto di prima erano esatti (vedi sotto). Ma dodici posti in comune
reggevano **sette merci**: due a testa. E il conto non è teorico — è quello
che è successo giocando: **32 di mais e 4 di carote** in un silo da 36, e
niente più raccoglibile.

Il punto è che un bambino non alterna le colture. Semina quella che gli
piace, è la cosa che fa, e va bene che la faccia: la conseguenza era che il
gioco si fermava senza che niente fosse andato storto. Con gli scomparti il
mais non può più mangiarsi il posto delle carote — è impossibile per
costruzione, non improbabile.

E la domanda per cui si apre un magazzino — *quanto ci sta ancora* — smette
di essere un conto e diventa una riga da guardare: una barretta per merce,
`🌽 7/8`. Le barrette **vuote si vedono lo stesso**, ed è metà del mestiere
di quella schermata: uno scomparto a zero non è un buco, è il posto dove
potrebbe andare qualcosa.

Il tetto per prodotto c'era già stato, ed era stato tolto per un buon
motivo: era 90, cioè un numero che non mordeva mai. La differenza è tutta
lì — quello era invisibile e grande, questo è visibile e piccolo.

**La curva è logaritmica, e la prima versione era esponenziale.** Raddoppiava
il passo (20, 30, 50, 90, 170, 330…), e per arrivare a 28 posti chiedeva
quarantamila monete: **centoundici ore** di esercizi. L'errore di
ragionamento è che una curva esponenziale presume che chi paga diventi più
ricco a ogni passo, e qui non succede — le monete si guadagnano sempre allo
stesso ritmo, quindi lo sforzo riparte da zero ogni volta. Adesso il salto
vero è il secondo (da 7 minuti a mezz'ora di esercizi), poi ogni
ingrandimento costa più o meno un'ora e non di più, e 28 posti costano 7 ore
in tutto. Il metro — una moneta sono dieci secondi di esercizio — sta in
[`CALIBRAZIONE.md`](../CALIBRAZIONE.md).

C'era un granaio solo, con trenta posti **per ogni prodotto** e un silo che
ne aggiungeva altri trenta a testa. Tre cose non funzionavano, e sono
esattamente le tre che sono cambiate:

- **il tetto era per prodotto, e invisibile.** «Di ogni cosa ce ne stanno 90»
  è una frase vera che nessuno sa trasformare in *quanto ci sta adesso*. La
  risposta di allora fu metterli in comune; quella di adesso è tenerli
  separati ma **disegnarli**, che è la cosa che mancava a tutte e due le
  versioni precedenti.
- **il tetto non mordeva.** Novanta grani non li fa nessuno, quindi comprare
  un secondo silo non cambiava niente che si potesse vedere. Un limite che
  non si tocca mai è una riga di spiegazione, non un limite.
- **il secondo silo era un doppione.** Adesso il silo è una struttura sola e
  si potenzia, come in Hay Day: niente da capire su cosa faccia la seconda
  copia, perché non se ne mette una seconda.

«Uno solo» vuol dire **uno solo in mappa**, non uno solo al mondo — e per
un po' ha voluto dire la seconda cosa. Il conto guardava mappa e baule
insieme, quindi un silo messo via risultava «ne hai già uno» (quell'uno era
lui, nel baule) e non tornava più sul prato: una cosa comprata, chiusa per
sempre, nell'unico gioco che promette che non si perde niente. A schermo
diceva pure «lì non ci sta», perché ogni rifiuto che non fosse di monete
usciva con quella frase, e si finiva a provare tutte le celle del prato una
per una. **Un rifiuto che nomina la ragione sbagliata manda a cercare la
soluzione dove non c'è**, ed è il pezzo che costa di più: il divieto era una
riga, il cartello che lo spiegava male era mezz'ora di un bambino.

E i silos sono **due, diversi, e servono tutti e due**:

```
   🌾 silo del raccolto 🪙120   le tredici colture
   🥛 silo della stalla 🪙120   becchime, foraggio, zuppa, beverone, pastura,
                                fiori · mangime, pastone, merenda
                                · uova, latte, tartufi, lana, miele, concime
```

**Il rosso è dei campi, il bianco è degli animali** — quello che mangiano e
quello che danno. Il criterio era *da dove viene la roba*, e il mangime
«veniva dalla terra»: vero, e completamente invisibile a chi gioca. Nessun
bambino sa che il mangime nasce dal grano; sa che si dà alle galline.

E non è solo ordine. Il mulino prende 3 🌾 dal silo del raccolto e mette 2 🥣
**nell'altro**: macinare libera tre posti invece di uno, cioè diventa il modo
di svuotare il silo che si tappa. Prima il prodotto rientrava dov'era il
grano e la valvola non esisteva.

Un silo pieno non blocca l'altro, e uno scomparto pieno non blocca gli altri:
sono la stessa idea applicata due volte.

**Senza il silo non c'è capienza affatto** — zero, non poca: quello che
raccogli non ha dove finire, quindi non si raccoglie, non si paga, e il campo
resta pronto ad aspettare. La scheda di un campo vuoto lo dice **prima di
seminare**, che è l'unico momento utile per dirlo: scoprirlo a raccolto
pronto vuol dire aver aspettato dieci minuti veri per niente.

Le scorte **si guardano toccando il silo**, non da una linguetta del baule.
Era una linguetta, ed era comodo: ma finiva in mezzo alle cose da *comprare*,
ed era l'unica che si guardava e basta. Peggio, faceva sembrare il raccolto
una schermata del gioco invece del contenuto di una cosa che hai costruito.
Dentro, **premere una roba dice chi la usa**: «🌾 Grano — 3 nel mulino (5 min)
→ 2 🥣 mangime · 3 nel pollaio (12 min) → 2 🥚 uova». È l'unica cosa utile che
una riga di scaffale possa dire, ed è il modo in cui la catena si scopre da
dentro invece che per tentativi. Al suo posto c'era una frase sotto lo
scaffale — «non si vende, serve alle macchine e alle ciotole» — vera per ogni
riga e quindi muta su ciascuna. Dal silo comunque **non esce niente con le
dita**: si guarda e si ingrandisce, e basta.

Una nota di taratura: nessuna coltura deve rendere più di quanto tenga un
silo appena costruito, se no chiede un ingrandimento prima di poter essere
raccolta la prima volta. Oggi il massimo è il mais con 5 contro 6 posti, e
`unita/coltivazioni` scrive una nota a ogni giro se qualcuno sfora.

### I livelli della fattoria (dal 18 agosto 2026)

**L'esperienza sono le monete spese qui dentro**, più gli ordini consegnati
al mercato e le bestie di casa rimesse a posto (vedi sotto: pagano
esperienza e mai monete). Non i raccolti, non
i minuti, non le partite: la fattoria è il money pit, quindi il livello premia
esattamente il gesto che tiene in piedi tutto il resto. Non si può fare in
fretta (le monete arrivano solo dagli esercizi, quindi il livello è tempo di
studio riletto) e non scende mai — nemmeno mettendo via quello che si è
comprato.

Serve a un problema concreto: il baule vendeva **duecento cose dal primo
minuto**, in undici linguette. Per un bambino che apre la fattoria la prima
volta non è ricchezza, è una lista da cui non si sa cosa scegliere, dove il
campo che fa partire tutta la catena sta in mezzo a novanta cespugli.

**Sessantanove livelli, e ognuno dà poco.** Due o tre decorazioni per
volta, mai di più — è la regola che rende lungo il gioco, ed è possibile
proprio perché il catalogo è grande. Le decorazioni stanno in una fila sola
ordinata **per prezzo**: il vaso da quattro monete arriva al secondo livello,
la casa sull'albero dopo mesi, e le linguette del baule si aprono da sé via
via che arriva la loro prima voce. Nessun elenco da scrivere a mano: una voce
nuova si infila dove la mette il suo prezzo.

Quello che **lavora** non segue quella fila — lì il momento è una decisione
di gioco:

```
   1   🪙0        il campo, il silo del raccolto, il grano
   2   🪙210      il primo amico (il bobtail)
   3   🪙430      il mulino, e il silo della stalla
   4   🪙670      il mercato, cioè gli ordini
   5   🪙930      il fienile, la conigliera, le carote e il foraggio
   8   🪙1790     il pollaio
  10   🪙2450     il mais, cioè il pastone
  12   🪙3170     l'ovile, e l'erba medica
  18   🪙5710     la stalla
  22   🪙7730     le anatre, le patate e i cavolfiori
  26   🪙10000    il porcile, e le zucche
  29   🪙11870    i pomodori, cioè la zuppa d'orto
  33   🪙14590    le capre, le melanzane e i peperoni
  38   🪙18350    le api, le cipolle e l'aglio
  41   🪙20800    gli alpaca
  42   🪙21650    il pappagallo
  44   🪙23390    le fragole, cioè la merenda
  47   🪙26130    gli asini, e il prato fiorito
  69   🪙50590    l'ultima cosa del catalogo (~140 ore di esercizi)
```

**Ogni coltura arriva con la bocca che la mangia**, e da quando c'è il
fienile arriva anche **la ricetta che la trasforma**. Il primo campo ha una
scelta sola — a quattro anni cinque bottoni sono un elenco da leggere, uno è
una cosa da fare — e le altre arrivano quando serve: le carote con la
conigliera e il foraggio che ne esce; il mais quando il mulino gira da un
pezzo; l'erba medica con l'ovile (prima il fieno, poi le pecore); le zucche
col porcile e la zuppa. Le otto dell'orto arrivano **a coppie**, ognuna col
suo recinto — e la regola adesso la controlla un test invece di tenerla a
mente (`unita/coltivazioni`, sezione 1b): con cinque colture si ricordava,
con tredici no.

Il fienile arriva **con la prima coltura che ci va dentro e con la prima
bocca che la mangia**, tutti e tre al livello 5. Stava al 4 — «prima la
mangiatoia, poi chi mangia», che come racconto è più bello — e per un livello
intero era una macchina da 🪙150 che, aperta, diceva «metti dentro quello che
hai raccolto» e sotto non aveva niente: la sua prima ricetta vuole le carote,
che arrivavano al 5. Adesso `guastiDegliSblocchi` rifiuta **una macchina che
arriva prima del suo primo lavoro**, che è il gemello del controllo sulle
ricette in anticipo — e si era rotto proprio dove l'altro non guardava. Una coltura che arriva prima di quello che la consuma è roba che
riempie il silo senza servire a niente, cioè il modo di far sembrare rotto un
gioco che funziona.

Le soglie sono **una formula e non una tabella** (`8·(n-1)² + 200·(n-1)`),
così i livelli non finiscono mai: chi ha giocato per mesi deve avere ancora un
gradino davanti. E il passo minimo — 🪙200 — è **più alto di tutta
l'attrezzatura di partenza**: campo e silo insieme costano 🪙142, e con un
passo piccolo bastavano loro a far scattare tre livelli di fila. Si comprava
il silo e si sbloccava mezzo baule senza aver ancora raccolto niente. Adesso
il livello 2 chiede l'attrezzatura, un secondo campo e qualche giro di semina
e raccolto: **il tempo di capire come gira**, che è la cosa che il primo
livello deve comprare. In tempo di esercizi: il livello 2 è mezz'ora, il 10 sei
ore, l'ultimo centoquaranta, spalmate su mesi
([`CALIBRAZIONE.md`](../CALIBRAZIONE.md)).

**Il baule ha tre metà, e stanno in alto.** 🌾 *La fattoria* è quello che fa
qualcosa — campi, macchine, silos, recinti — 🌸 *Decorazioni* è quello che sta
lì e basta, 🐕 *Animali* sono le bestie di casa. Sono i modi diversi di
spendere che questo posto ha: uno allarga la catena, gli altri fanno sembrare
casa. Senza la divisione, la carriola fiorita sta in mezzo al pollaio e chi
cerca il mulino passa in rassegna il vivaio.

I tre tasti sono **fuori dal baule**, tondi accanto al gettone del livello, e
aprono il baule già dalla parte giusta. C'era un 📦 solo e la scelta si faceva
dentro: due gesti per dire una cosa sola, e il primo non diceva niente — un
pacco chiuso non fa venire in mente né una panchina né un cane. Compaiono
solo le metà che hanno qualcosa dentro: al primo livello c'è solo 🌾, e un
tasto che si apre su uno scaffale vuoto è un tasto rotto.

**Quello che non è ancora arrivato non sta nel baule, sta nella pagina dei
livelli.** La differenza conta: una voce spenta dentro un negozio è un tasto
rotto — chi la vede prova a premerla e non succede niente — mentre la stessa
voce sotto «al livello 4 arriva» è una cosa da desiderare.

### I premi si vanno a prendere (dal 20 agosto 2026)

**Quello che arriva a un livello non arriva più da solo.** Il livello lo
*apre*; per averlo bisogna premerlo, nella pagina dei livelli, e da quel
momento sta nel baule. Prenderlo **non regala niente**: apre la voce, che poi
si compra con le monete come tutto il resto — la fattoria resta il posto dove
si spende.

Due difetti insieme, e il secondo è il vero. Il livello sale **spendendo**,
cioè sempre in mezzo a un acquisto: il foglio della festa si apriva quando il
dito era in viaggio dal baule al prato, e **spezzava il gesto** che il gioco
vuole. E quello che arrivava non lo prendeva nessuno — compariva. Un premio
che compare è una riga di elenco; uno che si preme è una cosa che ci si va a
prendere.

Adesso salire di livello non apre niente: passa una riga d'avviso, e il
gettone ⭐ si accende con **un pallino che dice quanti premi aspettano**. È
l'unica cosa che lo dice mentre si guarda il prato, e resta lì finché non
sono stati presi tutti.

La pagina mostra **due livelli e non tredici**: quello di adesso, a
quadratini — i presi col segno di spunta, quelli da prendere accesi e che
pulsano — e quello dopo, gli stessi quadratini in grigio col lucchetto, con
quanto manca da spendere. Sotto c'era la scaletta intera, tredici righe che
scorrevano «per far vedere che la strada continua»: erano righe di testo con
dentro nomi di cose mai viste, e in mezzo ci finiva anche l'unica riga su cui
si poteva fare qualcosa.

Chi arriva da una fattoria di ieri **non trova niente da prendere**: quello
che il suo livello aveva già aperto risulta preso. Il contrario sarebbe la
propria roba tolta e restituita a rate. E il consiglio in fondo ai fogli sa
distinguere i tre casi: «arriva al livello 10», «ti aspetta nei premi» (col
tasto che porta lì) e «🪙120» col tasto che apre il baule.

**Il silo non racconta più il futuro.** Gli scomparti erano tutte le merci
della sua famiglia, e al primo raccolto di grano si leggevano già latte,
uova, lana e tartufi: il magazzino diceva in anticipo tutta la scaletta del
gioco. Adesso ci sono solo le merci **ottenibili adesso** — una coltura già
presa, o una ricetta che si può davvero fare — più quelle di cui si ha
ancora della roba. Resta il senso di prima per lo scomparto vuoto di una
coltura già aperta: è il posto dove potrebbe andare qualcosa, ed è così che
si scopre che si può coltivare altro.

**Quello che produce rincara a ogni copia** (`cresce` nel catalogo): due
conigliere fanno il doppio della lana e il quinto campo vale quanto il primo,
quindi a prezzo fisso l'unica strategia sarebbe riempire il prato di recinti
uguali. Il rincaro è **lineare** — campo 🪙22, 35, 48, 62, 75 — e non
geometrico: era 1,45× a copia, cioè la stessa curva esponenziale bocciata
sugli ingrandimenti del silo. I silos invece sono `unico`: due dello stesso
tipo non conterrebbero niente di più, quindi il secondo non si vende affatto.

La regola sta nel motore e non nella schermata: `posa()`, `compra()`,
`seminaCampo()` e `compraBestia()` rifiutano quello che non è ancora arrivato
(`motivo: 'non-sbloccato'`) o il doppione di un silo (`'ne-hai-gia'`).

Per guardare col telefono una cosa del livello 40 senza spendere davvero
quindicimila monete c'è **`#fattoria=40`** nell'indirizzo, il fratello di
`#monete=`: alza e basta, non fa mai scendere. I premi dei livelli passati se
li prende da sé — sessanta quadratini da premere non sono quello che si sta
andando a guardare — e lascia da prendere quelli **del livello a cui porta**,
cioè la situazione esatta di chi ci è arrivato spendendo.

### Vestire le bestie (dal 6 settembre 2026)

Una bestia comprata si nutre, si spazzola e cammina, e da lì in poi è uguale
a quella di chiunque altro. Adesso dalla sua scheda c'è **🎩 Vestilo**:
cappellini, occhialini, fiocchi, sciarpe, una mantellina — e quello che le si
mette **si vede in fattoria**, mentre passa per il prato.

È la stessa cosa che il nome fa alle parole fatta al disegno, ed è la ragione
per cui si vedono in mappa e non dentro un foglio: *un vestito che si guarda
solo aprendo una scheda non lo mette nessuno.*

#### Quattro punti di attacco, e li dice l'animale

```
   testa    🌸 🧢 🎩 👑        muso     👓 🕶️
   collo    🎀 🧣 🔔           schiena  🧥 🎒
```

Dove cade un cappello **non si indovina, e non è uguale per tutti**: sta nel
foglietto dello sprite di *quella* bestia (`agganci` in
`strumenti/sprite/sorgenti/…/<bestia>.json`, in frazioni del riquadro e non
in pixel), e `atlante.py` lo copia in `AGGANCI` dell'atlante generato. Prima
c'era una tabella sola in `dati/animali.js` per tutte le specie, ed era il
difetto: un pappagallo e un bobtail hanno la testa in posti diversi, e la
stessa frazione metteva il cappello sulla fronte a uno e a metà collo
all'altro. Quella tabella resta come ripiego per una bestia non ancora
calibrata, e `guastiDegliAnimali` lo segnala.

**Si calibra guardando, non contando.** L'alfa dice dov'è il riquadro, non
dov'è la fronte: nel banco degli sprite (`npm run mondo` → «i ritagli» →
modo **agganci**) i quattro punti si trascinano sul fotogramma e l'anteprima
accanto veste la bestia con la stessa formula del gioco; «salva il
foglietto» li scrive, poi si rilancia `atlante.py`. Il provino di tutte le
bestie nei tre versi, con gli agganci segnati e gli addobbi posati, sta in
`poc/scatti/agganci-fattoria.png`.

Tre cose che ne discendono, e sono quelle che fanno sembrare un addobbo
*indossato* invece che appiccicato sopra:

- **Lo specchio è una trasformazione sola.** Le pose di lato guardano a
  destra, quindi lì la testa sta a destra; quando l'animale va a sinistra
  l'addobbo sta *dentro* la stessa trasformazione dello sprite e ci finisce da
  solo. Chi lo disegnasse fuori dovrebbe ribaltare a mano ogni punto.
- **Segue il passo.** Camminando la testa si abbassa su due fotogrammi su
  quattro — un pixel di fronte, due di spalle, niente di lato: è misurato sul
  foglio (`BOB`). Senza, il cappello resta fermo mentre il cane ondeggia
  sotto.
- **Quello che quel verso non conosce non si disegna.** Di spalle il muso non
  c'è, quindi gli occhialini spariscono girandosi: metterli sulla nuca sarebbe
  peggio che non metterli.

E **non tutti portano tutto**: il pappagallo non ha la schiena fra i suoi
agganci — ha le ali — quindi la mantellina non gliela si mette e nel suo
vestiario non compare affatto. La campanella invece è dei gatti, ed è una
scelta di gusto: sono due rifiuti diversi e stanno in due posti diversi — il
primo è un fatto del disegno (`porta` nella scheda dell'animale), il secondo
una riga del catalogo (`per`). Tenerli insieme avrebbe voluto dire un elenco
di eccezioni per specie da allineare a mano per sempre.

#### Sono emoji, ed è un primo passo dichiarato

Nel dungeon un mostro non è mai un'emoji, e il motivo vale ancora: le emoji le
disegna il telefono, quindi hanno lo stile di Apple in mezzo a uno schermo
dipinto a mano. Qui però la cosa da disegnare è *un cappello sopra un cane*,
non la creatura che fa paura — si ridimensiona con lo sprite, si specchia con
lui e segue il passo, quindi la differenza si vede molto meno. E il prezzo di
aspettare un foglio di sprite è che gli addobbi non esistono affatto.

Resta una cosa da rifare quando ci sarà il foglio: una riga può dichiarare
`pezzo` invece di `emoji`, esattamente come le merci, e da lì in poi la scena
disegna la tessera. Oggi nessuna lo fa.

**E per ora si vendono solo cappelli e occhiali.** Il ragionamento regge in
testa e sul muso — un punto solo da rispettare — e non regge al collo e sulla
schiena: un'emoji di fiocco, sciarpa, mantellina o zainetto è disegnata per
una persona vista di fronte, e posata su una bestia a quattro zampe non si
aggancia. Quelle voci portano `sospeso: true` in `dati/addobbi.js`: fuori dal
vestiario e dal negozio (`IN_VENDITA`), ma **non cancellate** — chi le ha già
comprate se le tiene, in guardaroba o addosso, continua a metterle e
toglierle, e il salvataggio si rilegge uguale, perché gli id restano. Gli
agganci `collo` e `schiena` nei foglietti e in `atlante.py` restano anche
loro: serviranno il giorno che quegli addobbi arriveranno come sprite
disegnati per una bestia. Con loro è andato via anche il maglione della
sartoria come addobbo (vedi l'albero, più sotto).

#### I prezzi, e il guardaroba

Da 🪙6 a 🪙24, cioè la fascia **«una cosetta»** di
[`CALIBRAZIONE.md`](../CALIBRAZIONE.md): da uno a quattro minuti di esercizi.
Non è una spesa che si pesa — è quello che si compra col resto delle monete,
dopo il campo e prima del prossimo recinto — e va tenuta lì: un cappello che
costasse quanto un pollaio metterebbe una decorazione in concorrenza con la
catena, e a quel punto o non lo compra nessuno o si smette di costruire.
`guastiDegliAddobbi()` rifiuta un prezzo fuori dalla fascia.

Un addobbo **si compra una volta e non si consuma**. Toglierlo lo rimette nel
guardaroba, e da lì torna addosso a chi si vuole quante volte si vuole: è la
regola del baule — niente si perde mai — applicata a quello che le bestie
indossano. Un aggancio tiene una cosa sola, e mettere un cilindro a chi ha già
un cappellino **cambia** il cappellino invece di dire di no: chi preme il
secondo cappello sta chiedendo di cambiarlo, non di indossarne due.

Comprarlo si fa **premendolo**, come nel baule dove toccare è già posare: un
tasto che dicesse «prima compralo, poi mettiglielo» sarebbero due gesti per
una cosa sola. Il prezzo sta sul tasto, e chi non ce l'ha vede di quanto
manca.

### Il mercato, e chi chiede (dal 6 settembre 2026)

**Quello che la fattoria produce lo mangiavano solo il cane e il gatto**, e
una ciotola non è un consumo: si riempie in un gesto e la pancia risale da
sola. Chi coltivava per un pomeriggio si ritrovava il silo colmo e nessuna
ragione per svuotarlo — la catena arrivava in fondo e finiva contro un muro.

Mancava **qualcuno che chiedesse**. Adesso c'è una bancarella, e al banco
arrivano tre ordini per volta:

```
   🥖 Il fornaio vuole      3 🌾 grano  ·  2 🥚 uova        ⭐ 58
   👵 La nonna vuole        2 🥛 latte                      ⭐ 46
   🧁 La pasticcera vuole   1 🍄 tartufo                    ⭐ 42
```

Un ordine è un obiettivo che si legge in due secondi e che dice da solo cosa
seminare, che è la cosa che nessun magazzino sa dire. Quello che serve non è
un numero da confrontare con un altro numero: sono **caselle**, una per pezzo
che serve, accesa se quel pezzo ce l'hai — lo stesso disegno delle ricette
delle macchine, e per la stessa ragione: leggere è la cosa che qui non si può
dare per scontato.

**È il mercato che c'era già.** Stesso id, stesso pezzo, stesso prezzo
(🪙40): era una decorazione fra le case e adesso lavora. È la quarta volta che
succede qui dentro, dopo l'orto, il carretto del vicino e il fienile, e per la
stessa ragione — chi se l'era comprato per bellezza se lo ritrova utile, e non
c'è niente da migrare in nessun salvataggio. Arriva al **livello 4**, cioè
appena dopo il mulino: prima di lì l'unica merce ottenibile è il grano, e un
mercato che chiede sempre la stessa cosa non è un mercato.

#### Non paga monete, e questo è il numero più importante

In un gioco di fattoria un ordine si paga in monete. Qui no, e non è una
dimenticanza: la regola che tiene in piedi tutta l'applicazione è che
**niente si vende, il verso è sempre monete → cose**
([`CALIBRAZIONE.md`](../CALIBRAZIONE.md)). Le monete si guadagnano facendo
esercizi negli altri giochi e si bruciano qui. Un banco che comprasse il grano
chiuderebbe l'anello — semina gratis, raccogli per 🪙1, vendi per 🪙5 — e da
quel momento la strada più corta per le monete non passerebbe più da nessuna
tabellina. È lo stesso motivo per cui sgomberare il bosco costa e non rende, e
per cui il carretto del vicino scambia roba con roba.

Quindi un ordine paga **esperienza**: fa salire il livello, che apre il
catalogo. Il numero porta la ⭐ del gettone in alto e non la 🪙, così si vede
dove va a finire prima di leggere la riga che lo spiega.

**È la seconda sorgente del livello**, e cambia una frase che era scritta qui:
l'esperienza non è più solo «le monete spese in fattoria». Le due si sommano e
nient'altro cambia — il livello resta *tempo*, che sia tempo di studio o tempo
passato a far girare la catena, e continua a non scendere mai.

#### Quanto rende, e il conto

```
   premio = 6 + 4 × (quello che la roba è costata a produrre, in monete)
```

Il costo lo **risale la catena da sola** (`valoreDi` in `dati/mercato.js`): un
uovo non sa di essere fatto di grano, lo sanno le ricette. I numeri che ne
escono sono esattamente quelli della tabella qui sopra — mangime 🪙3, uovo 🪙5,
pastone 🪙7, tartufo 🪙9 — ed è il modo di sapere che non se li è inventati
nessuno.

| l'ordine | rende | ci vuole (un campo solo) |
|:--|--:|--:|
| 3 🌾 grano | ⭐ 18 | 15 min |
| 2 🥣 mangime + 2 🌾 grano | ⭐ 38 | ~38 min |
| 3 🌾 grano + 2 🥚 uova | ⭐ 58 | ~1 h 27 |
| 3 🍄 tartufi | ⭐ 114 | ~3 h 36 |

Il metro è quello di sempre: 🪙1 sono dieci secondi di esercizio, 🪙6 un
minuto. **Un ordine non rende mai più di quanto costa il tempo di
produrlo** — il caso più generoso rende un quarto di quello che varrebbe il
suo tempo — e `guastiDelMercato()` diventa rosso se una tabella ritoccata
rompesse quel rapporto. È il freno che impedisce al mercato di diventare la
scorciatoia per salire di livello senza fare esercizi.

#### Rifiutare costa attesa, consegnare no

Un posto **consegnato** si riempie subito: la roba l'hai portata, il posto è
tuo. Un posto **rifiutato** resta vuoto per cinque minuti veri. Senza
quell'attesa il gesto giusto sarebbe premere ✕ finché non esce l'ordine più
facile, cioè un mercato che si gioca col pollice invece che coi campi. Cinque
minuti sono un campo di grano: chi rifiuta torna a coltivare, non aspetta
guardando. Il tasto lo dice prima («ne arriva un altro fra 5 minuti»), perché
una cosa che si scopre dopo averla premuta è una trappola.

#### Non si chiede quello che non si può fare

Un ordine pesca solo fra le merci **ottenibili adesso**: quelle che il livello
ha aperto e che questa fattoria sa davvero produrre — la stessa domanda con
cui il silo decide quali scomparti mostrare. Non c'è nessun elenco a mano:
quando una merce diventa ottenibile lo sa già `livelloDelProdotto`. Offrire
zucche a chi le vedrà fra ventimila monete sarebbe un tasto che non si può
premere, ed è la stessa promessa che il carretto del vicino evita allo stesso
modo. `test/unita/mercato` lo controlla **per ogni livello**, dal primo
all'ultimo.

Un ordine resta piccolo — al massimo tre merci e tre pezzi di ognuna — per la
stessa ragione per cui un campo rende **uno**: «tre grano» si conta sulle
dita, e a sei anni è la differenza fra un obiettivo e un compito. E tre pezzi
stanno anche nello scomparto più piccolo, che ne tiene otto: un ordine
impossibile da tenere in magazzino sarebbe un ordine che si può solo
rifiutare.

Sopra la bancarella galleggia un 📋 quando c'è qualcosa da consegnare adesso:
la stessa idea del 🧺 sopra un campo pronto, si vede da lontano e non chiede
di aprire niente. Quando non c'è niente da portare resta muta — un invito che
c'è sempre non è un invito.

#### E chi ordina è uno a cui quella roba serve (dal 15 settembre 2026)

Il cliente era **una faccia pescata a caso**, e con sette merci non si
notava. Con ventidue sì: il pizzaiolo che chiede la lana e la sarta che
chiede i pomodori sono la cosa che fa sembrare il banco una lotteria invece
di un mercato — e il mestiere è la parte del mercato che un bambino
racconta («è arrivato l'apicoltore»), quindi se il mestiere non vuol dire
niente non resta niente da raccontare.

Adesso si pesca **prima la roba e poi la faccia** fra quelli a cui quella
roba serve (`vuole` in `dati/mercato.js`, `clientiPer`). I mestieri sono
dodici, quattro dei quali nati con l'orto — il pizzaiolo 🍕, la
fruttivendola 🥕, l'apicoltore 🐝 e la sarta 🧵 — e **due non dichiarano
niente**: la nonna e il bottegaio comprano quello che c'è. Non è pigrizia,
è il ripiego che tiene: una merce che nessun mestiere cita di suo deve
poter uscire lo stesso, e `guastiDelMercato()` diventa rosso se un giorno
non restasse nessuno che prende di tutto.

### Una bestia rimessa a posto paga esperienza (dal 20 settembre 2026)

**Il cane, il gatto e il pappagallo costavano e non rendevano.** Un recinto
produce lana e uova, un campo produce grano, e le tre bestie di casa — quelle
coi tre bisogni, pancia, pelo e voglia di giocare — erano l'unica cosa della
fattoria che si accudisce e basta. Giusto che non producano niente: non sono
galline. Ma accudirle *è* il gioco, e un gioco che non dice mai «bravo» lo
si smette.

Adesso, quando dopo un gesto **tutti e tre i bisogni stanno nella fascia
«sta benissimo»** — la stessa soglia della frase sulla scheda, non una
nuova — la bestia paga esperienza: come un ordine del mercato, **mai
monete** ([`CALIBRAZIONE.md`](../CALIBRAZIONE.md)). La riga in cima lo dice
(«🐕 Bobtail sta benissimo! ⭐ +9 di esperienza») e sul prato sale un
«+9 ⭐» dalla testa della bestia, che svanisce in due secondi e mezzo.

```
   il premio  =  un decimo del prezzo della bestia
   🐕 cane  🪙90 → ⭐9     🐈 gatto  🪙75 → ⭐8     🦜 pappagallo  🪙120 → ⭐12
```

Tre cose decise, e il perché.

- **Per singola bestia, non «quando stanno bene tutte».** Chi ne ha una
  sola deve poter vincere qualcosa; chi ne ha sei non deve fare un giro di
  diciotto gesti prima di sentirsi dire qualcosa.
- **Sotto l'ordine più piccolo del mercato.** Tre grano rendono ⭐18 e
  chiedono un quarto d'ora di campo; rimettere a posto un cane sono tre
  gesti da 🪙1–14 e le ore che ci mette la pancia a scendere. Il numero è
  legato al prezzo così non è scritto due volte: chi ritocca il prezzo
  ritocca anche questo.
- **Una volta per ciclo.** Il premio non torna finché almeno un bisogno non
  è risceso sotto «sta bene» — la pancia ci mette tre ore. Senza questa
  riga tre spazzolate da una monetina sarebbero una zecca: non di monete,
  che qui non entrano mai, ma di livelli. Anche con tutte e sei le bestie
  in casa e due giri al giorno sono poco più di cento ⭐ al giorno, un
  ottavo del gradino di livello a cui si arriva con la sesta.

Il ciclo sta nel record della bestia (`premiato`) e si riarma leggendo,
dentro lo stesso conto che fa calare i bisogni (`scendi` in
`dati/bisogni.js`). Un salvataggio di ieri non ha il campo e si legge come
«non ancora premiata» — ma **la prima spazzolata a una bestia che stava già
bene non paga**: il premio è per averla rimessa a posto, e il motore guarda
com'era prima del gesto (`premiaSeStaBene`, `tuttoAPosto`). Quanto paga sta
nella scheda dell'animale (`premioBenessere` in `dati/animali.js`), e il
motore ci mette solo il braccio (`premiaIlBenessere`): sono le stesse
funzioni che, in `test/unita/fattoria`, provano che si premia una volta e
non due, che torna dopo il ciclo, che due bisogni su tre non bastano e che
il livello può scattare.

### L'orto, e le cinque bocche nuove (dal 15 settembre 2026)

**Fra il porcile e la fine del catalogo non arrivava più niente che
lavorasse.** Il porcile è al livello 26 e l'ultima cosa del baule al 64:
trentotto livelli — dieci ore di esercizi buone — in cui chi aveva imparato
tutta la catena riceveva solo decorazioni. Il gioco non si rompeva, smetteva
di insegnare.

Otto colture e cinque recinti nuovi, scaglionati dal 22 al 57, e **la cosa
che hanno di nuovo non sono i disegni**: sono le coppie.

```
   🥔 patate + 🥦 cavolfiori  ──▶ 🪣 beverone ──▶ 🦆 anatre ──▶ 🥚 uova
   🍅 pomodori                ──▶ 🥘 zuppa    ──▶ 🐖 maiali ──▶ 🍄 tartufi
   🍆 melanzane + 🫑 peperoni  ──▶ 🍃 pastura  ──▶ 🐐 capre  ──▶ 🥛 latte
   🧅 cipolle + 🧄 aglio       ──▶ 🌼 fiorume  ──▶ 🐝 api    ──▶ 🍯 miele
                 🥬 foraggio  ──────────────────▶ 🦙 alpaca ──▶ 🧶 lana
                 🌰 becchime  ──────────────────▶ 🫏 asini  ──▶ 💩 concime
   🍓 fragole + 🍯 miele       ──▶ 🥧 merenda  (al mulino, per la ciotola)
   💩 concime + 🌿 fieno       ──▶ 🌼 fiori    (e l'anello si chiude)
```

**Una ricetta dell'orto prende due colture**, ed è la differenza fra un
cereale e un orto: in una pentola non ci va mai una cosa sola. La ragione
vera però è di conto — con una coltura per ricetta le otto nuove avrebbero
voluto otto ricette e otto merci in più nel silo, cioè un elenco. In coppia
ognuna dice **cosa seminare accanto**, e «2 🍆 e 1 🫑» resta una cosa che si
conta sulle dita, che è tutto quello che la regola N → 1 esiste per
difendere.

**Tre delle cinque bocche danno una roba che c'era già** — uova, latte,
lana — e non costano meno di chi le faceva prima. È voluto: un'anatra che
facesse l'uovo a metà prezzo svaluterebbe il pollaio di chi ci è appena
arrivato, che è il modo di rendere inutile la prima metà del catalogo.
Guadagnano sulla leva che qui conta davvero, **quanti campi e quanti
passaggi**:

| | costa | ci vuole | campi | passaggi |
|:--|--:|--:|--:|--:|
| 🥚 pollaio (8) | 🪙5 | 36 min | 4 🌾 | 3 |
| 🥚 anatre (22) | 🪙5 | 33 min | 2 🥔 + 1 🥦 | 2 |
| 🥛 stalla (18) | 🪙5 | 36 min | 4 🥕/🌿 | 3 |
| 🥛 capre (33) | 🪙6 | 42 min | 2 🍆 + 1 🫑 | 2 |
| 🧶 ovile (12) | 🪙3 | 21 min | 2 🥕/🌿 | 2 |
| 🧶 alpaca (41) | 🪙3 | 18 min | 2 🥕/🌿 | 2 |

Le capre sono l'unica riga che **peggiora** una colonna: costano una monetina
in più e sei minuti in più, e in cambio chiedono tre campi invece di quattro
e due passaggi invece di tre. È la scelta fra tempo e spazio, e da quel
livello in poi è quasi sempre lo spazio a mancare.

#### Il concime, e l'unico anello che si chiude

Gli asini sono le uniche bestie del cortile che **non danno da mangiare a
nessuno**, e questo era il motivo per cui rischiavano di restare fuori: una
specie senza un mestiere onesto è meglio non metterla che inventarle una
ricetta finta. Il mestiere ce l'hanno, ed è quello vero — quello che
mangiano torna alla terra:

```
   🌰 becchime ──▶ 🫏 asini ──▶ 💩 concime ──▶ 🌼 prato fiorito ──▶ 🐝 api
```

È l'unico punto della fattoria in cui la catena non va avanti dritta ma si
richiude, e **non è la strada più economica per i fiori**: il fiorume di
cipolle e aglio costa 🪙2 e ventidue minuti, il prato fiorito 🪙6 e
quarantasette. Non deve esserlo — è la strada che **non chiede l'orto**. Chi
ha i campi pieni di pomodori fa il miele col grano e con gli asini.

E le api: **cipolle e aglio lasciati fiorire**. Non è una licenza — i fiori
dell'allium sono fra i migliori per le api, e lasciare andare a fiore invece
di raccogliere è una cosa che si fa per davvero. Nel gioco è il modo in cui
due colture che non finiscono in nessuna ciotola trovano una bocca: proprio
perché non le si raccoglie per mangiarle.

#### I disegni sono tre e non sei, e lo dice il foglio

Ogni recinto dichiara **sei stati** — calmo, fame, mangia, felice, dorme,
pronto — e le cinque specie nuove hanno tre ritratti. Gli altri tre
ripiegano sul calmo, e la regola sta in una riga di `dati/catalogo.js` invece
che in un elenco di eccezioni per specie: **chi il ritratto ce l'ha lo usa,
chi non ce l'ha mostra quello calmo.** Il giorno che quei disegni
arriveranno non c'è nessuna riga da cambiare, basta generare il foglio.

Le due posizioni che non si sono fatte disegnare sono quelle che non
servivano. *Felice* dura un terzo del lavoro e sta in mezzo fra «mangia» e
«dorme»: a schermo è un battito d'occhi. *Pronto* ha già il 🧺 che la scena
gli mette in testa, che è la cosa che si vede da lontano e che dice di
andare lì — e infatti è sempre stata quella a fare il lavoro, il ritratto
serviva solo a colorarla.

### Le feste: neve a Natale, zucche a Halloween (dal 21 settembre 2026)

Dal 20 ottobre al 2 novembre e dal 6 dicembre al 6 gennaio (le date
stanno in `FINESTRE`, `dati/stagioni.js`, e si leggono in **ora
locale**) la fattoria si addobba da sola: a Halloween 🎃 sparse sul
prato, 🕸️ e 🦇 agli angoli delle case; a Natale i fiocchi che cadono,
una crosta bianca sui tetti e sulle chiome, chiazze di neve sull'erba,
lucine gialle e rosse che lampeggiano sotto le grondaie, ⭐ e 🔔 sui
tetti e un 🎄 accanto a ogni edificio. **Niente si tinge e non c'è
nessuno sprite nuovo**: è un velo sopra il disegno di sempre, e le
emoji sono posate dove c'è posto da una funzione pura
(`addobbiStagionali`) che riceve le celle libere e le cose posate —
la scena riceve la lista e non sa che giorno è. Le celle cambiano col
giorno (il seme è la data), non si salvano e non si posano: una bestia
ci cammina attraverso.

Nel baule, solo in quei giorni, compare la linguetta **Feste** con due
o tre cose da comprare (`stagione:` nel catalogo, prezzi da cosetta):
le zucche intagliate, un teschio, l'albero con le lucine. **Quello che
si è comprato resta** — posato tutto l'anno, o nel baule finché lo si
rimette giù — perché niente sparisce mai dal salvataggio. Non sono
premi di livello e non entrano nella fila dei due-tre per livello: si
aprono con la finestra, non spendendo. Per guardarle fuori stagione
c'è `#stagione=natale` (o `halloween`) nell'indirizzo, accanto a
`#fattoria=`.

### L'albero a più fasi: le botteghe, la dispensa, e la pagina che lo srotola (dal 21 settembre 2026)

Il progetto intero sta in [`fattoria-albero.md`](fattoria-albero.md); qui
c'è quello che è arrivato. Tre cose non tornavano: il fienile aveva nove
ricette e il mulino una che non era una macinatura; la lana finiva in una
copertina e fra la lana e un vestito non c'era niente; sopra il 47 non
arrivava più niente che lavorasse. La risposta sono **le botteghe** —
macchine che prendono quello che esce da un'altra macchina e lo portano un
gradino più su — e una regola: un edificio è un mestiere che si riconosce
a colpo d'occhio, mai più di quattro ricette.

**La dispensa** (📦, 🪙120, `unico`, livello 14) è il terzo silo: il rosso è
dei campi, il bianco è degli animali, e quello che esce dalle botteghe non
esce da nessuno dei due. Le merci di ieri non si spostano di silo.

**Il fienile fa il secco, il pentolone fa il cotto.** Beverone, zuppa, zuppa
d'orto e pastura si fanno nel pentolone (🪙150, al 22, quando la prima
ricetta cotta compariva già). «Fragole al miele» passa al panificio, e il
mulino macina e basta — mangime, pastone e adesso la farina. È l'unica tappa
che toglie qualcosa a una fattoria di ieri, ed è gratis da migrare: una
lavorazione in corso è un id di ricetta dentro la cosa, quindi la zuppa
partita ieri nel fienile finisce e si ritira, e la prossima vuole il
pentolone — il consiglio lo dice per nome.

**Le catene nuove, fin dove sono arrivate:**

| catena | fasi | livelli |
|:--|:--|:--|
| il filo | 🌿 erba → 🥬 foraggio → 🧶 lana → 🧵 stoffa (telaio) → 🧥 maglione (sartoria) → 💜 maglione alla lavanda (tintoria) | 14, 36, 52 |
| il pane | 🌾 grano → 🌾 farina (mulino) → 🍞 pane (panificio) | 16 |
| il latte | 🌿 erba → 🥬 foraggio → 🥛 latte → 🧈 burro · 🧀 formaggio (caseificio) | 20 |
| la torta | farina ✚ 🥚 uova ✚ 🧈 burro → 🎂 torta (panificio) | 20 |
| la lavanda | 💐 lavanda → 🫙 tintura (tintoria) → 💜 maglione alla lavanda · 🧼 sapone (tintura ✚ burro) | 52 |

Il pane è una pappa (0,60 di pancia, 🪙7 contro 🪙10 comprata: il 70%, dentro
la fascia di `unita/coltivazioni`); il maglione è **una merce e basta**: la
vuole la sarta al mercato, e vale quello che dice `valoreDi`. Era nato come
addobbo sulla schiena pagato col granaio (`da: 'maglione'` al posto di
`prezzo`) ed è stato sospeso con gli altri addobbi della schiena — un'emoji
di maglione non sta su una bestia — senza toccare la catena: erba, foraggio,
lana, stoffa, maglione arriva alla sarta. Fornaio, maestra e l'oste nuovo
chiedono il pane; la sarta vuole lana, stoffa e maglione.

**Il caseificio (🪙200, al 20) sdoppia il latte**, che era l'unico prodotto
di recinto con un'uscita sola: il burro è un ingrediente (torta, crostata,
sapone) e il formaggio è insieme una pappa (0,85 di pancia, 🪙10 contro
🪙14,2: il 71%) e un ingrediente. Cagliare non costa un gesto apposta — con
🪙1 il formaggio starebbe al 78%, sul bordo della fascia. La **torta**
(farina ✚ uova ✚ burro) è la prima ricetta che mette insieme tre catene, e
non è una pappa: riempie la voglia di giocare, ed è il compleanno del cane.

**La tintoria (🪙300, al 52) chiude la catena più lunga del gioco.** La
lavanda è l'unica coltura che non finisce in nessuna bocca: ne esce la
tintura, e da lì il **maglione alla lavanda** (sei fasi dall'erba: è il
numero che `PROFONDITA` tiene d'occhio) e il **sapone**, che è il bagnetto.
Il maglione alla lavanda è una merce e non un addobbo — entra un maglione,
esce un maglione di un altro colore — e chi lo vuole è la sarta.

**La cucina (🪙210, al 24) è dove le colture si incontrano**, e non stava nel
progetto: è nata da un conto sui dati veri, che diceva che **dodici colture
su tredici avevano una bocca sola**. Le sue quattro ricette prendono tutte
roba di catene diverse — minestrone (patate, carote, cavolfiori: l'unica
pappa, 0,50 di pancia), polenta (mais e formaggio), conserva (melanzane,
peperoni, zucche), salsa (pomodori, cipolle, aglio) — e insieme alla
crostata del panificio e al sacchetto profumato della tintoria portano ogni
coltura ad avere **due sbocchi, di cui uno che la mescola con un'altra
catena**. La regola è scritta in `unita/coltivazioni`, che pretende anche
che qualcuno la chieda al banco, foss'anche solo a valle: l'erba non la
compra nessuno, ma diventa lana, e la lana la vuole la sarta.

**Le botteghe nascono prima del loro disegno**, ed è deliberato: prima si
decide l'albero, poi si generano gli sprite. Una voce dichiara in `aspetta`
il pezzo che il foglio porterà (`telaio`, `merce_stoffa`…) e usa intanto un
ripiego — una tettoia, il forno a cupola, il paiolo, il chiosco rosa; per le
merci l'emoji, o il `pane` dell'arredo. `guastiDelCatalogo` e
`guastiDelleColture` diventano rossi il giorno che il pezzo atteso c'è e la
riga non l'ha preso.

**La catena ha un tetto solo.** Quattro conti risalivano la catena — valore
e minuti al mercato, il livello di una merce, l'ottenibile del silo, il
consiglio — ognuno col suo fondo (5, 4, 4, 5), e nessuno diventava rosso
quando la catena si allungava: rispondevano `Infinity`, cioè una stoffa che
non si ordina mai. Adesso è `PROFONDITA` (8) in `dati/coltivazioni.js`,
`profonditaDi` misura la strada più corta di ogni merce, e un guasto scatta
a due passi dal tetto.

**«A cosa serve» vede quattro uscite** (`dati/usi.js`): ricette, ciotola,
coccole e ordini del mercato. Stava in `bisogni.js`, che ne vedeva tre e non
può importare la quarta senza chiudere un anello — e la stoffa risultava
«non serve a niente». La quinta, un addobbo pagato col granaio, c'è stata un
giorno e tornerà con gli sprite.

**La pagina dell'albero** (`dati/albero.js` puro, `viste/Albero.vue`) è il
consiglio srotolato: in cima la merce, in mezzo la macchina con quattro
stati (✓ ce l'hai · ⏳ lavora · 🛒 da comprare · 🎁 nei premi), sotto gli
ingredienti con «ne hai 1, manca 1», e giù fino a un campo. Solo quello che
è sbloccato; una strada sola per riga, la più economica e a parità la più
svelta; le righe ambra portano il tasto del consiglio. Si apre sempre con
una merce già scelta — 🌳 «Come si fa» nel silo, l'ingrediente che manca al
mercato e sotto una ricetta — e non c'è una vista «tutto l'albero».

**Le quantità si moltiplicano lungo la catena, e il granaio è uno solo.**
Un maglione vuole 2 stoffe, ogni stoffa 2 lane, ogni lana 1 foraggio,
ogni foraggio 2 erbe: la colonna dice `1 · 2 · 4 · 4 · 8`. Per un giro
ha detto `1 · 2 · 2 · 1 · 2` — la quantità della ricetta passata giù
senza moltiplicarla — cioè una lista della spesa sbagliata a ogni riga
sotto la prima, e sbagliata al ribasso. E i `ne hai` si spartiscono fra
i rami in ordine di lettura: due rami che volevano entrambi grano
dicevano tutti e due «✓ ne hai 3» mentre insieme ne chiedevano 6.

**Si vede che è un albero**: rotaie `┌ ├ │ └` a sinistra, fatte coi
bordi e non coi caratteri di riquadro, che fra una riga e l'altra si
spezzano. Prima era un rientro tappato a quattro livelli, e con sei
fasi due rami in parallelo si leggevano come una lista sola.

**Le altre strade si dicono**: sotto la macchina, «o nella conigliera».
Erano calcolate e mai scritte, e chi aveva solo la conigliera leggeva
una colonna che gli diceva di comprare un ovile.

**E la strada mostrata è quella che il tasto compra.** L'albero
sceglieva la più economica, il consiglio la prima in tabella: a livello
60 la colonna diceva «Recinto degli alpaca · 🪙330» con sotto un tasto
che apriva il baule sull'ovile. Adesso decidono con la stessa funzione
(`megliaDi` in `dati/mercato.js`): prima quella di cui hai già gli
ingredienti, poi la più economica, poi la più svelta.

**Il foglio si rifà da solo** ogni cinque secondi finché è aperto: è
l'unico pannello della fattoria fatto di orologi, e ne mostra fino a
cinque insieme — un `⏳ pronto fra 4 min` che non scende è un numero
che dice il falso proprio a chi è lì per sapere quanto manca.

**E adesso hanno tutti una faccia.** Le otto botteghe
(`generati/edifici_2.png`), la bancarella e il carretto del vicino
(`edifici_3.png`) e sei merci — stoffa, farina, burro, formaggio,
minestrone, polenta (`merci_2.png`). Chi ancora aspetta il suo disegno
lo dichiara in `aspetta` e usa un ripiego; la lista da spuntare è in §6
di [`fattoria-albero.md`](fattoria-albero.md#6-gli-sprite-da-generare).

### Non si può più spegnere

C'era **una variante** (`fattoria:coltivazione`) che toglieva i campi dalla
pagina dei genitori, lasciando la fattoria come posto da arredare. Non c'è
più: da quando la fattoria è la catena — campi, silos, macchine, recinti,
livelli — spegnerla non lasciava un posto più semplice, lasciava un prato con
dei mobili. Chi non vuole la fattoria spegne **il gioco**, come per tutti gli
altri (`settings.giochi`, [pagina dei genitori](genitori.md)).
## Come si tocca

Un solo gesto per tutto, ed è il motivo per cui non c'è niente da imparare:
**si tocca una cosa propria e si vede cosa ci si può fare.** Toccare un cane
apre la sua scheda, toccare un campo apre la sua. Tenere premuto e trascinare
sposta; tenere premuto sul prato apre il baule *dove* si vuole mettere
qualcosa.

**Trascinando contro il bordo, il mondo scorre da solo.** Lo schermo di un
telefono tiene meno della metà della fattoria, e prima il trascinamento
finiva dove finiva lo schermo: per portare una panchina di là bisognava
posarla, spostare la vista con un dito, riprenderla, e magari rifarlo
ancora. Adesso il dito che si ferma dentro una fascia lungo un bordo fa
scorrere il mondo verso quel lato — piano se la si sfiora, svelto se ci si
appoggia contro — e la panchina resta sotto il dito mentre il prato le passa
sotto. Si ferma da sé dove il mondo finisce: non c'è nessuna corsa a vuoto
contro un muro, e le due direzioni valgono per tutti e quattro i lati su cui
c'è ancora qualcosa da vedere. Il conto sta in `scena/spinta.js`, ed è puro
apposta: si prova senza browser (`test/unita/spinta-fattoria`).

**Il baule tenuto premuto si ricorda dove.** Tenere premuto in mezzo al
prato vuol dire «voglio metterci qualcosa *qui*»: la scelta del posto è già
stata fatta, e farsela chiedere di nuovo col tocco dopo è chiedere due volte
la stessa cosa. Quindi si sceglie la panchina e **si posa lì**. Se lì non ci
sta — il pezzo è più largo dello spazio libero — si torna al gesto di sempre
e resta appesa al dito, che è il modo di dire «scegline un altro» senza un
cartello. Aperto dal tasto in alto, invece, il baule non ha nessun posto da
ricordare: si posa col tocco dopo, come si è sempre fatto.

Sopra un campo pronto e sopra una macchina che ha finito galleggia un 🧺, e
sopra una bestia che ha bisogno di qualcosa un 💭: si vedono da lontano,
senza aprire niente. Un recinto non ha bisogno nemmeno di quello — cambia
faccia da sé. Sono inviti, non rimproveri: non succede niente se si ignorano.

### Girare e rovesciare (dal 19 agosto 2026)

Tenendo premuto su una cosa posata escono i suoi attrezzi, e da qui sono
tre: **↻ giralo**, **⇄ rovescialo**, **📦 mettilo via**. I primi due non
compaiono sempre, e quando non compaiono è perché quel pezzo lì non li
regge — meglio niente che un tasto che fa una cosa storta.

Sotto ci sono tre meccanismi diversi, e tenerli separati è tutto il
lavoro:

- **Certe cose il foglio le disegna in due versi.** La staccionata
  sdraiata e il palo in piedi sono due disegni; la casa vista davanti e
  la casa vista di dietro pure. Lì ↻ cambia disegno, e il pezzo nuovo si
  porta dietro il proprio ingombro: [2,1] sdraiato diventa [1,2] in
  piedi, e il cane non ci passa più attraverso.
- **Certe cose si coricano**, e allora ↻ le ruota davvero — una siepe,
  un masso, un cespuglio, una pozza. La pixel art regge i novanta gradi
  esatti senza sfrangiarsi, quindi non costa niente e non c'è nessuna
  copia in più nell'atlante: è un `ctx.rotate` al momento di disegnare.
  Una siepe per il ritto è il modo di chiudere un cortile con un foglio
  che la disegna solo sdraiata.

  Quasi tutte queste hanno **due versi e non quattro**, e la differenza
  è quella che si sbaglia: coricarsi e capovolgersi sono due libertà
  diverse. Su questi fogli niente è disegnato dallo zenit vero — un
  sasso ha l'erba ai piedi, un cespuglio l'ombra sotto — quindi il
  quarto di giro sposta quell'ombra di lato e l'occhio lo accetta,
  mentre il mezzo giro la porta sopra e la cosa sta **a gambe per
  aria**. Il ↻ quindi alterna sdraiato e per il ritto, e basta. I
  quattro versi pieni restano alle pochissime cose che non poggiano su
  niente: una pozza d'acqua, una ninfea, una coccinella.
- **Quasi tutto si può rovesciare**, ed è quello che risolve il fastidio
  vero: la porta del fienile dal lato sbagliato, la carriola che punta
  di là, due casette identiche affiancate che si vede che sono la
  stessa. Lo specchio non tocca l'ingombro — stessi pixel, stesso
  rettangolo, solo al contrario — quindi ⇄ non può mai dire di no per
  mancanza di posto.

**Quello che no, e perché.** Una casa girata di novanta gradi non gira:
cade. La facciata finisce di lato e la sua ombra punta in su mentre
quella di tutto il resto punta in giù. **I campi non girano**, ed è il
caso che sembra più assurdo di tutti finché non lo si guarda: l'aiuola
vuota girerebbe benissimo, ma i sette stadi di ogni coltura hanno il
bordo dell'aiuola dipinto dentro lo stesso ritaglio della pianta, e
girati il grano si corica. E i tredici cartelli dei campi non si
rovesciano affatto, perché ci sono delle parole dipinte sopra
(«Carote», «Erba medica») e allo specchio non dicono più niente.

**Chi lo decide non è il gioco.** Quali permutazioni regge un pezzo lo
dichiara il foglietto della sorgente da cui è stato ritagliato
(`strumenti/sprite/FORMATO.md`, campo `trasforma`) — perché chi il
disegno l'ha guardato è chi scrive quel file — e da lì `atlante.py` lo
porta dentro il modulo generato. Il catalogo della fattoria lo legge e
basta: duecento righe che ridicono a mano quello che sta già nel
foglietto sarebbero duecento righe da tenere d'accordo per sempre.

### Quello che si guarda prima di scegliere (dal 19 agosto 2026)

Cinque correzioni nate tutte dalla stessa mezz'ora giocata col telefono in
mano, e tutte dalla stessa domanda: **davanti a una scelta, quello che serve
per farla dev'essere a schermo.**

**Le ricette sono caselle, non formule.** Erano «3 → 2»: due numeri e una
freccia. Una formula si legge, e leggere è la cosa che qui non si può dare
per scontato. Adesso quello che serve è **una casella per pezzo**, accesa se
quel pezzo ce l'hai — quattro caselle di foraggio, due accese — e non c'è
niente da contare né da sottrarre: si vede il buco. Quella vuota non è
spenta, è tratteggiata con dentro la figura in ombra: «questo ti manca» e non
«questo non si può».

**«Ne hai N», ovunque si scelga.** Sotto ogni coltura del campo e sotto ogni
ricetta di una macchina. Non risponde a *posso?* — a quello rispondono il
tasto spento e il numero che manca — ma a **mi serve?**, che è la domanda
vera davanti a cinque semi o a quattro ricette. Senza, si semina sempre la
stessa cosa e si scopre il silo tappato dieci minuti dopo, davanti a un
raccolto che non entra: per questo uno scomparto colmo lo dice **prima** di
seminare, e in oro.

**Una macchina al lavoro dice cosa sta facendo.** Era una clessidra, uguale
per tutte, e andava bene finché la macchina era una con una ricetta sola. Il
fienile ne fa quattro: davanti a una clessidra bisogna aprire il foglio per
sapere cos'è partito, e aprirlo è esattamente quello che un fumetto esiste
per evitare. Adesso nel fumetto c'è la faccia della merce, con la clessidra
nell'angolo — che è quello che distingue «sto facendo questo» da «voglio
questo» di un recinto affamato.

**Il nome, dove c'è un disegno accanto.** «Ti serve ancora 4 🥬» sotto un
tasto che mostra una balla di fieno sono due cose diverse per chi guarda. Da
quando ogni merce ha la sua figura, l'emoji che le sta scritta accanto è un
ripiego, e in qualche caso non le somiglia affatto: dove le due si vedono
insieme — le schede delle macchine, il silo, i consigli — si scrive **il
nome**. L'emoji resta dove non c'è niente a contraddirla.

**Il carretto del vicino non dice più di no.** Le merci che si potevano dare
erano segnate con la classe del cibo che una bestia *rifiuta*, cioè in rosso:
un tasto che funziona benissimo si leggeva come «non hai i requisiti». Adesso
sono neutre, e quella con lo scomparto colmo è in oro — la stessa tinta con
cui il silo segna un pieno. E chi ci arriva da un consiglio («lo scomparto
del mais è pieno, danne cinque al vicino») lo trova **già aperto sul mais**:
il primo dei due passi l'aveva già fatto, e richiederglielo è il compito che
il consiglio doveva togliere.

### Il baule

Duecento cose da comprare, a griglia — colonne uguali, come una tastiera,
invece di pillole centrate che facevano tre righe di lunghezze diverse.

**Di cosa si sta parlando si sceglie prima di entrare**, e le risposte sono
tre: 🌾 *La fattoria* (quello che fa qualcosa), 🌸 *Decorazioni* (quello che
sta lì e basta), 🐕 *Animali* (le bestie di casa). Sono i tre tondi in alto a
destra, e in cima al baule restano come linguette per cambiare metà senza
uscire. Erano due, con gli animali dentro «la fattoria» come una linguetta
accanto ai recinti, e la seconda si chiamava «Il bello» — vero, ma non una
parola che un bambino userebbe cercando una panchina.

Sotto «la fattoria» **la linguetta è una sola**, e quando è una sola non si
mostra affatto: campo, mulino, silos, fienile e recinti sono i passi della
stessa catena, e messi in due scaffali («Campi» e «Cortile») quella fila non
si vedeva — mentre due tasti per scegliere fra dieci cose sono due tasti di
troppo. Il confine fra i due era una distinzione da adulti, la terra di qua e
gli animali di là; per chi gioca sono la stessa cosa, le unità che
*producono*. Ci erano finiti
in mezzo nove *finti campi* — aiuole a solchi, zolle, terra smossa — che si
posavano, si toccavano e non facevano niente: sono stati tolti, per la stessa
ragione per cui a suo tempo era stato tolto lo stagno disegnato. Le figure sono grandi, stanno
su un ripiano e sono **in scala fra loro**, così una casa si vede che è una
casa e un fiorellino che è un fiorellino: prima ogni pezzo era ingrandito per
conto suo, e i più grandi sbordavano dalla carta. Quello che non ti puoi
ancora permettere non è solo pallido: **dice di quanto** («manca 🪙12»), che
è il numero che rimanda a fare esercizi. Le cose che *lavorano* — campo,
mulino, silo, recinti — hanno un filo d'oro attorno, perché a scaffale non
c'era modo di distinguerle da un mobile.

### I fogli si chiudono tutti allo stesso modo (dal 22 settembre 2026)

Undici fogli, e undici modi di uscirne: «Chiudi», «Va bene», «Lascia
stare», «Indietro», e in un paio di casi soltanto il velo da toccare
fuori. Nessuno in alto a destra, che è il posto dove si guarda per
primo. E nessuno **sempre visibile**: il tasto stava in fondo alla
colonna, quindi in un foglio lungo — il baule, i livelli, l'albero a sei
fasi — per uscire bisognava prima scorrere fino in fondo.

Adesso ogni foglio ha **la stessa ✕ in alto a destra**
(`viste/Chiudi.vue`), appiccicata: il foglio scorre e lei resta dov'è.
Nei test si trova con `[data-chiudi]` o con `aria-label="chiudi"`, non
col carattere — la stessa regola della freccia «indietro» della barra.

I tasti in fondo restano **dove sono una scelta**: «Lascia stare /
Compra», «Chiudi / Ritira», «🎩 Vestilo / Va bene». Lì la seconda voce è
quella che conta e la prima è il suo contrario. Dove invece l'unica cosa
da fare era chiudere — il baule, i livelli, il mercato, l'albero — il
tasto in fondo non c'è più: lo fa la ✕, che è sempre sullo schermo.

**E lo scorrimento è uno solo.** Quattro fogli facevano scorrere sé
stessi, quattro facevano scorrere un elenco dentro a un'altezza
inventata — 52vh lo scaffale del baule, 46vh gli scomparti del silo,
44vh i semi e le ricette — e i restanti non scorrevano affatto: su uno
schermo basso uscivano dal velo, e i tasti in fondo diventavano
irraggiungibili. Cioè il foglio non si poteva chiudere.

Un'altezza in `vh` è una misura presa a occhio su un telefono solo: su
uno schermo alto lascia il foglio mezzo vuoto, su uno basso lo fa uscire
lo stesso, perché 44vh è l'elenco ma sopra e sotto c'è dell'altro che in
vh non si conta. Adesso **ogni foglio è una colonna**: titolo e tasti
stanno fermi, l'elenco in mezzo si stringe di quanto serve e scorre lui
(`flex: 0 1 auto; min-height: 0`), e nessuno dichiara più un'altezza.

### Lo scaffale si scorre col dito (dal 23 settembre 2026)

Lo scaffale del baule scorreva, ma **non col dito**. Una voce si prendeva
al primo contatto, quindi il dito che partiva da una carta per scorrere se
la portava via — e una strisciata la *comprava*, perché la cosa si posa
dove il dito si alza. Restavano gli spazi fra le carte, otto pixel, e
nemmeno quelli: il telefono sposta il tocco sulla carta più vicina. Finché
uno scaffale stava in uno schermo non se n'è accorto nessuno; col secondo
albero «la fattoria» ha trentasei voci, e da livello 40 in su i recinti
stavano sotto lo schermo, dove nessun dito arrivava. Se n'è accorto
`integrazione/campi`, che non trovava più la conigliera.

Adesso decide il movimento, come sul prato: **toccare** una carta la prende
(e resta appesa al dito come prima), **strisciare in su o in giù** scorre
e non prende niente, **strisciare di lato** la tira fuori e la posa dove il
dito si alza. Col mouse si scorre con la rotella, e trascinare in qualunque
verso tira fuori.

E un baule aperto da un consiglio («ti serve un ovile») **porta la voce
accesa dentro lo scaffale**: prima si apriva in cima, e la voce che doveva
risparmiare la ricerca stava sotto lo schermo.

## Cosa manca ancora

I primi tre punti di questa lista — gli sprite veri dei campi, gli animali da
reddito, la catena lunga — sono stati fatti il 18 agosto 2026, ed è per questo
che le due sezioni qui sopra esistono. Restano:

1. **Dire meglio che uno ha fame.** Il 💭 sopra il cane e il gatto c'è, ma è
   generico: un'icona per bisogno (🍖 se è la pancia, 🎾 se si annoia) si
   legge da lontano senza aprire la scheda. Vale anche per il 🧺 dei campi,
   che potrebbe dire *cosa* è pronto. I recinti l'hanno risolto — cambiano
   faccia, e sopra ci galleggia il fumetto con la merce che aspettano — e
   quella è la strada: il disegno del fumetto è già lì (`Tela.chiede`), ci
   vuole solo chi gli passi la faccia giusta.
2. **Gli animali dei recinti non camminano.** Un recinto è un disegno che
   cambia stato, non cinque bestie che girano per il prato: per farle
   camminare servirebbe un attore a quattro direzioni per specie, cioè un
   foglio ciascuno. Va bene così — quello che si guarda è il recinto, non la
   singola gallina — ma è la cosa che un bambino chiederà.
3. **L'acqua si vende come disegno, non come acqua.** Laghetto e stagno sono
   pezzi da giardino larghi due o tre celle, e vanno bene perché a nessuno
   viene in mente di accostarli. L'acqua vera si dipinge (`dipingi` nel
   motore, `dati/terreni.js`) e il pennello resta spento finché il pittore
   non sa raccordare due materie diverse.
4. **Altri modi di spendere.** Un campo che matura più in fretta, un
   annaffiatoio, una seconda macchina: il money pit vive sull'attrezzatura,
   ed è lì che vanno le monete grosse. (Ingrandire i silos c'è già, ed è la
   spesa che la produzione stessa fa desiderare, e gli addobbi delle bestie
   sono la spesa piccola — ma quella non brucia monete, ne brucia dieci.)
5. **Il pastone è l'ultimo ripiego.** Tutte le merci hanno la loro figura
   tranne quella: è il calderone grigio dell'arredamento, piccolo e
   anonimo in mezzo a nove scomparti. Un disegno suo — una pentola di
   pappa densa — è l'unico ritaglio che manca. Gli **addobbi** sono
   nella stessa condizione, ed è dichiarato: oggi sono emoji, e una riga
   può già dire `pezzo` invece di `emoji` quando il foglio ci sarà.
6. **Le azioni sui campi, rifinite.** Oggi sono la stessa scheda dei cani, e
   va bene così; se un giorno i campi diventano molti, raccoglierli uno per
   uno diventerà noioso prima di diventare comodo.

## I file

| dove | cosa |
|:--|:--|
| `dati/coltivazioni.js` | colture, ricette, tempi, silos — e il perché dei numeri |
| `dati/livelli.js` | le soglie del livello, e cosa arriva quando |
| `viste/Livelli.vue` | la pagina dei livelli, e la festa quando si sale |
| `dati/catalogo.js` | cosa si compra; `campo`, `macchina`, `silo` dicono chi lavora, `stati` chi si legge da lontano |
| `dati/bisogni.js` | i cibi: chi si compra a monete e chi si scala dal granaio — e quando una bestia rimessa a posto si premia |
| `motore/fattoria.js` | tutte le regole, senza schermo — gira anche in Node |
| `scena/tela.js` | il disegno, che non sa cosa sia il grano |
| `viste/Campo.vue` `viste/Macchina.vue` | le due schede che si toccano — la seconda vale per il mulino e per tutti i recinti |
| `viste/Granaio.vue` | cosa c'è in un silo, quanti posti restano, e il tasto per ingrandirlo |
| `viste/Roba.vue` `viste/Provino.vue` | il baule: lo scaffale, e la figura che ci sta dentro in scala |
| `viste/Merce.vue` | la faccia di una roba del granaio: il disegno se c'è, l'emoji se no |
| `motore/consiglio.js` | il prossimo passo, che risale la catena da solo |
| `dati/albero.js` `viste/Albero.vue` | il consiglio srotolato: tutta la strada di una merce, in colonna |
| `dati/usi.js` | a cosa serve una merce, tutte e cinque le uscite |
| `test/unita/albero.test.mjs` `test/integrazione/albero.test.mjs` | l'albero per ogni merce a ogni livello; e col dito, dal silo al baule |
| `dati/mercato.js` | chi ordina, quanto rende un ordine, e perché non paga monete |
| `motore/mercato.js` | le regole del banco: cosa si chiede, cosa succede consegnando |
| `viste/Mercato.vue` | i tre ordini, a caselle |
| `dati/addobbi.js` | cappellini e occhiali in vendita, fiocchi e mantelline sospesi: nome, prezzo, dove si attaccano |
| `dati/stagioni.js` | le finestre dell'anno, e dove cadono zucche e alberelli — puro, la scena riceve la lista |
| `dati/animali.js` | le bestie di casa: quanto costano, quanto pagano rimesse a posto (`premioBenessere`) e **dove sta la testa** dentro lo sprite (`AGGANCI`, `BOB`) |
| `viste/Vestiario.vue` | «Vestilo», uno slot per punto di attacco |
| `test/unita/addobbi.test.mjs` | si compra, si mette, si toglie — e cosa non gli sta |
| `test/unita/mercato.test.mjs` | si chiede solo il possibile, a ogni livello |
| `fattoria/generati/campi.json` `animali.json` `merci.json` | i tre fogli, e il perché di ogni ritaglio |
| `test/unita/coltivazioni.test.mjs` | si coltiva per davvero, spostando l'orologio |
| `test/unita/recinti.test.mjs` | i ritratti, la catena intera giocata, e cosa chiede chi ha fame |
| `test/integrazione/campi.test.mjs` | col dito: semina, chiude il gioco, torna e raccoglie |
