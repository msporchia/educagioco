# Uscire non butta via la partita

Quando un grande chiede «vieni a tavola», il bambino deve poter lasciare il
gioco senza pentirsene: la partita lasciata a metà si ritrova al rientro,
com'era. Lo chiedono i bambini, a partire dal castello, e vale per ogni
gioco che ha una partita più lunga di un paio di minuti.

## Come è fatta

- **Una sosta per gioco**, non per tappa: `profile.campagne[<chiave>].sosta`,
  con `sosta()`, `salvaSosta()` e `buttaSosta()` di `src/giochi/campagne.js`.
  Il formato è del gioco, in un `motore/sosta.js` (o `motore/castello/sosta.js`)
  con tre funzioni: `scrivi` (torna `null` a partita finita, e la sosta si
  toglie), `leggi` (rimette la partita, o dice che non torna) e `dice` (cosa
  scrive la mappa, senza aprire la partita).
- **Si scrive solo quello che è successo**: la tappa, la carta e le regole si
  rifanno dal codice. La tappa si ritrova per chiave, non solo per indice.
- **`VERSIONE` sale quando un campo cambia significato**; un salvataggio che
  non torna si butta e la tappa ricomincia. Una partita persa è un
  dispiacere, una ripresa con campi che non tornano è un gioco rotto.
- **Quando si scrive**: col ← (`subito`), su `visibilitychange` nascosta e
  `pagehide` (su un telefono l'app non si chiude, sparisce), e prima di
  smontare la schermata (`onBeforeUnmount`: dopo, il campo non c'è più). I
  giochi lunghi scrivono anche ogni pochi secondi.
- **Si riprende fermi**: la partita ripresa nasce dietro il velo della pausa
  ([interfaccia.md](interfaccia.md#la-pausa-una-sola)) e riparte al tocco.
- **Le monete già prese restano nel conto della partita**: `borsa(k, da)` in
  `src/store/varieta.js` riparte da quello che la sosta aveva incassato, così
  il cartello di fine dice il totale.

## In cima alla mappa

`src/giochi/Ripresa.vue`, uno per tutti i giochi nuovi: la carta con dove si
era («⚔️ ondata 2 di 5 · ❤️ 4 · ⚡ 35») e due tasti, «torno da dove ero» e
«lascio perdere quella partita». Toccare un'altra tappa con una sosta aperta
**chiede prima** («Hai una partita a metà»): il dito di un bambino sulla
mappa ci finisce comunque, e l'avviso detto dopo non serve. Sotterraneo e
Survivors hanno la loro carta, venuta prima e con il loro stile.

Nei test: `[data-ripresa]`, `[data-chiede]`, `[data-azione="riprendi"]`,
`[data-azione="scorda"]`, `[data-azione="riprendi-invece"]`,
`[data-azione="comincia"]`.

## Chi ce l'ha

- **Sì**: sotterraneo ([../sotterraneo/regole.md](../sotterraneo/regole.md)),
  Survivors ([../survivors/regole.md](../survivors/regole.md)), il castello
  ([../castello/sosta.md](../castello/sosta.md)). Il costruttore e la fattoria
  salvano a modo loro (il programma di ogni livello, il mondo).
- **Non ancora**: le voci sono in [da-fare.md](da-fare.md#la-partita-lasciata-a-metà).
