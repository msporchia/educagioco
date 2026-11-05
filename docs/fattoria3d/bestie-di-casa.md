# Le bestie di casa (G6)

Le bestie che si **adottano e si curano**, come nella fattoria 2D (i suoi dati in `da2d/dati/animali.js` e `bisogni.js`): beagle, gatto rosso, coniglio e
pappagallo, più le razze nuove e Watson e i gatti di casa: il catalogo e i prezzi stanno in [adozioni.md](adozioni.md). I prezzi sono alti apposta: una bestia si desidera per giorni, e una per tipo (due beagle identici non sono due cani). Hanno i numeri **esatti della 2D** (prezzo, livello, premio: `ANIMALI_2D` dal ponte `dati/parita2d.js`), i bisogni, la ciotola, le coccole, il
premio, il nome e la posizione. Codice: `dati/bestie.js` (tabella, ciotola, stato, guasti), `motore/cura.js` (le regole), `viste/Bestia.vue` e
`viste/Battesimo.vue` (i fogli), `scena3d/modelli-bestie.js` (i corpi), `scena3d/compagni.js` (la scena).

**Si curano anche i compagni** (Watson, Sherlock, Irene, Golia, Pepe: `CURATI` in `dati/bestie.js`, adottati come le bestie), come nella 2D si curavano bobtail e
gatti: stessi bisogni, ciotola, coccole e foglio; il premio è quello della bestia 2D che sostituiscono (Watson 6 come il bobtail, i gatti 5;
Irene quello del gatto bianco e nero). Il loro record in `stato.casa` nasce con l'adozione (`Cura.compra`; per i salvataggi di prima, da `normalizza`); il nome vero
si può cambiare dal foglio e «Lascia “Watson”» lo rimette. **Non si comprano e non si spostano** (girano col contadino: `sposta` dice
`gira-con-te`: tenuti premuti lo dicono). `cura.tue()` resta le comprate, `cura.curate()` le dice tutte.

**Il disegno** di beagle, coniglio e pappagallo è liscio: ellissoidi e ossi col doppio dei lati e `flatShading: false` (`LISCIO` in `modelli-bestie.js`).
Le facce piatte a pochi lati accanto ai gatti morbidi stonavano.

## Chi sono

| id | bestia | 🪙 | livello | premio ⭐ | corpo |
|---|---|--:|--:|--:|---|
| `coniglio` | coniglio | 85 | 12 | 6 | bianco, grigio sul dorso (`creaConiglio`) |
| `beagle` | beagle | 90 | 15 | 6 | tricolore, stessi perni di Watson (`creaBeagle`, `posaBeagle`) |
| `gatto_rosso` | gatto rosso (`gatto-giallo` in 2D) | 75 | 35 | 5 | mantello `rosso` di `creaGatto` (tigrato arancione, crema sotto) |
| `pappagallo` | pappagallo | 120 | 49 | 8 | verde, fronte rossa, coda lunga (`creaPappagallo`) |

Le sei razze nuove sono in [adozioni.md](adozioni.md).

Il premio è `premioBenessere` della 2D (un quindicesimo del prezzo, almeno 1): è **esperienza, mai monete**. `guastiDelleBestie` confronta prezzo, livello e premio con
la 2D: un numero diverso è un guasto (vale la 2D).

## Compagni e razze

**Watson, Sherlock, Irene, Golia e Pepe sono i compagni che girano per la fattoria** ([compagni.md](compagni.md)); si adottano (prezzo e livello: bobtail 90/3, gatto bianco e nero 75/10,
gatto nero 75/19 come nella 2D; Irene e Golia 75 fra quelli) e si curano come le altre bestie, col nome vero che si può cambiare. Chi li aveva già li tiene ([adozioni.md](adozioni.md)).
Chi li aveva comprati nella 2D li ritrova come compagni (`COMPAGNO_DI`), senza nome scelto. Le razze nuove (gatto grigio, tigrato, bianco, labrador, border collie, dalmata) non hanno un
equivalente 2D e stanno a casa dove le metti.

**Dal 4/11/2026 si curano sul prato**: ciotola, tinozza, un tocco per giocare: [cura-sul-prato.md](cura-sul-prato.md). Le tabelle qui sotto (cibi, coccole, premio) restano quelle; dove si fanno i gesti sta lì.

