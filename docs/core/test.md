# Le prove

Quando si lanciano le prove, come sono divise e le regole per scriverne
una. Il dettaglio del lanciatore e degli attrezzi sta in `test/README.md`
(e in testa a `test/esegui.mjs`): qui non si
ripete.

## La cadenza

| quando | cosa | costa |
|---|---|---|
| mentre si scrive | `npm run test:svelto` | ~30 s |
| a ogni commit | `npm test` (= `npm run test:unita`), niente browser né build | ~30 s |
| toccata una schermata | `node test/esegui.mjs integrazione/<nome>`, un file solo | secondi |
| prima del push | `npm run test:tutto`: unità e browser | ~4 min |
| toccata una parte che ha una verifica | `node test/esegui.mjs verifiche/<nome>` | minuti |
| cambiato sul serio il bilanciamento | `npm run test:misure`, o `node test/esegui.mjs misure/<nome>` | fino a 25 min |

I numeri sono quelli misurati in [tempi-dei-test.md](tempi-dei-test.md);
cosa resta da fare sta in [da-fare.md](da-fare.md).

- **Le unità girano a ogni commit**: costano secondi, non c'è motivo di
  risparmiarle.
- **Il browser gira prima del push, non prima di ogni commit**: sui
  telefoni finisce la **punta**, non i passaggi. È la
  regola dei commit a blocchi applicata alle prove — un commit può non
  stare in piedi da solo, la coerenza si verifica dove si pubblica.
- **Un agente lancia `node test/esegui.mjs --niente-build`** (con un filtro
  per nome quando serve): la build la fa chi coordina.
- **La CI lancia solo `npm run test:unita`** prima di costruire e
  pubblicare (Chrome non lo scarica): un guasto che vive solo in
  `test/integrazione/` o in `test/misure/` lo trova chi lo lancia a mano.
  Motivo in più per chiederlo quando si tocca lo schermo o l'equilibrio.
  La CI non ha il compito di verificare la bilanciatura di un gioco.
- **Le misure e le verifiche non entrano in nessun giro**: né in
  `test:tutto` né sotto un nome (`node test/esegui.mjs sotterraneo` se le
  portava dietro, 25 minuti). Sono la prova di chi ha toccato quella
  parte: si chiedono.
- **Una taratura si lancia solo dopo un cambio significativo del
  bilanciamento** (i numeri dei mostri, della roba, dei prezzi, delle
  ondate). Per tutto il resto non dice niente e costa minuti: non si
  lancia «per sicurezza».
- Il nome di un gruppo (`unita`, `misure`, `integrazione`, `verifiche`)
  prende quel
  gruppo e basta; `gruppo/nome` i file di quel gruppo che contengono il
  nome. Un nome nudo prende unità **e** browser: `node test/esegui.mjs
  pozioni` gira `unita/pozioni` e `integrazione/pozioni` (i nomi in comune
  sono una settantina), quindi apre Chrome anche se si voleva provare
  solo i dati; `unita/pozioni` no.
- **Più giri insieme si spartiscono la macchina**: il lanciatore prende un
  posto per test fra quelli della macchina e non ne fa partire di nuovi
  sopra i tre quarti dei processori occupati. Chi trova la macchina
  piena aspetta, e lo scrive.

## Le cartelle

Un file per argomento; il lanciatore raccoglie da solo ogni `*.test.mjs`,
anche nelle sottocartelle. Un test nuovo non si rifà né il browser né i
controlli: importa da `../aiuto/`.

- **`test/unita/`** — nessun browser, le regole: il calcolo è giusto, i
  dati stanno in piedi, i livelli del Generale si risolvono, il codice
  segreto si vince ragionando. Costano secondi e si rompono appena si
  sbaglia una riga.
- **`test/misure/`** — nessun browser, l'equilibrio: si *giocano le partite
  per davvero* o si genera tanto per vedere che il risultato abbia ancora
  senso (il castello tappa per tappa, le nove tappe di Survivors con un
  finto giocatore che schiva, i regali della partita libera, le domande
  che scendono negli asteroidi, la mappa delle isole dell'inglese a cinque
  larghezze). Si rompono solo quando si tocca quella parte, e da sole
  pesavano metà di `npm test` (sulla CI una passava i quattro minuti): per
  questo non stanno né nelle unità né nella CI. Una misura nuova va qui
  quando gioca o genera per più di qualche secondo.
