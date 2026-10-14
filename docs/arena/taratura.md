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
quanto pensa e forza delle truppe) quanto forte deve essere il nemico perché il
**bambino** di prova vinca la quota della tappa, da **90% nella prima a 45%
nell'ultima** (150 partite per passo, 8 passi). Il risultato è in
`dati/taratura.js` con una firma (`motore/firma.js`): se si ritocca una regola, un
truppa o una tappa senza ritarare, `unita/arena` diventa rosso.

I quattro giocatori finti (`PILOTI` in `motore/banco.js`):

| pilota | conti giusti | secondi veri a scelta | cosa deve fare |
|---|---|---|---|
| misura | 100% | 4 | vincere sempre: un adulto attento non deve perdere |
| bambino | 75% | 6 | la rampa 90% → 45% |
| lento | 55% | 9 | perdere più del bambino |
| caso | 25% | 9 | non vincere quasi mai |

Il bambino di prova **fa i conti a mente in fretta**: il gioco li vuole svelti (sono
solo a mente, [calcoli.md](calcoli.md)). Provato il bambino di prima, 10 secondi a
scelta, col campo a metà: non arriva al 90% nemmeno col nemico quasi inerme, perché in
tre minuti non fa abbastanza mosse per abbattere il castello.

Ultimo giro misurato (14 ottobre, campo a metà velocità mentre si calcola): il bambino
93% → 49%, il lento 13% → 4%, chi tira a indovinare 0%. Chi è lento nel calcolo perde
quasi sempre: è il prezzo della fretta voluta.

- **La manopola non sale in fila.** Con più truppe a disposizione anche il
  nemico è più forte a parità di `d`, quindi una tappa con più truppe ha un `d`
  più basso e un nemico più duro lo stesso: la rampa la fa la quota di vittorie,
  non il numero. Provato vincolarla a salire: dalla sesta tappa in poi restava
  ferma e il bambino perdeva troppo.
- **Il nemico è tarato per il bambino, non contro chi sbaglia**: sbagliare un conto
  non paga monete né costa il castello, costa tempo e una caserma ferma. Chi tira a
  indovinare perde perché il tempo è poco, non perché è punito.
- **Provato un tetto per il giocatore bravo** (che non vincesse più dell'85% nell'ultima
  tappa): il bambino scendeva al 20% perché `misura` è quasi perfetto (100% di conti
  giusti, e più svelto) e la differenza fra lui e il bambino è enorme. Non funziona:
  l'ultima tappa si rende più dura abbassando il bersaglio del bambino (45%).
- **Un giocatore attento vince sempre** (`misura` 100% ovunque): per un gioco
  per bambini va bene, ma la lava non ha ancora una tappa che metta in difficoltà
  chi sa giocare. Voce in [da-fare.md](da-fare.md).
