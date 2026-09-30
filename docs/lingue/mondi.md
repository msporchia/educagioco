# English a mondi — il progetto

Stato: **un mondo per anno di scuola** (30 settembre 2026): prima, seconda e
terza si giocano per intero, quarta e quinta hanno le tappe di parole e le
strutture dichiarate. La carta English apre la mappa del tesoro; com'è fatta
la vista sta in [mondi-vista.md](mondi-vista.md), cosa manca in
[da-fare.md](da-fare.md).

Sostituisce la campagna in fila di `data/campagna-inglese.js`, dove ogni
tappa portava 42–73 parole nuove e le frasi arrivavano solo all'undicesima:
un blocco mnemonico. Lo spagnolo segue dopo, con lo stesso motore.

## Un mondo per anno di scuola

L'inglese non si monta tutto su sé stesso, quindi la campagna è un **grafo di
mondi** (come Duolingo). Il proprietario, dopo averlo provato: «le frasi
dovrebbero essere un capitolo: prima parole semplici, poi frasi usando
ovviamente le parole conosciute; ma va considerato il normale percorso
scolastico, questo ci aiuta anche a piazzare il gioco per età». Quindi
**l'ordine di fondo è quello della primaria italiana** (inglese dalla prima):
un mondo per anno, coi contenuti che i libri di testo fanno davvero in
quell'anno. Il grafo resta un grafo — un mondo può dipendere da due, e
«basta uno» c'è ancora (`dopoUno`) — ma oggi la fila è dritta.

| mondo | le tappe in ordine (in corsivo quelle di frasi) | si apre dopo |
|---|---|---|
| **In prima** | i colori · *hello, my name is, how are you?* · gli animali · i giocattoli · *it is a …, is it …?* · *a red ball* · a scuola · *this is …* · i numeri fino a dieci · *they are two dogs* | — |
| **In seconda** | il cibo · a pranzo · *I like / I don't like* · la famiglia · i vestiti · come sono (big, happy, hungry…) · *this is my, he is, I am* · i numeri fino a venti · *I have got* · il corpo · *she has got* | In prima |
| **In terza** | la casa · i mobili · *where is? in, on, under, behind* · i numeri fino a cento · *there is / there are* · i giorni · le stagioni e i mesi · gli altri mesi · che tempo fa · *today is Monday, in May* · che cosa sai fare (verbi) · *I can / I can't* | In seconda |
| **In quarta** | la giornata · ogni giorno (verbi) · i mestieri · i mezzi; *da scrivere*: il presente, la *s*, *does / doesn't*, *-ing*, l'ora | In terza |
| **In quinta** | in città · fuori città · i verbi che cambiano; *da scrivere*: *was / were*, il passato irregolare e in *-ed* | In quarta |
| La prova finale | — | tutti |

Rifinito sul programma vero, rispetto alla traccia di partenza:

- **i saluti in prima sono una tappa di frasi, non di parole**: *hello,
  goodbye, please, thank you* sono sei parole di struttura (categoria `q`),
  troppo poche per una tappa, e a scuola si imparano come frasi fatte;
- **big, small e le emozioni in seconda** (*I am happy, are you hungry?*),
  dove i libri le mettono con *I am* e la famiglia; in prima i colori
  bastano a fare *a red ball*;
- **gli animali selvatici non hanno una tappa**: in prima quelli di casa e
  della fattoria, gli altri nel 📦 cassetto della prima;
- **i verbi arrivano in terza con *can*** (nuotare, correre, saltare…), che
  è dove i libri li usano la prima volta, e in quarta quelli di ogni giorno
  per il presente;
- **i mestieri in quarta con *he / she* + la *s***, i luoghi in quinta con
  il passato (*I went to the park*);
- **i soldi della quinta non ci sono ancora**: *money, coin, price, cheap,
  expensive* non sono in `data/words.js` (vedi [da-fare.md](da-fare.md)).

