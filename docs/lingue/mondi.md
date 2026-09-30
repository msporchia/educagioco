# English a mondi — il grafo e le tappe

Stato: **un mondo per anno di scuola** (30 settembre 2026), tutti e cinque
con tappe di parole, tappe di frasi e il loro libro. La carta English apre
la mappa del tesoro. Questo file dice come sono fatti i mondi e le tappe;
il resto sta accanto:

- [frasi.md](frasi.md) — le tappe di frasi, i sei formati, le tessere di troppo, la partita;
- [trappole.md](trappole.md) — le frasi sbagliate: la tabella, perché sbagliano, su cosa pesano;
- [strutture.md](strutture.md) — cosa insegnano quarta e quinta, e le forme dei verbi e degli aggettivi;
- [mondi-vista.md](mondi-vista.md) — la vista; [libro.md](libro.md) — il libro; [da-fare.md](da-fare.md) — cosa manca.

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
| **In quarta** | la giornata · *what time is it?* · ogni giorno (verbi) · sport e musica · *I play every day* · i mestieri · *she plays* · *does she play?* · i mezzi · *I am playing* | In terza |
| **In quinta** | in città · *I was, we were* · fuori città · i verbi che cambiano · *I went, did you go?* · *I played* · chi parla, chi ride (verbi) · *she said, he told me* · *when, while* · alto e veloce · *bigger than, the biggest* · *I am going to* | In quarta |
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
  è dove i libri li usano la prima volta, in quarta quelli di ogni giorno
  per il presente, in quinta quelli irregolari e quelli per raccontare;
- **i mestieri in quarta con *he / she* + la *s***, i luoghi in quinta con
  il passato (*I went to the park*); il perché delle tappe di quarta e
  quinta in [strutture.md](strutture.md);
- **i soldi della quinta non ci sono ancora**: *money, coin, price, cheap,
  expensive* non sono in `data/words.js` (vedi [da-fare.md](da-fare.md)).

