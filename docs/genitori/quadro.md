# Il quadro dell'età

Quello che compare sotto la manopola: cosa trova in casa un bambino di
quell'età e dove cadono le domande rispetto a lui. Il dato è
`src/data/quadro.js` (puro, `test/unita/quadro`); la forma è
`src/components/eta/Blocco.vue` e `Riga.vue`.

## I blocchi

**Tutti della stessa forma** — titolo, quanti sono, cosa vuol dire,
l'assaggio — e si aprono toccandoli in qualunque punto. Un blocco vuoto non
si mostra. La forma sta in due componenti e non in copie scritte a mano:
le copie finiscono diverse senza che nessuno l'abbia deciso.

1. **In casa** — tutti i giochi col loro stato: *c'è* · *l'ha già passato*
   · *arriva più avanti* · *l'hai spento tu* (`QUI`, `PASSATO`, `AVANTI`,
   `SPENTO`; `giochiDiUnEta`).
2. **Le domande**, nei livelli di padronanza rispetto a *questo* bambino
   (nomi in `src/components/eta/gruppi.js`, gli stessi che usa la tacca):
   *queste le sa fare* · *sta imparando queste* · *difficili, ma ce la può
   fare* · *superfluo chiedergliele*. Le impossibili non si mostrano: non
   gli arrivano. La scala è **quella che esiste già** (`FASCE_ETA` in
   `src/quiz/nucleo/catalogo.js`), non una seconda.
3. **Non ancora spiegate** — l'ultimo, e non è una fascia di difficoltà: i
   pezzi di scuola spenti dall'età o da un grande. Una riga spenta sta sotto
   **il gruppo che l'ha spenta** (anche una sottovoce, `geo:viste`), e un
   pezzo spento senza domande resta lo stesso, se no non ci sarebbe un posto
   da cui riaccenderlo.

Un pezzo di scuola che un gioco `chiede:` e nessuna domanda cita non ha un
blocco dove cadere: resta **appeso al gioco** (`chiedeQui`), con la sua
tacca a tre posizioni ([ritocchi.md](ritocchi.md)). Una riga sola per
chiave: due tacche sulla stessa voce del profilo, con due scale, sono il
difetto che i blocchi uguali sono nati per non fare.

## Pezzi di scuola e domande, a due livelli

Dentro un blocco ci sono i **pezzi di scuola**; aperto un pezzo, le sue
domande di quella fascia, ognuna **con l'età a cui serve** — la sola cosa che
un grande sa giudicare guardandola. A otto anni «sta imparando» sono
cinquantasette domande in venti pezzi: tutte insieme sarebbero un muro.

- **Lo stesso pezzo può stare in due blocchi**, ed è il punto: le figure
  piane sono roba saputa per due domande e tosta per una terza.
- **L'unità è una sola, le domande raggruppate per pezzo di scuola.**
  Provato un blocco «dà per scontato che sappia» fatto di gruppi accanto a
  blocchi fatti di classi: due unità per la stessa roba, e nessuna diceva
  l'altra.
- **Il gruppo di una domanda è il più specifico che dichiara** (la stessa
  regola di `src/quiz/catalogo.js`): una conversione di pesi sta sotto
  «Metri, litri e chili», non sotto «Le conversioni». Il grande ha in mente
  quasi sempre il più stretto.

## Il ▶ non pesca mai fuori

A riga chiusa i tasti sono due, ✎ e ▶. Il ▶ di una domanda apre quella; il
▶ di un pezzo di scuola **scorre le sue domande di quella fascia** (`giro`
di `src/quiz/Prova.vue`), col contatore («7 di 37»), e nient'altro. Se
pescasse nel gruppo intero, il ▶ di «sta imparando» aprirebbe anche le
toste: il riquadro direbbe una cosa e il tasto ne aprirebbe un'altra.

In fondo a ogni blocco delle domande, «▶ pescane una come farebbe un gioco»
pesca con la stessa campana e gli stessi saperi spenti di una partita:
l'elenco dice cosa esiste, non quanto spesso esce.

