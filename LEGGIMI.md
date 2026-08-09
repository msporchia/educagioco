# Come è fatto, e perché

Questo è il documento **tecnico**: le regole esatte, i numeri, e soprattutto
il *perché* delle scelte — compresi i tentativi che non hanno funzionato e
cosa ci hanno insegnato. Serve a chi mette le mani nel motore.

Se cerchi altro:

| | |
|---|---|
| Come si gioca, cosa sono i giochi, i settaggi | [`README.md`](README.md) |
| Un gioco alla volta, con le immagini | [`docs/`](docs/) |
| Come si lavora sul repo: comandi, convenzioni, test | [`CLAUDE.md`](CLAUDE.md) |

**Leggi la sezione che ti riguarda prima di toccare `src/store/srs.js` o il
bilanciamento del castello**: sono le due parti in cui una modifica
ragionevole a prima vista rompe qualcosa che non si vede subito.

## Com'è fatto
```
src/
  store/storage.js   archivio a tre livelli: IndexedDB → localStorage → memoria
  store/srs.js       motore di apprendimento: forza, decadimento, distanza minima
  store/profile.js   profilo condiviso: monete, cameretta, animali, apprendimento
  store/progressi.js livelli, giorni di fila, padronanza per materia, traguardi
  data/traguardi.js  l'elenco dei traguardi, uno per riga
  data/words.js      496 vocaboli inglesi, con emoji dove ha senso
  data/verbi.js      55 verbi inglesi con il significato italiano
  data/frasi.js      153 frasi intere, con i loro distrattori scritti a mano
  data/parole-es.js  496 vocaboli spagnoli, le stesse emoji e categorie
  data/verbi-es.js   55 verbi spagnoli all'infinito
  data/frasi-es.js   160 frasi intere: ser/estar, genere, tener, gustar
  data/lessico.js    parole, verbi e frasi delle due lingue, visti allo stesso modo
  data/domande.js    i modi di chiedere: figura, ascolto, traduzione, frase
  data/campagna-lingua.js   la forma di una campagna, condivisa fra le lingue
  data/campagna-inglese.js  le tredici tappe di English
  data/campagna-spagnolo.js le tredici tappe di Español
  data/lingue.js     tutto ciò che distingue una lingua dall'altra
  data/voci.js       la pronuncia inglese incisa, in sprite (generata, vedi sotto)
  data/voci-es.js    la pronuncia spagnola, voce boliviana (generata)
  data/shop.js       30 oggetti della cameretta
  data/ops.js        operazioni in colonna: riporti, prestiti, divisione
  data/tabelline.js  i dieci pianeti della campagna delle tabelline
  data/pets.js       il cane, i due gatti, i quattro bisogni e cosa li sazia
  data/capsule.js    le sei serie di accessori della macchina delle sorprese
  components/ColumnOp.vue   tastierino e caselle, cifra per cifra
  components/PetSprite.vue  il cane e i gatti, disegnati in SVG
  components/MappaTabelline.vue  la tavola dei calcoli che si sanno e no
  components/Stanza.vue          la cameretta disegnata: mensole, porta, tappeto
  components/SchedaAnimale.vue   un animale per volta, grande, con lo slider
  components/Negozio.vue         un negozio solo: banco cameretta e banco animali
  components/Sorprese.vue        la macchina delle capsule
  views/             HomeView, CamerettaView, LinguaGame, MathGame,
                     TowerDefense, AlboView
  audio.js           suoni sintetizzati, nessun file audio
  voce.js            riproduce la pronuncia incisa, inglese o spagnola
```

### English
Un gioco solo, tredici tappe. Prima erano due — le parole con le figure, i
verbi in ascolto — ma erano lo stesso identico meccanismo con due vestiti
diversi, e nessuno dei due andava da nessuna parte: si apriva, si macinava, si
chiudeva. Ora la strada è tracciata come per i pianeti delle tabelline.

Il meccanismo resta uno: **un bersaglio, alcune risposte, si tocca quella
giusta**. Quello che cambia è cosa c'è nel bersaglio e cosa c'è nei bottoni, e
lì sta tutta la progressione:

| tipo | bersaglio | risposte | quando |
|---|---|---|---|
| guarda | `dog` | sei figure | subito |
| capisci | `dog` | cinque parole italiane | quando la riconosce |
| ascolta | 🎧 | sei figure | quando la riconosce |
| produci | `cane` | cinque parole inglesi | quando la sa |
| ascolta e capisci | 🎧 | cinque parole italiane | quando la sa |
| frase | `where is my teacher` | quattro frasi italiane | subito |
| frase al contrario | `dov'è la mia maestra?` | quattro frasi inglesi | quando la riconosce |
| il buco | `the cat ___ black` | is · are · am · be | quando la riconosce |

Le frasi inglesi si scrivono **senza punto di domanda**. Se ce l'avessero,
capire che «is this a cat» è una domanda sarebbe questione di guardare
l'ultimo carattere; così invece bisogna aver capito che in inglese la domanda
si fa girando il verbo. Il `?` sta solo nelle risposte italiane — «questo è un
gatto» e «questo è un gatto?» — ed è lì la scelta. Sono le domande più
istruttive del gioco: le due risposte sembrano identiche.

**Quale tipo tocca a una parola non lo decide la tappa ma la forza di quella
parola nel motore** — la colonna "quando" qui sopra. Una parola nuova si vede
scritta accanto alle figure; quando comincia a saperla le si toglie la figura,
o le si toglie il testo e resta solo la voce; quando la sa davvero si parte
dall'italiano, o dalla voce e basta.

**Il testo è una stampella, e si toglie strada facendo.** È la scelta che fa
funzionare l'ascolto: chiedere `dog` a orecchio il primo giorno è una domanda a
caso, ma continuare a mostrarlo scritto per sempre vuol dire non allenare mai
l'orecchio — che è la cosa che a scuola manca e che da adulti serve per prima.
Così la difficoltà segue chi gioca invece del calendario.

Ne viene una cosa carina: una parola imparata esce dal giro (è il motore che
la archivia) e torna settimane dopo, al ripasso, con la forza ancora alta —
quindi **il ripasso arriva quasi sempre senza testo**, a voce o partendo
dall'italiano. Chi ha imparato `apple` guardando la figura, un mese dopo se la
sente e basta. Chi giocava prima che
la campagna esistesse se la trova già aperta fin dove arrivava
(`allineaInglese`).

### Español
Lo spagnolo è **lo stesso identico gioco** — stesso file
(`views/LinguaGame.vue`), stesse tredici tappe, stessi otto modi di chiedere —
con dentro altre parole. Quello che cambia sta tutto in `data/lingue.js`:
la campagna, il nome, dove segnare i progressi. Aggiungere una terza lingua è
tre file di dati e una voce in quella tabella.

**Le due lingue non si toccano mai.** Chiavi separate (`en:dog` contro
`es:perro`), campagne separate nel profilo, contatori separati, traguardi
separati, e i distrattori di una domanda escono sempre dalla stessa lingua.
Sapere «gatto» in inglese non vuol dire saperlo in spagnolo, e il motore di
apprendimento non deve credere il contrario.

Cambia però **cosa** si insegna, perché lo spagnolo è difficile in punti
diversi. L'inglese chiede di sentire la differenza fra come si scrive e come si
dice; lo spagnolo, che a un italiano suona quasi familiare, chiede quattro cose
che l'italiano non fa:

| | | l'errore che si fa |
|---|---|---|
| **ser / estar** | due verbi per un «essere» | *soy cansado* invece di `estoy cansado` |
| **il genere** | se lo portano dietro articolo e aggettivo | *la casa blanco*, e `la leche`, `el agua` |
| **tener** | fame, sete, freddo e anni si HANNO | *soy hambre* invece di `tengo hambre` |
| **gustar** | funziona al rovescio | *yo gusto el chocolate* invece di `me gusta el chocolate` |

