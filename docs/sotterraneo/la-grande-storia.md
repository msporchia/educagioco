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

| | discesa (chiave) | posto | passi | forma | scenario | piani | mostri di strada · capo |
|---|---|---|---|---|---|---|---|
| 0 | La cripta dell'altare (`altare`) | la scala dietro l'altare fra le colonne | 35 | corta, quattro stanze | cripta | 2 | scheletro e fantasma · scheletro |
| 1 | La scalinata antica (`cantine`) | la scala sotto l'arco | 40 | larga, sedici stanze | cantine | 2 | ratto e melma · orco |
| 2 | La torre in rovina (`torre`) | la porta in basso della torre | 44 | alta e stretta, 26×54 | fornace | 3 | pipistrello e vespone · troll |
| 3 | La grotta della scaletta (`gallerie`) | il buco nella roccia | 45 | tutta in profondità: piani piccoli | cantine | 5 | lupo e fungo · orco |
| 4 | La scala sommersa (`cisterna`) | la scala nello stagno | 51 | lunga e stretta, 64×24 | cripta | 3 | granchio e serpente · gigante |
| 5 | La botola segreta (`labirinto`) | la botola nel prato | 54 | un labirinto di sedici stanze | cantine | 3 | orco e goblin · troll |
| 6 | La miniera abbandonata (`fondo`) | la miniera dentro il monte | 55 | stretta e profonda | fornace | 4 | golem e ratto · gigante |
| — | l'abisso | il pozzo vecchio d'ardesia | 61 | gira fra tre forme | i tre | ∞ | gli abitanti di un tratto |

- **Meno pozzi**: il pozzo dal tetto rosso non è più una discesa (resta
  disegno), il pozzo d'ardesia è l'abisso, «il pozzo senza fondo». Le
  aperture nuove sono la torre e l'altare. Provato a contare: un pozzo come
  discesa è poco intuitivo, e l'utente ne ha voluti meno.
- **La forma la dà il piano**: `largo` e `alto` al posto del quadrato
  `misura` (la torre, la scala sommersa), `giri` per quante stanze. Mai lo
  stesso scenario due volte di fila (`unita/sotterraneo-abisso`).
- **Chi c'è per strada sono gli abitanti della discesa** (da due a quattro), per ambientazione ([mostri.md](mostri.md)); il suo caporale, fatto
  caporale, porta la chiave. Il capo è la base del mostro grosso dell'ultimo piano ([grossi.md](grossi.md)).
- **La grotta ha piani da quattro stanze**: ingresso, scala, portale e
  fonte. Niente forzieri: il pezzo della storia lo dà il guardiano
  dell'ultimo piano, il resto il banco.
