# La cucina a scuola

A scuola la cucina è uno svago coi soldi, di solito l'ultimo blocco della lezione («quando lo dice la maestra» o a minuti).
Il bambino gioca alla cucina vera (`src/views/BancarellaGame.vue`), limitata ai livelli che la maestra ha scelto: il gioco
non si storpia, si limita da fuori. Chi lo monta è la vista della scuola (`src/scuola/giochi/cucina/`, il contratto è
[../scuola/giochi.md](../scuola/giochi.md)); i modelli sono gli Asteroidi e Passo passo.

## Cosa sceglie la maestra

```js
{ tipo: 'cucina', da: 7, a: 12 }
//   da..a: numeri di livello da 1 (quelli della lista delle cucine), estremi compresi, da ≤ a; fino al 28
```

- **Un intervallo di livelli**, non un elenco: la cucina cresce un passo alla volta (prima a crudo, poi la pentola, il forno,
  i due piatti), e alla cassa il conto cambia a tratti. Cinque minuti non c'è: è a tempo e conta il record.
- **La materia è matematica**: i soldi e il resto. La voce ha l'icona del gioco (🍳) e parte da `1..6`.
- **`valido`** rifiuta chiavi in più (anche `gioco`, che il catalogo toglie prima), estremi non interi, fuori da 1..28 o
  rovesciati. **`descrivi`**: «La cucina · livelli 7-12 · il resto lo conti tu», «La cucina · livello 7 · …», e a cavallo
  di due tratti «il resto lo dice la cassa, poi il resto lo conti tu».
- La scheda legge `CUCINE` (`data/bancarella-cucine.js`, puro): i nomi e i conti sono quelli del gioco. `TRATTI_CUCINA` sono
  i livelli di fila con la stessa cassa (1–6 la cassa dice il resto, 7–12 il resto lo conti tu, 13–15 i mezzi euro…, la
  tabella di [cucina.md](cucina.md#i-livelli)).
- L'editor (`Parametri.vue`) ha i tratti come tessere («Il resto lo conti tu · euro tondi 7–12») e sotto «Dal livello» e
  «Al livello» coi nomi e la novità di ognuno; un estremo oltre l'altro li scambia. La nota dice quanti livelli e chi fa
  i conti.

## Il gioco col limite

`<BancarellaGame :limite="{ da, a }">`. **A casa manca** (`null` di difetto), e `livelliDelLimite`
(`motore/bancarella/limite.js`, puro) torna `null`: niente di quello che segue esiste.

- **Il giro**: si parte giocando al primo livello dell'intervallo, senza la scelta delle cucine. Vinto un livello,
  «Prossima cucina ▶» porta al dopo nel giro, e finito l'ultimo **si ricomincia**. A cuori finiti «Riparti ▶» rifà lo
  stesso livello.
- Scelto il tasto e non il passaggio da solo: il bambino vede il suo «Servizio finito!» come a casa.

| Resta (è il gioco) | Si spegne con `limite` |
|---|---|
| la stanza, le ordinazioni, i cuori, la ricetta | la scelta delle cucine e il gioco in due (a scuola sono `Vuoto.vue`) |
| la cassa coi suoi conti, i resti perfetti ✨ | le monete (`paga`), i contatori (`segna`), il record e i livelli vinti (`scriviBanco`) |
| la pausa | la sosta (`salva` non scrive niente), «Le cucine» a fine livello, ← della barra |

La barra e la pausa da cui non si esce, il suono spento, il profilo in memoria li mette la scuola
([../scuola/architettura.md](../scuola/architettura.md)).

## Il 3D

Il profilo della scuola sceglie la fascia `'bassa'` ([../scuola/bambini.md](../scuola/bambini.md)): col limite e quella
fascia la cucina disegna a pixel ratio 1 (la prop `dpr` di `components/bancarella/Cucina.vue`; a casa manca, e vince
sempre `&dpr=` dell'indirizzo). Le ombre sono già rifatte solo quando cambia cosa sta sui banchi. Se la cucina non si
disegna, o perde il 3D per strada, offre «riprova» (`[data-senza3d]`): la vista della scuola lo vede e manda `guasto`.

## L'evento `risposta`

Solo **dove il resto lo conta il bambino** (dal livello 7, `chiediResto`): una risposta per ordinazione pagata, emessa alla
consegna. Dove il resto lo dice la cassa non va niente.

```js
{ chiave: 'bancarella:mezzi', giusta: true, ultima: true, ms: 8400,
  fatto: 'resto su 10 € per 6,50 €', data: '3,50 €', attesa: '3,50 €' }
```

- **`giusta`** vuol dire nessun rifiuto: né un resto né un totale battuto che non tornava. Sempre `ultima: true`: la cassa
  non lascia andare finché il resto non è giusto, quindi ogni ordinazione è una domanda chiusa.
- `fatto` dice con cosa pagano e il conto; con due piatti (dal 20) le due voci, «resto su 20 € per 6,50 € + 5,90 €».
- `data` è il primo conto che non tornava («4 €», «totale 12,50 €»), o il resto dato se era giusto; `attesa` il resto
  giusto, e coi due piatti anche il totale («totale 12,40 € · resto 7,60 €»). I soldi tondi senza virgola: «10 €».
- `chiave` è quella che la cassa dà già a `answer()` (`bancarella:<fascia>`); `ms` da quando si è aperto il foglio.

Nei test: `unita/cucina-scuola` (senza limite nessun giro; la scheda uguale alle cucine, coi tratti senza buchi;
`valido` contro una ventina di forme storte; `descrivi`; la voce nel catalogo e solo in cucina; il giro 7-12 e da capo;
le risposte di ogni livello: nessuna dove la cassa dice il resto, nei 40 caratteri dove lo conta il bambino). Bersagli:
la vista `[data-gioco="cucina"]`; nell'editor `[data-tratto]`, `[data-campo="da"]`, `[data-campo="a"]`; a fine livello
`[data-azione="prossima"]` e `[data-azione="riparti"]`, senza `[data-azione="le-cucine"]`.
