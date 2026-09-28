# Il Generale — come si insegna

Con quali regole si giudica se un livello insegna qualcosa: serve quando si
scrive un livello, quando si decide dove mettere un concetto, e quando un
livello «funziona» ma non lascia niente. I numeri dei paragrafi sono citati
dal codice (`§5`, `§1.1b`): non si rinumerano.

> **Vale per tutto il file.** Queste regole dicono quando un livello
> *insegna*, non **perché valga la pena entrarci**. Provato: i livelli
> scritti solo seguendole passavano il banco ed erano noiosi — stanzette con
> una decisione sola, la stessa missione in venti vestiti. Un livello che
> salta l'altra metà passa il banco e perde il bambino.

## 0. L'ambito

Il Generale insegna **flusso di controllo e coordinamento**: sequenza,
decisione, ciclo, evento, sottoprogramma, e più cose che girano insieme
senza sapere l'una dell'altra.

- **Niente aritmetica**: è del castello. Un piano giusto fallirebbe per un
  conto sbagliato, e la lezione non si distinguerebbe dall'errore.
- **Niente dati**: niente variabili, liste, nomi scelti dal bambino (le
  azioni si chiamano «azione 1»: a sei anni una tastiera in mezzo al
  pensiero è un pensiero interrotto).
- Tre variabili ci sono già senza chiamarsi così: **lo zaino** (un
  booleano, `hai la chiave`), **il segnale sentito** (una bandierina che
  resta alzata), **il totem** (un intero con soglia). Il giorno che si
  vorranno insegnare, la mossa è **rendere nominabile lo stato che c'è
  già**, non aggiungere `x = x + 1`.

## 1. Il piano si firma prima

Un programma deve funzionare su una situazione che non si è vista quando lo
si è scritto: è questo che distingue programmare da risolvere quella
stanza, e le **scene** sono il modo in cui la tesi diventa meccanica.

### 1.1 Si mostra il dominio, non il valore