Sono le dritte delle tappe e il contenuto dei **buchi** — dodici su ser/estar,
gli altri su articoli, concordanza e `tener`. I falsi delle frasi sono errori
veri, quelli che si fanno davvero: mai frasi che in America latina suonerebbero
giuste.

Al contrario dell'inglese, qui le domande **si scrivono con i due segni**,
`¿dónde está mamá?`: in spagnolo la domanda si segna, e toglierla vorrebbe dire
insegnare a scrivere male. Ne segue una regola per i dati: i falsi di una
domanda devono essere domande anche loro, altrimenti la risposta giusta si
riconosce dal `¿` senza aver capito niente (lo verifica `test/unita/spagnolo`).

Lo spagnolo scritto è quello di casa — la mamma è boliviana: `papa` e non
`patata`, `palta`, `durazno`, `frutilla`, `auto`, `celular`, `jugo`, `lentes`.
Le parole che i bambini sentiranno davvero.

### La voce
Il gioco **non usa la sintesi vocale del telefono**. Era la scelta naturale —
zero peso, nessuna preparazione — ma dà una voce diversa su ogni apparecchio:
su Android di solito buona, su Linux esce `espeak`, che non si capisce e sembra
il cattivo di un videogioco. Per un bambino che sta imparando una pronuncia
sbagliata fa più danno del silenzio.

Le parole sono quindi **incise una volta sola** con una voce neurale e infilate
nel file HTML: stessa voce su ogni telefono, anche senza rete. L'inglese con una
voce britannica (`en-GB-SoniaNeural`), lo spagnolo con una **boliviana**
(`es-BO-SofiaNeural`) — è la lingua della mamma, e vale la pena che i bambini la
sentano con quell'accento.

Non una clip per file, però: l'intestazione di un file audio pesa quanto mezzo
secondo di parlato, e con 550 parole sarebbe stata metà del peso. Vengono
concatenate per categoria in ventiquattro **sprite**, e un indice dice a che
secondo comincia ciascuna. `voce.js` decodifica lo sprite che serve — al massimo
tre alla volta, per non riempire la memoria del telefono — e ne suona la
fettina giusta. Le due lingue hanno indici separati, perché `no` e `piano`
esistono in tutte e due e vanno dette con la bocca giusta.

```
npm run voci                            incide le parole inglesi nuove
npm run voci -- --lingua es             le parole spagnole nuove
npm run voci -- --elenca                le voci disponibili per quella lingua
npm run voci -- --voce en-GB-LibbyNeural  rifà tutto con un'altra voce
npm run voci -- --bitrate 12k           file più leggero, qualità più bassa
npm run voci -- --tutto                 reincide da capo
```

Serve solo a chi aggiunge parole ai file dei vocaboli: la prima
volta scarica `edge-tts` in `.venv-voci/` (serve rete) e usa `ffmpeg` per
accorciare e comprimere. Le clip già incise restano in `.voci-cache/` e
`.voci-cache-es/`, quindi aggiungere dieci parole costa dieci parole, non
cinquecento. Se in coda dice «non incise: …» — capita quando il servizio taglia
le ultime richieste di una serie lunga — basta rilanciare lo stesso comando.
Una parola senza clip non rompe niente: quel turno si legge e basta, e le
domande in ascolto per lei non escono.

Le due incisioni pesano insieme circa 2,2 MB, i due terzi del file unico
(2,6 MB). È tanto, ed è voluto: è il prezzo di una pronuncia che non dipende da
che telefono hai in mano.

### I progressi
La pagina **I miei progressi** (🏅 dalla schermata iniziale) è il posto dove si
vede a che punto si è, e risponde a tre domande in quest'ordine:

1. **Chi sono adesso** — un livello solo per tutto il profilo, somma
   dell'esperienza di ogni gioco. È anche il moltiplicatore delle monete:
   giocare a inglese fa guadagnare di più anche alle torri. Ogni gioco ha poi
   il suo livello, che vive solo qui e non tocca il salvadanaio.
2. **Cosa so fare** — una barra per materia (tabelline, parole/verbi/frasi
   inglesi, parole/verbi/frasi spagnole, operazioni). Non è un contatore: è la forza *efficace* del motore di
   apprendimento, quindi **scende** se non si ripassa. Da questo numero esce
   anche la difficoltà 1..5 che i giochi possono usare per scegliere le
   domande (`difficoltaOra('mate')`), invece di ripartire da zero ogni volta.
3. **Cosa ho vinto** — i traguardi, in bronzo, argento e oro.

I giorni di fila si contano appena si sceglie il giocatore: entrare è già il
gesto che conta.

I traguardi stanno tutti in `data/traguardi.js`, una riga ciascuno, e si
misurano su grandezze che salgono e basta (risposte giuste, tappe superate,
pasti serviti). Sono quindi **retroattivi**: guardano quello che c'è nel
profilo, non serve che qualcuno li segni mentre si gioca. La prima volta che
un profilo li incontra, quelli già meritati vengono registrati in silenzio —
senza monete e senza festa: regalarne duemila per cose fatte il mese scorso
sarebbe rumore, non un premio.

Aggiungerne uno vuol dire aggiungere una riga a `TRAGUARDI`; se serve una
grandezza che ancora non esiste, si aggiunge un contatore in `totals` e il
gioco lo incrementa con `segna('chiave')` (o `segnaBest('chiave', valore)`
per i primati), che pensano da soli a far scattare la festa.

### Il motore di apprendimento
Un "elemento" è indifferentemente una tabellina (`math:7x8`) o un vocabolo
(`en:butterfly`). Ogni elemento ha una **forza** da 0 a 6; l'intervallo di
ripasso raddoppia a ogni livello (10 minuti → 3 settimane). Superata la
scadenza la forza *efficace* cala da sola col passare dei giorni: quello che
non si vede da troppo tempo torna a farsi vedere, senza bisogno di sbagliarlo.

Dentro una sessione nessun elemento può ricomparire prima di 6 altri elementi.
E chi risponde giusto tre volte di fila sullo stesso elemento lo manda **a
riposo** fino a fine partita: ha dimostrato di saperlo adesso, e al suo posto
l'insieme in lavorazione ne fa entrare un altro. Il consolidamento vero resta
affidato ai ripassi dei giorni dopo.

### Tabelline Asteroidi
Si tocca l'asteroide con il risultato giusto prima che arrivi in fondo.

**La campagna** è una fila di dieci pianeti, come le tappe del castello.
Ognuno porta una tabellina nuova e si tiene le precedenti come ripasso: il
gioco non chiede più *quali tabelline vuoi allenare* — è una domanda a cui un
bambino non sa rispondere, e spuntandole tutte ognuna usciva un decimo delle
volte.

| pianeta | tabellina | il trucco che si dice prima di partire |
|---|---|---|
| 🌍 | 2 | il numero raddoppiato: sono tutti i pari |
| 🌕 | 10 | il numero con uno zero in fondo |
| 🪐 | 5 | finiscono per 5 o per 0: è metà del 10 |
| 🔴 | 3 | 3, 6, 9, 12… come una filastrocca |
| 🟢 | 4 | il doppio del doppio |
| 🟡 | 6 | la tabellina del 3 raddoppiata |
| 🟣 | 7 | metà la sai già dai pianeti di prima, girata |
| 🔵 | 8 | il 4 raddoppiato |
| 🟤 | 9 | una decina meno il numero: 9×6 = 60−6 |
| ☀️ | tutte | l'esame: niente di nuovo, tutto insieme |

