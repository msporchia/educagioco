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
- **Il banco porta il passo dopo, non oltre** (`bancoDelPasso`): l'armaiolo
  e il rigattiere hanno i pezzi della riga con cui si entra nella prossima
  discesa che ancora mancano, e un paio di cose che non costano più di
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
Adesso **un bambino che entra senza aver comprato niente e risponde bene la
maggior parte delle volte la vince**, e con la prima arma è comoda.

- **La leva è la forza della scalinata**: tolta (da 1,55 a 1, le ossa dei
  mostri sono quelle del bestiario), la spinta resta 5. Provato: più spinta e
  meno forza stringe meglio la forbice fra chi è nudo e chi ha l'arma (a
  forza 1,2 e spinta 4 il nudo vinceva il 64% e chi ha l'arma il 26% a 4/10;
  a forza 1 e spinta 5 il 76% e il 28%).
- **Prima e dopo** (venti semi per eroe, cavaliere · elfa · mago · nano):

| scalinata | prima | dopo |
|---|---|---|
| a mani nude, a 8/10 | 1·5·3·3 (15%) | 10·18·16·16 (75%) |
| roba attesa, a 6/10 | 7·15·12·17 (64%) | 20·20·17·20 (96%) |
| roba attesa, a 4/10 | 0·1·0·2 (4%) | 3·8·4·7 (28%) |
| chi va dritto (storia giocata), 8 · 6 · 4/10 | 83 · 63 · 15% | 100 · 85 · 41% |
| domande, solo il guardiano · tutto il piano (cavaliere, un seme) | 22 · 75 | 15 · 59 |

- **Il cavaliere resta il più duro** anche nudo (10 su 20): braccio 4, difesa 1
  e 21 di vita contro i 28 con la spada corta e lo scudo. Il test pretende il
  70% in media e almeno metà a testa.
- **La forbice si allarga, non sparisce**: alla scalinata si sta larghi
  (6/10 fino al 100% in media, 4/10 fino al 45% a testa, dove le altre
  discese stanno a 80% e 30%), dalla torre in poi tutto com'era. Le discese
  dopo non sono state toccate: le loro righe nella tabella sono le stesse.