**Dentro un mondo le frasi sono capitoli fra le parole, e in fondo la
🏁.** Una tappa di frasi viene subito dopo le tappe di parole che le
servono (*Mi piace!* dopo il cibo e il pranzo), mai tutte in blocco alla
fine: chi gioca un mondo compone frasi dalla seconda o terza tappa, e mai
più di quattro tappe di parole di fila (lo controlla
`test/unita/inglese-mondi`). Una tappa di parole non chiede frasi, una di
frasi non insegna parole. Una tappa di parole ha **8–10 parole di un argomento solo**, col nome
dell'argomento: «I colori» sono solo colori (`dati/argomenti.js`). Una tappa
di frasi ha **una struttura** (a volte due forme della stessa, *it is / is
it*) e **nessuna parola nuova**: le sue frasi usano solo parole già viste
nelle tappe di parole di quel mondo o dei mondi prima, e ognuna contiene
almeno un **segno** della struttura (`segni` in `dati/forme.js`: una frase di
«C'è» dice *there*). La 🏁 ripassa tutto il mondo, e il capitolo del libro
usa solo quello che il mondo ha insegnato.

**L'età.** Ogni tappa porta la sua `portata` dall'anno di scuola (l'anno n
va da 12,5·(n+1) a 12,5·(n+2), cioè dai 5+n ai 6+n anni, sulla scala di
[../apprendimento/eta-e-portata.md](../apprendimento/eta-e-portata.md)), e
nessuno la scrive a mano: la mette `portate()` in `dati/mondi.js`
spargendo le tappe dentro l'anno. La carta English la legge come quella di
ogni gioco (`TAPPE_DEL_GIOCO.inglese` in `data/portata-giochi.js`), e il
manifesto non dice più `grandi`: il primo mondo è la prima elementare. **Chi
è più grande trova i mondi degli anni già fatti «passati»**: un mondo le cui
tappe stanno tutte sotto la mira dell'età (`miraDi` di `data/portata.js`, la
stessa di ogni campagna) è aperto per intero — bandiera, libro e cassetto
compresi — da ripassare quando vuole, **non è vinto**, e apre il mondo dopo
come se fosse finito. A otto anni è passata la prima, a dieci anche seconda
e terza. Il passato si decide sul mondo intero e non tappa per tappa: metà
mondo aperto per età e metà no sarebbe un mondo che non si capisce.
Perché non con `scuola:` come le tabelline: quel campo vuole un sapere di
`data/saperi.js` da spegnere, e «l'inglese della prima» non è una cosa che un
genitore spegne; qui l'anno è già nel dato.

**La mappa è una mappa del tesoro**: il grafo come quello della mappa del
sotterraneo, su filigrana di pergamena, sentieri tratteggiati, e per ogni
tappa un disegnino stilizzato di quello che insegna. Si disegna con i pittori
(niente emoji come figura principale, vedi `docs/core/grafica.md`).

**Ogni tappa ha un grado di «imparato» da 0 a 10**, calcolato dalla forza
SRS delle sue parole, frasi e strutture (`store/srs.js`): non è un numero da
tenere a mano, e **cala col tempo da solo** come cala la forza. A schermo la
tappa si riempie e, quando scende, sbiadisce. Riprendere una tappa scesa a 8
**riparte dalle domande di quel grado** (i formati adatti a quella forza, le
voci più deboli prima), non da capo. Un grado calato non richiude niente.

Le parole dei dati che non entrano in nessuna tappa stanno nel **📦 cassetto**
del mondo della loro categoria: facoltativo, si apre a tappa vinta, e si gioca
coi formati delle parole di oggi. Nessuna chiave sparisce.

**Le risposte sbagliate di una domanda su una parola vengono dal suo
argomento**, mai da tutta la lingua: prima le altre parole della tappa, poi
il resto dell'argomento, poi gli argomenti `vicini` (i giocattoli prendono
in prestito dallo sport). Era il difetto trovato giocando: `compagne()` di
`data/lessico.js` allarga a tutta la lingua quando la categoria è piccola, e
fra i colori usciva 🔴 in mezzo a 🏥🐶📓. Chi fa la domanda passa le `fonti` a
`componi()` di `data/domande.js` (`fontiDi` in `motore/grafo.js`); il
cassetto, che non ha un argomento, tiene i distrattori di sempre. Un
argomento può dire `figure: false` quando il disegno non ha **un
significato solo e netto**: le facce delle emozioni (happy, sad, tired), le
persone della famiglia (👧 può essere *sister*, *girl* o *friend*, e *friend*
è 🤝), i mestieri, le ore del giorno (🌅 🌆 🌃), i luoghi (🏛️ e 🏦). Lì la
parola si chiede fra italiano e inglese. **Dai dieci anni (la quinta) niente figure**, in
nessuna tappa (`ETA_SENZA_FIGURE` in `motore/sessione.js`): a quell'età il
disegnino non insegna niente, e la parola si chiede fra italiano e inglese.

