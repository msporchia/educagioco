# 🚜 La fattoria

**Dove finiscono le monete guadagnate negli altri giochi.** Non ci sono
domande, e non ce ne saranno: è il posto dove si spende, e per questo è il
motivo per cui si torna a fare esercizi.

Ha preso il posto della [cameretta](cameretta.md) il 16 agosto 2026, per una
ragione sola: **il money pit dev'essere uno**. Un bambino che può spendere le
monete in due posti non sceglie, si dimentica dell'altro — e fra i due questo
è quello che si può far crescere.

## Cosa si fa

Si compra terra (rincara a ogni pezzo), si sgombera il bosco, si posa quello
che si vuole dove si vuole, si comprano animali e si accudiscono. **Spostare
costa una monetina**, così questo non diventa un tavolino dove si passa il
pomeriggio a spostare la stessa panchina — ma rimettere una cosa esattamente
dov'era è gratis, perché cambiare idea a metà gesto non è un errore da punire.

Niente si perde mai: quello che si mette via va in un baule e da lì si
ripiazza gratis quante volte si vuole.

## I campi (dal 17 agosto 2026)

Posizionare era tutto, e i bambini lo dicevano: *«non posso fare nulla oltre a
posizionare»*. Adesso un campo si semina, cresce col tempo vero e si
raccoglie; il raccolto si trasforma — al mulino o dandolo agli animali — e
diventa da mangiare per il cane e per il gatto di casa.

Cinque colture, e ognuna ha **sette stati che si vedono**: i semi per terra,
il germoglio, e via fino al maturo. Sono tanti apposta — il tempo di crescita
è vero, e in dieci minuti deve succedere qualcosa a ogni occhiata, se no il
campo sembra fermo e non ci si torna più.

E **si vede che l'hai seminato**. Un campo comprato è terra nuda, non
lavorata; appena si semina diventa un'aiuola col bordo e i semi sopra, e
quello è il segnale che qualcosa è successo. Il primo stato era «niente», sul
ragionamento che la terra mossa fosse già il disegno del campo: per il primo
settimo della crescita un campo seminato era identico a uno vuoto, e non si
capiva se seminare avesse funzionato.

```
   🌿 erba medica  ──🪙1,  8 min──▶  4 fieno   ─┐
   🌾 grano        ──🪙2, 10 min──▶  3 grano   ─┤
   🥕 carote       ──🪙3, 12 min──▶  3 carote  ─┼──▶  mulino ──▶ 🥣 🍲
   🌽 mais         ──🪙2, 18 min──▶  5 mais    ─┤
   🎃 zucche       ──🪙4, 25 min──▶  2 zucche  ─┴──▶  recinti ──▶ 🥚 🥛 🍄 🧶
```

| | prodotto | comprato | riempie |
|:--|--:|--:|--:|
| 🥣 Mangime | 🪙3 e ~8 min | 🪙5 subito | 30% di pancia |
| 🥚 Uovo | 🪙3 e ~11 min | 🪙7,5 subito | 45% di pancia |
| 🥛 Latte | 🪙3,5 e ~16 min | 🪙9 subito | 55% di pancia |
| 🍲 Pastone | 🪙7 e ~22 min | 🪙12 subito | 70% di pancia |
| 🍄 Tartufo | 🪙10 e ~55 min | 🪙15 subito | 90% di pancia |

**Coltivare conviene della metà, non dell'ottanta per cento.** È il numero su
cui sta in piedi tutto: se coltivare costasse un quinto, dopo tre giorni
nessuno comprerebbe più niente e la fattoria smetterebbe di bruciare monete.
Chi vuole dar da mangiare *adesso* compra, come sempre; chi ha aspettato
risparmia. Un test lo controlla a ogni giro (`unita/coltivazioni`) e diventa
rosso se qualcuno ritocca un prezzo di troppo.

Il freno vero non è il prezzo: è **il tempo e quanti campi hai**. E
l'attrezzatura si paga prima, in monete grosse — campo 🪙22, mulino 🪙150,
silo 🪙120, e i recinti dai 🪙95 ai 🪙260 — cioè la catena *dà un motivo per
spendere*, non è il modo di smettere.

### I recinti (dal 18 agosto 2026)

Conigliera, pollaio, ovile, stalla, porcile: cinque, e **non sono una
meccanica nuova**. Sono macchine come il mulino — dai da mangiare, aspetti,
ritiri — quindi non c'è niente di nuovo da imparare né per chi gioca né per
chi legge il codice.

