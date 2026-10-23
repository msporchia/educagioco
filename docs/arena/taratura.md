# La taratura

Il motore gira in Node, quindi la difficoltà si **misura** (`motore/banco.js`):
un `Pilota` finto che compra, potenzia, ripara e alza muri con una certa
precisione nel calcolo (1 = mai sbagliato, 0.9 = il bambino che ci ragiona,
0.4 = chi tira a indovinare) e un `ritmo`: ogni quanti secondi di partita fa una scelta.
**Il campo sta fermo mentre si calcola** (l'utente: «la velocità nei calcoli viene da sé, che sia la
strategia a vincere»): il ritmo è solo il tempo di guardare il campo e decidere, e il conto non costa
secondi.

Comandi: `node test/esegui.mjs arena` (il motore), `node test/esegui.mjs
misure` (l'equilibrio, dove c'è), `npm run tara:arena -- --duelli` (le truppe a
duello, per la calibrazione di vita e danno: [regole.md](regole.md)).

**Prima i duelli, poi la taratura**: un'unità che vince tutto fa una curva di vittorie a
gradino (il bambino passava dal 91% a meno della quota con un ritocco minimo del nemico),
e la bisezione non trova la quota.

## I tre livelli

La difficoltà è un livello **per bambino** (`profile.campagne.arena.livello`, i tre pulsanti sulla voce della battaglia infinita
nella mappa): **Facile, Medio, Difficile**. **Vale solo per la battaglia infinita** (l'utente: «il resto deve essere blindato a
difficoltà prescelta, altrimenti non ha senso»): le dodici tappe usano sempre il Medio, tarato per la loro rampa, e la sfida in
due non ha un nemico. Stesse truppe, un'altra scheda del nemico (`NEMICO_PER_LIVELLO` in `dati/taratura.js`, `NEMICO` è il
medio); nella battaglia infinita conta la scheda dell'ultima tappa (`trono`) di quel livello. Il nemico non diventa più ricco ma
più bravo: più furbo, più svelto, e dalla furbizia 0,6 usa le mosse del [nemico avanzato](nemico.md).

`npm run tara:arena` cerca, tappa per tappa e livello per livello, per bisezione su una manopola `d`
(0-2) quanto forte deve essere il nemico (fino a `d` = 1 salgono monete e forza fino alla parità col
giocatore, poi solo il pensare e la furbizia). Le promesse sono in `LIVELLI` di `strumenti/tara-arena.mjs`:

| livello | il bambino (90% di conti giusti) vince | chi non sbaglia mai vince al massimo |
|---|---|---|
| facile | 95% → 60% | niente tetto |
| medio | 80% → 30% | 80% → 40% dalla tappa 2 |
| difficile | 70% → 15% | 70% → 20% dalla tappa 3 |

Vale la più dura; anche il rush (+10 punti) ha il suo tetto (se non si riesce a rispettarlo, il log dice
`IL RUSH NON SI FERMA` e quel tetto non conta). Il risultato è in `dati/taratura.js` con una firma
(`motore/firma.js`): se si ritocca una regola, una truppa o una tappa senza ritarare, `unita/arena`
diventa rosso. `-- --livello medio` tara (o, con `--misura`, misura) un livello solo.

I giocatori finti (`PILOTI` in `motore/banco.js`):

| pilota | conti giusti | secondi di partita a scelta | cosa deve fare |
|---|---|---|---|
| misura | 100% | 1,5 | chi gioca bene: il tetto del livello |
| bambino | 90% | 2,5 | la rampa del livello |
| lento | 55% | 3,5 | perdere più del bambino |
| caso | 25% | 3,5 | non vincere quasi mai |
| pigro | 100% | 2,5 | due caserme al livello 2, poi sta a guardare: non deve vincere le tappe alte |
| rush | 100% | 2,5 | solo caserme e potenziamenti, mai miniera |
| economia | 100% | 2,5 | la cripta, poi la miniera al 3 |

`npm run tara:arena -- --misura` gioca tutti contro la taratura scritta; `--draghi` aggiunge chi
costruisce solo draghi; `--ricco <k>` un nemico con monete e forza moltiplicate.

## Misurato il 19 ottobre

