# Il Generale — il piano del rovesciamento

Questo documento raccoglie le decisioni prese discutendo, e serve a due
cose: dire **cosa costruiamo** e, soprattutto, **perché in quel modo e non
nell'altro**. Non è una lista di funzionalità: è il cambio di forma che le
rende tutte possibili senza riaprire il motore ogni volta.

Il metro di ogni scelta qui dentro è uno solo — **aggiungere una cosa nuova
al gioco deve costare una classe e una riga, non una modifica al motore, alla
vista e al validatore.**

---

## 1. La diagnosi

Il Generale non è povero di verbi: ha ordini permanenti, eventi (`quando
senti`), cicli (`ripeti … finché`), bivi, segnali, rumore, reazioni. È povero
di **cose con cui quegli ordini possano interagire**, e la ragione è
strutturale, non di contenuto.

**Metà di quello che serve c'è già e non si vede.**

| cosa | stato oggi |
|---|---|
| porta a chiave (`chiave: 'chiavetta'`) | funziona, ma a schermo tutte le porte sono lo stesso disegno (`CampoLivello.vue:243`, `che:'portone'` cablato) |
| cinque stili di porta già dipinti | esistono in `grafica/oggetti/porte/indice.js`, **non li usa nessuno** |
| sfondare a spallate (`forza: n`, con tempo e fracasso) | esiste, ma è prigioniero della chiave: `generale.js:1424` la considera solo se la porta ha una serratura e non ce l'hai. Una porta senza chiave si apre sempre, subito, a chiunque |
| generatore deterministico con seme (`seminato`) | esiste in `tela.js:71`, col commento giusto attaccato |
| fondale in cache (`dipingiFondale`), luce per posizione (`p.luce`) | esistono |

**L'altra metà manca per un motivo solo: il mondo non ha regole proprie.**
Oggi la reattività appartiene ai personaggi — `grida`, `accorre`, gli ordini.
Una porta non può sapere che si apre quando qualcuno tira la leva, perché non
esiste il posto dove scriverlo. Ogni comportamento nuovo diventa un `case` in
più dentro `fai()` (`generale.js:1365-1590`), che è una funzione che sa tutto
di tutti: dentro `case 'apri'` c'è la serratura, le spallate, il fracasso — e
le spinte date finiscono perfino dentro il filo di **chi spinge**
(`f.st.spinte`), che è il sintomo più chiaro che lo stato sta nel posto
sbagliato.

