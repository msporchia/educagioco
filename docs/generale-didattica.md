[← torna al README](../README.md) · [il gioco](generale.md) · [dove siamo](generale_improvements.md) · [le mappe](mappe.md)

# Il Generale — come si insegna

Questo file non dice *cosa* c'è nel gioco né *cosa manca*: dice **con quali
regole si giudica se un livello insegna qualcosa**. Serve quando si scrive
una campagna nuova, quando si decide dove mettere un concetto, e soprattutto
quando un livello «funziona» ma alla prova dei fatti non lascia niente.

Gli altri tre parlano d'altro: [`generale.md`](generale.md) racconta il gioco
a chi arriva da fuori, [`generale_improvements.md`](generale_improvements.md)
è lo stato del motore, [`campagne-generale.md`](campagne-generale.md) e
[`storie-generale.md`](storie-generale.md) sono progetti di contenuto scritti
prima di questa messa a fuoco, e oggi spenti. Dove divergono da qui, vale
qui.

---

## 0. L'ambito: cosa insegna, e cosa no

Il Generale insegna **flusso di controllo e coordinamento**: sequenza,
decisione, ciclo, evento, sottoprogramma, e il fatto che più cose girano
insieme senza sapere l'una dell'altra. A sei-otto anni è la metà più
trasferibile del mestiere.

Non insegna **aritmetica** — quella è del castello, e mescolarle
significherebbe far fallire un piano giusto per un conto sbagliato. Non
insegna **i dati**: niente variabili, niente liste, niente nomi scelti dal
bambino (le azioni si chiamano «azione 1», perché a sei anni una tastiera in
mezzo al pensiero è un pensiero interrotto).

> Tre variabili però ci sono già, e non si chiamano così: **lo zaino** (un
> booleano che ti porti addosso — `hai la chiave`), **il segnale sentito**
> (una bandierina che resta alzata), **il totem** (un intero con soglia,
> visibile sul campo). Il giorno che si vorranno insegnare davvero, la mossa
> non è aggiungere `x = x + 1`: è **rendere nominabile lo stato che c'è
> già**.

---

## 1. Il piano si firma prima

È il principio da cui discendono tutti gli altri. La differenza fra
*risolvere un problema* e *scrivere un programma* è che il programma deve
funzionare su una situazione che non hai visto quando l'hai scritto. Un gioco
che ti fa risolvere *quella* stanza insegna a risolvere; il Generale ci prova
sul serio, e le **scene** sono il modo in cui quella tesi diventa meccanica
invece che retorica.

Da qui vengono tre conseguenze che si dimenticano facilmente.

### 1.1 Si mostra il dominio, non il valore

Un bambino che vede l'orco davanti a sé non ha nessun motivo di scrivere un
piano generale: la situazione ce l'ha sotto gli occhi, e generalizzare
sembra una cortesia verso il gioco. Quello che deve vedere non è «l'orco è
qui», è **«l'orco è in uno di questi quattro punti»** — cioè lo spazio degli
ingressi, non l'ingresso.

Il dato esiste già: i segnaposto sono nella mappa (`o1`…`o4` nel giro delle
mura), le varianti li riempiono, il livello sa già dove l'orco *può* stare.
Mancava solo disegnarlo. Le posizioni possibili si vedono da subito, in
ombra; quella vera compare quando una delle tue unità lo vede davvero.

Questo ripara anche una contraddizione: `mostraNemici: true` oggi mostra al
giocatore un nemico che le sue unità non hanno mai visto, ed è l'unica cosa
nel Generale che violi «nessuno è onnisciente».

E regala una cosa che il testo non sa fare: **se un'ombra sparisce quando una
tua unità guarda quel punto e lo trova vuoto, la deduzione diventa visibile.**
«Due strade» esiste per far ragionare così — *sapere che l'orco non è qui
dice dov'è* — e oggi quel ragionamento va fatto tutto in testa.

Quattro ombre uguali si leggono però come «ci sono quattro orchi»: tratteggio,
opacità e una riga che dica *uno* di questi non sono rifinitura, sono la
differenza fra chiarire e confondere.

### 1.1b Un problema, non un'abitudine

