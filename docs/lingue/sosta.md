# La tappa lasciata a metà

English ed Español: uscire con ← (o col telefono in tasca) non butta via la
tappa. La regola comune è in [../core/ripresa.md](../core/ripresa.md); qui
quello che è nostro. Una tappa vale `bersaglio` giuste (3-5 minuti): un grande
che chiama a tavola non deve costare quei minuti.

## Cosa si salva

Una sosta per lingua, in `profile.campagne.inglese.sosta` e
`profile.campagne.spagnolo.sosta` (le lingue non si mescolano), scritta da
`motore/sosta.js` — due file fratelli, uno per gioco, come i due `Gioco.vue`.

- **La tappa per id** (`prima-colori`), o il cassetto per mondo: la tabella
  delle tappe sta nel codice e cambia. `leggi` torna `null` se la tappa non
  c'è più, se i grandi l'hanno richiusa, o se un campo non torna: la sosta si
  butta e la tappa ricomincia.
- **Giuste, errori, bersaglio, monete prese e chieste, grado di partenza**: il
  cartello di fine dice il totale della tappa, anche di prima della sosta.
- **La domanda aperta com'era**, risposte sbagliate comprese: rifarla
  ripescherebbe un formato più facile. Più la fila di tessere già messa, le
  parole già toccate (un tocco che costa resta pagato) e il tempo già guardato
  (la fretta non si misura da capo).
- **Quel poco della `Sessione` che non si rifà**: il primo giro, le voci da
  cui si pesca, dove si è nella presentazione dei concetti, le voci
  indovinate e le frasi sbagliate. Si perde la memoria interna del
  `createPicker` (i ripassi dopo uno sbaglio): chi riprende rivede un po'
  meno, mai di più.
- **La pagina di un concetto** aperta, o in arrivo dopo uno sbaglio.

Non si salva il libro dei racconti: si rilegge dall'inizio. Il gioco di
prima (`views/LinguaGame.vue`) ha la sua sosta, in fondo a questa pagina.

## Quando

A ogni domanda che compare, a ogni risposta, a ogni parola toccata; e subito
con ← (`salva({ subito: true })`), su `visibilitychange` nascosta e `pagehide`,
e in `onBeforeUnmount`. Nel momento dell'esito (la risposta è data e pagata)
la domanda non è più aperta: si riprende dalla prossima.

## Niente si ripaga, niente si perde

Le monete e il grado di ogni risposta sono già nel profilo (`incassa`,
`answer`): la sosta non li rifà. Un'ultima giusta data e subito ←, prima del
cartello, **vince lo stesso la tappa**: `vinci()` la registra appena la
risposta è data, `chiudiTappa()` mostra il cartello dopo l'esito. Una tappa
finita toglie la sosta; cominciarne un'altra la butta, ma **prima chiede**
(`Ripresa.vue`, in cima alla mappa).

## La ripresa

Non c'è un campo che scorre: la domanda ripresa aspetta com'era, e il tocco
è cieco per 320 ms come sempre. Non si rilegge ad alta voce. La carta dice la
tappa, l'isola e `✅ giuste di bersaglio`.

## Il gioco di prima: i verbi e il libero

`views/LinguaGame.vue` è un gioco solo per le due lingue, vecchio e a modo
suo: una tappa della campagna (`#verbi`, 12+2i giuste) o il gioco libero, che
non finisce mai e a cui si arriva da «Il gioco di prima» in fondo alla mappa
del tesoro. La sosta è un'altra: stesso spirito, formato suo
(`src/motore/lingua/sosta.js`, un file per tutte e due le lingue; chi legge
passa la sua `L`, e un dato dell'altra lingua si butta).

- **Dove sta**: `profile.campagne['inglese-prima'].sosta` e
  `['spagnolo-prima']`, **a parte** da quella delle tappe a mondi
  (`campagne.inglese.sosta`): le due partite non si buttano a vicenda. Una
  sola per lingua, perché il gioco è uno: una tappa a metà e un libero a metà
  non convivono, e chi comincia l'uno **chiede** prima di buttare l'altro.
- **Cosa si salva**: la tappa (indice **e nome**: uno spostamento della fila
  la fa tornare nulla, non un'altra tappa; `-1` è il libero), giuste, mirate,
  errori e serie, le monete prese e chieste (`borsa(chiave, {dato, chiesto})`
  riparte da lì: il cartello di fine dice il totale) e quanti cartelli
  «+N 🪙» sono già stati detti. **La domanda aperta com'era**: la voce, il
  tipo e le risposte nello stesso ordine (la domanda si rifà dal codice,
  le risposte no: rifarle sorteggerebbe altri distrattori, e un formato più
  facile). Se la risposta è già data, niente domanda: si pesca la prossima,
  come si farebbe dopo i 620 ms (o i 2100 di uno sbaglio).
- **Cosa si perde**: la memoria interna del `createPicker` (i ripassi dopo
  uno sbaglio); chi riprende rivede un po' meno, mai di più. La domanda ripresa
  non si rilegge ad alta voce: si tocca la carta.
- **Niente si ripaga**: ogni parola giusta paga subito e il profilo la ricorda;
  la sosta non rifà né le monete né `answer()`. Non c'è un orologio, quindi la
  ripresa non nasce in pausa: nasce com'era. Il 💡 qui non esiste.
- **Quando**: a ogni domanda che compare e a ogni risposta, con ← (`subito`),
  su `visibilitychange` nascosta e `pagehide`, e in `onBeforeUnmount`. Si
  scrive solo con la partita in corso (non dalla mappa né a tappa vinta) e solo
  se c'è almeno una risposta: aprire e richiudere subito non lascia niente.
  Una tappa vinta toglie la sosta in `tappaSuperata` (vince subito, nessun
  cartello da aspettare); il libero la toglie solo con «lascio perdere».
- **Dove sta la carta**: la tappa della campagna ha una mappa, e la carta
  (`Ripresa.vue`) è in cima, con l'avviso prima di toccare un'altra tappa o il
  libero. **Il libero non ha una mappa sua**: si entra dal bottone della mappa
  a mondi, che non è nostro. Così entrando nel libero con una partita a metà
  `LinguaGame` mostra da sé una schermata con la sola carta («torno da dove
  ero» o «lascio perdere», che comincia un libero nuovo), invece di partire
  in silenzio e buttare la partita.
- **Se il salvataggio non torna** (tappa richiusa dai grandi, voce sparita,
  risposte che non tornano, lingua sbagliata) si butta, e la tappa o il libero
  ricomincia.

Nei test: `[data-ripresa]`, `[data-chiede]`, `[data-azione="riprendi"]`,
`[data-azione="scorda"]`, `[data-azione="comincia"]`,
`[data-azione="riprendi-invece"]`; `[data-tappa-lingua="<i>"]` e `[data-libero]`
nella mappa di `LinguaGame`; `test/unita/inglese-sosta`,
`test/unita/spagnolo-sosta`, `test/unita/lingua-sosta`,
`test/integrazione/inglese-sosta`, `test/integrazione/spagnolo-sosta`,
`test/integrazione/lingua-sosta`.
