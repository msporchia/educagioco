# La rotta

La schermata da cui si sceglie la tappa: una mappa dello spazio che si
scorre dall'alto in basso, con una rotta tratteggiata che passa per tutte
le tappe nell'ordine della fila ([scaletta.md](scaletta.md)). Il modello è
la mappa del tesoro dell'inglese ([../lingue/mondi-vista.md](../lingue/mondi-vista.md)):
la tela dipinge, sopra stanno in HTML i nomi e i tasti, e il razzo sta dove
si è arrivati.

## Dove sta cosa

| file | cosa tiene |
|---|---|
| `src/motore/asteroidi/rotta.js` | dove cade ogni tappa, la rotta, il posto del razzo e la sua strada in volo (puro, gira in Node) |
| `src/grafica/rotta.js` | fondo, costellazioni, rotta, pianeti, stazioni, galassia, lucchetti e stelle; il razzo |
| `src/components/RottaAsteroidi.vue` | la vista: nomi, tasti, fumetto, il razzo e il suo volo |
| `src/views/MathGame.vue` | decide lo stato di ogni tappa e cosa dire su una chiusa (`vociRotta`, `serveDi`) |

## La mappa

- **Una rotta che serpeggia**, una tappa sotto l'altra (`PASSO`), e ogni
  tappa da un lato o dall'altro dello schermo (`onda`): due di fila cambiano
  lato quasi sempre. La prima sta in cima, come nell'inglese: si scende
  scorrendo. Fino a 520 px di larghezza; oltre resta in mezzo.
- **Il nome sta accanto alla tappa, dalla parte del mezzo**, dove c'è
  posto. Provato sotto la tappa: la rotta, che scende, ci passava sopra.
- **I capitoli della fila sono costellazioni**: il nome in piccolo con
  qualche stella unita da un filo, nello spazio in più prima della loro
  prima tappa (`STACCO`) e dalla parte dove la rotta non passa. La riga
  «che» dei capitoli non si dice più.
- **Colori piatti, niente sfumature**: fondo uniforme, stelle fisse col
  seme della larghezza (la stessa mappa a ogni apertura), l'ombra di un
  pianeta è una falce piatta.
- **I pianeti** sono disegnati, uno per tabellina (`PIANETI` in
  `grafica/rotta.js`): la Terra del 2, la luna del 10, l'anello del 5, del 6
  e dell'8, la luna del 7, il Sole con i raggi. Niente emoji.
- **Le stazioni** sono un modulo con i pannelli sui bracci, girate di
  sbieco: si riconoscono come un'altra specie di tappa. **Crescono lungo la
  fila** — più pannelli, poi l'antenna, poi il secondo modulo — perché il
  calcolo a mente è una salita sola; l'ultima («La prova») ha la stella.
- **Il volo infinito è l'ultima tappa della rotta**: una galassia a
  spirale, in mezzo, staccata dalle altre. Chiusa finché la fila non è
  finita, col lucchetto e il nome; aperta, sotto il nome c'è il record.

## Lo stato a colpo d'occhio

Lo decide `MathGame.vue` (`statoVoce`), la mappa lo dipinge:

