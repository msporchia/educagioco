# Le regole della corsa

I cancelli, la truppa, i mostri, il cancello d'oro, il ritmo e le stelle, coi
perché. Il codice sta in `src/giochi/corsa/`; il gioco è ancora dietro
«i giochi in prova» (`sperimentale: true` in `gioco.js`).

## I cancelli

- **I tre cancelli sono identici.** Provati verdi e rossi (verde chi
  moltiplica, rosso chi toglie): con due corsie rosse su tre non restava niente
  da calcolare, il colore rispondeva al posto del bambino. Quale conviene
  dipende da quanti soldati hai in quel momento. L'unico diverso è quello
  d'oro, che non dice quanto vale ma che lì ci si ferma.

## La truppa

- **Cinque verdi = un rosso, cinque rossi = un blu, cinque blu = un giallo, e
  ognuno spara quanto vale**: è il raggruppamento messo per terra, non un
  trucco per non disegnare seicento figure. Numero in cima e formazione in
  basso dicono sempre la stessa cosa, gruppo per gruppo.
- **Ogni tappa dichiara il tetto della truppa**, cioè quanti gradi si stanno
  imparando:

  | tappe | tetto | in terra |
  |:--|--:|:--|
  | 1–2 | 24 | verdi e rossi |
  | 3–5 | 124 | arriva il blu |
  | 6–9 | 624 | arriva il giallo |

  Senza tetto i cancelli portano la truppa a diecimila in un minuto, e «×3»
  diventa una scritta invece di una domanda.

## I mostri

- **Ogni tre cancelli una banda; la truppa spara mentre ci si avvicina** e
  stende esattamente un mostro grande quanto lei.
- **Il mostro non spara**: durante l'avvicinamento la truppa non cambia, scende
  solo la vita del mostro. All'impatto, se è ancora in piedi, la vita che gli
  resta si paga **moltiplicata per tre**. Provato il fuoco di risposta
  continuo: il numero della truppa cambiava sessanta volte al secondo, e un
  numero che lampeggia non si legge.
- **Il mostro si dimensiona su dove la truppa sarà**: i cancelli in volo sono
  già generati, quindi caso peggiore e migliore si calcolano davvero, e la vita
  sta poco sopra il peggiore. Chi sceglie male una volta arriva col fiato
  corto, chi sbaglia due volte di fila muore; il cartello dice chi ti ha
  fermato e con quanta vita gli era rimasta.
- **Ogni quarto scontro è un boss**: davanti a lui la corsa rallenta invece di
  fermarsi, e il tempo in più è tempo di fuoco.

## Il cancello d'oro: un'offerta, non un pedaggio

Vale `×5`, il premio più forte, e chiede di fermarsi e fare un esercizio (le
domande di tutti gli altri giochi, più toste tappa dopo tappa). Tre
condizioni, e togliendone una qualunque torna a essere una tassa:

1. **Si vede prima**: d'oro e col libro, da quaranta metri.
2. **Non è mai obbligatorio**: la campagna si finisce senza un esercizio, e il
   test lo verifica giocandola tappa per tappa.
3. **Sbagliare non toglie niente**: si è perso solo il tempo di provarci.

Finché la domanda è a schermo la corsa non avanza: leggere un esercizio
correndo è tirare a indovinare.

## Il ritmo

- **Un cancello ogni quattro-cinque secondi**, visibile da quaranta metri, cioè
  più di dieci secondi di preavviso. Un controllo rende rossa la campagna se
  una tappa scende sotto i quattro secondi fra un cancello e l'altro. Il
  prototipo correva al doppio: a sei anni leggere tre numeri e spostarsi
  richiede secondi.
- **La strada prende il 57% dello schermo** (il prototipo il 44%): il resto è
  spazio dove non succede niente, e i cancelli arrivano larghi un dito.
- **Si tiene premuto per correre più forte** — dito, mouse, spazio, freccia
  su; un tocco secco dà una spintarella oltre a cambiare corsia. Gli scontri
  finiscono identici: il danno si conta per metro, non per secondo.
- **Davanti a un cancello restano sempre almeno tre secondi**, qualunque cosa
  si faccia. Il limite è in **secondi e non in metri**: provato a frenare sotto
  i sedici metri, ma i cancelli distano diciassette-ventun metri e la spinta
  piena non arrivava mai.
- **Le righe di corsa ai lati si spengono** quando la spinta smette di
  lavorare, così si vede invece di premere senza capire perché.

## Fermarsi

- **Il ⏸ in cima ferma la corsa** senza conto alla rovescia, e il velo dice a
  che punto si era («mancano 240 m»). Il telefono posato la mette in pausa da
  sé, e al ritorno aspetta un tocco (la pausa comune:
  [../core/interfaccia.md](../core/interfaccia.md#la-pausa-una-sola)).
- **«Indietro» abbandona la gara**: la corsa non si salva a metà, la tappa si
  ricomincia da capo.

## Le stelle

- ⭐ arrivare in fondo; ⭐⭐ senza perdere uno scontro (un mostro si abbatte
  prima dell'impatto solo se la truppa è grossa); ⭐⭐⭐ aver preso il
  **cancello migliore** abbastanza spesso, dal 55% della prima tappa all'80%
  dell'ultima.
- **La terza premia il conto**: è l'unica misura che non dipende da com'è
  andata la corsa, e si prende anche perdendo. Il cartello la dice per esteso,
  «il cancello migliore 7 volte su 9».
- **Il cancello d'oro conta come scelta giusta anche se l'esercizio va
  male**, e chi tira dritto si confronta solo coi due cancelli normali: se no
  la stella punirebbe chi ha provato.

## Le monete

- **Si pagano quando succede la cosa, e basta** (`PAGA` in
  `src/data/paghe.js`): 🪙1 a **cancello migliore** preso (lo stesso
  conto della terza stella: leggere tre numeri e scegliere, un colpo
  d'occhio), 🪙3 a **libro indovinato** (una domanda vera, a corsa ferma).
  Anche perdendo, anche nella corsa infinita. Il cartello di fine dice il
  totale (`[data-monete-prese]`) e quanto ha tolto il salvadanaio
  (`[data-nota-monete]`).
- **Niente premio di tappa, niente monete in metri**: c'erano
  `premio × stelle` a tappa vinta, una moneta ogni sessanta metri nella
  infinita e i soldati oltre il tetto «che diventano monete». Nessuno dei
  tre pagava un esercizio; senza, una tappa rende circa due terzi di prima
  ([../apprendimento/calibrazione.md](../apprendimento/calibrazione.md)).

## La corsa infinita

Si apre finita la campagna: niente traguardo, il punteggio è quanto lontano si
arriva, **in metri**. Record, confronto («il tuo record è 312 m · ti sono
mancati 32 m», «il tuo primo risultato: 120 m»), ultime cinque corse e la
riga in *I miei record* sono di tutti i giochi senza fine:
[../core/primati.md](../core/primati.md).
