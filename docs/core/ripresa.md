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
- **Dalla pausa si esce senza ripartire**: il velo copre anche il ←, e ha il
  suo «← esco, la partita mi aspetta» (`[data-azione="esci"]`), che fa quello
  che fa il ← del gioco. Chi è chiamato a tavola spesso ha già premuto ⏸.
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

## Dalla home

«Riprendi da qui» in home ([home.md](home.md)) è già la scelta di
riprendere: la partita a metà riparte senza la carta in mezzo
(`src/giochi/ripresa.js`). La home la chiede (`chiediRipresa`), la carta
del gioco appena ha una ripresa preme da sola «torno da dove ero»
(`riprendiSeChiesta`, in `Ripresa.vue` e nelle carte di sotterraneo e
Survivors), e cambiando schermata la richiesta si scorda (`lasciaRipresa`
in `App.vue`): tornati alla mappa, la carta resta ferma. Senza partita a
metà si apre la mappa come sempre. I giochi con un posto per livello
(Robot, Generale, Passo passo) aprono la mappa, col livello segnato.
Lo prova `integrazione/pozioni-sosta`.

## Chi ce l'ha

- **La sosta con la carta in cima alla mappa**:
  - sotterraneo ([../sotterraneo/regole.md](../sotterraneo/regole.md)), con una
    sosta per avventura e non per gioco ([../sotterraneo/avventure.md](../sotterraneo/avventure.md));
  - Survivors ([../survivors/regole.md](../survivors/regole.md));
  - castello ([../castello/sosta.md](../castello/sosta.md));
  - bancarella ([../bancarella/regole.md](../bancarella/regole.md));
  - Asteroidi ([../asteroidi/sosta.md](../asteroidi/sosta.md));
  - Conta ([../conta/regole.md](../conta/regole.md));
  - Prima e dopo ([../prima-dopo/sosta.md](../prima-dopo/sosta.md));
  - pozioni ([../pozioni/sosta.md](../pozioni/sosta.md));
  - Codice segreto ([../codice-segreto/sosta.md](../codice-segreto/sosta.md));
  - English ed Español, anche i verbi e il gioco di prima (`views/LinguaGame.vue`):
    [../lingue/sosta.md](../lingue/sosta.md).
- **Un posto per livello, senza carta**, perché aprire un livello non butta
  quello di un altro: il Robot (il programma, in archivio
  `costruttore:<id>`), il Generale (il piano, in archivio `generale:<id>`:
  [../generale/lasciare-a-meta.md](../generale/lasciare-a-meta.md)), Passo
  passo (la fila e il gradino del 💡, nella sosta comune; il sentiero ha la
  carta: [../passo-passo/sosta.md](../passo-passo/sosta.md)). La mappa segna
  i livelli lasciati a metà (`[data-a-meta]`).
- **Un mondo che si salva da sé**: la fattoria.
- **Il record dei giochi senza fine** (volo, sentiero, libero del Codice) si
  scrive quando la partita finisce davvero o con «lascio perdere», mai
  uscendo: uscire non chiude la serie.