- **Il record di fuori non si tocca**. `tappa` e `stelle` di fuori sono il
  massimo fra le avventure, e li leggono medaglie, esperienza e la riga
  della home: le stelle restano sotto l'indice di allora e la somma non
  cambia (togliere non abbassa il livello,
  [../core/progressi.md](../core/progressi.md)). Le avventure invece col
  mondo 4 ripartono da zero ([avventure.md](avventure.md#i-salvataggi-di-prima-si-azzerano)).

## La tabella dell'equipaggiamento

`PASSI[eroe][k]` sono i pezzi della fila con cui si **entra** nella
discesa k (l'ultima riga: nell'abisso). Dall'8 ottobre ogni pezzo ha un
livello ([rarita.md](rarita.md)), e la riga dice solo **quali**: il livello
lo dà il posto dove si trova.

| entra in | cavaliere | elfa | mago | nano |
|---|---|---|---|---|
| cripta | niente | niente | niente | niente |
| scalinata | spada corta | spada corta | verga | accetta |
| torre | + scudo di legno, panciotto | + scudo di legno, saio | + scudo di legno, saio | + scudo di legno, panciotto |
| grotta | spada | spada | bastone magico | ascia |
| scala sommersa | + scudo borchiato, amuleto azzurro | + amuleto azzurro | scettro, scudo di legno, amuleto azzurro | + amuleto azzurro |
| botola | + scudo di ferro, corazza | + scudo borchiato, manto | + manto | + corazza |
| miniera | spadone, corazza, amuleto d'ossa | arco lungo, manto | + scudo borchiato, amuleto rosso | bipenne |
| l'abisso | spada di ghiaccio, scudo del teschio | spadone, amuleto d'ossa | + scudo di ferro | + amuleto d'ossa |

**La roba attesa** (`robaAttesa` in `motore/storia.js`) non è più la riga
e basta: è la storia simulata discesa per discesa. Chi esce dalla discesa
j ha il pezzo della riga dopo a livello `livelloDeiPezzi(j + 1)` (il
livello atteso meno uno), più il pezzo col nome del suo mostro grosso
([grossi.md](grossi.md)), e tiene quello che rende di più (`vaAddosso`,
lo stesso giudizio della raccolta). Così la tabella vera, con livello,
⚔️, 🛡️ e ❤️ dell'eroe (punti dati come li dà il banco):

| entra in | cavaliere | elfa | mago | nano |
|---|---|---|---|---|
| cripta | 1 · 3 · 1 · 18 | 1 · 4 · 1 · 15 | 1 · 5 · 0 · 12 | 1 · 3 · 2 · 20 |
| scalinata | 2 · 5 · 3 · 28 | 2 · 6 · 3 · 25 | 2 · 7 · 2 · 21 | 2 · 5 · 4 · 30 |
| torre | 3 · 5 · 5 · 35 | 3 · 6 · 5 · 36 | 3 · 7 · 4 · 31 | 3 · 5 · 6 · 37 |
| grotta | 5 · 6 · 6 · 52 | 5 · 8 · 6 · 50 | 5 · 8 · 6 · 43 | 5 · 7 · 7 · 51 |
| scala sommersa | 7 · 9 · 7 · 57 | 7 · 12 · 7 · 52 | 7 · 12 · 7 · 43 | 7 · 9 · 8 · 57 |
| botola | 8 · 10 · 8 · 60 | 8 · 13 · 9 · 51 | 8 · 13 · 9 · 41 | 8 · 10 · 9 · 60 |
| miniera | 10 · 11 · 8 · 79 | 10 · 15 · 8 · 67 | 10 · 14 · 8 · 55 | 10 · 12 · 9 · 76 |

- **I pezzi dei grossi entrano nella tabella**: la Mazza di Grumo nella
  torre e nella grotta (il nano fino in fondo), lo Scudo di Fiammetta e il
  Ciondolo di Re Ossuto fino in fondo per tutti, il Giubbone di Minotto
  nella miniera. Le armi di classe tornano dalla scala sommersa.
- **Le pozioni attese** (`POZIONI_ATTESE`): niente, una boccetta, poi
  sempre di più, fino a tre ampolle e tre pozioni nell'abisso (le gemme
  della discesa di prima le comprano, e i forzieri ne danno).
- **Ogni discesa dà qualcosa, e braccio più difesa non calano mai**
  (`guastiDellaStoria`). Ogni pezzo lo porta la sua classe e ha un prezzo.
- **Un'arma a due mani che farebbe posare uno scudo col nome si giudica
  sui numeri**: per questo lo spadone e il bastone non arrivano più nella
  roba attesa, e il guardiano non li regala a chi ha già uno scudo
  migliore.

## Chi dà la riga dopo

- **Il guardiano dell'ultimo piano lascia il pezzo della riga dopo** che
  serve ancora (`premioPer`: la prima casella, l'arma prima). È l'unico
  bottino che arriva anche a chi va dritto.
- **I forzieri danno il pezzo che manca**, poi solo cose da bere o da
  accendere (`NEI_FORZIERI_DELLA_STORIA`).
- **Il mostro grosso lascia il suo pezzo col nome e un raro**
  ([grossi.md](grossi.md)): il primo è roba attesa, il secondo no.
- **I mostri di tutti i giorni a volte lasciano un pezzo** (dal 3 all'11%
  per specie, a tono col posto e con l'eroe, [rarita.md](rarita.md)): poco,
  perché la tabella dica ancora con che roba si arriva.
- **Il banco porta il passo dopo, non oltre** (`bancoDelPasso`): l'armaiolo,
  l'incantatrice (bacchette e stoffa) e il rigattiere hanno i pezzi della riga con cui si entra nella prossima
  discesa che ancora mancano e che vendono, e un paio di cose che non costano più di
  quei pezzi (e non sono della riga dopo ancora). Chi va dritto esce dalla
  discesa con le gemme che bastano al pezzo che il guardiano non dà (tabella
  sotto); chi gira tutto ne ha il doppio, e le spende in pozioni. I pezzi
  delle righe dopo si comprano, a un prezzo più alto quanto più sono avanti
  (`1 + righe` volte il prezzo pieno, [bottega.md](bottega.md#i-mercanti-di-sopra)):
  chi ha le gemme non è fermato dalla storia, la paga. Provato: pezzi
  bloccati finché non si finisce la discesa; l'utente: «se ho i soldi perché
  no».
- **Un pezzo comune serve se nella fila viene dopo quello che si ha**
  (`migliora`, il posto nella fila e non il numero); uno magico, raro o col
  nome si giudica sui numeri (`confronto().meglio`). Chi è già oltre la
  tabella non riceve una spada peggiore della sua. Le missioni danno solo gioielli o gemme (e a volte
  qualche moneta, [missioni.md](missioni.md)): un vantaggio, mai un passo.

## Il primo avvio

La gradazione è quello che rende il gioco interessante, ma si parte dal basso:
l'utente, il 9 ottobre, dopo la ritaratura coi livelli: «possiamo rendere un
attimo più facile il primo avvio del gioco». A mani nude (la roba di una
discesa prima, cioè niente) la scalinata a 8/10 si vinceva 1–5 volte su 20.
Il 9 ottobre un bambino che entrava senza aver comprato niente e rispondeva
bene la maggior parte delle volte la vinceva (75%); il 12 ottobre, con i
mostri tarati su un banco che usa le abilità, **si vince più di una volta su
due**: cavaliere 10 su 20, elfa 17, mago 7, nano 12 (57%). Con la prima arma è comoda (98% a
8/10, 89% a 6/10). **La sera del 13 ottobre, coi branchi grossi, a mani nude si vince di rado** (15%: cavaliere 0 su 20, elfa 9, mago 0, nano 3; con la prima arma 99% a 8/10,
78% a 6/10, 45% a 4/10): il bersaglio è «una volta su dieci almeno e meno che con la prima arma». Nudi non si arriva: il guardiano della cripta lascia la prima arma
per terra e l'armaiolo la vende a 9 💎. La scalinata che si vincesse al 70% nudi, come prima, a quattro su dieci si vincerebbe il 60%.

- **La leva è la spinta della scalinata** (2, con la forza a 0,5: i mostri cadono a un colpo e picchiano di 2–3 punti): più spinta e la scalinata si perde a
  sei su dieci, meno e a quattro su dieci si vince oltre il 60%. Prima (mattina del 13 ottobre) `forza` 0,55 e `spinta` 6,5 con i mostri uno alla volta
  (`tettoBranco` 1, `densita` 1,6), provato a farlo vincere al 70% nudi (`spinta` 3,5): a quattro su dieci con la roba attesa si vinceva il 60%.
- **Il mago nudo** non ha la bacchetta e non lancia niente: 0 su 20, e ha il guardiano di sempre (la melma caporale).
- **La forbice si allarga, non sparisce**: alla scalinata si sta larghi (6/10 quasi sempre, 4/10 a testa fino al 70%, 38% in media), dalla
  torre in poi tutto più stretto.
- **C'è sempre un'arma da comprare**: l'armaiolo ha la prima arma della
  riga (la spada corta, la verga, l'accetta) a 9 💎, e si esce dalla cripta con
  17–20 💎 in media (scheletro e fantasma lasciano 6 💎 ciascuno, a metà, e il guardiano
  dell'ultima stanza la prima arma anche per terra). `misure/sotterraneo` lo controlla per ognuno dei quattro eroi.

## Chi è sotto il livello lo sa prima di scendere

Toccando una discesa ancora da finire, se l'eroe è due livelli sotto
quello atteso il fumetto dice «… i mostri sono più forti di te: fatti le
ossa nelle discese di prima»; se no, se braccio o difesa con la roba di
adesso sono sotto quelli della roba attesa, il fumetto lo dice con la
voce del minatore e le cose che si hanno in mano: «Con quella spada corta
sotto la torre non duri: passa dal fabbro», «Nella grotta picchiano
forte, e senza scudo non reggi: passa dal fabbro» (`dettoDelLivello`: il mago a mani nude o senza
vesti è mandato dall'incantatrice, che vende la bacchetta e la stoffa; `daChiAndare`,
`dove` nella tappa per il posto in mezzo alla frase). Lo ripete il minatore
quando indica la prossima. Non vieta niente: si scende lo stesso. Vieta
solo il colore del pallino, quando la discesa è due gradini sopra la forza dell'eroe ([forza.md](forza.md)):
davanti c'è la sentinella ([zone.md](zone.md#il-pallino-e-la-sentinella)).
Finita la storia ogni discesa è una zona con una fascia di livelli fissa: [zone.md](zone.md).

## Le misure

`misure/sotterraneo` (o `npm run sotterraneo`, [scontro-bilancio.md](scontro-bilancio.md)), venti semi per discesa e per eroe,
dritti alla scala, col giocatore finto che usa le abilità, con la roba attesa (0), di una discesa prima (−1), di due avanti (+2), e con la
roba attesa ma l'eroe due livelli sotto o tre sopra. Discese vinte su venti, cavaliere · elfa · mago · nano (12 ottobre 2026):

| | cripta | scalinata | torre | grotta | sommersa | botola | miniera |
|---|---|---|---|---|---|---|---|
| attesa, a 8/10 | 20·20·20·20 | 18·20·20·20 | 20·20·17·20 | 19·20·17·20 | 20·18·18·20 | 18·19·18·17 | 20·19·16·20 |
| attesa, a 6/10 | 19·20·18·20 | 16·19·17·19 | 12·15·8·16 | 14·18·12·17 | 18·13·12·15 | 11·13·10·9 | 16·14·10·15 |
| attesa, a 4/10 | 14·17·12·18 | 4·12·5·9 | 4·4·0·8 | 3·8·2·7 | 7·6·4·4 | 4·2·2·2 | 6·5·2·5 |
| una prima, a 8/10 | 20·20·20·20 | 10·17·7·12 | 10·13·6·16 | 15·16·11·16 | 20·16·9·20 | 18·16·15·12 | 19·20·15·17 |
| due avanti, a 4/10 | 20·20·20·20 | 20·20·18·20 | 11·17·8·18 | 10·15·17·13 | 12·11·7·11 | 13·11·4·9 | 15·13·8·12 |
| due livelli sotto, a 8/10 | 20·20·20·20 | 11·17·18·17 | 8·18·6·15 | 6·16·4·16 | 8·15·12·9 | 14·14·13·11 | 20·11·7·11 |
| tre livelli sopra, a 4/10 | 20·20·18·20 | 17·19·17·17 | 18·18·13·18 | 18·18·14·19 | 12·13·10·9 | 9·9·6·7 | 19·12·13·18 |

- **A otto si arriva in fondo quasi sempre (95% in media), a sei circa tre volte su quattro (74%), a quattro una volta su tre
  (32%)**: l'elfa e il nano i più comodi, il mago il più fragile. Prima della taratura, con il banco che non usava le abilità, a
  otto 90%, a sei 68%, a quattro 30%: sono le stesse cifre, ma giocate da uno che le abilità le usa
  ([scontro-bilancio.md](scontro-bilancio.md)).
- **La storia giocata davvero** (`misuraConLaRoba`, la fila del banco con spesa, livelli, punti, bottino e pozioni dal caso),
  dalla cripta alla miniera, discese vinte:

| chi | a 8/10 | a 6/10 | a 4/10 |
|---|---|---|---|
| va dritto | 100·96·90·93·93·80·100 | 95·84·81·78·94·74·85 | 88·66·57·34·49·24·46 |
| gira tutto e spende | 100·91·100·100·99·98·100 | 95·90·94·99·96·95·100 | 88·73·80·83·73·64·95 |
| con 100 gemme da parte (botola · miniera) | 93 · 94 | 57 · 71 | 14 · 23 |
| con 250 gemme da parte (botola · miniera) | 94 · 94 | 60 · 74 | 15 · 28 |

- **Chi gira tutto guadagna molto di più**: arriva tre livelli sopra chi va dritto, coi pezzi dei grossi e il bottino a tono, e a quattro vince
  metà delle discese. È la ricompensa di chi esplora; il tetto in `misure/sotterraneo` è 0,95 a quattro.
- **La taratura** sono `forza` (le ossa) e `spinta` (l'attacco) di ogni discesa in `dati/campagna.js`, sulla roba e sul livello
  attesi: forza 0,25 · 0,5 · 0,5 · 0,8 · 1,1 · 1,25 · 1,8, spinta −2 · 2 · 4,5 · 5,8 · 7 · 7,7 · 9 dalla cripta alla miniera, `COLPO_DEL_MOSTRO` 1,1
  (la sera del 13 ottobre, coi branchi grossi: [taratura-branchi.md](taratura-branchi.md); la mattina 0,4 · 0,55 · 0,9 · 1,4 · 2,25 · 3 · 4 e 0 · 6,5 · 6,8 · 9,6 · 9,8 · 10 · 11,
  con una `densita` che adesso non c'è più). Le specie hanno tutte otto ossa e la forza viene da qui (prima la faceva la fascia).
- **Le gemme con cui si esce andando dritti** (cavaliere): 12 · 17 · 36 · 41 · 61 · 57 · 83 (prima 10 · 19 · 24 · 29 · 38 · 37 · 56):
  più mostri uccisi e più forti, e le gemme valgono di più a livello alto, come i prezzi
  ([rarita.md](rarita.md)).
- **Il minimo per scendere** (media dei quattro eroi, roba attesa, otto semi, `npm run sotterraneo -- --domande`): 10 · 19 · 20 · 23 · 24 · 31 · 27
  domande, sotto il tetto di una seduta (85); girando tutto 19 · 71 · 57 · 47 · 56 · 110 · 75 (la mattina del 13 ottobre, coi piani di prima:
  8 · 8 · 17 · 22 · 26 · 29 · 38 e 13 · 41 · 47 · 34 · 65 · 89 · 94). Con i branchi il «tutto» della scalinata e della botola, i due piani da sedici
  stanze, resta sopra: [taratura-branchi.md](taratura-branchi.md).

Nei test: `unita/sotterraneo-storia` (la tabella sta in piedi, ogni
discesa dà il primo pezzo della riga dopo e a chi è avanti niente, la roba
attesa coi pezzi dei grossi e il livello atteso, i mostri di tutti i
giorni che lasciano un pezzo poco e a tono, chi è sotto il livello e la
frase, le missioni), `unita/sotterraneo-roba` (il banco porta il passo dopo e
mai la riga dopo, sei semi d'equilibrio), `unita/sotterraneo-terra` (la
partenza nel villaggio, le discese in fila per strada),
`misure/sotterraneo` (la tabella qui sopra). Nel fumetto di una discesa
`[data-sotto-livello]` con `data-manca` (`livello`, `arma` o `difesa`); i pezzi avanti nella
bottega: [bottega-finestra.md](bottega-finestra.md#la-bottega-e-lo-zaino).
