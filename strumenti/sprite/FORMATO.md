# Un file di immagine, il suo foglietto, N sprite

**Ogni sorgente porta con sé la propria geometria.** Accanto a
`pappagallo.png` sta `pappagallo.json`, che dice com'è fatto quel foglio:
quanto è ingrandito, dove cadono i fotogrammi, com'è il fondo, e quali
sprite ne devono uscire.

Non è pignoleria: è l'unico modo perché **un formato nuovo non rompa
niente**. Finora la geometria la indovinava l'attrezzo, e ogni foglio
generato da un modello diverso arrivava fatto a modo suo — 272×256 con
quattro fotogrammi per riga, poi 1071×1008 col fondo a scacchiera dipinta,
poi 1536×1024 PNG con sei fotogrammi per riga e otto righe. Ogni volta
l'euristica si rompeva, e si rompeva **in silenzio**: cani tagliati a metà,
scacchiera addosso, versi invertiti. Roba che si scopre a schermo, cioè
tardi.

Con un foglietto per sorgente non c'è niente da indovinare. Se un foglio è
fatto in un modo che non abbiamo mai visto, si scrive nel suo `.json` e
basta: l'attrezzo non cambia.

## Il foglietto

```json
{
  "scala": 4,
  "fondo": "trasparente",
  "cella": [16, 32],
  "sprite": {
    "pappagallo_giu":  { "da": [0, 0], "quanti": 4 },
    "pappagallo_lato": { "da": [0, 4], "quanti": 4, "cella": [32, 32] },
    "pappagallo_su":   { "da": [0, 2], "quanti": 4 }
  }
}
```

- **`scala`** — quanto il foglio è ingrandito rispetto alla misura vera.
  `4` vuol dire che una tessera da 16 px lì dentro ne occupa 64. `"auto"`
  la fa misurare dalla forma del foglio, che è la strada di prima e resta
  come ripiego.
- **`fondo`** — `"trasparente"` se il PNG ce l'ha già (e allora non si
  tocca niente), `"auto"` per toglierlo allagando dai bordi, oppure un
  colore esplicito `[255, 255, 255]`. Dichiararlo evita il caso peggiore:
  un cane bianco a cui si aprono buchi nella schiena perché il bianco della
  carta e il bianco del cane sono lo stesso colore.
- **`cella`** — la misura di un fotogramma, in pixel **veri** (dopo aver
  diviso per la scala). Si può ridichiarare per singolo sprite: di lato un
  quadrupede è lungo il doppio, e questa è la riga che lo dice invece di
  farlo scoprire dallo sprite spezzato in due.
- **`sprite`** — nome → dove prenderlo. `da` è in **celle**, non in pixel:
  così cambiare `scala` non obbliga a riscrivere tutte le coordinate.
  `quanti` è il numero di fotogrammi in fila; se manca è 1.
  `passo` (facoltativo, in celle) serve quando i fotogrammi non sono
  attaccati: `"passo": [3, 0]` li prende ogni tre celle. Un foglio senza
  un passo costante — i fotogrammi disegnati a mano, non su una griglia —
  si dichiara **un fotogramma per riga**, scrivendo `nome0`, `nome1`...
  come sprite separati invece di un `quanti` che non torna: ognuno ha il
  suo `da`, e nessuno obbliga a un passo unico.
  `specchia: true` ritaglia lo sprite e lo rovescia: serve quando un
  quadrupede sul foglio guarda a sinistra invece che a destra (la
  convenzione di sotto per `_lato`) — si dichiara così invece di rigirare
  il PNG sorgente, che deve restare quello che ha dato il generatore.
- **`ritagli`** — il nome di un file JSON accanto al foglio, con i pezzi
  dichiarati **in pixel** (`{"nome": [x, y, largo, alto]}`) invece che
  in celle. È l'alternativa a `sprite`, per i fogli che una griglia non
  ce l'hanno: 0x72 mette i muri a 16×16, le porte a 32×32, i personaggi
  a 16×28 e la moneta a 6×7 in mezzo, e dichiararli in celle vorrebbe
  dire una `cella` diversa per ogni riga. Si punta a un file esterno
  invece di copiarlo qui dentro perché quel file di solito **esiste
  già** — 0x72 distribuisce `tile_list_v1.7` dentro il proprio zip — e
  di coordinate deve restarne una copia sola.
