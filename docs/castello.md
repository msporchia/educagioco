[← torna al README](../README.md)

# 🏰 Difendi il Castello

*Un tower defense dove ogni torre si paga con un'operazione in colonna.* I
mostri camminano lungo il sentiero verso il castello; per fermarli servono
torri, e per costruire una torre bisogna fare il conto.

<img src="img/castello-gioco.png" width="230"> <img src="img/castello-calcolo.png" width="230"> <img src="img/castello-mappa.png" width="230">

## Come è fatto

Venti tappe in quattro campagne (il bosco, il sottosuolo, le mura, la
palude), e in coda quattro partite libere, una per terreno. Ogni tappa ha il
suo scenario, i suoi mostri e la sua scaletta di operazioni.

Il ciclo è: arriva l'ondata → serve una torre → **compare l'operazione in
colonna** → si scrive il risultato cifra per cifra, coi riporti → la torre si
costruisce. Chi sbaglia paga una penale in energia, non perde la partita.

## Si compra toccando il campo

Il campo si prende tutto lo schermo e non c'è nessun banco di bottoni sotto:
**si tocca una piazzola vuota** e un foglio sale a chiedere che torre
costruirci, **si tocca una torre** e sale la sua scheda — falla salire di
livello, oppure spostala (gratis: è tattica, non un acquisto). Il conto da
fare sta dentro lo stesso foglio.

Dove si può comprare si vede sul campo: le piazzole respirano quando
l'energia basta per una torre nuova, e le torri hanno un bollino verde
quando basta per farle salire. Mentre si calcola **il campo non si ferma** —
un minimo di fretta ci va — ma si rimpicciolisce per restare visibile sopra
il foglio. Con due dita si sposta e si ingrandisce la mappa, e un doppio
tocco la rimette tutta in quadro.

## A metà scaletta una torre sceglie che fare

Dal sottosuolo in poi, al quarto gradino, il tasto «potenzia» lascia il posto
a **due carte**: l'arciere diventa cecchino (vede lontano, colpisce forte) o
raffica (due frecce per volta); la magica diventa veleno (colpisce piano ma
il male continua) o catena (il colpo rimbalza sui vicini); il ghiaccio
diventa bufera (gela larghissimo) o brina (frena di più, e chi è gelato
prende più danno); le bombe diventano mortaio (arriva lontanissimo) o napalm
(scoppia largo e lascia tutti a bruciare).

La scelta **non costa un calcolo in più**: è quello che il calcolo del
gradino compra, e si presenta dopo aver deciso di salire. E i due rami
valgono lo stesso: cambia la forma del danno, non la quantità — nessuno dei
due è la scelta sbagliata.

## Due porte da difendere

Due tappe — *Le fogne* e *Il torrione* — tutta la Palude e le quattro
partite libere hanno **due ingressi**: due strade che scendono da parti
diverse e arrivano allo stesso castello. Le ondate si alternano fra le due
bocche, e ogni terza arriva da tutte e due insieme; il nastro in cima dice
da dove, tre ondate prima, così si fa in tempo a spostare una torre dalla
parte giusta.

## Quattro partite libere, una per terreno *(settembre 2026)*

Finita la campagna si aprono **quattro partite senza fine** insieme, una per
terreno: *La radura grande* nel bosco, *Il bivio* sotto terra, *Il bastione*
sulle mura, *Il delta* nella palude. Ognuna prende dalla sua campagna tutti i
mostri che ci vivono, le torri dell'ultima tappa e la regola dei rami (nel
bosco niente rami, come nella campagna), e ha un tracciato suo — il più
intricato del suo mondo: un anello attorno a una radura, due cunicoli che si
incontrano in una galleria sola, un delta che si sdoppia attorno a un'isola —
tre con due bocche che si fondono, e **il bastione**, a una bocca sola, dove
la strada fa un cappio e **ripassa sopra sé stessa**: un mostro passa due
volte dall'incrocio, e le torri piazzate lì gli sparano all'andata e al
ritorno.

Ce n'era una sola, a strada singola, per paura che con due bocche non si
riuscisse a tararla. Adesso ognuna si tara da sola (`npm run tara`, venti
ondate e il suo passo di crescita oltre), e il test dice dove cede ciascuna.

