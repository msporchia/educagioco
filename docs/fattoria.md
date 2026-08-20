# 🚜 La fattoria

**Dove finiscono le monete guadagnate negli altri giochi.** Non ci sono
domande, e non ce ne saranno: è il posto dove si spende, e per questo è il
motivo per cui si torna a fare esercizi.

Ha preso il posto della [cameretta](cameretta.md) il 16 agosto 2026, per una
ragione sola: **il money pit dev'essere uno**. Un bambino che può spendere le
monete in due posti non sceglie, si dimentica dell'altro — e fra i due questo
è quello che si può far crescere.

## Cosa si fa

Si compra terra (rincara a ogni pezzo), si sgombera il bosco, si posa quello
che si vuole dove si vuole, si comprano animali e si accudiscono. **Spostare
costa una monetina**, così questo non diventa un tavolino dove si passa il
pomeriggio a spostare la stessa panchina — ma rimettere una cosa esattamente
dov'era è gratis, perché cambiare idea a metà gesto non è un errore da punire.

Niente si perde mai: quello che si mette via va in un baule e da lì si
ripiazza gratis quante volte si vuole.

## I campi (dal 17 agosto 2026)

Posizionare era tutto, e i bambini lo dicevano: *«non posso fare nulla oltre a
posizionare»*. Adesso un campo si semina, cresce col tempo vero e si
raccoglie; il raccolto si trasforma — al mulino in pappa per il cane e il
gatto di casa, al fienile in mangime per le bestie del cortile.

Cinque colture, e ognuna ha **sette stati che si vedono**: i semi per terra,
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
   🥕 carote       ── 6 min ──▶  1 carota  ─┼──▶  mulino  ──▶ 🥣 🍲
   🌽 mais         ── 8 min ──▶  1 mais    ─┤
   🎃 zucche       ──10 min ──▶  1 zucca   ─┴──▶  fienile ──▶ 🌰 🥬 🥘
                                                    │
                                                 recinti ──▶ 🥚 🥛 🍄 🧶
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
| 🥚 Uovo | 🪙5 e ~36 min | 🪙7,5 subito | 45% di pancia |
| 🥛 Latte | 🪙5 e ~36 min | 🪙9 subito | 55% di pancia |
| 🍲 Pastone | 🪙7 e ~30 min | 🪙12 subito | 70% di pancia |
| 🍄 Tartufo | 🪙9 e ~72 min | 🪙15 subito | 90% di pancia |

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
fienile 🪙150, silos 🪙120 l'uno, e i recinti dai 🪙95 ai 🪙260 — cioè la catena
*dà un motivo per spendere*, non è il modo di smettere.

**E il campo rincara a ogni copia** (🪙22, 32, 46, 67, 97…), come il pezzo di
terra: è la cosa che moltiplica tutto il resto — più campi vuol dire più
raccolto per volta — e a prezzo fisso l'unica strategia sarebbe comprare
campi finché c'è terra. Il rincaro conta quelli in mappa **e** quelli nel
baule, se no metterli via e ricomprarli sarebbe il modo di non pagarlo.

### I recinti (dal 18 agosto 2026)

Conigliera, pollaio, ovile, stalla, porcile: cinque, e **non sono una
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
foglietto (`sorgenti/gfx/animali.json`), cioè dal file unico: 47 KB in meno.

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
(`sorgenti/oggetti.jpg`): il nido di uova, i gomitoli di lana, il sacco di
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

E i silos sono **due, diversi, e servono tutti e due**:

```
   🌾 silo del raccolto 🪙120   grano, mais, carote, zucche, fieno
   🥛 silo della stalla 🪙120   becchime, foraggio, zuppa · mangime, pastone
                                · uova, latte, tartufi, lana
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

**L'esperienza sono le monete spese qui dentro.** Non i raccolti, non i
minuti, non le partite: la fattoria è il money pit, quindi il livello premia
esattamente il gesto che tiene in piedi tutto il resto. Non si può fare in
fretta (le monete arrivano solo dagli esercizi, quindi il livello è tempo di
studio riletto) e non scende mai — nemmeno mettendo via quello che si è
comprato.

Serve a un problema concreto: il baule vendeva **duecento cose dal primo
minuto**, in undici linguette. Per un bambino che apre la fattoria la prima
volta non è ricchezza, è una lista da cui non si sa cosa scegliere, dove il
campo che fa partire tutta la catena sta in mezzo a novanta cespugli.

**Sessantacinque livelli, e ognuno dà poco.** Due o tre decorazioni per
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
   5   🪙930      il fienile, la conigliera, le carote e il foraggio
   8   🪙1790     il pollaio
  10   🪙2450     il mais, cioè il pastone
  12   🪙3170     l'ovile, e l'erba medica
  18   🪙5710     la stalla
  26   🪙10000    il porcile, e le zucche
  42   🪙21650    il pappagallo
  65   🪙45570    l'ultima cosa del catalogo (~127 ore di esercizi)
```

**Ogni coltura arriva con la bocca che la mangia**, e da quando c'è il
fienile arriva anche **la ricetta che la trasforma**. Il primo campo ha una
scelta sola — a quattro anni cinque bottoni sono un elenco da leggere, uno è
una cosa da fare — e le altre arrivano quando serve: le carote con la
conigliera e il foraggio che ne esce; il mais quando il mulino gira da un
pezzo; l'erba medica con l'ovile (prima il fieno, poi le pecore); le zucche
col porcile e la zuppa.

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
ore, l'ultimo centoventisette, spalmate su mesi
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
girati il grano si corica. E i cinque cartelli dei campi non si
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
   spesa che la produzione stessa fa desiderare.)
5. **Il pastone è l'ultimo ripiego.** Tutte le merci hanno la loro figura
   tranne quella: è il calderone grigio dell'arredamento, piccolo e
   anonimo in mezzo a nove scomparti. Un disegno suo — una pentola di
   pappa densa — è l'unico ritaglio che manca.
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
| `dati/bisogni.js` | i cibi: chi si compra a monete e chi si scala dal granaio |
| `motore/fattoria.js` | tutte le regole, senza schermo — gira anche in Node |
| `scena/tela.js` | il disegno, che non sa cosa sia il grano |
| `viste/Campo.vue` `viste/Macchina.vue` | le due schede che si toccano — la seconda vale per il mulino e per tutti i recinti |
| `viste/Granaio.vue` | cosa c'è in un silo, quanti posti restano, e il tasto per ingrandirlo |
| `viste/Roba.vue` `viste/Provino.vue` | il baule: lo scaffale, e la figura che ci sta dentro in scala |
| `viste/Merce.vue` | la faccia di una roba del granaio: il disegno se c'è, l'emoji se no |
| `motore/consiglio.js` | il prossimo passo, che risale la catena da solo |
| `sorgenti/gfx/campi.json` `animali.json` `sorgenti/oggetti.json` | i tre fogli, e il perché di ogni ritaglio |
| `test/unita/coltivazioni.test.mjs` | si coltiva per davvero, spostando l'orologio |
| `test/unita/recinti.test.mjs` | i ritratti, la catena intera giocata, e cosa chiede chi ha fame |
| `test/integrazione/campi.test.mjs` | col dito: semina, chiude il gioco, torna e raccoglie |
