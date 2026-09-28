# Passo passo — lo zaino e le carte

I gradini dei grandi (da sette anni e mezzo, portata dal 46 al 74): dopo le
buche cresce **la lingua**, non il mondo. Le carte sono in
`src/giochi/passo-passo/dati/carte.js`, le modifiche alla fila in
`motore/fila.js`.

## La regola dello zaino

- **Ogni gradino porta una carta, e con lei lo zaino**: quante carte tiene la
  fila. Dopo l'ultima si vedono i posti che restano, tratteggiati.
- **Scritta freccia per freccia, la strada nello zaino non ci sta**, ed è
  scelto apposta: il ciclo è l'unico modo di farla stare, non una comodità.
  `serveLaCarta` (`motore/risolutore.js`) lo pretende da ogni livello.
- **Lo zaino è un tetto per arrivare, non la quarta stella.** Oggi ogni zaino
  è largo quanto la sua soluzione, quindi lì la stella della strada più corta
  la dà già la carota.

## La scatola 🔁

- **La fila resta un elenco piatto**: un ciclo è `ripeti-4 … fine`, e il
  cursore resta un numero.
- **Il numero nasce N**, da scegliere fra 2 e 9: un valore già scritto si
  leggerebbe come l'unico possibile. ▶ con una N dentro non parte, e riapre la
  scelta che manca.
- **Dentro e fuori.** 🔁 mette la scatola dove sta il cursore, col cursore
  dentro; il bordo in fondo, toccato, mette il cursore subito fuori; la testa
  riapre la scelta del numero.
- **⌫ subito dopo una scatola la toglie intera; in cima al suo corpo toglie il
  🔁** e lascia le frecce che aveva dentro. Le modifiche sono pure
  (`motore/fila.js`).
- **A che giro siamo.** Mentre gira, la testa dice «3/5»; se il coniglio
  sbatte dentro un ciclo il giro resta scritto, arancione.
- **Scatole dentro scatole**: nelle terrazze e nel campo arato.
- **Oltre 90 passi al coniglio gira la testa** e la fila si ferma
  (`PASSI_MAX` in `motore/mondo.js`): un ciclo che va avanti e indietro per
  sempre non è un programma che finisce.

Le regole del mondo restano tutte: un ciclo di salti per il fiume, un ciclo
sul ghiaccio dove la stessa freccia fa strade lunghe diverse e a fermare il
coniglio ci pensano i sassi.

## Le condizioni guardano per terra

Tutte e due leggono le lastre colorate (`r u g`, vedi [regole.md](regole.md)).

- **🔁 fino a 🔴.** La testa è un colore: un giro, e alla fine di ogni giro
  si guarda sotto i piedi. Almeno un giro sempre: già sul rosso, «fino al
  rosso» vuol dire il prossimo. Serve dove **la stessa scatola fa strade
  lunghe diverse** (una scatola dentro l'altra): un numero va bene una volta
  sola. La scelta della testa offre, sotto i numeri, i colori della mappa.
- **❓ se 🔵.** Fa quello che ha dentro una volta sola, se il coniglio è sul
  colore giusto. Con la testa **🔁 fino a 🏠** il coniglio legge le lastre una
  per una, e una strada che gira in tre versi sta in sei o otto carte. Il
  «fino a» sa quando smettere; da che parte andare lo sa solo il se.
- **Un giro che non muove il coniglio ferma la fila** (`STANCO` in
  `motore/mondo.js`): un se che non scatta mai dentro un «fino a» non
  cambierà mai quello che ha sotto i piedi.

**Le false piste.** In questi gradini chi sbaglia non sbatte al primo passo:
prosegue su una strada plausibile e finisce in un fosso, in uno stagno o
fermo in un angolo (chi conta invece di guardare, chi legge un colore al
contrario). Il test lo pretende dalle mosse ingenue di ogni livello: almeno
due passi prima di fermarsi.

L'ultimo gradino, **tutto il mondo**, rimette le regole del mondo con le
scatole: i sassi fermano una scatola sul ghiaccio, il masso fa il ponte a
ogni giro, un salto si ripete fino al sasso rosso. Le mappe dei grandi
arrivano a nove per undici (sul telefono una cella resta sui trenta pixel), e
con lo zaino le tessere della fila sono più piccole: un se dentro un ripeti
sono tre scatole in fila, e devono stare su due righe.

## La soluzione si scrive

- **Nei livelli con lo zaino la soluzione sta nel livello** (`soluzioni`,
  scritte con `programma()`, `ripeti()`, `se()`): il risolutore trova la
  strada più corta, non il programma più corto.
- **Le `fragili`** sono le mosse ingenue (le frecce nell'ordine sbagliato, la
  scalinata presa dal lato comodo) e non devono prendere la carota: se una
  la prendesse, la carota non chiederebbe di pensare.
- **Il 💡 parte dalla soluzione scritta** più simile al programma del bambino
  (`suggerisciNelloZaino` in `motore/risolutore.js`) e dice una di quattro
  cose: qui va questa freccia, qui va una scatola (in trasparenza, col suo
  numero), questa scatola va ripetuta tante volte (la testa pulsa), questa
  carta è di troppo (⌫ brilla). Se il programma è quasi arrivato e il pezzo
  che manca ci sta sciolto, dice quello e non lo rimanda indietro.

Stelle, prezzi e la strada più corta con lo zaino: [stelle-e-aiuti.md](stelle-e-aiuti.md).
