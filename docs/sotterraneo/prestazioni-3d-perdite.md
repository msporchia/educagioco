# Le perdite di memoria del 3D

Sul Redmi Note 7 (4 GB) il Sotterraneo 3D «a un certo punto si pianta», e la misura «Chi pesa» si è fermata alla scena
50/138 senza che «Interrompi» rispondesse. Una perdita si vede sul computer senza i tempi: **coi conteggi**, ripetendo le
stesse azioni senza ricaricare la pagina e guardando cosa cresce a ogni giro.

## Il banco

`node strumenti/perdite-3d.mjs` (le opzioni in [../core/comandi.md](../core/comandi.md)): Chrome senza schermo con
`--expose-gc`, il file costruito, un eroe di prova con tre discese finite e quattro pezzi in tasca. Un ciclo è quello che
fa chi gioca: uno scontro in una discesa (paesaggio e mostri a giro), lo zaino con le anteprime e un pezzo indossato, la
risalita, tre zone del mondo di sopra, uno scontro sul prato, il capitano e la bottega del fabbro coi ritratti, la prima
discesa dal suo ingresso, la home. Dopo ogni ciclo, col GC forzato due volte:

- gli oggetti di three **vivi** (geometrie, materiali, trame, Object3D: `Runtime.queryObjects` sui prototipi presi dalla
  prima scena), i contesti WebGL e le tele vive, `ImageBitmap`;
- heap di JS e ArrayBuffer (vertici e pixel stanno fuori da `performance.memory`), nodi del DOM, ascoltatori e timer vivi
  (contati da un involucro messo prima del gioco), i callback di `requestAnimationFrame` per fotogramma;
- `renderer.info` della scena aperta (geometrie e trame caricate, programmi), le mesh, i modelli in riserva, le anteprime.

Alla fine una retta per grandezza: **pendenza per ciclo e r²**; esce con 1 se una pendenza passa la soglia con r² ≥ 0,5.
Le misure in home dicono se chiudere il 3D libera tutto; quelle nel mondo (sempre al villaggio) se il mondo di sopra
lascia indietro qualcosa. `--resta` resta nella stessa scena del mondo per tutta la prova, `--giu` scende un piano a ciclo
nell'abisso (la scena delle discese è una sola per discesa), `--veri fps-sot,fps-villaggio` lancia quelle scene degli fps veri della misura del telefono e misura dopo ogni scena.

Per trovare chi tiene una cosa che cresce: `--chi WebGL2RenderingContext` (la via più corta dalle radici nella fotografia
dello heap, con la chiave della Map attraversata), `--nuovi materiali` (nati nel penultimo ciclo e ancora vivi alla fine:
dovevano andarsene), `--senza-dispose` (geometrie e trame lasciate al GC senza `dispose()`).

- Le maniglie di Playwright (`waitForSelector`, `waitForFunction`) tengono vivo il loro elemento: nella fotografia sono
  «DevTools console», e tengono in vita le scene vecchie. Il banco le butta subito; un passo che fallisce a metà può
  lasciarne una (quel ciclo conta un contesto in più).
- `queryObjects` conta anche i prototipi delle sottoclassi: un segno messo su `MeshStandardMaterial.prototype` lo
  erediterebbero tutti (i segni vanno solo sulle istanze).

## Cosa si è trovato (23/10/2026)

