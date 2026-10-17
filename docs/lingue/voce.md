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

## Quando non si sente

Il browser non dice se il volume del telefono è a 0 o se si è in silenzio:
non si può saperlo, quindi non lo si indovina. Si fa così:

- **Un tasto sempre a portata** (`components/NonSiSente.vue`), sotto ogni
  domanda che dipende dalla voce (ascolto, parola da sentire; non nelle
  frasi in cui la voce non serve). «🔇 non posso ascoltare» apre due strade:
  **«Continua senza audio»** spegne il suono del profilo (come il 🔊 in barra)
  e il gioco cambia domanda — da lì le domande in ascolto non escono più;
  **«Non si sente: riprova»** scrive nel registro e ripete la parola.
- **Il registro** (`src/audio-log.js`): scrive nel libretto dei guasti
  (`incidenti`, vedi [../core/guasti.md](../core/guasti.md)), una cosa sola
  per i grandi: ogni guasto visto da `voce.js` (nessun
  `AudioContext`, decodifica fallita, contesto non `running` dopo
  `resume()`, orologio audio fermo mezzo secondo dopo l'avvio) e ogni
  pressione di «non si sente», con lo stato del contesto, il browser e gli
  ultimi 24 fatti. Si legge e si copia da *Genitori → Se qualcosa si è rotto*; le righe in
  più stanno in `dettagli` e vanno nella copia.
- **iPhone col silenzioso**: `navigator.audioSession.type = 'playback'` (Safari 16.4+) fa
  suonare l'audio anche col tasto laterale attivo; altrove il silenzio non si può rilevare.
- **Il primo tocco sveglia il contesto** (`audio.js`): la pronuncia che parte
  da sola dopo 260 ms non è un gesto, e un contesto nato fuori da un tocco su
  telefono resta `suspended`/`interrupted`. È l'ipotesi principale delle
  tracce che non partono; il registro dirà se è quella.
- Una domanda in ascolto non esce mai a suono spento (`haVoce` lo sa in tutti
  e tre i giochi di lingua).
- Nei test: `[data-azione="non-si-sente"]`, `nss-riprova`, `nss-senza`.
