# I progressi

Il livello del profilo, i traguardi e la pagina «I miei progressi»
(`src/store/progressi.js`, `data/traguardi.js`, `views/AlboView.vue`).

## Il livello

- **Un livello solo per tutto il profilo**, somma dell'esperienza di ogni
  gioco (`XP_AREA`, una funzione per area che legge i contatori di
  `totals`). **Non moltiplica più le monete**: lo faceva, e giocare a
  inglese faceva guadagnare di più anche alle torri — la stessa parola
  rendeva il triplo a chi aveva giocato di più altrove. Adesso ogni cosa
  fatta vale lo stesso per tutti
  ([../apprendimento/calibrazione.md](../apprendimento/calibrazione.md)).
  Ogni gioco ha poi un livello suo, che vive solo nella pagina dei
  progressi e non tocca il salvadanaio.
- **Togliere un gioco non abbassa il livello.** Il gioco che se ne va
  lascia la sua riga in `XP_AREA`, letta da contatori che nessuno fa più
  salire; quello che «Tuttofare» contava resta nel conto, perché una
  medaglia non torna indietro sotto gli occhi di chi l'ha presa.

### Lo sgombero della cameretta, come esempio

La cameretta è stata tolta coi suoi salvataggi (`sgomberaLaCameretta` in
`store/profile.js`), ed è il calco per togliere un gioco:

- prima di cancellare le collezioni se ne contano gli elementi in
  `totals`, e `XP_AREA.cameretta` li legge con la formula di prima;
  nessun rimborso in monete, nessun travaso altrove;
- le sue medaglie escono dall'albo senza portarsi via l'esperienza
  («Salvadanaio», che contava le monete di tutti i giochi, resta fra i
  trasversali);
- lo sgombero gira **a ogni caricamento**, non una volta sola: serve alle
  copie che arrivano da prima (il cestino, un salvataggio importato, una
  build vecchia aperta su un telefono), e su un profilo pulito non fa
  niente — i conti sono un `Math.max`.

`unita/profilo` prova le tre cose: le collezioni spariscono fino al disco,
il livello resta dov'era, un secondo passaggio non cambia i conti.

## I traguardi

- Stanno in `data/traguardi.js`, una riga ciascuno (i giochi nuovi li
  dichiarano nel manifesto: vedi [convenzione-giochi.md](convenzione-giochi.md)).
- Si misurano su grandezze che **salgono e basta** (risposte giuste, tappe
  superate, clienti serviti), quindi sono **retroattivi**: guardano il
  profilo, nessuno li segna mentre si gioca. La prima volta che un profilo
  li incontra, quelli già meritati si registrano in silenzio, senza monete
  né festa.
- Una grandezza nuova è un contatore in `totals`, incrementato con
  `segna('chiave')` o `segnaBest('chiave', valore)` per i primati; la
  festa la fanno scattare loro.

## La pagina «I miei progressi»

🏅 dalla home. Risponde a tre domande, in quest'ordine:

1. **Chi sono adesso** — il livello del profilo.
2. **Cosa so fare** — una barra per materia (tabelline, parole/verbi/frasi
   inglesi e spagnole, operazioni). Non è un contatore: è la forza
   *efficace* del motore di ripasso, quindi **scende** se non si ripassa.
   Da lì esce anche la difficoltà 1..5 che un gioco può usare
   (`difficoltaOra('mate')`) invece di ripartire da zero.
3. **Cosa ho vinto** — i traguardi, in bronzo, argento e oro.

I giorni di fila si contano appena si sceglie il giocatore: entrare è già
il gesto che conta. I record dei giochi senza fine stanno nella stessa
pagina: vedi [primati.md](primati.md).