## I formati, decisi dalla forza

Le parole tengono la scala di oggi (figura → ascolto → capisci → produci). Le
frasi salgono di un gradino a ogni punto di forza, **o della forza della
loro struttura meno uno** (`gradino` in `motore/sessione.js`): la forma sale
a ogni frase giusta, quindi in una partita sola si arriva alle tessere anche
con frasi mai viste. Prima il gradino guardava solo la frase, e una partita
restava ai primi due formati. In un mondo passato per età, o con «Sblocca
tutti i livelli», si parte dal terzo gradino (`partenza`); una frase
sbagliata in questa partita torna alla sua forza.

1. **Riconosci** — la frase inglese e quattro italiane (`fraseIt` di oggi).
2. **Cosa vuol dire** («Leggi bene: che vuol dire?») — anche qui le italiane sbagliate ricalcano le trappole
   della grammatica («è un cane» / «è un cane?»).
3. **Scegli** — la frase italiana e quattro inglesi: la giusta e tre trappole.
4. **Componi**, a gradini:
   - **completa**: la frase c'è già con dei buchi (due da tre parole in su,
     tre da sei), e le tessere sono quelle dei buchi più una di troppo presa
     dalle trappole: un buco con una tessera sola non era una scelta;
   - **monta**: solo le tessere giuste, da mettere in ordine;
   - **scegli e monta**: il banco con le parole trappola (una, poi due, poi tre).

Le tessere si **toccano** e vanno in fila, si ritoccano e tornano nel banco:
niente trascinamento. La punteggiatura non è una tessera: la fila mette da sé
la maiuscola e il `?`.

**Forma lunga prima, contratta dopo**: le prime tappe di ogni struttura usano
*it is*, *do not*; le successive *it's*, *don't*. Sono accettate sempre tutte e
due. *Have got* resta, come a scuola.

## Le trappole sono il dato

Una tabella di **errori tipici per struttura** genera le frasi sbagliate, ognuna
col suo perché in una riga (sotto i 70 caratteri): *it is* al posto di *is it*
nella domanda, *she play*, *does he likes*, *I not like*, *a hat red*, *three
dog*, *the* davanti a un nome generico, *he/she*, *have/has*, *can to*, *goed*…
Le trappole scritte a mano (parole vicine: *pen/pencil*) si aggiungono alla
frase, non sono obbligatorie. Le opzioni sbagliate di «scegli», la tessera
di troppo di «completa» e quelle di «componi» vengono dalle stesse
trappole (più le gemelle di grammatica): una scrittura, tutti i formati.

Una frase componibile ha: `id`, mondo e tappa, `forma` (la struttura), `it`,
`en`, `varianti` accettate, `trappole` a mano, `niente` (regole da non
applicare perché qui darebbero una frase giusta). Le frasi di oggi tengono il
loro `id` (è la chiave SRS). Una riga della tabella può valere solo per
certe forme (`soloForme`): *in/on* è un errore di mesi in «Oggi è lunedì» e
di posto in «Dov'è?», e le due spiegazioni sono diverse.

**Una trappola sbaglia per il motivo che dice, e per nessun altro.** Le
parole vicine si generavano senza guardare il numero: «I have got a
trousers», «has she got a big hair», «it is a orange ball». Adesso la parola
vicina rifà l'articolo (*an orange*), non mette una cosa che non si conta o
già plurale dopo *a* (`NON_CONTABILI` in `motore/lessico.js`), e al posto di
una che non si conta ne mette una al plurale («I like milk» → «I like
apples»). Lo controlla per ogni frase e ogni trappola `sgrammaticata()` di
`motore/grammatica.js`: *a/an* giusti, niente *a* davanti a un plurale o a
una cosa che non si conta, il plurale dopo un numero. Le righe che sbagliano
apposta proprio questo (`a-an`, `plurale-senza-s`) stanno in `APPOSTA`.

