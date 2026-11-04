# Passo passo — il guerriero

Il terzo protagonista, un gradino sopra il coniglio e il cane: un castello dove
le cose **reagiscono**, e lo scopo è arrivare alla principessa. Il programma
resta una fila di frecce; quello che cresce è l'ordine in cui fare le cose.
Regole in `motore/mondo.js` (`premi`, `affronta`), tappe in coda a
`dati/campagna.js`, disegni in `scena/pixel.js` e `scena/tela.js`.

## Le regole

| | |
|:--|:--|
| **la principessa** | `Q`, al posto della tana: arrivarci vince subito, in qualunque modo, anche con un nemico accanto. Una tappa con la principessa è del guerriero (`delGuerriero`) |
| **la corona** | la sua carota: la seconda stella |
| **il pulsante** | `4 5 6`, rosso, blu e giallo, con la forma delle lastre per chi i colori non li distingue. Lo preme chi ci mette il piede, anche scivolando, e il masso che ci finisce sopra. Saltandoci sopra non si preme, come la carota |
| **la grata** | `R U G`: chiusa è un muro alto, non si scavalca e ferma chi scivola. Si apre col pulsante del suo colore, tutte quelle del colore insieme, e **resta aperta** |
| **il nemico** | `n`: vede le **otto celle** attorno a sé, anche di traverso, e colpisce chi ci si ferma. Non vede solo dietro un angolo, con tutte e due le celle in mezzo sbarrate (`Livello.vede`). Chi scivola o salta conta solo dove finisce. Per terra le celle che vede sono tinte di rosso: la regola detta col disegno, per chi non legge |
| **la spada** | `s`: si prende passandoci sopra, si vede in mano, e resta. Con lei il nemico accanto sparisce in uno sbuffo |
| **due insieme** | fermarsi dove ti vedono in due è la fine **anche con la spada**: si prendono uno alla volta, da una casella che ne vede uno solo |
| **il muro** | `W`: alto, come l'albero |

Cadere (`CADUTO`) è uno sbaglio come sbattere: la freccia colpevole lampeggia,
il guerriero vede le stelline e torna alla partenza. Niente vite, niente
punizioni, come nel resto del gioco.

Provato: il nemico che vede solo sopra, sotto e di lato. Il guerriero gli passava di traverso a una casella e quello non si accorgeva di niente: sembrava scemo.

Casi decisi apposta:

- il nemico non si muove: reagisce e basta. Una ronda è un'altra regola, da
  chiedere prima;
- un masso non copre la spada e non entra in una grata chiusa; sul pulsante sì,
  e lo preme per sempre;
- il pulsante accanto a un nemico si preme col piede solo avendo la spada: è
  il modo di far contare l'ordine.

## Le carte

Le stesse scatole del coniglio ([zaino.md](zaino.md)), ma le condizioni guardano
il castello e non le lastre.

- **🔁 ripeti N**, anche una scatola dentro l'altra.
- **🚩 fino a 🔴**: il colore è quello del **pulsante** che si ha sotto i piedi
  (`Mondo.lastra`). I camminamenti sono lunghi diversi e finiscono su un pulsante:
  contare non serve.
- **🔁 fino a 🏠** vuol dire fino alla principessa.
- **❓ col colore** guarda il pulsante o la lastra sotto i piedi, come col coniglio
  (senza la carta `varco`). Una cella senza colore su quella strada non fa scattare
  nessun ❓: niente grate né corona lungo il pavimento, se no la fila si ferma stanca.
- **❓ con una freccia non ha l'«altrimenti»**, e dopo un passo le domande continuano:
  dentro un 🔁 🏠 si chiedono solo versi che non tornano indietro, due alla volta.
- **❓ con una freccia, «se di là si passa»** (la carta `varco`, che accende i
  quattro versi nella scelta del ❓; `Mondo.vale`): non si passa contro un muro,
  una grata chiusa, un nemico, un masso, l'acqua e il bordo. È la condizione che
  guarda il mondo: 🔁🏠( ❓→(→) ❓↓(↓) ) segue un corridoio che non si conosce, e
  la grata aperta da poco diventa strada da sola.

Con lo zaino valgono le regole di [zaino.md](zaino.md): la strada in frecce non ci
sta, le `soluzioni` e le `fragili` si scrivono, e chi sbaglia fa almeno due passi.

**Una tappa con le carte non è una del coniglio travestita**: la soluzione scritta
affronta tutte le guardie della mappa, e un test lo pretende. Una guardia murata, o
messa solo dove non si deve andare, è un muro che morde: sta **sulla strada**, davanti
a un pulsante o accanto a una sosta. Il mondo che cambia è il bello: la guardia battuta
libera il ❓, e in «Le soste» la grata aperta fa cambiare strada allo stesso programma.
`strumenti/passo-passo/guerriero.mjs` dice cosa tocca ogni soluzione.

## La strada

- **Comincia quando comincia il cane**, finito «Tutto insieme» (`apreIlCane`),
  e da lì va avanti da sola come le altre due. La portata parte da 44.
- **Sta tutta nel mondo dello zaino**, con le sue caselle sulle quattro isole
  del coniglio (`guerriero` nel foglietto `zaino.json`), cinque, cinque, sette e sette: le
  grate sul ripeti, la spada sul fino a, due alla volta sul se, il castello su
  tutto il mondo. Il fondale è quello di prima: un fondale suo si dipinge solo
  se la strada piace.
- **Poi due isole solo sue**, cinque e cinque: il lago sul lago gelato, il mastio
  sul fienile (`"solo": true` nel foglietto). Ci si arriva sotto terra: dalla fine
  della spirale si sbuca dalla tana del lago, e da lì da quella del fienile. Per il
  coniglio restano decoro, tane comprese (`quadroValle`).