| stato | come si vede |
|---|---|
| `fatta` | il disegno pieno e la ⭐ d'oro in alto a destra: l'unico segno, come in [scaletta.md](scaletta.md#un-contatore-un-segno) |
| `ora` | un anello d'oro che respira attorno, il nome in oro, e il razzo accanto |
| `aperta` | il disegno pieno, niente segno (aperta dall'età o da `tuttoAperto`) |
| `chiusa` | sbiadita verso il grigio, col lucchetto sopra |

- **Chiusa vince su superata**: una tappa superata e poi chiusa dall'età
  resta chiusa, come prima.
- **La rotta è d'oro fino al razzo**, tenue dopo.
- **Lo sbiadito si fa a mano**: il nodo si dipinge su una tela a parte, si
  tinge di grigio sopra i suoi pixel (`source-atop`) e si posa trasparente.
  `ctx.filter` su Safari non c'è.

## Il fumetto

- **Toccando una tappa compare un fumetto sopra di lei**, con la coda che
  la indica: specie e posto («Pianeta · tappa 6 di 22»), nome, cosa chiede
  e quanti centri, lo stato, e «▶ parti». Non è un foglio dal basso e
  nell'elenco non ci sono più le descrizioni: tutto quello che c'era sotto
  il nome sta qui.
- **Su una chiusa dice cosa fare prima, senza tasto**: «Prima tocca a «X»,
  poi ad altre 3 tappe.» (X è la tappa da fare adesso); chiusa dall'età,
  «Questa tappa per ora è chiusa.» — andare avanti non la aprirebbe.
- **Si apre al `click`**, non al `pointerup`: il click che il dito si lascia
  dietro è proprio quello che lo apre ([../core/il-dito.md](../core/il-dito.md)).
  Il fumetto non compare mai sotto il dito (sta sopra la tappa, o sotto
  per le prime in cima, dove sopra non c'è posto), quindi «▶ parti» non si
  preme da solo.
- **Toccando fuori si chiude**; toccando un'altra tappa si apre il suo.
- **Si vede tutto**: se sborda, la mappa scorre quanto basta, tenendo
  libero in basso il posto di «📊 Cosa so».
- La spiegazione lunga che stava in cima è diventata una riga sola.
- Il fumetto è ancora scritto qui dentro, venuto prima di quello comune
  (`src/components/Fumetto.vue`, [../core/interfaccia.md](../core/interfaccia.md#il-fumetto)):
  può passare a quello, tenendo i suoi colori con le variabili.

## Il razzo

È la nave della partita (`disegnaNave` di `grafica/spazio.js`), girata
verso dove va, sulla sua tela piccola che la vista sposta.

- **Sta accanto alla tappa a cui si è arrivati** (`dove`, o il volo a fila
  finita), dalla parte opposta al nome. La mappa si apre scorrendo fino a
  lui.
- **Vinta una tappa che ne apre una nuova, ci vola** tornando alla mappa:
  resta fermo un attimo dov'era (`attesa`, 0,45 s), poi **prima gira sul
  posto** se il verso cambia più di `GIRA_PRIMA`, poi segue la rotta
  (`stradaDelRazzo`: i punti troppo vicini ai disegni si saltano, se no ci
  passa sopra) e **all'arrivo resta girato com'è arrivato** — niente
  rotazioni finali. Un volo dura fra 0,9 e 2,4 s (`durataVolo`).
- **Dove era l'ultima volta lo ricorda la sessione**, per bambino
  (`ultimo` in `RottaAsteroidi.vue`), non il profilo: tornando senza una
  tappa nuova lo si ritrova lì, girato com'era. La prima volta guarda
  lungo la rotta, in avanti.
- **A fotogrammi, e fermo a schermo nascosto**: il tempo avanza al massimo
  50 ms per fotogramma, come la nave dell'inglese. Fermo, non anima niente.
- **Un tocco durante il volo lo chiude**: un velo trasparente si prende il
  tocco (e il click che segue), il razzo arriva subito e non si apre niente.

## Il resto della schermata

- **La partita lasciata a metà** ([sosta.md](sosta.md)) sta ferma sopra la
  mappa, non dentro: la mappa si apre sul razzo e una carta in cima allo
  scorrimento non si vedrebbe.
- **📊 Cosa so** è un tasto fermo in basso a destra, sopra la mappa: in
  fondo a ventitré tappe non lo troverebbe nessuno.
- **L'astronave e i gettoni** si spiegano in fondo alla rotta, dopo il volo.

Nei test: `unita/rotta-asteroidi` (a cinque larghezze: tappe dentro lo
schermo, la rotta che non passa sopra un nome né un capitolo, il razzo
accanto alla sua tappa e da ognuna alla dopo, la stessa mappa a ogni
apertura), `integrazione/rotta-asteroidi` (col dito vero: il fumetto si
apre e non parte niente, fuori si chiude, una chiusa dice cosa fare prima,
«▶ parti», vinta la tappa il razzo vola alla nuova e resta girato, un tocco
chiude il volo senza aprire niente). Bersagli: la mappa `[data-rotta]`; le
tappe `[data-tappa="<pos>"]` con `[data-tipo="pianeta"|"stazione"]` e
`[data-stato="fatta"|"ora"|"aperta"|"chiusa"]`; il volo `[data-volo]` con
`[data-stato]` e il record `[data-record]`; i capitoli `[data-capitolo]`;
il fumetto `[data-fumetto]` con `[data-fumetto-per="<pos>"|"volo"]`,
`[data-azione="parti"]` e `[data-serve]`; il razzo `[data-razzo]` con
`[data-al]` (il nodo), `[data-in-viaggio="1"|"0"]` e `[data-verso]` (i
gradi); il velo del volo `[data-viaggio]`; `[data-azione="cosa-so"]`.
`parti(page, nodo)` in `test/aiuto/browser.mjs` fa i due tocchi.
