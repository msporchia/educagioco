# La vetrina: cose di scena modellate in codice

Dal pannello dell'ingranaggio, «Vetrina dei pezzi» (o `?vetrina=1`, anche nel file unico): una sala lunga, senza mostri, con
le cose in fila e un'etichetta su ognuna. Si tocca una porta (chiusa → aperta → forzata), la grata
(sale e scende), il forziere (si apre), un vaso (si rompe). Il codice è `sotterraneo-luce/vetrina.js`,
una funzione per famiglia; la fontana sta a parte (`fontana.js`, [sotterraneo-luce.md](sotterraneo-luce.md)).
Lo scopo: capire, prima di impegnarsi, fin dove reggono forme non squadrate fatte senza modellatore.

Le regole che le tengono coerenti: **pochi materiali condivisi** (pietra, roccia, legno, ferro,
ruggine, coccio, osso, stoffa, oro, cera), tutte con la stessa luce, la stessa maschera del visto e
le stesse ombre; **un rumore 3D deterministico** (`ammacca`) che sposta i vertici lungo la normale,
così niente è a filo e le cuciture combaciano; trame dipinte su `<canvas>` con la normal map
ricavata dall'altezza (`daCanvas` in `trame.js`). Geometrie fatte una volta e riusate, ripetizioni
istanziate (sassi, stalagmiti, ossa, sbarre), niente allocato a fotogramma.

## I numeri

Misurati da `vetrina.misura` (in console all'apertura). Le righe sono quelle della famiglia in
`vetrina.js`, utensili comuni esclusi; il tempo è il mio, scrivendo e guardando gli scatti.

| famiglia | righe | tempo | triangoli | draw call | geometria | come regge |
|---|---|---|---|---|---|---|
| macchie (muffa, sangue, bruciatura, pozza, crepa, muschio) | ~45 | 20 min | 20 | 10 | 1 KB | crepa e bruciatura **belle**; muffa e muschio **passabili** (troppo tenui); la pozza **non regge** senza un riflesso vero |
| porte (arco, assi con ferramenta, forzata, grata) | 61 | 40 min | 3 016 | 18 | 256 KB | **bella** la grata, **passabili** le porte d'assi; l'anta aperta è un'asse arancione che sporge |
| contenitori (giara, anfora, ciotolone, barile, cassa, forziere, sacco) | 99 | 45 min | 4 440 | 60* | 369 KB | **belli** vasi e barile (il tornio è fatto per loro), il forziere che si apre, la rottura in cocci; la cassa **passabile**; il sacco **passabile** (pare una patata) |
| pietre e ossa (sassi, crollo, stalagmiti, stalattiti, ossa, teschio) | 51 | 30 min | 5 096 | 10 | 105 KB | ossa e teschio **passabili**; stalattiti **belle**; sassi e crollo **non reggono** da vicino (sfaccettati, sembrano carta) |
| arredi (altare, statua, torcia, lanterna, candelabro, arazzo, bandiera) | 105 | 60 min | 2 774 | 35 | 132 KB | **belli** arazzo e bandiera (ondeggiano, strappati), l'altare con le candele, la lanterna; la statua **passabile** (si legge come statua, non come qualcuno) |
| organiche (radici, funghi giganti, tela di ragno) | ~55 | 35 min | 2 791 | 8 | 245 KB | **belli** i funghi; radici **passabili** (tubi lisci); la tela **non regge** (linee di un pixel) |

\* 45 delle 60 sono i cocci dei vasi, nascosti finché non si rompono: un vaso intero è una
chiamata, rotto quindici. Da fermi i cocci si potrebbero fondere in una geometria sola (non fatto).

In tutto la vetrina aggiunge ~18 000 triangoli e ~80 draw call visibili: meno della metà di quello
che costano oggi le figure dell'atlante (una chiamata ciascuna). Il peso nel file è il codice
(~540 righe, ~25 KB), le geometrie si fanno all'avvio.

## Il giudizio

- **Conviene modellare in codice** quello che è fatto di **torni ed estrusioni**: vasi, anfore,
  barili, coppe, fontane, candelabri, colonne, archi, gradini, altari, e le cose **con uno stato
  che cambia**: porte che si aprono, grate, forzieri, vasi che si rompono, fontane che si
  svuotano, stoffe che ondeggiano. Lì il 3D vince sullo sprite: la luce gira attorno, l'ombra è
  vera, e l'animazione fra due stati costa dieci righe invece di un foglio nuovo.
- **Conviene lasciare allo sprite 2D** le **creature**, le **persone** e tutto quello che deve
  dire «chi è»: la statua è una statua qualsiasi, un mostro modellato così sarebbe un pupazzo.
  Anche gli oggetti piccoli del bottino (anelli, ampolle, armi in terra): da 15 celle sono pochi
  pixel e il disegno dice di più della forma.
- **Le macchie** sono a metà: tanto valore per poche righe (una crepa o una bruciatura cambiano
  una stanza), ma vanno tarate a mano perché si leggano da lontano, e l'acqua vorrebbe un riflesso.
- **Non è fattibile senza un modellatore**: forme organiche complesse e riconoscibili (una
  statua che sembri qualcuno, un drago di pietra, radici nodose, un crollo che sembri un crollo
  e non un mucchio di sassi), e tutto quello che vuole una silhouette precisa. Il rumore ammacca,
  non scolpisce: rende credibile una forma semplice, non ne inventa una complessa.
- Dalla vista di gioco (15 celle) quasi tutto si legge come **forma e colore**, il dettaglio si
  perde: conviene investire nella silhouette e nella luce (la fiamma delle candele, l'oro del
  forziere aperto), non nei vertici.

## Dove i limiti si vedono

- **Lo sfaccettato**: un icosaedro ammaccato con le normali per faccia è carta piegata. Servono
  normali morbide o una normal map di roccia vera.
- **I tubi**: `TubeGeometry` ha il raggio fisso; le radici si stringono dopo, anello per anello, e
  restano lisce: niente nodi, niente corteccia.
- **Le linee**: WebGL disegna linee di un pixel, la tela di ragno sparisce da lontano. Andrebbe
  fatta di nastri (piani sottili) o dipinta come macchia nell'angolo.
- **Le stoffe**: l'onda è nel vertex shader, ma l'ombra no (il materiale dell'ombra non la conosce):
  da vicino l'ombra resta piatta.
- **Le macchie sul muro** sono piani incollati alla faccia: in uno spigolo si tagliano. Le
  decalcomanie proiettate (`DecalGeometry`) non funzionano sugli `InstancedMesh` dei muri.
