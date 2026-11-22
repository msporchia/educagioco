# Da fare

Le voci aperte che non sono di un gioco solo. Una voce chiusa esce da qui
(quello che è stato fatto lo racconta `git log`); quelle di un gioco
stanno nella sua cartella.

## Il codice

- **`settings.tables` non lo legge più nessuno.** È ancora nel profilo di
  partenza (`src/store/profile.js`, `settings: { tables: [2, 3, 4, 5], … }`)
  e nessun file di `src/` o `test/` lo usa. Si toglie la prossima volta che
  si tocca `profile.js`.
- **Il premio ridotto sul cartello dei giochi a livelli.** I giochi che
  fanno esercitare pagano tutti dalla `borsa` e il loro cartello dice il
  salvadanaio stanco; restano Passo passo, il Robot e il Codice
  Segreto, che pagano il livello risolto con `addCoins` e sul cartello
  dicono il premio pieno — la frase giusta arriva dalla scritta piccola
  sopra (vedi [../genitori/varieta.md](../genitori/varieta.md)).
- **Il cassetto dei concetti disegnati.** Per le parole che nessuna emoji
  dice (tempo, ora, minuto, settimana, mese, anno, le facce, i verbi) la
  regola è il testo senza icona (vedi [grafica.md](grafica.md)); il
  rimedio è disegnarle col pittore, lo stesso cassetto di «Prima e dopo».
  Il passo è spostare `src/giochi/prima-dopo/scena/persone.js` in
  `src/grafica/personaggi/` — un import, non una riscrittura. Da
  riguardare a schermo, se danno fastidio, le metafore lasciate apposta:
  `famiglia` 🏡, `amico` 🤝, `cantante` 🎤, `parco` 🎠, `gara` 🏁,
  `gioco` 🎮.

## Le prove

Dalla rassegna del 21/11 e dal riassetto del 22 (i numeri in
[tempi-dei-test.md](tempi-dei-test.md), le regole in [test.md](test.md),
«Cosa va nel browser, e cosa no»). Fatto: le misure fuori dalle unità, il
sotterraneo nel browser da 46 file a 14, gli amici da 14 a 1, le lingue
gemelle in un file per coppia, le partite giocate di robot, Passo passo,
Castle Battle, giardino e salto, le verifiche a mano. Resta:

- **Le attese fisse rimaste** (846 scritte, erano 1.435): quelle prima di
  un tocco sono quasi sempre una finestra cieca, e si aspettano col segno
  (`data-pronto`, [interfaccia.md](interfaccia.md)). Il segno manca ancora
  alla domanda d'inglese e di spagnolo, a Passo passo, alla cassetta del
  Robot e alle pagine del dialogo del sotterraneo (lì si contano 360 ms a
  pagina).
- **Partite ancora giocate per arrivare a un punto**: `lingue-sosta`
  (quattro tappe intere, due minuti), la partita libera del castello e il
  volo della rotta in `amici-mappe`, il resto di `passo-passo`.
- **File da spezzare**: `fattoria3d` (1.283 righe, tre minuti: è il più
  lungo del giro), `genitori` (1.228), e `scarico`, tre minuti di attese
  che sono la prova stessa.
- **Regole ancora provate dalla schermata**: `calcolo` e `campagna-mate`
  (la stessa mappa, da unire), le parti a numeri di `quadro`, `come-va`,
  `avviso-difficolta`; nel mondo di sopra i nomi della veduta e il conto
  del giro, che stanno dentro `viste/Mondo3d.vue` e non in una funzione.
- **Candidati a fondersi**, usciti scrivendo le righe `a parte perché:`
  (dove la riga dice «potrebbe stare in…»): `salto` in `salto-giochi`;
  `torri` e `torri-libere` in `torri-figure`; `asteroidi-hangar` e
  `calcolo` in `campagna-mate`; `costruttore-salvataggio` in
  `costruttore`; `arena-guida` in `arena`; `giochi-impostazioni`,
  `impostazioni-barra` e `nascita` attorno a `genitori`; le due `pausa-*`
  insieme; `sotterraneo-sopra-bacheca` e `sotterraneo-rotta` in
  `sotterraneo-sopra-missioni`; le due `misure/*-isole` in una.
- **Unità sopra gli otto secondi** lasciate com'erano: `sotterraneo-roba`
  (i giri dei banchi), `sotterraneo-taratura`, `-mostri-3d`, `-lockstep`.
- **Le pause** di `pausa-asteroidi` e `pausa-giochi` aspettano ancora a
  tempo; `domanda` tiene a mano la lista dei prefissi dei quiz per il
  banco dei grandi (per la partita non più).
- **`integrazione/amici` parla col servizio pubblicato**, e nel giro
  completo è scaduto una volta aspettando l'invito (da solo, subito dopo,
  verde): un rosso suo si rilancia prima di cercare un guasto.
- **Ballerino**: `lingue-mondi` aspetta otto secondi l'esito di una
  domanda del libro, e prima della fusione è scaduto una volta.
- **Gli attrezzi copiati**: `tocca` via CDP resta in 11 file (erano 38);
  c'è `ditoDi` in `aiuto/browser.mjs`.
- **Trovati giocando coi test, da guardare nel gioco**: cambiando bambino
  e ricaricando entro 350 ms `ultimo-giocatore` non si salva e si riapre
  quello di prima; nella fattoria un tocco sul prato nell'istante dopo la
  ✕ di un foglio non conta (a 700 ms sì).
- **Una guardia per i pittori**: un `unita/pittori` da pochi millisecondi
  che controlla solo che nessun pittore lanci mentre disegna (zero
  asserzioni sul contenuto). La tavola da guardare, se serve, è uno
  strumento, non un test.

## Da guardare col dito

Fatte e provate dai test, ma sono gesti: si giudicano toccandoli, dopo una
build, dal telefono (vedi [pubblicare.md](pubblicare.md)). **Giocarlo con
i bambini vale più di tutto il resto**: mezz'ora di prova trova quello che
nessun test prende.

- **Il sotterraneo**: il tocco che manda a camminare, il dito premuto che
  fa inseguire, il pizzico dello zoom, i mostri che vengono addosso, lo
  scontro come modale al centro con la scena ferma — e **quanto ci mette un
  incontro a capitare**, che pilotando da fuori non è mai successo in
  ~400 tocchi.
- **I 320 ms di finestra cieca** delle domande incatenate (`CIECA` in
  `quiz/Domanda.vue`): la differenza fra un tocco fantasma ingoiato e un
  tasto che sembra lento la dice solo un dito vero. Riguarda sotterraneo
  e Survivors insieme.
