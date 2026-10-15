# Da fare

- **Tarare davvero**: un comando (`npm run tara:giardino`, sul modello di `tara:arena`)
  che misura le nove tappe con i tre giocatori e scrive la taratura; oggi i
  numeri di piante e zombi sono a occhio.
- **Il giocatore finto deve usare il gelo** (e il capo): senza, cipressi e cripta
  non sono misurati.
- **La grafica dipinta**: oggi sono emoji. Prima in codice, poi dipinto dopo il sì.
- **I piccoli (4-6 anni)**: nessuna consegna iconica pensata; per ora il gioco
  non ha `piccoli: true` e i conti sono quelli dell'età.
- **Il premio in monete** è una moneta per conto giusto (`PAGA.mossa`): da rivedere
  con `docs/apprendimento/calibrazione.md` guardando quanto dura una tappa.
- **Provarlo coi bambini**: è `sperimentale` finché non lo si è fatto.
- **La bravura vive nell'arena** (`giochi/arena/bravura.js`): se un terzo gioco
  la usa, va portata in `src/quiz/`.