- **C'è sempre un'arma da comprare**: l'armaiolo ha la prima arma della
  riga (la spada corta, la verga, l'accetta) a 9 💎, e si esce dalla cripta con
  12–15 💎 in media (il guardiano dell'ultima stanza la lascia anche per
  terra). `misure/sotterraneo` lo controlla per ognuno dei quattro eroi.

## Chi è sotto il livello lo sa prima di scendere

Toccando una discesa ancora da finire, se l'eroe è due livelli sotto
quello atteso il fumetto dice «… i mostri sono più forti di te: fatti le
ossa nelle discese di prima»; se no, se braccio o difesa con la roba di
adesso sono sotto quelli della roba attesa, il fumetto lo dice con la
voce del minatore e le cose che si hanno in mano: «Con quella spada corta
sotto la torre non duri: passa dal fabbro», «Nella grotta picchiano
forte, e senza scudo non reggi: passa dal fabbro» (`dettoDelLivello`,
`dove` nella tappa per il posto in mezzo alla frase). Lo ripete il minatore
quando indica la prossima. Non vieta niente: si scende lo stesso.

## Le misure

`misure/sotterraneo`, venti semi per discesa e per eroe, dritti alla scala,
con la roba attesa (0), di una discesa prima (−1), di due avanti (+2), e
con la roba attesa ma l'eroe due livelli sotto o tre sopra. Discese vinte
su venti, cavaliere · elfa · mago · nano (8 ottobre 2026, coi livelli):

| | cripta | scalinata | torre | grotta | sommersa | botola | miniera |
|---|---|---|---|---|---|---|---|
| attesa, a 8/10 | 20·20·20·20 | 20·20·20·20 | 20·20·20·20 | 20·20·20·20 | 20·20·20·20 | 20·20·20·20 | 20·20·20·20 |
| attesa, a 6/10 | 20·20·20·20 | 20·20·17·20 | 11·17·14·18 | 7·17·8·19 | 8·18·16·13 | 5·19·15·13 | 9·17·11·18 |
| attesa, a 4/10 | 13·19·13·20 | 3·8·4·7 | 0·0·0·0 | 0·1·0·1 | 0·3·0·1 | 0·0·0·0 | 0·1·0·0 |
| una prima, a 8/10 | — | 10·18·16·16 | 18·18·20·19 | 19·19·18·20 | 20·20·19·20 | 13·20·16·20 | 18·20·20·20 |
| due avanti, a 4/10 | 20·20·20·20 | 20·20·18·20 | 6·16·5·7 | 3·8·6·3 | 3·6·5·10 | 7·5·0·13 | 1·6·1·11 |
| due livelli sotto, a 8/10 | 20·20·20·20 | 20·20·20·20 | 20·20·20·19 | 13·19·17·19 | 17·19·19·19 | 8·19·17·15 | 18·20·19·19 |
| tre livelli sopra, a 4/10 | 20·20·20·20 | 12·13·9·18 | 8·14·10·16 | 6·13·7·12 | 5·11·5·9 | 0·6·10·4 | 0·4·1·3 |
| attesa, gira tutto, a 8/10 (cav · mago) | 19·20 | 20·20 | 20·20 | 20·19 | 20·20 | 17·20 | 20·20 |

- **A otto si arriva in fondo sempre, a sei un po' più di metà, a quattro
  quasi mai** (la scalinata fa eccezione, [sotto](#il-primo-avvio)): a sei,
  in media fra i quattro, 96 · 75 · 64 · 69 · 65 · 69% dalla scalinata alla
  miniera (prima dei livelli 49 · 74 · 51 · 69 · 72 · 66%). Il cavaliere resta
  il più duro (25–55%), l'elfa e il nano i più comodi (65–95%), come prima.
- **Una discesa prima**: a otto ci si arriva quasi sempre dalla torre in
  giù; la scalinata a mani nude 10·18·16·16 su 20 (il primo avvio, sotto),
  e il minatore dice di passare dall'armaiolo.
- **Due livelli sotto** pesano come una discesa prima; **tre sopra** a
  quattro vincono da 0 a 16 volte su 20: il livello aiuta, non regala.
- **Chi gira tutto** combatte tre volte tanto con la stessa roba: a otto
  arriva in fondo da 17 a 20 volte su 20.
- **La storia giocata davvero** (`misuraConLaRoba`, la fila del banco con
  spesa, livelli, punti, bottino e pozioni dal caso), dalla cripta alla
  miniera, discese vinte:

| chi | a 8/10 | a 6/10 | a 4/10 |
|---|---|---|---|
| va dritto | 100·100·98·100·95·95·99 | 99·85·80·60·70·56·68 | 94·41·25·6·16·19·23 |
| gira tutto e spende | 100·99·100·100·100·100·100 | 99·93·95·99·98·91·96 | 94·61·73·44·54·45·54 |
| prima, gira tutto | 100·95·100·100·100·98·91 | 99·61·85·84·83·54·40 | 93·10·29·15·11·8·5 |
| con 250 gemme da parte | 100 dappertutto | 100·100·98·95·100·86·76 | 100·91·29·19·33·0·0 |
| prima, con 250 gemme | 100 dappertutto | 100·100·100·100·98·80·71 | 100·89·84·68·46·9·4 |

(Le due righe «prima» sono dell'8 ottobre, quando la scalinata era più dura:
le altre colonne non sono cambiate di più di qualche punto, la scalinata sì.)

- **Chi gira tutto adesso guadagna molto di più** che prima: arriva tre
  livelli sopra chi va dritto, coi pezzi dei grossi e il bottino a tono, e
  a quattro vince metà delle discese. È la ricompensa di chi esplora; il
  tetto in `misure/sotterraneo` è 0,8 a quattro.
- **La taratura** sono `forza` (le ossa) e `spinta` (l'attacco) di ogni
  discesa in `dati/campagna.js`, sulla roba e sul livello attesi:
  forza 1 · 1,35 · 1,65 · 2,9 · 5,1 · 4,85, spinta 5 · 7 · 9 · 9 · 9 ·
  10 dalla scalinata alla miniera (la cripta resta com'era; la scalinata
  ha la forza di tutti, il perché è qui sotto). La spinta più
  alta di prima tiene corti gli scontri: i mostri mordono di più invece di
  avere più ossa.
- **Le gemme con cui si esce andando dritti** (cavaliere): 12 · 23 · 35 ·
  53 · 42 · 47 · 54 (prima 10 · 12 · 20 · 23 · 23 · 33 · 27): le gemme
  valgono di più a livello alto, come i prezzi
  ([rarita.md](rarita.md)).
- **Il minimo per scendere** (cavaliere, roba attesa, un seme): 15 · 18 ·
  21 · 44 · 36 · 62 · 60 domande, sotto il tetto di una seduta (85);
  girando tutto 26 · 71 · 64 · 69 · 78 · 201 · 167 (prima 14 · 22 · 35 ·
  48 · 43 · 58 · 39 e 26 · 99 · 82 · 76 · 89 · 172 · 142).

Nei test: `unita/sotterraneo-storia` (la tabella sta in piedi, ogni
discesa dà il primo pezzo della riga dopo e a chi è avanti niente, la roba
attesa coi pezzi dei grossi e il livello atteso, i mostri di tutti i
giorni che lasciano un pezzo poco e a tono, chi è sotto il livello e la
frase, le missioni), `unita/sotterraneo-roba` (il banco porta il passo dopo e
mai la riga dopo, sei semi d'equilibrio), `unita/sotterraneo-terra` (la
partenza nel villaggio, le discese in fila per strada),
`misure/sotterraneo` (la tabella qui sopra). Nel fumetto di una discesa
`[data-sotto-livello]` con `data-manca` (`livello`, `arma` o `difesa`); i pezzi avanti nella
bottega: [bottega.md](bottega.md#la-bottega-e-lo-zaino).