Lo stesso difetto, di là dallo schermo: la scena la compila la vista
scorrendo a mano una collezione per famiglia (`CampoLivello.vue:186-273`).
Nessuno viene interrogato. Ne discendono la tabella dei ripieghi
(`ALTRI_NOMI`, e chi non c'è diventa una chiave), il tesoro trattato come
caso particolare, e il fatto che **aggiungere una leva vuol dire aprire la
vista**.

E il terreno ha la stessa forma di problema: il carattere della griglia porta
**un bit al gioco e zero alla grafica**. `creaMondo` fa `muro: griglia[y][x]
=== '#'`, e il pittore riceve un predicato booleano (`muri.js:26`). C'è un
solo materiale per mappa, e si vede scritto a `muri.js:208`:

```js
if (giu && A.muratura === 'mattoni' && dado(i, k, 920) > 0.8)   // ragnatele
```

Le ragnatele compaiono solo se **l'intera mappa** è di mattoni. Non è una
svista: è l'unica cosa scrivibile avendo una tavolozza sola per livello.

---

## 2. Le decisioni, in breve

1. **Tutto quello che sta sul campo è un `Elemento`** — porte, oggetti,
   congegni e (poi) le persone. Stessa classe base, stessi canali.
2. **Gli elementi si parlano.** Chi esegue non apre una porta: le *dice*
   `apri`, e la porta decide e risponde. Le regole del mondo non sono una
   tabella a parte: sono messaggi fra elementi.
3. **Ogni elemento si descrive da solo** (`faccia()`), e la vista smette di
   avere un ciclo per famiglia. Descrive, non dipinge: i pittori restano in
   `grafica/`.
4. **Un livello è una serie di inizializzazioni di oggetti**, con i default
   nel costruttore: il dato scrive solo dove devia dal normale.
5. **La griglia usa token a due caratteri**, con la barra facoltativa e una
   legenda locale. Fine del vincolo «una cella = una lettera».
6. **Chi costruisce dichiara la struttura; il tema la veste.** Il pittore
   riceve la forma e il nome del tema, e da lì sa da solo quali materiali,
   quale arredo e quale luce mettere.
7. **Il comportamento non entra mai nel livello.** Un livello nuovo combina
   elementi che esistono; un elemento nuovo è una classe.

---

## Parte I — Il mondo a elementi

### 3.1 La classe base

```js
export class Elemento {
  constructor (id, d, scena) {
    this.id = id; this.x = d.x; this.y = d.y; this.d = d
    this.scena = scena
    this.osserva()            // qui dentro ognuno dichiara cosa gli interessa
    this.azzera()
  }
  osserva () {}                    // this.scena.ascolta('fracasso', e => …)
  parti () {}                      // fa partire il suo listato di procedure
  ricevi (cmd, da, ctx) {}         // un comando da un altro elemento → esito
  chiedi (q) { return null }       // le condizioni lo interrogano
  dove () { return this }          // dove sono adesso: la porta sta ferma, il cane no
  faccia () {}                     // il descrittore per la tela, in celle
  scheda () { return [] }          // quello che si legge toccandolo
  azzera () {}                     // rigiocare la scena: ognuno si rimette com'era
}
```

Sette canali, e sono tutti quelli che servono. Le risposte di `ricevi`
riusano il vocabolario che `passoFilo` già capisce oggi — `fatto`, `lavora`,
`salta`, `attesa`, `subito` — quindi il ciclo di gioco non cambia forma.

Tre cose vengono in regalo:

- **`azzera()` sostituisce il deep clone.** Oggi `creaMondo` copia tutto
  «perché la partita si mangia lo stato» e `avvia()` rimette le porte a mano,
  riga per riga (`generale.js:825-828`). Un elemento nuovo non può
  dimenticarsi di essere azzerato: il metodo sta accanto al suo stato.
- **`coseDi()` sparisce** (`generale.js:357`). Oggi ricostruisce la tabella
  dei nominabili leggendo cinque collezioni; l'istanza *è* già quella voce, e
  il tipo lo dichiara lei.
- **Il costruttore fa da primo validatore.** Un dato incoerente non arriva a
  metà partita: `throw` all'istanziazione, come fa `Regole` in
  `giochi/codice-segreto/motore/partita.js:43`.

E il polimorfismo si mangia il codice scritto a mano: `dove(m, u, C)`
(`generale.js:1298`) sono cinque `case` per rispondere a «dove sei adesso», e
diventa un metodo.

### 3.2 Chi parla con chi

Due modi di comunicare, e sono due concetti di programmazione diversi che per
la prima volta si possono insegnare tutti e due:

| forma | cos'è | vincolo |
|---|---|---|
| `suona [segnale]` | il grido a chiunque sia in ascolto — l'**evento** | si sente ovunque: è rumore, e ha una posizione |
| `parla [elemento]` | dirlo a qualcuno in particolare — la **chiamata** | **solo a chi vedi**, se no cade il principio dell'onniscienza |
| `apri [porta]`, `premi [leva]` | un comando a un elemento | serve essere a portata: ci si arriva camminando |

Il vincolo su `parla` non è un dettaglio: il motore ha un principio esplicito
— «quello che vedi lo puoi aspettare, quello che non vedi te lo deve dire
qualcuno» (`generale.js:202`) — e un messaggio diretto a distanza infinita lo
cancellerebbe.

Il guadagno più grosso è che **`grida`/`accorre` smette di essere un caso
speciale**. Oggi `chiamaAllarme` e `accorri` (`generale.js:909-943`) sono
trenta righe che fabbricano a mano un `suona` finto e un filo finto, sotto un
commento che dice «non è un secondo sistema» — cioè la confessione che un po'
lo è. Con `osserva()` nel costruttore *è* lo stesso sistema.

### 3.3 Le tre regole del bus, non negoziabili

1. **Un evento pubblicato adesso si consegna al battito dopo.** Il motore lo
   fa già per i segnali, e il commento spiega perché: «così un segnale mandato
   adesso si sente al giro dopo, uguale per tutti» (`generale.js:984`). Con
   `osserva()` generalizzato è la differenza fra un motore riproducibile e uno
   in cui A ascolta B, B ascolta A e un battito non finisce più. Con questa
   regola un anello di elementi si rimbalza un messaggio al giro: si vede, non
   si impianta.
2. **Consegna in ordine di dichiarazione, sempre.** Chi ascolta lo stesso
   evento reagisce nell'ordine in cui è dichiarato nel livello. Non è
   pedanteria: `npm run simula`, il banco dei livelli e i test rigiocano le
   partite e pretendono lo stesso esito.
3. **Ogni consegna lascia una riga col mittente.** Il rischio vero di un
   modello a eventi è l'azione a distanza: la grata si apre e sullo schermo
   non c'è nessuno che l'ha aperta. Il registro deve dire «la leva rossa dice
   alla grata: apri».

Resta valida com'è la regola dell'**una cosa alla volta** (`generale.js:996-1015`):
un messaggio sveglia solo chi è libero, e a chi è occupato scivola addosso.

### 3.4 Cosa resta fuori

- **La scenografia dichiarata** non diventa un elemento: è dato del livello
  che va dritto alla tela, non si nomina e non si prende. Sta bene com'è.
- **Le unità** entrano nel modello, ma in una tappa a parte (§8): hanno fili,
  vista e memoria, e mescolare i due rovesciamenti vuol dire non finirne
  nessuno.

---

## Parte II — Come si scrive un livello

### 4.1 La griglia a token

Una cella occupa **due caratteri**. La barra è facoltativa e il parser la
ignora (`riga.replace(/\|/g,'')`, poi a pezzi di due): nei file si scrive
stretta, nell'editor con le barre.

```js
griglia: [
  '##|##|##|##|##|##|##',
  '##|..|..|p1|..|..|##',
  '##|..|Lr|..|..|T$|##',
  '##|~~|~~|..|..|..|##',
  '##|##|##|##|p2|##|##',
],
```

Perché la larghezza fissa invece del separatore libero: con token di lunghezza
diversa le righe si disallineano, e con l'allineamento se ne va il colpo
d'occhio — **la forma della mappa leggibile in una diff è metà del valore di
scriverla in ASCII**. Con due caratteri fissi l'alfabeto passa da una
trentina di simboli a oltre tremila, e la griglia resta un rettangolo.

Il validatore controlla una cosa sola in più: righe di lunghezza pari e tutte
uguali.

Sparisce così il difetto che ha fatto partire tutto: nessuno deve più
ricordarsi che `i` voleva dire tesoro perché le lettere buone erano finite. Il
tesoro si chiama `T$`, la leva rossa `Lr`, la seconda porta `p2`.

### 4.2 La legenda è l'inizializzazione

Un token della legenda **è la chiamata al costruttore**: i parametri che porta
sono quelli dell'oggetto, e tutto il resto lo mettono i default.

```js
legenda: {
  '..': { terreno:'pavimento' },
  '##': { terreno:'muro' },
  '~~': { terreno:'acqua' },
  p1:   { genere:'porta',  nome:'grata',      stile:'ferro',  chiave:'chiavetta' },
  p2:   { genere:'porta',  nome:'botola',     stile:'pietra', aMano:false },
  Lr:   { genere:'leva',   nome:'levaRossa',  collegata:['grata'] },
  T$:   { genere:'oggetto', nome:'tesoro',    pittore:'forziere' },
  '@@': { genere:'unita',  nome:'bibi',       chi:'cane' },
}
```

`Porta` senza `chiave` è libera, senza `forza` non si sfonda, senza `stile` è
di legno. **Il dato scrive solo dove devia dal normale**, e non si ripete: se
in mappa ci sono tre grate uguali, il token è uno.

La riga di confine, che vale per tutto il documento: **la legenda dice cosa
c'è, non come si comporta.** `p1` è una porta di ferro con quella serratura;
*cosa succede quando la si apre* sta nella classe `Porta`, uguale per tutte le
mappe del gioco.

Cose che la griglia non sa dire e che stanno nella legenda perché sono parole
e numeri, non posizioni: i **fili** fra elementi (`collegata:['grata']`), i
parametri, i nomi lunghi. Il criterio, detto una volta per tutte:

> **quello che si punta col dito sta nella griglia; quello che si legge sta
> nella legenda; quello che si comporta sta nella classe.**

Nomi ripetuti: lo stesso token usato più volte genera istanze numerate
(`guardia#2`), che è già la convenzione del formato vecchio.

### 4.3 Lo strato dei materiali (opzionale)

Un secondo rettangolo della stessa misura, con un alfabeto suo, che dice **di
che cosa è fatta** ogni cella:

```js
materiali: [
  'mm|mm|mm|mm|mm|mm|mm',
  'mm|..|..|..|..|..|mm',
  'mm|..|..|..|..|..|rr',
  'ii|..|..|..|..|..|rr',
  'ii|ii|mm|mm|mm|mm|mm',
],
// mm mattoni · rr roccia viva · ii intonaco crollato
```

**Serve solo quando l'autore vuole dirlo.** Se non c'è, se lo genera il tema
(§6). È lo stesso mestiere che il formato vecchio dava al `calco` per le
zone, quindi il precedente è in casa.

### 4.4 Riepilogo: cosa sta dove

| domanda | dove | perché lì |
|---|---|---|
| dove sta la porta | griglia | è una posizione: si punta col dito |
| che porta è (stile, serratura, forza) | legenda | sono parametri: si leggono |
| a chi è collegata la leva | legenda | è un filo fra nomi, non un posto |
| cosa succede quando la premi | **classe** | è comportamento: non è dato di nessun livello |
| di che materiale è il muro | strato `materiali`, o il tema | vestito, non regole |
| che faccia ha un elemento | l'elemento (`faccia()`) + `grafica/` che dipinge | il descrittore lo dà lui, il pennello no |
| le muffe e le ragnatele | nessuno: le genera il tema | non sono dato di nessuno |

---

## Parte III — Il vestito

### 5. Il render interroga

```js
// nella vista, al posto di tutto il blocco per famiglia:
for (const e of scena.elementi) s.push(...proietta(e.faccia()))
```

`faccia()` risponde **in celle**, non in pixel, e può restituire più
descrittori (la porta col suo sigillo, il totem con le tacche accese).
Restano alla vista le tre cose che sono davvero sue:

- la **camera** e la scala (`px/py`): se l'elemento restituisse pixel, il
  motore saprebbe di uno schermo e smetterebbe di girare in Node — dove
  `test/unita/generale.test.mjs` gioca tutti i livelli e `npm run simula` fa
  girare le partite;
- l'**interpolazione** fra due battiti (`prec`, `animT0`): è tempo di
  rendering, non stato di gioco;
- lo **strato e l'ordinamento**, che sono della tela (`tela.js:120-128`).

Il patto scritto in testa a `tela.js` non cambia — «il gioco descrive una
scena, la grafica ha un pittore per ogni nome» — cambia chi compila la lista.
In regalo: il motore in Node può dire *cosa si vede*, quindi il banco di
prova può controllare che una porta a lucchetto mostri il lucchetto.

### 6. Il tema

Il pittore riceve **la struttura e il nome del tema**, e nient'altro. Il tema
è un file in `grafica/ambienti/` — dove ce ne sono già undici — che oltre alla
tavolozza porta due cose che oggi non esistono: **le murature al plurale** e
**l'arredo piazzabile con le sue regole**.

```js
export const CRIPTA = {
  nome: 'cripta',
  /* non UNA muratura: tre, distribuite a chiazze larghe */
  murature: [
    { che:'roccia',   peso: 0.6 },
    { che:'mattoni',  peso: 0.3, dove: c => c.asciutto },
    { che:'intonaco', peso: 0.1, dove: c => c.umido, sfrangia: 0.4 },
  ],
  pose: [ { che:'lastre', peso:0.7 }, { che:'ghiaia', peso:0.3, dove: c => c.passaggio } ],

  /* L'ARREDO CHE SI PIAZZA DA SÉ: il tema sa cosa ci sta in una cripta
     e dove ci sta. Chi disegna la mappa non lo scrive mai. */
  arredo: [
    { che:'ragnatela',  dove:'angoloAlto',  ogni:14, peso: c => c.umido },
    { che:'sarcofago',  dove:'controMuro',  ogni:40, minimo:2 },
    { che:'ossa',       dove:'aterra',      ogni:25 },
    { che:'gocciolina', dove:'sottoMuro',   ogni:10, peso: c => c.umido },
    { che:'crepa',      dove:'muroDiBordo', ogni:6 },
    { che:'torcia',     dove:'pareteLunga', ogni:18, luce:true },
  ],
  luce: { fondo:'#0d1018', buio:0.55, caldo:'#ffb46a' },
}
```

**I contesti** sono la parte che oggi manca del tutto. Il pittore li calcola
una volta sola dalla griglia, prima di piazzare qualsiasi cosa:

```
  vicini(i,k)      →  la maschera a 8: angolo interno, parete dritta, capo di muro, sperone
  distanzaDalMuro  →  centro stanza / addossato / corridoio stretto
  umido            →  rumore a chiazze larghe, dal seme del livello
  passaggio        →  le celle sulle strade brevi fra le porte: lì il pavimento si consuma
  rispetto         →  le celle degli elementi e dei bersagli, più una di cuscinetto
```

`dove:'angoloAlto'` non è una posizione: è un **predicato sul contesto**. Ed è
la risposta a «il pittore non conosce i contesti»: oggi muschio e ragnatele
sono due `if` cablati con dentro `A.muratura === 'mattoni'`, cioè un contesto
solo, globale, scritto a mano (`muri.js:202-210`).

**I bordi non retti** sono la stessa famiglia: `sfrangia: 0.4` vuol dire che
il ritaglio di quel materiale non segue il rettangolo della cella ma un
profilo mosso da `dado(i,k,…)` — la roccia mangia l'intonaco, e i due
materiali si raccordano invece di accostarsi. Le altre due tecniche di
raccordo, in ordine di costo: il **filo di confine** (la stessa riga che oggi
stacca il bordo dalla massa, `muri.js:123-140`) e la **doppia passata
sfumata** con `velo`. Le ultime due dietro l'interruttore di `resa.js`, come
`RESA.ombraMuri`.

**La varianza deve avere una scala grande.** `dado(i,k,seme)` fa già rumore
*per cella*, ma il puntinismo uniforme non toglie la monotonia: la sposta di
frequenza, e la mappa resta ovunque «grigio con puntini». Serve un rumore a
chiazze larghe (valori su una griglia da 4-6 celle, interpolati) che moduli
umidità, tinta, usura e densità: allora la cripta ha un angolo allagato e uno
asciutto, e l'occhio legge *luoghi diversi* invece di texture diversa.

**Il pavimento non è meno colpevole del muro**, ed è dove si notano di più:
lastre grandi al centro, ghiaia ai bordi, consumo lungo i passaggi.

**La luce rende più della texture, e c'è già** (`luce.js`, e `p.luce` passata
ai pittori proprio perché dipende da dove sta la cosa). Tre torce e il resto
in penombra fanno più varietà di cinque murature nuove.