Il controllo che smaschera i livelli finti: **la mossa giusta si può ricavare
senza guardare la situazione?** Se sì, quel livello non dà un problema, dà
un'euristica di prudenza — *prendi tutto quello che trovi*, *apri tutte le
porte*, *manda avanti tutti*. Si vince sempre, e non si è ragionato mai.

È diverso dal §8 (la mossa goffa che vince): lì il difetto è nelle scene, qui
è più a monte — **manca ciò che permetterebbe di decidere**. Un livello che
chiede di prendere una chiave che *forse* servirà, dato a chi non ha ancora il
bivio e non vede dove il tesoro può finire, non sta insegnando a prevedere: sta
insegnando a cautelarsi. E la cautela è proprio l'abitudine che i livelli dopo
devono smontare, perché lì «faccio tutto comunque» è la mossa che deve perdere.

Le due cose che trasformano una cautela in una decisione sono quelle del §1.1 e
del §3: **vedere il dominio** (dove la cosa *può* essere) e **avere il
costrutto per scegliere**. Finché mancano tutte e due, quel livello non va in
fila — e ne abbiamo tolto uno per questo.

### 1.2 Si dice cosa cambia, **prima** di firmare

La convenzione esiste già, ma in prosa e a memoria: «da che parte prova
**cambia a ogni battaglia**», «quante tacche gli servano **cambia a ogni
battaglia**». `cosaCambia()` c'è pure, e si legge nel cartello *fra una scena
e l'altra* — cioè dopo che il piano per la prima è già stato scritto.

Va promossa da frase a **dato**, in un posto fisso dello schermo accanto
all'obiettivo, col numero di situazioni. Un bambino impara a cercare una riga
che sta sempre lì; una frase in mezzo a un racconto no.

### 1.3 In esecuzione si può mostrare tutto

Sembra in contraddizione col punto 1.1 e non lo è. **Premuto ▶ non si
interviene**: quello che il giocatore vede mentre la scena gira non gli serve
più a decidere, gli serve a capire perché il suo piano è caduto. Il
non-intervento è ciò che rende sicuro il feedback totale.

Il confine è quello che il registro traccia già: **si mostrano i fatti
(`siVede`), mai le intenzioni (`penso`)**. «SBAM» sopra la porta sfondata sì;
«sto andando dalla principessa» sopra l'orco no — quello va dedotto, ed è il
livello.

---

## 2. Due assi, e non si muovono insieme

Un livello è difficile lungo due assi indipendenti:

- il **vocabolario** — cosa puoi dire (verbi, blocchi, domande);
- il **mondo** — quali regole valgono (la chiave, le venti spallate, la vista
  a cammino, chi accorre al rumore, le grate senza maniglia, il segnale che
  scivola addosso a chi è occupato).

Il tutorial finora li ha fatti crescere in coppia — ogni livello un costrutto
*e* una regola nuova — ed è il motivo per cui l'ottavo pesa tanto: introduce
una struttura del linguaggio e almeno tre regole del mondo.

> **La regola: un livello muove un asse solo.**
> Il primo livello di una campagna muove il vocabolario e tiene il mondo
> fermo. I livelli di consolidamento tengono il vocabolario fermo e muovono
> il mondo, una regola per volta.

Il guadagno è doppio. Le regole del mondo trovano il posto in cui non fanno
rumore — arrivano quando il costrutto è già capito — e i livelli di
consolidamento smettono di essere ripetizione: *lo stesso ciclo, ma la porta
si può sfondare*; *lo stesso ciclo, ma il nemico accorre al rumore*.

C'è anche un'asimmetria che conviene sfruttare: **i costrutti si esauriscono,
le regole del mondo no.** Un ciclo, imparato, è imparato. «Il rumore sposta
chi lo sente» produce situazioni nuove all'infinito con la stessa grammatica.

---

## 3. L'ordine dei concetti lo decide la difficoltà, non la storia

Il tutorial di oggi va: sequenza → **ciclo con uscita** → **due agenti e un
segnale** → **decisione** → rumore. È l'ordine in cui i concetti *servono*
nel mondo, non quello in cui si imparano.

