# I mostri grossi

In fondo a ogni discesa della storia, e ogni cinque piani nell'abisso, la
chiave della scala ce l'ha un mostro grosso: col suo nome, due caselle per
due, nella stanza della scala. Quando cade lascia di sicuro un pezzo raro o
migliore più il suo pezzo col nome. Richiesta dell'utente dell'8 ottobre
2026, insieme ai livelli ([livelli.md](livelli.md)).

Il codice: `dati/grossi.js` (chi sono, dove stanno, quanto sono grossi),
`motore/livello.js` (`mostroGrosso`: lo mette al posto del guardiano),
`motore/corsa.js` (`cade`: il bottino), `scena/grossi.js` (la figura
disegnata in codice), `scena/tela.js` (`grosso`), `viste/Grosso.vue` (la
figura nello scontro e nella barra in cima).

## Chi sono

| discesa | mostro grosso | disegno | lascia |
|---|---|---|---|
| la cripta dell'altare | Re Ossuto | il re scheletro col mantello e la corona | il Ciondolo di Re Ossuto (difesa, vita) |
| la scalinata antica | Grumo | l'orco con la mazza alzata | la Mazza di Grumo (vita, rigenera) |
| la torre in rovina | Fiammetta | la melma di fuoco | lo Scudo di Fiammetta (difesa, torcia, vita) |
| la grotta della scaletta | Zannaverde | il ragno con otto occhi | l'Anello di Zannaverde (schivata, fortuna) |
| la scala sommersa | Gorgo | la melma d'acqua nera | l'Amuleto di Gorgo (rigenera, vita, pozioni) |
| la botola segreta | Minotto | il bruto con le corna | il Giubbone di Minotto (difesa, vita, rigenera) |
| la miniera abbandonata | Carbonchio | il re scheletro di brace | il Martello di Carbonchio (attacco, fuoco) |

- **Si regge su un mostro del bestiario** (`tipo`: lo scheletro, l'orco, il
  troll, il gigante) con le ossa moltiplicate (`ossa`: da 1,1 a 1,3) e un
  colpo in più (`att`, Re Ossuto no); poi la discesa lo cresce come gli altri
  (`forza`, `spinta`). Re Ossuto è il più tenero: la cripta perdona.
- **I suoi pezzi non hanno famiglia**: li porta chiunque, perché il mostro
  grosso è di tutti e quattro gli eroi. La mazza e il martello sono armi
  nuove senza famiglia (`deiGrossi` in `dati/cose.js`), che non si vendono e
  non si pescano. Provato la mazza a ⚔️ 2 con l'attacco fra le abilità:
  batteva le armi di tutte le classi fino in fondo; a ⚔️ 1 con vita e
  rigenera è una buona arma per la torre e la grotta, poi spada e scettro la
  superano. Il nano la tiene: le sue asce sono a due mani e gli farebbero
  posare lo Scudo di Fiammetta.
- **Lo Scudo di Fiammetta e il Ciondolo di Re Ossuto restano addosso a
  tutti fino in fondo** nella roba attesa: nessuno scudo o gioiello della
  fila li batte sui numeri. Un'arma a due mani che farebbe posare uno scudo
  col nome si giudica sui numeri (`migliora` in `motore/storia.js`), così il
  guardiano non regala uno spadone peggiore di spada e scudo.
- **Sono roba attesa**: li lascia di sicuro, quindi la tabella della storia
  li conta ([la-grande-storia.md](la-grande-storia.md#la-tabella-dellequipaggiamento)).
  Il pezzo raro che lascia insieme no: è pescato a caso.

## Dove sta

- **Nella stanza della scala, al posto del guardiano** (`mostroGrosso`):
  accanto alla scala, sopra o sotto, o ai lati se lì non c'è posto. Non
  tocca il caso del piano: il piano nasce identico, cambia solo chi porta la
  chiave. Se nella stanza non c'è posto diventa grosso il mostro più lontano
  dall'ingresso.
- **Nell'abisso uno ogni cinque piani** (`GROSSO_OGNI`: il 5°, il 10°…), a
  giro (`GIRO_DELL_ABISSO`), più forti perché cresce il piano.
- **Come gli altri mostri dorme finché non si entra nella sua stanza.**

## Come si vede

- **La figura è disegnata in codice** (`scena/grossi.js`): 32×32 pixel, due
  caselle per due, fatta di ovali, rettangoli e linee su una griglia e poi
  contornata di scuro come gli sprite del bestiario. Quattro disegni (il
  bruto, il re scheletro, il ragno, la melma) e sette tavolozze. Sulla tela
  respira (più svelto da sveglio), guarda verso l'eroe, ha l'alone rosso più
  largo, il nome sopra la testa quando è in luce, la chiave, il sonno e la
  barretta come gli altri. Si fa dipingere dopo, quando piace: la scheda
  `strumenti/sprite/sorgenti/sotterraneo/generati/PROMPT-grossi.md`.
- **La sua vita in cima allo schermo** (`[data-grosso]` in `Gioco.vue`): da
  quando si sveglia (si entra nella sua stanza) e mentre lo si combatte, con
  la sua faccia, il nome e la barra rossa che cala a ogni colpo. Nello
  scontro c'è la sua figura al posto dello sprite.
- **Quando cade**: «👑 Re Ossuto è caduto!», e per terra intorno a lui il suo
  pezzo col nome, un pezzo raro o leggendario e, nella storia, il pezzo
  della riga dopo.

## Quanto conta

- **L'esperienza**: tre volte quella della sua specie (`ESP_DEL_CAPO`), che è
  spesso il livello che si prende in una discesa.
- **Le domande**: con la roba e il livello attesi Re Ossuto chiede da tre a
  sei risposte giuste, Grumo e Fiammetta da cinque a otto, Gorgo da otto a
  undici, Carbonchio da undici a sedici (il mago e l'elfa, che picchiano di
  più, stanno in basso). Provato con le ossa fino a 1,9: oltre venti
  risposte, un compito. La domanda rincara come quella di un capo
  (`RINCARO.capo`).

Nei test: `unita/sotterraneo-rarita` (in fondo a ogni discesa il suo mostro
grosso, nella stanza della scala, con la chiave e il nome, più grosso del
suo simile; battuto lascia il suo pezzo e un raro o meglio; nell'abisso ogni
cinque piani; la figura è 32×32 e ogni lettera ha il suo colore),
`unita/sotterraneo-storia` (in fondo alla discesa la chiave ce l'ha il
grosso), `integrazione/sotterraneo-eroe` (col dito: Re Ossuto con la sua
vita in cima e la sua figura nello scontro, battuto la vita in cima se ne
va). La barra in cima `[data-grosso]` con `data-chi` e `data-ossa`; la
figura `[data-figura-grosso]`.