### 7. Le invarianti dell'arredo automatico

1. **Deterministico**: seme = id livello + numero della variante. Stessa
   mappa, stesse ossa negli stessi punti, sempre. Serve al riconoscimento
   («quello con la pozzanghera»), agli scatti di `docs/img/` e al fatto che
   una variante deve sembrare *lo stesso posto* con qualcosa spostato.
2. **Mai sulle celle in gioco**, con un cuscinetto di una cella. Un teschio
   sotto la chiave la fa sparire.
3. **Solo roba inerte.** Se un bambino potrebbe ragionevolmente provare a
   toccarla, la dichiara l'autore. E per i casi di confine — un sarcofago
   somiglia troppo a una cassa — **i toccabili portano un alone**: un glow
   tenue sugli elementi in gioco li stacca dall'arredo senza dover
   impoverire il repertorio decorativo. L'alone è una proprietà di `faccia()`,
   quindi lo dichiara l'elemento e lo dipinge la grafica.
4. **Quello che l'autore scrive vince**: la scenografia dichiarata resta dov'è
   e il generatore le gira attorno.

### 7.5 I personaggi, e il tetto della resa

Tutto quello che sta sopra riguarda il **terreno**. I personaggi hanno un
problema loro, e va detto separatamente perché la diagnosi è diversa e la
conclusione è meno comoda.

