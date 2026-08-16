/* ═══════════════════════════════════════════════════════════════════
   LE SCENE DISEGNATE — il prototipo che sostituisce le emoji

   ── PERCHÉ ESISTE QUESTO FILE ──
   Una storia fatta di emoji non si sceglie: si cerca. Si guarda cosa il
   set mette a disposizione e ci si sforza di incastrarci un prima e un
   dopo, e quando l'incastro non torna si accetta un passo che «più o
   meno» va bene — 🧴 per lo shampoo, 🏰 per il castello di sabbia. Il
   criterio diventa quali emoji stanno insieme senza stonare, che è un
   criterio di inventario e non di didattica. Il costo grosso però non
   sono i passi zoppi: è tutto quello che con le emoji **non si può
   raccontare**. Un bambino che cade e si sbuccia il ginocchio. Uno che
   rompe qualcosa e lo dice. Uno che viene consolato. Sono le storie che
   a quattro anni servono di più — causa ed effetto sulle *persone* — e
   non ce n'era nemmeno una.

   Qui una scena è una **scheda**: dove siamo, chi c'è, che faccia fa,
   cosa tiene in mano. Il disegno lo fa `scena/`, con lo stesso pittore
   di tutto il resto del progetto.

   ── COM'È FATTA UNA SCHEDA ──
     luogo   una voce di `scena/cose.js` → LUOGHI (prato, cortile,
             salotto, bagno): due o tre fasce di colore, niente di più
     cose    la fila di quello che ci va sopra, **nell'ordine in cui si
             disegna**: chi viene dopo copre chi viene prima. Non c'è
             nessun ordinamento per profondità, ed è voluto — a questa
             taglia le figure sono due o tre, e un elenco ordinato a
             mano è più corto da leggere di qualunque regola.

   Una persona è una cosa come le altre (`che: 'bimba'`), e porta
   `faccia`, `dir`, `passo`, `inclina`, `ginocchio`.

   ── IL CONFINE CHE VALE LA PENA TENERE ──
   Questo file è **dato puro**: gira in Node, nessun canvas, e i test lo
   leggono senza aprire un browser. È lo stesso patto di `dati/storie.js`
   — e il motivo per cui `motore/` non si accorge nemmeno che una storia
   è disegnata invece che scritta a emoji.

   ── PROTOTIPO ──
   Tre storie, undici scene. Servono a decidere se il cassetto disegnato
   vale il suo prezzo prima di pagarlo per tutte e quarantatré le storie.
   Se la risposta è sì, il passo dopo non è disegnare di più qui: è
   spostare `scena/persone.js` in `grafica/personaggi/`, perché le stesse
   figure servono alle icone del lessico (vedi `todo.md`, «il cassetto
   dei concetti disegnati»).
   ═══════════════════════════════════════════════════════════════════ */

