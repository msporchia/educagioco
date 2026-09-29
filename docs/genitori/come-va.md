# La schermata dei grandi e «Come va»

Le tre schede della schermata dei grandi (`src/views/GenitoriView.vue`), la
scheda che dice se le domande stanno funzionando, e il quaderno dei giudizi.

## Tre schede, e si tara in una sola

- **Bambini** — chi gioca, progressi, codice, guasti; dell'età solo una
  riga, «Leonardo ha 10 anni · modifica ›», che rimanda all'altra scheda.
- **Giochi e domande** — la manopola dell'età col quadro sotto
  ([manopola.md](manopola.md), [quadro.md](quadro.md)). È l'unico posto dove
  si tara: provati un elenco di classi con quattro tondi per riga e una fila
  di interruttori per gioco, dicevano la stessa cosa in modi non
  confrontabili, e il primo aveva una seconda tacca dell'età.
- **Come va** — sotto: le materie, la settimana, il tempo, le domande.

## «Come va»

`src/quiz/ComeVa.vue`, montato dalla schermata dei grandi con una riga sola
(gli passa il nome del bambino). Dall'alto: **le materie**, **la settimana**,
**quanto ha giocato**, **tutte le domande**.

Perché così: il proprietario l'ha detta «teoricamente ben fatta, ma nella
pratica poco intuitiva». Centoventi righe di domande, ordinate e oneste, non
rispondono alla domanda con cui un genitore entra — *come sta andando?* — e
l'avviso del muro in posta arrivava a chi non sapeva cosa farci. Adesso la
risposta corta sta in cima, in due forme che si leggono senza aprire niente,
e l'elenco lungo resta sotto per chi vuole i numeri.

### Le mattonelle (`quiz/Mattonelle.vue`)

Una per **materia**: quelle dei quiz (italiano, matematica, spazio e figure,
tempo e orologio, logica, scienze) **e** quelle che prima stavano solo
nell'albo del bambino (`MATERIE` di `store/progressi.js`: tabelline, calcolo
a mente, inglese, spagnolo, operazioni in colonna, euro e resto, misure…).
Ognuna dice **quanto è saputo** (percentuale e barra) e una **freccia** su,
giù o pari rispetto a due settimane fa.

- **Quanto è saputo è la forza del ripasso, non la percentuale di giuste**,
  la stessa misura dell'albo: per le materie dell'albo `abilita()` (quello
  che non si è mai visto conta zero), per quelle dei quiz la media di
  `saputo()` (`nucleo/bisogno.js`) sulle tipologie **che gli arrivano** —
  né quelle tolte per età né le spente. Quindi scende se non si ripassa.
- **Una lingua è una mattonella**: parole, verbi e frasi sono tre barre
  nell'albo, pesate sul loro totale qui (`INSIEME` in `quiz/comeva.js`).
- **La freccia** confronta con la fotografia più recente che abbia almeno
  dodici giorni (`DUE_SETTIMANE`): le fotografie sono settimanali e non
  cadono al minuto. Sotto tre punti (`SOGLIA_FRECCIA`) è «pari»: un punto o
  due li fa il decadimento, non una notizia. Senza una fotografia di allora
  la freccia non c'è.
- **Le materie mai giocate** non hanno una barra a zero: stanno in una riga
  sola, «Non ancora: …».
- **Toccata, si entra**, e il resto della pagina si toglie di mezzo: le
  tabelline aprono la tavola che c'è già negli asteroidi
  (`components/MappaTabelline.vue`); una materia dei quiz apre l'elenco di
  sempre filtrato su lei, dalla peggiore alla migliore; le altre dicono
  quante cose ha imparato su quante. **A mattonelle chiuse la tavola non si
  vede**: nel mock approvato era aperta, e sopra tutto il resto era un muro.

### La fotografia settimanale (`store/istantanee.js`)

La freccia e le «migliorate» vogliono uno storico, e nel profilo c'è solo il
conto di adesso. Quindi una fotografia a settimana (`OGNI`), **fuori dal
profilo** come le sessioni, in `istantanee:<id>`: le percentuali delle
materie e il conto `[ok, err]` di ogni tipologia con risposte. Se ne tengono
otto (`TENUTE`). La chiede `App.vue` entrando in un gioco e «Come va»
aprendosi (`fotografa` in `quiz/fotografia.js`), e **parte da quando c'è**:
nella prima settimana le migliorate dicono che il confronto arriva fra sette
giorni. Eliminare un bambino porta via le sue (`scordaIstantanee`).

### La settimana (`quiz/Settimana.vue`)

«La settimana di Melody»: i **minuti** giocati negli ultimi sette giorni (le
sessioni, lo stesso confine di mezzanotte di `TempoDiGioco.vue`), **quante
sono migliorate** e **quante difficili**, e i due elenchi corti.