Il pianeta si supera con un **bersaglio di partita** — tante risposte giuste,
di cui una parte sulla tabellina nuova — e paga in monete la prima volta.
Dentro la tappa il pool è per più di metà la tabellina del pianeta: con una
quota minore la tappa diventava un'attesa, con tutto il pool le tabelline di
prima si dimenticavano una dopo l'altra. Superato l'ultimo si apre il **volo
libero**, senza bersaglio, ed è lì — e solo lì — che le tabelline si tornano a
scegliere a mano.

La ⭐ di un pianeta è un'altra cosa dal superarlo: arriva quando **tutte e
dieci le caselle** di quella tabellina sono imparate secondo il motore, ed è
la frase che il bambino dice a voce ("so la tabellina del 7"). Non si
conquista una volta per sempre: si legge dalla forza *efficace*, quindi una
tabellina lasciata lì per un mese la perde e torna a farsi vedere.

Chi giocava prima che la campagna esistesse non ricomincia dal 2: all'avvio le
tappe già meritate si aprono da sole (superarle, e prendersi le monete, resta
da fare). Restano validi i due accorgimenti di prima: l'insieme in lavorazione
**gira a turno fra le tabelline in gioco**, e `×1` e `×10` stanno in fondo
alla scala di difficoltà perché sono regole, non fatti da mandare a memoria.

Dalla mappa — e da fine partita — **📊 Cosa so** apre la tavola pitagorica dei
propri progressi: una casella per calcolo, colorata con la forza *efficace*.
Risponde alla domanda a cui il punteggio non risponde: non "come è andata
stasera" ma "quali calcoli so e quali no". È una pagina di progressi, non un
pezzo di partita: veste come l'albo e come la mappa dei pianeti — fondo chiaro,
riquadri bianchi, i colori del tema — e si esce dal tasto della barra in cima,
che riporta da dove si è arrivati. Le tabelline in gioco adesso si riconoscono
dai numeri di riga e colonna accesi; le altre caselle restano visibili ma
smorzate.

Dentro gli asteroidi ci sono **due campagne**, in due schede: i pianeti — le
tabelline — e le stazioni, che sono il calcolo a mente.

### Il calcolo a mente: le stazioni
Le tabelline sono 55 fatti: si contano, si imparano, finiscono. Poi restava
solo il volo libero, e il gioco era «finito». Il calcolo a mente invece non
finisce: 27+38 e 68+75 non sono due cose da mandare a memoria, sono la stessa
strategia su due numeri diversi.

| # | stazione | cosa porta |
|---|---|---|
| 🚀 | Fino al dieci | 3+4 · i doppi · 9−4 |
| 🛰️ | Oltre la decina | 8+5 · i quasi doppi · 13−7 |
| 🌑 | Amici e decine | 7+?=10 · 30+40 · 70−30 · 60+?=100 |
| 🌒 | Due cifre e una | 12+6 · 18−6 · 34+20 |
| 🌓 | Passa la decina | 26+7 · 43−7 |
| 🌗 | Due cifre | 23+45 · 68−25 |
| ☄️ | Riporti e prestiti | 27+38 · 52−27 |
| 💫 | I quasi tondi | 47+29 · 63−29 |
| 🌠 | Moltiplicare a mente | 23×10 · 4×30 · 4×23 · 9×14 · 11×24 · 14×5 |
| 🛸 | Dividere a mente | 56:8 · metà di 68 · 120:4 · quante volte ci sta |
| 🌌 | Fino a mille | 350+200 · 650+?=1000 · 240+130 · 497+298 |
| ⭐ | La prova | tutto insieme, come il ☀️ dei pianeti |

**Una cosa nuova per tappa, e la cosa nuova è sempre _un pezzo in più da tenere
a mente_.** Le tappe di mezzo erano tre e ognuna ne portava quattro o sei
insieme: chi apriva «Due cifre» si trovava nella stessa partita 34+5 e 43−11,
che non sono lo stesso mestiere. Adesso la salita è scritta nella fila — le fasi
della luna 🌑🌒🌓🌗 sono lì apposta, per far vedere che è una salita sola:

| | | cosa si aggiunge |
|---|---|---|
| 🌒 | 12+6 | la decina sta ferma, si toccano le unità |
| 🌓 | 26+7 | le unità scavalcano, la decina si muove di uno |
| 🌗 | 23+45 | due cifre contro due cifre, ma le colonne non si parlano |
| ☄️ | 27+38 | due cifre e le colonne si parlano: il riporto |
| 💫 | 47+29 | quasi tondo: si arrotonda e poi si aggiusta |

Le altre due cose che la rendevano a scatti si vedevano solo giocandola davvero,
non leggendo l'elenco delle tappe:

1. Il `?` in mezzo al conto stava il primo giorno, accanto a 3+4. Ma «quanto
   manca» non è «quanto fa»: è l'operazione girata, un'altra domanda. Adesso
   arriva alla terza tappa, insieme all'altro complemento — quello del cento.
2. **Il ripasso copriva la tappa.** Il pool gli dava «tutto quello che avanza»,
   e siccome un concetto a istanze infinite è *una* chiave mentre i fatti già
   visti sono centinaia, un pool da dodici veniva su con undici sottrazioni
   entro il dieci e una sola domanda del concetto nuovo. Le risposte mirate del
   bersaglio non salivano e la tappa non finiva più: nella simulazione il
   bambino restava ventisette partite dentro «Due cifre» a rifare 3−2 e 6−5.
   Adesso il ripasso **si misura su quanto porta la tappa** e non la supera
   mai: metà di quello che arriva è la cosa che la stazione è venuta a
   insegnare. Il test `unita/calcolo` difende sia la quota sia l'ordine dei
   gradini qui sopra.

**Quello che il motore segue non è sempre il calcolo.** Dove i casi sono pochi e
vanno saputi a memoria — le somme entro il venti, gli amici del dieci, i doppi —
l'elemento è il fatto, come una tabellina: `calc:8+5`. Dove i casi sono infiniti
l'elemento è la **strategia**: `calc:somma-riporto`, e ogni domanda è
un'istanza generata al momento. Si distinguono dalla chiave e basta — dopo
`calc:` un fatto comincia con una cifra, un concetto con una lettera — così
l'albo, i traguardi e il motore continuano a vedere una materia sola.

**La difficoltà si muove su tre assi** invece che su uno, ed è la differenza con
le scalette del castello, che sono dieci gradini fissi:

1. **quale concetto è aperto** — un grafo di prerequisiti, non una fila. Le
   tabelline sono dentro il grafo: `4×23 a mente` non si apre finché quattro
   tabelline non reggono davvero, e il generatore moltiplica per quelle che il
   bambino sa. Le due campagne degli asteroidi si tengono per mano.
2. **quanto è consolidato** — la forza del motore, quella efficace: se non si
   ripassa cala, il concetto torna in lavorazione e la ⭐ della stazione si
   spegne.
3. **quanto sono grandi i numeri** — la *taglia*, che il gestore ricava dalla
   forza: `somma-riporto` appena aperto propone 27+38, consolidato propone
   68+75. Un concetto non ha un ultimo esercizio, ed è il motivo per cui
   questo gioco non si finisce.

Il grafo **dosa, non sbarra**: una stazione che il gioco ha aperto si gioca
comunque, e se le basi zoppicano il ripasso di quelle entra nel pool accanto ai
concetti nuovi. (Prima non era così, e una tappa con i prerequisiti deboli
diventava un muro: il bersaglio delle risposte mirate non saliva mai.)

**I falsi non sono rumore.** Si risponde toccando un asteroide, quindi se i
numeri sbagliati fossero presi a caso attorno al risultato basterebbe escludere
invece di calcolare. Sono invece gli **errori tipici** di quel concetto: il
riporto dimenticato (65 → 55), la sottrazione fatta a colonne in valore assoluto
(52−27 → 35), lo zero in meno in `4×30`. Nessun falso è fuori scala, almeno due
sono lì accanto, e ogni tanto stanno tutti da una parte — se il risultato giusto
non fosse mai il più grande né il più piccolo, scartare i due estremi sarebbe una
scorciatoia che funziona sempre.

