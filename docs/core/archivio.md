# L'archivio

Dove finiscono i salvataggi (`src/store/storage.js`), come sono fatti
profili e roster (`src/store/profile.js`), e le trappole che fanno perdere
dati senza che niente sembri rotto.

## I tre livelli

`storage.js` è un archivio chiave → valore che **non lancia mai
eccezioni**: IndexedDB (database `giochi-bambini`, store `kv`) →
localStorage se IndexedDB manca o è bloccato → memoria come ultimo
ripiego (in un iframe sandbox il solo toccare localStorage lancia
`SecurityError`). Le scritture sono ritardate di 350 ms e accorpate, e si
scaricano da sole su `visibilitychange` e `pagehide`.

- **`VERSION` in `storage.js` non si abbassa mai.** `indexedDB.open`
  fallirebbe, e il ripiego su localStorage diventerebbe permanente e
  silenzioso.
- **Non si salva `true` da solo.** `load()` scarta quel valore
  (`fromIdb !== true`: è il segnale di «scrittura riuscita» di `idbRun`),
  quindi `save(chiave, true)` si rilegge `null` — un interruttore che si
  spegne a ogni riavvio. Si salva un oggetto (`{ acceso: true }`, come
  `store/giudizi.js`).
- **Il timeout di apertura non è più definitivo.** Prima, se IndexedDB non
  rispondeva entro 2,5 s (un telefono lento), la promessa di apertura
  restava memoizzata su `null` per tutta la vita della pagina: da lì in
  poi si giocava su localStorage anche se IndexedDB era perfettamente
  funzionante, solo arrivato un attimo tardi. Adesso ogni chiamata registra
  il proprio ascoltatore con il proprio timeout: se `indexedDB.open`
  risponde dopo, l'oggetto database si popola comunque, e le chiamate
  SUCCESSIVE lo trovano già pronto — solo quella che nel frattempo aveva
  già smesso di aspettare resta con quel giro andato sul ripiego.
  Due tempi diversi: **2,5 s** per ogni lettura/scrittura durante il
  gioco (restare reattivi conta più che aspettare), **6 s** per la
  lettura di avvio (`detectBackend()`, la prima cosa che `profile.js`
  chiama in `init()`) — concludere troppo presto che IndexedDB non c'è
  manda un bambino vero a «come ti chiami?». Una volta che
  `detectBackend()` ha aspettato ed è riuscito, le letture del roster e
  del profilo che seguono nello stesso avvio trovano IndexedDB già
  pronto, senza bisogno di un tempo lungo tutto loro.
- **Il ripiego, quando c'è, è sempre il più recente — senza bisogno di un
  segno di tempo.** Ogni scrittura riuscita in IndexedDB ripulisce da sé
  un eventuale doppione lasciato nel ripiego (`eseguiFlush`), e nessun'altra
  strada scrive in IndexedDB: quindi se una chiave è ancora nel ripiego
  vuol dire che nessuna scrittura più recente c'è mai arrivata, anche se
  IndexedDB ha già un'altra copia (più vecchia) della stessa chiave.
  `load()` guarda perciò **prima** il ripiego e cade su IndexedDB solo se
  lì non c'è niente — invertito rispetto a prima, che fidandosi sempre di
  IndexedDB ignorava un ripiego più fresco lasciato da un giro storto.
- **Il travaso, all'avvio.** Se IndexedDB funziona ma in localStorage sono
  rimaste scritture di ripiego — fatte mentre IndexedDB non rispondeva,
  magari una sessione fa — `travasaRipiego()` le sposta lì e basta,
  sovrascrivendo quello che IndexedDB avesse per quella chiave (per la
  stessa ragione di sopra, vince sempre). `load()` concilia già le due
  copie leggendo, ma non le sposta: senza il travaso il doppione in
  localStorage resterebbe lì per sempre.
- **`flush()` è serializzato.** Due `flush()` in corsa non possono più
  scrivere una chiave vecchia sopra una nuova: gira sempre in coda a
  quello prima (una catena di promesse), quindi chi arriva mentre un
  altro giro sta ancora scrivendo aspetta il suo turno invece di
  intrecciarsi. Senza, una scrittura vecchia ma lenta (il ripiego su
  localStorage quando IndexedDB non risponde) poteva arrivare su disco
  DOPO una nuova ma svelta, cancellandola.
