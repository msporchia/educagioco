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
- **Il timeout di 2,5 s in `openDb()` è l'unico modo noto di perdere
  progressi.** Su un telefono lento IndexedDB non risponde in tempo,
  `dbPromise` resta memoizzata su `null` per tutta la vita della pagina e
  si gioca su localStorage; al riavvio `load()` legge prima IndexedDB e
  ignora quella copia, quindi la sessione appena giocata *sembra*
  sparita. I dati veri non vengono sovrascritti, e non c'è avviso a
  schermo. Su desktop non si riproduce.

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
(vedi [test.md](test.md)).
