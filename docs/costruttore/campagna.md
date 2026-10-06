# Il costruttore — salvataggi, fila, stelle e aiuti

Dove stanno i programmi e l'avanzamento, come si riordina la fila, e cosa
vale un livello. Codice in `src/giochi/costruttore/` (`Gioco.vue`,
`dati/campagna.js`, `motore/aiuti.js`).

## I programmi stanno fuori dal profilo

- **In archivio sotto `costruttore:<id del giocatore>`**, con una `v` sua
  (`VERSIONE` in `Gioco.vue`), sotto la chiave del livello, che non cambia
  mai. Il programma si tiene anche uscendo a metà.
- **Si scrive subito, non solo col ritardo**: `salvaOra` fa `save` e `flush`
  (l'archivio aspetta 350 ms), e gira su ←, `allaMappa`, smontaggio e su
  `visibilitychange` (pagina nascosta) e `pagehide`: il telefono in tasca
  non perde l'ultima riga. Nei test: `integrazione/costruttore-salvataggio`.
- **Quando la lingua cambia si alza la `v`** e i programmi vecchi si lasciano
  andare (è successo col passaggio alla gravità); l'avanzamento resta nel
  profilo, in `profile.campagne.costruttore`.
- **Gli attrezzi non si salvano** come roba del bambino: li rimette
  `motore/attrezzi.js` a ogni apertura (vedi [progetti.md](progetti.md)).

## Riordinare la fila

- **Le stelle stanno sotto l'indice del livello** (la forma di tutte le
  campagne, `src/giochi/campagne.js`): rimescolare senza dirlo metterebbe le
  stelle di un livello su un altro.
- **Ogni fila giocata resta scritta in `FILE`** (`dati/campagna.js`), e il
  profilo dice quale conosce (`cfg.fila`). **`riordina` rimette le stelle per
  chiave** e riconta la tappa come i livelli vinti in fila dall'inizio.
- **Un livello nuovo in mezzo si fa prima di andare avanti**; i livelli già
  vinti più avanti tengono le stelle e si riaprono arrivandoci. È il
  contrario di Passo passo, che lascia la tappa raggiunta dov'era (vedi
  [../passo-passo/livelli.md](../passo-passo/livelli.md)).
- **Aggiungere in fondo non sposta niente** e non vuole una fila nuova.

## Si apre per merito

`perMerito: true` nel manifesto (`gioco.js`): un livello vinto apre il
successivo anche oltre la portata dell'età — averlo vinto è la prova che il
bambino ci arriva. L'età decide solo se la carta si offre in home. Come
funziona in generale: [../apprendimento/eta-e-portata.md](../apprendimento/eta-e-portata.md).

## Stelle, monete e il 💡

- **Due stelle**: fatto, e fatto senza farsi scrivere la soluzione intera.
- **Le monete arrivano una volta sola**, alla prima vittoria: rifarlo è
  ricordarsi il programma, non scriverlo.
- **La scala del 💡** (prezzi e regole comuni in [../core/aiuti.md](../core/aiuti.md)),
  composta per livello da `scalaDi` in `motore/aiuti.js`:
  - **gratis** — `liv.ragiona`: cosa chiede il livello, e la domanda giusta
    da farsi;
  - **🪙10** — `liv.indizi`, dal più largo al più stretto;
  - **🪙50, il pezzo** (`pezzoDi`): metà del lavoro e mai il nodo — i progetti
    del livello interi (tranne la chiamata a sé stesso, vedi
    [algoritmi.md](algoritmi.md)), o la prima metà del principale, o il
    lavoro di un giro scritto fuori dal suo blocco con le domande da
    scegliere;
  - **🪙100, la forma**: tutti i blocchi al loro posto, coi numeri, i colori e
    le domande da scegliere;
  - **🪙200, la soluzione**, che spegne la seconda stella.
- **I gradini che scrivono escono dalla soluzione** che il banco gioca, mai
  scritti a mano: se no il giorno che la soluzione cambia direbbero un'altra
  cosa. Un test pretende che la soluzione svelata vinca davvero.
- **Quello che si è pagato resta** (`campagne.costruttore.aiuti`, via
  `segnaAiutiPresi`), e un pezzo di programma si rimette gratis.
- **Il primo gradino gratis si scende da sé** aprendo il foglio: chi tocca la
  lampadina vuole già una mano, e fargli toccare un secondo tasto per una
  frase che non costa niente è una schermata in più.
- **Chi compra è `scendi` in `Gioco.vue`, non il foglio**: senza monete la
  spesa si rifiuta comunque, anche premendo un tasto che avrebbe dovuto
  essere spento.
