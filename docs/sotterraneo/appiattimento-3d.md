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

## Nel gioco: la luce per vertice della bassa

`ACCESI.lucePerVertice` (`scena3d/costanti.js`), acceso nella bassa (`lucePerVertice:1` in `SPEGNI_BASSA`): **il piano** (pavimento,
pareti, colonne e staffe, arredo, botti, fontana, portale, relitti: tutto quello che passa da `conMaschera`) somma le luci nel vertex
shader; le figure (`vertice: false`: un quadrato farebbe quattro angoli) e i personaggi 3D restano per pixel con le luci di three.
`scena3d/luce-vertice.js`:

- le luci in una trama di una riga (`creaLuceVertice`, con gli uniform della maschera): la scrive `luci.scriviVertice` in
  `scena.onBeforeRender`, con luci e cono già al loro posto. Le puntiformi di three che stanno in scena e sullo strato visto (alone,
  lampo, magia, rimbalzo, palco) e **tutti e sei i fuochi** della riserva, anche se a three ne restano due (`fuochi:2`): per vertice non
  costano. L'emisferica, il cono con la penombra, la distanza e il decadimento come in three; la speculare è una Blinn con la ruvidezza
  media della trama e la visibilità della GGX (senza, la chiazza calda della torcia sul pavimento era la metà);
- il pezzo di shader si aggiunge **alla creazione** del materiale (`preparaLuceVertice` in `conMaschera`): la chiave del programma
  cambia una volta (`|pv`), i programmi restano quelli (uno in meno: la nebbia). Le sostituzioni hanno la guardia: un pezzo di three
  che manca ferma lo shader invece di disegnarlo sbagliato;
