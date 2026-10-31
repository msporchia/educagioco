# Le decisioni dell'utente

Le scelte che il codice non poteva prendere da solo per sostituire la 2D con la 3D. **Sono tutte chiuse**: qui resta la scelta e il
suo perché, le opzioni scartate le tiene `git log`.

## La regola generale (22/10/2026): la 3D usa i valori esatti della 2D

Dove la 2D ha un valore (livelli, prezzi, tempi in minuti, silos con scomparti, costo dei gesti) la 3D usa **quello**, letto dai dati
in `src/giochi/fattoria3d/da2d/dati/` (il ponte è `dati/parita2d.js`, [../livelli.md](../livelli.md)). Chiude D2, D9, D11, D13.
Le eccezioni:

- **Terra**: lotti 4×4 senza confini contro piazzole 6×6; si pareggia **la quantità di terra**, e nel dubbio se ne regala un po'.
- **Campi** (D12): le quattro tessere restano (si leggono meglio), ma il campo intero rende come uno della 2D: un pezzo.
- **Pesca** (D4): un'attività medio-alta, al livello della peschiera (57) e col suo ritmo; si è ritarata solo la parte alta della scala.

## Le decisioni

| | domanda | decisione | quando |
|---|---|---|---|
| D1 | i salvataggi della 2D | **si convertono**: fedeli in tutto, imprecisi nei piazzamenti, mai monete ([migrazione.md](migrazione.md)) | 21/10 |
| D2 | la scala dei livelli e dei prezzi | quella della 2D: 70 livelli, ~200 ore | 22/10 |
| D3 | il livello del fienile | come la 2D: livello 6, 🪙150 | 22/10 |
| D4 | i tempi della pesca | calibrati con la parte medio-alta della scala (sopra) | 22/10 |
| D5 | vendere ai vicini | niente monete: un solo rubinetto di entrata, gli esercizi | 22/10 |
| D6 | comprare dai vicini | niente esperienza: chi compra e poi consegna al banco la conterebbe due volte. I vicini sono posti di vendita in più | 22/10 |
| D7 | il fienile di scena e la macchina | un fienile solo, la macchina: «tre mangimi, tre bocche» si insegna con uno; il fienile di scena è tolto | 22/10 |
| D8 | i laghetti naturali | si tengono, più grandi e credibili ([../laghi.md](../laghi.md)) | 22/10 |
| D9 | secondi o minuti | minuti, come la 2D: un posto dove si torna, non dove si resta | 22/10 |
| D10 | le funzioni solo 3D | si tiene tutto (mondo senza confini, mare e pesca, vicini, guardaroba, compagni, tre stadi); le visite agli amici pronte ma spente finché il gioco non è provato coi bambini | 22/10 |
| D11 | silos e scomparti | come la 2D, in tre magazzini ([../magazzini.md](../magazzini.md)) | 22/10 |
| D12 | quattro tessere o una | quattro, che rendono come una (sopra) | 22/10 |
| D13 | il costo dei gesti | come la 2D, 🪙1–2 a raccolto e a lavorazione: un rubinetto quotidiano | 22/10 |
| D14 | quando si spegne la 2D | **tolta dal gioco il 31/10/2026**: la 3D è «La fattoria» e non è più in prova; quello che la 3D legge ancora sta in `da2d/`, l'atlante in `src/grafica/atlante-fattoria.js`; le medaglie della 2D se ne vanno, la sua esperienza resta in `XP_AREA.fattoria` | 31/10 |
| D15 | un telefono senza WebGL 2 | «non ci interessa»: niente ripiego, il gioco lo dice e si torna in home | 31/10 |
| D16 | la riga per i bambini | nessuna finché la 3D era in prova; al cambio si propone a fine lavoro e si scrive solo dopo il sì ([../../genitori/novita-bambini.md](../../genitori/novita-bambini.md)) | 22/10 |
