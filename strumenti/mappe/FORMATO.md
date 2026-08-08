# Il formato dei livelli del Generale

Un livello del Generale è **un dato puro**: nessun codice, nessuna funzione,
niente che si possa eseguire. Una griglia di caratteri e dei metadati attorno.
Questo permette tre cose che contano più della bellezza: si legge in una diff,
si controlla senza aprire il browser, e si disegna col mouse
(`strumenti/mappe/editor.html`).

Chi vuole aggiungere una tappa non deve leggere il codice del gioco: gli
bastano questo documento, un esempio da copiare
(`strumenti/mappe/esempi/livelli.mjs`) e il validatore che gli dice cosa non
torna:

```bash
node strumenti/mappe/valida.mjs           # gli esempi e i livelli veri
node strumenti/mappe/valida.mjs mio.txt   # un livello incollato in un file
```

---

## 1. La griglia

La mappa è un elenco di righe, tutte lunghe uguale, con il bordo chiuso da
muri. Sta scritta in `mappa` e si legge a occhio:

```js
mappa: [
  '##########',
  '#..k.....#',
  '#.@...P.T#',
  '##########',
],
```

Le coordinate sono `x` da sinistra (0 è il muro di sinistra) e `y` dall'alto
(0 è la riga in cima). Il validatore le dice sempre così: «riga 4, colonna 5».

### La legenda

| simbolo | genere | nome (quello che citano gli ordini) | note |
|---|---|---|---|
| `#` | terreno | muro | non ci si cammina |
| `.` | terreno | pavimento | |
| `~` | terreno | acqua | non ci si cammina |
| `,` | terreno | cespuglio | ci si cammina, ci si nasconde |
| `@` | unità | eroe | **uno solo per mappa** |
| `s` | unità | soldato | |
| `e` | unità | esploratore | |
| `o` | unità | orco | |
| `l` | unità | ladra | |
| `g` | unità | guardia | |
| `c` | unità | cane | |
| `k` | cosa | chiave | si prende |
| `T` | cosa | tesoro | si prende |
| `z` | cosa | zaino | si prende |
| `P` | congegno | portone | chiude il passo finché non si apre |
| `L` | congegno | leva | si aziona |
| `A` | congegno | campana | si aziona |
| `X` | traguardo | uscita | |
| `B` | traguardo | bandiera | |

La legenda vive in un posto solo, `strumenti/mappe/nucleo.js`: aggiungere un
simbolo vuol dire aggiungere una riga lì, e da quel momento l'editor lo mette
in tavolozza e il validatore lo accetta.

### Cosa sa fare un'unità

Ogni unità dichiara i verbi che sa eseguire, ed è lì che sta la differenza fra
una e l'altra:

| unità | sa fare |
|---|---|
| eroe | tutto |
| soldato | tutto tranne `apri` |
| esploratore | né `apri` né `pattuglia` |
| orco | tutto tranne… niente: è l'eroe degli altri |
| ladra | tutto tranne `pattuglia` — non è una sentinella |
| guardia | tutto tranne `prendi` e `posa` — non raccoglie roba |
| cane | corre, segue, pattuglia, scappa, aspetta e abbaia (`chiama`) |

Non è un bilanciamento: **è la ragione per cui una tappa ha più di un'unità.**
Se il cane aprisse i portoni, «mandaci il cane» sarebbe sempre la risposta e
non ci sarebbe più niente da pensare. Ed è una proprietà della creatura, non
del livello — un cane non impara ad aprire le porte nella terza tappa —
perciò sta nella legenda e non nel dato della tappa.

Da qui il filtro degli ordini ha tre lati: **il verbo**, **il genere del
bersaglio** e **chi lo esegue**. Il validatore li controlla tutti e tre, e nel
costruttore dell'editor un verbo che quell'unità non sa fare non compare
proprio nella tendina.

**Il nome è la parte che conta.** Gli ordini non citano i caratteri, citano i
nomi: `bersaglio: 'chiave'`, non `bersaglio: 'k'`. Se sulla mappa la chiave non
c'è, il validatore dice esattamente questo:

```
«chiave» («k») non compare nella mappa, e 3 ordini ci fanno riferimento
(ordine 2 del livello; soluzione «in fila», ordine 1; …)
```

Quando dello stesso simbolo ce n'è più di uno, il nome vale per tutti — «la
guardia» sono tutte le guardie — e la singola si indica con il cancelletto e il
numero d'ordine di lettura: `guardia#2`.

---

## 2. Le zone: un calco sopra la mappa

Le zone di ronda non stanno nella griglia del terreno, perché una cella può
essere insieme pavimento e cortile. Stanno in una **seconda griglia della
stessa misura**, il `calco`, dove ogni zona è una lettera maiuscola e il punto
vuol dire «nessuna zona»:

```js
calco: [
  '..........',
  '.BBB.AAAA.',
  '.BBB.AAAA.',
  '..........',
],
zone: {
  A: 'sala del tesoro',
  B: 'corridoio',
},
```

Perché un calco e non dei rettangoli `{x, y, w, h}`: le stanze vere non sono
rettangoli, una L o una corona non si scrivono con quattro numeri, e soprattutto
un calco **si disegna col pennello** e si rilegge a colpo d'occhio. Il costo è
di dover tenere le due griglie sovrapponibili, e il validatore lo controlla.

Una **ronda** è un giro fatto di zone, nell'ordine in cui si visitano. Serve
perché l'ordine di visita è l'unica cosa che un disegno non sa dire:

```js
ronde: {
  'giro delle torri': ['B', 'A', 'C'],   // e poi si ricomincia
},
```

Nomi di zone e di ronde stanno nello stesso elenco dei bersagli: non possono
chiamarsi come un oggetto della mappa, o un ordine diventerebbe ambiguo.

---

## 3. Le fazioni: chi comanda chi

È la riga che divide il gioco in due. Ogni fazione dice **chi le firma gli
ordini**: il bambino (`giocatore`) o il livello (`livello`).

```js
fazioni: {
  nostri:  { nome: 'i nostri',  autore: 'giocatore', simboli: '@se' },
  banditi: { nome: 'i banditi', autore: 'livello',   simboli: 'olgc' },
},
```

Ogni unità che sta sulla mappa deve stare in una fazione e in una sola. Il
livello non può dare ordini alle unità del giocatore, e la soluzione non può
darli ai nemici: sono due errori, non due avvisi, perché sono il modo più
facile di scrivere un livello che si risolve da solo.

---

## 4. Gli ordini

Un ordine è **permanente**: si firma prima di premere play e vale finché non
finisce. Si scrive sempre così:

```js
{ chi: 'guardia', quando: 'segnale:rosso', fai: 'pattuglia',
  bersaglio: 'cortile', finche: 'vedi:eroe' }
```

| campo | cosa dice |
|---|---|
| `chi` | a chi è firmato: un nome di unità (`guardia`), una singola (`guardia#2`), o una fazione intera (`banditi`) |
| `fai` | il verbo, dalla tabella qui sotto |
| `bersaglio` | il complemento: un nome della mappa, una zona, una ronda, un segnale |
| `quando` | la condizione che lo fa **partire**. Se manca, parte subito |
| `finche` | la condizione che lo fa **finire**. Se manca, finisce quando è compiuto |

### I verbi

| verbo | bersaglio | cosa fa |
|---|---|---|
| `vai` | cosa, congegno, traguardo, zona, ronda, unità | ci cammina fin lì e si ferma |
| `prendi` | cosa | va a prenderla e se la porta dietro |
| `posa` | cosa | lascia a terra quello che ha in mano |
| `apri` | congegno | lo apre — se serve la chiave, deve averla addosso |
| `pattuglia` | zona, ronda | gira su e giù finché non succede qualcosa |
| `segui` | unità | gli sta dietro |
| `scappa` | zona, traguardo | ci corre via |
| `chiama` | segnale | lancia il segnale: chi lo aspetta si mette in moto |
| `aspetta` | — | sta fermo; **vuole `finche`**, se no è un'unità che non riparte |

Il validatore sa quale bersaglio ha senso per quale verbo: «pattuglia il
tesoro» viene rifiutato con scritto perché. E sa anche **chi** può eseguire
cosa: «il cane non sa apri» è un errore come gli altri, con l'elenco di quello
che il cane sa fare.

### Le condizioni

Si scrivono `verbo:bersaglio`, e sono le stesse in `quando` e in `finche` —
perché sono sempre una domanda con risposta sì o no.

| condizione | vera quando |
|---|---|
| `vedi:<unità>` | ha in vista quell'unità |
| `hai:<cosa>` | ce l'ha addosso |
| `aperto:<congegno>` | quel congegno è aperto |
| `preso:<cosa>` | qualcuno l'ha raccolta |
| `arrivato:<zona\|traguardo\|cosa>` | ci è arrivato |
| `segnale:<segnale>` | quel segnale è stato lanciato |
| `subito` | (da sola) vera da subito: è il valore normale di `quando` |
| `mai` | (da sola) non diventa mai vera |

I segnali che ci sono sempre sono `rosso`, `verde` e `blu` — gli allarmi. Un
livello può dichiararne altri: `segnali: ['ritirata']`.

### La cassetta

`cassetta` è l'elenco dei verbi che il bambino ha a disposizione in quella
tappa. È la vera scala di difficoltà: la prima tappa dà `vai` e basta, e
l'ultima dà tutto.

```js
cassetta: ['vai', 'prendi', 'apri', 'aspetta'],
```

