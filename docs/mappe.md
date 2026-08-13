[← torna al README](../README.md) · [il gioco](generale.md) · [come si insegna](generale-didattica.md) · [dove siamo](generale_improvements.md)

# Le mappe — dalla forma compressa alla stanza

Quello che un livello scrive è **una forma compressa**: una griglia di
token e una legenda. Quello che si vede a schermo è un reticolo pieno,
con il terreno risolto cella per cella, i bordi raccordati, l'arredo al
suo posto. Fra le due cose ci va un passo, e questo file dice qual è.

Prima quel passo **non esisteva**: si andava dai token al disegno, e
ogni pezzo che avesse bisogno di sapere qualcosa sulla forma della
stanza se lo ricavava da sé. È il motivo per cui, scrivendo un livello
in una sera, è finita una botte disegnata sopra un muro — non perché la
regola fosse sbagliata, ma perché non c'era nessuno che sapesse cos'è
un muro. Adesso c'è: `motore/generale/stanze.js`.

---

## 1. Tre famiglie in legenda, e sono già due

La legenda dichiara già chi cammina (`chi.*`) e cosa c'è (`cose.*`). Da
oggi dichiara anche **di che è fatto il posto**:

```js
scena: campo([
  '##|##|##|##|##|##|##',
  '##|,,|,,|PT|==|==|##',
  '##|,,|@@|,,|==|BT|##',
], { '@@': eroe, PT: cose.porta(), ',,': suoli.erba(), '==': suoli.lastre(),
     BT: arredo.botte() }),
```

- **`suoli.*`** — di che è fatto il pavimento lì. La cella resta
  pavimento a tutti gli effetti: il motore non sa nemmeno che sia
  diverso, cambia solo chi la dipinge. *(fatto)*
- **`muri.*`** — di che è fatta la muratura. La cella resta muro: non ci
  si passa, la vista si ferma. *(fatto)*
- **`arredo.*`** — un mobile: **occupa la cella**. Non è scenografia
  dipinta, è un ostacolo vero, e per questo si dichiara qui e non in
  `scenografia`. *(fatto)*
- **`arredo.niente()`** — «qui non ci va niente», nemmeno
  all'arredatore automatico. *(fatto)*

La regola che ne discende: **quello che si vede ingombrare, ingombra**.
Non esiste più il caso «disegnato solido, calpestabile».

Vale per l'arredo **dichiarato**, che sta dentro una stanza e ne
occupa una casella. Quello che nasce da sé è un'altra cosa e sta
altrove: sulla faccia dei muri che ci sono già (§3).

---

## 2. La decompressione *(fatta: `motore/generale/stanze.js`)*

Una funzione pura: griglia compressa → **mappa piena**. Restituisce, per
ogni cella, quello che è (muro/pavimento/arredo, con che materiale) e
quello che **sa di essere** rispetto alla forma della stanza:

- in che **stanza** sta (le stanze si separano ai varchi);
- se è una **soglia** — il passaggio fra due stanze;
- se è un **bordo**, un **angolo**, un **fondo cieco**;
- cosa ha **adiacente** (questo muro dà sul prato, questo sul lastricato);
- se è un **passo obbligato**: toglierla spezzerebbe la stanza in due.

Qui dentro migrano due cose che oggi sono scritte a mano in due file
diversi:

- **il riempimento dei buchi.** Un token dice una cosa sola: la cella
  che ospita una chiave non può dichiarare anche il pavimento, e restava
  con quello dell'ambiente — una macchia d'erba sotto ogni oggetto in
  mezzo al lastricato. Si guarda intorno e si prende il terreno dei
  vicini (oggi: `motore/generale/campo.js`);
- **i dettagli che non devono cadere sul lastricato** (oggi: dentro
  `libera()` in `grafica/mappa.js`).

E qui nasce la cosa che vale di più: **è una funzione pura, quindi si
prova**. Il banco può guardarci dentro invece di fidarsi di quello che
esce dipinto.

---

## 3. L'arredamento automatico *(fatto: `motore/generale/arreda.js`)*

Sopra la mappa piena, e **separato**, così si prova da solo e si può
spegnere. Il catalogo — chi può nascere in che ambiente, e quanto — è
dato: `data/arredamento.js`.

### Il seme serve alle imperfezioni, non alle scelte

Una macchia d'usura può nascere da un rumore: sbagliarla non vuol dire
niente. Una torcia o una botte no — seminate a caso si ripetono a caso.
Qui la conoscenza c'è davvero (questo è un angolo, questa è una soglia,
questo muro dà sul prato), quindi le scelte sono **informate**.

