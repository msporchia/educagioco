# Le stagioni: Halloween e Natale

Le finestre della fattoria 2D: **Halloween dal 1 al 31 ottobre, Natale dal 1 novembre al 6 gennaio**, estremi compresi e in ora
locale (la vigilia alle 23:30 è ancora la vigilia anche se a Greenwich è domani; Natale scavalca l'anno). Si ritoccano in `FINESTRE` e
in nessun altro posto, e `guastiDelleStagioni` è rosso su una data impossibile o su due finestre che si accavallano. La fattoria è il
posto dove si torna tutti i giorni: trovarla cambiata a dicembre è **una cosa che succede** senza che nessuno l'abbia comprata; le cose
da mettere (zucche, albero, pupazzo, il cappello da strega) invece si comprano, **e comprate restano** tutto l'anno, e non sono premi di
livello. Il *quando* è il dato della 2D importato così com'è (`dati/stagioni3d.js`
riesporta `stagioneDi`, `FINESTRE`, `semeDelGiorno` da `../da2d/dati/stagioni.js`, e usa il suo `addobbiStagionali` per scegliere
cosa va su un edificio); il *come* si vede è della 3D. `#stagione=natale|halloween` nell'indirizzo le accende fuori stagione
(`stagioneAttiva(data, frammento)`, la stessa sintassi della 2D). Si decide una volta, all'apertura della fattoria.

## Cosa si vede

