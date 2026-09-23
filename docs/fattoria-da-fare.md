# 🚜 La fattoria — cosa manca al secondo albero

Il progetto è [`fattoria-albero.md`](fattoria-albero.md) §8. Questa è
**la lista da spuntare**: quello che il secondo albero non ha ancora, e
quello che è stato deciso di *non* fare, con il perché. Si aggiorna
quando una riga si chiude, e una riga chiusa si cancella: la storia sta
in git e nel progetto.

Aggiornata il 23 settembre 2026.

## Prima di pubblicare

- [ ] **Rivedere e committare** il branch `fattoria-hayday` (`/review`).
- [ ] **La suite intera nel browser** — `npm run test:tutto` — prima del
      push. Finora sono girati i test della fattoria e dell'albero.
- [ ] **La prova col dito su un telefono vero** delle tre schermate
      nuove: la fila di una macchina, una bottega, la mongolfiera.
      In Chrome si aprono coi tocchi simulati; col dito vero non le ha
      ancora provate nessuno.
- [ ] **Un salvataggio vero**: aprire la build con una **copia** del
      profilo di casa. I test dicono che una macchina che lavorava
      diventa una fila da uno e che botteghe e mongolfiera nascono vuote;
      un profilo vero dice il resto.

## Sprite

Finché manca il suo disegno, una voce ne usa uno preso in prestito e
dichiara in `aspetta` quello vero: il gioco è intero anche senza, e
`guastiDelCatalogo` / `guastiDelleColture` diventano rossi il giorno
che il pezzo arriva e la riga non l'ha preso. I prompt stanno in
[`PROMPT-secondo-albero.md`](../strumenti/sprite/sorgenti/fattoria/generati/PROMPT-secondo-albero.md).

- [ ] **`merci_4.png`** — le ventidue merci che mancano, un foglio solo
      6×4: maglione, maglione alla lavanda, tintura, sapone, sacchetto,
      sciarpa, berretto, crostata, salsa, conserva, marmellata,
      caramelle, frullato, biscotti, pizza, lasagne, patatine, fritto,
      pesce, arancini, sushi, maki.
- [ ] **`edifici_5.png`** — la friggitoria, i tre ritratti della
      peschiera e le otto decorazioni della fiera (la sorpresa della
      mongolfiera).

Fatti: `edifici_4` (mongolfiera, piazzola, gelateria, mensa), `merci_3`
(pane, torta, zucchero, succo, gelato, pasta), `campi_3` (barbabietola,
lavanda, riso).

## Da provare giocando

- [ ] **Il ritmo dei livelli.** Il premio paga i gesti e non le monete,
      con `PER_GESTO = 2`: al banco un raccolto rende in media ⭐6 contro
      i 7 di prima, e botteghe e mongolfiera riportano la media a quella
      di prima (§8.2). È un conto sulle tabelle — `unita/mercato` tiene
      fermo il tetto a ⭐6,8 — non una partita: la fila nelle macchine
      fa produrre di più a chi gioca, e quanto non l'ha misurato
      nessuno. Se la roba nuova arriva troppo in fretta, la leva è
      `PER_GESTO`.
- [ ] **La fila**: tre posti bastano per l'autonomia che si voleva, o
      servono a tutti gli ingrandimenti subito?

## Deciso di non fare

- **Nessun tappo sui livelli** («per salire devi aver provato le ricette
  nuove»). Un bambino che accumula monete e le spende tutte insieme
  salta avanti di parecchi livelli: è una scelta sua, e da lì si
  arrangia. Ci si aspetta che usi quello che ha; un vincolo in più è una
  complicazione che non vale.

- **Il `?` della fattoria non spiega botteghe, fila e mongolfiera.** Il
  gioco le dà un po' per volta, e il `?` spiega le prime mosse e i primi
  concetti: il resto si scopre toccando. (Gli è stata aggiunta una
  riga sola: il mercato, che arriva al 4.)
- **Il consiglio non sa niente di botteghe e mongolfiera**, per lo
  stesso motivo: insegna la catena, non tutti i posti dove portarla.
- **Nessuna nota nella posta dei grandi** per il secondo albero: una
  nota obbliga un grande a leggerla, e il posto giusto è il changelog,
  che è in preparazione.
- **La mongolfiera non chiede mangime** (`mangime: true` in
  `dati/coltivazioni.js`): solo prodotti finiti, come la nave di Hay
  Day. Il banco sì, perché lì li vuole la veterinaria.
