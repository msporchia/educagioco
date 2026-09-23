# I tempi dei test — un censimento

## Settembre 2026: il doppio dei file, e otto alla volta

Il censimento più sotto è di quando i file erano 65, ed è rimasto come
storia. Rimisurata a fine settembre 2026, in fila come allora, la suite
fa **142 file** e costa **751 secondi** (12 min 31 s): 46 s le 110 unità,
704 s i 32 file di integrazione. I «cinque minuti e mezzo» scritti in
giro erano già falsi prima di toccare qualcosa.

In quei dodici minuti la macchina è quasi sempre ferma: un test di
integrazione aspetta un'animazione, un salvataggio a scatto ritardato,
un cliente che arriva. Da qui la scelta di farli girare **insieme**
(`test/esegui.mjs`, «quanti alla volta») senza toccare i test: ognuno era
già un processo a sé, col suo Chrome e il suo archivio vuoto. Prima si è
cercato cosa potessero pestarsi — porte, file, cartelle — e l'unica cosa
era in `integrazione/genitori`, due file in `/tmp` con un nome fisso:
dentro un giro non si incrociano (lo stesso test non gira due volte), ma
due giri lanciati insieme da due worktree sì, e adesso ha una cartella
sua.

| | in fila | 4 alla volta | 8 alla volta | 12 alla volta |
|---|---|---|---|---|
| `npm run test:tutto` (142 file) | 751 s → 682 s | 178 s | **89–91 s** | 66 s |
| `npm run test:browser` (32 file) | 704 s → 635 s | | 85 s | |
| `npm test` (110 unità) | 48 s | 24 s | 25 s | 24 s |
| `npm run test:svelto` (104 file) | 15 s | | 4 s | |
| memoria al massimo (PSS) | | 2,1 GB | 3,9–4,3 GB | 5,2 GB |
| CPU occupata, media e picco | | 22% · 58% | 34–38% · 75–80% | 71% · 93% |

La CPU è in percento dei venti thread di un i5-13600KF con 30 GB, e la
memoria è quella di tutto l'albero dei processi, Chrome compresi. Le
colonne in parallelo sono misurate dopo le due correzioni qui sotto;
quella in fila, prima e dopo — la fattoria da sola vale i settanta
secondi di differenza.

**Otto è il punto in cui il giro è già sette volte e mezzo più corto e
la macchina resta usabile per altro** — l'editor, un altro worktree, un
altro giro di test. A dodici si guadagnano altri venti secondi, ma la
CPU arriva al 93% e la memoria a cinque giga: si chiede a mano
(`--alla-volta=12`) quando non si sta facendo nient'altro. Sotto i
sedici processori le corsie sono la metà di quelli che ci sono (la CI,
che ne ha quattro, ne usa due).

### Il pavimento è il test più lungo

In parallelo il totale non è più la somma: è il più grande fra il test
più lungo e la somma divisa per le corsie. Il primo giro a otto è
durato 126 secondi, e 120 li faceva un file solo:

- **`integrazione/fattoria`, da 126 a 54 s.** Per arrivare alla
  bancarella del mercato provava la tela riga per riga dall'angolo in
  alto a sinistra, un tocco da 300 ms ogni 36×24 pixel — e la bancarella
  è posata al centro della terra di partenza, dove la telecamera si
  apre: la trovava al 166° tocco, dopo 69 secondi. La griglia è la
  stessa, percorsa dal centro in fuori, e la trova al primo.
- **`integrazione/survivors`, 24 s — ma una volta su qualche giro 206.**
  La sezione delle foto gioca finché l'orologio della partita non scende
  a un certo punto; se l'eroe muore, l'orologio si ferma sotto il
  cartello finale e il ciclo faceva trecento giri a vuoto per chiamata.
  Il test passava lo stesso, quindi in fila non se n'era accorto nessuno.
  Adesso si ferma a partita finita.

