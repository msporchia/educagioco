# Il Natale da comprare: alberi, regali, renne

La scheda «Feste» a Natale (da novembre al 6 gennaio, [stagioni.md](stagioni.md)) ha **undici pezzi**: i tre di prima (albero, pupazzo) più questi. Tutti `stagione: 'natale'`, solo 3D (la 2D ha solo
l'albero piccolo), comprati restano. Disegni in `scena3d/modelli-natale.js`, numeri in `dati/catalogo.js` (`festaSolo3D(prezzo, liv)`).

| id (mai rinominati) | misura | 🪙 | livello |
|---|---|--:|--:|
| `albero_natale` (della 2D) | 1×1 | 24 | 1 |
| `albero_natale_alto` | 2×2 | 45 | 20 |
| `albero_natale_grande` | 3×3 | 90 | 35 |
| `albero_natale_gigante` | 4×4 | 180 | 50 |
| `bastoni_zucchero` (tre) · `bastoni_zucchero_fila` (sei, legati da un nastro) | 1×1 · 2×1 | 6 · 12 | 4 · 9 |
| `pacchi_regalo` · `ghirlanda_natale` (due pali e un festone) | 1×1 · 2×1 | 10 · 14 | 7 · 12 |
| `renna_natale` · `slitta_natale` (slitta, sacco e due renne, 1×3) | 1×1 · 1×3 | 18 · 40 | 16 · 28 |

**Perché questi livelli e questi prezzi.** La fila dei prezzi dei decori (`livelloPerPrezzo`) metterebbe una ghirlanda da 14 monete al livello 50 e un albero da 90 al 67: ma una festa dura due mesi e un
bambino al livello 20 non deve aspettarla un anno. Quindi il livello si sceglie a mano e **sale col prezzo**: i piccoli (6–18 🪙, una o due decine di minuti di esercizio, 🪙1 = 10 s) arrivano presto; gli
alberi grandi costano più monete e livello, perché occupano 4–16 celle e sono il pezzo da mostrare. Il gigante (🪙180 = mezz'ora di esercizio) è come il fienile rosso più caro delle decorazioni 2D (🪙160).
Non sono «roba» di un livello (`roba()` salta le feste): non spostano le soglie.

## Come si vede

- **Niente neve sopra** (`userData.senzaNeve` sul gruppo; `neve.js` salta il sottoalbero, e il banco dei pezzi fermi lo copia sull'istanza): sotto la neve l'albero non si riconosceva. Il verde si legge, la neve sul resto della fattoria non cambia.
- **Le lucine** sono tre materiali con luce propria colorata (rosso `0xff2418`, giallo `0xffc21a`, azzurro `0x1e78ff`: luce che passa nel fuso per materiale, [decorazioni.md](decorazioni.md)): per questo l'albero piccolo ha **4 mesh** (verde + tre luci), e il test dei decori gli concede 4 invece di 3. Palle rosse, d'oro e d'argento senza luce, una spirale di grani d'oro, la stella (due ottaedri incrociati) in cima, i pacchi attorno al tronco degli alberi alti.
- **Il lampeggio** è lento e col tempo vero (`anima(tt)`, secondi): rosse e azzurre si alternano (~3,7 s a giro), le gialle e la stella respirano appena. Cambia solo `emissiveIntensity` dei tre materiali, che sono in comune: tutte le copie si accendono insieme, e costa tre numeri a fotogramma per albero. Non è istanziabile (`anima`), quindi gli alberi sono mesh sciolte; la ghirlanda, la renna e la slitta lampeggiano allo stesso modo (naso rosso, lucine).
- Il bastone di zucchero è a strisce di cilindri (7 lati), l'uncino a pezzi di `filo`; il pacco è tre scatole e quattro coni di fiocco. Bastoni e pacchi sono fermi e vanno in `STATICI` (copie = istanze).

## Il peso

Albero: 1024 triangoli il piccolo; i grandi sono ~2 000–3 500 (lucine a icosaedro, 20 triangoli l'una, 44/74/110; grani a ottaedro, 8). Sono pezzi rari, uno o due per fattoria: 4 draw call l'uno (8 con l'ombra),
fuori dal tetto 3 mesh dei decori perché non sono nella lista della 2D (`IDS_DECORI`) ma nel catalogo solo 3D come il pupazzo. Sul vecchio telefono ([limiti.md](limiti.md)): niente istanze di lucine (una per albero
sarebbe una draw call in più per colore, e non si può fondere con `anima`), niente luci vere (`PointLight`): la luce propria dei materiali basta a farle brillare. Provato: le lucine con `emissive` in comune
(`luce()`) restano arancioni, perché la luce propria non prende il colore dei vertici: per averle colorate serve un materiale per colore.

## Nei test

`unita/fattoria3d-decori` (la scheda Feste a Natale ha gli undici pezzi), `unita/fattoria3d-natale` (prezzi e livelli crescenti, `senzaNeve`, il lampeggio, le misure). Vedili con
`node strumenti/scatta-app.mjs 'fattoria3d&fattoria3d-tipo=70&stagione=natale&stress=albero_natale_grande:1&dpr=1&degrado=no' --dist --aspetta 12000` (`stress=` posa il pezzo in un posto libero).
