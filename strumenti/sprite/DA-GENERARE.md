# Cosa generare, in che ordine, con che prompt

Il piano degli sprite **comune al castello e al sotterraneo**, scritto il
25 settembre 2026 guardando la battaglia finta
(`poc/scatti/castello-battaglia.png`, che si rifà con
`node strumenti/sprite/carte-castello.mjs`). Si aggiorna ogni volta che
un'immagine arriva: una voce fatta si segna ✅ con il nome del file.

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
  irrilevante»), e i due fogli del sotterraneo hanno 54 creature, di cui
  ne sono ritagliate 11. I diciotto del castello ci stanno tutti:

  | castello | resiste a | creatura nei fogli | foglio | ritagliata |
  |---|---|---|---|---|
  | slime | magica | la melma verde | mostri-1 | ✅ `melma` |
  | goblin | arciere | lo scheletro con spada e scudo | mostri-2 | da ritagliare |
  | pipistrello | arciere | il pipistrello | mostri-1 | ✅ `pipistrello` |
  | fantasma | magica | il fantasma | mostri-2 | ✅ `fantasma` |
  | ragno | arciere | il ragno nero | mostri-1 | da ritagliare |
  | orco | arciere | lo zombie verde | mostri-1 | da ritagliare |
  | scheletro | bombe | lo scheletro | mostri-1 | da ritagliare |
  | golem | magica | il golem di pietra bruna | mostri-1 | ✅ `golem` |
  | arpia | bombe | il grifone | mostri-1 | da ritagliare (le figure si toccano) |
  | drago | bombe | il drago rosso con le ali | mostri-1 | da ritagliare (le figure si toccano) |
  | lupo | arciere | il lupo | mostri-1 | ✅ `lupo` |
  | corvo | arciere | il pipistrello con l'occhio | mostri-2 | da ritagliare |
  | rovo | bombe | la pianta carnivora | mostri-1 | da ritagliare |
  | verme | bombe | il serpente | mostri-2 | ✅ `serpente` |
  | blatta | magica | lo scorpione | mostri-2 | da ritagliare |
  | troll | magica | l'omone grigio con la clava | mostri-1 | ✅ `troll` |
  | corazziere | arciere | la tartaruga corazzata | mostri-2 | da ritagliare |
  | balestriere | bombe | il diavoletto | mostri-1 | da ritagliare |

  Il nome che il castello dà al mostro resta quello del gioco (è la
  chiave della sua resistenza); cambia solo la figura. Quando si rifà il
  gioco conviene rinominare i mostri come le figure, così il nastro
  «arriva il grifone» dice quello che si vede.

- **I colpi, le barre della vita, il raggio delle torri**: li disegna il
  gioco, com'era deciso ad agosto.
- **Il castello e la bocca**: si prendono dalla scena, e sono identici
  nei tre vestiti.

## Il lavoro senza gettoni

Da fare in sessione, senza generare niente:

1. ritagliare le undici creature «da ritagliare» qui sopra: una riga di
   foglietto ciascuna, misurata con `strumenti/sprite/misura.py`; il
   grifone e il drago vanno segmentati a mano perché si toccano;
2. ridisegnare a mano sulla scacchiera la radura grande
   (`DA_RIDISEGNARE` in `src/giochi/castello/motore/carta.js`);
3. quando c'è il foglio del terreno: il suo foglietto, e rifare il gioco
   sulle carte (vedi «Come si monta nel gioco» nella scheda del castello).

## Le priorità

Ogni voce dice cosa sblocca, quante immagini costa, e cosa allegare.

### 1 — Il foglio del terreno del bosco · 1 immagine

**Sblocca** le carte vere: finisce il provvisorio (`vesti.py`, che
ritaglia dalla scena), arrivano i tre specchi d'acqua veri e il lago che
entra dal bordo, i pezzi alti del fitto, i decori grandi.

**Prompt**: il prompt 2 della scheda del castello
([`sorgenti/castello/generati/PROMPT-scenario.md`](sorgenti/castello/generati/PROMPT-scenario.md)),
con in coda il blocco del bosco. **Allegati**: `td_1.png` e
`PROMPT-scenario-foglio.png`. Nella stessa chat di `td_1`, se c'è
ancora.

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

