# La grafica

Sprite del castello, riusati tali e quali (`src/giochi/castello/dati/figure.js`
e `vestiti.js`): non c'è un foglio nuovo.

- **La corsia è verticale**: il nemico in alto, chi gioca in basso, le caserme ai
  due lati della strada. È come il motore conta (`y` lungo la corsia), quindi la
  scena non ruota niente. **Provato orizzontale e tolto**: con i castelli ai due
  capi della corsia ne mangiavano più di metà e restava poco spazio (e tempo)
  per manovrare; in verticale la corsia libera è lunga il doppio.
  Le creature del foglio guardano di lato e non hanno la vista di schiena:
  in campo guardano dalla parte della loro squadra (chi gioca a destra, il
  nemico a sinistra) mentre camminano in su o in giù. Una vista di schiena è
  nelle cose da generare.
- **Chi è chi** (`scena/figure.js`): scheletro, scheletro con scudo (guardiano),
  lupo, diavoletto, pipistrello, negromante, golem, drago. Lupo e drago hanno
  i passi di lato (6 fotogrammi); le altre il respiro (4) e uno scatto in
  avanti quando colpiscono, un saltello quando camminano.
- **La vita dei castelli sta SOPRA i castelli**, in una barra grande e sempre accesa, con
  il numero scritto: nella striscia in alto («🏰 100% – 100%») non si capiva di quale
  castello parlasse. **Le altre barre della vita si vedono solo sul ferito** (caserme, muro,
  truppe): con la barra sempre accesa una caserma ne aveva una sopra e una
  sotto (la squadra che si riempie), e non si capiva quale dicesse cosa. La
  squadra in arrivo sta nella carta in basso, non sul campo.
- **Nella caserma l'emblema è piccolo e fermo, sul tetto**: serve solo a dire di
  quale truppa è. Animato (il respiro) confondeva con le truppe vere.
- **Il fondale** si compone con `componi()` del castello da una carta a
  caratteri in `campo.js` (acqua in mezzo, la strada la attraversa); la base
  del giocatore è il `castello` del vestito, quella del nemico la `bocca`.
- **Il castello** è il `castello` del vestito, col livello in un cartellino; la
  carta per potenziarlo usa la torre dell'arciere del castello, a tre stadi
  (livelli 1-3, 4-6, 7-10). Il muro, se crolla, lascia un cumulo di sassi.
- **Mancano** (da generare, `strumenti/sprite/DA-GENERARE.md`): le caserme (oggi
  una capanna a poligoni col tetto del colore della squadra), il muro (oggi
  mattoni a poligoni), pose di attacco e di morte, e un ponte vero.
