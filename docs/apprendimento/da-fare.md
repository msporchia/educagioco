# Da fare: quiz, saperi e calibrazione

Solo voci aperte. Quando una si chiude, esce da qui e la regola (se c'è) va
nel file del suo argomento.

## Domande

- **«Non si può sapere» giusta nelle bilance.** Oggi in
  `src/quiz/moduli/bilance.js` (`NON_SI_SA`) è solo un falso — l'errore di
  chi vede l'incognita su tutti e due i piatti — e un bambino può imparare a
  scartarla a occhio. Serve qualche scena in cui sia la risposta buona.
- **«Lo sapevi che…»** — ogni tanto, *fuori* da una domanda, una curiosità
  vera (il pipistrello è l'unico mammifero che vola davvero). Mai
  nell'aiuto dopo un errore: lì si insegna il metodo, e una curiosità
  diventerebbe un fatto da imparare a memoria legato a uno sbaglio. Una
  tabella pronta c'era nel modulo `classi-animali`, tolto
  (`git log -S CURIOSITA`). Rimandata.

## Saperi e livelli

- **Il livello di `geo:rotazione`.** Sta al grado 4 di
  `src/quiz/moduli/geometria.js`, cioè 38 (sette anni), mentre le rotazioni
  sono di quarta (vedi [saperi-per-fascia.md](saperi-per-fascia.md)).
  Difetto di taratura indipendente: in terza è comunque spenta. Ritoccarlo
  fa muovere [livelli-delle-domande.md](livelli-delle-domande.md)
  (`npm run quiz:livelli`).
- **Il commento di `ambienti` in `src/data/saperi.js`** dice «roba di
  seconda e terza», ma i biomi mondiali sono geografia di quarta. Va
  corretta la frase, lasciando il gruppo acceso: la ragione vera è che non
  arriva da scuola (così già dice `tiene` dei piccoli).
- **`geo:angoli` in `prima`.** Classificare gli angoli per nome è di
  quarta, e a sei anni e mezzo vale il 2,1% dei tiri tosti; si spegnerebbe
  solo a sottovoce. Non è stato fatto: col criterio attuale (si spegne solo
  quello che una riga non insegna) forse resta acceso. Da decidere.
- **Due controlli proposti in `test/unita/partenze`, non fatti.** Una `nota`
  (non un rosso) con le voci accese la cui classe più alta ammessa sta più
  di un anno e mezzo sopra l'età della fascia — è l'elenco da rileggere
  quando si aggiunge un modulo; e «spegnere non deve svuotare»: alle età
  delle quattro fasce nessun modulo che ha un grado libero deve perderli
  tutti (`m.gradiLiberi(spenti, regole)`, caricando i moduli dalla cartella
  come fa `unita/saperi`).
- **`perMerito` per tutti i giochi?** Oggi lo dichiara solo il Robot
  ([eta-e-portata.md](eta-e-portata.md)). Nei giochi di scuola la risposta
  non è ovvia: una tappa lì è anche un pezzo di programma che il bambino non
  ha ancora fatto.

## Calibrazione

- **Il ritmo delle domande è stimato, non misurato.** Il tasso di una
  domanda (🪙1 nel sotterraneo, 🪙3 in Survivors) viene da quante domande una tappa chiede e da quanto dura
  a occhio ([calibrazione.md](calibrazione.md#si-paga-subito-e-basta)). Il
  registro delle sessioni sa quanto dura davvero una partita, e l'SRS
  quanto ci mette il bambino a rispondere: messi insieme direbbero le
  monete al minuto vere, gioco per gioco, e se una delle due scelte va
  ritoccata.
- **Il pezzo di terra della fattoria rincara ancora geometrico**
  (`RINCARO = 1.38` in `src/giochi/fattoria/dati/mondo.js`): il decimo pezzo
  costa già 🪙800, più di due ore. Va portato a una curva lineare o
  logaritmica la prossima volta che si tocca l'economia.