- **`tipo`** — solo per i fogli che contengono un attore (uno sprite con
  nomi `_giu`/`_lato`/`_su`): `"persona"` o `"bestia"`. Non si ricava dal
  nome — un cane si può chiamare come si vuole — e serve a distinguere chi
  un bambino **sceglie come proprio aspetto** da chi cammina per conto suo
  nella scena. Un foglio senza attori (le tessere, `gfx/Overworld.json`)
  non lo dichiara. Vale per **tutto il foglio**, non sprite per sprite: un
  foglio è o l'uno o l'altro, e ridirlo riga per riga sarebbe solo rumore.
  Chi lo legge è `atlante.py`, che ne scrive due elenchi nel modulo
  generato — `PERSONE` e `BESTIE` — un attore senza `tipo` dichiarato resta
  fuori da entrambi e lo script lo segnala in console.
- **`famiglie`** — di che famiglia è un pezzo, **per prefisso**:
  `{"muro": "tessera", "suolo": "tessera"}` dice che ogni nome che comincia
  per `muro` o per `suolo` è di quella famiglia. Le famiglie ammesse sono
  in `strumenti/sprite/catalogo.py` (`FAMIGLIE`): `attore`, `oggetto`,
  `tessera`, `fondo`, `figura` — dicono **come si posa** un pezzo (un
  oggetto si appoggia col piede, una figura sborda in alto, una tessera
  riempie la sua casella). Si può anche scrivere `"famiglia"` — al
  singolare — per **tutto il foglio**: un foglio di edifici è tutto
  `figura` e ridirlo prefisso per prefisso sarebbe solo rumore. Senza
  niente dichiarato, ogni pezzo è `oggetto`, che è il verso giusto in cui
  sbagliare (FORMATO.md di `catalogo.py` spiega perché).
- **`trasforma`** — quali permutazioni regge un pezzo, **per prefisso**
  come `famiglie`:

  ```json
  "trasforma": {
    "sasso":      { "giri": 4 },
    "recinto":    { "giri": 2 },
    "fontana":    { "giri": 1, "specchia": false }
  }
  ```

  `giri` è quanti quarti di giro danno ancora un pezzo giusto — e non lo
  dice la famiglia, lo dice il disegno: **4** per quello visto a piombo
  dall'alto (una pozza, un pavimento, un sasso: ogni quarto di giro è
  ancora giusto); **2** per quello che ha un asse ma non una faccia (una
  staccionata, un tronco steso, un ponte: girato di 180° è ancora giusto,
  di 90° cadrebbe di lato); **1** per quello con una faccia, che gira
  «per davvero» solo restando fermo (una fontana, un mulino, una casetta,
  una panchina). Il commento in cima a `catalogo.py` (sezione `GIRI`)
  ragiona per esteso sul perché. Senza dichiarazione vale il ripiego
  della famiglia (`GIRI` in `catalogo.py`: `tessera`/`fondo` 4,
  `oggetto`/`figura`/`attore` 1), che è già prudente — un pezzo girato
  per sbaglio si vede subito, uno che si poteva girare e non si è girato
  costa solo un disegno in più. `specchia` (di default `true`) dice se
  oltre a girare si può anche rovesciare.
  Girare e specchiare si fa **a schermo**, mai nell'atlante: otto copie
  di ogni pezzo costerebbero otto volte il peso per un conto che un
  `ctx.rotate`/`ctx.scale` fa gratis.
- **`cose`** — quali pezzi sono **la stessa cosa**, e in che ordine.

  ```json
  "cose": {
    "bandiera": {"pezzi": ["bandiera0", "bandiera1", "bandiera_asta"], "anima": true},
    "fabbro":   {"pose": {"giu": ["fabbro_a", "fabbro_b"], "lato": […]}, "famiglia": "attore"}
  }
  ```

  Senza `cose`, il raggruppamento lo indovina `catalogo_di` **dal nome**:
  `fontana0` e `fontana1` sono i fotogrammi di «fontana» perché finiscono
  con un numero e hanno un fratello. Funziona, e resta il ripiego per i
  fogli che già lo usano — ma ha tre difetti, e sono i tre motivi per cui
  esiste questo campo:

  1. **Unire obbliga a rinominare, e rinominare rompe in silenzio.** Il
     nome di un pezzo è la chiave dentro `PEZZI`, e certi giochi la
     scrivono a mano (`sotterraneo/dati/tessere.js` cita `suolo-0` e
     `muro-basso-centro`; il catalogo della fattoria cita duecento pezzi
     uno per uno). Ribattezzare un pezzo per raggrupparlo lo fa sparire
     da lì, e sparisce senza errori: `drawImage` con un argomento non
     finito torna senza disegnare **e senza lanciare**.
  2. **L'ordine sta dentro un numero.** Infilare un fotogramma in mezzo
     vuol dire rinumerare tutti quelli dopo; qui si sposta una riga.
  3. **Il nome fa due lavori** — identificare e raggruppare — e quando
     litigano vince la convenzione: `bandiera_asta` è il terzo fotogramma
     della bandiera che sventola, e nessuna espressione regolare lo saprà
     mai.

  `famiglia`, `giri`, `specchia` e `anima` si dichiarano **sulla cosa**,
  che è dove hanno senso: una fontana ha una faccia, non ce l'hanno i suoi
  tre fotogrammi uno per uno. La forma corta `"bandiera": ["a", "b"]` vale
  come `{"pezzi": ["a", "b"]}`.

  Si compone col dito da `npm run mondo` → «i ritagli»: si segnano i pezzi
  col `+`, si preme **unisci**, e l'ordine è quello in cui li hai segnati.