**Un record per terreno.** Sul tasto di ogni libera c'è il suo record, e
nella tabella dei record di *I miei progressi* ci sono quattro righe. Chi
aveva un record della vecchia partita libera se lo ritrova sotto il bosco,
che era il bosco anche allora. In home, dove c'è posto per una riga sola, si
legge il record **fatto più di recente**: quattro terreni non si confrontano
fra loro, e quello di ieri sera è quello che il bambino ha in testa.

**I regali sono gli stessi su tutti i terreni**: un potenziamento preso nel
bosco vale anche sulle mura. Sono una cosa che ci si porta dietro, e quattro
tasche separate avrebbero voluto dire ricominciare da zero a ogni cambio di
terreno.

## Quali operazioni escono, e quanto crescono

Ogni tipo di operazione ha **dieci gradini**, e ogni gradino cambia *una cosa
sola*: prima quante cifre, poi i riporti, poi quanti numeri in colonna.
Perché «sai fare 27+15, adesso prova 247+185+96» è un salto, non un passo.

Qualche esempio vero, generato dal gioco:

| gradino | addizioni | sottrazioni |
|---|---|---|
| 1 | `31 + 15` | `58 − 23` |
| 2 | `71 + 75` — arriva il riporto | `604 − 87` — arriva il prestito |
| 3 | `247 + 185` | `587 − 357` |
| 4 | tre addendi | prestiti doppi, zeri di mezzo |

| gradino | moltiplicazioni | divisioni |
|---|---|---|
| 1 | `47 × 6` | `84 : 4`, esatta |
| 2 | `47 × 6` con riporti | `421 : 3`, col resto |
| 3 | `21 × 32` — due cifre | `8155 : 7`, dividendo lungo |
| 4 | numeri grandi | con lo zero nel quoziente |

Una torre si costruisce al primo gradino e sale uno alla volta: la scaletta
si percorre tutta e in ordine, non si salta.

**Ogni tappa dichiara fin dove può arrivare.** Le prime si fermano ai primi
gradini delle addizioni; le ultime arrivano in fondo, divisioni comprese.

Le divisioni si possono **spegnere dai settaggi**: quando sono spente, la
torre che le chiederebbe passa a moltiplicazioni più difficili. Il gioco
degrada invece di sbarrare — nessuna tappa diventa impossibile.

## Quanto dura una tappa è calibrato, non casuale

**Ogni tappa dichiara quante operazioni costa finirla** — sei nella prima,
trenta nell'ultima — e tutto il resto viene calcolato a partire da quel
numero: il piano degli acquisti, quante ondate servono a pagarlo, l'energia
di partenza, quante postazioni ci sono.

Per un genitore la domanda che conta non è «quanti mostri ci sono» ma
**quanto esercizio chiede questa tappa**: sei conti sono dieci minuti, trenta
sono un pomeriggio. Quel numero è scritto nel gioco, tappa per tappa, e il
resto si adatta di conseguenza — compresa la resistenza dei mostri, che un
simulatore misura giocando la tappa migliaia di volte per assicurarsi che sia
superabile senza essere una passeggiata.

## Il regalo delle partite libere *(settembre 2026)*

Una partita libera non finisce mai, ma **finiva sempre allo stesso punto**:
l'ondata venti, con tutti e cinque i cuori ancora pieni fino a lì. Non per
come si giocava — a quel punto la difesa è già in cima alla scaletta e non
c'è più niente da comprare, mentre la vita dei nemici continua a salire del
45% a ondata. Un record che non si muove smette di essere un record.

Adesso **ogni cinque ondate arriva un regalo**: tre carte, se ne sceglie una,
e quello che si prende **resta per sempre** — vale anche nelle partite di
domani, e lo stesso regalo si può riprendere quante volte si vuole. Sette
voci in catalogo: frecce più affilate, incanto più forte, polvere da sparo,
gelo che morde, vista lunga, veleno tenace, mani veloci.

Così la partita libera diventa quello che deve essere: **una fila di record
che sale**. Le prime partite si ferma alla venti; con una decina di regali in
tasca passa il muro e arriva alla ventiquattresima; poi si va avanti a
guadagnare ondate sempre più lentamente.

