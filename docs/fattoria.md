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
raccoglie; il raccolto si trasforma — al mulino o dandolo agli animali — e
diventa da mangiare per il cane e per il gatto di casa.

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
   🌿 erba medica  ──🪙1,  8 min──▶  4 fieno   ─┐
   🌾 grano        ──🪙2, 10 min──▶  3 grano   ─┤
   🥕 carote       ──🪙3, 12 min──▶  3 carote  ─┼──▶  mulino ──▶ 🥣 🍲
   🌽 mais         ──🪙2, 18 min──▶  5 mais    ─┤
   🎃 zucche       ──🪙4, 25 min──▶  2 zucche  ─┴──▶  recinti ──▶ 🥚 🥛 🍄 🧶
```

| | prodotto | comprato | riempie |
|:--|--:|--:|--:|
| 🥣 Mangime | 🪙3 e ~8 min | 🪙5 subito | 30% di pancia |
| 🥚 Uovo | 🪙3 e ~11 min | 🪙7,5 subito | 45% di pancia |
| 🥛 Latte | 🪙3,5 e ~16 min | 🪙9 subito | 55% di pancia |
| 🍲 Pastone | 🪙7 e ~22 min | 🪙12 subito | 70% di pancia |
| 🍄 Tartufo | 🪙10 e ~55 min | 🪙15 subito | 90% di pancia |

**Coltivare conviene della metà, non dell'ottanta per cento.** È il numero su
cui sta in piedi tutto: se coltivare costasse un quinto, dopo tre giorni
nessuno comprerebbe più niente e la fattoria smetterebbe di bruciare monete.
Chi vuole dar da mangiare *adesso* compra, come sempre; chi ha aspettato
risparmia. Un test lo controlla a ogni giro (`unita/coltivazioni`) e diventa
rosso se qualcuno ritocca un prezzo di troppo.

Il freno vero non è il prezzo: è **il tempo e quanti campi hai**. E
l'attrezzatura si paga prima, in monete grosse — campo 🪙22, mulino 🪙150,
silos 🪙120 l'uno, e i recinti dai 🪙95 ai 🪙260 — cioè la catena *dà un motivo
per spendere*, non è il modo di smettere.

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
disegnata in sei stati e in mappa si vede quello di adesso: ha fame (col
fumetto di quello che vuole), mangia, è contenta, dorme, è pronta. Non è
un'icona che galleggia sopra: è la faccia dell'animale, ed è la ragione per
cui un bambino attraversa la fattoria e sa già dove deve andare.

```
   🐰 conigliera 🪙95   2 🥕 ──18 min──▶ 1 🧶 lana
   🐔 pollaio    🪙130  3 🌾 ──12 min──▶ 2 🥚 uova
   🐑 ovile      🪙190  2 🌿 ──25 min──▶ 1 🧶 lana
   🐄 stalla     🪙220  6 🌿 ──20 min──▶ 2 🥛 latte
   🐖 porcile    🪙260  2 🎃 ──30 min──▶ 1 🍄 tartufi
```

La **lana** è l'unica cosa della catena che non si mangia: paga una coccola,
la copertina, che è la prima coccola che si paga col granaio invece che con
le monete. Serve a che oltre alla ciotola ci sia qualcos'altro da desiderare
— e a dare un mestiere alle pecore.

### Niente marcisce. Mai.

Un campo maturo resta maturo per sempre. Se il gioco sta chiuso una
settimana, al ritorno il grano è lì. È la stessa decisione del cane che ha
fame ma non muore: **questo posto è il premio per gli esercizi fatti altrove,
e un raccolto che scade lo trasformerebbe in un dovere.** Il dovere si smette.

Da lì viene tutto il resto:

- a **zero monete** non si raccoglie, ma il campo resta pronto e aspetta il
  primo esercizio fatto — non si perde niente;
- col **silo pieno** non si raccoglie e non si paga: il grano resta nel
  campo, e il gioco chiede di ingrandire il silo senza scriverlo;
- quello che sta crescendo **non si mette via**, perché nel baule non c'è
  posto per un grano a metà.

### I due silos (dal 18 agosto 2026)

**Il magazzino è piccolo, condiviso, e si ingrandisce pagando.** Un silo
appena costruito tiene **6 cose in tutto** (sei e non quattro: il mais rende
5, e con quattro posti il primo ingrandimento non era un miglioramento ma lo
sblocco di una cosa che sembrava rotta); ogni ingrandimento ne aggiunge 2, e
costa 🪙40, poi 130, 185, 220, 250 — cioè `40 + 130·ln(1+n)`, arrotondato a
cinque.

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

- **il tetto era per prodotto.** «Di ogni cosa ce ne stanno 90» è una frase
  vera che nessuno sa trasformare in *quanto ci sta adesso*. Ora il tetto è
  del silo: un numero solo, che si guarda mentre si raccoglie.
- **il tetto non mordeva.** Novanta grani non li fa nessuno, quindi comprare
  un secondo silo non cambiava niente che si potesse vedere. Un limite che
  non si tocca mai è una riga di spiegazione, non un limite.
- **il secondo silo era un doppione.** Adesso il silo è una struttura sola e
  si potenzia, come in Hay Day: niente da capire su cosa faccia la seconda
  copia, perché non se ne mette una seconda.

E i silos sono **due, diversi, e servono tutti e due**:

```
   🌾 silo del raccolto 🪙120   grano, mais, carote, zucche, fieno, mangime, pastone
   🥛 silo della stalla 🪙120   uova, latte, tartufi, lana
