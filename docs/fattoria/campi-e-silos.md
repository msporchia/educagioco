# I campi e i silos

Dove comincia la catena: cosa fa un campo, quanto costa, e come i silos
tengono il raccolto. I numeri stanno in `dati/coltivazioni.js` e
`dati/catalogo.js`.

## I campi

- **Un campo si semina, cresce col tempo vero e si raccoglie.** Nacque
  perché i bambini dicevano «non posso fare nulla oltre a posizionare».
- **Sette stati che si vedono**, dai semi al maturo: il tempo è vero, e in
  dieci minuti deve succedere qualcosa a ogni occhiata, se no il campo
  sembra fermo e non ci si torna.
- **Si vede che l'hai seminato.** Un campo comprato è terra nuda; seminato
  diventa un'aiuola col bordo e i semi sopra. Provato il primo stato
  «niente»: per un settimo della crescita un campo seminato era identico a
  uno vuoto, e non si capiva se seminare avesse funzionato.
- **Un campo rende uno** (`RESA = 1`, `guastiDelleColture` rifiuta il
  resto): il perché è la regola N → 1 in [catena.md](catena.md).
- **Seminare è gratis, si paga raccogliendo** (🪙1). Farsi pagare due volte
  un pezzo solo lo renderebbe più caro che comprarlo. Chi è a zero monete
  non perde il raccolto: il campo lo aspetta.
- **Il campo rincara a ogni copia**: 🪙22, 35, 48, 62, 75… È la cosa che
  moltiplica tutto il resto, e a prezzo fisso l'unica strategia sarebbe
  comprare campi finché c'è terra. Il rincaro è **lineare** (`cresce`,
  `RINCARO` in `dati/catalogo.js`) e non geometrico: provato 1,45× a
  copia, è la curva esponenziale bocciata anche sui silos. Conta quelli in
  mappa **e** nel baule, se no metterli via e ricomprarli sarebbe il modo
  di non pagarlo. Vale per tutto quello che produce: due conigliere fanno
  il doppio della lana.
- **I minuti di una ricetta sono quelli di un campo solo**: chi ne ha tre
  li divide per tre, ed è per questo che il secondo campo è la spesa che
  cambia di più la giornata.

### Le colture

| coltura | min | liv | | coltura | min | liv |
|:--|--:|--:|:--|:--|--:|--:|
| 🌾 grano | 5 | 1 | | 🍅 pomodori | 8 | 33 |
| 🥕 carote | 6 | 5 | | 🍆 melanzane | 9 | 39 |
| 🌽 mais | 8 | 11 | | 🫑 peperoni | 7 | 39 |
| 🌿 erba medica | 4 | 13 | | 🧅 cipolle | 6 | 44 |
| 🥔 patate | 7 | 22 | | 🧄 aglio | 12 | 44 |
| 🥦 cavolfiori | 9 | 22 | | 🍓 fragole | 11 | 50 |
| 🎃 zucche | 10 | 27 | | 💐 lavanda | 9 | 54 |
| 🟣 barbabietola | 10 | 30 | | 🍚 riso | 12 | 60 |

Una coltura può arrivare **prima della bocca che la mangia**, perché
intanto la chiede il banco del mercato: la bocca arriva entro tre livelli
(`unita/coltivazioni`). Il campo si chiama `orto` nel catalogo: l'id è
quello della decorazione che c'era prima, e chi l'aveva la ritrova utile.

**I campi non girano e i cartelli non si specchiano**: i sette stadi hanno
il bordo dell'aiuola dipinto nello stesso ritaglio della pianta (girati, il
grano si corica), e i cartelli hanno parole dipinte sopra («Carote»,
«Erba medica») che allo specchio non dicono più niente.

## I silos

- **Ogni merce ha il suo scomparto.** Uno scomparto nuovo tiene **8
  pezzi** (`SCOMPARTO_BASE`), ogni ingrandimento aggiunge 2 a **tutti gli
  scomparti insieme** (`SCOMPARTO_PIU`). Otto sono quattro giri di una
  ricetta da due: abbastanza per non contare, poco abbastanza perché chi
  semina sempre e non trasforma mai trovi lo scomparto colmo — che è il
  momento in cui il gioco insegna il resto della catena.