Il bivio è più semplice del ciclo, e il ciclo è enormemente più semplice di
due processi che si sincronizzano. E c'è un argomento che il gioco ha già in
casa: il vocabolario dice che `aspetta che [...]` non è una parola nuova
perché «la domanda è la stessa con cui si sceglie una strada in un bivio». Lo
stesso vale per `smetti quando`. **Se il bivio viene prima, l'uscita del
ciclo è la domanda di ieri messa in un posto nuovo** — un concetto per volta
invece di due.

La fila che ne esce: `un ordine → la sequenza → la decisione → il ciclo →
il segnale → il rumore`.

Sulla concorrenza: resta, ed è il pezzo per cui il gioco vale. Ma la regola
sottile — **un segnale scivola addosso a chi è occupato** — produce il
fallimento più difficile da diagnosticare che il motore sappia generare, e va
tenuta d'occhio ogni volta che un livello ci si appoggia.

---

## 4. Come è fatta una campagna

**Il primo livello acquisisce, gli altri consolidano interlacciando.**

Due livelli identici di fila allenano l'esecuzione di un costrutto già in
mano. Il costo vero non è eseguire un ciclo: è **guardare una situazione e
capire che forma ha**. In una fila a blocchi quel passo è gratis — sai già
che il capitolo è «il ciclo», quindi non stai scegliendo, stai applicando.
Mescolando (`if in for`, `for in if`, `if in for`, `evento con if`, …) la
prima domanda torna a essere *«che problema è questo?»*.

> **Il corollario scomodo.** Interlacciare fa peggiorare le prestazioni
> mentre si impara: più errori, più tentativi, più lento. Regge solo alla
> distanza. Perciò (a) il primo incontro con un pattern resta in blocco, e
> non entra nel mescolamento finché non è stato risolto una volta da solo;
> (b) **il costo di un fallimento diventa il fattore limitante** — i
> fallimenti visibili e le onomatopee non sono un abbellimento, sono ciò che
> rende sostenibile questa struttura.

**C'è un tetto alla lunghezza di un piano.** Il tutorial sta fra uno e quattro
ordini; un livello di consolidamento ne chiede di più, perché mescola — ma
oltre gli **otto** la fila non ci sta in uno schermo verticale, e un piano da
dodici distribuito su due unità non si corregge: si riscrive. Il carico vero
non è il costrutto, è **quanto piano bisogna tenere in testa insieme** per
capire dove si è rotto. Un livello che sfonda quel tetto quasi sempre sta
chiedendo due lezioni invece di una, e va spezzato in due — che è anche il
modo di guadagnare un livello di drill invece di perderne uno.

**La lunghezza segue quanto un costrutto si combina**, non una quota fissa.
`vai/prendi/apri` si combinano poco, e i primi livelli insegnano più
l'interfaccia che la programmazione: due o tre bastano. Il bivio e il ciclo
si combinano con tutto. I segnali sono i più ricchi, perché aggiungono un
secondo attore.

**La combinatoria si progetta sugli annidamenti, non sulle coppie di verbi.**
Ma prima bisogna sapere **cosa il linguaggio permette di annidare**, e la
regola è più stretta di quanto sembri: `piano.js` rifiuta un blocco dentro un
altro blocco **in tutte e due le direzioni** — dentro il ramo di un bivio non
va né un bivio né un ciclo, e dentro un ciclo nemmeno. Dentro un'azione
invece ci vanno, ed è il motivo per cui le azioni esistono.

Le forme si dividono quindi in due gruppi, e **non appartengono alla stessa
campagna**:

| scrivibile così com'è | cosa insegna |
|---|---|
| `if` dopo `for` | quello che hai trovato decide cosa fare dopo |
| due `for` in fila | due ricerche, una dopo l'altra |
| `for` con dentro un segnale | la ronda che dice dov'è libero |
| `if` dentro un ascolto | reagisci, ma non sempre allo stesso modo |

| passa per `esegui` | cosa insegna |
|---|---|
| `if` dentro `for` | decidi a ogni giro — il piano diventa un comportamento |
| `for` dentro `if` | fai il giro solo se serve |
| `if` dentro `if` | una seconda scelta in un secondo momento |