```

Non è simmetria per bellezza: è quello che rende il pollaio una spesa che ne
trascina un'altra, ed è anche il modo in cui un silo pieno non blocca
l'altro — se il raccolto è colmo, le uova entrano lo stesso. (Era la
preoccupazione che teneva il tetto per prodotto: qui è risolta dividendo,
non alzando il numero.)

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
   3   🪙430      il mulino
   4   🪙670      il silo della stalla
   5   🪙930      la conigliera, e le carote che mangia
   8   🪙1790     il pollaio
  10   🪙2450     il mais, cioè il pastone
  12   🪙3170     l'ovile, e l'erba medica
  18   🪙5710     la stalla
  26   🪙10000    il porcile, e le zucche
  42   🪙21650    il pappagallo
  65   🪙45570    l'ultima cosa del catalogo (~127 ore di esercizi)
```

**Ogni coltura arriva con la bocca che la mangia.** Il primo campo ha una
scelta sola — a quattro anni cinque bottoni sono un elenco da leggere, uno è
una cosa da fare — e le altre arrivano quando serve: le carote con la
conigliera, che mangia solo quelle; il mais quando il mulino gira da un pezzo;
l'erba medica con l'ovile (prima il fieno, poi le pecore); le zucche col
porcile. Una coltura che arriva prima di quello che la consuma è roba che
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

**Il baule ha due metà.** 🌾 *La fattoria* è quello che fa qualcosa — campi,
macchine, silos, recinti, bestie — e 🌸 *Il bello* è quello che sta lì e
basta. Sono i due modi diversi di spendere che questo posto ha: uno allarga la
catena, l'altro fa sembrare casa. Senza la divisione, la carriola fiorita sta
in mezzo al pollaio e chi cerca il mulino passa in rassegna il vivaio. La
seconda metà non compare finché non arriva la prima decorazione: una linguetta
che si apre su niente è un tasto rotto.

**Quello che non è ancora arrivato non sta nel baule, sta nella pagina dei
livelli.** La differenza conta: una voce spenta dentro un negozio è un tasto
rotto — chi la vede prova a premerla e non succede niente — mentre la stessa
voce sotto «al livello 4 arriva» è una cosa da desiderare. La pagina si apre
dal gettone ⭐ in alto, accanto al baule, e mostra a che punto sei, cosa arriva
al prossimo e i dodici livelli successivi. Quando si sale, lo stesso foglio si
apre da sé: un livello che arriva in silenzio non lo nota nessuno.

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
`#monete=`: alza e basta, non fa mai scendere.

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

Sopra un campo pronto e sopra una macchina che ha finito galleggia un 🧺, e
sopra una bestia che ha bisogno di qualcosa un 💭: si vedono da lontano,
senza aprire niente. Un recinto non ha bisogno nemmeno di quello — cambia
faccia da sé. Sono inviti, non rimproveri: non succede niente se si ignorano.

### Il baule

Duecento cose da comprare, in undici linguette a griglia — colonne uguali,
come una tastiera, invece di pillole centrate che facevano tre righe di
lunghezze diverse. **Quello che lavora sta separato da quello che arreda**:
in «Campi» ci sono quattro cose e sono le quattro che fanno qualcosa (campo,
mulino, due silos), in «Cortile» i cinque recinti, e basta. Ci erano finiti
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

1. **Dire meglio che uno ha fame.** Il 💭 sopra la bestia c'è, ma è generico:
   un'icona per bisogno (🍖 se è la pancia, 🎾 se si annoia) si legge da
   lontano senza aprire la scheda. Vale anche per il 🧺 dei campi, che
   potrebbe dire *cosa* è pronto. I recinti l'hanno già risolto a modo loro —
   cambiano faccia — e quella è la strada.
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
5. **Sbloccare le cose a scaletta.** Oggi il baule vende tutto dal primo
   minuto. Legare una coltura o un recinto a qualcosa che si è già fatto —
   «le galline vogliono il pollaio», «il mais vuole il mulino» — darebbe un
   ordine a quello che oggi è un catalogo piatto, e insegnerebbe la catena
   invece di lasciarla scoprire.
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
| `sorgenti/gfx/campi.json` `animali.json` | i due fogli, e il perché di ogni ritaglio |
| `test/unita/coltivazioni.test.mjs` | si coltiva per davvero, spostando l'orologio |
| `test/unita/recinti.test.mjs` | i sei ritratti, e che si vedano tutti |
| `test/integrazione/campi.test.mjs` | col dito: semina, chiude il gioco, torna e raccoglie |
