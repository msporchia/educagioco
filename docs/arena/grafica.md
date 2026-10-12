# La grafica

Sprite del castello, riusati tali e quali (`src/giochi/castello/dati/figure.js`
e `vestiti.js`): non c'è un foglio nuovo.

- **La corsia è orizzontale**: chi gioca a sinistra, il nemico a destra, le
  caserme sopra e sotto. Le creature del foglio guardano a destra e hanno i
  passi solo di lato (nessuna di schiena), quindi in una corsia verticale
  avrebbero camminato di lato verso l'alto. Il motore resta in verticale: la
  scena (`scena/campo.js`) ruota (`px(y)` e `py(x)`).
- **Chi è chi** (`scena/figure.js`): scheletro, scheletro con scudo (guardiano),
  lupo, diavoletto, pipistrello, negromante, golem, drago. Lupo e drago hanno
  i passi di lato (6 fotogrammi); le altre il respiro (4) e uno scatto in
  avanti quando colpiscono, un saltello quando camminano.
- **Il fondale** si compone con `componi()` del castello da una carta a
  caratteri in `campo.js` (acqua in mezzo, la strada la attraversa); la base
  del giocatore è il `castello` del vestito, quella del nemico la `bocca`.
- **La torretta** è la torre dell'arciere del castello, a tre stadi (livelli
  1-3, 4-6, 7-10).
- **Mancano** (da generare, `strumenti/sprite/DA-GENERARE.md`): le caserme (oggi
  una capanna a poligoni col tetto del colore della squadra), il muro (oggi
  mattoni a poligoni), pose di attacco e di morte, e un ponte vero.
