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
- **Il ripiego vince solo per le chiavi che questo codice ha scritto lui
  stesso e non ha ancora ripulito — non per qualunque cosa capiti a stare
  in localStorage.** Ogni scrittura riuscita in IndexedDB ripulisce da sé
  un eventuale doppione lasciato nel ripiego (`eseguiFlush`): per QUELLE
  chiavi, se sono ancora nel ripiego, nessuna scrittura più recente c'è
  mai arrivata in IndexedDB, quindi vincono senza bisogno di un segno di
  tempo. Ma un telefono vero può avere in localStorage chiavi vecchie di
  mesi — `profilo:g1`, il roster — nate quando IndexedDB falliva *prima*
  che questa pulizia esistesse, con IndexedDB nel frattempo tornato a
  funzionare e pieno di scritture più fresche: fidarsi ciecamente del
  ripiego anche lì avrebbe fatto perdere i progressi veri. Un registro
  (`__ripiego__`, un elenco di chiavi in localStorage, escluso da
  `chiavi()`) distingue le due cose: ci entra una chiave quando la sua
  scrittura cade sul ripiego, ne esce quando una scrittura successiva
  arriva in IndexedDB. **Solo chi è nel registro** fa vincere il ripiego
  in `load()` senza aspettare IndexedDB; per tutte le altre chiavi vale la
  regola di sempre — IndexedDB prima, localStorage come ultima spiaggia
  solo se IndexedDB non ha proprio niente.
- **Il travaso, all'avvio**, con la stessa distinzione. Se IndexedDB
  funziona ma in localStorage sono rimaste scritture di ripiego,
  `travasaRipiego()` le sposta lì: quelle **tracciate** senza guardare
  cosa c'è già (vincono per costruzione, vedi sopra); quelle **non
  tracciate** solo per riempire un buco — una chiave che in IndexedDB non
  c'è affatto — mai sopra a un valore che ci fosse già. `load()` concilia
  già le due copie leggendo con la stessa regola, ma non le sposta: senza
  il travaso il doppione in localStorage resterebbe lì per sempre.
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
(`scordaSessioni`, `scordaIstantanee`).

| chiave | cosa | dove si legge |
|---|---|---|
| `pin-genitori` | il codice dei grandi | [`../genitori/`](../genitori/README.md) |
| `incidenti` | gli ultimi guasti | [guasti.md](guasti.md) |
| `giudizi`, `giudizi-accesi` | il quaderno dei giudizi sulle domande | [`../apprendimento/`](../apprendimento/README.md) |
| `sessioni:<id>` | quanto ha giocato, e a cosa | [sessioni.md](sessioni.md) |
| `istantanee:<id>` | una fotografia a settimana di quanto sa, per le frecce di «Come va» | [`../genitori/come-va.md`](../genitori/come-va.md) |
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
