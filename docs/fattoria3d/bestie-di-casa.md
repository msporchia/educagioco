# Le bestie di casa (G6)

Le bestie che si **comprano e si curano**, come nella fattoria di sempre ([../fattoria/animali.md](../fattoria/animali.md)): beagle, gatto rosso, coniglio e
pappagallo. Hanno i numeri **esatti della 2D** (prezzo, livello, premio: `ANIMALI_2D` dal ponte `dati/parita2d.js`), i bisogni, la ciotola, le coccole, il
premio, il nome e la posizione. Codice: `dati/bestie.js` (tabella, ciotola, stato, guasti), `motore/cura.js` (le regole), `viste/Bestia.vue` e
`viste/Battesimo.vue` (i fogli), `scena3d/modelli-bestie.js` (i corpi), `scena3d/compagni.js` (la scena).

## Chi sono

| id | bestia | 🪙 | livello | premio ⭐ | corpo |
|---|---|--:|--:|--:|---|
| `coniglio` | coniglio | 85 | 12 | 6 | bianco, grigio sul dorso (`creaConiglio`) |
| `beagle` | beagle | 90 | 15 | 6 | tricolore, stessi perni di Watson (`creaBeagle`, `posaBeagle`) |
| `gatto_rosso` | gatto rosso (`gatto-giallo` in 2D) | 75 | 35 | 5 | mantello `rosso` di `creaGatto` (tigrato arancione, crema sotto) |
| `pappagallo` | pappagallo | 120 | 49 | 8 | verde, fronte rossa, coda lunga (`creaPappagallo`) |

Il premio è `premioBenessere` della 2D (un quindicesimo del prezzo, almeno 1): è **esperienza, mai monete**. `guastiDelleBestie` confronta prezzo, livello e premio con
la 2D: un numero diverso è un guasto (vale la 2D).

## Compagni gratis e bestie comprabili

