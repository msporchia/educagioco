# Come è disegnato: scenari, muri a tre quarti, sprite

Lo scenario generato da un prompt, la regola del muro alto una cella, i fogli
degli sprite e come si posano armi e armature. Le regole di disegno comuni a
tutti i giochi (tela, telecamera, atlante, tessere, scala nel contesto) stanno
in [../core/grafica.md](../core/grafica.md).

Il sotterraneo è **il calco da guardare** per un mondo a sprite:
`src/giochi/sotterraneo/scena/tela.js`, che la forma dei muri la prende da
`scena/muri.js`.

## Lo scenario

- **Il vestito intero di un piano è uno scenario**: pavimenti, tetto, facce,
  bordi, porte, scala, fontana, mercante e le cose per terra stanno in una
  voce di `SCENARI` (`dati/tessere.js`), e **tutte le voci hanno le stesse
  chiavi**: si cambia vestito a una discesa senza toccare la tela. Aggiungere
  un pezzo è una riga lì, mai un `if` nel disegno. Oggi ce ne sono tre: **le cantine**
  (`sotterraneo_2.png`), **la cripta**
  (`sotterraneo_4.png` e i due fogli `_2`, `_3`) e **la fornace** (`sotterraneo_5.png` e il foglio `_2`); le sei discese ne mostrano due a testa (cantine e
  pozzo, gallerie e cisterna, labirinto e fondo) e l'abisso li attraversa
  scendendo ([abisso.md](abisso.md#il-posto-cambia-scendendo)). Ogni tappa lo
  dichiara con `scenario:`; chi non lo dichiara indossa le cantine (`SCENARIO`).
- **Uno scenario nasce da un prompt** diviso in due:
  `strumenti/sprite/sorgenti/sotterraneo/generati/PROMPT-scenario.md` ha una
  **parte fissa** (griglia, regola del muro, luce, divieti) e un **blocco
  SCENARIO** da cambiare per la cripta, la fornace, la grotta di cristallo.
  Si chiede prima **la scena** intera, poi **il foglio** dei pezzi allegando
  la scena buona: un foglio chiesto da solo esce coi pezzi belli uno per uno
  e che non stanno insieme. **Se cambiano solo i materiali basta un prompt**:
  si allega `sotterraneo_2.png` e lo si chiede in un altro scenario («La
  scorciatoia» nella scheda); i pezzi restano ai loro posti e il foglietto
  si ricava da `sotterraneo_2.json`. Gli schemi da allegare li disegna
  `python3 strumenti/sprite/scenario.py`, che legge la pianta dalla scheda e
  ne controlla la regola del muro. Provato col foglio delle cantine
  ridisegnato (la prima cripta): i pezzi tornano ai posti ma non stanno
  insieme fra loro.
- **Uno scenario si può ritagliare dalla scena**: è il modo della cripta.
  Pavimenti, tetto, facce, bordi e scala si prendono dalla scena, che ha una
  mano sola; un foglio piccolo chiesto nella stessa chat porta solo quello
  che la scena non ha (le porte, il mercante, le cose per terra). Per questo
  la tela ripete un pezzo **per quanto è largo e alto**: il pavimento della
  cripta è 4×3 celle, il corridoio 1×4, la fila del muro due celle.
- **Ritagliare la scena vuole la stessa scala per bordi e facce** (4 px di
  scena per pixel di gioco), partendo dalla riga dove il coronamento
  ricalca il bordo: a 3,5 il coronamento usciva una riga più in basso e la
  giunzione col muro spesso si vedeva.
- **La scena può avere la griglia deformata** (la fornace: cella di 64 px
  nella stanza in alto, 69 in quella in basso, facce più alte): allora ogni
  pezzo si ritaglia dalla zona che ha la scala giusta, e il pavimento da una
  toppa senza carbone né porte, o ripetuto mostra i mucchi come una carta da
  parati.
- **Quello che non c'è nella tavola non si disegna**: `guastiDelleTessere`
  chiede all'atlante ogni nome di ogni scenario, e un pezzo mancante è rosso
  nei test invece che un muro invisibile.
- **La pelle di una porta ripete il segno** che le sta sopra, col disegno.

## Il muro è alto una cella

La regola sta in `scena/muri.js` (niente canvas, niente nomi di sprite: gira
in Node) e si prova in `unita/muri-sotterraneo`.

- **La roccia si vede da sopra**: è il tetto dei muri, con un bordo di pietra
  chiara dove confina col calpestabile.
- **Dove sotto una cella di roccia si cammina, di quella cella si vede la
  faccia** del muro, alta una cella col suo coronamento (`faccia`, `tetto`,
  `genere`). I muri di lato e in basso hanno solo il bordo.
- **A tre quarti la faccia di un muro non è il bordo di una zona**: è una
  cella intera che si vede da una parte sola. Così anche il muro spesso una
  cella fra due corridoi ha la sua forma. Provato il set con la parete alta
  due celle: fra due corridoi il coronamento non stava, si dipingeva di
  mattoni tutta la roccia e non si capiva dove finisse una parete.
- **I bordi sono strisce dentro la cella di tetto** (nord se sopra si
  cammina; ovest ed est se di lato si cammina o c'è una faccia; a sud mai),
  **gli angoli sono blocchi** decisi per quarto di cella guardando tre vicini
  — lato orizzontale, verticale, diagonale — come i «quarti» di RPG Maker:
  quattro casi per quarto invece di quarantasette figure.
- **Un bordo con la fascia scura** (la cripta) stende il suo scuro sulla
  riga chiara dell'altro bordo della stessa cella: `bordi.luce` dice quanto
  è larga la riga chiara, e la tela la ripassa dopo aver posato i bordi.
- **Gli angoli in fondo** raccordano un coronamento che sale sulla cella di
  sopra (la faccia delle cantine è alta 20): con una faccia alta una cella,
  come quella della cripta, non si mettono, o sporgono sopra il coronamento.
- **I pavimenti sono quadrati di celle** da cui ogni cella prende la sua
  parte (4×4 nelle cantine), uno per le stanze e uno per i corridoi (è la
  prima cosa che dice dove si è); sotto la fontana c'è un **medaglione** di
  mosaico di 3×3. Il tetto ha la trama solo vicino a dove si cammina:
  ripetuta dappertutto faceva carta da parati.
- **Le cose per terra** stanno su una cella di pavimento su venticinque,
  sempre le stesse: una su dieci copriva le stanze di sassi.

## I fogli e l'atlante

- **Il sotterraneo è il primo gioco che usa i due motori comuni**:
  `src/grafica/atlante.js` (posare uno sprite: il piede, lo specchio, i bordi
  netti) e `src/grafica/tessere.js` (quale pezzo va in una cella).

- **Da dove vengono**: il posto dallo scenario generato; mostri e cose da
  raccogliere da fogli generati della stessa famiglia (`mostri-1.png`,
  `mostri-2.png`, `bottino-e-arredo.png`, `scudi.png`,
  `armature-e-vesti.png`); eroi, forzieri e monete ancora da **0x72, «16×16
  DungeonTileset II», CC-0**.
- **L'atlante** lo monta `strumenti/sprite/atlante.py sotterraneo` (formato
  in `strumenti/sprite/FORMATO.md`): un PNG di circa 150 KB per 232 pezzi,
  incorporato in base64, così il build resta un file solo. Si ritaglia **solo
  quello che qualcuno nomina** (di `armature-e-vesti.png` sette figure su
  centotrentasei), e il foglietto scrive cosa è rimasto nel foglio. Lo stesso
  modulo lo legge il banco `strumenti/banco/mondo.html` (`npm run mondo`): se
  i due si scollassero, il banco non direbbe più niente sul gioco.
- **Il foglio degli oggetti arriva senza alfa e a tripla grandezza**: il fondo
  nero lo toglie `atlante.py` allagando dai bordi (`"fondo": "auto"`), la
  scala è dichiarata `3`, misurata per proporzione sulle armi 0x72 (una spada
  ridotta sta fra 13 e 37 px; 1254 / 3 = 418 esatto). Una scala sbagliata non
  dà errori: dà un'arma alta il doppio dell'eroe.

## Armi, armature e arredo in scena

- **L'arma si posa accanto al pugno, staccata, e respira col passo**: dodici
  armi vanno bene per quattro personaggi senza disegnarne quarantotto. Chi ne
  porta due le porta una per lato; un'arma a due mani sta in mezzo, davanti al
  corpo.
- **Le armature vivono solo come icona** — nello zaino, per terra, al banco.
  0x72 non ha un fotogramma in cui il personaggio indossi o impugni qualcosa,
  e la figura di ogni classe è fissa: è il patto del set. I sei scudi vengono
  da `scudi.png`, le vesti da `armature-e-vesti.png`. Un buco così (le
  armature restate emoji) va guardato *prima* di innamorarsi di un set.
- **Di emoji in scena restano solo i segni sopra le porte.** La fontana e il
  mercante vengono dallo scenario, e la fonte bevuta resta al suo posto,
  asciutta.
- **L'arredo cambia pelle e frase con lo scenario**: il piano decide *cosa*
  (`barile`, `ossa`, `braciere`... in `ARREDI`, `dati/mondo.js`) e dove sta e
  chi fa luce; `arredo` nella voce di `SCENARI` dice con quale sprite si
  disegna e `dice` cosa risponde a chi lo tocca. Vuoti, vale quello di tutti
  (cantine, cripta). La fornace: botte, carbone, incudine, gargoyle,
  calderone, rastrelliera, banco.
- **L'arredo** (barili, casse, ossa, uno stendardo, un braciere che fa luce)
  non si tocca, non blocca e non vale niente: serve a far sembrare che qui
  sotto ci abbia vissuto qualcuno. Un sotterraneo di stanze vuote si legge
  come un diagramma. È disegnato più spento delle cose toccabili, che hanno un
  filo di luce dorato.
