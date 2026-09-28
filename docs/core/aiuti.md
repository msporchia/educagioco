# La scala del 💡

Il 💡 del Generale, di Passo passo e del costruttore: una scala sola, un
tasto solo, ogni tocco scende di un gradino. Il pezzo comune è
`src/giochi/aiuti.js` (puro, `test/unita/aiuti`): sa quanto costa un
gradino, non cosa fa.

**Si paga in monete**, non con la stella «da solo»: una stella è un prezzo
che un bambino non sente, e il 💡 diventava il modo di finire un livello
senza pensarci — un livello svelato è bruciato.

- **Due gradini gratis che non dicono la risposta** (`ragiona`): cosa
  chiede il livello e cosa lo rende difficile, poi la domanda giusta da
  farsi («visto che il livello chiede…»).
- **Poi gli indizi a 🪙10** (`PREZZO_INDIZIO`).
- **Poi i gradini che scrivono nel programma a 🪙50 · 100 · 200**
  (`PREZZI_FINALI`). Il prezzo lo decide la posizione: l'ultimo, la
  soluzione intera, costa sempre 200. La scala non scende mai
  (`guastiDellaScala`).
- **Il prezzo si dice prima**, sul tasto, e **senza monete non si dà
  niente**: niente credito, niente sconto, se no conviene spendere tutto
  altrove e poi farsi svelare.
- **Dai 50 in su ci vuole un secondo tocco** (`CONFERMA_DA`).
- **Quello che si è pagato resta**: nel Generale e nel costruttore i
  gradini scesi stanno nel profilo (`gen.aiuti`, `campagne[k].aiuti`, via
  `segnaAiutiPresi`) e un pezzo di programma si rimette gratis. In Passo
  passo la scala riparte a ogni ingresso, perché ogni gradino guarda la
  fila di adesso.
- **La stella «da solo» la toglie solo la soluzione intera**: è un fatto,
  non un prezzo.
- **I gradini che scrivono non si scrivono a mano**: escono dalla soluzione
  che il banco gioca (`scalaDi` di ogni gioco). `unita/aiuti` pretende che
  la soluzione svelata vinca e che un gradino più caro non tolga niente di
  quello che uno più economico aveva dato.

Quanto vale una moneta, e perché la soluzione costa più di quanto renda un
livello: [calibrazione](../apprendimento/calibrazione.md).
