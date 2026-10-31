# Le creature: un catalogo solo

Una creatura dipinta (una melma, un golem, un drago) sta **in un posto solo**:
`strumenti/sprite/sorgenti/creature/`. Decisione dell'utente, 12 ottobre 2026
(«dovremmo centralizzare le creature»): prima le stesse creature stavano in tre
posti (i foglietti del sotterraneo, una tabella del castello, i passi del
castello) e ogni gioco le ritagliava a modo suo.

```
strumenti/sprite/sorgenti/creature/
  mostri-1.png, mostri-2.png   i due fogli dipinti, 1536×1024, l'alfa già dentro
  creature.json                il catalogo: una voce per creatura
  passi/<chiave>.png + .json   i passi dai video (chi cammina)
  atlante.json                 dice ad atlante.py che questa cartella non è un bersaglio
strumenti/sprite/creature.py   la libreria che lo legge, e gli strumenti
```

I due giochi che le disegnano le prendono dal catalogo con la **stessa funzione**
(`creature.py`): `atlante.py` per il sotterraneo, `vesti.py --atlante` per il
castello. Il catalogo descritto, per sapere cosa c'è:
[creature-catalogo-1.md](creature-catalogo-1.md),
[creature-catalogo-2.md](creature-catalogo-2.md) (generati dal JSON).

## Una voce del catalogo

```json
"drago-lava": { "foglio": "mostri-1", "fotogrammi": [[540,736,115,104], …],
  "giochi": ["sotterraneo", "castello"], "scelta": {"sotterraneo": [0, 1]},
  "alias": {"sotterraneo": "scheletro-dipinto"}, "tenuta": true, "perche": "…",
  "scheda": { "che", "elemento", "combatte", "resiste", "teme", "dove", "ruolo" } }
```

- **`fotogrammi`**: i rettangoli del respiro, `[x, y, largo, alto]` in pixel del
  **foglio grande**, una copia sola. L'altezza è comune ai fotogrammi (i piedi
  restano fermi per terra; a schermo un pezzo si appoggia col fondo della sua
  cella), la larghezza è quella della sagoma (un rettangolo
  comune prenderebbe il vicino: misurato) e ci sono tre pixel di margine per le
  sfumature. **I fotogrammi di morte non ci sono**: nessun gioco disegna un
  mostro morto, lo toglie. Sono tenute solo le pose di **respiro coerenti**
  (stessa figura, stessa misura, stesso verso, niente pezzi mancanti, niente
  attacco travestito da respiro).
- **`giochi`**: chi la disegna, `sotterraneo` e/o `castello`. **Ogni gioco porta
  solo quelle che nomina** (la regola «generare solo il referenziato»: il file
  unico non si porta creature che nessuno disegna). Il castello prende quelle
  col `castello` e `unita/castello-bestiario` pretende che siano esattamente
  quelle del suo bestiario; il sotterraneo quelle col `sotterraneo`, e
  `unita/creature` guarda che ogni sprite dei suoi mostri (`dati/mostri.js`)
  ci sia **e che ogni creatura col `sotterraneo` sia disegnata da una specie o
  da un grosso** (`figura` in `dati/grossi.js`): quella che alla fine nessuno
  usa si toglie dal suo `giochi` (il troll, ora solo del castello: nel
  sotterraneo conta solo come base delle statistiche di due grossi).
- **`scelta`**: i fotogrammi (indici) che un gioco prende, se non tutti: il
  sotterraneo lascia fuori, per esempio, la fiammata della bestia cornuta. Il
  castello non sceglie: i suoi sono quelli del catalogo, com'erano.
- **`alias`**: come si chiama nell'atlante di un gioco, se la chiave è già
  presa (lo scheletro dipinto è `scheletro-dipinto` nel sotterraneo, che ha già
  lo `scheletro` di 0x72). `atlante.py` si ferma se due pezzi hanno lo stesso
  nome.
