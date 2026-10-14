# A che punto è l'eroe alla fine: i checkpoint e le strade di spesa

14 ottobre 2026. Il metodo di [giocatori-tipo.md](giocatori-tipo.md) misurava **la discesa**: si vince, quanto si soffre, quante domande costa. Non
misurava **come ne esce l'eroe**. L'obiezione dell'utente: una strategia che compra e beve un sacco di pozioni ci può stare se il bambino si sbatte, ma
è perdente nel lungo periodo perché poi non compri le armi; se ce l'hai fatta ma sei salito poco e il tuo danno è ridicolo, non hai ottenuto niente; se
ce l'hai fatta e il danno è tosto, va bene. La discesa è limitata e non si accorge di quanto male può andare dopo. Da qui tre cose, tutte nello stesso
strumento (`npm run taratura`) e **senza toccare un numero del gioco**: la lettura dell'eroe a fine discesa, i checkpoint e le strade di spesa.

Il codice: `motore/fine.js` (danno a risposta, valore della roba, l'eroe atteso letto allo stesso modo), `motore/rapporto-fine.js` (le tabelle),
`motore/storie.js` (`lineeDelGiro`, `strada` nel passo), `dati/giocatori-tipo.js` (`STRADE`), `strumenti/sotterraneo-checkpoint.mjs` (i file e la firma),
`strumenti/sotterraneo-taratura.mjs`. Le unità: `unita/sotterraneo-taratura`. I comandi: [../core/comandi.md](../core/comandi.md).

## Lo stato a fine discesa

La fine della discesa *j* è l'eroe com'è tornato su e ha fatto la spesa: l'ingresso della *j+1* (per l'ultima, la spesa in uscita dalla miniera).
Per ogni linea (strada e giocatore) e discesa, il rapporto dà **il 10° percentile · la mediana · il 90°** di:

| riga | cosa è |
|---|---|
| livello | quello dell'eroe; sopra, l'atteso (`LIVELLI_ATTESI`) |
| forza sull'atteso | `forzaDelCorredo` ([forza.md](forza.md)) meno il livello atteso della discesa dopo: 0 è «come la storia lo vuole» |
| danno a risposta % | quanto toglie in media una risposta giusta a un mostro di riferimento di quel livello, in % dello stesso numero per l'eroe atteso della classe |
| valore roba % | il prezzo pieno dei pezzi addosso e nello zaino, in % di quello dell'eroe atteso (le pozioni no) |
| gemme avanzate | quelle in tasca dopo la spesa |
| pozioni rimaste · bevute | prima di spendere; e quelle bevute nella discesa (tutti i tentativi) |
| difesa % · vita massima % | con `--tutto` |

- **Il danno a risposta** (`dannoPerRisposta`): le due abilità più forti che l'eroe porta nello scontro (una volta ciascuna, come in `forza.js`) e il colpo
  di sempre per le altre risposte di uno scontro di dieci (`RISPOSTE_DELLO_SCONTRO`). Dieci e non «finché cade»: il mostro di riferimento cade in due
  risposte e il danno non si leggerebbe più (provato: tutti al 100%).
- **L'eroe atteso** (`attesoA`) è `eroeAtteso(classe, livello)` della storia; sopra la tabella ne stampa la media sui quattro eroi. La roba della storia è
  più povera di quella che si compra davvero (il curioso arriva a 130–300% del danno): i numeri in % servono a **confrontare le linee**, non a leggere 100 come un voto.

## I checkpoint

