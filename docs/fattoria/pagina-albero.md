# La pagina dell'albero

«🌳 Come si fa»: il consiglio srotolato, cioè tutta la strada di una merce
dal campo alla cosa finita, e a che punto si è. Il codice è
`dati/albero.js` (puro, non sa niente di Vue) e `viste/Albero.vue`.

Con catene di quattro-sei fasi il prossimo passo da solo non basta più:
chi vuole un maglione deve vedere tutta la strada.

## Dove si apre

**Sempre con una merce già scelta**: mandare in un albero intero a cercare
la riga giusta rimette il compito che la pagina doveva togliere. Gli
ingressi sono i posti dove si vede una merce che manca:

- **il silo** (`viste/Granaio.vue`): premendo una merce, il tasto 🌳 Come
  si fa (`[data-azione="albero"]`);
- **la bancarella, le botteghe, la mongolfiera**: premendo una casella
  spenta;
- **la macchina**: premendo l'ingrediente che manca a una ricetta.

Non dal `?`, che è la guida e non cambia con la partita; non dal baule, che
vende cose e non merci. **Non c'è una vista «tutto l'albero»**: sarebbe un
poster di quaranta nodi su un telefono, e un bambino non cerca l'albero,
cerca il maglione.

## Cosa mostra

```
   💜 Maglione alla lavanda
   ┌ tintoria  ✓ ce l'hai · 6 min
   ├ 🧥 Maglione        ×1   ✓ ne hai 1
   │  ┌ sartoria  🛒 non ce l'hai · 🪙250        ← il tasto apre il baule
   │  └ 🧵 Stoffa       ×2   ne hai 1, manca 1
   │     ┌ telaio  ⏳ pronto fra 4 min
   │     └ 🧶 Lana      ×4   ✓ ne hai 3
   │        o nella conigliera
   └ 🫙 Tintura         ×1   manca
      ┌ tintoria
      └ 💐 Lavanda      ×2   🌱 sta crescendo · 3 min
```

- **Solo quello che è sbloccato.** Se l'unica strada arriva dopo, la riga
  dice «arriva al livello N» e si ferma lì: il futuro sta nella pagina dei
  livelli. Deciso anche di non mostrare il livello dopo in grigio:
  l'albero diventerebbe grande e confonderebbe. Le merci nuove le riceve
  da solo, perché legge `RICETTE`, `COLTURE` e `CATALOGO`.
- **Una strada sola per riga**, e sotto la macchina una riga piccola che
  dice le altre («o nella conigliera»). Due strade affiancate raddoppiano
  le righe e nessuno le confronta; un tastino per cambiare strada sarebbe
  un secondo modo di navigare dentro una colonna. Basta sapere che l'altra
  strada c'è.
- **La strada scelta è quella che il tasto compra**: la decide `megliaDi`
  (`dati/mercato.js`), la stessa funzione del consiglio — prima quella di
  cui hai già gli ingredienti, poi la più economica, poi la più svelta.
  Provate due regole diverse: la colonna mostrava «Recinto degli alpaca ·
  🪙330» e il tasto apriva il baule sull'ovile. `unita/albero` lo controlla
  a sette livelli.
- **Si vede che è un albero**: rotaie `┌ ├ │ └` fatte coi bordi e non coi
  caratteri di riquadro, che cambiano altezza fra un font e l'altro e si
  spezzano. Un rientro solo non basta: con sei fasi due rami in parallelo
  si leggevano come una lista.
- **La macchina sta fra la merce e i suoi ingredienti**, con quattro stati:
  ✓ ce l'hai · ⏳ lavora (coi minuti, e con la fila «ne fa 2») · 🛒 da
  comprare (col prezzo e il tasto che apre il baule su quella voce) · 🎁
  nei premi (col tasto che porta lì). Sono i quattro casi di `acquisto()`
  del consiglio.
