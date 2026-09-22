# 🌳 L'albero della produzione — progetto

> **Stato: fatte le tappe da 0 a 7, meno la coda (8)** — dal 22 settembre
> 2026. Nel gioco ci sono le fondamenta (`PROFONDITA`, `dati/usi.js`, la
> dispensa), il telaio e la stoffa, il panificio col pane e la farina, lo
> sdoppiamento del fienile, la sartoria col maglione, la pagina
> dell'albero, **il caseificio con burro, formaggio e torta** (4) e **la
> lavanda con la tintoria** (7): tintura, maglione alla lavanda, sapone.
> Manca la coda (8) — sciarpa e berretto — e mancano **tutti gli
> sprite**: ogni voce nata qui dichiara in `aspetta` il pezzo che il
> foglio le porterà e usa intanto un ripiego; l'elenco completo, da
> spuntare, è in §6. Le tre decisioni in fondo sono state prese: sì al
> terzo magazzino, sì allo sdoppiamento, sì alla merenda nel panificio.
>
> Due scostamenti dal progetto, tutti e due presi strada facendo e
> scritti in §1b:
>
> - **il maglione alla lavanda è una merce e non un addobbo** (la
>   tintoria prende un maglione e ne rende un altro; chi lo vuole è la
>   sarta al banco);
> - **c'è una macchina in più che il progetto non aveva: la cucina** (al
>   24), nata da un conto fatto sui dati veri — dodici colture su tredici
>   avevano una bocca sola. Con lei ogni coltura ha due sbocchi e almeno
>   uno che la mescola con un'altra catena, e la regola adesso è scritta
>   in un test.
>
> È la progettazione dell'albero a più fasi della [fattoria](fattoria.md):
> prima si decide l'albero, poi si generano gli sprite giusti — l'inverso di
> come è andata finora, dove i fogli arrivavano «a caso» e i dati si
> adattavano. I numeri stanno sulla scala di
> [`CALIBRAZIONE.md`](../CALIBRAZIONE.md) e non la ripetono.

## Da dove si parte

Oggi la catena più lunga è lunga cinque passaggi (grano → becchime →
concime → prato fiorito → miele → merenda) e ogni ricetta è N → 1. Tre cose
non tornano:

- **due macchine fanno troppo.** Il fienile ha *nove* ricette (due
  foraggi, il becchime, due zuppe, il beverone, la pastura, due fiorumi) e
  il mulino tre, di cui una — «Fragole al miele» — non è una macinatura;
- **la lana finisce in una copertina**, e fra la lana e un vestito non c'è
  niente: l'unico prodotto che non si mangia ha un'uscita sola;
- **sopra il livello 47 non arriva più niente che lavori** — ventidue
  livelli di decorazioni, cioè la coda del gioco in cui chi ha imparato la
  catena non ha più niente da imparare.

Due regole che restano: **gli id non si rinominano** (sono le chiavi del
granaio nei salvataggi) e **N → 1** (`RESA`), quindi tutto quello che segue
*aggiunge* e nessuna ricetta rende più di un pezzo.

## 1. L'albero

### Le fasi

Cinque catene nuove che si intrecciano con quelle di oggi. Ogni riga è una
fase; il ✚ segna dove due rami si incontrano.

| catena | fasi | dove si incontra |
|:--|:--|:--|
| **Il filo** | 🌿 erba → 🥬 foraggio (fienile) → 🧶 lana (ovile) → 🧵 stoffa (**telaio**) → 🧥 maglione (**sartoria**) → 💜 maglione alla lavanda (**tintoria**) | ✚ con la tintura |
| **Il pane** | 🌾 grano → 🌾 farina (mulino) → 🍞 pane (**panificio**) | — (è la corta) |
| **La torta** | farina ✚ 🥚 uova (grano → becchime → pollaio) ✚ 🧈 burro → 🎂 torta (**panificio**) | ✚ tre rami |
| **Il latte** | 🌿 erba → foraggio → 🥛 latte (stalla) → 🧀 formaggio · 🧈 burro (**caseificio**) | il burro entra nella torta e nel sapone |
| **La lavanda** | 💐 lavanda → 🫙 tintura (**tintoria**) → 💜 maglione alla lavanda ✚ 🧼 sapone (tintura ✚ burro) | ✚ col filo e col latte |

E in coda, senza edifici nuovi: 🧣 **sciarpa** (stoffa ✚ lana, sartoria) e
🧢 **berretto** (stoffa, sartoria), che riempiono gli ultimi livelli con una
ricetta ciascuno.

### Il grafo

```
   🌿 erba ──2──▶ 🥬 foraggio ──1──▶ 🐑 ovile ──▶ 🧶 lana ──2──▶ 🧵 stoffa ──2──▶ 🧥 maglione ──1──┐
                      │                                        (telaio)        (sartoria)        │
                      └──2──▶ 🐄 stalla ──▶ 🥛 latte ──2──▶ 🧀 formaggio   (caseificio)          │
                                              └──1──▶ 🧈 burro ──────────────────────┐          │
   💐 lavanda ──2──▶ 🫙 tintura (tintoria) ──┬──────────────────────────────────────┼──▶ 🧼 sapone
                                            └────────────────────────────────────────┼──▶ 💜 maglione alla lavanda
   🌾 grano ──2──▶ 🌾 farina (mulino) ──2──▶ 🍞 pane (panificio)                    │
                      └──2 farina ✚ 1 uova ✚ 1 burro ──▶ 🎂 torta (panificio) ◀─────┘
   🌾 grano ──2──▶ 🌰 becchime ──2──▶ 🐔 pollaio ──▶ 🥚 uova ─┘
   🧵 stoffa ✚ 🧶 lana ──▶ 🧣 sciarpa (sartoria)      🧵 stoffa ──▶ 🧢 berretto (sartoria)
```

Il resto dell'albero (le dieci bocche, l'orto, le coppie, il concime) resta
com'è: [`fattoria.md`](fattoria.md#lorto-e-le-cinque-bocche-nuove-dal-15-settembre-2026).

### Le merci nuove, e dove finiscono

Il rosso è dei campi, il bianco è degli animali — e niente di questo esce da
un campo o da una bestia. Quindi **un terzo magazzino**, la 📦 **dispensa**
(`silo: 'bottega'`, catalogo `dispensa`, 🪙120, `unico`, livello 14): tiene
quello che esce dalle botteghe. Le merci di oggi non si spostano di silo —
un prodotto che cambia famiglia si troverebbe a capienza zero in un
salvataggio dove la famiglia nuova non è costruita.

