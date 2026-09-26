# Cosa generare, in che ordine, con che prompt

Il piano degli sprite **comune al castello e al sotterraneo**, scritto il
25 settembre 2026 guardando la battaglia finta
(`poc/scatti/castello-battaglia.png`, che si rifà con
`node strumenti/sprite/carte-castello.mjs`) e rifatto il 26 dopo aver
predisposto tutti i lettori. Si aggiorna ogni volta che un'immagine
arriva: una voce fatta si segna ✅ con il nome del file.

**Ogni immagine ha già il suo posto e il suo comando**: si salva col
nome scritto nella sua voce, si lancia quel comando, e il gioco la usa.
Nessun lettore va scritto quando arriva un'immagine — sono stati provati
tutti su un foglio finto fatto coi pezzi che ci sono già (le torri di
agosto messe a righe, il respiro messo a passi, lo schema del foglio del
terreno col bianco tolto), e il castello si è giocato così nel browser.

## La regola che rende possibile un foglio per due giochi

**Una cella è 16 pixel del disegno, in tutti e due i giochi.** Le scene
del castello (`td_1.png`…) sono dipinte con celle da 64 px, cioè
quattro pixel dello schermo per pixel del disegno; i fogli di creature
del sotterraneo (`mostri-1.png`, `mostri-2.png`) sono a scala 4 anche
loro; e la cella del sotterraneo è di 16 px. Quindi un mostro preso
**alla misura del suo foglio**, senza ridurlo né ingrandirlo, ha la
stessa grana della scena in tutti e due i giochi. Nella prima prova i
mostri erano ingranditi di due e mezzo e sembravano appiccicati; alla
misura del foglio sembrano del posto.

Per questo ogni prompt qui sotto dice le misure **in celle da 64 px**, e
la grana sempre allo stesso modo: «ogni pixel del disegno è un quadrato
di 4×4 px».

## Cosa NON serve generare

- **I mostri del castello.** Un mostro vale l'altro (parole
  dell'utente: «puoi usare un mostro per un altro, è abbastanza
  irrilevante»), e i due fogli del sotterraneo hanno 54 creature. Per il
  gioco un mostro è solo resistenza, volo e nome, quindi **la figura
  cambia da vestito a vestito** senza toccare l'equilibrio: quaranta
  creature per i tre vestiti, tutte ritagliate ✅ (il 26 settembre; le
  coordinate delle nuove stanno in `creature-castello.json`, quelle che
  il sotterraneo aveva già nei suoi foglietti). Chi fa chi lo dice
  `src/giochi/castello/scena/bestiario.js`, e questa tabella è la sua
  copia da leggere — com'è descritta la creatura nel foglio, perché è
  così che la cercano i prompt del cammino:

