# La taratura

Il motore gira in Node, quindi la difficoltà si **misura** (`motore/banco.js`):
un `Pilota` finto che compra, potenzia, ripara e alza muri con una certa
precisione nel calcolo (1 = mai sbagliato, 0.75 = il bambino che ci ragiona,
0.4 = chi tira a indovinare) e un `ritmo` (ogni quanti secondi di partita riesce
a fare una scelta: il campo va a un quarto di velocità mentre calcola).

Comandi: `node test/esegui.mjs arena` (il motore), `node test/esegui.mjs
misure` (l'equilibrio, dove c'è).

*Da scrivere dopo la taratura vera: cosa promette la campagna, le
percentuali e come si rimisura.*
