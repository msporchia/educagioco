# La cucina col cuoco (in prova)

La stessa cucina di [cucina.md](cucina.md), giocata in un altro modo: invece di
trascinare le cose si cammina. Si tocca un posto della stanza, il cuoco ci va e fa
quello che lì è ovvio; il piatto va portato alla consegna. Serve a capire quale dei due
stili si adatta meglio; sta su un ramo suo. Si sceglie in `#bancarella=cucina` col tasto
«Col cuoco» (`&cuoco=1&livello=5` porta dritto alla quinta). Cucine, ricette, tempi,
prezzi e cassa sono gli stessi: cambia solo come si lavora.

Il motore è `src/motore/bancarella/cuoco.js`, la schermata
`src/components/bancarella/CucinaCuoco.vue`, la scena `src/grafica/cucina3d/cuoco.js`,
con `sala.js` (stanza e banconi) e `omino.js` (il cuoco, nella creta).

## La stanza

Sette celle per sette, banconi tutto intorno e un'isola in mezzo. In fondo la consegna,
sotto il cliente, con i fuochi ai lati; a sinistra le cassette di pasta, carne, uovo,
impasto; a destra sugo, formaggio, pane, insalata; davanti bidone, piatti, tagliere.
Una cucina mostra solo quello che le serve: il resto è bancone libero.

## Si tocca dove si vuole andare

Niente levetta né tasti: provati, erano un di più. Il tocco cade su un posto (i banconi
sono scatole, quelle alte si toccano anche in alto) o sul pavimento. Il cuoco gira
attorno ai banconi (`via`, la strada più corta di casella in casella) e arrivato fa la
mossa di `decidi`:

| tocchi | con le mani vuote | con qualcosa in mano |
|---|---|---|
| una cassetta | prende | col piatto: se è pronta, ce la mette; con un'altra cosa: le unisce |
| la pila dei piatti | prende un piatto | un piatto vuoto: lo rimette |
| un bancone libero | | posa |
| un bancone con un piatto | prende il piatto | ci deposita quello che ha in mano |
| un bancone con una cosa | prende | le unisce, e il piatto resta lì |
| il tagliere | riprende a tagliare; tagliato, prende | posa insalata o formaggio e taglia; col piatto o con un'altra cosa unisce il tagliato |
| un fuoco | prende quello che è pronto | ci mette il crudo; col piatto o con un'altra cosa unisce quello che è pronto |
| il forno | prende la pizza | inforna la pizza condita |
| il bidone | | butta |
| la consegna | | serve |

Se non si può, un fumetto dice cosa manca («Prima si cuoce», «Prima si taglia»).

**I tocchi si mettono in fila** (`fila`, al massimo sei): pasta e poi pentola si toccano
di seguito, e il cuoco li fa uno dopo l'altro. Ogni posto in fila ha il suo riquadro
verde. Il pavimento butta la fila e va lì.

Il tocco vale al `pointerdown`. Il foglio del resto può aprirsi sotto il dito: il click
che resta si ingoia, se no preme una moneta ([../core/il-dito.md](../core/il-dito.md)).

## Le regole

- **Le mani tengono una cosa**: un ingrediente o un piatto. Ogni bancone ne tiene una.
- **Il piatto si riempie in qualunque ordine**, a differenza del dito, e si dispone da
  solo. Va bene sia l'ingrediente portato al piatto, sia il piatto portato all'ingrediente.
- **Due cose pronte della stessa ricetta si uniscono da sole**: con l'impasto in mano si
  tocca il sugo, e il piatto ce lo mette il cuoco (`unisci`). La pila serve a chi vuole
  cominciare dal piatto.
- **Crudo non va sul piatto**: pasta, carne e uovo passano dal fuoco, insalata e formaggio
  dal tagliere (il formaggio solo qui, col dito no: per questo la prima cucina ha il tagliere): un tocco e il cuoco taglia da sé fino alla fine, un secondo e mezzo (`TAGLI`,
  `COLPO`). Intanto la fila aspetta; il pavimento lo porta via, e un tocco lo fa riprendere.
- **Il pane è già tagliato**: nella cassetta c'è il panino aperto, la pagnotta intera
  chiederebbe il tagliere. In mano la roba è nuda, senza tavola né carta, se no sembra un piatto.
- **La pizza entra in forno col piatto** ed esce pronta, a mani libere.
- **Il bruciato si prende a mani libere** e va nel bidone. Anche un piatto ci può andare.
- **La consegna vuole il piatto del primo cliente**: quello sbagliato costa due secondi e
  resta in mano.

Il foglio del resto e la fretta sono quelli di [cucina.md](cucina.md): col foglio aperto
il fuoco è fermo, nell'ultima no; con la ✕ si torna a camminare.

## La scena

Camera fissa, la stanza intera dentro. Il cuoco ha un'ombra finta e le ombre vere si
rifanno solo se cambia cosa c'è sui banchi: camminare non costa una mappa d'ombre. I
banconi sono tre geometrie unite. Il cappello è basso perché la telecamera sta in alto.

## Nei test

`unita/bancarella-cuoco`, `integrazione/bancarella-cuoco` (tocchi veri).
`window.__cucina3d.dove('3,0')` dice dove sta sullo schermo una cella o il pavimento.
Bersagli: `[data-stile]`, `[data-cuoco]`, `[data-tela]`, `[data-detto]`.
