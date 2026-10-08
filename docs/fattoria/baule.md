# Il baule

Dove si compra e si posa. Il resto dei gesti sta in
[come-si-tocca.md](come-si-tocca.md); il codice è `viste/Roba.vue`,
`viste/Provino.vue` e, in `Gioco.vue`, `apriIlBaule`.

## Le metà e lo scaffale

- **Tre metà, scelte prima di entrare**: 🌾 *La fattoria* (quello che fa
  qualcosa), 🌸 *Decorazioni* (quello che sta lì), 🐕 *Animali*. Sono tre
  tasti tondi fuori dal baule, accanto al gettone del livello, che lo
  aprono già dalla parte giusta; dentro restano come linguette. Compaiono
  solo le metà che hanno qualcosa: al primo livello c'è solo 🌾. Provato
  un 📦 solo con la scelta dentro: due gesti, e un pacco chiuso non fa
  venire in mente né una panchina né un cane.
- **Sotto «la fattoria» la linguetta è una sola, e non si mostra**: campo,
  mulino, silos, macchine e recinti sono i passi della stessa catena, e
  divisi in «Campi» e «Cortile» la fila non si vedeva. Provati anche nove
  finti campi da arredo: si posavano e non facevano niente, e sono stati
  tolti.
- **Griglia a colonne uguali**, figure grandi **in scala fra loro** su un
  ripiano: una casa si vede che è una casa. Quello che non ti puoi
  permettere dice **di quanto** («manca 🪙12»), che è il numero che rimanda
  a fare esercizi. Le cose che lavorano hanno un filo d'oro attorno.
- **Lo scaffale si scorre col dito**: toccare una carta la prende (e resta
  appesa al dito), strisciare in su o in giù scorre e non prende niente,
  strisciare di lato la tira fuori e la posa dove il dito si alza. Col
  mouse si scorre con la rotella. Su e giù è del browser (`touch-action:
  pan-y`), e un `pointercancel` vuol dire «non è successo niente».
  Provato «si prende al primo contatto» (`pointerdown`):
  una strisciata si portava via la carta, e la *comprava*. Soglie in
  `scena/dito.js`, vista `viste/Roba.vue` e `viste/Provino.vue`; lo vede
  solo un test che scorre col dito (`integrazione/campi`).

## La strada del baule

Un bambino non sa cosa cercare in un baule pieno: sul tasto di una metà
compare un **segnalino** (`[data-strada]`), e il baule si apre già su quella
voce, che si vede in evidenza (`punta`). Lo decide `guardaLaFesta` in
`Gioco.vue`, a ogni cambio.

- **🌾 La fattoria**: la prima cosa che lavora, già aperta dal livello e mai
  costruita (la voce di livello più basso), col segno «!».
- **🌸 Decorazioni**: solo la voce della festa di oggi (🎃, 🎄), finché non ne
  ha posata nessuna. Le altre decorazioni non si consigliano: di norma
  le decorazioni sono una scelta sua, e la festa è l'eccezione perché dura
  poco.
- Le altre metà e le voci già avute non hanno segnalino.

Nei test: `[data-strada]` e `window.__fattoria.strada()` (per ogni metà, la
voce su cui si apre).
