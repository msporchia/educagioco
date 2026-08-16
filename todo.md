# Dove siamo e cosa manca

Stato al **16 agosto 2026**. Si gioca da `dist/index.html`, e i test sono **96**
(78 di unità, 18 nel browser), tutti verdi.

**Qui dentro c'è solo quello che manca.** Quello che è stato fatto lo racconta
`git log`, che è il posto giusto per raccontarlo: una voce chiusa esce da questo
file, se no in tre giorni non si distingue più il lavoro dal diario.

---

## I quiz

La coda è vuota: tutti i moduli previsti sono in `src/quiz/moduli/`, i problemi
a parole compresi.

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

## Il vocabolario del Generale: una cosa sola

**`sa` è una lista di permessi, e dovrebbe essere di divieti.** Oggi un'unità che non elenca `suona` è muta per omissione, e nei
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

### B. Le cose: passare, rompere — **3 campagne**
- **Non si può passare una cosa a un compagno** (fondi, torre). L'obiettivo
  dichiarato del primo capitolo della torre — «la chiave in mano a Marta» — è
  **inesprimibile**, mimato con due posizioni.
- **Non si può rompere** (fondi): «il tamburo sfondato» è diventato «portato via».
- **Un'unità non può cominciare con qualcosa in mano** (fondi): i fili
  `eredita`/`lascia` restano parole nei commenti.
- **Una condizione non può guardare una cosa, solo un'unità** (fondi): le
  falene chiedono `non vedi [Tilde]` invece di `non vedi [la lanterna]` — il
  piano leggibile dice una cosa diversa dal racconto.

### C. Attaccare — **3 campagne**
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
`grida` non distingue chi ha visto.

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

Restano due cose, e **stanno tutte e due di là dai livelli spenti**
(`src/data/livelli/todo/`, formato vecchio, mai provati da nessuno): si toccano
quando quei capitoli si riaccendono, non prima.

1. **Le dritte lunghe.** Su `torre-5` la dritta è di dieci righe e dice
   esattamente cosa fare: non è un indizio, è la risposta — e gli aiuti a
   pagamento (⭐) diventano inutili. Va accorciata a una riga, e quello che dice
   adesso va spostato in `aiuti`. Nei livelli vivi la dritta più lunga è di 108
   caratteri, quindi il debito è tutto lì.
2. **Le figure non nominate.** I pittori che mancavano adesso ci sono (`falena`,
   `topo`, i personaggi variabili in taglia, spalle, tinta ed elmo), ma nei
   livelli spenti Marta la sarta è ancora dichiarata come un mago e le falene
   come goblin. A un bambino che deve distinguere quattro dei suoi a colpo
   d'occhio, la figura è metà del gioco.

---

## Cosa resta, in ordine

1. **I capitoli da riscrivere coi verbi nuovi** — la lanterna dei Fondi che si
   posa, il tamburo del nido che si sfonda, l'obiettivo «o l'uno o l'altro» che
   adesso si scrive. Il motore e il formato ci sono già; sono i livelli a
   parlare ancora la lingua di prima.
2. **Quattro righe in `src/data/livelli/scrivi.js`**, l'unico posto rimasto
   fuori: `resistenza` fra le `OPZIONI` di un oggetto e di un congegno, `quale`
   fra quelle di un ordine, e le due scorciatoie `se.rotto(x)` e
   `se.oppure(...)`/`se.entrambe(...)`. Senza, un livello scrive il dato per
   esteso (funziona: i test lo fanno) ma `controllaOpzioni` rifiuta
   `resistenza` scritto in una fabbrica.
3. **L'interfaccia dei verbi nuovi**: `quale` non è ancora componibile a
   schermo, e la domanda `rotto` compare in elenco solo dove c'è qualcosa di
   rompibile.
4. **`sa` da girare in lista di divieti**, così `suona` non va dichiarato ogni
   volta (vedi la sezione sul vocabolario).
