# La catena della produzione

L'albero che va dal campo alla cosa finita: le regole che lo tengono
contabile, i conti che lo misurano e i controlli che lo tengono fermo.
L'elenco delle macchine con le ricette sta in [macchine.md](macchine.md).

```
   campo  →  silo  →  macchina (mulino, fienile, pentolone)  →  recinto  →  prodotto
                                                              ↘  bottega  →  cosa finita
```

## N → 1, e mai il contrario

**Un campo dà una cosa. Due grani danno un becchime. Due becchimi danno un
uovo.** Non è bilanciamento, è *quanto costa capire*: «quanti me ne
servono» ha una risposta che si conta sulle dita. Provate rese da 2 a 5 e
ricette che ne facevano 1 o 2: il conto si spezzava in due divisioni col
resto, si seminava a caso, e il numero grande faceva credere di essere
ricchi. Ogni ricetta rende **un** pezzo (`RESA`), e tutto quello che si
aggiunge all'albero aggiunge, senza cambiarlo.

A distinguere una ricetta dall'altra restano **quanto prende, quanto costa
e quanto ci mette**: tre leve che si leggono sul tasto. Per questo l'ovile
chiede un foraggio solo e la conigliera due: fanno la stessa lana, e quello
che costa il doppio deve chiedere la metà — se no la seconda metà del
catalogo è inutile.

## Ogni macchina è un mestiere

- **Un edificio è un mestiere che si riconosce a colpo d'occhio, con al
  massimo quattro ricette.** Quattro tasti in un foglio si leggono, nove
  sono un elenco. **Il mulino macina** (mangime, pastone, farina), **il
  fienile fa il secco** (foraggi, becchime, fiorumi), **il pentolone fa il
  cotto** (beverone, zuppe, pastura), **la cucina è dove le colture si
  incontrano**. Il fienile ha cinque ricette da quando c'è il fiorume col
  concime: è l'eccezione nota, e spostarla sarebbe un'altra migrazione.
- **Tre mangimi, tre bocche.** Con un mangime unico si coltiverebbe la
  coltura più conveniente e basta; con tre, il grano resta la cosa delle
  galline e le zucche quella dei maiali. È la cosa che il gioco insegna:
  *ogni coltura ha la bocca che la mangia*.
- **Due strade per la stessa merce non sono una svista**: il foraggio
  viene dalle carote (col primo recinto) o dall'erba medica, che arriva
  sette livelli dopo e costa la metà. Chi ha aspettato risparmia.
- **L'orto va in coppia**: una ricetta dell'orto prende due colture (2 🍆 +
  1 🫑). In una pentola non ci va mai una cosa sola, e in coppia ogni
  coltura dice cosa seminare accanto — con una coltura per ricetta otto
  colture nuove avrebbero voluto otto merci in più nel silo.
- **Le bocche nuove danno roba che c'era già e non costano meno** di chi la
  faceva prima: un'anatra che facesse l'uovo a metà prezzo svaluterebbe il
  pollaio. Guadagnano su **quanti campi e quanti passaggi**:

  | | costa | ci vuole | campi | passaggi |
  |:--|--:|--:|--:|--:|
  | 🥚 pollaio | 🪙5 | 36 min | 4 🌾 | 3 |
  | 🥚 anatre | 🪙5 | 33 min | 2 🥔 + 1 🥦 | 2 |
  | 🥛 stalla | 🪙5 | 36 min | 4 🥕/🌿 | 3 |
  | 🥛 capre | 🪙6 | 42 min | 2 🍆 + 1 🫑 | 2 |
  | 🧶 ovile | 🪙3 | 21 min | 2 🥕/🌿 | 2 |
  | 🧶 alpaca | 🪙3 | 18 min | 2 🥕/🌿 | 2 |

  Le capre peggiorano due colonne e ne migliorano due: è la scelta fra
  tempo e spazio, e da lì in poi manca quasi sempre lo spazio.
- **Il concime è l'unico anello che si chiude**: 🌰 becchime → 🫏 asini → 💩
  concime → 🌼 fiori (col fieno) → 🐝 api. Non è la strada più economica
  per i fiori (🪙6 e 47 min contro 🪙2 e 22 del fiorume di cipolle e aglio):
  è quella che **non chiede l'orto**. Gli asini non danno da mangiare a
  nessuno, e senza un mestiere onesto sarebbe stato meglio non metterli.
  Cipolle e aglio lasciati fiorire per le api è una cosa che si fa davvero.
