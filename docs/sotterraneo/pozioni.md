# Le pozioni di cura

Cinque stadi a numeri fissi (la tabella: [roba.md](roba.md#le-pozioni)), il loro prezzo rispetto a una spada, il tetto di otto in tasca, la scelta
di quale bere e come le usa il giocatore finto. Il codice: `dati/cose.js` (le cure, `dalla`, `tutta`), `motore/corredo.js` (`curaDi`,
`pozioniDiCura`, `cista`), `motore/bottega.js` (`sempreDi`), `motore/bottino.js` (`ampollaCade`), `motore/corsa.js` (`pozioneGiusta`,
`scelteDiCura`), `viste/ScegliPozione.vue`, `motore/banco.js` (`allaBottega`, `equipaggia`).

- **Una spada costa quanto uno zaino pieno di pozioni** (l'utente: «quante pozioni costa una spada?»): un pezzo utile al banco (un salto) costa
  in mediana circa otto pozioni «di tutti i giorni» del tratto, e otto è il tetto. Di tutti i giorni è la boccetta, poi la pozione; le grandi
  costano di più per punto e restano fuori dal conto. Chi tara le gemme dei mostri usa questo rapporto:

  | livello | pezzo utile (mediana) | pozione del tratto | rapporto |
  |---|---|---|---|
  | 1 | 73 | boccetta, 8 | 9,1 |
  | 5 | 141 | pozione, 21 | 6,7 |
  | 10 | 190 | pozione, 21 | 9,0 |
  | 12 | 181 | pozione, 21 | 8,6 |

- **Le grandi arrivano più avanti** (`dalla`, `Bottega.sempreDi`): chi ha 50 vite trova già quella che gli serve, chi ne ha 20 non ha sul banco
  una cura da 50. Il pannello dice i punti veri («+30 vita, subito»).
- **L'ampolla della vita non si compra**: cade dal grosso (25%), da un caporale (5%) e da un forziere (2,5%), `ampollaCade` in
  `motore/bottino.js` (un tiro suo, che non sposta l'elisir), ed è quella da tenere per un boss. Non si confonde con l'elisir del toro (🐂,
  vita massima per sempre): una è una cura sola, l'altro cresce l'eroe.
- **Al più otto cure in tasca, di qualunque stadio** (`POZIONI_MASSIME`; l'utente: «più di 8 pozioni non le puoi portare: quantomeno devi pagare
  la cosa perdendo un sacco di tempo»): la nona non si compra («hai già 8 pozioni», tasto spento), per terra resta lì, e lo zaino scrive
  «🧪 3/8» accanto al piano. Non contano l'energia (costa poco e torna camminando) né l'elisir del toro. Senza tetto il giocatore finto entrava
  nel fondo con 55 pozioni (le uguali stanno in una tasca sola): il tetto pesa più del prezzo, e i giocatori tipo lo toccano quasi a ogni
  discesa (riga `al tetto` del rapporto).
- **Con più stadi in tasca si sceglie quale bere** (`ScegliPozione.vue`, `Corsa.scelteDiCura`): la 🧪 della barra e «Bevi una pozione» dello
  scontro (costa il turno, anche dallo stop) aprono una riga per stadio con quanto cura e quante ne hai; con uno solo si beve e basta. Il
  motore sceglie da sé la più piccola che rimette quanto manca (`pozioneGiusta`): lo fa il banco.
- **Il giocatore finto** compra la più grande che può pagare, dopo la roba, fino al tetto; il curioso non risparmia l'ampolla della vita, il
  bravo la tiene per il grosso (`tieneLaVita`). Nei test: `unita/sotterraneo-pozioni`, `integrazione/sotterraneo-pozioni`.
