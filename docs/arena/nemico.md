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

La difficoltà sta nella scheda della tappa (`moneteAlSecondo`, `pensa`, `forza`,
`furbizia`, tarate da `npm run tara:arena`).

## Più bravo, non più ricco

**Le monete e la forza delle truppe del nemico arrivano al massimo a pari con le tue**
(`nemicoDi` in `strumenti/tara-arena.mjs`: `d` = 1 è la parità). Oltre, il nemico diventa
più svelto a pensare e più furbo. Prima la manopola gli dava fino al 25% di monete in più
e truppe più forti: l'unico modo di metterti in difficoltà, perché la scaletta gioca male.
Così però chi partiva dalla miniera veniva travolto, e vinceva sempre chi attaccava
subito (l'utente: «se riesci a renderlo più bravo e non più ricco va bene»).

**La furbizia** (0-1) è quante volte, a ogni giro di pensiero, il nemico ragiona invece di
seguire la scaletta (`testa()` in `nemico.js`). Una probabilità e non una soglia, così la
difficoltà sale piano. Quando ragiona:

- **sceglie la truppa che batte la tua** (`BATTE`, i duelli di [regole.md](regole.md)),
  guardando le tue caserme e le tue truppe già entrate nella sua metà;
- **concentra** i potenziamenti sulla caserma che conviene di più, invece di spalmarli;
- **se sei in casa sua** costruisce o potenzia chi ti batte, e alza il castello;
- **fa economia quando è al sicuro** (la miniera fino al 3 nei primi due minuti e mezzo), e
  **se tu fai economia la fa anche lui**. Provato ad attaccare chi faceva economia, prima
  con una caserma sola e poi con tre: le squadre morivano sotto il castello, che sotto casa
  picchia il triplo, e chi faceva economia vinceva sempre.

Misurato con le stesse monete del giocatore (`npm run tara:arena -- --misura --d 1.5
--furbizia 1` contro `--furbizia 0`): dalla quinta tappa il giocatore perfetto passa da
vincere il 100% al 0-26%, il rush dal 100% allo 0%; chi fa economia vince ancora il 70-80%.

## La bomba del nemico

Come per il giocatore è difensiva: la lancia sulle truppe del giocatore **entrate nella sua
metà**, quando sono abbastanza fitte da valere la pena.

## Se si ritocca

`VERSIONE_IA` in `nemico.js` entra nella firma dell'equilibrio: va alzata a ogni cambio del
modo di giocare, e poi si rilancia `npm run tara:arena`, o `unita/arena` è rosso.