- **Quello che non si mangia ha un'altra uscita.** La lana paga la
  copertina (coccola del pelo), la torta la festa (coccola del gioco: il
  compleanno del cane, riempie tutta la barra), il sapone il bagnetto.
  Sono coccole pagate col granaio (`da:` in `dati/bisogni.js`, al posto di
  `prezzo`: o l'uno o l'altro, mai tutti e due).

## Le catene lunghe

Dopo i recinti vengono le botteghe, che prendono quello che esce da
un'altra macchina e lo portano un gradino più su (tutto in dispensa):

| catena | fasi |
|:--|:--|
| il filo | 🌿 erba → 🥬 foraggio → 🧶 lana → 🧵 stoffa (telaio) → 🧥 maglione (sartoria) → 💜 maglione alla lavanda (tintoria); e 🧣 sciarpa, 🧢 berretto |
| il pane | 🌾 grano → farina (mulino) → 🍞 pane (panificio); e pasta, biscotti, pizza, lasagne (pastificio) |
| il latte | 🥛 latte → 🧈 burro · 🧀 formaggio (caseificio); e gelato, frullato (gelateria) |
| la torta | farina ✚ 🥚 uova ✚ 🧈 burro → 🎂 torta (panificio) |
| la lavanda | 💐 lavanda → 🫙 tintura (tintoria) → 💜 maglione alla lavanda · 🧼 sapone (✚ burro) · sacchetto (✚ stoffa) |
| lo zucchero | 🟣 barbabietola → zucchero (zuccherificio) → caramelle, marmellata, gelato, biscotti |
| il pesce | 🌰 becchime → 🐟 pesce (peschiera) → fritto (friggitoria), sushi (✚ 🍚 riso, sushi bar) |

## Le confluenze

Contate sui dati, dodici colture su tredici avevano una bocca sola: un
orto che non si usa, perché si semina quella cosa e basta. La regola, che
`unita/coltivazioni` (sezione 1b-bis) pretende da ogni coltura:

- **almeno due ricette** la prendono;
- **almeno una è a confluenza** — prende roba di due catene diverse — o
  porta a un prodotto che entra in un'altra ricetta;
- **almeno un cliente la chiede**, anche a valle: l'erba non la compra
  nessuno, ma diventa lana, e la lana la vuole la sarta.

È il mestiere della cucina (minestrone, polenta, conserva, salsa), della
crostata e del sacchetto profumato. E i **nodi di mezzo devono essere
larghi**, come in Hay Day: uova, latte, formaggio, farina, burro, miele,
salsa e zucchero entrano in più ricette ciascuno. La cima dell'albero sono
le **lasagne** (5 fasi, 29 gesti: grano, uova, orto e stalla insieme), la
**pizza** (20) e il **maglione alla lavanda** (6 fasi, 23 gesti).

## Coltivare conviene della metà

Il numero su cui sta in piedi tutto: se coltivare costasse un quinto, dopo
tre giorni nessuno comprerebbe più niente e la fattoria smetterebbe di
bruciare monete. Chi vuole dar da mangiare *adesso* compra; chi ha
aspettato risparmia. `unita/coltivazioni` (sezione 8) confronta ogni pappa
con la stessa pancia comprata alla tariffa migliore (🪙16,7 la pancia
intera) e la vuole **fra il 35% e l'80%**, risalendo la catena da solo.

| pappa | costa e ci vuole | comprata | riempie |
|:--|--:|--:|--:|
| 🥣 mangime | 🪙3 · 14 min | 🪙5 | 30% |
| 🥚 uovo | 🪙5 · 33 min | 🪙7,5 | 45% |
| 🥛 latte | 🪙5 · 36 min | 🪙9 | 55% |
| 🍜 minestrone | 🪙4 · 28 min | 🪙8,3 | 50% |
| 🍞 pane | 🪙7 · 36 min | 🪙10 | 60% |
| 🍲 pastone | 🪙7 · 30 min | 🪙12 | 70% |
| 🥧 merenda | 🪙8 · 84 min | — | 75% |
| 🧀 formaggio | 🪙10 · 82 min | 🪙14,2 | 85% |
| 🍄 tartufo | 🪙9 · 60 min | 🪙15 | 90% |