**Le tappe si alternano**: una di frasi subito dopo le tappe di parole che
le servono, mai più di quattro di parole di fila, e le frasi dalla seconda
o terza tappa ([frasi.md](frasi.md#le-tappe-di-frasi)). Una tappa di parole
ha **8–10 parole di un argomento solo**, col nome dell'argomento: «I colori»
sono solo colori (`dati/argomenti.js`). La 🏁 ripassa tutto il mondo, e una
storia del libro usa solo quello che il mondo ha insegnato fino alla tappa
da cui si apre.

**L'età.** Ogni tappa porta la sua `portata` dall'anno di scuola (l'anno n
va da 12,5·(n+1) a 12,5·(n+2), cioè dai 5+n ai 6+n anni, sulla scala di
[../apprendimento/eta-e-portata.md](../apprendimento/eta-e-portata.md)), e
nessuno la scrive a mano: la mette `portate()` in `dati/mondi.js`
spargendo le tappe dentro l'anno (25–36 la prima, 38–49 la seconda, 50–61
la terza, 63–74 la quarta, 75–86 la quinta). La carta English la legge come
quella di ogni gioco (`TAPPE_DEL_GIOCO.inglese` in `data/portata-giochi.js`),
e il manifesto non dice più `grandi`: il primo mondo è la prima
elementare. **Chi è più grande trova i mondi degli anni già fatti
«passati»**: un mondo le cui tappe stanno tutte sotto la mira dell'età
(`miraDi` di `data/portata.js`, la stessa di ogni campagna) è aperto per
intero — bandiera, libro e cassetto compresi — da ripassare quando vuole,
**non è vinto**, e apre il mondo dopo come se fosse finito. A otto anni è
passata la prima, a dieci anche seconda e terza. Il passato si decide sul
mondo intero e non tappa per tappa: metà mondo aperto per età e metà no
sarebbe un mondo che non si capisce. Perché non con `scuola:` come le
tabelline: quel campo vuole un sapere di `data/saperi.js` da spegnere, e
«l'inglese della prima» non è una cosa che un genitore spegne; qui l'anno è
già nel dato.

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
Il grado è `floor(10 × media(min(forza, 4) / 4))` su parole, frasi e forma
della tappa; la 🏁 fa la media di tutto il mondo.

Le parole dei dati che non entrano in nessuna tappa stanno nel **📦 cassetto**
del mondo della loro categoria: facoltativo, si apre alla prima tappa vinta
del mondo (o col mondo passato per età), e si gioca coi formati delle parole
di oggi. Nessuna chiave sparisce. I cassetti per anno: animali, colori,
scuola e giochi (`a c s g`) in prima; corpo, persone, cibo, vestiti e
aggettivi (`b k f p j`) in seconda; casa, calendario, natura e numeri (`h d
w n`) in terza, coi verbi; mezzi (`t`) in quarta, luoghi (`y`) in quinta. Le
parole di struttura (`q`) non hanno cassetto. Una categoria sta in un mondo
solo, anche quando le sue tappe sono sparse su tre anni (i numeri, gli
aggettivi). La prova finale è un mondo (`prova-finale`), senza tappe.

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
persone della famiglia (👧 può essere *sister*, *girl* o *friend*), i
mestieri, le ore del giorno (🌅 🌆 🌃), i luoghi (🏛️ e 🏦). Lì la parola si
chiede fra italiano e inglese. **Dai dieci anni (la quinta) niente figure**, in
nessuna tappa (`ETA_SENZA_FIGURE` in `motore/sessione.js`): a quell'età il
disegnino non insegna niente.

## Il libro

Ogni mondo ha **almeno tre storie da leggere**, a pagine, con personaggi
che tornano e domande in italiano; si aprono lungo l'isola, e dal cartello
di fine se ne legge un'altra. Tutto in [libro.md](libro.md); le parole della
storia, le domande nuove e le puntate in [libro-racconti.md](libro-racconti.md).

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
- La parola chiesta conta come **non saputa** nello SRS, anche con i tocchi
  gratis (il gratis riguarda la paga): non si rafforza anche se poi la
  risposta è giusta. Il conto dei tocchi gratis sta sull'elemento SRS della
  parola (`items['en:dog'].tocchi`).
- **Le parole di struttura** (`is`, `the`, `do`…, `dati/glossario.js`) non
  hanno una chiave SRS sua: si imparano con la forma, e toccarle è sempre
  gratis e non segna niente. Un verbo flesso dice la sua base (*went* →
  «andare (al passato)»), un paragone la sua (*bigger* → «più grande»).
- Nel capitolo, ogni parola chiesta oltre le gratuite toglie il guadagno di
  **una** domanda, non di tutte.

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
il resto del suo mondo è vinto. Cosa insegnavano le tappe vecchie sta fermo
in `dati/travaso.js`, le chiavi vecchie restano in `vinte` (niente si butta)
e non si contano più (`quanteVinte`). Il travaso gira all'apertura del gioco
ed è idempotente; il riassunto della home lo applica già in lettura. Il gioco
libero resta a chi l'aveva: «Il gioco di prima», in fondo alla mappa. La
campagna vecchia è un indice in `p.eng` e non si tocca; la nuova sta sotto un
nome suo (`campagne.inglese`: `tappa`, `libera`, `stelle`, `cfg` più `vinte: {
<id tappa>: <quando> }`), quindi un travaso non serve
([mondi-vista.md](mondi-vista.md#il-posto-del-gioco)).

## Dove sta cosa

Tutto in `src/giochi/inglese/`, con la convenzione dei giochi nuovi
([../core/convenzione-giochi.md](../core/convenzione-giochi.md)): `dati/`
sono tabelle, `motore/` gira in Node e non sa di monete né di schermo.

| file | cosa tiene |
|---|---|
| `dati/mondi.js` | il grafo: un mondo per anno, le tappe (parole, frasi, 🏁), le strutture dell'anno per il libro, le categorie dei cassetti, la portata, `CHIAVE` |
| `dati/argomenti.js` | gli argomenti delle tappe di parole: quali parole, i vicini, `figure` |
| `dati/forme.js` | le strutture (`forma:<id>`): parole di struttura, `segni`, `flessione` e «Si fa così» |
| `dati/frasi/<mondo>.js` | le frasi componibili di un mondo (elencate in `dati/frasi.js`) |
| `dati/trappole.js` | la tabella degli errori tipici e le `GEMELLE` |
| `dati/passati.js`, `dati/contrazioni.js`, `dati/glossario.js` | il passato irregolare; forma lunga ↔ contratta; le parole di struttura toccate |
| `dati/capitoli/<id>.js`, `dati/elenchi.js` | una storia del libro per file; personaggi, animali, cibi… |
| `dati/travaso.js` | cosa insegnavano le tappe di prima, per il travaso |
| `motore/testo.js`, `motore/lessico.js` | parole, contrai/espandi, `accetta`; che cos'è una parola, plurali, `traduci` |
| `motore/flessioni.js` | le forme dei verbi (plays, playing, played, went) e degli aggettivi (bigger, biggest) |
| `motore/grafo.js` | mondi garantiti, parole e flessioni note a una tappa, voci di una tappa, `fontiDi`, `gruppoDi`, cassetto |
| `motore/grammatica.js`, `motore/trappole.js` | `sgrammaticata`; le operazioni della tabella, `trappoleDi`, `scegliTrappole` |
| `motore/formati.js`, `motore/sessione.js` | da una frase tutti i formati e il giudizio; una partita |
| `motore/grado.js`, `motore/tocchi.js`, `motore/mappa.js`, `motore/travaso.js` | il grado e `ripresa`; la parola da toccare; aperto, vinto, passato; il travaso |
| `motore/libro.js`, `motore/storie.js` | il libro: variabili, rami, pagine, domande; quale storia si apre |
| `motore/guasti.js` | i controlli su ogni frase e ogni capitolo |

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

**Una partita**: in [frasi.md](frasi.md#linterfaccia-per-la-vista-una-partita).

**Il libro.** `CAPITOLI` da `dati/capitoli.js`; la storia da aprire è
`prossimaStoria(CAPITOLI, c, regole, mondo)` (`motore/storie.js`), poi
`racconta(cap, tiraLaStoria(c, cap))` → `{ titolo, puntata, pagine: [[{ en,
chi, nome, id, i }]], blocchi, righe, storia, domande: [{ tipo, testo, … }] }`
(le puntate tengono le variabili della serie nel profilo). Una domanda si
giudica con `eGiusta(domanda, risposta)`. Un `Tocchi` per tutta la storia,
che le parole della `storia` saltano; una domanda giusta paga
`pagaDelCapitolo(pagine)` quando si risponde, finché
`domandeCheLPagano(giuste, t.aPagamento)` supera quelle già pagate. Al
cartello `segnaLetta(c, id)` e `segnaPuntata(c, cap)`; `puntataDopo(…)` e
`unAltraStoria(…)` dicono quali tasti ci sono.

Nei test: `unita/inglese-mondi`, senza browser: il grafo, gli argomenti
(una tappa di parole ha solo parole del suo argomento e le risposte
sbagliate vengono da lì), l'anno e la portata, i mondi passati, il
travaso, e le frasi ([frasi.md](frasi.md#estendibile)). La vista e i suoi
bersagli `data-…`: [mondi-vista.md](mondi-vista.md#nei-test).
