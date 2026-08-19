[← torna al README](../README.md)

# 👨‍👩‍👧 I settaggi per i genitori

Tutto quello che segue sta dietro **un codice di quattro cifre**, che
all'inizio è `0000`.

<img src="img/genitori.png" width="230"> <img src="img/genitori-giochi.png" width="230">

Si arriva dal link *Genitori* in fondo alla schermata iniziale.

> Il codice non è sicurezza: è **un gradino contro il tocco distratto**. Chi
> vuole entrare davvero apre gli strumenti del browser. Serve a impedire che
> «cancella i progressi» finisca sotto il dito di un bambino di sette anni.
> Si cambia da lì dentro, e se lo dimentichi si rimette dall'indirizzo:
> aggiungi `#pin=1234` all'URL.

## Se un gioco non va bene

**Un interruttore per gioco.** Spento, la carta sparisce dalla home e basta:
i progressi restano dove sono, e riaccendendolo si ritrovano tutti.

La scelta è **per bambino**, non per dispositivo: si può lasciare il castello
al grande e toglierlo al piccolo.

## Se una *domanda* non va bene

Questa è la parte che uso di più, ed è la scheda **Domande**.

L'elenco non è di giochi ma di **pezzi di scuola**: i numeri, le decine, la
stima, le misure, le conversioni, le divisioni, area e perimetro, i solidi,
l'orologio a lancette, contare i giorni, i suoni difficili, le sillabe, il
significato delle parole, nomi e articoli, l'analisi grammaticale…

Ognuno si spegne, e da quel momento **quelle domande non escono più**, in
nessun gioco.

Il punto non è togliere difficoltà. È che una domanda su qualcosa che non si
è mai visto **non è difficile: è muta**. Non c'è niente da ragionare, si può
solo tirare a indovinare — e indovinare non insegna niente, anzi insegna che
il gioco è ingiusto. Se a scuola non hanno ancora fatto i litri, «quanti
centilitri sono due litri» va tolta, non affrontata.

Ogni voce dice tre cose: **cosa vuol dire saperlo**, **un esempio di domanda
vera che sparisce**, e **cosa cambia nel gioco**. Serve a poter prevedere
l'effetto prima di toccare l'interruttore.

**I gruppi si aprono in dettaglio.** «Accenti e apostrofi» sono cinque
tipologie diverse: si può spegnere tutto il gruppo, o solo l'accento tonico
lasciando l'apostrofo. Il dettaglio sta chiuso finché non lo si chiede, e
ogni voce dice da quale modulo arriva, a che grado esce e **quanto è
difficile** — 0 la prima cosa che si impara, 100 l'ultima.

## Vedere tutte le domande che esistono

La stessa scheda serve anche a una cosa che prima non si poteva fare:
**giudicare le domande**. Il tasto «prova» apre una domanda vera, ma una alla
volta e a caso — per farsi un'idea di una tipologia bisognava insistere
finché non ricapitava, senza mai sapere quante ce n'erano né a che
difficoltà stessero.

Qui ci sono tutte, un blocco per modulo dentro la sua materia, ognuna con la
sua difficoltà di fianco. È lo stesso numero con cui i giochi pescano, quindi
due materie diverse si possono confrontare: un modulo da quattro gradi e uno
da sei stanno sulla stessa scala.

Due modi di provarle, e sono due domande diverse:

- **come le vede il bambino** — si pesca a quella difficoltà come farebbe un
  gioco vero, con la stessa frequenza e gli stessi saperi spenti. Risponde a
  «cosa gli capita davvero», che dall'elenco non si deduce;
- **scorrile tutte** — il giro dell'elenco, una per una, col contatore («7 di
  37») e il tasto per tornare indietro. Risponde a «le ho viste tutte?».

Guardare non spegne niente: si spegne col ✕ sulla riga, che toglie il suo
gruppo di scuola.
Le domande spente si vedono lo stesso, sbiadite — un elenco che nasconde
quello che è spento non fa più vedere *che* è spento.

Quando si spegne qualcosa i giochi **degradano invece di sbarrare**: il
castello senza divisioni chiede moltiplicazioni più difficili, un modulo di
quiz che perde un grado scende a uno più facile invece di sparire. Nessun
gioco diventa impossibile e nessuna tappa si blocca.

## I progressi: salvarli e spostarli

I progressi stanno **solo nel browser del dispositivo su cui si gioca**. Non
c'è nessun server: nessuno li vede e nessuno li ha in copia. Il che vuol dire
che se si cancellano i dati del sito, o si cambia telefono, senza un backup
non tornano.

- **Salva su file** — scarica un `.json` con dentro tutto: monete, parole
  imparate, tappe, animali, traguardi, di **tutti** i bambini. Consiglio di
  farlo la prima sera e poi ogni tanto.
