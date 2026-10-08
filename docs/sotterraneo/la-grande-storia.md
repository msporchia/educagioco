# La grande storia

Da quando la roba resta ([la-roba-che-resta.md](la-roba-che-resta.md)) le
discese non sono più sei partite separate ma una storia sola, a passi: si
parte dal villaggio nudi, e ogni discesa porta la roba al passo dopo. Il
7 ottobre 2026 l'utente l'ha detto così: *«devi considerarla un'unica
grande storia, chiaramente devi farla a step e definire un equipaggiamento
che ti aspetti abbia alla fine di ogni run»*. Qui le discese, la tabella
dell'equipaggiamento, chi la dà, chi è sotto il livello e le misure. Le
missioni dei personaggi stanno in [missioni.md](missioni.md).

Il codice: `dati/campagna.js` (le discese), `dati/storia.js` (la tabella),
`motore/storia.js` (chi dà cosa, il banco del passo, chi è sotto),
`motore/banco.js` (`misuraLaStoria`).

## Le discese

Si parte nel villaggio, nella metà di destra della mappa (`partenza` nel
foglietto, [terra-di-sopra.md](terra-di-sopra.md)), e **le discese sono in
fila per strada**: la prima è la più vicina, l'abisso il posto più lontano.
I passi sono la strada vera da casa (`unita/sotterraneo-terra` controlla che
la fila salga).

| | discesa (chiave) | posto | passi | forma | scenario | piani | guardiano · capo |
|---|---|---|---|---|---|---|---|
| 0 | La cripta dell'altare (`altare`) | la scala dietro l'altare fra le colonne | 35 | corta, quattro stanze | cripta | 2 | scheletro · scheletro |
| 1 | La scalinata antica (`cantine`) | la scala sotto l'arco | 40 | larga, sedici stanze | cantine | 2 | scheletro · orco |
| 2 | La torre in rovina (`torre`) | la porta in basso della torre | 44 | alta e stretta, 26×54 | fornace | 3 | scheletro · troll |
| 3 | La grotta della scaletta (`gallerie`) | il buco nella roccia | 45 | tutta in profondità: piani piccoli | cantine | 5 | orco · orco |
| 4 | La scala sommersa (`cisterna`) | la scala nello stagno | 51 | lunga e stretta, 64×24 | cripta | 3 | granchio · gigante |
| 5 | La botola segreta (`labirinto`) | la botola nel prato | 54 | un labirinto di sedici stanze | cantine | 3 | lupo · troll |
| 6 | La miniera abbandonata (`fondo`) | la miniera dentro il monte | 55 | stretta e profonda | fornace | 4 | serpente · gigante |
| — | l'abisso | il pozzo vecchio d'ardesia | 61 | gira fra tre forme | i tre | ∞ | la scaletta |

- **Meno pozzi**: il pozzo dal tetto rosso non è più una discesa (resta
  disegno), il pozzo d'ardesia è l'abisso, «il pozzo senza fondo». Le
  aperture nuove sono la torre e l'altare. Provato a contare: un pozzo come
  discesa è poco intuitivo, e l'utente ne ha voluti meno.
- **La forma la dà il piano**: `largo` e `alto` al posto del quadrato
  `misura` (la torre, la scala sommersa), `giri` per quante stanze. Mai lo
  stesso scenario due volte di fila (`unita/sotterraneo-abisso`).
- **La grotta ha piani da quattro stanze**: ingresso, scala, portale e
  fonte. Niente forzieri: il pezzo della storia lo dà il guardiano
  dell'ultimo piano, il resto il banco.
- **Il record di fuori non si tocca**. `tappa` e `stelle` di fuori sono il
  massimo fra le avventure, e li leggono medaglie, esperienza e la riga
  della home: le stelle restano sotto l'indice di allora e la somma non
  cambia (togliere non abbassa il livello,
  [../core/progressi.md](../core/progressi.md)). Le avventure del mondo 2
  invece si rileggono **per chiave** nella fila nuova (`riordina` in
  `motore/avventure.js`, mondo 3): le stelle seguono la discesa, il cursore
  conta quelle di fila già finite, la sosta si butta, la nebbia resta e si
  riparte dal villaggio. Chi aveva aperto l'abisso lo tiene.

## La tabella dell'equipaggiamento

`PASSI[eroe][k]` è la roba con cui si **entra** nella discesa k; l'ultima
riga è quella con cui si esce dalla miniera ed entra nell'abisso. Fra
parentesi braccio e difesa con quella roba.

