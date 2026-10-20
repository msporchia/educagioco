# Il mondo aperto: i dati e il salvataggio

Dove vive lo stato del mondo aperto, la nebbia nuova, se il 3D e il 2D condividono l'avanzamento, e il travaso di chi ha
già giocato. È la quarta parte del progetto ([mondo-aperto-progetto.md](mondo-aperto-progetto.md)); come oggi:
[avventure.md](avventure.md), [portale-e-sosta.md](portale-e-sosta.md), [../core/ripresa.md](../core/ripresa.md).

## Dove sta

- **Tutto in `profile.campagne`**, nessun campo nel profilo. Nell'avventura un campo `mondo` (se 2D e 3D tengono la
  stessa chiave, accanto a `terra`, che resta del 2D):

```js
mondo: { firma,         // la firma dello scheletro del mondo a percorso: diversa o assente vuol dire mappa cambiata (il travaso, sotto)
         nebbia,        // un bit per cella, in base64: 504×300 celle sono 18 900 byte, 25 200 caratteri
         dove,          // { x, y }, o { portale: true } salendo dal portale
         giro,          // quante volte si è entrati nel villaggio: il seme di quello che vive sopra
         pietre,        // le pietre accese: ['villaggio', 'zona:prati', 'zona:bosco', …]
         parlato, divieti, novita, quest,
         sopra }        // i mostri di sopra: i morti per zona, le forze, le cose per terra (motore/aperta.js, inSalvo)
```

- **La nebbia passa dall'esadecimale al base64** (un terzo in meno); un codice che non torna è nebbia nuova, come oggi.
  Si salva quando si scopre e ogni pochi secondi, come la sosta: 25 KB per eroe vanno bene in IndexedDB e anche nel
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

| nel 2D, o nel mondo ad anelli | nel mondo a percorso |
|---|---|
| nessuna discesa finita | si parte nel villaggio, nebbia nuova |
| una discesa della storia finita (o con le stelle) | scoperta la strada maestra dal cancello fino a lei, la sua stradina e il suo ingresso; accesa la pietra della sua zona (`altare` e `cantine` i prati, `torre` e `gallerie` il bosco, `cisterna` la palude, `labirinto` le ceneri, `fondo` il monte) |
| storia finita | la strada maestra scoperta fino alle miniere, accese le pietre di cinque zone; le zone di [zone.md](zone.md) come prima (`zone` non si tocca) |
| le pietre accese (`villaggio`, `forte`, `rifugio`, `altare`…) | le città sono il villaggio, i dungeon la pietra della loro zona (`pietraDiOggi`) |
| una sosta con `via: 'portale'` | il gemello del villaggio, l'unica città |
| una sosta con `via: 'uscita'` | uguale: si riprende giù |
| `terra.nebbia`, `terra.dove` del 2D; `mondo.nebbia`, `mondo.dove` degli anelli | buttati: la mappa è un'altra (la nebbia si rifà dalle discese finite, si riparte dalla piazza) |
| `mondo.sopra` degli anelli (i morti per indice) | buttato: con un'altra mappa gli indici sono altri mostri, e tornano tutti |
| `giro`, `parlato`, `divieti`, `novita` | uguali |
| missioni e taglie prese o fatte | uguali, per id: `t:forte:…` e `t:rifugio:…` si leggono e si consegnano al villaggio, i luoghi tengono le chiavi delle regioni |

- **Quando**: all'apertura, una volta, con `mondoDaSalvato(m, salvato, tappe)` di `motore/mondo-sopra.js`: una `firma` diversa da quella
  del mondo (o nessuna, tutti i salvataggi di prima del percorso) fa il travaso, una uguale rilegge com'era. Salvando si scrive la firma
  (`mondoDaSalvare`).
- **Il caso più comune che fa male**: la nebbia si perde. Chi aveva girato tutta la mappa ritrova scoperta solo la strada maestra verso
  i dungeon finiti; si dice con una riga la prima volta («la terra è cambiata: le strade che conosci ci sono ancora»), `travasato`.

Nei test: `unita/sotterraneo-mondo-salva` (la nebbia nuova, la prima volta, il travaso di un salvataggio del mondo ad anelli con la
nebbia da 3 734 caratteri, le pietre `forte` e `altare` e il `sopra` vecchio, e rileggere quello che si è salvato). Il resto in
[mondo-aperto-fasi.md](mondo-aperto-fasi.md#i-test).
