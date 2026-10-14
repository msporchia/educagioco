# La taratura dei branchi (13 ottobre 2026, sera)

In un giorno erano cambiate insieme tante cose: i branchi più che raddoppiati (stanze vuote dal 68% al 15%, mostri per piano da 6,9 a 15,9, il
grosso con due o tre scagnozzi: [piani.md](piani.md#i-mostri-branchi-appostati-caporali)), l'iniziativa dell'eroe, i costi del mana dal globo
della classe ([abilita-energia.md](abilita-energia.md)), la forza che dà difesa e la tempra solo vita, le armi a due mani, il mana che torna
camminando e gli incanti preparati ([orologio.md](orologio.md)). Ognuna era verde da sola. Insieme, con i mostri di prima: a otto risposte
giuste su dieci in fondo il **22%** delle volte (media dei quattro eroi, roba e livello attesi, 20 semi), a sei il 10%, a quattro l'1%; le domande
per piano quasi raddoppiate. La regola dell'utente: **i branchi grossi restano** («troppe stanze vuote e troppi mostri da soli»), quindi a mostri
più numerosi corrisponde **un mostro singolo più debole**. Le leve sono la vita (`forza`) e l'attacco (`spinta`) dei mostri; non `COLPO_DEL_MOSTRO`
(decisione dell'utente in sospeso: sotto) e non il numero dei mostri. Il banco: [scontro-bilancio.md](scontro-bilancio.md); i comandi:
`npm run sotterraneo -- --verifica|--diag|--zone|--domande|--strada tutte --sintesi|--turni|--abisso` ([../core/comandi.md](../core/comandi.md)).

## Cosa si è scoperto

- **La spinta decide chi vince, la forza quante domande costa.** Un mostro colpisce `COLPO_DEL_MOSTRO × (attacco − difesa)` arrotondato: a
  numeri così piccoli (2, 3, 4 per colpo) un decimo di spinta cambia il colpo di un intero per tutti insieme, e le vittorie fanno un gradino
  (scalinata a 8/10: spinta 3 → 99%, 3,3 → 88%). Si sceglie il valore a metà di un pianoro. La forza (ossa) cambia poco le vittorie e molto le
  domande, ma fino a un punto: un mostro che cade a un colpo costa una domanda, e sotto non si scende.
- **Con un branco da tre il colpo del mostro non può superare i 3–4 punti** (tre mostri, sei colpi per gruppo, 28 di vita): oltre non c'è
  taratura che regga, perché il gruppo non muore prima di aver colpito. Per questo la spinta delle prime discese è piccola, e quella della cripta
  negativa.
- **Un branco grande si abbatte con le abilità ad area**, ma il banco spende il mana come un bambino che sa cosa fa e il globo del cavaliere e del
  nano è dieci: le domande «girando tutto» non calano sotto una a mostro.

## Le leve, prima → dopo

| leva | prima | dopo |
|---|---|---|
| `forza` (ossa) di cripta · scalinata · torre · grotta · sommersa · botola · miniera | 0,4 · 0,55 · 0,9 · 1,4 · 2,25 · 3 · 4 | 0,25 · 0,5 · 0,5 · 0,8 · 1,1 · 1,25 · 1,8 |
| `spinta` (attacco) delle stesse | 0 · 6,5 · 6,8 · 9,6 · 9,8 · 10 · 11 | **−2** · 2 · 4,5 · 5,8 · 7 · 7,7 · 9 |
| le zone (`CURVA_DELLE_ZONE`) | forza 4 + 0,6 a livello, spinta 13 + 1,0 | forza 2,2 + 0,15, spinta 9,5 + 1,3 |
| la forma delle zone | cripta 2,2 · scalinata 0,75 · sommersa 0,95 · miniera 1,35 | 1,7 · 1 · 1,2 · 1,2 |
| l'abisso | forza 5, spinta 12 | forza 2,2, spinta 9 |
| velocità dell'eroe | 6 + 1,5 a punto di destrezza | **7 + 1 a punto** |
| il mago | difesa 0, lanci 6 · 6 · 5 · 3 · 1, vita 12 | difesa 1, lanci 6 · 6 · 6 · 4 · 1, vita 13 |
| esperienza e gemme di un mostro di strada | tutta | il 35% (`QUOTA_DEL_COMUNE`; il grosso e i caporali tutto) |
| il mostro grosso | ossa della specie × il suo moltiplicatore | almeno due ossa più del suo simile (nella cripta la specie ha due ossa) |

- **La spinta della cripta è negativa** (−2, cioè un colpo di uno per tutti: i mostri hanno attacco 3, l'eroe difesa 1–2). La cripta si comincia
  a mani nude e con tre mostri addosso non c'è altro modo: a quattro su dieci si vince il 70–80%, e con spinta −1 il 56%. `guastiDellaCampagna` lascia
  la spinta da −3 a 12 e la forza da 0,2; la regola resta «niente forza né spinta sopra il bestiario» nella prima.
- **L'esperienza** doveva scendere: più mostri, più esperienza. Entrando nella miniera chi andava dritto aveva il livello 13,8 (atteso 10) e
  chi girava tutto 19,5 (atteso 13); le gemme all'uscita dalla botola 190 (57 prima). Al 35%: livello 1 · 1,9 · 3,1 · 5,2 · 7,4 · 9,2 · 11,5 andando
  dritto, 1 · 2 · 4,6 · 7 · 9,6 · 11,9 · 14,1 girando tutto (`LIVELLI_ATTESI` 1 · 2 · 3 · 5 · 7 · 8 · 10); a metà (50%) i livelli di ingresso erano 2 sopra. Meno
  esperienza strada facendo vuol dire anche meno livelli presi *dentro* la discesa, e questo è nella taratura (il livello in più della discesa si
  conta nella spinta).
- **Il mago**: dif 1 e vita 13 pesano nelle prime due discese (con 12 di vita il mago della cripta a 4/10 vinceva il 50%, con 13 il 75%); i lanci
  alla riga 2 e 3 pesano dopo (a livello atteso, 6/10: 52% → 66%). La destrezza è nella pagina del mago: [abilita-energia.md](abilita-energia.md#la-fila-dei-turni).

## Le tabelle, prima → dopo

Discese vinte, media dei quattro eroi, venti semi, dritti alla scala (`npm run sotterraneo -- --semi 20 --scarti 0,-1,2 --livelli -2,3`).
Cripta · scalinata · torre · grotta · sommersa · botola · miniera.

| | prima (oggi, con i mostri di ieri) | dopo |
|---|---|---|
| attesa, 8/10 | 74 · 16 · 8 · 8 · 16 · 19 · 13 (media 22) | 100 · 99 · 94 · 100 · 99 · 100 · 90 (97) |
| attesa, 6/10 | 50 · 1 · 3 · 1 · 5 · 1 · 8 (10) | 100 · 78 · 57 · 80 · 75 · 60 · 65 (74) |
| attesa, 4/10 | 9 · 1 · 0 · 0 · 0 · 0 · 0 (1) | 70 · 45 · 11 · 11 · 19 · 20 · 18 (28) |
| una prima, 8/10 (la scalinata: a mani nude) | | 100 · 15 · 24 · 94 · 99 · 94 · 86 (73) |
| due avanti, 4/10 | | 95 · 93 · 48 · 66 · 66 · 54 · 35 (65) |
| due livelli sotto, 8/10 | | 100 · 85 · 53 · 79 · 64 · 91 · 65 (77) |
| tre livelli sopra, 4/10 | | 96 · 96 · 64 · 73 · 73 · 69 · 39 (73) |

Per classe (media delle sette discese, a 8/10 · 6/10 · 4/10): cavaliere 12 · 1 · 0 → **96 · 60 · 17**, elfa 38 · 15 · 4 → **100 · 86 · 39**, mago
9 · 7 · 0 → **95 · 70 · 24**, nano 28 · 16 · 1 → **99 · 78 · 31**. Il mago non è più la classe debole (il cavaliere sì, adesso: sotto).

**Le domande obbligate** (`--domande`, rispondendo sempre giusto, media dei quattro eroi, otto semi, roba di chi ci arriva dritto):

| | cripta | scalinata | torre | grotta | sommersa | botola | miniera |
|---|---|---|---|---|---|---|---|
| minimo, 13 ottobre mattina | 8 | 8 | 17 | 22 | 26 | 29 | 38 |
| minimo, con i branchi e i mostri di ieri | 13 | 20 | 23 | 30 | 38 | 52 | 50 |
| **minimo, dopo** | 10 | 19 | 20 | 23 | 24 | 31 | 27 |
| tutto, mattina | 13 | 41 | 47 | 34 | 65 | 89 | 94 |
| tutto, con i mostri di ieri | 22 | 71 | 56 | 53 | 77 | 162 | 117 |
| **tutto, dopo** | 19 | 71 | 57 | 47 | 56 | 110 | 75 |

Il minimo (il tetto di 85 a seduta, [regole.md](regole.md#le-domande)) è tornato nel range di prima, la sommersa e la miniera sotto. **Il «tutto» della scalinata (71
contro 41) e della botola (110 contro 89) resta sopra**: sono i due piani da sedici stanze, e girandole tutte i mostri sono 55 e 100, uno a domanda
anche con la vita al minimo. Le leve sarebbero i branchi (`tettoBranco` 3 → 2 e 5 → 3 con `densita` 0,7: 61 e 87) o le stanze (`giri` 4 → 3): non
girate, perché toglierebbero i branchi che l'utente vuole.

**La storia giocata davvero** (`--vere`, con la spesa e il bottino), vinte a 8 · 6 · 4 su 10:

| chi | 8/10 | 6/10 | 4/10 |
|---|---|---|---|
| va dritto | 100 · 84 · 83 · 99 · 99 · 99 · 94 | 93 · 75 · 51 · 81 · 90 · 85 · 71 | 68 · 56 · 31 · 39 · 53 · 44 · 28 |
| gira tutto e spende | 100 · 100 · 100 · 100 · 100 · 100 · 100 | 93 · 100 · 94 · 100 · 99 · 98 · 96 | 68 · 93 · 74 · 84 · 84 · 65 · 84 |
| con 100 gemme da parte (botola · miniera) | 100 · 84 | 66 · 74 | 19 · 21 |
| con 250 gemme da parte (botola · miniera) | 100 · 90 | 66 · 74 | 23 · 26 |

**Le zone** ([zone.md](zone.md#le-misure)), al 12 · 16 · 20 · 30, media: 8/10 97 · 95 · 97 · 97%, 6/10 71 · 73 · 64 · 68%, 4/10 15 · 16 · 7 · 9%
(prima 11 · 17 · 30 · 33% a 8/10 e 2–6% a 6/10); livelli presi da 0,8 a 2,2.

**Le strade** (`--strada tutte --sintesi`, 16 semi, a 8/10 · 6/10, media delle tre strade): a livello atteso cavaliere 75 · 44, elfa 92 · 70, mago 60 · 39, nano 89 · 67;
**a +5 livelli** cavaliere 99 · 96, elfa 100 · 99, **mago 98 · 86**, nano 100 · 99 (prima il mago 46–60%, gli altri 73–99% a 8/10).

**L'abisso** (otto semi, bravura 0,8): ferma ai piani, in media cavaliere 16, elfa 22, mago 10, nano 14 (prima della taratura 4–9 piani, media 5–6 per tutti). Il
costo di un piano resta sotto i 40, e la media per piano sotto i 30.

**Velocità e doppi turni** ([abilita-energia.md](abilita-energia.md#la-fila-dei-turni)): cavaliere, mago e nano 9 · 9 · 10 · 10 · 11 · 11 · 11, elfa 11 · 11 · 12 · 12 · 13 · 13 · 13.

## I colori per chi segue la storia

La forza dell'eroe in regola, con la roba, il livello e le abilità della strada attesi (`eroeAtteso`), vale il suo livello per tutti e quattro, quindi
entrando nella discesa `k` quella è verde, la successiva arancio, quella dopo ancora rossa, e **la storia non si blocca** (`unita/sotterraneo-forza`: da 1 a 45
l'eroe atteso non sbaglia di più di uno, il mago all'8 sbagliava di due con la miniera a forza 2,2: la forza della botola e della miniera sale adesso
senza salti). Un eroe in regola che **non ha speso i punti dell'albero** (`robaAttesa` e `crescitaAttesa` da sole) vale invece uno o due livelli meno
(la cura e le due abilità forti sono circa tre volte il suo rapporto): trova arancio la discesa che entra fino alla torre, e **rossa la grotta (cavaliere, nano), la
sommersa e oltre (nano, mago alla botola)**. È voluto dalla forza ([forza.md](forza.md)) e coerente con i numeri (senza abilità il banco vince a 8/10 il 70% invece del 97%), ma
è la cosa da decidere, sotto.

## I bersagli

Tornati quelli di prima i quattro che la mattina erano stati allentati: il mago alla scala sommersa 6 su 8 (4), la scala sommersa bene 7 su 8 (6), la
roba attesa a 8/10 5 su 6 (3), le missioni di caccia senza il 10% di vita in più, il tetto dei livelli di una zona verde 2 (2,2). Non tornato: la roba da 30+ gemme
in fondo (79,5% dei banchi, bersaglio 0,8): dipende dal banco di sopra, non dai mostri.

Cambiati, perché con i branchi il gioco dice un'altra cosa (`misure/sotterraneo`):
- **La scalinata a mani nude a 8/10: ≥ 50% in media e ≥ 30% a testa → ≥ 10% in media e meno che con la prima arma** (ora 15%: cavaliere 0/20, elfa 9, mago 0,
  nano 3). Provato: a 8/10 il 70% nudi vorrebbe la spinta a 2 e la scalinata a 4/10 col 60% (ma serve ≤ 45%: il documento della scalinata sceglie il 4/10). Nudi
  non si arriva: il guardiano della cripta lascia la prima arma per terra e l'armaiolo la vende a 9 💎 ([la-grande-storia.md](la-grande-storia.md#il-primo-avvio)).
- **Tre livelli sopra, a 4/10, la scalinata: ≤ 90% → ≤ 98%** (96%): la scalinata è la discesa dei primi passi.
- **L'arancio più duro** (l'eroe del 12 contro la zona 16–19) a 8/10: ≥ 20% → ≥ 10% (14%): quattro livelli sotto con i branchi pesano di più.

## Cosa resta da decidere

- **`COLPO_DEL_MOSTRO` (1,1)**, non toccato. A colpi di 2–4 punti l'arrotondamento fa i gradini che si sono visti e una cripta con spinta −2; con 0,8 il colpo
  di un mostro con attacco 3 contro difesa 1 è 2 (1,6) e non 1: serve a poco nelle prime due e di più dopo. Numeri nelle note della sessione.
- **Il «tutto» della scalinata e della botola** (sopra).
- **Il cavaliere** è la classe più debole a 6/10 (60%; l'elfa 86, il nano 78, il mago 70): a metà strada ha poco danno (le armi a una mano) e la sua
  forza è la difesa, che con i colpi piccoli vale meno. Non toccato.
- **Chi non spende i punti dell'albero** può trovare la sentinella davanti alla grotta o alla sommersa (sopra): o si accetta, o la forza conta meno le abilità.
