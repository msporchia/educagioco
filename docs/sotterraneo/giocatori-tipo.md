# I giocatori tipo: il metodo della taratura

14 ottobre 2026. Il metodo di prima (il banco di [scontro-bilancio.md](scontro-bilancio.md)) non bastava: un solo modo di giocare, bersagli
solo sulle vittorie a 8/6/4 su 10 e sulle domande, la vita che resta a fine scontro non la guardava nessuno (così «finisco ogni scontro
quasi pieno e stravinco» passava per verde, ed è il difetto da cui siamo partiti), la roba con cui si entra era una cifra fissa che
cancellava il caso dei drop, un bersaglio mancato non faceva succedere niente e cosa girare lo decideva a mano chi tarava, una manopola alla
volta. Adesso tre **giocatori tipo** con i loro bersagli, la storia giocata di fila col caso dei drop, un giro corto che si ferma al primo
guasto grosso e una ricerca per bisezione che **non scrive mai i sorgenti**.

**La regola dell'utente: ogni deviazione da questi risultati è sospetta.** Un bersaglio mancato non è un numero da ritarare: è un'anomalia da
spiegare prima di girare una manopola. Per ogni cella fuori bersaglio il rapporto dice se è di tutti o di un eroe, quale scontro o quale
mostro fa la differenza, con quale abilità o pezzo si stravince; un caso isolato e molto lontano dagli altri si segnala come possibile
difetto del gioco, non si media. `--cerca` propone numeri solo dove la deviazione è uniforme; per le altre dice «prima capire».
**Il processo con l'utente nel giro**: ogni giro produce un rapporto breve e una proposta, poi ci si ferma e decide lui; la ricerca non
va avanti da sola.

Il codice: `dati/giocatori-tipo.js` (come gioca ognuno e i suoi bersagli), `motore/banco.js` (`gioca` con `stile`, lo scontro registrato),
`motore/storie.js` (la storia di fila), `motore/rapporto.js` (le misure, ✅/❌, il perché), `motore/specie.js` (la tabella delle specie),
`motore/potenza.js` (esperienza e gemme), `strumenti/sotterraneo-taratura.mjs`. I comandi: [../core/comandi.md](../core/comandi.md).
**A che punto è l'eroe alla fine di ogni discesa, i checkpoint e le strade di spesa** (beve tutto, arma prima): [fine-discesa-e-strade.md](fine-discesa-e-strade.md).
**I giocatori tipo tornano su dal portale a spendere durante la discesa, e le armi nuove utili a discesa**: [risalite.md](risalite.md).

```bash
npm run taratura                       # il giro: 30 storie per eroe, il rapporto (circa 40 s con 4 processi)
npm run taratura -- --presto           # il giro corto: 3 storie per eroe, dice il primo bersaglio fuori di molto (5 s)
npm run taratura -- --cerca            # la proposta: spinta e forza per bisezione (circa 60 s, 16 storie per eroe)
npm run taratura -- --specie           # solo la tabella delle specie, senza giocare
npm run taratura -- --da 4             # rigioca dalla quinta discesa in poi, dai checkpoint (vedi fine-discesa-e-strade.md)
npm run taratura -- --tara 2.spinta=8,livelli.A=40,potenza.gemme=0.5   # prova dei valori senza toccare i sorgenti
```

## I tre giocatori tipo

| | il curioso | il bravo | lo sbadato |
|---|---|---|---|
| chi è | il figlio dell'utente | il banco di prima | il curioso in una giornata storta |
| risposte giuste | 9 su 10 | 19 su 20 | 6 su 10 |
| dove va | gira tutte le stanze, apre tutto | dritto alla scala | come il curioso |
| abilità | la più forte che può pagare, anche se spreca (niente tetto di due, niente risparmio) | due forti a scontro, la cura sotto la metà | come il curioso |
| pozioni | beve nel rosso (sotto il 30%, la soglia dello stop) **anche nello scontro**, una per turno e poi attacca (non costa il turno) | sotto il 45% fuori dallo scontro, mai dentro | come il curioso |
| fonti | si ferma se è sotto il 65% di vita o il 40% di energia, e a fine piano se non è pieno | sotto il 45% di vita | come il curioso |
| spesa e punti | il meglio che può dal fabbro, dall'incantatrice e dal rigattiere, poi le pozioni; punti secondo la strada della classe | idem | idem |
| la storia | la sua, di fila | la sua, di fila | gioca ogni discesa dall'**ingresso del curioso** |

