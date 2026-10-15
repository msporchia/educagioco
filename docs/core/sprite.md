# Gli sprite

Il giro degli sprite (fattoria, sotterraneo, castello): dai fogli
sorgente agli atlanti che il gioco spedisce, e il banco `npm run mondo`
per guardarli e correggerli. Per esteso, e da leggere prima di toccare un
foglio: `strumenti/sprite/LEGGIMI.md` (il giro e il banco, gesto per
gesto), `strumenti/sprite/FORMATO.md` (il foglietto, campo per campo),
`strumenti/sprite/STANDARD.md` (le regole dei fogli),
`strumenti/sprite/DA-GENERARE.md` (le immagini che mancano, coi prompt).

## Le creature dipinte

I due fogli di mostri e i passi dai video non hanno più un foglietto per gioco: sono **un catalogo
solo**, `strumenti/sprite/sorgenti/creature/creature.json`, che `atlante.py` (sotterraneo) e
`vesti.py` (castello) leggono con la stessa libreria, `strumenti/sprite/creature.py`. Ogni gioco
porta solo le creature che nomina. Per esteso: [creature.md](creature.md).

## Il giro

```
strumenti/sprite/sorgenti/<gioco>/generati/<foglio>.png + .json   ← «i ritagli» guarda qui
                          ▼
            atlante.py (figure) / vesti.py (il castello)
                          ▼
         src/giochi/<gioco>/dati/atlante.js                     ← «il mondo» guarda qui
         src/giochi/castello/dati/vestiti.js, figure.js
```

- **`atlante.py`** ritaglia figure, un bersaglio per gioco (un
  `atlante.json` per cartella di sorgenti). Il castello ne dichiara uno
  con `"attrezzo": "vesti"`, e `atlante.py` lo salta: c'era `terreni.py`,
  per il castello a tessere, tolto col suo visore il 29 settembre 2026.
- **`vesti.py --atlante`** fa pezzi e figure del castello — i vestiti
  delle carte dai fogli del terreno, le torri dal foglio delle torri
  (`torri-<n>.png`, il numero più alto), i mostri dai fogli del
  sotterraneo e dai passi di `cammino.py`;
  `righe.py <foglio> <provino>` conta righe e figure di un foglio a righe
  appena arrivato, e `vesti.py --provino-foglio` / `--provino` fanno i
  provini senza scrivere niente. **`cammino.py`** tiene di un video di
  Grok Imagine solo i passi di una creatura (sei di lato, sei di fronte):
  il video non si conserva, e i passi si portano alla misura della
  creatura in `vesti.py`. Tutti i comandi in [comandi.md](comandi.md).
- **Le immagini dipinte entrano in WebP senza perdita a colori a passo 12**
  (`strumenti/sprite/codifica.py`, per tutti: castello, terra di sopra, mappe
  di Passo passo); gli atlanti di `atlante.py` sono PNG senza perdita. Il perché
  e i numeri: [grafica.md](grafica.md#fedeli-ai-sorgenti).
- **Il PNG non si tocca mai.** La sorgente è la verità: un PNG ritoccato a
  mano non dice più cosa gli è stato fatto, e la correzione si perde il
  giorno che arriva un foglio migliore. Le correzioni sono **dato nel
  foglietto**: buttare il generato e rifarlo dà lo stesso risultato al
  pixel.

## I pezzi nitidi

**Un foglio dipinto non perde la definizione nell'atlante.** `atlante.py`
riduce ogni foglio alla sua griglia vera (scala 3 o 5 per la roba del
sotterraneo), e lì una spada dipinta a cento pixel diventa di venti: nel
campo regge, ma nello zaino, nel confronto o nei Tesori, ingrandita due o tre
volte, era sgranata. Con `"nitido": true` nel foglietto lo stesso strumento
ritaglia gli stessi pezzi anche **dal foglio com'è dipinto**: stesse
coordinate riportate al foglio grande, fondo tolto sui pixel veri, `buchi`
con `max` scalato all'area. Il risultato è un secondo atlante, `NITIDO` (WebP
senza perdita a passo 12, come gli altri dipinti) con `NITIDI` accanto,
nello stesso modulo.

- **La misura resta quella di `PEZZI`**: chi impagina (la mano dell'eroe,
  la casella, il confronto) non cambia. Chi disegna prende il pezzo nitido
  se c'è: `figura` in `viste/figura.js` per l'HTML, `pezzo` di
  `creaFoglio` (`grafica/atlante.js`, opzione `nitidi`) per la tela,
  ammorbidendo solo lì (`imageSmoothingEnabled` torna spento subito dopo).
- **I contorni (`alone`) restano dal pezzo piccolo**: sono un filo di un
  pixel di sprite, e da lì vengono uguali.