> **La seconda tabella non è materia della campagna del ciclo.** Chiede tre
> cose insieme — il ciclo, la decisione e il sottoprogramma — e viola il §2.
> È materia di una campagna sua, dove `esegui` si acquisisce da solo: e il
> livello che la apre è proprio quello in cui **due strutture non si
> annidano**, perché è così che un sottoprogramma va introdotto — dal bisogno,
> non dal programma di studi. È un errore che abbiamo fatto davvero,
> assegnando «if dentro for» come primo livello di consolidamento del ciclo.

**La sequenza non deve essere leggibile.** Se ogni terzo livello è un ciclo,
si è tornati ai blocchi con più passi. Il pattern nuovo torna presto, poi si
allontana — la logica di `store/srs.js`, applicata ai costrutti.

> Ma **non è l'SRS**, e non va generata a runtime: una parola si ripassa
> identica, un livello no. Risolto una volta, la soluzione te la ricordi.
> Qui non si ripassa l'item, si ripassa la *classe* dell'item — serve un
> livello diverso che chieda lo stesso pattern. Roba da scrivere a mano.

---

## 5. I due esercizi simmetrici

Servono tutti e due, e sono l'uno il rovescio dell'altro:

- **stessa struttura, facce diverse** → insegna che il concetto astrae. Se
  `apri` è sempre la stessa porta marrone, non sai se ha imparato «le cose in
  mezzo si aprono» o «il rettangolo marrone vuole quel verbo». Un cancello,
  una botola, un sarcofago, una cassa: stessa `Porta`, pittore diverso, e la
  risposta te la dà lui premendo ▶ senza esitare — o esitando.
- **stessa faccia, strutture diverse** → insegna a leggere la situazione
  invece di ricordare la ricetta. Oggi non c'è affatto, e mancandogli si apre
  il difetto classico del genere: **il bambino impara a riconoscere le mappe,
  non i problemi.** Se la stanza a due corridoi vuol dire sempre «bivio»,
  diventa bravissimo a indovinare cosa vuole il livello.

> **La faccia varia quanto vuoi, il comportamento no.** Se il baule si apre
> *un po' diversamente* dalla porta, non stai insegnando l'astrazione: stai
> insegnando che ogni cosa ha le sue regole, cioè l'opposto. E una cosa che
> si comporta davvero in modo diverso dev'essere riconoscibile *di
> categoria* — come la grata a comando, che non ha maniglia.

Il secondo esercizio ha anche un vantaggio economico, vedi §8.

---

## 6. Le regole del mondo: scelta sì, divieto no

Una regola merita un livello se genera **un compromesso**; se genera solo un
divieto, va dentro un altro livello come attrito.

- «Le grate non hanno maniglia» è un divieto: si impara in tre secondi
  sbattendoci contro, e non merita spazio proprio.
- «Si può sfondare senza chiave, ma si sente» è una scelta, ed è la prima
  volta che il gioco chiede *cosa puoi permetterti* invece di *qual è l'unico
  piano che regge*. Vale una campagna: una volta imparata, ogni livello dopo
  può chiedere **dove** fare rumore, che è una domanda diversa ogni volta.

---

## 7. Il feedback si vede, non si legge

Il registro è ottimo e resta. Ma è testo dietro un tasto, e il pubblico ha
sei anni: metà del giro di correzione è, di fatto, non disponibile.

- **I fallimenti diventano vignette sul campo**, nell'istante in cui
  succedono, con lo stesso meccanismo dei segnali (`vignette`,
  `DURATA_VIGNETTA` in `CampoLivello.vue`, oggi alimentato solo da
  `mondo.allarmi`). «Ho le mani occupate», «non so dove sono: prima devo
  trovarli», «non si apre così» *sono* la lezione, e oggi vivono in un
  pannello che nessuno apre.
  Con la regola del §1.3: `penso` per i tuoi, **`siVede` per gli altri** — se
  no il gioco regala il piano nemico, che è esattamente ciò che i livelli
  della deduzione esistono per non fare.
- **Il rumore ha una geometria, e va disegnata.** Si propaga *in linea
  d'aria* (`messaggi/rumore.js`): un'onda circolare è la verità esatta, non
  un'approssimazione. E siccome la vista invece è a cammino, un cerchio che
  **attraversa i muri** mentre lo sguardo ci gira intorno mostra a occhio la
  regola più controintuitiva del gioco — due sensi, due geometrie — che oggi
  vive solo nei commenti.