- **Non ha un sentiero senza fine**, e il segnalino resta lì in fondo.
- **Il disegno è in codice**, come vuole la regola: il guerriero, il nemico, la
  principessa, la corona, la spada, le grate, il muro. Il tema `castello` è il
  pavimento di pietra.
- **Il premio si ferma a 20**, il tetto di `guastiDellaCampagna`: dalla torre in poi
  non sale più.
- **Le carte arrivano a metà strada**, dalla quindicesima tappa, e da lì restano:
  prima la strada è di sole frecce, fino a 23 (il tetto è 24 come per il cane).
  Una strada lunga scritta in frecce è una lista, non un programma: provato, e
  arrivati alla tappa 19 non c'era altro.
- **Una tappa è un posto largo nove celle**, non la stanza del trucco: cortili,
  fossati, stanze e strade che non portano da nessuna parte. Strette attorno alla
  soluzione uscivano minuscole, e non si capiva dove si stava.

## Le tappe

La colonna dice la strada più corta con la corona, misurata da
`node strumenti/passo-passo/guerriero.mjs`, che dice anche se la regola serve e
dove finiscono trappole, soluzioni e mosse ingenue.

| | | frecce |
|:--|:--|:--:|
| **🔑 Le grate** | *il pulsante del colore giusto* | |
| 1. La prima grata | il pulsante sta nell'altra stanza | 13 |
| 2. Il colore giusto | due grate, il blu dietro il rosso | 19 |
| 3. Due porte, un pulsante | un pulsante ne apre due | 20 |
| 4. Tre colori | tre porte attorno a un cortile | 23 |
| 5. La torretta | tre pulsanti: guardare prima di partire | 22 |
| **🗡️ La spada** | *alla larga, o con la spada* | |
| 6. Alla larga | si gira attorno a quello che vede | 14 |
| 7. La spada | la porta si apre solo battendolo | 17 |
| 8. Dietro la grata | la spada è chiusa dietro il rosso | 16 |
| 9. La guardia al pulsante | prima la spada, poi il pulsante | 18 |
| 10. Tre guardie | chi va battuto, e chi no | 23 |
| **⚔️ Due alla volta** | *contro due non vince nessuno; poi il 🔁* | |
| 11. Due guardie | se ne prende una da parte | 15 |
| 12. Il giro | la strada di sopra porta a una sola | 14 |
| 13. La fila | si entra di fronte a una sola | 17 |
| 14. Il masso sul pulsante | premerlo da lontano | 14 |
| 15. La scalinata | 🔁 una rampa e la sua guardia, ma prima la spada | zaino 7 |
| 16. La galleria | 🔁 come si passa una coppia | zaino 7 |
| 17. Il fossato | 🔁 salto e passo, sulle isolette | zaino 4 |
| **🏰 Il castello** | *il programma fa la strada* | |
| 18. Le stanze chiuse | 🔁 dentro 🔁, di buca in buca | zaino 3 |
| 19. I camminamenti | 🚩 fino al giallo, guardie sulla strada e spada alle spalle | zaino 7 |
| 20. Le rampe | 🚩 avanti al rosso, indietro al blu | zaino 9 |
| 21. Il corridoio storto | ❓ se di là si passa: la guardia battuta libera la strada | zaino 5 |
| 22. Le nicchie | ❓ a ogni gradino si guarda a sinistra | zaino 5 |
| 23. Scivolare via | 🔁 sul ghiaccio contano le soste, e a ogni sosta una guardia | zaino 7 |
| 24. La torre | ❓ un programma solo, e la spada dietro di te | zaino 6 |
| **❄️ Il lago** | *il programma guarda dove mette i piedi* | |
| 25. La pista | 🔁 due frecce, la spada alla prima sosta, guardie alle altre | zaino 3 |
| 26. Le soste | ❓ la grata aperta fa cambiare strada allo stesso programma | zaino 7 |
| 27. Il ponte rotto | ❓ un passo se c'è il ponte, poi sempre un salto | zaino 4 |
| 28. Le tre chiavi | 🔁 dentro 🔁: ogni pulsante ha la sua guardia davanti | zaino 10 |
| 29. Il pavimento | ❓ col colore sotto i piedi, e prima la spada | zaino 11 |
| **👑 Il mastio** | *scatole dentro scatole, e tutte le carte* | |
| 30. I pozzi | 🔁 dentro il ❓: se sei sul rosso, tre volte giù | zaino 5 |
| 31. I denti del mastio | 🚩 due «fino a» in una scatola, una guardia per dente | zaino 9 |
| 32. La chiocciola | 🚩 quattro «fino a» in una scatola, e tre guardie nei corridoi | zaino 9 |
| 33. I due corridoi | 🚩 e ❓: una scatola si ferma sul giallo, l'altra arriva | zaino 10 |
| 34. Il trono | tutte le carte: la spada, le rampe, il corridoio | zaino 11 |

**Ogni tappa di frecce con i nemici dichiara le sue `trappole`**: la mossa ingenua, che fa
almeno due passi e poi si ferma male. Nel gradino dei due, `serveLaRegola` guarda
che la strada vera sia più lunga di quella che si farebbe se due nemici valessero
uno; le `regole` di una tappa prendono il posto di quella del gradino.

Nei test: `unita/passo-passo-guerriero` (le regole su mappe piccole, la scena, la
strada, ogni tappa con le sue regole, le trappole e chi segue gli aiuti),
`integrazione/passo-passo-guerriero` (il selettore a tre, il lucchetto, una
vittoria, una caduta). Bersagli: il selettore `[data-scegli="guerriero"]`, da
chiuso `[data-serve-guerriero]`; le caselle `[data-strada="guerriero"]`.