Tolti quei due, il giro a otto lo decide la somma (circa 715 secondi di
test su otto corsie) più che un file solo, e i quattro più lunghi sono
`torri`, `genitori`, `animali` e `fattoria`, attorno al minuto. Per
`npm test` il pavimento è `unita/survivors` — 22–25 secondi, quanto
tutte le altre 109 unità insieme — e 13 di quei secondi sono la sezione
che gioca le nove tappe: in un file suo, `npm test` scenderebbe verso i
13 secondi.

### Due rossi che non dipendono dalle corsie

- `integrazione/bancarella` è caduto una volta, **in fila**, su «in
  fondo alla campagna qualcuno vuole due o tre cose uguali»: i clienti
  si pescano a caso, e quella volta nessuno dei dieci ne voleva più di
  una.
- `integrazione/sotterraneo` cade circa una volta su cinquanta su «dopo
  un tocco l'eroe si è mosso». Tocca a 70 pixel dall'eroe nei quattro
  versi, e la mappa è a caso: in 48 giri si sono viste fino a tre
  direzioni chiuse su quattro. Non è il carico — un tocco buono sposta la
  scena in 200 ms anche con otto test insieme, contro gli 800 che il
  test concede.

## Il censimento di prima

Questo file misura, non giudica a occhio. Ogni test del progetto (65 file,
50 in `test/unita/`, 15 in `test/integrazione/`) è stato lanciato **tre
volte**, prendendo il minimo: la stessa macchina fa altro mentre gira una
prova, e il minimo è la stima più onesta di quanto costa il test in sé,
non quanto ha rubato lo scheduler quella volta lì.

