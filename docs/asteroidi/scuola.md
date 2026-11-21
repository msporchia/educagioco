# Gli Asteroidi a scuola

A scuola il bambino gioca agli Asteroidi veri (`src/views/MathGame.vue`), limitati alle tabelline della lezione.
Il gioco non si storpia: si limita da fuori perché mostri solo quello che la maestra ha chiesto, e accetta solo
quello che sa fare già: il risultato, «9 × 7 = ?», e il numero nascosto, «9 × ? = 63». Chi lo monta è la pagina
dei bambini ([../scuola/bambini.md](../scuola/bambini.md)); cosa la maestra può scegliere sta in
[../scuola/esercizi.md](../scuola/esercizi.md#il-gioco-in-cui-si-fa).

## La prop `limite`

- `<MathGame :limite="{ tabelline: [9] }">`: una o più tabelline da 1 a 10, oppure a gruppi con le loro intensità,
  `{ gruppi: [{ tabelline: [8], volte: 4 }, { tabelline: [3, 4, 5, 6], volte: 1 }] }`: la domanda dopo pesca dal gruppo
  che tocca a turno pesato (`creaTurni`), e dentro il gruppo tutti i fatti come sempre. **A casa manca** (`null` di difetto),
  e senza limite niente di quello che segue esiste: la mappa, la fila, le soste e i premi sono quelli di sempre.
- Il limite diventa una **tappa finta** (`tappaDelLimite` in `src/motore/asteroidi/limite.js`, puro): un pianeta con
  le sole tabelline chieste, nessuna tabellina «nuova», nessun centro «mirato» e il **bersaglio infinito**. Così la
  nave madre di fine tappa, il pacco dell'hangar, la stella e il premio non arrivano mai, senza un `if` per ognuno.
  Il cielo è quello del pianeta della tabellina più alta (la cintura per la sola tabellina dell'1).
- **Tutti e dieci i fatti** di ogni tabellina, dal per 1 al per 10: il pool è `chiaviDelle(tabelle)`, non
  l'insieme di lavoro di chi comincia (`poolTappa`, che a un profilo nuovo darebbe i sei fatti più facili). Il
  picker resta quello di sempre: tre giuste di fila e il fatto riposa, uno sbagliato torna presto.
- Il verso è quello della tabellina: con il 9, sempre «9 × 7», mai «7 × 9».
- **Il numero nascosto**: ogni gruppo porta `modo` (`'prodotto'` di difetto, `'nascosto'`, `'misti'` metà e metà con
  `formaDel`); `prossime()` lascia in `modo` quello del gruppo uscito. La domanda è «9 × ? = 63» con la risposta 7 e i
  falsi della divisione, peso 2 come la grande girata del volo (`preparaTabellina`). Alla maestra la risposta arriva con la
  chiave `tab:nascosto`.

## Il calcolo a mente

Dal 21 novembre 2026 (chiesto dall'utente: «perché solo le tabelline e non le somme?»). La maestra sceglie le **stazioni** del
calcolo a mente del gioco (`STAZIONI` di `data/calcolo.js`, tranne «La prova»), come un contenuto del gioco:
`{ tipo: 'mente', stazioni: ['somma-10', 'somma-20'] }`, la chiave è il primo concetto della stazione (`STAZIONI_MENTE` nella
scheda della scuola). Si mescola con le tabelline nello stesso blocco (`siMescola`), con le intensità.

- **Il limite** porta `mente: { concetti, volte }` accanto ai gruppi di tabelline (`limiteAsteroidi`). Col calcolo solo la
  voce finta è una stazione (`tipo: 'mente'`, coi concetti scelti tutti «nuovi» e il bersaglio infinito); con tutti e due è
  il pianeta, e `prossimoMestiere()` dice di quale mestiere è la domanda dopo, a turno pesato come i gruppi. MathGame lo
  chiede a ogni domanda (`mestiere`), e `mente` e `tappa` lo seguono.
- **Solo i conti scelti** (`senzaPuntelli` della stazione finta, letto da `poolDi` di `store/calcolo.js`): a casa il gioco
  ripassa i prerequisiti deboli, ma a scuola il profilo parte da zero e i puntelli prendevano il posto di quello che la
  maestra aveva chiesto («Oltre la decina» faceva uscire 4+5).
- Alla maestra la risposta arriva con la chiave `asteroidi:mente`. Se il gioco non parte o lei chiede le domande, a schede
  resta la parte che le schede sanno fare (`perLeSchede`: le tabelline); il calcolo da solo resta nel gioco.

## La difficoltà

L'esercizio può portare `difficolta: 'facile' | 'difficile'` (la maestra la sceglie nell'editor; assente = Normale, com'è a
casa). La vista la mette nel limite e `ritoccoDifficolta` (`limite.js`) dà le due leve che il gioco ha già: **Facile** 4 vite e
sassi che cadono in 14 s invece di 10; **Difficile** 2 vite e 7,5 s. Il livello cresce come sempre dalla base ritoccata. Senza
limite il ritocco non si applica.

## Cosa resta e cosa si spegne

| Resta (è il gioco) | Si spegne con `limite` |
|---|---|
| vite, nave che si rovina, scudo | la mappa (si parte giocando: `fase` nasce `gioco`) |
| livelli, cielo che si infittisce e accelera | la barra di avanzamento della tappa e i centri «mirati» |
| gettoni ❄️ e 🎯, filotto 🔥 | il cartello delle monete (le monete si contano lo stesso, in un profilo che muore con la pagina) |
| la pausa (⏸) | la sosta (`salva()` non scrive niente) |
| | l'uscita: la barra e il velo della pausa della scuola non hanno ← né «torno ai giochi» |

- **A vite finite** il velo dice solo «Fine partita» e **«Riparti ▶»**: niente mappa, record, monete, «da ripassare»
  né festa. Riparte la stessa tappa finta da livello 1.
- Suono spento e grafica nella fascia `'bassa'` non stanno qui: li mette il profilo della scuola
  ([../scuola/bambini.md](../scuola/bambini.md)).

## L'evento `risposta`

Ogni volta che il gioco segna una risposta nell'SRS (`answer()`), emette `risposta` **prima** che la domanda cambi:

```js
{ chiave: 'math:7x9', testo: '9 × 7 = ?', giusta: true, ms: 2140, data: 63, attesa: 63, ultima: true }
```

- `data` è il numero del sasso colpito, `null` se il giusto è caduto (o ha urtato la nave); `ms` è il tempo che
  l'SRS conosce (da quando il sasso giusto era raggiungibile), 9000 per il sasso caduto.
- **`ultima`** dice se la domanda si è chiusa: sì al colpo giusto e al sasso caduto; un colpo sbagliato la lascia
  aperta (gli altri sassi cadono ancora), tranne se costa l'ultima vita. Chi conta le domande conta solo le
  `ultima`; chi vuole ogni tentativo li prende tutti.
- A casa nessuno ascolta l'evento.

Nei test: `unita/asteroidi-limite` (senza limite nessuna tappa finta; la tabellina del 9 è un pianeta col bersaglio
infinito e dieci fatti, tutti col 9, che una partita fa uscire tutti; più tabelline in ordine e senza doppioni).
Bersagli: il velo di fine `[data-fine-limite]` col tasto `[data-azione="riparti"]`; il resto è di
[grafica-3d.md](grafica-3d.md) e `window.__mate`.