**Il difetto non era dove sembrava.** Il disegno pareva povero e nessuno sapeva
dire di cosa; cambiare a caso avrebbe voluto dire riscrivere trenta file e
scoprire dopo che il colpevole era un altro. Per rispondere è stato costruito
`strumenti/banco/` — una stanza sola, quattro personaggi, ogni miglioria dietro
un interruttore di `grafica/resa.js` — e le cause sono venute fuori tre, tutte
verificabili nel codice:

1. **I personaggi sono alti quaranta pixel.** Cella 36 px, `S = lato/20`, un
   personaggio 22 unità: la testa è 17 px e **un occhio ha raggio 1,5 px**
   (`personaggi/orco.js`). Niente sotto i due pixel esiste per chi guarda —
   ed è il motivo per cui rifinire un personaggio non si vedeva mai. Non era
   il disegno a essere povero: era nessuno a poterlo vedere.
2. **Il vocabolario ammetteva solo tinte piatte.** `capsula`, `poligono`,
   `tondo` facevano `fillStyle = col; fill()` con `col` stringa. Una tinta
   uniforme è carta colorata ritagliata: aggiungerne cento pezzi dà una figura
   complicata **di carta**, non una figura di ferro. È la ragione per cui
   «aggiungere cerchi» non migliorava nulla.
