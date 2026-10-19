# La campagna

Dodici tappe in quattro scalini, in `dati/campagna.js`. Una tappa è la stessa
partita con altre regole: quali truppe si possono scegliere costruendo gli edifici
(un edificio c'è se c'è almeno una delle sue due truppe), quanto è forte il
nemico, che terreno c'è. **Le operazioni arrivano una famiglia alla volta**
(l'ordine è quello delle truppe che si sbloccano):

| scalino | terreno | si costruiscono | operazione |
|---|---|---|---|
| Il bosco (3 tappe) | bosco | arcieri e opliti (la cripta), poi pipistrelli, poi negromanti | `+` `−` |
| La palude (3) | palude | arcieri, opliti, **mummie**, poi negromanti: niente pipistrelli né golem | `×` |
| Le nevi (3) | neve | arcieri, opliti, negromanti, **bestie cornute**; dal ghiaccio **golem e drago** | `÷` col drago |
| La lava (3) | lava | arcieri, opliti, negromanti, bestie, **diavoletti**, drago: niente golem | tutte |

**Le truppe di una tappa sono quelle del terreno** (`truppeDelTerreno`, la stessa lista della
battaglia infinita, [regole.md](regole.md#la-battaglia-infinita-e-le-truppe-di-un-terreno)), tolte
quelle la cui operazione non è ancora arrivata: così a ogni scalino cambia davvero cosa si può
costruire (le mummie restano alla palude, i pipistrelli al bosco), e non solo si aggiunge. Il drago
(`÷`) aspetta le nevi, i diavoletti la lava. Passando da uno scalino all'altro una truppa può sparire;
dentro lo scalino no (`guastiDellaCampagna`).

- **Oltre le dodici tappe c'è la battaglia infinita** (in cima alla mappa): senza timer, il nemico dell'ultima
  tappa, un terreno diverso a ogni volta con la sua truppa firma; si apre dopo l'ultima tappa, con la sua
  portata (70). Le regole in [regole.md](regole.md#la-battaglia-infinita-e-le-truppe-di-un-terreno). Le tappe
  hanno le truppe del loro terreno, scritte in `CAMPAGNA`.
- **La portata** (0-100, [eta-e-portata.md](../apprendimento/eta-e-portata.md))
  sale da 12 a 70: decide se la carta si offre e da dove si comincia, non chiude tappe.
- **Il nemico** ha una scheda per tappa: monete al secondo, ogni quanto pensa,
  e la forza delle sue truppe. Sono i numeri che si tarano col banco
  ([taratura.md](taratura.md)).
- **Le stelle**: una per aver vinto, una per aver chiuso col castello oltre la
  metà della vita, una per averlo tenuto oltre l'85% (`stellePer`).
- Il vestito del terreno è quello del castello (`bosco`, `palude`, `neve`,
  `lava`): stesso foglio, niente da generare.
- `guastiDellaCampagna()` pretende la cripta in ogni tappa (è la prima mossa), che le
  portate non scendano, le truppe nemmeno dentro uno scalino e siano tutte del terreno, che
  il nemico non diventi più debole e che la prima tappa sia di sole somme.