```text
Disegna il foglio delle torri (uno sprite sheet) di questo gioco di difesa della torre, nella mano ESATTA della scena allegata: stesso contorno scuro, stessa luce da in alto a sinistra, stessa tavolozza, stessa grana — ogni pixel del disegno è un quadrato pieno di 4×4 px. La seconda immagine allegata è il VECCHIO foglio delle torri: dice cosa è ogni torre e come cresce, ma la mano da seguire è quella della scena, non quella.

Il foglio è ORIZZONTALE, 1536×1024 px, su FONDO TRASPARENTE (PNG), su una griglia invisibile di celle da 64×64 px. Ogni torre sta in piedi su una piazzola di una cella e si vede dall'alto a tre quarti, come il castello della scena: la base occupa la cella, il corpo sale sulla cella di sopra. Ogni figura è staccata dalle altre da almeno mezza cella di trasparente. Nessuna ombra sotto, nessun bagliore attorno, nessuna cornice, nessuna piazzola disegnata sotto. NESSUNA PAROLA SCRITTA, NESSUN NUMERO, NESSUNA ETICHETTA.

Quattro righe, una per torre, e in ogni riga cinque figure da sinistra a destra: la torre appena costruita; poi il primo ramo, cresciuto e al massimo; poi il secondo ramo, cresciuto e al massimo. Le misure: appena costruita larga una cella e alta una e mezza; cresciuta larga una cella e alta due; al massimo alta due e mezza e MAI PIÙ LARGA DI UNA CELLA E MEZZA, perché accanto passa la strada.

1. L'ARCIERE, che tira frecce veloci su un nemico solo. Appena costruita: una torretta di legno con un arciere in cima. Primo ramo, IL CECCHINO, che vede lontanissimo e tira un colpo forte e lento: una torre alta e stretta con un tiratore che mira col cannocchiale. Secondo ramo, LA RAFFICA, due frecce per volta su due nemici: una balestra doppia montata su un perno che gira.
2. LA MAGICA, un'onda magica che colpisce a zona. Appena costruita: una torretta di pietra con un cristallo viola che galleggia sopra. Primo ramo, IL VELENO, il male che continua da solo: un calderone verde che ribolle e fuma. Secondo ramo, LA CATENA, il colpo che rimbalza di nemico in nemico: una bobina di rame con i fulmini azzurri in cima.
3. IL GHIACCIO, che non fa male ma congela i nemici vicini. Appena costruita: una piccola torre di ghiaccio azzurro, in piedi, non un disco piatto. Primo ramo, LA BUFERA, che gela molto largo: la torre di ghiaccio con un vortice di neve che le gira attorno. Secondo ramo, LA BRINA, che gela di più e rende fragili i nemici: una torre di cristalli di ghiaccio appuntiti, bianchi e azzurri.
4. LE BOMBE, un colpo lento e devastante. Appena costruita: un cannone di ferro su un affusto di legno, grande quanto le altre torri appena costruite. Primo ramo, IL MORTAIO, che arriva lontanissimo: un mortaio grosso e tozzo che punta al cielo. Secondo ramo, IL NAPALM, che scoppia largo e lascia bruciare: un cannone con la bocca a forma di testa di drago e una fiamma che tremola.

Ogni torre si riconosce da lontano anche piccola, con una sagoma e un colore suoi — l'arciere legno e verde, la magica pietra e viola, il ghiaccio azzurro e bianco, le bombe ferro e arancio — e crescendo si capisce che è la stessa torre diventata più forte.
```

**Come si guarda**: le cinque di una riga sono la stessa torre; le
cinque appena costruite hanno la stessa stazza; niente è più largo di
una cella e mezza; niente scritte. Poi si mette nella prova: si cambia
`FOGLIO_TORRI` in `prova-battaglia.py`.

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

### 4 — I fogli del terreno della neve e della lava · 2 immagini, una riga l'una

**Sblocca** gli altri due vestiti col foglio vero. Si fanno dopo il 1 e
il 3, nella chat dove è uscito il foglio del bosco, allegando la scena
di quel vestito:

```text
Rifai lo stesso foglio, pezzo per pezzo e ogni pezzo nella stessa posizione e della stessa misura, vestito come la scena allegata. Non spostare niente: cambia solo il vestito.
```

Se il foglio resta fermo com'è successo alle scene (entro due pixel del
disegno), il foglietto del bosco vale anche per questi due.

### 5 — I mostri che camminano, per tutti e due i giochi · 3 immagini

