# Da fare

Le voci aperte che non sono di un gioco solo. Una voce chiusa esce da qui
(quello che è stato fatto lo racconta `git log`); quelle di un gioco
stanno nella sua cartella.

## Il codice

- **`settings.tables` non lo legge più nessuno.** È ancora nel profilo di
  partenza (`src/store/profile.js`, `settings: { tables: [2, 3, 4, 5], … }`)
  e nessun file di `src/` o `test/` lo usa. Si toglie la prossima volta che
  si tocca `profile.js`.
- **Il premio ridotto sul cartello di fine, gioco per gioco.** Le monete
  calano in un punto solo (`addCoins`), ma il cartello di fine lo sa dire
  solo chi paga con `incassa` (Survivors, Conta); gli altri mostrano
  ancora il premio pieno, e la frase giusta arriva dalla scritta piccola
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

- **`unita/survivors` in due file.** È il pavimento di `npm test` (22–25 s,
  quanto tutte le altre unità insieme), e 13 di quei secondi sono la
  sezione che gioca le nove tappe: in un file suo, otto alla volta,
  `npm test` scenderebbe verso i 13 s.
- **Un `--svelti` anche per l'integrazione** (proposta, da decidere): un
  `tempo:` nei file più cari e, dentro `integrazione/`, «fuori chi supera
  la soglia» invece di «sempre tutti fuori», così chi tocca una schermata
  leggera non paga i test che giocano campagne intere. Vedi
  [tempi-dei-test.md](tempi-dei-test.md).
- **Una guardia per i pittori**: un `unita/pittori` da pochi millisecondi
  che controlla solo che nessun pittore lanci mentre disegna (zero
  asserzioni sul contenuto). La tavola da guardare, se serve, è uno
  strumento, non un test.

## Da guardare col dito

Fatte e provate dai test, ma sono gesti: si giudicano toccandoli, dopo una
build, dal telefono (vedi [pubblicare.md](pubblicare.md)). **Giocarlo con
i bambini vale più di tutto il resto**: mezz'ora di prova trova quello che
nessun test prende.

- **La camminata della fattoria**: il cane che aggira la casa invece di
  attraversarla, e chi si accosta quando sulla meta non si può stare.
- **La mappa del Generale che si trascina mentre si mira**: sotto la soglia
  mira, sopra trascina; in mira la soglia è 16 px invece di 9
  (`SOGLIA_MIRA` in `views/generale/CampoLivello.vue`), perché mirare col
  dito trema.
- **Il sotterraneo**: il tocco che manda a camminare, il dito premuto che
  fa inseguire, il pizzico dello zoom, i mostri che vengono addosso, lo
  scontro come modale al centro con la scena ferma — e **quanto ci mette un
  incontro a capitare**, che pilotando da fuori non è mai successo in
  ~400 tocchi.
- **I 320 ms di finestra cieca** delle domande incatenate (`CIECA` in
  `quiz/Domanda.vue`): la differenza fra un tocco fantasma ingoiato e un
  tasto che sembra lento la dice solo un dito vero. Riguarda sotterraneo,
  Dungeon, Corsa e Survivors insieme.