export const SCENE = {

  /* ══ LA CORSA E IL GINOCCHIO SBUCCIATO ══
     Quattro passi con un verso che non si discute, e nessuno dei quattro
     è dicibile a emoji: 🏃 è «corre» senza dire chi, e la faccia — che è
     tutta l'informazione della seconda e della terza vignetta — le emoji
     ce l'hanno solo su una testa gialla staccata dal corpo. */

  'corre-nel-prato': {
    luogo: 'prato',
    inquadra: { zoom: 1.75, x: 50, y: 58 },
    cose: [
      { che: 'sole', x: 78, y: 34 },
      { che: 'cespuglio', x: 22, y: 80, s: 0.9 },
      { che: 'bimba', x: 52, dir: 'dx', passo: 1, faccia: 'contenta' },
      { che: 'corsa', x: 36, y: 62 },
    ],
  },

  /* l'inciampo: inclinata in avanti e con le braccia buttate avanti
     (`stato: 'lancia'` è la posa che le alza, e qui vuol dire «si sta
     parando»). Il sasso è piccolo apposta — la cosa da guardare è lei */
  'inciampa': {
    luogo: 'prato',
    inquadra: { zoom: 1.7, x: 48, y: 58 },
    cose: [
      { che: 'sole', x: 80, y: 34 },
      { che: 'bimba', x: 54, dir: 'dx', passo: 1, inclina: 0.78, faccia: 'spavento', stato: 'lancia' },
      { che: 'sasso', x: 32, y: 82, s: 1.4 },
    ],
  },

  /* ferma, in piedi, che piange: il ginocchio rosso si vede perché è
     l'unica macchia calda in mezzo al verde */
  'ginocchio-sbucciato': {
    luogo: 'prato',
    inquadra: { zoom: 1.9, x: 50, y: 59 },
    cose: [
      { che: 'cespuglio', x: 84, y: 81, s: 0.8 },
      { che: 'bimba', x: 50, dir: 'giu', faccia: 'piange', ginocchio: 'sbucciato' },
    ],
  },

  /* il grande si china e mette il cerotto. La bimba è ancora seria — non
     contenta: il sollievo è la vignetta, il sorriso sarebbe già la fine
     di un'altra storia */
  'il-cerotto': {
    luogo: 'prato',
    inquadra: { zoom: 1.15, x: 50, y: 54 },
    cose: [
      { che: 'sole', x: 88, y: 20 },
      { che: 'grande', x: 74, dir: 'sx', faccia: 'serena', inclina: -0.22 },
      { che: 'bimba', x: 28, dir: 'giu', faccia: 'triste', ginocchio: 'cerotto' },
      { che: 'cuore', x: 50, y: 34, s: 1, velo: 0.9 },
    ],
  },

  /* ══ IL VASO ROTTO, E DETTO ══
     La storia che nessuna fila di emoji sa raccontare: non perché manchi
     il vaso (🏺 c'è), ma perché il terzo passo — dirlo — non è una cosa,
     è una faccia davanti a un'altra faccia. */

  'palla-in-casa': {
    luogo: 'salotto',
    inquadra: { zoom: 1.2, x: 50, y: 56 },
    cose: [
      { che: 'tavolino', x: 80, y: 80 },
      { che: 'vaso', x: 80, y: 64, s: 0.85 },
      { che: 'bimbo', x: 26, dir: 'dx', faccia: 'contenta', stato: 'lancia' },
      { che: 'palla', x: 54, y: 46, r: 7, vola: true },
    ],
  },

  'vaso-rotto': {
    luogo: 'salotto',
    inquadra: { zoom: 1.2, x: 50, y: 58 },
    cose: [
      { che: 'tavolino', x: 80, y: 80 },
      { che: 'cocci', x: 76, y: 86 },
      { che: 'bimbo', x: 28, dir: 'giu', faccia: 'spavento', stato: 'lancia' },
      { che: 'palla', x: 50, y: 88, r: 5.5 },
    ],
  },

  /* lo dice. La nuvoletta contiene i cocci che si sono appena visti
     grandi: è il modo di dire «sta raccontando quella cosa lì» senza una
     parola scritta — e senza parole ci si tiene, perché a quattro anni
     non si legge */
  'lo-dice': {
    luogo: 'salotto',
    inquadra: { zoom: 1.15, x: 50, y: 52 },
    cose: [
      { che: 'grande', x: 76, dir: 'sx', faccia: 'serena' },
      { che: 'bimbo', x: 24, dir: 'dx', faccia: 'triste' },
      { che: 'nuvoletta', x: 44, y: 40, w: 30, h: 22 },
      { che: 'cocciPiccoli', x: 44, y: 29 },
    ],
  },

  'si-raccoglie': {
    luogo: 'salotto',
    inquadra: { zoom: 1.15, x: 50, y: 54 },
    cose: [
      { che: 'grande', x: 74, dir: 'sx', faccia: 'contenta', inclina: -0.16 },
      { che: 'paletta', x: 50, y: 86 },
      { che: 'bimbo', x: 26, dir: 'dx', faccia: 'serena', inclina: 0.14 },
      { che: 'cuore', x: 50, y: 30, s: 0.9 },
    ],
  },

  /* ══ DAL FANGO ALLA DOCCIA ══
     È la storia che oggi si chiama «doccia» e fa 🚿 🧴 👕 — dove il
     sapone non viene *dopo* la doccia ma dentro, e la maglietta è una
     convenzione: chi risponde bene non ha ragionato, si è ricordato come
     si fa a casa sua. Disegnata smette di essere un'abitudine e diventa
     una causa: **è sporco**, per questo si lava, e infatti dopo è
     pulito. Lo sporco addosso è l'informazione che l'emoji non ha. */

  'gioca-nel-fango': {
    luogo: 'cortile',
    inquadra: { zoom: 1.7, x: 48, y: 58 },
    cose: [
      { che: 'pozzanghera', x: 66, y: 82, w: 20 },
      { che: 'bimbo', x: 44, dir: 'giu', passo: 1, faccia: 'contenta' },
      { che: 'schizzi', x: 44, y: 80 },
      /* la pozzanghera torna anche **davanti** ai piedi: senza, il
         primo passo e il terzo erano lo stesso bambino in piedi, e a
         settanta pixel si distinguevano solo dal colore del fondo */
      { che: 'pozzanghera', x: 44, y: 84, w: 17, davanti: true },
    ],
  },

  'sotto-la-doccia': {
    luogo: 'bagno',
    inquadra: { zoom: 1.55, x: 50, y: 52 },
    cose: [
      { che: 'doccia', x: 50 },
      { che: 'bimbo', x: 50, dir: 'giu', faccia: 'serena' },
      { che: 'schiuma', x: 50, y: 38 },
    ],
  },

  'pulito-e-asciutto': {
    luogo: 'bagno',
    inquadra: { zoom: 1.7, x: 50, y: 58 },
    cose: [
      { che: 'asciugamano', x: 74, y: 80 },
      { che: 'bimbo', x: 44, dir: 'giu', faccia: 'contenta' },
    ],
  },

  /* ══ LA MATTINA ══
     Una routine, sì — ma disegnata smette di essere una fila di oggetti
     che stanno insieme (⏰ 🥣 🎒 🏫, dove chi indovina si è ricordato la
     propria casa) e diventa una giornata che qualcuno attraversa: c'è
     sempre lo stesso bambino, e quello che cambia è dove si trova. */

  'si-sveglia': {
    luogo: 'cameretta',
    inquadra: { zoom: 1.35, x: 50, y: 58 },
    cose: [
      { che: 'letto', x: 52, y: 80, w: 30, dorme: true, capelli: '#3f2c1e' },
      { che: 'sveglia', x: 16, y: 80, s: 1.1, suona: true },
      { che: 'zeta', x: 34, y: 52, s: 0.9 },
    ],
  },

  'la-colazione': {
    luogo: 'cucina',
    inquadra: { zoom: 1.45, x: 50, y: 58 },
    cose: [
      { che: 'bimbo', x: 50, dir: 'giu', faccia: 'contenta' },
      { che: 'tavola', x: 50, y: 96, w: 26, piatto: 'ciotola' },
    ],
  },

  'si-prende-lo-zaino': {
    luogo: 'cameretta',
    inquadra: { zoom: 1.6, x: 50, y: 58 },
    cose: [
      { che: 'zaino', x: 44, y: 60, s: 1.2 },
      { che: 'bimbo', x: 52, dir: 'dx', passo: 1, faccia: 'serena' },
    ],
  },

  'a-scuola': {
    luogo: 'aula',
    inquadra: { zoom: 1.35, x: 50, y: 54 },
    cose: [
      { che: 'zaino', x: 62, y: 62, s: 1.1 },
      { che: 'bimbo', x: 54, dir: 'giu', faccia: 'contenta' },
    ],
  },

  /* ══ LA SERA ══
     Il verso lo dà il sonno, non l'abitudine: si sbadiglia *prima* di
     andare a letto, e la favola sta in mezzo perché è l'unica cosa che
     succede fra le due. */

  'la-cena': {
    luogo: 'cucina',
    inquadra: { zoom: 1.45, x: 50, y: 58 },
    cose: [
      { che: 'bimba', x: 50, dir: 'giu', faccia: 'serena' },
      { che: 'tavola', x: 50, y: 96, w: 26, piatto: 'cena' },
    ],
  },

  'sbadiglia': {
    luogo: 'cameretta',
    inquadra: { zoom: 1.85, x: 50, y: 58 },
    cose: [
      { che: 'bimba', x: 50, dir: 'giu', faccia: 'assonnata' },
      { che: 'zeta', x: 68, y: 40, s: 0.75 },
    ],
  },

  'la-favola': {
    luogo: 'cameretta',
    inquadra: { zoom: 1.15, x: 50, y: 54 },
    cose: [
      { che: 'grande', x: 74, dir: 'sx', faccia: 'serena' },
      { che: 'bimba', x: 26, dir: 'dx', faccia: 'contenta' },
      { che: 'libro', x: 50, y: 54, s: 1.8 },
    ],
  },

  'si-dorme': {
    luogo: 'cameretta',
    inquadra: { zoom: 1.35, x: 50, y: 60 },
    cose: [
      { che: 'letto', x: 50, y: 82, w: 30, dorme: true, capelli: '#8a5a35' },
      { che: 'zeta', x: 32, y: 54, s: 1 },
    ],
  },

  /* ══ SI PIANTA IL SEME ══
     La crescita che c'era (🌰 🌱 🌳) è vera e non è forzata, ma non ha
     nessuno dentro: succede da sola. Con una bambina che semina, annaffia
     e aspetta, la stessa lezione acquista un *perché* — e il terzo passo
     smette di essere «poi diventa grande» e diventa «poi è cresciuto
     perché l'ha annaffiato». */

  'si-semina': {
    luogo: 'orto',
    inquadra: { zoom: 1.5, x: 50, y: 60 },
    cose: [
      { che: 'bimba', x: 58, dir: 'sx', faccia: 'serena', inclina: -0.3 },
      { che: 'seme', x: 32, y: 78, s: 3 },
    ],
  },

  'si-annaffia': {
    luogo: 'orto',
    inquadra: { zoom: 1.4, x: 50, y: 60 },
    cose: [
      { che: 'bimba', x: 30, dir: 'dx', faccia: 'contenta' },
      { che: 'annaffiatoio', x: 46, y: 62, s: 1.1, versa: true },
      { che: 'germoglio', x: 72, y: 80, s: 0.5 },
    ],
  },

  'il-germoglio': {
    luogo: 'orto',
    inquadra: { zoom: 1.5, x: 50, y: 60 },
    cose: [
      { che: 'bimba', x: 30, dir: 'dx', faccia: 'contenta' },
      { che: 'germoglio', x: 66, y: 80, s: 1.4 },
    ],
  },

  'il-girasole': {
    luogo: 'orto',
    inquadra: { zoom: 1.25, x: 50, y: 52 },
    cose: [
      { che: 'sole', x: 16, y: 20 },
      { che: 'bimba', x: 30, dir: 'dx', faccia: 'contenta' },
      { che: 'girasole', x: 66, y: 80, s: 1.3, alto: 30 },
    ],
  },

  /* ══ IL GATTINO CRESCE ══
     La ciotola resta della stessa taglia in tutte e tre: senza un metro
     fermo accanto, tre gatti più grandi uno dell'altro sono tre gatti
     disegnati a caso. È la stessa ragione per cui nelle vignette con due
     persone la statura racconta chi è il bambino. */

  'il-gattino': {
    luogo: 'salotto',
    inquadra: { zoom: 1.5, x: 50, y: 62 },
    cose: [
      { che: 'bimba', x: 28, dir: 'dx', faccia: 'contenta', inclina: 0.24 },
      { che: 'gatto', x: 60, dir: 'sx', taglia: 0.3 },
      { che: 'ciotola', x: 76, y: 80, s: 0.55, dentro: '#e8b06a' },
    ],
  },

  'il-gatto-mezzo': {
    luogo: 'salotto',
    inquadra: { zoom: 1.5, x: 50, y: 62 },
    cose: [
      { che: 'bimba', x: 28, dir: 'dx', faccia: 'serena' },
      { che: 'gatto', x: 60, dir: 'sx', taglia: 0.75 },
      { che: 'ciotola', x: 76, y: 80, s: 0.55, dentro: '#e8b06a' },
    ],
  },

  'il-gatto-grande': {
    luogo: 'salotto',
    inquadra: { zoom: 1.5, x: 50, y: 62 },
    cose: [
      { che: 'bimba', x: 26, dir: 'dx', faccia: 'contenta' },
      { che: 'gatto', x: 62, dir: 'sx', taglia: 1.5 },
      { che: 'ciotola', x: 76, y: 80, s: 0.55, dentro: '#e8b06a' },
    ],
  },

  /* ══ LA TORTA ══ */

  'si-impasta': {
    luogo: 'cucina',
    inquadra: { zoom: 1.4, x: 50, y: 58 },
    cose: [
      { che: 'bimba', x: 50, dir: 'giu', faccia: 'contenta' },
      { che: 'tavola', x: 50, y: 98, w: 28 },
      { che: 'ciotola', x: 50, y: 80, s: 1.3, dentro: '#e8c07a' },
    ],
  },

  'nel-forno': {
    luogo: 'cucina',
    inquadra: { zoom: 1.3, x: 50, y: 60 },
    cose: [
      { che: 'bimba', x: 24, dir: 'dx', faccia: 'serena' },
      { che: 'forno', x: 66, y: 80, s: 1.1, acceso: true },
    ],
  },

  'la-torta-pronta': {
    luogo: 'cucina',
    inquadra: { zoom: 1.4, x: 50, y: 58 },
    cose: [
      { che: 'bimba', x: 50, dir: 'giu', faccia: 'contenta' },
      { che: 'tavola', x: 50, y: 98, w: 28 },
      { che: 'torta', x: 50, y: 80, s: 1.2 },
    ],
  },

  /* ══ LA SPREMUTA ══ */

  'le-arance': {
    luogo: 'cucina',
    inquadra: { zoom: 1.4, x: 50, y: 58 },
    cose: [
      { che: 'bimbo', x: 50, dir: 'giu', faccia: 'serena' },
      { che: 'tavola', x: 50, y: 98, w: 28 },
      { che: 'arance', x: 38, y: 80, s: 1.5 },
      { che: 'arance', x: 64, y: 78, s: 1.2 },
    ],
  },

  'si-spreme': {
    luogo: 'cucina',
    inquadra: { zoom: 1.4, x: 50, y: 58 },
    cose: [
      { che: 'bimbo', x: 50, dir: 'giu', faccia: 'contenta' },
      { che: 'tavola', x: 50, y: 98, w: 28 },
      { che: 'arance', x: 34, y: 78, s: 0.8 },
      { che: 'bicchiere', x: 64, y: 80, s: 1, quanto: 0.45 },
    ],
  },

  'il-bicchiere-pieno': {
    luogo: 'cucina',
    inquadra: { zoom: 1.4, x: 50, y: 58 },
    cose: [
      { che: 'bimbo', x: 50, dir: 'giu', faccia: 'contenta' },
      { che: 'bicchiere', x: 50, y: 74, s: 2.4 },
    ],
  },

  /* ══ IL GELATO CADUTO ══
     Tre passi, e il terzo è quello che conta: non «arriva un gelato
     nuovo» — che sarebbe una storia sul gelato — ma **qualcuno che
     divide il suo**, che è una storia sui bambini. */

  'col-gelato': {
    luogo: 'cortile',
    inquadra: { zoom: 1.7, x: 50, y: 58 },
    cose: [
      { che: 'sole', x: 82, y: 30 },
      { che: 'bimbo', x: 46, dir: 'giu', faccia: 'contenta' },
      { che: 'gelato', x: 62, y: 60, s: 1.1 },
    ],
  },

  'il-gelato-cade': {
    luogo: 'cortile',
    inquadra: { zoom: 1.7, x: 50, y: 58 },
    cose: [
      { che: 'bimbo', x: 46, dir: 'giu', faccia: 'piange' },
      { che: 'gelatoCaduto', x: 66, y: 82, s: 1.1 },
    ],
  },

  'si-divide': {
    luogo: 'cortile',
    inquadra: { zoom: 1.2, x: 50, y: 56 },
    cose: [
      { che: 'sole', x: 86, y: 22 },
      { che: 'bimba', x: 74, dir: 'sx', faccia: 'contenta' },
      { che: 'bimbo', x: 26, dir: 'dx', faccia: 'serena' },
      { che: 'gelato', x: 50, y: 58, s: 1.1 },
      { che: 'cuore', x: 50, y: 30, s: 0.9 },
    ],
  },

  /* ══ IL LITIGIO CHE FINISCE BENE ══
     La storia che nel quaderno era in cima alla lista delle cose che con
     le emoji non si raccontano. Il primo e l'ultimo passo hanno in scena
     le stesse tre cose — due bambini e un orsetto — e a distinguerli sono
     **solo le facce**: è la prova migliore che questo cassetto serva a
     qualcosa. */

  'si-litiga': {
    luogo: 'cameretta',
    inquadra: { zoom: 1.2, x: 50, y: 56 },
    cose: [
      { che: 'bimba', x: 72, dir: 'sx', faccia: 'arrabbiata', inclina: 0.16 },
      { che: 'bimbo', x: 28, dir: 'dx', faccia: 'arrabbiata', inclina: -0.16 },
      { che: 'orsetto', x: 50, y: 76, s: 1.2 },
    ],
  },

  'uno-piange': {
    luogo: 'cameretta',
    inquadra: { zoom: 1.2, x: 50, y: 56 },
    cose: [
      { che: 'bimba', x: 72, dir: 'giu', faccia: 'piange' },
      { che: 'bimbo', x: 26, dir: 'dx', faccia: 'triste' },
      { che: 'orsetto', x: 40, y: 78, s: 1.1 },
    ],
  },

  'lo-presta': {
    luogo: 'cameretta',
    inquadra: { zoom: 1.2, x: 50, y: 56 },
    cose: [
      { che: 'bimba', x: 74, dir: 'sx', faccia: 'triste' },
      { che: 'bimbo', x: 26, dir: 'dx', faccia: 'serena' },
      { che: 'orsetto', x: 60, y: 70, s: 1.1 },
    ],
  },

  'si-gioca-insieme': {
    luogo: 'cameretta',
    inquadra: { zoom: 1.2, x: 50, y: 56 },
    cose: [
      { che: 'bimba', x: 72, dir: 'sx', faccia: 'contenta' },
      { che: 'bimbo', x: 28, dir: 'dx', faccia: 'contenta' },
      { che: 'orsetto', x: 50, y: 78, s: 1.2 },
      { che: 'cuore', x: 50, y: 30, s: 0.9 },
    ],
  },

  /* ══ SENZA GIACCA ══
     Il freddo non si disegna: si disegna **chi ha freddo**. La tinta
     azzurra addosso è la stessa leva con cui il castello distingue due
     squadre della stessa guardia (`tinta` in `corpo.js`), usata qui per
     dire una cosa che nessun oggetto in scena saprebbe dire. */

  'esce-senza-giacca': {
    luogo: 'cortile',
    inquadra: { zoom: 1.6, x: 50, y: 58 },
    cose: [
      { che: 'bimbo', x: 50, dir: 'giu', passo: 1, faccia: 'serena' },
      { che: 'freddo', x: 50, y: 80 },
    ],
  },

  'trema-dal-freddo': {
    luogo: 'cortile',
    inquadra: { zoom: 1.6, x: 50, y: 58 },
    cose: [
      { che: 'bimbo', x: 50, dir: 'giu', faccia: 'triste', tinta: '#5fb8e8' },
      { che: 'freddo', x: 50, y: 80 },
      { che: 'freddo', x: 62, y: 74 },
    ],
  },

  'con-la-giacca': {
    luogo: 'cortile',
    inquadra: { zoom: 1.6, x: 50, y: 58 },
    cose: [
      { che: 'bimbo', x: 50, dir: 'giu', faccia: 'contenta' },
      { che: 'giacca', x: 50, y: 60, s: 1.05 },
      { che: 'freddo', x: 50, y: 80 },
    ],
  },
}