- **Peso**: per i tre fogli della roba del sotterraneo, 260 pezzi, 451 KB.
- **Anche l'arredo dei fogli di scena**, pezzo per pezzo: `"nitido": "scelti"` sul foglio e `"nitido": true` sul pezzo (`sotterraneo_2`,
  `4_3`, `5_2`, `5_3`). Una botte di 150 px ridotta a 26 sgrana, nitida regge; il resto del foglio (pavimenti, muri) resta com'è.
- **`riempi`** rimette il corpo a un pezzo mangiato da dentro: una porta nera su un foglio dal fondo nero resta trasparente dove il contorno ha dei varchi
  (`atlante.py`: `riempi_in`; `{"chiudi": 2}` chiude i varchi stretti, in pixel del foglietto, e dove la sagoma è piena mette il colore scuro). L'ha la porta del grosso.
- **Anche le creature**, una per una: `"nitido": true` nella voce del catalogo ([creature.md](creature.md)); `atlante.py` prende i suoi
  fotogrammi dal foglio grande (`fogli_delle_creature` li segna, `nitidi_di` salta gli altri). Tela e `figura()` lo scelgono da soli per nome.
- Il foglietto lo dichiara per i fogli dipinti di oggetti (`bottino-e-arredo`,
  `scudi`, `armature-e-vesti`), non per la pixel art vera (0x72), che è
  già alla sua misura. `quanti` e `toppa` non li sa ancora fare: quel pezzo
  resta solo piccolo, e lo strumento lo dice (`cancella` sì, scalato). **`misura`
  vale solo per il piccolo** (impagina): il nitido tiene tutta la sua
  definizione e il gioco lo stira alla gabbia del piccolo (`figura()`, scala
  x e y a parte, ammorbidito: `.sot-ritratto` è `pixelated`, e il pezzo
  nitido dichiara `image-rendering: auto`). È la strada dei personaggi della
  terra di sopra (`sopra-personaggi-*`: 22 pixel di altezza il piccolo,
  200 il nitido): +400 KB di WebP per venti pose.

## I pezzi derivati in codice