3. **I personaggi non ricevevano la luce della stanza.** `luceEBuio` è chiamata
   dentro `dipingiMappa`, cioè **solo sul fondale**: in una cripta buia gli
   omini erano illuminati a giorno sopra un pavimento nero, e leggevano come
   adesivi incollati su una foto.

**Cosa è entrato, e cosa costa.** Ogni voce è stata misurata col cronometro sul
disegno che il banco mostra accanto agli fps — e serviva, perché gli fps da soli
mentono per omissione: restano inchiodati a 60 dal vsync finché c'è margine, e
dicono «tutto bene» sia che un fotogramma costi 2 ms sia che ne costi 15.

| miglioria | dove | costo misurato |
|---|---|---|
| camminata continua (fase invece di 4 pose) | `corpo.js` | zero: è la stessa formula |
| luce sui personaggi (grading da `creaLuce`) | `luce.js`, `segni.js` | trascurabile |
| ombra orientata e sfumata | `corpo.js` | +0,02 ms su 16,7 di budget |
| grana del pavimento | `materiali/pietra.js` | fondale, si paga una volta |
| volume (gradiente a ginocchio) | `comune.js` | zero |
| materia per pezzo (trame dichiarate) | `materia.js`, `comune.js` | zero |
| densità di dettaglio | `personaggi/cavaliere.js` | zero |

Due numeri che valgono più del resto. **La grana del pavimento**: una lastra era
larga `0,95–2,10` celle contro un personaggio alto `1,1` — si camminava su
pietre larghe il doppio di chi ci passava sopra, lunghe quattro volte la loro
altezza. Non erano lastre, erano strisce. Il metro giusto era in casa ed è **la
muratura**: tanti pezzi piccoli, ognuno di tinta appena diversa. Ora `0,45–0,93`
di larghezza e `0,34` di altezza, sopra il concio a `0,26`: i due tessuti
restano distinti, come la regola in `materiali/pietra.js` chiede.
**E lo zoom**: è la leva singola più efficace di tutte, perché è l'unica che
rende visibile il lavoro già fatto invece di aggiungerne.