| id | nome | emoji | silo | esce da | serve a |
|:--|:--|:--|:--|:--|:--|
| `farina` | Farina | 🌾 | bottega | mulino | pane, torta |
| `pane` | Pane | 🍞 | bottega | panificio | **cibo** (0,60 di pancia), fornaio, maestra |
| `torta` | Torta | 🎂 | bottega | panificio | **coccola** «Festa» (gioco, 1,0), pasticcera |
| `burro` | Burro | 🧈 | bottega | caseificio | torta, sapone, pasticcera |
| `formaggio` | Formaggio | 🧀 | bottega | caseificio | **cibo** (0,85), cuoco, oste |
| `stoffa` | Stoffa | 🧵 | bottega | telaio | maglione, sciarpa, berretto, sarta |
| `maglione` | Maglione | 🧥 | bottega | sartoria | sarta (oggi); **addobbo** (schiena) con gli sprite, tintoria |
| `lavanda` | Lavanda | 💐 | **terra** | campo (coltura) | tintura, lavandaia |
| `tintura` | Tintura | 🫙 | bottega | tintoria | maglione alla lavanda, sapone |
| `maglione_lavanda` | Maglione alla lavanda | 💜 | bottega | tintoria | **addobbo** (schiena), sarta |
| `sapone` | Sapone | 🧼 | bottega | tintoria | **coccola** «Bagnetto» (pelo, 1,0), lavandaia |
| `sciarpa_lana` | Sciarpa di lana | 🧣 | bottega | sartoria | **addobbo** (collo), sarta |
| `berretto` | Berretto | 🧢 | bottega | sartoria | **addobbo** (testa), sarta |

Tre uscite nuove per una merce, oltre alla ciotola e al banco del
mercato, e sono la ragione per cui l'albero regge: **un addobbo pagato col
granaio** (`da: 'maglione'` al posto di `prezzo`, come già fa la copertina
fra le coccole — la prima cosa da *indossare* che si coltiva: c'è stata un
giorno, e torna quando il maglione sarà uno sprite e non un'emoji sulla
schiena di un cane), una **coccola che fa festa** (la torta riempie la
voglia di giocare: è il compleanno del cane) e il **bagnetto** col sapone. `sciarpa_lana` e non `sciarpa`, perché
`sciarpa` è già l'addobbo comprato a 🪙14: sono due cose, una si compra e
una si tesse.

## 1b. Le confluenze, e la cucina (aggiunta il 22 settembre 2026)

*Non stava nel progetto*, ed è venuta da un conto fatto sui dati veri:
contando, per ogni coltura, le ricette che la prendono e i mestieri che
la chiedono, **dodici colture su tredici avevano una bocca sola** — e
quasi sempre una bocca che prendeva solo lei. Il mais ne aveva una (il
pastone) e nessun cliente al banco.

Una bocca sola non è un bilanciamento sbagliato: è un orto che non si
usa. Se una coltura serve a una cosa e basta, si semina quella cosa lì e
il resto del campo non si tocca — mentre quello che rende vivo un orto è
che due cose diverse, insieme, ne facciano una terza.

La regola, che adesso è un test (`unita/coltivazioni`, sezione 1b-bis):

- **almeno due ricette** prendono ogni coltura;
- **almeno una è a confluenza** — prende roba di due catene diverse — o
  porta a un prodotto che a sua volta entra in un'altra ricetta;
- **almeno un cliente** la chiede, anche *a valle*: l'erba medica non la
  compra nessuno, ma diventa lana, e la lana la vuole la sarta.

**La cucina** (🍳, `cucina`, 🪙210, livello 24, `cresce: RINCARO`) è la
macchina dove le colture si incontrano: quattro ricette, tutte a
confluenza, e nessuna che prenda meno di due ingredienti.

| ricetta | liv | prende | costo · min |
|:--|--:|:--|:--|
| `minestrone` | 24 | 1 patate + 1 carote + 1 cavolfiori | 🪙1 · 6 |
| `polenta` | 24 | 2 mais + 1 formaggio | 🪙1 · 8 |
| `conserva` | 33 | 1 melanzane + 1 peperoni + 1 zucche | 🪙1 · 7 |
| `salsa` | 38 | 2 pomodori + 1 cipolle + 1 aglio | 🪙1 · 6 |

E due ricette nelle botteghe che c'erano già, per le due colture che
restavano fuori:

| ricetta | dove | liv | prende | costo · min |
|:--|:--|--:|:--|:--|
| `crostata` | panificio | 44 | 1 farina + 1 fragole + 1 burro | 🪙2 · 7 |
| `sacchetto` | tintoria | 52 | 2 lavanda + 1 stoffa | 🪙1 · 5 |

**Il minestrone è l'unica pappa delle sei** (0,50 di pancia, 🪙4 contro
🪙8,3 comprata: il 48%): le altre costano più di quanto una ciotola
possa valere — la polenta 🪙15, cioè quasi il doppio del tetto — e il
loro sbocco è il banco. Il prezzo vero del minestrone non sono le
quattro monete: sono **tre campi liberi nello stesso momento**.

Gli sbocchi, prima e dopo:

| coltura | prima | dopo |
|:--|:--|:--|
| grano | mangime, becchime, farina | *invariata* |
| erba | foraggio, prato fiorito | *invariata* |
| carote | foraggio di carote | + minestrone |
| mais | pastone | + polenta |
| zucche | zuppa | + conserva |
| patate | beverone | + minestrone |
| cavolfiori | beverone | + minestrone |
| pomodori | zuppa d'orto | + salsa |
| melanzane | pastura | + conserva |
| peperoni | pastura | + conserva |
| cipolle | fiorume | + salsa |
| aglio | fiorume | + salsa |
| fragole | merenda | + crostata |
| lavanda | tintura | + sacchetto |

Con queste, **14 ricette su 38 mettono insieme due catene o più**.

## 2. Gli edifici

Il criterio: **un edificio = un mestiere che si riconosce a colpo
d'occhio**, e nessun edificio con più di quattro ricette. Il numero non è
estetico: quattro tasti in un foglio si leggono, nove sono un elenco.

### Quelli che si sdoppiano

- **Il mulino macina e basta.** Tiene mangime, pastone e prende la farina;
  «Fragole al miele» **passa al panificio** (stesso id `merenda`, stesso
  `liv: 44`, cambia solo `dove`). Chi ha il mulino oltre il 44 e non il
  panificio la ritrova quando lo compra, e il consiglio glielo dice («la
  merenda si fa nel panificio, che non hai»). È l'unica migrazione di
  comportamento del piano, e va confermata.
- **Il fienile fa il secco, il pentolone fa il cotto.** Restano nel fienile
  i tagli a freddo — i due foraggi, il becchime, i due fiorumi (cinque);
  vanno nel **pentolone** (`pentolone`, «Cucina del cortile») le quattro
  cose che si scaldano: beverone, zuppa, zuppa d'orto, pastura. Arriva al
  22 col beverone, cioè quando la prima ricetta cotta compare oggi. Costo
  per chi ha già la fattoria di ieri: chi è oltre il 22 con la zuppa nel
  fienile deve comprare il pentolone (🪙150) per farla ancora — la zuppa
  già in silo resta. Da confermare.

### Quelli nuovi

Prezzi nella fascia «una struttura» (🪙150–360, mai sopra le due ore),
tutti con `cresce: RINCARO` come il mulino. Il `piede` è quello che
`piedeDalDisegno` ricava da un disegno largo 4 celle e alto più di due e
mezzo: **[4, 2]**, come il fienile. L'emoji è provvisoria, il `pezzo`
arriva col foglio (§6).

