# La taratura

Il motore gira in Node, quindi la difficoltà si **misura** (`motore/banco.js`):
un `Pilota` finto che compra, potenzia, ripara e alza muri con una certa
precisione nel calcolo (1 = mai sbagliato, 0.75 = il bambino che ci ragiona,
0.4 = chi tira a indovinare) e un `ritmo`: ogni quanti secondi veri riesce a fare
una scelta, che diventano secondi di partita moltiplicati per `CALCOLANDO` (il campo
va a metà velocità mentre si calcola).

Comandi: `node test/esegui.mjs arena` (il motore), `node test/esegui.mjs
misure` (l'equilibrio, dove c'è), `npm run tara:arena -- --duelli` (le truppe a
duello, per la calibrazione di vita e danno: [regole.md](regole.md)).

**Prima i duelli, poi la taratura**: un'unità che vince tutto fa una curva di vittorie a
gradino (il bambino passava dal 91% a meno della quota con un ritocco minimo del nemico),
e la bisezione non trova la quota.

## Cosa promette la campagna

`npm run tara:arena` cerca, tappa per tappa, per bisezione su una manopola `d`
(0 = nemico quasi inerme, 1 = pari al giocatore bravo: monete al secondo, ogni
quanto pensa e forza delle truppe; arriva a 3) quanto forte deve essere il nemico.
Due promesse, e vale la più dura:

- il **bambino** di prova vince almeno la quota della tappa, da **90% nella prima a
  30% nell'ultima**;
- **nella lava** (dalla tappa 10) chi non sbaglia mai e risponde svelto (`misura`) non
  vince più di **80% → 50%**: in cima il nemico è quasi imbattibile e si vince solo
  rispondendo tutto giusto e in fretta (l'utente).

Il risultato è in `dati/taratura.js` con una firma (`motore/firma.js`): se si ritocca
una regola, una truppa o una tappa senza ritarare, `unita/arena` diventa rosso.

I giocatori finti (`PILOTI` in `motore/banco.js`):

| pilota | conti giusti | secondi veri a scelta | cosa deve fare |
|---|---|---|---|
| misura | 100% | 4 | vincere quasi sempre, tranne nella lava |
| bambino | 75% | 6 | la rampa 90% → 30% |
| lento | 55% | 9 | perdere più del bambino |
| caso | 25% | 9 | non vincere quasi mai |
| pigro | 100% | 6 | due caserme al livello 2, poi sta a guardare: non deve vincere le tappe alte |
| rush | 100% | 6 | solo caserme e potenziamenti: deve vincere quanto l'economia |
| economia | 100% | 6 | la cripta, poi la miniera al 3: deve vincere quanto il rush ([regole.md](regole.md)) |

`npm run tara:arena -- --misura` gioca tutti contro la taratura scritta, senza ritararla, e
stampa anche la durata media: verso la fine del tempo si vince ai punti.

Il bambino di prova **fa i conti a mente in fretta**: il gioco li vuole svelti (sono
solo a mente, [calcoli.md](calcoli.md)). Provato il bambino di prima, 10 secondi a
scelta, col campo a metà: non arriva al 90% nemmeno col nemico quasi inerme, perché in
tre minuti (allora la partita durava tanto) non fa abbastanza mosse.

**Il bambino gioca da persona sensata**: prima due caserme, poi le porta al livello 2,
poi castello e miniera. **Provato** il castello al livello 3 per prima cosa: quel
bambino perdeva contro nemici così deboli (0,3-0,4 monete al secondo contro le 0,83
del giocatore, truppe al 70%) che il pigro li batteva sempre (l'utente: «ho 70 monete,
non sto facendo niente e sto stravincendo»).

Ultimo giro misurato (14 ottobre, partita a 5:00, castello che picchia il triplo sotto
casa): il bambino 90% → 29%; `misura` 80-100% ovunque, anche nella lava; il rush 80-100%
ovunque; l'economia 100% nel bosco e nella palude fino alla quarta tappa, poi 39% → 0%;
il pigro 48-95% fino alla quarta, 0% nella lava.

- **L'economia regge solo contro i nemici deboli**: dalla quinta tappa il nemico ha più
  monete del giocatore, e chi parte dalla miniera viene travolto prima che renda. Voce in
  [da-fare.md](da-fare.md).
- **Nella lava la curva ha un gradino**: `misura` passa da vincere quasi sempre a meno
  della metà con un ritocco minimo di `d`, e il bambino con lui. La bisezione si ferma sul
  bordo, e il tetto del bravo nella lava non tiene (95% contro l'80-50% voluto).
- **La manopola non sale in fila.** Con più truppe a disposizione anche il
  nemico è più forte a parità di `d`, quindi una tappa con più truppe ha un `d`
  più basso e un nemico più duro lo stesso: la rampa la fa la quota di vittorie,
  non il numero.
- **Il nemico è tarato per il bambino, non contro chi sbaglia**: sbagliare un conto
  non paga monete né costa il castello, costa tempo e una caserma ferma. Chi tira a
  indovinare perde perché il tempo è poco, non perché è punito.
