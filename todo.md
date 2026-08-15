# Dove siamo e cosa manca

Stato all'**8 agosto 2026**. Si gioca da `dist/index.html`, e i test sono **37**
(22 di unità, 15 nel browser).

Due fronti aperti, e non si toccano: **i quiz** (le domande che tutti i giochi
pescano) e **il generale**, che è il grosso di questo file.

---

## I quiz

### Arrivati adesso

- **🧩 Logica** — cinque classi sulla differenza fra quello che segue di sicuro
  e quello che non si può sapere: tutti/nessuno, i confronti in fila, **la
  regola girata** («tutti i grufoli hanno le ali, Bibo ha le ali, è un
  grufolo?» → non si può sapere), se… allora nelle quattro combinazioni, le
  catene. Creature inventate apposta: con «tutti i cani abbaiano» il bambino
  risponde con quello che sa dei cani, e avrebbe ragione.
- **➡️ Sequenze** — «cosa viene dopo» e «chi non c'entra», dai due prototipi
  `poc/indovinelli.html` e `poc/la-regola.html`. Portata anche la ricetta che
  rende l'intrusa **una sola**: il rumore 2+2, i fermi 4+0, e solo la regola
  3+1 — poi contato, non sperato.
- **🔗 Analogie** — «A sta a B come C sta a ?», di cose (🧥→🐑) e di figure
  (una diventa due). Le coppie dichiarano le risposte **anche difendibili**
  (il pinguino vive sul ghiaccio ma nuota) e quelle non finiscono fra i falsi.
- **📐 Geometria, grado 6: i cubetti.** I solidi sono sei e i loro conti si
  imparano a memoria: sopra ci sono le costruzioni da contare coi cubetti
  nascosti, quanti ne mancano per riempire la scatola, e **quale ritaglio
  piegato fa un cubo** — dove quali si chiudono non sta scritto da nessuna
  parte, si piega davvero (verificato contro il fatto noto: gli sviluppi del
  cubo sono 11).
- **📅 Calendario** — via «quando comincia la primavera», che era memoria di
  date; al suo posto la stagione di un mese intero e il giro delle stagioni,
  e le date da indovinare stanno lontane dal cambio di stagione.

### Da portare, in ordine

