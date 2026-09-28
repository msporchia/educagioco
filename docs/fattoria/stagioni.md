# Le feste: zucche a Halloween, neve a Natale

La fattoria si addobba da sola in due periodi dell'anno, e in quei giorni
il baule vende due o tre cose della festa. Il codice è
`dati/stagioni.js` (puro) e la scena `scena/tela.js`.

La fattoria è il posto dove si torna tutti i giorni, e tutti i giorni è
uguale a ieri: aprire il gioco a dicembre e trovare la neve è **una cosa
che succede** senza che nessuno l'abbia comprata.

## Le finestre

- **Halloween dal 20 ottobre al 2 novembre, Natale dal 6 dicembre al 6
  gennaio**, estremi compresi (`FINESTRE`, `[mese, giorno]`): si
  ritoccano lì e in nessun altro posto, e i test provano i bordi leggendo
  quella tabella.
- **In ora locale** (`stagioneDi(data)`, `getMonth`/`getDate`): la vigilia
  alle 23:30 è ancora la vigilia anche se a Greenwich è domani. Natale
  scavalca l'anno, ed è il caso che una finestra scritta «da ≤ giorno ≤ a»
  sbaglia. `guastiDelleStagioni` è rosso su una data impossibile o su due
  finestre che si accavallano.
- **`#stagione=natale`** (o `halloween`) nell'indirizzo le accende fuori
  stagione, per guardarle a settembre.

## Gli addobbi che compaiono da soli

- A Halloween 🎃 sparse sul prato, 🕸️ e 🦇 agli angoli delle case; a Natale
  i fiocchi che cadono, una crosta bianca sui tetti e sulle chiome,
  chiazze di neve sull'erba, lucine gialle e rosse sotto le grondaie, ⭐ e
  🔔 sui tetti e un 🎄 accanto agli edifici.
- **Niente si tinge e non c'è nessuno sprite nuovo**: è un velo sopra il
  disegno di sempre, più qualche emoji posata dove c'è posto.
- **La scena non sa che giorno è.** `addobbiStagionali(stagione, { libere,
  edifici, seme })` riceve le celle libere e le cose posate e torna
  `[{ testo, x, y, misura, ondeggia? }]`; la tela riceve
  `quadro.stagione` e quella lista, e disegna. È la regola «chi gioca non
  disegna» applicata al calendario.
- **Effimeri**: non si salvano, non si posano, non occupano niente (una
  bestia ci cammina attraverso, una cosa posata li copre). **Il seme è il
  giorno** (`semeDelGiorno`): la stessa giornata è uguale a sé stessa, e
  domani le celle cambiano.
- Solo le cose alte almeno due celle hanno un tetto da addobbare: una
  panchina addobbata è una panchina coperta.

## Le voci della festa nel baule

- Solo nella finestra compare la linguetta **Feste**, con le voci
  `stagione:` del catalogo: zucche intagliate e teschio (Halloween),
  l'albero con le lucine (Natale), a prezzi da cosetta (🪙6–30,
  `unita/stagioni-fattoria`).
- **Quello che si è comprato resta**, posato tutto l'anno o nel baule:
  una zucca pagata a ottobre che si dissolve a novembre romperebbe la
  regola «niente si perde».
- **Non sono premi di livello** e non entrano nella fila del livello: si
  aprono con la finestra, non spendendo.

Nei test: `unita/stagioni-fattoria`, `integrazione/fattoria-stagioni`.
