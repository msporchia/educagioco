# English a mondi — il libro che racconta

Le storie di quarta e quinta erano «estremamente limitate»: potevano usare
solo le parole delle tappe, niente *suddenly* né *said*, e le domande
chiedevano soltanto un fatto a scelta o vero/falso. Il proprietario ha
approvato quattro leve: le strutture per narrare (le tappe di frasi di
quinta, [strutture.md](strutture.md)), e qui le altre tre — **le parole
della storia**, **tre domande nuove**, **le storie a puntate**. Il formato
di base è in [libro.md](libro.md), com'è a schermo in
[libro-vista.md](libro-vista.md).

## Le parole della storia

Una storia può usare, oltre alle parole note alla sua tappa, **al massimo
otto parole della storia** (`PAROLE_DELLA_STORIA_MAX` in `motore/libro.js`),
contate in tutte le varianti:

- **le parole dei 📦 cassetti** del suo mondo e dei mondi prima
  (`paroleDeiCassetti`): *glasses*, *tree*, *parrot* stanno in
  `data/words.js` da sempre, e il cassetto le ripassa già; non serve
  dichiararle. Quelle di un mondo dopo no: una storia di quarta non ha il
  cassetto della quinta.
- **le `nuove`**, dichiarate nella storia: una parola che il bambino non ha
  ancora visto nelle tappe (*school* in quarta, che arriva in quinta) o che
  la storia ha portato nei dati (*suddenly*, *treasure*, *voice*, *wait*,
  *drive*, *hear*). Deve stare in `data/words.js` o `verbi.js` **con la
  categoria di un mondo**: così finisce da sola nel cassetto di quel mondo
  (o in una sua tappa) e lo SRS la ripassa lì. Le parole di struttura
  (categoria `q`: *why, here, that*) non hanno cassetto, e non possono
  essere nuove.

Perché otto: una parola nuova ogni due o tre frasi si capisce dal contesto
o si tocca; di più, il testo diventa un elenco di parole da chiedere. Le
forme flesse valgono come la loro base (*laughs*, *opened*, *children*),
con le stesse regole di [libro.md](libro.md#le-forme-dei-verbi). Il
passato irregolare di un verbo del cassetto sta in `dati/passati.js`, se no
*heard* sarebbe una parola sconosciuta e *heared* passerebbe.

**Toccarle è sempre gratis, e non segna niente nello SRS.** Il tocco di una
parola nota conta come «non saputa» (`Tocchi`, `motore/tocchi.js`), perché
chiederla vuol dire non ricordarla; una parola della storia il bambino non
l'ha mai studiata, e segnarla come sbagliata la metterebbe fra le deboli
prima che il cassetto l'abbia mai proposta. Per lo stesso motivo non
consuma i tre tocchi gratis della parola e non toglie monete alla storia.
A schermo è segnata con un filo d'oro sotto (al posto dei puntini delle
altre), e la nuvoletta dice «parola nuova della storia: è gratis».

Quando una tappa comincia a insegnare una parola della storia, la parola
diventa nota: fra le `nuove` è un guasto («già nota»), e si toglie. È
successo con *say*, *laugh*, *speak*, *old*: le tappe «Chi parla, chi ride»
e «Alto e veloce» della quinta li hanno portati nelle tappe, e le storie che
li usano prima di quelle tappe li hanno fra le nuove.

## Tre domande nuove

Oltre a `scelta` e `vf`, tre tipi scritti una volta in `TIPI_DOMANDA`
(`motore/libro.js`) e usabili da tutte le storie. Ognuno ha il suo `fai`,
che costruisce la domanda dal racconto tirato; `eGiusta(domanda, risposta)`
giudica tutti i tipi. Ogni storia di quarta e quinta ne ha almeno uno, le
storie scritte per queste leve almeno due.

- **`chi`, «Chi l'ha detto?»** (`{ tipo: 'chi', frase: '<id>' }`): la
  consegna è una battuta della storia fra virgolette, in inglese, e le
  risposte sono persone. La giusta è il `chi` della frase nel mondo tirato;
  le sbagliate sono gli altri che parlano nella storia, e se sono meno di
  due la gente di casa (`CHI_DI_CASA` in `dati/elenchi.js`: non «Una voce» o
  «Il pappagallo» in una storia dove non ci sono). Allena a seguire un
  dialogo, che le domande sui fatti non chiedevano.
