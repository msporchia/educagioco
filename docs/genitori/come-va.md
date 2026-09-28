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
- **Come va** — sotto.

## «Come va»

`src/quiz/ComeVa.vue`. In cima **quanto ha giocato** (`src/components/TempoDiGioco.vue`,
il registro delle sessioni è in
[../core/sessioni.md](../core/sessioni.md)), poi le domande.

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

L'avviso che arriva in posta quando una domanda è un muro, e la soglia che
colora le righe, sono in
[../apprendimento/la-domanda.md](../apprendimento/la-domanda.md): il tasto
dell'avviso porta qui, dove quella riga sta in cima.

## Il quaderno dei giudizi (`src/store/giudizi.js`)

Acceso l'interruttore nella schermata dei grandi, sopra ogni domanda di quiz
compaiono tre tastini: 😴 troppo facile, 😰 troppo difficile, 🐛 storta. Il
verdetto lo dà il grande, il contesto (modulo, grado, tipologia, tempo,
esito) se lo annota il gioco. Sta **fuori dai profili**, come il codice, ed
esce solo dal modulo di segnalazione precompilato. Serve perché una domanda
fuori misura è formalmente ineccepibile: nessun controllo automatico la
trova.

Nei test: `[data-scheda="bambini"|"giochi"|"comeva"]` per le schede;
`[data-come-va]`, `[data-sommario]`, `[data-riga="<tipo>"]`,
`[data-voto="<tipo>"]`, `[data-altre]`; nella scheda di una domanda
`[data-scheda-domanda]` e `[data-scheda="prova"|"tara"|"azzera"|"azzera-no"|"azzera-si"]`;
l'interruttore dei giudizi `.carta[data-flag="giudizi"]`, e il quaderno
`[data-azione="giudizi"|"manda-giudizi"|"copia-giudizi"|"scorda-giudizi"]`.
