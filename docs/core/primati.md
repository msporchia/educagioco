# I primati dei giochi senza fine

Un gioco che non finisce non dà stelle né tappe: l'unica cosa che ha da
dare è **di quanto sei migliorato**. Come lo dichiara e dove sta il record.

`src/giochi/primati.js` è la parte pura (il contratto sta in testa al
file, `test/unita/primati`); scrive nel profilo solo
`src/giochi/campagne.js`; `src/giochi/Festa.vue` fa i coriandoli,
`src/giochi/Primati.vue` la tabella dei record nell'albo.

## Le regole

- **La notizia porta la misura**: il numero di adesso e quanto si è
  guadagnato, o di quanto è mancato. «🥇 nuovo primato!» da solo non dice
  niente (`fraseDiFine`).
- **La prima partita in assoluto non batte niente**: «il tuo primo
  risultato», non «hai battuto il record» — quale?
- **Un pareggio non è un record**: coriandoli a ogni partita uguale non
  sono più una notizia.
- **Il record vecchio non si butta**: `apriQuaderno` legge ancora
  `cfg.primato` (Survivors) e, con la funzione `vecchio` del
  `senzaFine`, `best.math` (asteroidi), finché un quaderno non c'è; la
  prima scrittura lascia andare il posto vecchio. Ripartire da zero
  punirebbe chi ha giocato di più.
- **Il record si legge prima di entrare**, sul tasto della modalità
  infinita, con com'era fatta quella partita («2:05 · 580 mostri ·
  livello 6»).
- **Si tengono le ultime cinque partite** (`ULTIME`): il record da solo
  dice «il te di ieri è più bravo di te», la fila dice che stai salendo.

## Come si dichiara

Nel manifesto `senzaFine: { nome, icona, misura, che, dettagli?, vecchio? }`:

- `misura` è **una chiave di `MISURE`**, non un'unità scritta a mano: «sec»
  e «secondi» farebbero due tabelle.
- `dettagli` mette in parole l'oggetto passato a fine partita (solo il gioco
  sa che i suoi numeri sono mostri e non ondate). **Sono della partita del
  record**: una partita storta non li sovrascrive.

A fine partita `segnaPrimato(chiave, valore, quando, dettagli, sfida)`
scrive subito e torna **cosa dire**; si legge con `primatoDi(chiave, sfida)`.
**Un gioco vecchio senza manifesto** (il castello, `torri`) dichiara
`senzaFine` nella sua riga di `src/data/giochi.js`: `tabellaDeiPrimati`
guarda tutti i `GIOCHI`.

**Il record sta in `campagne[<chiave>].primato`**, accanto a `stelle` (che
è già il primato di ogni tappa): non in `cfg`, che sono le scelte del
bambino, e non in un campo nuovo del profilo.

## Più sfide senza fine

Il castello ne ha quattro, una per terreno, Passo passo due, il sentiero
del coniglio e quello del cane ([../passo-passo/sentiero.md](../passo-passo/sentiero.md)): il manifesto le elenca in
`senzaFine.sfide` — `{ chiave, nome, icona, eredita? }` — con misura, `che`
e `dettagli` scritti una volta in cima come difetti.

- Ogni record sta in `campagne[chiave].primati[<sfida>]`; la chiave della
  sfida è una chiave di salvataggio e non si rinomina.
- **Una sola dice `eredita: true`** e si prende il `primato` di quando la
  sfida era una (la libera del bosco; in Passo passo il sentiero del
  coniglio): la migrazione è una lettura in
  `apriQuaderno`, non una riscrittura.
- `sfideDi` torna sempre un elenco; `primatoDi` e `segnaPrimato` prendono
  la sfida in coda, e chi ne ha una sola non cambia una riga.
- `tabellaDeiPrimati` fa una riga per sfida (`id` = `gioco/sfida`).
- Dove c'è posto per una riga sola (la home) `recordPiuRecente` racconta
  **il record più recente, non il più alto**: quattro terreni non si
  confrontano, e quello di ieri sera è quello che il bambino ha in testa.
- `guastiDelleSfide` controlla le dichiarazioni nel test di ogni gioco.

Il volo infinito degli asteroidi (una sfida sola, che va oltre il catalogo
e riparte sotto il record) è in [`../asteroidi/`](../asteroidi/).

Nei test: `[data-primato="<gioco>"]` o `[data-primato="<gioco>/<sfida>"]`
sulle righe della tabella; a fine partita `[data-primato="nuovo"]` e
`[data-primato="no"]`.