Gli ordini fissi del livello (`ordini`) **non** passano dalla cassetta: quelli
li scrive l'autore, non il bambino.

---

## 5. Il par e le soluzioni

`par` è quanti ordini bastano a chiudere la tappa: un numero intero maggiore di
zero. Serve al bambino come metro («ce l'ho fatta in quattro invece che in
tre») e all'autore come promessa da mantenere.

`soluzioni` è quella promessa messa per iscritto: almeno una sequenza di ordini
che chiude il livello. Non serve a mostrarla al bambino — serve perché esista
qualcosa di controllabile, e perché il giorno in cui ci sarà il motore, il test
possa **giocarla** e dimostrare che il livello si chiude davvero.

```js
par: 3,
soluzioni: [
  { nome: 'in fila', ordini: [
    { chi: 'eroe', fai: 'prendi', bersaglio: 'chiave' },
    { chi: 'eroe', fai: 'apri', bersaglio: 'portone' },
    { chi: 'eroe', fai: 'prendi', bersaglio: 'tesoro' },
  ] },
],
```

Una soluzione più lunga del par è un errore (o è sbagliata lei, o è sbagliato
il par). Più corta è un avviso: vuol dire che il par è largo di manica.

### La soluzione fragile

Una soluzione si può segnare `fragile: true`. È il piano che vince la base e
**cade su una variante**: la scorciatoia, il conto dei passi, il piano senza
`se`. Non è un difetto da correggere — è la prova che le tre scene servono a
qualcosa, ed è quello che il giorno del motore il test giocherà pretendendo
che *perda*.

```js
soluzioni: [
  { nome: 'in fila', ordini: [ /* … */ ] },
  { nome: 'la scorciatoia', fragile: true, ordini: [ /* … */ ] },
],
```

Due conseguenze: a una fragile non si rinfaccia il par largo di manica (è
corta apposta), e **non possono essere fragili tutte**, o resterebbe un
livello che nessuno ha dimostrato di poter chiudere.

---

## 6. Le varianti

Un livello si gioca **tre volte**: la base e due varianti. Servono perché
rigiocare una tappa non sia rifare la stessa identica cosa a memoria.

Una variante è **un livello parziale steso sopra a quello base**, non un seme.
La scelta è voluta: con un seme il livello che il bambino gioca davvero non è
scritto da nessuna parte, non si vede in una diff, non si può disegnare
nell'editor e non si può correggere se viene storto — si può solo cambiare
numero e risperare. Le differenze esplicite si leggono, e il validatore le
controlla **una per una** come se fossero livelli a sé (è così che si scopre il
guaio che sta solo nella terza).

```js
varianti: [
  { nome: 'la chiave in fondo', sposta: { k: [1, 7] } },
  { nome: 'due guardie', mappa: [ /* … una mappa intera … */ ] },
],
```

- ogni chiave presente nella variante **sostituisce** quella della base
  (`mappa` per intero: mezza mappa nuova non si leggerebbe);
- `zone` invece si fonde, lettera per lettera;
- `sposta: { simbolo: [x, y] }` è la scorciatoia per il caso che capita
  sempre — la stessa stanza con la chiave da un'altra parte. Funziona solo con
  i simboli che sulla mappa compaiono una volta sola, e la casella d'arrivo
  dev'essere pavimento libero.

**Le differenze non si scrivono a mano.** Nell'editor ogni variante ha la sua
linguetta sopra la mappa: la si apre, si disegna sopra la base — sposta la
chiave, metti un cespuglio, allarga la stanza — e la differenza la ricava lui.
Se basta uno spostamento scrive `sposta`, se no si porta dietro la `mappa`
intera, che è l'unico modo di leggere un cambio più grosso. Nome, racconto,
ordini e soluzioni restano della base: nella variante si disegna e basta.

---

## 7. Un livello intero

```js
{
  id: 'portone',
  nome: 'Il portone',
  racconto: [
    'Il tesoro è nella sala grande e il portone è chiuso a chiave.',
    'La chiave è qui nel corridoio: scrivi gli ordini e poi guarda.',
  ],
  mappa: [ /* … */ ],
  calco: [ /* … */ ],
  zone: { A: 'sala del tesoro', B: 'corridoio' },
  fazioni: {
    nostri:  { nome: 'i nostri',  autore: 'giocatore', simboli: '@se' },
    banditi: { nome: 'i banditi', autore: 'livello',   simboli: 'olgc' },
  },
  segnali: [],
  ordini: [
    { chi: 'guardia', fai: 'pattuglia', bersaglio: 'sala del tesoro', finche: 'vedi:eroe' },
  ],
  cassetta: ['vai', 'prendi', 'apri', 'aspetta'],
  par: 3,
  dritta: 'Il portone non si apre a mani vuote.',
  varianti: [ /* … */ ],
  soluzioni: [ /* … */ ],
}
```

