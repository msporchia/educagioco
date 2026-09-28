# Le regole della fattoria

I principi che reggono tutto il resto: da dove vengono le monete, cosa non
succede mai, e come il gioco dice di no. Da leggere prima di toccare un
prezzo, un premio o un rifiuto.

## Il posto dove si spende

- **Il money pit è uno.** La fattoria ha preso il posto della cameretta
  perché un bambino che può spendere in due posti non sceglie, si
  dimentica dell'altro.
- **Niente si vende: il verso è sempre monete → cose.** Le monete entrano
  solo dagli esercizi degli altri giochi. Un banco che comprasse il grano
  chiuderebbe l'anello (semina gratis, raccogli per 🪙1, vendi per 🪙5) e
  la strada più corta per le monete non passerebbe più da nessuna
  tabellina. Per questo sgomberare il bosco costa e non rende, il carretto
  del vicino scambia roba con roba, e mercato, botteghe, mongolfiera e
  bestie rimesse a posto pagano **esperienza, mai monete**. Il metro (🪙1
  = dieci secondi di esercizio) sta in
  [`../apprendimento/calibrazione.md`](../apprendimento/calibrazione.md).
- **Niente di quello che dà la fattoria si può fare in fretta.** Ogni
  premio in esperienza sta sotto il tempo che costa: `premio ≤ 🪙6·minuti`
  (`guastiDelMercato`, `guastiDellaMongolfiera`).

## Quello che non succede mai

- **Niente marcisce.** Un campo maturo resta maturo, una macchina che ha
  finito aspetta, un cliente aspetta. Un raccolto che scade renderebbe
  dovere il premio degli esercizi, e il dovere si smette. È la stessa
  scelta del cane che ha fame ma non muore.
  - a **zero monete** non si raccoglie, ma il campo resta pronto;
  - con lo **scomparto pieno** non si raccoglie e non si paga: il grano
    resta nel campo, e il foglio porta il tasto che risolve;
  - quello che sta crescendo **non si mette via**: nel baule non c'è posto
    per un grano a metà.
- **Niente si perde.** Quello che si mette via va nel baule e si ripiazza
  gratis quante volte si vuole. Un addobbo comprato non si consuma. Una
  voce ritirata dal negozio (gli addobbi sospesi) resta a chi l'ha già.
- **Il livello non scende mai**, nemmeno mettendo via quello che si è
  comprato.
- **Niente spawn casuale di animali**: non sta insieme al fatto che gli
  animali restano dove li metti.

## Quanto costa muovere

- **Spostare costa una monetina** (`COSTO_SPOSTARE` in `dati/mondo.js`),
  così la fattoria non diventa un tavolino dove si sposta la stessa
  panchina per un pomeriggio. **Rimetterla esattamente dov'era è gratis**:
  cambiare idea a metà gesto non è un errore.
- **Mettere via costa la stessa monetina** (`mettiVia`), e il tasto 📦 lo
  dice prima. Gratis, «📦 e poi rimetti giù dal baule» era uno spostamento
  a costo zero, cioè la monetina la pagava solo chi non aveva trovato la
  scorciatoia. Il gesto intero resta uno: togliere 1, riposare dal baule 0.
- **Spostare una bestia è gratis** (`spostaBestia`): dopo un minuto è già
  da un'altra parte per conto suo, e far pagare uno spostamento che
  l'animale disfa da sé sarebbe una beffa. Se un giorno la si vuole a
  pagamento è una riga.

## Come si dice di no

- **Un «non si può» porta con sé cosa fare adesso**, e possibilmente il
  tasto per farlo. «Non hai abbastanza mangime» è un vicolo cieco; «ti
  servono 3 🌾: hai un campo libero, seminaci del grano» è una partita che
  continua. Un bambino di sei anni davanti a un no non ricostruisce una
  catena a ritroso: chiude il gioco. La regola sta in `motore/consiglio.js`
  e risale la catena da sola (vedi [catena.md](catena.md)).
- **L'ordine delle risposte è l'ordine in cui sono utili**: prima quello
  che si fa adesso e gratis, poi quello che c'è solo da aspettare, poi la
  spesa. Anche quando manca posto: usare quello che si ha viene prima di
  ingrandire.
- **Il tasto dice dove porta** («Portami lì», «Apri il baule»,
  «Ingrandisci · 🪙40»), e il baule aperto da un consiglio si apre **sulla
  voce giusta**, metà e linguetta comprese, con la cornice accesa e la
  voce dentro lo scaffale visibile. Il carretto del vicino aperto da un
  consiglio si apre già sulla merce giusta.
- **Un rifiuto nomina la ragione vera.** Provato: il silo messo via non
  tornava sul prato («ne hai già uno» contava anche il baule) e il
  cartello diceva «lì non ci sta» — si finiva a provare tutte le celle.
  Un rifiuto che nomina la ragione sbagliata manda a cercare la soluzione
  dove non c'è. Il motore rifiuta con `motivo` (`'non-sbloccato'`,
  `'ne-hai-gia'`, `'non-ci-sta'`, `'poche-monete'`, `'sospeso'`).
- **Nessuna ricetta prima dei suoi ingredienti.** Un tasto spento per
  cinque ore è indistinguibile da una cosa rotta, e chi lo prova smette di
  fidarsi anche degli altri. Una ricetta dichiara quando compare (`liv`,
  di ripiego il livello della sua macchina) e `guastiDegliSblocchi()` in
  `dati/livelli.js` è rosso se arriva prima di quello che le serve.
- **Quello che non è ancora arrivato non sta nel baule**, sta nella pagina
  dei livelli: una voce spenta in un negozio è un tasto rotto, la stessa
  voce sotto «al livello 4 arriva» è una cosa da desiderare. Vale anche per
  il silo e il mercato: mostrano e chiedono solo quello che è **ottenibile
  adesso**.

## Si scopre toccando

- **Il `?` della fattoria spiega le prime mosse e i primi concetti** (più
  una riga sul mercato), non botteghe, fila e mongolfiera: il gioco le dà
  un po' per volta, e il resto si scopre toccando.
- **Le novità della fattoria vanno nel changelog dei bambini**
  (`guide/novita-bambini.js`), non nella posta dei grandi: una nota
  obbliga un grande a leggerla, e qui non c'è niente che debba fare.

## Non si spegne a metà

Provato: una variante (`fattoria:coltivazione`) toglieva i campi e
lasciava l'arredamento. Da quando la fattoria è la catena, spegnerla
lasciava un prato con dei mobili. Chi non la vuole spegne **il gioco**
(`settings.giochi`), come per tutti gli altri.