- **`navigator.storage.persist()`**, chiesto una volta sola
  (`chiediPersistenza()`, in `profile.js` all'avvio) e mostrato nella
  pagina dei genitori vicino al salvataggio su file
  (`components/genitori/Archivio.vue`): senza, su Safari non installato i
  dati possono sparire dopo una settimana senza giocare. Non è mai un
  blocco: se il browser non lo supporta o rifiuta, l'archivio funziona
  lo stesso, e la pagina lo dice.

## Profili e roster

- Ogni bambino è una chiave `profilo:<id>`; il roster è
  `state.giocatori` (chiave `giocatori`), e `ultimo-giocatore` ricorda chi
  giocava. Il profilo si riscrive intero a ogni `persist()`: per questo le
  cose che crescono ogni giorno stanno fuori (sotto).
- **I nomi dei bambini non stanno nel codice.** La migrazione enumera le
  chiavi `profilo:*` invece di cercare un nome: se una modifica sembra
  chiedere il nome di un bambino in una stringa, la soluzione è enumerare.
  Un archivio vuoto manda all'onboarding.
- **Gli id dei contenuti non si rinominano** (`en:dog`, `math:7x8`,
  `frase:…`): sono le chiavi dello stato SRS, e cambiarli fa tornare una
  parola «mai vista».
- **Un gioco non aggiunge campi al profilo**: l'avanzamento sta in
  `profile.campagne[<chiave>]` (vedi [convenzione-giochi.md](convenzione-giochi.md)).
- **I contatori si toccano solo con `segna(chiave, n)` e
  `segnaBest(chiave, valore)`** di `store/profile.js`: scrivono in `totals`
  e fanno scattare da soli traguardi e festa (vedi [progressi.md](progressi.md)).

- **`profile.aspetto`** (il personaggio scelto per la mappa) non nasce in
  `blank()`: si calcola alla lettura (`aspettoDi()`), ricadendo sul primo
  `PERSONE` disponibile se manca o se punta a un personaggio che l'atlante
  non ha più. Così un profilo vecchio, o uno importato da un'altra casa,
  non ha bisogno di nessuna migrazione.

## Fuori dai profili

Chiavi di casa, non di un bambino: stanno fuori perché dentro morirebbero
con il profilo, o lo gonfierebbero a ogni scrittura. **Un dato fuori dai
profili non se ne va da solo**: chi elimina un bambino deve portarselo via
(`scordaSessioni`).

| chiave | cosa | dove si legge |
|---|---|---|
| `pin-genitori` | il codice dei grandi | [`../genitori/`](../genitori/README.md) |
| `incidenti` | gli ultimi guasti | [guasti.md](guasti.md) |
| `giudizi`, `giudizi-accesi` | il quaderno dei giudizi sulle domande | [`../apprendimento/`](../apprendimento/README.md) |
| `sessioni:<id>` | quanto ha giocato, e a cosa | [sessioni.md](sessioni.md) |
| `cestino` | le ultime copie dei profili cancellati | [`../genitori/`](../genitori/README.md) |
| `note-lette`, `posta-avvisi`, `posta-detti` | la posta dei grandi | [`../genitori/`](../genitori/README.md) |
| `costruttore:<id>` | i programmi del costruttore, con una `v` loro | [`../costruttore/`](../costruttore/README.md) |

Nei test: `apriGioco` semina un giocatore di prova da sé, gli id di prova
sono `GIOCATORE` e `ALTRO`, e `giocatori: null` prova il primo avvio vero
(vedi [test.md](test.md)). Per l'IndexedDB e il localStorage finti che
provano il timeout non definitivo, il travaso e il flush in coda:
`test/aiuto/archivio-finto.js`, `test/unita/archivio`. Lo stato di
`navigator.storage.persist()` nella pagina dei genitori:
`[data-persistenza]` col suo `data-concessa` (vedi anche
[`../genitori/cestino-e-posta.md`](../genitori/cestino-e-posta.md) per
«Rimetti da un file»).