- **Perché non posti in comune.** Provati dodici posti condivisi: un
  bambino non alterna le colture, e 32 di mais e 4 di carote tappavano il
  silo senza che niente fosse andato storto. Con gli scomparti il mais non
  può mangiarsi il posto delle carote, per costruzione. E provato anche il
  contrario, un tetto per prodotto a 90: invisibile, non mordeva mai. La
  differenza è tutta lì — questo è visibile e piccolo.
- **Si disegna**: una barretta per merce, `🌽 7/8`. Le barrette vuote si
  vedono: uno scomparto a zero è il posto dove potrebbe andare qualcosa.
- **L'ingrandimento costa `40 + 130·ln(1+n)`**, arrotondato a cinque:
  🪙40, 130, 185, 220, 250, 275… (`costoIngrandimento`). Logaritmica
  perché le monete arrivano sempre allo stesso ritmo e lo sforzo riparte
  da zero a ogni passo: provata l'esponenziale, 28 posti chiedevano
  centoundici ore di esercizi. Così il salto vero è il secondo, poi ogni
  ingrandimento costa più o meno un'ora, e 28 posti ne costano 7.
- **Il silo è `unico`: uno in mappa**, e si potenzia invece di
  raddoppiarsi. Un secondo silo uguale non conterrebbe niente di più, e un
  doppione non si vende affatto. «Uno solo» vuol dire **in mappa**: un
  silo messo via torna sul prato.
- **Senza il silo la capienza è zero**, non poca: non si raccoglie e non
  si paga, e il campo resta pronto. La scheda di un campo lo dice **prima
  di seminare**, l'unico momento utile.
- **Nessuna coltura rende più di quanto tenga uno scomparto nuovo**, se no
  chiederebbe un ingrandimento prima del primo raccolto:
  `unita/coltivazioni` scrive una nota se qualcuno sfora.

### Tre silos, e cosa va dove

```
   🌾 silo del raccolto  🪙120  liv 1    le colture
   🥛 silo della stalla  🪙120  liv 4    mangimi e pappe, uova, latte,
                                         lana, tartufi, miele, concime, pesce
   📦 dispensa           🪙120  liv 16   quello che esce dalle botteghe
```

- **Il rosso è dei campi, il bianco è degli animali** — quello che
  mangiano e quello che danno. Provato il criterio «da dove viene»: il
  mangime «veniva dalla terra», vero e invisibile a chi gioca.
- **Il mulino prende dal silo rosso e mette nel bianco**: macinare libera
  tre posti invece di uno, ed è la valvola del silo che si tappa.
- **La dispensa** (`silo: 'bottega'`, catalogo `dispensa`) tiene quello
  che esce dalle botteghe, che non viene né da un campo né da una bestia.
  **Le merci non cambiano mai silo**: una merce che cambia famiglia si
  troverebbe a capienza zero in un salvataggio dove la famiglia nuova non
  è costruita. Per lo stesso motivo la farina non può stare nel silo rosso
  (test 5b di `unita/coltivazioni`: nel raccolto tutte e sole le colture).
- Un silo pieno non blocca l'altro, uno scomparto pieno non blocca gli
  altri.

### Cosa si vede dentro

- **Si guarda toccando il silo** (`viste/Granaio.vue`), non da una
  linguetta del baule: lì finiva in mezzo alle cose da comprare, e
  sembrava una schermata del gioco invece del contenuto di una cosa
  costruita. Dal silo **non esce niente con le dita**: si guarda e si
  ingrandisce.
- **Solo le merci ottenibili adesso** — una coltura già presa, una ricetta
  che si può davvero fare — più quelle di cui si ha ancora roba. Provato
  il contrario: al primo raccolto di grano il silo elencava latte, uova e
  tartufi, cioè raccontava in anticipo tutta la scaletta.
- **Premere una roba dice chi la usa**: «🌾 Grano — 3 nel mulino (5 min) →
  2 🥣 mangime · …», e sotto il tasto 🌳 **Come si fa**
  ([pagina-albero.md](pagina-albero.md)). È il modo in cui la catena si
  scopre da dentro. La frase la compone la vista, i dati vengono da
  `dati/usi.js`.