Dopo ogni discesa (e dopo la spesa in uscita, la ottava tappa) si salva in `tmp/taratura/checkpoint-<k>.json` (cartella ignorata da git) lo stato di **tutte le
storie di tutte le linee**: la roba e la crescita con cui si esce, e il passo giocato (gli scontri uno per uno solo per il curioso e il bravo di arma prima,
che servono ai bersagli; per le altre linee solo l'esito). Circa 2 MB l'uno, 15 in tutto.

- **Formato**: una riga di testa `{formato, k, firma, copertura}` (`copertura`: le chiavi `eroe|seme` di ogni linea) e il corpo `{ idLinea: [{passo, stato}] }`.
  Per sapere se un checkpoint vale si legge la testa.
- **La firma di una discesa** (`firmeDelleDiscese`) è l'hash di: il testo (senza le righe di commento) di tutti i file che `storie.js` importa, direttamente o
  no; le righe di `CAMPAGNA` **fino alla *k*** e gli altri valori di `campagna.js`; come si gioca (`GIOCATORI_TIPO` senza i bersagli, `STRADE`, `TENTATIVI`);
  i valori provati a mano che valgono per tutte (`livelli.`, `potenza.`, `zona.`). Quindi: una riga di campagna ritoccata rifà quella discesa e le dopo, e
  non le prima; un sorgente del motore rifà tutto; un bersaglio, un commento o il rapporto non rifanno niente.
- **Quando si rifanno**: `npm run taratura` usa i checkpoint validi di fila da 0 (firma che torna, e dentro tutte le storie richieste), gioca le discese
  da lì in poi e le riscrive. Un giro più piccolo (meno eroi, `--semi`, `--giocatori`, `--strade`) si serve dalle storie salvate e non scrive; uno più
  grande, o con `--tara`, non scrive mai (non pesta i buoni).
- **`--da K`** rigioca dalla discesa *K* (0 è la cripta) in poi anche se i checkpoint sono buoni; **`--rifai`** li rifà tutti; **`--fino K`** si ferma alla *K*
  (sotto si leggono le fine fino alla *K−1*). Una tappa: `--da 4 --fino 4 --semi 10 --semi-strade 3`, 3 s.
- Il caso resta dichiarato (il seme di una storia dà lo stesso sotterraneo a tutte le linee): una tappa da un checkpoint dà **gli stessi numeri** del giro
  intero (lo prova l'unità, passando lo stato per un file).

## Le strade di spesa

Una **linea** è un giocatore tipo su una strada: sei linee, `armaPrima` e `beveTutto` per il curioso, il bravo e lo sbadato. Lo sbadato qui **ha una storia sua**
(prima era solo la sonda del curioso): è quello che vince bevendo e poi non regge più. Il curioso e il bravo di `armaPrima` sono i giocatori dei bersagli di prima
(30 storie per eroe, con lo sbadato come sonda e le rifatte); le altre 4 linee giocano `SEMI_DELLE_STRADE` (6) storie per eroe sugli stessi semi.

| strada | spesa fra una discesa e l'altra (`allaBottega`) | quanto beve |
|---|---|---|
| arma prima | vende il superfluo, compra il pezzo che migliora di più dai tre mercanti (otto giri), poi le pozioni nelle tasche che restano | come il giocatore |
| beve tutto | **le pozioni prima di tutto** (fino a lasciare 2 tasche libere), poi i pezzi con le gemme e le tasche che restano, poi altre pozioni | sotto il 55% di vita, anche nello scontro (il curioso: 30%) |

Una strada si può cambiare in `STRADE`: `spesa` e `stile` (sopra il giocatore). Il rapporto ha, per linea: le vinte alla prima e i bloccati (nessuna vittoria in
`TENTATIVI` giri) per discesa, **dove si ferma** (la prima discesa con almeno il 10% di bloccati, `QUOTA_CHE_SI_FERMA`), la forza lì e alla fine, il danno e il valore
della roba alla fine; le pozioni bevute per discesa; e **chi vince bevendo** (una discesa vinta con almeno 10 pozioni, `POZIONI_DA_BEONE`) contro chi vince bevendo meno:
forza e danno all'uscita, e quanti vincono alla prima la discesa dopo.

## Il primo giro (14 ottobre, 30 storie per eroe, 6 per le strade)

Alla fine della miniera (mediana; fra parentesi 10° e 90° percentile):

| linea | livello | forza sull'atteso | danno % | valore roba % | gemme avanzate | pozioni bevute a discesa (media) |
|---|---|---|---|---|---|---|
| arma prima · curioso | 14 | −1 (−3 · +2) | 127 | 75 | 4,0k (1,2k–5,2k) | 8 |
| arma prima · bravo | 10 | −3 (−6 · −3) | 95 | 53 | 165 | 4 |
| arma prima · sbadato | 14 | −1 (−3 · +2) | 131 | 81 | 2,8k | 30 |
| beve tutto · curioso | 14 | −2 (−3 · 0) | 128 | 69 | 3,5k | 26 |
| beve tutto · bravo | 10 | −3 (−5 · −2) | 94 | 63 | 254 | 15 |
| beve tutto · sbadato | 14 | −1 (−3 · +2) | 125 | 85 | 3,1k | 38 |

- **Nessuna strada si ferma**: tutte arrivano in fondo, con meno del 10% di bloccati per discesa (il bravo che beve ha l'8% alla scalinata e alla torre, un caso su
  dodici, contro il 4% e il 3% di chi spende per i pezzi). **Bere non costa le armi**: le gemme avanzano comunque (la mediana del curioso sale da 130 alla
  scalinata a 4000 alla miniera) e il pezzo comprato prima o dopo le pozioni è lo stesso. Chi beve tutto arriva più debole di un livello di forza solo se è il curioso;
  per il bravo e lo sbadato la differenza è zero. Il compromesso che l'utente descrive («poi non compri le armi») **non esiste nei numeri di adesso**, per un motivo: le gemme.
- **Chi vince bevendo** (≥ 10 pozioni): lo sbadato di arma prima vince il 63% delle sue discese così; esce con la stessa forza (0 contro 0) e lo stesso danno, e la
  discesa dopo la vince alla prima il 79% (contro il 91%): perde, ma poco. Il curioso, bevendo, esce a −1 invece di 0 e vince dopo il 97% come gli altri.

### I quattro difetti, riletti da qui

1. **Lo sbadato che vince con 20 pozioni a discesa**: confermato e non pagato. Nella sua storia (6 su 10) beve in media 6 · 8 · 13 · 16 · 14 · 38 · 30 pozioni a discesa e vince alla
   prima 63 · 96 · 79 · 96 · 92 · 79 · 79% (il bersaglio è ≤ 15%, ≤ 50% nella cripta); arriva in fondo con 35 pozioni ancora nello zaino (le pozioni dello stesso tipo stanno in una tasca
   sola, quindi non c'è tetto).
2. **Le gemme sono troppe**: dopo la spesa il curioso ha in mediana 3 · 132 · 357 · 771 · 1,4k · 2,7k · 4,0k (la roba che comprano i tre mercanti arriva al 75–150% di quella attesa e
   poi non c'è altro da comprare), lo sbadato 2,8k, il bravo da 2 a 200. È questo il motivo per cui nessuna strada paga: il bilancio fra pozioni e pezzi si sente solo se le gemme
   scarseggiano.
3. **La cripta con Re Ossuto**: il curioso sviene nel 54% delle discese nuove (bersaglio 0–30%) e vive il 25% della vita dopo il grosso (40–70%); sviene contro il grosso (69 casi) e
   gli scheletri cavalieri (23), e per eroe 87% il cavaliere · 57 l'elfa · 53 il mago · 20 il nano. Ne esce a livello 1 · 2 · 2 e forza −1 · 0 · 0. La tabella delle specie lo dice da sola:
   lo scheletro cavaliere (caporale) stende in 4 colpi, sotto i 5 del bersaglio.
4. **La botola da 139 domande**: uniforme (137 · 136 · 144 · 141 per eroe, 44 · 46 · 50 per piano), 100 mostri battuti e 43 scontri a discesa. Non dipende dalla forza (esce a livello 12,
   forza −1): il bravo, che va dritto, ne fa 36. La leva è il numero dei mostri, non la loro vita.

## I bersagli nuovi, proposti — da confermare con l'utente

Non sono un cancello e il rapporto non li controlla: sono le frasi dell'utente messe in numeri, da guardare con l'esito del giro. Il giro di adesso, accanto.

| misura | proposta | oggi |
|---|---|---|
| curioso (arma prima): forza sull'atteso a fine discesa, mediana | ≥ 0 a ogni discesa, il 10° percentile ≥ −2 | 0 · +1 · 0 · 0 · +1 · −1 · −1; 10°: fino a −3 |
| bravo: forza a fine discesa, mediana | ≥ −1 | −1 · −1 · −3 · −2 · −3 · −3 · −3 (arriva sempre sotto: va dritto e trova meno) |
| beve tutto: forza a fine, rispetto ad arma prima dello stesso giocatore | almeno 2 livelli sotto (e il danno ≤ 85%) | −1 (curioso), 0 (bravo), 0 (sbadato); danno uguale (128 contro 127%) |
| chi vince bevendo (≥ 10 pozioni in una discesa vinta) | esce con la forza sotto l'atteso e vince la discesa dopo alla prima ≤ 70% | sbadato 79%, curioso 97% |
| beve tutto: dove si ferma | entro la scalinata o la torre, ≥ 10% bloccati (il bravo) | nessuna |
| gemme avanzate a fine discesa, mediana | ≤ il valore della roba attesa di quella discesa (70–370) | da 3 a 4000, fino a 11 volte |
| sbadato: pozioni bevute a discesa | ≤ 8 | 6 · 8 · 13 · 16 · 14 · 38 · 30 |

Le due che il giro non regge, e perché: la forza a fine discesa del bravo e quella di chi beve **non si spostano** finché le gemme avanzano; vanno decise insieme
(quante gemme dà un mostro, `potenza.gemme`, o cosa si compra) e poi guardate con `--tara`.

## I tempi

Con 4 processi, macchina occupata da altro (load 7): il giro intero a freddo **52–62 s** (le otto tappe 1,6 · 6,7 · 4,7 · 5,2 · 6,3 · 13,3 · 8,6 · 7,6 s: la botola e la
miniera pesano, e l'ottava tappa gioca le rifatte); **da checkpoint 0,6 s**. `--da 4` 38 s, `--da 6` 16 s; una tappa con poche storie
(`--da 4 --fino 4 --semi 10 --semi-strade 3`) 3 s. Una prova con `--tara 5.spinta=9` riparte dal sesto checkpoint (32 s).

## Cosa resta

- I **[da confermare]** della tabella sopra, e le soglie `POZIONI_DA_BEONE` (10) e `QUOTA_CHE_SI_FERMA` (10%).
- Le strade sono due; un'altra («economo», compra solo la roba che migliora il danno) o un'altra posizione di partenza (`--biforca K`: tutte le strade da uno stesso checkpoint)
  non ci sono ancora: oggi le linee partono tutte dalla cripta e divergono dalla scalinata.
- Il danno a risposta confronta con l'eroe della tabella della storia, che è più povero di chi gioca davvero: letto sulla stessa riga serve, letto da solo no.
- La logica del giro nello strumento (`eseguiLavoro`) non è nella firma: se cambia come si gioca una tappa, si alza `FORMATO` in `sotterraneo-checkpoint.mjs`.