La chiave **`forma:<id>`** registra le risposte sulla struttura: una forma
debole fa uscire più spesso la sua trappola e ripesca le sue frasi nei mondi
dopo — **solo nelle tappe di frasi e nella 🏁**, dove si ripassano le frasi;
una tappa di parole fa solo parole. Una frase composta giusta conta come ripasso delle sue parole **già
scadute** (solo quelle). Uno sbaglio su una parola vicina pesa sulla parola,
uno di grammatica sulla frase e sulla forma.

## Il libro a capitoli

Ogni mondo ha un **mini capitolo di un libro**, con personaggi che tornano
(Laura, Leo, Tom, un cagnolino). Il capitolo è **scritto a mano** — un inizio,
un fatto, una fine — con:

- **variabili** tirate a sorte e coerenti fra loro (il cibo, il posto, il
  tempo, chi è amico di chi);
- **frasi a rami** accese da una condizione (se c'è vento il cappello vola, e
  lo riporta il cane *oppure* Leo);
- **domande in italiano** con risposte in italiano, calcolate dal mondo tirato,
  ognuna con la sua condizione. Le sbagliate sono le versioni che non sono
  uscite questa volta. «Non si sa» è una risposta quando il testo non lo dice.

Usa solo le strutture dei mondi già fatti. Cresce coi mondi: da 4 frasi e una
domanda (fatti in una frase) a 12–15 frasi e tre o quattro domande (chi/cosa
su due frasi, il perché, l'ordine degli eventi, quello che si capisce senza
che sia scritto, vero/falso su più frasi).

## Toccare una parola per sapere cosa vuol dire

Ogni parola inglese a schermo (frase, tessera, capitolo) si tocca e mostra la
traduzione per un paio di secondi.

- **Gratis 3 volte in tutto** finché la parola è nuova (forza bassa).
- Dopo, toccarla fa sì che **quella domanda non paghi**. Per questo **prima
  si chiede**: una bolla accanto alla parola dice perché costerebbe («Hai
  già chiesto questa parola 3 volte», o «la conosci già») e che la domanda
  non darà monete, con «Sì, dimmelo» e «No, ci provo». Solo al sì si svela
  e l'indicatore delle monete si spegne. Le volte gratis passano dritte, e
  anche un tocco che non toglierebbe più niente (la domanda non paga già).
  Non costa monete.
- La parola chiesta conta come **non saputa** nello SRS: non si rafforza anche
  se poi la risposta è giusta.
- Nel capitolo, ogni parola chiesta oltre le gratuite toglie il guadagno di
  **una** domanda, non di tutte: la bolla lo dice così, e non chiede più
  quando non resta nessuna domanda che paghi.

## Sbagliare

Niente si perde, nemmeno alla 🏁: l'errore si spiega (il perché della trappola
più «Si fa così», la regola della struttura) e si aspetta, come nelle domande
del sotterraneo (`docs/apprendimento/la-domanda.md`).

## Chi ha già giocato