| castello | resiste a | bosco | lava | neve |
|---|---|---|---|---|
| slime | magica | la melma verde | il sasso di magma con le corna di fuoco | la melma rosa |
| goblin | arciere | lo scheletro con spada e scudo | il diavoletto rosso | la mummia |
| pipistrello | arciere · vola | il pipistrello viola | l'occhio volante rosso | il pipistrello con un occhio solo |
| fantasma | magica · vola | il fantasma verde acqua | lo spirito di fuoco | il fantasma azzurro |
| ragno | arciere | il ragno nero | il granchio rosso | il cinghiale |
| orco | arciere | lo zombie verde | la bestia cornuta | il golem di pietra col muschio |
| scheletro | bombe | lo scheletro | il negromante col cappuccio viola | il teschio con la fiamma azzurra |
| golem | magica | il golem di pietra bruna | il golem di lava | il golem di ghiaccio |
| arpia | bombe · vola | il grifone | il draghetto rosa con le ali | il tornado azzurro |
| drago | bombe · vola | il drago rosso con le ali | il drago rosso con le ali | il drago rosso con le ali |
| lupo | arciere | il lupo grigio | il drago di lava senza ali | il lupo grigio |
| corvo | arciere | il pipistrello con un occhio solo | il pipistrello viola | il pipistrello viola |
| rovo | bombe | la pianta carnivora | l'ombra viola con gli occhi gialli | l'uomo albero |
| verme | bombe | il serpente verde | la melma viola | il serpente verde |
| blatta | magica | lo scorpione viola | lo scorpione viola | lo spirito del fulmine giallo |
| troll | magica | l'omone grigio con la clava | il mostro viola con la bocca grande | l'omone grigio con la clava |
| corazziere | arciere | la tartaruga corazzata | la tartaruga corazzata | la tartaruga corazzata |
| balestriere | bombe | il diavoletto rosso | lo scheletro | lo scheletro con spada e scudo |

  Il nome che il castello dà al mostro resta quello del gioco (è la
  chiave della sua resistenza); cambia la figura, e **il nome che il
  bambino legge** sul nastro e sulla scheda è quello della figura
  («Grifone», «Golem di magma»: `NOMI` nel bestiario). Chi vola nel
  gioco prende una figura che vola, e `unita/castello-bestiario` lo
  pretende. Dove si poteva la resistenza si legge a occhio: il granchio
  col carapace regge le frecce, lo spirito di fuoco la magia, il
  tornado le bombe.

  **Il peso**: le quaranta creature col respiro sono 626 KB di WebP in
  `dati/figure.js` (864 KB col base64, 605 KB più di prima). È il
  motivo per cui il bagliore dietro le creature si toglie al ritaglio
  (alfa sotto 64) e le figure si comprimono a qualità 80.

- **I colpi, le barre della vita, il raggio delle torri**: li disegna il
  gioco, com'era deciso ad agosto.
- **Il castello e la bocca**: si prendono dalla scena (o dal foglio del
  terreno), e sono identici nei tre vestiti.

## Il lavoro senza gettoni