- **Un ingrediente dice quanti ne hai contro quanti ne servono**: ✓ verde
  se basta, ambra se manca; per una coltura lo stato del campo (🌱 cresce,
  🧺 pronto, nessun campo).
  - **`servono` si moltiplica lungo la catena**: maglione 1, stoffe 2, lane
    4, foraggi 4, erbe 8. Provato passando giù la quantità della ricetta
    com'era: una lista della spesa sbagliata, e al ribasso.
  - **Il granaio è uno solo**: si spartisce fra i rami in ordine di lettura
    (`spartisci`), se no due rami che vogliono grano dicono tutti e due
    «✓ ne hai 3» mentre insieme ne chiedono 6.
- **Quello che manca si apre**: ogni riga ambra porta la stessa `azione`
  del consiglio (`apri`, `compra`, `premio`). Il pannello è `{ tipo:
  'albero', prodotto }` accanto a `granaio` e `mercato`, e le azioni
  passano dallo stesso `esegui(azione)` di `Gioco.vue`.
- **Si rifà da solo ogni cinque secondi** finché è aperto
  (`rinfrescaLAlbero`, dal battito della scena dove stanno già bisogni e
  stagione): è l'unico pannello fatto di orologi, e un `⏳ pronto fra 4
  min` che non scende dice il falso proprio a chi è lì per saperlo.

## Il contratto

```
alberoDi(f, prodotto, ora = Date.now()) → nodo | null

nodo = {
  prodotto, nome, emoji, pezzo,
  servono,   // quanti ne servono IN TUTTO per la radice
  ho,        // quanti ne restano in granaio per questa riga
  stato: 'ok' | 'manca' | 'arriva',
  arriva: null | livello,
  via: null | {
    che: 'coltura' | 'ricetta', id, minuti, costo,
    macchina: null | { id, nome, stato: 'ok'|'lavora'|'compra'|'premio', manca, prezzo },
    campo:    null | { stato: 'libero'|'cresce'|'pronto'|'nessuno', manca },
    alternative: [{ id, nome, dove: { nome, la } }],
    azione: null | { che: 'apri'|'compra'|'premio', … },
  },
  rami: [ nodo, … ],   // gli ingredienti della strada scelta
}
```

`righeDi(nodo)` aggiunge per la colonna `livello`, `ultimo`, `guide[]`,
`guideSotto[]` (le rotaie). Tre garanzie:

- **la profondità è finita** (`PROFONDITA`): un anello nelle tabelle si
  ferma con un nodo `'arriva'` invece di avvitarsi;
- **le foglie sono colture** o nodi «arriva», mai una ricetta a metà;
- **la strada è quella del consiglio e del mercato**, così premio,
  consiglio e albero raccontano la stessa fattoria.

## Le prove

- `unita/albero` — per ogni merce e ogni livello fino a `ULTIMO`: solo
  ricette e macchine aperte; profondità entro `PROFONDITA`; foglie colture
  o «arriva»; con un granaio seminato a mano `ho`/`servono` e gli stati
  tornano; l'azione di ogni riga ambra è una di quelle che `Gioco.vue` sa
  eseguire; una merce non ottenibile dice il livello giusto.
- `unita/consiglio` — la prima riga ambra dell'albero e `comeAvere`
  propongono la stessa azione.
- `integrazione/albero` — apre il silo, preme la stoffa, preme 🌳, preme la
  riga del telaio e trova il baule aperto sul telaio; legge i `×N` lungo la
  catena. **La dispensa si cerca dal centro, non a tappeto**: `posa()`
  prova a spirale dal centro del mondo e la telecamera si apre lì, quindi
  gli stessi punti ordinati per distanza dal centro trovano la dispensa in
  sei secondi invece di quattro minuti (960 tocchi da 320 ms).

Nei test: `[data-albero]`, `[data-albero-di]`,
`[data-albero-riga="<merce>"]`, `[data-albero-macchina="<id>"]`,
`[data-albero-azione]`, `[data-albero-perche]`, `[data-albero-altrove]`, e
negli ingressi `[data-albero-apri="<merce>"]`.