**1. I renderer chiusi restavano vivi, coi loro contesti WebGL.** three, caricando una geometria, un materiale o una trama,
le appende un ascoltatore di `dispose` che tiene il renderer, e `renderer.dispose()` non lo toglie. Le cose che i moduli
tengono in cache per tutta la pagina (le parti dell'eroe, i materiali dei mostri, le trame delle aure, le persone) tenevano
quindi vivi tutti i renderer chiusi: la discesa, il mondo, le anteprime, ognuno col suo contesto non perso (`ctx.via()`
faceva solo `dispose`), le sue trame e i suoi buffer. **Correzione**: `src/grafica/rilascio3d.js` (`segui` alla nascita del
renderer annota gli ascoltatori che appende, `rilascia` li toglie, lo butta e perde il contesto), in `scena3d/contesto.js`
(discese, mondo di sopra, le scene della misura), `anteprime3d.js`, la Fattoria 3D (`mondo3d.js`) e gli Asteroidi.

**2. `window.__sotterraneo3d` e `window.__anteprime3d`** restavano sull'ultima scena buttata (per le prove): ora li toglie
chi la butta (`Gioco.vue`, `viste/anteprima3d.js`).

**3. Nella stessa discesa crescevano le riserve.** Scendendo di piano la riserva dei modelli dei mostri (`mostro3d.js`)
teneva quelli dei piani di prima, e la scena le trame di ogni paesaggio visto (l'abisso cambia paesaggio di piano in piano).
**Correzione**: `sfoltisci` a ogni piano nuovo (via le istanze dei modelli che il piano non ha, con le loro geometrie e lo
scheletro della pelle; i materiali no, buttato l'ultimo three ricompilerebbe il programma) e le trame solo degli ultimi tre
paesaggi (`indice.js`, `trameDi`).

**4. Restando nel mondo di sopra crescevano le sue riserve.** I mostri 3D di sopra, le persone e i mostri dello scontro sul
prato hanno ognuno la sua riserva di modelli, che teneva ogni specie e ogni persona incontrata girando le zone (+535 mesh in
tre giri di zone, misurati sempre al villaggio). **Correzione**: `ozio` (`mostro3d.js`, `persona3d.js`): chi non si vede da
30 s (60 sul prato) lascia la riserva con le sue geometrie; ripassando si rifà (le specie restano compilate: i materiali e i
programmi non si buttano).

| giro (computer, SwiftShader) | grandezza | prima | dopo |
|---|---|---|---|
| ciclo completo, in home | contesti WebGL vivi | 4 → 8 (+4 a ciclo) | 0 |
| | tele vive | 65 → 104 | 28, ferme |
| | ascoltatori | 139 → 208 | 70, fermi |
| | heap di JS | +12 MB a ciclo | vedi sotto |
| mondo di sopra, sempre la stessa scena (`--resta`) | mesh della scena al villaggio | +282 a giro (r² 0,96) | ferme (r² 0,26) |
| | geometrie vive | +150 a giro (r² 0,88) | ferme |
| | heap di JS | +3,4 MB a giro (r² 0,92) | +0,2 (r² 0,10) |
| abisso, un piano a ciclo | modelli di mostri in riserva | 4 → 16 in 10 piani | 4-5 |
| | geometrie vive | +77 a piano (r² 0,80) | ferme (r² 0,39) |
| | trame caricate | 21 → 39 | 21 → 25 |
| | heap di JS | +3,6 MB a piano (r² 0,67) | +0,5 (r² 0,07) |
| «Chi pesa», 138 scene (corta) | contesti WebGL vivi | 4 → 16 a metà prova | 1 per tutta la prova |
| | heap al riferimento del calore | 108 → 135 MB in tre gruppi | 106 → 105 MB |
| | ArrayBuffer al riferimento | 57 → 84 MB | 52 → 56 MB |

Dentro un gruppo di «Chi pesa» (la stessa scena, gli elementi accesi e spenti) non cresce niente, prima e dopo: accendere
e spegnere passa per gli strati della telecamera (`grafica/elementi3d.js`), non rifà la scena. La perdita era fra un gruppo
e l'altro: ogni gruppo (e ogni riferimento del calore) lasciava vivo il suo renderer con tutta la scena. Sul telefono i
contesti della misura si perdevano già (`veri/tela.js`, `perdi`), quindi lì restavano la scena in JS e i suoi ArrayBuffer
(geometrie del mondo, trame generate), non la memoria della GPU; nel gioco invece restava anche quella.

## Cosa cresce e si ferma (non è una perdita)

Le cache dei moduli si riempiono la prima volta che si vede una cosa e poi stanno: i materiali dei mostri per colore
(`mostri3d/*`, `M()`), gli studi della saldatura per modello (`saldabili`, al più quaranta per l'eroe), le parti dell'eroe e
delle persone, le anteprime per chiave (una tela 2D da 96-150 px l'una), le trame delle aure. Crescono finché si incontrano
mostri, pezzi e paesaggi nuovi: il tetto è il catalogo, non il tempo di gioco. I callback di `requestAnimationFrame` restano
uno per fotogramma nel mondo e due nelle discese (il giro del gioco e quello della scena), i timer e gli ascoltatori fermi:
nessun giro raddoppiato dopo un'entrata e un'uscita.

## Cosa resta

- **Geometrie lasciate al GC** (`--senza-dispose`): una cinquantina per piano nell'abisso, piccole (coni, ottaedri, scatole
  da 19-60 vertici: gli effetti, i pezzi dell'eroe rivestito). La memoria della GPU torna quando passa il GC, ma il GC non sa
  quanta GPU tengono: su un telefono può tardare. Sono decine di KB a piano.
- **Le tele vive** salgono di qualche unità a giro (nell'abisso e girando il mondo): le anteprime dei mostri nuovi nella
  fila dei turni (una per chiave, col tetto del catalogo). Con loro i materiali dei mostri nuovi (`M()` per colore) e
  qualche programma di shader: si fermano quando le specie sono viste tutte.
- **`renderer.info.memory`** conta anche quello che il GC si è già preso senza `dispose`: nel mondo le geometrie «caricate»
  salgono di ~40 a giro mentre quelle vive stanno ferme. Sono i modelli delle anteprime (fatti per la foto e lasciati), gli
  effetti, l'eroe rivestito. Il conteggio vero è quello degli oggetti vivi.
- **Il blocco di «Chi pesa» alla scena 50/138** («base sole terreno», la prima del mondo di sopra): prima della correzione a
  quel punto la pagina teneva le scene dei gruppi del Sotterraneo in JS. Se ricapita con la correzione, è la nascita del
  mondo (le trame generate dei ciottoli, l'ombra del sole a 2048) e non la memoria: si guarda la scheda Performance.

## Sul telefono vero

Col telefono in USB, `chrome://inspect` → la scheda **Memory**: una fotografia dello heap in home, poi una discesa, il
mondo, la home, e una seconda fotografia; nel confronto («Comparison») `WebGL2RenderingContext` e `HTMLCanvasElement`
non devono crescere. La scheda **Performance** col «Memory» acceso mostra lo heap e i nodi durante il gioco: a dente di
sega va bene, a scala che sale no. La memoria della GPU non la mostra nessuna delle due: se il telefono si pianta con lo
heap fermo, è la GPU (contesti o trame), e lo dice `about://gpu` (`Memory`) o il «Too many active WebGL contexts» nella
console.

Nei test: `unita/sotterraneo-rilascio-3d` (gli ascoltatori tolti dalle cose condivise e solo quelli del renderer chiuso, il
contesto perso una volta sola, la riserva dei mostri sfoltita con le sue geometrie).

Torna a [prestazioni-3d.md](prestazioni-3d.md).
