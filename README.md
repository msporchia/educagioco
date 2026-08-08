# Educagioco

Giochi educativi per bambini delle elementari: inglese, spagnolo, matematica
in colonna, calcolo a mente, un tower defense che si paga facendo le
operazioni, un mercato dove si dà il resto, un laboratorio di pozioni, un
dungeon a carte, un gioco di programmazione a ordini.

**Sono giochi fatti per due bambini in particolare, i miei.** Non è un
portfolio e non è un prodotto: è roba di casa, messa qui perché possa
servire a qualcun altro. Se lo trovate utile, prendetelo pure.

## Provarlo in dieci secondi

Non serve installare niente e non serve un server. Il gioco è **un unico
file HTML** che si apre con doppio click:

```bash
npm ci
npm run build      # esce dist/index.html, ~3,7 MB, apribile offline
```

Dentro quel file c'è tutto: il codice, gli stili, le immagini disegnate a
canvas e le voci incise. Nessuna rete, nessun backend, nessun account. I
progressi restano nel browser di chi gioca (IndexedDB, con ripiego su
localStorage), e si portano via con un file JSON dalla schermata dei
genitori.

Sul telefono conviene invece installarlo come app da un indirizzo web:
così si aggiorna da solo e sta a schermo intero.

## Cosa c'è dentro

| | |
|---|---|
| **Asteroidi** | tabelline e calcolo a mente, a campagna |
| **English / Spagnolo** | parole, verbi e frasi, con la pronuncia incisa |
| **Difendi il Castello** | tower defense: ogni torre si paga con un'operazione in colonna |
| **La bancarella** | si vende, si incassa, si dà il resto |
| **Il laboratorio delle pozioni** | dosare, misurare, convertire |
| **Codice Segreto** | deduzione, tipo Mastermind |
| **Il Generale** | si comanda una squadretta a ordini: cicli, condizioni, eventi |
| **Il Dungeon / Survivors** | due giochi a carte, ancora in prova |
| **La cameretta** | dove finiscono le monete: animali da accudire, vestiti, sorprese |

Sopra ci sta un motore di ripetizione dilazionata (SM-2 addolcito) che
decide cosa richiedere e quando, uguale per tutte le materie, e un sistema
di livelli e traguardi condiviso.

Una schermata dei genitori, dietro un codice di quattro cifre, permette di
accendere e spegnere i singoli giochi, dire cosa il bambino a scuola non ha
ancora fatto (così non gli arrivano domande che può solo indovinare),
salvare e rimettere i progressi, e gestire chi gioca.

## Le scelte che spiegano il resto

- **Un file solo.** Il prodotto finale è `dist/index.html`, autonomo e
  offline. Da qui viene quasi tutto il resto: nessuna dipendenza a runtime
  oltre a Vue, effetti sonori sintetizzati invece che campionati, icone
  emoji invece che file, grafica disegnata a canvas con un motorino fatto in
  casa (Pixi o Konva peserebbero da 100 a 450 KB).
- **La pronuncia non usa `speechSynthesis`.** La voce del dispositivo è una
  lotteria — su Linux esce espeak, incomprensibile — e a un bambino una
  pronuncia sbagliata fa più danno del silenzio. Le clip sono incise a monte
  e concatenate in sprite. Sono due terzi del peso del file: è il prezzo di
  una pronuncia che non dipende dal telefono.
- **Il codice è in italiano.** Nomi, funzioni, commenti. È la lingua in cui
  ci ho pensato.
- **Chi gioca non disegna.** Una schermata costruisce la lista delle cose in
  scena e la passa al pittore; chi dipinge non sa cosa siano energia,
  prezzi e ondate.
- **L'equilibrio si misura, non si deduce.** Il tower defense ha il suo
  motore senza schermo, e un simulatore che gioca migliaia di partite per
  trovare quanta vita devono avere i nemici (`npm run tara`). Prima si
  tirava a indovinare, e una tappa poteva chiedere cinquanta operazioni.

## Le prove

```bash
npm test              # tutto: ricostruisce, poi unità e browser
npm run test:unita    # solo quelle senza browser, sono secondi
```

Sono 37 file. Quelle di unità fanno girare i motori veri senza schermo —
il tower defense giocato da un finto giocatore tappa per tappa, i livelli
del Generale risolti davvero, i moduli di quiz misurati anche sulla
*varietà*, perché un grado che produce venti domande diverse si impara a
memoria e vale zero. Quelle di integrazione aprono `dist/index.html` in
Chrome e giocano col dito.

## Una nota su come è stato scritto

**Gran parte di questo codice l'ha scritta Claude Code**, in un lungo
lavoro a quattro mani: io ho deciso cosa doveva fare, come doveva sentirsi
un bambino a giocarci e cosa era accettabile, lui ha scritto la maggior
parte delle righe e dei test. Lo scrivo qui perché è la prima cosa che uno
si chiede guardando un repo di questa taglia fatto da una persona sola, e
saperlo prima evita l'equivoco.

Si vede anche nello stile: molti commenti spiegano *perché* una cosa è
fatta così e cosa c'era prima. Sono la memoria del progetto, e in un lavoro
del genere valgono più del codice.

## Licenza

MIT — vedi [LICENSE](LICENSE). I giochi sono miei, ma se servono a un altro
bambino, tanto meglio.