Quello che hanno di loro è che **si leggono da lontano**. Ogni specie è
disegnata in sei stati e in mappa si vede quello di adesso: ha fame (col
fumetto di quello che vuole), mangia, è contenta, dorme, è pronta. Non è
un'icona che galleggia sopra: è la faccia dell'animale, ed è la ragione per
cui un bambino attraversa la fattoria e sa già dove deve andare.

```
   🐰 conigliera 🪙95   2 🥕 ──18 min──▶ 1 🧶 lana
   🐔 pollaio    🪙130  3 🌾 ──12 min──▶ 2 🥚 uova
   🐑 ovile      🪙190  2 🌿 ──25 min──▶ 1 🧶 lana
   🐄 stalla     🪙220  6 🌿 ──20 min──▶ 2 🥛 latte
   🐖 porcile    🪙260  2 🎃 ──30 min──▶ 1 🍄 tartufi
```

La **lana** è l'unica cosa della catena che non si mangia: paga una coccola,
la copertina, che è la prima coccola che si paga col granaio invece che con
le monete. Serve a che oltre alla ciotola ci sia qualcos'altro da desiderare
— e a dare un mestiere alle pecore.

### Niente marcisce. Mai.

Un campo maturo resta maturo per sempre. Se il gioco sta chiuso una
settimana, al ritorno il grano è lì. È la stessa decisione del cane che ha
fame ma non muore: **questo posto è il premio per gli esercizi fatti altrove,
e un raccolto che scade lo trasformerebbe in un dovere.** Il dovere si smette.

Da lì viene tutto il resto:

- a **zero monete** non si raccoglie, ma il campo resta pronto e aspetta il
  primo esercizio fatto — non si perde niente;
- col **granaio pieno** non si raccoglie e non si paga: il grano resta nel
  campo, e il gioco chiede un silo senza scriverlo;
- quello che sta crescendo **non si mette via**, perché nel baule non c'è
  posto per un grano a metà.

### Il granaio, e perché sta dentro il silo

Trenta di ogni cosa, e ogni silo posato ne aggiunge trenta. Il tetto c'è
**da subito** e non è una limitazione arrivata dopo: illimitato oggi e
limitato domani sarebbe una regressione — «prima ci stava tutto» — e il silo
che si compra dev'essere un miglioramento, non il rimedio a una punizione.

Le scorte **si guardano toccando un silo**, non da una linguetta del baule.
Era una linguetta, ed era comodo: ma finiva in mezzo alle cose da *comprare*,
ed era l'unica che si guardava e basta. Peggio, faceva sembrare il raccolto
una schermata del gioco invece del contenuto di una cosa che hai costruito.
Adesso è lo stesso gesto di tutto il resto — tocca una cosa tua e vedi cosa
ci si può fare — con una conseguenza voluta: **senza silo il granaio non si
guarda**. Perché non diventi una scoperta tardiva, chi non ne ha uno se lo
sente dire nel momento in cui la domanda gli viene da sola, cioè quando
raccoglie («🌾 +3 nel granaio! Metti un silo per vedere cosa hai»).

### Si può spegnere

I campi sono **una variante** (`fattoria:coltivazione`), spegnibile dalla
[pagina dei genitori](genitori.md) e per bambino. Non è un gioco spento (la
carta resta in home) e non è un pezzo di scuola: è metà di un posto. Spenta,
i campi, il mulino e i recinti già costruiti restano in mappa come disegno,
il granaio non si svuota, e la pappa torna a comprarsi a monete.

## Come si tocca

Un solo gesto per tutto, ed è il motivo per cui non c'è niente da imparare:
**si tocca una cosa propria e si vede cosa ci si può fare.** Toccare un cane
apre la sua scheda, toccare un campo apre la sua. Tenere premuto e trascinare
sposta; tenere premuto sul prato apre il baule *dove* si vuole mettere
qualcosa.

Sopra un campo pronto e sopra una macchina che ha finito galleggia un 🧺, e
sopra una bestia che ha bisogno di qualcosa un 💭: si vedono da lontano,
senza aprire niente. Un recinto non ha bisogno nemmeno di quello — cambia
faccia da sé. Sono inviti, non rimproveri: non succede niente se si ignorano.

### Il baule