**Arricchisce tutti e due**: oggi le creature generate hanno una posa
sola, il respiro di lato (`unaPosa` nel sotterraneo). Nel castello i
mostri scendono quasi sempre verso il basso e servono **di fronte**; nel
sotterraneo camminano e oggi scivolano. Nello stesso giro si
sostituiscono i quattro mostri che il sotterraneo prende ancora da
0x72 (goblin, scheletro, orco, gigante), e i due giochi hanno una mano
sola.

Tre fogli da sei, sempre con lo stesso prompt; cambia solo l'elenco.
**Allegati**: `mostri-1.png` e `mostri-2.png` (sono loro che si
ridisegnano).

```text
Disegna un foglio di mostri che camminano (uno sprite sheet): sono le STESSE creature dei due fogli allegati — stessa figura, stessi colori, stesso contorno, stessa grana (ogni pixel del disegno è un quadrato pieno di 4×4 px) e stessa misura che hanno lì — adesso in cammino.

Il foglio è ORIZZONTALE, 1536×1024 px, su FONDO TRASPARENTE (PNG). Nessuna ombra sotto, nessun bagliore colorato attorno, nessuno sfondo colorato dietro le righe, nessuna cornice. NESSUNA PAROLA SCRITTA, NESSUN NUMERO.

Sei righe, una per mostro, staccate l'una dall'altra da almeno mezza cella di trasparente (una cella è 64 px). In ogni riga, da sinistra: quattro passi del mostro visto DI LATO che cammina verso destra; poi quattro passi dello stesso mostro visto DI FRONTE, che cammina verso chi guarda. I passi di una riga sono tutti della stessa altezza e con i piedi sulla stessa linea; chi vola sbatte le ali restando alla stessa altezza. Niente pose di morte, niente attacchi, niente fiamme o colpi che escono dal mostro.

Le sei righe:
```

…e in coda l'elenco di quel foglio, una riga per mostro:

| foglio | le sei righe |
|---|---|
| A | la melma verde · lo scheletro con spada e scudo · il pipistrello · il fantasma azzurro · il ragno nero · il lupo |
| B | il golem di pietra bruna · l'omone grigio con la clava · lo scheletro · il drago rosso con le ali · il grifone · la pianta carnivora |
| C | il serpente · lo scorpione viola · la tartaruga corazzata · il diavoletto rosso · lo zombie verde · il pipistrello con l'occhio |

L'elenco va scritto **com'è la creatura nel foglio allegato**, non col
nome che le dà il gioco: il generatore la deve trovare.

### 6 — (facoltativo) Gli eroi del sotterraneo · 1 immagine

L'ultimo pezzo di 0x72 dopo il 5: cavaliere, elfa, mago e nano, fermi e
in corsa, nella stessa mano. Resta da decidere se vale la pena (vedi la
memoria sugli scenari del sotterraneo).

## In fila

| # | cosa | immagini | allegati | sblocca |
|---|---|---|---|---|
| 1 | foglio del terreno, bosco | 1 | `td_1`, schema del foglio | le carte vere |
| 2 | le torri | 1 | `td_1`, `PVX1O` | le torri pubblicabili |
| 3 | la lava più calma | 1 | (chat di `td_3`) | un vestito che si legge |
| 4 | fogli del terreno, neve e lava | 2 | la scena del vestito | gli altri due vestiti |
| 5 | i mostri che camminano | 3 | `mostri-1`, `mostri-2` | mostri di fronte, e il sotterraneo tutto in una mano |
| 6 | gli eroi | 1 | `mostri-1`, una scena | l'addio a 0x72 |

Il **minimo per rifare il gioco** sono l'1 e il 2: col bosco, le torri
nuove e i mostri che ci sono già (ritagliati alla sessione dopo) il
castello si gioca. Il resto lo fa più bello, non lo fa funzionare.

## Le trappole già note

Valgono quelle delle schede della fattoria, del sotterraneo e del
castello, riassunte:

- i fogli tornano **verticali** anche chiesti orizzontali: si ritagliano
  lo stesso, con una `misura` per pezzo;
- il **fondo trasparente** torna con un alone: `"alone": 128` nel
  foglietto. I fogli di creature del sotterraneo sono tornati **con un
  bagliore colorato dietro ogni riga**: il prompt 5 lo vieta apposta;
- le **scritte**: vietate in maiuscolo in tutti i prompt;
- il **prompt si conserva nel foglietto** del foglio che ne esce, così
  come è stato mandato.
