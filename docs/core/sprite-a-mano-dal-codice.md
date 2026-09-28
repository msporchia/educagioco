# Sprite disegnati a mano nel codice

Quando un atlante generato (vedi [sprite.md](sprite.md)) non ha un pezzo —
un albero grande una cella, una carota piccola, una tana, una buca — si può
scriverlo come dato invece di ritagliarlo da un foglio: una riga di lettere
per riga di pixel, e una tavolozza che dice cosa vuol dire ogni lettera
(`src/giochi/passo-passo/scena/pixel.js` è l'esempio). Si disegna una volta
sola in un canvas a parte (`pezzo(nome, disegno)`, con cache) e da lì in poi
è uno sprite come gli altri.

**Perché così e non con dei `fillRect` sparsi o un `arc`**: un disegno
scritto in lettere si guarda e si corregge a occhio, e ha la stessa grana
dei pezzi dell'atlante — un pixel è un pixel, niente curve lisce. Una forma
disegnata col canvas (un cerchio, un'ellisse vera) accanto a un pezzo in
pixel art si vede subito che viene da un altro mondo.

La tavolozza condivisa vuole gli stessi colori dell'atlante da cui si parte
(la stessa erba, la stessa acqua): chi cambia un colore lì lo cambia in
tutti i disegni che lo usano.
