# I saperi: cosa si dà per scontato

Un **sapere** è un pezzo di scuola (le divisioni, i solidi, l'orologio).
Spegnerlo toglie le domande che senza quel pezzo non si ragionano, in tutti
i giochi, e basta. L'elenco è `src/data/saperi.js`, il profilo è
`settings.sa`. Gli altri interruttori dei grandi (un gioco, i giochi in
prova, e perché non c'è un quarto) stanno in
[../genitori/interruttori.md](../genitori/interruttori.md).

## Le regole

- **Chi fa la domanda dichiara.** Un modulo di quiz lo dice tipologia per
  tipologia (`sa:` dentro `tipi`, o `saperi:` per grado nei moduli senza
  tipi); `saperi.js` ha solo i nomi grossi, con le parole per un genitore
  (`che`, `esempio`, `spegne`). Nessun elenco da tenere allineato a mano.
  **Il primo dei `sa` è il gruppo** sotto cui la domanda compare nel quadro:
  il più stretto ([../genitori/quadro.md](../genitori/quadro.md)).
- **Anche un gioco può dichiarare**, con `chiede:` nel manifesto
  (`data/giochi.js`): il castello chiede moltiplicazioni e divisioni senza
  passare da `src/quiz/`. Senza quella riga l'impostazione esisteva e non
  aveva nessuna schermata da cui toccarla. La dichiarazione è anche quello
  che dà al sapere una riga nel quadro dell'età.
- **`chiede` non è `serve`**: `serve` spegne la carta del gioco in home,
  `chiede` toglie solo delle domande.
- **I giochi degradano invece di sbarrare**: dentro un grado si pescano le
  tipologie accese; un grado che le perde tutte sparisce e il modulo scende
  al grado buono più vicino (verso il basso: una domanda più facile è
  sempre onesta); un modulo senza gradi esce dal mazzo. Il castello senza
  divisioni chiede moltiplicazioni più difficili.
- **Due specie di chiavi in `settings.sa`**: un gruppo di `saperi.js`
  (`solidi`) o una singola tipologia di un modulo (`geo:viste`). Per chi fa
  le domande sono la stessa cosa (`saperiSpenti` in `store/profile.js`,
  `Modulo.tipoSpento`). Le sottovoci le raccoglie dai `tipi`
  `src/quiz/saperi.js`, e un modulo nuovo le porta con sé.
- **Acceso è l'assenza**: si salvano solo le eccezioni
  (`{ misure: false }`), e riaccendere al difetto cancella la voce
  (`accendiSapere`). **Tranne chi nasce spento** (`difetto: false`: il
  congiuntivo, il passato remoto), dove i bambini che non l'hanno visto
  sono la maggioranza.
- **Due ragioni per spegnere**: la lacuna (il bambino non l'ha fatto) e
  isolare (vedere un tipo di domanda da solo). Per i gruppi di
  ragionamento (`materia: 'ragionamento'`) vale solo la seconda.
- **Non è una manopola di difficoltà**: una conversione a chi non sa cos'è
  un litro non è difficile, è muta.

## Il criterio: si spegne solo quello che non si insegna in una carta

Sta in testa a `src/data/partenze.js`, e **non è la difficoltà** né «a
scuola non l'ha ancora fatto». Una domanda su un concetto nuovo che sta in
una riga di spiegazione è una lezione (l'`aiuto`, vedi
[la-domanda.md](la-domanda.md)): resta accesa. Si spegne quello che in una
frase non si spiega — girare una figura a mente, i cubetti nascosti, le
viste dall'alto, il significato di un modo di dire. Il metro è il programma
della primaria, con due eccezioni: i gruppi di ragionamento, e quello che la
scuola non dà affatto (dove vive il pinguino arriva dai libri illustrati).

Quando un gruppo è troppo grosso si spegne **a sottovoci**: le viste
dall'alto sono di quinta, i nomi dei solidi di prima.

## Ogni fascia si pronuncia su tutto (`tiene:`)

Le fasce di `data/partenze.js` (vedi [eta-e-portata.md](eta-e-portata.md))
elencano in `saperi:` cosa spengono e in `tiene:` **perché il resto resta
acceso**, una riga di motivo per chiave. L'errore che si fa davvero è per
omissione — una riga mai scritta: `stima`, `solidi` e `spazio-mente` erano
rimasti accesi in terza senza che nessuno l'avesse deciso, e nessun test
poteva vederlo. I dettagli della ricerca per fascia sono in
[saperi-per-fascia.md](saperi-per-fascia.md).

Nei test: `unita/saperi` (una chiave citata e non elencata è un guasto; un
sapere che nessuno cita, né modulo né gioco, è rosso; prova il degrado con
quattrocento domande per combinazione e che una tipologia spenta non arrivi
più), `unita/partenze` (ogni chiave esiste, la scala è annidata, ogni fascia
ha un verdetto su ogni sapere).
