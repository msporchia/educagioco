# L'aggiornamento

Come una versione nuova arriva su un telefono: il service worker
(`vite.config.js`), il nastro «c'è una versione nuova»
(`src/aggiornamento.js`) e il tasto «↻ cerca aggiornamenti».

## Il service worker

- **La pagina la serve prima la rete, il resto prima la cache.** Con la
  cache prima anche sul documento, una versione con un guasto si
  ripresenta identica a ogni avvio, e dal telefono non c'è ricarica che la
  smuova.
- **Nella cache non entra niente di quello che passa.** La cache di una
  versione (`educagioco-<id>`, `CASSETTO` + id) la scrivono solo
  l'installazione e «cerca aggiornamenti», che la pagina la controlla
  prima. Provato un `put` nel `fetch`: non riusciva quasi mai (il
  `clone()` arrivava quando `respondWith` si era già preso il corpo), e
  riparato riscriverebbe 7,5 MB a ogni apertura mettendo una pagina non
  controllata sopra quella controllata. `integrazione/aggiornamento`
  (passo 10) guarda che resti tolto.
- **L'installazione chiede la pagina `no-cache`**, una volta sola e
  obbligatoria: GitHub Pages fa tenere la pagina dieci minuti, e senza il
  service worker nuovo si metteva in casa la pagina vecchia che il browser
  si teneva da parte.

## Il nastro

La pagina già aperta resta quella di prima, e su un telefono installato
può restare aperta per giorni. `aggiornamento.js` sorveglia (all'apertura,
al ritorno in primo piano, al ritorno in home, ogni mezz'ora) e accende un
ref.

- **I timer di una pagina in background sono congelati**, su iOS come su
  Android: una PWA installata sta quasi sempre in background (la si
  riprende dallo switcher, non la si riapre), quindi il controllo ogni
  mezz'ora scatta solo per chi gioca da mezz'ora di fila — il momento
  peggiore per dirgli di ricaricare. Ecco perché contano i tre momenti
  espliciti (apertura, primo piano, home) e non solo il timer.

- **Lo decide il sito, non il service worker**: `versione.json` (letto
  `no-store`) contro `__VERSIONE__`. Legato all'installazione di un service
  worker sbagliava nei due versi: parlava a chi aveva già la pagina fresca
  e taceva per sempre con chi aveva un service worker nuovo con dentro la
  pagina vecchia.
- **Non ricarica da solo** (un reload in mezzo a un'ondata butta via la
  partita) e **non compare dentro un gioco**: vive solo in home.
- Il cartello sta in `guide/Nastri.vue`, accanto a quello
  dell'installazione. La regola di quest'ultimo — non installata ·
  telefono · non già rifiutato — è `serveIlNastro` in `guide/aiuto.js`,
  pura perché altrimenti si proverebbe solo con un telefono in mano
  (`apriGioco(browser, { userAgent })` è nato per questo).

## «↻ cerca aggiornamenti»

In fondo alla home accanto alla versione, e dietro «Aggiorna» del nastro
(`aggiornaOra`, il foglio è `guide/Aggiorna.vue`). Chiede al sito che
versione ha, scarica la pagina **a mano** contando i megabyte (il totale è
`peso` in `versione.json`: la lunghezza dichiarata dal sito è quella
compressa), controlla che dentro ci sia l'id promesso, la mette **al posto
della vecchia** nelle cache del service worker e in quella della versione
nuova, e solo allora riparte. Non tocca i progressi; se la rete cade a metà
il gioco resta com'era.

- **La pagina si chiede a `./?aggiorna=<id>` e `no-store`**: anche questa
  `fetch` passa dal service worker, che fuori dalle navigazioni risponde
  prima dalla cache, cioè con la copia vecchia.
- **La cache nuova si chiama come la chiama il service worker**
  (`CASSETTO` + id; `unita/aggiornamento` controlla che i due nomi
  combacino): così 7,5 MB si scaricano una volta sola.
- **Niente si butta prima di avere in mano il nuovo.** È la differenza con
  «Riscarica il gioco» (`ripara()`, vedi [guasti.md](guasti.md)): giusto
  per una copia rotta, sbagliato per una vecchia.
- Due messaggi che sembrano un guasto e non lo sono: **«hai già
  l'ultima» subito dopo un push** vuol dire che il sito non la serve
  ancora (la action non è finita o non è verde); **«il sito sta ancora
  cambiando versione»** è la rete di GitHub che distribuisce la copia di
  prima per qualche minuto.

## Come si prova

Con un sito vero: `integrazione/aggiornamento` apre `test/aiuto/sito.mjs`
(`dist/` servito come Pages, con `pubblica()` e i giorni storti a comando)
in un `apriTelefono()`, cioè un profilo su disco — quello in incognito la
pagina da otto megabyte non se la tiene, e senza la pagina tenuta il guasto
non si vede. Dettagli degli attrezzi in `test/README.md`.

Nei test: `[data-azione="cerca-versione"]`, `[data-aggiorna][data-fase=…]`,
`[data-scaricati]`, `[data-azione="aggiorna"]` sul nastro,
`[data-azione="riprova"]`.
