# Le piazzole del castello

Quante piazzole ha una tappa, dove le mette la carta e in che ordine le
occupa il giocatore modello. La regola sta in `postiDi` (`src/data/castello.js`),
il disegno in `cartaDi` (`src/motore/castello/carta.js`).

## Quante

- **La strategia vuole spazio.** Le piazzole sono la scelta di *dove*:
  fermarli alla bocca o aspettarli sotto le mura, stringersi a un gomito o
  spargersi. Erano quelle del piano più una (4 nel Bosco, da 6 a 11 nelle
  altre, 14 nelle libere), e la mappa decideva da sola dove si difende —
  «abbiamo pochi spazi per mettere le torri» (l'utente).
- **Almeno il doppio delle torri del piano**, mai meno delle torri che la
  tappa offre (se no la scelta di quale mettere è finta). Il piano ne
  occupa tre o quattro, quindi oggi comanda la quota qui sotto: il doppio
  è il pavimento se un piano crescesse.
- **Una quota per campagna** (`PIAZZOLE`): bosco 8, sotterraneo 12, mura
  14, palude 12. Cresce con quello che la campagna chiede.
- **+4 per ogni bocca oltre la prima** (`PIAZZOLE_PER_INGRESSO`): ogni
  strada vuole le sue prima di unirsi all'altra, in testa, a metà e in
  fondo.
- **Le libere ne hanno venti** (`PIAZZOLE_LIBERE`): la partita è lunga e la
  difesa cresce per venti ondate.

| campagna | prima | adesso |
|---|---|---|
| Bosco (cinque tappe) | 4 | 8 |
| Sotterraneo: grotta, miniera, cripta, gola | 6 | 12 |
| Sotterraneo: le fogne (due bocche) | 9 | 16 |
| Mura: cortile, camminamento, corridoio, sala del trono | 8 | 14 |
| Mura: il torrione (due bocche) | 11 | 18 |
| Palude (cinque tappe, due bocche) | 8 | 16 |
| Libere (quattro) | 14 | 20 |

- **Più piazzole non spostano i calcoli**: il piano (`pianoDi`) non
  guarda i posti, e `operazioniDi` torna uguale a `calcoli` tappa per
  tappa. Chi ha più posti costruisce più largo solo oltre il piano (nelle
  libere, e nel simulatore a fine tappa), ed è giusto.

## Dove

- **Celle accanto alla strada, sparse da un capo all'altro**: la quota di
  ogni strada è in proporzione alla sua lunghezza, le piazzole stanno a
  passi uguali lungo la strada, a lati alterni, e mai attaccate l'una
  all'altra (una cella in mezzo, anche in diagonale). Laghi, fitto e decori
  arrivano dopo, quindi non tolgono posto; bocca e castello sì.
- **La regola che la carta verifica** (`guastiDellePiazzole`): su ogni
  strada almeno una piazzola in ogni terzo — vicino alla bocca, a metà,
  vicino al castello —, piazzole da tutti e due i lati, e con due bocche
  almeno due sul tratto di ogni strada prima che si unisca all'altra (una,
  se quel tratto è sotto le otto celle). Un guasto qui è un guasto della
  carta: lo vedono `unita/castello-carta` e il validatore.
- **La radura grande è scritta a mano** (`A_MANO`): le venti `o` stanno nel
  disegno, e seguono le stesse regole.

## In che ordine le occupa il modello

- **A salti** (`aSalti`): in ogni strada, dalla bocca in giù, con un passo
  lungo un terzo delle piazzole — le prime tre torri una per terzo di
  strada, poi si torna su a riempire i buchi. Con due bocche le strade si
  alternano, e la prima torre di ognuna sta alla sua bocca.
- **Provato dall'ingresso in fila**: con otto piazzole le prime tre torri
  stavano tutte nel primo terzo, e il mostro faceva due terzi di strada
  senza un colpo. Provato dal castello, quando erano quattro: finivano
  tutte davanti alla porta e il mostro faceva l'85% della strada senza un
  colpo.
- **È la partita su cui si tara** (il simulatore, `npm run tara`, i test):
  il bambino le mette dove vuole, e chi le mette meglio del modello ha più
  margine.

## La geometria è equilibrio

Nella firma della taratura entra la carta intera — strada a squadra e
piazzole di ogni tappa, come le dà `sullaCarta` — e non solo lo schizzo:
chi tocca il generatore delle carte, una carta a mano o il numero di
piazzole cambia la firma senza doverselo ricordare.

Nei test: `unita/castello-carta` (le piazzole promesse, sparse nei tre
terzi e dai due lati, le prime tre del modello in tre terzi diversi,
`aSalti`), `unita/castello` (`postiDi`).