**Le tre scartate, e il perché** (il codice se n'è andato con loro):

- *occlusione ai contatti* — il velo scuro sotto il mento e ai piedi: si vedeva
  solo sull'orco, e appena;
- *tinta d'ambiente* — la stanza che tinge tutti: uniformava, ma si mangiava
  l'identità cromatica che è quello che rende i personaggi riconoscibili a colpo
  d'occhio. Da riprendere **solo** se un giorno si adottassero asset di
  provenienze diverse, dove serve esattamente a quello;
- *andatura* (easing e sfasamento del passo) — le partenze ammorbidite facevano
  sembrare i personaggi indecisi.

E una scartata per costo, che è la più istruttiva: la grana come **velo sul
fotogramma finito**. Costava poco ed era sbagliata in tre modi — era una
filigrana su tutto, compreso il fuori campo; **non si muoveva con la scena**,
quindi scorrendo la mappa il mondo scivolava sotto una grana ferma (sporco
sull'obiettivo, non materia); ed era la stessa per tutti, mentre uno scettro di
metallo è liscio per davvero. La versione buona posa la trama **dentro la forma,
ritagliata sul contorno**: vale il sistema di coordinate di chi disegna, quindi
la trama è attaccata alla cosa e ci si muove insieme senza che nessuno calcoli
niente. Le trame sono dichiarate dal pittore (`materie: { manica:'stoffa' }`),
perché **di che cosa è fatto lo sa chi lo disegna**.

### 7.6 Il tetto, e la decisione

Resta un fatto che nessuna delle voci qui sopra tocca: **un personaggio sta su
~45 primitive, un gioco commerciale sulle centinaia**. E il tetto non è tecnico
ma di produttività — scrivere una primitiva a mano costa cinque righe e minuti
di ragionamento in coordinate; disegnarla in un editor costa secondi. Due ordini
di grandezza, che nessuna quantità di lavoro sul codice recupera.

Passare a SVG **non cambierebbe niente**: anche lì i path si scriverebbero a
mano allo stesso ritmo. La prova è in casa — il bobtail di
`components/sagome/Cane.vue` è un SVG disegnato, ha 69 elementi contro i 45 del
cavaliere, ed è giudicato «meh» lo stesso.

> **Decisione: si migliorano i poligoni a poco a poco e si accetta il livello.**
> Gli asset pre-costruiti (Kenney, itch.io, opengameart) si rivaluteranno in
> futuro. Il blocco noto è la **coerenza di stile** fra fonti diverse; lo
> strumento per unificarli sarebbe `tinge()`, cioè la tinta d'ambiente scartata
> qui sopra. Da preferire i pacchetti **modulari** (pezzi separati), che si
> agganciano allo scheletro di `corpo.js` senza perdere direzioni, camminata e
> stati — con delle sprite intere si perderebbero tutti, e con dei PNG anche lo
> zoom, che è la leva migliore che abbiamo.

La divisione che ne esce, e che vale per tutto il documento:

> **Il procedurale è giusto per ciò che deve variare** — terreni, muri, luce,
> arredo: lì nessun asset disegnato può competere, ed è tutta la Parte III.
> **È sbagliato per ciò che è un'illustrazione fissa** — un personaggio. Lì il
> codice è un ripiego, e va saputo.

---

## Parte IV — Quello che diventa possibile

Con il rovesciamento in piedi, queste sono aggiunte da una classe l'una.

### 8.1 I varchi

| genere | come si dice | cosa insegna |
|---|---|---|
| libera | `{ genere:'porta' }` | niente: è un varco |
| a lucchetto | `chiave:'chiavetta'` | la catena: prima la chiave, poi la porta |
| **sfondabile** | `forza:6`, **senza chiave** | il tempo come risorsa: sei battiti di spallate sono la finestra in cui l'altro corre |
| **a comando** | `aMano:false` | non tutto si apre andandoci: qualcuno deve premere altrove |
| con fracasso | `rumore:'fracasso'` | fare rumore è una mossa, e si può ascoltare |

Il primo lavoro è **scorporare `forza` dalla chiave**: oggi
`generale.js:1424` la guarda solo dentro il ramo «non hai la chiave», quindi
una porta sfondabile senza serratura non è esprimibile.

**Il sigillo non si dichiara: si deriva.** La porta già dice qual è la sua
chiave; il motore assegna i colori in ordine (rosso, blu, verde…) a chiave e
porta insieme, e `faccia()` consegna un fatto già deciso (`sigillo:'rosso'`).
L'autore non deve tenere allineate due dichiarazioni e non può sbagliarsi — è
la risposta al problema dei lucchetti tutti gialli.

**Chi sa sfondare lo dichiara l'unità** (`sa` / `nonRiesce`): il topo no,
l'orco sì. Serve poco come regola, serve molto come ragione per coordinarsi.

### 8.2 I congegni

Verbo nuovo: **`premi`**. Condizione nuova: **`premuto:`**. Il congegno
produce un fatto e manda un comando a chi è nella sua lista `collegata`; cosa
significhi lo sa il destinatario. Una leva può aprire una grata *e* aprire la
gabbia dell'orco — «premi qui e liberi il tesoro, ma anche l'orco» diventa
scrivibile, e la catena si vede sulla mappa invece di stare in una tabella.

**La scheda si legge.** Toccando la leva: «quando la premi: si apre la grata
di levante, si apre la gabbia». È il principio già scritto nel motore — una
reazione che non si può leggere non è una regola del mondo, è una sorpresa —
e senza, gli eventi concatenati diventano tentativi a caso.

### 8.3 La variabile

`Totem`: riceve `conta` e, arrivato al numero, manda. Condizione: `almeno:n`.
Sul campo è una cosa che si vede — tacche, cristalli, bracieri accesi — non un
numero astratto.

E il regalo: **`ripeti … finché il totem è a 3` è già un `for`**, cioè ciclo,
variabile e condizione insieme, **senza nessun blocco nuovo da spiegare**. Per
questo non aggiungiamo un «ripeti N volte».

---

### 8.4 Le azioni, cioè i sottoprogrammi *(fatto, fuori dalle tappe)*

Non è un'aggiunta al mondo ma **al linguaggio del piano**, e sta qui perché
è una decisione strutturale come le altre.

Il problema che l'ha chiesta: dentro il ramo di un bivio non entra un altro
bivio, ed è una regola voluta — un albero non si legge su un telefono. Ma un
piano che deve scegliere **due volte in due momenti** («esci se è libero» e
poi «torna se è ancora libero») con quella regola non è scrivibile, e il
livello finisce tarato in modo che la seconda scelta non serva. Il vincolo di
struttura stava decidendo il contenuto.

Un'**azione** è una fila di ordini con un nome, che sta accanto al piano come
un «quando senti» e non parte da sé: la si chiama con `esegui [azione 2]`.

- **Non è un `Elemento` e non lo diventerà.** Gli elementi sono il mondo —
  posizione, `faccia()`, `scheda()`, `azzera()`. Un'azione non ha una
  posizione, non si disegna e non si tocca: è un pezzo di piano.
- **`esegui` non è `parla`** (§3.2). I tre canali restano tre: `suona` a
  chiunque, `parla` a chi vedi, `premi`/`apri` a portata. `esegui` non parla a
  nessuno — è controllo di flusso, come `ripeti`.
- **È una chiamata, non un lancio.** Il filo scende nell'azione e risale
  all'ordine dopo. Il personaggio resta uno, e la regola dell'**una cosa alla
  volta** non si tocca.
- **La chiamata in coda non impila.** Se dopo non resta niente da fare,
  `esegui` prende il posto del frame invece di aggiungerne uno. Non è
  un'ottimizzazione da manuale: senza, «se vedi ancora qualcuno, riprova» —
  che è il modo naturale di scrivere un'attesa — sbatterebbe contro il tetto
  della pila dopo dodici giri. Con, è un'attesa attiva che costa un battito
  per volta, e intanto il mondo si muove.
- **Le azioni sono cose come le altre**, ed è la parte che conta per il
  documento: entrano in `m.cose` col tipo `routine` (`raccogliRoutine`), e da
  lì in poi `laCosa`, i complementi di un verbo, la cassetta e gli elenchi dei
  bersagli funzionano **senza sapere che esistono**. Sono l'unica cosa
  nominabile che non viene dal mondo ma dal piano, e la sola riga che lo dice
  sta in `nominabili()`. La prima versione aveva un «se è un'azione allora» in
  quattro posti diversi — motore, complementi, cassetta, bersagli — cioè
  esattamente il difetto del §1.

Nomi: **azione** è quello che si legge a schermo; nel codice il blocco si
chiama `routine`, perché `azione` è già la classe dei verbi che agiscono
(`cl:'azione'`).

---

## 9. Le tappe

Ogni tappa si chiude con la build in mano e i test verdi. Le prime due non
toccano il motore; si possono fare per prime proprio perché **si guardano**.

| # | cosa | tocca | fatto quando |
|---|---|---|---|
| **a** | parser a token + legenda, livelli attuali convertiti in automatico | parser mappa, `data/livelli/*`, validatore | a schermo è tutto identico, test verdi |
| **b** | murature al plurale, chiazze larghe, sfrangiature | `mappa.js`, `muri.js`, `ambienti/`, `resa.js` | la cripta non è più a tinta unita |
| **c** | il tema con l'arredo automatico e i contesti | `ambienti/`, un modulo di piazzamento | una mappa nuda si arreda da sé, deterministica |
| **d** | `Elemento`, `faccia()`, `Porta`/`Oggetto`/`Posto`; la vista smette di avere un ciclo per famiglia | `motore/generale/`, `CampoLivello.vue` | comportamento identico, i cinque stili di porta in scena |
| **e** | le porte vere: `forza` scorporata, `aMano`, sigillo derivato, chi sa sfondare | `Porta`, un livello di prova | un livello nuovo che le usa tutte |
| **f** | `Unita extends Elemento` con `parti()`/`osserva()` | motore | `chiamaAllarme`/`accorri`/`dove` spariscono nel polimorfismo |
| **g** | `Leva`, `premi`, `premuto:`, il cablaggio e la scheda | motore, cassetta, editor | una tappa con due leve e una gabbia |
| **h** | `Totem`, `conta`, `almeno:` | motore | una tappa «premi i tre bracieri» |
| **i** | `parla` (messaggio diretto, solo a chi vedi) | motore, cassetta | una tappa dove serve dirlo a uno solo |

Lo **schema/editor** aggiornato ai generi nuovi va in coda: finché l'elenco
dei generi non è fermo, si rifarebbe due volte.

### 9.5 Le tappe della resa

Corrono **in parallelo** alle altre e non toccano il motore: si fanno guardando,
e ognuna si chiude aprendo `npm run banco`. Le migliorie sono già scritte e
stanno dietro gli interruttori di `grafica/resa.js`; quello che manca è
promuoverle e portarle nel gioco vero, dove oggi non arriva niente perché
`RESA` nasce tutto spento.

| # | cosa | tocca | fatto quando |
|---|---|---|---|
| **r0** | **consolidare l'ombra dei muri**: `muri.js` ne ha due, una stabile (§1) e una dietro `RESA.ombraMuri` (§4-bis). Accese insieme si sommano | `muri.js`, `resa.js` | una sola ombra, flag rimosso |
| **r1** | promuovere le cinque approvate: togliere `if` e flag, il codice resta con la sola strada buona | `resa.js` e i file che lo leggono | `resa.js` contiene solo ciò che è ancora in prova |
| **r2** | **portarle nel gioco**: `frazione` nella scena, `p.luce` passata da `CampoLivello`, cap del dpr in `tela.js` | `CampoLivello.vue`, `tela.js` | in partita si vede quello che si vede al banco |
| **r3** | **pinch-zoom e camera inseguitrice**, e via il doppio caching del fondale | `CampoLivello.vue`, `mappa.js` | mappe grandi navigabili, e il dettaglio si vede |
| **r4** | **i personaggi base**: densità di dettaglio e materie sui tredici, due o tre per volta | `personaggi/*.js` | nessuno è più «quattro cerchi» |
| **r5** | **il pelo sugli animali**: `bestia()` non passa ancora il materiale a `cfg.disegna` | `corpo.js`, `personaggi/lupo.js` e gli altri | lupo, gatto, orso e papera non sono a tinta piatta |
| **r6** | **gli oggetti**: i ~57 di `grafica/oggetti/` hanno lo stesso difetto dei personaggi, e sono molti di più in scena | `oggetti/*.js` | il forziere non è tre ellissi |

**r0 e r1 vengono prima di tutto**, perché finché i flag restano accesi ogni
lavoro sui personaggi si giudica su una base che cambia sotto i piedi.
**r3 è la più costosa e la più redditizia**: senza zoom, tutto il lavoro di r4
resta invisibile esattamente come prima.

---

## 10. Cosa abbiamo scartato, e perché

- **Token a lunghezza libera con separatore** (`p1|m|m`): righe disallineate,
  la forma della mappa non si legge più in diff.
- **Una tabella `regole` del livello**: sostituita dai messaggi fra elementi.
  Se le regole stanno in una tabella non si vedono sulla mappa; se stanno
  negli elementi, la catena la segui col dito.
- **La logica dentro il dato del livello** (funzioni, `new Porta(...)` nei
  file dei livelli): l'editor non potrebbe più rileggerlo, le varianti non
  sarebbero più toppe leggibili in diff, il validatore dovrebbe eseguire.
- **Un verbo per ogni congegno** (`tira`, `gira`, `accendi`): quattro modi di
  dire la stessa cosa. Uno solo, e l'aspetto è dato.
- **Variabili con aritmetica generale**: un contatore con soglia copre i casi
  che servono e resta una cosa che si vede sul campo.
- **`ripeti N volte`**: già ottenibile con il totem, e insegna di più.
- **Porta a senso unico**: bella nei puzzle, non insegna niente di nuovo.
- **L'elemento che dipinge sé stesso col `ctx`**: il motore smetterebbe di
  girare in Node e morirebbero i test che giocano i livelli.
- **Una libreria grafica** (Pixi, Konva): il campo fa ~35-50 draw call per
  frame sopra un fondale precotto, e quelle librerie risolvono il problema di
  chi ne fa migliaia. In retained mode costringerebbero a riscrivere tutti i
  pittori — oggi funzioni immediate che leggono `dir`, `stato`, `passo` — per
  non guadagnare nulla, e porterebbero via il motivo per cui lo zoom è quasi
  gratis: **il disegno è vettoriale e scala senza perdita**.
- **Sprite bitmap al posto dei pittori**: peso alto nell'HTML unico, e lo zoom
  smetterebbe di essere gratis. Vedi §7.6.
- **La grana come velo sul fotogramma finito**: era una filigrana ancorata allo
  schermo invece che alle cose. Vedi §7.5.

---

## 11. Rischi e reti

- **La rete vera sono i test che giocano.** `test/unita/generale.test.mjs`
  gioca le soluzioni di tutti i livelli su tutte le varianti: se dopo un
  rovesciamento vincono ancora tutte, il rovesciamento è riuscito. Nessuna
  tappa si chiude con quel test rosso.
- **Il determinismo è un requisito, non un vezzo**: niente `Math.random` nel
  motore, consegne in ordine dichiarato, semi derivati dall'id. Ci vivono
  sopra `npm run simula`, il banco dei livelli e la riproducibilità dei bug.
- **Il salvataggio non è a rischio**: gli ordini citano nomi, non istanze, e
  i piani salvati continuano a riferirsi agli stessi id. Gli id dei contenuti
  non si rinominano, come sempre.
- **`strumenti/mappe/` è disallineato**: `FORMATO.md` e `nucleo.js`
  descrivono ancora il formato ASCII vecchio (`mappa`/`calco`, verbi
  `pattuglia`/`chiama`) e non i livelli veri in `src/data/livelli/`. Con la
  tappa **a** vanno o aggiornati o dichiarati storici — il `CLAUDE.md` li
  indica come specifica, quindi una delle due cose va fatta.
- **Il costo del fondale**: più materiali vogliono più passate di ritaglio,
  ma il fondale è in cache (`creaFondale`) e si paga una volta per tappa.

---

## 12. I nomi

Il codice è in italiano, e i nomi che useremo sono questi:

| concetto | nome |
|---|---|
| la cosa sul campo | `Elemento` |
| un pezzo di piano con un nome | `azione` a schermo, `routine` nel codice |
| chiamarlo | `esegui [azione 2]` |
| far partire il suo listato | `parti()` |
| iscriversi agli eventi | `osserva()` |
| ricevere un comando | `ricevi(cmd, da)` |
| farsi interrogare da una condizione | `chiedi(q)` |
| descriversi per la tela | `faccia()` |
| quello che si legge toccandolo | `scheda()` |
| rimettersi come all'inizio | `azzera()` |
| il contenitore della partita | `scena` |
| il vestito di un ambiente | `tema` |
| le cose che il tema piazza da sé | `arredo` |
| gli interruttori della resa (cantiere) | `RESA`, in `grafica/resa.js` |
| di che cosa è fatto un pezzo | `materie: { manica: 'stoffa' }` |
| il disegno di una trama | `trama()`, in `grafica/materia.js` |
| che luce arriva in un punto | `creaLuce().in(x, y)` |
