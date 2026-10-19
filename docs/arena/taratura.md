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
| medio | 90% → 35% | 85% → 50% dalla tappa 6 |
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
