# Castle Battle a scuola

Il gioco vero dentro una lezione della scuola ([../scuola/giochi.md](../scuola/giochi.md)). Il codice della scuola sta in
`src/scuola/giochi/castle-battle/`, quello del gioco in `motore/limite.js` e nella prop `limite` di `Gioco.vue`.

## L'esercizio

`{ tipo: 'battaglia', tappa: '<chiave della campagna>' }`, più la difficoltà del blocco. La maestra sceglie **una tappa**
fra le dodici della campagna (`Parametri.vue`, schede con ▶ Prova): la tappa porta le sue truppe, e le truppe portano le
operazioni (le colline d'oro addizioni e sottrazioni, il deserto le tabelline, il canyon le divisioni:
[calcoli.md](calcoli.md)). Si parte senza tappa scelta. Scelto dall'utente il 21 novembre 2026, come il castello: una tappa
già tarata invece di un elenco di operazioni da spuntare, perché le operazioni stanno nelle truppe e toglierle cambierebbe
la battaglia.

- **La difficoltà è il livello del nemico**: Facile, Normale e Difficile sono il `facile`, `medio` e `difficile` di
  `NEMICO_PER_LIVELLO`, tarati per ogni tappa. A casa la campagna è sempre il Medio.
- **La grandezza dei numeri** la decide il gioco come a casa (`bravura.js`): parte dall'età e sale con le risposte giuste e
  svelte; il profilo è in memoria, quindi riparte a ogni lezione.

## La prop `limite`

`{ tappa, difficolta }`. Col limite (`tappaDelLimite` lo riconosce) il gioco:

- parte nella tappa, senza mappa (`viste/Mappa.vue` a scuola è un `Vuoto.vue`), amici né sfide in due;
- non paga monete, non segna traguardi né stelle, non scrive la partita lasciata a metà;
- a fine battaglia, vinta o persa, dice «di nuovo» e rifà la stessa tappa (`Finale.vue` con `scuola`), senza «alla mappa».

## L'evento `risposta`

Ogni calcolo è una domanda chiusa: `raccontaCalcolo` lo racconta dalla domanda e dalla risposta di `quiz/Domanda.vue`
(«14 + 6», detto e atteso, al più 40 caratteri), con la chiave del modulo `conti`. Il tasto «salta» dei grandi non manda
niente.

Nei test: `unita/arena-scuola` (le tappe con le loro operazioni, valido e storto, il livello, il racconto),
`integrazione/scuola` (una prova di Castle Battle parte nella tappa, `scuola-castle-battle` con `--scatti`).