| entra in | cavaliere | elfa | mago | nano |
|---|---|---|---|---|
| cripta | niente (3·1) | niente (4·1) | niente (5·0) | niente (3·2) |
| scalinata | spada corta (4·1) | spada corta (5·1) | verga (6·0) | accetta (4·2) |
| torre | + scudo di legno, panciotto (4·3) | + scudo di legno, saio (5·3) | + scudo di legno, saio (6·2) | + scudo di legno, panciotto (4·4) |
| grotta | spada (5·3) | spada (6·3) | bastone magico, saio (8·1) | ascia, panciotto (6·3) |
| scala sommersa | + scudo borchiato, amuleto azzurro (5·3) | + amuleto azzurro (6·3) | + amuleto azzurro (8·1) | + amuleto azzurro (6·3) |
| botola | + scudo di ferro, corazza (5·5) | + scudo borchiato (6·3) | scettro, scudo di legno, manto (8·4) | + corazza (6·4) |
| miniera | spadone, corazza, amuleto d'ossa (7·4) | arco lungo, manto, amuleto azzurro (7·4) | + amuleto rosso (8·4) | bipenne, corazza, amuleto azzurro (7·4) |
| l'abisso | spada di ghiaccio, scudo del teschio, corazza, amuleto d'ossa (5·8) | spadone, manto, amuleto d'ossa (8·5) | + scudo di ferro (8·5) | + amuleto d'ossa (7·5) |

