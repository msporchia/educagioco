# Le semplificazioni della fascia bassa nel Sotterraneo 3D

Quello che la bassa (`SPEGNI_BASSA`, store/qualita.js) fa diverso nelle discese e nel mondo di sopra, leva per leva, con quanto ha tolto sul Note 7. Le misure
di partenza e il comando per rifarle stanno in [prestazioni-3d.md](prestazioni-3d.md); la scala del telefono in
[../core/vecchio-telefono-veri.md](../core/vecchio-telefono-veri.md#la-scala).

## Il ritaglio di pavimento e pareti (27/10)

La scala della verifica del Note 7 (27/10, [../core/vecchio-telefono-veri.md](../core/vecchio-telefono-veri.md#la-scala)) ha detto che
il fondo pesa più di tutto il resto: pavimento e pareti con una luce +23 ms (5 chiamate), luci, nebbia e rilievo insieme ~0. Sono una
mesh ciascuno per tutto il piano (~1450 celle), e con la luce per vertice ogni cella del pavimento è 3×3 quadrati e ogni triangolo di
parete diviso in quattro: 73k triangoli, 60k vertici che fanno fino a 12 luci e la nebbia, quasi tutti fuori dall'inquadratura (al più
~15×15 celle). Il JS in più di quel gradino (+7,5 ms sul telefono) non è del gioco: a ×4 sul computer il gioco aggiunge 1 ms, il resto è
l'attesa della GPU.

`scena3d/ritaglio.js`: i triangoli di pavimento e pareti stanno a blocchi di 4×4 celle e prima di ogni disegno l'indice tiene solo i
blocchi che la telecamera tocca (con una cella di margine), riscritto solo quando cambiano; i gruppi dei quattro materiali delle pareti
restano, quindi le chiamate non crescono. Nello scontro di `S` (prestazioni-3d.md, «Per rifarla»): da 128k a 79k triangoli, 69 blocchi su 248. A schermo non
cambia niente (`&spegni=ritaglio` lo spegne, `grafica().ritaglio`: blocchi disegnati e blocchi pieni). Sul Note 7 (27/10 17:06) il
gradino 1 è sceso solo da +23 a +20 ms: i vertici non erano il peso, lo sono i pixel.

**Il terreno semplice** (`ACCESI.terrenoSemplice`, nella bassa `terrenoSemplice:1`): pavimento e pareti senza trame (niente filtro
anisotropo, rilievo, macchie e pozze a rumore per pixel, bagliore delle facce); il colore medio della trama (×0,88 sul pavimento, se no
viene più chiaro), una tinta per cella (le lastre) e le macchie larghe stanno nei vertici, fatti una volta. `&spegni=terrenoSemplice` torna
alle trame. Sul Note 7 (27/10 18:19) il gradino 1 è sceso da +20 a +10 ms.

**Arredo e armi semplici** (la bassa, `arredoSemplice:1`, `armiSemplici:1`): colonne, arredo, botti, fontana e portale col colore medio
della trama al posto della trama e del rilievo (`conMaschera`, maschera.js; pavimento e pareti dicono `arredo: false`); le armi in mano
all'eroe fuse in un pezzo dal modello nuovo della figura (`appiattisci`, roba3d.js: colore dei materiali nei vertici, un materiale per
tutte, niente aloni né fiamme; l'animazione gira una volta prima, se no le fiamme restano enormi). Non il ripiego della collezione, che
viene dal disegno 2D. Le anteprime le tengono intere. Il 27/10 sera il gradino 2 è sceso da +12 ms a niente; il gradino 8 no (le armi non si notano).

**La torcia semplice** (la bassa, `torciaSemplice:1`, 28/10): la torcia è due luci, l'alone attorno all'eroe e il cono davanti, e i
personaggi pagano ogni luce a ogni pixel (il gradino 4 della scala: +7 ms). Ai personaggi resta l'alone, 1,2 celle avanti e 2,5 volte più
forte (`LUCE.torcia.semplice`); il cono è invisibile per three ma la luce per vertice del piano lo legge ancora (`soloVertice`), e l'alone
del piano resta quello di sempre (`scriviVertice` lo rimette per il suo disegno). A vista lo scontro è quasi uguale. Senza luce per vertice
(`&spegni=lucePerVertice` nella bassa) il pavimento perde il cono.

## L'arredo fuso (28/10)

La scala del 28/10 dava a colonne e arredo +9 ms (19 chiamate): ogni tipo d'arredo era un InstancedMesh suo, la fontana tre torni e
un fondo, il portale sei blocchi, e le botti avevano due mesh dei pezzi rotti che si disegnavano sempre, schiacciate a zero. Nella bassa
(`arredoFuso:1`) `scena3d/fondi.js` fonde a piano finito, prima del primo disegno, colonne, arredo e relitti in una mesh per elemento:
il colore del materiale va nei vertici, e resta un gruppo per materiale uguale a meno del colore (ruvidezza, metallo, emissivo, buco). I
blocchi fuori inquadratura li toglie il ritaglio, come al pavimento. La pietra di fontana e portale diventa un pezzo; i pezzi delle botti
si disegnano solo dopo che una si rompe (in tutte le fasce). Restano a sé le staffe delle torce (si nascondono quando il muro si abbassa)
e i portali (vanno e vengono). Nello scontro di `S` (prestazioni-3d.md, «Per rifarla»): da 49 a 42 chiamate, da 70k a 57k triangoli; colonne e arredo
da ~24 a 12 chiamate in tutto il piano. A schermo uguale (`&spegni=arredoFuso` per il confronto).

## Le matrici (28/10)

Col disegno tutto spento il profilatore dava `updateMatrixWorld` come la voce più grossa del giro del gioco: three ripassa a ogni disegno
tutte le matrici della scena, 632 oggetti nello scontro con 3 mostri, e 523 sono mostri, di cui cinque **di scorta e nascosti** (la
riserva di mostro3d.js), ripassati per niente. In più eroe, mostri e persone si rifacevano le matrici dopo averle animate, e la scena le
rifaceva una seconda volta. Ora le loro radici sono `daSola` (matrici.js): la scena le salta, e la figura le rifà una volta (`rifai`) solo
quando si vede. Provato `matrixWorldAutoUpdate = false`: in three r186 ferma anche la matrice dell'oggetto stesso, e le figure finiscono nell'origine.

## Il mondo di sopra (28/10)

Gli fps veri del 28/10 (Note 7, bassa): discese e fattoria a 59, il villaggio 16 e lo scontro sul prato 15; nel mondo di sopra la bassa
non toglieva niente (l'ombra del sole no: `ombre` spento spegne la mappa d'ombra di tutto il contesto, anche sopra). La scala del villaggio
dava quasi tutto al primo gradino, cielo-mare-luci +48 ms di GPU (lavoro in fila), e il rilievo del terreno +7,7.

- **Il cielo per ultimo** (`mondo/acqua.js`, tutte le fasce): stava a `renderOrder` −10, quindi si colorava tutto lo schermo (tre ottave di
  rumore a pixel) e il terreno ci ridipingeva sopra; dall'alto del gioco non si vede quasi mai. Ora a 100: è in fondo (`xyww`) e colora
  solo i pixel rimasti vuoti. **L'acqua dopo il terreno** (`renderOrder` 1): il piano copre tutta la mappa sotto la terra, e così la
  profondità lo scarta prima di colorarlo. A schermo uguali (scatti del villaggio e della palafitta, prima e dopo).
- **Il rilievo** (la bassa, `rilievo`): il terreno di sopra, la piazza e i campi senza normal map; nelle discese la bassa le aveva già
  tolte. Il selciato e l'erba si vedono un poco più piatti.
- Il 28/10 la scala metteva la natura (alberi, erba, mobili: `natura.js`, istanze nate dopo `creaNatura`) nel gradino del cielo, perché
  non aveva il suo nome: ora l'ha.

La scala delle 20:37, col cielo e la natura al loro posto: il **mare da solo +45 ms** di GPU (il piano d'acqua a tutto schermo), il
terreno +7, la nebbia della mappa +7, case e natura un paio di ms; il villaggio 18 fps veri. Ogni pixel d'acqua faceva dieci volte
`vrumore` (onde, bolle, ombra delle nuvole), quaranta hash; il terreno sei, e la nebbia della mappa altre sei.

- **Il rumore in trama** (la bassa, `rumoreTrama`; `mondo/vesti.js`): con `RUMORE_TRAMA` `vrumore` legge una trama 256×256 coi valori di
  hash12 ai nodi (filtro lineare, ripetuta, lo smoothstep sulla coordinata): una lettura invece di quattro hash. Vale per tutti gli shader
  che usano `GLSL_RUMORE`: acqua, terreno, ombra delle nuvole, nebbia della mappa, velo. Nella foto del villaggio non si vede la differenza.

Con il rumore in trama (29/10, fps veri): villaggio da 18 a 54, prato da 17 a 48; il mare da +45 a +9 ms. Il villaggio senza antialias
andava a 60.

- **Niente antialias** (la bassa, `antialias`; `contesto.js`): il mondo di sopra lo chiedeva sempre, le discese mai. Staccionate, corde e
  bordi dei tetti hanno i gradini.

Il resto, tutte insieme il 29/10 (la verifica le misura una per una, `leve-sopra`); restava il terreno +19 ms, natura +7, nebbia +7:

- **Lambert** (`lambertSopra`; `vesti.js`, `materialeMondo`): i materiali del mondo (terreno, piazza, campi, kit delle case, natura,
  lontano) di Lambert invece che fisici. Ruvidi com'erano (0,85–1), il riflesso che si perde quasi non si vedeva.
- **Il terreno semplice** (`terrenoSopraSemplice`; `terreno.js`): una lettura della trama dell'erba, come grana, sui colori medi delle
  quattro trame (`mediaDellaTrama`), invece di cinque letture.
- **Il rumore a un'ottava** (`rumoreUnaOttava`, `RUMORE_UNA`): `frumore` è un `vrumore` solo, un po' schiacciato verso il mezzo.
- **Metà erba** (`quantaErba:0.5`; `natura.js`): i ciuffi dei prati.
