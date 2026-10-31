# La catena: le regole dell'albero

L'albero che va dal campo alla cosa finita è quello disegnato per la fattoria 2D (tolta il 31/10/2026): le ricette 3D hanno gli stessi
id, ingredienti e quantità ([merci-e-ricette.md](merci-e-ricette.md)), e i numeri vivono ancora nei dati 2D che la 3D legge
(`da2d/dati/coltivazioni.js`, `da2d/dati/mercato.js`). Qui le regole che li tengono contabili e il perché; da leggere prima di
toccare una ricetta, una resa o un mangime. Chi mangia cosa: [mangime-e-catena.md](mangime-e-catena.md).

## N → 1, e mai il contrario

**Un campo dà una cosa. Due grani danno un becchime. Due becchimi danno un uovo.** Non è bilanciamento, è *quanto costa capire*:
«quanti me ne servono» ha una risposta che si conta sulle dita. Provate rese da 2 a 5 e ricette che ne facevano 1 o 2: il conto si
spezzava in due divisioni col resto, si seminava a caso, e il numero grande faceva credere di essere ricchi. Ogni ricetta rende **un**
pezzo (`RESA`), e il campo a quattro tessere ne consegna uno in tutto ([livelli.md](livelli.md)).

A distinguere una ricetta dall'altra restano **quanto prende, quanto costa e quanto ci mette**. Per questo l'ovile chiede un foraggio
solo e la conigliera due: fanno la stessa lana, e quello che costa il doppio deve chiedere la metà.

## Ogni macchina è un mestiere

- **Un edificio è un mestiere che si riconosce a colpo d'occhio, con al massimo quattro ricette**: quattro tasti si leggono, nove sono
  un elenco. Il mulino macina, il fienile fa il secco, il pentolone il cotto, la cucina è dove le colture si incontrano. Il fienile ne
  ha cinque (il prato fiorito): è l'eccezione nota.
- **Tre mangimi, tre bocche** (oggi cinque, [cortile-e-pentolone.md](cortile-e-pentolone.md)). Con un mangime unico si coltiverebbe la
  coltura più conveniente e basta; così il grano resta la cosa delle galline e le zucche quella dei maiali: *ogni coltura ha la bocca
  che la mangia*.
- **Due strade per la stessa merce non sono una svista**: il foraggio viene dalle carote o dall'erba medica, che arriva dopo e costa la
  metà. Chi ha aspettato risparmia.
- **L'orto va in coppia**: una ricetta dell'orto prende due colture (2 melanzane + 1 peperone). In una pentola non va mai una cosa
  sola, e in coppia ogni coltura dice cosa seminare accanto.
- **Le bocche nuove danno roba che c'era già e non costano meno** di chi la faceva prima (un'anatra che facesse l'uovo a metà prezzo
  svaluterebbe il pollaio): guadagnano su **quanti campi e quanti passaggi**.

  | | costa | ci vuole | campi | passaggi |
  |:--|--:|--:|--:|--:|
  | 🥚 pollaio | 🪙5 | 36 min | 4 grano | 3 |
  | 🥚 anatre | 🪙5 | 33 min | 2 patate + 1 cavolfiore | 2 |
  | 🥛 stalla | 🪙5 | 36 min | 4 carote o erba | 3 |
  | 🥛 capre | 🪙6 | 42 min | 2 melanzane + 1 peperone | 2 |
  | 🧶 ovile | 🪙3 | 21 min | 2 carote o erba | 2 |
  | 🧶 alpaca | 🪙3 | 18 min | 2 carote o erba | 2 |

- **Il concime è l'unico anello che si chiude**: foraggio → asini → concime → fiori → api. Non è la strada più economica per i fiori:
  è quella che **non chiede l'orto**, e dà agli asini un mestiere onesto.
- **Quello che non si mangia ha un'altra uscita**: la lana paga la copertina, la torta la festa, il sapone il bagnetto delle bestie di
  casa ([bestie-di-casa.md](bestie-di-casa.md)).

## Le catene lunghe e le confluenze

