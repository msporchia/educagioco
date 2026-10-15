# La grafica

Le truppe, il castello e le piazzole sono sprite del castello, riusati tali e quali
(`src/giochi/castello/dati/figure.js` e `vestiti.js`); gli edifici, la porta e il ponte
sono disegnati in codice finché non arriva il foglio dipinto.

- **La corsia è verticale**: il nemico in alto, chi gioca in basso. È come il motore
  conta (`y` lungo la corsia), quindi la scena non ruota niente. **Provato orizzontale
  e tolto**: i castelli ai due capi mangiavano più di metà della corsia.
- **Tutto è piccolo e il campo è largo** (`ZOOM` 0,5 in `scena/campo.js`): la carta del
  terreno è a celle da mezza misura (16 × 24), e le cose ci stanno «più armoniose».
  Le truppe sono un po' più grandi del terreno (×1,2), castello ed edifici ancora di
  più (`ZE`).
- **Il castello spunta dal bordo** (`base()`): di chi gioca la cima, in basso; del nemico la
  base col portone, in alto. La barra della vita sta dalla parte del campo.
- **I posti delle caserme sono piazzole fisse** (`piazzole()`): la piazzola del castello a
  torri, sempre in vista anche vuota, come in un tower defense. Nella metà di ciascuno
  non ci sono alberi né staccionate (le celle `_` della carta prendono solo il prato).
  **Provati e tolti**: una muraglia attorno all'accampamento, un muro davanti al castello,
  e un lastricato alla Heroes con gli edifici attaccati al castello (vedi
  [regole.md](regole.md)).
- **Le caserme sono dipinte** (`dati/caserme-dipinte.js`, generato da
  `strumenti/sprite/caserme-arena.py` dal foglio di ChatGPT, voce 7b di
  `strumenti/sprite/DA-GENERARE.md`; il foglio di adesso è provvisorio): ogni edificio con le
  sue due truppe, appena costruito e dal livello 5, **il rudere** e **la piazzola vuota**,
  tutti sulla stessa piazzola. Un posto mai usato mostra la piazzola vuota; dove una caserma
  è crollata resta il suo rudere finché non se ne costruisce un'altra (la scena lo ricorda
  dall'evento del crollo, che porta il posto). Le piazzole del foglio non sono tutte della
  stessa misura: lo strumento scala ogni figura sulla sua piazzola, e il punto d'appoggio è
  il centro della piazzola in basso. Finché l'atlante non c'è, o se manca un pezzo, gli
  edifici si disegnano in codice (`scena/edifici.js`, con lo scudo della truppa davanti).
- **Il nemico ha le stesse immagini col blu fatto rosso** (`ricolora()`, una volta per
  atlante): per questo il prompt vuole il colore della squadra di un blu solo.
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
- **Una caserma nuova spunta** dalla sua piazzola con un rimbalzo e uno sbuffo di polvere.
- **La vita dei castelli sta SOPRA i castelli**, in una barra grande e sempre accesa, col
  numero. **Le altre barre si vedono solo sul ferito** (caserme, porta, truppe).
- **Niente barra della prossima squadra**: c'era, verde, sotto il livello delle carte; tolta
  (l'utente: «orribili»), e poi tolte anche le carte: si tocca il campo ([regole.md](regole.md)).
- **La miniera è disegnata in codice** (`miniera()` in `scena/campo.js`): un monte di roccia
  con l'imbocco di legno, il carrello d'oro e la bandierina della squadra. Prima in codice,
  poi dipinta: nel foglio delle caserme non c'è.
- **Il ponte** è di assi, con la porta di ciascuno al suo capo: due torrette e il
  portone; crollata, resta il cumulo.
- **Mancano**: gli edifici e la porta dipinti, pose di attacco e di morte delle truppe.

## Il quadro e i comandi

Il quadro è alto quanto lo schermo lascia e il terreno continua specchiato sopra e
sotto il campo (`sfondo` in `scena/campo.js`): niente fascia verde. Orologio e
diamanti stanno in alto; ripara e bomba sono due icone tonde in basso a destra
sul campo (`.ar-azioni`), col prezzo o l'attesa in un cartellino.
- **Le modali sono quelle della fattoria e del sotterraneo, ma asciutte**: la scelta di una
  piazzola è una nuvoletta crema con l'orlo giallo (disegno e pulsantino col prezzo, il «?»
  dei numeri piccolo nell'angolo), l'anello usa gli stessi pulsanti, i dettagli una scheda
  scura con la ✕ rossa tonda. Il bambino sa già cosa vuole costruire: **niente nomi, note e
  titoli**, e le emoji restano solo dove portano informazione (💎 del prezzo, 💰 vendi, ⛏️ per
  la miniera, che non ha un ritratto).