- **`nitido`**: i fotogrammi hanno anche la copia dal foglio com'è dipinto (WebP in `NITIDO`: [sprite.md](sprite.md#i-pezzi-nitidi)). Oggi nessuna creatura lo chiede: nei pannelli del sotterraneo un mostro è la foto del suo modello.
  Serve a chi ha un sorgente piccolo e pallido: lo scheletro è 45×73 px nel foglio, ridotto alla griglia a 12×19 diventava una macchia grigia
  (l'utente, 13 ottobre: «sfocati»). Oggi scheletro, scheletro cavaliere, mummia, **tutte quelle alte fino a 23 pixel nell'atlante** (zombie, diavoletto,
  fantasma, fantasma azzurro, teschio azzurro, granchio, pipistrello, ratto, serpente, fungo, occhio, pianta, cinghiale, mietitore, le melme viola e rosa,
  il mostro viola) e il ghoul (19 in più delle prime tre), circa 450 KB di WebP (le altre, da 24 pixel in su, restano come sono: tutte nitide sarebbero state quasi un megabyte). Non con i passi (i video non hanno
  il pezzo grande: camminando la creatura cambierebbe faccia; `creature.py controlla`).
- **`morte`**: una o due figure (rettangoli come `fotogrammi`) di come cade, prese dal foglio: i fogli dipingono dopo ogni creatura la sua morte (colpita,
  a terra, i resti), e `creature.py morti` le elenca (provino `tmp/creature/morti.png`, `--scrivi nome=0,1` sceglie quali). Il rettangolo arriva ai piedi
  della creatura, così il pezzo posa dove posava lei. Il sotterraneo le porta come `<nome>-morto-<i>` (nitide se la creatura lo è) e lo scontro le
  mostra ([../sotterraneo/scontro-interfaccia.md](../sotterraneo/scontro-interfaccia.md)); il castello no. Mancano al pipistrello occhio (il foglio non gliela
  dipinge).
- **`tenuta`** (e `perche`): il giudizio sulle pose. Una scartata ha il perché
  scritto e nessun gioco: resta nel catalogo per sapere cosa chiedere di nuovo.
- **`scheda`**: il catalogo descritto: com'è fatta, **elemento** (uno di
  `dati/elementi.js`: di che pasta è, non cosa teme), come combatterebbe,
  `resiste`/`teme`, dove sta bene, il ruolo (comune, caporale, grosso, variante).
  Le chiavi sono quelle del castello (`golem-lava`, `fantasma-azzurro`…).
- **I passi** non sono nella voce: una creatura cammina se esiste
  `passi/<chiave>.png`. Sette: drago, golem-lava, lupo, melma, ragno, scorpione,
  troll. Il perché dei video e come si fanno: `strumenti/sprite/DA-GENERARE.md`
  (voce 5) e `cammino.py`. Nel sotterraneo **chi ha i passi cammina davvero**
  nel campo (`<nome>-corsa-N`, di lato) e nello scontro sta sulla posa di lato
  ferma, specchiata verso l'eroe (`viste/campo.js`); chi non li ha respira. Il
  drago ha il respiro rotto (un fotogramma con due draghi e la fiammata): da
  fermo usa i passi, lenti (`fermoDaiPassi` in `dati/mostri.js`). Quanti
  fotogrammi ha una posa lo dice l'atlante (`dati/fotogrammi.js`: due, tre o
  quattro di respiro, sei di passi), non un `% 4`.

## Come le prende un gioco

