# L'editor della lezione

Come la maestra prepara una lezione (`Lezione.vue`, `SceltaEsercizio.vue`); il quaderno che la tiene è [quaderno.md](quaderno.md),
la lezione a blocchi [lezione.md](lezione.md), cosa si può chiedere [esercizi.md](esercizi.md).

## I blocchi

Una carta per blocco, nell'ordine: **il gioco, cosa si fa e quanto è difficile** (`SceltaEsercizio.vue`,
[esercizi.md](esercizi.md)) e, solo se c'è più di un blocco, **quando si passa al blocco dopo** (nell'ultimo «Per il
bambino la lezione finisce»): una riga sola, «Al blocco dopo si passa quando lo dice
la maestra», con «Cambia» che apre le scelte (prima «Lo dici tu», poi giuste, domande, minuti con le parole del gioco:
[lezione.md](lezione.md)), ognuna col suo «?»; scegliendo una soglia il numero riparte dal suo `base`. Ogni blocco si
sposta su e giù e si toglie (l'ultimo che resta no); «＋ Aggiungi un blocco», fino a `MAX_BLOCCHI`, ripete l'esercizio
dell'ultimo e passa quando lo dice la maestra. Sotto l'ultimo una riga dice cosa succede
dopo («Hai finito!», si resta lì fino ad «Avanti tutti», o si ricomincia). «In tondo» è una spunta.

- **Il gioco ha il suo disegno** (`TesseraGioco.vue`): l'icona dipinta della copertina di casa (`comune/icone-giochi.js`; nella
  build il plugin `iconeGiochi` di `vite.scuola.config.js` ci lascia solo quelle della scuola, ~300 KB invece dei 2,7 MB
  di tutte le copertine), un foglio per le domande. La scelta è un carosello con il video del gioco: sotto, «La scelta del gioco».
- **Cosa si fa** sono tessere: le materie (se il gioco ne ha più d'una) e le voci di quella materia, solo quelle che il
  gioco sa fare. La spiegazione della voce c'è solo quando c'era da scegliere.
- **La domanda vera** per ogni voce accesa (`Esempio.vue`): a destra delle sue scelte, nella scheda che vedono i bambini
  (`quiz/Domanda.vue`, con le figure), pescata come la pescherà il gioco; ci si può rispondere, e «Un'altra» ne pesca una
  nuova. Provato un riassunto a parole: le risposte disegnate diventavano «(una figura)». I giochi col contenuto loro hanno le scelte come **schede in griglia** (`Righe.vue`):
  l'anteprima in alto (dove c'è), il nome, il caso concreto scritto sotto (cosa chiede, cosa fa il bambino) e in fondo
  **▶ Prova**, che apre la pagina dei bambini con quel gradino o capitolo solo (`provaEsercizio` di `utili.js`): per
  capirne la difficoltà giocandolo. Prima erano righe a tutta larghezza col nome solo, poi con l'anteprima a destra: lo
  spazio si sprecava.
- **Una lezione nasce di un blocco, e senza scelte fatte**: nessun gioco, nessuna domanda (`NIENTE` di `esercizi.js`, che
  non è valido e non si salva; la lezione dice «scegli il gioco», poi «scegli cosa si chiede»). Va finché la maestra la
  chiude («Si gioca finché non chiudi la lezione»): niente «quando si passa» né «in tondo». «＋ Aggiungi un blocco dopo»
  fa la fila, e **anche il blocco nuovo nasce vuoto** (prima copiava le scelte di quello sopra). Sotto l'esercizio non si
  ripete il riassunto delle scelte: resta solo l'avviso quando così non chiede niente.
- **Niente «una cosa sola» dove ne vanno bene tante**: il risultato e il numero nascosto delle tabelline sono due spunte
  (tutte e due: si mescolano, il modo `misti`), come le tabelline e le domande di un modulo.
- **«Prova questo blocco»** su ogni blocco: la prova (sotto) con quel blocco solo.
- **«Prova la lezione»** (nell'editor, e «Prova» su ogni scheda dell'inizio): apre in una scheda nuova la pagina dei
  bambini con `#prova=<la lezione>` (`linkDiProva` del quaderno, `provaDa` di `bambini/giro.js`), che la fa partire su quel
  PC come «Senza lezione», senza codice e senza servizio. Una striscia gialla dice che è una prova, ha «Blocco dopo» al
  posto del menu col codice e «Chiudi la prova»; la prova non si ricorda.
- **Il «?»** (`Aiuto.vue`) accanto alle scelte meno chiare: un tocco apre due righe, un tocco fuori le chiude (col dito
  niente tooltip).
