# Istanze, LOD e ombra (T10)

Il giro che ha ridotto le draw call e i triangoli della scena dopo la fusione delle mesh ([scena.md](scena.md) «Qualità e peso»).
Quattro cose, tutte dietro un'interfaccia piccola, così i pezzi nuovi di chi lavora in parallelo si agganciano senza toccarle.

## I banchi di istanze

| banco | file | cosa fa |
|---|---|---|
| **campi** `BancoCampi` | `scena3d/campi-istanze.js` | le piante di **tutti** i campi in una `InstancedMesh` per forma (≤ 17 in tutto, prima 17 a campo). Ogni campo tiene matrici (già nel mondo) e colori in array suoi (`userData.grano.parti[forma].mat/col`, `modelli-colture.js`) e il banco li copia uno dopo l'altro: a ogni campo la sua «fetta» (`fette[forma] = [{ g, da, n }]`) |
| **pezzi fermi** `BancoStatici` | `scena3d/statici-istanze.js` | aiuole, panchine, pozzi, bancarelle, ponti, passerelle, tavoli, moli, trattore, zucche: una `InstancedMesh` per (geometria, materiale, ombra). Le mesh originali restano nel gruppo **invisibili**: servono al dito (`intersectObjects` non guarda `visible`) e ai test, che cercano i gruppi |

`Pezzi` (`pezzi.js`) li possiede (`this.banco`, `this.statici`), adotta un gruppo in `_creaCosa`, lo lascia in `_togli`, e a fine
`aggiorna()` chiama `aggiorna(frustum)` di entrambi. Due regole comuni:
- **Fuori dall'inquadratura (con 3 unità di margine per l'ombra) non si disegna e non proietta.** Un'istanza non si taglia da sola (`frustumCulled = false`: la sfera
  di tutte le istanze starebbe sempre dentro), quindi lo fa il banco: sfera del campo/pezzo contro il frustum della camera del fotogramma prima
  (`Mondo3d._frustum()`, passato da `vista.frustum()`), e ricopia solo se l'insieme dei visibili cambia. Un campo fuori non ripone nemmeno le piante (e al ritorno le rifà): è anche JS risparmiato.
- Il gruppo comanda: posizione, giro, scala (il rimbalzo di quando nasce, il saltello) e `visible` (un pezzo sollevato) si leggono a ogni fotogramma; il banco ricopia se sono cambiati.

**Il dito sulle piante.** Le piante non sono più figlie del gruppo del campo: `Mondo3d.bersaglioSotto` chiede anche a `pezzi.colpisciPiante(raggio)` (`banco.campoDi(mesh, instanceId)`), e vince il più vicino.

**Un campo da solo** (anteprime, fantasma di chi lo trascina, catalogo) disegna come prima, con le sue mesh: `creaCampo()` le crea, `aggiornaCampo()` le riempie;
solo `BancoCampi.adotta(g)` le toglie. Così `modelloAnteprima` e i test del campo non cambiano.

### Come si aggiunge un pezzo istanziato

- **Un pezzo fermo nuovo** (decorazione: nessun `userData.anima`, niente trasparenti, niente `InstancedMesh`, un solo materiale per mesh): scrivi il modello in `modelli*.js` come sempre
  e aggiungi il tipo a `STATICI` in `statici-istanze.js`. Se manca una di quelle condizioni `adotta` torna `false` e il pezzo resta com'era (il test `unita/fattoria3d-banco-statici` lo prova con una fontana e uno stagno).
  Se il pezzo cambia **materiale o colore a runtime**, non va in lista: il banco condivide il materiale fra tutte le copie.
- **Un pezzo con parti che si muovono** (pale, fumo, bestie): resta com'è. Non si istanzia.
- **Una coltura nuova**: niente da fare qui. Una ricetta di `RICETTE` (`modelli-colture.js`) posa parti con `posa.metti(forma, …)`; una forma nuova va in `FORME` e basta: il banco ne fa la mesh da `formaDi(nome)`.
- **Un banco nuovo** (per un altro tipo che si ripete tante volte): copia la forma di `BancoStatici` — `adotta(g)` / `lascia(g)` / `aggiorna(frustum)` / `via()` — e agganciala in `Pezzi` negli stessi quattro punti.

## Compagni da lontano

