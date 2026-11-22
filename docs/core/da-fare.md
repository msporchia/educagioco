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

Dalla rassegna del 21/11 (i numeri in [tempi-dei-test.md](tempi-dei-test.md),
le regole in [test.md](test.md), «Cosa va nel browser, e cosa no»), in
ordine di secondi risparmiati:

- **Le misure dentro le unità**, che fanno il pavimento di `npm test`:
  `unita/sotterraneo` (le partite alle righe ~116–187 e ~227–259),
  `unita/sotterraneo-roba` («l'equilibrio, in piccolo» in fondo, i tiri
  dell'elisir, i cicli sui mercanti a cinque semi), `sotterraneo-zone`
  (le otto partite per livello), `sotterraneo-quest-modelli` (dodici semi),
  i semi di `passo-passo-sentiero`, `sotterraneo-abisso`, `saperi`. Vanno
  in `misure/` o scendono a un seme dove provano una regola e non una quota.
- **Le misure che rifanno un banco**: `misure/sotterraneo` e
  `sotterraneo-strade` (`npm run taratura`, `npm run sotterraneo`), la
  sezione 5 di `misure/survivors` (`strumenti/survivors-banco.mjs`). Le
  sezioni 1–4 di `misure/survivors`, `misure/asteroidi` e le due `*-isole`
  sono invece regole svelte: unità.
- **Regole provate passando dalla schermata**, da portare fra le unità:
  `sotterraneo-bottega-avanti`, `-luce`, `-mondo-tana`, `-pericolo`,
  `-pozioni`, `-rigenera`, la sezione 1 di `torri` (16.000 operazioni
  senza browser dentro un file del browser), `calcolo`, `campagna-mate`,
  le parti a numeri di `quadro`, `come-va`, `avviso-difficolta`.
- **File da fondere per preparazione**: nel sotterraneo lo scontro col
  cheat `sotterraneo=branco` (12 file), il mondo di sopra (~18), la bottega
  (9), la discesa a seme (12); i 14 `amici-<gioco>`; le 8 soste; i gemelli
  inglese/spagnolo (`-mondi`, `-sosta`, il libero) e `lingua-sosta`;
  `app` + `avvio` + `campagna-mate` + `calcolo`. `genitori`, `fattoria3d` e
  `sotterraneo-3d` sono invece da spezzare.
- **Partite giocate per arrivare a un punto**: `costruttore` e
  `passo-passo` giocano i livelli col dito alla velocità del robot
  (la soluzione è nei dati), `arena` e `giardino` rispondono a caso finché
  nasce la caserma, `salto-giochi` gira fino a 120 volte da mezzo secondo.
- **Controlli che non possono fallire**: 32 `controlla('…', true)`, 125
  `.catch` che ingoiano, il ramo 2D di `sotterraneo-sopra-barra` (cerca
  `.sot-velo-scontro`, che non esiste più: annota «il pannello non c'è» e
  passa), `integrazione/app` che stampa e basta.
- **Strumenti e non test**: `benchmark-veri`, `fps` (la misura),
  `torri-equilibrio`, `torri-figure`, `sotterraneo-3d-tempo`,
  `sotterraneo-sopra-barra`, le larghezze di `sotterraneo-3d`.
- **Le attese fisse**: 1.435 `attendi` scritti, 80 da un secondo e mezzo in
  su fra sotterraneo e fattoria; quasi tutte aspettano una telecamera che
  si ferma (`fermoNelMondo` c'è già).
- **Gli attrezzi copiati**: `tocca` via CDP in 38 file, `toccaIl` in 27,
  `entra` in 14: in `aiuto/browser.mjs` non ci sono.
- **Ballerino**: `integrazione/codice-segreto-sosta` è caduto una volta su
  sei su «torno a quella di prima riprende la tappa a metà».
- **Nella fattoria un tocco sul prato nell'istante dopo la ✕ di un foglio
  non conta** (a 700 ms sì): da guardare col dito se un bambino svelto lo
  sente.
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