## I bisogni (A5)

`dati/bisogni.js` della 2D, riusato: **pancia** (cala in 14 ore), **pelo** (30), **gioco** (20); `FONDO` 0,15: **non stanno mai male e non muoiono**; soglie `BENE` 0,55 e
`BENISSIMO` 0,78. Il calo si applica leggendo (`Cura.stato`), col tempo e non con quante volte si guarda. Una bestia appena presa non nasce a posto (il primo premio non
è gratis).

- **Il fondo è 0,15 e non zero**: ha fame ma non sta male, non si ammala, non muore. Un animale che fa sentire in colpa se non apri l'app è
  l'ennesimo compito.
- **Ogni gesto che riempie costa una monetina**: una bestia deve costare qualcosa ogni giorno, se no conta solo il primo, e un gesto gratis in
  mezzo a gesti che costano diventa quello che si preme sempre (la carezza è gratis perché non riempie niente).

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

**Ogni bestia mangia solo quello che le fa bene davvero**, e un cibo sbagliato dato per gioco resta in testa: niente latte al gatto e al cane (da grandi
non lo digeriscono), niente pane, formaggio o minestrone al coniglio (è erbivoro), niente pane o miele al pappagallo; formaggio e minestrone solo al cane.
Un cibo dichiara *o* `prezzo` *o* `da` (la scorta), mai tutti e due. **Il cibo sbagliato è rifiutato col perché, prima di pagare** (`non-gli-piace` con `perche`): sbagliare non costa niente e insegna chi mangia cosa (niente formaggio al
gatto, niente carne al coniglio). Il foglio mostra solo i cibi giusti per quella famiglia; il rifiuto vale per chi chiama il motore. Pancia piena (> 0,93): «non ha fame».

## Le coccole (A7)

Come in 2D (ma nella tinozza c'è un modo solo, [cura-sul-prato.md](cura-sul-prato.md)): **spazzola** (pelo +0,5) e **gioca** (gioco +0,55) costano 🪙1 e ci sono sempre; **copertina** (lana, pelo +0,95), **festa** (torta, gioco +1), **bagnetto**
(sapone, pelo +1). **Una carezza gratis c'è sempre**: `Cura.carezza` (🤚 nel foglio, e il tocco sulla bestia in scena) non costa nulla, nemmeno a zero monete, e non
riempie niente. Nessun gesto paga una risposta sbagliata, le monete vengono solo dagli esercizi.

## Il premio (A8)

Quando tutti e tre i bisogni sono nella fascia alta (> `BENISSIMO`) e un gesto li ha portati lì, la bestia paga ⭐ (6, 6, 5, 8), **una volta per ciclo**: `premiato` si riarma
quando un bisogno scende sotto `BENE` (circa tre ore); uno stato già in forma prima del gesto non premia: il premio è per averla rimessa a posto. È
`premiaSeStaBene` della 2D, usato tale e quale.

- **Un quindicesimo del prezzo**: sta sotto l'ordine più piccolo del banco (tre grano, ⭐12, un quarto d'ora di campo), ed è legato al prezzo così non è
  scritto due volte.
- **Per singola bestia**, non «quando stanno bene tutte»: chi ne ha una deve poter vincere qualcosa, chi ne ha sei non deve fare diciotto gesti.
- **Una volta per ciclo**: senza, tre spazzolate sarebbero una zecca di livelli.

## Battesimo e posizione (A9, A10)

- **Battesimo**: appena presa si apre `Battesimo.vue`, i nomi si **toccano** (`nomiPer`, quelli della 2D per la sua famiglia, e un compagno ha in testa il suo: Golia si trova) e sotto c'è la casella per
  **scriverne uno suo**, come nella 2D: «✔ Va bene» o l'invio della tastiera lo salva (vuota non si tocca), un nome scritto torna nella casella riaprendo. Prima la lista:
  chi ha quattro anni non sa scrivere. «Lascia “Beagle”» tiene il nome della razza, «Lascia “Golia”» quello del compagno, e così resta chiudendo con la ✕; «✎ Nome» nel foglio lo cambia, gratis e sempre, anche a Watson e ai gatti. Si salva in
  `stato.casa[id].nome` (`pulisciNome`: spazi in fila ridotti a uno, 16 lettere, e la casella non ne accetta di più).