### Un foglio senza griglia, senza un file di `ritagli` a parte

`ritagli` punta a un file esterno perché di solito **esiste già** —
0x72 lo distribuisce dentro il proprio zip. Quando le coordinate le si
scrive da zero (un foglio di oggetti disegnati a mano, senza passo
costante, e senza un file dell'autore da cui pescarle) non serve un
secondo file: basta dichiarare `"cella": [1, 1]` e scrivere `da` e
`cella` **in pixel veri** dentro ogni riga di `sprite`, come se fossero
celle da 1 px:

```json
{
  "cella": [1, 1],
  "sprite": {
    "fontana_grande0": { "da": [11, 12], "cella": [91, 99] }
  }
}
```

Con una cella larga 1 px, moltiplicare `da` per `cella` (quello che fa
`atlante.py` per ogni sprite) non cambia niente: il numero scritto è
il pixel vero. È la stessa strada che uno userebbe con `ritagli`, senza
il file a parte — giusto quando quel file non esiste già da nessuna
parte. `strumenti/sprite/misura.py --figure` (o `--celle`, se il foglio
ha almeno dei separatori) misura i rettangoli da incollare qui.

## Correggere un ritaglio storto

I fogli disegnati da un modello la griglia non la capiscono fino in fondo,
e i difetti sono sempre gli stessi quattro. Tutti e quattro si correggono
**qui**, mai nel PNG: `STANDARD.md` dice che la sorgente è la verità — non
si modifica e non si butta — e un PNG ritoccato a mano è un PNG di cui non
si sa più cosa gli è stato fatto sopra, che il giorno che arriva un foglio
migliore rimette in gioco una correzione che nessuno ricorda.

| il difetto | la correzione | cosa costa |
|---|---|---|
| il rettangolo taglia, o prende troppo | `da` e `cella` | quattro numeri |
| due disegni diversi sotto un nome solo (e il gioco li fa lampeggiare, credendoli fotogrammi) | due nomi invece di uno | una riga in più |
| una cosa sola spezzata in più nomi (e il gioco te la vende due volte) | `cose` | una riga, e nessun pezzo si rinomina |
| dentro il ritaglio giusto resta roba che non c'entra | `cancella` | un rettangolo |
| la stessa cosa è disegnata a misure diverse (e a schermo cambia taglia da sé) | `misura` | due numeri |

```json
"casa_albero": { "da": [271, 126], "cella": [59, 67], "cancella": [[0, 63, 6, 4]] }
```

`cancella` è un elenco di `[x, y, largo, alto]` in coordinate **dentro il
ritaglio**, e quei rettangoli escono trasparenti. Vale per tutti i
fotogrammi dello sprite. Non è una regola nel generatore — quelle cercano
di essere furbe su tutti i fogli e sbagliano — è **una correzione a questo
foglio qui**, e sta accanto al foglio che descrive.

```json
"campo_grano3": { "da": [614, 439], "cella": [125, 110], "misura": [34, 27] }
```

`misura` dice **quanto deve venire** quel ritaglio, in pixel veri. Serve
quando il foglio disegna *la stessa cosa* a misure diverse: quello dei
campi disegna la stessa aiuola otto volte, larga 140 px al primo stadio e
108 all'ultimo, e ridotta tutta dello stesso fattore il campo a schermo
**si restringe mentre matura**. Ogni singolo ritaglio è giusto — non c'è
niente da correggere in `da` e `cella` — ed è per questo che il difetto
non lo trova nessun controllo: si vede solo a occhio, come un campo che
respira. Le due misure sono indipendenti, così una cosa allungata più che
allargata si rimette in proporzione invece di uscire storta. Vale per
tutti i fotogrammi dello sprite, e i numeri li stampa lo stesso attrezzo
che misura i rettangoli.

`scala` e `foglio` restano la strada normale — riducono tutto il foglio
dello stesso fattore, che è quello che si vuole quando il foglio è una
tabella onesta. `misura` è per il pezzo che dal fattore comune esce
sbagliato.

I quattro numeri non si contano a mano: si guardano. `npm run mondo`, metà
**«i ritagli»**, disegna i rettangoli sopra il foglio e li lascia
trascinare; da lì si buca, si rinomina, si sdoppia un gruppo che era due
cose, e si riscrive il foglietto. Poi si rilancia `atlante.py`.

## Per quale gioco è questo foglio

Non lo dice il foglietto: lo dice **la cartella**. Un `atlante.json`
accanto alle sorgenti apre un bersaglio, e vale per tutto quello che ha
sotto finché una cartella più interna non ne dichiara un altro.

```json
{
  "nome": "sotterraneo",
  "modulo": "src/giochi/sotterraneo/dati/atlante.js",
  "tessera": 16,
}
```

Una cartella può anche dichiarare `"attrezzo": "terreni"`: vuol dire che
quei fogli li ritaglia un altro script (`strumenti/sprite/terreni.py`,
per dire, che scolla la strada dal terreno e misura gli attacchi delle
tessere), e `atlante.py` la salta invece di provarci. Dichiararlo è
meglio che dedurlo dal fatto che non esce niente — e comunque un
bersaglio da cui non esce nessun pezzo viene saltato, non scritto vuoto:
un modulo vuoto che sovrascrive quello buono si scopre a schermo.

`modulo` è il file generato (non si scrive a mano), `tessera` quanto vale
una cella di terreno in pixel dello sprite — finisce nel modulo come
`TESSERA`, così non resta un 16 scritto a mano da qualche parte a dire il
contrario — e `poc`, facoltativo, è il prototipo che vuole lo stesso PNG
dentro di sé fra i due marcatori: un `poc/` non può importare un modulo,
e se il suo atlante invecchia quello che ci si prova non dice più niente
sul gioco.

Ogni bersaglio impacchetta **solo i propri fogli**. Un atlante unico si
porterebbe le tessere del dungeon dentro la fattoria, cioè peso che non
si disegna mai, e il build deve restare un file solo.

## Un file, N sprite — e le animazioni

Il nome fa tutto. `quanti: 3` genera `nome0`, `nome1`, `nome2`, e chi
disegna li mette in giro: **è così che si dichiara un'animazione**, non
scrivendo tre righe gemelle. La fontana oggi sta in `tessere.js` come

```js
fontana0: [22, 9, 3, 3],
fontana1: [25, 9, 3, 3],
fontana2: [28, 9, 3, 3],
```

e col foglietto diventa una riga sola:

```json
"fontana": { "da": [22, 9], "cella": [48, 48], "quanti": 3, "passo": [3, 0] }
```

Stessa cosa per gli attori: un nome che finisce in `_giu`, `_lato` o `_su`
è un verso, e tre versi fanno un attore. Non serve più il `--zampe`: la
differenza fra un umano e un cane è **dove cade la banda di lato**, e
quella sta scritta nel `da`.

## Perché non basta un formato solo

Perché non lo decidiamo noi. I fogli arrivano da generatori diversi, e ogni
generatore ha le sue abitudini; chiedergli di rispettare una griglia esatta
è una battaglia che si perde. Molto meglio prendere quello che dà e
descriverlo in dieci righe.

Il foglietto si scrive **una volta per sorgente**, guardando il foglio con
`--provini`. Poi quella sorgente è a posto per sempre.

---

# Come si disegna uno stagno grande

Le nove fette ci sono già in `tessere.js` — `stagno_angolo_no`,
`stagno_bordo_n`, `stagno_centro` e le altre — ritagliate dallo stagno di
esempio. Quello che manca è chi le sceglie, e sta nel livello che disegna,
non nel dato.

**Tu segni le celle d'acqua. Il disegno guarda i vicini.** Per ogni cella
d'acqua si controllano le quattro celle attorno: quelle che *non* sono
acqua dicono da che parte c'è la riva.

```
niente acqua sopra e a sinistra   → stagno_angolo_no
niente acqua sopra                → stagno_bordo_n
acqua tutto intorno               → stagno_centro
```

Sono sedici combinazioni possibili e nove tessere: le nove bastano perché
gli angoli interni (una rientranza dello stagno) si possono disegnare col
bordo, e a questa dimensione non si nota.

Questo vale **identico per la staccionata**, che ha lo stesso problema
girato: un recinto lungo vuole i pali agli estremi, la traversa in mezzo e
il giunto agli angoli. È la stessa funzione con un'altra tabella, e per
questo va scritta una volta sola in `scena/`.

Il vantaggio vero non è grafico: è che **si smette di piazzare oggetti e si
comincia a dipingere**. Uno stagno non è più «un pezzo 3×3 che o ci sta o
non ci sta», è una pozza della forma che vuoi.