**Watson, Sherlock, Irene e Pepe restano i compagni che girano gratis** ([compagni.md](compagni.md)): non hanno bisogni, non si curano, non hanno premio, il
nome è fisso (sono gli animali veri di casa, scelta dell'utente: «tieni **e** aggiungi le bestie che si curano»). Nella 2D si comprano anche il bobtail (90/3), il gatto
bianco e nero (75/10) e il gatto nero (75/19): **tolti perché in 3D ci sono già, gratis** (Watson, Sherlock, Pepe), quindi comprarli sarebbe pagare una cosa che si ha.
Chi li aveva comprati nella 2D li ritrova come compagni (`COMPAGNO_DI`), senza nome scelto. Irene (calico) non ha un equivalente 2D. Le quattro bestie comprabili sono
quelle che la 3D **non** regala.

## I bisogni (A5)

`dati/bisogni.js` della 2D, riusato: **pancia** (cala in 14 ore), **pelo** (30), **gioco** (20); `FONDO` 0,15: **non stanno mai male e non muoiono**; soglie `BENE` 0,55 e
`BENISSIMO` 0,78. Il calo si applica leggendo (`Cura.stato`), col tempo e non con quante volte si guarda. Una bestia appena presa non nasce a posto (il primo premio non
è gratis). Il perché sta in [../fattoria/animali.md](../fattoria/animali.md): ogni bestia deve costare qualcosa ogni giorno.

## La ciotola (A6)

Gli stessi 14 cibi della 2D (`CIBI` di `dati/bestie.js`, derivati da `bisogni.js`): **8 comprati** (osso 5, bistecca 14, pesce 5, paté 14, semini 5, frutta 14,
carota 5, insalata 14) e **6 del granaio**. Il granaio della 2D è la scorta della 3D: `da` dice quale scorta si scala (`scortaDi3D`):

| cibo | scorta 3D | per chi |
|---|---|---|
| mangime | `prodotti.mangime` (mulino) | cane, gatto, pappagallo, coniglio |
| uovo | `prodotti.uova` | cane, gatto, pappagallo |
| pappa di mais | `prodotti.pastone` | cane, gatto, pappagallo |
| fieno | `merci.erba` (l'erba medica del campo; «Fieno» in 2D) | coniglio |
| formaggio, minestrone | `prodotti` | solo cane |

**Il cibo sbagliato è rifiutato col perché, prima di pagare** (`non-gli-piace` con `perche`): sbagliare non costa niente e insegna chi mangia cosa (niente formaggio al
gatto, niente carne al coniglio). Il foglio mostra solo i cibi giusti per quella famiglia; il rifiuto vale per chi chiama il motore. Pancia piena (> 0,93): «non ha fame».

## Le coccole (A7)

Come in 2D: **spazzola** (pelo +0,5) e **gioca** (gioco +0,55) costano 🪙1 e ci sono sempre; **copertina** (lana, pelo +0,95), **festa** (torta, gioco +1), **bagnetto**
(sapone, pelo +1). **Una carezza gratis c'è sempre**: `Cura.carezza` (🤚 nel foglio, e il tocco sulla bestia in scena) non costa nulla, nemmeno a zero monete, e non
riempie niente. Nessun gesto paga una risposta sbagliata, le monete vengono solo dagli esercizi.

## Il premio (A8)

Quando tutti e tre i bisogni sono nella fascia alta (> `BENISSIMO`) e un gesto li ha portati lì, la bestia paga ⭐ (6, 6, 5, 8), **una volta per ciclo**: `premiato` si riarma
quando un bisogno scende sotto `BENE`; uno stato già in forma prima del gesto non premia. È `premiaSeStaBene` della 2D, usato tale e quale.

## Battesimo e posizione (A9, A10)

- **Battesimo**: appena presa si apre `Battesimo.vue`, i nomi si **toccano** (`nomiPer`, quelli della 2D per la sua famiglia); «Lascia “Beagle”» tiene il nome della razza; «✎ Nome»
  nel foglio lo cambia, gratis e sempre. Si salva in `stato.casa[id].nome` (16 lettere).
- **Sposta**: dal foglio, «📍 Sposta» chiude il foglio e il prossimo tocco su una cella tua e libera porta lì la bestia (`Mondo3d.iniziaSposta`). Gratis. La cella è la **casa**
  della bestia (`stato.casa[id].i,j`): ci gira intorno (due passi, si siede, annusa, dorme; il gatto si lava), anche dopo aver chiuso il gioco. Senza posizione sta
  davanti alla porta della casa. Una bestia di casa non segue il contadino, come Watson: sta dove l'hai messa.

## La veterinaria (A12, C32)

La veterinaria è già tra i clienti del banco ([ordini.md](ordini.md)); ora **chiede il mangime**, come in 2D (`VETERINARIA_VUOLE`: mangime, pappa di mais, becchime, foraggio, verdure lesse,
pastone, verdura fresca). `nuovoOrdine`, se il cliente scelto è lei e a quel livello un mangime si fa, compone un ordine di 1–2 mangimi (1–2 pezzi l'uno). **Gli altri
clienti non chiedono mai il mangime** (`chiedibili`), la mongolfiera nemmeno. Il mangime è quello dei recinti: così il bambino che ne ha in magazzino ha un altro posto dove portarlo.

## Lo stato

`stato.casa = { <id>: { pancia, pelo, gioco, quando, premiato, nome?, i?, j? } }`: il record c'è se la bestia è tua. **La versione non cambia** (`VERSIONE_STATO` 10): uno stato di prima non
ha `casa` e si legge dritto; `casaInForma` non lancia mai (bisogni fra `FONDO` e 1, nome pulito, bestie sconosciute buttate).

## La migrazione dalla 2D

Chi aveva comprato beagle, coniglio, pappagallo o gatto rosso li ritrova in `stato.casa` **col nome e con i bisogni a metà** (`statoDa2D`), il livello 3D non scende sotto
quello della bestia. Il bobtail, il gatto bianco e nero e il gatto nero sono già compagni gratis (non finiscono in `daRegalare`). **Mai monete.** Gli addobbi restano «da regalare».

## Costumi e addobbi: non ancora

A13 e L21 **non si fanno**: l'utente li rimanda a prima di Natale, e quando si faranno saranno **modelli sostituiti**, non vestiti sulla testa.

## I corpi e la scena

Stile dei gatti (palle lisce fuse in un mesh per pezzo, colore nei vertici); **le parti si toccano** (`unita/fattoria3d-bestie-connesse` le prova in sei pose per bestia). Il beagle ha gli
stessi perni di Watson in scala 0,72 (`posaBeagle` = `posaCane` più due ritocchi da sdraiato); coniglio e pappagallo hanno la loro posa (`posaPiccolo`).
Peso (catalogo 3D): beagle 16 mesh / ~4200 triangoli, coniglio 14 / ~2600, gatto rosso 15 / ~5200, pappagallo 13 / ~1600; il LOD da lontano dei compagni vale anche per
loro dove i pezzi sono `morbido`. In tutto, comprandole tutte, +58 mesh e ~13 600 triangoli sulla scena ([scena.md](scena.md) «Draw call e triangoli»).
Il ritratto del foglio e delle carte è un `bestia:<id>` di `anteprime.js`.

## L'interfaccia

Le bestie si prendono dal menu 🏗 «Costruisci», scheda **Animali** (carte `🪙 prezzo`, il lucchetto dice il livello; una già tua dice «🐾 è tua» e apre il foglio). Il foglio (`Bestia.vue`): ✕ in
alto a destra, ritratto, la frase «come sta», tre blocchi (barra, gesti), 🤚 Carezza / 📍 Sposta / ✎ Nome, una riga che dice cosa è successo e, quando manca roba, **dove si fa** («Non hai 🥚 uova: lo fanno
gli animali: pollaio») o **quante monete mancano**. Bottoni da 44 px e più, il dito non è un mouse.

## Nei test

`unita/fattoria3d-bestie` (parità con la 2D numero per numero, i bisogni mai sotto `FONDO` dopo 400 ore, il cibo sbagliato rifiutato col perché senza pagare, il premio una volta per ciclo, nome e posizione
salvati, lo stato letto dritto, la migrazione è in `unita/fattoria3d-migra`), `unita/fattoria3d-bestie-connesse` (le parti si toccano), `unita/fattoria3d-ordini` (la veterinaria è l'unica), `integrazione/fattoria3d-bestie`
(il dito: menu, compera, battesimo, foglio, carezza, cibo, 360 px, sposta). Bersagli: `[data-f3="bestia"]`, `[data-bisogno]`, `[data-cibo="<id>"]`, `[data-coccola="<id>"]`, `[data-azione="carezza|sposta|nome"]`,
`[data-f3="battesimo"]`, `[data-nome="<nome>"]`, `[data-carta="bestia:<id>"]`.

## Provato e no / da fare

- Provato: il beagle con le zampe come bastoncini staccati dal corpo (come uscì dal primo tentativo): le gambe ora partono dentro il corpo; sdraiato le zampe davanti e le orecchie si riattaccano in `posaBeagle`.
- Da guardare col dito su un telefono: le bestie in scena dalla camera di serie, il foglio a 360 px dal vero.
- Il tocco sul gatto rosso/beagle apre il foglio (non c'è la festa lunga di Watson né le risposte dei gatti): una scelta, le bestie di casa sono cose da curare.