- **Sposta**: tenendola premuta la bestia segue il dito, e staccandolo su una cella tua e libera sta lì ([gesti.md](gesti.md)). Gratis. La cella è la **casa**
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
quello della bestia. Il bobtail, il gatto bianco e nero e il gatto nero sono già compagni gratis (non finiscono in `daRegalare`). **Mai monete.** Gli addobbi vanno nel
cassetto o addosso ([addobbi.md](addobbi.md)).

## I corpi e la scena

I corpi sono **modellati nella creta** ([creta.md](creta.md)): i cani di razza in `scena3d/modelli-cani.js` (`creaCaneDiRazza`, gli stessi perni di Watson,
`posaBeagle` = `posaCane` più il seduto vero e lo sdraiato), il coniglio e il pappagallo in `scena3d/modelli-bestie.js` (la loro posa, `posaPiccolo`), i gatti
sono mantelli di `creaGatto` (testa di palle con la faccia dipinta, corpo, zampe e coda nella creta). Le taglie sono diverse come dal vero: [taglie.md](taglie.md).
Peso: un cane ~20–25k triangoli da vicino e ~4–5k da lontano (quello che si vede in gioco), un gatto ~15k e ~3k, coniglio e pappagallo ~16k e ~3k; in scena
nascono col dettaglio da lontano e fanno quello fine solo se la telecamera si avvicina.
Il ritratto del foglio e delle carte è un `bestia:<id>` di `anteprime.js`.

## L'interfaccia

Le bestie si prendono dal menu 🛒 «Compra», scheda **Animali** (carte `🪙 prezzo`, il lucchetto dice il livello; in vendita dicono la razza, non un nome: [adozioni.md](adozioni.md); una già tua dice come si chiama e «🐾 è tua», e apre il foglio).
**Un tocco** su una bestia in scena (anche Watson e i gatti) è giocare ([cura-sul-prato.md](cura-sul-prato.md)) e porta accanto le sue opzioni; «🐾 Come sta» apre il foglio ([gesti.md](gesti.md)).
Il foglio (`Bestia.vue`): ✕ in alto a destra, ritratto, la frase «come sta», le tre barre, ✎ Nome / 🛍️ Negozio e una riga che dice dove si cura. Quando manca roba la ciotola dice **dove si fa** («Non hai 🥚 uova: lo fanno
gli animali: pollaio») o **quante monete mancano**. Bottoni da 44 px e più, il dito non è un mouse.

## Nei test

`unita/fattoria3d-bestie` (parità con la 2D numero per numero, i bisogni mai sotto `FONDO` dopo 400 ore, il cibo sbagliato rifiutato col perché senza pagare, il premio una volta per ciclo, nome e posizione
salvati, lo stato letto dritto, la migrazione è in `unita/fattoria3d-migra`), `unita/fattoria3d-bestie-connesse` (le parti si toccano), `unita/fattoria3d-ordini` (la veterinaria è l'unica), `integrazione/fattoria3d-bestie`
(il dito: menu, compera, battesimo, foglio, ciotola, bagno, 360 px, tenuta al dito, le opzioni, un nome scritto). Bersagli: `[data-f3="bestia"]`, `[data-bisogno]`, `[data-azione="nome"]`,
`[data-f3="battesimo"]`, `[data-nome="<nome>"]`, `[data-f3="battesimo-scrivi"]` (la casella), `[data-azione="scrivi"]`, `[data-carta="bestia:<id>"]`.

## Provato e no / da fare

- Provato: il beagle, il coniglio e il pappagallo a palle (lisce o facettate) incollate: sembravano palloncini, con le zampe a bastoncino. Ora sono nella creta ([creta.md](creta.md)).
- Da guardare col dito su un telefono: le bestie in scena dalla camera di serie, il foglio a 360 px dal vero, la tastiera che sale sopra la casella del battesimo (il foglio sta in basso).
- Il ritratto dei compagni nel foglio si disegna dal vivo (`Mondo3d.modelloBestia`): le foto fatte di `anteprime.js` sono delle bestie comprate.
- Da giocare: se i bisogni di Watson e dei gatti pesano troppo sulle monete dei più piccoli (sono quattro bocche in più dal livello 1–19).
