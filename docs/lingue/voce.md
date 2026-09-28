# La voce

Come si pronunciano le parole di English e Español, e come si incidono
quelle nuove.

## Le regole

- **Niente `speechSynthesis`.** La sintesi del telefono dà una voce
  diversa su ogni apparecchio, e su Linux esce `espeak`, che non si
  capisce: per chi impara, una pronuncia sbagliata fa più danno del
  silenzio.
- **Le parole sono incise una volta sola** con una voce neurale e infilate
  nel file HTML: stessa voce su ogni telefono, anche senza rete. Inglese
  con una voce britannica (`en-GB-SoniaNeural`), spagnolo con una
  **boliviana** (`es-BO-SofiaNeural`): è la lingua della mamma.
- **Sprite, non una clip per file.** L'intestazione di un file audio pesa
  quanto mezzo secondo di parlato: le clip sono concatenate per categoria
  in ventiquattro sprite per lingua, e un indice dice a che secondo
  comincia ciascuna (`src/data/voci.js`, `src/data/voci-es.js`, generati:
  non si modificano a mano).
- **`src/voce.js` è l'unico punto che le riproduce**: decodifica lo sprite
  che serve — al massimo tre alla volta (`QUANTI_TENERNE`), per non
  riempire la memoria del telefono — e ne suona la fettina giusta.
- **Le due lingue hanno indici separati**: `no` e `piano` esistono in tutte
  e due e vanno dette con la bocca giusta.
- **Una parola senza clip non rompe niente**: quel turno si legge, e le
  domande in ascolto per lei non escono.
- Le due incisioni pesano insieme circa 2,2 MB: è il prezzo di una
  pronuncia che non dipende dal telefono.

## Incidere

```
npm run voci                              le parole inglesi nuove
npm run voci -- --lingua es               le parole spagnole nuove
npm run voci -- --elenca                  le voci disponibili per quella lingua
npm run voci -- --voce en-GB-LibbyNeural  rifà tutto con un'altra voce
npm run voci -- --bitrate 12k             file più leggero, qualità più bassa
npm run voci -- --tutto                   reincide da capo
```

- Serve solo dopo aver aggiunto parole ai file dei vocaboli
  (`strumenti/incidi-voci.mjs`). La prima volta scarica `edge-tts` in
  `.venv-voci/` (vuole rete) e usa `ffmpeg` per accorciare e comprimere.
- **È incrementale**: le clip già incise restano in `.voci-cache/` e
  `.voci-cache-es/`, quindi dieci parole nuove costano dieci parole.
  Cambiando voce o velocità la cache si invalida e si rifà tutto.
- **Se in coda dice «non incise: …», si rilancia lo stesso comando**:
  capita quando il servizio taglia le ultime richieste di una serie lunga.