- **`frase`, «Tocca la frase che lo dice»** (`{ tipo: 'frase', testo,
  frase: '<id>' | v => '<id>' }`): la consegna è una domanda in italiano, e
  si risponde toccando la frase del testo che la risponde. È l'unica
  domanda che non suggerisce la risposta fra quattro: bisogna trovarla, e
  capirla in inglese. La frase giusta può dipendere dalla variante (in «Che
  lavoro fanno?» è l'indizio del mestiere uscito).
- **`ordine`, «Metti in ordine»** (`{ tipo: 'ordine', fatti: [...] }`): tre
  o quattro fatti della storia in italiano, scritti nell'ordine giusto
  (stringhe o funzioni del mondo tirato), che il bambino mette in fila a
  tocchi. Le tessere non nascono mai in ordine. La fila è quella delle
  frasi componibili (`motore/fila.js`, usata così com'è: `formato: 'monta'`),
  e colora i fatti fuori posto come colora le tessere.

Si paga come le altre, subito se giusta. Dopo uno sbaglio «rileggi», e per
`frase` e `ordine` **si vede anche la soluzione**: la frase giusta si
accende nel testo (che torna alla sua pagina), l'ordine giusto si legge in
una lista. Lì non c'è una risposta giusta fra le opzioni da vedere
accendersi, e senza soluzione lo sbaglio non insegnerebbe niente
([../apprendimento/la-domanda.md](../apprendimento/la-domanda.md)).

## Le storie a puntate

Una serie è un gruppo di storie con `serie: '<id>'` e `puntata: 1, 2, 3…`,
nello stesso mondo. «La vecchia mappa», in quinta, ne ha tre: la mappa in
garage, il bosco, il tesoro.

- **Le variabili si tirano una volta per serie** (`tiraLaStoria` in
  `motore/storie.js`): lo stesso nonno, lo stesso mezzo, lo stesso posto del
  tesoro in tutte le puntate. Stanno nel profilo accanto a `lette`:
  `campagne.inglese.serie = { <id>: { valori: { <variabile>: <chiave> },
  fatte } }`. Di ogni valore si salva una chiave che si scrive in JSON
  (`chiaveDelValore`: l'`id`, l'`en` o il valore stesso), perché gli oggetti
  degli elenchi non si salvano; la puntata dopo tira fra i suoi mondi quelli
  che la rispettano (`tiraConFissi`). **Una variabile nuova** di una
  puntata dopo (il posto del tesoro, che la prima non nomina) si tira
  quando serve e si aggiunge. Quello che le puntate hanno in comune si
  scrive una volta, in `dati/capitoli/serie/<id>.js`.
- **La puntata n si apre quando la n−1 è letta**, oltre alla sua tappa;
  anche con «Sblocca tutti», perché una serie letta a salti non si capisce.
  Letta una puntata, `fatte` dice fin dove si è arrivati.
- **Il cartello di fine** offre «Puntata 2 →» (`puntataDopo`) prima di
  «Un'altra storia», che resta accanto e non offre mai un'altra puntata
  della stessa serie.
- **La prima pagina di una puntata dopo la prima comincia con «Nella
  puntata prima…»**: una frase con `riassunto: true`, in inglese semplice,
  scritta nella storia (*Last time Laura and Leo found an old map…*), che
  a schermo ha il suo blocco e il titolo in italiano. Chi riprende dopo una
  settimana ricorda. Può seguire una domanda sulla puntata prima («Nella
  puntata prima, dove hanno trovato la mappa?»).
- **Rileggere una serie da capo è un'altra avventura**: aprire la puntata 1
  ritira tutte le variabili e rimette `fatte` a zero. La scelta più
  semplice: rileggendo, il bambino ritrova la storia con un altro nonno o un
  altro posto, invece della stessa identica.
- Nel profilo le variabili della serie si trattano come `vinte`: lette in
  modo tollerante (una serie storta si rifà), salvate subito
  (`flushNow`) quando una puntata è letta, perché servono alla puntata dopo.

## Si controlla da sé

In `guastiDelCapitolo`, oltre ai controlli di [libro.md](libro.md#si-controlla-da-sé):

- le `nuove` sono un elenco; ognuna non è nota alla tappa, sta in
  `data/words.js` o `verbi.js` con la categoria di un mondo, e si usa; le
  parole della storia in tutte le varianti sono al massimo otto;
- due frasi non hanno lo stesso `id`; `chi` e `frase` rimandano a una frase
  che c'è, e che in ogni variante dove la domanda si fa **si accende** (e per
  `chi` è una battuta); la battuta di `chi` non la dice anche un altro, la
  frase di `frase` non è nel testo due volte; `frase` ha la sua domanda;
  `ordine` ha tre o quattro fatti, diversi;
- «Nella puntata prima…» sta solo in testa a una puntata dopo la prima, e
  lì c'è sempre, senza `se` né `chi`; una variabile di una serie non ha due
  valori con la stessa chiave.

`guastiDelleSerie(capitoli)`, su tutte le serie: almeno due puntate, che
vanno 1, 2, 3… nello stesso mondo e non si aprono prima della puntata
precedente; e ogni mondo tirato in una puntata si ritrova in quelle dopo
sulle variabili che hanno in comune (se la 2 non avesse il treno che la 1
può tirare, la serie cambierebbe mezzo a metà). Nei test:
`unita/inglese-libro`, «Le parole della storia», «Chi l'ha detto, la frase,
l'ordine», «Le storie a puntate».