Il calcolo pesante si vede anche nel cielo: `peso` dice quanto costa in testa, e
da lì il gioco toglie asteroidi e rallenta la caduta. Un 3+4 arriva fra sei
bersagli, un 497+298 ne vuole tre e il doppio del tempo.

**Il trucco si dice alla seconda volta storta.** Ogni concetto porta la sua
dritta — «arriva prima alla decina», «il nove è un dieci che si scusa» — e
compare sopra la domanda quando lo stesso concetto va male due volte nella
stessa partita. Alla prima no: sbagliare una volta capita, e un cartello a ogni
errore diventa rumore che si impara a saltare. Le stesse dritte si rileggono in
**📊 Cosa so → 🧠 A mente**, dove ogni trucco ha la sua barra e si vede quali si
hanno in mano.

### Difendi il Castello
Schermo diviso: sopra i nemici avanzano lungo il percorso, sotto si sceglie la
torre e si risolve l'operazione che la costruisce.

| torre | operazione | effetto |
|---|---|---|
| 🏹 Arciere | addizione | colpi rapidi su un nemico |
| ❄️ Ghiaccio | sottrazione | non fa danno, congela chi passa vicino |
| 🔮 Magica | moltiplicazione | onda che colpisce a zona |
| 💣 Bombe | divisione | colpo lento e devastante |

Si scrivono **solo le cifre del risultato**, da destra: i riporti si tengono a
mente, perché scriverli sarebbe una stampella. Unica eccezione la
moltiplicazione con moltiplicatore a due cifre, dove i due prodotti parziali
sono passaggi veri del procedimento: si scrive `a × unità`, poi `a × decine`
incolonnato uno spazio più a sinistra, e infine la somma delle due righe.

**La torre nasce sempre al livello 1** con l'operazione più facile che esista:
niente riporti, niente prestiti. Per farla salire si tocca — sul campo, o nella
fila *Torri in campo* sotto le operazioni, dove c'è scritto quanto costa — e si
risolve il gradino dopo. Salendo **cambia faccia**, tre volte lungo la scaletta,
perché il lavoro fatto deve vedersi e non restare un numeretto in un angolo:

| | 1-3 | 4-6 | 7-10 |
|---|---|---|---|
| Arciere | 🏹 | 🎯 | 🦅 |
| Ghiaccio | ❄️ | 🧊 | ⛄ |
| Magica | 🔮 | ✨ | 🧙 |
| Bombe | 💣 | 🧨 | 🚀 |

Le torri si possono anche **spostare trascinandole** su una piazzola libera: è
lo stesso gesto del tocco finché non scivola — fermo potenzia, in movimento
sposta — e non costa energia, perché è tattica, non un acquisto. Ogni livello quasi raddoppia il danno, e la scaletta ha
**dieci gradini**, perché fra "27+15" e "247+185+96" ce ne stanno comodi otto:

| grad. | + | − | × | : |
|---|---|---|---|---|
| 1 | 24+13 due addendi, niente riporti | 46−12 niente prestiti | 22×3 niente riporti | 72:4 esatta |
| 2 | 27+15 un riporto | 95−58 con prestito | 84×3 con riporti | 47:2 con resto |
| 3 | 234+152 tre cifre | 661−201 tre cifre | 420×2 tre cifre | 210:3 tre cifre |
| 4 | 247+185 tre cifre con riporti | 850−75 con prestito | 278×2 con riporti | 645:2 con resto |
| 5 | 23+14+21 **tre addendi** | 735−199 prestiti in fila | 4204×7 quattro cifre | 272:8 tabelline alte |
| 6 | 27+35+18 tre con riporti | 351−174 doppio prestito | 39×22 **due cifre per due** | 509:2 con resto |
| 7 | 1247+385 quattro cifre | 903−255 zeri di mezzo | 51×93 | 816:9 zero nel quoziente |
| 8 | 247+185+96 | 2381−572 | 625×26 tre per due | 4912:8 quattro cifre |
| 9 | 12+34+21+43 **quattro addendi** | 5810−2344 | 937×97 | 6199:2 con resto |
| 10 | 1247+385+2094 | 3032−2738 zeri a catena | 1759×52 | 9511:9 divisore grande |

Ogni gradino cambia **una cosa sola** — prima le cifre, poi il riporto, poi
quanti numeri — e fin dove si sale lo decide la tappa, non la bravura: nelle
prime si resta sui calcoli facili anche se il bambino corre, perché la scaletta
va salita tutta e in ordine.

**Gli errori si pagano in energia, mai in vite**: la torre si costruisce lo
stesso, ma il conto sbagliato costa qualche ⚡ in più. Sbagliare rallenta la
difesa, non la fa crollare. La torre magica pesca il moltiplicatore fra le
tabelline che gli asteroidi hanno trovato deboli.

**La campagna** è una fila di sei tappe, ognuna col suo percorso, le sue
ondate e le torri che mette a disposizione:

| tappa | ondate | torri | novità |
|---|---|---|---|
| 🌱 Il sentiero | 6 | 🏹 | addizione |
| 💧 Il guado | 7 | 🏹 ❄️ | sottrazione |
| 🍀 La radura | 8 | 🏹 ❄️ | nemici più duri |
| 🌲 Il bosco | 9 | 🏹 ❄️ 🔮 | moltiplicazione |
| ⛰️ La gola | 10 | 🏹 ❄️ 🔮 | nemici più duri |
| 🏰 Le mura | 12 | tutte | divisione |

Superata una tappa si apre la seguente; vinte tutte e sei si sblocca la
**partita libera**, senza traguardo. Il progresso sta nel profilo, quindi ogni
bambino ha la sua campagna.

Le monete arrivano dal traguardo, non dal tempo passato lì davanti, e non sono
una cifra scelta a occhio: sono le operazioni che la tappa chiede, contate con
lo stesso metro degli altri giochi — una moneta ogni dieci risposte giuste. Da
2 a 5 monete per tappa (per il livello del giocatore), una sola di cortesia se
la tappa era già stata vinta, una ogni cinque ondate nella partita libera.

### L'energia, e perché il calcolo difficile conviene
Ogni nemico fermato lascia **⚡**, e con l'energia si costruisce oppure si
potenzia. Costruire costa e rincara con le torri già in campo; potenziare costa
meno e rende molto di più, perché una torre alta vale quanto tante torri deboli
ma occupa un posto solo — e i posti per tappa sono pochi apposta. Così salire la
scaletta è la mossa *conveniente*, non quella virtuosa: la matematica difficile
è la strada per la torre forte, non una tassa da pagare.

**L'ondata parte quando la chiami tu.** Fra un round e l'altro il gioco aspetta:
il tempo per fare i conti è tutto del bambino, e la fretta è facoltativa — chi
manda l'ondata entro pochi secondi si prende ⚡ di bonus. Aspettare all'infinito
però non è una strategia: passato il tempo l'ondata parte da sola. Quanto tempo
lo dice la tappa — 45 secondi nella prima, 20 nell'ultima: all'inizio si impara
dove si tocca e ci vuole calma, dopo il ritmo è parte del gioco. Il conto alla
rovescia **scorre solo a mani ferme**: mentre c'è un'operazione aperta si ferma,
e riparte da capo appena la si finisce. La matematica non è mai sotto cronometro,
lo è solo lo stare a guardare. Il tasto ⏩ in alto
manda il campo a velocità doppia o tripla, e le postazioni si occupano
**partendo dal castello**, così la difesa cresce verso l'ingresso.