| id | nome | emoji | liv | 🪙 | piede | ricette (prende → fa · costo · min) |
|:--|:--|:--|--:|--:|:--|:--|
| `dispensa` | Dispensa | 📦 | 14 | 120 | [2, 1] | (magazzino, `unico`) |
| `telaio` | Telaio | 🧵 | 14 | 170 | [4, 2] | `stoffa`: 2 lana → 1 stoffa · 🪙1 · 8 min |
| `panificio` | Panificio | 🍞 | 16 | 180 | [4, 2] | `pane`: 2 farina → 1 pane · 🪙1 · 6 min · `torta` (liv 20): 2 farina + 1 uova + 1 burro → 1 torta · 🪙2 · 8 min · `merenda` (liv 44, spostata) |
| `caseificio` | Caseificio | 🧀 | 20 | 200 | [4, 2] | `burro`: 1 latte → 1 burro · 🪙1 · 5 min · `formaggio`: 2 latte → 1 formaggio · 🪙0 · 10 min |
| `pentolone` | Cucina del cortile | 🍲 | 22 | 150 | [3, 2] | beverone, zuppa, zuppa_orto, pastura (spostate, stessi numeri) |
| `sartoria` | Sartoria | 🧥 | 36 | 250 | [4, 2] | `maglione`: 2 stoffa → 1 · 🪙2 · 10 min · `sciarpa_lana` (liv 58): 1 stoffa + 1 lana → 1 · 🪙1 · 6 min · `berretto` (liv 64): 1 stoffa → 1 · 🪙1 · 5 min |
| `tintoria` | Tintoria | 💜 | 52 | 300 | [4, 2] | `tintura`: 2 lavanda → 1 · 🪙1 · 5 min · `maglione_lavanda`: 1 maglione + 1 tintura → 1 · 🪙1 · 6 min · `sapone`: 1 tintura + 1 burro → 1 · 🪙1 · 5 min |

E nel mulino: `farina` (liv 16): 2 grano → 1 farina · 🪙1 · 5 min. Non
prima: farina senza panificio è roba che riempie la dispensa e non serve.

**Perché `panificio` e non `forno`.** `forno` è già la decorazione «Forno a
legna» da 🪙75, e la regola delle arnie contro l'apiario vale anche qui:
quando il disegno è lo stesso si riusa l'id (l'orto, il carretto, il
fienile, il mercato), quando si ha un disegno apposta si fa una voce
nuova. Un panificio che lavora vuole il suo disegno e il suo prezzo.

**La coltura nuova**: `lavanda`, liv 52, semina 0, raccolta 1, 9 minuti,
sette stadi (`campo_lavanda0..6`), silo del raccolto. Arriva con la
tintoria, che è la bocca che la mangia, come vuole la sezione 1b di
`unita/coltivazioni`.

### Dove cadono nei livelli

```
   14  Il telaio        telaio, dispensa, stoffa
   16  Il panificio     panificio, farina (mulino), pane
   20  Il caseificio    caseificio, burro, formaggio, torta
   22  Le anatre        + il pentolone (lo sdoppiamento)
   36  La sartoria      sartoria, maglione
   44  Le fragole       la merenda, adesso nel panificio
   52  La lavanda       lavanda, tintoria, tintura, maglione alla lavanda, sapone
   58  La sciarpa       una ricetta nella sartoria
   64  Il berretto      una ricetta nella sartoria
```

Con questi, fra due cose che lavorano non passano mai più di sei livelli
(prima: ventidue, dal 47 alla fine). I nomi vanno in `NOMI` di
`dati/livelli.js`; il 14, il 16 e il 20 riempiono i buchi 13–17 e 19–21
della prima metà.

## 3. La calibrazione

### Il conto per due catene intere

`valoreDi` prende sempre la strada più economica e somma i costi dei gesti;
`minutiDi` somma i minuti con un campo e una macchina sola.

**Il maglione alla lavanda** (la catena più lunga, sei fasi):

| fase | valore | minuti |
|:--|--:|--:|
| 🌿 erba (campo) | 1 | 4 |
| 🥬 foraggio = 2·1 + 0 | 2 | 5 + 8 = 13 |
| 🧶 lana (ovile) = 1·2 + 1 | 3 | 8 + 13 = 21 |
| 🧵 stoffa = 2·3 + 1 | 7 | 8 + 42 = 50 |
| 🧥 maglione = 2·7 + 2 | 16 | 10 + 100 = 110 |
| 💐 lavanda (campo) → 🫙 tintura = 2·1 + 1 | 3 | 5 + 18 = 23 |
| 💜 maglione alla lavanda = 16 + 3 + 1 | **20** | 6 + 110 + 23 = **139** |

Un ordine da un maglione alla lavanda rende ⭐ 6 + 4·20 = 86, e chiede due
ore e venti di fattoria con un campo solo. Il tetto è 6·139 = 834: lontano.

**La torta** (tre rami che si incontrano):

| fase | valore | minuti |
|:--|--:|--:|
| 🌾 farina = 2·1 + 1 | 3 | 5 + 10 = 15 |
| 🥚 uova (grano → becchime → pollaio, come oggi) | 5 | 36 |
| 🧈 burro = 1·5 + 1 (latte 5, 36 min) | 6 | 5 + 36 = 41 |
| 🎂 torta = 2·3 + 5 + 6 + 2 | **19** | 8 + 30 + 36 + 41 = **115** |

Due torte: ⭐ 6 + 4·38 = 158, contro un tetto di 6·115·2 = 1380.

Gli altri: pane 🪙7 e 36 min · formaggio 🪙10 e 82 min · sapone 🪙10 e
69 min · sciarpa 🪙11 e 77 min · berretto 🪙8 e 55 min.

### «Coltivare conviene circa la metà» resta vero

Il controllo di `unita/coltivazioni` (sezione 8) vale per quello che
finisce in una ciotola: il costo della ricetta contro la stessa pancia
comprata alla tariffa migliore (🪙16,7 per una pancia intera), e deve stare
fra il 35% e l'80%.

| pappa | costa | riempie | comprata | rapporto |
|:--|--:|--:|--:|--:|
| 🍞 pane | 🪙7 | 0,60 | 🪙10,0 | 70% |
| 🧀 formaggio | 🪙10 | 0,85 | 🪙14,2 | 71% |

Il formaggio costa zero al gesto apposta (cagliare è un taglio a freddo,
come il foraggio): con 🪙1 sarebbe al 78%, dentro la fascia ma sul bordo.
Torta, maglioni, sapone e sciarpa **non sono pappe** e non entrano in quel
confronto: sono coccole e addobbi, e per quelli il freno è il tempo.

I gesti restano gesti (🪙0–2), le strutture strutture (🪙150–300), e
nessuna spesa passa le due ore.

### I tetti da alzare nel codice

Oggi la strada più corta verso qualunque merce attraversa al massimo
quattro nodi (merenda → miele → fiori → cipolle); quella del maglione alla
lavanda ne attraversa **sei** (erba, foraggio, lana, stoffa, maglione,
maglione alla lavanda), e non ne esiste una più corta.
Quattro conti si fermano prima, e nessuno lancia un errore: rispondono
`Infinity` o un vicolo cieco.

