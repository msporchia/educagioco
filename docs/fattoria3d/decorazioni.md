# Le decorazioni in 3D

Giro G8 della parità ([parita/mondo-e-stagioni.md](parita/mondo-e-stagioni.md) W7, W10, W11, W13, W14; [parita/livelli-ed-economia.md](parita/livelli-ed-economia.md) L20):
la 2D ha 217 decorazioni, la 3D ne aveva 10. Ora **130 voci in più**, cinque famiglie, ognuna una scheda nuova del menu «Costruisci qui».

## Cosa c'è

| scheda | voci | cosa | file del disegno |
|---|--:|---|---|
| 🌳 Verde | 27 | alberi (albero, grande, rosa, melo, topiaria), siepi, macchie e ciuffi, la radura, funghi, ceppi, tronchi, sassi e massi | `modelli-decori-verde.js` |
| 🚧 Recinti | 29 | staccionata, recinto di legno, cancello, ringhiera, colonna, pergole, gazebo (anche con tavolo), cartello, insegna, **i 16 cartelli delle colture**, bandiera (sventola), stendardo | `modelli-decori-recinti.js` |
| 🧺 Raccolto | 38 | balle e covone, 4 cassette, le 13 casse delle colture, ceste, cesti di frutta, barili, cesta da picnic, pane, panino, torta, crostatina, marmellata, latte, vasetto | `modelli-decori-raccolto.js` |
| 🏡 Case | 19 | casa, casetta, casa lunga, casa e veranda, casa sull'albero, i due fienili, torretta, forno a legna e a cupola, i due chioschi, casetta delle galline, serra, tettoia, capanno, **lampione, lampione fiorito, lanterna** | `modelli-decori-case.js` |
| 🐞 Bestiole | 17 | cuccia (due), nidi e vaschetta per gli uccelli, ciotola, apiario e alveare, coniglietto, gattino (smoking, come Sherlock), cucciolo (bobtail, come Watson), pulcino, uccellino, tartarughe, farfalla e farfalle, coccinella | `modelli-decori-bestiole.js` |

`modelli-decori-base.js` ha gli attrezzi comuni (il caso deterministico, sassi, ciuffi, ceste, cassette, **il motivo di ogni coltura**: lo stesso frutto
disegna il cartello e la cassa) e `decoro(id, costruisci)`, che mette il modello in cache e lo fonde; `modelli-decori.js` è il registro `DECORI_CREA`
(id → creatore), che `pezzi.js` mette in `CREA`. I dati sono in `dati/decori.js` (ingombro ed emoji; il resto viene dalla 2D).

## Le regole

- **Stesso id della 2D** (gli id dei contenuti non si rinominano), prezzo, livello e rincaro **dalla voce 2D** (`VOCE_DECORI` in `dati/parita2d.js`,
  che entra in `VOCE`: il test di parità li confronta voce per voce). Eccezioni, perché l'id era già preso in 3D: `recinto` → **`recinto_legno`** (`recinto` è quello
  delle pecore) e `pane`, `torta`, `marmellata`, `latte` → **`<id>_decoro`** (sono merci e ricette: un id non sta in due elenchi). `spaventapasseri` c'era già.
- **Le decorazioni non sono produttive**: non spostano il costo di un livello ([livelli.md](livelli.md)); la scala non cambia. A ogni livello la lista «da costruire» si
  allunga di qualche voce (la 2D ne mette ~3 a livello dal 3 in su).
- **Ingombro 3D scelto dal modello**, non dal foglio 2D (che lo ricavava dallo sprite: un albero di 2×1 non ha senso): albero e bestiole 1×1, siepe 2×1, gazebo 3×3,
  casa 4×3, fienile rosso 4×3, ecc. (`MISURE` in `dati/decori.js`). Si girano col ↻ come ogni pezzo ([rotazione.md](rotazione.md)): il davanti (la porta, il cartello) è +z.
- **Nessun decoro è `calpestabile` né `suAcqua`**: occupano le loro celle e si costruiscono sul prato, come l'aiuola. Deviazione: la **radura** (3×3, in 2D «sotto», ci
  si cammina) qui è un decoro pieno; renderla calpestabile aprirebbe una scheda di test («calpestabili sono ponte, passerella e moli») e la regola della strada.
