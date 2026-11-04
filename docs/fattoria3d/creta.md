# La creta: animali modellati, non palle incollate

Gli animali di casa della fattoria (i cani di razza, il corpo, le zampe e la coda dei gatti, il coniglio, il pappagallo) sono **modellati nella creta**
(`scena3d/creta.js`): forme che si fondono l'una nell'altra, da cui si prende una pelle sola. Il collo entra nella testa, la zampa nella spalla, la
coda nel sedere: niente giunture a palla, niente zampe a bastoncino. Watson resta col suo pelo a ciocche (`creaCane`, [compagni.md](compagni.md)).

## Come funziona

- **Le forme** sono campi di distanza (negativi dentro): `palla` (un ellissoide), `osso` (un cono dalle punte tonde fra due punti), `fila` (ossa in fila:
  una coda, un collo che curva), `girata` (una forma ruotata: un orecchio storto), `arruffata` (la pelle mossa: la gorgiera del collie).
- **Si uniscono** con `unione(pezzi, k)`: `k` è quanto si raccordano (un pezzo può avere il suo). `meno` scava (le orbite, la bocca, le narici),
  `dentro(forma, sopra(0))` taglia piatta la pianta del piede.
- **La pelle** (`pelle`) è una rete *surface nets* su una griglia di lato `passo`: un vertice per cella che taglia la superficie, portato sulla pelle
  con due passi di Newton (così regge anche a maglie larghe), le normali dal gradiente del campo (liscia anche a pochi triangoli), i colori nei
  vertici da una funzione della posizione e della normale (l'interno rosa dell'orecchio del coniglio). È chiusa: ogni spigolo fra due triangoli.
- **Ogni pezzo che si muove è una pelle a parte** nel suo perno (corpo, testa, zampe, orecchie, coda): le pose di prima (`posaCane`, `posaBeagle`,
  `posaGatto`, `posaPiccolo`) muovono gli stessi perni. Le giunture stanno dentro: la zampa parte dentro la spalla, la testa dentro il collo.
- **La coda del gatto** è una pelle sola su tre ossa (`THREE.SkinnedMesh`, i perni `coda1–3` sono `THREE.Bone`): i pesi passano morbidi da un osso
  all'altro a ogni giuntura, quindi la coda si curva invece di fare il gomito. A riposo sta su con la punta piegata in avanti, un punto di domanda.
- **I colori** sono regole sulla posizione nel corpo fermo, coi bordi sfumati (`fra`) e un po' mossi (`mosso`): la sella del beagle, il collare del
  collie (un anello lungo il collo, `COLLO`), le macchie del dalmata (`macchie`, celle di Voronoi in 3D), i mantelli dei gatti (`coloriGatto`, invariati).

## Il peso e il dettaglio

Una pelle fine costa: un cane di razza ~20–25k triangoli e ~100 ms per farla la prima volta (sul telefono vecchio di più), un gatto ~15k, coniglio e
pappagallo ~16k. Per questo:

- **Ogni pelle ha la versione da lontano** (`userData.lod`, passo × 2,4: ~4–5k triangoli a cane), quella che il gioco disegna oltre i 12 m (`LOD_METRI`
  in `scena3d/compagni.js`). La telecamera di serie sta a 22 m (`DISTANZA` in `dati/qualita.js`): in gioco si vede quasi sempre quella.
- **In scena un animale nasce da lontano** (`PARTENZA.lontano`, acceso da `Compagni.sync`): la pelle fine si fa solo quando la telecamera si avvicina
  (`impostaDettaglio`, che per le pelli della creta la costruisce allora). Le foto, il catalogo e i test le fanno subito fini.
- **Ogni geometria si fa una volta** per razza e per pezzo (la cache `G`): dieci beagle costano come uno.
- Il `passo` è scelto per pezzo: rado sul corpo (le forme grandi reggono), fitto sulla testa, sulle orecchie sottili e sul naso. Il dalmata ha la rete
  del corpo più fitta (`fitto`): le sue macchie sono colori nei vertici, e a maglie larghe diventano stelle.

## Provato e no

- **Watson nella creta**: il pelo lungo del bobtail diventa un peluche liscio, la frangia una fila di dita, gli occhi spariscono. Per le ciocche servono
  molti più triangoli (o una trama di normali, che non abbiamo): resta il Watson a ciocche.
- **Le orbite piccole** (il coniglio): un incavo più stretto di due maglie si strappa a bordi frastagliati. Gli occhi piccoli stanno sulla pelle, senza orbita.
- **Un orecchio troppo sottile** (meno di due maglie di spessore) si buca dove lo si scava: l'incavo dev'essere poco profondo.
- **La coda del gatto in tre pezzi rigidi**: alle giunture si vedevano i gomiti. Da qui la pelle sulle ossa.
- **Il rumore fitto** (`arruffata` a 90–110) sul collie sembrava pelo sporco: a 50–60, con poca ampiezza, sembra pelo.

## Nei test

`unita/fattoria3d-creta` (le forme danno le distanze giuste, la pelle è chiusa coi vertici sulla superficie e le normali fuori, le unioni riempiono, un
animale nato da lontano fa la pelle fine solo dopo, uguale a quella di uno nato vicino), `unita/fattoria3d-razze` (ogni razza si costruisce, piedi a
terra, triangoli, mantelli diversi, le taglie: [taglie.md](taglie.md)). Le foto le rifà `npm run anteprime fattoria` (la firma conta anche `creta.js`).
Per guardare: `npm run catalogo3d:scheda -- --gioco fattoria --q "=fattoria:bestia-dalmata|=fattoria:golia" --nome prova`, con `--lontano` la versione
che si vede in gioco.
