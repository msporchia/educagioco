# La cucina col cuoco (in prova)

La stessa cucina di [cucina.md](cucina.md), giocata in un altro modo: invece di
trascinare le cose si cammina. Un cuoco si muove in una stanza con la levetta, un
tasto prende e posa, uno taglia, e il piatto va portato alla consegna. Serve a capire
quale dei due stili si adatta meglio; sta su un ramo suo. Si sceglie in
`#bancarella=cucina` col tasto «Col cuoco» (`&cuoco=1&livello=5` porta dritto alla
quinta). Cucine, ricette, tempi, prezzi e cassa sono gli stessi: cambia solo come si
lavora.

Il motore è `src/motore/bancarella/cuoco.js`, la schermata
`src/components/bancarella/CucinaCuoco.vue`, la scena `src/grafica/cucina3d/cuoco.js`,
con `sala.js` (stanza e banconi) e `omino.js` (il cuoco, nella creta).

## La stanza

Sette celle per sei, banconi tutto intorno e un'isola in mezzo. In fondo la consegna,
sotto il cliente, con i fuochi ai lati; a sinistra le cassette di pasta, carne, uovo,
impasto; a destra sugo, formaggio, pane, insalata; davanti bidone, piatti, tagliere.
Una cucina mostra solo quello che le serve: il resto è bancone libero.

## I comandi

Stanno sotto la stanza, non sopra: il pollice non copre mai il cuoco.

| comando | cosa fa |
|---|---|
| levetta | cammina; contro un bancone si scivola |
| tasto verde | fa quello che c'è scritto: Prendi, Posa, Metti, Cuoci, Inforna, Butta, Servi |
| 🔪 Taglia | un colpo, tenerlo giù vale come batterci sopra; si accende davanti al tagliere |

Il tasto tocca la cella davanti alle mani, mai quella alle spalle, e la cella si
illumina: verde se si può fare, grigia se no. Se non si può, un fumetto dice cosa manca
(«Prima va cotta», «Le mani sono piene»): `decidi` del motore è la sola che lo sa.

I tasti partono al `pointerdown`, mai al `click`: col pollice sulla levetta sono due dita
giù, e il click non parte. «Servi» apre il foglio sotto il dito: il click che resta si
ingoia, se no preme una moneta ([../core/il-dito.md](../core/il-dito.md)).

## Le regole

- **Le mani tengono una cosa**: un ingrediente o un piatto. Ogni bancone ne tiene una.
- **Il piatto si riempie in qualunque ordine**, a differenza del dito, e si dispone da
  solo. Va bene sia l'ingrediente portato al piatto, sia il piatto portato all'ingrediente.
- **Crudo non va sul piatto**: pasta, carne e uovo passano dal fuoco, l'insalata dal
  tagliere (cinque colpi, `TAGLI`, a mani libere).
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

`unita/bancarella-cuoco`, `integrazione/bancarella-cuoco` (tocchi veri, anche a due dita).
Bersagli: `[data-stile]`, `[data-cuoco]`, `[data-leva]`, `[data-usa]`, `[data-taglia]`,
`[data-detto]`.
