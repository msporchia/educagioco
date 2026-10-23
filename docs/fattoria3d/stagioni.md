# Le stagioni: Halloween e Natale

Come nella fattoria 2D ([../fattoria/stagioni.md](../fattoria/stagioni.md)), con le stesse finestre: **Halloween dal 1 al 31 ottobre,
Natale dal 1 novembre al 6 gennaio**, in ora locale. Il *quando* è il dato della 2D importato così com'è (`dati/stagioni3d.js`
riesporta `stagioneDi`, `FINESTRE`, `semeDelGiorno` da `../../fattoria/dati/stagioni.js`, e usa il suo `addobbiStagionali` per scegliere
cosa va su un edificio); il *come* si vede è della 3D. `#stagione=natale|halloween` nell'indirizzo le accende fuori stagione
(`stagioneAttiva(data, frammento)`, la stessa sintassi della 2D). Si decide una volta, all'apertura della fattoria.

## Cosa si vede

| | Natale | Halloween |
|---|---|---|
| cielo, nebbia, luci | grigio-azzurro (`ASPETTI.natale`), nebbia più corta | tramonto arancio, luce calda (`ASPETTI.halloween`) |
| particelle | ~420 fiocchi che cadono | ~70 lucciole arancioni che salgono e brillano |
| a terra | chiazze di neve sul prato (una cella su 7, fino a 160, scelte dal caso del giorno) | – |
| sugli edifici | ⭐ o 🔔 sul tetto (la scelta è quella della 2D), lucine rosse e gialle sotto la gronda, un alberello innevato accanto | – |
| da comprare | **Albero con le lucine** 🪙24 (scheda «Feste», `stagione: 'natale'`, [decorazioni.md](decorazioni.md)) | **Zucca intagliata** 🪙6 e **Due zucche** 🪙10 (decori, `stagione: 'halloween'` in `dati/catalogo.js`) |

Gli addobbi di Natale sono **effimeri**: non si salvano, non occupano niente (le bestie, i compagni e il contadino ci passano attraverso),
si rifanno quando la mappa cambia o la telecamera cambia quadrato (6 celle). Le zucche sono pezzi veri: si comprano solo a Halloween
(il menu le offre solo allora, `carteDi` guarda `stato.stagione`), e **comprate restano** (nel magazzino la carta resta per rimetterle gratis;
quelle in mappa restano dove sono). Non sono «roba» di un livello (`roba()` le salta) né sorprese della mongolfiera (`SORPRESE`).

## Il peso (scena.md «Qualità e peso»)

Niente di nuovo esiste fuori stagione. In festa: **una draw call per famiglia** — chiazze, stelle, alberelli (+ le loro cime), lucine sono
`InstancedMesh`; i fiocchi sono **un solo `Points`** il cui moto sta nel vertex shader (due uniform per fotogramma: tempo e centro della
camera, nessun array da riscrivere). Misurato in Chrome senza schermo: **≤ 8 draw call in più** a Natale (il test lo impone). Il preset
«basso» spegne i fiocchi (`q.particelle`) e tiene il resto. Le zucche sono 5–7 mesh ciascuna, fuse per materiale. L'ombra non è toccata
(niente di festivo proietta ombra).

## Cosa non c'è (ancora)

- Il cappello da strega e i recinti in costume della 2D (W21): in 3D le bestie non si vestono (il guardaroba è del contadino).
  **Deciso (22/10/2026): niente per ora, se ne riparla prima di Natale.** I costumi non si metteranno addosso: si **sostituiscono i modelli** della bestia con una versione in costume (modelli nuovi, non accessori), in stagione.
- Il fumetto «lo vorrei» / il segnalino 🎃 sul menu (W20): le zucche stanno nei decori senza segnalino.
- Il suolo non si tinge di bianco a Natale (solo chiazze), e i tetti non hanno la crosta di neve: un velo sui modelli costerebbe una mesh per tetto.
- Le visite ai vicini non mostrano la stagione.
- Gli indirizzi delle feste si leggono una volta sola: a cavallo di mezzanotte fra 31 ottobre e 1 novembre vale quella dell'apertura.

## Nei test

`unita/fattoria3d-stagioni` (calendario e `#stagione=`, i dati completi, gli addobbi scelti come nella 2D e stabili nel giorno, le chiazze,
le zucche nel menu solo in stagione, la scena che si tinge e si rimette a posto senza lasciare niente), `integrazione/fattoria3d`
(blocco «le stagioni»: Natale con chiazze e fiocchi, ≤ 8 draw call in più, nessun errore; Halloween con le zucche nel menu). Nel codice:
`dati/stagioni3d.js`, `scena3d/stagione.js` (la classe `Stagione`), `scena3d/modelli-feste.js` (le zucche).