| | Natale | Halloween |
|---|---|---|
| cielo, nebbia, luci | grigio-azzurro (`ASPETTI.natale`), nebbia più corta | tramonto arancio, luce calda (`ASPETTI.halloween`) |
| particelle | ~420 fiocchi che cadono; il **fiato**: una nuvoletta ogni 2 s circa dalla bocca del contadino, del cane e dei gatti | ~70 lucciole arancioni che salgono e brillano |
| a terra | il **prato innevato** (sotto); dalla neve spunta l'erba (chiazze verdi, una cella su 7, fino a 160, scelte dal caso del giorno) | – |
| sulle cose | la **neve su ogni faccia rivolta al cielo** (sotto): tetti di edifici e magazzini, chiome del bosco, sassi, cespugli, recinti; **non** sui pezzi di Natale comprati (`userData.senzaNeve`: l'albero, i regali, le renne restano verdi e colorati) | – |
| sugli edifici | ⭐ o 🔔 sul tetto (la scelta è quella della 2D), lucine rosse e gialle sotto la gronda coi **ghiaccioli** in mezzo, un alberello innevato accanto | – |
| sull'acqua | il **ghiaccio ai bordi** dei laghetti del terreno e degli stagni costruiti; il mare e il centro dei laghi restano aperti (la pesca non cambia) | – |
| da comprare | **Albero con le lucine** 🪙24, tre alberi più grandi, bastoni di zucchero, pacchi, ghirlanda, renna, slitta e **Pupazzo di neve** ⛄ 🪙8 (scheda «Feste», `stagione: 'natale'`, [natale.md](natale.md), [decorazioni.md](decorazioni.md); tutti solo 3D tranne l'albero piccolo) | **Zucca intagliata** 🪙6 e **Due zucche** 🪙10 (decori, `stagione: 'halloween'` in `dati/catalogo.js`) |

Gli addobbi di Natale sono **effimeri**: non si salvano, non occupano niente (le bestie, i compagni e il contadino ci passano attraverso),
si rifanno quando la mappa cambia o la telecamera cambia quadrato (6 celle). Le zucche e il pupazzo sono pezzi veri: si comprano solo nella
loro festa (il menu li offre solo allora, `carteDi` guarda `stato.stagione`), e **comprati restano** (nel magazzino la carta resta per
rimetterli gratis; quelli in mappa restano dove sono). Non sono «roba» di un livello (`roba()` li salta) né sorprese della mongolfiera (`SORPRESE`).

## La neve (`scena3d/neve.js`)

- **Il prato**: a Natale il suolo, i lotti sul mare e la riva dei laghi cambiano trama o materiale (neve; ghiaccio azzurrino per la riva),
  il velo dei lotti non comprati passa dal verde scuro al grigio-azzurro, i ciuffi d'erba si spengono. Strade e campi restano come sono:
  così si staccano. `via()` rimette tutto.
- **Le facce in alto**: ogni materiale `MeshStandard` opaco, a una faccia, senza shader suo, di ciò che sta negli elementi `edifici`, `pezzi`
  e `alberi` (più i pali e le travi del recinto) prende una **copia innevata** (una per materiale): nel fragment shader il colore va al
  bianco dove la normale nel mondo guarda in su. La soglia (0,44 ± un rumore della posizione, anche in altezza) sta sotto i coni del bosco
  (~0,45), che così vengono a balze; i tetti a falda (0,6–0,9) sono pieni. Si posa **da fuori ai modelli**: si cambia `mesh.material`,
  le funzioni che li costruiscono non sanno niente. Fuori: le bestie (`userData.bestie`/`pecore` di un pezzo), i compagni, il contadino,
  i campi, l'acqua, le foglie sottili (ninfee, canne: `DoubleSide`). Un pezzo nuovo prende la neve al prossimo `sporca()`.
- **Il ghiaccio**: lastre piatte a otto lati (un'`InstancedMesh`, fino a 900) lungo ogni lato di cella di lago che tocca terra, e lungo
  l'ovale degli stagni costruiti (un po' sopra la loro acqua, che sta più in alto: 0,065 contro 0,04). Solo nel raggio delle chiazze.
- **I ghiaccioli** (`ghiaccioli(luci)` in `dati/stagioni3d.js`): fra due lucine vicine della stessa fila, uno su quattro saltato, lunghi
  12–35 cm a caso fermo.
- **Il fiato** (`scena3d/fiato.js`): un `Points` di 32 posti a giro; la nuvoletta sale, si allarga (22→62 cm) e svanisce in 1,5 s nel
  vertex shader, il JS scrive solo il posto di quella nuova. La bocca è una parte dell'altezza del modello (il contadino 30% avanti: sotto
  la tesa del cappello non si vedrebbe). Il mondo gli passa chi respira (`Stagione.respira`).
- Provato: la soglia a 0,58 lasciava il bosco tutto verde (i coni sono più ripidi dei tetti).

## Il segnalino della festa (W20)

Come il 🎃/🎄 sul baule della 2D (le decorazioni sono una scelta della bambina, e la festa è l'eccezione perché dura poco): in stagione, finché non possiedi **nessun** pezzo della festa (né in
mappa né nel magazzino), il tasto 🏗 Costruisci porta l'icona della festa (angolo in alto a sinistra, il «!» resta a destra), e nel menu la
portano la linguetta della scheda (Decori a Halloween, Feste a Natale) e le carte di stagione aperte dal livello. Posato o comprato il primo
pezzo se ne va. Non apre il menu da sé (si apre sempre sui Campi) e non cambia prezzi: è solo un dito puntato. Logica pura: `festaDaScoprire`
in `dati/carte.js`; l'icona è `FINESTRE[stagione].icona`. Bersagli: `[data-f3="costruisci-festa"]`, `[data-f3="scheda-festa"]`, `[data-f3="carta-festa"]`.

## Il peso (scena.md «Qualità e peso»)

Niente di nuovo esiste fuori stagione. In festa: **una draw call per famiglia** — chiazze, stelle, alberelli (+ le loro cime), lucine,
ghiaccioli, ghiaccio sono `InstancedMesh`; i fiocchi e il fiato sono **un `Points` ciascuno** col moto nel vertex shader. **La neve sul
prato e sulle cose costa zero draw call** (trame e materiali cambiati, non cose in più) e i ciuffi spenti ne tolgono una; il prezzo della
neve sulle cose è qualche conto in più per pixel su quei materiali, e all'apertura qualche programma in più da compilare.
Il preset «basso» spegne fiocchi e fiato (`q.particelle`) e tiene il resto: niente di nuovo da semplificare, perché il resto è già una
chiamata per famiglia. L'ombra non è toccata (niente di festivo proietta ombra; il pupazzo sì, come ogni pezzo).

Misurato il 31/10/2026 (Chrome senza schermo, la stessa pagina con Natale acceso e poi tolto con `via()`): nella **fascia bassa** +5 draw
call con 12 edifici (71 contro 66) e con `fattoria3d-tipo=60` (169 contro 164), come il Natale di prima (sei famiglie meno i ciuffi);
+1 col ghiaccio quando un lago è in vista; ~+1,5k triangoli. Nel preset medio +7 (fiocchi e fiato). Il test impone **≤ 8 draw call in
più** a Natale. Il pupazzo è 5 mesh fuse per materiale e sta nel banco dei pezzi fermi (`STATICI`): più copie, le stesse chiamate.

## Cosa non c'è (ancora)

- Il cappello da strega e i recinti in costume della 2D (W21): in 3D le bestie non si vestono (il guardaroba è del contadino).
  **Deciso (22/10/2026): niente per ora, se ne riparla prima di Natale.** I costumi non si metteranno addosso: si **sostituiscono i modelli** della bestia con una versione in costume (modelli nuovi, non accessori), in stagione.
- Il fumetto «lo vorrei» della 2D (W20) è delle bestie che vorrebbero il cappello: in 3D le bestie non si vestono, quindi **tolto**; tornerà coi modelli in costume (W21).
- Le visite ai vicini non mostrano la stagione.
- Gli indirizzi delle feste si leggono una volta sola: a cavallo di mezzanotte fra 31 ottobre e 1 novembre vale quella dell'apertura.

## Nei test

`unita/fattoria3d-stagioni` (calendario e `#stagione=`, i dati completi, gli addobbi scelti come nella 2D e stabili nel giorno, le chiazze,
i ghiaccioli, le zucche e il pupazzo nel menu solo in stagione, la scena che si tinge, la neve sui materiali che va e torna, il fiato spento
col basso, niente che resti dopo), `integrazione/fattoria3d` (blocco «le stagioni»: Natale con chiazze, fiocchi, neve sulla casa, ciuffi
spenti, fiato, il contadino e i compagni senza neve, ≤ 8 draw call in più, nessun errore; Halloween con le zucche nel menu). Nel codice:
`dati/stagioni3d.js`, `scena3d/stagione.js` (la classe `Stagione`), `scena3d/neve.js`, `scena3d/fiato.js`, `scena3d/modelli-feste.js`
(le zucche e il pupazzo), `scena3d/modelli-natale.js` ([natale.md](natale.md)). Provato: l'albero innevato come ogni cosa non si riconosceva (tutto bianco): ora i pezzi di Natale saltano la neve.