L'utente: «mio figlio vince troppo facile, anche solo con i draghi e senza miniere». Prima di toccare
l'IA il giocatore perfetto (`misura`) vinceva l'88-100% in ogni tappa, lava compresa, dove il nemico era già
al massimo: con il campo fermo il bambino vero vale `misura`, non `bambino`, e la manopola `d` non
bastava. I draghi in massa invece perdevano (0% dalle nevi): non erano loro. Dopo il nemico avanzato
(vende una caserma per rifarla meglio, più miniere al sicuro, counter da `BATTE`) e il riequilibrio delle
truppe a parità di monete ([regole.md](regole.md)):

- **facile**: `misura` 100% → 68%, il bambino (90% di conti giusti) 94% → 68%;
- **medio**: `misura` 99% → 48%, il bambino 91% → 40%;
- **difficile**: `misura` 78% → 26%, il bambino 70% → 16%.

**Il rush non è più un buco** (era: vinceva 65-100% e nella palude a nessun `d`). La causa non era il
terreno né i counter: `ripara` rimette il 40% di vita all'edificio messo peggio, muro compreso, e chi
martella il muro lo faceva ricostruire ogni pochi secondi. Il nemico spendeva 702 monete in riparazioni
su sei partite nei primi 120 secondi, contro 70 in potenziamenti (il rush ne mette 298). Oggi il muro si rifà
solo se è crollato e al più ogni 12 secondi (`MURO_OGNI` in `nemico.js`); le altre riparazioni
come prima. Col nemico al massimo il rush nella palude è passato da 100% a 23-33%, e i tre livelli rispettano
tutti i tetti, rush compreso.

- **Chi si ferma perde**: il pigro cala con le tappe.
- **La manopola non sale in fila.** Con più truppe anche il nemico è più forte a parità di `d`: la rampa
  la fa la quota di vittorie, non il numero.
- **Il nemico è tarato per il bambino, non contro chi sbaglia**: sbagliare un conto non paga monete né
  costa il castello, costa una caserma ferma.
- **Provato: il castello al livello 3 per prima cosa.** Quel bambino perdeva contro nemici deboli che il
  pigro batteva sempre (l'utente: «ho 70 monete, non sto facendo niente e sto stravincendo»).

## Il Medio più duro (22 ottobre)

L'utente: «il bambino lamenta che è ancora troppo semplice e vince troppo spesso senza problemi». Le promesse del Medio
erano 90% → 35% per il bambino e il tetto di chi non sbaglia solo dalla tappa 6: le prime cinque tappe restavano
vinte quasi sempre (`misura` 80-99%). Adesso 80% → 30% e il tetto dalla tappa 2 (80% → 40%); misurato: `misura`
80% alla tappa 2, 57% alla 5, 38% all'ultima. Il nemico è lo stesso (stesse regole, stessa IA): salgono solo `d` e
con lui monete, forza e furbizia. Il rush nelle prime tappe resta sopra il tetto (70-90%): la palude non si ferma
senza snaturare il bambino. Se anche così è facile, il passo dopo è il Difficile come livello di base.

Il 23 ottobre, con le riparazioni limitate del nemico (`VERSIONE_IA` 13), le tre rampe sono state ritarate e le
promesse reggono: il nemico ora è più forte a parità di `d`, quindi `d` è sceso (Medio, ultima tappa: 0,96 → 0,82).
`-- --infinita --mono` (una truppa sola, mai miniera, in ogni terreno) è il controllo contro le strade senza
contromossa; [nemico.md](nemico.md).

## L'economia: base bassa, miniera che conta (23 ottobre)

L'utente: «partiamo con troppi soldi forse, se la miniera di base non è utile». Misurato: con le monete di base di prima
(1 ogni 1,2 secondi) chi mette tutto in truppe subito (`rush`) batteva chi fa miniera (`economia`) quasi in ogni tappa, e
la miniera (+70% a livello) non cambiava la partita. Provato: meno monete iniziali (14 → 8) non cambia niente, perché il
nemico parte uguale; `resa` +120% con la base di prima rende la miniera troppo forte (`economia` 100%). **Scelto**: base
`1 / 1.8` al secondo (era 1 / 1.2), miniera +100% della base per livello (`CRESCITA.miniera.resa`), iniziali 14. Le tre
strade si avvicinano (nella palude, Difficile, `rush` 87 → 50% e `misura` 57 → 10%); il `rush` resta il primo e il tetto
del Medio per lui non si rispetta ancora nelle prime tappe. I prezzi non sono cambiati: la partita è un po' più lenta
a monete, quindi le truppe si fanno un po' meno in fretta. Ritarato (`VERSIONE_IA` 13, firma nuova).