export const CHIAVI_SCENE = Object.keys(SCENE)

/* Un passo è disegnato se è il nome di una scena; se non lo è, è
   un'emoji. Non c'è un prefisso e non serve: nessuna emoji si scrive
   come `ginocchio-sbucciato`. */
export const èScena = passo => Object.prototype.hasOwnProperty.call(SCENE, passo)

/* I controlli che si possono fare senza aprire un canvas. Quello che una
   scena disegnata *sembra* non lo dice nessun test — lo dice
   `strumenti/banco/storie.html`, che le mette tutte in fila per un occhio
   umano. Qui si controlla solo che non manchi niente. */
export function guastiDelleScene(scene = SCENE, luoghi = null, pittori = null) {
  const guasti = []
  for (const [chiave, s] of Object.entries(scene)) {
    const dove = `scena "${chiave}"`
    if (!s.luogo) guasti.push(`${dove}: senza luogo`)
    else if (luoghi && !luoghi[s.luogo]) guasti.push(`${dove}: il luogo "${s.luogo}" non esiste`)
    if (!Array.isArray(s.cose) || !s.cose.length) { guasti.push(`${dove}: nessuna cosa in scena`); continue }
    for (const c of s.cose) {
      if (!c.che) { guasti.push(`${dove}: una cosa senza "che"`); continue }
      if (pittori && !pittori[c.che]) guasti.push(`${dove}: niente sa disegnare "${c.che}"`)
      if (c.x === undefined) guasti.push(`${dove}: "${c.che}" senza x`)
    }
  }
  return guasti
}
