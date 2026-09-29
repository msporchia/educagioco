# Il cestino e la posta dei grandi

Due cose nate per lo stesso motivo: il gioco si regala a delle famiglie, e
dopo non c'è più nessun canale — niente server, niente posta, e chi lo riceve
da un'altra famiglia non lo conosce nessuno.

## Il cestino (`src/store/cestino.js`)

**Cancellare non è più per sempre.** Chi cancella per sbaglio non è il
bambino entrato di nascosto: è il grande stanco che conferma la carta rossa
alle undici di sera.

- **Prima di ogni gesto distruttivo** — azzerare i progressi di un bambino,
  eliminarlo, ricominciare una campagna — se ne mette da parte una copia
  (`cestina`), e in fondo a *Progressi* c'è il tasto per rimetterla.
- **Le ultime tre** (`QUANTE`): un profilo pesa decine di kilobyte, e sul
  ripiego in localStorage tenerne di più farebbe fallire la scrittura del
  profilo vero. Tre coprono il caso reale, che è accorgersene subito.
- **Sta fuori dai profili**, come il codice: dentro morirebbe con quello
  che si sta cancellando.
- **Rimettere non consuma la copia**: un ripristino sbagliato si annulla
  ripristinando quello giusto.
- **`ripristinaCestinato` rifà anche il roster** (`src/store/profile.js`):
  un profilo che nessuno nomina è un salvataggio invisibile.
- **«Rimetti da un file» passa di qui anche lei.** `importaTutto()`
  sovrascriveva senza chiedere: un file di un'altra famiglia con gli
  stessi id (`g1`, `g2`) — capita, perché gli id nascono `g1`, `g2`, …
  in tutte le case — schiacciava i bambini di casa senza che nessuno lo
  vedesse. Adesso `anteprimaImportazione(dati)` (pura, sincrona) dice
  PRIMA chi verrebbe sostituito — `{ id, nomeAttuale, nomeFile }` per
  ognuno, più `esportato` (la data del file, se ce l'ha) — e la
  schermata lo chiede solo se `sostituiti.length` è più di zero (un file
  su un telefono vuoto non sostituisce nessuno, non c'è niente da
  chiedere). Confermato, `importaTutto()` mette in cestino ogni profilo
  di casa che sta per sovrascrivere (`motivo: 'importazione'`) prima di
  scrivere sopra.
- **Una migrazione vecchia lascia una copia anche lei.** Quando
  `selectPlayer` trova un profilo con un `v` più vecchio di quello di
  oggi, lo mette in cestino (`motivo: 'migrazione'`) **prima** di
  toccarlo: se una migrazione avesse un guasto, l'originale non si perde
  con lei. Un profilo già alla versione di oggi non ripassa di qui: non
  c'è nessuna migrazione da cui proteggersi.

## La posta dei grandi (`src/guide/novita.js`, `src/store/posta.js`)

Il contenuto è dato puro in `novita.js`; `posta.js` tiene solo la memoria di
cosa si è letto, fuori dai profili.

- **Una nota si scrive solo se il genitore potrebbe voler fare qualcosa**:
  se non finisce con un tasto che porta da qualche parte, o non riguarda i
  salvataggi, non è una nota. Uno sprite nuovo non lo è.
- **Le note le decide il proprietario**, mai chi lavora al codice di sua
  iniziativa.
- **L'ack è un id, non una versione.** Si pubblica venti volte e diciannove
  non hanno niente da dire: legato alla versione il pallino sarebbe sempre
  acceso, e non lo guarderebbe più nessuno. Ricordando l'ultimo id letto,
  chi salta tre versioni trova le tre note perse. **Gli id non si riusano
  mai**, nemmeno ritirando una nota. Al primo avvio, **se in casa non c'è
  nessun profilo**, si parte dall'ultima: nessuno riceve la storia del
  progetto in faccia.
- **Fuori dal codice va solo il segnale, mai il contenuto.** Fuori non si
  distingue un grande da un bambino, e un cartello con la ✕ il bambino lo
  chiude per riflesso — chiudere *è* l'ack. Perciò un pallino sul tasto ⚙︎
  (non si chiude, non dice niente, sopravvive al bambino che ci sbatte
  sopra) e un nastro in home **senza ✕**: l'unica uscita è «Ho letto»,
  dentro, dietro il codice.
- **Il nastro parla al bambino**: è lui che guarda la home tutti i giorni.
  «C'è un messaggio per la mamma o il papà — chiamali»: gli si chiede di
  fare il corriere.
- **`riguarda: { etaDa, etaA }`** mostra una nota solo se in casa c'è un
  bambino di quell'età, per poter dire «tuo figlio» invece di «gli utenti».
  Senza nessuna età conosciuta la nota si mostra lo stesso: non sapere non
  è un motivo per nascondere. La scelta è pura (`scegli`, `test/unita/posta`).
- **Anche il gioco scrive avvisi** (`avvisa`, `avvisaUnaVolta`): il codice
  rimesso a `0000` ([codice.md](codice.md)). Quali avvisi «una volta sola»
  sono già stati detti si ricorda a parte e sopravvive al «Ho letto».
- **Il muro non scrive più.** Una domanda diventata un muro metteva un
  avviso qui, e arrivava spesso: quasi sempre quando la bambina non sapeva
  ancora una cosa, a un grande che non sapeva cosa farci. Adesso il gioco la
  alleggerisce da sé per una settimana
  ([../apprendimento/la-domanda.md](../apprendimento/la-domanda.md#il-muro-lo-sistema-il-gioco)),
  e il grande la trova, se va a guardare, fra le «Difficili» della settimana
  di «Come va» ([come-va.md](come-va.md)) con tre tasti che fanno qualcosa.
  Gli avvisi di muro già scritti restano finché qualcuno preme «Ho letto».

Il changelog per i bambini è un'altra cosa, con la regola opposta:
[novita-bambini.md](novita-bambini.md).

Nei test: `[data-posta-pallino]` sul tasto in home, `[data-nastro="posta"]`
con `[data-azione="nastro-posta"]`, `[data-posta]` nella schermata dei
grandi con `[data-azione="posta-vai"]` e `[data-azione="ho-letto"]`;
`[data-azione="rimetti-cestino"]` e `[data-azione="conferma-rimetti"]`;
`test/unita/cestino`, `test/unita/posta`.