- **Rimetti da un file** — lo rilegge e sostituisce i progressi.

Sono anche il modo di **passare i progressi da un dispositivo a un altro**:
salva sul vecchio, apri i giochi sul nuovo, rimetti il file. Funziona anche
fra telefono e computer.

> [!WARNING]
> I progressi sono legati all'**indirizzo** da cui si aprono i giochi. Se
> cambi indirizzo — perché lo servi da un tuo server, o passi dal file
> scaricato al sito — il browser li considera due posti diversi e riparte da
> zero. In quel caso servono salva e rimetti.

- **Cancella i progressi** di chi sta giocando: chiede conferma, e non si
  torna indietro.

## Chi gioca

La schermata parla di **chi sta giocando adesso** — come tutto il resto:
i giochi, i saperi, le domande e l'età sono suoi e di nessun altro. Quindi
qui c'è la sua carta e basta; gli altri bambini sono una riga di nomi, e si
passa a loro dalla home, che è dove si è sempre fatto.

Ognuno ha i suoi progressi, completamente separati: il fratello che gioca
dopo non trova le monete dell'altro. Cambiare nome tocca solo l'etichetta —
i progressi non si spostano di un byte.

**Aggiungere un bambino** apre la stessa schermata del primo avvio: nome,
faccia, e quanti anni ha. Alla fine tocca a lui giocare — si aggiunge
qualcuno perché vuole giocare adesso, non per lasciarlo in una lista.

### Quanti anni ha

È **la taratura, non un'anagrafe**: nessuno chiede una data di nascita, e il
numero non si vede da nessuna parte mentre si gioca. Decide due cose, e le
decide tutte e due in continuo:

- **quali giochi trova in home** — la bancarella non compare prima dei sei
  anni, il laboratorio delle pozioni prima dei sette e mezzo, e i due giochi
  dei piccoli («Conta gli animali», «Prima e dopo») smettono di essere
  offerti fra i sette e mezzo e gli otto;
- **quanto sono difficili le domande** — ogni classe di domande dichiara a
  che età serve, e da lì si pesca.

La manopola si sposta di mezzo anno per volta, e **sotto dice cosa fa**. Sei
riquadri, tutti uguali: si toccano in qualunque punto e si aprono.

- **In casa** — tutti i giochi, con scritto di fianco a ognuno *c'è*,
  *l'ha già passato*, *arriva più avanti* o *l'hai spento tu*.
- **Dà per scontato che sappia** — le cose su cui le domande poggiano. È
  l'elenco da leggere: appena ci trovi dentro qualcosa che tuo figlio non sa,
  sei salito troppo.
- **Le domande**, in quattro gruppi — *le sa fare ma le ripassa*, *sta
  studiando queste*, *difficili ma fattibili*, *non gliele chiediamo più*.

Ogni riga ha un **▶**: apre la domanda vera, quella che il gioco gli darebbe.
Un titolo come «le analogie fra figure» non dice che aspetto abbia la
domanda, e senza vederla non si può giudicare. Provarla non cambia niente e
non lascia traccia.

Non c'è niente da immaginare: si muove una tacca e si guarda cosa si sposta.

Muoverla dentro la stessa fascia di scuola non tocca nient'altro: quello che
hai spento o ritoccato a mano resta dov'è. Quando invece la tacca cambia
fascia, giochi e saperi ripartono da come sono di partenza a quell'età — e se
avevi sistemato qualcosa a mano te lo dice **prima**, con scritto cosa stai
per perdere. Monete, animali, campagne e traguardi non si toccano mai.

Alla primissima apertura, quando non c'è ancora nessuno, l'app chiede
direttamente *«come ti chiami?»* senza codice: chiedere un PIN che nessuno ha
ancora scelto renderebbe l'app impossibile da aprire.

## Le due cose in fondo

- **Giochi in prova** — un unico interruttore che rivela i giochi che sto
  ancora scrivendo. Spento (com'è di partenza) quei giochi **non esistono**
  per chi gioca. Dietro lo stesso interruttore c'è anche **la cameretta**,
  che non è un gioco a metà ma una cosa che si sta togliendo: il posto dove
  si spendono le monete adesso è la fattoria, e averne due voleva dire che
  nessuno dei due si riempiva. Accendendolo la cameretta torna esattamente
  com'era — animali, oggetti e scaffali sono ancora nel profilo, non è stato
  cancellato niente.
- **Apri tutte le tappe** — toglie i lucchetti a tutte le campagne di tutti
  i giochi. Serve per far provare a un fratello più grande un gioco appena
  cominciato, o per guardare com'è fatta una tappa avanti.