Lo sbadato non fa un viaggio suo: è il curioso in una giornata storta, con la roba e il livello di quel punto della sua storia
(«se perdi e devi tornare su è stata comunque interessante, dovevi fermarti prima a ricaricarti»). Così ogni discesa ha un bersaglio chiaro e
non c'è la scrematura di chi resta bloccato alla seconda.

**Il metro è il curioso** (l'utente, 14 ottobre sera: «il modo corretto di giocare è esplorare tutte le stanze, non andare secco all'obiettivo; farmare dà vantaggi ma implica anche più
operazioni, quindi per me va bene»): che esca un paio di livelli sopra l'atteso va bene; il bravo, che va dritto, può restare un po' sotto purché non trovi un muro. Nei rapporti si legge
prima il curioso.

**Un pezzo si indossa dal suo livello** ([livello-dei-pezzi.md](livello-dei-pezzi.md)): il finto compra un pezzo per dopo solo se, comprato quello per adesso, gli avanzano gemme e non ha un pezzo per adesso
da risparmiare; ne tiene al più `RISALITA.perDopo` (2) in attesa del livello, senza venderli, e li mette quando arriva al livello. Quelli indossati dopo contano fra i **comprati**
(`armi.rimandati`), non fra i trovati. Il giro prima → dopo: [risalite.md](risalite.md#il-livello-dei-pezzi-14-ottobre-sera).

## I bersagli

Misurati sulla **prima volta** che si scende in una discesa («la discesa nuova»), in media fra i quattro eroi. I numeri precisi sono di chi
ha scritto lo strumento dentro le frasi dell'utente; **[da confermare]** dove la frase è ambigua. Stanno in `dati/giocatori-tipo.js`.

| giocatore | misura | bersaglio | la frase dell'utente |
|---|---|---|---|
| curioso | discese vinte alla prima | ≥ 85% | «arriva in fondo quasi sempre» |
| | storie finite (sette discese, al più 4 tentativi l'una) | ≥ 90% | idem |
| | discese con almeno uno svenimento | 20–60% (cripta 0–30%) | «sviene ogni tanto nelle discese nuove» |
| | pozioni bevute a discesa | 1–3 (cripta 0–2) | «beve 1-3 pozioni a discesa» |
| | vita dopo uno scontro grosso (3+ mostri o il grosso; uno svenimento vale 0) | 40–70% | «gli resta in media il 40-70% della vita» |
| | domande a discesa girata tutta | ≤ 85 | «un piano girato tutto costa al più 85» **[da confermare]**: oggi il tetto di 85 è sul minimo (`regole.md`) |
| | discese già vinte, rifatte con la roba di due discese dopo: con uno svenimento | ≤ 5% | «mai in quelle già vinte rifatte» |
| | il 10° percentile della roba con cui entra: vinte alla prima / muri | ≥ 60% / ≤ 10% | «non trova un muro» |
| | il 90°: vita dopo il grosso / scontri finiti sopra il 90% | ≤ 80% / ≤ 55% | «non stravince» |
| bravo | discese vinte alla prima | ≥ 90% | «vince» |
| | vita a fine scontro (tutti gli scontri) | 45–85% (cripta ≥ 30%) | «ma non a vita piena» |
| | scontri finiti sopra il 90% | ≤ 45% (cripta libera) | «se esce da quasi ogni scontro sopra il 90% è troppo facile» |
| | domande a discesa | ≤ 85 | il tetto di una seduta |
| sbadato | discese vinte alla prima | ≤ 15% (cripta ≤ 50% **[da confermare]**) | «perde quasi sempre (una volta su 7-8)» |

«Muro»: due sconfitte di fila nella stessa discesa. Il 10° e il 90° percentile sono le storie che entrano con la roba più debole e più forte
(la **forza** di `forza.md` sul livello atteso, con braccio e difesa per spareggiare), almeno tre per coda. Le soglie sono in `dati/giocatori-tipo.js`
(`CODA`, `MOSTRI_DEL_GROSSO`, `TENTATIVI`).

## Come si misura

- **La storia di fila** (`motore/storie.js`): le sette discese una dopo l'altra, con la spesa fra l'una e l'altra (`allaBottega`) e la roba che si
  trova davvero; la discesa persa si rifà (al più quattro volte) e si va avanti lo stesso, per misurare tutte le discese. Un **passo** è una
  discesa: dallo stato (roba e crescita) con cui si esce dalla precedente. Il caso dei drop resta, il seme è dichiarato (di difetto le storie 1..30).
- **Le sonde**: prima di ogni discesa il curioso porta con sé lo sbadato, che la gioca una volta dallo stesso ingresso e dallo stesso seme di
  sotterraneo. Le **rifatte**: la discesa k si rigioca con la roba con cui il curioso entra nella k+2 (le ultime due all'uscita).
- **Cosa si registra** (`gioca` torna `scontri`, `pozioni`, `fonti`): per ogni scontro i mostri, se c'era il grosso, la vita e il globo con cui
  si entra, la vita a fine scontro (0 se si sviene), le abilità usate, le pozioni bevute nello scontro; per ogni discesa l'esito, le domande per
  piano, le gemme, e com'è l'ingresso (livello, braccio, difesa, vita, forza, i quattro pezzi).
- **Il danno è continuo** (`motore/scontro.js`): `danno` e il colpo dell'eroe erano arrotondati a numeri piccoli (2–4), quindi un decimo di
  spinta cambiava il colpo di un intero per tutti i mostri insieme e le vittorie facevano un gradino (scalinata a 8/10: spinta 3 → 99%, 3,3 → 88%):
  una ricerca automatica salta fra i gradini. Adesso ogni mostro porta il **resto** del suo colpo al colpo dopo (parte da 0,5, quindi il primo
  colpo è quello arrotondato di sempre): un colpo da 3,4 toglie 3, 3, 4, 3, 3, 4…; lo stesso per i colpi dell'eroe (il resto sta sul mostro che li
  prende, così un'area dà lo stesso numero a tutti). Lo schermo mostra l'intero che arriva davvero. `COLPO_DEL_MOSTRO` e le regole non sono
  cambiati. Misurato (scalinata a 8/10, 25 semi, vittorie % al variare della spinta 5,6 · 5,8 … 7,4): prima 26 25 20 16 16 16 16 11 8 8 (pianori
  e salti da 5), dopo 26 23 23 20 18 16 14 10 10 9 (nessun salto sopra 3).

## Il perché di uno scostamento

`spiega` (in `motore/rapporto.js`) legge gli stessi scontri registrati:

- **la natura**: *uniforme* (almeno tre eroi su quattro fuori dalla stessa parte), *di un eroe* («di mago»), *isolato* (tolti i casi molto lontani
  dalla mediana, tre al più e non più del 10%, la cella rientra: ognuno è nominato con eroe, seme, roba e forza e segnalato come possibile difetto del gioco);
- **cosa fa la differenza**: i mostri da cui si esce quasi interi o a pezzi (per specie, con quanti scontri), il gruppo (da solo, due, tre o più, il
  grosso), l'abilità che pesa (la vita a fine scontro con e senza), il pezzo fuori dalla tabella della roba attesa o raro, la forza di ingresso sul
  livello atteso, la vita con cui si entra negli scontri e quante pozioni e fonti;
- **per chi cade**: contro cosa si cade; per i muri la storia, l'eroe e il seme; per le domande quanto costa ogni piano e quanti mostri si battono.

## I mostri che picchiano poco, ma tanti

Decisione dell'utente: «meglio più mostri insieme che attaccano poco: così il giocatore deve fare più attacchi». Il colpo del singolo mostro di strada
resta basso rispetto alla vita dell'eroe; la difficoltà viene dal numero e da quanto dura lo scontro; i caporali e il grosso possono picchiare di più.
Il vincolo è il tetto delle domande: ogni attacco è una domanda, quindi più attacchi a scontro vogliono mostri con meno vita a testa, e le abilità ad
area devono valere. `npm run taratura -- --specie` (e il rapporto) ha una tabella per discesa e per specie e ruolo, sui mostri dei piani veri: ossa,
attacco, difesa, **colpo medio contro l'eroe atteso** (quattro classi), la sua vita, **in quanti colpi un mostro solo lo stende**, in quanti colpi
lo si abbatte, potenza, esperienza e gemme. Le specie sotto soglia sono segnate **per nome**: la prima cosa da guardare.

| ruolo | colpi per stendere l'eroe atteso, almeno | **[da confermare]** |
|---|---|---|
| di strada | 8 | `COLPI_PER_STENDERE` in `dati/giocatori-tipo.js` |
| caporale | 5 | |
| grosso | 3 | |

## Il mostro porta quello che è

Decisione dell'utente: «ogni mostro dovrebbe portare la sua esperienza e le sue caratteristiche». Niente quota uguale per tutti
(`QUOTA_DEL_COMUNE` è tolta, come `espDi` sulla specie, `ESP_DEL_CAPO` e il fattore del livello del posto): esperienza e gemme sono la **potenza**
del mostro vero, `potenzaDi` in `dati/livelli.js`, una formula sola:

```
sostanza = (ossa + 3 · attacco + 3 · difesa) / 3          # le ossa e l'attacco veri, già con forza, spinta, piano, caporale, grosso
potenza  = sostanza · (1 + 0,08 · protezioni + 0,15 · arma + 0,25 · incanto) · premio del grado
esperienza = potenza · 1          gemme = potenza · 1       # VALORE_DELLA_POTENZA
```

Le protezioni sono le resistenze e le immunità della specie (o della variante); `arma` è una variante armata (guerriero, arciere, mago); `incanto` il gelo del
mago; il premio del grado è `PREMIO_DEL_GRADO` (×1,3 · 1,7 · 2,5). Un mostro debole dei branchi dà poco perché è debole; un caporale e il grosso danno
tanto perché hanno più ossa e più attacco, non per un moltiplicatore. Provato in passato: contarla sulle ossa vere avvitava la taratura (mostri più
duri, più esperienza, livelli a metà discesa); adesso a frenare è la **curva**.

- **La curva dei livelli** (`CURVA_DELL_ESPERIENZA`, `sogliaDi`): `A·(n−1)·n/2 + B·(n−1)` con A 50 e B 56 (prima 14 e 16); oltre il 12 `Q` 20 e `R` 200 (prima 10 e 120).
  Tarata col curioso: **chi gira tutto entra in ogni discesa al livello atteso più 0, 0, 1, 1, 1, 1, 2** (1 · 2 · 4 · 6 · 8 · 9 · 12 contro 1 · 2 · 3 · 5 · 7 · 8 · 10);
  la zona verde vinta rende da 0,9 a 1,4 livelli. Il prezzo: **chi va dritto entra 1–2 livelli sotto** i `LIVELLI_ATTESI` (nati per lui), quindi le misure
  fatte col suo banco (`unita/sotterraneo`, `unita/sotterraneo-roba`, `misure/sotterraneo`) vanno ritarate con questo strumento.
- **Le pozioni** ([pozioni.md](pozioni.md)): il curioso compra la più grande che può pagare, dopo la roba, fino al tetto di otto cure; beve la più
  piccola che rimette quanto manca (nello scontro anche i colpi in arrivo) e non risparmia l'ampolla della vita, il bravo la tiene per il grosso
  (`tieneLaVita`). Prima → dopo (30 storie per eroe, `npm run taratura`; il tetto era di fatto assente: nel fondo si scendeva con 55 pozioni).
  Curioso, per discesa dalla cripta al fondo: vinte alla prima 96 · 98 · 97 · 95 · 100 · 97 · 98 → 98 · 99 · 92 · 96 · 97 · 93 · 93; con uno svenimento
  54 · 8 · 38 · 23 · 15 · 18 · 18 → 44 · 8 · 46 · 45 · 29 · 46 · 45 (le ultime discese entrano nella fascia 20–60%); pozioni bevute 2,3 · 3,0 · 6,1 ·
  5,2 · 3,9 · 14,8 · 8,0 → 2,1 · 3,0 · 5,9 · 5,5 · 4,8 · 16,6 · 8,1; gemme che restano dopo la spesa (mediana) 0 · 3 · 133 · 358 · 771 · 1392 · 2704 → 0 · 4 ·
  132 · 245 · 354 · 735 · 1572. Sbadato, vinte alla prima 59 · 92 · 73 · 80 · 82 · 70 · 73 → 64 · 96 · 68 · 79 · 80 · 48 · 62. Bravo, vinte 100 · 78 · 74 ·
  94 · 90 · 88 · 78 → 100 · 78 · 72 · 92 · 91 · 87 · 80. **Il tetto lo toccano quasi a ogni discesa dalla seconda**: il curioso in 93 · 97 · 98 · 99 · 100 ·
  100% delle discese dalle cantine al fondo, il bravo (che gira meno e trova meno) in 2 · 52 · 60 · 66 · 80 · 63% (riga `al tetto` sotto la roba con cui si entra).
- **Le gemme** sono la potenza per `VALORE_DELLA_POTENZA.gemme` (0,5 dal 14 ottobre sera, prima 1: [risalite.md](risalite.md#il-giro-delle-gemme-14-ottobre-sera)). Con le risalite
  il banco le spende, ma la leva ha un pavimento: 0,5 è il minimo per cui la cripta basta alla prima arma, e la forza del curioso non scende sotto +2/+3 neanche a 0,05.

## La ricerca (`--cerca`)

Per ogni discesa, in ordine, e **chi entra nella discesa dopo ha quello che ha preso nella prima** (con i valori proposti): la ricerca riparte dallo
stato con cui ogni storia è uscita, non rigioca le discese di prima.

1. Si misura il curioso con i valori di adesso. Se vita dopo il grosso e domande sono dentro, «nei bersagli».
2. Se la deviazione non è **uniforme** (`natura`: di un eroe, o isolata) non si propone niente: «prima capire», con le righe del rapporto.
3. Se uniforme: le **domande** oltre il tetto → bisezione della `forza` verso il basso, fino a 73–83 domande (la forza più alta che sta nel tetto); se non ci
   arriva, lo dice («al pavimento di una domanda a mostro: la leva è il numero dei mostri»). La **vita** fuori dalla forbice → bisezione della `spinta`
   (nella cripta, che non ne ha, della `forza`) fino al 45–65%, al centro il 55%. Al più 5–6 giri, passi di 0,05; il danno continuo rende la
   curva liscia, quindi la bisezione non salta.
4. Poi si gioca la discesa coi valori proposti per tutti e tre i giocatori tipo e si dice se bravo e sbadato rientrano.

Non scrive i sorgenti: stampa prima → dopo e il comando `--tara …` per verificarla. Non aggiusta bravo e sbadato (li controlla).

## I tempi

Con 4 processi (la macchina ha poca memoria; **con le risalite il giro a freddo è di 212 s**: [risalite.md](risalite.md#i-tempi)): il giro con 30 storie per eroe **40 s** (con le sei linee delle strade 52–62 s a freddo, 0,6 s da checkpoint:
[fine-discesa-e-strade.md](fine-discesa-e-strade.md#i-tempi)), il giro corto **5 s**, la ricerca su tutte le discese **62 s** (16 storie
per eroe; 2–3 discese cercate costano 15 s l'una). Una discesa giocata costa 30–40 ms; le storie si dividono fra i processi in dodici pezzi.
`misure/sotterraneo` è lenta perché gioca ventimila discese (1200 s di processore): ora le divide fra quattro processi (`test/aiuto/parallelo.mjs`,
4 min 25 s); per averla sotto il minuto va sostituita dal rapporto di questo strumento quando i bersagli saranno confermati.

## Cosa resta

- I **[da confermare]** della tabella dei bersagli e di `COLPI_PER_STENDERE`.
- `forza` ha ancora i gradini della ossa intere (8 ossa per forza 0,9 sono 7): il resto continuo vale per i colpi, non per le ossa.
- `--zone`: la curva delle zone non ha ancora i suoi bersagli per giocatore tipo (le zone sono un'altra promessa, quella di un livello a zona).
- La forza di `forza.js` conta ancora il colpo del mostro arrotondato; la differenza è sotto il 5%.
- I bersagli nuovi sulla fine della discesa sono proposti, non confermati: [fine-discesa-e-strade.md](fine-discesa-e-strade.md#i-bersagli-nuovi-proposti--da-confermare-con-lutente).
- La taratura vera (cosa girare dopo il primo giro) è dell'utente: [taratura-branchi.md](taratura-branchi.md) è il punto di partenza.