| dove | oggi | cosa succederebbe | proposta |
|:--|--:|:--|:--|
| `valoreDi` / `minutiDi` in `dati/mercato.js` | `giri = 5` | il maglione alla lavanda vale `Infinity`: premio base, «non si produce in nessun modo» | **8** |
| `livelloDelProdotto` in `dati/livelli.js` | `giri = 4` | già la stoffa non risulta mai ottenibile: mai al mercato, mai nel silo | **8** |
| `Fattoria.ottenibile` in `motore/fattoria.js` | `giri = 4` | lo scomparto della stoffa non compare | **8** |
| `GIRI` in `motore/consiglio.js` | `5` | «🌿 Fieno si fa in fattoria.» — il vicolo cieco che il consiglio esiste per togliere | **8** |

Meglio ancora: **una costante sola**, `PROFONDITA` in `dati/coltivazioni.js`
(= profondità massima + 2), letta dai quattro, con `profonditaDi(prodotto)`
pura e un guasto in `guastiDelleColture` se un prodotto la raggiunge. Un
numero copiato in quattro file è il modo in cui il quinto file dimentica
di alzarlo.

### I `guasti*()` che scatterebbero

- **`guastiDeiBisogni`** — «non serve a niente» per `maglione_lavanda`,
  `sciarpa_lana`, `berretto`: `serveA` guarda ricette, cibi e coccole, e
  gli addobbi no. Va esteso con `che: 'addobbo'` (leggendo `ADDOBBI` per
  `da`) e con `che: 'ordine'` (i mestieri che la vogliono, da
  `CLIENTI`): un ordine consuma la merce quanto una ciotola. Nessun ciclo
  di import: `mercato.js` non importa `bisogni.js`.
- **`guastiDegliAddobbi`** — «fuori dalla fascia di una cosetta (6–30)» per
  un addobbo senza `prezzo`: stessa regola dei cibi, *o* `prezzo` *o*
  `da`, mai tutti e due.
- **`guastiDegliSblocchi`** — regge, a patto che la farina non arrivi
  prima del panificio (16) e la torta non prima del burro (20). Il
  pentolone al 22 con il beverone al 22 passa.
- **`guastiDelCatalogo`** — «la macchina non ha nessuna ricetta»: ogni
  edificio nuovo nasce con la sua prima ricetta nello stesso commit.
- **`guastiDelMercato`** — «nota: non si produce in nessun modo» finché i
  `giri` restano a 5; con 8 tace. Il tetto `6·minuti·pezzi` non morde:
  il caso più stretto è la farina, 3 pezzi ⭐42 contro 270.
- **test 5b di `unita/coltivazioni`** («nel raccolto tutte e sole le
  colture») — passa con la lavanda in `terra`; è il motivo per cui la
  farina **non** può stare nel silo rosso.
- **test 8 di `unita/coltivazioni`** — «rende roba che serve a qualcosa»
  guarda cibi, coccole e ingredienti: va allargato agli addobbi e agli
  ordini insieme a `serveA`, se no i maglioni sono rossi.

## 4. I clienti

`vuole` è un restringimento, non un compito: la nonna e il bottegaio
continuano a prendere tutto. Due mestieri nuovi e cinque estesi.

| cliente | vuole (aggiunte in grassetto) |
|:--|:--|
| 🥖 fornaio | grano, uova, latte, patate, **farina, pane** |
| 🧁 pasticcera | uova, latte, fragole, miele, merenda, **burro, torta** |
| 👨‍🍳 cuoco | tartufi, patate, melanzane, peperoni, cavolfiori, aglio, **formaggio, burro** |
| 🍎 maestra | fragole, carote, latte, uova, merenda, **pane, torta** |
| 🧵 sarta | lana, **stoffa, maglione, maglione_lavanda, sciarpa_lana, berretto** |
| 🧼 **lavandaia** (nuova) | **sapone, lavanda, stoffa** |
| 🍽 **oste** (nuovo) | **formaggio, pane, tartufi, uova, latte** |

Premi (`PREMIO_BASE + PER_VALORE·valore`, tre pezzi al massimo), tutti
sotto il tetto `6·minuti·pezzi`:

| ordine | ⭐ | tetto |
|:--|--:|--:|
| 3 🍞 pane | 90 | 648 |
| 2 🧀 formaggio | 86 | 984 |
| 1 🎂 torta | 82 | 690 |
| 2 🧵 stoffa | 62 | 600 |
| 1 💜 maglione alla lavanda | 86 | 834 |
| 3 🧼 sapone | 126 | 1242 |

Un ordine di tre torte rende ⭐234 per cinque ore e tre quarti di fattoria:
è il più ricco del gioco e resta poco più di un decimo di quello che
varrebbe il suo tempo (⭐2070), lo stesso rapporto del tartufo di oggi.
`unita/mercato` continua a controllare, livello per livello, che non si
chieda niente che non si possa fare.

## 5. La pagina dell'albero

Il consiglio (`motore/consiglio.js`) risale la catena e dice **il prossimo
passo**. Con sei fasi il prossimo passo non basta più: chi vuole un
maglione deve vedere **tutta la strada**, e vedere a che punto è. La pagina
dell'albero è il consiglio srotolato.

### Dove si apre

Tre ingressi, tutti **con una merce già scelta** — la stessa regola del
baule aperto da un consiglio: mandare in un albero intero a cercare la
riga giusta rimette il compito che la pagina doveva togliere.

1. **Dal silo** (`viste/Granaio.vue`): premendo una merce, sotto «chi la
   usa», il tasto 🌳 **Come si fa**. È il posto dove oggi la catena «si
   scopre da dentro», e diventa il posto dove si vede intera.
2. **Dal mercato** (`viste/Mercato.vue`): premendo una casella spenta di un
   ordine. «Manca una torta» e sotto la strada per farla.
3. **Dalla macchina** (`viste/Macchina.vue`): premendo l'ingrediente che
   manca a una ricetta.

Non dal `?`, che è la guida e non cambia con la partita; non dal baule,
che vende cose e non merci. **Non c'è una vista «tutto l'albero»**: sarebbe
un poster di quaranta nodi su un telefono, e un bambino non cerca l'albero,
cerca il maglione. L'intero si vede una fase per volta salendo dal nodo
scelto ai suoi usi (tasto «a cosa serve», che apre `serveA` sullo stesso
foglio).

### Cosa mostra

Una **colonna verticale**, dal telefono: in cima la merce scelta, sotto
quello che le serve, e giù fino ai campi. Ogni riga è una carta con la
faccia vera (`Merce.vue`), il nome, quanti ne servono e **lo stato**:

```
   💜 Maglione alla lavanda            ← quello che vuoi
   ┌ tintoria  ✓ ce l'hai · 6 min
   ├ 🧥 Maglione        ×1   ✓ ne hai 1
   │  ┌ sartoria  🛒 non ce l'hai · 🪙250        ← il tasto apre il baule
   │  └ 🧵 Stoffa       ×2   ne hai 1, manca 1
   │     ┌ telaio  ⏳ pronto fra 4 min
   │     └ 🧶 Lana      ×2   ✓ ne hai 3
   └ 🫙 Tintura         ×1   manca
      ┌ tintoria
      └ 💐 Lavanda      ×2   🌱 sta crescendo · 3 min
```