## Quello che dà per scontato che sappia (`sa`)

`saperiDiUnEta` elenca i pezzi di scuola dati per scontato, **i più recenti
per primi**: un elenco che comincia da «i numeri e le quantità» direbbe la
stessa cosa a quattro anni e a undici, uno che comincia da «le divisioni»
dice a che punto siamo. Un gruppo compare solo se ha almeno una domanda
**dentro la finestra**: uno con zero domande sotto il tetto dell'età non dà
per scontato niente, si sta solo tenendo acceso un interruttore che non
tocca nulla. **Si taglia solo il tetto, mai il fondo**: sotto la finestra un
sapere è dato per scontato più che mai, è sopra che non lo è ancora. Un
gruppo che vive solo dentro un gioco (le divisioni del castello) resta
comunque, anche senza domande proprie: è l'unica riga che spiega perché quel
gioco chiede quello che chiede.

## Se nessun gioco le chiede, niente elenco

Se in casa non c'è nessun gioco che passi da `src/quiz/`, i blocchi delle
domande non ci sono: al loro posto una riga sola che dice da quando
arrivano («arrivano a 6 anni, con Survivors e il sotterraneo»).
Da quattro a cinque anni e mezzo è così, e un elenco lì si leggerebbe come
«ecco cosa gli chiederemo». Chi le chiede lo dichiara nel manifesto con
**`quiz: true`** — non «fa domande» (le fa anche Conta gli animali), ma
passa dai moduli di quiz (`domandeDiUnEta`).

## Cosa il quadro non fa

- **Non decide niente**: chiama le stesse funzioni dei giochi
  (`giocoDaOffrire`, `doveCadeCon`). Un riassunto che diverge dal gioco è
  peggio di nessun riassunto.
- **Non dice cosa è cambiato.** I blocchi descrivono come stanno le cose, e
  il movimento si vede perché si muovono loro; una riga «＋ arriva La
  bancarella» sopra un elenco che dice già «c'è» è la stessa cosa detta due
  volte.
- **Parla in positivo** («queste le sa fare»): un elenco in negativo («non
  l'ha ancora fatto») obbliga a ricostruire per differenza tutto il resto. In
  positivo ci si ferma appena si legge qualcosa che il bambino non sa.

## Il rosso «va male»

Una riga che va male è l'unico rosso del quadro (`em.va-male`): gli altri
stati dicono *dove* sta una cosa, questo dice che qualcosa non funziona. La
soglia è quella delle «Difficili» nella settimana di «Come va» — almeno otto
risposte, meno di metà giuste — con lo stesso conto e le stesse parole
([../apprendimento/la-domanda.md](../apprendimento/la-domanda.md)).

**Il rosso risale fino alla testata del blocco** (`vannoMale` in
`src/data/quadro.js`, `allarme` di `Blocco.vue`): quello che va male è una
tipologia, che nel quadro compare solo al terzo livello, e sepolta sotto due
aperture non la trova nessuno. (Nasceva per l'avviso in posta, che non c'è
più: vedi [cestino-e-posta.md](cestino-e-posta.md).)

- Il blocco chiuso dice «1 va male» e scrive la strada («Le analogie › «Le
  analogie sulle cose del mondo» · ne ha sbagliate 8 su 10»).
- Il pezzo di scuola si colora anche quando va male **una sola** delle sue
  domande: la somma delle altre la coprirebbe. Il pezzo si nomina da solo
  solo quando vanno male le sue domande prese insieme e nessuna da sola.
- Una tipologia senza righe nel quadro (oltre il tetto dell'età) non si
  segnala lì: la tiene «Come va» ([come-va.md](come-va.md)), fra le
  «Difficili» della settimana.

Nei test: `[data-manopola] [data-apri="giochi"|"<gruppo>"]`,
`[data-domande="nessuna"]`, `[data-fascia-pesca="<gruppo>"]`,
`[data-riga="<chiave>"]`, `[data-prova="<chiave>"]`, `[data-va-male]` sulla
testata e `[data-male-frase]` sotto.
