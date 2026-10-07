# Il giro del mondo

La scelta delle giornate non è un elenco: è **un giro delle città del
mondo**, alla Cooking Fever. Ogni città è un gruppo di giornate; fra una
città e l'altra si vola in aereo; dentro una città c'è la **piazza coi
banchi**, e un banco è una giornata. Le giornate, la scaletta
([regole.md](regole.md)), le monete e i salvataggi sono quelli di sempre: il
mondo le raggruppa e basta, e le tre stazioni sono mondo → città → banco.

## Dove sta cosa

| file | cosa tiene |
|---|---|
| `src/data/bancarella-mondo.js` | le città, quali giornate ha ciascuna, dove stanno sul mondo; lo stato di una giornata e di una città, la città da fare (puro) |
| `src/motore/bancarella/mondo.js` | l'arco dell'aereo, i versi di partenza e di arrivo, la disposizione dei banchi nella piazza e la strada del carretto (puro, gira in Node) |
| `src/grafica/bancarella-mondo.js` | il disegno in codice: terre, monumenti, aereo, piste, banchi, carretto, cartello, cielo delle piazze (stringhe SVG) |
| `src/data/bancarella-fondali.js` | il posto dei fondali dipinti (vedi sotto) |
| `src/components/bancarella/Mondo.vue` | il planisfero: città, rotte, aereo, fumetto |
| `src/components/bancarella/Piazza.vue` | la piazza: banchi, carretto, cartello, fumetto |
| `src/views/BancarellaGame.vue` | decide gli stati (`vociMondo`, `banchiPiazza`), le tre fasi `mondo` · `piazza` · `gioco` e il ritorno dalla giornata |

## Le città

| # | città | giornate | il gradino della scaletta |
|---|---|---|---|
| 1 | Bologna | 1-2 | la cassa fa tutto |
| 2 | Roma | 3-6 | il totale lo batti tu |
| 3 | Parigi | 7-9 | il resto lo conti tu, con 10, 20 e 50 euro |
| 4 | New York | 10-11 | i mezzi euro, e la borsa più piena |
| 5 | Rio de Janeiro | 12-14 | i centesimi: le decine, i cinque, quelli veri |
| 6 | Tokyo | 15-16 | due cose uguali, e la cassa rotta |
| ∞ | Il Cairo | la libera | il mercato che non chiude mai |

- **Un gradino per città**: i gruppi seguono i salti della scaletta, non il
  numero (due giornate, quattro, tre…). Le città si aprono nell'ordine della
  fila, e due città non hanno mai la stessa giornata: lo prova
  `unita/bancarella-mondo`, che tiene le città agganciate agli id.
- **Per continente**: tre in Europa, poi Nord America, Sud America, Asia, e
  l'Africa per la libera. Si passa da un continente all'altro in aereo, ed è
  il viaggio che fa sentire che si è andati avanti.
- **La libera sta nella sua città**, chiusa e spenta finché la fila non è
  finita (prima compariva da sola alla fine): è un traguardo che si vede.

## Il mondo

- **Più grande dello schermo**: 1152×780 (`MONDO`), la scala 3/4 di un
  dipinto da 1536×1040 — come la terra di sopra del sotterraneo
  ([../sotterraneo/terra-di-sopra.md](../sotterraneo/terra-di-sopra.md)).
  Scorre col dito, nativo (`overflow: auto`, niente selezione), e si apre
  sull'aereo.
- **Le tappe sono tondi col numero**: il numero della città (1-6, ∞ per la
  libera), e lo stato nel colore e nel segno:

  | stato | come si vede |
  |---|---|
  | `fatta` | tondo verde; la stella accanto, con quante giornate ha finito (`★ 4`) |
  | `ora` | tondo giallo con l'anello tratteggiato che gira: la città da fare adesso |
  | `aperta` | tondo chiaro col bordo rosso (aperta da fuori, `tuttoAperto`) |
  | `chiusa` | tondo grigio col lucchetto, e il suo monumento sbiadito |

