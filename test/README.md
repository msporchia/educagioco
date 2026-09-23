# I test

```
npm test                 il giro di ogni giorno: senza browser — una ventina di secondi
npm run test:unita       lo stesso comando, per esteso
npm run test:svelto      solo quelli sotto il secondo — mentre si scrive, quattro secondi
npm run test:browser     solo quelli nel browser — Chrome, un minuto e mezzo
npm run test:tutto       tutto: unità e browser, ricompila prima — prima di pubblicare

node test/esegui.mjs pozioni        solo i file che contengono "pozioni"
node test/esegui.mjs --niente-build non ricompilare (se hai appena compilato)
node test/esegui.mjs --tempo=600    alza il tempo massimo per test
node test/esegui.mjs --svelti       solo i test sotto il secondo
node test/esegui.mjs torri --scatti lascia anche le foto (test/scatti/)
node test/esegui.mjs --alla-volta=1 uno alla volta, come una volta (vedi sotto)
```

**Quale lanciare, e quando.** `npm test` è il comando di ogni riga scritta:
niente browser, niente build, un risultato prima di aver tolto le dita
dalla tastiera. `test/integrazione/` non ci entra mai — apre Chrome, e in
fila vale più del novanta per cento dell'intera suite (misurato in
[`docs/tempi-dei-test.md`](../docs/tempi-dei-test.md)) — quindi si chiede
solo per «estrema necessità»: si è appena toccata *quella* schermata e si
vuole esserne sicuri prima di committare. In quel caso il modo giusto non
è `npm run test:browser` (tutti insieme, un minuto e mezzo anche otto
alla volta) ma **un file solo**: `node test/esegui.mjs pozioni` prova solo
`integrazione/pozioni` (e `unita/pozioni`, se esiste un file con lo stesso
nome — vedi più sotto). `npm run test:tutto` è il giro completo: prima di
pubblicare, o quando si vuole la certezza di prima che questo file
esistesse.

## Otto alla volta

I test girano **insieme**, otto per volta — o la metà dei processori, su
una macchina che ne ha meno di sedici, e mai più di uno per ogni giga di
memoria libera alla partenza: se un'altra sessione ha già la sua
chiusura in corso, la seconda parte con meno corsie e lo scrive invece
di mandare la macchina in swap. Ognuno era già un processo a sé, col suo
Chrome e il suo archivio vuoto, quindi nessun test deve saperlo: è solo
il lanciatore che non aspetta più la fine di uno per far partire il
successivo. E conviene molto più di quanto sembri, perché un test di
integrazione passa quasi tutta la sua vita **fermo** — aspetta
un'animazione, un salvataggio a scatto ritardato, un cliente che arriva
— e in fila quelle attese si sommano: la suite intera costa più di
dieci minuti, otto alla volta uno e mezzo, e la CPU resta libera per due
terzi.

Tre cose cambiano a vederlo girare:

- **l'uscita arriva a blocchi.** Otto test che scrivono sullo stesso
  terminale sarebbero un'insalata: quella di ognuno si tiene da parte e
  si stampa intera quando il test finisce, nell'ordine in cui finiscono.
  Il riepilogo in fondo torna in ordine alfabetico.
- **i lunghi partono per primi.** Il lanciatore si ricorda quanto ci ha
  messo ogni test (`node_modules/.cache/educagioco/tempi-dei-test.json`,
  fuori da git) e la volta dopo li mette in fila da lì: un test da un
  minuto partito per ultimo allungherebbe il giro di un minuto intero.
- **il giro non finisce prima del suo test più lungo.** Oggi sono i
  file di integrazione attorno al minuto (`torri`, `genitori`,
  `fattoria`), e per `npm test` è `unita/survivors`, che da
  solo vale quanto tutte le altre unità insieme. Un test che si allunga
  lì si sente subito sul totale, ed è il primo posto dove guardare: la
  fattoria era a due minuti, e metà li passava a cercare la bancarella
  partendo dall'angolo sbagliato.

`--alla-volta=N` sceglie quanti. `--alla-volta=1` è il lanciatore di
prima, con l'uscita dal vivo: serve quando un test si comporta male solo
in compagnia, per sapere se è lui o la folla. Un file solo (`node
test/esegui.mjs pozioni`) scorre sempre dal vivo.

## I lenti si dichiarano, non si scoprono

`npm test` costa una ventina di secondi, e non è colpa di tutti: un pugno
di test giocano una campagna intera con un finto giocatore — il castello
tappa per tappa, il tower defense, il dungeon a bivi, i livelli del
Generale — e da soli si mangiano la maggior parte del tempo. Sono giusti
così: è il prezzo di provare le regole giocandole invece di fidarsi a
occhio. Ma è un prezzo che ha senso pagare quando si tocca *quella*
parte, non a ogni riga scritta altrove — altrimenti si smette di
lanciare i test mentre si lavora, che è l'unico momento in cui contano.

`--svelti` (e `npm run test:svelto`, che aggiunge anche `--niente-build`)
tiene fuori chi dichiara un `tempo: 100` o più fra i primi commenti — la
stessa riga di `tempo: 900` usata per allungare il tempo massimo prima di
essere fermato ⏱, letta nei primi 1200 caratteri del file: un test la
scrive quando il suo costo è un fatto, non un incidente. Chi non dichiara
niente vale 0 e resta dentro il giro svelto: è la stragrande maggioranza,
quella per cui il default va bene. `test/integrazione/` non ci entra mai,
qualunque cosa dichiari: apre Chrome, e solo aprirlo costa più di un
secondo.