- **Il menu**: cinque schede in più dopo «Decori» (`SCHEDE_DECORI`), che scorrono di lato come le altre; le carte sono ordinate per livello, 38 al massimo (Raccolto), e il corpo scorre in verticale.
  Nessun cambio a `viste/` (il foglio si rifà dai dati): solo cinque righe di `stile.css` per il colore della piastrella di ogni scheda nuova.
- **La migrazione** (`motore/migra.js`, `pezzoPer`): ogni decorazione 2D delle famiglie portate diventa il pezzo 3D con lo stesso id (la `recinto` di legno → `recinto_legno`).
  Prima solo i fiori (→ aiuola) e poche altre avevano un equivalente.

## Il peso

Ogni modello è **una mesh fusa** (qualcuna due: luce del lampione, lastre della serra, il drappo della bandiera che sventola, la fiamma del forno), in cache: la decima siepe è un clone che
condivide la geometria. Misura (`SOLO=verde,recinti,raccolto,case,bestiole node strumenti/misura-modelli3d.mjs`, senza browser; 22/10/2026):

| scheda | voci | mesh medie | max | triangoli medi | max |
|---|--:|--:|--:|--:|--:|
| Verde | 27 | 1,04 | 2 | 231 | 968 (radura) |
| Recinti | 29 | 1,59 | 2 | 241 | 840 (gazebo con tavolo) |
| Raccolto | 38 | 1,00 | 1 | 399 | 924 (cassa di cavolfiori) |
| Case | 19 | 1,68 | 3 | 381 | 1156 (serra) |
| Bestiole | 17 | 1,12 | 2 | 351 | 756 (tartarughe) |

Una decorazione costa quindi **~1,25 draw call** (2,3 con l'ombra); 50 decori sparsi sono ~60 draw call (~115 con l'ombra) sui ~430 dello stato pieno di
[scena.md](scena.md) «Le mesh fuse». Il pezzo piccolo (raggio sotto 35 cm: sassi, cibo, bestiole, ciuffi) non proietta ombra (`alleggeriOmbre`), quindi nella pratica
pesa meno. **Il tetto**: 130 mesh uniche = ~170 draw call se un bambino le mettesse tutte, il doppio con l'ombra; le copie multiple di uno stesso tipo non sono a istanze (una mesh a copia). Se un
giardino da 200 pezzi pesasse, il rimedio è fondere i decori fermi di una cella in una mesh per tipo di materiale o farli a `InstancedMesh` per tipo ([da-fare.md](da-fare.md)).
Il test (`unita/fattoria3d-decori`) tiene il tetto: nessun modello oltre 3 mesh e 1300 triangoli, in media sotto 1,5 mesh.

## Cosa manca ancora (W8, W9, W12, W15)

Fiori e vasi (34), acqua (7 voci: fontana grande, cantina, pozzo coperto, mulino ad acqua, ninfee e canne), arredo (27: sedie, amache, barili, lucine…), l'albero di Natale e la fiera.
Il test `fattoria3d-decori` ha l'elenco con il perché: una famiglia 2D «da bello» o è portata o ci sta scritta. Fiori e arredo riusano gli stessi attrezzi di `modelli-decori-base.js`.
Le voci che hanno un vincolo di tessera nella 2D (cartelli «sotto» il campo, `vedute` della casa col retro) non l'hanno: il retro è un giro di 180° del ↻.

## Nei test

`unita/fattoria3d-decori` (ogni voce della 2D nelle cinque famiglie è un pezzo con stesso id, prezzo, livello e scheda; le eccezioni dichiarate; ogni modello si costruisce e pesa poco; la cache; la bandiera
sventola solo sul suo clone; le schede del menu hanno 27/29/38/19/17 voci; la migrazione), più la riga per ogni id in `unita/fattoria3d-parita` (che legge `VOCE`) e il catalogo 3D
(`npm run catalogo3d:scheda -- --gioco fattoria --q "«case»"`, una voce per decorazione, id `fattoria:decoro-<id>`).
