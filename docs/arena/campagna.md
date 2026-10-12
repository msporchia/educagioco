# La campagna

Dodici tappe in quattro scalini, in `dati/campagna.js`. Una tappa è la stessa
partita con altre regole: quali truppe si possono costruire, quanto è forte il
nemico, che terreno c'è. **Le operazioni arrivano una famiglia alla volta**
(l'ordine è quello delle truppe che si sbloccano):

| scalino | terreno | truppe nuove | operazione |
|---|---|---|---|
| Il bosco (3 tappe) | bosco | guardiano, pipistrelli, negromante | `+` `−` |
| La palude (3) | palude | lupi, golem | `×` |
| Le nevi (3) | neve | diavoletto, drago | `÷` |
| La lava (3) | lava | — | tutte |

- **La portata** (0-100, [eta-e-portata.md](../apprendimento/eta-e-portata.md))
  sale da 12 a 70: una tappa sopra la mira dell'età resta chiusa.
- **Il nemico** ha una scheda per tappa: monete al secondo, ogni quanto pensa,
  e la forza delle sue truppe. Sono i numeri che si tarano col banco
  ([taratura.md](taratura.md)).
- **Le stelle**: una per aver vinto, una per aver tenuto in piedi la torretta,
  una per aver chiuso con la base oltre il 70% della vita (`stellePer`).
- Il vestito del terreno è quello del castello (`bosco`, `palude`, `neve`,
  `lava`): stesso foglio, niente da generare.
- `guastiDellaCampagna()` pretende che le truppe e le portate non scendano, che
  il nemico non diventi più debole e che la prima tappa sia di sole somme.
