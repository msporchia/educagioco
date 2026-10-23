# Le decorazioni in 3D

Giri G8 e G9 della parità ([parita/mondo-e-stagioni.md](parita/mondo-e-stagioni.md) W7–W15; [parita/livelli-ed-economia.md](parita/livelli-ed-economia.md) L20):
la 2D ha 217 decorazioni, la 3D ne aveva 11. Ora **206 voci in più** (130 nel G8, 76 nel G9), nove schede nuove del menu «Costruisci qui»: **tutte le decorazioni della 2D sono in 3D**.

## Cosa c'è

| scheda | voci | cosa | file del disegno |
|---|--:|---|---|
| 🌳 Verde | 27 | alberi (albero, grande, rosa, melo, topiaria), siepi, macchie e ciuffi, la radura, funghi, ceppi, tronchi, sassi e massi | `modelli-decori-verde.js` |
| 🚧 Recinti | 29 | staccionata, recinto di legno, cancello, ringhiera, colonna, pergole, gazebo (anche con tavolo), cartello, insegna, **i 16 cartelli delle colture**, bandiera (sventola), stendardo | `modelli-decori-recinti.js` |
| 🧺 Raccolto | 38 | balle e covone, 4 cassette, le 13 casse delle colture, ceste, cesti di frutta, barili, cesta da picnic, pane, panino, torta, crostatina, marmellata, latte, vasetto | `modelli-decori-raccolto.js` |
| 🏡 Case | 19 | casa, casetta, casa lunga, casa e veranda, casa sull'albero, i due fienili, torretta, forno a legna e a cupola, i due chioschi, casetta delle galline, serra, tettoia, capanno, **lampione, lampione fiorito, lanterna** | `modelli-decori-case.js` |
| 🐞 Bestiole | 17 | cuccia (due), nidi e vaschetta per gli uccelli, ciotola, apiario e alveare, coniglietto, gattino (smoking, come Sherlock), cucciolo (bobtail, come Watson), pulcino, uccellino, tartarughe, farfalla e farfalle, coccinella | `modelli-decori-bestiole.js` |
| 🌸 Fiori | 33 | fiorellino, germoglio, fiorellini, fiori bianchi, fioritura, prato fiorito (2×2); i vasi (fiorito, alto, azzurro, tulipani, margherite, lavanda, girasoli, rosa, a colonna, pianta); girasole a cuore, ortensie (blu, rosa), azalea; fioriere (tre), cassetta e cesti di fiori; carriola, bici, due carretti; palo e arco di rose, fiore appeso | `modelli-decori-fiori.js` |
| 🪑 Arredo | 27 | quattro panche (la panca, di legno, bianca, a cuore), sedia, sdraio, amaca (3×1), altalena, dondolo (3×2), tavolino da tè, bancone, due casse, tre barili, due sacchi, posta, specchio, campanelle, girandola, mulinello (gira), palloncini, festone, lucine, paiolo | `modelli-decori-arredo.js` |
| ⛲ Acqua | 7 | fontana grande (3×3), cantina, pozzo coperto, **mulino ad acqua** (3×3, sulla riva, la ruota gira), **ninfee** (due) e **canne** (sull'acqua) | `modelli-decori-acqua.js` |
| 🎪 Feste | 9 | l'albero di Natale (solo da novembre al 6 gennaio) e le **otto della fiera**: bandierine, giostrina (gira), zucchero filato, lanterne, tiro al barattolo, girasole di legno, spaventapasseri in festa, palco della banda | `modelli-decori-feste.js` |

`modelli-decori-base.js` ha gli attrezzi comuni (il caso deterministico, sassi, ciuffi, ceste, cassette, **il motivo di ogni coltura**: lo stesso frutto
disegna il cartello e la cassa; `filo`, `listello`, `botte`, `festoneFra` per aste, tavole, botti e catenarie; `luce` per ciò che «fa luce») e `decoro(id, costruisci)`, che mette il modello in cache e lo fonde; `modelli-decori.js` è il registro `DECORI_CREA`
(id → creatore), che `pezzi.js` mette in `CREA`. I dati sono in `dati/decori.js` (ingombro ed emoji; il resto viene dalla 2D).

## Le regole

- **Stesso id della 2D** (gli id dei contenuti non si rinominano), prezzo, livello e rincaro **dalla voce 2D** (`VOCE_DECORI` in `dati/parita2d.js`,
  che entra in `VOCE`: il test di parità li confronta voce per voce, compresi `stagione` e `fiera`). Eccezioni, perché l'id era già preso in 3D: `recinto` → **`recinto_legno`** (`recinto` è quello
  delle pecore) e `pane`, `torta`, `marmellata`, `latte` → **`<id>_decoro`** (sono merci e ricette: un id non sta in due elenchi). `spaventapasseri` c'era già.