Le regole di quello che si vede:

- **solo quello che è sbloccato al livello del bambino.** Una ricetta che
  arriva dopo non compare; se l'*unica* strada per una merce arriva dopo,
  la riga dice «arriva al livello 52» e si ferma lì, come fa il consiglio.
  Non racconta il futuro: quello sta nella pagina dei livelli.
- **una strada sola per riga**, la più economica fra quelle aperte (la
  stessa scelta di `valoreDi`), e un tastino «o dalla conigliera» dove ce
  n'è più d'una. Due strade affiancate raddoppiano le righe e nessuno le
  confronta.
- **la macchina sta fra la merce e i suoi ingredienti**, come connettore
  con quattro stati: ✓ ce l'hai · ⏳ sta lavorando (con i minuti) · 🛒 non
  ce l'hai (col prezzo, e il tasto che apre il baule su quella voce) · 🎁
  ti aspetta nei premi (col tasto che porta lì). Sono gli stessi quattro
  casi di `acquisto()` nel consiglio.
- **un ingrediente dice quanti ne hai contro quanti ne servono**, letto dal
  granaio: ✓ verde quando basta, ambra quando manca, e per una coltura lo
  stato del campo (🌱 cresce, 🧺 pronto, nessun campo).
- **quello che manca si apre.** Ogni riga ambra porta con sé la stessa
  `azione` del consiglio — `apri`, `compra`, `premio` — e premerla fa
  quello. Non c'è niente di nuovo da eseguire in `Gioco.vue`: il pannello
  è `{ tipo: 'albero', prodotto }` accanto a `granaio` e `mercato`, e le
  azioni passano dallo stesso `esegui(azione)` dei consigli.

### Chi lo compone

`dati/albero.js`, puro, importa `coltivazioni.js`, `livelli.js` e il
consiglio, e **non sa niente di Vue**. Una funzione:

```
alberoDi(f, prodotto, ora = Date.now()) → nodo | null

nodo = {
  prodotto, nome, emoji, pezzo,
  servono: 1,             // quanti ne chiede il padre (1 alla radice)
  ho: 2,                  // quanti ne ha il granaio
  stato: 'ok' | 'manca' | 'arriva',
  arriva: null | 52,      // se 'arriva', a che livello
  via: null | {           // come si ottiene, la strada scelta
    che: 'coltura' | 'ricetta', id, minuti, costo,
    macchina: null | { id, nome, stato: 'ok'|'lavora'|'compra'|'premio',
                       manca: 4, prezzo: 250 },
    campo:    null | { stato: 'libero'|'cresce'|'pronto'|'nessuno', manca: 3 },
    alternative: ['lana_angora'],       // le altre strade aperte, solo gli id
    azione: null | { che: 'apri'|'compra'|'premio', … },   // quella del consiglio
  },
  rami: [ nodo, … ],      // gli ingredienti della strada scelta
}
```

Tre cose che la funzione garantisce, e che il test difende:

- **la profondità è finita** (`PROFONDITA`), e un anello nelle tabelle si
  ferma con un nodo `stato: 'arriva'` invece di avvitarsi;
- **le foglie sono colture** — o nodi «arriva», mai una ricetta lasciata a
  metà;
- **la strada scelta è quella di `valoreDi`**, così il premio del mercato,
  il consiglio e l'albero raccontano la stessa fattoria.

### I test

- `unita/albero` — per ogni merce e per ogni livello da 1 a `ULTIMO`:
  l'albero contiene solo ricette e macchine aperte a quel livello; la
  profondità non supera `PROFONDITA`; le foglie sono colture o «arriva»;
  con un granaio seminato a mano i contatori `ho`/`servono` e gli stati
  tornano; l'`azione` di ogni riga ambra è una delle tre che `Gioco.vue`
  sa eseguire; la radice di una merce non ottenibile dice il livello
  giusto (`livelloDelProdotto`).
- `unita/consiglio` — una riga in più: la prima riga ambra dell'albero e
  `comeAvere` propongono la stessa azione.
- `integrazione/albero` — apre il silo, preme la stoffa, preme 🌳, preme
  la riga del telaio e trova il baule aperto sul telaio (`[data-albero]`,
  `[data-albero-riga="<prodotto>"]`, `[data-albero-macchina="<id>"]`).

## 6. Gli sprite da generare

**La lista è questa, e si spunta.** Tutto quello che nel gioco dichiara
oggi un `aspetta` sta qui sotto: finché la casella è vuota quella roba
si vede col ripiego scritto accanto — e il giorno che il foglio arriva,
`guastiDelCatalogo` e `guastiDelleColture` diventano rossi finché la
riga non prende il pezzo vero. Nessuno deve andarsele a cercare.

### Edifici → `edifici_2.png` (8 pezzi, due prompt da quattro)

| ✓ | pezzo | ripiego di oggi | dove |
|:-:|:--|:--|:--|
| ☐ | `dispensa` | `casetta_tetto_lungo` | catalogo, il terzo silo |
| ☐ | `telaio` | `tettoia_fieno` | catalogo |
| ☐ | `panificio` | `forno_pizza` | catalogo |
| ☐ | `caseificio` | `casetta` | catalogo |
| ☐ | `pentolone` | `calderone0` (animato) | catalogo |
| ☐ | `cucina` | `forno_legna` | catalogo |
| ☐ | `sartoria` | `dehors_rosa` | catalogo |
| ☐ | `tintoria` | `dehors_azzurro` | catalogo |

### Merci → `merci_2.png` e `merci_3.png` (16 pezzi, sei per foglio)