- **L'onomatopea è un'identità.** GNIIK e CLACK sopra due grate rendono
  visibile una distinzione che oggi esiste solo nel testo del registro
  (`cigolio` e `scatto` hanno lo stesso raggio e differiscono per nome,
  emoji e colore). Da dettaglio da spiegare a fatto osservabile — e
  nominabile nel piano. Tre canali ridondanti: forma, colore, parola.
- **L'intensità è la grandezza, non un'icona.** Un SBAM grosso e un gniik
  piccolo si leggono senza legenda; «🔊 con due archetti» è un simbolo in più
  da imparare. E l'onda dice la cosa che serve davvero, che non è *quanto è
  forte* ma **chi lo sente**.
- **Le ripetizioni si contano, non si ripetono.** Venti spallate non fanno
  venti fumetti: ne fanno uno che pulsa e porta il conto — la regola che il
  registro applica già alle righe uguali (`prima.n++`).

---

## 8. Niente par: vale quello che regge, non quello che è corto

Il par fa **due mestieri diversi**, e solo uno serve:

1. **premia lo stile** — da quando `prendi` e `apri` camminano da soli, la
   lunghezza di un piano è più una conseguenza del vocabolario che una misura
   di comprensione. Non insegna niente, e attira il code golf;
2. **impedisce la vittoria per forza bruta** — senza, «premi il totem venti
   volte» vince a pieni voti e il ciclo diventa facoltativo.

Ma il secondo mestiere **lo fanno già le varianti, e meglio**: i tre tocchi
contati a mano non hanno bisogno del par per essere puniti, perdono da soli
nella scena da cinque tacche.

> **Ogni volta che, tolto il par, vince anche la soluzione goffa, il difetto
> è una scena che manca — non un punteggio che manca.** La mossa goffa si
> scrive fra le `fragile`, e il banco pretende che perda.

Perciò il par non si toglie in un colpo: prima si passano i livelli chiedendo
«quale mossa stupida vince qui se non conto gli ordini?», e ognuna diventa una
`fragile` con la sua scena. Poi il campo sparisce senza aprire buchi.

Al suo posto, come segnale di qualità, quello che il velo di vittoria già
dice: **«il tuo piano ha retto in N situazioni diverse»** — la cosa vera del
gioco, invece di una cosa di stile. Se servono tre stelle: vinta / senza
aiuti pagati e senza caduti / con un costrutto invece che a mano
(`avanzato` è già calcolato). E se l'eleganza dispiace perderla del tutto,
si mostra **dopo** la vittoria — «si poteva anche dire così» — che la insegna
senza tassarla.

---

## 9. I prerequisiti valgono se aprono più di una strada

Se le campagne restano in fila, «sbloccato dal prerequisito» e «il livello
dopo» sono la stessa cosa con più codice sotto. Il guadagno arriva con un
**tronco e dei rami**: dopo i fondamentali, due strade aperte insieme — per
esempio *cercare* (il ciclo) e *farsi dire* (i segnali), che sono due
risposte alla stessa regola —, poi livelli di confluenza che le chiedono
entrambe. Un bambino bloccato ha una strada laterale invece di un muro, e
l'ordine fra due concetti pari lo sceglie lui.

Sulla forma del dato: il livello dichiara **i concetti, non i livelli** —
`insegna: 'ciclo'`, `chiede: ['bivio', 'segnale']` — e lo sblocco si deriva
dal grafo. Un livello nuovo si infila in mezzo senza riscrivere la fila.

---

## 10. L'economia: la scena è il moltiplicatore, non la stanza

Quattro o cinque campagne da cinque livelli sono venti-venticinque stanze, e
non si disegnano. Ma `metti:` sui segnaposto fa quattro situazioni al costo
di quattro righe, e **una stanza già vista con scene nuove insegna quasi
quanto una stanza nuova** — con un vantaggio pedagogico in più: la stanza
nota abbassa il carico e lascia l'attenzione sul costrutto. È anche il modo
in cui si realizza il secondo esercizio del §5.

---

## 11. Le reti che tengono in piedi tutto questo

