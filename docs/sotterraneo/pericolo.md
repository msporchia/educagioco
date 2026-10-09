# Il momento del pericolo

In uno scontro le domande venivano una dietro l'altra, e con lo scontro
aperto la 🧪 della barra e lo zaino sono coperti dal velo: se la vita calava
troppo l'unica scelta era rispondere (o scappare). L'utente, 9 ottobre: la
pozione non deve berla il gioco da solo («perché farlo a mano allora?»), ma
quando l'eroe rischia di morire a breve lo scontro deve **fermarsi un
attimo** e lasciare scegliere. Il codice: `motore/pericolo.js` (la soglia),
`Corsa.chiediOFerma` / `continua` / `beviNelPericolo` in `motore/corsa.js`,
`viste/CaselleAbilita.vue` (la riga rossa «Attenzione!» sopra la scelta), `scegliColpo` e `beviNelloScontro` in `Gioco.vue`.
**Dal 9 ottobre non c'è più un menu a parte**: bere e scappare stanno sempre nella scelta dello scontro ([abilita.md](abilita.md)); lo stop resta una riga rossa generica («Attenzione!», mai il nome del mostro) sopra la stessa scelta, e scegliere un colpo vale «continuo».

## Quando scatta

Dopo un colpo del mostro (anche il graffio di una risposta giusta), se
l'eroe è ancora in piedi:

| ragione | quando | frase |
|---|---|---|
| `duro` | altri due colpi pieni (quelli che arrivano sbagliando, `Corsa.danno`) lo farebbero cadere: `vita ≤ 2 × colpo` | «Questo nemico picchia duro.» |
| `poca` | la vita è sotto il 30% del massimo, anche con un mostro tenero | «Le forze ti abbandonano.» |
| `ultimo` | solo alla seconda fermata: un colpo pieno basta a farlo cadere (`vita ≤ colpo`) | «Un altro colpo e cadi.» |

- **Due fermate per scontro al massimo, la seconda solo dopo «continuo».** Il
  primo stop è la soglia larga («stai rischiando»); chi ha scelto di
  continuare ne riceve un secondo solo quando basta un colpo a farlo cadere
  (`ultimo`), non a ogni graffio: se lo stop tornasse a ogni colpo diventerebbe
  un tasto da premere senza leggere, e smetterebbe di dire «pericolo». Bere
  una pozione non riarma niente: la seconda soglia è la stessa.
- **Il colpo pieno, non il graffio.** La soglia conta quello che arriva
  sbagliando, perché è quello che il bambino vede scritto sotto il mostro
  («se sbagli 10»): rispondendo bene un colpo costa la metà, ma lo stop deve
  scattare per chi può ancora sbagliare.
- **Arriva fra una domanda e l'altra.** Succede dentro `rispostaScontro`,
  dopo il colpo: la domanda successiva non viene chiesta (`chiesta` resta
  vuota) finché non si sceglie. Non interrompe mai una domanda già a
  schermo, e non scatta quando il mostro cade con quella risposta (non c'è
  nessun colpo).
- **Non scatta mai da solo per il passare del tempo**: il gioco è fermo in
  uno scontro, e lo stop viene sempre da una risposta.

## Cosa si sceglie

Il riquadro sta al posto della domanda, nella stessa modale (si vede chi
ringhia e com'è andato l'ultimo scambio); il tasto «scappo via» di sempre
sparisce, perché è una delle tre scelte.

- **🧪 bevi** — solo se ha una pozione. Beve quella che berrebbe la casella
  della barra (`pozioneGiusta`: la più piccola che riempie la vita, o la più
  grande), dice sul tasto quanto rende («❤️ +10»), e **si riprende a
  domandare**. Non si beve mai da sola: lo stop non agisce, aspetta.
- **🏃 scappo via** — col graffio di oggi (sul tasto: «ti graffia ❤️ −5»).
  **Se il graffio lo farebbe cadere il tasto non c'è** (`puoScappare`), qui
  come nello scontro: offrirlo sarebbe offrire di svenire.
- **⚔️ continuo** — si torna alla domanda, senza costo.
- **Uno stop con solo «continuo» non compare**: senza niente da bere e
  senza fuga possibile, lo scontro va avanti alla domanda dopo e la
  fermata non si conta.
- **Resta modale**: il velo non si chiude toccandolo, come tutto lo
  scontro. **I tasti sono ciechi per 320 ms** (`CIECA`, [../core/interfaccia.md](../core/interfaccia.md#i-tempi)):
  il dito che ha toccato la risposta lascia un click che atterrerebbe sul
  tasto che compare nello stesso punto, e «bevi» o «scappo» scelti per
  sbaglio costano una pozione o un graffio. Si vedono spenti, poi si accendono.
- **Niente pagamenti**: lo stop non dà e non toglie monete, e una risposta
  sbagliata non paga ([../apprendimento/calibrazione.md](../apprendimento/calibrazione.md)).

## Il banco non si ferma

Il giocatore finto risponde dal motore, senza guardare lo schermo:
`rispondi()` scioglie lo stop da sé (equivale a «continuo») e le misure
restano quelle di prima. Quindi **un bambino che beve allo stop è un po' più
forte del banco** (che beve solo fuori dagli scontri, sotto il 45%): i
numeri di [la-grande-storia.md](la-grande-storia.md) sono il pavimento.
Far bere il banco allo stop non si fa: sposterebbe ogni tabella, e il banco
non ha un bambino che sceglie di scappare.

Nei test: `[data-ringhio]` (il riquadro; `data-perche` `duro|poca|ultimo`,
`data-pronto` dopo i 320 ms ciechi), `.sot-ringhio-titolo`, i tasti
`[data-azione="ringhio-bevi|ringhio-scappa|ringhio-continua"]`.
`unita/sotterraneo-pericolo` (la soglia, una volta per scontro, il secondo
stop, mai sopra una domanda né quando il mostro cade, le tre scelte, il banco)
e `integrazione/sotterraneo-pericolo` (col dito, nella miniera con un eroe
nudo: il mostro forte, lo stop al posto della domanda, il tocco cieco,
«continuo», il secondo stop, «bevi» che alza la vita e consuma una
pozione, «scappo via» che chiude lo scontro).