- **Il castello** (`vesti.py --atlante`): ritaglia dal foglio grande, tolto il
  bagliore sotto l'alfa 64, e per chi ha i passi li porta alla misura del
  respiro con un contorno di 2 px (`creature.passi_alla_misura`). Le figure
  escono **uguali al byte** a prima della centralizzazione (`figure.js` è
  cambiato solo nell'intestazione).
- **Il sotterraneo** (`atlante.py`, il suo `atlante.json` dichiara
  `"creature": {"gioco": "sotterraneo", "contorno": 1}`): riduce il foglio alla
  griglia di scala 4 (BOX, come ogni altro foglio) e ritaglia i rettangoli
  riportati alla griglia arrotondando in fuori (`creature.in_griglia`: quelli
  che erano già multipli di 4, le undici di prima, restano esatti, e infatti
  sono identiche pixel per pixel). I pezzi si chiamano `<nome>-fermo-<n>`;
  per chi ha i passi anche `<nome>-corsa-<n>` (di lato, verso destra) e
  `<nome>-fronte-<n>`, sei ciascuno, alla misura del respiro e con **un pixel**
  di contorno (due, a quella grana, sarebbero un filo spesso quanto il dettaglio).
  Non c'è un foglietto `mostri-*.json`: quelle righe ora sono il catalogo.
- **Peso** (sotterraneo): l'atlante passa da 364 KB a 630 KB (611 KB senza il troll, che nel sotterraneo non si disegna più) di PNG con tutte le
  creature col `sotterraneo` (47 creature dopo il troll, 207 pezzi in più delle undici di prima:
  123 fotogrammi di respiro e 84 passi; circa un terzo in più in base64 nel file unico). Una creatura che il gioco alla fine non
  nomina si toglie dal suo `giochi` e il peso se ne va.
- **Il banco `npm run mondo`**: i due fogli non hanno più un foglietto, quindi non compaiono più in «i ritagli»;
  le creature si guardano in «il mondo» (l'atlante) e si misurano con `creature.py`.
- **Creature che il sotterraneo non prende**: il tornado (una creatura d'aria
  aperta, solo castello); l'occhio dentato (un doppione dell'occhio) è stato tolto dal catalogo.

## Aggiungere o ritoccare una creatura

1. **Dov'è nel foglio**: `creature.py vedi mostri-1 --regione=x0,y0,x1,y1`
   (il foglio con la riga dei numeri e i rettangoli già nel catalogo) e
   `creature.py riga mostri-1 --y=640,760` (le figure staccate in una fascia).
2. **Misurare**: `creature.py misura mostri-1 polpo 0,640,404,725 --quanti=4
   --scrivi` spezza la regione nei fotogrammi (`--vuoto` per quante colonne
   vuote separano due figure) e scrive la voce. La regione deve contenere
   **una** creatura: la fascia di righe del foglio ha il vicino sopra e sotto.
   `--rifai` cambia solo i rettangoli di una che c'è già.
3. **Guardarla**: `creature.py provino polpo` (e `--sotterraneo` per come la
   riceve l'atlante). Una riga rossa dice dove il rettangolo taglia o morde il
   vicino. Si tengono i fotogrammi coerenti; il resto va in `scelta` o fuori.
4. **Descriverla**: la `scheda` e `giochi` a mano nel JSON, poi
   `creature.py catalogo`. `creature.py controlla` dice i guasti del catalogo.
5. **Portarla in gioco**: `atlante.py sotterraneo` e/o `vesti.py --atlante`. I
   test: `unita/creature` (le coordinate, la scheda, chi porta cosa, il
   catalogo scritto) e per il castello `unita/castello-bestiario`.

## Cosa resta nei fogli e non è nel catalogo

Doppioni che non servono: un secondo vespone con lo sputo (`mostri-1`), un
piranha a cinque pose (`mostri-1`), un secondo golem di ghiaccio (`mostri-2`) e
una pianta rampicante a quattro pose i cui fotogrammi si toccano e uno guarda di
fronte (`mostri-2`). I fotogrammi di morte di tutti.

## Perché è fatto così

- **Scala 4 e niente griglia nascosta**: l'istogramma dei passi fra i cambi di
  colore lungo le righe non ha picchi, cioè i fogli sono dipinti a piena
  risoluzione, non ingranditi a blocchi. A 4 le creature vengono alte 14-26 px,
  la fascia di quelle di 0x72 (goblin e scheletro 16, orco 23) e dell'eroe (28);
  a 3 il lupo sarebbe più alto del cavaliere, a 5 la melma sparirebbe sotto una
  moneta. I più grossi (drago 34, grifone 31, golem di lava 27) sono grossi sul
  foglio e restano grossi.
- **Il ritaglio è stretto in larghezza e comune in altezza** perché i
  fotogrammi non stanno su un passo fisso (distanze da 16 a 27 px) e un
  rettangolo comune largo abbastanza per il più largo prende il bordo del
  vicino. L'altezza comune tiene i piedi per terra e lascia il saltello.
- **«trasparente», niente `colori`**: il PNG ha già l'alfa e la tavolozza non
  si tocca, le sfumature dei bordi restano quelle del foglio, dipinto morbido
  (0x72 è a tinte piatte).
- **Il drago ha un difetto che il castello si porta**: il suo secondo
  fotogramma (273 px) contiene due draghi, il secondo e la fiammata. Il
  sotterraneo prende solo il primo e il terzo (`scelta`); correggerlo nel
  catalogo cambierebbe il castello, e lo si fa con un lavoro suo.
- **Il serpente**: il quarto fotogramma è il morso e porta con sé lo schizzo
  (27 px contro 17). È voluto: è il fotogramma in cui il mostro fa qualcosa.
