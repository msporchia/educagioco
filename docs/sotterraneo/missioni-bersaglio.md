# Il bersaglio di una missione

Dove sta e come si vede la cosa che una missione cerca: il mostro col nome
(«sconfiggi») o il forziere d'oro con la cosa dentro («trova»). Le missioni in sé
(l'albero, il diario, i premi) sono in [missioni.md](missioni.md); la freccina che
lo indica in [missioni-freccina.md](missioni-freccina.md); la scala che sale, che
permette di tornare a prenderlo in un piano di sopra, in
[scala-che-sale.md](scala-che-sale.md). Il codice: `postoPer` e
`robaDellaMissione` in `motore/missioni.js`; `BERSAGLIO` in `dati/mondo.js`;
`scena/tela.js`.

Il goblin ladro di una missione si confondeva coi goblin di tutti i giorni ed
era comparso vicino all'entrata (l'utente, giocando, 8 ottobre). Il bersaglio
sta lontano e si vede.

- **Lontano dall'arrivo** (`postoPer` in `motore/missioni.js`): nella stanza più
  lontana **in passi** dal punto d'arrivo (si cammina davvero, porte comprese,
  non in linea d'aria), mai in quella d'arrivo né in quella accanto, e dove si
  può non in quella della scala né del portale. Un piano di quattro stanze può
  averle tutte accanto all'arrivo: allora la più lontana che non sia della
  scala o del portale, e in ultimo qualunque. Il posto è di un caso suo (seme
  del piano e nome della missione): rientrando la cosa è nello stesso posto.
  Il perché: chi gioca deve attraversare il piano per trovarla.
- **Più grande dei suoi simili** (×1,4, `BERSAGLIO.scala` in `dati/mondo.js`),
  **con un'aura e un contorno rosa che pulsano piano** (il rosa della sua
  tacca sulla mappina) al posto del filo d'oro, e **il nome sopra la testa**
  in una targhetta, solo quando è in vista (in piena luce, non nel ricordo). Il
  mostro ha anche la corona di prima; il forziere d'oro ha la cosa che
  galleggia. Tutto in `scena/tela.js` (`auraDelBersaglio`, `contornoDelBersaglio`,
  `etichetta`, tirata fuori dopo l'eroe per non finirgli sotto).
- **La freccina lo indica ancora**: legge il posto della cosa, non dove la
  mette il generatore ([missioni-freccina.md](missioni-freccina.md)).

Nei test: `unita/sotterraneo-scala-su` (le dodici missioni, sei semi ciascuna: nella
stanza più lontana, né d'arrivo né accanto, sempre nello stesso posto, la freccina
sulla cosa), `integrazione/sotterraneo-scale` (col dito: in vista il bersaglio ha il suo
rosa sulla tela, la freccina `[data-rotta][data-verso="qui"]`).
