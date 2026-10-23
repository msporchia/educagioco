# Il budget del 3D: le regole per chi crea

Un modello, un effetto o una scena nuova del Sotterraneo 3D nasce dentro il budget del Redmi Note 7, non lo si appiattisce dopo. Le
regole vengono dalle misure di [appiattimento-3d.md](appiattimento-3d.md): sul Note 7 costano **gli oggetti** (il JS di three per
ognuno) e **le luci per pixel**, non i triangoli. Il bersaglio dello scontro è js ≤ 25 e gpu ≤ 28 ms (30 fps).

## Cosa si osa, cosa con misura, cosa no

| famiglia | si osa | con misura | da evitare nella bassa |
|---|---|---|---|
| triangoli | dettaglio di forma: smussi, suddivisioni, geometria al posto delle trame (~3 ms ogni 100k sul Note 7) | oltre 400k nella scena | |
| oggetti (mesh, chiamate) | | ogni pezzo che si muove da solo è un oggetto: ~0,1-0,15 ms di JS l'uno sul Note 7 | un oggetto per ogni bottone, borchia, osso fermo: si salda |
| materiali | Standard senza luci per pixel; colori ai vertici; la stessa istanza di materiale per tutti i pezzi uguali | ogni materiale diverso è un cambio di stato e di programma | MeshPhysical (vetro, gelatina), Lambert (sul Note 7 costa più dello Standard) |
| luci | la luce per vertice (nessun costo per pixel); l'emissivo; i bagliori additivi piccoli | — | una luce puntiforme vera in più (costa in ogni pixel di ogni materiale anche spenta); **mai oltre ~8 luci per pixel in nessuna fascia** |
| ombre | la macchia sotto i piedi | | la mappa d'ombra (ridisegna chi fa ombra e la legge in ogni pixel) |
| trasparenze | additivi piccoli e brevi (scintille, lampi) | additivi grandi: contare i frammenti (`conta.js`), un quarto di schermo è già ×2 | strati a tutto schermo, sovrapposti |
| shader per pixel | trame, una lettura per cosa | | rumore per pixel (fbm: nebbia a fette, fiamme grandi): ~70 ms per milione di frammenti |
| particelle | Points piccoli, pochi | quelle che sommano le luci per frammento | |
| pelle (SkinnedMesh) | le persone (+4 uniform e una trama d'ossa a testa) | | |
| pixel | | pixel ratio 1 nella bassa, 0,75 se non basta | passaggi a schermo intero in più |

## I tetti per modello

`BUDGET` in `poc/appiattimento-3d/budget.js` (dopo la scelta: `src/grafica/budget3d.js`), contati da `pesa(oggetto)` **dopo la
saldatura**, come nel gioco:

| famiglia | chiamate | triangoli | luci dentro | MeshPhysical | additivi | ricette di shader |
|---|---|---|---|---|---|---|
| personaggio (mostro, persona, eroe vestito) | 40 | 15 000 | 0 | 0 | 4 | 4 |
| cosa (arredo, roba, botte, relitto) | 12 | 6 000 | 0 | 0 | 4 | 3 |
| effetto (un colpo, un'aura, uno stato) | 8 | 4 000 | 0 | 0 | 8 | 3 |

40 chiamate per personaggio è il tetto per non peggiorare: il bersaglio per stare nei 25 ms di JS con tre mostri e l'eroe è ~20 (oggi
prima della pelle lo scheletro ne faceva 36, il lupo 52, il drago 140, l'eroe leggendario ~85; ora 5-20: [prestazioni-3d.md](prestazioni-3d.md), «Meno chiamate»). I triangoli sono larghi apposta: un modello che diventa più
bello con più poligoni li usa. Una luce dentro un modello non c'è mai: la luce è della scena, con la riserva fissa di `luci.js`; un
modello che brilla usa l'emissivo o un bagliore additivo.

## Il budget della scena dello scontro (fascia bassa)

`SCENA` in `budget.js`: ≤ 350 chiamate, ≤ 400k triangoli, ≤ 2 luci per pixel (meglio 0, con la luce per vertice), ≤ 40 programmi,
pixel ratio 1. Le chiamate a WebGL di un fotogramma (`contaGL`): ≤ 600 `uniform` (oggi ~900: tre per oggetto solo per le matrici).

## Il controllo

`node test/unita/budget-3d.test.mjs` (anche in `npm test`): pesa ogni modello delle discese del catalogo 3D
(`strumenti/banco/catalogo-3d/sotterraneo.js`: i mostri saldati, le persone, l'arredo, i relitti, le botti) e un modello nuovo oltre il
tetto della sua famiglia è rosso. Quelli di prima del budget stanno in `ECCEZIONI` col peso di oggi (dalla pelle del 23/10 sei: gli spiriti e
il golem di magma per le chiamate, le melme per 13 MeshPhysical): possono solo scendere. `pesa` non conta i gruppi spenti né le ossa
della pelle. `--elenco` stampa il peso di tutti.
Non misura tempi: conta, quindi gira in Node in un secondo e non dipende dalla macchina. Per un effetto nuovo (gli effetti non sono nel
catalogo) si conta con `pesa()` sull'oggetto che l'effetto aggiunge alla scena, nel suo test.

Torna a [appiattimento-3d.md](appiattimento-3d.md).