5. **Da tarare giocando, non a tavolino**: `VOLTE_STATUE` (la nona tappa del
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
- **`scappa`** esiste nel formato delle mappe (`strumenti/mappe/nucleo.js`) ma
  **non nel motore**: o si aggiunge o si toglie dalla tabella. (`posa` era
  nella stessa riga, ed era un falso allarme: c'è in tutti e due, e adesso ha
  anche il suo test.)

---

## Le storie di «Prima e dopo» sono fatte di emoji, e non dovrebbero

**Deciso il 16 agosto: si disegnano — e lo stesso giorno sono dodici.** Il
prototipo (tre storie) è stato guardato e approvato, e il cassetto si è
allargato: **12 storie disegnate su 50, 42 scene, 8 luoghi, 38 cose, 3
persone**. Cosa c'è e cosa manca sta in fondo a questa sezione; qui resta il
perché, che è la parte che non va persa.

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

### Cosa c'è

**Dodici storie disegnate**, distribuite in modo che ogni categoria che ne ha
almeno una ne abbia **almeno due** — sotto quel numero i distrattori della
stessa famiglia non bastano e il quesito ripiega sulle emoji (`unita/prima-dopo`
lo controlla):

- **causa-effetto (6)** — il ginocchio sbucciato · il vaso rotto e detto · dal
  fango alla doccia · il gelato caduto · il litigio che finisce bene · esce
  senza giacca.
- **routine (2)** — la mattina (dalla sveglia alla scuola) · la sera (fino al
  sonno).
- **crescita (2)** — si pianta il seme · il gattino diventa grande.
- **cucina (2)** — la torta di compleanno · la spremuta d'arancia.

**Sei storie a emoji sono uscite**, tutte per lo stesso motivo: erano
abitudini travestite da nessi, o file di oggetti che stanno insieme. `doccia`
(🚿 🧴 👕 — il sapone non viene *dopo* la doccia, viene dentro), `mattina`,
`sera`, `girasole` (che diceva la stessa cosa di `seme-albero` senza nessuno
dentro), `torta-compleanno`. Le altre della stessa specie — `vestirsi`,
`lavarsi-mani` — restano finché non si disegnano.

Quello che ha guadagnato il gioco non è il numero: è che adesso ci sono storie
**su persone**. Due bambini che si contendono un orsetto e finiscono per
giocarci insieme è una fila di quattro vignette in cui l'unica cosa che cambia,
fra la prima e l'ultima, sono le facce.

I file: `dati/scene.js` (le schede, dato puro), `scena/persone.js` (bimba,
bimbo, grande per `corpo.js`), `scena/cose.js` (quattro luoghi e le cose),
`scena/tela.js` (il disegno e la telecamera), `viste/Passo.vue` (l'unico posto
che sa che esistono due specie di vignetta). Il motore non se n'è accorto:
`passi` resta un array di stringhe, e una stringa che è il nome di una scena si
disegna invece di stamparsi.

Due cose imparate disegnando, che valgono per il seguito:

- **La faccia è tutta l'informazione, quindi va inquadrata stretta.** Il primo
  giro metteva la figura intera in mezzo al paesaggio: a settanta pixel — la
  larghezza vera di una vignetta su un telefono — la faccia era quattro pixel,
  cioè si era buttata via proprio la cosa per cui si smetteva di usare le emoji.
  Da lì `inquadra: { zoom, x, y }` nella scheda.
- **I distrattori vanno tenuti nella stessa famiglia** (`disegnata: true`, e
  `motore/quesito.js` filtra): un'emoji in mezzo a tre vignette disegnate si
  riconosce per come è fatta invece che per quello che racconta.

### Cosa manca

- **Trentotto storie sono ancora a emoji**, e tre categorie non ne hanno
  nemmeno una disegnata: **trasformazione**, **costruzione**, **viaggio**. Sono
  anche le tre dove le forzature restano (🥣 per l'impasto del pane, 🏰 per il
  castello di sabbia).
- **Il cassetto sa disegnare quello che serviva a queste dodici**: otto luoghi
  (prato, cortile, salotto, cameretta, cucina, bagno, orto, aula), tre persone e
  trentotto cose. Un viaggio vuole un treno e una valigia, una costruzione vuole
  mattoni e attrezzi: quelli non ci sono.
- **Nessun test guarda i pixel**, come per tutto il resto: la prova è
  `npm run storie`, che mette le strisce in fila per un occhio umano (e
  `-- --host` per guardarle dal telefono, che è la taglia che conta). I
  controlli a freddo — scene esistenti, storie disegnate per intero, nessuna
  scena orfana, nessun quesito misto — sono in `unita/prima-dopo`.
- **Non c'è un test di integrazione** per questo gioco, né prima né adesso.
- **Le altre abitudini travestite da nessi** (`vestirsi`, `lavarsi-mani`) si
  potano quando si disegnano, non prima, o il gioco si accorcia.
- **Una terza regola imparata allargando il cassetto**: due vignette della
  stessa storia devono cambiare **massa**, non dettaglio. Tre passi con lo
  stesso bambino allo stesso tavolo (la spremuta) si distinguevano solo da un
  bicchiere di otto pixel; è servito togliere il tavolo all'ultimo passo e
  raddoppiare il bicchiere. Vale come criterio di composizione quanto
  l'inquadratura stretta.

---

## Il sotterraneo

**È un gioco vero**, in `src/giochi/sotterraneo/`, dietro «i giochi in
prova». Sei discese, le domande vere dai moduli di quiz, l'avanzamento in
`campagne.js`, i traguardi nel manifesto; `unita/sotterraneo` gioca le sei
tappe col giocatore finto e conta le domande, `integrazione/sotterraneo` lo
tocca col dito. La pagina per chi arriva da fuori è
[`docs/sotterraneo.md`](docs/sotterraneo.md); i due prototipi restano in
`poc/` e sono ancora il posto dove provare un'idea prima di metterla nel
gioco.

Il porting ha agganciato per la prima volta i due motori che stavano lì
senza nessuno che li usasse — `grafica/atlante.js` (posare uno sprite: il
piede, lo specchio, i bordi netti) e `grafica/tessere.js` (quale pezzo va in
una cella) — più `motore/passi.js` per lo spazio percorribile. Da quel giro
è nato anche `viaVerso()` in `passi.js`: `accanto()` sceglie la cella più
comoda in linea d'aria, che non è sempre una a cui si arriva, e il gioco
diceva «di là non si passa» a tocchi perfettamente possibili.

### Cosa manca ancora

- **Da guardare in mano a un bambino**, che è l'unica prova che conta per
  questi tre numeri: quanto sono più lenti i mostri (3,1 celle al secondo
  contro 5,4) e i tre secondi di calma dopo una fuga — decidono se una
  stanza fa paura o fa arrabbiare; e quante stanze per piano (si comincia da
  quattro e si arriva a sedici).
- **Il suono**, che qui dentro c'è appena: un colpo, un passo, una moneta.
  Nel prototipo non c'era per niente e nel gioco è arrivato il minimo.
- **Le armature stonano.** 0x72 equipaggia solo le mani: panciotto, corazza
  e manto restano emoji in mezzo a uno schermo disegnato a mano. O si trova
  un set che le ha, o si disegnano, o si toglie la casella «addosso» e la
  difesa passa da qualcos'altro.
- **Cosa resta fra una discesa e l'altra.** Per ora niente, ed è scritto
  perché in `dati/campagna.js`: dentro una discesa l'equipaggiamento scende
  con te, fra una e l'altra si riparte nudi. Se un giorno lo si vuole
  persistente, serve un'economia — dove si ripara, cosa si rivende — e
  quella è un altro gioco.

---

## Da guardare col dito, dopo una build

Cose fatte e provate dai test, che però **nessuno ha ancora giocato**: sono
gesti e comportamenti, e i gesti si giudicano toccandoli.

- **La camminata della fattoria** — il cane che aggira la casa invece di
  attraversarla, e chi si accosta quando sulla meta non si può stare.
- **La mappa del Generale che si trascina mentre si mira** — sotto la soglia
  mira, sopra trascina; in mira la soglia è più larga (16 invece di 9) perché
  mirare col dito trema.
- **Il sotterraneo tutto intero** — è nuovo e non l'ha ancora giocato
  nessuno: il tocco che manda a camminare, il dito tenuto premuto che fa
  inseguire, il pizzico dello zoom, e soprattutto i mostri che vengono
  addosso (vedi sopra, i tre numeri).
- **Il castello con le resistenze** — un terzo di danno contro la famiglia
  sbagliata è misurato sul modello, ma «si sente o no» lo dice solo giocarlo.
- **Gli asteroidi col cielo più fitto** — la caduta è fissa a 10 secondi e a
  salire di livello arrivano più sassi invece che più veloci.
- **Le domande che si incatenano** — la causa vera del «non va avanti» era
  l'istanza di `Domanda.vue` riusata fra una domanda e l'altra, e adesso il
  componente si azzera da sé. Restano da sentire col dito i 320 ms di
  finestra cieca: sono la differenza fra un tocco fantasma ingoiato e un
  tasto che sembra lento, e la misura giusta la dice solo un dito vero.
  Riguarda sotterraneo, Dungeon, Corsa e Survivors insieme.
- **Lo scontro del sotterraneo, adesso al centro** — era un foglio che
  saliva dal basso mentre si camminava, cioè compariva dove non si stava
  guardando, e per non lasciarlo sopra l'eroe la telecamera si spostava da
  sola. Ora è una modale in mezzo allo schermo e la scena resta ferma.
  **Non l'ho vista a schermo**: per fotografarla serve incontrare un
  mostro, e pilotare l'esplorazione dall'esterno non ci è riuscito
  (~400 tocchi in tre tentativi, mai un incontro). È la prima cosa da
  guardare aprendo il gioco — e vale la pena guardare anche *quanto ci
  mette* un incontro a capitare, perché quel dato lì è sospetto.

---

## Quello che vale più di tutto il resto

**Giocarlo con i miei due.** In mezz'ora di prova erano usciti: l'osso
disegnato come una chiave, Bombo che non faceva la guardia, i segnali che non si
potevano cambiare, `vai a` con 211 celle in elenco. Nessun test li avrebbe
presi — e le tre cose trovate stamattina guardando quattro schermate lo
confermano.

E infatti tutto quello che segue viene da lì.

---

# Il quaderno del 16 agosto

Appunti presi **giocando**, ordinati per gioco e con dentro il perché. Quello
che è stato chiuso il 16 agosto è uscito da qui: resta il perché delle regole
nuove, dove serve a chi arriva dopo.

## Le icone: la regola c'è, il cassetto no

La regola applicata è che **se non esiste un'icona perfettamente aderente non
si mette un'icona, si mette il testo** — perché il vocabolario delle emoji è
chiuso, e per «mese» non ci si chiedeva come si rappresenta un mese, ci si
chiedeva quale emoji ci assomigliasse di più. Insieme: due icone della stessa
**famiglia visiva** non compaiono mai nella stessa domanda.

**Quello che manca è il cassetto dei concetti disegnati** col pittore che già
abbiamo, insieme a *Prima e dopo*. Non 481 disegni — solo quello che l'emoji
non sa dire: tempo, ora, minuto, settimana, mese, anno, le facce, i verbi.
Finché non c'è, quelle parole restano senza figura.

Da riguardare se a schermo danno fastidio: le metafore convenzionali lasciate
apposta (`famiglia` 🏡, `amico` 🤝, `cantante` 🎤, `parco` 🎠, `gara` 🏁,
`gioco` 🎮). Non sono sbagliate, sono figurate.

## Prima e dopo: le emoji non reggono, e si disegna

Le storie fatte di emoji sono una forzatura — stesso difetto delle icone, in
grande: si sceglie il passo che l'emoji sa dire invece di quello che la storia
chiede. Si passa al **pittore**: meno storie, ma vere, disegnate. È lo stesso
cassetto di concetti di cui sopra, e conviene pagarlo una volta per due giochi.

**Fatto il prototipo lo stesso giorno**: tre storie disegnate, il gioco intorno
non ha dovuto cambiare. Il conto per esteso sta più sopra, in «Il prototipo:
cosa c'è». Il cassetto però è ancora quello di *questo* gioco
(`src/giochi/prima-dopo/scena/`): se le figure servono anche alle icone del
lessico, il passo è spostare `scena/persone.js` in `grafica/personaggi/` — un
import, non una riscrittura.

## Gli asteroidi

**La banda va via.** Il blocco `.bersaglio` sotto la barra è una seconda barra
che dice quello che la prima dovrebbe già dire. Sparisce, e l'avanzamento sale
nella `Barra`. Per far posto si sacrificano **i punti** e **il livello**: i
punti si leggono a fine partita, il livello si legge dallo scafo. E anche **le
vite** lasciano il gettone dei cuori e diventano **lo stato dello scafo** —
la nave ammaccata *è* l'informazione, e non serve dirla due volte.

**Il pianeta in basso va via.** Non fa niente, e una cosa in scena che non fa
niente in un gioco per bambini è una domanda senza risposta.

**I potenziamenti diventano gettoni che tieni tu.** Scudo e cannone doppio non
si capiscono e non aiutano abbastanza. Al loro posto due poteri che si
**guadagnano giocando** — un filotto vale un gettone, anche a metà tappa, non
solo alla fine — e che **compaiono a destra con la loro icona**, in attesa che
sia tu a premerli:

- **il gelo** ❄️ — rallenta tutto per una decina di secondi;
- **l'aiuto** — cancella una risposta sbagliata.

Sono riutilizzabili, si accumulano, e soprattutto sono una *scelta*: il momento
in cui li spendi è tuo.

**Pianeti e stazioni diventano una campagna sola** — è il pezzo grosso. Tabelline e calcolo a mente sono due facce della stessa moneta
e oggi viaggiano su due mappe separate: si fondono in **una scaletta ordinata
per difficoltà vera**. Chi vuole solo le tabelline spegne il calcolo a mente
dalla pagina dei grandi. Oltre a semplificare, allarga di molto il ventaglio
delle domande possibili.

## Le code lasciate dai lavori del 16 agosto

Piccole, e nessuna urgente — ma sono decisioni sospese, non dimenticanze.

- **Il castello: leggere il nastro paga meno di prima.** Col danno doppio,
  sapere in anticipo dava un vantaggio immediato; con la resistenza il
  vantaggio è non ammucchiare tutto su un tipo solo, che è una lezione e non
  una mossa. Se si vuole che il preavviso renda *anche* subito serve un'altra
  leva — per esempio spostare una torre gratis fra un'ondata e l'altra.
- **Il Torrione resta a scalini larghi** (26 per otto ondate, poi 78, 117,
  186): viene dallo spianamento cumulativo, che con un malus costa più che con
  un bonus. La versione a un passo solo dava curve più vive ma rompeva la
  promessa «i nemici non si ammorbidiscono mai andando avanti».
- **Gli asteroidi cadono in 10 secondi fissi a ogni livello**: è la
  conseguenza voluta di «più fitti, non più veloci», ed è un cambio di
  sensazione grosso.
- **`settings.tables` è rimasto nel profilo e non lo legge più nessuno**: si
  toglie quando si tocca `store/profile.js`.
- **La quota 0,8 vale anche per le stazioni a mente**, che nessuno ha ancora
  giocato con quel numero.
- **Nella fattoria spostare una bestia è gratis** (posare un oggetto no):
  farsi pagare uno spostamento che l'animale disfa da sé camminando sarebbe
  una beffa. Se lo si vuole a pagamento è una riga.
- **Il bosco è salvato cella per cella**, quindi il salvataggio cresce col
  mondo (~400 voci dopo sei acquisti). Regge; se un giorno si comprano decine
  di piazzole conviene generarlo al volo e salvare solo gli sgomberi.
- **I sei cibi vanno a capo 5+1** sul telefono: leggibile, un filo irregolare.

*Ritirato:* lo spawn casuale di animali in fattoria. Non sta insieme al fatto
che gli animali restano dove li metti.

## Il giro che manca

Tre lavori, e i primi due si contendono lo stesso file:

1. **La barra e i gettoni degli asteroidi** — via la banda e il pianeta, le
   vite sullo scafo, il gelo e l'aiuto a gettone.
2. **La fusione di pianeti e stazioni** in una scaletta per difficoltà vera.
3. **Il cassetto dei concetti disegnati**, che serve alle icone del lessico e
   a *Prima e dopo* insieme. — *cominciato*: il cassetto di «Prima e dopo» c'è
   e regge tre storie; per il lessico va promosso a `src/grafica/` e allargato
   ai concetti che l'emoji non sa dire (tempo, ora, mese, i verbi).
