# La grafica

Le truppe e il castello sono sprite del castello, riusati tali e quali
(`src/giochi/castello/dati/figure.js` e `vestiti.js`); gli edifici della cittadella,
la porta e il ponte sono disegnati in codice finché non arriva il foglio dipinto.

- **La corsia è verticale**: il nemico in alto, chi gioca in basso. È come il motore
  conta (`y` lungo la corsia), quindi la scena non ruota niente. **Provato orizzontale
  e tolto**: i castelli ai due capi mangiavano più di metà della corsia.
- **Tutto è piccolo e il campo è largo** (`ZOOM` 0,5 in `scena/campo.js`): la carta del
  terreno è a celle da mezza misura (16 × 24), e le cose ci stanno «più armoniose».
  Le truppe sono un po' più grandi del terreno (×1,2), castello ed edifici ancora di
  più (`ZE`), perché stretti in una cittadella occupano poco campo.
- **La cittadella** (`piazzale()`): un lastricato di pietra per parte, dipinto una volta
  per misura, col castello al centro e gli edifici attaccati. Nella metà di ciascuno
  non ci sono alberi né staccionate (le celle `_` della carta prendono solo il prato):
  li ha fatti togliere l'utente. **Provati** una muraglia attorno all'accampamento e un
  muro davanti al castello: bocciati.
- **Gli edifici** (`scena/edifici.js`): la stessa fondazione di pietra, sopra la forma
  dell'edificio (cripta chiara con le ossa, guglia viola, baracca di tronchi, massi) e
  quella della truppa che ci abita (la torretta a feritoie degli arcieri, il portone
  degli opliti, il teschio che galleggia, il camino a corna…); dal livello 5 crescono.
  Davanti uno scudo con la truppa ferma. **È l'unico punto da cambiare** quando arriva il
  foglio dipinto (`strumenti/sprite/DA-GENERARE.md`, voce 7: il primo giro con ChatGPT
  non ha dato niente di buono). Il colore della squadra, nel foglio, è un blu solo da
  ridipingere di rosso come il castello.
- **Il castello nemico è lo stesso** coi colori scambiati pixel per pixel
  (`castelloNemico()`: il blu dei tetti diventa rosso, il rosso degli stendardi blu).
  Prima il nemico aveva la bocca d'albero: in un gioco che si chiama Castle Battle
  stonava. **Provato** il filtro `hue-rotate`: tetti verdi e neve rosa.
- **Di che squadra è una truppa** si vede da un contorno del suo colore (la figura tinta,
  `tinta()`, spostata di un pelo ai quattro lati) e da un disco pieno sotto i piedi: con
  il solo cerchietto, vicine, non si distinguevano.
- **Gli arcieri hanno in mano l'arco del sotterraneo** (`arco()` in `scena/figure.js`, il
  pezzo grande `arco-corto` di `sotterraneo/dati/atlante.js`): nel foglio lo scheletro è a
  mani vuote. Come l'arma dell'eroe là, sta a un punto fisso davanti al corpo, non a un
  aggancio per fotogramma, e rincula quando tirano. Il ritratto delle carte aspetta che
  l'immagine ci sia (`armiPronte()`).
- **Chi è chi** (`scena/figure.js`): scheletro (arcieri), scheletro con scudo (opliti),
  lupo, diavoletto, pipistrello, negromante, golem, drago. Lupo e drago hanno i passi
  di lato (6 fotogrammi); le altre il respiro (4) e uno scatto in avanti quando
  colpiscono, un saltello quando camminano. Guardano di lato (di schiena non esiste
  niente): ciascuna dalla parte della sua squadra.
- **Una caserma nuova spunta** dal lastricato con un rimbalzo e uno sbuffo di polvere.
- **La vita dei castelli sta SOPRA i castelli**, in una barra grande e sempre accesa, col
  numero. **Le altre barre si vedono solo sul ferito** (caserme, porta, truppe).
- **Il ponte** è di assi, con la porta di ciascuno al suo capo: due torrette e il
  portone; crollata, resta il cumulo.
- **Mancano**: gli edifici e la porta dipinti, pose di attacco e di morte delle truppe.