| catena | fasi |
|:--|:--|
| il filo | erba → foraggio → lana → stoffa (telaio) → maglione (sartoria) → maglione alla lavanda (tintoria); e sciarpa, berretto |
| il pane | grano → farina (mulino) → pane (panificio); e pasta, biscotti, pizza, lasagne (pastificio) |
| il latte | latte → burro, formaggio (caseificio); e gelato, frullato (gelateria) |
| la torta | farina + uova + burro → torta (panificio) |
| la lavanda | lavanda → tintura (tintoria) → maglione alla lavanda, sapone (+ burro), sacchetto (+ stoffa) |
| lo zucchero | barbabietola → zucchero (zuccherificio) → caramelle, marmellata, gelato, biscotti |
| il pesce | pesce (la pesca: [geografia-e-pesca.md](geografia-e-pesca.md)) → fritto (friggitoria), sushi (+ riso, sushi bar) |

Contate sui dati, dodici colture su tredici avevano una bocca sola: un orto che non si usa. La regola, che `unita/coltivazioni`
(sezione 1b-bis) pretende da ogni coltura: **almeno due ricette** la prendono, **almeno una è a confluenza** (prende roba di due catene,
o porta a un prodotto che entra in un'altra ricetta), **almeno un cliente la chiede**, anche a valle. I **nodi di mezzo sono larghi**
(uova, latte, formaggio, farina, burro, miele, salsa, zucchero entrano in più ricette). La cima sono le lasagne (5 fasi), la pizza e il
maglione alla lavanda (6 fasi).

## Coltivare conviene della metà

Se coltivare costasse un quinto, dopo tre giorni nessuno comprerebbe più niente e la fattoria smetterebbe di bruciare monete. Chi vuole
dar da mangiare *adesso* compra; chi ha aspettato risparmia. `unita/coltivazioni` (sezione 8) confronta ogni pappa delle bestie di casa
con la stessa pancia comprata alla tariffa migliore e la vuole **fra il 35% e l'80%**, risalendo la catena da solo (`valoreDi`,
`minutiDi` in `da2d/dati/mercato.js`, sulla strada più economica con un campo e una macchina sola; `unita/mercato` li rifà esatti).

| pappa | costa e ci vuole | comprata | riempie |
|:--|--:|--:|--:|
| 🥣 mangime | 🪙3 · 14 min | 🪙5 | 30% |
| 🥚 uovo | 🪙5 · 33 min | 🪙7,5 | 45% |
| 🥛 latte | 🪙5 · 36 min | 🪙9 | 55% |
| 🍜 minestrone | 🪙4 · 28 min | 🪙8,3 | 50% |
| 🍞 pane | 🪙7 · 36 min | 🪙10 | 60% |
| 🍲 pappa di mais | 🪙7 · 30 min | 🪙12 | 70% |
| 🥧 merenda | 🪙8 · 84 min | — | 75% |
| 🧀 formaggio | 🪙10 · 82 min | 🪙14,2 | 85% |
| 🍄 tartufo (in 3D il maiale fa la pancetta) | 🪙9 · 60 min | 🪙15 | 90% |

La merenda non si compra: esiste solo coltivandola. Il formaggio costa zero al gesto (cagliare è un taglio a freddo): con 🪙1 starebbe
sul bordo. Il freno vero non è il prezzo: è **il tempo e quanti campi hai**.

## I controlli da non rompere

- **La catena ha un tetto solo**: `PROFONDITA` (8) in `da2d/dati/coltivazioni.js`, letta da chi la risale (`valoreDi`, `minutiDi`,
  `livelloDelProdotto`); `profonditaDi` misura la strada più corta di ogni merce, e un guasto scatta a due passi dal tetto. Provato un
  fondo per ogni conto: nessuno diventava rosso quando la catena si allungava, rispondevano `Infinity`. L'albero della 3D ha il suo
  (`dati/albero.js`).
- **Nessuna ricetta prima dei suoi ingredienti**: il livello di una ricetta è il più tardo fra lei, la sua macchina e gli ingredienti
  (`livelloDellaRicetta`, [livelli.md](livelli.md)). Un tasto spento per ore è indistinguibile da una cosa rotta.
- **Una voce nata prima del suo disegno dichiara in `aspetta` il pezzo** che il foglio porterà, e intanto usa l'emoji
  ([merci-e-ricette.md](merci-e-ricette.md)). Prima si decide l'albero, poi si disegna.

Nei test: `unita/coltivazioni`, `unita/mercato`, `unita/livelli-fattoria` (i dati 2D), `unita/fattoria3d-merci` (le ricette 3D contro
quelle).