- la normal map e la ruvidezza escono dal materiale: con `rilievo` la normal map si legge come **ombreggiatura ferma** (una lettura,
  le fughe scure e i bordi chiari come se la luce venisse dall'alto dello schermo, in media scura quanto la normal map vera); senza
  `rilievo` niente;
- la nebbia è un termine per vertice (`vPvNeb`: il rumore che deriva, la luce che arriva lì, la tinta del paesaggio, densa quanto le
  fette che sostituisce) e la fetta non c'è più;
- pavimento in 3×3 quadrati per cella, ogni triangolo dei muri e delle colonne in quattro (`SUDDIVIDI`, `dividi`: l'indice di cella
  `aCella` non si media): la luce interpolata resta liscia.

**Cosa cambia a vista** (`tmp/scatti/lucepervertice-scontro.png`, `-cantina`, `-fuoco`, `-vicino`: alta | bassa di oggi | bassa):
riconoscibile, torcia calda e buio ai margini uguali. Il pavimento è ~5% più scuro della bassa di oggi (senza `rilievo` le due
coincidono al pixel: lo scarto è tutto dell'ombreggiatura ferma), il rilievo dei mattoni è più morbido, i bordi delle chiazze di luce
un poco più larghi, la nebbia non passa più davanti ai personaggi; le torce lontane tornano a schiarire il pavimento (sei fuochi invece
di due). Si rifanno con `node strumenti/tavola-fasce.mjs --porta <vite> --conta --viste scontro --nome lucepervertice-scontro`.

**I conti** (stessa tavola, Chrome senza schermo, pixel ratio 1; «oggi» è la bassa con `&riaccendi=lucePerVertice`):

| vista | | chiamate | triangoli | programmi | uniform | bindTexture | luci·frammenti | frammenti | trame·frammenti |
|---|---|---|---|---|---|---|---|---|---|
| scontro | alta | 55 | 84k | 34 | 128 | 42 | 4,22M | 0,52M | 1,24M |
| | oggi | 40 | 60k | 34 | 71 | 35 | 1,61M | 0,34M | 1,06M |
| | **bassa** | 39 | 121k | 33 | 77 | 40 | **0,03M** | 0,30M | 0,80M |
| cantina | oggi → bassa | 34 → 33 | 42k → 102k | 32 → 31 | 26 → 26 | 31 → 36 | 2,05M → 0,04M | 0,42M → 0,36M | 1,31M → 0,98M |
| fuoco | oggi → bassa | 35 → 34 | 42k → 102k | 32 → 31 | 26 → 26 | 31 → 36 | 1,91M → 0,02M | 0,42M → 0,37M | 1,31M → 0,99M |
| vicino | oggi → bassa | 32 → 31 | 48k → 110k | 32 → 31 | 35 → 39 | 32 → 37 | 1,50M → 0,02M | 0,32M → 0,28M | 1,00M → 0,75M |

Lo shader di frammento del pavimento (`--shader`: il sorgente che three dà a WebGL, coi `#define` risolti, solo quello che `main()`
raggiunge): oggi 5 letture di trama, 6 derivate, 161 righe; con la luce per vertice 3 letture, 2 derivate, 73 righe (il vertex shader
da 16 a 61 righe, ma i vertici sono ~50k contro 0,3M frammenti).

**Cosa ci si aspetta sul Note 7**: le luci per pixel tolte dal piano sono quasi tutte quelle della scena (`ab-luci0`: −13 gpu), la
fetta di nebbia (`ab-nebbia`: −8 gpu), i triangoli raddoppiati +2: **gpu da ~46 a ~28-33 nello scontro**; il JS quasi uguale (le luci
di three restano per i personaggi, gli uniform sono quelli). Da guardare lo scontro (`tri-1`, `sot-1`). Per misurarlo la verifica
sul telefono mette accanto alla scena intera la stessa con `&spegni=lucePerVertice` (o `spegni: ['lucePerVertice']` nell'`opz` della
famiglia delle discese): la differenza è la leva. Il rischio resta la riga «senza normal map» (sotto).

Resta del piano del prototipo: l'ombra a macchia sotto chi sta in piedi (`finti.js`: la bassa oggi non ha ombre), la penombra cotta
nei colori ai vertici (provata nel prototipo, qui non serve per somigliare alla bassa di oggi), e il JS (la saldatura sotto i tetti
delle regole, `matrixAutoUpdate = false` per il fermo). I personaggi restano per pixel: nello scontro sono 0,01-0,02M frammenti.

## La normal map che «costa» (+10 gpu senza)

Nel log del 22/10 (`ab-normali`, una sola misura) togliere le normal map fa salire la GPU da 48 a 58 ms. **Nel codice non c'è niente
che lo spieghi**: senza normal map lo shader del pavimento ha 3 letture di trama invece di 5, 2 derivate invece di 6 (via le tangenti
calcolate con `dFdx`, restano le due della ruvidezza della geometria di three), 140 righe invece di 161; nessun ramo di three ripiega
su un calcolo più caro quando la trama manca (`USE_NORMALMAP` aggiunge soltanto); i programmi sono gli stessi; sul computer i ms
scendono un poco. L'ipotesi delle derivate è al contrario: le derivate ci sono **con** la normal map. Restano due spiegazioni da
provare sul telefono: il rumore (una misura sola, nello stesso gruppo «Lambert», più leggero per pixel, sale anche lui di +4) e il
modo della prova, che toglie le normal map a scena fatta (`veri/moltiplica.js`, `needsUpdate`: 11 programmi ricompilati a metà
scena, sull'Adreno senza compilazione in parallelo), mentre il gioco le toglie alla creazione (`&spegni=rilievo`).

La leva giusta non è il `flatShading` (è proprio una derivata per pixel in più) né i colori ai vertici al posto della trama: nella
bassa la luce per vertice toglie già la normal map vera, e `rilievo` decide solo la lettura dell'ombreggiatura ferma (spento: 2 letture
invece di 3, il pavimento piatto). Nella verifica: `&spegni=rilievo` alla creazione al posto della prova a scena fatta, e la scena base
ripetuta dopo (base, senza normal map, base) per vedere quanto balla.

- provato una regressione libera dei ms del telefono sui conti (dieci righe): coefficienti negativi, non regge; i costi si leggono
  riga per riga.
- provato le luci per vertice in array di uniform: three li copia e confronta a ogni materiale (+40% di chiamate `uniform`); in una
  trama letta nel vertice (`texelFetch`) le chiamate scendono sotto quelle di oggi.

Torna a [grafica-3d-costi.md](grafica-3d-costi.md).