### I numeri delle tappe non si scrivono a mano
Di una tappa si scrive quello che si racconta: nome, percorso, ondate, torri,
fin dove arriva la scaletta. Postazioni, energia di partenza e vita dei nemici
**non si scrivono**: le prime due le calcola il modello (`data/castello.js`), la
terza la **misura un simulatore** giocando la tappa per davvero. La promessa,
oggi, è più stretta di com'era:

> chi spende tutta la sua energia finisce la tappa;
> chi ne tiene in tasca un quarto, no.

**Perché il conto sulla carta non bastava.** Il modello analitico c'era, tornava,
e prometteva tappe tese. Poi le tappe le abbiamo fatte giocare a un finto
giocatore, e si vincevano tutte spendendo il 40-60% dell'energia, senza perdere
un cuore. Due difetti, nessuno dei quali una formula può vedere da sola:

1. la durezza era **una per tappa**, tarata sull'ondata peggiore — che è sempre
   la prima. Da lì in poi l'energia entrava più in fretta di quanto crescessero i
   nemici: prima ondata al limite, ultima con il doppio della potenza necessaria.
   Metà tappa si giocava, metà si guardava;
2. nelle prime tappe **comprare tutto costava meno dell'energia che la tappa
   regalava** — sei torri al livello 3 costano 204 ⚡ e la tappa ne dava 336.
   Finita la spesa non restava niente da fare. Ed è il difetto peggiore, perché
   l'energia che avanza sono operazioni in colonna non fatte: esercizio buttato.