- **Quanto è difficile**: tre tasti con tre tacche che si riempiono, e una riga su cosa cambia.

## L'editor a passi

Chiesto dall'utente il 21 novembre 2026: «troppo visibile troppo presto». **Presa una decisione, si richiude in una riga**
(`Fatta.vue`: cosa si è scelto e «Cambia», `[data-fatta=<passo>]` e `[data-cambia=<passo>]`) sopra quella da fare:

1. **A che gioco?** il carosello (sotto); scelto col tasto, diventa la riga col suo disegno.
2. **Cosa si chiede**: l'elenco delle domande o il contenuto del gioco. Qui le scelte sono tante, quindi si chiude con
   **«Fatto»** (`[data-azione="cosa-fatta"]`, spento finché non chiede niente). In Passo passo prima **chi gioca**, che parte
   non scelto (la `vuota` della scheda) e scelto diventa anche lui una riga; poi i gradini.
3. **Quanto è difficile?** (solo i giochi che la reggono): nessuna delle tre è scelta, una scelta chiude il passo.

Fatti tutti (`[data-chiuso]`), **il blocco resta le sue righe**, ognuna col suo «Cambia»: il gioco col suo disegno, cosa si
chiede (intero, anche su due righe), quanto è difficile e quando si passa. Una lezione salvata si apre così. Provato un riassunto
in una riga con «Modifica»: non si capiva che le scelte si cambiano una per una (segnalato dall'utente il 22 novembre). In cima, tre righe dicono a cosa
servono i blocchi (un riscaldamento, l'esercizio vero, un bonus per chi finisce prima).

## La scelta del gioco

Chiesto dall'utente il 22 novembre 2026: toccando un gioco lo si sceglieva subito, e non si poteva sapere cosa fa. Ora
**toccare mostra, il tasto sceglie**:

- **Un carosello**: i giochi in una fila che scorre di lato (col dito, o con le frecce ‹ › che passano al gioco accanto e lo
  portano in mezzo). Quello guardato è bordato (`guardata` di `TesseraGioco.vue`), quello scelto resta `aria-pressed`.
- **Sotto, il gioco guardato**: **qualche secondo del gioco vero** che gira da solo (`AnteprimaGioco.vue`), accanto a cosa
  fa il bambino, cosa gli si può chiedere (per i giochi col contenuto loro **cosa allena**, `allena` della scheda: Passo passo e
  il Robot dicono il percorso dalle sole frecce ai cicli e al «se») e **«Scegli <gioco>»** (`[data-azione="scegli-gioco"]`; «Tieni» se è già quello).
  «Cambia» riapre il carosello sul gioco scelto. Vale anche per «Senza lezione» sul PC dei bambini, che usa la stessa scelta.
- **I video sono registrati dai giochi veri** (`npm run anteprime scuola`, `strumenti/anteprime-scuola.mjs`): la pagina dei
  bambini costruita, i dieci giochi dalla prova del computer ([prova-computer.md](prova-computer.md): i suoi esercizi e i
  piloti che li fanno muovere), «Le domande» da una lezione di prova. Lo screencast di Chrome, tagliato sulla tela del gioco
  (se sta in una colonna, i giochi in verticale) e fatto MP4 da ffmpeg: 4 secondi, 480 px, 12 immagini al secondo, ~1 MB in
  tutto, in `maestra/anteprime-giochi.js` (GENERATO). Castle Battle e il sotterraneo si registrano nella scena al
  massimo (nella base i primi secondi sono una mappa ferma o il cartello della cripta), il castello dopo otto secondi (al
  massimo le torri fermano i mostri all'ingresso). **Survivors si prende dalla clip del README** (`docs/img/clip-survivors.webp`, `npm run scatti`): registrato qui era una marea
  di mostri addosso all'eroe fermo, la clip è una partita già avanti giocata col dito; si saltano la pausa della ripresa e la
  barra di casa con le monete (`DAL_README`). `--giochi=castello,robot` rifà solo quelli. Non entra in `npm run anteprime`
  senza nome: un video rifatto non è mai uguale, e il file cambierebbe a ogni giro.
- **Chi ha chiesto meno movimento** (`prefers-reduced-motion`) vede il video fermo, coi comandi per farlo partire.

Nei test: `unita/scuola-esercizi` (ogni gioco ha il suo video), `integrazione/scuola` (toccare mostra e non sceglie, il
video c'è, il tasto sceglie). Bersagli: `[data-scegli-gioco]`, `[data-scheda-gioco]` con `data-guardato`, `[data-anteprima]`,
`[data-azione="scegli-gioco"]`, `gioco-prima`, `gioco-dopo`.