**Quando conviene**: un pezzo **geometrico** (una diagonale, un angolo smussato, un quarto di cerchio) che si può ricavare da tessere già dipinte. Generarlo
con un modello costa un giro di prompt e non esce mai della stessa mano delle tessere vicine; in codice è della stessa mano per costruzione (usa i loro
pixel) e si rifà con un comando. **Non conviene** per un pezzo con un disegno suo (un'arma, una porta, un mostro) o quando la geometria non è esatta
(una grotta ha bordi naturali: lì un pezzo semplice raramente migliora). Prima in codice, poi dipinto: se un domani c'è il pezzo dipinto, si cambia il nome
nello scenario e il derivato si butta.

- **Come si usa**: una libreria, `strumenti/sprite/derivati.py`, e **una configurazione per ogni uso** che dice quali tessere prendere e come chiamare i pezzi.
  Oggi ce ne sono due: `strumenti/sprite/diagonali.py`: i muri obliqui del sotterraneo, una voce di `SCENE` per scena (cripta, cantine, fornace, inferno) con il foglio
  da cui ritagliare, il nome del foglio che esce e due numeri (le righe del coronamento e dove cominciano i mattoni). Una scena nuova è una voce lì, poi
  `python3 strumenti/sprite/diagonali.py <scena> --provino` (il foglio da guardare in `tmp/diagonali-<scena>.png`) e `atlante.py sotterraneo`. Per un uso
  nuovo (altri giochi, altre forme) si copia `diagonali.py` come calco: i nomi delle tessere, i pezzi che escono, e `scrivi_foglio` che li mette in un
  foglio col suo foglietto (famiglie «tessera», un giro, fondo trasparente), nel formato di `atlante.py`.
- **`strumenti/sprite/inferno.py`** (15 ottobre 2026) è l'altra: i pezzi che mancano allo scenario dell'inferno e che non sono geometria ma «il resto» (pavimenti senza cuciture, tetto a massi, il pentagramma, le porte chiara e aperta, i fianchi, la scala chiusa, la fontana asciutta), ricavati dalla scena e dalle tavole dipinte; il perché e cosa esce sta in [../sotterraneo/scenari.md](../sotterraneo/scenari.md#linferno). La regola è la stessa («prima in codice, poi dipinto») e il test (`unita/sprite-derivati`) confronta il foglio scritto con quello che il codice rifà.
- **Le funzioni di `derivati.py`**: `tessere_di(sorgente)` (le tessere di un foglio come le ritaglia `atlante.py`: stesso fondo, stessa scala);
  `triangolo(dim, angolo)` e `quarto_di_cerchio(dim, angolo, raggio)` (maschere `L`, 255 dentro); `mascherata(tessera, maschera)`; `profondita(h)` (quanto si è
  entrati in un bordo dopo `h` pixel di una diagonale a 45°: 1/√2 per colonna); `bordo_su_diagonale(roccia, bordo, lato)` (la roccia tagliata dalla linea col suo
  bordo che corre lungo la diagonale, a gradini di un pixel); `faccia_su_diagonale(fila, lato, parità, righe)` (una fascia di muro spostata di un pixel per
  colonna: la faccia di una parete obliqua, larga una cella e alta due); `scrivi_foglio` e `provino`. `quarto_di_cerchio` non ha ancora un uso.
- **Dove sono usate**: i sei pezzi per scena dei muri obliqui ([../sotterraneo/scenari.md](../sotterraneo/scenari.md#i-muri-in-diagonale)), pezzi `<scena>-taglio-so|se`
  e `<scena>-faccia-no|ne-0|1` nell'atlante del sotterraneo (+9 KB di PNG per tutte e tre le scene).
- **Il PNG non si tocca**: si rifà col comando, e `unita/sprite-derivati` confronta i pezzi rifatti con quelli scritti in `sorgenti/` (un foglio ritoccato a mano è rosso).
- **I limiti visti**: la linea passa per gli angoli opposti della cella, quindi solo a 45° e a gradini di una cella (un passo da due celle per una e basta non
  si ricava: resta a scaletta); la fascia è alta al più una cella (la faccia delle cantine, alta 20, ne perde quattro righe di mattoni); la tessera della roccia
  si campiona sempre dalla stessa cella, e dove ha un disegno (le pietre delle cantine) il pezzo non si salda alla vicina; il pezzo vuole il pavimento sotto già
  posato dalla tela, perché dentro la diagonale è trasparente.

## Il banco — `npm run mondo`

Una pagina sola, `strumenti/banco/mondo.html`, con due metà che sono i due
capi dello stesso tubo.

- **«i ritagli» — quello che entra.** Il foglio sorgente coi rettangoli del
  foglietto sopra, da trascinare. I difetti dei fogli disegnati da un
  modello sono sempre quattro: il rettangolo **taglia**, **prende troppo**,
  due disegni finiscono sotto **un nome solo** (e il gioco li fa
  lampeggiare come fotogrammi), o dentro il ritaglio resta **roba che non
  c'entra**. In cima al pannello c'è **come uscirà** la cosa intera, in
  movimento: l'anteprima applica le stesse regole senza aspettare il
  generatore. Una riga gialla segna le voci toccate. I fogli del castello
  compaiono spenti: lì i ritagli li misurano `vesti.py` e `cammino.py`, non
  c'è niente da spostare.
- **«il mondo» — quello che esce.** L'atlante vero su un campo di prova,
  con quattro attrezzi: **posa** (il piede cade dove deve?), **pennello**
  (come sta una zona: le varianti le sceglie il posto), **strada** (le
  tessere le sceglie `componiPercorso`, il risolutore vero: se non chiude
  qui non chiude in gioco), **guida** (chi cammina, perché le pose stanno
  insieme solo in movimento). Più **confronta i fogli**, che mette in fila
  i pezzi alla scala vera per vedere se vengono dallo stesso set, e la ✎
  su ogni voce che porta al suo rettangolo nell'altra metà.

**Il giro completo è uno solo**: correggo nel banco → «salva il foglietto»
→ `atlante.py` → «il mondo». L'anteprima non serve al gioco: `atlante.py`
sì.

**Chi salva è un plugin di Vite `apply: 'serve'`**
(`strumenti/banco/salva-foglietto.js`): scrive solo `.json` dentro
`strumenti/sprite/sorgenti/`, e nel build non esiste. Un foglietto cambiato
da fuori mentre il banco è aperto vuole una ricarica a mano, apposta: la
pagina non si muove da sola mentre ci si lavora.

## Gli inutilizzati

**La regola** (dell'utente): niente «oggetti non utilizzati nel gioco ma già generati». Ogni pezzo o è un
doppione (e si elimina), o si usa; se è già in un altro set o è brutto, si elimina. `npm run
sprite:inutilizzati` dice quali sono oggi nel mezzo, per cartella-gioco. Non cambia niente e non è un cancello:
il test (`unita/sprite-inutilizzati`) guarda solo che giri e sia coerente.

- **Immagini**: i file di `sorgenti/` che nessun foglietto, nessuno strumento (un nome o un glob nel codice,
  commenti esclusi: `terreno-*.png`) e nessun catalogo legge. Stati: `NESSUNO LA LEGGE` (anche tutto
  `non-usati/`), solo allegato ai prompt (sta in una scheda `PROMPT-*.md`), schema di `scenario.py`, set di
  terzi (`armm1998/`, `0x72/`: i nomi non si toccano). Una riga `?` dice «letta solo da uno strumento»: va
  guardata (oggi `td_1.png`, il riferimento delle misure di `vesti.py`, e due falsi allarmi dei glob).
- **Voci dell'atlante** (fattoria, sotterraneo) che nessun file di `src/` nomina: il nome (o un pezzo della
  sua posa) compare come parola, oppure combacia con un modello come `recinto_${specie}_${stato}` le cui
  parti sono parole che compaiono. È un'euristica: sbaglia per un nome composto in un modo che nessuno scrive
  per intero, quindi **ogni voce si guarda prima di toglierla** (`--provino` la ritaglia dall'atlante).
- **La roba del sotterraneo**: le figure di `roba.json` che nessun foglietto ritaglia e che non hanno un
  `pezzo` (le 17 «fuori» di [figure.md](../sotterraneo/figure.md)). **Le creature**: quelle del catalogo senza
  nessun gioco, e i fotogrammi che un gioco lascia fuori (`scelta`).
- **Il 13 ottobre 2026** si sono eliminati i doppioni: tutto `castello/non-usati/`, le scene `td_2/3/4.png`
  (già nei `terreno-*.png`; `vesti.py` non ha più il ripiego sulle scene, `td_1.png` resta come riferimento),
  `fattoria/non-usati/` e `home/non-usate/` (cartelle ora vuote), e dagli atlanti 13 voci del sotterraneo
  (chiavi blu/ferro/verde, `arco-vuoto`, `cancello-chiuso`, cuori, pozioni gialla e verde, `forziere-mezzo`,
  `scena-cassa`, `scena-teschio`) e 24 tessere 16 px della fattoria (laghetti, stagni interni, recinti,
  `ninfea`, `ossa_mucchio`, torrioni, casse del tesoro).
- **Lo stesso giorno, in sera, quello che restava si è messo in gioco o tolto** (voci dell'atlante e figure della roba: 0 e 0): arredo di cantine, cripta e
  fornace dai fogli dipinti ([arredo.md](../sotterraneo/arredo.md)), forzieri per ambientazione e gemme colorate ([roba.md](../sotterraneo/roba.md)), il portone
  nero col teschio d'oro e la porta chiara ([piani.md](../sotterraneo/piani.md#le-porte)), dieci bastoni raddrizzati con `ruota`, le pose di morte dei mostri
  ([creature.md](creature.md)). **Tolti**: le porte e i fianchi d'oro, `pozione-nera` e `pozione-viola`, le monete grosse e il mucchio (sostituiti dalle gemme), i due
  teschi di porta di prima, la `cassa` di decoro, l'occhio dentato, e sei figure della roba che nessun pezzo può avere (balestre `arco-08/09/10`, arco con la lama, frusta,
  mazza). Restano nei PNG, che non si toccano: le sfere di cristallo di `scudi.png` (la viola è la curiosità, le altre quattro non hanno un ruolo che non si confonda con lei),
  l'arredo di `bottino-e-arredo.png` che sembra un contenitore, gli stendardi a palo, il pozzo, la statua dello stregone col cappello.
- **`--pixel`** (`strumenti/sprite/non-ritagliato.py`): per ogni foglio con un foglietto toglie i rettangoli
  dal primo piano (alfa, fondo dichiarato, o il colore degli angoli; bianco e scacchiera dipinta riconosciuti)
  e raggruppa il resto in macchie: figure dipinte mai ritagliate. I fogli di scena (`sotterraneo_N`) ne
  danno molte perché il fondo è dipinto. **Di un foglio che resta in uso le macchie non si «eliminano»**:
  o si ritagliano (una riga nel foglietto) o restano nel PNG, che non si tocca.

## Gli agganci

**Dove sta la testa di una bestia lo dice il suo foglietto** (`agganci`,
verso per verso, in frazioni del riquadro), non una tabella per specie:
`atlante.py` lo copia in `AGGANCI` dell'atlante della fattoria, e `puntiDi`
in `giochi/fattoria/dati/animali.js` legge foglietto → scheda → ripiego. Si
calibra a occhio nel banco («i ritagli» → modo **agganci**, trascinando i
cerchietti con l'anteprima vestita accanto) e si controlla in
`poc/scatti/agganci-fattoria.png`.

- **L'atlante nitido è largo 2048 px** (`LARGO_NITIDO` in `strumenti/sprite/atlante.py`), non 1024: alto 4279 px non stava in una texture su molti telefoni (il limite tipico è 4096) e il sotterraneo andava a scatti solo sul cellulare, anche da fermo (14 ottobre 2026). Nessuna immagine del file unico supera i 4096 px per lato.
