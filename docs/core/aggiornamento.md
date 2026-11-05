# L'aggiornamento

Come una versione nuova arriva su un telefono: il service worker
(`vite.config.js`), il nastro «c'è una versione nuova»
(`src/aggiornamento.js`), il tasto «↻ cerca aggiornamenti» e lo scarico
dei giochi (`src/scarico.js`).

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
  si teneva da parte. Si scarica una volta sola, come `./` (chi chiede
  `index.html` riceve comunque `./`): scaricarla anche come `./index.html`
  raddoppiava i megabyte senza motivo. Se non arriva, l'installazione
  fallisce e resta il service worker di prima con la sua copia intera —
  un'icona mancante non blocca l'installazione, la pagina sì.

- **Una risposta c'è sempre.** Se la rete tarda e la cache non ha la
  pagina (una copia da 20 MB che il telefono non ha tenuto), si torna alla
  rete senza tetto: con `respondWith` di niente Safari mostra «Impossibile
  caricare. Un ServiceWorker ha intercettato una richiesta e riscontrato un
  errore imprevisto» (lo stesso messaggio del guasto in «cerca
  aggiornamenti», che però aveva un'altra causa: vedi sotto).

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

- **Un'ora sola per build.** Una pubblicazione fa due build (file unico e sito):
  se passano a cavallo di un minuto `giochi.html` e `versione.json` hanno due
  id, la pagina si crede sempre vecchia e «Aggiorna» ricarica all'infinito.
  `pubblica.sh` e la action fissano `EDUCAGIOCO_ORA` per tutti e due.

## «↻ cerca aggiornamenti»

In fondo alla home accanto alla versione, e dietro «Aggiorna» del nastro
(`aggiornaOra`; i passi si vedono in una finestrella al centro dello schermo, sopra tutto, `guide/Nastri.vue`: il cartello in
cima alla home, lontano dal tasto, sul telefono non si vedeva). Chiede al sito che
versione ha, scarica la pagina **a mano** contando i megabyte (il totale è
`peso` in `versione.json`: la lunghezza dichiarata dal sito è quella
compressa), controlla che dentro ci sia l'id promesso, la mette **al posto
della vecchia** nelle cache del service worker e in quella della versione
nuova, e solo allora riparte. Non tocca i progressi; se la rete cade a metà
il gioco resta com'era.
Mentre lavora la ↻ del tasto gira e dice «sto cercando…», e premerlo di nuovo non fa nulla; la finestrella si chiude con
la ✕ (che ferma quello che c'è in corso) o con «Va bene» se è già l'ultima.

- **La pagina si chiede a `./?aggiorna=<id>` e `no-store`**: anche questa
  `fetch` passa dal service worker, che fuori dalle navigazioni risponde
  prima dalla cache, cioè con la copia vecchia.
- **La cache nuova si chiama come la chiama il service worker**
  (`CASSETTO` + id; `unita/aggiornamento` controlla che i due nomi
  combacino): così 7,5 MB si scaricano una volta sola.
- **Si riparte col service worker nuovo già attivo** (`swNuovoAttivo`:
  `update()` e si aspetta `activated`, al più 8 s). Se si installava
  durante la ricarica, Firefox interrompeva la richiesta che il vecchio
  stava servendo: «Impossibile caricare “”. Un ServiceWorker ha
  intercettato una richiesta e riscontrato un errore imprevisto», pagina
  bianca, e con F5 tutto a posto. Succedeva sul server di casa e non sul
  sito finto dei test (8/10/2026).
- **Niente si butta prima di avere in mano il nuovo.** È la differenza con
  «Riscarica il gioco» (`ripara()`, vedi [guasti.md](guasti.md)): giusto
  per una copia rotta, sbagliato per una vecchia.
- Due messaggi che sembrano un guasto e non lo sono: **«hai già
  l'ultima» subito dopo un push** vuol dire che il sito non la serve
  ancora (la action non è finita o non è verde); **«il sito sta ancora
  cambiando versione»** è la rete di GitHub che distribuisce la copia di
  prima per qualche minuto.

## Lo scarico dei giochi

Nel sito spezzato il service worker scarica i giochi quando la pagina glielo
chiede ([avvio-e-memoria.md](avvio-e-memoria.md)). A che punto è lo dice una riga
grigia in fondo alla home (`components/Scarico.vue`), sotto la versione: **solo in
home**, in mezzo al resto e non sopra, perché è roba da sapere e non da guardare:
una striscia fissa copre la barra dei giochi e non ha niente da chiudere. Lo stato
(`src/scarico.js`) e lo scarico vivono fuori dalla home: dentro un gioco si scarica
lo stesso, senza farsi vedere.

- **Perché si pianta.** Un evento del service worker ha un tetto: Chrome lo
  ferma dopo **cinque minuti** esatti (misurato: `--rete 40`, partito a 205 s, fermo
  a 505 s con 451 file su 1316), e il telefono può fermarlo prima, per la memoria
  o per la batteria. Non lo dice a nessuno: lo scarico si interrompe e la pagina
  resta sull'ultimo numero. Chiedere solo all'avvio e al ritorno in primo piano
  non basta: **dentro un gioco non succedono**, e si resta lì più di cinque minuti.
- **Gli altri tre modi di fermarsi**, stesso sintomo: un file che non risponde e
  non dà errore (senza un tetto l'attesa non finisce, e con lei tutti i giochi
  dopo), un file sparito perché il sito è passato a un'altra versione (si aspetterebbe
  un `online` che non arriva, la rete non è caduta) e l'installazione caduta a metà.
- **Il numero si muove a ogni file**, al più ogni 300 ms: contato a gioco finito
  sembra fermo anche quando non lo è (il sotterraneo sono 773 file).
- **Il service worker non è affidabile, la cassa sì.** Ogni file finito resta in
  cassa e non si riscarica: la pagina richiede (`daRichiedere`, ogni 5 s si guarda)
  dopo 20 s di silenzio, anche dentro un gioco, e il service worker riprende da lì.
  Richiedere a uno che sta lavorando non fa niente. A vuoto si aspetta il doppio,
  fino a 5 minuti: un telefono pieno non deve bruciare i dati del piano. Se era ferma
  l'installazione, si rifà `register` + `update`.
- **Ogni file ha un tetto** (`prendi`): 30 s più il file a 10 KB/s, con `fetch` e
  `abort` al posto di `c.add`, che non si interrompe. Guardare i byte che passano
  con un `TransformStream` sarebbe più preciso, ma mette un flusso in più dentro
  `Cache.put`, e su Safari da qui non si prova.
- **Non blocca il gioco**: il lavoro sta nel service worker, e alla pagina arriva un
  messaggio ogni 300 ms che dentro un gioco non ridisegna niente.
- **Il totale è di tutti i giochi**, non di quello che manca: ripartendo la riga
  non torna a zero. Un aggiornamento piccolo si vede come «99%».

Provarlo a mano: `node strumenti/prova-sito.mjs --rete 40 --resta 13` lascia la
pagina ferma e ogni 15 s dice file in cassa, riga e stato del service worker.

Sul telefono resta da vedere quanto vive il service worker e che
`AbortController` fermi davvero un `Cache.put` su Safari; se non lo fa, il tetto
libera l'operaio lo stesso.

## Come si prova

Con un sito vero: `integrazione/aggiornamento` apre `test/aiuto/sito.mjs`
(`dist/` servito come Pages, con `pubblica()` e i giorni storti a comando)
in un `apriTelefono()`, cioè un profilo su disco — quello in incognito la
pagina da otto megabyte non se la tiene, e senza la pagina tenuta il guasto
non si vede. Dettagli degli attrezzi in `test/README.md`.

Lo scarico si prova su `dist-sito/` in `integrazione/scarico`, che il lanciatore
ricompila da sé: service worker fermato via CDP dentro un gioco, file appeso, file
sparito. La regola del silenzio sta in `unita/scarico`.

Nei test: `[data-azione="cerca-versione"]` (`[data-cercando]` mentre lavora), `[data-aggiorna][data-fase=…]`,
`[data-scaricati]`, `[data-azione="aggiorna"]` sul nastro,
`[data-azione="riprova"]`, `[data-scarico]` (la riga in home).