Il banco già gioca le soluzioni di tutti i livelli su tutte le scene. Quello
che va aggiunto discende dai principi di sopra:

- **ogni mossa goffa plausibile sta fra le `fragile` e deve perdere** (§8) —
  è ciò che sostituisce il par;
- **ogni livello che insegna una struttura dichiara `verifiche: { nonInFila:
  true }`.** È la rete che il banco standard **non** tira: srotola le
  strutture — i due rami di un bivio messi in fila, il corpo di un ciclo
  eseguito una volta, i «quando senti» che partono subito, le attese che
  spariscono — e pretende che quel piano perda almeno una scena. Senza,
  un livello può essere **verde e non insegnare niente**: succede appena
  «faccio tutto senza scegliere» vince lo stesso, ed è capitato davvero
  scrivendo la campagna della scelta, dove un livello si lasciava vincere
  prendendo tutte e due le chiavi invece di guardare quale servisse. Se un
  livello non lo passa, non si toglie il controllo: si cambia la mappa
  finché la struttura torna necessaria;
  > **`nonInFila` è cieco ai cicli**, ed è una lacuna nota del banco: la sua
  > `srotola` ricorsa dentro i «quando senti» e dentro i rami di un bivio, ma
  > **non** dentro `ripeti.corpo` né dentro `routine.corpo`. Su un livello di
  > solo ciclo non ha niente da srotolare e non morde. Finché non è riparata,
  > lì la rete equivalente è **esplicita**: due `fragile` scritte a mano che
  > rappresentano il piano senza la struttura — *il giro di un punto solo* e
  > *la fila di mete contate a mano* — e devono perdere. Si legge nel file
  > invece di essere calcolata, che per un livello è anche meglio;
- **ogni `chiede` dev'essere stato `insegna`-to prima nel grafo**, e ogni
  soluzione dichiarata deve usare solo costrutti già disponibili (§9). Oggi
  un livello che chiede troppo presto si scopre solo giocandolo;
- **la griglia dei pattern**: stampare quale forma sta in quale posizione
  della fila fa vedere a colpo d'occhio i due uguali di fila, il pattern
  insegnato e mai più richiesto, e il buco lungo dove un costrutto sparisce
  per dodici livelli (§4). Oggi quell'informazione esiste solo nei commenti
  in testa ai file.

---

## 12. Cosa abbiamo scartato, e perché

- **Il nemico fuori campo** («arriverà un orco») come modo di insegnare la
  generalizzazione: toglie anche il dominio e lascia solo la nebbia, cioè
  niente su cui ragionare prima di firmare. Resta buono per una lezione
  diversa — quando l'incertezza è sul **quando** invece che sul **dove**.
- **L'icona del volume** per l'intensità del rumore: un simbolo in più da
  spiegare dove basta una grandezza che si vede (§7).
- **«Nominare la cosa invece di puntare la casella»** come lezione di un
  livello. Sembra il cuore dell'astrazione ed è **indimostrabile in questo
  gioco**: da quando `prendi` e `apri` camminano da soli, `prendi [il tesoro]`
  lo insegue dovunque sia, e una fila di mete esplicite non è più una
  tentazione per nessuno. Provato giocandolo: nel piano sbagliato il `vai
  [8,1]` si può togliere — o sostituire con una cella a caso — **senza
  cambiare l'esito di una sola scena**, perché a farlo cadere è la chiave che
  non ha preso, non la casella che ha puntato. È lo stesso motivo per cui «La
  fortezza» è uscita dal tutorial, e ci siamo ricascati scrivendo la campagna
  delle prime parole: il livello è stato riscritto sulla lezione che dimostra
  davvero (*si prende la chiave anche quando sembra non servire*).
  **La regola generale che ne esce: una soluzione `fragile` deve cadere per la
  ragione che il livello dichiara.** Se cade per un'altra, il banco resta
  verde e il livello mente. Il modo di accorgersene è giocare la `fragile`
  privata dell'ordine che dovrebbe essere decisivo: se perde lo stesso, la
  lezione è un'altra.
- **Un livello per ogni coppia di verbi**: tanto lavoro, poca lezione. La
  griglia degli annidamenti è finita e copre lo stesso spazio (§4).
