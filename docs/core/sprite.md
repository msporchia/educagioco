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
         src/grafica/atlante-fattoria.js (la fattoria)
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
  (`strumenti/sprite/codifica.py`, per tutti: castello, mappe
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
- **Solo quello che un pannello mostra dipinto** (31 ottobre 2026): una cosa con un modello 3D nei pannelli si mostra con la sua foto
  ([../sotterraneo/anteprime-3d.md](../sotterraneo/anteprime-3d.md)), e la scena 3D usa solo l'atlante piccolo. Nel sotterraneo il nitido è
  `"nitido": "scelti"` sul foglio e `"nitido": true` sul pezzo: i tre gioielli senza modello e l'arco degli arcieri di Castle Battle
  (`bottino-e-arredo`), le quattro curiosità del foglio della fonte (`scudi`). Otto pezzi, 12 KB (erano 497 pezzi, 2 MB).
- **`riempi`** rimette il corpo a un pezzo mangiato da dentro: una porta nera su un foglio dal fondo nero resta trasparente dove il contorno ha dei varchi
  (`atlante.py`: `riempi_in`; `{"chiudi": 2}` chiude i varchi stretti, in pixel del foglietto, e dove la sagoma è piena mette il colore scuro). L'ha la porta del grosso.
- **Anche le creature** potrebbero, una per una: `"nitido": true` nella voce del catalogo ([creature.md](creature.md)); oggi nessuna lo
  chiede, perché nei pannelli un mostro è la foto del suo modello.
- Non serve alla pixel art vera (0x72), che è già alla sua misura. `quanti` e `toppa` non li sa ancora fare: quel pezzo
  resta solo piccolo, e lo strumento lo dice (`cancella` sì, scalato). **`misura`
  vale solo per il piccolo** (impagina): il nitido tiene tutta la sua
  definizione e il gioco lo stira alla gabbia del piccolo (`figura()`, scala
  x e y a parte, ammorbidito: `.sot-ritratto` è `pixelated`, e il pezzo
  nitido dichiara `image-rendering: auto`).

## I pezzi derivati in codice

**Quando conviene**: un pezzo che si può ricavare da tessere già dipinte (una variante di colore, un'anta girata, una cornice che chiude una grata). Generarlo
con un modello costa un giro di prompt e non esce mai della stessa mano dei pezzi vicini; in codice è della stessa mano per costruzione (usa i loro
pixel) e si rifà con un comando. **Non conviene** per un pezzo con un disegno suo (un'arma, un mostro) o quando la geometria non è esatta
(una grotta ha bordi naturali: lì un pezzo semplice raramente migliora). Prima in codice, poi dipinto: se un domani c'è il pezzo dipinto, si cambia il nome
nello scenario e il derivato si butta.

- **Come si usa**: una libreria, `strumenti/sprite/derivati.py` (`tessere_di(sorgente)`: le tessere di un foglio come le ritaglia `atlante.py`, stesso fondo,
  stessa scala), e **una configurazione per ogni uso** che dice quali tessere prendere e come chiamare i pezzi.
- **`strumenti/sprite/inferno.py`** è l'unica oggi: i pezzi che mancano allo scenario dell'inferno e che nessuno ha dipinto (la porta chiara, i fianchi,
  la scala chiusa), ricavati dalla scena e dalle tavole dipinte; un pezzo che serve solo al derivato (la grata, il lucchetto) sta nella tabella
  `per_i_derivati` del foglietto, che `atlante.py` non legge (`tessere_di(sorgente, 'per_i_derivati')`); il perché e cosa esce sta in [../sotterraneo/scenari.md](../sotterraneo/scenari.md#linferno).
  Per un uso nuovo si copia `inferno.py` come calco: i nomi delle tessere, i pezzi che escono, e `scrivi` che li mette in un foglio col suo foglietto, nel formato di `atlante.py`.
- **Il PNG non si tocca**: si rifà col comando, e `unita/sprite-derivati` confronta i pezzi rifatti con quelli scritti in `sorgenti/` (un foglio ritoccato a mano è rosso).

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
il test (`unita/sprite-inutilizzati`) guarda solo che giri e sia coerente — tranne che per la fattoria, qui sotto.

- **Immagini**: i file di `sorgenti/` che nessun foglietto, nessuno strumento (un nome o un glob nel codice,
  commenti esclusi: `terreno-*.png`) e nessun catalogo legge. Stati: `NESSUNO LA LEGGE` (anche tutto
  `non-usati/`), solo allegato ai prompt (sta in una scheda `PROMPT-*.md`), schema di `scenario.py`, set di
  terzi (`armm1998/`, `0x72/`: i nomi non si toccano). Una riga `?` dice «letta solo da uno strumento»: va
  guardata (oggi `td_1.png`, il riferimento delle misure di `vesti.py`, e due falsi allarmi dei glob).
- **Voci dell'atlante** del sotterraneo che nessun file di `src/` nomina: il nome (o un pezzo della
  sua posa) compare come parola, oppure combacia con un modello come `recinto_${specie}_${stato}` le cui
  parti sono parole che compaiono. È un'euristica: sbaglia per un nome composto in un modo che nessuno scrive
  per intero, quindi **ogni voce si guarda prima di toglierla** (`--provino` la ritaglia dall'atlante).
- **L'atlante della fattoria tiene solo i pezzi che qualcuno disegna, e il conto è esatto**: `VIVI` in
  `inutilizzati.mjs` li chiede a chi disegna (`PERSONE` col fotogramma fermo per `SceltaAspetto.vue`, `DALL_ATLANTE` di
  `passo-passo/scena/tela.js`, `facceDelleMerci()` di `fattoria3d/dati/ricette.js`), e `unita/sprite-inutilizzati` è
  rosso se un pezzo vivo manca o se l'atlante ne ha uno in più. Un pezzo che nessuno disegna più si toglie dal suo
  foglietto e si rilancia `atlante.py fattoria`; un foglio che non dà più niente si toglie con `git rm` (resta nello
  storico, e la riga del foglietto pure). Il 31/10/2026, tolta la 2D: da 705 pezzi a 92, da 2,7 MB a 174 KB.
- **Nominato non vuol dire disegnato**: un nome può stare in un elenco che nessuno legge, in un ramo morto (una porta aperta, che in 3D
  non si disegna; la fontana, che è modellata) o in un dato di un gioco tolto. Si segue ogni nome fino a chi lo legge. La controprova è
  `node strumenti/pezzi-chiesti.mjs` (`--prove sotterraneo` anche con le prove d'integrazione): costruisce il gioco con `PEZZI` e `NITIDI`
  avvolti in un contatore e dice, foglio per foglio, cosa non è mai stato chiesto. Un pezzo mai chiesto si segue nel codice; uno che il
  codice vivo può chiedere resta anche se nessuna scena l'ha chiesto. Il 31 ottobre 2026, per il sotterraneo, così sono uscite le fontane,
  le porte aperte, il mercante dei tre scenari, lo scheletro 0x72 e tredici pezzi d'arredo dell'inferno, e il nitido è sceso a otto pezzi.
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

## La fattoria: chiedere un foglio

L'atlante della fattoria (`src/grafica/atlante-fattoria.js`) dà la faccia alle merci della fattoria 3D (`Faccia.vue`) e le figure al
profilo e a Passo passo. Una merce nata prima del suo disegno dichiara in `aspetta` il pezzo che arriverà e intanto usa l'emoji
([../fattoria3d/merci-e-ricette.md](../fattoria3d/merci-e-ricette.md)).

- **Prima di far disegnare, guardare cosa c'è nei fogli**: nove delle prime quattordici merci avevano già la faccia (le casse del
  raccolto, la balla di fieno, la bottiglia del latte). L'atlante tiene solo quello che si disegna (vedi «Gli inutilizzati»): un
  pezzo tolto si riprende rimettendo la sua riga nel foglietto, dallo storico di git, e i fogli tolti il 31/10/2026 pure.
- **Il metodo è un'immagine di base allegata** (l'ultimo foglio buono) più «nello stesso stile di questa», e una scheda che dice
  quello che il generatore altrimenti inventa: misura, vista, fondo, ombra, tavolozza, appoggio, griglia (`PROMPT-merce.md`,
  `PROMPT-bestia.md` accanto ai fogli in `strumenti/sprite/sorgenti/fattoria/generati/`; `PROMPT-edificio.md` era per la 2D).
- **Il prompt si copia nel foglietto nello stesso momento in cui si salva il PNG**: la chat non lascia un file. Per `merci_2` è
  andato perso: si rigenera dalla scheda e dalle descrizioni qui sotto.
- **Le merci a sei per foglio**: sopra i sei il generatore stringe gli oggetti e i dettagli spariscono (una merce è larga 20–30 px).
  Fondo trasparente (il magenta vietava il viola della lavanda); un alone attorno alle figure lo toglie `"alone": 128`.

Le descrizioni di `merci_2`, nello stile di `merci.jpg` (un oggetto per riquadro, di fronte e un po' dall'alto, fondo trasparente,
senza ombra):

| pezzo | descrizione |
|:--|:--|
| `merce_stoffa` | rotolo di stoffa a righe crema e blu, un lembo srotolato |
| `merce_farina` | sacco di tela chiaro aperto, con la farina bianca che trabocca |
| `merce_burro` | panetto di burro giallo su un piattino, con un pezzo tagliato |
| `merce_formaggio` | forma di formaggio giallo con uno spicchio tagliato che mostra i buchi |
| `merce_minestrone` | scodella panciuta di terracotta con la minestra densa e i pezzi di verdura, un cucchiaio di legno sul bordo |
| `merce_polenta` | fetta spessa di polenta gialla su un tagliere, con una scaglia di formaggio che si scioglie sopra |

## Gli agganci

I foglietti delle bestie della fattoria hanno ancora gli `agganci` (verso per verso, in frazioni del riquadro), e `atlante.py` li
copia in `AGGANCI` dell'atlante: li leggeva la fattoria 2D, tolta il 31/10/2026, per posare cappelli e occhiali sugli sprite (si
calibravano a occhio nel banco, «i ritagli» → modo **agganci**); quelli di allora sono fermi in `fattoria3d/da2d/dati/disegni.js`, e
oggi l'`AGGANCI` dell'atlante non lo legge nessuno. La fattoria 3D aggancia sui modelli, non sugli sprite
([../fattoria3d/addobbi.md](../fattoria3d/addobbi.md)).

## La larghezza degli atlanti

- **L'atlante nitido è largo 2048 px** (`LARGO_NITIDO` in `strumenti/sprite/atlante.py`), non 1024: alto 4279 px non stava in una texture su molti telefoni (il limite tipico è 4096) e il sotterraneo andava a scatti solo sul cellulare, anche da fermo (14 ottobre 2026). Nessuna immagine del file unico supera i 4096 px per lato.
