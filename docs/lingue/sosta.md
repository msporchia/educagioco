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

Non si salva il libro dei racconti (si rilegge dall'inizio) né il gioco di
prima (`views/LinguaGame.vue`, a modo suo).

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

Nei test: `[data-ripresa]`, `[data-chiede]`, `[data-azione="riprendi"]`,
`[data-azione="scorda"]`, `[data-azione="comincia"]`,
`[data-azione="riprendi-invece"]`; `test/unita/inglese-sosta`,
`test/unita/spagnolo-sosta`, `test/integrazione/inglese-sosta`,
`test/integrazione/spagnolo-sosta`.