`npm test` (= `npm run test:unita`) gira tutta la cartella `unita/`, lenti
compresi: `--svelti` sceglie chi entra in *quel* giro più stretto, non
cosa entra in `npm test`. Ed è `npm run test:unita` il comando su cui si
appoggia la CI prima di pubblicare — un test lento in meno lì sarebbe un
buco, non un guadagno.

## Le foto si chiedono

**Nessuno scatto viene fatto da solo.** Le immagini non verificano niente —
nessun test guarda i pixel — e servono a chi lavora per vedere com'è venuta
una schermata. Farle a ogni giro costava secondi e lasciava in giro file che
cambiano da soli, perché il gioco è pieno di caso: un `git status` sporco
dopo ogni build, e otto PNG del tower defense che finivano perfino nei commit.

Si accendono con `--scatti` al lanciatore, o con `SCATTI=1` nell'ambiente se
lanci il file a mano:

```bash
node test/esegui.mjs torri --scatti      # una classe, con le foto
SCATTI=1 node test/integrazione/torri.test.mjs   # a mano
```

Un test non chiama mai `page.screenshot` da sé: passa da `scatto(page, nome)`
di `aiuto/browser.mjs`, che a foto spente non fa niente e a foto accese scrive
sempre e solo in `test/scatti/`, che git non guarda. In `torri.test.mjs` il
pezzo che apre le colonne per ritrarle sta **dentro** l'`if`: esiste solo per
la foto, e senza foto non c'è motivo di farlo girare.

Ogni test ha **quattro minuti** per finire, poi viene fermato e segnato ⏱.
Serve perché un test appeso non dia l'impressione di uno lento: è già
successo che una simulazione tenesse ferma tutta la suite per un quarto
d'ora senza dire niente. Chi ci mette davvero di più lo dichiara, scrivendo
una riga fra i primi commenti del file:

```js
/*  tempo: 900   ← simula partite intere, ci mette dei minuti  */
```

Il lanciatore ricompila `dist/index.html` prima dei test di integrazione:
dimenticarsene vuol dire provare la versione di ieri e non accorgersene.

## Com'è diviso

```
test/
  unita/          niente browser, millisecondi: aritmetica, dati, motori
  integrazione/   il gioco vero dentro Chrome, aperto da file://
  aiuto/          gli attrezzi che servono a tutti e due
  scatti/         gli screenshot lasciati dai test (non versionati)
```

**unità** — la matematica delle colonne, la forza del motore di apprendimento,
la curva della fame, i traguardi. Girano su `src/` direttamente, senza
compilare niente. Sono quelli da lanciare in continuazione mentre si lavora.

**integrazione** — aprono `dist/index.html` in Chrome come lo aprirebbe un
bambino, con doppio click su un file. Sono lenti (secondi) e sono gli unici
che vedono davvero i bug di incastro fra le parti.

## Gli attrezzi

`aiuto/verifica.mjs` — `controlla`, `uguale`, `nota`, `riassunto`. Niente
libreria: serve solo che un test rosso esca con codice ≠ 0. Un file che
stampa e basta non è un test, perché nessuno si accorge quando smette di
funzionare.

`aiuto/browser.mjs` — avvia Chrome, apre il gioco, raccoglie gli errori di
console, semina un profilo già pronto, azzera l'archivio, salva screenshot.
Il percorso di Chrome si forza con la variabile d'ambiente `CHROME`; senza,
lo cerca nei posti soliti.

Seminare un profilo è la cosa che fa la differenza: provare la fame di domani
senza aspettare domani.

```js
await semina(page, { coins: 200, pets: { watson: { /* ... */ } } })
```

## Regole imparate a spese nostre

**`avvio.test.mjs` esiste per un motivo.** È già capitato di distribuire un
`giochi.html` che si fermava su "Un attimo…" con un ReferenceError: tutti gli
altri test guardavano dentro ai giochi, nessuno guardava la porta d'ingresso.
È il test più corto e il primo da leggere quando qualcosa è rosso.

**Mai controllare i totali quando qualcun altro può muoverli.** Le monete
arrivano dai giochi, dal negozio, dai traguardi e dal cheat: un test scritto
su "dev'essere 500" passa oggi e mente domani, appena si aggiunge un altro
modo di guadagnare. Si guardano le differenze, e dove il rumore è possibile
si chiede *almeno tanto* invece di *esattamente tanto*.

**Un `goto` che cambia solo il frammento non ricarica niente.** È una
navigazione dentro lo stesso documento: l'applicazione non riparte. Per
riaprire davvero bisogna passare da `about:blank`.

**Un ciclo che aspetta una cosa deve sapere quando non arriverà più.** In
`integrazione/survivors` si giocava finché l'orologio della partita non
scendeva a un certo punto; ma se l'eroe muore l'orologio si ferma sotto
il cartello finale, e il ciclo faceva i suoi trecento giri a vuoto — un
minuto e mezzo per chiamata, e il test **passava lo stesso**, quindi
nessuno lo vedeva. Si è visto quando i test hanno cominciato a girare
insieme: un giro di 90 secondi ne è durato 206, tutti per lui. Chi aspetta
lo stato di una partita guarda anche se la partita c'è ancora.

## Cosa resta da fare

`integrazione/app.test.mjs` e `integrazione/torri.test.mjs` stampano ancora un
JSON e passano comunque: falliscono solo se vanno in crash. Vanno portati su
`aiuto/verifica.mjs` come gli altri, così un cambiamento di comportamento si
vede invece di finire in un log che non legge nessuno.