Cane e gatti hanno due geometrie per ogni pezzo di pelo o di morbido: quella piena (cane 6020 triangoli, gatto 5170) e una povera, fatta la prima volta che serve e in comune fra gli esemplari
(`userData.lod = { alta, bassa() }` su ogni mesh, `impostaDettaglio(g, basso)` in `modelli-compagni.js`): sfere a metà facce, volumi a 20 facce, un terzo delle ciocche ma più grosse.
**Oltre 12 m dalla camera** (`LOD_METRI` in `compagni.js`, con isteresi di 1,5 m) un compagno usa quella: **cane 1960 (−67%), gatto ~2100 (−58%)**.
Con la camera di serie (22 m) sono sempre da lontano; da vicino (zoom avanti) tornano pieni. Test: `unita/fattoria3d-compagni-lod`.
Un compagno nuovo con pelo o morbido riusa `pelo()` / `morbido()` e prende il LOD gratis; uno che li salta resta pieno.

## L'ombra

- **Il sole sta su una griglia di 2 celle** (`PASSO_OMBRA` in `camera.js`), non segue la camera a ogni fotogramma: la mappa dell'ombra resta valida (e non «nuota») finché la camera non scavalca
  una linea; la finestra dell'ombra cresce a gradini di 2, con 2 di margine per lo scarto della griglia (22 invece di 20 a 22 m di distanza: texel ~10% più larghi). `camera.ombraCambiata` dice che è scattato.
- **L'ombra si rifà** se `ombraSporca` (qualcosa è stato messo, tolto, mosso), se il sole è scattato, oppure ogni `ombraOgni` fotogrammi (il degrado adattivo); **a camera e contadino fermi la cadenza non scende sotto 1 ogni 2**
  (rimangono le bestie e le pale: a 30 al secondo non si distingue). Non c'è un «si ridisegna solo se cambia qualcosa»: bestie, compagni e pale cambiano sempre.

## Misura (22/10/2026)

`#fattoria3d-tipo=60` (11 campi, 14 edifici, 17 pezzi, 4 compagni), dpr 1, 780×1688, Chrome senza schermo (SwiftShader: i ms non dicono niente, **valgono i conti**), ombra 1024.
Si misura con `node strumenti/scatta-app.mjs 'fattoria3d-tipo=60&dpr=1' --dist --aspetta 7000 --esegui '<prima>' --stampa '<misura>'`: `<misura>` rende un fotogramma con `renderer.shadowMap.needsUpdate = true` e legge `renderer.info.render`
(draw call e triangoli, con e senza ombra) e `mondo.conteggi()`; `<prima>` rifà la scena come prima del giro:
`const w = window.__fattoria3d.mondo; w.pezzi.usaBanchi = false; w.pezzi.via(); w.pezzi.sincronizza(); w.compagni.camera = null` (le istanze sciolte e i compagni sempre pieni).

| | prima | dopo |
|---|---|---|
| mesh in scena | 572 | 405 (−167: le istanze dei campi 205 → 38) |
| draw call a fotogramma, con l'ombra | 304 | 272–280 (−8%) |
| draw call, senza ombra | 202 | 186–194 |
| triangoli, con l'ombra | 176k | 159k |
| triangoli, senza ombra | 98,6k | 92,4k |
| triangoli dei quattro compagni, per passata (cane + 3 gatti) | 21,5k | 8,3k (da lontano) |

Il guadagno sulle draw call qui è piccolo perché **la scena in vista è fatta d'altro**: ~100 mesh sono gli edifici (2–16 l'uno, già fusi), 62 i gatti e il cane (parti che si muovono: non si fondono), il resto bestie e contadino.
I campi pesano quanto ne mostrano: una coltura usa 2–6 forme, quindi 11 campi erano ~40 draw call visibili e ora ~12; il vantaggio cresce con i campi in vista e con le colture diverse (una forma condivisa vale una draw call sola per tutti).
Il guadagno vero è nei **triangoli dei compagni** e nel **JS dei campi fuori vista**, e nel fatto che le istanze non crescono più col numero dei campi.

Provato e non fatto: istanziare le gelosie/finestre/tegole degli edifici — ogni edificio è unico (2–16 mesh già fuse), non c'è niente che si ripeta fra copie; istanziare i pali del recinto dei pezzi — sono già istanze di `terreno.js` (`pali`, `travi`) e i fiori sono dentro la mesh dell'aiuola.