- **`test/integrazione/`** — Chrome su `dist/index.html`, si gioca col
  dito. Il lanciatore ricompila prima, se non gli si dice
  `--niente-build`. `integrazione/scuola*` apre invece le due pagine di
  `dist-scuola/`, e per quelli si ricompila la scuola.
- **`test/verifiche/`** — Chrome come l'integrazione, ma a richiesta come
  le misure (`npm run test:verifiche`, `node test/esegui.mjs
  verifiche/<nome>`): le prove che misurano o fanno guardare invece di
  dire sì o no (gli fps veri delle scene, una tavola di figure, un
  pannello a sei larghezze), o che costano minuti per una parte che si
  tocca di rado. Chi tocca quella parte le lancia; nessun giro le prende.
- **`test/aiuto/`** — `verifica.mjs` (`controlla`, `uguale`, `nota`,
  `riassunto`, `blocco` per le prove indipendenti di un file),
  `browser.mjs` (apre Chrome, semina o rilegge un profilo, azzera,
  scatta, il dito vero con `ditoDi`), `livello.mjs` (banco di un livello del Generale),
  `sito.mjs` (il sito finto per il service worker), `servizio-scuola.mjs`
  (il servizio della scuola in locale, colla logica vera).

## Cosa va nel browser, e cosa no

Un file nel browser costa secondi e una scena da disegnare; un'unità
millisecondi. Queste sono regole di casa, non divieti: uno sviluppo nuovo
le scavalca se il beneficio è reale, e lo dice in una riga in testa al
file (cosa prova che altrimenti non si proverebbe). Di regola:

- **Le meccaniche si provano senza disegnarle.** Un prezzo, un danno, una
  luce, chi vince: è il motore, in `unita/`, con `src/` importato. Un test
  che apre Chrome per leggere `window.__gioco.motore…` con `page.evaluate`
  e confrontare numeri è un'unità che costa cento volte tanto.
- **Nel browser va un comportamento che solo lì esiste**, e uno per
  blocco: il tocco vero (il click fantasma, la soglia del dito), una
  misura a schermo (questo pannello non copre quello), il salvataggio
  riletto dopo una ricarica, il passaggio fra due schermate, il service
  worker, la console pulita.
- **Al punto da provare si arriva seminando**, non giocando: `semina()`, i
  cheat dell'indirizzo, i ganci delle prove (`__mondo3d.vai`). Una partita
  giocata per arrivare a un cartello prova la partita, costa minuti e si
  rompe per ragioni che non c'entrano.
- **Un controllo deve poter fallire.** `controlla('…', true)` dopo
  un'attesa è un'attesa, non un controllo; un `.catch(() => null)` seguito
  da `nota(…)`, o un `if (await x.count())` attorno ai controlli, fanno
  passare il file quando la cosa da provare non c'è nemmeno.
- **Una preparazione, tanti controlli**: aprire Chrome e la pagina costa 5
  secondi, entrare in una scena 3D di più. Quello che parte dalla stessa
  semina sta nello stesso file, non in sei file che rifanno l'ingresso.
- **Un test pesante spiega perché esiste.** Un file nel browser, una
  verifica, una misura, un'unità sopra i cinque secondi dicono in testa,
  in due righe: `perché:` cosa prova che nessun altro prova, e `a parte
  perché:` come mai non è un blocco in più di un file che c'è già. Se un
  file prova già tutti i vestiti, i cappelli sono tre controlli lì dentro,
  non un file nuovo che riapre Chrome e rifà l'ingresso. Chi non riesce a
  scrivere la seconda riga ha la risposta: si allunga quello che c'è. Nei
  test: `unita/test-pesanti` guarda che le due righe ci siano.
- **Una misura da guardare, un banco, una tavola di figure** non sono
  test: stanno in `strumenti/` col loro comando.

## Le regole per scriverne uno

