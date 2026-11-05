# Le taglie degli animali

Gli animali non sono tutti grandi uguali. In scena hanno le **taglie vere, compresse**: i piccoli sono un po' più grandi del vero perché si leggano
dalla telecamera di serie (22 m), ma l'ordine e le proporzioni restano quelli veri. Il contadino è alto 1,22 m.

| animale | alto in scena, senza coda | come |
|---|--:|---|
| Watson (bobtail), labrador, dalmata | ~0,85 m | i cani grandi: `SCALA_CANE` 0,8 per Watson, `scala` 0,96 e 0,9 in `RAZZE_CANE` |
| border collie | ~0,80 m | `scala` 0,84 |
| beagle | ~0,61 m | `scala` 0,72: due terzi di un labrador, come dal vero |
| gatti | ~0,57 m (orecchie comprese), ~0,35 al garrese | `SCALA_GATTO` 0,82; Golia è un gattone (×1,03), Irene una gattina (×0,9) — `TAGLIA_GATTO` |
| coniglio | ~0,47 m con le orecchie dritte | `SCALA.coniglio` 0,9 |
| pappagallo | ~0,35 m | `SCALA.pappagallo` 0,85 |

Le proporzioni, non solo la scala: il **dalmata è più alto di zampe** e il **beagle più basso** (`alzo` in `RAZZE_CANE`: il corpo sale o scende con
tutto quello che porta, le zampe si allungano col piede fermo a terra). Dove `posaCane` mette il corpo a una quota fissa (seduto, sdraiato),
`posaBeagle` la sposta dell'`alzo`.

Prima del 3/11/2026 i gatti erano in scala 1,15 (al garrese quanto un labrador) e il coniglio con le orecchie alto quanto un labrador: tutti grandi
uguali. Da guardare col dito sul telefono: se un gatto a 0,82 si legge ancora dalla telecamera di serie.

## Nei test

`unita/fattoria3d-razze` misura ogni animale in scena, in piedi e senza la coda, e controlla l'ordine: beagle < collie < labrador e dalmata, il beagle
fra 0,6 e 0,8 del labrador, Watson grande come il labrador, ogni gatto più basso di ogni cane e di metà del contadino, Golia il gatto più grande e Irene la
più minuta, coniglio e pappagallo non più alti di un gatto. Il catalogo 3D scrive la taglia di ogni voce (`npm run catalogo3d:scheda -- --q …`).
