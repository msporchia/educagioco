# La partita lasciata a metà

Si esce con ← anche a metà di una tappa o di un volo, e rientrando la mappa
offre in cima «torno da dove ero». La regola comune è in
[../core/ripresa.md](../core/ripresa.md); qui quello che è degli asteroidi
(`src/motore/asteroidi/sosta.js`, la schermata è `src/views/MathGame.vue`).

## Cosa si salva

- **Dove si era**: la tappa per chiave (`p3` pianeta, `m5` stazione, `volo`),
  non per posizione nella fila, che si sposta con la scaletta.
- **Il conto**: vite, livello (e la partenza da cui è salito), punti, serie e
  filotto più lungo, colpi giusti verso il bersaglio e «mirate», sbagliati.
- **Quello che si è guadagnato**: i gettoni in tasca e quale è uscito per
  ultimo (l'alternanza), le domande già fatte (il boss viene ogni otto) e le
  monete già prese (`borsa('mate', …)` riparte da lì).
- **La domanda aperta**, com'è: gli stessi numeri e lo stesso verso (anche un
  conto a mente o una grande girata, con tutti i campi), il boss e l'assaggio,
  il gelo già speso e quanti falsi erano già tolti.

## Cosa si perde, e perché va bene

- **I sassi in volo non si salvano**: il campo riprende vuoto e dietro il
  velo della pausa (`metti({ auto: true })`), e rinasce dalla domanda aperta
  con falsi nuovi (i falsi si rifanno dal codice, a caso, come a ogni ondata).
- **Uscire non salva da un campo pieno, né regala tempo.** Si scrive di quanto
  era scesa la strada del sasso giusto (`quota`, da 0 a 1 dell'altezza del
  cielo) e da quanto era raggiungibile (`ms`, il cronometro dell'SRS): rientrando
  tutto il cielo scende finché il sasso giusto è alla stessa quota, e i falsi
  già tolti (col mirino o toccati) restano tolti. Ripartire con «l'ondata appena
  entrata» avrebbe dato di nuovo dieci secondi a chi era a un dito dal fondo.
- **La memoria corta della scelta** (le domande che hanno riposato dopo tre
  giuste, la miscela della quota, il trucco alla seconda volta) non si salva:
  vive in `store/srs.js` e `store/calcolo.js` e non ha un formato; rientrando
  si pesca dal pool come a inizio partita. Non dà niente a chi esce.

## Quando si scrive

Col ← (`allaMappa`), a pagina nascosta, su `pagehide` e prima di smontare la
schermata; e a ogni domanda nuova, a ogni vita persa, a ogni gettone speso,
perché un guasto brusco non ridia quello che si è speso o perso. Senza una
risposta data (giusta o sbagliata) non si scrive: una tappa appena aperta e
lasciata non lascia la carta.

## Il record del volo

Il record si scrive **quando il volo finisce davvero**, o quando si sceglie
«lascio perdere» sulla carta, o quando una tappa nuova butta la sosta: lo scrive
`scorda()` dai punti della sosta (`recordDi`, che legge anche un salvataggio
di un'altra versione). Prima uscendo col ← il volo non scriveva niente
(`segnaPrimato` stava solo in `finePartita`): un volo da 400 punti lasciato lì
perdeva il record. Chi riprende e poi finisce scrive il suo risultato di fine,
e la sosta si toglie senza scrivere il vecchio.

## Il resto

- **A partita finita** (tappa superata, volo perso) la sosta si toglie; una
  tappa o un volo nuovo la butta, dopo aver chiesto (`[data-chiede]`).
- **Un salvataggio che non torna** (un campo fuori misura, una tappa sparita,
  un volo non ancora aperto) si butta e la tappa ricomincia. Una domanda aperta
  che non torna non butta la partita: ne nasce una nuova.
- Il velo della pausa copre anche il ←: per uscire si riprende e si preme ←.

Nei test: `unita/asteroidi-sosta` (la stessa partita dopo JSON, il conto a
mente nella domanda aperta, quello che non si legge, il record), e
`integrazione/asteroidi-sosta` (←, rientro, ricarica della pagina, una tappa
nuova che chiede, il record del volo a metà). I bersagli sono quelli comuni di
[../core/ripresa.md](../core/ripresa.md), più `[data-volo]` e
`window.__mate`.
