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
  bordi, porte, scala, fontana e le cose per terra stanno in una
  voce di `SCENARI` (`dati/tessere.js`), e **tutte le voci hanno le stesse
  chiavi**: si cambia vestito a una discesa senza toccare la tela. Aggiungere
  un pezzo è una riga lì, mai un `if` nel disegno. Oggi ce ne sono quattro: **l'inferno** (sotto) e tre ritagliati e dipinti prima: **le cantine**
  (`sotterraneo_2.png`), **la cripta**
  (`sotterraneo_4.png` e i due fogli `_2`, `_3`) e **la fornace** (`sotterraneo_5.png` e il foglio `_2`); le sette discese li alternano, mai lo stesso due volte di fila
  ([la-grande-storia.md](la-grande-storia.md#le-discese)) e l'abisso li attraversa
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
- **La pelle di una porta non ripete niente**: `semplice`, `ferro` o `chiara` a caso, e la `bella` (la porta nera col teschio d'oro, o le corna) solo per il portone del grosso ([piani.md](piani.md#le-porte)). La porta d'oro non c'è più: diceva che dietro c'era un tesoro.

## L'inferno

Il quarto scenario (`inferno`, 15 ottobre 2026), quello della **botola segreta** (`labirinto`, la quinta discesa: ogni discesa il suo scenario, non più scenari che si alternano in orizzontale; i suoi abitanti sono in [mostri.md](mostri.md)): massi con le punte, mattoni scuri e brace, stendardi rossi e un toro cornuto sopra ogni porta. Nasce da **tre immagini di ChatGPT** (nella cartella dei fogli) e da **un attrezzo che fa i pezzi che mancano**.

- **`sotterraneo_6.png`**, la scena (tre stanze e i corridoi). La cella è di 64 px come nelle altre, ma le facce sono più alte (coronamento di massi e mattoni): se ne prende l'alto, 76 px su 64, schiacciato di un quinto. Dalla scena: facce, capo, bordi, la porta col teschio cornuto (`bella`) e quella rossa senza (`ferro`), e due ritagli grezzi di pavimento.
- **`arredo-inferno.png`**, una tavola di 71 pezzi su fondo magenta (nove file, scala circa 5,9 px per pixel di gioco): quasi tutto l'arredo (sarcofagi, altari, statue e gargoyle, colonne, torce, gabbie, stendardi, fucina, troni, tavolo del boia…), più la porta di legno, la scala in cornice di pietra, la grata, il lucchetto e la coppa di lava, che servono all'attrezzo.
- **`bottega-inferno.png`**, il terzo foglio (una «bottega infernale»): è una tavola di ambienti, e ne vengono 27 pezzi (obelischi, forche, cristalli, il cerchio del pentagramma, il demone sul trono, punte di roccia e alberi secchi per i relitti, le cose piccole per terra). **Restano fuori** gli ambienti interi (l'ingresso della caverna col teschio, il recinto, l'orto, la tenda, il ponte, la cascata di lava: sono scene, buoni semmai da sfondo di un grosso), il cancello a spuntoni (sembra un passaggio: regola del decoro), casse e botti, ossa e teschi, il forziere pieno d'oro (il d'oro è solo delle missioni).
- **`python3 strumenti/sprite/inferno.py`** (`--provino` in `tmp/inferno.png`) fa in codice quello che nessuno ha dipinto: i due pavimenti **senza cuciture** (il ritaglio con una banda di 6 px che sfuma sul lato opposto), il **tetto** (massi neri a macchie, una vena di brace ogni tanto), il **medaglione** (un pentagramma inciso: quello della scena ha la ciotola dentro e sulla fontana farebbe doppio), la porta **chiara** e quella **aperta**, i **cinque fianchi** (colori campionati dalle porte), la **scala chiusa** (la grata e il lucchetto sulla scala) e la **fontana asciutta** (la lava della coppa diventa pietra). Scrive `sotterraneo_6_derivati.png`; poi `atlante.py sotterraneo`. Se un pezzo non regge a schermo si fa chiedere al modello: la regola resta «prima in codice, poi dipinto».
- **I muri obliqui** li fa `diagonali.py inferno`, che legge le tessere della scena e il tetto del foglio derivato (`ancheDa` in `SCENE`).
- **Le ragnatele e i forzieri sono quelli della fornace** (la scena non li ha e il ferro con la brace sta bene): da chiedere al modello con le altre cose per terra.
- **Dove si vede**: la botola segreta (`giu=5` nei cheat); l'abisso, che attraversa cantine, cripta e fornace, non lo ha (le sue creature sono quelle della botola).
- **Da guardare col dito**: il pavimento delle stanze è tondo e caldo (il filtro di luce lo scalda), le facce sono basse di contrasto; le porte e le scale sono dipinte a 5–6 px per pixel di gioco e vanno viste in corsa.

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

## I muri in diagonale

Le stanze smussate, le cappelle e le sale con gli angoli tagliati hanno muri a gradini di una cella, e un muro obliquo usciva
come una scaletta di quadrati (l'utente, 13 ottobre 2026: «la struttura è molto carina, è il rendering che è terribile»). I generatori
di immagini non c'erano, e la regola è «prima in codice, poi dipinto»: i pezzi si ricavano dalle tessere dritte di ogni scena (il metodo è in
[../core/sprite.md](../core/sprite.md#i-pezzi-derivati-in-codice), `diagonali` in `SCENARI`). Le grotte (muri naturali storti) non hanno pezzi loro. **Il disegno per il dipinto** è in [PROMPT-scenario.md](../../strumenti/sprite/sorgenti/sotterraneo/generati/PROMPT-scenario.md#i-pezzi-diagonali-e-gli-angoli).

- **Quando una cella taglia** (`taglio` in `scena/muri.js`, pura): è roccia con roccia da due lati contigui (n/o, n/e, s/o, s/e) e **pavimento
  dagli altri due e in diagonale**; `no` e `ne` hanno il pavimento sotto (sono facce), `so` e `se` sopra (sono bordi). Vale solo se quel pavimento
  è di una stanza `smussata`, `cappella` o `sala` (`STANZE_LISCE` in `tela.js`) e non è una porta né una nicchia: una svolta di corridoio, un'elle,
  una croce restano quadrate. Il pavimento di un relitto o di una pozza accanto al muro conta come pavimento della stanza (un
  mucchio di macerie nell'angolo non lascia più la scaletta).
- **L'angolo interno** (`angoloInterno` in `scena/muri.js`, pura): una cella di **pavimento** con la roccia da due lati contigui e in diagonale e il pavimento dagli altri
  due e in diagonale, in una stanza liscia (il 270° del rettangolo: gli angoli di una sala, di una cappella). Si smussa con **gli stessi pezzi del taglio**, posati sul
  pavimento: la roccia (o la faccia obliqua) occupa mezza cella e la cella di faccia sopra diventa tetto (`sopraInterni` in `tela.js`). Non dove il muro accanto è già un taglio
  (sarebbe smussato due volte). Visivamente mangia un po' di cella calpestabile nell'angolo: chi ci sta sopra si vede davanti alla roccia.
- **Dove non si fa** (`intornoBuono`, `trattiDelAngolo`): né un taglio né un angolo interno con una nicchia o una porta fra le otto celle intorno (a una nicchia in diagonale il pezzo scendeva sul pavimento
  e contro il muro dritto senza chiudere), e un angolo interno solo se tutti e due i muri che si incontrano restano dritti per due celle oltre l'angolo. Meglio un gradino che un pezzo che non chiude.
  Su 30 semi (`npm run pianta -- --conta`) gli angoli interni passano da 3230 a 1389, i tagli da 5019 a 4638, e quelli accanto a nicchie e porte da 1005 a 0.
- **La linea passa per gli angoli opposti della cella, a gradini di un pixel del disegno** (4 px a schermo). Il pavimento sotto resta quello vero (la tela
  lo posa anche nella cella tagliata, col tipo del pavimento accanto); il pezzo è trasparente dove c'è pavimento.
- **Il bordo chiaro** (`so`, `se`): la roccia è la tessera del tetto, mascherata col triangolo; la riga chiara e la fascia scura sono quelle del bordo dritto
  (`cripta-bordo-n`), lette in profondità dalla linea (1/√2 di riga per colonna: le quattro colonne chiare di una diagonale sono i tre pixel del bordo dritto).
- **La faccia** (`no`, `ne`): la muraglia a 45° è una fascia di 16 pixel di altezza, la faccia dritta spostata di un pixel per colonna. Sta per metà
  nella cella tagliata e per metà in quella sopra: **un pezzo largo una cella e alto due**, alla cella tagliata il basso e a quella sopra l'alto, ognuno con la
  luce della sua cella (0 = non vista). Il coronamento è alto una riga in più (`CORONAMENTO`): a 45° tre righe sembrano due. La cella di sopra non ha più
  le strisce laterali (`forma.sopra`). Due pezzi per verso, per la parità della fila di due celle della faccia dritta, che così si continua da una cella all'altra.
- **Il perché dei gradini di un pixel**: la fascia della faccia dritta sale di 16 pixel in 16 colonne e le sue due estremità cadono sulle facce dritte accanto
  (`y` e `y - 1`) senza saltare; vale per le scalette di una cella come per i passi da due celle della cappella, che diventano una diagonale sola.
- **Lo strumento**: `python3 strumenti/sprite/diagonali.py [scena]` (`--provino`) rifà i fogli `sotterraneo_4|2|5_diagonali.png` e i loro foglietti dalle tessere
  di ogni scena (lo stesso ritaglio di `atlante.py`); poi `atlante.py sotterraneo`. Sei pezzi per scena: `<scena>-taglio-so|se` (16×16),
  `<scena>-faccia-no|ne-0|1` (16×32). Le funzioni sono in `derivati.py`, la voce di ogni scena (da quale foglio, le righe del coronamento) in `SCENE` di `diagonali.py`.
  Le cantine hanno la faccia alta 20 e il coronamento di quattro righe: la fascia obliqua è alta 16, con quattro righe di mattoni in meno.
- **Provato** (foto prima/dopo, 14 ottobre): ottagoni, cappelle e sale con gli angoli tagliati diventano muri lisci nelle tre scene, i passi da due celle una diagonale, le nicchie e le
  porte restano al loro posto, gli angoli interni di sale e cappelle si arrotondano. **Restano a scaletta** (e va bene: «non tutto deve essere smussato», l'utente, 14 ottobre): i passi da
  tre celle o più della cappella, le celle accanto a una nicchia o a una porta. **Non guardato**: scale accanto a un taglio.

Nei test: `unita/muri-sotterraneo` (§ 6, `taglio` e `angoloInterno`: i quattro versi, il rettangolo che non taglia ma ha i suoi quattro angoli interni, una svolta che taglia solo con un pavimento buono, la nicchia o la porta vicina e il tratto corto; § 7 sui piani veri), `unita/sprite-derivati` (le funzioni e che i fogli siano quelli del comando), `unita/tessere` (i nomi nell'atlante).

## I fogli e l'atlante

- **Il sotterraneo è il primo gioco che usa i due motori comuni**:
  `src/grafica/atlante.js` (posare uno sprite: il piede, lo specchio, i bordi
  netti) e `src/grafica/tessere.js` (quale pezzo va in una cella).

- **Da dove vengono**: il posto dallo scenario generato; mostri e cose da
  raccogliere da fogli generati della stessa famiglia (`mostri-1.png`,
  `mostri-2.png`, nel catalogo comune delle creature: [../core/creature.md](../core/creature.md); `bottino-e-arredo.png`, `scudi.png`,
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
- **Di emoji in scena restano solo i segni sopra le porte.** La fontana
  viene dallo scenario, e la fonte bevuta resta al suo posto, asciutta. Il
  mercante disegnato nei fogli (`cantine-mercante-0`…) e la porta chiara col
  suo segno non si usano più dal 7 ottobre 2026: il mercante è salito sulla
  terra di sopra ([terra-di-sopra.md](terra-di-sopra.md#i-mercanti)).
- **L'arredo è una lista per scenario**: `orpelli` nella voce di `SCENARI`
  (`dati/orpelli.js`): ogni pezzo sa come si piazza e quanto è epico, il piano
  decide quanto è epica una stanza. Le regole sono in [arredo.md](arredo.md).
- **L'arredo** (barili, casse, ossa, uno stendardo, una lanterna che fa luce)
  non si tocca, non blocca e non vale niente: serve a far sembrare che qui
  sotto ci abbia vissuto qualcuno. Un sotterraneo di stanze vuote si legge
  come un diagramma. È disegnato più spento delle cose toccabili, che restano
  come sono. Il braciere è stato tolto: a quella misura non si capiva cosa
  fosse.
- **I relitti e l'acqua** non stanno nel foglio: i pezzi che l'atlante ha (sarcofagi,
  colonne spezzate, blocchi caduti, gargoyle) si posano come l'arredo, il resto
  (macerie, crolli, rocce, travi, stalagmiti, il carro, i binari, le pozze) è
  disegnato in codice in `scena/relitti.js` e **va dipinto**; si cambia una riga in
  `dati/relitti.js` quando c'è il pezzo ([piani-caverne.md](piani-caverne.md#i-relitti)).