- **Difficili**: le tipologie al muro, con la stessa soglia del rosso nel
  quadro (`quiz/consiglio.js`) e il numero, non un giudizio («ne ha
  sbagliate 7 su 10»). Se il gioco l'ha già alleggerita
  ([../apprendimento/la-domanda.md](../apprendimento/la-domanda.md#il-muro-lo-sistema-il-gioco))
  la riga lo dice, e fino a che giorno. Tre tasti:
  - **▶ Prova** — la palestra di sempre (`Prova.vue`);
  - **Più avanti di mezzo anno** — la ✎ di `components/eta/Taratura.vue`
    ([ritocchi.md](ritocchi.md)), aperta con lo scatto già fatto (`parte`):
    si vede dove va a finire, e si conferma. Confermando la riga lascia le
    difficili, perché il vecchio conto parla delle domande di prima;
  - **Va bene così** — la toglie dall'elenco e basta.
  Tutti e due scrivono un segno in `settings.vaBene[<tipologia>]` col conto
  di quel momento: la riga torna solo se arrivano **otto risposte nuove**
  che dicono ancora muro (`ancoraDifficile`).
- **Migliorate**: «da 4 a 9 su 10» — il conto della fotografia di una
  settimana fa (almeno sei giorni, `UNA_SETTIMANA`) contro le risposte date
  da allora. Almeno cinque risposte per parte (`PER_CONFRONTO`) e un salto
  di almeno due su dieci (`SALTO`), se no non è una cosa da raccontare.
  **Una migliorata non sta anche fra le difficili**: il conto intero di una
  cosa salita da 2 a 7 è ancora a metà, e dirla difficile e migliorata
  insieme non si capisce.
- I conti sono puri in `quiz/comeva.js` (`unita/settimana`), come quelli
  delle mattonelle.

### Tutte le domande

- **Tutte le tipologie**, ordinate dalla peggiore alla migliore: l'ordine è
  il contenuto. Provato mostrare solo i segnali (le righe fuori soglia):
  tre righe senza il resto non dicono se sono tre su dieci o tre su
  centoventi. Quelle mai capitate stanno ripiegate in fondo.
- **Cuori sulla percentuale di giuste** (cinque, `CUORI`), sbiaditi sotto
  le otto risposte: lì il verdetto non c'è.
- **Il punteggio è il tasto**: apre `src/quiz/SchedaDomanda.vue`, coi
  numeri (quante volte, quante giuste, quanto ci mette, l'ultima volta) e
  tre cose da fare: **▶ provala**, **✎ spostala** (la stessa `Taratura.vue`
  del quadro, [ritocchi.md](ritocchi.md)), **↻ ricomincia a contare**.
- Il conto per riga lo compone `src/quiz/andamento.js`, puro
  (`test/unita/andamento`).
- **`azzeraConto` butta il conto e non il ripasso** (`s` e `last` restano,
  in `src/store/profile.js`): dopo un ritocco il conto parla delle domande
  di prima e va buttato, mentre un ripasso azzerato rifarebbe uscire domani
  una cosa saputa ieri.

Il tempo di gioco (`src/components/TempoDiGioco.vue`) è in
[../core/sessioni.md](../core/sessioni.md).

## Il quaderno dei giudizi (`src/store/giudizi.js`)

Acceso l'interruttore nella schermata dei grandi, sopra ogni domanda di quiz
compaiono tre tastini: 😴 troppo facile, 😰 troppo difficile, 🐛 storta. Il
verdetto lo dà il grande, il contesto (modulo, grado, tipologia, tempo,
esito) se lo annota il gioco. Sta **fuori dai profili**, come il codice, ed
esce solo dal modulo di segnalazione precompilato. Serve perché una domanda
fuori misura è formalmente ineccepibile: nessun controllo automatico la
trova.

- **Il testo viaggia dentro l'indirizzo** del modulo Tally: ogni carattere
  strano ne costa fino a tre, quindi `riga()` è compatta, senza accenti né
  simboli, col verdetto per primo perché è quello che si scorre.
- **Sopra `TETTO_INVIO` (30) si mandano gli ultimi**, dicendo in testa
  quanti sono rimasti a casa: farsi troncare in silenzio da un limite del
  browser sarebbe peggio di un pacco corto ma completo.
- **Una voce nuova con lo stesso `id` sostituisce, non si accoda**: quell'id
  è una domanda comparsa una volta, e chi cambia idea sul verdetto non ne
  ha giudicate due.

Nei test: `[data-scheda="bambini"|"giochi"|"comeva"]` per le schede;
`[data-come-va]`, `[data-sommario]`, `[data-riga="<tipo>"]`,
`[data-voto="<tipo>"]`, `[data-altre]`; le materie `[data-mattonelle]`,
`[data-mattonella="<materia>"]` con `[data-pct]` e `[data-freccia="su"|"giu"|"pari"]`,
`[data-mattonelle-mai]`, dentro una materia `[data-materia-aperta="<materia>"]`,
`[data-parti]` e `[data-azione="materie-torna"]`; la settimana
`[data-settimana]`, `[data-settimana-minuti]`, `[data-settimana-attesa]`,
`[data-difficile="<tipo>"]` con `[data-alleggerita]` e
`[data-azione="settimana-prova"|"settimana-rimanda"|"settimana-va-bene"]`,
`[data-migliorata="<tipo>"]`; `test/unita/settimana`, `integrazione/come-va`; nella scheda di una domanda
`[data-scheda-domanda]` e `[data-scheda="prova"|"tara"|"azzera"|"azzera-no"|"azzera-si"]`;
l'interruttore dei giudizi `.carta[data-flag="giudizi"]`, e il quaderno
`[data-azione="giudizi"|"manda-giudizi"|"copia-giudizi"|"scorda-giudizi"]`.