I conti li fanno `valoreDi` e `minutiDi` (`dati/mercato.js`) sulla strada
più economica, con un campo e una macchina sola. La merenda non si compra:
esiste solo coltivandola. Il formaggio costa zero al gesto (cagliare è un
taglio a freddo): con 🪙1 sarebbe al 78%, sul bordo. Il minestrone costa
davvero **tre campi liberi nello stesso momento**. Le bocche dell'orto
hanno accorciato i minuti di uovo e tartufo senza cambiarne il prezzo, ed è
quello che devono fare.

Il freno vero non è il prezzo: è **il tempo e quanti campi hai**.
L'attrezzatura si paga prima, in monete grosse (strutture 🪙95–360), cioè la
catena dà un motivo per spendere, non è il modo di smettere.

## I tre controlli da non rompere

- **La catena ha un tetto solo**: `PROFONDITA` (8) in
  `dati/coltivazioni.js`, letta dai quattro conti che la risalgono —
  `valoreDi`/`minutiDi` (`dati/mercato.js`), `livelloDelProdotto`
  (`dati/livelli.js`), `Fattoria.ottenibile` (`motore/fattoria.js`) e il
  consiglio. `profonditaDi` misura la strada più corta di ogni merce, e un
  guasto scatta a due passi dal tetto. Provato un fondo per ogni conto
  (5, 4, 4, 5): nessuno diventava rosso quando la catena si allungava,
  rispondevano `Infinity`, cioè una stoffa che non si ordina mai. Un
  numero copiato in quattro file è il modo in cui il quinto dimentica di
  alzarlo.
- **«A cosa serve» si chiede a `dati/usi.js`**, che vede tutte le uscite:
  ricette, ciotola, coccole (da `bisogni.js`), ordini del mercato e
  botteghe del paese. `bisogni.js` ne vede tre e non può importare le
  altre senza un anello (`mercato.js` → `livelli.js` → `animali.js` →
  `bisogni.js`). Senza gli ordini la stoffa risultava «non serve a
  niente». Torna righe di dato, la frase la compone la vista.
- **Una voce nata prima del suo sprite dichiara in `aspetta` il pezzo** che
  il foglio porterà, e intanto usa un ripiego. `guastiDelCatalogo` e
  `guastiDelleColture` diventano rossi il giorno che il pezzo c'è e la riga
  non l'ha preso (vedi [sprite.md](sprite.md)). Prima si decide l'albero,
  poi si generano gli sprite.

Gli altri guasti che il lavoro sull'albero tocca: `guastiDegliSblocchi`
(una macchina non arriva prima del suo primo lavoro, una ricetta non prima
degli ingredienti — vale anche per le botteghe, che arrivano con almeno tre
merci consegnabili), `guastiDelCatalogo` (una macchina senza ricette),
`guastiDeiBisogni`/`guastiDegliUsi` (una merce che non serve a niente).

## Il prossimo passo risale la catena

`motore/consiglio.js` cerca un passo che si può fare oggi:

```
   manca il becchime
     → serve il fienile: non ce l'hai     → «compra il fienile 🪙150»
     → ce l'hai ma ha roba da ritirare    → «ritira quello che ha fatto»
     → ce l'hai ma sta lavorando          → «pronto fra 4 min»
        …e se ci mette parecchio          → «fanne un altro 🪙150»
     → è libero, ma mancano 3 🌾          → la stessa domanda al grano
         → hai un campo libero            → «seminaci del grano»
         → i campi sono tutti occupati    → «fanne un altro 🪙22»
         → non hai campi                  → «ti serve un campo 🪙22»
         → non hai il silo                → «prima ti serve il silo 🪙120»
```

Sa distinguere quello che arriva più avanti («arriva al livello 10»),
quello che aspetta nei premi («ti aspetta nei premi», col tasto) e quello
da comprare. Insegna la catena, non tutti i posti dove portarla: di
botteghe e mongolfiera non sa niente, ed è deciso.
