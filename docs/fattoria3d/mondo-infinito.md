# Il mondo senza confini

Il mondo non è più un rettangolo di 7×6 lotti: **i lotti hanno coordinate intere `(a, b)` qualunque, anche negative**, e se ne
compra qualunque confini (4 direzioni) con uno proprio. Niente tetto fisso: il prezzo si auto-limita. Codice: `dati/mondo.js`
(coordinate), `dati/lotti.js` (`generaLotto`), `dati/biomi.js`, `dati/alberi.js`, `dati/ostacoli.js`, `motore/fattoria3d.js` (lotti
aperti, mappe sparse), `scena3d/terreno.js` (la finestra). I laghetti: [laghi.md](laghi.md); le regole del terreno: [terreno.md](terreno.md).

## Le coordinate (la stessa mappa di prima)

`i = -14 + 4a`, `j = -12 + 4b`, id `a_b` (`-1_3` è un lotto a ovest). I **42 lotti storici** (a 0..6, b 0..5) sono quelli di
prima, il quadrato di partenza è 2..4 × 2..4: i salvataggi valgono tali e quali. Le celle sono chiavi intere impacchettate
(`chiave(i, j)`, ±1 milione): le strutture del motore non sono più array di `GW×GH` ma mappe e insiemi sparsi (`strada`,
`bloccoFisso`, `cellaEdificio`, `cellaCosa`, `cellaPasso`). Le API sono le stesse (`blocca`, `libera`, `cellaPropria`,
`puoMettere`, `percorsoVerso`).

## Gli id salvati: una cella, un intero

`stato.strade`, `stato.ostacoli` e `stato.tagliati` salvano interi, e quelli di prima non cambiano:

- **dentro il rettangolo storico** una strada o un sasso è l'indice della vecchia griglia (`idCella`), un albero il suo numero di
  sempre (0…56: `alberiStorici()` rifà la stessa lista col seme di prima);
- **fuori** è la chiave impacchettata della cella (≥ 2·10¹², mai una collisione con i vecchi, che stanno sotto 832). Un albero nuovo
  ha per numero la chiave della sua cella.

`VERSIONE_STATO` è 8 solo come segno: non c'è niente da tradurre, un v7 si legge uguale (`normalizza` scarta gli id di lotto
che non sono `a_b` e non lancia mai).

## Generare un lotto

`generaLotto(a, b)` è puro: stesso risultato a ogni chiamata, per ogni coppia (anche `-50_-50`), senza `Math.random`
(`dati/semi.js`: un `mescola(a, b, sale)` per le scelte, una `sequenza` mulberry32 per le liste). Torna `{ bioma, acqua, molo,
alberi, ostacoli }`.

- **I lotti storici** hanno gli alberi e i sassi di prima (il riferimento fisso è `test/aiuto/fattoria3d-mondo-storico.json`,
  prodotto dal codice vecchio): sono sempre prato e senza acqua, così non cambiano.
- **I lotti nuovi**: alberi nelle celle 0..2 del lotto (due alberi di lotti vicini stanno sempre ad almeno 2 celle; un albero nuovo
  non si pianta a meno di 1,9 da uno storico), poi i sassi come sempre ma senza toccare alberi, acqua e molo. Il prato ha 3
  tentativi d'albero, il bosco 12 più fitti (1,4), il laghetto 2; sassi e cespugli 2–5 sul prato, 1–3 in bosco e laghetto.
- **Il bioma** viene dalle coordinate: prato ~69%, bosco ~15%, laghetto ~15% (misurato su 14400 lotti). Un laghetto è un lotto
  non storico il cui sorteggio è il più basso fra quelli che lo toccano di lato: **mai due laghetti attaccati** (in diagonale c'è
  sempre terra fra le due acque) e **mai a meno di due lotti dal quadrato di partenza** (stanno fuori dal rettangolo storico:
  il più vicino è a tre lotti). Provato: un sorteggio «il più basso fra gli otto vicini» non supera l'11%.

## Quello che si apre e quello che si disegna

Il motore **apre** (genera) i lotti tuoi e quelli entro **due lotti** da uno tuo (`lottiAperti`, `_apriAnello`): ci sono gli
alberi su cui il dito apre l'offerta del lotto, i sassi, l'acqua. Aprire è a richiesta e una volta: comprare un lotto apre i
nuovi dell'anello. Fuori dall'anello non c'è niente (il suolo è un piano che segue la camera, la nebbia nasconde il bordo).

La scena disegna solo una **finestra di 9×9 lotti attorno alla camera** (4 per lato, 5 avanti, 3 dietro: la camera guarda
verso −z) fra i lotti aperti, e la rifà quando cambia il lotto al mezzo o il terreno (`Terreno.segui`, `ridisegnaTutto`). Il
peso non cresce con la fattoria: istanze massime (`CAPACITA` in `terreno.js`) alberi 700 (×3 mesh), cespugli 420, sassi 420,
ciuffi 1500, strade disegnate 4000, pali 2400, travi 4800, veli 90, griglia 90, acqua 200 (con la riva), canne 120, ninfee 120.
Una fattoria con cento lotti pesa quanto una con venti. Provato: un'estensione enorme con tutti i lotti disegnati: non va sul
telefono, per questo la finestra.

## Il prezzo che si auto-limita

`prezzoDelLotto(k)` (`dati/regole.js`), con `k` i lotti comprati oltre i nove di partenza: `40 + 20k + 2·max(0, k−32)²`. I primi
33 costano come sempre (40, 60… 680); poi il termine quadratico fa il resto:

| lotto | 1° | 10° | 20° | 33° | 50° | 100° | 200° |
|---|---|---|---|---|---|---|---|
| 🪙 | 40 | 220 | 420 | 680 | 1 598 | 10 998 | 59 798 |
| minuti di esercizio | 7 | 37 | 70 | 113 | 266 | 1 833 | 9 966 |

Il centesimo costa più di una settimana di mezz'ora al giorno: nessuno lo compra per caso. **La terra dà esperienza fino a 🪙 680
per lotto** (`COSTI.lottoEsperienzaMax`, il prezzo dell'ultimo lotto storico): un lotto caro non salta i livelli. La taratura
(`npm run tara:fattoria3d`, `motore/taratura.js`) tiene ferme le promesse: prezzo che sale, il 33° a 680, il centesimo oltre una
settimana, esperienza di un lotto sotto un terzo della scala. Si auto-limita anche coi tempi: più lotti sono più strade e più
cammino. Non c'è un limite fisso: un tetto sarebbe una regola che un bambino scopre di colpo.

## Il percorso

`percorsoVerso` è un Dijkstra con un mucchio, sulle chiavi di cella; cammina solo dove `libera()` è vero, cioè nel terreno
proprio (finito) e non nell'acqua (se non su un ponte), e si ferma alla prima meta estratta. Nel bosco del vicinato non si
cammina: l'eroe non esce mai dal suo terreno.

## Nei test

`unita/fattoria3d-mondo` (generazione, lotti storici, acquisto in quattro direzioni, prezzo, laghetti, ponti, salvataggi, vicini);
`unita/fattoria3d-taratura` (il prezzo); `integrazione/fattoria3d` (`motore.lottiComprabili()` per trovare un lotto da toccare).
