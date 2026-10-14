# La taratura

Il motore gira in Node, quindi la difficoltà si **misura** (`motore/banco.js`):
un `Pilota` finto che compra, potenzia, ripara e alza muri con una certa
precisione nel calcolo (1 = mai sbagliato, 0.75 = il bambino che ci ragiona,
0.4 = chi tira a indovinare) e un `ritmo` (ogni quanti secondi di partita riesce
a fare una scelta: il campo va a un quarto di velocità mentre calcola).

Comandi: `node test/esegui.mjs arena` (il motore), `node test/esegui.mjs
misure` (l'equilibrio, dove c'è), `npm run tara:arena -- --duelli` (le truppe a
duello, per la calibrazione di vita e danno: [regole.md](regole.md)).

**Prima i duelli, poi la taratura**: un'unità che vince tutto fa una curva di vittorie a
gradino (il bambino passava dal 91% a meno della quota con un ritocco minimo del nemico),
e la bisezione non trova la quota.

## Cosa promette la campagna

`npm run tara:arena` cerca, tappa per tappa, per bisezione su una manopola `d`
(0 = nemico quasi inerme, 1 = pari al giocatore bravo: monete al secondo, ogni
quanto pensa e forza delle truppe) quanto forte deve essere il nemico perché il
**bambino** di prova vinca la quota della tappa, da **90% nella prima a 45%
nell'ultima** (150 partite per passo, 8 passi). Il risultato è in
`dati/taratura.js` con una firma (`motore/firma.js`): se si ritocca una regola, un
truppa o una tappa senza ritarare, `unita/arena` diventa rosso.

I quattro giocatori finti (`PILOTI` in `motore/banco.js`):

| pilota | conti giusti | pensa | cosa deve fare |
|---|---|---|---|
| misura | 100% | 1,5 s | vincere sempre: un adulto attento non deve perdere |
| bambino | 75% | 2,5 s | la rampa 90% → 60% |
| lento | 55% | 3,5 s | perdere più del bambino, ma vincere le prime tappe |
| caso | 25% | 3,5 s | non vincere quasi mai sulle tappe alte |

Ultimo giro misurato (14 ottobre, col castello sul bordo e le quattro piazzole fisse): il
bambino 93% → 51%, il lento 38% → 15%, chi tira a indovinare 5% → 1%.

- **La manopola non sale in fila.** Con più truppe a disposizione anche il
  nemico è più forte a parità di `d`, quindi una tappa con più truppe ha un `d`
  più basso e un nemico più duro lo stesso: la rampa la fa la quota di vittorie,
  non il numero. Provato vincolarla a salire: dalla sesta tappa in poi restava
  ferma e il bambino perdeva troppo.
- **Chi tira a indovinare vince ancora un quarto delle partite alte.** Non è un
  guasto: sbagliare un conto non paga monete né costa il castello, costa tempo e
  una caserma ferma. Il nemico è tarato per il bambino, non contro chi sbaglia.
- **Provato un tetto per il giocatore bravo** (che non vincesse più dell'85% nell'ultima
  tappa): il bambino scendeva al 20% perché `misura` è quasi perfetto (100% di conti
  giusti, 1,5 s a scelta) e la differenza fra lui e il bambino è enorme. Non funziona:
  l'ultima tappa si rende più dura abbassando il bersaglio del bambino (45%).
- **Un giocatore attento vince sempre** (`misura` 100% ovunque): per un gioco
  per bambini va bene, ma la lava non ha ancora una tappa che metta in difficoltà
  chi sa giocare. Voce in [da-fare.md](da-fare.md).