`id`, `nome`, `racconto`, `mappa`, `fazioni`, `cassetta`, `par` e `soluzioni`
ci vogliono sempre. `calco`, `zone`, `ronde`, `segnali`, `ordini`, `dritta` e
`varianti` si mettono quando servono.

---

## 8. Cosa controlla il validatore

Errori (il livello non si può giocare):

- la griglia non è rettangolare, o è più piccola di 4×4;
- il bordo non è chiuso — dice in quali punti;
- c'è un simbolo che non è in legenda — dice quale e dove;
- gli eroi non sono esattamente uno;
- il calco non è sovrapponibile alla mappa, usa una lettera senza nome, o una
  zona è dichiarata e mai disegnata, o copre dei muri;
- una ronda passa da una zona che non esiste;
- un ordine cita un bersaglio che non c'è, o del genere sbagliato per quel
  verbo, o è firmato a un'unità che non esiste;
- il livello comanda le unità del giocatore, o la soluzione comanda i nemici;
- una condizione è scritta male o cita il genere sbagliato;
- la cassetta è vuota, o contiene verbi che non esistono, o la soluzione usa un
  verbo che non è in cassetta;
- il par non è un intero maggiore di zero, o la soluzione è più lunga del par;
- manca il nome, il racconto o la soluzione;
- una cosa o un congegno è **murato**: dall'eroe non ci si arriva nemmeno con
  tutti i portoni aperti;
- una variante sposta un simbolo che non è unico, o lo mette dove c'è già
  qualcosa.

Avvisi (probabile svista, ma può essere voluto): una zona in due pezzi
staccati, un par largo di manica, un livello con meno di tre versioni, un
racconto troppo lungo, un'unità chiusa in una stanza sigillata, una strada che
passa da un portone quando sulla mappa non c'è né chiave né leva.

Il validatore controlla **la base e ogni variante**, e i guai che vengono solo
da una variante li marca col suo nome.

---

## 9. Come si aggiunge un livello

1. apri `strumenti/mappe/editor.html` con un doppio click (è uno strumento di
   sviluppo: non entra nel build, non sta in `src/`);
2. in cima a destra, **scegli quale delle 24 tappe stai disegnando**: nome,
   racconto, dritta, cassetta e par arrivano da soli da
   `src/data/campagne-generale.js`, le due varianti prendono il nome dalle
   scene descritte lì, e sopra la mappa resta scritto **il concetto che quella
   tappa deve insegnare** — che è l'informazione che guida la matita. La
   stessa tendina dice quali tappe hanno già una mappa e quali no;
3. disegna la mappa, poi passa al calco e disegna le zone;
4. nella linguetta **⚙️ La tappa** ritocca quello che serve: nome, racconto, cassetta,
   fazioni, par, e — se servono — le ronde e i segnali in più;
5. nella linguetta **📜 Ordini e soluzioni** componi gli ordini a menu. Non si
   scrive niente a mano: si sceglie **a chi**, **quando**, **cosa fa**, **su
   cosa** e **finché**, e ogni tendina offre soltanto quello che sulla mappa
   c'è già disegnato e che quel verbo accetta. Gli ordini del livello e le
   soluzioni si compongono allo stesso modo, raggruppati per unità; la
   scorciatoia che deve cadere su una variante si segna **fragile**;
6. dalle linguette sopra la mappa apri **＋ variante** e disegna le altre due
   scene: la differenza fra la base e quello che disegni la ricava l'editor;
7. guarda l'elenco dei problemi finché non è vuoto — e il par te lo propone
   lui, contando la soluzione più corta che non è fragile;
8. premi **copia** e incolla il testo in `src/data/generale.js`;
9. lancia `node strumenti/mappe/valida.mjs` e `node test/esegui.mjs mappe`.

Per la tappa dopo, se l'impianto è lo stesso, c'è **⧉ parti da questa**: tiene
mappa, zone e ordini e stacca il nome, così si ritocca invece di ridisegnare.

L'elenco delle tappe l'editor se lo porta dentro con
`strumenti/mappe/campagne.js`, che è **generato**: esce da `node
strumenti/mappe/estrai-campagne.mjs` e va rifatto quando le campagne cambiano
(il test `unita/mappe` confronta una firma e lo dice).

Le tendine sono anche il primo validatore: un ordine impossibile — «prendi il
portone», «pattuglia il tesoro», il livello che comanda l'eroe — non compare
proprio fra le scelte. Quello che il validatore dice dopo sono le cose che un
menu non può sapere: il par, i muri, le strade sbarrate.

Per correggere un livello che esiste già si fa il contrario: si incolla il suo
testo nella casella dell'editor, lo si vede disegnato, si aggiusta, si ricopia.