Duecento cose da comprare, in undici linguette a griglia — colonne uguali,
come una tastiera, invece di pillole centrate che facevano tre righe di
lunghezze diverse. **Quello che lavora sta separato da quello che arreda**:
in «Campi» ci sono quattro cose e sono le quattro che fanno qualcosa (campo,
mulino, due silos), in «Cortile» i cinque recinti, e basta. Ci erano finiti
in mezzo nove *finti campi* — aiuole a solchi, zolle, terra smossa — che si
posavano, si toccavano e non facevano niente: sono stati tolti, per la stessa
ragione per cui a suo tempo era stato tolto lo stagno disegnato. Le figure sono grandi, stanno
su un ripiano e sono **in scala fra loro**, così una casa si vede che è una
casa e un fiorellino che è un fiorellino: prima ogni pezzo era ingrandito per
conto suo, e i più grandi sbordavano dalla carta. Quello che non ti puoi
ancora permettere non è solo pallido: **dice di quanto** («manca 🪙12»), che
è il numero che rimanda a fare esercizi. Le cose che *lavorano* — campo,
mulino, silo, recinti — hanno un filo d'oro attorno, perché a scaffale non
c'era modo di distinguerle da un mobile.

## Cosa manca ancora

I primi tre punti di questa lista — gli sprite veri dei campi, gli animali da
reddito, la catena lunga — sono stati fatti il 18 agosto 2026, ed è per questo
che le due sezioni qui sopra esistono. Restano:

1. **Dire meglio che uno ha fame.** Il 💭 sopra la bestia c'è, ma è generico:
   un'icona per bisogno (🍖 se è la pancia, 🎾 se si annoia) si legge da
   lontano senza aprire la scheda. Vale anche per il 🧺 dei campi, che
   potrebbe dire *cosa* è pronto. I recinti l'hanno già risolto a modo loro —
   cambiano faccia — e quella è la strada.
2. **Gli animali dei recinti non camminano.** Un recinto è un disegno che
   cambia stato, non cinque bestie che girano per il prato: per farle
   camminare servirebbe un attore a quattro direzioni per specie, cioè un
   foglio ciascuno. Va bene così — quello che si guarda è il recinto, non la
   singola gallina — ma è la cosa che un bambino chiederà.
3. **L'acqua si vende come disegno, non come acqua.** Laghetto e stagno sono
   pezzi da giardino larghi due o tre celle, e vanno bene perché a nessuno
   viene in mente di accostarli. L'acqua vera si dipinge (`dipingi` nel
   motore, `dati/terreni.js`) e il pennello resta spento finché il pittore
   non sa raccordare due materie diverse.
4. **Altri modi di spendere.** Silos in più, un campo che matura più in
   fretta, un granaio più capiente: il money pit vive sull'attrezzatura, ed è
   lì che vanno le monete grosse.
5. **Le azioni sui campi, rifinite.** Oggi sono la stessa scheda dei cani, e
   va bene così; se un giorno i campi diventano molti, raccoglierli uno per
   uno diventerà noioso prima di diventare comodo.

## I file

| dove | cosa |
|:--|:--|
| `dati/coltivazioni.js` | colture, ricette, tempi, granaio — e il perché dei numeri |
| `dati/catalogo.js` | cosa si compra; `campo`, `macchina`, `silo` dicono chi lavora, `stati` chi si legge da lontano |
| `dati/bisogni.js` | i cibi: chi si compra a monete e chi si scala dal granaio |
| `motore/fattoria.js` | tutte le regole, senza schermo — gira anche in Node |
| `scena/tela.js` | il disegno, che non sa cosa sia il grano |
| `viste/Campo.vue` `viste/Macchina.vue` | le due schede che si toccano — la seconda vale per il mulino e per tutti i recinti |
| `viste/Granaio.vue` | le scorte, e perché stanno dietro a un silo |
| `viste/Roba.vue` `viste/Provino.vue` | il baule: lo scaffale, e la figura che ci sta dentro in scala |
| `sorgenti/gfx/campi.json` `animali.json` | i due fogli, e il perché di ogni ritaglio |
| `test/unita/coltivazioni.test.mjs` | si coltiva per davvero, spostando l'orologio |
| `test/unita/recinti.test.mjs` | i sei ritratti, e che si vedano tutti |
| `test/integrazione/campi.test.mjs` | col dito: semina, chiude il gioco, torna e raccoglie |
