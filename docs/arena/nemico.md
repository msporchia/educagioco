# Il nemico

L'IA sta in `motore/nemico.js`. Gioca con le stesse regole, le stesse monete (la
scheda della tappa ne regola quante al secondo) e la stessa bomba del giocatore, e
non vede niente che a schermo non si veda.

## Perché è fatta così

La prima versione tirava a sorte: ogni pochi secondi sceglieva una mossa a caso con
una probabilità (la miniera il 30% delle volte, il castello il 20%…). Risultato:
**lasciava ferme le monete**, costruiva a casaccio e non reagiva a niente (l'utente: «sembra
poco intelligente, sfrutta al 100% le risorse?»). Adesso:

1. **Una scaletta**, scelta a caso fra tre all'inizio (`assalto`, `economia`, `bastione`):
   una serie di mosse buone in ordine («costruisci un tank, poi un veloce, potenzia
   la base, il castello, la miniera…»). Parlano di *ruoli* (base, tank, veloce, splash,
   volo), e per ogni tappa un ruolo diventa la prima truppa che c'è e il cui edificio è
   ancora libero (un edificio ha una truppa sola): così la stessa
   scaletta vale per il bosco (due truppe) e per la lava (otto). Un passo che non c'è in
   quella tappa si salta. Se non ci sono le monete per il passo si **aspetta**: un ordine
   di costruzione non si rimescola per fare una mossa piccola.
0. **Senza caserme, la cripta**: si parte senza, e la prima mossa è costruirla (la
   rifà anche se gliele abbattono tutte).
2. **L'emergenza viene prima di tutto**: la bomba su un ammasso che sta entrando nella
   sua metà (peso ≥ 600), la riparazione se il muro è crollato o un edificio è sotto il 50%.
3. **Se si sente in svantaggio** (il suo castello sta peggio di quello dell'avversario di
   oltre il 10%, l'avversario ha molte più caserme o gliene ha abbattute di più: il
   castello cade per ultimo, quindi non basta guardare quello) **lascia la scaletta** e rafforza:
   il castello, le riparazioni, le caserme più indietro. È «quando vede che l'avversario
   sta vincendo».
4. **Finita la scaletta spende comunque tutto**: una regola sola, per priorità
   (un edificio nuovo finché ne ha meno di quattro, il castello che non resti indietro,
   la miniera presto, le caserme più indietro). Se la prima scelta è quasi alla portata
   (60% del prezzo) risparmia, se no fa la prima che può permettersi: **mai monete ferme**.
5. Fino a **quattro mosse di fila** per ogni giro di pensiero, se le monete ci sono.

La difficoltà resta nella scheda della tappa (`moneteAlSecondo`, `pensa`, `forza`, tarate
da `npm run tara:arena`): l'IA è sempre la stessa, cambia quanto ha e quanto è veloce.

## La bomba del nemico

Come per il giocatore è difensiva: la lancia sulle truppe del giocatore **entrate nella sua
metà**, quando sono abbastanza fitte da valere la pena.

## Se si ritocca

`VERSIONE_IA` in `nemico.js` entra nella firma dell'equilibrio: va alzata a ogni cambio del
modo di giocare, e poi si rilancia `npm run tara:arena`, o `unita/arena` è rosso.
