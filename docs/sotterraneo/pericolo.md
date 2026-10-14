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

Quando tocca all'eroe, sulla **somma dei colpi che arriveranno prima del suo prossimo turno** (la fila li sa:
[scontro.md](scontro.md#lo-stop-del-pericolo)), se è ancora in piedi:

| ragione | quando | frase |
|---|---|---|
| `duro` | altri due giri di colpi lo farebbero cadere: `vita ≤ 2 × colpi in arrivo` (`Corsa.colpiInArrivo`) | «Questo nemico picchia duro.» |
| `poca` | la vita è sotto il 30% del massimo, anche con un mostro tenero | «Le forze ti abbandonano.» |
| `ultimo` | solo alla seconda fermata: un giro di colpi basta a farlo cadere (`vita ≤ colpi in arrivo`) | «Un altro colpo e cadi.» |

- **Due fermate per scontro al massimo, la seconda solo dopo «continuo».** Il
  primo stop è la soglia larga («stai rischiando»); chi ha scelto di
  continuare ne riceve un secondo solo quando basta un colpo a farlo cadere
  (`ultimo`), non a ogni turno: se lo stop tornasse a ogni colpo diventerebbe
  un tasto da premere senza leggere, e smetterebbe di dire «pericolo». Bere
  una pozione non riarma niente: la seconda soglia è la stessa.
- **I colpi veri, non una stima.** La soglia conta quello che arriva davvero, con gli effetti (`botta`): è il «ti colpisce 3»
  scritto sotto ogni mostro, sommato per i mostri che agiscono prima del prossimo turno. Non dipende dalla risposta.
- **Arriva fra una domanda e l'altra.** Succede all'inizio del turno dell'eroe, anche il primo (chi entra malconcio può bere
  subito): la domanda non viene chiesta (`chiesta` resta vuota) finché non si sceglie. Non interrompe mai una domanda già a
  schermo, e non scatta quando l'ultimo mostro cade.
- **Non scatta mai da solo per il passare del tempo**: il gioco è fermo in
  uno scontro, e lo stop viene sempre da una risposta.

## Cosa si sceglie

Il riquadro sta al posto della domanda, nella stessa modale, sotto il palco coi mostri; il tasto «scappo via» di sempre
sparisce, perché è una delle tre scelte. Compare a racconto del turno finito ([scontro-interfaccia.md](scontro-interfaccia.md#il-racconto-di-un-turno)).

- **🧪 bevi** — solo se ha una pozione. Con un solo stadio di cura beve quella e dice sul tasto quanto rende; con più stadi apre la
  scelta di quale ([roba.md](roba.md#le-pozioni)). **Costa il turno**: i mostri colpiscono, poi si riprende a
  domandare. Non si beve mai da sola: lo stop non agisce, aspetta.
- **🏃 scappo via** — con il colpo del mostro più forte (sul tasto: «ti costa 5 di vita»).
  **Se quel colpo lo farebbe cadere il tasto non c'è** (`puoScappare`), qui
  come nello scontro: offrirlo sarebbe offrire di svenire.
- **⚔️ continuo** — si torna alla domanda, senza costo.
- **Uno stop con solo «continuo» non compare**: senza niente da bere e
  senza fuga possibile, lo scontro va avanti alla domanda dopo e la
  fermata non si conta.
- **Resta modale**: il velo non si chiude toccandolo, come tutto lo
  scontro. **I tasti sono ciechi per 320 ms** (`CIECA`, [../core/interfaccia.md](../core/interfaccia.md#i-tempi)):
  il dito che ha toccato la risposta lascia un click che atterrerebbe sul
  tasto che compare nello stesso punto, e «bevi» o «scappo» scelti per
  sbaglio costano una pozione o un colpo. Si vedono spenti, poi si accendono.
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
`data-pronto` di `[data-caselle-abilita]` dopo i 320 ms ciechi), i tasti della stessa scelta
`[data-azione="bevi-scontro|scappa"]` e `[data-azione="attacco"]` (che vale «continuo»).
`unita/sotterraneo-pericolo` (la soglia, una volta per scontro, il secondo
stop, mai sopra una domanda né quando il mostro cade, le tre scelte, il banco)
e `integrazione/sotterraneo-pericolo` (col dito, nella scalinata con un mago
e cinque mostri addosso, `#sotterraneo=branco&mostri=5`: lo stop già al primo
turno, al posto della domanda, il tocco cieco, «continuo», il secondo stop dopo
i colpi raccontati, «bevi» che consuma una pozione e costa il turno, «scappo via»
che chiude lo scontro col suo costo fisso).
