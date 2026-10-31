# Come è disegnato: scenari e sprite

Lo scenario generato da un prompt, i fogli degli sprite e come si posano armi e
armature. La discesa è disegnata in 3D ([grafica-3d.md](grafica-3d.md), i paesaggi
in [paesaggi-3d.md](paesaggi-3d.md)); le regole di disegno comuni a tutti i
giochi (atlante, scala nel contesto) stanno in [../core/grafica.md](../core/grafica.md).

## Lo scenario

- **Il vestito intero di un piano è uno scenario**: il colore della roccia, le porte
  (di fronte e di fianco), la scala, la fontana, i forzieri e l'arredo stanno in una
  voce di `SCENARI` (`dati/tessere.js`), e **tutte le voci hanno le stesse
  chiavi**: si cambia vestito a una discesa senza toccare il disegno. Aggiungere
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
- **Uno scenario si può ritagliare dalla scena**: è il modo della cripta. La scena ha una
  mano sola; un foglio piccolo chiesto nella stessa chat porta solo quello
  che la scena non ha (le porte, il mercante).
- **Quello che non c'è nella tavola non si disegna**: `guastiDelleTessere`
  chiede all'atlante ogni nome di ogni scenario, e un pezzo mancante è rosso
  nei test invece che un muro invisibile.
- **La pelle di una porta non ripete niente**: `semplice`, `ferro` o `chiara` a caso, e la `bella` (la porta nera col teschio d'oro, o le corna) solo per il portone del grosso ([piani.md](piani.md#le-porte)). La porta d'oro non c'è più: diceva che dietro c'era un tesoro.

## L'inferno

Il quarto scenario (`inferno`, 15 ottobre 2026), quello della **botola segreta** (`labirinto`, la quinta discesa: ogni discesa il suo scenario, non più scenari che si alternano in orizzontale; i suoi abitanti sono in [mostri.md](mostri.md)): massi con le punte, mattoni scuri e brace, stendardi rossi e un toro cornuto sopra ogni porta. Nasce da **tre immagini di ChatGPT** (nella cartella dei fogli) e da **un attrezzo che fa i pezzi che mancano**.

- **`sotterraneo_6.png`**, la scena (tre stanze e i corridoi). La cella è di 64 px come nelle altre, ma le facce sono più alte (coronamento di massi e mattoni): se ne prende l'alto, 76 px su 64, schiacciato di un quinto. Dalla scena: la porta col teschio cornuto (`bella`) e quella rossa senza (`ferro`).
- **`arredo-inferno.png`**, una tavola su fondo magenta (nove file, scala circa 5,9 px per pixel di gioco): quasi tutto l'arredo (sarcofagi, altari, statue e gargoyle, colonne, torce, gabbie, stendardi, fucina, troni, tavolo del boia…), più la porta di legno e la scala in cornice di pietra. Se ne ritagliano i 60 pezzi che il gioco posa; la grata e il lucchetto servono solo all'attrezzo e stanno in `per_i_derivati` del foglietto, fuori dall'atlante.
- **`bottega-inferno.png`**, il terzo foglio (una «bottega infernale»): è una tavola di ambienti, e ne vengono 21 pezzi (obelischi, forche, cristalli, il cerchio del pentagramma, il demone sul trono, punte di roccia e alberi secchi per i relitti, le cose piccole). **Restano fuori** gli ambienti interi (l'ingresso della caverna col teschio, il recinto, l'orto, la tenda, il ponte, la cascata di lava: sono scene, buoni semmai da sfondo di un grosso), il cancello a spuntoni (sembra un passaggio: regola del decoro), casse e botti, ossa e teschi, il forziere pieno d'oro (il d'oro è solo delle missioni).
- **`python3 strumenti/sprite/inferno.py`** (`--provino` in `tmp/inferno.png`) fa in codice quello che nessuno ha dipinto: la porta **chiara**, i **quattro fianchi** (colori campionati dalle porte) e la **scala chiusa** (la grata e il lucchetto sulla scala). La porta aperta e la fontana non servono: in 3D una porta aperta non si disegna e la fonte è modellata. Scrive `sotterraneo_6_derivati.png`; poi `atlante.py sotterraneo`. Se un pezzo non regge a schermo si fa chiedere al modello: la regola resta «prima in codice, poi dipinto».
- **I forzieri sono quelli della fornace** (la scena non li ha e il ferro con la brace sta bene): da chiedere al modello.
- **Dove si vede**: la botola segreta (`giu=5` nei cheat); l'abisso, che attraversa cantine, cripta e fornace, non lo ha (le sue creature sono quelle della botola).

## I fogli e l'atlante

- **Gli sprite si leggono dall'atlante comune** (`src/grafica/atlante.js`: il
  piede, lo specchio, i bordi netti); `scena3d/figure.js` li posa.
- **Da dove vengono**: il posto dallo scenario generato; mostri e cose da
  raccogliere da fogli generati della stessa famiglia (`mostri-1.png`,
  `mostri-2.png`, nel catalogo comune delle creature: [../core/creature.md](../core/creature.md); `bottino-e-arredo.png`, `scudi.png`,
  `armature-e-vesti.png`); eroi, forzieri e monete ancora da **0x72, «16×16
  DungeonTileset II», CC-0**.
- **L'atlante** lo monta `strumenti/sprite/atlante.py sotterraneo` (formato
  in `strumenti/sprite/FORMATO.md`): un PNG di circa 660 KB per 890 pezzi,
  incorporato in base64, così il build resta un file solo. Un pezzo sta
  nell'atlante solo se il gioco lo può disegnare ([../core/sprite.md](../core/sprite.md#gli-inutilizzati)):
  quello che ha un modello 3D si mostra con la sua foto. Si ritaglia **solo
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

- **L'eroe porta armi e armature addosso nel suo modello 3D** ([roba-3d.md](roba-3d.md)); le figure dipinte della roba restano per
  terra e in pugno ai mostri delle varianti.
- **Di emoji in scena restano solo i segni sopra le porte.** La fontana è modellata (`scena3d/fontana.js`), e la fonte bevuta
  resta al suo posto, asciutta. Il mercante dipinto nei fogli è stato tolto: il mercante è salito sul mondo di sopra
  ([bottega.md](bottega.md#i-mercanti-di-sopra)).
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
  fatto in codice in `scena3d/relitti.js` ([piani-caverne.md](piani-caverne.md#i-relitti)); si cambia una riga in
  `dati/relitti.js` quando c'è il pezzo dipinto.