- **Si aspetta la condizione, non si guarda subito.** Il gioco rimanda le
  scritture di 350 ms, la domanda è cieca per 320, un foglio si chiude un
  fotogramma dopo: chi controlla nell'istante passa solo finché Chrome è
  lento. Il gioco dice quando è pronto: `data-pronto` sulla schermata
  passata la finestra cieca (`pronto`, `domandaPronta`), e
  `window.__archivioFermo` quando l'archivio ha scritto (`leggiProfilo` e
  `semina` lo aspettano da sé). Un `attendi(page, 400)` prima di un tocco
  è quasi sempre uno di questi due.
- **Le foto non si fanno da sole.** Nessun test guarda i pixel: gli scatti
  servono a un occhio umano, sono spenti e si chiedono con `--scatti` (o
  `SCATTI=1`). Mai `page.screenshot`: si passa da `scatto(page, nome)`, che
  a foto spente non fa niente e a foto accese scrive solo in
  `test/scatti/`, ignorata da git.
- **Un tetto di tempo vale da solo.** Il lanciatore con più corsie mette
  `IN_PARALLELO=1` nell'ambiente: una misura in millisecondi (la geografia
  delle isole) lì raddoppia il tetto come sulla CI, perché otto test accanto
  la rallentano tutta la corsa, non solo un attimo.
- **Il roster va scritto prima del reload.** Un archivio vuoto manda
  all'onboarding: `apriGioco` semina da sé un giocatore di prova, e
  `giocatori: null` prova il primo avvio vero. Gli id di prova sono
  `GIOCATORE` e `ALTRO`, mai nomi veri.
- **Una quota a giocatore finto non si giudica su un seme solo.** Un test
  a seme fisso è deterministico, ma un cambiamento qualsiasi che consuma il
  caso in un altro ordine lo rimescola: una tappa al 46% su ventiquattro
  partite oscilla di dieci punti. L'attesa si misura su molti semi
  (`SEMI=1000 node test/esegui.mjs survivors` sposta tutti i semi del
  file, `test/aiuto/semi.mjs`) e la soglia sta tre deviazioni e mezza
  sotto (`regge` in `misure/survivors`); quello che serve vivo o vinto per
  provare altro (una sosta, un salvataggio) si gioca con l'eroe
  intoccabile. Provato a scegliere un seme che passa: si rompe al
  ritocco dopo. Un generatore come lo xorshift vuole il seme rimescolato,
  o i semi piccoli danno primi numeri vicini a zero (`caso` in
  `survivors/motore/banco.js`).
- **I lenti si dichiarano**: `tempo: 100` (o più) su una riga sua fra i
  primi 1200 caratteri del file. È la stessa riga che allunga il tempo
  massimo (240 s, poi ⏱) e tiene il file fuori da `--svelti`; chi non dice
  niente resta dentro. `test/integrazione/` non entra mai in `--svelti`:
  Chrome da solo costa più di un secondo. Contratto in testa a
  `test/esegui.mjs`.

## Tanti alla volta

I test girano **insieme**: la metà dei processori (dieci su venti), non
più di uno per giga di memoria libera, e mai a macchina piena
(i posti e il carico: [tempi-dei-test.md](tempi-dei-test.md)). Ognuno è
già un processo a sé col suo Chrome e il suo archivio, quindi nessun test
deve saperlo.

- L'uscita di ogni test si stampa intera quando finisce.
- I lunghi partono per primi: il lanciatore ricorda i tempi in
  `node_modules/.cache/educagioco/tempi-dei-test.json`.
- **Il giro non finisce prima del suo test più lungo**: è lì che si guarda
  quando il totale cresce (i numeri in [tempi-dei-test.md](tempi-dei-test.md)).
- `--alla-volta=1` è il lanciatore in fila, con l'uscita dal vivo: per un
  test che si comporta male solo in compagnia. `--alla-volta=12` quando la
  macchina non fa altro.

## In un ambiente pulito

`test/aiuto/browser.mjs` cerca Chrome nei posti soliti, e `CHROME=…` lo
forza. Se non c'è nessun Chrome di sistema: `npx playwright install
chromium`.