### Dove sa stare una cosa

È una proprietà dell'oggetto, non di chi arreda:

| regola | vuol dire | esempi |
|---|---|---|
| `sulMuro` | sulla faccia del muro, non sul pavimento | torcia, ragnatela, bandiera |
| `alMuro` | appoggiata alla parete: sulla casella di muro, col pavimento davanti | botte, cassa, sacco, stalagmite |
| `ovunque` | sul pavimento, e allora è roba che si calpesta | pozzanghere, ossa, funghi |

E in più **su che terreno**: i fiori sul prato sì, sul lastricato no; le
ragnatele in una cripta sì, in un cortile no. Ogni ambiente dichiara
cosa può nascere da lui.

### Quanto

Un **fattore di riempimento** moltiplicato per l'area della stanza: una
stanzetta da sei caselle prende una cosa, un salone ne prende sei. Le
stanze la decompressione le ha già separate.

### La presenza è la dichiarazione

Se una torcia l'hai messa **a mano**, serve alla storia: **fa luce**, e
il motore non ne aggiunge altre in quella stanza. Se non ne hai messe,
può metterne di **scenografiche**: si vedono e non cambiano la vista di
nessuno. Non serve nessun flag — la differenza è chi ce l'ha messa.

### La regola: la mappa non si tocca

La prima versione dell'arredatore faceva il contrario. Sceglieva una
casella di pavimento contro una parete e la **murava** — una botte
ingombra, e la mappa non deve mentire — con tre divieti a fare da rete:
mai su una soglia, mai su un passo obbligato, mai dove il livello ha
chiesto una casella libera.

Non bastavano, e l'hanno detto in due. Il banco: `azioni/1-la-ronda-che-decide`
smetteva di vincersi, perché quel livello si gioca **a vista** e una
botte che non chiude niente allunga lo stesso di un passo la strada fra
il punto di guardia e l'angolo — e la vista si misura a cammino. E
l'occhio: nella grotta comparivano rettangoli di pavimento chiaro in
mezzo alla roccia, come se qualcuno avesse aperto un buco per metterci
dentro una stalagmite.

Il verso giusto era l'altro. **Il muro c'è già**: il suo ingombro è
vero senza che nessuno lo dichiari, e la faccia che dà sul pavimento è
esattamente dove una cosa appoggiata alla parete si vedrebbe. Ci si
mette il disegno sopra e non si tocca niente — la mappa resta quella
che il livello ha scritto, cella per cella, e non c'è nessuna distanza
da ricontrollare perché non si è spostato un sasso.

Quello che sta sul pavimento è allora, per forza, roba che si calpesta:
una pozzanghera, un mucchio d'ossa, un fungo. E un mobile che **occupa**
lo scrive il livello in legenda con `arredo.*`: è una decisione, si vede
nella mappa, e il banco la gioca.

### La cella che deve restare libera

Quando serve uno spazio vuoto per forza — una piazzola, il punto dove
qualcuno si ferma — il livello lo dice, e nessuno ci mette niente. È la
valvola di sfogo: se le regole strutturali non bastano, il livello ha
sempre l'ultima parola.

---

## 4. In che ordine si fa

1. ~~**`arredo.*` in legenda**~~ — fatto.
2. ~~**La mappa piena**~~ — fatto: `motore/generale/stanze.js`. Ci è
   migrato dentro il riempimento dei buchi.
3. ~~**L'arredamento automatico**~~ — fatto: `motore/generale/arreda.js`,
   catalogo in `data/arredamento.js`, provato in
   `test/unita/stanze.test.mjs`.

### Cosa resta

- **I dettagli sul lastricato.** L'esclusione vive ancora dentro
  `libera()` in `grafica/mappa.js` e legge i suoli invece dei fatti
  della mappa piena: funziona, ma è la seconda copia di una domanda a
  cui adesso sa rispondere qualcun altro.
- **Il raccordo fra due murature diverse.** Dove la pietra del castello
  incontra il legno del fienile oggi c'è uno stacco netto.
- **I livelli vecchi in legenda.** Trenta livelli mettono i mobili in
  `scenografia`, su caselle di muro: si vedono giusti e ingombrano
  davvero, ma è una convenzione che va tenuta a mente invece di essere
  scritta. Riscriverli con `arredo.*` si fa un livello alla volta,
  quando lo si apre per altro.