| ✓ | pezzo | ripiego di oggi | merce |
|:-:|:--|:--|:--|
| ☐ | `merce_stoffa` | solo l'emoji 🧵 | stoffa |
| ☐ | `merce_farina` | solo l'emoji 🌾 | farina |
| ☐ | `merce_pane` | `pane` (l'arredo) | pane |
| ☐ | `merce_maglione` | solo l'emoji 🧥 | maglione |
| ☐ | `merce_burro` | solo l'emoji 🧈 | burro |
| ☐ | `merce_formaggio` | solo l'emoji 🧀 | formaggio |
| ☐ | `merce_torta` | `torta0` (l'arredo) | torta |
| ☐ | `merce_crostata` | `crostatina` (l'arredo) | crostata |
| ☐ | `merce_tintura` | solo l'emoji 🫙 | tintura |
| ☐ | `merce_maglione_lavanda` | solo l'emoji 💜 | maglione alla lavanda |
| ☐ | `merce_sapone` | solo l'emoji 🧼 | sapone |
| ☐ | `merce_sacchetto` | `sacco_iuta` (l'arredo) | sacchetto profumato |
| ☐ | `merce_minestrone` | solo l'emoji 🍜 | minestrone |
| ☐ | `merce_salsa` | `marmellata0` (l'arredo) | salsa |
| ☐ | `merce_conserva` | solo l'emoji 🥗 | conserva d'orto |
| ☐ | `merce_polenta` | solo l'emoji 🍛 | polenta |

E quando arriva la coda (tappa 8): `merce_sciarpa` e `merce_berretto`.

### Colture → `campi_3.png` (8 pezzi)

| ✓ | pezzo | ripiego di oggi | |
|:-:|:--|:--|:--|
| ☐ | `campo_lavanda0..6` | i sette stadi delle melanzane | sette riquadri in fila |
| ☐ | `raccolto_lavanda` | `vaso_lavanda` (il giardino) | la cassetta |

Sotto, com'è fatto ognuno e il foglio a cui somigliare.

### Edifici (`edifici_2.png`)

Nello stile di `edifici.png`: facciata frontale vista da tre quarti
dall'alto, tetto in tegole, un dettaglio del mestiere **davanti alla
porta** che si legge da lontano. Larghi quattro celle, alti tre e mezzo.

| pezzo | descrizione |
|:--|:--|
| `dispensa` | casetta bassa di pietra col tetto grigio, porta doppia aperta, dentro scaffali con sacchi e forme — larga due celle, alta due |
| `telaio` | tettoia di legno a un solo spiovente, sotto un telaio a mano con la stoffa a righe tesa, una matassa appesa alla trave |
| `panificio` | casetta col tetto rosso, forno di pietra a cupola incassato nella facciata col fuoco acceso, sbuffo di fumo, pagnotte sul davanzale |
| `caseificio` | casetta bianca col tetto verde, forme di formaggio gialle su una mensola davanti, un bidone del latte accanto alla porta |
| `pentolone` | tettoia aperta di pali con un grande pentolone di rame sul fuoco, vapore, un mestolo — tre celle |
| `cucina` | tettoia aperta di legno con un piano di lavoro, due fornelli a fuoco vivo, pentole e mestoli appesi a una trave, un ceppo con le verdure tagliate |
| `sartoria` | casetta col tetto blu e la vetrina, un manichino col maglione in vetrina, insegna con forbici |
| `tintoria` | casetta col tetto viola, davanti due tinozze di legno con l'acqua viola e stoffe stese ad asciugare su un filo |

### Merci (`merci_2.png`)

Nello stile di `merci.jpg`: un oggetto solo per riquadro, di fronte e un
po' dall'alto, su fondo magenta, senza ombra a macchia.

| pezzo | descrizione |
|:--|:--|
| `merce_farina` | sacco di tela chiaro aperto, con la farina bianca che trabocca |
| `merce_pane` | due pagnotte tonde dorate con il taglio a croce (nell'atlante c'è già `pane`: ripiego finché non c'è il foglio) |
| `merce_torta` | torta rotonda a due piani con la glassa rosa e una fragola in cima (`torta` è già nell'atlante: ripiego) |
| `merce_burro` | panetto di burro giallo su un piattino, con un pezzo tagliato |
| `merce_formaggio` | forma di formaggio giallo con uno spicchio tagliato che mostra i buchi |
| `merce_stoffa` | rotolo di stoffa a righe crema e blu, un lembo srotolato |
| `merce_maglione` | maglione piegato color crema con le trecce, le maniche ripiegate sopra |
| `merce_tintura` | vasetto di vetro con la tintura viola e un tappo di sughero |
| `merce_maglione_lavanda` | lo stesso maglione piegato, viola lavanda |
| `merce_sapone` | tre saponette viola e crema impilate, con una bollicina |
| `merce_crostata` | crostata rotonda con la griglia di pasta e la confettura di fragole che si vede fra le strisce |
| `merce_sacchetto` | sacchettino di tela grezza chiuso da un nastro, con tre steli di lavanda che escono dalla bocca |
| `merce_minestrone` | scodella panciuta di terracotta con la minestra densa e i pezzi di verdura che spuntano, un cucchiaio di legno appoggiato al bordo |
| `merce_salsa` | barattolo di vetro con la salsa rossa, tappo di metallo, un pomodorino accanto |
| `merce_conserva` | vaso di vetro largo con gli ortaggi a pezzi sott'olio — viola, rosso e arancio a strati |
| `merce_polenta` | fetta spessa di polenta gialla su un tagliere, con una scaglia di formaggio che si scioglie sopra |
| `merce_sciarpa` | sciarpa di lana arrotolata a spirale, righe crema e rosse |
| `merce_berretto` | berretto di lana crema col pompon |

### Colture (`campi_3.png`)

Nello stile di `campi.png`: il cartello, sette aiuole in fila dai semi al
maturo, la cassetta del raccolto.

| pezzo | descrizione |
|:--|:--|
| `campo_lavanda0..6` | aiuola con i semi, poi i cespugli grigioverdi che crescono, poi le spighe viola sempre più fitte |
| `raccolto_lavanda` | cassetta di legno con i mazzi di lavanda legati |

### Le due schede di prompt

Il metodo è **un'immagine di base allegata** più la frase «nello stesso
stile di questa», e la scheda dice tutto quello che il generatore altrimenti
inventa: misura, vista, fondo, ombra, tavolozza, appoggio, griglia. Le due
schede stanno anche in
[`strumenti/sprite/sorgenti/fattoria/generati/PROMPT-edificio.md`](../strumenti/sprite/sorgenti/fattoria/generati/PROMPT-edificio.md)
e [`PROMPT-merce.md`](../strumenti/sprite/sorgenti/fattoria/generati/PROMPT-merce.md),
accanto ai fogli che devono produrre.

#### Scheda «edificio»

**Allegare**: `edifici.png` intero (1536×1024) — ha la fattoria di casa,
il mulino, il fienile e il silo, cioè gli edifici accanto a cui i nuovi
devono stare. Se il generatore accetta un'immagine sola piccola, il
ritaglio con il fienile (`fienile0`, riga in alto, terzo da sinistra) e il
mulino a vento (`mulino_vento`, terza riga, primo).

> Disegna un foglio di sprite in pixel art **nello stesso stile di questa
> immagine**: stessa tavolozza (legno caldo, tegole rosse e blu, pietra
> grigia, verde dei cespugli ai piedi), stesso contorno scuro di un pixel,
> stessa vista — facciata frontale vista da tre quarti dall'alto, come gli
> edifici allegati — e stessa luce da in alto a sinistra.
>
> Il foglio è 1536×1024 px, su **fondo trasparente** (PNG). Disponi
> **7 edifici** su una griglia dichiarata di 4 colonne × 2 righe, celle di
> 384×512 px, ognuno centrato nella sua cella e appoggiato al bordo di
> sotto della cella lasciando 32 px di margine. Nessun edificio tocca il
> bordo della cella. Ogni edificio è largo circa 256 px e alto fra 220 e
> 290 px (nel gioco diventa 64×56–72 px: una cella del gioco sono 16 px,
> l'edificio occupa 4 celle di larghezza).
>
> Ogni edificio è **appoggiato a terra** sul proprio bordo inferiore, con
> un filo d'erba o di fiori ai piedi come negli originali. **Niente ombra
> proiettata**, niente macchia scura sotto, niente terreno disegnato:
> l'ombra la fa il gioco. Niente scritte né insegne con parole.
>
> Da sinistra a destra, riga per riga: 1 … 2 … 3 … (la descrizione della
> tabella, una riga per edificio).

#### Scheda «merce»

**Allegare**: `merci.jpg` intero, oppure il ritaglio col nido di uova e i
gomitoli (i due a sinistra).

> Disegna un foglio di oggetti in pixel art **nello stesso stile di questa
> immagine**: stessa tavolozza calda, stesso contorno scuro, stessa vista
> — di fronte e un po' dall'alto — stessa luce da in alto a sinistra.
>
> Il foglio è 1536×640 px su **fondo magenta uniforme** (#e0197d, lo
> stesso dell'allegato), che non deve comparire in nessun oggetto.
> Disponi **6 oggetti** su una griglia dichiarata di 6 colonne × 1 riga,
> celle di 256×640 px, ognuno centrato nella sua cella. Ogni oggetto è
> largo circa 200 px e alto fra 160 e 220 px (nel gioco diventa 22–26 px:
> un oggetto solo, grande, che si riconosca anche a venti pixel).
>
> Ogni oggetto è **appoggiato**, visto da chi lo guarda dal banco, con la
> base che si vede. **Nessuna ombra** sotto l'oggetto, nemmeno leggera,
> nessun piano d'appoggio disegnato, nessun testo.
>
> Da sinistra a destra: 1 … 2 … 3 … (la descrizione della tabella, una
> riga per merce).

La merce si chiede a sei per foglio e non a dodici: sopra i sei il
generatore stringe gli oggetti e i dettagli spariscono a venti pixel.

### Il prompt resta agli atti: il campo `prompt`

Oggi nessun foglietto conserva il prompt, e `PROVENIENZA.txt` lo dice come
buco. Proposta per [`FORMATO.md`](../strumenti/sprite/FORMATO.md), **solo
proposta**: un campo facoltativo `prompt` nel foglietto `.json` accanto a
`__`:

```json
{
  "__": "Le merci della bottega…",
  "prompt": {
    "scheda": "PROMPT-merce.md",
    "base": "merci.jpg",
    "generatore": "…, settembre 2026",
    "testo": "Disegna un foglio di oggetti in pixel art nello stesso stile…"
  },
  "fondo": "auto",
  …
}
```

`scheda` è quale delle due schede si è usata, `base` l'immagine allegata,
`generatore` chi e quando, `testo` il prompt intero così com'è stato
mandato. `atlante.py` lo ignora — è una carta, non una coordinata — e il
banco dei ritagli (`npm run mondo`) potrebbe mostrarlo sotto il foglio.
Rigenerare un pezzo mancante nello stesso stile diventa copiare quel
testo e cambiare la riga dell'oggetto.

## 7. Il piano di lavoro

Tappe committabili, ognuna giocabile da sola. Le unità girano a ogni tappa
(`npm test`), il browser prima del push.

| # | tappa | dati | schermo | sprite | test da toccare |
|--:|:--|:--|:--|:--|:--|
| 0 ✅ | **Le fondamenta** | `PROFONDITA` + `profonditaDi` in `coltivazioni.js`, letta da `valoreDi`/`minutiDi`, `livelloDelProdotto`, `ottenibile`, `GIRI`; `serveA` con `addobbo` e `ordine`; `da` sugli addobbi; il silo `bottega` e la voce `dispensa` | `Granaio.vue` disegna anche la dispensa (è già generico per famiglia) | nessuno (la dispensa può nascere col `casetta_tetto_lungo` come ripiego dichiarato) | `coltivazioni` (guasti, 5b, 8), `mercato`, `consiglio`, `addobbi`: verde senza nuove merci |
| 1 ✅ | **Il telaio e la stoffa** (14) | `stoffa`, `telaio`, la sarta la vuole, `NOMI[14]` | — | telaio, dispensa, `merce_stoffa` | `coltivazioni` 1b/8, `livelli-fattoria`, `mercato` (la stoffa si ordina dal 14) |
| 2 ✅ | **Il panificio e il pane** (16) | `farina` nel mulino, `panificio`, `pane` cibo, la merenda passa al panificio, fornaio/maestra/oste | `Bestia.vue` ha una pappa in più: niente da fare | panificio, `merce_farina`, `merce_pane` (`pane` dell'atlante intanto) | `coltivazioni` 8 (rapporto 70%), `sblocchi`, `recinti` (la merenda ha cambiato casa) |
| 3 ✅ | **La pagina dell'albero** | `dati/albero.js` | `viste/Albero.vue`, i tre ingressi, `pannello.tipo = 'albero'` | — | `unita/albero` nuovo, `consiglio` (+1 riga), `integrazione/albero` |
| 4 ✅ | **Il caseificio e la torta** (20) | `burro`, `formaggio`, `caseificio`, `torta` + coccola «Festa», pasticcera/cuoco | `Bestia.vue`: la festa sotto la barra del gioco | caseificio, `merce_burro`, `merce_formaggio`, `merce_torta` | `coltivazioni` 8 (formaggio 71%), `bisogni` (coccola con `da`), `mercato` |
| 5 ✅ | **La sartoria e il maglione** (36) | `maglione`, `sartoria`, l'addobbo `da: 'maglione'` | `Vestiario.vue`: un addobbo pagato col granaio mostra «ne hai 1» invece del prezzo | sartoria, `merce_maglione` | `addobbi` (si compra col granaio, non con le monete), `coltivazioni` 8 |
| 6 ✅ | **Il pentolone** (22) | quattro ricette cambiano `dove`, `pentolone` in catalogo | — | pentolone | `recinti` (la catena intera passa dal pentolone), `consiglio`, `sblocchi` |
| 7 ✅ | **La lavanda e la tintoria** (52) | `lavanda` coltura, `tintura`, `maglione_lavanda` (**merce**, non addobbo), `sapone` + coccola «Bagnetto», lavandaia | — | `campi_3.png`, tintoria, `merce_tintura`, `merce_maglione_lavanda`, `merce_sapone` | `coltivazioni` 1b (la lavanda ha la bocca), `albero` (sei fasi), `mercato` |
| 7b ✅ | **Le confluenze** (§1b) | la `cucina` con quattro ricette, `crostata`, `sacchetto`: ogni coltura ha due bocche | — | cucina, sei merci (§6) | `coltivazioni` 1b-bis, nuovo |
| 8 | **La coda** (58, 64) | `sciarpa_lana`, `berretto` nella sartoria, addobbi collo e testa | — | `merce_sciarpa`, `merce_berretto` | `livelli-fattoria` (`ULTIMO`, i buchi), `addobbi` |

La tappa 3 sta prima del caseificio apposta: da lì in poi le catene hanno
quattro o più fasi, ed è il momento in cui il prossimo passo da solo smette
di bastare. La tappa 6 è indipendente e si può spostare; sta dopo la 5
perché tocca ricette che i bambini usano oggi, e conviene che sia sola nel
suo commit.

Dopo ogni tappa con sprite: `python3 strumenti/sprite/atlante.py fattoria`,
`npm run mondo` per guardare i ritagli, e il foglietto con il campo
`prompt` compilato.

## 8. La seconda iterazione: più catene, e i posti dove si consegna

> Solo progetto, senza sprite e senza codice: si scrive dopo la tappa 8.

Due cose che l'albero di sopra non fa, dette da chi ci gioca: **le
ricette più interessanti nascono da ingredienti che si incrociano** —
miele, zucchero, uova, farina — e **il mercato è un banco solo**, mentre
in un gioco di fattoria ci sono posti diversi dove le persone chiedono
cose: la pasticceria, la rosticceria, la scuola.

### Le catene in più

Stessa regola di tutto il resto: N → 1, ogni edificio un mestiere, mai
più di quattro ricette, ogni coltura con la bocca che la mangia. Quattro
catene, in ordine di dove entrano.

| catena | fasi | dove si incontra |
|:--|:--|:--|
| **Lo zucchero** | 🌱 barbabietola (campo) → 🍬 zucchero (**zuccherificio**) | entra nella torta, nei biscotti, nella marmellata |
| **La pasta** | farina ✚ uova → 🍝 pasta (**pastificio**) → 🍲 lasagne (pasta ✚ pomodori ✚ formaggio, **cucina**) | ✚ col pane e col latte |
| **Il pesce** | 🌰 becchime → 🐟 pesce (**stagno dei pesci**, un recinto: si dà da mangiare, si ritira) | ✚ col riso |
| **Il sushi** | 🌾 riso (campo, un cereale nuovo) ✚ pesce → 🍣 sushi (**cucina**) | è la catena più lunga: sei fasi |

- **La barbabietola e non la canna**: cresce in un campo dell'orto come
  le altre, e il foglio dei campi ha già la forma «cartello, sette
  aiuole, cassetta».
- **Lo stagno dei pesci è un recinto**, con i suoi tre ritratti e il
  fumetto che dice cosa vuole: non è una meccanica nuova. Mangia becchime
  come le galline e gli asini, perché tre bocche sullo stesso mangime
  sono tre scomparti in meno.
- **La cucina** è l'ottavo edificio (lasagne, sushi, e più avanti le
  cose che si fanno con due merci cotte): arriva dopo la tintoria, nella
  coda del gioco che oggi non ha niente che lavori.
- Quello che esce (zucchero, pasta, pesce, sushi, lasagne) va nella
  dispensa: sono tutte cose che escono da una bottega. Il pesce esce da
  un recinto e va nel silo bianco, con le uova.

I numeri — prezzi nella fascia «una struttura», tempi, il rapporto della
pasta e delle lasagne come pappe contro il cibo comprato — si fanno con
lo stesso conto di §3 quando si scrive la tappa, non prima.

### I posti di consegna al posto del banco unico

Il mercato di oggi è **una bancarella che chiede a caso** fra tutte le
merci ottenibili, con una faccia scelta dopo. Il verso da girare è
l'opposto: **un posto chiede il suo mestiere**, e la faccia dice prima
cosa aspettarsi.

**Come si dichiara un posto.** Una voce di catalogo con `posto: {…}` al
posto di `mercato: true` — stessa forma dei recinti, che sono macchine
con una faccia:

```js
V('pasticceria', 'pasticceria', 'Pasticceria', 200, {
  posto: { chiede: ['torta', 'biscotti', 'miele', 'merenda', 'uova'],
           clienti: ['pasticcera', 'maestra'] },
  liv: 20, unico: true,
})
```

- `chiede` è **l'elenco chiuso** delle merci che quel posto ordina: si
  pesca da lì e non da `merciDelLivello`. Il filtro sul livello resta
  (non si chiede una torta a chi non ha il caseificio), ma dentro
  l'elenco del posto.
- `clienti` sono i mestieri che si vedono al banco di quel posto, presi
  da `CLIENTI`: la pasticcera in pasticceria, l'oste in rosticceria. Il
  campo `vuole` dei clienti resta per il ripiego — la nonna e il
  bottegaio stanno alla bancarella di sempre, che non sparisce.
- Ogni posto ha **i suoi tre ordini** (`f.ordini` diventa
  `f.ordini[postoId]`, con la bancarella che tiene la chiave `mercato`
  per i salvataggi di ieri) e il suo riposo dopo un rifiuto.

**Quali posti, e cosa chiedono.**

| posto | liv | chiede | chi |
|:--|--:|:--|:--|
| 🏪 la bancarella (c'è già) | 4 | di tutto: è il ripiego | nonna, bottegaio, e chi non ha un posto suo |
| 🧁 pasticceria | 20 | torta, biscotti, miele, merenda, uova, burro, zucchero | pasticcera, maestra |
| 🍽 rosticceria | 26 | pane, formaggio, lasagne, tartufi, latte, pasta | oste, cuoco |
| 🧵 merceria | 36 | lana, stoffa, maglione, sciarpa, berretto, sapone | sarta, lavandaia |
| 🍣 il sushi bar | 60 | sushi, pesce, riso | un cliente nuovo |

**Come si sblocca.** Un posto arriva col livello e **con la sua prima
merce**, come una macchina arriva con la sua prima ricetta: la
pasticceria al 20 con la torta, non prima — `guastiDegliSblocchi` lo
controlla con la stessa regola delle macchine. È un premio nella pagina
dei livelli e si compra nel baule, `unico` come la bancarella.

**Cosa cambia nel motore.** `componiOrdine` prende il posto e pesca da
`chiede`; `clientiPer` guarda prima i `clienti` del posto; `bancoDi`
riceve l'id del posto. Il premio resta esperienza, mai monete, con lo
stesso tetto `6·minuti·pezzi`. La pagina dell'albero si apre da ogni
posto, come dalla bancarella.

**Perché non subito.** Un posto che chiede solo torte a chi ha una torta
ogni due ore è un banco fermo: i posti hanno senso quando ogni catena
ha tre o quattro merci consegnabili, cioè dopo la tappa 8 e le catene di
sopra.

## Le decisioni da confermare prima di scrivere codice

> **Prese, tutte e tre**, il 21 settembre 2026: sì. Restano scritte perché
> dicono cosa si è pesato.

1. **Il terzo magazzino.** La dispensa (`silo: 'bottega'`, 🪙120, unico)
   contro infilare undici merci nel silo della stalla. La dispensa costa
   un acquisto in più al 14 ma tiene lo scaffale della stalla leggibile e
   difende il criterio «il rosso è dei campi, il bianco è degli animali».
2. **Lo sdoppiamento del fienile.** Quattro ricette cambiano casa e chi
   è oltre il 22 deve comprare il pentolone (🪙150) per continuare a fare
   la zuppa. È l'unica tappa che toglie qualcosa a una fattoria di ieri —
   l'alternativa è lasciare il fienile a nove ricette e non aggiungergli
   più niente.
3. **La merenda nel panificio.** Stesso genere di migrazione, più piccola:
   `merenda` cambia `dove` da `mulino` a `panificio`. Se il mulino deve
   restare «solo macinare» va fatto; se no la merenda resta dov'è e il
   mulino ha quattro ricette.

E una quarta, minore: **il sapone nella tintoria** (tinozze e vapore, un
mestiere solo) contro una bottega a parte. Con la tintoria a tre ricette si
sta dentro il tetto di quattro, e si evita un ottavo edificio.