- **Le decorazioni non sono produttive**: non spostano il costo di un livello ([livelli.md](livelli.md)); la scala non cambia. A ogni livello la lista «da costruire» si
  allunga di qualche voce (la 2D ne mette ~3 a livello dal 3 in su).
- **Ingombro 3D scelto dal modello**, non dal foglio 2D (che lo ricavava dallo sprite: un albero di 2×1 non ha senso): albero e bestiole 1×1, siepe 2×1, gazebo 3×3,
  casa 4×3, fienile rosso 4×3, ecc. (`MISURE` in `dati/decori.js`). Si girano col ↻ come ogni pezzo ([rotazione.md](rotazione.md)): il davanti (la porta, il cartello) è +z.
- **Nessun decoro è `calpestabile`**; si costruiscono sul prato come l'aiuola, **tranne i tre d'acqua** (G9): le **ninfee** (due, `suAcqua` + `soloAcqua`: tutte le celle d'acqua, mai sul prato, motivo `serve-acqua`), le **canne**
  (`suAcqua` + `anfibio`: nell'acqua bassa e sul prato, senza il ponte accanto che serve a un ponte) e il **mulino ad acqua** (`suAcqua` + `riva`, come il porticciolo: tocca l'acqua di lato o ci sta in parte). Le regole sono in `puoMettere` ([laghi.md](laghi.md)); non fanno lago (`acqua` è solo di stagno e laghetto) e un ponte non ci passa sopra. Deviazione: la **radura** (3×3, in 2D «sotto», ci
  si cammina) qui è un decoro pieno; renderla calpestabile aprirebbe una scheda di test («calpestabili sono ponte, passerella e moli») e la regola della strada.
- **Il menu**: nove schede in più dopo «Decori» (`SCHEDE_DECORI`: Verde, Fiori, Recinti, Raccolto, Case, Arredo, Acqua, Bestiole, Feste), che scorrono di lato come le altre; le carte sono ordinate per livello, 38 al massimo (Raccolto), e il corpo scorre in verticale.
  **I pezzi dei primi giri restano dove erano** (Decori: aiuola, panchina, fontana, pozzo, spaventapasseri, tavolo, stagno, laghetto, zucche; il ponte fra le Strade): spostarli avrebbe riscritto test e abitudini. È una deviazione: «Fontana» sta in Decori e «Fontana grande» in Acqua.
  Una riga di `stile.css` per scheda dà il colore della piastrella. **La scheda Feste sparisce quando è vuota** (`visibile(k)` in `CostruisciQui.vue`): fuori stagione e senza regali non c'è.
- **Le feste**: l'**albero di Natale** (`stagione: 'natale'`, 🪙24) si offre solo da novembre al 6 gennaio, come le zucche ([stagioni.md](stagioni.md)); comprato resta nel magazzino. Le zucche stanno in Decori (anche per i test); l'albero in Feste.
- **La fiera non si compra, si vince** (`fiera: true`): `compraPezzo` risponde `non-in-vendita`, la carta compare in «Feste» solo se ne hai una nel magazzino (`📦 ×N`), `roba()` non la conta come roba di un livello. Arriva dalla **sorpresa della mongolfiera**, che ora regala **solo una delle otto** (come in 2D), preferendo quelle che hai di meno ([mongolfiera.md](mongolfiera.md)).
- **La migrazione** (`motore/migra.js`, `pezzoPer`): ogni decorazione 2D diventa il pezzo 3D con lo stesso id (la `recinto` di legno → `recinto_legno`). Il bocciolo resta l'aiuola; fontana grande, cantina,
  pozzo coperto, panche e tavolino da tè non sono più la fontana, il pozzo, la panchina e il tavolo piccoli: hanno il loro pezzo. Anche le voci della fiera.
- **I fiori sono poche forme, molti colori** (`testa()` ha sette corolle, `mazzo()` mette steli e foglie, `vaso()`/`trogolo()`/`cesto()` i contenitori): il peso sta nei triangoli (una foglia è un cono a tre facce, una margherita due coni), non nelle mesh. Il colore passa nei vertici dopo la fusione, quindi **ogni id ha la sua geometria**: sono 33 mesh, ma **le copie di uno stesso id sono istanze** (`BancoStatici`: fiori e arredo fermo sono in `STATICI` per categoria), una draw call per id presente in scena. Il mulinello, la ruota del mulino e la giostrina girano (`userData.anima`): restano mesh sciolte.

## Il peso

Ogni modello è **una mesh fusa** (qualcuna due o tre: luce, lastre, parti che girano o sventolano), in cache: la decima siepe è un clone che
condivide la geometria. Misura (senza browser, dai creatori in `DECORI_CREA`; 23/10/2026):

| scheda | voci | mesh medie | max | triangoli medi | max |
|---|--:|--:|--:|--:|--:|
| Verde | 27 | 1,04 | 2 | 231 | 968 (radura) |
| Fiori | 33 | 1,03 | 2 | 506 | 1176 (arco di rose) |
| Recinti | 29 | 1,59 | 2 | 241 | 840 (gazebo con tavolo) |
| Raccolto | 38 | 1,00 | 1 | 399 | 924 (cassa di cavolfiori) |
| Case | 19 | 1,68 | 3 | 381 | 1156 (serra) |
| Arredo | 27 | 1,22 | 3 | 315 | 704 (festone) |
| Acqua | 7 | 1,43 | 2 | 634 | 1112 (cantina) |
| Bestiole | 17 | 1,12 | 2 | 351 | 756 (tartarughe) |
| Feste e fiera | 9 | 1,56 | 2 | 824 | 1240 (giostrina) |

**206 modelli, 1,23 mesh in media**: una decorazione costa ~1,25 draw call (2,3 con l'ombra); 50 decori sparsi sono ~60 draw call (~115 con l'ombra) sui ~430 dello stato pieno di
[scena.md](scena.md) «Le mesh fuse». Il pezzo piccolo (raggio sotto 35 cm: sassi, cibo, bestiole, ciuffi, i singoli fiori) non proietta ombra (`alleggeriOmbre`), quindi nella pratica
pesa meno. **Fiori e arredo fermo sono a istanze** (`BancoStatici`): dieci vasi uguali sono una draw call sola. Il resto no (una mesh a copia): se un giardino da 200 pezzi pesasse, il rimedio è
mettere in `STATICI` anche verde, recinti e raccolto ([da-fare.md](da-fare.md)). **Il tetto**: 206 mesh uniche sarebbero ~250 draw call se un bambino le mettesse tutte, il doppio con l'ombra; non succede, perché ogni tipo conta una volta sola.
Il test (`unita/fattoria3d-decori`) tiene il tetto: nessun modello oltre 3 mesh e 1300 triangoli, in media sotto 1,5 mesh. Le corolle e le foglie sono coni a poche facce, non palle (provato con le palle: 20 triangoli a petalo, il carro di fiori andava a 3700).

## Cosa manca ancora

Niente: ogni decorazione della 2D è un pezzo 3D. Restano **quattro voci 2D che non sono decorazioni** e quindi non hanno un pezzo decorativo (stanno nella lista `NON_DECORAZIONI` del test): i tre silos (la 3D ha tre magazzini di serie, ingrandibili dall'inventario, [parita/colture-e-catena.md](parita/colture-e-catena.md) C11)
e la peschiera (la pesca di molo e porticciolo ne prende il posto, [geografia-e-pesca.md](geografia-e-pesca.md)). Le voci che hanno un vincolo di tessera nella 2D (cartelli «sotto» il campo, `vedute` della casa col retro) non l'hanno: il retro è un giro di 180° del ↻.
**Il lampione non fa luce di notte** perché la 3D non ha un ciclo giorno e notte (solo i cieli delle stagioni): le lucine, le lanterne, le fiamme e le stelle hanno un colore «acceso» (`luce()`, emissivo uguale per tutte così si fondono) e basta.
**I livelli senza niente di nuovo sono zero** (erano 18): ogni livello da 1 a 70 apre almeno una cosa (`roba(l)` di `dati/livelli.js`; la fiera e le feste non contano come roba di un livello).

## Nei test

`unita/fattoria3d-decori` (ogni voce della 2D nelle dieci famiglie è un pezzo con stesso id, prezzo, livello, stagione, fiera e scheda; le eccezioni dichiarate; le quattro voci non decorazioni; ogni modello si costruisce e pesa poco; la cache; la bandiera
sventola solo sul suo clone; le schede del menu hanno 27/33/29/38/19/27/7/17 voci e Feste è vuota fuori stagione; la migrazione; le ninfee solo sull'acqua, le canne ovunque, la fiera non si compra), più la riga per ogni id in `unita/fattoria3d-parita` (che legge `VOCE`) e il catalogo 3D
(`npm run catalogo3d:scheda -- --gioco fattoria --q "scheda «fiori»" --larghezza 2100`, una voce per decorazione, id `fattoria:decoro-<id>`; con più di una ventina di carte la pagina intera a larghezza di serie ripete le righe: allargare). I bersagli del menu: `[data-scheda="fiori"]` e le altre, `[data-carta="<id>"]`.