**Solo nelle partite libere.** Le venti tappe della campagna sono tarate
ondata per ondata da un simulatore, e un bonus che cresce col giocare
renderebbe la promessa «questa tappa costa dodici operazioni» una cosa che
dipende da quante partite libere si sono fatte prima. Il motore i regali li
applica soltanto dove la tappa li dichiara, e a dichiararli sono solo le
quattro libere.

**Quanto vale un regalo**, misurato facendo giocare il simulatore sulla
libera del bosco (`node test/esegui.mjs regali`, che rifà queste misure a
ogni giro):

| regali in tasca | fin dove arriva |
|---|---|
| 0 | ondata 20 |
| 10 | ondata 25 |
| 35 | ondata 31 |
| 140 | ondata 39 |

I salti sono a gradoni e non uno per volta, e il rendimento cala: oltre la
ventesima la vita cresce a moltiplicare (×1,3 a ondata, su ogni terreno), i
regali a sommare, e il moltiplicare vince sempre — quaranta gradi tutti sulla
stessa voce portano dalla 20 alla 25-28, non oltre. Immortali non si
diventa, ed è la condizione perché la modalità resti un gioco.

**Una scelta fatta a occhi aperti**: un regalo non si paga con un esercizio,
e in questo progetto tutto quello che si riceve si paga in esercizio
(`CALIBRAZIONE.md`). La riga per cui qui è accettabile: le venti ondate che
l'hanno fatto arrivare fin lì erano **tutte pagate in operazioni in colonna**,
e il regalo non si spende — non compra monete, non apre tappe, non esce dalla
partita libera.

## Fermarsi

Durante una tappa, in cima allo schermo c'è **⏸**. Il campo si ferma dov'è —
mostri a metà strada, colpi a mezz'aria — e resta lì finché non si tocca:
niente conto alla rovescia, e chi torna trova scritto a che punto era
(«ondata 4 di 9»).

Serve anche senza premerlo. **Se il telefono si posa — si blocca lo schermo,
si cambia applicazione, arriva una chiamata — la battaglia va in pausa da
sola, e quando si riapre non riparte**: aspetta un tocco. È il gioco dove
serviva di più, perché è l'unico in cui si sta fermi a fare una divisione in
colonna: chi metteva giù il telefono a metà conto lo ritrovava con l'ondata
passata e i cuori in meno.

Lo stesso vale per il `?`: finché il foglio «come si gioca» è aperto, il
campo non cammina.

Quello che invece **non** ferma niente è il conto: mentre si fa
un'operazione in colonna la battaglia va avanti dietro il foglio, e un
minimo di fretta ci va. Per guardare il campo si chiude il foglio; per
fermare tutto c'è il ⏸, che è un'altra cosa — è il bambino che chiede di
smettere, non il gioco che aspetta.

## Cosa allena

L'algoritmo delle operazioni in colonna — riporti e prestiti — con una
pressione di tempo mite: l'ondata arriva, ma il conto si può fare con calma
perché il gioco aspetta.

## Note per i genitori

- Le divisioni si spengono da *Genitori → cosa sa*.
- Ci sono anche **quattro partite libere** senza fine, una per terreno,
  che si sbloccano insieme finendo le tappe: lì le operazioni sono miste e
  il gioco non finisce mai. Quello che resta è il **record di ogni
  terreno** — quante ondate si sono rette, con quanti nemici fermati e
  quante torri — scritto sul suo tasto nella mappa prima di entrare e
  nella tabella dei record di *I miei progressi*; batterlo fa coriandoli
  e dice di quanto (`giochi/primati.js`, come la corsa infinita e la
  Sopravvivenza). Lì dentro ogni cinque ondate si sceglie un
  **potenziamento definitivo** (vedi sopra), che vale su tutti e quattro
  i terreni: è quello che fa salire i record di partita in partita, e
  sulla mappa c'è scritto quanti se ne hanno.
- Se il bambino sbaglia spesso, non perde: paga di più in energia. Non c'è
  schermata di fallimento legata al calcolo.
