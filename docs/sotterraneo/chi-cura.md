# Chi cura: la guaritrice e l'incantatrice

Il codice: `viste/Terra.vue` (il fumetto, il numero, la scelta), `motore/dialoghi.js` (`curaDi`, `mancaA`, `richiamoDi`, `dopoLaCura`),
`dati/dialoghi.js` (`cura` di ogni personaggio), `motore/sosta.js` (`forzeDi`), `Gioco.vue` (`forze`, `curaDa`, la barra). La terra di sopra:
[terra-di-sopra.md](terra-di-sopra.md); il dialogo: [dialoghi.md](dialoghi.md#chi-cura); la sosta: [portale-e-sosta.md](portale-e-sosta.md).

L'utente, il 14 ottobre 2026: *«aggiungerei un personaggio che ti cura come in Diablo, così se non hai soldi sei comunque a
posto»*, e *«se sali e hai meno vite del massimo, magari ti chiama dicendoti se vuoi essere curato»*. Perché tornare su
conti: i mostri picchiano, le pozioni finiscono, e chi non ha gemme non resta bloccato.

- **Salire non cura.** La sosta del portale porta la vita e l'energia di giù (`vita`, `energia`: [portale-e-sosta.md](portale-e-sosta.md)), e
  la barra sulla terra di sopra le mostra com'erano (`forze` in `Gioco.vue`, `forzeDi` in `motore/sosta.js`, col massimo di
  adesso: la roba comprata sopra può averlo alzato). Prima la barra dichiarava vita e energia piene e la discesa ripresa
  le ritrovava a metà: una bugia. Finita la discesa, e dopo «lascio perdere», non c'è sosta: la prossima parte in piena forma.
- **La guaritrice (`erborista`) cura la vita, l'incantatrice l'energia**, gratis e senza limiti: ognuna il suo mestiere, e
  per le due cose si passa da due persone, a pochi passi una dall'altra. Nel dialogo la domanda è «Curami» / «Ricaricami»
  ([dialoghi.md](dialoghi.md#chi-cura)): la risorsa va al massimo nella sosta (`curaDa` in `Gioco.vue`), la barra sale, sopra
  l'eroe sale il numero («+12 ❤️» verde, «⚡» azzurro: `[data-cura-fiocco]`), e la ripresa dal gemello è a vita e energia piene.
- **Chi cura chiama.** Finché alla sua risorsa manca qualcosa, sopra la sua testa c'è un fumetto («Sei ferito. Vieni, ti
  curo.» / «Sei a secco. Vieni, ti ricarico.»: `.sot-richiamo`, `[data-richiamo]`, dati in `DIALOGHI[chi].cura.richiamo`).
  Non è una finestra e non blocca niente: come il «!» delle missioni è un segno sul personaggio, e toccarlo è toccare lei
  (l'eroe ci va e si apre il dialogo, con «Curami» come prima domanda). Resta lì finché non si è curati, senza timer né
  ripetizioni a ogni passo; tace mentre ci si parla e scompare appena la sosta è a posto. Si vede solo se lei è già stata trovata
  nella nebbia, e solo con una discesa lasciata dal portale (l'abisso risalito per stasera conta: si è portati su ammaccati).
- **Il 🧪 di sopra** con la vita sotto il massimo dice «la guaritrice ti cura, gratis» invece di «sei già in piena forma».
- **Il giocatore finto** (`motore/banco.js`, le risalite) risale, compra e ritorna giù a vita e energia piene: la guaritrice è
  parte del giro. Le soglie con cui risale (`RISALITA`) non le ha toccate: la taratura va rifatta con questa regola.
- **Provato e scartato**: una finestra o una domanda che si apre da sola all'arrivo (contro
  [../core/interfaccia.md](../core/interfaccia.md#un-tocco-altrove-chiude): niente che copra il gioco senza essere chiamato);
  curare salendo dal portale (toglieva il senso alla guaritrice e il motivo di tornare su); una cura a pagamento (chi non ha
  gemme resterebbe bloccato, che è proprio quello che l'utente non vuole).


Nei test: `[data-richiamo]` (con `data-richiamo-di`), `[data-cura-fiocco]` (con `data-risorsa`), la domanda `[data-scelta="cura"]`,
`[data-riga][data-cura]` e `[data-riga][data-in-forze]`; `unita/sotterraneo-dialoghi` (la domanda, il suo posto, il fumetto),
`unita/sotterraneo-sosta` (salendo non si guarisce, `forzeDi`), `integrazione/sotterraneo-cura` (il giro intero col dito).
