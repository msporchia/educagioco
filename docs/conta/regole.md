# Le regole

## La campagna

Una tappa è lo stesso motore con altri numeri e un altro vestito (un
mondo di `dati/mondi.js`); due tappe di fila non portano mai lo stesso
mondo. `min`/`max` sono l'intervallo delle quantità che il motore pesca
per costruire ogni domanda: rigiocata, una tappa non fa mai la stessa
fila.

`alterna` è l'eccezione alla regola «una tappa, un verbo»: gli altri
verbi si danno il cambio, uno sì e uno no. Serve dove una domanda sola,
ripetuta, si consuma — l'inclusione di classe è il caso che l'ha resa
necessaria, perché ha sempre la stessa risposta («più animali»): messa
accanto al confronto fra due specie diverse, ogni domanda va guardata
davvero invece di essere imparata come la posizione di un tasto.

`premio` sale con lo scalino, non con la singola tappa: è lo scalino a
dire quanto la tappa è impegnativa. È il prezzo **di una risposta
giusta**, pagato nel momento in cui si risponde (🪙1 contare fino a
cinque, 🪙4 sommare due ceste): a fine tappa il cartello somma, e non
arriva niente di più — la regola di tutti i giochi, che Conta seguiva già
([../apprendimento/calibrazione.md](../apprendimento/calibrazione.md)).

## I mondi

Un mondo è un posto più le sue specie (`{ chiave, emoji, uno, tanti,
genere, categoria }`). `genere` serve alla concordanza italiana («quante
capre», non «quanti capre») — letta ad alta voce da un genitore, e domani
sarà la voce incisa. `categoria` (`animali`/`cose`) rende possibili le
tappe sugli insiemi: contare «gli animali in tutto» ha senso solo se
nella scena c'è anche qualcosa che non lo è. Un mondo che deve ospitare
quelle tappe vuole almeno due specie animali e due di cose
(`guastiDellaCampagna` lo controlla). Il mercato non ha bestie apposta: è
il vestito delle tappe che non parlano di animali (`piuUno`, `unisci`).

## I verbi

Un verbo è un modo di chiedere «quanti?»; `modo` decide quale riga di
bottoni mostra la vista (cifre, gettoni da portare, due recinti,
inclusione), `richiede` quante specie per categoria il mondo deve avere.
La consegna è sempre icone (`❓ 🦊`) più la stessa frase scritta piccola
per chi legge — non c'è ancora una voce incisa in italiano.

Il conteggio delle domande, con l'anti-ripetizione e i casi per verbo, è
in [domande.md](domande.md).

## Lasciare a metà

Si esce con ← (o la pagina sparisce) anche a tappa aperta, e rientrando la
mappa offre in cima «torno da dove ero». La regola comune è in
[../core/ripresa.md](../core/ripresa.md); qui quello che è di Conta
(`motore/sosta.js`, `profile.campagne.conta.sosta`).

- **Si scrive**: la tappa (per chiave), le giuste fatte, gli errori (sono
  le stelle), le monete già prese (`chiesto`/`dato`, per il cartello del
  salvadanaio), la serie di fila e **la domanda aperta com'è**, gettoni e
  posti compresi. Rifarla a caso sarebbe una mossa: può uscire più facile.
- **La specie si scrive per chiave** e si rivede dal mondo; una specie o un
  verbo che non ci sono più, una risposta giusta fuori dalle opzioni, un
  «porta» coi conti che non tornano: il salvataggio si butta e la tappa
  ricomincia.
- **Si perde** quello che il bambino stava toccando (i gettoni già contati
  di un «portamene»), il «conta insieme» dopo uno sbaglio e l'animazione di
  «uno in più» e degli «stessi»: si rivedono dall'inizio, e non danno
  niente a chi esce.
- **Senza orologio non c'è pausa**: la tappa ripresa nasce com'era.
- **Si salva** a ogni risposta (giusta o sbagliata), col ←, su
  `visibilitychange`/`pagehide` e prima di smontare. Una tappa finita toglie
  la sosta; cominciarne una nuova la butta, dopo aver chiesto.
- Le monete non si ripagano: sono già nel conto a ogni giusta (`incassa`).

Nei test: `unita/conta-sosta` (ogni tappa a metà torna la stessa, quello che
non torna non si legge), `integrazione/conta-sosta` (←, rientro, stelle,
ricarica della pagina, l'avviso della tappa nuova). Bersagli comuni:
`[data-ripresa]`, `[data-chiede]`, `[data-azione=…]`.
