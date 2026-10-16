# Il mondo aperto: i dati e il salvataggio

Dove vive lo stato del mondo aperto, la nebbia nuova, se il 3D e il 2D condividono l'avanzamento, e il travaso di chi ha
già giocato. È la quarta parte del progetto ([mondo-aperto-progetto.md](mondo-aperto-progetto.md)); come oggi:
[avventure.md](avventure.md), [portale-e-sosta.md](portale-e-sosta.md), [../core/ripresa.md](../core/ripresa.md).

## Dove sta

- **Tutto in `profile.campagne`**, nessun campo nel profilo. Nell'avventura un campo `mondo` (se 2D e 3D tengono la
  stessa chiave, accanto a `terra`, che resta del 2D):

```js
mondo: { nebbia,        // un bit per cella, in base64: 160×140 celle sono 2 800 byte, 3 734 caratteri
         dove,          // { x, y } o { citta: 'forte' } dopo un viaggio
         giro,          // quante volte si è entrati in una città: il seme di quello che vive sopra
         pietre,        // le pietre accese: ['villaggio', 'forte', 'altare', …]
         parlato, divieti,
         sopra }        // la superficie lasciata con la ✕: la regione, il seme e i cambiamenti (come una sosta, ~0,5 KB)
```

- **La nebbia passa dall'esadecimale al base64** (un terzo in meno); un codice che non torna è nebbia nuova, come oggi.
  Si salva quando si scopre e ogni pochi secondi, come la sosta: 4 KB per eroe vanno bene in IndexedDB e anche nel
  ripiego di localStorage ([../core/archivio.md](../core/archivio.md)).
- **`MONDO` (`cfg.mondo`, oggi 4) non sale**: salire azzera tutte le avventure (`azzeraIlVecchio`). Il mondo aperto
  si aggiunge, non azzera.

## Il 3D e il 2D: insieme o no

**Da decidere. Raccomandato: separati mentre il mondo è in prova**, con una chiave sua (`profile.campagne.sotterraneo3d`,
le stesse forme: avventure, roba, missioni, sosta) e il tasto «porta qui il tuo eroe» che **copia** una volta l'avventura
del 2D (roba, livello, gemme, discese finite, missioni) e da lì va per conto suo.

- **Il perché**: il mondo aperto cambia la progressione (esperienza di sopra, antri, quest, città), e la stessa
  avventura giocata nei due farebbe arrivare nel 2D un eroe fuori tabella; le soste non si capirebbero (una sosta di
  sopra non esiste nel 2D). Il Sotterraneo 3D di oggi condivide tutto perché cambia solo il disegno; il mondo aperto
  cambia il gioco.
- **Il costo**: medaglie, esperienza dell'app e riga della home leggono `sotterraneo`, e il 3D in prova non li muove
  (i contatori del bambino, `segna()`, sì). Una chiave nuova di campagna è un dato del gioco, non un campo del profilo.
- **L'alternativa**: la stessa chiave e il campo `mondo` accanto a `terra` (quello sopra). Meno codice, ma il 2D e il
  3D si sporcano a vicenda.

## La migrazione, il giorno che il mondo sostituisce il 2D

Si travasa ogni avventura di `sotterraneo` sul mondo, all'apertura, una volta (un `mondoAperto: 1` in `cfg`), senza
toccare il record di fuori, le stelle, la roba, le missioni e la sosta di un dungeon:

| nel 2D | nel mondo |
|---|---|
| nessuna discesa finita | si parte nel villaggio, nebbia nuova |
| la cripta (0) … la tana (3) finite | scoperte le regioni e le strade fino a quei dungeon, accese le loro pietre |
| la quarta finita | in più il ponte delle marche alzato, il forte scoperto e la sua pietra accesa |
| la sesta finita | in più il valico del nord aperto, il rifugio scoperto |
| storia finita | tutto il mondo scoperto lungo le strade, le pietre accese; le zone come prima (`zone` non si tocca) |
| una sosta con `via: 'portale'` | il gemello nella città che serve quel dungeon |
| una sosta con `via: 'uscita'` | uguale: si riprende giù |
| `terra.nebbia`, `terra.dove` | buttati: la mappa è un'altra (la nebbia si rifà dalle discese finite) |
| missioni prese o fatte | uguali, per id; chi le dà sta in una città, e la freccina lo trova |

- **Il caso peggiore**: un'avventura con una sosta via portale in un dungeon delle marche e la storia ferma prima del
  ponte (succede solo se la sosta è nata da un salvataggio a mano o da un cheat). Il gemello starebbe al forte, che non
  si raggiunge: si mette nel villaggio, e il test lo prova.
- **Il caso più comune che fa male**: la nebbia del 2D si perde. Chi aveva girato tutta la mappa dipinta ritrova
  scoperte solo le strade verso i dungeon finiti; si dice con una riga la prima volta («la terra è cambiata: le strade
  che conosci ci sono ancora»).

Nei test (da scrivere): `unita/sotterraneo-mondo-salva` (la nebbia nuova, `mondo`, il travaso con la tabella qui sopra e il caso
peggiore). Il resto in [mondo-aperto-fasi.md](mondo-aperto-fasi.md#i-test).