Chi vede l'orco davanti a sé non ha motivo di generalizzare. Deve vedere
**«l'orco è in uno di questi quattro punti»**: lo spazio degli ingressi.
Il dato c'è già (i segnaposto `o1`…`o4` nella mappa, riempiti dalle
varianti). Le posizioni possibili si vedono in ombra da subito; quella vera
compare quando una tua unità lo vede. Un'ombra che sparisce quando una tua
unità guarda quel punto vuoto rende **visibile la deduzione** («sapere che
non è qui dice dov'è»). Quattro ombre uguali si leggono «quattro orchi»:
tratteggio, opacità e una riga che dica *uno di questi* sono la differenza
fra chiarire e confondere. (Stato: da fare, vedi [da-fare.md](da-fare.md).)

### 1.1b Un problema, non un'abitudine

Il controllo che smaschera i livelli finti: **la mossa giusta si ricava
senza guardare la situazione?** Se sì, il livello insegna un'euristica di
prudenza (*prendi tutto*, *apri tutte le porte*): si vince sempre e non si
ragiona mai. Diverso dal §8: lì manca una scena, qui **manca ciò che
permette di decidere**. Una cautela diventa decisione con **il dominio
visibile** (§1.1) e **il costrutto per scegliere** (§3); finché mancano
tutti e due il livello non va in fila (uno è stato tolto per questo).

### 1.2 Si dice cosa cambia, prima di firmare

Cosa cambia fra le scene è un **dato in un posto fisso**, non una frase:
sta nella riga dell'obiettivo, da fermi, dove le battaglie sono più d'una
(`cosaCambia` in `src/views/generale/scene.js`, usata in
`src/views/GeneraleGame.vue`). Il nome della variante batte qualunque
frase generata. Un bambino impara a cercare una riga che sta sempre lì.

### 1.3 In esecuzione si può mostrare tutto

Premuto ▶ non si interviene, quindi il feedback totale è sicuro: serve a
capire perché il piano è caduto, non a decidere. Il confine: **si mostrano
i fatti (`siVede`), mai le intenzioni (`penso`)** degli altri — «SBAM»
sulla porta sì, «vado dalla principessa» sopra l'orco no.

## 2. Due assi, e non si muovono insieme

Un livello è difficile lungo il **vocabolario** (cosa puoi dire) e il
**mondo** (quali regole valgono: la chiave, le spallate, la vista a
cammino, chi accorre al rumore, le grate senza maniglia, il segnale che
scivola addosso a chi è occupato).

> **Un livello muove un asse solo.** Il primo di un blocco muove il
> vocabolario a mondo fermo; quelli di consolidamento tengono fermo il
> vocabolario e muovono il mondo, una regola per volta.

Le regole del mondo arrivano quando il costrutto è già capito, e il
consolidamento smette di essere ripetizione. **I costrutti si esauriscono,
le regole del mondo no**: «il rumore sposta chi lo sente» genera situazioni
nuove all'infinito con la stessa grammatica.

## 3. L'ordine dei concetti lo decide la difficoltà

`un ordine → la sequenza → la decisione → il ciclo → il segnale → il rumore`.
Il bivio è più semplice del ciclo, e il ciclo di due processi che si
sincronizzano. **Se il bivio viene prima, l'uscita del ciclo (`smetti
quando`, `aspetta che`) è la domanda di ieri in un posto nuovo.** Provato
l'ordine dettato dal mondo (ciclo prima della decisione): metteva il ciclo
prima della domanda che gli serve per uscire.

La concorrenza è il pezzo per cui il gioco vale, ma **un segnale scivola
addosso a chi è occupato** produce il fallimento più difficile da
diagnosticare: va sorvegliato in ogni livello che ci si appoggia.

## 4. Come è fatta una fila di livelli

- **Il primo acquisisce, gli altri consolidano interlacciando.** In una
  fila a blocchi «che problema è?» è gratis; mescolando torna a essere la
  domanda. Interlacciare peggiora le prestazioni mentre si impara e rende
  alla distanza, quindi: il primo incontro con un pattern resta in blocco
  finché non è stato risolto da solo, e **il costo di un fallimento è il
  fattore limitante** — fallimenti visibili e onomatopee non sono
  abbellimento.
- **Tetto: otto ordini per piano.** Oltre non sta in uno schermo verticale,
  e un piano da dodici su due unità non si corregge, si riscrive. Chi lo
  sfonda sta chiedendo due lezioni: si spezza in due livelli.
- **La lunghezza di un blocco segue quanto il costrutto si combina**:
  `vai/prendi/apri` poco (due o tre livelli), bivio e ciclo con tutto, i
  segnali più di tutti (aggiungono un attore).
- **Si annida solo dentro un'azione.** `piano.js` rifiuta un blocco dentro
  un blocco in tutte e due le direzioni (niente bivio né ciclo nel ramo di
  un bivio o in un ciclo); dentro un'azione (`esegui`) sì. Quindi le forme
  stanno in due gruppi, e **non nello stesso blocco**:

| scrivibile così com'è | insegna |
|---|---|
| `if` dopo `for` | quello che hai trovato decide cosa fare dopo |
| due `for` in fila | due ricerche, una dopo l'altra |
| `for` con un segnale dentro | la ronda che dice dov'è libero |
| `if` dentro un ascolto | reagisci, ma non sempre uguale |

| passa per `esegui` | insegna |
|---|---|
| `if` dentro `for` | decidi a ogni giro: il piano diventa comportamento |
| `for` dentro `if` | fai il giro solo se serve |
| `if` dentro `if` | una seconda scelta in un secondo momento |

  La seconda tabella chiede ciclo, decisione e sottoprogramma insieme
  (viola il §2): è un blocco suo, aperto dal livello in cui **due strutture
  non si annidano** — il sottoprogramma si introduce dal bisogno. Provato
  «if dentro for» come primo consolidamento del ciclo: sbagliato per questo.
- **La sequenza non dev'essere leggibile**: il pattern nuovo torna presto e
  poi si allontana (la logica di `src/store/srs.js` sui costrutti). Ma non
  è l'SRS e non si genera a runtime: un livello risolto si ricorda, quindi
  si ripassa la *classe* con un livello diverso scritto a mano.

## 5. I due esercizi simmetrici

- **Stessa struttura, facce diverse** → il concetto astrae. Cancello,
  botola, sarcofago, cassa: stessa `Porta`, pittore diverso.
- **Stessa faccia, strutture diverse** → si legge la situazione invece di
  ricordare la ricetta. Senza, il bambino impara a riconoscere le mappe,
  non i problemi.

> **La faccia varia, il comportamento no.** Un baule che si apre *un po'*
> diversamente dalla porta insegna che ogni cosa ha le sue regole. Una cosa
> che si comporta davvero diversa dev'essere riconoscibile *di categoria*
> (la grata a comando non ha maniglia).

## 6. Le regole del mondo: scelta sì, divieto no

Una regola merita un livello se genera **un compromesso**; se genera solo
un divieto va dentro un altro livello come attrito. «Le grate non hanno
maniglia» si impara sbattendoci. «Si sfonda senza chiave, ma si sente» è
una scelta (*cosa puoi permetterti*) e regge una fila intera: ogni livello
dopo può chiedere **dove** fare rumore.

## 7. Il feedback si vede, non si legge

Il registro resta, ma è testo dietro un tasto e il pubblico ha sei anni.

- **I fallimenti sono vignette sul campo**, nell'istante in cui succedono,
  col meccanismo dei segnali (`vignette`, `DURATA_VIGNETTA` in
  `src/views/generale/CampoLivello.vue`). Regola del §1.3: `penso` per i
  tuoi, **`siVede` per gli altri**, se no si regala il piano nemico.
- **Il rumore ha una geometria**: si propaga *in linea d'aria*
  (`src/motore/generale/messaggi/rumore.js`), quindi un'onda circolare è la
  verità esatta. La vista è a cammino: un cerchio che attraversa i muri
  mentre lo sguardo ci gira intorno mostra a occhio due sensi, due
  geometrie.
- **L'onomatopea è un'identità**: GNIIK e CLACK distinguono `cigolio` e
  `scatto` (stesso raggio, nome, emoji e colore diversi). Tre canali
  ridondanti: forma, colore, parola.
- **L'intensità è la grandezza**, non un'icona: SBAM grosso, gniik piccolo.
  E l'onda dice la cosa che serve: **chi lo sente**.
- **Le ripetizioni si contano**: venti spallate sono un fumetto che pulsa
  col conto (la regola del registro, `prima.n++`).

Stato delle vignette dei fallimenti, dell'onda e delle onomatopee: vedi
[da-fare.md](da-fare.md).

## 8. Niente par: vale quello che regge

Il campo `par` non esiste più (livelli, barra, velo di fine, banco,
traguardi). La seconda stella è **esserci arrivati da soli** — senza la
soluzione intera svelata e senza compagni caduti (`daSolo()` in
`src/store/profile.js`); gli altri gradini dell'aiuto si pagano in monete
(`src/giochi/aiuti.js`).

Il par faceva due mestieri: premiare lo stile (inutile, attira il code
golf) e impedire la forza bruta. Il secondo lo fanno meglio le varianti: i
tre tocchi contati a mano perdono da soli nella scena da cinque tacche.

> **Se, senza contare gli ordini, vince anche la soluzione goffa, manca una
> scena, non un punteggio.** La mossa goffa si scrive fra le `fragile`, e
> il banco pretende che perda.

Quello che il par teneva onesto resta nel banco senza numeri a mano: ogni
ordine di una soluzione stretta è necessario, e una `lunga` deve costare
più della stretta più corta (`test/aiuto/livello.mjs`). Il segnale di
qualità è **«il tuo piano ha retto in N situazioni»**; l'eleganza, se
serve, si mostra dopo la vittoria («si poteva anche dire così»).

## 9. I prerequisiti valgono se aprono più di una strada

Una fila unica con prerequisiti è «il livello dopo» con più codice. Il
guadagno è **un tronco e dei rami**: dopo i fondamentali due strade aperte
insieme (*cercare* col ciclo, *farsi dire* coi segnali), poi livelli di
confluenza. Il livello dichiara **concetti, non livelli** (`insegna:
'ciclo'`, `chiede: ['bivio', 'segnale']`) e lo sblocco si deriva dal grafo.
Non esiste ancora: [da-fare.md](da-fare.md).

## 10. L'economia: la scena è il moltiplicatore

`metti:` sui segnaposto fa quattro situazioni con quattro righe, e **una
stanza già vista con scene nuove insegna quasi quanto una nuova** — con la
stanza nota che abbassa il carico. È anche il secondo esercizio del §5.

## 11. Le reti del banco

- **Ogni mossa goffa plausibile sta fra le `fragile` e perde** (§8).
- **Ogni livello che insegna una struttura dichiara `verifiche: {
  nonInFila: true }`**: il banco srotola le strutture — rami del bivio in
  fila, corpo del ciclo una volta sola, chiamata sostituita dal corpo
  dell'azione, «quando senti» che partono subito, attese che spariscono — e
  quel piano deve perdere una scena. Senza, un livello è **verde e non
  insegna niente**. Se non lo passa non si toglie il controllo: si cambia
  la mappa finché la struttura torna necessaria.
- **Una `fragile` deve cadere per la ragione che il livello dichiara.** Si
  verifica giocandola privata dell'ordine decisivo: se perde lo stesso, la
  lezione è un'altra.
- Da fare: ogni `chiede` insegnato prima nel grafo, e la griglia dei
  pattern ([da-fare.md](da-fare.md)).

## 12. Scartato, e perché

- **Il nemico fuori campo** («arriverà un orco») per insegnare a
  generalizzare: toglie anche il dominio. Buono solo se l'incertezza è sul
  **quando**, non sul **dove**.
- **L'icona del volume**: un simbolo in più dove basta la grandezza (§7).
- **«Nominare la cosa invece di puntare la casella»** come lezione:
  indimostrabile, perché `prendi` e `apri` camminano da soli verso la cosa.
  Provato: nel piano sbagliato il `vai [8,1]` si toglie senza cambiare
  l'esito di una scena — a farlo cadere è la chiave non presa.
- **Un livello per ogni coppia di verbi**: la griglia degli annidamenti
  (§4) copre lo stesso spazio con meno lavoro.
- **L'ordine dei concetti dettato dal mondo** (§3) e **l'aritmetica** (§0).
