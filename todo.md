# Dove siamo e cosa manca

Stato al **16 agosto 2026**. Si gioca da `dist/index.html`, e i test sono **89**
(73 di unità, 16 nel browser), tutti verdi.

Due fronti aperti, e non si toccano: **i quiz** (le domande che tutti i giochi
pescano) e **il generale**, che è il grosso di questo file. Il 16 agosto sono
caduti in un giro solo: la coda dei quiz (arrivati gli **Indizi**), le tre voci
di attrito del Generale (`posa`, `attacca` sulle cose, l'*oppure*), tutta la
grafica che mancava, la mappa che non si trascinava mentre si mira, e la
camminata della fattoria. Quello che resta del Generale è quasi tutto **di là
dai livelli spenti**: riscriverli è il giro dopo.

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

Niente: la coda è vuota. **🔍 Indizi** è arrivato il 16 agosto 2026
(`src/quiz/moduli/indizi.js`), con le due famiglie del prototipo — `indizi:forme`
sulle figure di `quiz/grafica/pittori/figure.js` e `indizi:cose` sugli oggetti
del mondo — su cinque gradi che le alternano, come fa `sequenze`. La garanzia
che **nessun indizio sia inutile** non è un controllo a posteriori: `gruppiMinimi`
prova a forza bruta ogni sottoinsieme e accetta solo quello che isola una
candidata sola *e* che, tolto un indizio qualunque, torna ambiguo. Provato su
2000 domande rigiocate (`test/unita/indizi.test.mjs`, 7731 controlli).

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
scene ciascuna: 1428 controlli, zero guasti. Ogni capitolo ha una soluzione
stretta — dove ogni ordine dev'essere necessario, misura *derivata* da quando
il par è sparito — e almeno una `fragile` che deve **cadere** su una scena: se
vince sempre non dimostra niente.

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

→ **`posa [x]` è fatto** — anzi c'era già: motore, vocabolario, `Oggetto`,
formato delle mappe e `fai.posa` erano tutti a posto, e mancava solo un test
che lo giocasse (`unita/generale/posa`, che lo prova sul passamano, sulle mani
piene e sulla lanterna lasciata a terra). La riga qui sopra che lo dava per
«dichiarato nel formato ma non nel motore» era vecchia. Restano le altre
quattro voci di questa sezione.

### C. Attaccare — **3 campagne**
- ~~**`attacca` non prende le cose**~~ **fatto**: una cosa a cui il livello
  scrive addosso una `resistenza` si rompe, e quello che le succede lo sa lei
  (`Elemento.incassa`). Rotta, non si raccoglie e non si preme più; la domanda
  `rotto:` è la controparte, e sfasciare fa fracasso. Un verbo si offre solo a
  chi lo capisce, quindi `attacca` non compare dove non c'è niente da rompere.
- ~~**`attacca [fazione]` non si indirizza**~~ **fatto**: l'ordine porta un
  `quale` — `vicino` (il valore normale), `lontano`, `debole`, `forte`
  (`motore/generale/scelte.js`). È un criterio e non un nome, sta sul tronco
  comune (vale anche per `vai`), e la scelta si **pianta**: se ricalcolasse a
  ogni passo, superato il primo bersaglio il «più lontano» diventerebbe lui.
  Lì sotto c'era anche un difetto vecchio: la preda era pinnata per il colpo e
  non per il passo, e due nemici equidistanti facevano oscillare chi li
  inseguiva finché la scena non scadeva.
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
~~`obiettivo` e `sconfitta` sono liste in **AND**: manca l'*oppure*~~ —
**fatto**, e non come un campo in più: l'*oppure* è **una domanda che ne
contiene altre**, `{ cond: 'oppure', fra: [...] }` (con il suo gemello
`entrambe`, che serve a annidare). Così vale ovunque valga una domanda — la
guardia di un ciclo, i rami di un bivio, «aspetta che» — e non solo in fondo
al livello; il «non» che c'era già lo rovescia in «né … né …». Non mente su
quello che un personaggio non può sapere: risponde quando la risposta è decisa
comunque, e altrimenti ripropaga il dubbio. Nel formato delle mappe è la barra
(`finche: 'vedi:eroe|segnale:rosso'`).

Resta di questa sezione: `grida` non distingue chi ha visto.

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
   → **Misurato il 16 agosto 2026: resta vero solo nelle storie spente**
   (`src/data/livelli/todo/`, formato vecchio, mai provate da nessuno). Nei
   livelli vivi la dritta più lunga è di 108 caratteri
   (`parole/3-due-lavori`), cioè una riga: quando quei capitoli si
   riaccenderanno la dritta va riscritta comunque, ma non è debito di oggi.
2. **Le figure non corrispondono ai nomi.** Marta la sarta è disegnata come un
   mago, Cric il topo come un mostriciattolo, le falene come goblin. È lo stesso
   difetto già trovato giocando con mio figlio (Bibi disegnata come un lupo, Orso
   come un cavaliere): a un bambino che deve distinguere quattro dei suoi a
   colpo d'occhio, la figura è metà del gioco.
   → **Mezzo risolto il 16 agosto 2026**: le figure che mancavano adesso ci sono
   (`falena`, `topo`, e i personaggi che si possono variare in taglia, spalle,
   tinta ed elmo, così una fila di guardie non è più una fila di fotocopie).
   Quello che manca è **nominarle nei livelli**, e quei livelli sono spenti.
3. ~~**I par: metà allineati.**~~ **Caduto**: il 15 agosto 2026 il par è
   sparito da tutto il gioco vivo (la seconda stella la dà `daSolo()`), quindi
   non ci sono più due numeri per la stessa cosa. Il 16 agosto è stato tolto
   anche il residuo in `storie-generale.js`, dove il file dichiarava in testa
   che il par non c'era più e poi lo pretendeva lo stesso.

---

## Cosa resta, in ordine

1. ~~**Le tre voci di attrito che costano meno e rendono di più**~~ — **fatte
   nel motore e nel formato** (vedi B, C, F qui sopra), con tre test che le
   giocano: `unita/generale/posa`, `unita/generale/rompere`,
   `unita/generale/oppure`. **Quello che resta** è il giro dopo, ed è di là:
   - **riscrivere i capitoli** con i verbi nuovi — la lanterna dei Fondi che
     si posa, il tamburo del nido che si sfonda, l'obiettivo «o l'uno o
     l'altro» che adesso si scrive;
   - **quattro righe in `src/data/livelli/scrivi.js`**, che è l'unico posto
     rimasto fuori: `resistenza` fra le `OPZIONI` di un oggetto e di un
     congegno, `quale` fra quelle di un ordine, e le due scorciatoie
     `se.rotto(x)` e `se.oppure(...)`/`se.entrambe(...)`. Senza, un livello
     scrive il dato per esteso (funziona: i test lo fanno) ma
     `controllaOpzioni` rifiuta `resistenza` scritto in una fabbrica;
   - **l'interfaccia**: `quale` non è ancora componibile a schermo, e la
     domanda `rotto` compare in elenco solo dove c'è qualcosa di rompibile.
2. ~~Le dritte da accorciare e i par da allineare.~~ **Fatto quel che c'era da
   fare** (16 agosto 2026): il par era già uscito dal gioco, e in
   `storie-generale.js` ne restava solo la coda — un `premioCapitolo()` che
   leggeva `c.par` e tornava `NaN`, e un controllo che gridava «par storto» su
   tutti e ventisei i capitoli. Tolti. Sotto ci stava nascosto un guasto vero
   (`bibi/bombo` dichiarava il concetto `sincronizzazione`, che nella scala non
   esiste): corretto in `attesa`. Il motivo per cui nessuno se n'era accorto è
   che **`verificaStorie()` non lo chiamava nessuno** — adesso lo chiama
   `test/unita/storie.test.mjs`, che gira a ogni `npm test`. Le dritte lunghe
   restano solo nelle storie spente: vedi qui sopra.
3. **`sa` da girare in lista di divieti**, così `suona` non va dichiarato ogni
   volta (vedi la sezione sul vocabolario).
4. ~~**La grafica**~~ — **fatta il 16 agosto 2026**, tutta la lista.
   `personaggi/falena.js` (una `bestia()` dove `sw` muove le ali invece delle
   zampe), `personaggi/topo.js` (per Cric, che era un mostriciattolo),
   `oggetti/tamburo.js` (non più ripiegato su `campana`: se `suona` trema e
   manda archi di suono). I **personaggi parametrizzati** stanno in `corpo.js`
   e sono quattro varianti opzionali — `taglia`, `spalle`, `tinta`, `elmo` —
   tutte «1 = di serie» quando non si dichiarano: chi non chiede niente vede
   esattamente quello che vedeva prima. E c'è una posa d'attacco vera
   (`stato: 'attacca'`, un braccio solo che va e viene, contro `'lancia'` dove
   si alzano tutte e due), che funziona su qualunque personaggio con un'arma
   senza toccare il suo file. Il gatto come arredo non chiedeva codice: ha già
   `stato: 'seduto'`, ed è chi mette in scena a scriverlo.
   Si guardano con `node tmp/vetrina-nuova.mjs`.
   **Resta da fare l'aggancio**: i pittori nuovi esistono, ma nessun livello li
   nomina ancora — è nelle storie spente che Marta la sarta è un mago e le
   falene sono goblin (difetto 2 qui sopra), e i livelli si toccano quando si
   riaccendono.
5. ~~**La mappa che non si trascina mentre si sceglie un bersaglio.**~~ **Fatto**
   (16 agosto 2026, `views/generale/CampoLivello.vue`). `ditoMuovi` usciva
   subito quando `mirando` era vero: la mappa restava ferma e su 30×18 un
   bersaglio fuori campo non si poteva indicare in nessun modo. Adesso il dito
   fa una cosa sola per volta — sotto la soglia mira, sopra trascina (e allora
   l'evidenziazione si spegne e al rilascio non parte nessun ordine). In mira
   la soglia è più larga, 16 invece di 9, perché mirare col dito trema; e dove
   non c'è niente da scorrere il tocco resta buono comunque, cioè si comporta
   come prima. **Da provare col dito**: è un gesto, e i gesti si giudicano
   toccandoli.
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
- **`scappa`** esiste nel formato delle mappe (`strumenti/mappe/nucleo.js`) ma
  **non nel motore**: o si aggiunge o si toglie dalla tabella. (`posa` era
  nella stessa riga, ed era un falso allarme: c'è in tutti e due, e adesso ha
  anche il suo test.)

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

### 2. ~~La fattoria: chi cammina non attraversa le case~~ — **fatto il 16 agosto 2026**

`motore/camminata.js` (nuovo) è il `Camminatore` sopra `percorso()` e `accanto()`
di `passi.js`: si cammina cella per cella lungo la strada, e se sulla meta non si
può stare ci si **accosta** invece di restare fermi. Nel motore c'è un
`calpestabile(cx, cy)` solo, con l'ingombro preso da `piedeDi()`, e `libera()` e
`cellaLibera()` sono riscritte sopra di lui. `Attore` in `scena/tela.js` non
cammina più: legge un corpo come dato, e la scena torna a disegnare e basta.
`unita/fattoria` conta 85 controlli, fra cui la staccionata girata che blocca
`[1,2]` e non `[2,1]` e il cane che aggira una casa senza metterci mai il piede
dentro. Resta da guardare **col dito** dopo una build: il comportamento vero non
l'ha ancora visto nessuno.

Il testo di prima, per memoria:

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