1. **Indizi** — le due famiglie rimaste in `poc/indovinelli.html`, che sono la
   stessa macchina su due mondi: la **deduzione** («non è rossa · è grande ·
   non ce n'è una sola» → ne resta una) e l'**indovinello** («sono giallo ·
   cresco sull'albero · la scimmia mi adora»). Riusano gli attributi e i
   pittori già in casa (`grafica/pittori/figure.js`), quindi costano poco. Del
   prototipo va portata soprattutto la forza bruta che garantisce che **nessun
   indizio sia inutile**: l'indizio decorativo è quello che fa perdere fiducia.

### Deciso di NON portare, e perché

- **spaziale** (poliomini girati) — `geometria` grado 4 lo fa già, e meglio: i
  pezzi sono filtrati perché le otto orientazioni siano tutte diverse.
- **percorsi** — `griglia` copre già mosse e percorsi.
- **memoria** (quattro figure, due secondi, poi coperte) — non entra nella
  forma di una domanda: vuole due tempi. Semmai è una meccanica di gioco.
- **lo scienziato** di `poc/la-regola.html` (costruisci figure, chiedi alla
  macchina, poi dimostra di aver capito) — è un gioco a più mosse: se si fa,
  va in `src/giochi/`, non in `src/quiz/`.
- **`poc/compagno.html`** — non è un quiz: è un tamagotchi che si nutre di
  ripasso. Le parole inglesi che usa sono già in `LinguaGame`.

---

## Il generale — da dove si riparte

Le **26 mappe su 26** ci sono tutte, e `unita/livelli` le gioca davvero su tre
scene ciascuna: 2203 controlli, zero guasti su 40 livelli. Ogni capitolo ha una
soluzione elegante dentro il par e almeno una `fragile` che deve **cadere** su
una scena — se vince sempre non dimostra niente.

L'**editor degli ordini** è quello nuovo (il posto vuoto è il tasto, la riga è
l'editor, niente cassetta fissa) e il megafile è spezzato in otto pezzi, con
`generale/piano.js` senza Vue né schermo — provato da `unita/piano-generale` in
zero secondi invece che con Chrome.

Non c'è altro da annotare qui sotto: quello che segue è **solo quello che
manca**.

---

## Il vocabolario: chiuso, ma non come era scritto qui

`aspetta finché [cond]` **non si è fatto**, e la strada presa è migliore: invece
di un verbo solo con un dizionario di condizioni, il motore adesso distingue
**da cosa si ascolta**. `aspetta` guarda il MONDO e aspetta che cambi (un
attimo, una porta), e funziona solo su quello che l'unità vede da dov'è;
`quando senti` riceve un MESSAGGIO, e funziona a distanza proprio perché non
stai guardando. È la regola dell'onniscienza vista dall'altro lato: quello che
vedi lo puoi aspettare, quello che non vedi te lo deve dire qualcuno.

Fatto anche: **i segnali li dichiara il livello** (`segnali: ['ora','aiuto',…]`,
e `ilSegnale()` cade su un default per i nomi nuovi). Il convertitore non serve
più: i livelli parlano già la lingua di adesso.

Resta una cosa sola di questa sezione: **`sa` è una lista di permessi, non di
divieti**. Oggi un'unità che non elenca `suona` è muta per omissione, e nei
livelli si vede (`sa: ['vai']`, `sa: ['vai','prendi','apri']`). Parlare non è un
talento come scassinare una serratura: la lista dovrebbe dire chi **non** può.

---

## Gli attriti: cosa hanno sbattuto contro quattro campagne

Ogni agente ha annotato ogni volta che ha pensato «qui mi servirebbe dire X e
non posso»: **1244 righe in `tmp/attriti-{fondi,nido,sale,torre}.md`**, con
capitolo, cosa voleva dire, come si è arrangiato e quanto è costato. Sono la
parte più preziosa del lavoro, perché non sono opinioni: sono livelli veri che
hanno dovuto piegarsi. Qui sotto per tema, con quante campagne l'hanno colpito.

### A. Aspettare e sincronizzare — **4 campagne su 4**
- **Non ci si può fermare in mezzo a un piano ad aspettare un messaggio**
  (fondi, sale, torre). Tutto quello che viene dopo va *dentro* il
  `quando senti`: da qui la fila da cinque ordini annidati di Ras nel capitolo 6.
- **Non si può dire «sono arrivato»** (fondi, sale, torre): servono sempre
  `vai` + `suona`. È la voce più frequente in assoluto.
- **Non si può aspettare che qualcuno se ne sia andato** (fondi, torre):
  `aspetta di vedere` scatta quando l'altro *compare*. Ha ucciso una stesura
  intera del capitolo 6 dei Fondi e ha fatto buttare il ruolo di Bea come occhio.
- Minori: `aspetta di vedere [fazione]` non distingue *chi* (nido); un segnale
  mandato prima che l'ascolto sia armato è **perduto** (nido); un segnale non
  porta niente con sé (torre).
- **E un contro-attrito da guardare bene**: `vai` verso una porta chiusa aspetta
  da solo per 25 battiti. Comodo, ma **toglie il bisogno del segnale** in tre
  capitoli su cinque della torre. La lezione dei segnali va difesa dal motore,
  non discesa da esso — e quel 25 è un numero invisibile su cui mezzo capitolo
  4 dei Fondi si tara.

→ Rileggere questa voce col vocabolario di adesso: `aspetta` e `quando senti`
sono stati separati proprio per questo, e alcune di queste righe potrebbero
essere già cadute. Va riprovato su un capitolo vero prima di cancellarle.

### B. Le cose: posare, passare, rompere — **3 campagne**
- **Non si può posare** (fondi). La lanterna, che è **il filo di tutta la
  storia**, nei capitoli 5 e 6 *non esiste come oggetto*: è Tilde. Il bambino
  non la vede, non la tocca, non la può nominare.
- **Non si può passare una cosa a un compagno** (fondi, torre). L'obiettivo
  dichiarato del primo capitolo della torre — «la chiave in mano a Marta» — è
  **inesprimibile**, mimato con due posizioni.
- **Non si può rompere** (fondi): «il tamburo sfondato» è diventato «portato via».
- **Un'unità non può cominciare con qualcosa in mano** (fondi): i fili
  `eredita`/`lascia` restano parole nei commenti.
- **Una condizione non può guardare una cosa, solo un'unità** (fondi): le
  falene chiedono `non vedi [Tilde]` invece di `non vedi [la lanterna]` — il
  piano leggibile dice una cosa diversa dal racconto.

→ `posa [x]` è il gemello esatto di `prendi`, costo basso, e rimette in piedi
un filo narrativo intero.

### C. Attaccare — **3 campagne**
- **`attacca` non prende le cose** (nido): il *sabotaggio* non è esprimibile.
  Il capitolo della scala è diventato una **corsa** — cioè la forma d'obiettivo
  che queste storie avevano deciso di non usare mai.
- **`attacca [fazione]` non si indirizza** (torre, sale): la guardia sceglie il
  più vicino. È costato **cinque rifacimenti** di torre-5, e un gruppo nemico
  diviso in due posti non è ripulibile da nessun piano scrivibile.
- Chi insegue alla stessa velocità non prende mai nessuno (sale).
- **`senza: ['attacca']` non si può dichiarare** (torre): la prova `senza`
  toglie ordini che *nominano* una cosa, non che usano un verbo. La regola che
  tiene insieme tutta la storia della torre è l'unica che nessun test guarda.

### D. Il tempo — **3 campagne**
Non esiste un orologio e non esiste la velocità. La *resistenza* («tieni fino
all'alba») diventa sei righe invece di una; la lentezza di Pero e del carro è
una posa raccontata, non una regola; una scadenza si tara **ridisegnando la
mappa**, non scrivendo un numero.

### E. Chi è fatto come — **3 campagne**
Nessuna nozione di taglia (il carro passa dove passa la capra: è una
convenzione, non una regola), non si può dire «di qui passa solo il topo» né
«Brasa nei cunicoli non ci passa» — il taglio dei quattro draghi vive in un
piano che non è il loro. «Dorme» non esiste: la vista è sempre accesa,
mimata con `vista: 1`.

### F. Obiettivi e sconfitta — **3 campagne**
`obiettivo` e `sconfitta` sono liste in **AND**: manca l'*oppure*. Da qui una
«lastra» che esiste per ragioni di sintassi, e un capitolo dove chi prende il
ladro non vince e non perde. `grida` non distingue chi ha visto.

### G. Le scene non toccano il piano — **4 campagne**
Le varianti spostano cose e unità, ma non possono cambiare **gli ordini del
nemico** né aggiungere o togliere unità. Le tre scene di un capitolo cambiano
quindi solo la *fase* dei giri di ronda — e la terna buona del capitolo 5 dei
Fondi è stata trovata con una spazzolata su 125 combinazioni. **Un livello così
non si disegna a occhio.**

### H. Regole di gioco non dichiarate
- **L'ordine di `unita` nell'array decide** chi colpisce per primo e chi viene
  visto per primo. È la leva più potente usata in torre-5, e sta dentro un array.
- Due fili sulla stessa unità la fanno agire **due volte per battito**.
- **Una guardia che grida e una che accorre non possono essere la stessa**: si
  trascinano a vicenda e il livello si vince da fermi.

---

## Difetti visti guardando i livelli veri

Aperti quattro finali di storia col dito, sono saltati fuori tre problemi che
nessun test prende:

1. **La dritta è diventata la soluzione.** Su `torre-5` sono **dieci righe** che
   occupano un terzo dello schermo e dicono esattamente cosa fare: «mandaci Cric
   e Nilo prima, uno davanti a ciascuna. Marta va di sopra… Pero per ultimo».
   Non è un indizio, è la risposta — e gli aiuti a pagamento (⭐) diventano
   inutili. Il campo `dritta` va accorciato a una riga in tutti i capitoli
   nuovi, e quello che c'è adesso va spostato in `aiuti`.
2. **Le figure non corrispondono ai nomi.** Marta la sarta è disegnata come un
   mago, Cric il topo come un mostriciattolo, le falene come goblin. È lo stesso
   difetto già trovato giocando con mio figlio (Bibi disegnata come un lupo, Orso
   come un cavaliere): a un bambino che deve distinguere quattro dei suoi a
   colpo d'occhio, la figura è metà del gioco.
3. **I par: metà allineati.** Nei livelli sono quelli misurati (torre-1 = 4,
   torre-4 = 7, torre-5 = 12, sale-2 = 11, sale-5 = 8) e `unita/livelli` è
   verde. In `storie-generale.js` sono rimasti quelli scritti a occhio — il
   capitolo della sbarra dice 6, il livello ne misura 11. Due numeri per la
   stessa cosa, e quello che il bambino legge è il primo.

---

## Cosa resta, in ordine

1. **Le tre voci di attrito che costano meno e rendono di più**: `posa [x]`,
   `attacca` sulle cose, l'*oppure* in `obiettivo`/`sconfitta`. Tre verbi o
   quasi, e rimettono in piedi tre capitoli che oggi raccontano una cosa e ne
   fanno un'altra.
2. **Le dritte da accorciare e i par da allineare in `storie-generale.js`.** La
   dritta di torre-5 è ancora la soluzione scritta per esteso (450 caratteri,
   un terzo di schermo), e i par di lì sono ancora quelli a occhio.
3. **`sa` da girare in lista di divieti**, così `suona` non va dichiarato ogni
   volta (vedi la sezione sul vocabolario).
4. **La grafica**, con la lista ormai completa: un pittore `falena`, un
   `tamburo` (oggi ripiegato su `campana`), i personaggi parametrizzati
   (altezza, spalle, tinta, elmo) perché una fila di guardie non sia fotocopie,
   i gatti come dettaglio d'ambiente, una posa d'attacco vera. È lavoro
   parallelo: non tocca niente di quello che sta sopra.
5. **La mappa che non si trascina mentre si sceglie un bersaglio.** Su 30×18, se
   il bersaglio è fuori campo non ci si arriva. Difetto vecchio, ancora lì.
6. **Da tarare giocando, non a tavolino**: `VOLTE_STATUE` (la nona tappa del
   dungeon, parametrica: provarla a 8, 12 e 22), e il livello finale intrecciato
   con tre o quattro unità e segnali che si incatenano, che non è mai riuscito.

### Design ancora rimandato

- **I fatti che passano fra capitoli.** `eredita`/`lascia` sono scritti nei dati
  ma non li legge nessuno. Forma decisa: non un inventario ma un **insieme di
  fatti** (`lanterna-presa`, `pozzo-aperto`) che un capitolo vinto lascia. Il
  posto nel profilo è già pronto (`storie.*.fatti`). **Se un fatto manca, il
  capitolo si adatta — non si blocca**: senza lanterna la miniera è buia, non
  chiusa.
- **Il grafo delle storie**: `richiede: [fatti]`, rami **a diamante** che
  divergono e riconvergono, non ad albero, se no il contenuto esplode.
- **PvP**: due autori umani. L'astrazione `fazioni.*.autore` non lo preclude.
- **`scappa`** e **`posa`** esistono nel formato delle mappe
  (`strumenti/mappe/nucleo.js`) ma **non nel motore** — controllato: i verbi
  sono `vai · prendi · apri · attacca · aspetta · aspetta di vedere · suona ·
  quando senti · pattuglia`. O si aggiungono o si tolgono dalla tabella.
  (`posa` è ormai il punto 1 qui sopra.)

---

## Le storie di «Prima e dopo» sono fatte di emoji, e non dovrebbero

Il 15 agosto 2026 sono state riviste tutte e 44 le storie del gioco: undici
avevano una fila che non stava in piedi (il burro fra il latte e il formaggio,
la cassetta degli attrezzi dopo il martello, l'uovo di gallina davanti al
bruco). Sistemate. Ma il lavoro per sistemarle ha reso evidente **la vera
causa**, che non è stata sistemata affatto.

Una storia, oggi, è una fila di emoji. Il che vuol dire che la storia non si
sceglie: si cerca. Si parte da cosa il set di emoji mette a disposizione e si
prova a incastrarci un prima e un dopo — e quando l'incastro non torna, o si
scarta la storia (la farfalla è stata scartata: non esiste l'emoji del bruco
nel bozzolo) o si accetta un passo che «più o meno» va bene: 🥣 per l'impasto
del pane, 🏰 per il castello di sabbia, 🧴 per lo shampoo. Il criterio è
diventato *quali emoji stanno insieme senza stonare*, che è un criterio di
inventario, non di didattica.

E il costo grosso non sono i tre passi zoppi: è **tutto quello che non si può
raccontare**. Un bambino che cade e si sbuccia il ginocchio, e poi il cerotto.
Uno che rompe qualcosa e lo dice. Uno triste che viene consolato. La sequenza
di un litigio che finisce bene. Sono esattamente le storie che a quattro anni
servono di più — causa ed effetto sulle *persone*, non sugli oggetti — e non ce
n'è nemmeno una, perché con le emoji non si disegnano.

**La strada**: le storie diventano scene disegnate, come tutto il resto del
progetto (`src/grafica/`: i pittori, `corpo.js`, le schede di dati). Un passo di
una storia sarebbe una scheda — chi c'è, che faccia fa, cosa tiene in mano —
e non una stringa di due caratteri. Il gioco è già pronto a riceverlo: `passi`
è un array opaco che il motore non guarda mai dentro, e solo `viste/Storia.vue`
lo stampa. Cambiare il contenuto dei passi non tocca né `motore/` né la
campagna.

Non è un lavoro da infilare in coda a una correzione: è il gioco rifatto nel
suo pezzo più importante. Va guardato quando c'è tempo per guardarlo bene.
Vedi anche il tetto della resa grafica, che per il castello è già stato
ribaltato una volta.

---

## Il sotterraneo, e lo spazio dove si cammina

Il prototipo è fatto e regge: `poc/sotterraneo.html` (a rettangoli) e
`poc/sotterraneo-gfx.html` (con gli sprite di **0x72 DungeonTileset II**, CC-0,
10 KB di atlante dentro il file). Lo stato del lavoro, le decisioni prese e i
numeri misurati stanno in [`poc/sotterraneo.md`](poc/sotterraneo.md), che è il
posto da leggere prima di ripartire — qui c'è solo cosa manca.

**Fatto e già in `src/`**: `src/grafica/tessere.js` sa scegliere le bordature a
**otto vicini** (l'angolo interno concavo, che a quattro vicini non si
distingue da una parete dritta), e `src/motore/passi.js` è il concetto di
**spazio percorribile** che due giochi stavano scrivendo ognuno per conto suo —
`percorso`, `raggiungibili`, `accanto`, `primaLibera`, `passiFra`. La regola è
che lo spazio arriva da fuori: si passa `buona(x, y)` e il motore non sa perché
una cella sia buona. Provati in `unita/tessere` e `unita/passi`.

### 1. Pubblicare il sotterraneo come gioco in prova

Va portato in `src/giochi/sotterraneo/` con la convenzione
(`src/giochi/CONVENZIONE.md`): `dati/` con le sue `guasti…()`, `motore/`
(livello + corsa + banco, sopra `passi.js`), `scena/tela.js`, `viste/`,
`Gioco.vue`, `stile.css`; registrazione in `indice.js` e `schermate.js`,
avanzamento via `campagne.js`, traguardi nel manifesto, `sperimentale: true`.
Più `test/unita/sotterraneo.test.mjs` che **giochi le tappe davvero** col
giocatore finto, e `docs/sotterraneo.md`.

Due cose da non dimenticare, perché sono quelle che si scordano:

- **Le domande vere.** Adesso il prototipo ha un banchetto finto di conti
  dentro il file. Nel gioco vanno prese da `domandaPerGioco({ difficolta,
  evita })` di `src/quiz/scelta.js` col componente `Domanda.vue`, come fa il
  dungeon: la difficoltà da 0 a 1 la portano la profondità del piano e il
  rincaro della stanza, e i saperi spenti in *Genitori → cosa sa* vanno
  rispettati — si degrada, non si sbarra.
- **La barra della vita sopra il personaggio**, non nella fascia in cima: in
  `scena/tela.js`, dove già si disegnano le barrette dei mostri feriti.

Quello che il prototipo **non** risponde, e che va deciso prima di pubblicare:
cosa resta fra una discesa e l'altra. Se l'equipaggiamento persiste, la
campagna diventa un'altra cosa e va pensata l'economia; se non resta, serve un
motivo diverso per riaprire il gioco domani.

### 2. La fattoria: chi cammina non attraversa le case

Oggi `Attore.muovi()` in `scena/tela.js` conosce solo `dentroMio` — dentro la
terra comprata — quindi Watson passa dentro case, fontane e staccionate. Il
catalogo però **dichiara già tutto quello che serve**: `piede` è l'ingombro
vero (e cambia col verso: `piedeDi()` risolve i giri, staccionata sdraiata
`[2,1]` contro palo in piedi `[1,2]`), e `sotto: true` distingue ciò che è
*terreno* — orto, fiori, radura — da ciò che è oggetto. Quella riga, che oggi
serve solo all'ordine di disegno, è già la risposta: **si cammina su quello che
sta sotto, non su quello che sta sopra**.

- **Un solo `calpestabile(cx, cy)`** nel motore, che mette insieme le quattro
  cose che oggi stanno in quattro posti: è terra mia, non è acqua dipinta, non
  c'è un ostacolo (ceppo, masso, tronco col suo piede), non c'è un oggetto
  solido — cioè senza `sotto: true` — con l'ingombro preso da `piedeDi(cosa)` e
  non da `v.piede`, o una staccionata girata bloccherebbe le celle sbagliate.
  Poi `libera()` e `cellaLibera()` si riscrivono sopra quello invece di
  rifare ognuna il proprio conto.
- **Gli attori camminano con `passi.js`**: `percorso()` per aggirare invece di
  andare in linea retta, `primaLibera()` per non piazzare un animale sopra una
  fontana. E il vagabondaggio esce da `scena/tela.js`, dove è **una regola
  dentro il disegno**: va nel motore, e la scena torna a disegnare e basta.
- **I test** (`unita/fattoria`): un cane non entra in casa, una staccionata
  girata blocca le celle giuste, l'acqua ferma chi cammina, una meta
  irraggiungibile non fa camminare nessuno dentro i muri. È il genere di guasto
  che si vede solo a schermo, e tardi.

---

## Quello che vale più di tutto il resto

**Giocarlo con i miei due.** In mezz'ora di prova erano usciti: l'osso
disegnato come una chiave, Bombo che non faceva la guardia, i segnali che non si
potevano cambiare, `vai a` con 211 celle in elenco. Nessun test li avrebbe
presi — e le tre cose trovate stamattina guardando quattro schermate lo
confermano.