1. ✅ ritagliare le creature: fatto per tutte e quaranta, misurate con
   `misura.py` (bande sull'alfa su tutta la larghezza, poi le macchie).
   Il grifone e il drago all'alfa sopra 128 sono staccati dai vicini, e
   bastano i rettangoli. Provino: `python3 strumenti/sprite/vesti.py
   --creature provino.png`;
2. ✅ la radura grande sulla scacchiera, scritta a mano (`A_MANO` in
   `src/giochi/castello/motore/carta.js`): `DA_RIDISEGNARE` è vuoto;
3. ✅ i lettori delle immagini che arriveranno, qui sotto voce per voce.

## Le priorità

Ogni voce dice cosa sblocca, quante immagini costa, cosa allegare, **il
nome col quale salvare** e **il comando da lanciare dopo**. Il prompt
mandato si conserva nel foglietto (dove c'è) o si incolla nella voce qui,
**nel momento in cui si salva il PNG**.

### 1 — Il foglio del terreno del bosco · 1 immagine

**Sblocca** le carte vere: finisce il provvisorio (`vesti.py`, che
ritaglia dalla scena), arrivano i due stagni veri e il lago che entra
dal bordo, il fondo «con qualcosa in più», i pezzi alti del fitto.

**Prompt**: il prompt 2 della scheda del castello
([`sorgenti/castello/generati/PROMPT-scenario.md`](sorgenti/castello/generati/PROMPT-scenario.md)),
con in coda il blocco del bosco. **Allegati**: `td_1.png` e
`PROMPT-scenario-foglio.png`. Nella stessa chat di `td_1`, se c'è
ancora.

**Si salva come** `strumenti/sprite/sorgenti/castello/generati/terreno-bosco.png`.
Il foglietto c'è già, **scritto sullo schema** (`terreno-bosco.json`):
si guarda dove sono venuti i pezzi e si ritoccano `da` e `cella` di
quelli spostati — `misura` no, è la misura che il gioco si aspetta.

```bash
python3 strumenti/sprite/vesti.py --provino-foglio bosco /tmp/foglio.png   # i rettangoli sopra il foglio
python3 strumenti/sprite/vesti.py --atlante                                # e il gioco usa il foglio
node strumenti/sprite/carte-castello.mjs                                   # le carte vestite, da guardare
```

Se torna verticale si riscrivono le coordinate del foglietto, i nomi
restano. Se l'alone c'è, `"alone": 128` è già nel foglietto.

### 2 — Le torri, nella mano delle scene · 1 immagine

**Perché**: le torri della prova vengono da
`sorgenti/castello/non-usati/PVX1O.png`, che ha la **provenienza non
documentata** — va rifatto prima di pubblicare, come `terreni.png`. E
già che si rifà: gli stadi iniziali sono sproporzionati (il ghiaccio
appena costruito è un disco piatto, le bombe un cannoncino minuscolo
accanto a torri di due celle), la brina non ha una figura sua (nella
prova prende i cristalli viola di «Arcane») e gli stadi alti sbordano
sulla strada.

**Allegati**: `td_1.png` (la mano) e `PVX1O.png` (cosa è ogni torre).
Chat nuova.

**Si salva come** `strumenti/sprite/sorgenti/castello/generati/torri-1.png`.
Non ha foglietto: lo legge `righe.py` da sé, quattro righe da cinque
figure, e se i conti non tornano si ferma e lo dice.

```bash
python3 strumenti/sprite/righe.py strumenti/sprite/sorgenti/castello/generati/torri-1.png /tmp/torri.png
# deve dire «4 righe: 5 · 5 · 5 · 5 figure»; il provino mostra i riquadri
python3 strumenti/sprite/vesti.py --atlante
node strumenti/sprite/carte-castello.mjs
```

La torre salita senza aver preso un ramo (le tappe senza rami) prende
la figura del primo ramo.

```text
Disegna il foglio delle torri (uno sprite sheet) di questo gioco di difesa della torre, nella mano ESATTA della scena allegata: stesso contorno scuro, stessa luce da in alto a sinistra, stessa tavolozza, stessa grana — ogni pixel del disegno è un quadrato pieno di 4×4 px. La seconda immagine allegata è il VECCHIO foglio delle torri: dice cosa è ogni torre e come cresce, ma la mano da seguire è quella della scena, non quella.

Il foglio è ORIZZONTALE, 1536×1024 px, su FONDO TRASPARENTE (PNG), su una griglia invisibile di celle da 64×64 px. Ogni torre sta in piedi su una piazzola di una cella e si vede dall'alto a tre quarti, come il castello della scena: la base occupa la cella, il corpo sale sulla cella di sopra. Nessuna ombra sotto, nessun bagliore attorno, nessuna cornice, nessuna piazzola disegnata sotto. NESSUNA PAROLA SCRITTA, NESSUN NUMERO, NESSUNA ETICHETTA.

Quattro righe, una per torre, e in ogni riga cinque figure da sinistra a destra: la torre appena costruita; poi il primo ramo, cresciuto e al massimo; poi il secondo ramo, cresciuto e al massimo. Fra una figura e l'altra, e fra una riga e l'altra, almeno mezza cella di trasparente: le figure non si toccano mai. Le cinque figure di una riga hanno la base sulla stessa linea. Tutto quello che fa parte di una torre — la fiamma, i fulmini, il cristallo che galleggia, il fumo — sta attaccato alla torre o a meno di un quarto di cella da lei, mai sospeso lontano. Le misure: appena costruita larga una cella e alta una e mezza; cresciuta larga una cella e alta due; al massimo alta due e mezza e MAI PIÙ LARGA DI UNA CELLA E MEZZA, perché accanto passa la strada.

1. L'ARCIERE, che tira frecce veloci su un nemico solo. Appena costruita: una torretta di legno con un arciere in cima. Primo ramo, IL CECCHINO, che vede lontanissimo e tira un colpo forte e lento: una torre alta e stretta con un tiratore che mira col cannocchiale. Secondo ramo, LA RAFFICA, due frecce per volta su due nemici: una balestra doppia montata su un perno che gira.
2. LA MAGICA, un'onda magica che colpisce a zona. Appena costruita: una torretta di pietra con un cristallo viola che galleggia sopra. Primo ramo, IL VELENO, il male che continua da solo: un calderone verde che ribolle e fuma. Secondo ramo, LA CATENA, il colpo che rimbalza di nemico in nemico: una bobina di rame con i fulmini azzurri in cima.
3. IL GHIACCIO, che non fa male ma congela i nemici vicini. Appena costruita: una piccola torre di ghiaccio azzurro, in piedi, non un disco piatto. Primo ramo, LA BUFERA, che gela molto largo: la torre di ghiaccio con un vortice di neve che le gira attorno. Secondo ramo, LA BRINA, che gela di più e rende fragili i nemici: una torre di cristalli di ghiaccio appuntiti, bianchi e azzurri.
4. LE BOMBE, un colpo lento e devastante. Appena costruita: un cannone di ferro su un affusto di legno, grande quanto le altre torri appena costruite. Primo ramo, IL MORTAIO, che arriva lontanissimo: un mortaio grosso e tozzo che punta al cielo. Secondo ramo, IL NAPALM, che scoppia largo e lascia bruciare: un cannone con la bocca a forma di testa di drago e una fiamma che tremola.

Ogni torre si riconosce da lontano anche piccola, con una sagoma e un colore suoi — l'arciere legno e verde, la magica pietra e viola, il ghiaccio azzurro e bianco, le bombe ferro e arancio — e crescendo si capisce che è la stessa torre diventata più forte.
```

**Come si guarda**: le cinque di una riga sono la stessa torre; le
cinque appena costruite hanno la stessa stazza; niente è più largo di
una cella e mezza; niente scritte; `righe.py` conta 4 × 5.

### 3 — La lava più calma · 1 immagine, una riga

**Perché**: nella prova la lava è l'unico vestito dove le figure non si
staccano — crepe e fiammelle dappertutto, e il fitto è un incendio. Il
prompt 1 lo vietava («il terreno è il fondo: colori più spenti») e
`td_3.png` non l'ha seguito. In più ha dei cristalli rossi sparsi che
sembrano gemme da raccogliere.

Nella chat dove è uscita `td_3.png`:

```text
Rifai la stessa scena con la lava, ma il terreno è il fondo: roccia scura, calma e uniforme, con poche crepe e nessuna fiammella sparsa; la lava resta solo nei laghi e ai bordi del campo, e il bosco dei bordi sono rupi scure, non fiamme. Niente cristalli. Non cambiare nient'altro: strada, piazzole, bocche e castello restano identici, nello stesso posto.
```

**Si salva come** `strumenti/sprite/sorgenti/castello/generati/td_4.png`
(`td_3.png` resta: una sorgente non si butta), e in `vesti.py` la riga
`SCENE` dice `'lava': 'td_4.png'`. Poi `python3 strumenti/sprite/vesti.py
--atlante` e `node strumenti/sprite/carte-castello.mjs`. Prima di tenerla
si controlla che la geometria sia rimasta quella (i bordi della strada
sulla riga 200 a ±2 pixel del disegno da `td_1`, com'è scritto nella
scheda): i ritagli si misurano tutti su `td_1`.

### 4 — I fogli del terreno della neve e della lava · 2 immagini, una riga l'una

**Sblocca** gli altri due vestiti col foglio vero. Si fanno dopo l'1 e
il 3, nella chat dove è uscito il foglio del bosco, allegando la scena
di quel vestito (`td_2.png` per la neve, `td_4.png` per la lava):

```text
Rifai lo stesso foglio, pezzo per pezzo e ogni pezzo nella stessa posizione e della stessa misura, vestito come la scena allegata. Non spostare niente: cambia solo il vestito.
```

**Si salvano come** `terreno-neve.png` e `terreno-lava.png`, accanto a
`terreno-bosco.png`. Se il foglio resta fermo com'è successo alle scene
(entro due pixel del disegno) non serve altro: **un vestito senza il
suo foglietto usa quello del bosco**. Se si è mosso, si copia
`terreno-bosco.json` in `terreno-neve.json` e si ritocca. Poi, per tutti
e due:

```bash
python3 strumenti/sprite/vesti.py --provino-foglio neve /tmp/neve.png
python3 strumenti/sprite/vesti.py --atlante
node strumenti/sprite/carte-castello.mjs
```

### 5 — I mostri che camminano · 3 immagini per il bosco, 4 per lava e neve

**Arricchisce tutti e due**: oggi le creature generate hanno una posa
sola, il respiro di lato. Nel castello i mostri scendono quasi sempre
verso il basso e servono **di fronte**; nel sotterraneo camminano e
oggi scivolano. Nello stesso giro si sostituiscono i quattro mostri che
il sotterraneo prende ancora da 0x72 (goblin, scheletro, orco, gigante),
e i due giochi hanno una mano sola.

Il castello è già pronto a usarli: i pittori mettono i passi **di
lato** quando il mostro va a destra o a sinistra (specchiati verso
sinistra) e **di fronte** quando scende, e il respiro resta solo per chi
un foglio del cammino non ce l'ha ancora — quindi i fogli si possono
fare uno alla volta, e ognuno si vede subito.

Sette fogli, sempre con lo stesso prompt; cambia solo l'elenco in coda.
**Allegati**: `mostri-1.png` e `mostri-2.png` (sono loro che si
ridisegnano). Chat nuova, e i fogli dopo il primo nella stessa chat.

```text
Disegna un foglio di mostri che camminano (uno sprite sheet): sono le STESSE creature dei due fogli allegati — stessa figura, stessi colori, stesso contorno, stessa grana (ogni pixel del disegno è un quadrato pieno di 4×4 px) e stessa misura che hanno lì — adesso in cammino.

Il foglio è ORIZZONTALE, 1536×1024 px, su FONDO TRASPARENTE (PNG). Nessuna ombra sotto, nessun bagliore colorato attorno, nessuno sfondo colorato dietro le righe, nessuna cornice. NESSUNA PAROLA SCRITTA, NESSUN NUMERO.

Una riga per mostro, nell'ordine dell'elenco qui sotto, e le righe staccate l'una dall'altra da almeno mezza cella di trasparente (una cella è 64 px). In ogni riga ESATTAMENTE OTTO figure, da sinistra: quattro passi del mostro visto DI LATO che cammina verso destra; poi quattro passi dello stesso mostro visto DI FRONTE, che cammina verso chi guarda. Fra un passo e l'altro almeno mezza cella di trasparente: i passi non si toccano e non si sovrappongono. I passi di una riga sono tutti della stessa altezza e con i piedi sulla stessa linea; chi vola sbatte le ali restando alla stessa altezza. Niente pose di morte, niente attacchi, niente fiamme, scintille o colpi che escono dal mostro: tutto quello che è del mostro gli sta attaccato.

Le righe:
```

…e in coda l'elenco di quel foglio, una riga per mostro, **scritto com'è
la creatura nel foglio allegato** (il generatore la deve trovare):

| foglio | le righe, dall'alto |
|---|---|
| A | la melma verde · lo scheletro con spada e scudo · il pipistrello viola · il fantasma verde acqua del secondo foglio · il ragno nero · il lupo grigio |
| B | il golem di pietra bruna · l'omone grigio con la clava · lo scheletro senza armi · il drago rosso con le ali · il grifone · la pianta carnivora verde del primo foglio |
| C | il serpente verde · lo scorpione viola · la tartaruga corazzata con le spine · il diavoletto rosso · lo zombie verde del primo foglio · il pipistrello viola con un occhio solo |
| D | il sasso di magma con le corna di fuoco · l'occhio volante rosso del primo foglio · lo spirito di fuoco · il granchio rosso · la bestia cornuta viola e arancio · il negromante col cappuccio viola |
| E | il golem di lava rosso · il draghetto rosa con le ali · il drago di lava senza ali · l'ombra viola con gli occhi gialli · la melma viola · il mostro viola con la bocca grande |
| F | la melma rosa · la mummia · il fantasma azzurro del primo foglio · il cinghiale · il golem di pietra col muschio del secondo foglio · il teschio con la fiamma azzurra |
| G | il golem di ghiaccio del primo foglio · il tornado azzurro · l'uomo albero · lo spirito del fulmine giallo |

A, B, C sono il bosco; D ed E la lava; F e G la neve. L'ordine delle
righe è quello di `CAMMINO` in `vesti.py`: **se il generatore ne
scambia due, si scambiano lì**, non si rifà il foglio.

**Si salvano come**
`strumenti/sprite/sorgenti/sotterraneo/generati/mostri-cammino-A.png`
(e `-B`, `-C`…), accanto ai fogli che ridisegnano. Poi:

```bash
python3 strumenti/sprite/righe.py strumenti/sprite/sorgenti/sotterraneo/generati/mostri-cammino-A.png /tmp/a.png
# deve dire «6 righe: 8 · 8 · 8 · 8 · 8 · 8 figure» (G: 4 righe)
python3 strumenti/sprite/vesti.py --atlante
python3 strumenti/sprite/vesti.py --creature /tmp/creature.png            # tutte, coi passi
```

⚠ **Il peso**: otto passi al posto di quattro respiri raddoppiano quasi
i mostri in `dati/figure.js`. I tre fogli del bosco da soli portano il
file da 0,86 a circa 1,2 MB; tutti e sette a circa 1,6 MB. Se è troppo,
si fanno solo A, B e C — lava e neve restano col respiro, e i pittori lo
sanno fare — oppure si chiedono tre passi per verso invece di quattro.

### 6 — (facoltativo) Gli eroi del sotterraneo · 1 immagine

L'ultimo pezzo di 0x72 dopo il 5: cavaliere, elfa, mago e nano, fermi e
in corsa, nella stessa mano. Resta da decidere se vale la pena (vedi la
memoria sugli scenari del sotterraneo).

## In fila

| # | cosa | immagini | allegati | si salva come | sblocca |
|---|---|---|---|---|---|
| 1 | foglio del terreno, bosco | 1 | `td_1`, schema del foglio | `castello/generati/terreno-bosco.png` | le carte vere |
| 2 | le torri | 1 | `td_1`, `PVX1O` | `castello/generati/torri-1.png` | le torri pubblicabili |
| 3 | la lava più calma | 1 | (chat di `td_3`) | `castello/generati/td_4.png` | un vestito che si legge |
| 4 | fogli del terreno, neve e lava | 2 | la scena del vestito | `terreno-neve.png`, `terreno-lava.png` | gli altri due vestiti |
| 5 | i mostri che camminano | 3 + 4 | `mostri-1`, `mostri-2` | `sotterraneo/generati/mostri-cammino-A.png`… | mostri di fronte, e il sotterraneo tutto in una mano |
| 6 | gli eroi | 1 | `mostri-1`, una scena | — | l'addio a 0x72 |

Il **minimo per rifare il gioco** sono l'1 e il 2: col bosco, le torri
nuove e i mostri che ci sono già il castello si gioca e si pubblica. Il
resto lo fa più bello, non lo fa funzionare. Dopo ognuno,
`node test/esegui.mjs castello-sprite --scatti` e un'occhiata agli
scatti.

## Le trappole già note

Valgono quelle delle schede della fattoria, del sotterraneo e del
castello, riassunte:

- i fogli tornano **verticali** anche chiesti orizzontali: si ritagliano
  lo stesso, con una `misura` per pezzo (il terreno) o da sé (torri e
  cammino, che `righe.py` legge per righe e non per coordinate);
- il **fondo trasparente** torna con un alone: `"alone": 128` nel
  foglietto del terreno, e `righe.py` lo toglie da sé. I fogli di
  creature del sotterraneo sono tornati **con un bagliore colorato
  dietro ogni riga**: il prompt 5 lo vieta apposta, e al ritaglio si
  toglie comunque (`BAGLIORE` in `vesti.py`);
- **due figure che si toccano** diventano una sola per `righe.py`, e i
  conti non tornano: per questo i prompt 2 e 5 chiedono mezza cella di
  vuoto fra una figura e l'altra, e le fiamme attaccate a chi le fa;
- le **scritte**: vietate in maiuscolo in tutti i prompt;
- il **prompt si conserva nel foglietto** del foglio che ne esce, così
  come è stato mandato; torri e cammino un foglietto non ce l'hanno, e
  il prompt resta in questa pagina, nella voce, con la data.
