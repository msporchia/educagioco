# La telecamera del mondo di sopra: il dito e lo zoom

La telecamera del mondo di sopra in 3D (`scena3d/mondo/veduta.js`, i gesti in `viste/Mondo3d.vue` e `scena3d/mondo/dito.js`) fa come
quella della fattoria 3D (`docs/fattoria3d/scena.md`, «dito.js» e «camera.js»): **un dito che scorre sposta la vista, due dita
zoomano, un tocco cammina**. Voluto dall'utente il 21 ottobre: «la telecamera dovrei poterla draggare (vedi fattoria)», e niente zoom
speciale nel villaggio.

## Il gesto

- **Un tocco** (il dito si muove meno di 16 px, `docs/core/il-dito.md`) fa quello che ha sempre fatto: cammina, o parla a chi è
  toccato. **Oltre i 16 px** è un trascinare: la vista si sposta tanto quanto il dito, il punto di terreno che si è preso resta
  sotto il dito (senza ritardo, se no dito e terreno si rincorrono). **L'eroe non insegue più il dito**: prima trascinando si
  camminava, ora si guarda; per andare lontano si guarda e si tocca la meta. Il click che segue un trascinare o un pizzico è
  ignorato (`strisciato`), quindi finire il gesto su una persona non la fa parlare.
- Il dito che parte da una carta, un foglio o un fumetto (`.sot-terra-sopra > *`, `.sot-terra-sotto > *`, `[data-fumetto]`,
  `.sot-foglio`) non muove la vista. Col dialogo o la domanda di una pietra aperti, o nello scontro, il trascinare non sposta nulla.
- **Due dita**: la distanza fra le dita al momento del secondo tocco è il riferimento; allontanandole la telecamera si avvicina,
  avvicinandole si allontana (`zoomDaPizzico`). La rotella del mouse fa lo stesso. Il mouse trascina a tasto premuto. Nella veduta
  d'insieme il dito scorre il mondo in orizzontale come prima e non c'è pizzico.
- **Lo zoom si ricorda finché si resta nel mondo** (è nella telecamera della scena, mai nel profilo).

## Dove si guarda e come si torna

- **La vista libera** (`libera` in `veduta.js`) sta ferma dove l'ha portata il dito, anche se l'eroe cammina. Sta **nel mondo**
  (a `MARGINE` = 3 celle dal bordo) e **entro `LONTANO` = 40 celle dall'eroe** (`limitaVista`): due zone si toccano, non tutto il
  mondo; se l'eroe si allontana la vista lo segue a quella distanza.
- **Torna all'eroe**: mandarlo da qualche parte (un tocco sul prato, su una persona o un posto, il diario, la meta) richiama la vista
  (`segui()`), come nella fattoria; la veduta d'insieme, lo scontro e un salto (`salta()`) la spengono. Quando la vista è a più di
  tre celle dall'eroe compare il tasto «⌖ torna all'eroe» (`[data-torna-eroe]`, sopra la fascia in fondo).
- **Zone e pezzi seguono dove si guarda**: la scena carica anche le zone attorno al centro della vista (`fuocoVista`) e costruisce
  i nove pezzi attorno a lì, più il pezzo dell'eroe (`lavoroDeiPezziVista`); le zone dell'eroe non si scaricano mai. Sono al più una
  decina di pezzi, come prima più uno: le chiamate restano sotto le 150. Quello che non è ancora costruito lo copre il lontano
  (`lontano.js`), come sempre. Con la vista lontana i mostri e il resto restano quelli dell'eroe (si svegliano dove sta lui).

## I numeri dello zoom

A zoom 1 la telecamera vede quello che vedeva prima fuori dal villaggio (almeno 15 celle in largo e 18 in profondo; sullo schermo
largo al più 24 in larghezza di base, `VISTA.tetto`, prima 30). Il **più vicino** è 0,8 (un telefono in piedi vede ~12 celle),
il **più lontano** mostra al più 28 celle in largo (`VISTA.piuLarga`, ~1,7 su un telefono in piedi; su uno schermo largo, che parte
già a ~25, poco più di 1). Più largo di così c'è la veduta d'insieme, la casella «mappa» della barra. I limiti si ricalcolano se lo
schermo gira.

Provato e tolto: la telecamera del villaggio che si allontanava e si fermava in mezzo alla fila delle botteghe per farle vedere tutte
senza girare (il villaggio tondo, 24×20, sta in ~15 celle, e con lo zoom il bambino sceglie da sé).
Non fatto: la telecamera più bassa (36°) dello scontro sul prato, come nelle discese: gli sprite si allungano con l'inclinazione (`scena3d/camera.js`), e il palco del mondo non lo sa; va provato a parte.

Nei test: `unita/sotterraneo-mondo-vista` (il gesto sotto e sopra i 16 px, il pizzico, i limiti dello zoom e del trascinare, la
vista che si stacca e torna, i pezzi attorno a dove si guarda), `integrazione/sotterraneo-mondo-vista` (col dito vero, CDP: il
trascinare sposta la vista e non l'eroe, `[data-torna-eroe]`, il tocco sul prato richiama la vista, il pizzico ai due limiti, il
mouse e la rotella, le zone dell'eroe che restano, un tocco su una persona la fa raggiungere).
