# L'appiattimento del Sotterraneo 3D: cosa costa sul Note 7

Il Sotterraneo 3D sta a 10-14 fps nello scontro sul Redmi Note 7. Qui: **cosa gli dà fastidio e su cosa si può osare**, misurato una
leva alla volta sulla scena vera, e i due livelli che ne vengono (alta e bassa). Le regole per chi crea modelli ed effetti:
[appiattimento-3d-regole.md](appiattimento-3d-regole.md). Il prototipo: `poc/appiattimento-3d.html` ([../../poc/appiattimento-3d.md](../../poc/appiattimento-3d.md)).

## Il metro

I **ms** vengono solo dal telefono: il log del 22/10 a telefono freddo, con JS e GPU separati
(`strumenti/vecchio-telefono/log/redmi-note7-veri-22ott-2.txt`, «js» = dal primo `requestAnimationFrame` al disegno inviato, «gpu» =
l'attesa della lettura di un pixel). Il computer è carico di altri lavori: i suoi ms ballano fino al ±100% e valgono come ordine di
grandezza. Dal computer si prendono i **conti**, che non dipendono dal carico (`node poc/appiattimento-3d/misura.mjs`):

- chiamate, triangoli, shader in uso, nodi della scena, luci vere;
- le **chiamate a WebGL** di un disegno: `useProgram`, `uniform*`, `bindTexture`, i byte caricati (`contaGL`);
- i **frammenti colorati** (la scena ridisegnata a parte con ogni materiale che somma il suo peso invece del colore: `conta.js`), divisi
  per famiglia (luce per pixel, per vertice, piatti, rumore come nebbia e fiamme, additivi, punti), e pesati per le luci che ogni
  frammento somma, le trame che legge, le letture della mappa d'ombra;
- dove va il JS in proporzione (il profilatore di Chrome: `--profilo`).

Lo scontro misurato è quello del log (`tri-1`: tre scheletri leggendari, l'eroe vestito di leggendari, fascia bassa, pixel ratio 1):
sul computer 241 chiamate e 86k triangoli, come sul telefono.

## Quello che dice il telefono (scontro: js 39,6 + gpu 46,4 ms)

**La GPU** (ms per fotogramma):

| cosa | costo sul Note 7 | conto sul computer | verdetto |
|---|---|---|---|
| triangoli | ×8 (86k → 388k): +10 gpu, js uguale | | **si osa**: ~3 ms ogni 100k |
| chiamate senza cambi di stato | ×4 (241 → 892): +5 gpu, +14 js | stessi programmi e uniform | con misura: 0,02 ms di JS l'una |
| luci per pixel, le prime | da 4 a 0 (`ab-luci0`): −13 gpu, −4 js | luce·frammenti 2,4M → 0,3M | **da evitare** nella bassa |
| luci per pixel, oltre ~9 | 9 → 15 luci: +136 gpu (60 → 196) | luce·frammenti 4M → 6,5M | **mai**: un precipizio, non una retta |
| ombra del cono (mappa) | −3,6 gpu, −2,8 js | 0,41M letture, 21 oggetti ridisegnati | da evitare nella bassa: la macchia costa niente |
| fette di nebbia (2, rumore) | −8 gpu | 0,11–0,14M frammenti «rumore» | **da evitare**: ~70 ms per milione di frammenti, il più caro per pixel |
| particelle (polvere, scintille) | −5,3 gpu, −1,5 js | pochi frammenti, ma girano le luci | con misura |
| materiali Standard → Basic | −15 gpu, −8 js | uniform 607 → 317 | il fondo vero è lì sotto (sotto) |
| Standard senza luci → Basic | −1,4 gpu | | lo Standard da solo costa poco: costano le luci |
| Lambert | +4 gpu, +3 js | | **no**: non conviene |
| togliere le normal map | **+10 gpu**, +2 js | trame·frammenti −0,4M, programmi uguali | non capito: da rimisurare (sotto) |
| pixel | ~54 ms per milione di pixel; dpr 0,6: −11,5 | frammenti ×0,36 | ~18 ms del fotogramma seguono i pixel, ~30 no |
| passaggio finale | ±2 | | la bassa lo tiene spento |

**Il JS** non è il gioco: sul computer il codice del Sotterraneo è il 5-8% del JS del fotogramma, three il 70% (`setProgram`,
gli `uniform` copiati e confrontati — `flatten`, `copyArray` — `updateMatrixWorld`, `renderBufferDirect`, `bindVertexArray`). Sul
telefono il JS di un fotogramma è ~17 volte quello del computer (la prova di CPU dice solo 4): il prezzo è per **oggetto disegnato**,
non per triangolo. Ogni oggetto porta almeno tre `uniform` (le sue matrici) e un `bindVertexArray`: lo scontro fa ~900 chiamate
`uniform` e ~230 oggetti, e dai log 100 `uniform` costano 1,2-2,6 ms di JS sul Note 7, un mostro in più +3 ms, l'eroe leggendario
(~85 pezzi dopo la saldatura) è da solo il personaggio più caro.

**Il fondo di ~60 ms** (Basic e nessuna luce: js 27, gpu 33) si spiega così, coi conti: della GPU ~11 ms sono pixel (0,55M
frammenti, di cui 0,13M di nebbia a rumore), ~3 la composizione dello schermo (lo schermo vuoto fa 3,5), ~3 i triangoli, ~2 le
chiamate, il resto (~12) è lavoro che non segue i pixel: con buona probabilità il processo della GPU sulla CPU del telefono (ANGLE e il
driver a ogni cambio di stato), che la lettura del pixel aspetta. Del JS, i ~160 oggetti con le loro matrici (~200 uniform) e il
codice di three per ognuno. La pelle (6 persone: +4 uniform e +3 trame d'ossa per persona rispetto alle stesse rigide, stessi
frammenti) e il passaggio finale pesano poco. Per
saperlo davvero servono le scene «il fondo…» qui sotto, sul telefono.

## I due livelli

| | alta (come oggi) | bassa di oggi | **bassa nuova** | bassa+ (dpr 0,75) |
|---|---|---|---|---|
| luce | per pixel, 12 luci + ombra | per pixel, 5 luci + ombra | **per vertice**: tutte le luci (6 fuochi, lampo, magia, palco, rimbalzo, cono) in una trama, zero per pixel | uguale |
| nebbia | 5 fette | 2 fette | **per vertice** (niente fette) | uguale |
| ombra | mappa 1024 | mappa 512 a fotogrammi alterni | **macchia** sotto chi sta in piedi | uguale |
| rilievo | normal map | normal map | la normal map letta come ombreggiatura ferma (una trama, nessuna luce) | uguale |
| pavimento e muri | | | suddivisi (×16 e ×4) e la penombra cotta nei colori ai vertici | uguale |
| conti (scontro) | 242 ch, 86k tri, 12,9M luce·fr, 1,76M fr | 241 ch, 86k, 2,3M luce·fr, 0,55M fr | 226 ch, 141k, **0 luce·fr**, 0,42M fr, 774 uniform | 0,24M fr |
| stima Note 7 | gpu ≫ 100 (12 luci: il precipizio) | js 40, gpu 46 (vero) | **js ~31, gpu ~27** | js ~31, gpu ~23 |

La stima della bassa somma le righe vere del telefono: −13 (niente luci per pixel né ombra), −8 (niente fette), +2 (i triangoli in
più), −4 di JS per gli uniform delle luci e −3 per la passata d'ombra. **La GPU arriva al bersaglio (≤ 28), il JS no (~31 contro 25)**:
appiattire i pixel non basta, il JS si abbassa solo con meno oggetti (le regole). Il rischio: se la riga «senza normal map» (+10) è
vera e non un caso, la bassa nuova sta a ~37 di GPU; la decide il telefono.

**Il Pixel 9a in alta.** Il 9a non ha un log coi modelli veri. Dal log a scene è 2-3,5 volte il Note 7 sulla GPU (3,5 sugli shader
pesanti) e 4,3 sulla CPU, con 1,7 volte i pixel a parità di pixel ratio. L'alta accende 12 luci per pixel e 5 fette di nebbia a 1,5:
sul Note 7 è oltre il precipizio delle luci, sul 9a probabilmente 30-50 ms di GPU nello scontro (20-30 fps), mentre il JS (~9 ms)
starebbe largo. **Anche sul 9a la cosa che può non reggere sono le 12 luci per pixel**: da misurare (`?telefono=1&gruppi=livelli`).
Se non regge, l'alta resta com'è ma con al più ~8 luci per pixel (i fuochi oltre il sesto per vertice o spenti).

## Cosa si perde a vedere

Le tavole (392×774 a pixel ratio 2, ognuna alta | bassa di oggi | bassa | bassa+): `tmp/scatti/appiattimento-scontro.png`,
`-cantina.png`, `-fuoco.png`, `-vicino.png`; le leve una per una sull'eroe da vicino: `tmp/scatti/appiattimento-leve-vicino.png`
(`node poc/appiattimento-3d/scatta.mjs`, poi `--viste vicino --leve '…' --nome leve`).

- **Le ombre del cono**: le colonne e i mostri non stendono più l'ombra lunga sul pavimento; resta la macchia sotto i piedi. È la
  perdita più visibile.
- **Il rilievo dei muri di fronte**: i parapetti verso la telecamera, che prendono luce solo dalla normal map, diventano lisci e
  scuri; il pavimento tiene le fughe dei mattoni col rilievo fermo.
- **La luce più morbida**: la chiazza della torcia ha il bordo più largo (interpolata sui vertici); sui personaggi non si vede.
- **Il colore**: la bassa, coi fuochi e la luce del palco riaccesi (per vertice costano niente), è più chiara e più calda della bassa
  di oggi, più vicina all'alta; manca la correzione del passaggio finale (come oggi nella bassa).
- **La nebbia** è un velo che segue i vertici e non si muove fra i personaggi: chi non la cerca non se ne accorge.
- **Suddividere o no**: sulla tavola delle leve la luce per vertice col pavimento intero (un quadrato per cella) e quella suddivisa
  quasi non si distinguono: la suddivisione si può togliere (−55k triangoli), da guardare col dito.
- **I bagliori finti** del prototipo non leggono la maschera del visto: si vedono anche i fuochi fuori vista (gli aloni in alto
  nella tavola). Nel gioco vanno spenti con la visibilità, come le fiamme.
- **Basic** senza la maschera accende tutto il piano (la tavola delle leve): serve solo a misurare.
- **bassa+** a 0,75 è più morbida (l'ingrandimento del browser), si nota sui bordi dei personaggi da vicino.

## Cosa far misurare al Note 7

La stessa pagina del prototipo, in un file unico (`POC=appiattimento-3d FUORI=tmp/poc-appiattimento npx vite build -c
strumenti/poc-file-unico.config.js`), aperta sul telefono con `?telefono=1`: una scena dopo l'altra nella sua cornice (un
contesto WebGL nuovo), banco di 20 disegni ×3 col minimo, i conti, alla fine il resoconto da copiare con la riga `DATI`.
`&gruppi=livelli,togli` per farne una parte. In ordine di importanza:

1. `livelli`: alta, bassa di oggi, bassa, bassa+ (e sul Pixel 9a: regge l'alta?).
2. `togli`: la scomposizione col mostro e i colpi, **con `senza:normali` di nuovo** e `luce:vertice` (che le toglie anch'essa): se
   «senza normal map» costa davvero +10, il rilievo fermo della bassa va tenuto come normal map vera e la luce per vertice si rifà.
3. `togli`, le scene «il fondo…»: Basic senza luci, poi senza ombra, particelle, nebbia, effetti 3D, mostri 3D: chi sta nei ~60 ms.
4. `luci`: dove sta il precipizio (4, 6, 8, 10, 12 luci vere) e i bagliori finti.
5. `pelle`, `trasparenze`: le persone con e senza pelle, gli additivi grandi sovrapposti (×2,2 e ×3,4 di frammenti).

## Il piano per il gioco (dopo la scelta)

- **`scena3d/costanti.js`, `ACCESI`**: tre pezzi nuovi, `luceVertice`, `nebbiaVertice`, `ombraMacchia` (veri o falsi); la bassa li
  accende in `SPEGNI_BASSA` di `store/qualita.js` (`luceVertice:1`… come `lampi:1`), e toglie `fuochi:2`, `lampi`, `palco` (per vertice
  non costano). Alta e media restano come sono (alta = livello alta, media = alta col suo pixel ratio).
- **`scena3d/luce-vertice.js`** (nuovo, da `poc/appiattimento-3d/piatto.js`): la trama delle luci scritta una volta per fotogramma in
  `luci.js` (al posto di `distribuisci` sulle luci di three, che con `luceVertice` non entrano in scena: nessuna ricompilazione
  dopo), e il pezzo di shader che `conMaschera` (`maschera.js`) aggiunge **alla creazione** di ogni materiale Standard, non dopo: così
  i programmi sono quelli e basta (il prototipo converte a scena fatta e lascia in cache i programmi di prima).
- **`terreno.js`**: pavimento e muri suddivisi e la penombra cotta (`aCotta`) quando la luce è per vertice; la normal map diventa il
  rilievo fermo.
- **`particelle.js`**: con `nebbiaVertice` niente fette (il termine è nel materiale).
- **`segni.js`** o un modulo nuovo: le macchie sotto l'eroe e i mostri (una chiamata, `finti.js`).
- I materiali dei mostri, dell'eroe e degli effetti passano dallo stesso `conMaschera` (o da un `conLuce` gemello) per avere il pezzo
  di shader: oggi ne fanno a meno, e il prototipo li converte a mano.
- Le prove: un test d'unità sulla trama delle luci (ordine, fuochi fuori dal giro cotto, il cono), e quello del browser che conta i
  programmi a ogni colpo deve restare fermo; `unita/budget-3d` (le regole) diventa il controllo dei modelli nuovi.
- Prima del gioco, il JS: la saldatura dell'eroe e dei mostri sotto i tetti delle regole, e `matrixAutoUpdate = false` per quello
  che non si muove (pavimento, muri, arredo, colonne).

- provato una regressione libera dei ms del telefono sui conti (dieci righe): coefficienti negativi, non regge; i costi si leggono
  riga per riga.
- provato le luci per vertice in array di uniform: three li copia e confronta a ogni materiale (+40% di chiamate `uniform`); in una
  trama letta nel vertice (`texelFetch`) le chiamate scendono sotto quelle di oggi.

Torna a [grafica-3d-costi.md](grafica-3d-costi.md).