La misura è diretta — `node <file>`, con la cartella del progetto come
cwd, lo stesso identico comando che `test/esegui.mjs` lancia internamente
— e non passa dal filtro per nome del lanciatore. Il motivo è nel
paragrafo [Un dettaglio del lanciatore](#un-dettaglio-del-lanciatore) più
sotto: il filtro non incrocia gruppo e nome, e otto file hanno lo stesso
nome in `unita/` e in `integrazione/` (`animali`, `bancarella`, `calcolo`,
`codice-segreto`, `generale`, `inglese`, `pozioni`, `spagnolo`) — passare
solo il nome li lancia insieme, e la misura ne uscirebbe falsata.

`dist/index.html` è stato ricompilato una volta sola all'inizio, poi ogni
misura è passata con `--niente-build` (concettualmente: la build non è
un costo del test, è un costo del lanciatore, e non va contato 65 volte).

### Il costo fisso di avviare Node

`node -e ""` ripetuto cinque volte, minimo: **14 ms**. È il pavimento
sotto cui nessun file può scendere qualunque cosa faccia. Per i test più
svelti della suite — i 26 file di `unita/generale/*/` (azioni, distanze,
domande, elementi, messaggi, l'orchestratore), che misurano fra 17 e 30
ms — il costo *proprio* del test, tolto il pavimento, è quindi **3–16
ms**: indistinguibile dal rumore di misura. Non c'è niente lì dentro da
rendere più veloce; l'unico modo di riguadagnare quella decina di
millisecondi per file sarebbe lanciarne di più nello stesso processo, e a
conti fatti (vedi sotto) non vale la candela.

Il pavimento resta un pezzo grosso del conto per un'altra manciata di
file appena sopra i 26 — `capsule` e `incidenti` (18 ms, il 78% è solo
Node), `srs` (24 ms), `piano-generale` (27 ms) — e diventa davvero
trascurabile solo sopra i cento millisecondi scarsi: da `codice-segreto`
(321 ms, il pavimento pesa il 4%) in su, e su qualunque test di
integrazione (il più svelto, `campagna-mate.test.mjs`, ci mette 1,55 s),
è rumore nel rumore.

### Il totale

| | file | somma dei minimi |
|---|---|---|
| `test/unita/` | 50 | **12,2 s** |
| `test/integrazione/` | 15 | **327,5 s** (5 min 27 s) |
| **tutto** | 65 | **339,7 s** (5 min 40 s) |

I 12,2 secondi di `unita/` combaciano con quello che dice
`test/README.md` ("una decina di secondi") — buon segno, vuol dire che la
macchina di misura non era né più lenta né più veloce del solito. I 5 minuti
e mezzo di `integrazione/` sono il motivo per cui quella cartella non gira
mai mentre si scrive codice: è un tempo da caffè, non da compilazione.

Divisione per taglia: **39 file su 65 (60%) stanno sotto i 100 ms**, 33
sotto i 50. La lunghissima coda sotto il decimo di secondo è tutta in
`unita/`: fra i 15 file di `integrazione/` il più svelto costa 1,55 s,
perché aprire Chrome — non i secondi passati dentro — è già più caro di
qualunque cosa un test unitario faccia.

### I cinque più lenti

Tutti e cinque sono test di integrazione: nessun test unitario avvicina
anche solo il più svelto dei cinque.

| test | tempo | perché |
|---|---|---|
| `integrazione/pozioni.test.mjs` | **72,9 s** | gioca tre tappe intere dal `window.__poz` dell'app vera — fino a 40–60 ingredienti dosati uno per volta, ognuno con un'attesa reale (70 ms normale, 1000 ms quando il cliente è esigente e legge la mancia) |
| `integrazione/animali.test.mjs` | **60,2 s** | 58 attese fisse (`attendi`/`waitForTimeout`) che sommate — contando i cicli, non le righe — passano i 30 s: animazioni della cameretta, negozio, macchina delle sorprese, più il resto in interazioni reali (click, fill, innerText) su un bundle di 3,7 MB |
| `integrazione/torri.test.mjs` | **60,1 s** | un'attesa di 9000 ms **dichiaratamente** esagerata ("ben oltre il limite, ma sta calcolando"), più 1600+1400 ms di partita vera, **raddoppiati** perché il flusso gira due volte (mobile e desktop) |
| `integrazione/bancarella.test.mjs` | **30,7 s** | stessa forma di `pozioni`: fino a 400+ giri di cliente vero attraverso l'API del gioco, con attese da 20 a 60 ms fra un gesto e l'altro |
| `integrazione/genitori.test.mjs` | **19,0 s** | 33 attese fisse (13,6 s) più diversi `semina`/`azzera`, ognuno un `page.reload()` reale: è la schermata che salva, esporta, ripristina e cancella — quella dove un errore costa mesi di partite, quindi si prova col ciclo vero e non a scorciatoie |

Da soli, i primi tre (pozioni, animali, torri) valgono **193 s su 327**,
il **59%** dell'intera cartella `integrazione/`.

### Legittimo o accidentale

**Legittimo**, e non c'è molto da stringere: `pozioni` e `bancarella`
giocano tappe vere attraverso l'API dell'app, non a colpi di dito, ma
proprio per questo ogni passo aspetta uno stato reale (`pronto()` in
`pozioni` sonda ogni 50 ms finché il banco è libero) — è il prezzo di
misurare il gioco vero invece di fidarsi a occhio, la stessa filosofia di
`unita/survivors` e `unita/dungeon` ma dentro il browser. `genitori`
merita i suoi reload: è letteralmente lo schermo con più da perdere del
gioco. `integrazione/torri-equilibrio.test.mjs` (14,6 s) è il caso più
onesto di tutti — il commento in testa al file racconta la propria
ottimizzazione: giocava a velocità 6× e ci metteva 34 s a partita, ora
gira a 60× e "dura dieci volte meno". Non c'è niente da chiedere a un
test che si è già preso cura di sé stesso.

**Probabilmente accidentale**, in due punti precisi:

- in `torri.test.mjs` i 9000 ms di attesa sono un margine dichiarato
  come "ben oltre il limite": bastano a dimostrare che l'onda non è
  avanzata, ma non è chiaro che serva un margine 3-4 volte più largo del
  necessario invece di controllare, poniamo, a 3000 ms — dimezzerebbe
  la spesa di quella singola prova senza indebolire l'asserzione, e con
  il flusso raddoppiato (mobile+desktop) il risparmio si raddoppia con
  lui;
- in `animali.test.mjs`, 58 attese fisse sono molte più di quante ne
  abbia qualunque altro file (il secondo più carico, `genitori`, ne ha
  33): non tutte proteggono un'animazione — alcune sono probabilmente
  margine di sicurezza impilato su margine di sicurezza. Non è un test
  da riscrivere, ma se un giorno deve tornare più svelto è il primo
  posto dove guardare.

### La soglia di `--svelti`

`--svelti` tiene fuori `test/integrazione/` a prescindere — corretto,
nessun file di quella cartella scende mai sotto 1,5 s — e, dentro
`unita/`, chi dichiara `tempo: 100` o più fra i primi 1200 caratteri del
file. Il numero serve **due scopi insieme**: è il tetto oltre cui il
lanciatore ammazza un test appeso, *e* il segnale con cui `--svelti`
decide chi escludere. Il problema è che i due scopi vogliono numeri
diversi — un tetto di sicurezza ha senso largo, un segnale di "questo è
lento" ha senso onesto — e oggi vince sempre il primo:

| test | dichiara | ci mette davvero | dentro `--svelti`? |
|---|---|---|---|
| `unita/survivors.test.mjs` | 420 | 5,33 s | no (giustificato: è il più lento di `unita/` per un buon margine) |
| `unita/saperi.test.mjs` | 100 | 1,52 s | no |
| `unita/castello.test.mjs` | 100 | 1,07 s | no |
| `unita/bancarella.test.mjs` | 100 | 865 ms | no |
| `unita/quiz.test.mjs` | 120 | 575 ms | no |
| `unita/dungeon.test.mjs` | 300 | 276 ms | no |
| `unita/livelli.test.mjs` | *600 (falso)* | 109 ms | no |

Tutte e sei le dichiarazioni "vere" (cioè non contando `livelli`, che è
il caso a parte del prossimo paragrafo) sono più lente sulla carta di
quanto siano nella realtà — di un fattore che va da 66× (`saperi`) a
1087× (`dungeon`). Ma il punto per `--svelti` non è il fattore, è il
tempo assoluto: cinque di questi sei — `saperi`, `castello`,
`bancarella`, `quiz`, `dungeon` — restano sotto 1,6 secondi reali, e non
avrebbero nessun motivo pratico di stare fuori dal giro veloce. Solo
`survivors` ci mette davvero un tempo che si sente scrivendo codice
(5,3 s): la sua esclusione è l'unica delle sette, oggi, che fa quello per
cui `--svelti` esiste.

#### Il bug: la regex legge la prosa, non solo la dichiarazione

`livelli.test.mjs` è un caso a parte, ed è quello che l'utente aveva già
notato. Il file **non dichiara più** `tempo: 600` — il commento in testa
lo dice esplicitamente, raccontando che la vecchia dichiarazione è stata
tolta perché stantia. Ma lo fa citandola fra virgolette:

```
Un decimo di secondo per NOVE livelli, [...] Qui c'era
scritto «tempo: 600», sei secondi di budget: una dichiarazione
rimasta da quando questo banco faceva un'altra cosa.
```

La regex del lanciatore, `/tempo:\s*(\d{1,4})/`, non sa distinguere una
dichiarazione da una citazione: trova "tempo:" seguito (dopo spazi o
**a capo**) da cifre, e prende quelle. Il risultato, verificato lanciando
la stessa funzione del lanciatore sul file:

```
tempo letto dal lanciatore per livelli.test.mjs: 600 -> escluso da --svelti? true
```

Il file che *dice* di essere stato guarito resta escluso da `--svelti`
esattamente come prima della cura — il commento che spiega la correzione
è quello che la vanifica.

**Non è un caso isolato.** Lo stesso `\s` che attraversa gli a capo fa lo
stesso scherzo, innocuo per un pelo, in `calcolo.test.mjs`: la frase "se
il gioco insegna o fa perdere tempo:" è seguita, due righe più sotto, da
una lista numerata che comincia con "1. il grafo dei prerequisiti…" — la
regex legge `tempo: 1`, un "tempo dichiarato" che nessuno ha mai scritto.
È innocuo solo perché 1 sta sotto la soglia di 100; se quella lista
iniziasse con un numero a due o tre cifre coincidenti, o se un giorno la
prosa di un altro file mettesse "tempo:" prima di un numero grande per
puro caso, lo stesso errore silenzioso escluderebbe un test veloce da
`--svelti` senza che nessuno lo scriva apposta.

In tutti gli altri sette file la dichiarazione vera è sempre da sola,
sulla propria riga (`   tempo: 100` oppure `tempo: 900 */` a fine
blocco) — mai in mezzo a una frase, mai su più righe. Una regola più
stretta — non attraversare gli a capo, e magari pretendere che
`tempo:` sia la prima cosa non-spazio della riga — riconoscerebbe le
sette dichiarazioni vere esattamente come oggi e smetterebbe di leggere
la prosa.

### Un dettaglio del lanciatore

Il filtro per nome di `test/esegui.mjs` include un test se il gruppo
combacia *esattamente* oppure se il nome lo contiene — ma non incrocia
le due cose. Otto coppie di file condividono lo stesso nome fra
`unita/` e `integrazione/` (`animali`, `bancarella`, `calcolo`,
`codice-segreto`, `generale`, `inglese`, `pozioni`, `spagnolo`): lanciare
`node test/esegui.mjs animali` esegue **entrambi**, non solo quello che
probabilmente si intendeva mentre si lavora su uno dei due. Non è un
guasto — nessuno dei due si aspetta di girare da solo con quel comando —
ma è una sorpresa facile da non notare, soprattutto quando i due hanno
tempi molto diversi (`unita/animali` 444 ms, `integrazione/animali` 60,2
s): un `node test/esegui.mjs animali --niente-build` lanciato pensando di
provare solo i dati sembra restare appeso, e in realtà ha aperto Chrome.

### Le categorie di oggi, e quella che arriva

Oggi la suite conosce due generi: `unita/`, senza schermo, e
`integrazione/`, dentro Chrome. La soglia che li separa nella pratica non
è la cartella ma il costo di aprire un browser: anche il file di
integrazione più economico (`campagna-mate.test.mjs`, 1,55 s) costa più
di qualunque file di `unita/` tranne `survivors`. La divisione è giusta
com'è: nessun test di `integrazione/` potrebbe mai qualificarsi per
`--svelti` nemmeno se lo dichiarasse, ed è corretto che sia così.

**I test grafici** che stanno per arrivare — una tavola che disegna
tutti i pittori di `src/grafica/*` in tutti gli stati, da guardare a
occhio dopo una modifica — non sono un terzo genere di *test*: sono un
genere di *strumento*, e il progetto ne ha già uno identico nello spirito.
`test/README.md` lo dice a chiare lettere per gli screenshot: "nessun test
guarda i pixel", le foto servono a un occhio umano, e per questo non
girano da sole ma dietro `--scatti` o `npm run scatti`. Una tavola di
pittori è esattamente questo, spostato da "controllare uno schermo dopo
una modifica" a "controllare un disegno dopo una modifica": niente da
asserire, tutto da guardare.

Il posto naturale non è quindi un `.test.mjs` nuovo — il lanciatore lo
raccoglierebbe e lo conterebbe come test, ma un file che non ha nulla da
verificare con un codice di uscita ≠ 0 non è un test, è una schermata
finta. Il posto coerente con quello che il progetto già fa è uno script a
sé sotto `strumenti/` (sul modello di `strumenti/scatti.mjs`), con un suo
`npm run`, che scrive un foglio HTML o un mazzo di PNG in una cartella che
git ignora — fuori dal giro di `test/esegui.mjs` e quindi fuori da ogni
discorso su `--svelti`. Se in più serve una guardia automatica — "nessun
pittore lancia un'eccezione mentre disegna", zero asserzioni sul
contenuto — quello sì può essere un `unita/pittori.test.mjs` da pochi
millisecondi, ma è un test diverso con uno scopo diverso, non lo stesso
strumento con due cappelli.

### Proposte, con i numeri sopra

**Restituire sei file a `--svelti`.** Dei sette file che oggi dichiarano
un `tempo:`, sei possono rientrare nel giro veloce. Cinque per una
ragione semplice — `bancarella`, `castello`, `dungeon`, `quiz` e `saperi`
dichiarano fra 100 e 300 ma ne impiegano fra 0,28 e 1,52 secondi reali:
togliere la dichiarazione (si torna al default, il tetto resta comunque
240 s) li rimette dentro senza perdere nessuna rete di sicurezza — se un
giorno smettono davvero di essere istantanei, lo si scoprirà lo stesso,
fermati dal tetto di 240 s. Il sesto è `livelli.test.mjs`, che va per la
via della correzione della regex descritta sopra (o, più a buon mercato,
riscrivere la frase che cita "tempo: 600" in un modo che non somigli a
una dichiarazione — per esempio staccando il numero dalle due parole con
un trattino, o scrivendolo in lettere). `survivors` resta fuori: è
l'unico dei sette per cui il numero, anche abbassato, avrebbe senso
restare sopra soglia.

**Dimezzare il margine in `torri.test.mjs`.** L'attesa di 9000 ms per
provare che l'onda non è avanzata durante un calcolo è dichiaratamente
esagerata; un valore fra 3000 e 4000 ms lascerebbe lo stesso margine di
sicurezza rispetto a un singolo fotogramma perso, e con il test che gira
due volte (mobile e desktop) il risparmio si raddoppia con lui: 10-12 s
recuperabili sul totale di 60.

**Un comando per i test "che giocano davvero" dentro il browser**, non
un terzo gruppo di cartelle. `pozioni`, `animali`, `bancarella` e `torri`
insieme valgono 224 s su 327 (il 68%) di `integrazione/`: chi tocca lo
schermo dei genitori o l'onboarding non dovrebbe pagare quel prezzo per
vedere se la sua modifica ha rotto qualcosa. Lo stesso meccanismo di
`tempo:`/`--svelti` già usato in `unita/` si presta uguale qui: un
`tempo:` dichiarato nei quattro file più cari, e un `--svelti` che dentro
`integrazione/` smetta di essere "sempre tutto fuori" e diventi "fuori chi
supera la soglia" — lasciando dentro nove degli undici file restanti,
tutti sotto i 15 s (`avvio`, `calcolo`, `campagna-mate`, `generale`,
`monete`, `inglese`, `spagnolo`, `torri-equilibrio`, `app`); `genitori`
(19,0 s) e `codice-segreto` (17,7 s) resterebbero comunque fuori, ma quella
è una scelta da rivedere caso per caso, non un effetto automatico della
soglia.

**I test grafici, come strumento in `strumenti/`, non come test.** Vedi
sopra: uno script con `npm run`, non un file raccolto da
`test/esegui.mjs`.

### Una nota, non un guasto da inseguire

Tre file falliscono nello stato attuale del repository:
`test/unita/generale.test.mjs`, `test/unita/livelli.test.mjs` e
`test/integrazione/generale.test.mjs`. Non è un effetto della misura: il
motore del Generale è a metà di un riassetto (`src/motore/generale/` sta
sostituendo `src/motore/generale.js`), e questi tre file provano codice
che quel riassetto sta ancora spostando. È un rosso atteso, non una
scoperta di questo censimento — che qui riguarda solo i tempi, non la
correttezza — e i tempi misurati (118 ms, 109 ms, 1,98 s) restano validi
comunque: un test che fallisce in fretta ha comunque un costo reale da
contare.