- **Una stella per giornata finita**, non di più: il gioco non ha «quanto
  bene», e il profilo non ha stelle da aggiungere (`profile.mercato.tappa`
  resta l'unico avanzamento). Le stelle sono accanto alla città con almeno una
  giornata finita; il racconto e il disegno stanno solo nel fumetto.
- **Il tratto di ogni città** è un monumento disegnato accanto al tondo
  (le due torri, il Colosseo, la torre di ferro, la statua, il Cristo, il
  torii, le piramidi) — lo stesso, grande, nel cielo della sua piazza.
- **Le rotte**: un arco fra ogni città e la dopo; blu tratteggiato fin dove
  si è arrivati, bianco punteggiato dopo.
- **Il tondo è un bersaglio da 62 px**, aperto sul `click`
  ([../core/il-dito.md](../core/il-dito.md)): il click che il dito lascia dietro
  non fa niente di sbagliato perché il fumetto non compare mai sotto il dito.

## L'aereo

Visto dall'alto, bianco con le ali rosse come la tenda. Sta accanto alla sua
città, su una piccola pista (`posteggio`), e la rotta parte da lì.

- **Toccata una città il fumetto si apre subito, sopra di lei, e l'aereo ci
  va** — il fumetto non aspetta l'arrivo. Il fumetto sta sopra la città
  (comune: [../core/interfaccia.md](../core/interfaccia.md#il-fumetto)), «▶ entra» c'è
  anche a volo in corso, e la vista sta ferma sotto il dito: scorre solo
  quanto basta a farlo vedere tutto.
- **Non si rigira all'arrivo, e se deve cambiare verso per ripartire gira
  sul posto**. Regola scelta dall'utente (6/10/2026):
  - l'aereo resta **com'è arrivato**, cioè col verso della tangente alla
    fine dell'arco; mai una rotazione finale;
  - per ripartire, se il verso della rotta che parte è lontano più di
    `GIRA_PRIMA` (0,35 rad), **prima gira sul posto** dalla parte più corta
    (0,2-0,6 s), poi vola.
- **Un arco, un'ombra**: l'arco è sempre dalla parte di sopra, lo stesso
  all'andata e al ritorno (`arco`); a metà volo l'aereo è alto (`quota`: fino
  a +32%) e la sua ombra, scura e trasparente, se ne stacca di una ventina di
  pixel e sbiadisce; a terra sono attaccati. Un volo dura fra 1,2 e 3 s.
- **Un altro tocco in volo cambia meta**: l'aereo riparte da dov'è, gira sul
  posto se serve, e il fumetto è quello della meta nuova. Un tocco fuori non
  chiude niente finché vola.
- **Una chiusa apre il suo fumetto e l'aereo non si muove**: dice cosa fare
  prima («Prima finisci le giornate di «Roma».»), senza tasto.
- **Dove era lo ricorda la sessione**, per bambino (`ultimo` in `Mondo.vue`),
  non il profilo: andando in una piazza e tornando, l'aereo è dov'era,
  girato com'era. La prima volta sta alla città da fare, col verso della
  rotta che ci arriva (per Bologna, di quella che parte).
- **Finita l'ultima giornata di una città si torna sul mondo e l'aereo ci
  vola**: parte da dov'era, aspetta un attimo, e la vista lo accompagna fino
  alla città nuova; un tocco chiude il volo (come nella
  [rotta degli asteroidi](../asteroidi/mappa.md#il-razzo), da cui la regola).
  Finita una giornata che non apre una città nuova si torna alla piazza.

## La piazza

Si entra da «▶ entra» nel fumetto di una città aperta; la barra dice la città,
e il ← porta al mondo.

- **Un banco per giornata**, a destra e a sinistra di un viale, a turno: il
  primo in basso, vicino al cartello da cui si arriva, gli altri su verso il
  monumento (`disponiPiazza`). In cima la fontana chiude il viale.
- **I banchi sono tappe col numero**: il numero della giornata nella scaletta
  (3, 4, 5, 6 per Roma), in un tondo sulla tenda; `fatta` ha la stella
  accanto e il tondo verde, `ora` il bordo tratteggiato che pulsa, `chiusa`
  il banco grigio con la serranda giù e il lucchetto. La merce sul banco ha i
  colori dei banchi della giornata, nessun disegno: il racconto è nel
  fumetto.
- **Il carretto è il segnalino della piazza**: parte dal cartello e va al
  banco da fare (o all'ultimo aperto, a città finita); toccato un banco aperto
  ci va, mentre il fumetto si apre subito. Si muove solo lungo il viale e
  per un tratto verso il banco, quindi non passa mai in mezzo a un altro
  (`stradaCarretto`: lo prova `unita/bancarella-mondo` da ogni posto a ogni
  altro, a sei larghezze). Non ha un verso, e quando si muove balla un poco.
  Una chiusa non lo muove.
- **Il fumetto del banco** sta sopra il tetto del banco (sotto, se sopra non
  c'è posto): «Giornata 3 · Roma», il nome con la sua emoji, la cosa nuova
  della giornata, i banchi che gira, lo stato, e «▶ gioca». Una chiusa dice
  «Prima tocca a «X».» senza tasto.
- **Il cartello in scena riporta al mondo**: un palo con un'asse, un aereo e
  una freccia, in basso accanto a dove si arriva; fa quello che fa il ←.
- **La scena sta in fondo**: se è più bassa dello schermo il cielo si allarga
  sopra e i banchi restano vicini al cartello; se è più alta (quattro banchi)
  scorre, e la vista si apre sul cartello.
- **Il carretto, dove era**: la sessione ricorda a che banco era rimasto, per
  bambino, e lo ritrova lì.

## Dalla giornata alla mappa

- **Una giornata si comincia dal «▶ gioca» di un banco.** Con una giornata
  lasciata a metà la carta in cima chiede prima di buttarla
  ([../core/ripresa.md](../core/ripresa.md)): la carta (`Ripresa.vue`) sta in cima al
  mondo **e** alla piazza, perché il banco toccato è nella piazza.
- **«Le giornate»** a fine giornata riporta alla piazza della città della
  giornata, o al mondo se quella finita ha aperto una città nuova.
- **← durante la giornata** resta com'era: scrive la sosta ed esce alla home.
- **Fuori dalla fila**: la libera sta nella piazza del Cairo, un banco solo
  col numero ∞.

## Il disegno, e i fondali che arriveranno

Per ora tutto è **disegnato in codice**, piatto e pulito, coi colori della
copertina in home (fondo `#ffd36b`, tenda `#e8553f`): è lo stesso lavoro che
fa il mondo dipinto, e quando i dipinti arrivano prendono il posto del mare, delle
terre e del cielo; i tondi, i monumenti, le piste, i banchi, il carretto e
l'aereo restano.

- **Il posto è pronto**: `src/data/bancarella-fondali.js` cerca in
  `src/assets/bancarella/` `mondo.webp` (o `.png`) e `piazza-<città>.webp`
  (`bologna`, `roma`, `parigi`, `new-york`, `rio`, `tokyo`, `cairo`); un file
  trovato sostituisce il disegno in codice (`<img>` a tutta scena,
  `image-rendering: pixelated`), uno che manca no. Senza file non entra niente
  nel file unico.
- **Le misure**: il mondo 1536×1040 mostrato a 3/4 (1152×780, un pixel di
  disegno da 4 px diventa 3, come la terra di sopra); la piazza 1040×1680
  mostrata a 520 px di larghezza, ancorata in basso.
- **I prompt** sono in `strumenti/sprite/sorgenti/bancarella/PROMPT-mappa.md`:
  prima il mondo, poi le piazze.
- **I punti non si indovinano, si rileggono**: arrivato un dipinto, i punti
  delle città (`x, y` in `CITTA`) e dei banchi (`disponiPiazza`) si rileggono
  sul dipinto come per la terra di sopra, e si scrivono nel codice; il test
  `unita/bancarella-mondo` continua a controllare che non si pestino.

## Nei test

`unita/bancarella-mondo`: le città agganciate alle giornate (tutte, una volta
sola, in ordine), gli stati, la città da fare, i segnaposto che non si pestano
fra città e dentro la città, gli archi dentro il mondo e uguali all'andata e al
ritorno, i versi, la piazza a sei larghezze (banchi dentro lo schermo e
distanti, carretto fuori dai banchi, cartello libero), il posto dei fondali
vuoto. `integrazione/bancarella-mondo` (col dito vero, CDP): fumetto subito
e aereo in volo, giro sul posto, arrivo senza rigirarsi, un'altra meta in
volo, una chiusa che non apre, entrare e tornare col cartello, il ← dalla
piazza, la città nuova dopo l'ultima giornata. `integrazione/bancarella` e
`integrazione/bancarella-sosta` ci arrivano passando da `giocaGiornata` di
`test/aiuto/browser.mjs`.

Bersagli: il mondo `[data-mondo]`; le città `[data-citta="<id>"]` con
`[data-stato="fatta"|"ora"|"aperta"|"chiusa"]` e `[data-fatte]`, la stella
`[data-stelle-citta]`; l'aereo `[data-aereo]` con `[data-al]` (la città),
`[data-in-viaggio="1"|"0"]` e `[data-verso]` (gradi); il fumetto
`[data-fumetto]` con `[data-fumetto-per="<id città o giornata>"]`,
`[data-azione="entra"]`, `[data-azione="gioca"]` e `[data-serve]`; la piazza
`[data-piazza]` con `[data-citta-di]`; i banchi `[data-camp="<id giornata>"]`
con `[data-stato]` e la stella `[data-stella-banco]`; il carretto
`[data-carretto]` con `[data-al]` (l'indice del banco, -1 l'ingresso) e
`[data-in-viaggio]`; il cartello `[data-azione="al-mondo"]`; da una giornata
finita `[data-azione="le-giornate"]`. `giocaGiornata(page, id)` in
`test/aiuto/browser.mjs` fa i quattro tocchi.