**Le parole sapute restano sapute**: le chiavi `en:`, `verbo:`, `frase:` e
`forma:` non si rinominano, e le frasi dei primi due mondi di prima che
stanno ancora in piedi hanno tenuto il loro `id`. Le tappe invece hanno
cambiato `id` (da `che-cose-1` a `prima-animali`), e l'avanzamento si
travasa con una regola sola (`motore/travaso.js`): **una tappa nuova nasce
vinta se tutto quello che insegna era in tappe vinte** — una di parole se
ogni sua parola c'era, una di frasi se c'era la sua struttura, la 🏁 se tutto
il resto del suo mondo è vinto. Chi aveva finito i due mondi di prima trova
vinte sedici tappe su ventitré della prima e della seconda; restano da fare
quelle con dentro qualcosa di nuovo (i colori, perché ci sono orange e
purple; i giocattoli; i saluti; i numeri fino a venti; come sono) e le due
bandiere. Cosa insegnavano le tappe vecchie sta fermo in `dati/travaso.js`,
le chiavi vecchie restano in `vinte` (niente si butta) e non si contano più
(`quanteVinte`). Il travaso gira all'apertura del gioco ed è idempotente; il
riassunto della home lo applica già in lettura. Alcune frasi dei mondi di
prima non ci sono più, perché usavano parole che adesso arrivano dopo (*frog,
sheep, elephant, monkey, big* in prima): le loro chiavi restano nel
profilo, e tornano se una frase le riprende. Il gioco libero resta a chi l'aveva: «Il gioco di prima», in fondo
alla mappa, per chi aveva finito la campagna vecchia. La campagna vecchia è un
indice in `p.eng` e non si tocca; la nuova sta sotto un nome suo
(`campagne.inglese`), quindi un travaso non serve ([mondi-vista.md](mondi-vista.md#il-posto-del-gioco)).

## Estendibile

Aggiungere varietà vuol dire aggiungere dati, mai toccare il motore:

- un capitolo è un file in una cartella, raccolto da sé (come i moduli di quiz);
- gli elenchi di personaggi, cibi, posti, oggetti sono in comune, con la loro
  traduzione e il mondo da cui sono noti: una parola nuova arricchisce tutti i
  capitoli che la possono pescare;
- un errore tipico nuovo è una riga della tabella delle trappole;
- un tipo di domanda nuovo si scrive una volta e lo usano tutti i capitoli.

**Un test solo controlla tutto**, anche quello che nascerà: una sola risposta
giusta per domanda, ogni ramo raggiungibile, nessuna trappola uguale alla
giusta o a una variante, ogni parola nota nel suo mondo, ogni perché sotto i 70
caratteri. **Uno script stampa** i banchi generati e un capitolo in tutte le
sue varianti, per rileggerli in blocco.

---

# Com'è costruito

Quello che segue è il progetto diventato codice: dove sta cosa, le scelte
prese costruendolo dove il progetto non diceva abbastanza, e l'interfaccia
che la vista userà.

## Dove sta cosa

Tutto in `src/giochi/inglese/`, con la convenzione dei giochi nuovi
([../core/convenzione-giochi.md](../core/convenzione-giochi.md)): `dati/`
sono tabelle, `motore/` gira in Node e non sa di monete né di schermo.
`gioco.js`, `Gioco.vue`, `viste/` e `scena/` sono in [mondi-vista.md](mondi-vista.md).

| file | cosa tiene |
|---|---|
| `dati/mondi.js` | il grafo: un mondo per anno, le tappe (parole, frasi, 🏁), le categorie dei cassetti, la portata, `CHIAVE` |
| `dati/argomenti.js` | gli argomenti delle tappe di parole: quali parole, i vicini, `figure` |
| `dati/forme.js` | le strutture (`forma:<id>`): parole di struttura, `segni` e «Si fa così» |
| `dati/travaso.js` | cosa insegnavano le tappe di prima, per il travaso |
| `dati/trappole.js` | la tabella degli errori tipici, una riga per errore |
| `dati/frasi/<mondo>.js` | le frasi componibili di un mondo (elencate in `dati/frasi.js`) |
| `dati/capitoli/<mondo>.js` | un capitolo del libro per file (raccolti da `dati/capitoli.js`) |
| `dati/elenchi.js` | personaggi, animali, colori, cibi… con le forme italiane |
| `dati/contrazioni.js`, `dati/glossario.js` | forma lunga ↔ contratta; le parole di struttura toccate |
| `motore/testo.js` | parole, contrai/espandi, `accetta`, la fila in bella |
| `motore/lessico.js` | che cos'è una parola (nome, colore, pronome…), plurali, `traduci` |
| `motore/grafo.js` | mondi garantiti, parole note a una tappa, voci di una tappa, l'argomento di una parola (`fontiDi`, `gruppoDi`), cassetto |
| `motore/grammatica.js` | `sgrammaticata`: a/an, cose che non si contano, plurale dopo un numero |
| `motore/travaso.js` | le tappe vinte di prima diventano tappe vinte di adesso |
| `motore/trappole.js` | le operazioni della tabella, `trappoleDi`, `scegliTrappole` |
| `motore/formati.js` | da una frase tutti i formati (`costruisci`) e il giudizio (`giudica`) |
| `motore/grado.js` | il grado 0–10 e `ripresa` |
| `motore/sessione.js` | una partita a una tappa, alla 🏁 o al cassetto |
| `motore/tocchi.js` | la parola da toccare |
| `motore/mappa.js` | aperto, vinto, finito, passato per età; `statoMappa` |
| `motore/libro.js` | il libro: variabili, rami, domande |
| `motore/guasti.js` | i controlli su ogni frase e ogni capitolo |

Lo script `node strumenti/inglese/banchi.mjs` stampa i banchi: tutte le
frasi, un mondo (`terza`), una tappa (`terza-c-e`), una frase (`m-pen`), o i
capitoli in tutte le varianti (`--capitoli`, `--capitolo=il-picnic --max=20`).

## Le scelte prese costruendolo

Dove il progetto lasciava una scelta aperta, o una cosa scritta sopra non
stava in piedi nel codice, si è presa la variante più vicina:

- **L'avanzamento sta in `profile.campagne.inglese`**, con la forma comune
  (`tappa`, `libera`, `stelle`, `cfg`) più `vinte: { <id tappa>: <quando> }`.
  Il grafo non è una fila, quindi un indice non basta: `tappa` resta il
  numero di tappe vinte (lo leggono le misure dell'albo) e `libera` vuol
  dire prova finale vinta. `p.eng` non si tocca.
- **Il conto dei tocchi gratis sta sull'elemento SRS della parola**
  (`items['en:dog'].tocchi`): è di quella parola, e un contatore per parola
  altrove sarebbe un secondo elenco che cresce.
- **Ogni parola toccata conta come non saputa**, anche con i tocchi gratis:
  il gratis riguarda la paga, non lo SRS. Per una parola nuova (forza 0–1)
  un errore in più non sposta niente.
- **Le parole di struttura** (`is`, `the`, `do`…, `dati/glossario.js`) non
  hanno una chiave SRS sua: si imparano con la forma, e toccarle è sempre
  gratis e non segna niente.
- **Il formato lo decide il gradino** (la forza, alzata dalla struttura, vedi
  «I formati»): 0 riconosci, 1 cosa vuol dire, 2 scegli, 3 completa, 4
  monta, 5–6 scegli e monta. Le tessere di troppo di «scegli e monta» sono
  due a 5, tre a 6, **quattro a 6 quando anche la forma è a 6**
  (`tessereInPiu`): con una sola, e per di più una parola vicina, la
  scelta era *sad* o *tired* e si scartava dal significato.
- **Le tessere di troppo, dalle più istruttive** (`tessereDiTroppo` in
  `motore/formati.js`): prima le parole delle trappole di grammatica, poi le
  **gemelle** delle parole della frase (`GEMELLE` in `dati/trappole.js`:
  *am/is/are*, *my/your/his/her*, *he/she/they*, *have/has*, *in/on/under*…,
  solo quelle già note), per ultime le parole vicine. Le gemelle
  escludono gli scambi che in italiano si somigliano (*this/it*, *a/the*),
  perché darebbero una seconda frase giusta.
- **Riconosci e cosa vuol dire** differiscono nelle sbagliate: la prima
  prende l'italiano di altre frasi della tappa, la seconda quello delle
  trappole che hanno un senso in italiano (la domanda girata «è un cane?»,
  mio/tuo, lui/lei, il «non» tolto), e riempie con le altre frasi.
- **La tabella delle trappole è fatta di righe che nominano
  un'operazione** (`fa`, coi parametri in `con`). Un errore che somiglia a
  uno che c'è è una riga (`can-to` è `inserisci` con `to` dopo `can`); un
  errore di specie nuova è un'operazione nuova in `motore/trappole.js`.
  Ogni riga porta un `esempio` e il test lo rifà: le righe dei mondi che
  non ci sono ancora (can to, she play, does he likes, goed) sono già
  provate.
- **Su cosa pesa uno sbaglio** lo dice la riga (`pesa`): le trappole di
  grammatica su frase e forma (la forma della riga, o quella della frase),
  le parole vicine sulla parola. Aver preso in «riconosci» l'italiano di
  un'altra frase pesa solo sulla frase.
- **Le parole vicine si generano da sole** (`parola-vicina`: un nome o un
  colore della frase scambiato con uno della stessa categoria già noto) e
  riempiono quando le trappole di grammatica non bastano; quelle scritte a
  mano nella frase (`trappole: [{ en, it, perche, parola }]`) escono prima.
- **Contratta o lunga lo dice la tappa** (`contratta: true`), non la
  struttura: la prima tappa di una forma è lunga, le dopo contratte. Le
  frasi nei dati sono sempre lunghe.
- **Le parole vicine sono dello stesso gruppo**: l'argomento della tappa
  che le insegna (i giorni con i mesi, non con *morning*), se no la
  categoria; un verbo si scambia con un verbo, e uno sbaglio lì pesa sul
  verbo (`verbo:`).
- **Una tappa di frasi non chiede mai parole.** Provato un riscaldamento
  che passava prima le parole delle frasi con forza sotto 1: non funziona,
  perché la forza cala in poche ore e il giorno dopo «Mi piace!» chiedeva
  di nuovo *strawberry*, e sembrava una tappa di parole. Una parola che non
  sa si tocca (le prime tre volte gratis); le frasi con tutte le parole
  sapute escono per prime (`pronta`).
- **Il «?» nelle opzioni inglesi non c'è** (la regola di
  [vocaboli.md](vocaboli.md): la domanda si riconosce dall'ordine); lo
  mette la fila composta, con la maiuscola (`inBella`, `rigaInBella`).
  **L'italiano ha sempre il punto o il «?»** (`aSchermo`), in consegna e
  nelle opzioni: senza, «È un cane» si leggeva anche come domanda e
  *it is / is it* non aveva una risposta sola.
- **Il mondo da cui una parola degli elenchi è nota non si scrive**: lo
  ricava il grafo (`paroleNote`), così una parola che entra in una tappa
  arriva da sola a tutti i capitoli che la possono pescare.
- **I cassetti per anno**: animali, colori, scuola e giochi (`a c s g`) in
  prima; corpo, persone, cibo, vestiti e aggettivi (`b k f p j`) in
  seconda; casa, calendario, natura e numeri (`h d w n`) in terza, coi
  verbi; mezzi (`t`) in quarta, luoghi (`y`) in quinta. Le parole di
  struttura (`q`) non hanno cassetto. Una categoria sta in un mondo solo,
  anche quando le sue tappe sono sparse su tre anni (i numeri). La prova
  finale è un mondo (`prova-finale`), senza tappe.
- **Quarta e quinta hanno solo le parole**: le tappe di parole, la 🏁 e le
  strutture dell'anno dichiarate in `strutture` (il controllo pretende o le
  tappe di frasi o la dichiarazione). Non hanno ancora un capitolo.
- **Il cassetto si apre alla prima tappa vinta del mondo** (o col mondo passato per età).
- **Il grado** è `floor(10 × media(min(forza, 4) / 4))` su parole, frasi e
  forma della tappa; la 🏁 fa la media di tutto il mondo.
- **La sessione**: il primo giro passa le parole una volta, dalla più
  debole; poi pesca col picker di `store/srs.js`, e una frase entra solo
  quando ogni sua parola è già saputa (forza ≥ 1) o è stata indovinata in
  quella partita (`pronta`). Finisce a `min(20, voci + 4)` risposte giuste, e
  sbagliando non si perde niente. Alla 🏁 il primo giro è di 16. In una tappa
  di frasi e alla 🏁, tre frasi di una forma debole (forza < 2) dei mondi
  già fatti entrano nel giro; in una tappa di parole mai.
- **Gli `id` nuovi cominciano con `m-`**; dove la frase c'era già in
  `data/frasi.js` si è tenuto il suo `id`, e il test pretende che sia la
  stessa frase (`e-cat-1`, `d-like-pizza`, `e-have-dog`…).
- **La portata delle tappe** la mette l'anno (25–36 la prima, 38–49 la
  seconda, 50–61 la terza, 63–74 la quarta, 75–86 la quinta), la legge la
  carta e decide i mondi passati.

## Il libro: il formato di un capitolo

```js
export default {
  id, mondo, titolo,
  variabili: {
    colore: { da: 'colori', fra: ['red', 'blue'] }, // valori di un elenco
    cibo:   { da: 'cibi' },                         // senza fra: tutto il noto del mondo
    piace:  { fra: [true, false] },                 // valori liberi
  },
  vincoli: [v => v.cibo.en !== 'cake'],            // facoltativo
  frasi: [
    { en: 'He has got {a:colore} hat.', forma: 'has-got' },
    { se: v => v.piace, en: 'Yes, I do!' },         // un ramo
  ],
  domande: [
    { testo: 'Che cosa piace a Leo?', risposta: v => v.cibo.ilPl },   // a scelta
    { testo: 'Laura ha un cane?', tipo: 'vf', etichette: ['Sì', 'No'],
      vero: v => (v.cane ? true : null) },                            // null = non si sa
  ],
}
```

Nei modelli: `{x}` è l'inglese, `{x.pl}` il plurale, `{x.campo}` un campo
dell'elenco, `{a:x}`/`{A:x}` con l'articolo giusto (a/an). Le sbagliate
sono le risposte degli altri mondi possibili più quelle in `anche`, al
massimo tre; una risposta vuota è «Non si sa». Il testo del capitolo ha la
sua punteggiatura, a differenza delle frasi componibili. Un tipo di
domanda nuovo è una voce di `TIPI_DOMANDA` in `motore/libro.js`.

## L'interfaccia per la vista

Tutto puro; la vista tiene lo stato reattivo e scrive il profilo.

**La mappa.** `c = progresso(CHIAVE)` (da `giochi/campagne.js`), poi
`travasa(c)` (e se torna vero si salva), poi `statoMappa(c, forzaDi, { tutto,
eta })` → per mondo `{ id, anno, nome, insegna, dopo, dopoUno, pronto,
aperto, finito, passato, tappe: [{ id, nome, disegno, bandiera, frasi,
aperta, vinta, grado }], cassetto: { aperto, chiavi } }`, con `forzaDi =
strengthOf` di `store/profile.js`, `tutto` = `tuttoAperto()` ed `eta` =
`etaDelBambino()`. `disegno` è il nome del disegnino della tappa per i
pittori.

**Una partita.**
```js
const s = new Sessione({ tappa: tappaDi(id) /* o cassettoDi(mondo) */,
                         itemDi: item, haVoce: p => haVoce(p, 'en') })
const d = s.prossima()                    // la domanda
const t = new Tocchi({ itemDi: item })    // uno per domanda
t.prova('dog')                            // { costa, volte, nuova }: non segna niente
domandaDelTocco(p, { libro })             // la domanda da fare prima, se costa
t.tocca('dog')                            // { it, gratis, chiave }: se !gratis, «questa non paga»
const e = s.rispondi(d, risposta, { tocchi: t })
e.registra.forEach(r => answer(r.chiave, { correct: r.correct }))
if (e.paga) …                             // quanto, lo decide la vista (calibrazione.md)
if (s.finita) segnaVinta(c, id)           // vero la prima volta: il premio grosso
```
- `d.genere === 'parola'`: è il turno di `data/domande.js` di sempre
  (`d.tipo`, `d.domanda`, `d.opzioni`); si risponde con l'opzione toccata.
- `d.genere === 'frase'`: `d.formato` è `riconosci`, `senso` o `scegli`
  (con `d.opzioni`: si risponde con l'opzione), oppure `completa`, `monta`,
  `scegliMonta` (con `d.tessere` `{ id, testo }`, e per `completa` anche
  `d.righe`, fatte di `{ testo }` e `{ buco: n }`: si risponde con gli id
  delle tessere nell'ordine della fila, per `completa` nell'ordine dei
  buchi). `rigaInBella(d, ids)` è la fila come va scritta a schermo;
  `d.domanda` è `{ testo, lingua: 'en' | 'it' }`.
- L'esito sbagliato porta `perche` (una riga, o null se lo sbaglio non è
  una trappola nota), `siFa` (la regola della forma) e `giustaEra`.

**Il capitolo.** `CAPITOLI` da `dati/capitoli.js`, `capitoliDi(CAPITOLI,
mondo)`, poi `capitolo(cap)` → `{ titolo, righe: [{ en }], domande: [{
testo, opzioni: [{ testo, giusta }], giusta }] }`. Un `Tocchi` per tutto il
capitolo; una domanda giusta paga quando si risponde, finché
`domandeCheLPagano(giuste, t.aPagamento)` supera quelle già pagate.

Nei test: `unita/inglese-mondi`, senza browser: oltre ai controlli di ogni
frase e capitolo, i difetti trovati giocando resi impossibili in generale
(una tappa di parole ha solo parole del suo argomento e le risposte
sbagliate vengono da lì; una frase usa solo parole note e un segno della
sua struttura; nessuna trappola sgrammaticata per caso; niente frasi
ripescate in una tappa di parole), l'anno e la portata, i mondi passati e
il travaso. La vista e i suoi bersagli
`data-…`: [mondi-vista.md](mondi-vista.md#nei-test).
