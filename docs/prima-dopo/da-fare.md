# Prima e dopo: da fare

Voci aperte sulle storie disegnate e sul cassetto dei concetti. Il perché
e le regole stanno in [disegni.md](disegni.md).

- **Trentotto storie su cinquanta sono ancora a emoji**, e tre categorie
  non ne hanno nemmeno una disegnata: **trasformazione**, **costruzione**,
  **viaggio**. Sono anche quelle dove restano le forzature (🥣 per
  l'impasto del pane, 🏰 per il castello di sabbia). Una categoria che
  comincia a disegnarsi ne vuole almeno due, se no `unita/prima-dopo` è
  rosso.
- **Il cassetto non sa disegnare quello che serve a queste**: oggi ha otto
  luoghi, tre persone e trentotto cose (`src/giochi/prima-dopo/scena/`).
  Un viaggio vuole un treno e una valigia, una costruzione mattoni e
  attrezzi.
- **Le abitudini travestite da nessi** (`vestirsi`, `lavarsi-mani` in
  `dati/storie.js`) si potano quando si disegnano, non prima, o il gioco
  si accorcia.
- **Promuovere il cassetto a `src/grafica/` per le icone del lessico.** Le
  figure di «Prima e dopo» stanno ancora in
  `src/giochi/prima-dopo/scena/`; per usarle nelle domande di lingua il
  passo è spostare `scena/persone.js` in `src/grafica/personaggi/` (un
  import, non una riscrittura) e allargare il cassetto ai concetti che
  l'emoji non sa dire: tempo, ora, minuto, settimana, mese, anno, le
  facce, i verbi. Finché non c'è, quelle parole restano senza figura (è
  citato anche in testa a `src/giochi/prima-dopo/dati/scene.js`).
- **Le metafore convenzionali del lessico** (l'elenco in
  [disegni.md](disegni.md)) sono lasciate apposta: da riguardare a schermo,
  e da disegnare se danno fastidio.