**Come si tara adesso.** Il combattimento vive in `motore/battaglia.js` — mostri,
torri, colpi, energia, cuori — senza una riga di disegno: lo stesso identico
codice gira dentro il gioco e dentro Node. `strumenti/simula-castello.mjs` lo fa
giocare da un bambino finto che ha un tetto di spesa (`quota: 0.75` = «di tutta
l'energia che ricevo ne spendo tre quarti»), un tempo per fare le operazioni in
colonna e una probabilità di sbagliarle. Una tappa intera costa qualche decimo di
secondo, quindi le domande si fanno a migliaia:

```bash
npm run simula                 # come vanno le tappe, con cinque modi di giocarle
npm run simula -- --quote 1,.9,.75
npm run tara                   # ritrova la vita di ogni ondata e riscrive i dati
npm run tara -- --prova        # la stessa cosa senza toccare niente
```

`npm run tara` cerca, per ogni ondata e in ordine, il suo **limite**: la vita
oltre la quale chi ha speso tutto comincia a perdere cuori. Poi ne prende una
frazione, che cresce lungo la tappa — dal 55% della prima ondata al 95%
dell'ultima. Comincia larga e stringe apposta: l'energia qui la lasciano i nemici
uccisi, quindi chi resta indietro di un soffio incassa meno, compra meno e resta
indietro di più. Con ogni ondata al limite quella spirale ammazzava alla quarta
ondata il bambino che sbaglia un conto su quattro; con la tensione messa in
fondo, un errore non ha più il tempo di trascinarsi dietro tutto il resto.

E c'è un **anello di sicurezza** automatico: tarata la tappa, la si fa giocare
tre volte al «pasticcione» — sbaglia un conto su quattro, ci mette il suo tempo,
non si prende il bonus della fretta. Se non la finisce, la tappa si allarga di
cinque punti e si ricomincia. Il numero che esce non è il più teso possibile: è
il più teso che un bambino vero regge.

I risultati, ondata per ondata, stanno in `data/taratura-castello.js`, che è
**generato**: si rifà, non si modifica. Porta con sé la firma dei prezzi e delle
torri da cui è stato ricavato, e se qualcosa cambia il test se ne accorge e dice
di rilanciare `npm run tara` invece di lasciar girare il gioco su un equilibrio
di ieri.

**Cosa è cambiato nel gioco, di conseguenza.** Le postazioni non sono più poche
apposta: sono quante ne servono perché ci sia sempre un gradino da comprare —
dieci nelle prime tappe, otto nelle ultime. La progressione va al contrario, e ha
senso così: prima si allarga con tante torri basse, poi si impara che conviene
salire. E il campo di battaglia ha una **larghezza massima**: la strada è
disegnata in proporzione al riquadro ma il raggio delle torri no, quindi su un
monitor largo la stessa strada diventa tre volte più lunga e i mostri passano nei
buchi. Il simulatore lo ha misurato: oltre i 520 px l'ultima tappa non si finisce
più nemmeno spendendo tutto.

**Cosa dicono i test.** `test/unita/castello.test.mjs` non verifica più solo
aritmetica: gioca le sei tappe con cinque profili diversi e controlla che chi
spende tutto finisca, che chi ne tiene un quarto no, che a chi spende non avanzi
più del 10% dell'energia, che il pasticcione ce la faccia lo stesso, e che ci sia
sempre qualcosa da comprare. Ci mette meno di un secondo, perché è il motore vero
senza schermo. `test/integrazione/torri-equilibrio.test.mjs` gioca poi nel
browser (di serie la prima tappa e l'ultima, tutte con `TAPPE_PROVA=tutte`) per
controllare che il gioco vero e il simulatore raccontino la stessa partita.

Il conto tiene dentro anche le cose che si dimenticano: **le torri non si
equivalgono** — il ghiaccio non fa un danno che sia uno, magica e bombe
colpiscono a zona — quindi una tappa che dà solo arcieri e una piena di ghiaccio
non si misurano con lo stesso metro. Quello che deve crescere lungo la campagna
non è la robustezza dei nemici ma la *fatica*: quanta vita arriva addosso diviso
la potenza di fuoco che quella tappa lascia comprare.

### Il laboratorio delle pozioni
Le misure — litri, chili, metri — col gesto giusto invece che con un esercizio.

La ricetta è scritta in unità **grandi** (0,75 l di bava di drago · 1,4 kg di
polvere di luna · 0,3 m di radice di mandragora). Gli attrezzi del banco sono
tarati in unità **piccole** (ml, g, cm). La conversione non è una domanda a cui
rispondere: è il modo di usare l'attrezzo.

**Prima si sceglie l'attrezzo.** È il punto delicato di tutto il gioco: se lo
strumento fosse tarato *sulla dose* — una boccia che finisce sempre poco sopra
la risposta — allora la scala darebbe via la risposta da sola, basterebbe
fermarsi in cima. Quindi lo scaffale è un catalogo **fisso**, sempre lo stesso:

| liquidi | polveri | lunghezze |
|---|---|---|
| 🥃 misurino 50 ml (tacche 5) | ⚗️ bilancino fino a 200 g (pesi da 1 g) | 📏 righello 15 cm (tacche 5 mm) |
| 🧉 bicchiere 200 ml (20) | ⚖️ bilancia fino a 2 kg (da 5 g) | 📐 squadra 30 cm (1 cm) |
| 🧪 cilindro 500 ml (50) | 🏋️ stadera fino a 20 kg (da 50 g) | 🎗️ metro da sarto 2 m (5 cm) |
| 🫙 caraffa 2 l (100) | | 🪢 corda annodata 10 m (50 cm) |
| 🪣 secchio 5 l (250) | | |

Gli attrezzi delle lunghezze sono quelli che un bambino ha in mano davvero:
prima c'erano un metro da 1 m — il numero meno interessante di tutti, non c'è
niente da convertire — e una «rotella» che non diceva niente a nessuno.

Sul cartellino la **capienza è in unità grandi** e le **tacche in unità
piccole**: *fino a 2 m · tacche da 5 cm*. Sono due unità diverse nella stessa
riga, ed è voluto: fra il sapere se 1,4 m ci stanno e il sapere se cadono su
una tacca c'è un ×100 da fare. Restano però le due unità della scala in corso e
mai una terza — mentre si dosa in cl, un bicchiere «da 200 ml» avrebbe chiesto
due conversioni invece di una. Fuori scaffale anche gli attrezzi fuori misura
(una corda da 10 m per tagliare 2 cm), ma uno di troppo grosso resta sempre.

Scegliere è già matematica: serve un attrezzo **abbastanza grande** da contenere
la dose e **abbastanza fine** da poterla segnare esattamente. Per sapere se
0,75 l ci stanno nel cilindro da 500 ml bisogna aver già convertito. Nel 92%
dei casi almeno un attrezzo dello scaffale non va bene, e la dose cade ogni
volta in un punto diverso della scala (mediana a un quarto dell'altezza, non
sempre in cima) — verificato dal test.

Per lo stesso motivo l'intestazione (*Pesa 2 hg di stelle tritate*) **non ha
nessun disegnino**: se ci fosse una ⚖️ in cima, si sceglierebbe la bilancia
accoppiando i simboli invece di ragionare sulle unità. Un test rigenera
centinaia di ricette e verifica che l'intestazione non contenga mai il simbolo
di uno degli strumenti a disposizione. Per lo stesso motivo nella dispensa non
c'è **nessun ingrediente che sia un recipiente**: l'essenza di rana era 🧪 e lo
sciroppo 🍯, cioè gli stessi disegni del cilindro e del misurino, e sulla
pergamena stavano proprio accanto alla dose. Adesso sono 🐸 e 🦉, e un test
tiene i due insiemi separati.

**La scala delle misure** è appesa al muro: il pulsante 🪜 in alto apre il
cartellone con le tre file — lunghezza, massa, capacità — dalle unità grandi
alle piccole, con il **×10** fra uno scalino e l'altro e le due unità in gioco
accese. Serve a chi non si ricorda cos'è un hg. Il fattore fra le due non è
scritto da nessuna parte: gli scalini si contano.

Poi il gesto, diverso per ogni attrezzo:

- 🫗 **versa** — tieni premuto e il recipiente si riempie, ma il livello
  *scatta di tacca in tacca*: si versa in fretta fin sotto la dose e si finisce
  con la goccia fine. Niente tolleranza, quindi niente vittorie di fortuna.
- ⚖️ **pesa** — si posano i pesi veri sul piatto finché non fanno la quantità:
  la stessa scomposizione delle monete, ma in grammi.
- ✂️ **taglia** — si trascina la lama sul righello, calamitata sulle tacche.

**Si sbaglia col troppo**: superare la dose fa 💥, il recipiente trabocca e si
ricomincia — ma non costa una vita, costa quattro secondi. Si perde solo quando
il cliente se ne va. Bonus ✨ quando la pozione esce senza un errore.

**Il calderone è il premio.** Occupa metà schermata, borbotta, fuma e sta sul
fuoco; ogni dose azzeccata ci si tuffa dentro con un arco, e quello che bolle
**cambia colore mescolando i colori degli ingredienti già versati** — il giallo
delle stelle tritate nel blu dell'acqua di sirena fa verde. La mescolanza è la
media *geometrica* dei canali e non quella aritmetica, che di giallo e blu
farebbe grigio; e a differenza del prodotto secco non scivola verso il nero
quando gli ingredienti sono tre. Gli ingredienti restano a galla a dire cosa è
già stato fatto, e quando la ricetta è finita il brodo prende il colore della
pozione, che esce dal paiolo. Non conta niente e non chiede niente: serve solo
a far vedere che quella dose è servita a qualcosa.

#### Le otto tappe

Il laboratorio si gira **a tappe**, come il castello e il mercato. Una tappa è
una fila di clienti da servire, e quello che cresce non sono i numeri: sono le
cose che si devono tenere in testa insieme.

| # | tappa | gesto | conversioni | passo | ingr. | clienti |
|---|---|---|---|---|---|---|
| 1 | ⚖️ La bilancia | pesa | kg→g | 0,5 | 1 | 5 |
| 2 | 🧂 Il peso giusto | pesa | kg→g · hg→g | 0,25 | 2 | 5 |
| 3 | 📏 Il righello | taglia | m→cm | 0,5 | 2 | 5 |
| 4 | 🎗️ Il metro da sarto | taglia | m→cm · cm→mm | 0,1 | 2 | 6 |
| 5 | 🫙 La caraffa | versa | l→ml | 0,25 | 2 | 6 |
| 6 | 🧪 Le boccette | versa | l→ml · l→cl · cl→ml | 0,1 | 2 | 6 |
| 7 | ⚖️📏 Peso e misura | pesa + taglia | + dm→cm · m→mm | 0,1 | 3 | 6 |
| 8 | 🔮 Il grande calderone | tutti e tre | tutte e nove | 0,05 → 0,01 | 3 | 7 |
| ♾️ | Laboratorio libero | tutti e tre | le più deboli | dal motore | 2-3 | ∞ |

**L'ordine non è per grandezza del fattore ma per familiarità dell'unità**:
`1 kg = 1000 g` un bambino lo sa già, mentre `2,7 hg` chiede prima di sapere
cos'è un ettogrammo. Quindi le ×1000 vengono prima delle ×10.

**La campagna va a coppie**, e per questo la fatica non sale sempre: la tappa
che porta un gesto nuovo riparte coi numeri facili — si impara una cosa per
volta — e a stringere è la seconda della coppia. Il salto vero è alla settima,
dove per la prima volta due ingredienti della stessa pozione chiedono due
attrezzi diversi. Il test di unità verifica proprio questo disegno, non una
monotonia che non c'è.

**Il passo è un tetto, non un obbligo.** 0,05 dm sarebbero mezzo millimetro, e
mezzo millimetro non si taglia: le scale ×10 reggono solo i passi larghi. Ogni
conversione scende fin dove può (`passoPer`), così una tappa fine che contiene
anche cm→mm degrada da sola invece di restare senza conversioni giocabili.

**La pazienza del cliente non è scritta a mano**: si calcola dal lavoro che la
sua ricetta chiede davvero — scegliere l'attrezzo, convertire, e il gesto, che
costa diverso a seconda di quale è (mettere sette pesi sul piatto è più lento
che trascinare una lama una volta sola). Il margine scende da 2,4× a 1,5× lungo
la campagna, e sotto i 45 secondi non si scende mai. La promessa, verificata dal
test: **chi sa convertire e non sbaglia consegna con almeno metà del tempo
ancora in mano**.

#### La mancia 👑

A metà e in fondo a ogni tappa arriva un **cliente esigente**, e si vede prima
di cominciare: pergamena in cornice d'oro, cliente con l'aura. Chiede un
ingrediente in più e apre con la conversione appena entrata nella tappa.

| esito | cosa lascia |
|---|---|
| servito **senza un errore** | 🪙 mancia doppia e **un cuore** (mai più di cinque) |
| servito con un errore | 🪙 mancia |
| se ne va | costa un cuore, come tutti |
| cuori già al massimo | la mancia raddoppia al posto del cuore |

Serve a due cose: rende sostenibili le tappe lunghe — con i cuori che non
tornano, sette clienti sarebbero una condanna — ed è il primo motivo vero per
non sbagliare, dato che il 💥 da solo costa solo quattro secondi. Nel
laboratorio libero non ci sono clienti esigenti: lì il cuore lo ridanno
**cinque pozioni perfette di fila**, che è l'unico premio alla costanza.

#### Dove finisce il motore di apprendimento

Il motore fa due mestieri diversi, e nel laboratorio si vedono separati.
**Registra** sempre: ogni dose passa da `answer('pozioni:kg-g', …)`, in campagna
come nel libero, e da lì escono padronanza, traguardi e ripassi. **Decide quanto
strizzare** solo nel libero: lì `difficoltaOra('misure')` sceglie il passo e la
conversione che esce è quella che si sa peggio. In campagna decide la tappa — se
no «la quarta è più dura della terza» non sarebbe vero per tutti, e non ci
sarebbe niente da verificare.

Nove conversioni diverse (l↔ml, l↔cl, cl↔ml, kg↔g, hg↔g, m↔cm, m↔mm, dm↔cm,
cm↔mm) su diciotto ingredienti e dieci pozioni: le ricette non finiscono.

### La bancarella
Il negoziante sei tu, e il mercato si gira **a tappe**.

**Una giornata di mercato è una campagna.** Sei giornate — 🧺 Il banchetto,
⛺ Il mercato del paese, 🏪 Il mercato grande, 🏬 Il mercato coperto, 🎪 La
fiera, 🧠 La cassa rotta — più la giornata libera, che non chiude mai e si apre
finita l'ultima. Ogni giornata è un giro di banchi, tre clienti per banco: si arriva
al banco, cala il cartello con il nome e il tempo, e la fila si presenta.
Cambiare banco ridà un cuore (mai più di tre), e la giornata finita sblocca la
prossima.

**Una tappa è un banco solo.** Cinque banchi — 🍎 Il fruttivendolo, 🥬 L'orto,
🥖 Il forno, 🧀 Il frigo, 🍬 I dolciumi — con nove prodotti l'uno, di cui otto
al massimo esposti. Prima c'erano quattro reparti da aprire uno alla volta e
mezzo mestiere era ricordarsi dove stava il pane; adesso **quello che si vende
è tutto lì davanti**, in ceste di vimini col cartellino del prezzo, tre pezzi
per cesta ammucchiati, appoggiate su tre ripiani in file da due e da tre — mai
in colonna, ognuna storta a modo suo. Il cliente non può chiedere niente che
non sia sul banco che ha davanti: la spesa la si pesca dalle ceste esposte.

**1. La raccolta.** Il cliente saluta e chiede la sua roba: **la lista sta nel
suo fumetto**, non in una striscia a parte. Dalla seconda giornata può volerne
due o tre uguali («due angurie»), e allora la cesta si tocca due volte: il
fumetto segna `×2` e la cesta, dopo il primo pezzo, ricorda quanti ne mancano.
Prendere la cosa sbagliata non costa un cuore, costa due secondi e un *"No, non
quello!"*.

**2. La cassa.** Quando ha tutto ti porge i soldi, e il banco **diventa il
registratore** senza che tu debba aprire niente: lo scontrino con la spesa riga
per riga, il display verde che calcola `0,40 € DI RESTO`, e sotto il cassetto
estratto con uno scomparto per taglio. Prima lì c'era un bottone con scritto
«CASSA».

La fila si vede: chi aspetta è disegnato — testa e corpo colorato — con la sua
barretta di pazienza, che scende un terzo di chi è al banco.

Monete e banconote sono disegnate: rame, oro, bimetalliche ad anello per 1 € e
2 €, banconote col colore giusto — 5 grigia, 10 rossa, 20 blu — con finestra
chiara e banda olografica.

**Non si può sbagliare per eccesso**: una moneta troppo grande viene rifiutata
con uno scarto e costa due secondi di pazienza, non un cuore. Si perde solo per
tempo scaduto. Bonus ✨ quando il resto è dato col minor numero di pezzi.

#### Dove sta la difficoltà
Non nei numeri grandi: in **quante monete vuole il resto**. Comporre 4,90 € con
cinque pezzi e 0,40 € con due sono lo stesso conto per il computer e due
mestieri diversi per un bambino di otto anni. Quindi il cliente **non paga a
caso**: fra i modi in cui potrebbe pagare — la banconota che ha in tasca, o una
cifra tonda poco sopra la spesa, comunque mai più di tre pezzi in mano —
sceglie quello che lascia un resto della misura promessa dalla giornata.

| giornata | banchi | prezzi | monete per il resto | copie | cassetto | tempo |
|---|---|---|---|---|---|---|
| 🧺 Il banchetto | 3 | a 10c | 1-2 | no | da 10c a 5 € | 95 → 90s |
| ⛺ Il mercato del paese | 4 | a 10c | 2-3 | fino a 2 | da 10c a 5 € | 90 → 80s |
| 🏪 Il mercato grande | 5 | a 5c | 2-4 | fino a 2 | da 5c a 5 € | 80 → 70s |
| 🏬 Il mercato coperto | 5 | al centesimo | 3-5 | fino a 3 | da 1c a 5 € | 75 → 62s |
| 🎪 La fiera | 5 | al centesimo | 4-6 | fino a 3 | da 1c a 10 € | 70 → 55s |
| 🧠 La cassa rotta | 5 | a 5c | 2-4 | fino a 2 | da 5c a 10 € | 95 → 80s |

#### L'ultima giornata: la cassa rotta
Fin lì c'è sempre stato un aiuto grosso e invisibile: **la cassa il resto lo
calcolava lei**, e il gioco era comporlo con le monete. Nell'ultima giornata la
cassa è rotta. Sul display, al posto della cifra, ci sono tre punti
interrogativi: si vede la spesa sullo scontrino, si vede con cosa paga il
cliente, **e il resto lo conti tu**. Le monete si posano tutte — anche una più
grande del dovuto, che qui non viene rifiutata perché rifiutarla sarebbe già
dire la risposta — e quando hai finito premi **✓ ecco il resto**. La cassa
risponde soltanto *giusto* o *sbagliato*: se non torna dice «Sono troppi!» o
«Sono pochi…», mai la cifra, costa tre secondi e si riprova.

Per questo lì il tempo torna largo (95 → 80s) e il resto torna corto (2-4
monete): la fatica si è spostata tutta sul conto, e due conti insieme sarebbero
uno di troppo.

Il tempo si stringe due volte: dentro la giornata (la prima tappa è più larga
dell'ultima) e da una giornata all'altra — la cassa rotta esce dalla scala
apposta. Chi compra di più aspetta di più:
+8 secondi per ogni pezzo oltre i tre. Prima erano 65s secchi che scendevano a
45 e bastava un cliente sfortunato per perdere la partita.

I prezzi vengono da un **listino fisso**: il pane costa 1,50 € oggi come
domani, così il cartellino sulla cesta diventa qualcosa da leggere davvero. I
prodotti col centesimo (arance a 0,89 €, budino a 1,29 €) esistono perché senza
di loro il cassetto delle ultime giornate era una bugia: ogni prezzo era
multiplo di cinque, quindi lo era ogni resto, e le monete da 1c e 2c non
servivano mai. Sono anche i prezzi che un bambino vede sui cartellini veri.

Le categorie devono essere ovvie, altrimenti il gioco diventa indovinare: il
gelato sta al **frigo** perché è lì che un bambino lo cerca, non fra i dolci
confezionati; ciambelle e salatini stanno al **forno** con pane e pizza. Ogni
banco ha almeno sei prodotti in vendita in ogni giornata — verificato dal test.

Nel motore di apprendimento l'elemento non è la cifra del resto — 2,40 € oggi e
2,40 € domani non sono due cose diverse da sapere — ma **il pezzo più piccolo
che serve per comporlo**: cinque fasce, da `bancarella:euro` a
`bancarella:centesimi`. Si scoprono andando avanti, perché nelle prime giornate
i prezzi vanno a scatti di 10c e i centesimi non compaiono proprio.

### La cameretta
Una stanza sola, disegnata, invece di tre elenchi. Prima erano due schermate
separate con **due negozi** e un salvadanaio solo: la cameretta con le mensole
da una parte, gli animali con la loro vetrina dall'altra, e in tutte e due una
fila di banchi in cima da cui scegliere dove andare. Adesso c'è una camera —
carta da parati, finestra, letto, tappeto — e la navigazione **è il disegno**:

| cosa si tocca | dove porta |
|---|---|
| 🚪 la porta con l'insegna | il negozio |
| 🐾 un animale sul tappeto | la sua scheda |
| 🛏️ una cuccia vuota con il ❓ | il negozio, banco animali |
| 🎁 la macchina delle capsule | le sorprese |

Gli oggetti comprati stanno sulle **tre mensole** e si trascinano col dito da
una mensola all'altra; la loro grandezza la decide la mensola più piena, così
trenta oggetti ci stanno come tre — solo più piccoli. Sopra un animale compare
**una sola icona** quando gli manca qualcosa (🍽️ 🎾 🫧 💪) e nient'altro: le
quattro barre e le parole stanno nella sua scheda, e tre animali con quattro
barrette ciascuno erano dodici numeri appiccicati addosso a un disegno.

La stanza **non scorre mai**: si adatta allo schermo che trova, perché un
disegno che scorre a metà non è più una stanza. Le misure sono in `cqw`
(centesimi della larghezza della stanza), non in pixel.

Tre amici da adottare — **Watson** a 40 monete, bobtail inglese, il cane
pastore tutto pelo e senza coda, e i gatti **Sherlock** (tuxedo) e **Irene**
(arancione e nera) a 70 l'uno. Non sono emoji ma disegni in SVG: le emoji di
gatto disponibili sono tre volte lo stesso gatto, e un bobtail non c'è affatto.
Il cane abbaia e ansima, i gatti miagolano e fanno le fusa.

Ognuno ha **quattro barre** che si svuotano da sole, a velocità diverse:

| barra | si svuota in | cosa la rimette su |
|---|---|---|
| 🍽️ pancia | 7 ore | pollo e carne nella ciotola, quattro sushi |
| 🎾 allegria | 16 ore | gomitolo, palla, osso, piumino |
| 🫧 pulito | 40 ore | spazzola, sapone, shampoo |
| 💪 forma | 90 ore | carota, vitamine, controllo |

Calano anche a gioco chiuso: è la stessa idea del decadimento del motore di
apprendimento, applicata a una pancia. Quando qualcuno ha bisogno di qualcosa
lo dice già dalla schermata iniziale — *"Watson vuole giocare"* — ed è lì il
motivo per riaprire il gioco domani. Ognuno ha due cose preferite, una da
mangiare e una no, che rendono un terzo in più.

Toccando un animale si apre **la sua scheda**: uno per volta, grande mezza
schermata, e si passa da un amico all'altro con le frecce, i pallini o una
strisciata del dito. Prima erano tre riquadri da un terzo di schermo l'uno: ci
stava tutto — disegno, barrette, frase — ma piccolo al punto che il cappellino
appena messo non si vedeva, ed è il motivo per cui uno lo mette.

Sotto il disegno ci sono **quattro riquadri**, uno per bisogno, che dicono a
parole come sta (*"ha fame!"*, *"si annoia un po'"*, *"è in gran forma"*) e
mostrano lì accanto cosa dargli fra quello che c'è in dispensa — o dove
comprarlo, se non c'è niente. Le quattro barrette sul cartellino servono a
vedere in un colpo d'occhio quale sta peggio; le tre frasi di ogni bisogno
stanno in `data/pets.js` accanto alle soglie, così si vede subito se il testo e
il numero dicono la stessa cosa.

In coda ai quattro c'è un **quinto riquadro, i vestiti**: una riga per posto
(in testa, sugli occhi, al collo, sulla schiena) con gli accessori che si
hanno, e si tocca di nuovo un capo per toglierlo. Prima era un interruttore
*"vestilo"* che **nascondeva i quattro bisogni**, e per rivederli bisognava
ricordarsi di rispegnerlo: vestire e accudire sono la risposta alla stessa
domanda — *cosa faccio con lui adesso?* — e stanno nello stesso posto.

Il negozio è **uno solo**, con due banchi: 🛏️ Cameretta (i trenta oggetti da
mettere sulle mensole) e 🐾 Animali (le adozioni e i cinque reparti). Le monete
sono sempre le stesse, e due negozi in due stanze diverse volevano dire
ricordarsi in quale delle due si comprava cosa. I banchi sono **appiccicati in
cima** e restano a portata di pollice anche in fondo a cinque scaffali;
cambiando banco si riparte dall'alto. La freccia `←` torna indietro di **un
passo**, non a casa: da una schermata si torna alla stanza, e solo dalla stanza
si esce.

Tenere contenti tutti e tre costa circa **100 monete al giorno**, poco più di
una sessione di gioco: è il rubinetto che regge l'economia, e
`node test/esegui.mjs animali` stampa il conto ogni volta che si toccano i
prezzi.

Nessun animale si ammala, scappa o muore di fame: quando una barra è a zero
l'animale lo fa presente e basta. Nemmeno la `forma` è la salute — vuol dire
"un po' fiacco, gli andrebbe una carota". E a chi sta già bene la porzione non
viene tolta dalla dispensa: una distrazione non deve costare monete.

### La macchina delle sorprese
Sei serie di dodici accessori — 🏅 Sportivi, 🚀 Spaziali, 🌊 Mare, 🎉 Festa,
🍂 Bosco, 🌙 Notte — da mettere addosso agli animali: uno in testa, uno sugli
occhi, uno al collo e uno sulla schiena. Una capsula per volta, dalla serie a
cui si è arrivati; finita una serie si apre la successiva e il prezzo sale, da
30 a 230 monete. Completarle tutte costa **8.280 monete**, sedici volte
l'intero negozio della cameretta: è il posto dove finiscono le monete che
avanzano, e non finisce mai in una sera.

Due regole valgono più di qualsiasi bilanciamento. **Niente doppioni**: la
capsula pesca fra i pezzi che ancora mancano, quindi esce sempre qualcosa di
nuovo — è la sorpresa dell'ovetto, non una slot machine, e non si buttano mai
via le monete. E **la prima è offerta dalla casa**: una macchina di cui non hai
mai visto l'effetto non la provi, mentre un cappello che compare su Watson
spiega tutto da solo.

Aggiungere una serie è aggiungere una riga a `data/capsule.js`.

### Come si torna indietro
Uguale in ogni schermata: il tasto `←` in alto a sinistra, sempre lì, sempre lo
stesso — ed è l'unico tasto pieno e colorato della barra, perché è il solo che un
bambino deve trovare senza cercarlo. Accanto c'è il nome di dove si è, e a destra le monete e l'audio; in
mezzo ogni gioco mette i suoi indicatori — ❤️ 🌊 ⚡ nel castello, ✅ e la barra
dei progressi in English. Prima ogni schermata aveva la sua fascia, con ‹, ←
o ✕ in posti diversi: per un bambino "come si esce" deve essere una cosa sola.

I giochi sono pensati **in verticale**. L'app installata parte già bloccata così;
dal browser l'orientamento non si può imporre, e girando il telefono compare un
cartello che chiede di rimetterlo dritto — su tablet e computer non compare mai.

### Le monete di scorta
Per provare i negozi senza rifarsi mille tabelline si aggiunge
`#monete=500` all'indirizzo del gioco: cinquecento monete al giocatore in
corso, e `#monete=-100` le toglie. Funziona anche scrivendolo nella barra degli
indirizzi a gioco già aperto.

Il regalo si riscuote una volta sola — l'indirizzo viene ripulito subito, così
un aggiornamento della pagina non lo raddoppia — e le monete non scendono
mai sotto zero.

### Verifiche
```
npm test               tutto
npm run test:unita     solo quelli veloci, senza browser
npm run test:browser   solo quelli dentro Chrome
```
I test stanno in `test/`, divisi fra `unita/` (aritmetica, motori, dati:
millisecondi) e `integrazione/` (il gioco vero dentro Chrome). Gli attrezzi
comuni sono in `test/aiuto/`. C'è un `test/README.md` che spiega com'è fatto
e le regole imparate rompendo qualcosa.
