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

## La strada

- **Comincia quando comincia il cane**, finito «Tutto insieme» (`apreIlCane`),
  e da lì va avanti da sola come le altre due. La portata parte da 44.
- **Sta tutta nel mondo dello zaino**, con le sue caselle sulle quattro isole
  del coniglio (`guerriero` nel foglietto `zaino.json`), cinque per isola: le
  grate sul ripeti, la spada sul fino a, due alla volta sul se, il castello su
  tutto il mondo. Il fondale è quello di prima: un fondale suo si dipinge solo
  se la strada piace.
- **Non ha un sentiero senza fine**, e il segnalino resta lì in fondo.
- **Il disegno è in codice**, come vuole la regola: il guerriero, il nemico, la
  principessa, la corona, la spada, le grate, il muro. Il tema `castello` è il
  pavimento di pietra.
- **Niente carte, per ora**: la strada è di sole frecce, e arriva a 23 (il tetto
  è 24 come per il cane, la strada si pensa più di quanto si tracci).
- **Una tappa è un posto largo nove celle**, non la stanza del trucco: cortili,
  fossati, stanze e strade che non portano da nessuna parte. Strette attorno alla
  soluzione uscivano minuscole, e non si capiva dove si stava.

## Le tappe

La colonna dice la strada più corta con la corona, misurata da
`node strumenti/passo-passo/guerriero.mjs`, che dice anche se la regola serve e
dove finiscono le trappole.

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
| **⚔️ Due alla volta** | *contro due non vince nessuno* | |
| 11. Due guardie | se ne prende una da parte | 15 |
| 12. Il giro | la strada di sopra porta a una sola | 14 |
| 13. La fila | si entra di fronte a una sola | 17 |
| 14. Due coppie | due volte di fila, sul ponte | 10 |
| 15. La sala del trono | il giro chiuso da una grata | 20 |
| **🏰 Il castello** | *tutto insieme* | |
| 16. Il fossato | il pulsante sull'isola: bisogna atterrarci | 7 |
| 17. Il masso sul pulsante | premerlo da lontano | 14 |
| 18. Scivolare via | sul ghiaccio non ci si ferma | 10 |
| 19. La buca segreta | le stanze unite dalle buche | 18 |
| 20. La torre | il fossato, le guardie, il ghiaccio | 20 |

**Ogni tappa con i nemici dichiara le sue `trappole`**: la mossa ingenua, che fa
almeno due passi e poi si ferma male. Nel gradino dei due, `serveLaRegola` guarda
che la strada vera sia più lunga di quella che si farebbe se due nemici valessero
uno; nel castello ogni tappa dichiara le `regole` del mondo che le servono.

Nei test: `unita/passo-passo-guerriero` (le regole su mappe piccole, la scena, la
strada, ogni tappa con le sue regole, le trappole e chi segue gli aiuti),
`integrazione/passo-passo-guerriero` (il selettore a tre, il lucchetto, una
vittoria, una caduta). Bersagli: il selettore `[data-scegli="guerriero"]`, da
chiuso `[data-serve-guerriero]`; le caselle `[data-strada="guerriero"]`.