Le pozioni attese (`POZIONI_ATTESE`): niente, una boccetta, due, poi
pozioni e ampolle fino a tre (quelle che le gemme della discesa di prima
comprano dall'erborista).

- **Ogni discesa dà qualcosa, e braccio più difesa non calano mai**
  (`guastiDellaStoria`). Ogni pezzo lo porta la sua classe e ha un prezzo.
- **Lo spadone a due mani toglie lo scudo**: il cavaliere e l'elfa
  cambiano modo a metà storia, e la difesa cala di uno mentre il braccio
  sale di due. Il mago fa il contrario: il bastone a due mani, poi lo
  scettro a una mano che gli ridà lo scudo.

## Chi dà la riga dopo

- **Il guardiano dell'ultimo piano lascia il pezzo della riga dopo** che
  serve ancora (`premioPer`: la prima casella, l'arma prima). È l'unico
  bottino che arriva anche a chi va dritto.
- **I forzieri danno il pezzo che manca**, poi solo cose da bere o da
  accendere (`NEI_FORZIERI_DELLA_STORIA`).
- **I mostri di tutti i giorni lasciano solo da bere** nelle sette
  discese: la roba dal caso farebbe della tabella una bugia. Nell'abisso si
  pesca come prima ([abisso.md](abisso.md)).
- **Il banco porta il passo dopo, non oltre** (`bancoDelPasso`): l'armaiolo
  e il rigattiere hanno i pezzi della riga con cui si entra nella prossima
  discesa che ancora mancano, e un paio di cose che non costano più di
  quei pezzi (e non sono della riga dopo ancora). Chi va dritto esce dalla
  discesa con le gemme che bastano al pezzo che il guardiano non dà (tabella
  sotto); chi gira tutto ne ha il doppio, e le spende in pozioni. I pezzi
  delle righe dopo si comprano, a un prezzo più alto quanto più sono avanti
  (`1 + righe` volte il prezzo pieno, [roba.md](roba.md#i-mercanti-di-sopra)):
  chi ha le gemme non è fermato dalla storia, la paga. Provato: pezzi
  bloccati finché non si finisce la discesa; l'utente: «se ho i soldi perché
  no».
- **Un pezzo serve se nella fila viene dopo quello che si ha** (`migliora`,
  il posto nella fila e non il numero): così lo scettro arriva dopo il
  bastone anche se picchia uguale, e chi è già oltre la tabella non riceve
  una spada peggiore della sua. Le missioni danno solo gioielli o gemme (e a volte
  qualche moneta, [missioni.md](missioni.md)): un vantaggio, mai un passo.

## Chi è sotto il livello lo sa prima di scendere

Toccando una discesa ancora da finire, se braccio o difesa con la roba di
adesso sono sotto quelli della riga d'entrata, il fumetto lo dice con la
voce del minatore e le cose che si hanno in mano: «Con quella spada corta
sotto la torre non duri: passa dall'armaiolo», «Nella grotta picchiano
forte, e senza scudo non reggi: passa dall'armaiolo» (`dettoDelLivello`,
`dove` nella tappa per il posto in mezzo alla frase). Lo ripete il minatore
quando indica la prossima. Non vieta niente: si scende lo stesso.

## Le misure

`misure/sotterraneo`, venti semi per discesa e per eroe, dritti alla scala,
con la roba della riga (0), di una discesa prima (−1), di due avanti (+2).
Discese vinte su venti, cavaliere · elfa · mago · nano:

| | cripta | scalinata | torre | grotta | sommersa | botola | miniera |
|---|---|---|---|---|---|---|---|
| attesa, a 8/10 | 20·20·20·20 | 18·20·18·20 | 20·20·20·20 | 20·20·20·20 | 20·20·20·20 | 20·20·20·20 | 20·19·20·20 |
| attesa, a 6/10 | 20·20·20·20 | 5·11·8·15 | 11·18·14·16 | 7·12·9·13 | 10·17·10·18 | 16·10·16·16 | 13·11·11·18 |
| attesa, a 4/10 | 16·18·17·20 | 0·1·1·1 | 2·3·3·4 | 0·2·1·2 | 2·3·1·4 | 1·0·0·0 | 0·0·0·1 |
| una prima, a 8/10 | — | 10·15·13·19 | 14·19·10·18 | 18·20·19·20 | 20·20·16·20 | 18·18·14·19 | 20·16·19·20 |
| due avanti, a 4/10 | 20·20·20·20 | 8·16·6·15 | 6·10·3·10 | 12·6·13·12 | 11·9·13·11 | 7·15·16·13 | 3·7·5·9 |
| attesa, gira tutto, a 8/10 (cav · mago) | 20·19 | 19·19 | 20·20 | 20·19 | 20·20 | 14·18 | 19·18 |

- **A otto si arriva in fondo quasi sempre, a sei circa metà (in media fra
  i quattro, dal 49 al 72%), a quattro quasi mai**; la cripta perdona. Con
  la roba di una discesa prima a otto ci si arriva più di metà delle volte
  e a sei molto meno: si fatica ma si può. Con la roba di due discese
  avanti a sei è sicuro, a quattro si vince da un terzo a due terzi delle
  volte (la scalinata e la botola restano le più comode).
- **La taratura** sono `forza` (le ossa) e `spinta` (l'attacco) di ogni
  discesa in `dati/campagna.js`, sulla riga d'entrata. Il nano e l'elfa
  restano più comodi del cavaliere e del mago, come prima: la scelta
  cambia i conti.
- **Chi gira tutto** combatte tre volte tanto con la stessa roba: a otto
  arriva in fondo da 14 a 20 volte su 20. La botola è la più dura per lui.
- **Le gemme con cui si esce andando dritti** (cavaliere): 10 · 12 · 20 ·
  23 · 23 · 33 · 27 — il pezzo che il guardiano non dà costa 9–34.
- **Il minimo per scendere** (cavaliere, roba attesa, un seme): 14 · 22 ·
  35 · 48 · 43 · 58 · 39 domande, sotto il tetto di una seduta (85); girando
  tutto 26 · 99 · 82 · 76 · 89 · 172 · 142.
- **Prima, con la roba pescata a caso** (sei discese, la fila giocata dal
  banco con la spesa): a otto 19–20 su 20, a sei 10–17, a quattro 0–4 dopo
  la scalinata; chi girava tutto si portava giù più roba di chi andava
  dritto, e niente diceva quale. Adesso la tabella lo dice e le misure la
  controllano.

Nei test: `unita/sotterraneo-storia` (la tabella sta in piedi, ogni
discesa dà il primo pezzo della riga dopo e a chi è avanti niente, i mostri
di tutti i giorni non lasciano roba, chi è sotto il livello e la frase, le
missioni, le avventure del mondo 2 rilette senza toccare il record e
l'esperienza), `unita/sotterraneo-roba` (il banco porta il passo dopo e
mai la riga dopo, sei semi d'equilibrio), `unita/sotterraneo-terra` (la
partenza nel villaggio, le discese in fila per strada),
`misure/sotterraneo` (la tabella qui sopra). Nel fumetto di una discesa
`[data-sotto-livello]` con `data-manca` (`arma` o `difesa`); i pezzi avanti nella
bottega: [roba.md](roba.md#la-bottega-e-lo-zaino).