- **L'ordine dei concetti dettato dal mondo**: era la fila attuale del
  tutorial, e metteva il ciclo prima della domanda che gli serve per uscire
  (§3).
- **L'aritmetica dentro il Generale**: è del castello. Qui un piano giusto
  fallirebbe per un conto sbagliato, e la lezione non si distinguerebbe più
  dall'errore.

---

## 13. Cosa ne segue, e non è ancora fatto

Non è un piano di lavoro — quello sta in
[`generale_improvements.md`](generale_improvements.md) — ma queste sono le
conseguenze dirette, e vale la pena averle scritte accanto al principio che
le chiede:

- **le facce dei congegni salgono di priorità**: `CampoLivello.vue` costruisce
  la scena da `m.porte` e `m.oggetti` e non guarda mai `m.cose`, e il pittore
  del totem non esiste (§5.7 dello stato). Finché la faccia era decoro era un
  difetto cosmetico; col §5 diventa un buco nell'insegnamento;
- **i raggi dei segnali vanno rimisurati** sulla dimensione vera delle
  stanze: la scala è 5 / 20 / 30 / 40 su mappe da 13×7, quindi la manopola
  che nel codice ha quattro tacche in gioco ne ha due — *solo chi è addosso*
  e *tutti*. Perché «dosare il rumore» sia una scelta vera (§6) serve almeno
  la tacca di mezzo: il rumore che arriva a metà mappa.
  Metà della manopola è stata **ricollegata** (`allestimento.js` copiava dal
  segnale di un livello solo `{ nome, em, col }`, e il `voce` dichiarato si
  perdeva: ora c'è). Resta l'altra metà, ed è peggiore: **`segnaleDi`
  (`mondo.js`, riga 66) è `vocabolario[k] || ilSegnale(k)` — o l'uno o
  l'altro, mai fusi.** Un livello che ridichiara un segnale della tabella
  globale per dargli nome ed emoji suoi perde tutto il resto, e succede già:
  la terza prova del tutorial dichiara `fracasso` senza `voce`, e il suo
  fracasso vale **20 invece di 40** — misurato. È il livello delle venti
  spallate al portone, cioè quello in cui il rumore deve arrivare lontano, e
  la finestra per accorrere è più stretta di quanto il livello creda. Da
  fondere in `segnaleDi` (`{ ...ilSegnale(k), ...quello che il livello
  dichiara }`) e **omettendo le chiavi non dichiarate**, se no un `em:
  undefined` cancella l'emoji buona. Non è un cambio di bilanciamento: i 20
  di oggi non sono la scelta di nessuno, sono l'effetto del difetto;
- ~~**le opzioni di un'unità o di una cosa non le controlla nessuno**~~ —
  **fatto**: `scrivi.js` ha ora l'elenco delle opzioni che ogni genere
  capisce (`OPZIONI`) e rifiuta le altre all'import, col suggerimento. Il
  prezzo è che quell'elenco va tenuto allineato al motore, ed è quello
  giusto: una chiave tolta di là e lasciata di qua torna a passare in
  silenzio, ma tolta da tutte e due fa **esplodere** i livelli che la usano
  ancora, cioè dice subito chi va aggiornato. Il testo di prima resta perché
  spiega il difetto che ha reso la rete necessaria:
  `livello()` rifiuta le chiavi sconosciute *del livello* col suggerimento
  («`obiettivi` non è un campo — forse intendevi `vince`?»), ma
  `chi.orco({ accorre: 'richiamo' })` passa liscio e **non fa niente, in
  silenzio**. È così che la sesta prova del tutorial è rimasta rotta per
  settimane: `accorre` non è più letta da nessuno da quando chi corre al
  rumore si dichiara con `reagisce`, e il livello che insegna «il rumore
  sposta chi lo sente» era l'unico in cui il rumore non spostava niente. Un
  refuso come `vede: 4` invece di `vista: 4` fa la stessa fine, e il livello
  finisce tarato a occhio su un nemico cieco. Il controllo va messo dove sta
  già quello dei campi — all'import, con l'elenco di quello che il motore
  legge davvero.
  Finché non c'è, il surrogato costa dieci righe e funziona: **si estraggono
  le chiavi passate alle fabbriche nei livelli nuovi e si sottraggono quelle
  dei livelli già provati**; quello che resta sono poche candidate, e si
  guardano una per una. Con un'avvertenza che va detta, perché ci si casca:
  **cercare `d.chiave` nel motore dà falsi negativi** — `fa`, `parte`,
  `schiera` non compaiono mai in quella forma, sono destrutturate in una riga
  sola di `campo.js`, e a naso sembrerebbero morte come `accorre`. La
  differenza fra le due situazioni la vede solo chi apre il file: `accorre`
  non compare **da nessuna parte** se non nei commenti che ne raccontano la
  rimozione;
- ~~**una soluzione dichiarata dev'essere scrivibile con la cassetta che il
  livello offre**~~ — **fatto**: il banco non ricostruisce la cassetta, la
  chiede al motore (`verbiPer`), che è lo stesso elenco che l'editor mette a
  schermo. Così prende anche i casi che un confronto con `liv.verbi` si
  perderebbe: il verbo tolto perché nessun complemento lo accetta, quello che
  quell'unità non sa fare, quello di segnale quando è rimasta sola in campo.
  Il testo di prima resta qui perché spiega perché serviva: il banco valida
  gli ordini contro il motore (`guaiDi`),
  non contro `verbi:` — quindi un livello poteva dichiarare una soluzione che
  usa un verbo che non mette in cassetta, ed è successo davvero (un `aspetta
  che` in un livello che offriva cinque verbi senza quello). Il confronto è
  di tre righe e va aggiunto ai controlli standard;
- ~~**`srotola` va fatta ricorsare dentro `ripeti.corpo` e `routine.corpo`**~~
  — **fatto**, e ha subito trovato quello che cercava. Un ciclo srotolato è
  «il corpo una volta sola», una chiamata è «il corpo dell'azione al posto
  della chiamata»: da lì `giro/4` ha potuto dichiarare `nonInFila` (passa), e
  `azioni/1-la-ronda-che-decide` **non lo passa** — srotolato vince tutte e
  quattro le scene, cioè la struttura che quel livello esiste per insegnare
  non serve a vincerlo. È fuori da `LIVELLI` finché non è ridisegnato, e il
  perché sta in testa al suo file. È il quarto caso di «verde e non insegna»,
  e il primo trovato da una rete invece che a mano;
- **il rifiuto di una porta non porta con sé il suo `motivo`.** Chi prova ad
  aprire senza chiave si sente rispondere la frase giusta — «*la dispensa è
  chiusa a chiave, e la chiave non ce l'ho*» — ma quella voce della traccia
  **non ha il campo `motivo`**: ce l'ha solo la riga dopo, quella generica
  della strada chiusa. Chi legge la traccia dal di fuori non riesce quindi ad
  attribuire il fallimento alla porta, e la rete che pretende «di ogni
  fallimento si sa la ragione» resta cieca proprio sul caso più didattico che
  c'è (tre livelli lo sbattono in faccia oggi: «La chiave e il portone», «Il
  richiamo», e ogni capitolo che apra qualcosa a chiave). Vale doppio col §7:
  il giorno che i fallimenti diventano vignette sul campo, la vignetta si
  attacca al fatto che ha un motivo — e questa non ne ha uno;
- **due controlli del banco erano rimasti indietro rispetto al motore**, e
  sono stati riallineati invece che aggirati: `posa` mancava dal vocabolario
  concordato (`BASI` in `test/unita/generale.test.mjs`) e veniva segnalato
  come verbo non concordato benché il gioco lo insegni in un capitolo suo; e
  «ogni verbo dichiara i tipi che accetta» pretendeva un elenco anche da
  `aspetta`, che per costruzione non punta a una cosa ma a una **domanda**
  (`vuoleCond`). La regola vale ancora per tutti quelli che a una cosa ci
  puntano davvero. Vale la pena dirlo qui perché è la specie di guasto che si
  ripresenta a ogni verbo nuovo: **un test che elenca il vocabolario invecchia
  ogni volta che il vocabolario cresce**;
- **il par si toglie dopo aver irrobustito le scene**, non prima (§8);
- **`insegna:` / `chiede:`** sono il dato da cui discendono sblocchi, reti e
  griglia (§9, §11).
