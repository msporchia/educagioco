# La freccina verso la missione

Una missione presa e non ancora fatta si ricorda da sola, giù e sopra. Le missioni
in sé (l'albero, il diario, i premi) sono in [missioni.md](missioni.md); la terra di
sopra in [terra-di-sopra.md](terra-di-sopra.md). Il codice: `rotta` e
`discesaDaSeguire` in `motore/missioni.js` (pure, girano in Node), `posaLaRotta` in
`Gioco.vue`, `viste/Terra.vue` (`fuori`, `vicine`, `vaAllaDiscesa`), `scena/tela.js` (`schermoDi`).

Chi gioca poco spesso non si ricorda una missione presa tre giorni fa (l'utente,
8 ottobre): due freccine la ricordano, una giù e una sopra. **È una direzione e
non una strada**: niente percorso disegnato, e una freccina sola per volta.

- **Giù** (`rotta` in `motore/missioni.js`, `posaLaRotta` in `Gioco.vue`): una
  freccina attorno all'eroe, ruotata verso la missione presa e non ancora fatta
  **più vicina** della discesa. Se la cosa è su questo piano punta al forziere
  d'oro o al mostro con la corona (oro, `data-verso="qui"`); se è più in basso
  punta alla **scala che scende** (azzurra, `"scala"`) e la riga in cima dice
  «la collana è al terzo piano: scendi». Una già sfuggita (piano passato), una
  fatta, o una missione di un'altra discesa non c'è; senza missioni, niente. La
  riga che la freccina sta seguendo ha il suo ▸ (`data-segui`).
- **Non guarda la nebbia né la torcia**: indica anche verso il buio, ed è il
  motivo per andarci. Provato nel test: la scala non è stata vista e la
  freccina c'è lo stesso.
- **Non prende i tocchi** (`pointer-events: none`): il campo sotto si tocca come
  sempre. Si nasconde con un foglio aperto o lo zaino, che sono sopra il campo.
- **Sopra** (`discesaDaSeguire`, `viste/Terra.vue`): lo stesso indicatore sul bordo
  delle consegne (sopra, «Chi aspetta ed è fuori schermo si trova»), con un
  altro colore: **azzurro, col ritaglio della discesa** al posto del «?», che
  porta alla discesa della missione presa (la più vicina all'eroe, se sono di
  discese diverse; una sola per discesa). Toccandolo l'eroe ci va e si apre il
  fumetto della discesa, come toccandola. **Le consegne pronte hanno la
  precedenza**: finché qualcuno aspetta di riceverne una c'è il suo «?» d'oro
  e la freccia azzurra no (una cosa alla volta da ricordare).
- **Sopra, in vista** (l'utente, 8 ottobre: «scompaiono troppo presto»): una
  direzione che sparisce appena la cosa entra nello schermo lascia il bambino
  a cercarla. Finché l'obiettivo (la discesa, o chi aspetta la consegna) è in
  vista e l'eroe **non gli è ancora arrivato** (a meno di 1,6 celle dal piede
  della discesa o dal punto accanto al personaggio, `ARRIVATO`), al posto
  dell'indicatore sul bordo c'è la freccina attorno all'eroe, la stessa
  forma di quella giù (`.sot-rotta`): azzurra verso la discesa, d'oro verso
  chi aspetta. Il passaggio ha isteresi (`AGGANCIO`, 30 px: subentra a cosa
  entrata di tanto, cede quando esce davvero) e le due non si vedono mai
  insieme.

Nei test: `[data-rotta]` con `data-verso` (`qui` o `scala`), `data-missione-rotta` e `data-gradi`;
nel promemoria `li[data-segui]`; sopra la freccia azzurra `[data-meta-fuori="<discesa>"]`
(`.sot-bussola-meta`, col suo `[data-ritaglio]`; l'indicatore d'oro è `[data-consegna-fuori]`).
`unita/sotterraneo-missioni` prova la scelta (stesso piano, scala, la più vicina, nessuna, fatta,
piano passato; la discesa da seguire sopra e la precedenza della consegna);
`integrazione/sotterraneo-rotta` misura sullo schermo che la punta cada sulla retta dall'eroe
alla cosa (forziere e scala), e sopra che la freccia azzurra porti alla discesa, ceda alla
consegna e sparisca senza missioni; con la cosa in vista misura la freccina attorno all'eroe
(`[data-rotta-terra]` con `[data-meta-vicina="<discesa>"]` o `[data-consegna-vicina="<chi>"]`,
`data-gradi`): punta giusta, nessuna sul bordo insieme, camminando il passaggio è solo
bordo → freccina → niente, e arrivati sparisce.
